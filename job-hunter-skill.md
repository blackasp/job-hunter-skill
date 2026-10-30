---
name: "job-hunter"
description: "Universal job search automation: daily vacancy reports, auto-applications, resume tracking, Telegram channel discovery, multi-platform search, and open calls / grants / residencies search."
---

# Job Hunter

An automated, universal job search system. Works for any profession, any geography, any language. The user sets it up once — and gets daily reports with relevant vacancies, auto-applications where possible, and smart filtering aligned to their profile.

Also supports searching for **open calls, grants, and residencies** for creative practitioners — see Phase 6.

---

## ⚠️ EXECUTION RULES — READ BEFORE STARTING

These rules override everything else in this skill:

1. **Every phase is mandatory.** No phase may be skipped by your own decision. Ever.
2. **If a phase fails technically** (browser error, network issue, login wall, tool unavailable) — write the failure to the Technical Notes section of the report with the exact reason, then continue to the next phase automatically. Do not stop. Do not ask.
3. **If a phase is logically blocked** (e.g. Phase 2 was never completed and platform list is missing) — do the maximum possible without user input, note what is missing in the report, and continue.
4. **Never ask questions during an automated / scheduled run.** If the session was started by a scheduled task or the user is not present — proceed automatically at every step. Questions are only allowed during interactive onboarding (Phase 0–1) on the very first run.
5. **The report must always be created**, even if 0 vacancies were found or multiple phases failed. A failed run with a full Technical Notes section is better than silence.
6. **Do not invent shortcuts.** Using memory from a previous session does not replace running the phases. If a platform list exists in memory, use it — but still verify logins and run the search. If it does not exist, run Phase 2 to build it.

---

## Phase 0: Security check + language (very first run only)

**MANDATORY. Cannot be skipped on first run.**
Check memory for `/areas/job-hunter-profile.md`. If `security_checked: true` is present — Phase 0 is already complete, skip to Phase 1.

### Step 0a: Language selection

Ask the user in BOTH English and Russian simultaneously (language is unknown at this point):

```
🌐 Hello! / Привет!

In what language would you like to communicate and receive reports?
На каком языке вы хотите общаться и получать отчёты?

Please reply / Напишите:
English / Русский / Español / Deutsch / Français / 中文 / Other — specify
```

Save the chosen language as `language: [value]` in the profile. **Use this language for ALL subsequent messages, onboarding questions, reports, and error notes — without exception.**

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

**MANDATORY on first run. Skip entirely if profile already exists in memory with all required fields.**

Required fields: profession, keywords, geo, remote preference, salary threshold, exclusions, resume source, auto_apply_limit.

If ANY required field is missing — ask for it. Do not assume defaults for missing fields on first run.

**Profile source check:** Before asking anything, look for an existing profile in memory:
- Check `/areas/job-hunter-profile.md` — if it has all required fields → skip to Phase 2 check.
- Also check `/areas/job-search.md` — if it exists and contains job search criteria → offer to import: "I found an existing job search profile. Shall I use it as your base and just confirm a few details?" If user agrees, read that file, extract all available fields, pre-fill the profile, and ask only for missing fields. Save to `/areas/job-hunter-profile.md`.

If no existing profile found anywhere — run the full interview. Ask ALL questions in a single message, **in the user's chosen language**:

```
[Translated to user's language]

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
11. Auto-application limit per daily run:
    a) No limit — apply to all vacancies that pass filters
    b) Set a limit — how many per day? (e.g. 5, 10, 20)
    Tip: confirmation is always requested before sending, regardless of limit.
```

Save `auto_apply_limit: unlimited` or `auto_apply_limit: N` to profile.

After the user responds:
- PDF → read contents, extract key skills, stack, experience
- Profile link → open in browser, read, extract data
- Save everything to `/areas/job-hunter-profile.md`

**Changing the limit later:** If the user says "change my application limit", "set limit to N", "remove the limit" — update `auto_apply_limit` in profile immediately, confirm in their language. No re-onboarding needed.

---

## Phase 2: Platform discovery and onboarding

**MANDATORY. Must run on first use and whenever `platforms_ready: true` is NOT set in profile.**
**Cannot be replaced by a hardcoded list. Must be built dynamically for every user.**

### Step 2a: Discover platforms via web search

Before showing any list, actively search for platforms relevant to this user's profile. Run ALL of the following searches in parallel:

1. `"[profession] job board remote [year]"` — niche job boards for this profession
2. `"[profession] jobs remote salary [currency] site:reddit.com"` — community recommendations
3. `"remote jobs [profession] [geo region] [year]"` — geo-relevant platforms
4. `"best platforms to find remote [profession] jobs [year]"` — aggregator roundups
5. `"[profession] freelance platforms [year]"` — if freelance is relevant
6. Check known remote-first boards: Himalayas, Remote OK, We Work Remotely, Dynamite Jobs, JustRemote, DailyRemote, ARC (IT), CONTRA (freelance/no commission), Wellfound, Remote.co

From search results, extract: platform name, URL, what it's known for, whether it's free, whether it supports the user's geo.

**If web search fails** — fall back to the known boards list above, note in report: "Platform discovery search failed — using default list. Run Phase 5 to expand."

### Step 2b: Build personalized platform list

From discovered platforms, select the most relevant based on profile. Organize into priority levels:

**Level 1 — highest probability for this profession/geo** (select 3–5):
- Russian-speaking IT → hh.ru + country HH domains (hh.kz, hh.uz, hh.ge, hh.am, cy.hh.ru, rabota.by), Habr Career, getmatch.ru, geekjob.ru
- International IT/remote → LinkedIn, Himalayas, Remote OK, ARC, Wellfound
- Design → Behance Jobs, Dribbble Jobs, LinkedIn, CONTRA
- Marketing → LinkedIn, We Work Remotely, Remote OK
- Finance / Analytics → LinkedIn, eFinancialCareers, Himalayas
- Any remote role → We Work Remotely, Dynamite Jobs, JustRemote, DailyRemote, Remote OK

**Level 2 — secondary sources** (select 3–5 from discovered platforms):
- **CONTRA** (contra.com) — freelance marketplace, zero commission for the freelancer
- **HIMALAYAS** (himalayas.app) — shows salary range, timezone, and which countries the company hires from; transparent by design
- **DYNAMITE JOBS** (dynamitejobs.com) — 100% remote roles, each listing manually verified
- **WE WORK REMOTELY** (weworkremotely.com) — one of the largest remote job boards; use "Anywhere in the World" filter carefully (some listings are US-only despite the filter)
- **DAILYREMOTE** (dailyremote.com) — aggregator updated daily, strong for entry-level and mid-level
- **JUSTREMOTE** (justremote.co) — scrapes company career pages directly, fewer middlemen, less competition
- **REMOTE OK** (remoteok.com) — salary filter available; good for tech and design
- **ARC** (arc.dev) — IT and engineering only; profile-based, companies reach out to you rather than the reverse

**Level 3 — Telegram channels** (see Phase 2c)

### Step 2c: Telegram channel discovery

**MANDATORY step. Must be attempted even if result is 0 channels.**

Go to tgstat.ru and telemetr.io. Search using profession keywords.

**Live channel criteria:** last post ≤ 7 days ago, ≥ 10 job posts/month, > 500 subscribers.
**Skip if:** last post > 30 days, < 3 job posts/month, mostly spam or course ads.

Find 5–15 live channels. Save to profile with date of last post. Open in web.telegram.org to verify access.

**If tgstat.ru / telemetr.io are unavailable** — note in report: "Telegram channel discovery failed: [reason]. No Telegram channels added. Will retry on next Phase 5 run." Continue.

### Step 2d: Present list and get confirmation

Show the user the full platform list with a reason for each. Ask them to:
1. Confirm the list (they can remove items)
2. Log in to each platform in their browser

**For each platform:**
- Open in browser, verify login
- Record **all domains** actually used (including auth.*, api.*, static.*, subdomains)
- Save the full domain list to profile

**If a platform login fails** — mark it as "needs setup", note in report, continue with others.

**Permission rule — ONCE ONLY:** After confirming each platform, show the user the complete domain list and ask them to add ALL of it to "Always allowed" in browser settings. **Never ask for permissions again after onboarding.**

After completion: write `platforms_ready: true` and `platforms_built_date: [date]` to profile.

---

## Phase 3: Daily search run

**MANDATORY on every run. Cannot be skipped.**

**Before starting:** check `last_run_date` in profile. If it equals today's date — ask the user (interactive only): "The daily search was already run today. Run again?" In scheduled mode — skip and note in report.

**Cold start check:** if `last_run_date` is more than 14 days ago — notify the user: "Last run was [date]. Checking platform auth and channel activity before searching." Then: verify login on each platform (mark any needing re-auth), run Phase 5 channel check before proceeding.

**Platform list check:** if `platforms_ready: true` is NOT in profile — run Phase 2 first (interactive) or note in report that platforms were not set up and search will use defaults (scheduled).

### Step 1: Resume check

**MANDATORY. Must run before every search.**

Read current resume from profile. Compare with previous version (hash or file date).

**If resume not found in profile** — note in report: "Resume not found in profile. Search will run without resume matching. Add resume via Phase 4." Continue.

**If resume changed AND a search run is already in progress** — finish the current run using the previous resume version, then process the new resume, update the profile, and note at the top of the report: "📄 Resume updated mid-run — new skills will apply from the next search."

**If resume changed before the run starts** — re-read, update extracted skills and stack in profile, note at top of report: "📄 Resume updated — new skills applied to search."

**If user says "update resume" or uploads a new file mid-run** — acknowledge receipt, queue the update, finish current run, then process. Confirm: "Resume received. Will apply to next search."

### Step 2: Platform search

**MANDATORY. Must attempt every platform in the list.**

For each platform in priority order:
1. Open in browser (using saved sessions)
2. Apply search filters from profile
3. Collect vacancies not older than [profile setting, default 3 days]
4. Exclude already-seen (compare with history in memory)
5. Add to shared pool

**If browser hits a login page** — do NOT abort the run. Mark platform as "needs re-auth", note in Technical Notes, continue with next platform.
**If a platform is down or unreachable** — note in Technical Notes, continue with next platform.
**Never skip a platform silently.** Every skipped platform must appear in Technical Notes with the reason.

### Step 3: Telegram channel search

**MANDATORY if channels exist in profile. Must be attempted.**

Open web.telegram.org. Open each channel. Review posts from the last 24h (or since last run). Extract job links. If channels mention other active channels — add to check list.

**If web.telegram.org is unavailable or login fails** — note in Technical Notes: "Telegram search skipped: [reason]." Continue with other sources.

### Step 4: LinkedIn search

**MANDATORY if LinkedIn is in platform list.**

Use advanced LinkedIn search — not only through "Jobs" but also:
- HR posts with hashtags: #hiring #vacancy #openrole #вакансия #открытавакансия
- Company pages → Jobs section
- Keyword search in posts

Capture direct vacancy links, not just company pages.

**If LinkedIn is unavailable or login fails** — note in Technical Notes, continue.

### Step 5: Filtering and ranking

For each vacancy:
1. **Exclusion filters** (from profile): remove by stack, industry, level
2. **Geo check**: remove if not remote or wrong region
3. **Salary**: remove if below threshold (when listed)
4. **Freshness**: remove if older than profile limit
5. **Deduplication**: company + role pair must not exist in history. Same company + different role = keep. Same company + same role = remove.

After filtering — rank by relevance:
- Key skills match from resume
- Desired stack match
- Presence of "nice-to-haves" that are in the resume
- Salary level (when listed)

**If 0 vacancies remain after filtering** — do NOT silently create an empty report. Generate the report with zeros AND include a "Why nothing passed" breakdown:

```
## 🔍 Why 0 vacancies passed filters
- Found total: N
- Removed by exclusion filters (stack/industry/level): N — top reasons: [list top 3]
- Removed: not remote / wrong region: N
- Removed: salary below threshold: N
- Removed: already applied (history): N
- Removed: older than [X] days: N

Suggestion: consider relaxing [the filter that removed the most].
```

Also notify the user in chat (not just in the artifact): "Search complete — 0 vacancies passed filters today. Report has a breakdown. Consider adjusting [top filter]."

### Step 6: Auto-applications

Read `auto_apply_limit` from profile.

**If `auto_apply_limit: N`** — apply to the top N vacancies by ranking score. Vacancies beyond the limit go to "interesting but not applied" in the report.

**If `auto_apply_limit: unlimited`** — apply to all vacancies that passed filtering.

**Confirmation rule:**
- Interactive session: show confirmation before applying. Wait for user.
- Scheduled / automated session: apply automatically without asking. Note in report: "Auto-applied without confirmation (scheduled run)."

For each vacancy in the list:

**If platform supports browser-based application:**
1. Open the vacancy
2. Find the apply button
3. Write a cover letter using the Cover Letter Framework below
4. Submit
5. Record in application history

**If vacancy page loads but has no direct application URL** — attempt one additional click. If still unavailable — add to "action required" list with note "direct link unavailable — open manually".
**If vacancy requires a test task** — do NOT auto-apply. Add to separate list in report.
**If application requires email / form** — add to "action required" list in report.
**If application fails for any reason** — note in Technical Notes with vacancy link and error. Do not retry. Continue.

### Cover Letter Framework

Cover letters must be **short**: 4–5 sentences total (greeting + body + closing). Every letter is unique and specific to this vacancy — never a template, never reused.

**Before writing:** extract from the vacancy — company name, product/service, key challenge or need, top 2–3 required skills. Cross-reference with resume. Select format based on role type.

**Cover letter language rule:** Write in the **language the vacancy is posted in** — regardless of the user's profile language.

---

### Cover letter structure (mandatory for every letter)

Every cover letter must follow this 4-block structure:

**Block 1 — Greeting**
Address the hiring team by name if available; otherwise use a standard professional greeting:
- Russian: «Добрый день!» / «Здравствуйте!»
- English: «Hello [Name],» / «Dear Hiring Team,»
Never skip the greeting.

**Block 2 — Brief self-introduction (1 sentence)**
One sentence: role title + key differentiator relevant to this vacancy. Do NOT list experience years.
- Use the title the user goes by exactly as stored in profile.

**Block 3 — Body (2–3 sentences, vacancy-specific)**
Choose format based on role type:

**Format A — Problem-Solution** (default):
> S1: Specific challenge the company faces (from vacancy text).
> S2: How your experience addresses it — one concrete example with result.
> S3: Connect 1–2 resume skills to vacancy requirements using the company's own language.

**Format B — Achievement-First** (technical roles: developer, analyst, QA, data):
> S1: Most relevant qualification or achievement for this role.
> S2: Connect to vacancy's top requirement with a specific number or outcome.
> S3: Why this company/product is genuinely interesting — specific, not generic.

**Format C — Story Hook** (creative, leadership, mission-driven roles):
> S1: Brief vivid moment connecting career path to this role.
> S2: How that shaped a skill matching this vacancy's core need.
> S3: Why this company is the logical next step.

**Block 4 — Closing**
Short professional sign-off with name.
- Russian: «Готова рассказать подробнее на встрече. С уважением, [Имя]»
- English: «I'd be happy to discuss further. Best regards, [Name]»

---

**Rules for all formats:**
- All 4 blocks always present
- Every claim verifiable against resume — no invented achievements
- Use the company's own vocabulary
- Never mention salary
- Never restate the resume in paragraph form
- Never use generic openers: "I am writing to express my interest"
- Never apologize for gaps
- All skills mentioned must exist in the resume
- Write in the language of the vacancy
- Role title: use exactly what is stored in the user's profile — never substitute a different title

### Step 7: Report

**MANDATORY. Must always be created, even if all phases failed.**

Create an artifact — daily report. Write in the user's chosen language.

```
# 🔍 Job Search Report — [date]

## 📊 Summary
- Platforms searched: N of N
- Vacancies found: N
- After filtering: N
- Auto-applied: N
- Require your action: N

---

## ✅ Auto-applications [N]
[For each:]
**[Role] — [Company]**
📎 [direct link — always present; if unavailable, write "open manually"]
💼 Platform: ...
📝 Letter preview: "[first 15 words of cover letter]..."
📅 Published: [date]

---

## ⚡ Require your action [N]
[For each:]
**[Role] — [Company]**
📎 [direct link — always present; if unavailable, write "open manually"]
❓ Reason: test task / email application / registration required / direct link unavailable
📅 Published: [date]

---

## 🔶 Interesting — check yourself [N]
(Near filter thresholds or above the daily limit)
[For each: direct link, role, company, why flagged]

---

## 🔍 Why N vacancies were filtered out
[Show breakdown only when >10 vacancies removed, or when 0 passed]
- Exclusion filters: N (top reasons: ...)
- Not remote / wrong region: N
- Salary below threshold: N
- Already applied: N
- Too old: N

---

## ⚠️ Technical Notes
[MANDATORY section — always present, even if empty]
[List every skipped platform, failed login, unavailable tool, or phase that could not complete — with exact reason]
[If all phases completed successfully: "All phases completed successfully."]
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

**Runs automatically once a week** (check `last_source_expansion_date` in profile), or when user says "find new channels / platforms".

**MANDATORY weekly step. Cannot be skipped if 7+ days have passed since last expansion.**

1. Check activity of current Telegram channels (remove ones with last post > 30 days)
2. Search for new Telegram channels on tgstat.ru / telemetr.io
3. Run web search: `"[profession] job board [year]"`, `"[profession] jobs remote [year]"`, `"best remote job sites [year]"`
4. Compare found platforms with existing list — add new ones that passed criteria
5. Update platform list and `last_source_expansion_date` in profile
6. Include as separate block in next report: "Search sources updated: added N, removed N"

**If expansion search fails** — note in Technical Notes. Do not skip the check itself.

---

## Phase 6: Open calls, grants, and residencies search

Trigger: user asks to find open calls, grants, residencies, art competitions, or similar opportunities. Run independently from Phase 3.

### Search horizon and date rules

**Search ahead at least 6 months from today's date.** Never include opportunities with deadlines that have already passed (deadline < today) or that expire within 1–2 days. When a deadline is marked "rolling" or "ongoing" — include it, note it as rolling.

**Freshness rule:** if a call has no listed deadline and no activity sign in the last 3 months — skip it.

### Step 1: Search

Use WebSearch with queries like:
- "open call artists [month] [year]"
- "artist grants deadline [month+1 to month+6] [year]"
- "artist residency open application [season] [year]"
- "open call photographers / illustrators / painters [year]" (adapt to the user's medium)
- Check aggregator sites: thisiscolossal.com (monthly roundups), reviewedbyartists.com, callopen.art, opencallradar.com, resartis.org, artrabbit.com/artist-opportunities, artworkarchive.com/calls-for-entry

Search multiple queries and months in parallel to cover the full 6-month window.

### Step 2: Filter

For each result:
1. **Deadline check** — must be today or later (and not within 1–2 days unless user asked for urgent). Skip anything already closed.
2. **Horizon check** — deadline must fall within 6 months from today.
3. **Relevance** — matches the user's creative medium / discipline (if specified).
4. **Rolling** — if deadline is listed as rolling / ongoing, include and label clearly.

### Step 3: Verify all links

**Every link must be verified before inclusion in the report.** For each entry:
1. Try WebFetch on the URL. If the page loads and shows the correct open call with a matching deadline — mark ✓.
2. If WebFetch is blocked — use WebSearch to find a secondary source confirming the URL and deadline are current. Mark as "confirmed via search".
3. If the link leads to a 404, an unrelated page, a closed call, or a prior cycle — find the correct URL or remove the entry.
4. If the correct current URL cannot be found after one search attempt — remove the entry. Do not include unverified links.
5. Pay attention to cycle years: a URL containing an earlier year in its path is likely a prior cycle — verify before including.

### Step 4: Report

Output as a Claude Docs document (or update an existing one). Organize into sections: Гранты / Grants, Резиденции / Residencies, Опен-коллы / Open Calls, Агрегаторы / Aggregators. Use a table per section: Name | Prize/Terms | Deadline | Link.

**Deadline display rules:**
- Show the exact date (day + month + year) when known.
- Never show a date that has passed.
- Mark rolling deadlines as «Rolling» / «Ongoing».
- If deadline is uncertain, write «Уточнить» / «Check website» and link directly to the apply page.

**Link rules:**
- Link text should be the domain name only (e.g. `pkf.org`).
- The href must point to the apply or info page for that specific call — not a homepage.
- Never include a link you have not verified.

---

## What is stored in memory

File `/areas/job-hunter-profile.md`:
- `language`: chosen language (set in Phase 0)
- `security_checked: true` (set after Phase 0 completes)
- `platforms_ready: true` + `platforms_built_date` (set after Phase 2 completes)
- `last_run_date`: date of last Phase 3 run
- `last_source_expansion_date`: date of last Phase 5 run
- `auto_apply_limit`: unlimited or N
- User profile: profession, keywords, geo, remote preference, salary threshold, experience level, exclusions, job title (as user calls it)
- Resume: file path / link / hash of last version / extracted skills and stack
- Platform list with priorities and full domain lists for permissions
- Telegram channel list with date of last post and last check
- Application history: vacancy ID, company, role, date, status

---

## Key principles

**No phase may be skipped silently.** Every skipped or failed step must appear in Technical Notes with the exact reason.

**No questions during scheduled runs.** Automated sessions proceed without asking. Everything unresolved goes to Technical Notes.

**Platform list is never hardcoded.** It is always built via Phase 2 discovery search and expanded via Phase 5. Using only hh.ru or LinkedIn by default is a failure.

**Cover letters — structured and specific.** 4 mandatory blocks. Total 4–5 sentences. Every claim verifiable against resume. Role title exactly as stored in profile.

**Report is always created.** Even if 0 vacancies found or multiple phases failed. A report with Technical Notes is the minimum deliverable of every run.

**Resume — live.** Check hash on every run. If changed before run → apply immediately. If changed mid-run → queue and apply next run.

**Language — consistent.** Set once in Phase 0. Used everywhere. Cover letters use the vacancy's language.

**Auto-apply limit — user's choice.** Set at onboarding, changeable anytime. In scheduled mode — applied automatically without confirmation.

**Cold start detection.** If last run > 14 days ago → verify auth and channel activity before searching.

**Zero results — always explain.** Create report with breakdown and notify in chat.

**Deduplication is per company+role pair.** Same company + different role = allowed. Same company + same role = skip.

**Phase 5 is weekly and mandatory.** If 7+ days since last source expansion — run it before Phase 3.

**Open calls — 6-month horizon, verified links only.** Never include expired deadlines. Always verify every URL. Rolling deadlines allowed — label them clearly.
