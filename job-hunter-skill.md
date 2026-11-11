---
name: "job-hunter"
description: "Universal job search automation skill. Triggers when the user wants to find a job, set up automated job search, get daily job reports, apply to vacancies automatically, or update their resume for search purposes. Use this skill for ANY job-hunting task: initial setup, daily search runs, resume updates, platform onboarding, Telegram channel discovery, or reviewing and applying to found vacancies. Activate immediately when the user says anything like \"find me a job\", \"set up job search\", \"I'm looking for work\", \"run today's search\", \"update my resume\", or \"which jobs match my profile\"."
---

# Job Hunter

An automated, universal job search system. Works for any profession, any geography, any language. The user sets it up once — and gets daily reports with relevant vacancies, auto-applications where possible, and smart filtering aligned to their profile.

---

## ⚠️ UNIVERSAL RULES (apply to ALL users, never override)

These rules apply regardless of the user's profile or onboarding status. They are about how the skill works, not about who is searching.

1. **Language: use the language the user chose in Phase 0** — all messages, reports, cover letters, error notes. No exceptions. For new users whose language is unknown, ask in both English and Russian (see Phase 0).
2. **Never mention salary in cover letters** — it leads to rejections. This is an absolute prohibition.
3. **All links must be clickable** — in documents use `[anchor text](https://full-url)` format. Never put bare URLs without hyperlink markup.
4. **All links must be verified** — after composing any document with vacancy links, verify EVERY link by navigating to it in the browser (or HEAD request). If a site returns ERR_CONNECTION_RESET, 404, or «Не удается получить доступ» — remove that vacancy/line from the document entirely or mark clearly as «⚠️ сайт недоступен». A document with unverified links is not complete.
5. **Cover letter — 5-part mandatory structure** — see Cover Letter Framework section. Total 7–10 sentences. No salary.
6. **Telegram vacancies — always include direct message link** — for EVERY vacancy found in a Telegram channel, include the direct link to the specific message in format `https://t.me/channelname/messageID`. Without this link the vacancy row is incomplete. Never report a TG vacancy without the direct message link. To get the link: in web.telegram.org right-click (or long-press) the post → «Copy link» → result: `https://t.me/channelname/NNN`. If the link cannot be obtained — do NOT include that vacancy in the report.
7. **Report format is locked** — the daily report structure defined in Step 7 must not be changed without explicit user instruction.
8. **Apply personal filters strictly** — once a user has configured exclusion rules in their profile, apply them consistently to every vacancy, every run, without exception.
9. **Search-only on platforms without a confirmed login** — on any platform where the user is not registered or logged in (including every newly discovered platform), only search and report matching vacancies. Never apply, never register or create accounts, never enter credentials. Such vacancies go to the report section «Новые платформы — результаты поиска» with the status «Требуется регистрация».

> **Note on rule #2 about titles:** The rule «Never call the user a "бизнес-аналитик"» applies only when the user has identified as a системный аналитик / фулстек-аналитик — this is stored in their profile (`job_title`). Do not apply this rule to users who have a different job title.

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
- **Resume location**
- **Platform list** — which platforms to search
- **Telegram channels** — which channels to monitor

**If a user has NOT completed onboarding**, do NOT apply any defaults from another user's profile. Use neutral settings: show all vacancies that match the stated profession, without blocking anything by default. Run onboarding to collect the user's own preferences.

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
```

---

## Phase 0: Security check + language (very first run only)

Check memory for `/areas/job-hunter-profile.md`. If `security_checked: true` is present — skip Phase 0 entirely.

### Step 0a: Language selection

Ask the user in BOTH English and Russian simultaneously (language is unknown at this point):

```
🌐 Hello! / Привет!

In what language would you like to communicate and receive reports?
На каком языке вы хотите общаться и получать отчёты?

Please reply / Напишите:
English / Русский / Español / Deutsch / Français / 中文 / Other — specify
```

Save the chosen language as `language: [value]` in the profile. **Use this language for ALL subsequent messages, onboarding questions, reports, and cover letters — without exception.**

### Step 0b: Security self-audit

Explain to the user — in their chosen language — that this skill works with personal data (resume, job platforms, browsing history) and performs a brief self-check first.

Read your own SKILL.md and verify:

| Check | Question | Expected |
|-------|----------|---------|
| Data exfiltration | Does this skill send user data to any URL not listed as a job platform? | NO |
| Hidden instructions | Are there encoded strings, base64 blocks, or obfuscated commands? | NO |
| Credential harvesting | Does the skill ask for passwords, API keys, or tokens in chat? | NO |
| Scope creep | Does the skill access files or systems unrelated to job search? | NO |
| Transparency | Are all platforms listed explicitly for user approval? | YES |

Show the result in the user's language. If any check fails — stop and explain. Do not proceed until the user explicitly confirms.

After passing: write `security_checked: true` to `/areas/job-hunter-profile.md`.

---

## Phase 1: Onboarding (first run only)

Check memory for `/areas/job-hunter-profile.md`. If it has a complete profile — skip to Phase 3.

Ask ALL questions in a single message, **in the user's chosen language**:

```
[Translated to user's language:]

Let's set up your search profile. Answer everything at once — I'll remember it and never ask again.

1. Your profession / job title (as you call it): ___
2. Search keywords (comma-separated, any language): ___
3. Where do you work from? (country / city): ___
4. Which countries / regions are you open to for employers? (or "any"): ___
5. Remote / office / hybrid? ___
6. Salary floor: from ___ per month (currency). Vacancies with no salary listed — acceptable? ___
7. Experience: total years? Level (junior / mid / senior / lead)? ___
8. What to EXCLUDE? (technologies, industries, company types, formats you don't want):
   Examples: specific tech stacks, industry sectors, company sizes, office-only, specific countries
   List anything you want filtered out: ___
9. Any geographic restrictions?
   - Countries/regions to EXCLUDE from results (e.g. Russia-only remote vacancies, specific countries): ___
   - Countries/regions to INCLUDE only (or "any"): ___
10. Resume language (your language / English / both): ___
11. Where is your resume?
    a) I'll upload a PDF now
    b) Link to a profile (LinkedIn, hh.ru, etc.) — paste URL
    c) Both
12. Work authorization: in which countries do you have a legal right to work?
    (This determines which vacancies require permits you don't have — those will be flagged, not hidden.)
13. English level: A1 / A2 / B1 / B2 / C1 / C2 / Native
    (Vacancies requiring a higher level than yours will be flagged in the report.)
```

After the user responds:
- PDF → read contents, extract key skills, stack, experience
- Profile link → open in browser, read, extract data
- Save everything to `/areas/job-hunter-profile.md`, including:
  - `job_title: [value]` — the user's own name for their profession
  - `keywords: [list]` — search keywords
  - `geo_preference: [value]` — where they work from
  - `geo_exclusions: [list]` — geographic restrictions to exclude (e.g. `["RU-only remote"]`)
  - `geo_inclusions: [list or "any"]` — geographic restrictions to include
  - `work_format: [remote/office/hybrid]`
  - `salary_floor: [amount]`
  - `salary_currency: [currency]`
  - `show_no_salary: [yes/no]`
  - `experience_years: [N]`
  - `experience_level: [junior/mid/senior/lead]`
  - `user_blockers: [list]` — user's own exclusion list (technologies, industries, etc.)
  - `work_permit_countries: [list]`
  - `english_level: [B1/B2/C1/etc]`

---

## Phase 2: Platform onboarding (after first profile setup)

Build a **personalized platform list** based on the profile. The list has two parts.

### Part A — Known platforms (fixed baseline)

Priority logic (determined dynamically by profession + geo). Select the most relevant platforms for the user's profession and location. All platforms below are available — choose the best fit, or include all when unsure.

**Level 1 — Russian-speaking IT (системный аналитик, разработчик, QA, DevOps, PM, дизайнер и др.):**
- hh.ru + country HH domains: hh.kz, hh.uz, hh.ge, hh.am, cy.hh.ru, rabota.by
- [Habr Career](https://career.habr.com) — IT-специалисты, Россия и СНГ
- [getmatch.ru](https://getmatch.ru) — IT, русскоязычные компании с релокацией
- [geekjob.ru](https://geekjob.ru) — IT-вакансии
- [hirify.me](https://hirify.me) — AI-подбор вакансий, загрузка резюме
- [jobtoo.ru](https://jobtoo.ru) — IT и аналитика
- [talent-move.ru](https://talent-move.ru) — IT и аналитика
- [JobRocket](https://jobrocket.ru/ru/) — IT-вакансии с вилками и контактами рекрутёров (бета); удалённые помечены «Удаленно», свободного поиска нет — фильтр по категориям и технологиям
- [HireHi](https://hirehi.ru/) — агрегатор IT и digital вакансий; есть фильтр удалённого формата и поиск с операторами (+ обязательно, - исключить); вход по коду на почту или через Яндекс

**Level 1 — International IT / remote-friendly:**
- [LinkedIn](https://linkedin.com/jobs) — универсальная международная площадка
- [Indeed](https://indeed.com) — крупнейший агрегатор вакансий
- [Glassdoor](https://glassdoor.com) — вакансии + отзывы о компаниях
- [Wellfound](https://wellfound.com) (ex-Angel.co) — стартапы, tech-компании
- [Remote.co](https://remote.co) — только удалённые вакансии
- [We Work Remotely](https://weworkremotely.com) — популярная площадка удалённых вакансий
- [Working Nomads](https://workingnomads.com) — удалённые вакансии для цифровых кочевников
- [Daily Remote](https://dailyremote.com) — агрегатор удалённых вакансий
- [JustRemote](https://justremote.co) — фильтрованные удалённые позиции
- [Jobgether](https://jobgether.com) — удалённые вакансии, фокус на Европу
- [Remote Work](https://remoteok.com) — RemoteOK, агрегатор удалённых позиций

**Level 1 — Affiliate marketing, digital, AI:**
- [ArbiHunter](https://arbihunter.com) — топ-площадка для Affiliate marketing, AI, digital; рекрутеры предпочитают её
- [AI Jobs](https://aijobs.net) — вакансии в AI/ML

**Level 1 — Дизайн:**
- [Behance Jobs](https://behance.net/joblist) — дизайнеры
- [Dribbble Jobs](https://dribbble.com/jobs) — UI/UX и графические дизайнеры
- [LinkedIn](https://linkedin.com/jobs) — дизайн и продукт

**Level 1 — Финансы, аналитика:**
- [LinkedIn](https://linkedin.com/jobs)
- [eFinancialCareers](https://efinancialcareers.com) — финансы и аналитика

**Level 2 — Агрегаторы и нишевые платформы (универсальные):**
- [WANTAPPLY](https://wantapply.com) — международные позиции напрямую от работодателей
- [FlexJobs](https://flexjobs.com) — гибкие и удалённые вакансии (платная подписка, но качество высокое)
- [PowerToFly](https://powertofly.com) — удалённые вакансии, фокус на diversity
- [Otta](https://otta.com) — tech-компании, подбор по ценностям
- [Toptal](https://toptal.com) — фриланс высокого уровня (разработчики, дизайнеры, финансы)
- [Crossover](https://crossover.com) — удалённые позиции, долгосрочные контракты (специфика: фиксированные ставки)
- [Monster.com](https://monster.com) — классический агрегатор
- [Simply Hired](https://simplyhired.com) — агрегатор, много позиций США
- [RemoteWoman](https://remotewoman.com) — удалённые вакансии, фокус на женщин в tech

**Level 2 — Прямые карьерные страницы tech-компаний:**
- [Supabase Careers](https://supabase.com/careers#positions) — open-source backend платформа
- Добавлять карьерные страницы конкретных компаний по запросу пользователя

**Level 3 — Telegram channels** (live, active — see Phase 2b)

**hirify.me specifics:** AI-powered job matching platform. Supports resume upload and automatic vacancy matching. Check the personal feed on each run (login required). URL: https://hirify.me/

**jobtoo.ru specifics:** Open https://jobtoo.ru/, search by user's profession keywords (from profile `keywords`) with remote filter.

**talent-move.ru specifics:** Open https://talent-move.ru/, search by user's profession keywords (from profile `keywords`) with remote filter.

**ArbiHunter specifics:** Open https://arbihunter.com, search by profession keywords. Особенно актуален для digital, affiliate, AI-специалистов.

**Supabase Careers specifics:** Open https://supabase.com/careers#positions — список открытых позиций. Нет фильтра по ключевому слову, просматривать весь список вручную.

**WANTAPPLY specifics:** Open https://wantapply.com, search by profession keywords. Много позиций зарубежом напрямую от работодателей.

### Part B — Web search for new platforms (run ONCE at onboarding, then at Phase 5)

See Phase 5 for the full web search procedure. Run it now to discover platforms the fixed list doesn't cover.

Show the user the combined list (fixed + newly discovered) with a reason for each platform. Ask them to:
1. Confirm the list (they can remove items)
2. Log in to each platform in their browser

**For each platform:**
- Open in browser, verify login
- Record **all domains** actually used (including auth.*, api.*, static.*, subdomains)
- Save the full domain list to profile

**Permission rule — ONCE ONLY:** After confirming each platform, show the user the complete domain list and ask them to add ALL of it to "Always allowed" in browser settings. Explain: this prevents daily re-prompts. **Never ask for permissions again after onboarding.**

### Phase 2b: Telegram channel discovery

**Priority channels (always check on every run, regardless of discovery step):**
- @jobs_it — IT job postings channel (https://t.me/jobs_it)
- @runello_jobs_analyst — analyst-specific job postings (https://t.me/runello_jobs_analyst)
- @foranalysts — analyst community with job postings

For additional channel discovery: go to tgstat.ru and telemetr.io. Search using the user's profession keywords.

**Live channel criteria:** last post ≤ 7 days ago, ≥ 10 job posts/month, > 500 subscribers.
**Skip if:** last post > 30 days, < 3 job posts/month, mostly spam or course ads.

Find 5–15 live channels. Save to profile with date of last post. Open in web.telegram.org to verify access.

---

## Phase 3: Daily search run

**Before starting:** check `last_run_date` in profile. If it equals today's date — ask the user: "Поиск уже был запущен сегодня. Запустить снова?" Do not re-run automatically.

**Also check for cold start:** if `last_run_date` is more than 14 days ago — notify the user: "Последний запуск был [дата]. Некоторые платформы могут требовать повторной авторизации." Then: verify auth on each platform (mark any that need re-login), run Phase 5 channel activity check before searching.

### Step 0: Salary threshold for this run

If the profile has no `salary_floor`, ask the user ONCE at the very start of the run: «Минимальный порог зарплаты для этого поиска? (можно в рублях, долларах или евро, или «без порога»)». Use the answer for this run only; do not write it into the skill or the repository. If the user answers «без порога» or does not answer, run with no salary filter. If the profile has `salary_floor`, do not ask. The threshold may be given in any currency; compare using the conversion in the hh.ru salary check below, and treat equivalents in USD/EUR/RUB as the same threshold.

### Step 1: Resume check

Read current resume from profile. Compare with previous version (hash or file date). If changed — re-read, update extracted skills and stack in profile, note at top of report: "📄 Резюме обновлено — новые навыки применены к поиску."

If the user says "update resume" or uploads a new file — process immediately, don't wait for the next run.

### Step 2: Platform search

**Step 2a — Search known platforms**

For each platform in the saved list (priority order):
1. Open in browser (using saved sessions)
2. Apply search filters from profile (use `keywords` from profile, not hardcoded values)
3. Collect vacancies not older than [profile setting, default 3 days]
4. Exclude already-seen (compare with history in memory)
5. Add to shared pool

**If browser hits a login page** — do NOT abort the run. Mark platform as "needs re-auth", continue with others, note in report.

**hirify.me specifics:** Open https://hirify.me/, log in if needed, navigate to the personal vacancy feed / matches section. Extract matched vacancies. If the platform returns a 401 or requires manual login — mark as "needs re-auth" in report and continue.

**jobtoo.ru specifics:** Open https://jobtoo.ru/, search by user's profession keywords (from profile `keywords`) with remote filter. Extract vacancy links and titles.

**talent-move.ru specifics:** Open https://talent-move.ru/, search by user's profession keywords (from profile `keywords`) with remote filter. Extract vacancy links and titles.

**Step 2b — Web search for new platforms (every run)**

On EVERY daily run, do a quick web search to discover job boards and aggregators not yet in the saved list. This supplements — never replaces — the known platforms.

Search queries to run (adapt keywords to the user's profession from profile `keywords` and `job_title`):
```
"[profession] jobs remote [current year]" site:reddit.com OR site:news.ycombinator.com
"[profession] job board [current year]"
"best sites [profession] remote jobs [current year]"
"[profession] вакансии удалённо [current year] сайты"
```

For each newly found platform:
- Check if it's already in the saved list — skip if yes
- Open the platform, run a quick search for the user's keywords
- If relevant vacancies found → **do NOT apply** (the user is not registered there). Apply the same filters as everywhere else (universal + personal), then list each matching vacancy in the report section «Новые платформы — результаты поиска»: clickable link, company, status «Требуется регистрация». Also propose adding the platform to the saved list.
- If no relevant results → note in report as "проверили, подходящих нет" and skip next time

Report new platforms found in a dedicated section: **"🆕 Новые платформы — результаты поиска"** — list each with the number of relevant vacancies found (or zero).

**Registered vs not registered:** a platform counts as registered only if the profile marks a confirmed login for it (see Phase 2). Everything else is search-only (Universal rule 9). The user registers manually; after that she tells the skill, the platform is marked as registered and from the next run vacancies there are handled like on any other platform, including auto-apply.

**hh.ru-specific checks (apply when searching hh.ru):**

**Data structure:** hh.ru page state (`HH-Lux-InitialState`) uses different field names than the REST API. Always handle both:
- Vacancy ID: use `v.vacancyId` (InitialState), not `v.id`
- Company name: `v.company?.name || v.company?.visibleName` (not `v.employer.name`)
- Salary object: `v.compensation` (not `v.salary`)
- Currency code: `c.currencyCode || c.currency?.code || c.currency || 'RUR'`
- Salary mode (frequency): `typeof c.mode === 'object' ? c.mode.$ : (c.mode || 'MONTH')`
- Publication date: `new Date(v.publicationTime?.$ || v.publicationTime?.['@timestamp'] * 1000)` — note: `@timestamp` is in seconds, not ms
- Work schedule (remote check): `v['@workSchedule'] === 'remote'` (not `v.schedule.id`)

**Search query:** Use NAME-syntax and profile keywords for title-only search to avoid false positives from job descriptions. Build query from profile `keywords` dynamically:
```js
const kws = profile.keywords.map(k => encodeURIComponent(k)).join('+OR+');
const url = `https://hh.ru/search/vacancy?text=NAME%3A(${kws})&work_format=REMOTE`;
```

**Salary check:** Only reject a vacancy for low salary if compensation is explicitly stated AND has a numeric value. Vacancies with no salary (`!c || (!c.from && !c.to)` or `c.noCompensation`) must NOT be rejected — pass them through (unless `show_no_salary: no` in profile). For currency conversion, support USD and EUR directly:
`const usd = curr === 'USD' ? val : curr === 'EUR' ? val * 1.05 : val / (RATES[curr] || 90);`
where `RATES = {RUR:90, RUB:90, KZT:500, BYN:3.2, BYR:3.2, UZS:12800}`

**Previously applied check:** Before starting the run, load the user's existing applications from `https://hh.ru/applicant/negotiations?filter=all`. Parse the response from DOM (not JSON), check the `data-initial-state` attribute:
```
const el = document.createElement('div'); el.innerHTML = text;
const data = el.querySelector('[data-initial-state]');
const parsed = JSON.parse(data.getAttribute('data-initial-state'));
```
Inspect the actual key names (they may differ from the documented API). If this fails, log a warning but do NOT abort the run.

**User name:** Always read the user's first name from the API before the run: `fetch('https://api.hh.ru/me')` → use `me.first_name`. Never invent or guess the name.

### Step 3: Telegram channel search

Open web.telegram.org. Open each channel. Review posts from the last 24h (or since last run). Extract job links. If channels mention other active channels — add to check list.

**TG vacancy links — mandatory:** For every vacancy post found in any TG channel, copy the direct message link via right-click → «Copy link» in web.telegram.org (result: `https://t.me/channelname/NNN`). Include this link in the report for every vacancy. If the link cannot be obtained — do NOT include that vacancy in the report.

**Fallback:** If web.telegram.org is unavailable or login fails — skip Telegram for this run, note in report, continue with other sources.

### Step 4: LinkedIn search

Use advanced LinkedIn search — not only through "Jobs" but also:
- HR posts with hashtags: #hiring #vacancy #openrole #вакансия #открытавакансия
- Company pages → Jobs section
- Keyword search in posts

Capture direct vacancy links, not just company pages.

### Step 5: Filtering and ranking

For each vacancy, apply filters in this order:

#### 5a. Universal filters (apply to ALL users)

1. **Role match** — does the vacancy title match the user's target profession (`job_title` + `keywords` from profile)?
2. **Freshness** — remove if older than profile limit (default 3 days)
3. **Deduplication** — remove if same company + role already in history
4. **Work permit check** — if the vacancy explicitly requires authorization to work in a country where the user does NOT have a permit → flag in report with label ⚠️ Требуется разрешение на работу. Show in separate section.
5. **English level check** — if the vacancy explicitly requires C1, C2, or "native/fluent English" AND the user's English level is below that threshold → flag with label ⚠️ Требуется уровень [C1/native]. Show in separate section.

#### 5b. Personal filters (apply ONLY if configured in user profile)

Read personal filters from `/areas/job-hunter-profile.md`:

```js
// Load personal settings from profile (pseudo-code)
const profile = readProfile('/areas/job-hunter-profile.md');
const geoExclusions = profile.geo_exclusions || [];    // e.g. ["RU-only"]
const geoInclusions = profile.geo_inclusions || "any"; // e.g. "any" or ["EU", "CIS"]
const userBlockers  = profile.user_blockers  || [];    // e.g. ["1С", "биллинг", "госсектор"]
const salaryFloor   = profile.salary_floor   || 0;
const showNoSalary  = profile.show_no_salary !== "no"; // default: show
```

Apply each filter ONLY if its value is set and non-empty:

**Geo exclusions** (apply if `geoExclusions` is non-empty):
```js
// Check full text (title + description) for each geo exclusion pattern
// The patterns to check depend on what the user configured.
// Example: if "RU-only" is in geoExclusions, check for Russia-only patterns:
if (geoExclusions.includes("RU-only")) {
  if (/удалённо\s+по\s+Росси|удаленно\s+по\s+Росси|удалённо\s+по\s+РФ|удаленно\s+по\s+РФ|на\s+территории\s+РФ|на\s+территории\s+России|работ[а-яё]*\s+в\s+РФ|только\s+в\s+РФ|только\s+в\s+России|резидентств[а-яё]*\s+РФ|только\s+для\s+граждан\s+РФ|только\s+граждан[а-яё]*\s+РФ/i.test(full))
    return { pass: false, reason: 'RU-only' };
}
// Add similar checks for other geo exclusion values the user configured
```

**User blockers** (apply if `userBlockers` is non-empty):
```js
// For each blocker term the user configured, check the full text
for (const blocker of userBlockers) {
  const re = new RegExp('(^|[\\s,;(])' + blocker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([\\s,;.)]|$)', 'i');
  if (re.test(full))
    return { pass: false, reason: `user-blocker:${blocker}` };
}
```

**Salary filter** (apply if `salaryFloor > 0`):
```js
// Only reject if salary is explicitly stated AND below threshold
if (salaryFloor > 0 && compensationStated && compensationValueUSD < salaryFloor) {
  return { pass: false, reason: 'salary-below-threshold' };
}
// If show_no_salary is "no" — also reject vacancies with no salary listed
if (!showNoSalary && !compensationStated) {
  return { pass: false, reason: 'no-salary-listed' };
}
```

#### Two-pass filter pattern for hh.ru

**Rule:** Every exclusion filter from the user profile must be applied to the **combined full text** (title + description), not to the title alone. The title-only pass is only an optimisation to skip vacancies that obviously don't match the target role; it is not a substitute for checking the description.

```js
window.W = s => new RegExp('(^|[^а-яёa-z0-9])(?:' + s + ')([^а-яёa-z0-9]|$)', 'i');

window.filterFull = (name, desc, vac, profile) => {
  // Bug 1 fix: check HH employment classification BEFORE regex filtering
  if (vac && vac.employment?.id === 'probation')
    return { pass: false, reason: 'probation-hh' };

  const titleOnly = (name || '').replace(/\s+/g, ' ').trim();
  const full = (titleOnly + ' ' + (desc || '')).replace(/\s+/g, ' ');

  // ── Pass 1: title-only checks (universal: role match + seniority) ──────────
  // Build role match regex from profile keywords
  const rolePattern = (profile.keywords || []).concat(profile.job_title || [])
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  if (rolePattern && !new RegExp(rolePattern, 'i').test(titleOnly))
    return { pass: false, reason: 'role-mismatch' };

  // Junior/intern check (universal — applies when experience_level is mid/senior/lead)
  if (profile.experience_level && profile.experience_level !== 'junior') {
    if (/стажировк|стажер|стажёр|стажёром|ученик|ищем\s+стаж/i.test(titleOnly))
      return { pass: false, reason: 'intern' };
    if (W('junior|intern|trainee|apprentice').test(titleOnly))
      return { pass: false, reason: 'junior' };
    if (/младший\s+аналитик/i.test(titleOnly))
      return { pass: false, reason: 'junior' };
  }

  // ── Pass 2: full-text checks (personal filters from profile) ─────────────
  const geoExclusions = profile.geo_exclusions || [];
  const userBlockers  = profile.user_blockers  || [];

  // Geo exclusions
  if (geoExclusions.includes('RU-only') || geoExclusions.includes('ru-only')) {
    if (/удалённо\s+по\s+Росси|удаленно\s+по\s+Росси|удалённо\s+по\s+РФ|удаленно\s+по\s+РФ|на\s+территории\s+РФ|на\s+территории\s+России|работ[а-яё]*\s+в\s+РФ|только\s+в\s+РФ|только\s+в\s+России|резидентств[а-яё]*\s+РФ|только\s+для\s+граждан\s+РФ|только\s+граждан[а-яё]*\s+РФ/i.test(full))
      return { pass: false, reason: 'RU-only' };
  }

  // User blockers — applied to full text
  for (const blocker of userBlockers) {
    const escaped = blocker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp('(^|[\\s,;(\\[])' + escaped + '([\\s,;.\\])]|$)', 'i').test(full))
      return { pass: false, reason: `user-blocker:${blocker}` };
  }

  return { pass: true };
};
```

**Initialise `filterFull` once** at the top of each browser session, before the apply loop. The same function covers both hh.ru and all other platforms — just pass the vacancy title, description text, vacancy object, and profile as arguments.

**False positives — do NOT block** (confirmed safe): mentions of blocked terms in a "knowledge of" or "nice-to-have" context where the main role is clearly the user's target profession should be evaluated carefully — but if a blocker term is in `user_blockers`, it means the user explicitly chose to exclude it.

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

### Step 6: Auto-applications

**Only on platforms with a confirmed login.** Vacancies found on platforms without a confirmed login (search-only, Universal rule 9) are never applied to automatically — they stay in the report section «Новые платформы — результаты поиска» with the status «Требуется регистрация».

**Before sending any applications** — show the user a brief list: "Найдено N вакансий. Все будут поданы автоматически. Продолжить?" Wait for confirmation. This prevents accidental mass-applying.

**Initialize tracking arrays before the loop:**

```js
// Bug 4 fix: initialize before the apply loop
window.__testAssignments = [];
window.__confirmedApplied = window.__confirmedApplied || [];
```

**Bug 4 fix — test assignment detection (check BEFORE attempting to apply):**
```js
const hasTest = vacancy.has_test === true ||
  /тестовое задание|test\s*task/i.test(vacancy.description || '');
if (hasTest) {
  window.__testAssignments.push({
    id: vacancy.id || vacancy.vacancyId,
    host: vacancy.host || 'hh.ru',
    title: vacancy.title || vacancy.name,
    company: vacancy.company?.name || vacancy.company?.visibleName || vacancy.employer?.name,
    url: vacancy.url || `https://hh.ru/vacancy/${vacancy.id || vacancy.vacancyId}`
  });
  continue; // Skip __apply() — do not auto-apply
}
```

**Bug 2 fix — salary check is MANDATORY before every __apply(), including resumed loops:**

> **CRITICAL RULE:** `__checkSalaryPage(vacancyId, host)` MUST be called before every single `__apply()` — including when the loop is resumed via `window.__resumeIdx`. Never rely on salary data from `window.__newCandidates` or any pre-collected cache for the salary check. Always fetch fresh from the vacancy page.

```js
const startIdx = window.__resumeIdx || 0;
for (let i = startIdx; i < vacancies.length; i++) {
  const vac = vacancies[i];
  const vacancyId = vac.id || vac.vacancyId;

  // Bug 4: test assignment check
  const hasTest = vac.has_test === true ||
    /тестовое задание|test\s*task/i.test(vac.description || '');
  if (hasTest) {
    window.__testAssignments.push({ id: vacancyId, host: vac.host || 'hh.ru',
      title: vac.title || vac.name,
      company: vac.company?.name || vac.company?.visibleName,
      url: vac.url || `https://hh.ru/vacancy/${vacancyId}` });
    continue;
  }

  // Bug 2: salary check mandatory — NEVER skip, NEVER use __newCandidates
  const salaryOk = await __checkSalaryPage(vacancyId, vac.host || 'hh.ru');
  if (!salaryOk) continue;

  const result = await __apply(vacancyId, vac.host || 'hh.ru');

  if (result.status === 200) {
    // Bug 3: push full object so report can iterate with links
    window.__confirmedApplied.push({
      id: vacancyId,
      title: vac.title || vac.name,
      company: vac.company?.name || vac.company?.visibleName || vac.employer?.name,
      url: vac.url || `https://hh.ru/vacancy/${vacancyId}`
    });
  } else if (result.status === 429) { break; }
  window.__resumeIdx = i + 1;
}
```

**If platform supports browser-based application:**
1. Open the vacancy
2. Verify URL contains vacancy ID (`/vacancy/\d+`) — if not, construct it: `https://hh.ru/vacancy/${vacancyId}`
3. Check vacancy is still live: if HEAD request returns 404, skip it and note in report
4. Find the apply button
5. Write a cover letter using the Cover Letter Framework below
6. Submit — wait for HTTP 200 response before counting as applied
7. Add a delay between applications to avoid rate limiting:
   - **Base delay:** 3–5 seconds (random) between every application
   - **Jitter:** add extra 0–3 seconds (random) on top — total 3–8 seconds per application
   - **After every 5 applications:** pause 30–60 seconds (random)
   - **After every 20 applications:** pause 3–5 minutes (random)
   This mimics human behavior and prevents captcha / account block.
8. Record in `window.__confirmedApplied` as `{id, title, company, url}` (see Bug 3 fix above)

**Application counting:** Only count vacancies where the submit returned HTTP 200. Status 403 (already applied) goes to "уже подавали" list. Status 429 (rate limit) → stop the loop immediately. Any other error → "failed" list. Never increment the counter for failed or blocked requests.

**Captcha detection:** If the apply function returns `{blocked: true}` — stop the entire application loop immediately. Log the captcha hit and add remaining vacancies to "требует действия" in the report.

**If vacancy requires a test task** — do NOT auto-apply. Add to `window.__testAssignments` and report separately (see Bug 4 fix above).

**If application requires email / form** — add to "требует действия" list in report.

### Cover Letter Framework

**Bug 5 fix — mandatory 5-part structure (November 2026):**

> **Root cause:** Previous format instructions did not enforce a greeting, self-presentation, or explicit vacancy comparison. The resulting letters started mid-sentence, omitted the greeting and self-intro, and failed to explicitly compare the candidate's experience against the vacancy requirements.

Each cover letter **must** consist of exactly 5 parts in this order. Skipping any part is not allowed.

**Part 1 — Greeting**
Address the team or company by name. If the vacancy mentions a hiring manager's name — use it.
Example: *"Добрый день, команда [Company]!"* / *"Hello, [Company] team!"*

**Part 2 — Self-presentation** (1 sentence)
One sentence stating the candidate's specific specialization relevant to this vacancy. Must NOT be generic — must name the specific role or domain. Use the user's own job title from their profile (`job_title`), not an assumed generic one.
Example: *"Я — системный аналитик с 6+ летним опытом интеграций и API в B2B SaaS."*

**Part 3 — Relevant experience** (2–3 sentences)
Only experience that matches THIS vacancy's requirements. Pick 2–3 concrete achievements or skills from the resume that overlap with the vacancy. Do NOT copy-paste from resume wholesale.

**Part 4 — Vacancy comparison** (2–3 sentences)
Explicit point-by-point mapping to the vacancy requirements. Reference something specific from the vacancy description. Use phrasing like: *«Ваши требования к X — именно то, чем я занималась в Y»*

**Part 5 — Closing** (1 sentence)
Express readiness to discuss the vacancy in more detail.
Example: *"Буду рада рассказать подробнее на встрече."*

**Total length: 7–10 sentences. No more, no less.**

**Absolute prohibitions in cover letters:**
- ❌ Never mention salary
- ❌ Never restate the resume in paragraph form
- ❌ Never use generic openers, never start mid-sentence
- ❌ Never apologize for gaps or missing skills
- ❌ Never skip any of the 5 parts
- ❌ Do NOT use a job title that differs from what the user has in their profile

**Before writing:** extract from the vacancy — company name, hiring manager name (if any), product/service, top 2–3 required skills. Cross-reference with resume. Write all 5 parts in order.

---

### Step 7: Report — Claude Docs document

**The daily report is a Claude Docs document** (not a chat message, not an HTML artifact). Create it via `mcp__Claude_Docs__batch` with `container.create`.

**⛔ FORMAT IS LOCKED. Never change section order, column names, or structure. Only the user can authorize format changes.**

**Document structure — REQUIRED sections in this exact order, every run, no exceptions:**

```
# Отчёт по поиску работы — [число месяца на русском]

[дата] · [mention пользователя]

[Краткое summary одной строкой: N авто-откликов, N TG-сообщений, N вакансий требуют ручного отклика.]

## Авто-отклики [N]
Таблица: Платформа | Вакансия | Компания | Статус
- Вакансия — кликабельная ссылка: [Название вакансии](https://url)
- Статус — что сделано: «Отклик», «Отклик + сопроводительное письмо», «Отклик через форму» и т.д.
(Секция включает ВСЕ платформы вместе: hh.ru, getmatch, geekjob, hirify, и др. — не разбивать по платформам)

## TG-сообщения отправлены [N]
Таблица: Компания | Должность | Платформа | HR | Статус
- Должность — кликабельная ссылка на вакансию или пост в канале

## Требуют ручного отклика [N]
Таблица: Платформа | Компания | Должность | Как откликнуться
- Должность — кликабельная ссылка на вакансию

## Заблокированы / Plus [N]
Таблица: Платформа | Компания | Должность | Причина
- Должность — кликабельная ссылка на вакансию (если доступна)

## Новые платформы — результаты поиска
Таблица: Платформа | Вакансия (ссылка) | Компания | Статус/Действие
- Вакансия — кликабельная ссылка
- Статус/Действие — «Отклик отправлен», «Требуется регистрация», «Написано письмо», «Нет подходящих» и т.д.

## Что сделать вручную
Нумерованный список. Каждый пункт содержит кликабельную ссылку на вакансию/платформу и точное описание действия.

## Список новых платформ этого запуска
Таблица: Платформа | URL | Найдено вакансий | Добавлена в профиль?
(Перечислить ТОЛЬКО платформы, где в этом запуске найдена хотя бы одна подходящая вакансия.
После создания отчёта — автоматически добавить эти платформы в список известных платформ в /areas/job-hunter-profile.md)
```

**Rules for the document:**

1. **ALL links MUST be clickable** — format: `[anchor text](https://full-url)`. Never bare URLs. Applies to ALL sections — tables, lists, everywhere. No exceptions.
2. **Verify ALL links BEFORE finalizing** — after writing the document, navigate to each link in the browser. If a site returns ERR_CONNECTION_RESET, 404, or «Не удается получить доступ» — remove that row/item from the document or replace the link with «⚠️ сайт недоступен». A document with unverified links is NOT complete.
3. **Hirify short URL format** — use `https://hirify.me/jobs/[ID]` (no slug). These return HTTP 200.
4. **External career sites** — verify by navigating in browser (not `fetch()` — CORS will block). If unavailable, remove link.
5. **Document title** — in the user's chosen language, with the date. Russian users: «Отчёт по поиску работы — 9 ноября 2026».
6. **Link verification** — hh.ru and Hirify links: verify via fetch(url, {method:'HEAD'}) in browser console. External sites: navigate directly in a browser tab.
7. **New platforms auto-save** — after the report is finalized, add every platform from «Список новых платформ этого запуска» to the known platforms list in `/areas/job-hunter-profile.md` automatically.
8. **Format is immutable** — do NOT rearrange sections, rename columns, merge sections, or add/remove sections without explicit user instruction. The format above is the contract.

---

## Phase 4: Resume update

Trigger: user says "update resume", "I added a certificate", "upload new PDF" — or uploads a file.

1. Accept new file / link
2. Read contents
3. Compare with previous version — show diff: what was added, what changed
4. Update extracted skills and stack in profile
5. Confirm in user's language: «Резюме обновлено. Новые навыки [список] применены к поиску.»

---

## Phase 5: Source expansion

**Two modes:**
- **Quick scan (every daily run):** runs as Step 2b inside Phase 3 — a lightweight web search for new platforms, described there.
- **Deep scan (weekly or on request):** full procedure below. Runs automatically once a week, or when user says "find new channels / platforms".

### Deep scan procedure

- Check activity of current Telegram channels (remove ones with last post > 30 days)
- Search for new Telegram channels on tgstat.ru / telemetr.io
- Run an expanded web search for new niche platforms and aggregators:
  ```
  "[profession] job board [year]"
  "[profession] jobs Telegram [year]"
  "[profession] вакансии площадки [year]"
  "remote [profession] jobs site list [year]"
  "where to find [profession] jobs [year]"
  ```
  — search in BOTH the user's language and English; use profession keywords from profile
- For each new platform found: open it, check if relevant vacancies exist, verify language requirement compatibility, check if work permit is required for listed vacancies
- Update saved platform list in profile
- Include as separate block in next report: «Источники обновлены: добавлено N, удалено N, проверено N»

**Key rule:** Never limit discovery to a fixed predefined list. The internet always has niche platforms, new aggregators, and profession-specific boards that don't appear in any hardcoded list. Discover them fresh every week.

---

## Phase 6: Creative opportunities (on request)

A separate mode for artists, designers, and creative practitioners. Runs independently from the job search — does not affect the daily run, application history, or profile.

**Trigger phrases (any language):**
- "find open calls", "find residencies", "find art fairs", "find galleries for my work"
- "найди опен-коллы", "найди резиденции", "найди ярмарки", "найди галереи под мои работы"
- "find opportunities for [medium]", "where can I submit my work", "find calls for digital art / AI art / light installations"

**Before searching:** ask the user (once, save to profile):
1. Medium / format: digital art, AI art, painting, photography, light/sound installation, video, mixed media — or combination
2. Career stage: emerging / mid-career / established
3. Geography: open to international / Europe only / specific countries
4. What to find (they can pick several):
   - Open calls & competitions
   - Residencies
   - Art fairs (to apply as exhibitor)
   - Galleries (to approach for representation or exhibition)
5. Deadline horizon: how far ahead to look? Options: 3 months / 6 months / 1 year / custom. **Default: 1 year.** User can change anytime by saying "update my creative profile" or "change deadline horizon".

Save answers as `creative_profile` in `/areas/job-hunter-profile.md`. On subsequent runs — skip the interview, use saved profile.

---

### 6a: Open calls & competitions

Search sources:
- **Aggregators:** e-flux.com/announcements, artrabbit.com, callforentry.org (CaFÉ), submittable.com, transartists.org, resartis.org
- **Medium-specific:** Ars Electronica (digital/AI), FILE Festival, ISEA, Prix Net Art — for digital/AI/interactive work
- **Web search:** `"open call" [medium] [year] deadline site:e-flux.com OR site:artrabbit.com`

**Rules:**
- Deadline must be in the future (today or later) — never show expired calls
- Use the deadline horizon from `creative_profile` (default: 1 year ahead)
- Rolling / ongoing deadlines: include and label clearly as "rolling"
- Verify each link: must open without error, lead to the current cycle (not a past year's closed call)
- If direct fetch is blocked → use secondary source (aggregator page, cached version), note in report

---

### 6b: Residencies

Search sources: resartis.org, transartists.org, artistcommunities.org, e-flux.com/announcements

Filter by:
- Medium compatibility (a residency for painters ≠ a residency for digital/AI art)
- Geography (if user specified)
- Duration (note it — some are 1 week, some 3 months)
- Whether stipend / accommodation is provided — flag this

---

### 6c: Art fairs (exhibitor applications)

Art fairs where artists or galleries can apply to exhibit:

**Major international:** Frieze, Art Basel, NADA, Untitled Art Fair, Liste, CHART, Future Fair
**Digital/new media focused:** Ars Electronica Festival, transmediale, ISEA, Mutek
**Emerging artist fairs:** Supermarket Art Fair, VOLTA, Paper Positions

Search for: `"[fair name] [year] application" OR "open application [fair name]"`

**Rules:**
- Application deadline must be in the future
- Distinguish: some fairs accept galleries only, some accept artists directly — note which
- Include application fee if mentioned
- Link must go to the application page, not the fair's homepage

---

### 6d: Galleries (for representation or exhibition proposals)

**Only suggest galleries that match the user's medium.** A gallery that shows oil paintings is irrelevant for AI/digital art.

**For digital / AI art / new media:**
Search: `"digital art gallery" open submissions [year]`, `"AI art" gallery representation`, `"new media art" gallery call`

Known galleries in this space: Bitforms Gallery (NY), Gazelli Art House (London/Baku), Nome Gallery (Berlin), Carroll/Fletcher (London), Panke Gallery (Berlin), ADM Gallery (Singapore), DAM Gallery (Berlin/Frankfurt)

**For light/sound/installation (large-format work):**
Requires venues with technical capacity (high ceilings, blackout, AV infrastructure). Search: `"immersive art" venue open call`, `"light installation" residency`, `"sound installation" exhibition proposal`

**Output per gallery:**
- Name + city
- What they show (medium)
- Whether they accept unsolicited submissions (and how)
- Direct link to submissions page or contact
- Note if submissions are currently open vs. ongoing

---

### 6e: Report format for creative opportunities

Create a separate Claude Docs document (never mix with job search report):

```
# 🎨 Творческие возможности — [дата]

## 📊 Итого
- Опен-коллы: N (дедлайны до [горизонт из creative_profile, по умолчанию 1 год])
- Резиденции: N
- Арт-ярмарки (открытые заявки): N
- Галереи (принимают заявки): N
- Удалено (истёк дедлайн / ссылка не работает): N

---

## 📋 Опен-коллы и конкурсы [N]
Для каждого — отдельный блок:
**[Название]**
🔗 [ссылка на страницу подачи заявки]
📅 Дедлайн: [дата] / Rolling
💰 Взнос: [сумма или «бесплатно»]
📍 [место или «международный / онлайн»]
📝 [1 предложение о том, что ищут]

---

## 🏡 Резиденции [N]
Для каждой:
**[Название] — [место]**
🔗 [ссылка]
📅 Дедлайн: [дата] / Rolling
⏱ Длительность: [недели/месяцы]
💰 Стипендия / жильё: [да/нет/частично]
📝 [соответствие медиуму + 1 предложение]

---

## 🖼 Арт-ярмарки — открытые заявки [N]
Для каждой:
**[Название ярмарки] — [город, год]**
🔗 [ссылка на страницу заявки]
📅 Дедлайн заявки: [дата]
👤 Принимают: художников напрямую / только галереи / и тех и других
💰 Стоимость стенда: [если указана]

---

## 🏛 Галереи — принимают заявки [N]
Для каждой:
**[Название галереи] — [город]**
🔗 [страница для заявок]
📬 Как подать: [email / онлайн-форма / опен-колл]
🎨 Фокус: [что показывают]
📝 [1 предложение о соответствии]

---

## ⚠️ Примечания
(Ссылки без верификации, ярмарки только для галерей, опен-коллы за пределами горизонта и т.д.)
```

---

## What is stored in memory

File `/areas/job-hunter-profile.md`:
- `language`: chosen language (set in Phase 0)
- `security_checked: true` (set after Phase 0 completes)
- `job_title`: user's profession / job title
- `keywords`: search keywords list
- `geo_preference`: where user works from
- `geo_exclusions`: list of geographic restrictions to exclude (e.g. `["RU-only"]`)
- `geo_inclusions`: geographic restrictions to include (or "any")
- `work_format`: remote/office/hybrid
- `salary_floor`: minimum salary
- `salary_currency`: currency for salary threshold
- `show_no_salary`: whether to show vacancies without stated salary (yes/no)
- `experience_years`: total years of experience
- `experience_level`: junior/mid/senior/lead
- `user_blockers`: list of terms/industries/technologies the user wants excluded
- `work_permit_countries`: list of countries where user can legally work without sponsorship
- `english_level`: user's English level (A1–C2)
- Resume: file path / link / hash of last version / extracted skills and stack
- Platform list with priorities and full domain lists for permissions
- Telegram channel list with date of last post and last check
- Application history: vacancy ID, company, role, date, status
- `last_run_date`: date of last Phase 3 run
- `creative_profile`: medium, career stage, geography, what to find, deadline horizon (Phase 6)

---

## Key principles

**🔴 UNIVERSAL RULES (apply regardless of profile):**
- **Language — use the user's chosen language.** Set in Phase 0. Used everywhere.
- **Зарплату в кавер-леттерах не упоминать.** Абсолютный запрет.
- **Все ссылки в документе — кликабельные.** Формат: `[текст](url)`. Без этого документ не считается завершённым.
- **Все ссылки — проверены.** Недоступные сайты (ERR_CONNECTION_RESET, 404) — строку удалить или пометить `⚠️ сайт недоступен`.
- **Cover letter — mandatory 5-part structure.** (1) Greeting → (2) Self-presentation → (3) Relevant experience → (4) Vacancy comparison → (5) Closing. Total 7–10 sentences. Never skip any part. Never mention salary.
- **Report — Claude Docs document.** Not in chat, not HTML artifact. Direct clickable links to every vacancy in every section.
- **Apply personal filters strictly.** Once configured, apply consistently to every vacancy, every run.

**🟡 PERSONAL SETTINGS (apply ONLY after onboarding, from profile):**
- **Job title / profession** — from `profile.job_title`. Used in search queries and cover letters.
- **Search keywords** — from `profile.keywords`. Used in platform search queries.
- **Geographic exclusions** — from `profile.geo_exclusions`. Applied in filter pass 2.
- **User blockers** — from `profile.user_blockers`. Applied in filter pass 2 to full text.
- **Salary threshold** — from `profile.salary_floor`. Applied only if set and > 0.
- **Experience level** — from `profile.experience_level`. Affects junior/intern filtering.

**New users start with no personal filters.** Everything in the yellow category is empty until the user completes onboarding. Do not use another user's values as defaults.

**Don't stop on minor errors.** One platform down → continue with others, note in report. Never abort the full run.

**Permissions — once only.** Full domain list collected at onboarding, bulk-added by user. Never re-request.

**Bug 3 fix reminder:** Always iterate `window.__confirmedApplied[]` and output each entry's `.title`, `.company`, and `.url` as a separate block. Using `.length` alone is a bug.

**Bug 4 fix reminder:** Always output `window.__testAssignments[]` as a dedicated section with full `.url` links.

**Resume — live.** Check hash on every run. If changed → re-read and apply.

**Auto-apply.** No per-run limit — apply to ALL vacancies that pass filters. Confirm before sending. Count ONLY confirmed HTTP 200 responses. Use progressive delays between applications to avoid captcha (3–8s per apply, 30–60s after every 5, 3–5min after every 20).

**Cold start detection.** If last run > 14 days ago → verify auth and channel activity before searching.

**Captcha = full stop.** Stop immediately → move remaining to "требует действия" → notify user.

**Network errors.** Wrap every fetch in try/catch. On error: increment failed counter, wait 1 second, continue to next vacancy.

**Browser state.** Verify in-browser state variables exist before the application loop. If lost → re-collect from scratch.

**Always notify on failure.** If the run is interrupted → send PushNotification.

**User name.** Always fetch from `https://api.hh.ru/me` → `first_name`. Never invent or guess it.

**Invitations.** Show only invitations received within the last 2 months (cut-off: today minus 60 days). Add the invitation date to each entry. Sort by invitation date, most recent first.

**Salary check is mandatory before every apply.** `__checkSalaryPage()` must be called before every `__apply()`. Never use cached data. (Bug 2 fix)

**Work permit — flag, never hide.** Vacancies requiring a work permit the user doesn't have go into a dedicated report section.

**English level — flag, never auto-reject.** Vacancies requiring C1/C2/native when user is below that → dedicated report section.

**New platforms — every run.** Step 2b runs on every daily run, not just weekly.

**Link verification is not optional.** CORS blocks `fetch()` for external sites — navigate in browser tab directly. hh.ru and Hirify: verify via `fetch(url, {method:'HEAD'})` from their domain. External career sites: open in browser tab.
