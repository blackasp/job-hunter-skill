---
name: "job-hunter"
description: "Universal job search automation skill. Triggers when the user wants to find a job, set up automated job search, get daily job reports, apply to vacancies automatically, or update their resume for search purposes. Use this skill for ANY job-hunting task: initial setup, daily search runs, resume updates, platform onboarding, Telegram channel discovery, or reviewing and applying to found vacancies. Activate immediately when the user says anything like \"find me a job\", \"set up job search\", \"I'm looking for work\", \"run today's search\", \"update my resume\", or \"which jobs match my profile\"."
---

# Job Hunter

An automated, universal job search system. Works for any profession, any geography, any language. The user sets it up once — and gets daily reports with relevant vacancies, auto-applications where possible, and smart filtering aligned to their profile.

---

---

## How this skill is organised

This file holds what applies to every run: the rules, the settings model, and the map of modes. The detailed procedures are in separate files, so only what a task needs is loaded.

| The user wants… | Load |
|---|---|
| to set up the search for the first time, or redo the setup | `modes/onboarding.md` (+ `references/platforms.md`) |
| a daily search run («find me a job», «run today's search») | `modes/daily-search.md` (source ledger), `references/run-journal.md`, `references/filters.md`, then `modes/apply.md` and `modes/report.md` |
| Telegram channels / vacancies | `modes/telegram.md` |
| applications, cover letters | `modes/apply.md` |
| the report | `modes/report.md` |
| grants, open calls, residencies, art fairs, galleries | `modes/creative.md` |
| to change a setting or see settings | «Managing personal settings» below |
| run history, when the last discovery was, timing | `references/run-journal.md` |

**Where the files are.** Next to this file (`modes/`, `references/`). If only this file is installed, read them from the repository `https://github.com/blackasp/job-hunter-skill` (branch `main`) with the GitHub file tool, before the task that needs them. If the repository cannot be reached, say so, run with what this file contains, and do not guess the missing procedure.

## ⚠️ UNIVERSAL RULES (apply to ALL users, never override)

These rules apply regardless of the user's profile or onboarding status. They are about how the skill works, not about who is searching.

1. **Language: use the language the user chose in onboarding (`modes/onboarding.md`)** — all messages, reports, cover letters, error notes. No exceptions. For new users whose language is unknown, ask in both English and Russian (see `modes/onboarding.md`).
2. **Never mention salary in cover letters** — it leads to rejections. This is an absolute prohibition.
3. **All links must be clickable** — in documents use `[anchor text](https://full-url)` format. Never put bare URLs without hyperlink markup.
4. **All links must be verified** — after composing any document with vacancy links, verify EVERY link by navigating to it in the browser (or HEAD request). If a site returns ERR_CONNECTION_RESET, 404, or «Не удается получить доступ» — remove that vacancy/line from the document entirely or mark clearly as «⚠️ сайт недоступен». A document with unverified links is not complete.
5. **Cover letter — 5-part mandatory structure, 4–5 sentences in total** — see the Cover Letter Framework in `modes/apply.md`. No salary.
6. **Telegram vacancies — always include direct message link** — for EVERY vacancy found in a Telegram channel, include the direct link to the specific message in format `https://t.me/channelname/messageID`. Without this link the vacancy row is incomplete. Never report a TG vacancy without the direct message link. To get the link: on the public preview page `https://t.me/s/channelname` it is the `data-post` attribute of the message; in web.telegram.org right-click (or long-press) the post → «Copy link» → result: `https://t.me/channelname/NNN`. If the link cannot be obtained — do NOT include that vacancy in the report.
7. **Report format is locked** — the daily report structure defined in `modes/report.md` must not be changed without explicit user instruction.
8. **Apply personal filters strictly** — once a user has configured exclusion rules in their profile, apply them consistently to every vacancy, every run, without exception.
9. **Search-only on platforms without a confirmed login** — on any platform where the user is not registered or logged in (including every newly discovered platform), only search and report matching vacancies. Never apply, never register or create accounts, never enter credentials. Such vacancies go to the report section «Новые платформы — результаты поиска» with the status «Требуется регистрация».

10. **Merged-requirements rule** — where a universal rule and a personal setting seem to conflict, the universal rule wins for *how the skill works* (links, report format, no salary, search-only without login, fixed pacing), and the personal setting wins for *what is searched and excluded* (profession, geography, blockers, freshness). A personal setting can make behaviour stricter or slower; it can never switch off a universal rule.
11. **Fixed careful pacing** — application and page-request pacing follows `modes/apply.md` («Pacing») for every user from the first run; it is a system rule, not a setting, and nothing in a profile can shorten it. A captcha, `blocked: true` or HTTP 429 stops the loop immediately.

12. **Autonomous sending** — everything that can be sent without the user is sent without the user: applications on every platform with a confirmed login (with a cover letter wherever there is a field for it) and messages to HR contacts in Telegram. The skill never asks to confirm the list. It hands a vacancy to the user only for a test task, a step only a person can do, a blocked click, a platform without a confirmed login, or a borderline filter result (`modes/apply.md`, «Autonomous sending»).

13. **All mandatory sources, every run** — every run checks every mandatory source (all platforms in the profile, all known Telegram channels, LinkedIn, plus the search for new platforms and channels on its cadence of `discovery_interval_days`, default 7): breadth sweep first, deep work after, round-robin between sources. One source with many results or unavailable never ends the run. Each source gets exactly one status — проверен / недоступен / не поддерживает нужный поиск / не проверен — with numbers or a concrete confirmed reason, written to the run journal as the run goes. «Время закончилось» and similar excuses without a quoted tool or error limit are forbidden; «проверен» is never written for a search that was not executed (`modes/daily-search.md`, «Mandatory sources and the source ledger»; `references/run-journal.md`).

> **Titles:** use the user's own `job_title` from the profile everywhere. A title listed in `cover_letter_title_exclusions` is never used for the user in cover letters or reports, even when a vacancy carries it (it may still be searched via `keywords`).

---

---

## ⚠️ PERSONAL SETTINGS (user-specific, stored in `/areas/job-hunter-profile.md`)

Personal settings are NOT universal defaults. They are configured by each user during onboarding and can be updated at any time. The following settings are personal and must NEVER be applied to new users who haven't configured them:

- **Profession / job title** — what roles to search for (e.g. системный аналитик, frontend developer, copywriter)
- **Search keywords** — specific keywords for search queries
- **Geography restrictions** — which countries/regions to include or exclude (e.g. «exclude Russia-only remote vacancies», «only EU», etc.)
- **Exclusion blockers** — technologies, industries, company types to exclude (e.g. 1С, banking software, government sector, blockchain)
- **Salary threshold** — minimum acceptable salary
- **Show vacancies with no salary listed** — yes/no
- **Experience level** — junior/mid/senior/lead
- **Remote/office/hybrid preference**
- **Work permit countries** — where user can legally work
- **English level**
- **Platform vacancy freshness** — how many days back vacancies on job platforms count (`max_vacancy_age_days`)
- **Cap on applications per source per run** — `max_applications_per_source_per_run` (optional, e.g. 30): limits how many applications are sent to each source in one run; the search of all sources is never limited, the leftover vacancies are postponed to the next run (`modes/daily-search.md`, «Run order rules»)
- **Full-discovery interval** — how often to search for new Telegram channels and platforms (`discovery_interval_days`, default 7)
- **Cover-letter title exclusions** — titles never used for the user in letters (`cover_letter_title_exclusions`)
- **Resume link** — `resume_url`, sent to HR contacts in Telegram messages
- **Telegram vacancy freshness** — how many days back vacancies in Telegram channels count (`telegram_vacancy_max_age_days`)
- **Resume location**
- **Platform list** — which platforms to search
- **Telegram channels** — which channels to monitor

**If a user has NOT completed onboarding**, do NOT apply any defaults from another user's profile. Use neutral settings: show all vacancies that match the stated profession, without blocking anything by default. Run onboarding to collect the user's own preferences.

---

---

## Managing personal settings

Users can update their settings at any time by saying things like:
- «добавь в блокеры слово "1С"» / «block vacancies mentioning 1С»
- «исключи вакансии в госсекторе» / «exclude government sector»
- «обнови мои ключевые слова» / «update my keywords»
- «убери фильтр по зарплате» / «remove salary filter»
- «изменить мою должность на product manager»
- «покажи мои текущие настройки» / «show my current settings»

When the user updates a setting — apply the change immediately to the profile in memory and confirm what changed. Use the setting in all subsequent searches.

**Show settings command:** When the user asks to see their current settings, read `/areas/job-hunter-profile.md` and display the key settings in a clear summary:
```
Текущие настройки поиска:
- Профессия: [job_title]
- Ключевые слова: [keywords]
- Гео: [geo_preference]
- Опыт: [experience_level]
- Формат работы: [work_format]
- Зарплата от: [salary_floor] [currency] (вакансии без зарплаты: [show_no_salary])
- Блокеры: [user_blockers]
- Гео-исключения: [geo_exclusions]
- Разрешение на работу: [work_permit_countries]
- Уровень английского: [english_level]
- Свежесть вакансий на платформах: [max_vacancy_age_days] дн.
- Свежесть вакансий в Telegram: [telegram_vacancy_max_age_days] дн.
```

---

---

## Where the profile lives

- **The working copy** of the personal profile is the user's own memory file. If the session is attached to a Project, the working copy is the Project's copy (`/projects/<project-id>/areas/job-hunter-profile.md`): write there, read from there first. The account-level `/areas/job-hunter-profile.md` may hold an older copy; do not rely on it when the Project copy exists.
- **The template** `references/profile-template.md` in this repository is neutral (no personal values). It lists every field the skill reads.
- **Reminder (mandatory).** If, during a run or a settings change, the profile's *structure* changed in the user's memory (a field was added, renamed or removed) and `references/profile-template.md` in the repository does not have it, finish the run with this reminder: «Структура job-hunter-profile.md изменилась (поля: …) — нужно залить pull request с обновлением шаблона references/profile-template.md». Never put personal values (salary, blockers, links, IDs) into the repository: it is public. Only field names and neutral examples go into the template.
- Personal settings are not shared between users by the skill itself. Each user's profile lives in that user's own account or project memory; the skill does not enforce separation between people who share one account.

---

## What is stored in memory

The profile file (see «Where the profile lives»):
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
- `english_level`: user's English level (A1–C2)
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
- **Don't stop on minor errors.** One platform down → continue with the others, note it in the report. Wrap every fetch in try/catch; on error count it, wait 1 s, continue. Never abort the full run.
- **Permissions — once only.** The full domain list is collected at onboarding and added by the user in bulk. Never re-request.
- **Resume — live.** Check the hash on every run; if it changed, re-read and apply.
- **Cold start.** If the last run was more than 14 days ago, verify auth and channel activity before searching.
- **Notify on failure.** If a run is interrupted, send a push notification.
- **Browser state.** Verify in-browser state variables exist before the application loop; if lost, re-collect.
- **Readable text.** Comments and summaries — in the report and in messages to the user — are written as short paragraphs or lists (one item per platform, reason or step), never as one solid block of text; detail stays (`modes/report.md`, rule 10).
- **Flag, never hide.** Vacancies needing a work permit the user lacks, or an English level above theirs, go to dedicated report sections.
- **Link verification is not optional.** CORS blocks `fetch()` for external sites — navigate in a browser tab. hh.ru and Hirify: verify via `fetch(url, {method:'HEAD'})` from their domain.
- **Run journal.** Every run writes its entry (`references/run-journal.md`); it is how the skill knows when the last full discovery was.
