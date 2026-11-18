# Deduplication reference (v1.0, Stage 3)

## Why deduplication matters

The same vacancy often appears on multiple platforms (hh.ru, getmatch, habr, LinkedIn, Telegram channels) simultaneously, or the same posting is re-published with a new URL after some days. Without deduplication:
- The user sees the same position several times in the report.
- The apply loop may send multiple applications to the same employer.
- Filtering counts inflate, making the run look more productive than it is.

**Goal:** present each distinct job opportunity exactly once, merge all discovery metadata, and never silently discard a potentially unique vacancy.

---

## Deduplication approach

Deduplication runs **between Agent 1 (Search) and Agent 2 (Filter)** — after the full raw list is collected, before filtering. This keeps filtering logic clean and ensures the duplicate-check is consistent regardless of platform.

The function `dedupVacancies(raw, history)`:
1. Computes a fingerprint for each vacancy.
2. Compares fingerprints within the current batch and against `history` (previous runs).
3. Groups vacancies by confidence level.
4. Returns a merged list: one canonical entry per group, with all source metadata preserved.

---

## Confidence levels

| Level | Meaning | Action |
|---|---|---|
| **confident** | Same vacancy with certainty | Merge silently; keep all `seen_in` entries |
| **probable** | Likely the same vacancy, but not certain | Merge + set `dedup_flag: 'probable'`; show in report with ⚠️ «возможный дубль» |
| **distinct** | Different vacancies | Keep as separate entries |

**Conservative rule:** when confidence is insufficient, keep both entries and set `dedup_flag: 'probable'` on both. It is always better to show a possible duplicate than to silently drop a unique opportunity.

---

## Fingerprint signals

Each signal has a weight. The total score determines the confidence level.

| Signal | Weight | Notes |
|---|---|---|
| Exact `vacancy_id` match (same platform) | 100 | Certain duplicate — same record |
| Matching ATS/external URL (after normalisation) | 90 | Different platform, same actual posting |
| Matching canonical URL (scheme + host + path, no query params) | 80 | Re-posted with tracking params stripped |
| Exact `(company_norm, title_norm)` match | 60 | Same role at the same company |
| `company_norm` match + `title_norm` similarity ≥ 0.85 | 50 | Minor title rewording |
| `location_norm` match (when both non-null and non-empty) | +10 | Tiebreaker |
| `posted_date` within 7 days (when both present) | +5 | Same posting window |
| `salary_min` within 10 % (when both present) | +5 | Economic match |

**Thresholds:**
- Score ≥ 70 → **confident** duplicate
- Score 50–69 → **probable** duplicate
- Score < 50 → **distinct**

A `vacancy_id` exact match (score 100) is an instant confident duplicate regardless of everything else — the same record was fetched twice (pagination overlap, re-index, channel repost).

---

## Normalisation functions

```js
// Lowercase, collapse whitespace, strip punctuation — for text comparison
window.normText = s => (s || '').toLowerCase().replace(/[«»""''\-–—\/\\|]/g, ' ').replace(/\s+/g, ' ').trim();

// Company normaliser: strip legal form suffixes (ООО, АО, Inc, Ltd, GmbH, etc.)
window.normCompany = s => window.normText(s)
  .replace(/\b(ооо|оао|зао|пао|ао|нко|ип|inc\.?|ltd\.?|llc\.?|gmbh|s\.?a\.?|b\.?v\.?|corp\.?)\b/gi, '')
  .replace(/\s+/g, ' ').trim();

// URL normaliser: remove scheme, www., query string, trailing slash
window.normUrl = u => {
  if (!u) return '';
  try {
    const p = new URL(u.startsWith('http') ? u : 'https://' + u);
    return (p.hostname.replace(/^www\./, '') + p.pathname).replace(/\/$/, '').toLowerCase();
  } catch { return (u || '').toLowerCase().trim(); }
};

// Trigram similarity (0–1) — simple, no external deps
window.trigramSim = (a, b) => {
  if (!a || !b) return 0;
  const tri = s => { const t = new Set(); for (let i = 0; i < s.length - 2; i++) t.add(s.slice(i, i + 3)); return t; };
  const ta = tri(a), tb = tri(b);
  let inter = 0;
  ta.forEach(g => { if (tb.has(g)) inter++; });
  return (2 * inter) / (ta.size + tb.size || 1);
};
```

---

## Canonical dedup function

```js
// vacancyFingerprint — compute numeric score between two vacancy objects.
// Returns { score, signals[] } where signals is a human-readable audit trail.
window.vacancyFingerprint = (a, b) => {
  const signals = [];
  let score = 0;

  // --- Hard match: same vacancy_id on same platform ---
  if (a.id && b.id && a.id === b.id) {
    return { score: 100, signals: ['exact-id'] };
  }

  const normA_url = window.normUrl(a.url);
  const normB_url = window.normUrl(b.url);

  // --- ATS/external URL match ---
  if (normA_url && normB_url && normA_url === normB_url) {
    signals.push('exact-url');
    score += 90;
  } else if (normA_url && normB_url) {
    // Strip query params for canonical URL comparison
    const canon = u => u.split('?')[0];
    if (canon(normA_url) === canon(normB_url)) {
      signals.push('canonical-url');
      score += 80;
    }
  }

  // --- Company + title match ---
  const compA = window.normCompany(a.company);
  const compB = window.normCompany(b.company);
  const titleA = window.normText(a.title);
  const titleB = window.normText(b.title);

  if (compA && compB && compA === compB) {
    if (titleA && titleB && titleA === titleB) {
      signals.push('exact-company-title');
      score += 60;
    } else if (titleA && titleB) {
      const sim = window.trigramSim(titleA, titleB);
      if (sim >= 0.85) {
        signals.push('company-match+title-sim:' + sim.toFixed(2));
        score += 50;
      }
    }
  }

  // If score is still 0 at this point, the vacancies are distinct.
  if (score === 0) return { score: 0, signals: ['distinct'] };

  // --- Tiebreakers (additive only when base score > 0) ---
  if (a.location && b.location) {
    const locA = window.normText(a.location);
    const locB = window.normText(b.location);
    if (locA && locB && locA === locB) { signals.push('location-match'); score += 10; }
  }

  if (a.posted_date && b.posted_date) {
    const diff = Math.abs(new Date(a.posted_date) - new Date(b.posted_date)) / 86400000;
    if (diff <= 7) { signals.push('date-within-7d'); score += 5; }
  }

  if (a.salary_min != null && b.salary_min != null && a.salary_min > 0 && b.salary_min > 0) {
    const ratio = Math.abs(a.salary_min - b.salary_min) / Math.max(a.salary_min, b.salary_min);
    if (ratio <= 0.1) { signals.push('salary-match'); score += 5; }
  }

  return { score, signals };
};

// mergeVacancies — merge two vacancy objects; canonical is the first one found.
// NEVER overwrites original data of either entry; accumulates all source info.
window.mergeVacancies = (canonical, duplicate) => {
  const seen_in = [...(canonical.seen_in || [{ platform: canonical.platform, url: canonical.url, id: canonical.id, posted_date: canonical.posted_date, source_channel: canonical.source_channel || null, tg_message_link: canonical.tg_message_link || null }])];
  seen_in.push({
    platform: duplicate.platform,
    url: duplicate.url,
    id: duplicate.id,
    posted_date: duplicate.posted_date,
    source_channel: duplicate.source_channel || null,
    tg_message_link: duplicate.tg_message_link || null
  });

  // Keep the earliest posted_date (the original publication)
  const dates = seen_in.map(s => s.posted_date).filter(Boolean).sort();
  const earliest_date = dates[0] || canonical.posted_date;

  return {
    ...canonical,
    seen_in,
    posted_date: earliest_date,
    dedup_confidence: 'confident',
    dedup_flag: null
  };
};

// dedupVacancies — full deduplication pass.
// raw: raw_vacancies[] from Agent 1
// history: array of { id, url, company, title } from previous runs (profile history),
//          or [] if no history is available
// Returns deduplicated_vacancies[]: merged list with dedup metadata
window.dedupVacancies = (raw, history) => {
  const result = [];    // canonical entries
  const usedIdx = new Set();

  for (let i = 0; i < raw.length; i++) {
    if (usedIdx.has(i)) continue;

    let canonical = { ...raw[i] };
    // Initialise seen_in if not already set
    if (!canonical.seen_in) {
      canonical.seen_in = [{
        platform: canonical.platform,
        url: canonical.url,
        id: canonical.id,
        posted_date: canonical.posted_date,
        source_channel: canonical.source_channel || null,
        tg_message_link: canonical.tg_message_link || null
      }];
    }

    for (let j = i + 1; j < raw.length; j++) {
      if (usedIdx.has(j)) continue;
      const fp = window.vacancyFingerprint(canonical, raw[j]);
      if (fp.score >= 70) {
        // Confident duplicate: merge silently
        canonical = window.mergeVacancies(canonical, raw[j]);
        usedIdx.add(j);
      } else if (fp.score >= 50) {
        // Probable duplicate: merge but flag
        canonical = window.mergeVacancies(canonical, raw[j]);
        canonical.dedup_confidence = 'probable';
        canonical.dedup_flag = 'probable';
        canonical.dedup_signals = fp.signals;
        usedIdx.add(j);
      }
      // score < 50 → distinct, leave raw[j] for its own iteration
    }

    // Check against history (previous runs): only mark, never remove
    for (const h of (history || [])) {
      const fp = window.vacancyFingerprint(canonical, h);
      if (fp.score >= 70) {
        canonical.seen_before = true;
        canonical.seen_before_id = h.id;
        break;
      }
    }

    result.push(canonical);
  }

  return result;
};
```

---

## Data fields added by deduplication

After `dedupVacancies()` runs, each entry in the output may have these additional fields:

| Field | Type | Meaning |
|---|---|---|
| `seen_in` | `{platform, url, id, posted_date, source_channel?, tg_message_link?}[]` | All sources where this vacancy was found (1+ entries) |
| `dedup_confidence` | `'confident' \| 'probable' \| null` | Set when merged; null for singletons |
| `dedup_flag` | `'probable' \| null` | Non-null only for probable duplicates — show ⚠️ in report |
| `dedup_signals` | `string[]` | Human-readable list of matching signals (for probable only) |
| `seen_before` | `boolean` | True if this vacancy was seen in a previous run |
| `seen_before_id` | `string` | The `id` from history it matched against |

**None of the original fields are overwritten.** `dedup_*` and `seen_in` are additive only.

---

## Report behaviour

### Confident duplicates (silent merge)
- Appear as one row in the report.
- The `seen_in` array shows all platforms where the vacancy was found, e.g. «найдена на: hh.ru, getmatch, t.me/foranalysts».
- No special mark in the report — the user just sees one row with richer source info.

### Probable duplicates
- Appear as one row with ⚠️ «возможный дубль» label.
- The `dedup_signals` are shown in the «Требуют ручного отклика» table as `manual_reason: 'вероятный дубль: [signals]'`.
- The user decides whether they are truly the same vacancy.

### Already-seen vacancies
- `seen_before: true` vacancies are shown in the report with a 👁 label (already seen) but are **not** moved to «Заблокированы».
- The user decides whether to apply again (changed posting, role re-opened, etc.).
- They are NEVER silently suppressed — the user must see them.

---

## What deduplication does NOT do

- **Does not determine the original source (Source Resolver)** — `seen_in[0]` is simply the first entry found in this run, not necessarily the original publication. Source resolution is a separate future task.
- **Does not resolve employer identity** — `normCompany()` strips legal suffixes but cannot distinguish between subsidiaries or brands of the same parent company. A SAP Systems AG and SAP SE posting may not merge if the company names differ significantly.
- **Does not handle near-duplicate descriptions** — description similarity is not a signal in this version. Only title, company, URL, location, date, and salary are used. Description-based detection would require NLP and is out of scope.
- **Does not modify `filterFull()` logic** — deduplication is a pre-filter step; the filter function is unchanged.

---

## Confirmed limitations

1. **Company name aliasing** — "Яндекс" and "Yandex" normalise differently; both would pass as distinct vacancies. A company alias table is a future enhancement.
2. **Telegram reposts** — a vacancy posted in multiple TG channels with identical text but different `tg_message_link` will be merged only if the same URL is embedded in the post. If no URL is present, they appear as probable duplicates at best (title+company match).
3. **History format** — `history` is passed as a flat array of `{id, url, company, title}` objects. The profile's `application_history` must be normalised to this shape before calling `dedupVacancies`.
4. **No fuzzy description matching** — a vacancy reposted with a rewritten description but the same company+title+location will be caught as a confident duplicate by the company+title signal. A completely rewritten title at the same company might only reach the probable threshold.

---

## Initialisation

Call `dedupVacancies` once after Agent 1 returns `raw_vacancies[]`:

```js
// Load history from profile (shape: [{id, url, company, title}])
const history = (profile.application_history || []).map(h => ({
  id: h.vacancy_id || h.id || '',
  url: h.url || '',
  company: h.company || '',
  title: h.title || ''
}));

const deduped = window.dedupVacancies(raw_vacancies, history);
// Pass deduped to Agent 2 (Filter) instead of raw_vacancies
```

---

## ⛔ Agent 1.5 (Dedup) — Exit checklist

**Agent 1.5 may not pass `deduped_vacancies[]` to Agent 2 until ALL of the following are true:**

- [ ] `dedupVacancies()` was called on the FULL `raw_vacancies[]` — no item was skipped
- [ ] History was loaded from the profile's `application_history` (empty array is acceptable if no history)
- [ ] Every merged entry has `seen_in[]` with at least 2 entries
- [ ] Every probable-duplicate entry has `dedup_flag: 'probable'` and non-empty `dedup_signals`
- [ ] No vacancy was silently dropped — `deduped.length >= (raw.length - confident_merges)`
- [ ] `deduped_vacancies[]` count delta (raw vs deduped) was logged to in-session context for the report

Deduplication summary must be logged: total raw, confident merges, probable flags, already-seen count.
