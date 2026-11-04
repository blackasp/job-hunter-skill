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

### Step 6: Auto-applications

**Limit per run: maximum 10 auto-applications per day** (hh.ru enforces a daily cap; exceeding it triggers captcha or account block). If more than 10 vacancies pass filters — apply to the top 10 by ranking score, add the rest to "interesting but not applied" section of the report.

**Before sending any applications** — show the user a brief list: "Found N vacancies to apply to. Top 10 will be submitted automatically. Continue?" Wait for confirmation. This prevents accidental mass-applying.

For each vacancy in the confirmed top-10:

**If platform supports browser-based application:**
1. Open the vacancy
2. Verify URL contains vacancy ID (`/vacancy/\d+`) — if not, construct it: `https://hh.ru/vacancy/${vacancyId}`
3. Check vacancy is still live: if HEAD request returns 404, skip it and note in report
4. Find the apply button
5. Write a cover letter using the Cover Letter Framework below
6. Submit — wait for HTTP 200 response before counting as applied
7. Add a delay of 800ms minimum between applications to avoid rate limiting
8. Record in application history with `{title, company, url, status: 200}`

**Application counting:** Only count vacancies where the submit returned HTTP 200. Status 403 (already applied) goes to "already applied" list. Status 429 (rate limit) → stop the loop immediately. Any other error → "failed" list. Never increment the counter for failed or blocked requests.

**Captcha detection:** If the apply function returns `{blocked: true}` — stop the entire application loop immediately. Log the captcha hit and add remaining vacancies to "action required" in the report.

**If vacancy requires a test task** — do NOT auto-apply. Add to separate list in report.

**If application requires email / form** — add to "action required" list in report.

### Cover Letter Framework

Cover letters must be **short** (3–5 sentences, 80–120 words maximum). Hiring managers don't read long letters. Each letter is unique and specific to this vacancy — never a template.

**Choose the format based on role type:**

**Format A — Problem-Solution** (default for most roles):
> Sentence 1: Name a specific challenge the company likely faces (based on vacancy text or company context).
> Sentence 2: State how your experience directly addresses that challenge — one concrete example with a result.
> Sentence 3: Connect your specific skills from resume to their specific needs in this vacancy.
> Sentence 4: Brief call to action — availability for a call.

**Format B — Achievement-First** (for technical / results-driven roles, e.g. developer, analyst, QA):
> Sentence 1: Lead with your single most relevant qualification or achievement for this role.
> Sentence 2: Connect it to the vacancy's key requirement with a specific number or outcome.
> Sentence 3: One sentence on why this company / product is interesting to you — specific, not generic.
> Sentence 4: Call to action.

**Format C — Story Hook** (for creative, leadership, or mission-driven roles):
> Sentence 1: A brief moment or turning point that connects your path to this role — vivid, not clichéd.
> Sentence 2: How that experience shaped a skill or approach that matches this vacancy's needs.
> Sentence 3: Why this specific company is the right next chapter.
> Sentence 4: Call to action.

**Rules that apply to all formats:**
- Every sentence must be verifiable against the resume — no invented achievements
- Use the company's own language from the vacancy description
- Never mention salary
- Never restate the resume in paragraph form
- Never use generic openers: "I am writing to express my interest...", "I am a passionate professional..."
- Never apologize for gaps or missing skills
- Match skills mentioned in the cover letter exactly to skills listed in the resume

**Before writing:** extract from the vacancy — company name, product/service, key challenge, top 2–3 required skills. Cross-reference with resume. Pick the format. Write.

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
- Failed / skipped: N

---

## ✅ Auto-applications [N confirmed]
[For each — one per line:]
**[Role] — [Company]**
📎 https://hh.ru/vacancy/[ID]  ← full working URL, never platform name alone
💼 Platform: ...
📝 Letter preview: "[first 15 words of cover letter]..."
📅 Published: [date]

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

---

## Key principles

**Don't stop on minor errors.** One platform down → continue with others, note in report. Never abort the full run.

**Permissions — once only.** Full domain list collected at onboarding, bulk-added by user. Never re-request.

**Cover letters — short and specific.** 80–120 words. Specific to this vacancy. Every claim verifiable against resume. Format chosen per role type. Never mention salary.

**Report — artifact only.** Not in chat. Direct links to every vacancy in every section. Each vacancy on its own line — never comma-separated. URL must be a full `https://` address, never a platform name.

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
