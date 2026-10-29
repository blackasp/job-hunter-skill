---
name: "job-hunter"
description: "Universal job search automation: daily vacancy reports, auto-applications, resume tracking, Telegram channel discovery, and multi-platform search. Activate for any job-hunting task: setup, daily runs, resume updates, or reviewing found vacancies."
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

**Profile source check:** Before asking anything, look for an existing profile in memory:
- Check `/areas/job-hunter-profile.md` — if it has a complete profile (profession, keywords, resume) → skip to Phase 3.
- Also check `/areas/job-search.md` — if it exists and contains job search criteria → offer to import: "I found an existing job search profile. Shall I use it as your base and just confirm a few details?" If user agrees, read that file, extract all available fields, pre-fill the profile, and ask only for missing fields (resume location, auto-apply limit). Save to `/areas/job-hunter-profile.md`.

If no existing profile found anywhere — run the full interview. Ask ALL questions in a single message, **in the user's chosen language** (translate every word — never leave Russian text if user chose another language):

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

**Cold start check:** if `last_run_date` is more than 14 days ago — notify the user in their language: "Last run was [date]. Checking platform auth and channel activity before searching." Then: verify login on each platform (mark any needing re-auth), run Phase 5 channel check before proceeding.

### Step 1: Resume check

Read current resume from profile. Compare with previous version (hash or file date).

**If resume changed AND a search run is already in progress** — do not interrupt the current run. Finish the current run using the previous resume version, then process the new resume, update the profile, and note at the top of the report: "📄 Resume updated mid-run — new skills will apply from the next search."

**If resume changed before the run starts** — re-read, update extracted skills and stack in profile, note at top of report: "📄 Resume updated — new skills applied to search."

**If user says "update resume" or uploads a new file mid-run** — acknowledge receipt, queue the update, finish current run, then process. Confirm: "Resume received. Will apply to next search."

### Step 2: Platform search

For each platform in priority order:
1. Open in browser (using saved sessions)
2. Apply search filters from profile
3. Collect vacancies not older than [profile setting, default 3 days]
4. Exclude already-seen (compare with history in memory)
5. Add to shared pool

**If browser hits a login page** — do NOT abort the run. Mark platform as "needs re-auth", continue with others, note in report.

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
3. **Salary**: remove if below threshold (when listed)
4. **Freshness**: remove if older than profile limit
5. **Deduplication**: company + role pair must not exist in history. If the same company appears with a DIFFERENT role — keep it, it is a new application. If the same company + same role title — remove.

After filtering — rank by relevance:
- Key skills match from resume
- Desired stack match
- Presence of "nice-to-haves" that are in the resume
- Salary level (when listed)

**If 0 vacancies remain after filtering** — do NOT silently create an empty report. Instead, generate the report artifact with zeros AND include a "Why nothing passed" breakdown:

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

**In both cases:** before sending, show the user a confirmation in their language:
"Found [total filtered] vacancies. Will apply to [N / all of them]. Continue?"
Wait for confirmation before submitting anything.

For each vacancy in the confirmed list:

**If platform supports browser-based application:**
1. Open the vacancy
2. Find the apply button
3. Write a cover letter using the Cover Letter Framework below
4. Submit
5. Record in application history

**If vacancy page loads but has no direct application URL** — attempt one additional click to reach the application form. If URL is still unavailable after that — add to "action required" list with note "direct link unavailable — open manually". Never insert a blank or placeholder link in the report.

**If vacancy requires a test task** — do NOT auto-apply. Add to separate list in report.

**If application requires email / form** — add to "action required" list in report.

### Cover Letter Framework

Cover letters must be **short**: 3–5 sentences, **80–120 words maximum**. Hiring managers don't read long letters. Every letter is unique and specific to this vacancy — never a template, never reused.

**Before writing:** extract from the vacancy — company name, product/service, key challenge or need, top 2–3 required skills. Cross-reference with resume. Select format based on role type.

**Cover letter language rule:** Write in the **language the vacancy is posted in** — regardless of the user's profile language. A Russian-speaking user applying to an English-language vacancy gets an English cover letter, and vice versa.

---

**Format A — Problem-Solution** (default for most roles):

> **S1:** Name a specific challenge the company likely faces — based on the vacancy text or company context. Concrete, not generic.
> **S2:** State how your experience directly addresses it. One concrete example with a result (number, outcome, or scale) from the resume.
> **S3:** Connect 1–2 specific skills from the resume to the vacancy's key requirements, using the company's own language.
> **S4:** Short call to action — availability for a call or interview.

**Format B — Achievement-First** (for technical / results-driven roles: developer, analyst, QA, data engineer):

> **S1:** Lead with the single most relevant qualification or achievement for this specific role.
> **S2:** Connect it to the vacancy's top requirement with a specific number or outcome from the resume.
> **S3:** One sentence on why this company or product is genuinely interesting — specific, not generic.
> **S4:** Call to action.

**Format C — Story Hook** (for creative, leadership, or mission-driven roles):

> **S1:** A brief vivid moment or turning point that connects the career path to this role — concrete, not clichéd.
> **S2:** How that experience shaped a skill or approach that directly matches this vacancy's core need.
> **S3:** Why this specific company is the logical next step.
> **S4:** Call to action.

---

**Rules for all formats:**
- Every claim must be verifiable against the resume — no invented achievements
- Use the company's own vocabulary from the vacancy description
- Never mention salary
- Never restate the resume in paragraph form
- Never use generic openers: "I am writing to express my interest", "I am a passionate professional"
- Never apologize for gaps or missing qualifications — lead with what you bring
- All skills mentioned in the letter must exist in the resume
- Write in the **language of the vacancy**, not the user's profile language

### Step 7: Report

Create an artifact — daily report. Write in the user's chosen language.

```
# 🔍 Job Search Report — [date]

## 📊 Summary
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

## ⚠️ Technical notes
(Re-auth needed, dead channels, platforms skipped, resume updated mid-run, etc.)
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
- Include as separate block in next report: "Search sources updated: added N, removed N"

---

## What is stored in memory

File `/areas/job-hunter-profile.md`:
- `language`: chosen language (set in Phase 0)
- `security_checked: true` (set after Phase 0 completes)
- `last_run_date`: date of last Phase 3 run
- `auto_apply_limit`: unlimited or N (set in Phase 1, changeable anytime)
- User profile: profession, keywords, geo, remote preference, salary threshold, experience level, exclusions
- Resume: file path / link / hash of last version / extracted skills and stack
- Platform list with priorities and full domain lists for permissions
- Telegram channel list with date of last post and last check
- Application history: vacancy ID, company, role, date, status

---

## Key principles

**Don't stop on minor errors.** One platform down → continue with others, note in report. Never abort the full run.

**Permissions — once only.** Full domain list collected at onboarding, bulk-added by user. Never re-request.

**Cover letters — short and specific.** 80–120 words max. Specific to this vacancy. Every claim verifiable against resume. Format chosen per role type. Never mention salary. Always in the vacancy's language.

**Report — artifact only.** Not in chat. Direct links in every section. If a link is unavailable — write "open manually", never leave it blank.

**Resume — live.** Check hash on every run. If changed before run → apply immediately. If changed mid-run → queue and apply next run.

**Language — consistent.** Set once in Phase 0. Used everywhere: messages, onboarding, reports, error notes. Cover letters use the vacancy's language, not profile language.

**Auto-apply limit — user's choice.** Set at onboarding, changeable anytime with a single phrase. Always confirm before sending.

**Cold start detection.** If last run > 14 days ago → verify auth and channel activity before searching.

**Zero results — always explain.** If 0 vacancies pass filters → create report with breakdown of why, and notify in chat with a suggestion to relax the top filter.

**Deduplication is per company+role pair.** Same company, different role = allowed. Same company + same role = skip.

**Existing profile import.** On first run, check both `/areas/job-hunter-profile.md` and `/areas/job-search.md`. If either has usable data → offer to import instead of asking everything from scratch.
