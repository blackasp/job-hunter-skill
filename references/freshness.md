# Freshness reference

## Date fields — strict separation

Each vacancy may carry up to four distinct date values. They are **never interchangeable**.

| Field | Meaning | Source | Required |
|---|---|---|---|
| `published_at` | When the employer posted the vacancy | Platform listing / API | No — may be unknown |
| `updated_at` | When the employer last edited / refreshed it | Platform API (if supported) | No |
| `discovered_at` | When Job Hunter first found this vacancy URL | Set by the collector at discovery time | Yes — always set |
| `verified_at` | When the page was last fetched and its status confirmed | Set at freshness-check time | No — only after a check |

**Rule: `discovered_at` is never used as a substitute for `published_at`.**
If `published_at` is unknown, it stays unknown — `discovered_at` must not be promoted into its place.

---

## Freshness statuses

`checkFreshness()` returns one of exactly four string values:

| Status | Meaning |
|---|---|
| `актуальна` | Vacancy is within age threshold, page available, not explicitly closed |
| `вероятно устарела` | Vacancy appears old or was last seen long ago, but closure is unconfirmed |
| `закрыта` | Employer explicitly marked the vacancy as closed / filled (confirmed from page) |
| `неизвестно` | Insufficient data to determine status (no dates, page unreachable with no prior signal) |

Page unavailability **alone** does not prove closure → status is `вероятно устарела`, not `закрыта`.

---

## `checkFreshness(vacancy, profile)` — canonical implementation

```js
window.checkFreshness = (vacancy, profile) => {
  const maxAge = (profile && profile.max_vacancy_age_days) || 30;

  // Helper: days between two Date objects (or parseable date strings)
  const daysBetween = (a, b) => {
    const msA = (a instanceof Date) ? a.getTime() : new Date(a).getTime();
    const msB = (b instanceof Date) ? b.getTime() : new Date(b).getTime();
    if (isNaN(msA) || isNaN(msB)) return null;
    return Math.floor(Math.abs(msB - msA) / 86400000);
  };

  const now = new Date();

  // 1. Explicit closure — highest priority
  if (vacancy.closed === true || vacancy.status === 'closed') {
    return { freshness: 'закрыта', reason: 'vacancy marked closed by employer' };
  }

  // 2. Page unavailable — inconclusive; do not conclude closed
  if (vacancy.page_available === false) {
    return { freshness: 'вероятно устарела', reason: 'page unavailable (closure unconfirmed)' };
  }

  // 3. Use the best available date for age calculation:
  //    published_at > updated_at > verified_at
  //    discovered_at is NEVER used as published_at
  const refDate = vacancy.published_at || vacancy.updated_at || vacancy.verified_at || null;

  if (!refDate) {
    // 4. No date at all — unknown
    return { freshness: 'неизвестно', reason: 'no date available (published_at, updated_at and verified_at all absent)' };
  }

  const age = daysBetween(refDate, now);
  if (age === null) {
    return { freshness: 'неизвестно', reason: 'date present but unparseable: ' + String(refDate) };
  }

  if (age <= maxAge) {
    const src = vacancy.published_at ? 'published_at'
              : vacancy.updated_at   ? 'updated_at'
              :                        'verified_at';
    return { freshness: 'актуальна', reason: `${age} days old (threshold ${maxAge}, source: ${src})` };
  }

  // 5. Too old — but can re-discovery freshen it?
  //    If discovered_at is later than published_at the vacancy was re-found, but its
  //    published_at age is still the authoritative signal — the vacancy is still old.
  return { freshness: 'вероятно устарела', reason: `${age} days old (threshold ${maxAge}, source: ${vacancy.published_at ? 'published_at' : vacancy.updated_at ? 'updated_at' : 'verified_at'})` };
};
```

---

## Integration with `filterFull`

Universal filter rule #2 in `references/filters.md` delegates to `checkFreshness()`:

```
Freshness — call checkFreshness(vacancy, profile); block if status is 'вероятно устарела'
or 'закрыта'. Pass if 'актуальна'. Keep and flag ⚠️ if 'неизвестно' (do not silently drop).
```

`checkFreshness` reads `max_vacancy_age_days` from the profile — this is the **single source** for the age threshold. The value must never be hardcoded elsewhere.

---

## Configuration

| Profile field | Used by | Default if absent |
|---|---|---|
| `max_vacancy_age_days` | `checkFreshness()` | 30 |

No new configuration fields are required. `max_vacancy_age_days` already exists in the profile.

---

## Known limitations

- If `published_at`, `updated_at` and `verified_at` are all absent, freshness is `неизвестно`; the vacancy is flagged but not silently dropped.
- Page unavailability could mean a temporary server error rather than vacancy removal — a single 404 is not treated as proof of closure.
- `updated_at` from hh.ru API reflects employer refresh (bumping the listing), not actual content change — the vacancy may be old even with a recent `updated_at`.
- Platforms that do not expose `published_at` (e.g. some Telegram channels) will frequently return `неизвестно` — this is correct and expected; `discovered_at` will not rescue them.

---

## ⛔ Agent 1.5 / Agent 2 — Freshness exit checklist

**`checkFreshness()` must be called before `filterFull()` for every vacancy where the freshness gate matters. The filter rule #2 delegates to it. Checklist:**

- [ ] `discovered_at` was set at collection time for every vacancy (never left null)
- [ ] `discovered_at` was NOT used as `published_at`
- [ ] `checkFreshness(vacancy, profile)` was called with the user's real profile (not a hardcoded object)
- [ ] Vacancies with status `неизвестно` are kept and flagged, not silently dropped
- [ ] Vacancies with status `закрыта` are removed (blocked_reason: 'freshness-closed')
- [ ] Vacancies with status `вероятно устарела` are removed (blocked_reason: 'freshness-stale')
- [ ] Every pending invitation and manual-apply item was checked with `checkPendingItemFreshness`; stale/unknown items are labelled ⚠️ in the report

---

## Pending invitations and manual-apply staleness

Invitations from employers (`invitations` in profile) and pending manual-apply items must carry a `received_date`. At the start of each run, check each pending item before including it in the report.

**Rule:** If `received_date` is absent, treat as `неизвестно` (possibly stale). Never silently suppress — show with ⚠️ and suggest verifying or removing.

```js
window.checkPendingItemFreshness = (item, profile) => {
  const maxAge = (profile && profile.max_vacancy_age_days) || 45;
  const ref = item.received_date || item.noted_date || null;
  if (!ref) {
    return { freshness: 'неизвестно', reason: 'дата не указана — возможно устарело' };
  }
  const age = Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
  if (isNaN(age)) {
    return { freshness: 'неизвестно', reason: 'дата не читается: ' + String(ref) };
  }
  if (age > maxAge) {
    return { freshness: 'вероятно устарело', reason: `${age} дней с момента получения (порог ${maxAge})` };
  }
  return { freshness: 'актуально', reason: `${age} дней` };
};
```

**Integration:** In `modes/report.md`, before listing pending invitations and manual-apply items, call `checkPendingItemFreshness` on each. Items with `вероятно устарело` or `неизвестно` are shown with ⚠️ and a note to verify or remove. Never suppress silently — the user decides.

**New profile format for invitations:**
```yaml
invitations:
  - id: "117465623"
    platform: hh
    company: Альфа-Банк
    received_date: "2026-09-15"
    status: pending
```
When reading the old plain-text format (`# Invitation received: ID (Company)`) without a date — treat as `неизвестно` for the first run and prompt the user to confirm or add the date.
