# Job Hunter v2.1 — Test Suite & Baseline Results

**Date:** 2026-11-18  
**Implementation version:** v2.1 (bugs fixed)  
**Runner:** `node references/tests.js`  
**Total tests:** 40 | **Pass after fixes:** 40/40

---

## How to run

```bash
node references/tests.js
```

No external dependencies. All filter functions are inlined from `references/filters.md`. Requires Node.js 16+.

---

## Summary

| Metric | Value |
|--------|-------|
| Tests prepared | 40 |
| Runnable without infrastructure | 40 (100%) |
| Pass on v2.1 implementation | 40 |
| Fail on v2.1 implementation | 0 |
| Bugs fixed in v2.1 | 3 |
| Tests requiring extra infrastructure | 0 |

---

## Scenario coverage

| # | Scenario type | Tests | IDs |
|---|--------------|-------|-----|
| 1 | Normal passing vacancy | 1 | T-01 |
| 2 | Role mismatch | 2 | T-02, T-03 |
| 3 | Junior/intern in title | 3 | T-04, T-05, T-06 |
| 4 | probation employment type (hh.ru) | 1 | T-07 |
| 5 | Global blocker 1С (title + desc) | 2 | T-08, T-09 |
| 6 | Bug #1 — 1С wordRe boundary | 2 | T-10, T-11 |
| 7 | Tech blocker in requirements | 1 | T-12 |
| 8 | Tech blocker only in О компании | 1 | T-13 |
| 9 | RU-only geo filter — basic | 4 | T-14, T-15, T-16, T-17 |
| 10 | Bug #2 — RU-only regex variants | 4 | T-18, T-19, T-20, T-21 |
| 11 | role_exclusions (QA, DevOps) | 2 | T-22, T-23 |
| 12 | Global blocker SAP | 2 | T-24, T-35 |
| 13 | requirementsBlock fallback #1 (no headings) | 1 | T-25 |
| 14 | requirementsBlock fallback #2 (no counts headings) | 1 | T-26 |
| 15 | Keyword match — data analyst | 1 | T-27 |
| 16 | Keyword match — product analyst (EN) | 1 | T-28 |
| 17 | Junior/intern English title | 1 | T-29 |
| 18 | Null description | 1 | T-30 |
| 19 | Empty name | 1 | T-31 |
| 20 | Global blocker in О компании section | 1 | T-32 |
| — | Neutral RU mention (should pass) | 1 | T-33 |
| — | Trainee in EN title | 1 | T-34 |
| — | Tech blocker Битрикс | 1 | T-36 |
| — | English vacancy pass | 1 | T-37 |
| — | "аналитик" without qualifier | 1 | T-38 |
| — | Intern in desc, not title | 1 | T-39 |
| — | Tech blocker Oracle APEX | 1 | T-40 |

---

## Bugs fixed in v2.1

### BUG-A (fixed): `резидентов РФ` not covered by RU-only regex (T-16)

**Severity:** Medium  
**Root cause:** RU-only regex contained `резидентств[а-яё]*\s+РФ` which matched `резидентства/резидентству` but NOT `резидентов` (genitive plural).  
**Fix:** Changed to `резидент[а-яё]*\s+РФ` — covers all case forms (резидентов, резидента, резиденту, etc.)  
**Tests:** T-16 → `FAIL / 'RU-only'` ✓

---

### BUG-B (fixed): `role_exclusions` unreachable when keyword-match failed first (T-22, T-23)

**Severity:** Low  
**Root cause:** `role_exclusions` check ran after keyword-match. Vacancies like `QA аналитик` were rejected with `role-mismatch` instead of `role-excluded:QA`.  
**Impact:** Cosmetic in current form, but would become a real correctness bug if bare `аналитик` keyword were added.  
**Fix:** Moved `role_exclusions` to Pass 1 (before keyword-match).  
**Tests:** T-22 → `FAIL / 'role-excluded:QA'` ✓, T-23 → `FAIL / 'role-excluded:DevOps'` ✓

---

### BUG-C (fixed): `intern/junior/trainee` checks unreachable for non-keyword titles (T-05, T-06, T-34)

**Severity:** Low  
**Root cause:** intern/junior checks ran AFTER keyword-match. Titles like `Стажёр-аналитик`, `Младший аналитик`, `Trainee Analyst` were rejected with `role-mismatch` instead of `intern`/`junior`.  
**Fix:** Moved intern/junior/trainee checks to Pass 1 (before keyword-match).  
**Tests:** T-05 → `FAIL / 'intern'` ✓, T-06 → `FAIL / 'junior'` ✓, T-34 → `FAIL / 'junior'` ✓

---

### Additional fix: T-02 expected result updated

After BUG-B fix, `role_exclusions` now fire before keyword-match.  
`Frontend разработчик React` — `разработчик` is in `role_exclusions`, so now returns `role-excluded:разработчик` instead of `role-mismatch`.  
**Updated:** T-02 expected → `FAIL / 'role-excluded:разработчик'` ✓

---

## filterFull() — new execution order (v2.1)

```
Pass 1 (title-only hard stops, before keyword match):
  → probation-hh check
  → intern / стажёр / trainee check   [BUG-C fix]
  → role_exclusions check              [BUG-B fix]

Pass 2 (role match):
  → keyword/job_title match in title

Pass 3 (personal filters):
  → RU-only geo check (expanded regex)  [BUG-A fix]
  → user_blockers_global (full text)
  → user_blockers_tech (requirements block only)
```

---

## Tests requiring additional infrastructure

None. All 40 tests run with `filterFull()` inlined — no network, no database, no hh.ru API.

Potential future tests requiring infrastructure:
- **Agent 1 (search):** mock hh.ru API responses → test pagination, freshness stop, deduplication
- **Agent 3 (apply):** mock cover letter generation → test LLM prompt quality
- **Agent 4 (report):** mock full run output → test report format compliance
