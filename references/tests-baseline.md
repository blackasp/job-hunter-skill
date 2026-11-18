# Job Hunter v2.1 — Test Suite & Baseline Results

**Date:** 2026-11-18  
**Implementation version:** current (pre-v2.1 fixes)  
**Runner:** `node references/tests.js`  
**Total tests:** 40 | **Baseline pass:** 40/40

---

## How to run

```bash
node references/tests.js
```

No external dependencies. All filter functions are inlined from `references/filters.md`. Requires Node.js 16+.

---

## Baseline summary

| Metric | Value |
|--------|-------|
| Tests prepared | 40 |
| Runnable without infrastructure | 40 (100%) |
| Pass on current implementation | 40 |
| Fail on current implementation | 0 |
| Bugs exposed (real, not test errors) | 3 |
| Tests requiring extra infrastructure | 0 |

> **Note:** The baseline shows 40/40 because tests were written to reflect *current* behavior — including known bugs. Bug-exposing tests are marked with `[BUG]` or `[BASELINE]` in their notes and document the incorrect behavior. After v2.1 fixes, the expected results for those tests will change.

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

## Bugs discovered

### BUG-A: `резидентов РФ` not covered by RU-only regex (T-16)

**Severity:** Medium  
**Test:** T-16  
**Current behavior:** PASS (vacancy passes through)  
**Expected behavior:** FAIL with `RU-only`  
**Root cause:** RU-only regex contains `резидентств[а-яё]*\s+РФ` which matches `резидентства/резидентству` but NOT `резидентов` (genitive plural).  
**Fix needed:** Add `резидент[а-яё]*\s+РФ` or `для\s+резидент[а-яё]*\s+РФ` to the regex.  
**After fix:** T-16 expected result changes to `FAIL / 'RU-only'`.

---

### BUG-B: `role_exclusions` unreachable when keyword-match fails first (T-22, T-23)

**Severity:** Low (vacancies are still correctly rejected, just for wrong reason)  
**Tests:** T-22 (`QA аналитик`), T-23 (`DevOps/аналитик инфраструктуры`)  
**Current behavior:** `role-mismatch` (keywords not found in title)  
**Expected behavior:** `role-excluded:QA` / `role-excluded:DevOps`  
**Root cause:** `role_exclusions` check runs after keyword-match. If no keyword matches, the function returns `role-mismatch` before reaching `role_exclusions`. This means vacancies like `QA аналитик` are rejected, but the reason is wrong — it should be caught by exclusion, not by missing keyword.  
**Impact:** Mostly cosmetic in current form, but would become a real bug if keyword list expands (e.g., adding bare `аналитик` as a keyword — then QA аналитик would pass keyword check but exclusion must catch it).  
**Fix needed:** Move `role_exclusions` check before keyword-match, or add a separate pre-filter pass.  
**After fix:** T-22 expected → `FAIL / 'role-excluded:'`, T-23 → `FAIL / 'role-excluded:'`.

---

### BUG-C: `intern/junior/trainee` checks unreachable for non-keyword titles (T-05, T-06, T-34)

**Severity:** Low (same as BUG-B — still rejected, wrong reason)  
**Tests:** T-05 (`Стажёр-аналитик`), T-06 (`Младший аналитик`), T-34 (`Trainee Analyst`)  
**Current behavior:** `role-mismatch`  
**Expected behavior:** `intern` or `junior`  
**Root cause:** intern/junior checks run AFTER keyword-match. If the title contains stажёр/junior/trainee but keyword is not present, role-mismatch fires first.  
**Impact:** Same as BUG-B — cosmetic for now, could become real if keywords expand.  
**Fix needed:** Move intern/junior/trainee check before or alongside keyword-match.  
**After fix:** T-05 → `FAIL / 'intern'`, T-06 → `FAIL / 'junior'`, T-34 → `FAIL / 'junior'`.

---

## Tests that will change expected result after v2.1 fixes

| Test | Current expected | After fix expected | Reason |
|------|-----------------|-------------------|--------|
| T-05 | `FAIL / role-mismatch` | `FAIL / intern` | BUG-C fix |
| T-06 | `FAIL / role-mismatch` | `FAIL / junior` | BUG-C fix |
| T-16 | `PASS / ''` | `FAIL / RU-only` | BUG-A fix |
| T-22 | `FAIL / role-mismatch` | `FAIL / role-excluded:` | BUG-B fix |
| T-23 | `FAIL / role-mismatch` | `FAIL / role-excluded:` | BUG-B fix |
| T-34 | `FAIL / role-mismatch` | `FAIL / junior` | BUG-C fix |

---

## Tests requiring additional infrastructure

None. All 40 tests run with `filterFull()` inlined — no network, no database, no hh.ru API.

Potential future tests requiring infrastructure:
- **Agent 1 (search):** mock hh.ru API responses → test pagination, freshness stop, deduplication
- **Agent 3 (apply):** mock cover letter generation → test LLM prompt quality
- **Agent 4 (report):** mock full run output → test report format compliance
