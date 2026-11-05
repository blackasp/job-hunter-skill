# Changelog

All notable changes to Job Hunter skill are documented here.

---

## [1.1.0] — 2026-11-05

### Added
- **MANDATORY RULES section** at the very top of the skill — 7 non-overridable rules applied to every run, every document, every cover letter:
  1. Language: always the user's chosen language
  2. Never call the user "business analyst" — only the title they set in their profile
  3. Never mention salary in cover letters
  4. Remote-RU: always exclude if user doesn't live in Russia
  5. All links must be clickable — `[anchor text](https://full-url)` format
  6. All links must be verified in browser before publishing the report
  7. Cover letter — mandatory 5-part structure, 7–10 sentences total
- **Claude Docs report (Step 7)** — daily report now created as a Claude Docs document instead of an HTML artifact; structured sections: hh.ru auto-applications → Hirify TG messages → Hirify manual → Hirify blocked/Plus → New platforms → Manual actions
- **Onboarding questions 11–12** — `work_permit_countries` and `english_level` added to Phase 1
- **Step 2b on every run** — new platform discovery via web search now runs on every daily run, not only weekly
- **Work permit check in Step 5** — vacancies requiring work permit go to a separate report section (not silently filtered)
- **English level check in Step 5** — vacancies requiring C1/C2/native when user's level is lower go to a separate section

### Fixed
- **Bug 1** — `employment.id === 'probation'` check now runs before regex filters, not after
- **Bug 2** — `__checkSalaryPage()` is now mandatory before every `__apply()`, including resumed loops; cache from `__newCandidates` must never be used for salary check
- **Bug 3** — `__confirmedApplied` now stores full objects `{id, title, company, url}` so the report can render links
- **Bug 4** — `has_test` check now runs before `__apply()`, not after; vacancies with test tasks are added to `__testAssignments` and skipped
- **Bug 5** — cover letter now strictly follows the 5-part structure; salary and "business analyst" label are absolutely prohibited
- **filterFull two-pass** — all exclusion filters (including 1С) now check the full text (title + description), not title only

---

## [1.0.0] — 2026-10-01

### Added
- Initial release
- Phase 0: Security check + language selection
- Phase 1: Onboarding with full profile setup
- Phase 2: Platform onboarding + Telegram channel discovery
- Phase 3: Daily search run with hh.ru, LinkedIn, Telegram, niche boards
- Phase 4: Resume update flow
- Phase 5: Weekly source expansion
- Phase 6: Creative opportunities (open calls, residencies, art fairs, galleries)
- Two-pass filterFull function
- hh.ru field mapping for HH-Lux-InitialState
- Cover Letter Framework
- Bug fixes: probation check, salary page check, confirmedApplied tracking, test task detection
