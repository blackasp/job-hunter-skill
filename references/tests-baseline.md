# Job Hunter v2.1 — Test Suite & Baseline Results

**Date:** 2026-11-18  
**Implementation version:** v2.1 (Stage 4 — freshness + dedup + filter)  
**Runner:** `node references/tests.js`  
**Total tests:** 67 | **Pass:** 67/67

---

## How to run

```bash
node references/tests.js
```

No external dependencies. All filter, dedup and freshness functions are inlined from their
respective reference files. Requires Node.js 16+.

---

## Summary

| Metric | Value |
|--------|-------|
| Tests prepared | 67 |
| Runnable without infrastructure | 67 (100%) |
| Pass on current implementation | 67 |
| Fail on current implementation | 0 |
| Filter tests (T-01–T-52) | 52 |
| Dedup tests (T-53–T-59) | 7 |
| Freshness tests (T-60–T-67) | 8 |

---

## Test groups

### Filter tests (T-01–T-52)

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
| — | Nice-to-have section — no block (3 cases) | 3 | T-41, T-42, T-43 |
| — | Blocker in req AND nice-to-have | 1 | T-44 |
| — | No headings safe default | 1 | T-45 |
| — | No headings pass | 1 | T-46 |
| — | Only non-technical sections | 1 | T-47 |
| — | Global blocker in О компании | 1 | T-48 |
| — | Pass returns checks array | 1 | T-49 |
| — | Blocker Битрикс (Cyrillic) | 1 | T-50 |
| — | Желательно — no block | 1 | T-51 |
| — | Nice-to-have EN — no block | 1 | T-52 |

### Dedup tests (T-53–T-59)

| ID | Scenario |
|----|----------|
| T-53 | Two platforms, same vacancy — merge |
| T-54 | Canonical URL match |
| T-55 | seen_before from history |
| T-56 | Probable duplicate — same company, similar title |
| T-57 | Different cities — distinct vacancies |
| T-58 | Different companies — distinct vacancies |
| T-59 | No data loss after merge |

### Freshness tests (T-60–T-67)

| ID | Scenario |
|----|----------|
| T-60 | Fresh vacancy within threshold |
| T-61 | Old vacancy beyond threshold |
| T-62 | Unknown date — no published_at/updated_at/verified_at |
| T-63 | Re-discovery: discovered_at later but published_at still old |
| T-64 | updated_at after published_at — updated_at used if published_at absent |
| T-65 | Page unavailable — вероятно устарела (not закрыта) |
| T-66 | Explicit closure — закрыта |
| T-67 | discovered_at NEVER used as published_at |

---

## Bugs fixed in filter (v2.1)

### BUG-A: `резидентов РФ` not covered by RU-only regex (T-16)
**Fix:** `резидент[а-яё]*\s+РФ` — covers all case forms.

### BUG-B: `role_exclusions` unreachable when keyword-match failed first (T-22, T-23)
**Fix:** Moved `role_exclusions` to Pass 1 (before keyword-match).

### BUG-C: `intern/junior/trainee` checks unreachable for non-keyword titles (T-05, T-06, T-34)
**Fix:** Moved intern/junior/trainee checks to Pass 1 (before keyword-match).

### BUG-6: `requirementsBlock()` returning full text when only nice-to-have headings present
**Fix:** `return out.trim() || ''` — empty string when no requirements sections found.
Tests: T-41–T-52 (12 tests added in Stage 2).

---

## filterFull() execution order (current)

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

## Regression history

| Version | Filter | Dedup | Freshness | Total |
|---------|--------|-------|-----------|-------|
| v2.1 initial (before Stage 2) | 40/40 | — | — | 40 |
| v2.2 (Stage 2 — dedup) | 40/40 | 7/7 | — | 47 |
| v2.2 (Stage 2 — requirementsBlock T-41..52 added) | 52/52 | 7/7 | — | 59 |
| v2.1 final (Stage 4 — freshness) | 52/52 | 7/7 | 8/8 | **67/67** |

---

## Tests requiring additional infrastructure

None. All 67 tests run with functions inlined — no network, no database, no hh.ru API.

Potential future tests requiring infrastructure:
- **Agent 1 (search):** mock hh.ru API responses → test pagination, freshness stop, deduplication
- **Agent 3 (apply):** mock cover letter generation → test LLM prompt quality
- **Agent 4 (report):** mock full run output → test report format compliance
