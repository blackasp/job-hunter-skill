---
name: "job-hunter"
description: "Universal job search automation skill. Triggers when the user wants to find a job, set up automated job search, get daily job reports, apply to vacancies automatically, or update their resume for search purposes. Use this skill for ANY job-hunting task: initial setup, daily search runs, resume updates, platform onboarding, Telegram channel discovery, or reviewing and applying to found vacancies. Activate immediately when the user says anything like \"find me a job\", \"set up job search\", \"I'm looking for work\", \"run today's search\", \"update my resume\", or \"which jobs match my profile\"."
---

# Job Hunter

An automated, universal job search system. Works for any profession, any geography, any language. The user sets it up once — and gets daily reports with relevant vacancies, auto-applications where possible, and smart filtering aligned to their profile.

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
```

After the user responds:
- PDF → read contents, extract key skills, stack, experience
- Profile link → open in browser, read, extract data
- Save everything to `/areas/job-hunter-profile.md`

---

## Phase 2: Platform onboarding (after first profile setup)

Build a **personalized platform list** based on the profile. Priority logic (determined dynamically):

**Level 1 — highest probability for this profession/geo:**
- Russian-speaking IT → hh.ru + country HH domains (hh.kz, hh.uz, hh.ge, hh.am, cy.hh.ru, rabota.by), Habr Career, getmatch.ru, geekjob.ru
- International IT → LinkedIn, Indeed, Glassdoor, Wellfound, Remote.co
- Design → Behance Jobs, Dribbble Jobs, LinkedIn
- Marketing → LinkedIn, local job boards
- Finance / Analytics → LinkedIn, eFinancialCareers, local boards

**Level 2 — aggregators and niche platforms** (per profession)

**Level 3 — Telegram channels** (live, active — see Phase 2b)

Show the user the list with a reason for each platform. Ask them to:
1. Confirm the list (they can remove items)
2. Log in to each platform in their browser

**For each platform:**
- Open in browser, verify login
- Record **all domains** actually used (including auth.*, api.*, static.*, subdomains)
- Save the full domain list to profile

**Permission rule — ONCE ONLY:** After confirming each platform, show the user the complete domain list and ask them to add ALL of it to "Always allowed" in browser settings. Explain: this prevents daily re-prompts. Example for hh.ru: `hh.ru, hh.kz, hh.uz, hh.ge, hh.am, cy.hh.ru, rabota.by, auth.hh.ru, api.hh.ru, static.hh.ru`. **Never ask for permissions again after onboarding.**

### Phase 2b: Telegram channel discovery

Go to tgstat.ru and telemetr.io. Search using profession keywords.

**Live channel criteria:** last post ≤ 7 days ago, ≥ 10 job posts/month, > 500 subscribers.
**Skip if:** last post > 30 days, < 3 job posts/month, mostly spam or course ads.

Find 5–15 live channels. Save to profile with date of last post. Open in web.telegram.org to verify access.

---

## Phase 3: Daily search run

**Before starting:** check `last_run_date` in profile. If it equals today's date — ask the user: "The daily search was already run today. Run again?" Do not re-run automatically.

**Also check for cold start:** if `last_run_date` is more than 14 days ago — notify the user: "Last run was [date]. Some platforms may need re-authorization, and some Telegram channels may have gone inactive. Running checks before search." Then: verify auth on each platform (mark any that need re-login), run Phase 5 channel activity check before searching.

### Step 1: Resume check

Read current resume from profile. Compare with previous version (hash or file date). If changed — re-read, update extracted skills and stack in profile, note at top of report: "📄 Resume updated — new skills applied to search."

If the user says "update resume" or uploads a new file — process immediately, don't wait for the next run.

### Step 2: Platform search

For each platform in priority order:
1. Open in browser (using saved sessions)
2. Apply search filters from profile
3. Collect vacancies not older than [profile setting, default 3 days]
4. Exclude already-seen (compare with history in memory)
5. Add to shared pool

**If browser hits a login page** — do NOT abort the run. Mark platform as "needs re-auth", continue with others, note in report.

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
2. **Geo check**: remove if not remote or wrong region
3. **Salary**: remove if below threshold (when listed); vacancies with no salary listed — keep
4. **Freshness**: remove if older than profile limit
5. **Deduplication**: remove if same company + role already in history

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
  // vac.employment?.id === 'probation' means HH classified this as an internship
  if (vac && vac.employment?.id === 'probation')
    return { pass: false, reason: 'probation-hh' };

  const titleOnly = (name || '').replace(/\s+/g, ' ').trim();
  const full = (titleOnly + ' ' + (desc || '')).replace(/\s+/g, ' ');

  // Pass 1 — title only (role match + junior/intern check)
  if (!/системный аналитик|system analyst|business analyst|technical business analyst|solutions analyst|integration analyst/i.test(titleOnly))
    return { pass: false, reason: 'not-SA-BA' };
  // Bug 1 fix: added стажёром|ученик to Russian intern regex; added apprentice to W()-pattern
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

**Initialise `filterFull` once** at the top of each browser session, before the apply loop. The same function covers both hh.ru and all other platforms — just pass the vacancy title, description text, and vacancy object as arguments.

**False positives — do NOT block** (confirmed safe): "нефункциональные требования (ИБ, нагрузка)"; "понимание основ ИБ" in the "желательно" section; "консультирование junior-аналитиков"; "дашборды" listed as one of many tasks; "государственные структуры" in a client-list context; "командировки" appearing in a product name; "тестовое задание".

### Step 6: Auto-applications

**Limit per run: maximum 10 auto-applications per day** (hh.ru enforces a daily cap; exceeding it triggers captcha or account block). If more than 10 vacancies pass filters — apply to the top 10 by ranking score, add the rest to "interesting but not applied" section of the report.

**Before sending any applications** — show the user a brief list: "Found N vacancies to apply to. Top 10 will be submitted automatically. Continue?" Wait for confirmation. This prevents accidental mass-applying.

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
7. Add a delay of 800ms minimum between applications to avoid rate limiting
8. Record in `window.__confirmedApplied` as `{id, title, company, url}` (see Bug 3 fix above)

**Application counting:** Only count vacancies where the submit returned HTTP 200. Status 403 (already applied) goes to "already applied" list. Status 429 (rate limit) → stop the loop immediately. Any other error → "failed" list. Never increment the counter for failed or blocked requests.

**Captcha detection:** If the apply function returns `{blocked: true}` — stop the entire application loop immediately. Log the captcha hit and add remaining vacancies to "action required" in the report.

**If vacancy requires a test task** — do NOT auto-apply. Add to `window.__testAssignments` and report separately (see Bug 4 fix above).

**If application requires email / form** — add to "action required" list in report.

### Cover Letter Framework

**Bug 5 fix — mandatory 5-part structure (November 2026):**

> **Root cause:** Previous format instructions did not enforce a greeting, self-presentation, or explicit vacancy comparison. The resulting letters started mid-sentence ("Меня привлекает эта позиция в :"), omitted the greeting and self-intro, and failed to explicitly compare the candidate's experience against the vacancy requirements.

Each cover letter **must** consist of exactly 5 parts in this order. Skipping any part is not allowed.

**Part 1 — Greeting**
Address the team or company by name. If the vacancy mentions a hiring manager's name — use it.
Example: *"Добрый день, команда [Company]!"* / *"Hello, [Company] team!"*

**Part 2 — Self-presentation** (1 sentence)
One sentence stating the candidate's specific specialization relevant to this vacancy. Must NOT be generic — must name the specific role or domain.
Example: *"Я — системный аналитик с 6+ летним опытом интеграций и API в B2B SaaS."*

**Part 3 — Relevant experience** (2–3 sentences)
Only experience that matches THIS vacancy's requirements. Pick 2–3 concrete achievements or skills from the resume that overlap with the vacancy. Do NOT copy-paste from resume wholesale.
Example: *"В Handysay я выстраивала аналитику с нуля — от ТЗ на интеграции до A/B-тестов на 50k пользователей."*

**Part 4 — Vacancy comparison** (2–3 sentences)
Explicit point-by-point mapping to the vacancy requirements. Reference something specific from the vacancy description. Use phrasing like: *"Ваши требования к X — именно то, чем я занималась в Y"* / *"Your requirement for X matches my experience with Y at Z."*

**Part 5 — Closing** (1 sentence)
Express readiness to discuss the vacancy in more detail.
Example: *"Буду рада рассказать подробнее на встрече."* / *"Happy to discuss further in a call."*

**Total length: 7–10 sentences. No more, no less.**

**Rules that apply to all parts:**
- Every claim must be verifiable against the resume — no invented achievements
- Use the company's own language from the vacancy description
- Match the vacancy's language (Russian vacancy → Russian letter; English vacancy → English letter)
- Never mention salary
- Never restate the resume in paragraph form
- Never use generic openers, never start mid-sentence: "I am writing to express my interest...", "Меня привлекает эта позиция в :"
- Never apologize for gaps or missing skills
- Never start with Part 3 or Part 4 — the greeting and self-presentation are mandatory first

**Anti-patterns (do NOT do this):**
- Starting with experience without greeting: *"Меня привлекает эта позиция в : мой опыт разработки..."* — missing Part 1 and Part 2
- Skipping Part 4 — writing about own experience without explicitly mapping it to the vacancy requirements
- Ending on experience without a closing sentence (Part 5)

**Before writing:** extract from the vacancy — company name, hiring manager name (if any), product/service, top 2–3 required skills. Cross-reference with resume. Write all 5 parts in order.

### Step 7: Report

Create an artifact — daily report. Write in the user's chosen language.

```
# 🔍 Job Search Report — [date]

## 📊 Summary
- Vacancies found: N
- After filtering: N
- Auto-applied (confirmed HTTP 200): N
- Already applied earlier: N
- Require your action: N
- Test assignments (skipped auto-apply): N
- Failed / skipped: N

---

## ✅ Auto-applications [N confirmed]
// Bug 3 fix: iterate window.__confirmedApplied[] and output .title, .company, .url per entry
// NEVER use window.__confirmedApplied.length alone — always output each entry individually
[For each entry in window.__confirmedApplied — one per block:]
**[entry.title] — [entry.company]**
📎 [entry.url]  ← full https:// URL from the entry object
💼 Platform: ...
📝 Letter preview: "[first 15 words of cover letter]..."
📅 Published: [date]

---

## 🧪 Test assignments — apply manually [N]
// Bug 4 fix: output window.__testAssignments[] as a separate block
// These vacancies were NOT auto-applied; user must handle them manually
[For each entry in window.__testAssignments — one per block:]
**[entry.title] — [entry.company]**
📎 [entry.url]  ← full https:// URL
📝 Requires: test assignment before application

---

## ⚡ Require your action [N]
[For each — one per line:]
**[Role] — [Company]**
📎 [direct link — always a full https:// URL]
❓ Reason: test task / email application / registration required / captcha stopped run / direct link unavailable — open manually
📅 Published: [date]

---

## 🔶 Interesting — check yourself [N]
(Vacancies near filter thresholds or above the 10-application limit)
[For each: full direct link, role, company, why flagged]

---

## 📬 Invitations to interview (all active)
[Fetched from https://hh.ru/applicant/negotiations?filter=all — ALL invitations, not filtered by date]
[For each: role, company, date received, link]

---

## ⚠️ Technical notes
(Re-auth needed, dead channels, platforms skipped, captcha hit, connection lost, etc.)
```

After creating the report: update `last_run_date` to today in `/areas/job-hunter-profile.md`.

---

## Phase 4: Resume update

Trigger: user says "update resume", "I added a certificate", "upload new PDF" — or uploads a file.

1. Accept new file / link
2. Read contents
3. Compare with previous version — show diff: what was added, what changed
4. Update extracted skills and stack in profile
5. Confirm in user's language: "Resume updated. New skills [list] will be applied to next search."

---

## Phase 5: Source expansion (weekly or on request)

Runs automatically once a week, or when user says "find new channels / platforms".

- Check activity of current Telegram channels (remove ones with last post > 30 days)
- Search for new channels on tgstat.ru / telemetr.io
- Web search for new niche platforms: "[profession] job board [year]", "[profession] jobs Telegram"
- Update list in profile
- Include as separate block in next report: "Search sources updated: [added N, removed N]"

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

Save answers as `creative_profile` in `/areas/job-hunter-profile.md`. On subsequent runs — skip the interview, use saved profile. User can say "update my creative profile" to change it.

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

Create a separate artifact (never mix with job search report):

```
# 🎨 Creative Opportunities Report — [date]

## 📊 Summary
- Open calls: N (deadlines within [horizon from creative_profile, default 1 year])
- Residencies: N
- Art fairs (open applications): N
- Galleries (accepting submissions): N
- Expired / unverified links removed: N

---

## 📋 Open Calls & Competitions [N]
[For each — one per block:]
**[Name]**
🔗 [direct link to application page]
📅 Deadline: [date] / Rolling
💰 Fee: [amount or "free"]
📍 [location or "international / online"]
📝 [1-sentence description of what they're looking for]

---

## 🏡 Residencies [N]
[For each:]
**[Name] — [location]**
🔗 [link]
📅 Deadline: [date] / Rolling
⏱ Duration: [weeks/months]
💰 Stipend / accommodation: [yes/no/partial]
📝 [medium fit + 1-sentence note]

---

## 🖼 Art Fairs — open applications [N]
[For each:]
**[Fair name] — [city, year]**
🔗 [application page link]
📅 Application deadline: [date]
👤 Accepts: artists directly / galleries only / both
💰 Booth fee range: [if mentioned]

---

## 🏛 Galleries — accepting submissions [N]
[For each:]
**[Gallery name] — [city]**
🔗 [submissions page]
📬 How to submit: [email / online form / open call]
🎨 Medium focus: [what they show]
📝 [1-sentence note on fit]

---

## ⚠️ Notes
(Links that couldn't be verified, fairs that only accept galleries, calls outside the deadline horizon, etc.)
```

---

## What is stored in memory

File `/areas/job-hunter-profile.md`:
- `language`: chosen language (set in Phase 0)
- `security_checked: true` (set after Phase 0 completes)
- User profile: profession, keywords, geo, remote preference, salary threshold, experience level, exclusions
- Resume: file path / link / hash of last version / extracted skills and stack
- Platform list with priorities and full domain lists for permissions
- Telegram channel list with date of last post and last check
- Application history: vacancy ID, company, role, date, status
- `last_run_date`: date of last Phase 3 run
- `creative_profile`: medium, career stage, geography, what to find, deadline horizon (Phase 6)

---

## Key principles

**Don't stop on minor errors.** One platform down → continue with others, note in report. Never abort the full run.

**Permissions — once only.** Full domain list collected at onboarding, bulk-added by user. Never re-request.

**Cover letters — mandatory 5-part structure (Bug 5 fix).** (1) Greeting → (2) Self-presentation → (3) Relevant experience → (4) Vacancy comparison → (5) Closing. Total 7–10 sentences. Every claim verifiable against resume. Language matches vacancy. Never skip any part. Never mention salary.

**Report — artifact only.** Not in chat. Direct links to every vacancy in every section. Each vacancy on its own line — never comma-separated. URL must be a full `https://` address, never a platform name.

**Bug 3 fix reminder:** When generating the "Auto-applications" section of the report, always iterate `window.__confirmedApplied[]` and output each entry's `.title`, `.company`, and `.url` as a separate block. Using `.length` alone is a bug — it hides the links the user needs to track applications.

**Bug 4 fix reminder:** When generating the report, always output `window.__testAssignments[]` as a dedicated "Test assignments" section with full `.url` links. Also include the count in the PushNotification summary.

**Resume — live.** Check hash on every run. If changed → re-read and apply.

**Language — consistent.** Set once in Phase 0. Used everywhere: messages, onboarding, reports, cover letters, error notes.

**Auto-apply limit.** Max 10 per run. Confirm before sending. Count ONLY confirmed HTTP 200 responses — never count 403, 429, or errors.

**Cold start detection.** If last run > 14 days ago → verify auth and channel activity before searching.

**Captcha = full stop.** If captcha is detected during the application loop → stop immediately, move remaining vacancies to "action required", send PushNotification to the user.

**Network errors.** Wrap every fetch in try/catch. On error: increment failed counter, wait 1 second, continue to next vacancy. Never let a single network error abort the whole run.

**Browser state.** Before starting the application loop, verify that in-browser state variables (applied list, vacancy pool, resume hash) exist. If lost (e.g. bridge reconnect), re-collect from scratch before proceeding.

**Always notify on failure.** If the run is interrupted for any reason (captcha, connection loss, unhandled error) — send PushNotification so the user knows the task did not complete.

**User name.** Always fetch from `https://api.hh.ru/me` → `first_name`. Never invent or guess it.

**Invitations.** Show ALL active invitations (from `negotiations?filter=all`) without filtering by date.

**Salary check is mandatory before every apply.** `__checkSalaryPage(vacancyId, host)` must be called before every `__apply()` — including when resuming via `window.__resumeIdx`. Never use `window.__newCandidates` data for salary verification. (Bug 2 fix)

**Report links — always iterate the array.** When generating the "Auto-applications" section, always iterate `window.__confirmedApplied[]` and output each entry's `.title`, `.company`, `.url` as a separate block. Using `.length` alone is a bug — it hides the links. (Bug 3 fix)

**Test assignments — separate block.** `window.__testAssignments[]` must be output as a dedicated section in the report and in PushNotification summary with full `.url` links. (Bug 4 fix)

**Creative opportunities — deadline horizon.** Default is 1 year. User sets it once in the creative profile interview (3 months / 6 months / 1 year / custom). Can be changed anytime: "change deadline horizon to 3 months". Save to `creative_profile.deadline_horizon` in memory.