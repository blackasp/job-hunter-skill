---
name: "job-hunter"
description: "Universal job search automation skill. Triggers when the user wants to find a job, set up automated job search, get daily job reports, apply to vacancies automatically, or update their resume for search purposes. Use this skill for ANY job-hunting task: initial setup, daily search runs, resume updates, platform onboarding, Telegram channel discovery, or reviewing and applying to found vacancies. Activate immediately when the user says anything like \"find me a job\", \"set up job search\", \"I'm looking for work\", \"run today's search\", \"update my resume\", or \"which jobs match my profile\"."
---

# Job Hunter

An automated, universal job search system. Works for any profession, any geography, any language. The user sets it up once — and gets daily reports with relevant vacancies, auto-applications where possible, and smart filtering aligned to their profile.

---

## ⚠️ MANDATORY RULES (never override, never forget)

These rules apply to EVERY run, EVERY document, EVERY cover letter:

1. **Language: always Russian** — all messages, reports, cover letters, error notes. No exceptions.
2. **Never call the user a "бизнес-аналитик" or "business analyst"** — only «системный аналитик» or «фулстек-аналитик». Applies to cover letters, reports, and all messages.
3. **Never mention salary in cover letters** — it leads to rejections. This is an absolute prohibition.
4. **Remote РФ — always exclude** — vacancies that say «удалённо по России», «резидентство РФ», «только граждане РФ», or list only Russian regions as location. The user does not live in Russia.
5. **All links must be clickable** — in documents use `[anchor text](https://full-url)` format. Never put bare URLs without hyperlink markup.
6. **All links must be verified** — after composing any document with vacancy links, verify EVERY link by navigating to it in the browser (or HEAD request). If a site returns ERR_CONNECTION_RESET, 404, or «Не удаётся получить доступ» — remove that vacancy/line from the document entirely or mark clearly as «⚠️ сайт недоступен». A document with unverified links is not complete.
7. **Cover letter — 5-part mandatory structure** — see Cover Letter Framework section. Total 7–10 sentences. No salary. No «бизнес-аналитик».

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
|-------|----------|----------|
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
8. What to exclude? (technologies, industries, company types, formats): ___
9. Resume language (your language / English / both): ___
10. Where is your resume?
    a) I'll upload a PDF now
    b) Link to a profile (LinkedIn, hh.ru, etc.) — paste URL
    c) Both
11. Work authorization: in which countries do you have a legal right to work?
    (This determines which vacancies require permits you don't have — those will be flagged, not hidden.)
12. English level: A1 / A2 / B1 / B2 / C1 / C2 / Native
    (Vacancies requiring a higher level than yours will be flagged in the report.)
```

After the user responds:
- PDF → read contents, extract key skills, stack, experience
- Profile link → open in browser, read, extract data
- Save everything to `/areas/job-hunter-profile.md`, including:
  - `work_permit_countries: [list]` — countries where user can legally work without sponsorship
  - `english_level: [B1/B2/C1/etc]`

---

## Phase 2: Platform onboarding (after first profile setup)

Build a **personalized platform list** based on the profile. The list has two parts:

### Part A — Known platforms (fixed baseline)

Priority logic (determined dynamically by profession + geo):

**Level 1 — highest probability for this profession/geo:**
- Russian-speaking IT → hh.ru + country HH domains (hh.kz, hh.uz, hh.ge, hh.am, cy.hh.ru, rabota.by), Habr Career, getmatch.ru, geekjob.ru, hirify.me, jobtoo.ru, talent-move.ru
- International IT → LinkedIn, Indeed, Glassdoor, Wellfound, Remote.co, hirify.me
- Design → Behance Jobs, Dribbble Jobs, LinkedIn
- Marketing → LinkedIn, local job boards
- Finance / Analytics → LinkedIn, eFinancialCareers, local boards

**hirify.me specifics:** AI-powered job matching platform. Supports resume upload and automatic vacancy matching. Check the personal feed on each run (login required). URL: https://hirify.me/

**Level 2 — aggregators and niche platforms** (per profession)

**Level 3 — Telegram channels** (live, active — see Phase 2b)

### Part B — Web search for new platforms (run ONCE at onboarding, then at Phase 5)

See Phase 5 for the full web search procedure. Run it now to discover platforms the fixed list doesn't cover.

Show the user the combined list (fixed + newly discovered) with a reason for each platform. Ask them to:
1. Confirm the list (they can remove items)
2. Log in to each platform in their browser

**For each platform:**
- Open in browser, verify login
- Record **all domains** actually used (including auth.*, api.*, static.*, subdomains)
- Save the full domain list to profile

**Permission rule — ONCE ONLY:** After confirming each platform, show the user the complete domain list and ask them to add ALL of it to "Always allowed" in browser settings. Explain: this prevents daily re-prompts. Example for hh.ru: `hh.ru, hh.kz, hh.uz, hh.ge, hh.am, cy.hh.ru, rabota.by, auth.hh.ru, api.hh.ru, static.hh.ru`. **Never ask for permissions again after onboarding.**

### Phase 2b: Telegram channel discovery

**Priority channels (always check on every run, regardless of discovery step):**
- @jobs_it — IT job postings channel (https://t.me/jobs_it)
- @runello_jobs_analyst — analyst-specific job postings (https://t.me/runello_jobs_analyst)
- @foranalysts — analyst community with job postings

For additional channel discovery: go to tgstat.ru and telemetr.io. Search using profession keywords.

**Live channel criteria:** last post ≤ 7 days ago, ≥ 10 job posts/month, > 500 subscribers.
**Skip if:** last post > 30 days, < 3 job posts/month, mostly spam or course ads.

Find 5–15 live channels. Save to profile with date of last post. Open in web.telegram.org to verify access.

---

## Phase 3: Daily search run

**Before starting:** check `last_run_date` in profile. If it equals today's date — ask the user: «Поиск уже был запущен сегодня. Запустить снова?» Do not re-run automatically.

**Also check for cold start:** if `last_run_date` is more than 14 days ago — notify the user: «Последний запуск был [дата]. Некоторые платформы могут требовать повторной авторизации.» Then: verify auth on each platform (mark any that need re-login), run Phase 5 channel activity check before searching.

### Step 1: Resume check

Read current resume from profile. Compare with previous version (hash or file date). If changed — re-read, update extracted skills and stack in profile, note at top of report: «📄 Резюме обновлено — новые навыки применены к поиску.»

If the user says "update resume" or uploads a new file — process immediately, don't wait for the next run.

### Step 2: Platform search

**Step 2a — Search known platforms**

For each platform in the saved list (priority order):
1. Open in browser (using saved sessions)
2. Apply search filters from profile
3. Collect vacancies not older than [profile setting, default 3 days]
4. Exclude already-seen (compare with history in memory)
5. Add to shared pool

**If browser hits a login page** — do NOT abort the run. Mark platform as "needs re-auth", continue with others, note in report.

**hirify.me specifics:** Open https://hirify.me/, log in if needed, navigate to the personal vacancy feed / matches section. Extract matched vacancies. If the platform returns a 401 or requires manual login — mark as "needs re-auth" in report and continue.

**jobtoo.ru specifics:** Open https://jobtoo.ru/, search by keyword «системный аналитик» with remote filter. Extract vacancy links and titles. Can also be contacted directly via vacancies posted there.

**talent-move.ru specifics:** Open https://talent-move.ru/, search by keyword «системный аналитик» with remote filter. Extract vacancy links and titles. Can also be contacted directly via postings.

**Step 2b — Web search for new platforms (every run)**

On EVERY daily run, do a quick web search to discover job boards and aggregators not yet in the saved list. This supplements — never replaces — the known platforms.

Search queries to run (adapt keywords to the user's profession and language):
```
"[profession] jobs remote [current year]" site:reddit.com OR site:news.ycombinator.com
"[profession] job board [current year]"
"best sites [profession] remote jobs [current year]"
"[profession] вакансии удалённо [current year] сайты"
```

For each newly found platform:
- Check if it's already in the saved list — skip if yes
- Open the platform, run a quick search for the user's keywords
- If relevant vacancies found → add to this run's pool AND propose adding to the saved list in the report
- If no relevant results → note in report as «проверили, подходящих нет» and skip next time

Report new platforms found in a dedicated section: **«🆕 Новые платформы — результаты поиска»** — list each with the number of relevant vacancies found (or zero).

**hh.ru-specific checks (apply when searching hh.ru):**

**Data structure:** hh.ru page state (`HH-Lux-InitialState`) uses different field names than the REST API. Always handle both:
- Vacancy ID: use `v.vacancyId` (InitialState), not `v.id`
- Company name: `v.company?.name || v.company?.visibleName` (not `v.employer.name`)
- Salary object: `v.compensation` (not `v.salary`)
- Currency code: `c.currencyCode || c.currency?.code || c.currency || 'RUR'`
- Salary mode (frequency): `typeof c.mode === 'object' ? c.mode.$ : (c.mode || 'MONTH')`
- Publication date: `new Date(v.publicationTime?.$ || v.publicationTime?.['@timestamp'] * 1000)` — note: `@timestamp` is in seconds, not ms
- Work schedule (remote check): `v['@workSchedule'] === 'remote'` (not `v.schedule.id`)

**Search query:** Use NAME-syntax for title-only search to avoid false positives from job descriptions:
`https://hh.ru/search/vacancy?text=NAME%3A(системный+аналитик+OR+бизнес+аналитик)&work_format=REMOTE`

**Salary check:** Only reject a vacancy for low salary if compensation is explicitly stated AND has a numeric value. Vacancies with no salary (`!c || (!c.from && !c.to)` or `c.noCompensation`) must NOT be rejected — pass them through. For currency conversion, support USD and EUR directly:
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

**Fallback:** If web.telegram.org is unavailable or login fails — skip Telegram for this run, note in report, continue with other sources.

### Step 4: LinkedIn search

Use advanced LinkedIn search — not only through "Jobs" but also:
- HR posts with hashtags: #hiring #vacancy #openrole #вакансия #открытавакансия
- Company pages → Jobs section
- Keyword search in posts

Capture direct vacancy links, not just company pages.

### Step 5: Filtering and ranking

For each vacancy:
1. **Exclusion filters** (from profile): remove by stack, industry, level
2. **Geo check**: remove if not remote or wrong region; **Remote РФ ALWAYS excluded** — «удалённо по России», «резидентство РФ», «только граждане РФ», «только для граждан РФ» or only Russian cities listed
3. **Salary**: remove if below threshold (when listed); vacancies with no salary listed — keep
4. **Freshness**: remove if older than profile limit
5. **Deduplication**: remove if same company + role already in history
6. **Work permit check**: if the vacancy explicitly requires authorization to work in a country where the user does NOT have a permit → flag in report with label ⚠️ Требуется разрешение на работу. Show in separate section.
7. **English level check**: if the vacancy explicitly requires C1, C2, or "native/fluent English" AND the user's English level is below that threshold → flag with label ⚠️ Требуется уровень [C1/native]. Show in separate section.

After filtering — rank by relevance:
- Key skills match from resume
- Desired stack match
- Presence of "nice-to-haves" that are in the resume
- Salary level (when listed)

#### ⚠️ Critical: two-pass filter — all blockers must check the full text

**Confirmed bug (November 2026):** Applying to a vacancy that explicitly mentioned 1С in the description (but not in the title). Root cause: the title-only filter correctly blocked vacancies with 1С in the title, but the full-text filter (`filterFull`) was missing the 1С check for the description. The vacancy passed both passes and triggered an application.

**Rule:** Every exclusion filter from the user profile must be applied to the **combined full text** (title + description), not to the title alone. The title-only pass is only an optimisation to skip vacancies that obviously don't match the target role; it is not a substitute for checking the description.

**Two-pass pattern for hh.ru:**

```js
window.W = s => new RegExp('(^|[^а-яёa-z0-9])(?:' + s + ')([^а-яёa-z0-9]|$)', 'i');

window.filterFull = (name, desc, vac) => {
  // Bug 1 fix: check HH employment classification BEFORE regex filtering
  if (vac && vac.employment?.id === 'probation')
    return { pass: false, reason: 'probation-hh' };

  const titleOnly = (name || '').replace(/\s+/g, ' ').trim();
  const full = (titleOnly + ' ' + (desc || '')).replace(/\s+/g, ' ');

  // Pass 1 — title only
  if (!/системный аналитик|system analyst|business analyst|technical business analyst|solutions analyst|integration analyst/i.test(titleOnly))
    return { pass: false, reason: 'not-SA-BA' };
  if (/стажировк|стажер|стажёр|стажёром|ученик|ищем\s+стаж/i.test(titleOnly))
    return { pass: false, reason: 'intern' };
  if (W('junior|intern|trainee|apprentice').test(titleOnly))
    return { pass: false, reason: 'junior' };
  if (/младший\s+аналитик/i.test(titleOnly))
    return { pass: false, reason: 'junior' };
  if (W('bi').test(titleOnly))
    return { pass: false, reason: 'BI-title' };

  // Pass 2 — full text (title + description): ALL other blockers
  if (/аналитик[а-яё]*\s+данных|data\s+analyst|data\s+scientist|data\s+engineer|power\s*bi|qlik|visiology|дашборд/i.test(full))
    return { pass: false, reason: 'data-bi' };
  if (/1[\s]?[сc](?![а-яёa-z])/i.test(full))
    return { pass: false, reason: '1C' };
  if (/биллинг|billing/i.test(full))
    return { pass: false, reason: 'billing' };
  if (/\bdwh\b|data[\s-]?lake|data[\s-]?warehouse|greenplum/i.test(full))
    return { pass: false, reason: 'DWH' };
  if (/camunda|elma\b|bpmsoft|creatio\b|битрикс\s*24|directum[\s-]?rx|ms[\s-]dynamics|microsoft[\s-]dynamics|navision|siebel|\bsap\b/i.test(full))
    return { pass: false, reason: 'unknown-soft' };
  if (/diasoft|диасофт|colvir|автоматизированн[а-яё]*\s+банковск/i.test(full))
    return { pass: false, reason: 'banking-soft' };
  if (W('абс|abs|цфт|ибсо').test(full))
    return { pass: false, reason: 'banking-box' };
  if (/информационн[а-яё]*\s+безопасн|кибербезопасн|cyber[\s-]?security|appsec|devsecops|пентест|уязвимост|антивирус|\bngfw\b|\bфстэк\b|криптограф/i.test(full))
    return { pass: false, reason: 'infosec' };
  if (/сетев[а-яё]*\s+(технолог|оборудован|инфраструктур|протокол)|wi-?fi|маршрутизатор|коммутатор|систем[а-яё]*\s+хранения\s+данных|серверн[а-яё]*\s+(оборудован|инфраструктур)|виртуализац|гипервизор|дата-?центр|прошивк|firmware|асу\s*тп|scada|телеметри[а-яё]*/i.test(full))
    return { pass: false, reason: 'network-infra' };
  if (W('иб|soc|siem|dlp|sdn|схд|цод').test(full))
    return { pass: false, reason: 'infosec-word' };
  if (/блокчейн|blockchain|web\s?3|смарт[\s-]?контракт|smart\s+contract|ethereum|solidity|hyperledger|криптовалют|криптоактив|криптобирж|токенизац/i.test(full))
    return { pass: false, reason: 'blockchain' };
  if (W('dlt|nft|цфа').test(full))
    return { pass: false, reason: 'blockchain-word' };
  if (W('гост|гостов|еспд').test(full))
    return { pass: false, reason: 'gost' };
  if (/РД\s?50-34/i.test(full))
    return { pass: false, reason: 'gost-rd' };
  if (/госсектор|гос[а-яё]*\s*орган|государственн[а-яё]*\s+(заказчик|учрежден|структур|организац)|правительств|министерств|ведомств|муниципальн|госуслуг|госзакуп|public\s+sector|e-?government/i.test(full))
    return { pass: false, reason: 'gov' };
  if (W('фгуп|гку|гбу|b2g').test(full))
    return { pass: false, reason: 'gov-word' };
  if (/(^|\D)(44|223)[\s-]?фз/i.test(full))
    return { pass: false, reason: 'gov-law' };
  if (/командировк|выезд[а-яё]*\s+к\s+клиент|разъездн|только\s+москв/i.test(full))
    return { pass: false, reason: 'travel' };
  if (/удалённо\s+по\s+России|удаленно\s+по\s+России|резидентств[а-яё]*\s+РФ|только\s+для\s+граждан\s+РФ/i.test(full))
    return { pass: false, reason: 'RU-only' };
  if (/\bсбербанк|\bsberbank/i.test(full))
    return { pass: false, reason: 'sber' };

  return { pass: true };
};
```

**Initialise `filterFull` once** at the top of each browser session, before the apply loop.

**False positives — do NOT block** (confirmed safe): «нефункциональные требования (ИБ, нагрузка)»; «понимание основ ИБ» in the «желательно» section; «консультирование junior-аналитиков»; «дашборды» listed as one of many tasks; «государственные структуры» in a client-list context; «командировки» appearing in a product name; «тестовое задание».

### Step 6: Auto-applications

**Limit per run: maximum 10 auto-applications per day** (hh.ru enforces a daily cap; exceeding it triggers captcha or account block). If more than 10 vacancies pass filters — apply to the top 10 by ranking score, add the rest to «интересно — проверьте сами» section of the report.

**Before sending any applications** — show the user a brief list: «Найдено N вакансий. Топ-10 будут поданы автоматически. Продолжить?» Wait for confirmation.

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

**Application counting:** Only count vacancies where the submit returned HTTP 200. Status 403 (already applied) goes to «уже подавали» list. Status 429 (rate limit) → stop the loop immediately. Any other error → "failed" list.

**Captcha detection:** If the apply function returns `{blocked: true}` — stop the entire application loop immediately.

**If vacancy requires a test task** — do NOT auto-apply. Add to `window.__testAssignments` and report separately.

**If application requires email / form** — add to «требует действия» list in report.

### Cover Letter Framework

**Bug 5 fix — mandatory 5-part structure (November 2026):**

Each cover letter **must** consist of exactly 5 parts in this order. Skipping any part is not allowed.

**Part 1 — Greeting**
Address the team or company by name. If the vacancy mentions a hiring manager's name — use it.
Example: *«Добрый день, команда [Company]!»*

**Part 2 — Self-presentation** (1 sentence)
One sentence stating the candidate's specific specialization relevant to this vacancy. **NEVER use «бизнес-аналитик» or «business analyst» — only «системный аналитик» or «фулстек-аналитик».**
Example: *«Я — системный аналитик с 6+ летним опытом интеграций и API в B2B SaaS.»*

**Part 3 — Relevant experience** (2–3 sentences)
Only experience that matches THIS vacancy's requirements. Pick 2–3 concrete achievements or skills from the resume that overlap with the vacancy.

**Part 4 — Vacancy comparison** (2–3 sentences)
Explicit point-by-point mapping to the vacancy requirements. Reference something specific from the vacancy description.

**Part 5 — Closing** (1 sentence)
Express readiness to discuss the vacancy in more detail.
Example: *«Буду рада рассказать подробнее на встрече.»*

**Total length: 7–10 sentences. No more, no less.**

**Absolute prohibitions in cover letters:**
- ❌ Never mention salary
- ❌ Never call the user «бизнес-аналитик» or «business analyst» — only «системный аналитик» / «фулстек-аналитик»
- ❌ Never restate the resume in paragraph form
- ❌ Never use generic openers, never start mid-sentence
- ❌ Never apologize for gaps or missing skills
- ❌ Never skip any of the 5 parts

---

### Step 7: Report — Claude Docs document

**The daily report is a Claude Docs document** (not a chat message, not an HTML artifact). Create it via `mcp__Claude_Docs__batch` with `container.create`.

**Document structure — REQUIRED sections in this order:**

```
# Отчёт по поиску работы — [число месяца на русском]

[дата] · [mention пользователя]

[Краткое summary одной строкой: N авто-откликов на hh.ru, N TG-сообщений через Hirify, N вакансий требуют ручного отклика.]

## hh.ru — Авто-отклики [N]
Таблица: Вакансия | Платформа | Статус
(ссылки в формате [Название](https://hh.ru/vacancy/ID))

## Hirify.me — TG-сообщения отправлены [N]
Таблица: Компания | Должность | Платформа | HR | Статус

## Hirify.me — Требуют ручного отклика [N]
Таблица: Компания | Должность | Платформа | Как откликнуться

## Hirify.me — Заблокированы / Plus [N]
Таблица: Компания | Должность | Платформа | Причина

## Новые платформы — результаты поиска
Таблица: Платформа | Ссылка поиска | Результат

## Что сделать вручную
Нумерованный список с кликабельными ссылками на каждое действие.
```

**Rules for the document:**

1. **ALL links MUST be clickable** — format: `[anchor text](https://full-url)`. Never bare URLs. Applies to ALL sections — tables, lists, everywhere.
2. **Verify ALL links BEFORE finalizing** — after writing the document, navigate to each link in the browser. If a site returns ERR_CONNECTION_RESET, 404, or «Не удаётся получить доступ» — remove that row/item from the document or replace the link with «⚠️ сайт недоступен». A document with unverified links is NOT complete.
3. **Hirify short URL format** — use `https://hirify.me/jobs/[ID]` (no slug). These return HTTP 200.
4. **External career sites** — verify by navigating in browser (not `fetch()` — CORS will block). If unavailable, remove link.
5. **Document title** — in Russian, with the date in Russian format: «Отчёт по поиску работы — 5 ноября 2026».
6. **Link verification** — hh.ru and Hirify links: verify via fetch(url, {method:'HEAD'}) in browser console. External sites: open in browser tab directly.

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
- **Deep scan (weekly or on request):** full procedure below.

### Deep scan procedure

- Check activity of current Telegram channels (remove ones with last post > 30 days)
- Search for new Telegram channels on tgstat.ru / telemetr.io
- Run an expanded web search for new niche platforms and aggregators
- For each new platform found: open it, check if relevant vacancies exist, verify language requirement compatibility
- Update saved platform list in profile
- Include as separate block in next report: «Источники обновлены: добавлено N, удалено N, проверено N»

**Key rule:** Never limit discovery to a fixed predefined list. Discover fresh every week.

---

## Phase 6: Creative opportunities (on request)

A separate mode for artists, designers, and creative practitioners. Runs independently from the job search.

**Trigger phrases:** "find open calls", "find residencies", "find art fairs", «найди опен-коллы», «найди резиденции», «найди ярмарки»

**Before searching:** ask the user (once, save to profile):
1. Medium / format: digital art, AI art, painting, photography, light/sound installation, video, mixed media
2. Career stage: emerging / mid-career / established
3. Geography: open to international / Europe only / specific countries
4. What to find: Open calls & competitions / Residencies / Art fairs / Galleries
5. Deadline horizon: 3 months / 6 months / 1 year / custom. **Default: 1 year.**

Save answers as `creative_profile` in `/areas/job-hunter-profile.md`.

---

## What is stored in memory

File `/areas/job-hunter-profile.md`:
- `language`: chosen language
- `security_checked: true`
- User profile: profession, keywords, geo, remote preference, salary threshold, experience level, exclusions
- `work_permit_countries`: list of countries where user can legally work without sponsorship
- `english_level`: user's English level (A1–C2)
- Resume: file path / link / hash / extracted skills and stack
- Platform list with priorities and full domain lists
- Telegram channel list with date of last post
- Application history: vacancy ID, company, role, date, status
- `last_run_date`: date of last Phase 3 run
- `creative_profile`: medium, career stage, geography, what to find, deadline horizon

---

## Key principles

**🔴 MANDATORY RULES (highest priority, never override):**
- **Язык — всегда русский.** Все сообщения, отчёты, кавер-леттеры, технические заметки.
- **Никогда не называть пользователя «бизнес-аналитик».** Только «системный аналитик» или «фулстек-аналитик».
- **Зарплату в кавер-леттерах не упоминать.** Абсолютный запрет.
- **Remote РФ — всегда исключать.** Пользователь не живёт в России.
- **Все ссылки в документе — кликабельные.** Формат: `[текст](url)`. Без этого документ не считается завершённым.
- **Все ссылки — проверены.** Недоступные сайты (ERR_CONNECTION_RESET, 404) — строку удалить или пометить `⚠️ сайт недоступен`.

**Don't stop on minor errors.** One platform down → continue with others, note in report.

**Permissions — once only.** Full domain list collected at onboarding, bulk-added by user. Never re-request.

**Cover letters — mandatory 5-part structure (Bug 5 fix).** (1) Greeting → (2) Self-presentation → (3) Relevant experience → (4) Vacancy comparison → (5) Closing. Total 7–10 sentences. Never mention salary. Never say «бизнес-аналитик».

**Report — Claude Docs document.** Not in chat, not HTML artifact. Direct clickable links to every vacancy in every section.

**Bug 3 fix reminder:** Always iterate `window.__confirmedApplied[]` and output each entry's `.title`, `.company`, and `.url` as a separate block.

**Bug 4 fix reminder:** Always output `window.__testAssignments[]` as a dedicated section with full `.url` links.

**Resume — live.** Check hash on every run. If changed → re-read and apply.

**Auto-apply limit.** Max 10 per run. Confirm before sending. Count ONLY confirmed HTTP 200 responses.

**Cold start detection.** If last run > 14 days ago → verify auth and channel activity before searching.

**Captcha = full stop.** Stop immediately → move remaining to «требует действия» → notify user.

**Salary check is mandatory before every apply.** `__checkSalaryPage()` must be called before every `__apply()`. Never use cached data.

**Work permit — flag, never hide.** Vacancies requiring a work permit the user doesn't have go into a dedicated report section.

**English level — flag, never auto-reject.** Vacancies requiring C1/C2/native → dedicated report section.

**New platforms — every run.** Step 2b runs on every daily run, not just weekly.

**Link verification is not optional.** CORS blocks `fetch()` for external sites — navigate in browser tab directly.
