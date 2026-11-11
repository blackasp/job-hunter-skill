# Changelog

All notable changes to Job Hunter skill are documented here.

---

## [1.2.1] — 2026-11-11

### Changed
- **Autonomous sending is mandatory.** Everything that can be sent without the user is sent without the user: applications on every platform with a confirmed login (with a generated cover letter wherever there is a field) and messages to HR contacts in Telegram. The skill no longer asks to confirm the list. Only test tasks, steps a person must do (captcha, codes, payment), blocked clicks, platforms without a confirmed login and borderline filter results go to the manual list. New universal rule 12; `modes/apply.md` («Autonomous sending»), `modes/telegram.md`, `modes/report.md`.
- **Manual-review memory.** Vacancies the user marks in the report's manual-review table are stored in the profile (`manual_reviewed`) and never listed for manual review again.

---

## [1.2.0] — 2026-11-11

### Changed
- **Modular structure.** The single 1000+ line file is split into an entry file (`job-hunter-skill.md`: rules, settings model, map of modes), `modes/` (onboarding, daily-search, telegram, apply, report, creative) and `references/` (platforms, filters, run-journal, profile-template). Only what a task needs is loaded.
- **Universal rules separated from personal settings.** Personal blockers, geography (including the Russia-only filter), keywords, salary, freshness and similar values are read from the user's profile and are no longer hardcoded for everyone; a new user starts with no personal filters. Universal rules never depend on onboarding.
- **Merged the two diverged copies** of the skill (repository and installed): the repository version now also has all-pages search, TG messages to HR contacts, proxy-blocking fallback, and browser safety handling.
- **Cover letters** are 4–5 sentences (five parts, one sentence each).
- **Technology blockers** are matched only in the «Requirements» and «Responsibilities» blocks; industries, employers and geography stay full-text.
- **Confirmation before applying:** replaced in 1.2.1 by autonomous sending.
- **Pacing:** careful pacing is a fixed system rule for everyone from the first run (5–12 s per application, 45–90 s after every 5, 5–8 min after every 20, 4–8 s between result pages), not a setting; any captcha/429/block doubles it on that platform for 7 days.
- **Daily discovery cadence:** known Telegram channels are re-read every run; a full discovery (new channels and platforms) runs every `discovery_interval_days` (default 3).
- **hh.ru resume link** replaces the PDF path; it is sent to HR contacts instead of an attachment.

### Added
- **All result pages** are read newest first; the stop condition is the freshness threshold.
- **Telegram channel search and verification by posts** for any profession (`modes/telegram.md`), with exact dates from the public preview and explicit limits.
- **Run journal** (`references/run-journal.md`): step timings, pages and vacancies per platform, blocks, next full discovery.
- **Search-only mode** on platforms without a confirmed login and on newly found platforms.
- **Platforms:** JobRocket, HireHi and 20+ more across professions.
- **Onboarding questions:** exclusions split into technologies / global / roles, freshness for platforms and Telegram, discovery interval, cover-letter title exclusions, resume link.
- **Profile template** (`references/profile-template.md`) and a reminder to open a pull request when the profile structure changes.
- **Per-run salary question** when the profile has no salary floor.

### Not carried over
- The `dispatchEvent` workaround for click blocks (old «Bug 6»): a blocked click is handed to the user instead of being bypassed. Loading the `chrome-browser` skill before applying is kept.

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
