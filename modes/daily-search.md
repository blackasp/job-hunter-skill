# Mode: daily search run

## Daily search run

Order of the whole run: Step 0 journal → 0a salary threshold → 1 resume → 2a known platforms (all pages) → 2b Telegram → 2c new platforms (on a full-discovery run) → 3 LinkedIn → filtering (`references/filters.md`) → applications (`modes/apply.md`) → report (`modes/report.md`) → journal row.

**Before starting:** check `last_run_date` in profile. If it equals today's date — ask the user: "Поиск уже был запущен сегодня. Запустить снова?" Do not re-run automatically.

**Also check for cold start:** if `last_run_date` is more than 14 days ago — notify the user: "Последний запуск был [дата]. Некоторые платформы могут требовать повторной авторизации." Then: verify auth on each platform (mark any that need re-login), run a full discovery (Step 2b) before searching.

### Step 0: Open the run journal

Before anything else open the run journal (see `references/run-journal.md`): note the start time, read `last_run_date` and `last_full_discovery_date`, and decide the discovery type for this run (Step 2b). Record the start and end time of every step below in the journal. If the journal cannot be written, keep the entries in memory of the session and show them in the report summary line.

### Step 0a: Salary threshold for this run

If the profile has no `salary_floor`, ask the user ONCE at the very start of the run: «Минимальный порог зарплаты для этого поиска? (можно в рублях, долларах или евро, или «без порога»)». Use the answer for this run only; do not write it into the skill or the repository. If the user answers «без порога» or does not answer, run with no salary filter. If the profile has `salary_floor`, do not ask. The threshold may be given in any currency; compare using the conversion in the hh.ru salary check below, and treat equivalents in USD/EUR/RUB as the same threshold.

### Step 1: Resume check

Read current resume from profile. Compare with previous version (hash or file date). If changed — re-read, update extracted skills and stack in profile, note at top of report: "📄 Резюме обновлено — новые навыки применены к поиску."

If the user says "update resume" or uploads a new file — process immediately, don't wait for the next run.

### Step 2: Platform search

**Step 2a — Search known platforms**

For each platform in the saved list (priority order):
1. Open in browser (using saved sessions)
2. Apply search filters from profile (use `keywords` from profile, not hardcoded values). **Sort by publication date, newest first**, so that the freshness cut-off below works.
3. **Collect ALL pages — never stop at page 1.** After the first page, detect the total results count and iterate through the pages. **The stop condition is the freshness threshold:** stop as soon as a whole page contains only vacancies older than `max_vacancy_age_days` from the profile (default 30 days if not set). Technical stops, only if the threshold is not reached first: HTTP 429 / rate limit (pause 60 s, retry once, then stop) or no next-page control exists (last page).
4. Per-platform pagination patterns:
   - **hh.ru:** `&page=N` (0-indexed). Total from `HH-Lux-InitialState` → `vacancySearchResult.totalResults`, 20 per page.
   - **getmatch.ru:** scroll or `?page=N`; click «Показать ещё» / next until it disappears.
   - **geekjob.ru:** `?page=N` (1-indexed); look for the «Следующая» link.
   - **career.habr.com:** `?page=N` (1-indexed); the total count is in the page header.
   - **hirify.me:** scroll / «Load more» until gone.
   - **jobtoo.ru / talent-move.ru:** follow next-page links.
   - **LinkedIn:** scroll the feed or use «Next».
   - **Any other platform:** look for «Next», «Следующая», «Показать ещё», «Load more» or `?page=N`.
   - The page-by-page loop obeys the pacing rules in `modes/apply.md` («Pacing»): do not request pages faster than a person would browse them.
5. Exclude already-seen (compare with history in memory)
6. Add to shared pool
7. Record per platform for the journal and the report summary: «[Platform]: N страниц, M вакансий проверено, K прошли фильтр».

**If browser hits a login page** — do NOT abort the run. Mark platform as "needs re-auth", continue with others, note in report.

**Proxy blocking (ERR_CONNECTION_RESET, 403, timeout):** some platforms are often unreachable from Anthropic's cloud proxy (for Russian-language boards this is common). When a cloud fetch or WebFetch fails for them:
1. Switch to the Chrome browser extension (`mcp__claude-in-chrome__navigate`) — it goes through the user's own network, not Anthropic's proxy.
2. If Chrome also fails — mark the platform «⚠️ недоступна из браузера» in the report and add it to «Что сделать вручную».
3. Never mark a known platform as «новая» just because it was unreachable — it stays in the known list.

**Step 2b — Telegram channels (every run, BEFORE the web search for platforms)**

Discovery runs in two modes, chosen from the journal:

- **Quick scan (every run).** Re-read only the new posts (since the last run) of the channels already in the profile's Telegram channel list, using the method in `modes/telegram.md`. Extract vacancies and filter them like everything else (`references/filters.md`).
- **Full discovery (when `last_full_discovery_date` is older than `discovery_interval_days` from the profile — default 3 days — or the user asks, or the quick scan failed).** Run the discovery and verification steps of `modes/telegram.md` (clarify role from the profile, discover, verify by posts, collect), before the web search in Step 2c. Besides the usual sources, look for **recently published lists and recommendations** (articles, posts, forum threads, channel digests) of Telegram channels and job platforms for the user's field. Collect only what fits the user's profile (field, role, work format, geography, language). Newly verified channels are **added to the profile's Telegram channel list automatically**; channels that failed verification are not added (mention them in the report limits). New channels appear in the report as rows of «Список новых платформ этого запуска» (platform type: Telegram-канал, link, vacancies found, added to profile: yes/no).
- After a full discovery write `last_full_discovery_date` (today) to the profile and to the journal.

**Step 2c — Web search for new platforms (on a full-discovery run)**

On a full-discovery run (same cadence and journal date as Step 2b) do a web search to discover job boards and aggregators not yet in the saved list. On other runs skip this step and write «поиск новых платформ: пропущен, следующий [date]» in the journal. It supplements — never replaces — the known platforms.

Search queries to run (adapt keywords to the user's profession from profile `keywords` and `job_title`):
```
"[profession] jobs remote [current year]" site:reddit.com OR site:news.ycombinator.com
"[profession] job board [current year]"
"best sites [profession] remote jobs [current year]"
"[profession] вакансии удалённо [current year] сайты"
```

For each newly found platform:
- Check if it's already in the saved list in `/areas/job-hunter-profile.md` — skip if yes. A platform is NEW only if it is absent from that list; known platforms and all their country domains always go to the normal search, never to «Новые платформы».
- Open the platform, run a quick search for the user's keywords
- If relevant vacancies found → **do NOT apply** (the user is not registered there). Apply the same filters as everywhere else (universal + personal), then list each matching vacancy in the report section «Новые платформы — результаты поиска»: clickable link, company, status «Требуется регистрация». Also propose adding the platform to the saved list.
- If no relevant results → note in report as "проверили, подходящих нет" and skip next time

Report new platforms found in a dedicated section: **"🆕 Новые платформы — результаты поиска"** — list each with the number of relevant vacancies found (or zero).

**Registered vs not registered:** a platform counts as registered only if the profile marks a confirmed login for it (see `modes/onboarding.md`, platform onboarding). Everything else is search-only (Universal rule 9). The user registers manually; after that she tells the skill, the platform is marked as registered and from the next run vacancies there are handled like on any other platform, including auto-apply.

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

### Step 4: LinkedIn search

Use advanced LinkedIn search — not only through "Jobs" but also:
- HR posts with hashtags: #hiring #vacancy #openrole #вакансия #открытавакансия
- Company pages → Jobs section
- Keyword search in posts

Capture direct vacancy links, not just company pages.

## Resume update

Trigger: user says "update resume", "I added a certificate", "upload new PDF" — or uploads a file.

1. Accept new file / link
2. Read contents
3. Compare with previous version — show diff: what was added, what changed
4. Update extracted skills and stack in profile
5. Confirm in user's language: «Резюме обновлено. Новые навыки [список] применены к поиску.»

---

## Source expansion

**Two modes:**
- **Quick scan (every daily run):** Step 2b (re-read known Telegram channels) described above.
- **Full discovery:** Steps 2b and 2c on the cadence `discovery_interval_days` (default 3), or when the user says «find new channels / platforms». Full procedure below.

### Deep scan procedure

- Re-verify current Telegram channels by `modes/telegram.md` (remove ones with no relevant vacancy in the last N days, N = `telegram_vacancy_max_age_days`)
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
