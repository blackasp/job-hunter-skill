---
name: "job-hunter"
description: "Universal job search automation skill. Triggers when the user wants to find a job, set up automated job search, get daily job reports, apply to vacancies automatically, or
update their resume for search purposes. Use this skill for ANY job-hunting task: initial setup, daily search runs, resume updates, platform onboarding, Telegram channel discovery, or reviewing and applying to found vacancies. Activate immediately when the user says anything like \"find me a job\", \"set up job search\", \"I'm looking for work\", \"run today's search\", \"update my resume\", or \"which jobs match my profile\"."
---

# Job Hunter

An automated, universal job search system. Works for any profession, any geography, any language. The user sets it up once â and gets daily reports with relevant vacancies, auto-applications where possible, and smart filtering aligned to their profile.

---

---

## How this skill is organised

This file holds what applies to every run: the rules, the settings model, and the map of modes. The detailed procedures are in separate files, so only what a task needs is loaded.

| The user wantsâ¦ | Load |
|---|---|
| to set up the search for the first time, or redo the setup | `modes/onboarding.md` (+ `references/platforms.md`) |
| a daily search run (Â«find me a jobÂ», Â«run today's searchÂ») | **`modes/orchestrator.md` first** â it dispatches the 4-agent pipeline (Search â Filter â Apply â Report). Each agent loads only its own file. Do NOT load all mode files at once into one context. |
| Telegram channels / vacancies | `modes/telegram.md` |
| Threads search (a mandatory source, searched before hh.ru) | `modes/threads.md` |
| applications, cover letters | `modes/apply.md` |
| the report | `modes/report.md` |
| grants, open calls, residencies, art fairs, galleries | `modes/creative.md` |
| to change a setting or see settings | Â«Managing personal settingsÂ» below |
| run history, when the last discovery was, timing | `references/run-journal.md` |

**Where the files are.** Next to this file (`modes/`, `references/`). If only this file is installed, read them from the repository `https://github.com/blackasp/job-hunter-skill` (branch `main`) with the GitHub file tool, before the task that needs them. If the repository cannot be reached, say so, run with what this file contains, and do not guess the missing procedure.

**GitHub auth in automated (cloud) sessions.** Scheduled tasks run in a cloud session without the desktop bridge. The GitHub MCP tool (`mcp__remote-devices__github__get_file_contents`) requires the device bridge and returns a device-auth code (e.g. EF90-F881) in cloud sessions â this is not a recoverable error mid-run. The correct approach: (1) **Cache mode files in memory** â at the end of every interactive session, store the current content of `modes/apply.md`, `modes/report.md`, `modes/daily-search.md`, and `references/filters.md` in memory at `/areas/job-hunter-skill-cache/apply.md`, `/areas/job-hunter-skill-cache/report.md`, etc. (2) **In automated runs, load from memory cache first** â before attempting GitHub. If the cache exists, use it and skip GitHub entirely. (3) If both GitHub and memory cache are unavailable, run with this SKILL.md alone, note which files were missing in the report, and never halt the run. The user must prime the cache by running the skill interactively at least once after any skill update.

## â ï¸ UNIVERSAL RULES (apply to ALL users, never override)

These rules apply regardless of the user's profile or onboarding status. They are about how the skill works, not about who is searching.

1. **Language: use the language the user chose in onboarding (`modes/onboarding.md`)** â all messages, reports, cover letters, error notes. No exceptions. For new users whose language is unknown, ask in both English and Russian (see `modes/onboarding.md`).
2. **Never mention salary in cover letters** â it leads to rejections. This is an absolute prohibition.
3. **All links must be clickable** â in documents use `[anchor text](https://full-url)` format. Never put bare URLs without hyperlink markup.
4. **All links must be verified** â after composing any document with vacancy links, verify EVERY link by navigating to it in the browser (or HEAD request). If a site returns ERR_CONNECTION_RESET, 404, or Â«ÐÐµ ÑÐ´Ð°ÐµÑÑÑ Ð¿Ð¾Ð»ÑÑÐ¸ÑÑ Ð´Ð¾ÑÑÑÐ¿Â» â remove that vacancy/line from the document entirely or mark clearly as Â«â ï¸ ÑÐ°Ð¹Ñ Ð½ÐµÐ´Ð¾ÑÑÑÐ¿ÐµÐ½Â». A document with unverified links is not complete.
5. **Cover letter â 5-part mandatory structure, 4â5 sentences in total** â see the Cover Letter Framework in `modes/apply.md`. No salary.
6. **Telegram vacancies â always include direct message link** â for EVERY vacancy found in a Telegram channel, include the direct link to the specific message in format `https://t.me/channelname/messageID`. Without this link the vacancy row is incomplete. Never report a TG vacancy without the direct message link. To get the link: on the public preview page `https://t.me/s/channelname` it is the `data-post` attribute of the message; in web.telegram.org right-click (or long-press) the post â Â«Copy linkÂ» â result: `https://t.me/channelname/NNN`. If the link cannot be obtained â do NOT include that vacancy in the report.
7. **Report format is locked** â the daily report structure defined in `modes/report.md` must not be changed without explicit user instruction.
8. **Apply personal filters strictly** â once a user has configured exclusion rules in their profile, apply them consistently to every vacancy, every run, without exception.

8a. **MANDATORY PRE-APPLICATION BODY SCAN (CRITICAL â never skip)** â Before sending ANY application, navigate to the full vacancy page and read the COMPLETE text (title + requirements + responsibilities + description). Check EVERY entry in `exclude_tech`, `exclude_industries`, `exclude_roles`, `exclude_employers`, `exclude_docs` against the ENTIRE body. If ANY blocker appears ANYWHERE in the full text â immediately SKIP this vacancy, do not apply. Checking only the title or the search snippet is a CRITICAL ERROR. Applications sent without a full body scan are invalid and damage the user's profile. This rule has ZERO exceptions.

8b. **SALARY AND HARD FILTERS ARE APPLIED AT COLLECTION / SEARCH STAGE â not after** â The salary floor (`salary_floor`) and geographic hard exclusions (`exclude_remote_rf`) are applied DURING the initial collection of vacancy candidates, before any list is built. A vacancy that does not meet these requirements must NEVER appear in the candidates list, even as a footnote or skipped item. Post-collection filtering is too late. Concretely: when calling `api.hh.ru/vacancies`, pass `salary=<salary_floor>&currency=<salary_currency>` and geography filters as API parameters; when scraping, discard vacancies below the salary floor before adding them to the candidate list.

8c. **RF-ONLY REMOTE EXCLUSION (hard filter, collection stage)** â Any vacancy stating Â«ÑÐ´Ð°Ð»ÑÐ½Ð½Ð°Ñ ÑÐ°Ð±Ð¾ÑÐ° Ð½Ð° ÑÐµÑÑÐ¸ÑÐ¾ÑÐ¸Ð¸ Ð Ð¤Â», Â«ÑÐ¾Ð»ÑÐºÐ¾ Ð Ð¤Â», Â«ÑÐ¾Ð»ÑÐºÐ¾ Ð´Ð»Ñ ÑÐµÐ·Ð¸Ð´ÐµÐ½ÑÐ¾Ð² Ð Ð¤Â», Â«ÑÑÐµÐ±ÑÐµÑÑÑ ÑÐµÐ³Ð¸ÑÑÑÐ°ÑÐ¸Ñ Ð² Ð Ð¤Â», or any equivalent wording that restricts the remote role to Russian territory only â is EXCLUDED at the collection stage. It must NEVER appear in any section of the report. This is a geography hard filter, same level as `salary_floor`. When in doubt whether a vacancy is RF-restricted, read the full text before including it.

9. **Search-only on platforms without a confirmed login** â on any platform where the user is not registered or logged in (including every newly discovered platform), only search and report matching vacancies. Never apply, never register or create accounts, never enter credentials. Such vacancies go to the report section Â«ÐÐ¾Ð²ÑÐµ Ð¿Ð»Ð°ÑÑÐ¾ÑÐ¼Ñ â ÑÐµÐ·ÑÐ»ÑÑÐ°ÑÑ Ð¿Ð¾Ð¸ÑÐºÐ°» with the status Â«Ð¢ÑÐµÐ±ÑÐµÑÑÑ ÑÐµÐ³Ð¸ÑÑÑÐ°ÑÐ¸ÑÂ».

10. **Merged-requirements rule** â where a universal rule and a personal setting seem to conflict, the universal rule wins for *how the skill works* (links, report format, no salary, search-only without login, fixed pacing), and the personal setting wins for *what is searched and excluded* (profession, geography, blockers, freshness). A personal setting can make behaviour stricter or slower; it can never switch off a universal rule.
11. **Fixed careful pacing** â application and page-request pacing follows `modes/apply.md` (Â«PacingÂ») for every user from the first run; it is a system rule, not a setting, and nothing in a profile can shorten it. A captcha, `blocked: true` or HTTP 429 stops the loop immediately.

12. **Autonomous sending** â everything that can be sent without the user is sent without the user: applications on every platform with a confirmed login (with a cover letter wherever there is a field for it) and messages to HR contacts in Telegram. The skill never asks to confirm the list. It hands a vacancy to the user only for a test task, a step only a person can do, a blocked click, a platform without a confirmed login, or a borderline filter result (`modes/apply.md`, Â«Autonomous sendingÂ»).

13. **All mandatory sources, every run** â every run checks every mandatory source (all platforms in the profile, Threads (searched first, `modes/threads.md`), ALL known Telegram channels from `telegram_channels` in the profile (never hardcode a subset), LinkedIn, plus the search for new platforms and channels on its cadence of `discovery_interval_days`, default 7): breadth sweep first, deep work after, round-robin between sources. One source with many results or unavailable never ends the run. Each source gets exactly one status â Ð¿ÑÐ¾Ð²ÐµÑÐµÐ½ / Ð½ÐµÐ´Ð¾ÑÑÑÐ¿ÐµÐ½ / Ð½Ðµ Ð¿Ð¾Ð´Ð´ÐµÑÐ¶Ð¸Ð²Ð°ÐµÑ Ð½ÑÐ¶Ð½ÑÐ¹ Ð¿Ð¾Ð¸ÑÐº / Ð½Ðµ Ð¿ÑÐ¾Ð²ÐµÑÐµÐ½ â with numbers or a concrete confirmed reason, written to the run journal as the run goes. Â«ÐÑÐµÐ¼Ñ Ð·Ð°ÐºÐ¾Ð½ÑÐ¸Ð»Ð¾ÑÑÂ» and similar excuses without a quoted tool or error limit are forbidden; Â«Ð¿ÑÐ¾Ð²ÐµÑÐµÐ½Â» is never written for a search that was not executed (`modes/daily-search.md`, Â«Mandatory sources and the source ledgerÂ»; `references/run-journal.md`).

   **Full pagination on ALL platforms** â never stop at the first page of search results. Paginate through ALL pages of results on EVERY platform until the oldest vacancy on the current page is older than `max_vacancy_age_days`. Only then stop. This applies to hh.ru, getmatch.ru, habr.com, geekjob.ru, jobtoo.ru, and every other platform. Fetching only page 1 is a critical error.

   **Telegram public channels â ALL channels, EVERY run, no exceptions**: ALWAYS check ALL channels listed in `telegram_channels` in the user's profile every single run. Never check a subset. Never skip a channel because "it was checked recently". The list is authoritative â check every entry. ALWAYS access via `https://t.me/s/[channelname]` â the public preview page, NO login required. Navigate to this URL in the browser and read the posts. `web.telegram.org` login is NOT required for public channels; the excuse Â«Telegram Ð½ÐµÐ´Ð¾ÑÑÑÐ¿ÐµÐ½ â Ð½ÐµÑ Ð°Ð²ÑÐ¾ÑÐ¸Ð·Ð°ÑÐ¸Ð¸Â» is NEVER valid for public channels. Procedure: `navigate("https://t.me/s/foranalysts")` â `get_page_text()` â parse posts for vacancies matching profile. Vacancy links: extract `data-post` attribute from each post element for the direct message URL `https://t.me/foranalysts/NNN`. If `t.me/s/` returns an error or captcha, mark as Â«Ð½ÐµÐ´Ð¾ÑÑÑÐ¿ÐµÐ½Â» with the specific error; never skip silently. Use the built-in browser (`mcp__remote-devices__Claude_Browser__*`) for Telegram â it runs on the user's computer and can access t.me without authentication.

14. **Browser first, no workarounds** â the first action of every run is a browser availability check. Fetch failures (ERR_CONNECTION_RESET, 403, timeout) switch to the browser immediately; the only fallback order is WebFetch â Chrome extension â built-in browser â unavailable. curl and other shell downloads are never a fallback.

15. **Resolve redirects before listing as manual** â open the response button, check for an existing response on the target platform, run full filters there, apply if possible; vacancies with an existing response are not listed; filtered ones go to the report with a reason.

16. **Multi-agent pipeline for daily runs** â a daily search run MUST use the 4-agent pipeline defined in `modes/orchestrator.md`. Loading all mode files into one context is prohibited: it exceeds the model's reliable attention span and causes rules from early sections to be forgotten by the time later steps execute. Each agent loads ONLY its own mode file.

17. **hh.ru relocation warning popup â always click "Still apply"** â When applying to an hh.ru vacancy from outside Russia, a dialog Â«ÐÑ Ð¾ÑÐºÐ»Ð¸ÐºÐ°ÐµÑÐµÑÑ Ð¸Ð· Ð´ÑÑÐ³Ð¾Ð³Ð¾ ÑÐµÐ³Ð¸Ð¾Ð½Ð°Â» / Â«You are applying from another countryÂ» may appear. This dialog has a button `data-qa="relocation-warning-confirm"` ("ÐÑÑ ÑÐ°Ð²Ð½Ð¾ Ð¾ÑÐºÐ»Ð¸ÐºÐ½ÑÑÑÑÑ" / "Still apply"). **Always click this button** â it is the only way to complete the application from abroad. If this button is NOT clicked, the application is NOT sent. Click it via `document.querySelector('[data-qa="relocation-warning-confirm"]').click()` after navigating to the response URL and waiting 3â4 seconds for the popup to appear. After clicking, verify "ÐÑ Ð¾ÑÐºÐ»Ð¸ÐºÐ½ÑÐ»Ð¸ÑÑ" / "You applied" appears on the page. This is a mandatory step, not an optional one. Never skip it, never ask the user to click it.

18. **hh.ru login verification** â Verify the user is logged in by checking: (1) cookies `hhtoken` and `hhuid` exist, AND (2) the page shows the application count / user dashboard element. If either check fails, the user is not logged in and login-required actions must be skipped (not silently attempted). Never infer login status from an API response alone.

> **Titles:** use the user's own `job_title` from the profile everywhere. A title listed in `cover_letter_title_exclusions` is never used for the user in cover letters or reports, even when a vacancy carries it (it may still be searched via `keywords`).

---

---

## â ï¸ PERSONAL SETTINGS (user-specific, stored in `/areas/job-hunter-profile.md`)

Personal settings are NOT universal defaults. They are configured by each user during onboarding and can be updated at any time. The following settings are personal and must NEVER be applied to new users who haven't configured them:

- **Profession / job title** â what roles to search for (e.g. ÑÐ¸ÑÑÐµÐ¼Ð½ÑÐ¹ Ð°Ð½Ð°Ð»Ð¸ÑÐ¸Ðº, frontend developer, copywriter)
- **Search keywords** â specific keywords for search queries
- **Geography restrictions** â which countries/regions to include or exclude (e.g. Â«exclude Russia-only remote vacanciesÂ», Â«only EUÂ», etc.)
- **Exclusion blockers** â technologies, industries, company types to exclude (e.g. 1Ð¡, banking software, government sector, blockchain)
- **Salary threshold** â minimum acceptable salary
- **Show vacancies with no salary listed** â yes/no
- **Experience level** â junior/mid/senior/lead
- **Remote/office/hybrid preference**
- **Work permit countries** â where user can legally work
- **English level**
- **Platform vacancy freshness** â how many days back vacancies on job platforms count (`max_vacancy_age_days`)
- **Cap on applications per source per run** â `max_applications_per_source_per_run` (optional, e.g. 30): limits how many applications are sent to each source in one run; the search of all sources is never limited, the leftover vacancies are postponed to the next run (`modes/daily-search.md`, Â«Run order rulesÂ»)
- **Full-discovery interval** â how often to search for new Telegram channels and platforms (`discovery_interval_days`, default 7)
- **Cover-letter title exclusions** â titles never used for the user in letters (`cover_letter_title_exclusions`)
- **Resume link** â `resume_url`, sent to HR contacts in Telegram messages
- **Threads search** â `threads_queries`, `threads_accounts`, `threads_last_checked_date`, `threads_first_run_days` (default 30), `threads_overlap_days` (default 3); soft filter: a post without a stated work format is kept (`modes/threads.md`)
- **Telegram vacancy freshness** â how many days back vacancies in Telegram channels count (`telegram_vacancy_max_age_days`)
- **Resume location**
- **Platform list** â which platforms to search
- **Telegram channels** â which channels to monitor

**If a user has NOT completed onboarding**, do NOT apply any defaults from another user's profile. Use neutral settings: show all vacancies that match the stated profession, without blocking anything by default. Run onboarding to collect the user's own preferences.

---

---

## Managing personal settings

Users can update their settings at any time by saying things like:
- Â«Ð´Ð¾Ð±Ð°Ð²Ñ Ð² Ð±Ð»Ð¾ÐºÐµÑÑ ÑÐ»Ð¾Ð²Ð¾ "1Ð¡"Â» / Â«block vacancies mentioning 1Ð¡Â»
- Â«Ð¸ÑÐºÐ»ÑÑÐ¸ Ð²Ð°ÐºÐ°Ð½ÑÐ¸Ð¸ Ð² Ð³Ð¾ÑÑÐµÐºÑÐ¾ÑÐµÂ» / Â«exclude government sectorÂ»
- Â«Ð¾Ð±Ð½Ð¾Ð²Ð¸ Ð¼Ð¾Ð¸ ÐºÐ»ÑÑÐµÐ²ÑÐµ ÑÐ»Ð¾Ð²Ð°Â» / Â«update my keywordsÂ»
- Â«ÑÐ±ÐµÑÐ¸ ÑÐ¸Ð»ÑÑÑ Ð¿Ð¾ Ð·Ð°ÑÐ¿Ð»Ð°ÑÐµÂ» / Â«remove salary filterÂ»
- Â«Ð¸Ð·Ð¼ÐµÐ½Ð¸ÑÑ Ð¼Ð¾Ñ Ð´Ð¾Ð»Ð¶Ð½Ð¾ÑÑÑ Ð½Ð° product managerÂ»
- Â«Ð¿Ð¾ÐºÐ°Ð¶Ð¸ Ð¼Ð¾Ð¸ ÑÐµÐºÑÑÐ¸Ðµ Ð½Ð°ÑÑÑÐ¾Ð¹ÐºÐ¸Â» / Â«show my current settingsÂ»

When the user updates a setting â apply the change immediately to the profile in memory and confirm what changed. Use the setting in all subsequent searches.

**Show settings command:** When the user asks to see their current settings, read `/areas/job-hunter-profile.md` and display the key settings in a clear summary:
```
Ð¢ÐµÐºÑÑÐ¸Ðµ Ð½Ð°ÑÑÑÐ¾Ð¹ÐºÐ¸ Ð¿Ð¾Ð¸ÑÐºÐ°:
- ÐÑÐ¾ÑÐµÑÑÐ¸Ñ: [job_title]
- ÐÐ»ÑÑÐµÐ²ÑÐµ ÑÐ»Ð¾Ð²Ð°: [keywords]
- ÐÐµÐ¾: [geo_preference]
- ÐÐ¿ÑÑ: [experience_level]
- Ð¤Ð¾ÑÐ¼Ð°Ñ ÑÐ°Ð±Ð¾ÑÑ: [work_format]
- ÐÐ°ÑÐ¿Ð»Ð°ÑÐ° Ð¾Ñ: [salary_floor] [currency] (Ð²Ð°ÐºÐ°Ð½ÑÐ¸Ð¸ Ð±ÐµÐ· Ð·Ð°ÑÐ¿Ð»Ð°ÑÑ: [show_no_salary])
- ÐÐ»Ð¾ÐºÐµÑÑ: [user_blockers]
- ÐÐµÐ¾-Ð¸ÑÐºÐ»ÑÑÐµÐ½Ð¸Ñ: [geo_exclusions]
- Ð Ð°Ð·ÑÐµÑÐµÐ½Ð¸Ðµ Ð½Ð° ÑÐ°Ð±Ð¾ÑÑ: [work_permit_countries]
- Ð£ÑÐ¾Ð²ÐµÐ½Ñ Ð°Ð½Ð³Ð»Ð¸Ð¹ÑÐºÐ¾Ð³Ð¾: [english_level]
- Ð¡Ð²ÐµÐ¶ÐµÑÑÑ Ð²Ð°ÐºÐ°Ð½ÑÐ¸Ð¹ Ð½Ð° Ð¿Ð»Ð°ÑÑÐ¾ÑÐ¼Ð°Ñ: [max_vacancy_age_days] Ð´Ð½.
- Ð¡Ð²ÐµÐ¶ÐµÑÑÑ Ð²Ð°ÐºÐ°Ð½ÑÐ¸Ð¹ Ð² Telegram: [telegram_vacancy_max_age_days] Ð´Ð½.
```

---

---

## Where the profile lives

- **The working copy** of the personal profile is the user's own memory file. If the session is attached to a Project, the working copy is the Project's copy (`/projects/<project-id>/areas/job-hunter-profile.md`): write there, read from there first. The account-level `/areas/job-hunter-profile.md` may hold an older copy; do not rely on it when the Project copy exists.
- **The template** `references/profile-template.md` in this repository is neutral (no personal values). It lists every field the skill reads.
- **Reminder (mandatory).** If, during a run or a settings change, the profile's *structure* changed in the user's memory (a field was added, renamed or removed) and `references/profile-template.md` in the repository does not have it, finish the run with this reminder: Â«Ð¡ÑÑÑÐºÑÑÑÐ° job-hunter-profile.md Ð¸Ð·Ð¼ÐµÐ½Ð¸Ð»Ð°ÑÑ (Ð¿Ð¾Ð»Ñ: â¦) â Ð½ÑÐ¶Ð½Ð¾ Ð·Ð°Ð»Ð¸ÑÑ pull request Ñ Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸ÐµÐ¼ ÑÐ°Ð±Ð»Ð¾Ð½Ð° references/profile-template.mdÂ». Never put personal values (salary, blockers, links, IDs) into the repository: it is public. Only field names and neutral examples go into the template.
- Personal settings are not shared between users by the skill itself. Each user's profile lives in that user's own account or project memory; the skill does not enforce separation between people who share one account.

---

## What is stored in memory

The profile file (see Â«Where the profile livesÂ»):
- `language`: chosen language (set in onboarding)
- `security_checked: true` (set after the security step completes)
- `job_title`: user's profession / job title
- `keywords`: search keywords list
- `geo_preference`: where user works from
- `geo_exclusions`: list of geographic restrictions to exclude (e.g. `["RU-only"]`)
- `geo_inclusions`: geographic restrictions to include (or "any")
- `work_format`: remote/office/hybrid
- `salary_floor`: minimum salary
- `salary_currency`: currency for salary threshold
- `show_no_salary`: whether to show vacancies without stated salary (yes/no)
- `max_vacancy_age_days`: freshness of vacancies on platforms, days (default 30)
- `threads_queries`, `threads_accounts`, `threads_last_checked_date`, `threads_first_run_days` (30), `threads_overlap_days` (3): Threads search (`modes/threads.md`)
- `telegram_vacancy_max_age_days`: freshness of Telegram vacancies and channels, days (default 30)
- `experience_years`: total years of experience
- `experience_level`: junior/mid/senior/lead
- `user_blockers_tech`: technologies/software that block a vacancy only when required (requirements/duties blocks)
- `user_blockers_global`: industries, employers, company types, formats blocked anywhere in the text
- `role_exclusions`: roles excluded by title
- `cover_letter_title_exclusions`: titles never used for the user in cover letters
- `discovery_interval_days`: days between full discovery runs (default 7); `last_full_discovery_date`
- `run_journal_url`: link to the run journal (see `references/run-journal.md`)
- `work_permit_countries`: list of countries where user can legally work without sponsorship
- `english_level`: user's English level (A1âC2)
- Resume: `resume_url` (link; also sent to HR contacts), hash of last version, extracted skills and stack
- Platform list with priorities and full domain lists for permissions
- `telegram_channels`: verified channels (name, link, specialization, date of last relevant vacancy, date checked)
- Application history: vacancy ID, company, role, date, status
- `last_run_date`: date of last daily run
- `creative_profile`: medium, career stage, geography, what to find, deadline horizon (`modes/creative.md`)

---

---

## Operating principles

Short list of rules that apply across modes. Detailed procedures are in the mode files.

- **New users start with no personal filters.** Every personal setting is empty until onboarding; never use another user's values as defaults.
- **Don't stop on minor errors.** One platform down â continue with the others, note it in the report. Wrap every fetch in try/catch; on error count it, wait 1 s, continue. Never abort the full run.
- **Permissions â once only.** The full domain list is collected at onboarding and added by the user in bulk. Never re-request.
- **Resume â live.** Check the hash on every run; if it changed, re-read and apply.
- **Cold start.** If the last run was more than 14 days ago, verify auth and channel activity before searching.
- **Notify on failure.** If a run is interrupted, send a push notification.
- **Browser state.** Verify in-browser state variables exist before the application loop; if lost, re-collect.
- **Readable text.** Comments and summaries â in the report and in messages to the user â are written as short paragraphs or lists (one item per platform, reason or step), never as one solid block of text; detail stays (`modes/report.md`, rule 10).
- **Follow the response to a logged-in platform.** If a vacancy found on one platform leads to another platform where the user is logged in, the skill goes there and applies itself (`modes/apply.md`, Â«Cross-platform applyÂ»).
- **Flag, never hide.** Vacancies needing a work permit the user lacks, or an English level above theirs, go to dedicated report sections.
- **Link verification is not optional.** CORS blocks `fetch()` for external sites â navigate in a browser tab. hh.ru and Hirify: verify via `fetch(url, {method:'HEAD'})` from their domain.
- **Run journal.** Every run writes its entry (`references/run-journal.md`); it is how the skill knows when the last full discovery was.
