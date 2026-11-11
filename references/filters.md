# Filtering and ranking reference

## Filtering and ranking

For each vacancy, apply filters in this order:

#### 5a. Universal filters (apply to ALL users)

1. **Role match** — does the vacancy title match the user's target profession (`job_title` + `keywords` from profile)?
2. **Freshness** — remove if older than `max_vacancy_age_days` from the profile (default 30 days if not set)
3. **Deduplication** — remove if same company + role already in history
4. **Work permit check** — if the vacancy explicitly requires authorization to work in a country where the user does NOT have a permit → flag in report with label ⚠️ Требуется разрешение на работу. Show in separate section.
5. **English level check** — if the vacancy explicitly requires C1, C2, or "native/fluent English" AND the user's English level is below that threshold → flag with label ⚠️ Требуется уровень [C1/native]. Show in separate section.

#### 5b. Personal filters (apply ONLY if configured in the user's profile)

Read from the profile; every filter applies only if its value is set and non-empty. Blockers are matched with **word boundaries**, case-insensitively.

| Profile field | Matched against | Meaning |
|---|---|---|
| `geo_exclusions` (e.g. `RU-only`) | full text (title + description) | geographic restrictions to exclude |
| `user_blockers_global` | full text | industries, employers, company types, formats excluded wherever they appear |
| `user_blockers_tech` | **only the «Требования» and «Обязанности» blocks** (see below) | technologies and software that disqualify a vacancy only when they are required or part of the duties |
| `role_exclusions` | title only | roles excluded by title |
| `salary_floor`, `show_no_salary` | compensation field | see the salary check in `modes/daily-search.md` |

**Scope rule for `user_blockers_tech`.** Split the description into blocks by headings:
- *Counts:* «Требования», «Ожидания», «Обязанности», «Задачи», «Чем предстоит заниматься», «Что нужно делать», «Requirements», «Responsibilities», «You will».
- *Does not count:* «Будет плюсом», «Желательно», «Nice to have», «Условия», «Мы предлагаем», «О компании», «Бонусы».
- **If no recognisable headings exist, treat the whole text as requirements** (the safe default: block).
- A technology mentioned only in a «does not count» block does not block the vacancy.
- If the term appears in a doubtful position (for example in a sentence about the company's products), do not block: put the vacancy in the report table «Требуют ручного отклика» with the reason «пограничный блокер: [term]».

`user_blockers` from older profiles (a single flat list) are treated as `user_blockers_global` until the user splits them.

#### Canonical filter function (the single implementation — do not duplicate its logic elsewhere)

```js
window.W = s => new RegExp('(^|[^а-яёa-z0-9])(?:' + s + ')([^а-яёa-z0-9]|$)', 'i');
const esc = k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = k => new RegExp('(^|[^а-яёa-z0-9])' + esc(k) + '([^а-яёa-z0-9]|$)', 'i');

// Keep only the blocks that count as requirements/duties; no headings found => whole text.
window.requirementsBlock = (desc) => {
  const text = (desc || '').replace(/\r/g, '');
  const head = /^\s*(требовани[яй]|ожидани[яй]|обязанности|задачи|чем\s+предстоит\s+заниматься|что\s+нужно\s+делать|requirements|responsibilities|you\s+will|what\s+you.ll\s+do|будет\s+плюсом|желательно|nice\s+to\s+have|условия|мы\s+предлагаем|о\s+компании|бонусы)[^\n]{0,40}:?\s*$/gim;
  const marks = [...text.matchAll(head)].map(m => ({ i: m.index, name: m[1].toLowerCase() }));
  if (!marks.length) return text;
  const counts = /^(требовани|ожидани|обязанност|задачи|чем|что\s+нужно|requirements|responsibilities|you|what)/;
  let out = '';
  marks.forEach((m, k) => { if (counts.test(m.name)) out += text.slice(m.i, marks[k + 1] ? marks[k + 1].i : text.length) + '\n'; });
  return out.trim() ? out : text;   // headings exist but none counts => do not hide anything
};

window.filterFull = (name, desc, vac, profile) => {
  if (vac && vac.employment?.id === 'probation') return { pass: false, reason: 'probation-hh' };

  const titleOnly = (name || '').replace(/\s+/g, ' ').trim();
  const full = (titleOnly + ' ' + (desc || '')).replace(/\s+/g, ' ');

  // Pass 1: title only (role match + seniority)
  const roles = (profile.keywords || []).concat(profile.job_title ? [profile.job_title] : []).map(esc).join('|');
  if (roles && !new RegExp(roles, 'i').test(titleOnly)) return { pass: false, reason: 'role-mismatch' };
  if (profile.experience_level && profile.experience_level !== 'junior') {
    if (/стажировк|стажер|стажёр|стажёром|ученик|ищем\s+стаж/i.test(titleOnly)) return { pass: false, reason: 'intern' };
    if (W('junior|intern|trainee|apprentice').test(titleOnly)) return { pass: false, reason: 'junior' };
    if (/младший\s+аналитик/i.test(titleOnly)) return { pass: false, reason: 'junior' };
  }
  for (const r of (profile.role_exclusions || [])) if (wordRe(r).test(titleOnly)) return { pass: false, reason: 'role-excluded:' + r };

  // Pass 2: personal filters
  if ((profile.geo_exclusions || []).some(g => /^ru-only$/i.test(g)) &&
      /удалённо\s+по\s+Росси|удаленно\s+по\s+Росси|удалённо\s+по\s+РФ|удаленно\s+по\s+РФ|на\s+территории\s+РФ|на\s+территории\s+России|работ[а-яё]*\s+в\s+РФ|только\s+в\s+РФ|только\s+в\s+России|резидентств[а-яё]*\s+РФ|только\s+для\s+граждан\s+РФ|только\s+граждан[а-яё]*\s+РФ/i.test(full))
    return { pass: false, reason: 'RU-only' };

  const globalB = profile.user_blockers_global || profile.user_blockers || [];
  for (const b of globalB) if (wordRe(b).test(full)) return { pass: false, reason: 'blocker-global:' + b };

  const req = requirementsBlock(desc);
  const reqFull = titleOnly + ' ' + req;
  for (const b of (profile.user_blockers_tech || [])) if (wordRe(b).test(reqFull)) return { pass: false, reason: 'blocker-tech:' + b };

  return { pass: true };
};
```

Initialise `filterFull` once at the top of each browser session, before the apply loop. The same function serves hh.ru and every other platform: pass title, description text, vacancy object and profile.

**False positives (resolved rule).** A technology blocker that appears only in a block that does not count (nice-to-have, conditions, about the company) does not block the vacancy. A global blocker (industry, employer, geo) always blocks, wherever it appears. Doubtful cases go to the manual-review table; they are never auto-applied.

#### Confirmed bugs and fixes

**Confirmed bug #1 (November 2026):** Applied to a vacancy with 1С in the description but not the title.
**Root cause:** Title-only filter missed it. Full-text filter didn't have the 1С check.
**Fix:** Always apply ALL blockers from the user profile to full text (title + description), not title alone.

**Confirmed bug #2 (November 2026):** Applied to ПИК vacancy with «удалённая работа на территории РФ» in description.
**Root cause:** RU-only regex was incomplete, missed softer phrasings.
**Fix:** Expanded RU-only regex to cover all geographic-restriction variants (see above).

After filtering — rank by relevance:
- Key skills match from resume
- Desired stack match
- Presence of "nice-to-haves" that are in the resume
- Salary level (when listed)

## Already reviewed by the user

Skip silently any vacancy listed in the profile's `manual_reviewed` (the user already handled it by hand and asked not to see it again): do not include it in «Требуют ручного отклика» or anywhere else, and do not count it as new.
