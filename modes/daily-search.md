# Mode: daily search run

## Daily search run

Order of the whole run: Step 0 journal + source ledger → 0a salary threshold → 1 resume → **Phase A: breadth sweep of EVERY mandatory source** (2a known platforms, 2b Telegram, 2c new platforms and channels, 4 LinkedIn) → **Phase B: depth** (reading descriptions, filtering with `references/filters.md`, applications with `modes/apply.md`) → report (`modes/report.md`) → final journal entry.

### Why this order (root cause of the skipped sources, 2026-11-11)

In the run of 2026-11-11 only hh.ru was searched. The previous instructions said «for each platform in the list: collect ALL pages», put hh.ru first, and let filtering, description reading and applying of that platform's results run before the next platform was touched. One platform with hundreds of vacancies (361 candidates, one page request every 4–8 s for page browsing and for every description, then applications with fixed pacing) consumed the whole run; nothing forced the other sources to be visited first, nothing recorded a per-source status, and the journal was written only at the end, so skipped sources left no trace and the run was explained with an unconfirmed «not enough time». The rules below remove each of these causes.

### Mandatory sources and the source ledger (every run)

**Mandatory sources** = every platform in the profile's platform list (hh.ru and its country domains, Geekjob, Habr Career, GetMatch, Hirify, LinkedIn, jobtoo, talent-move and any other platform the profile lists, including search-only ones) **plus** every channel in the profile's Telegram channel list **plus** discovery of new platforms and channels (Steps 2c, 2b). If the profile lists fewer platforms than named here, the missing ones are added to the ledger as sources to verify.

**Source ledger.** At Step 0 write one ledger row per mandatory source into the run journal (`references/run-journal.md`), status «не начат». Update the row right after the source is processed (not at the end of the run). Allowed final statuses — exactly these four:

| Status | Meaning | Required in the row |
|---|---|---|
| проверен | the search was actually executed for the profile keywords | pages / posts read, vacancies seen, vacancies that passed filters |
| недоступен | the source could not be opened or searched | concrete evidence: URL, HTTP status or browser error text, time, and what was tried (cloud fetch → Chrome extension → built-in browser) |
| не поддерживает нужный поиск | opened, but no way to search by role / remote / date | what exactly is missing on the page |
| не проверен | the search was not executed | the concrete reason (see «Confirmed reasons») and what is needed to continue |

«Проверен» without executed search steps and numbers is not allowed.

**Confirmed reasons (the only ones allowed).** A skip or stop must be backed by something visible in the session: an error message or HTTP status, a captcha or login page, a block (`blocked: true`, 429), a missing login, a tool absent from the session, a limit quoted from a tool result, or an explicit instruction from the user. «Время закончилось», «не хватило времени», «слишком долго», «контекст закончился», «лимит» without a quoted source are forbidden. The session has no time limit unless a tool or error says so; if a limit is suspected, find it from the available tools / the error text and report it as it is with the time of observation, otherwise carry on. A long search on one platform is not a reason.

**Run order rules (mandatory):**
1. **Phase A first.** Sweep every mandatory source before deep work on any of them. In Phase A read only list/search pages (titles, companies, links, dates, salary shown in the list) within the freshness threshold and the pagination rules of Step 2a; do **not** read descriptions and do **not** apply yet.
2. **One source never blocks the others.** A source that returned many results or pages does not end the run and does not delay the next source. A source that is unreachable, asks for a login or shows a captcha gets its ledger row, and the run continues with the next source.
3a. **Per-run cap.** If the profile has `max_candidates_per_run` (user setting, e.g. 30) and the filtered candidates of all sources exceed it, Phase B processes (description reading, applications, report rows) only that many, newest first, taken round-robin across sources. The cap never limits Phase A: every source is still swept. The rest are not lost: the journal lists them as «отложено по лимиту пользователя (N шт.)», and they come first in the next run. This is a confirmed reason (an explicit user instruction).
3. **Round-robin in Phase B.** Process candidates of sources in rounds (a batch of up to 20 candidates per source, then the next source), so that a platform with hundreds of candidates cannot push out the others. Remaining candidates continue in later rounds of the same run.
4. **Use the pacing waits.** Waits required by `modes/apply.md` («Pacing») are working time: while waiting on one platform, process the next source or batch. Never run vacancy pages of the same platform in parallel.
5. **No unfinished ledger.** Before the report every ledger row has one of the four statuses; «не начат» rows are processed first or become «не проверен» with a confirmed reason.
6. **No assumption about limits.** Do not shorten the run because it «has been long»; continue until all ledger rows are final and all candidates are processed, or a confirmed reason stops a specific source.

### Source statuses in the report

The one-line summary of the report (`modes/report.md`) names the status of every mandatory source, e.g. «hh.ru: проверен (5 стр., 431/32); Geekjob: недоступен (ERR_CONNECTION_RESET, 18:12); Hirify: не проверен (нет входа, нужен вход)». Every «недоступен» / «не проверен» source is also listed in «Что сделать вручную» with the exact action needed.

**Before starting:** check `last_run_date` in profile. If it equals today's date — ask the user: "Поиск уже был запущен сегодня. Запустить снова?" Do not re-run automatically.

**Also check for cold start:** if `last_run_date` is more than 14 days ago — notify the user: "Последний запуск был [дата]. Некоторые платформы могут требовать повторной авторизации." Then: verify auth on each platform (mark any that need re-login), run a full discovery (Step 2b) before searching.

### Step 0: Open the run journal

Before anything else open the run journal (see `references/run-journal.md`). **If `run_journal_url` is missing or the document does not exist, create it now (not at the end) and save its link to the profile.** Note the start time, read `last_run_date` and `last_full_discovery_date`, and decide the discovery type for this run (Step 2b). Create the source ledger (see above) and write it to the journal with all rows «не начат». Record the start and end time of every step using real clock readings and update each ledger row right after its source is processed. If the journal cannot be written, keep the entries in the session, state the actual error, and show the statuses in the report summary line.

### Step 0a: Salary threshold for this run

If the profile has no `salary_floor`, ask the user ONCE at the very start of the run: «Минимальный порог зарплаты для этого поиска? (можно в рублях, долларах или евро, или «без порога»)». Use the answer for this run only; do not write it into the skill or the repository. If the user answers «без порога» or does not answer, run with no salary filter. If the profile has `salary_floor`, do not ask. The threshold may be given in any currency; compare using the conversion in the hh.ru salary check below, and treat equivalents in USD/EUR/RUB as the same threshold.

### Step 1: Resume check

Read current resume from profile. Compare with previous version (hash or file date). If changed — re-read, update extracted skills and stack in profile, note at top of report: "📄 Резюме обновлено — новые навыки применены к поиску."

If the user says "update resume" or uploads a new file — process immediately, don't wait for the next run.

### Step 2: Platform search

**Step 2a — Search known platforms (Phase A: list pages only, every platform in the saved list)**

For each platform in the saved list (priority order), one after another, without starting deep work on any of them (see «Run order rules»):
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
7. Record per platform in its ledger row and for the report summary: status and «[Platform]: N страниц, M вакансий проверено, K прошли фильтр» (K is filled after Phase B).
8. Platforms without a confirmed login for applying are still searched (search-only).
9. Skip silently any vacancy listed in the profile's `manual_reviewed`.

**If browser hits a login page** — do NOT abort the run. Mark platform as "needs re-auth", continue with others, note in report.

**Proxy blocking (ERR_CONNECTION_RESET, 403, timeout):** some platforms are often unreachable from Anthropic's cloud proxy (for Russian-language boards this is common). When a cloud fetch or WebFetch fails for them:
1. Switch to the Chrome browser extension (`mcp__claude-in-chrome__navigate`) — it goes through the user's own network, not Anthropic's proxy.
2. If Chrome also fails — mark the platform «⚠️ недоступна из браузера» in the report and add it to «Что сделать вручную».
3. Never mark a known platform as «новая» just because it was unreachable — it stays in the known list.

**Step 2b — Telegram channels (every run, BEFORE the web search for platforms)**

Discovery runs in two modes, chosen from the journal:

- **Quick scan (every run).** Re-read only the new posts (since the last run) of the channels already in the profile's Telegram channel list, using the method in `modes/telegram.md`; every channel is a ledger row. Extract vacancies and filter them like everything else (`references/filters.md`).
- **Full discovery (when `last_full_discovery_date` is older than `discovery_interval_days` from the profile — default 7 days, as agreed with the user — or the user asks, or the quick scan failed).** Run the discovery and verification steps of `modes/telegram.md` (clarify role from the profile, discover, verify by posts, collect), before the web search in Step 2c. Besides the usual sources, look for **recently published lists and recommendations** (articles, posts, forum threads, channel digests) of Telegram channels and job platforms for the user's field. Collect only what fits the user's profile (field, role, work format, geography, language). Newly verified channels are **added to the profile's Telegram channel list automatically**; channels that failed verification are not added (mention them in the report limits). New channels appear in the report as rows of «Список новых платформ этого запуска» (platform type: Telegram-канал, link, vacancies found, added to profile: yes/no).
- After a full discovery write `last_full_discovery_date` (today) to the profile and to the journal.

**Step 2c — Web search for new platforms (on a full-discovery run, every `discovery_interval_days`, default 7)**

On a full-discovery run (same cadence and journal date as Step 2b) do a web search to discover job boards and aggregators not yet in the saved list. Between full-discovery runs the discovery rows of the ledger get the status «не проверен — по графику, следующая полная проверка [date]» (the agreed cadence is a confirmed reason); all known platforms and known Telegram channels are still checked on every run. A full-discovery run that is due is never skipped without a confirmed reason (see «Confirmed reasons»). It supplements — never replaces — the known platforms.

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

### Step 4: LinkedIn search (mandatory source, Phase A)

LinkedIn is a mandatory source with its own ledger row. Without a login or when the page asks for one, the status is «не проверен» or «недоступен» with the exact page text, never silently dropped. Use advanced LinkedIn search — not only through "Jobs" but also:
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
- **Full discovery:** Steps 2b and 2c on the cadence `discovery_interval_days` (default 7), or when the user says «find new channels / platforms». Full procedure below.

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
