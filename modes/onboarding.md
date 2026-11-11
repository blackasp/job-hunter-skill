# Mode: onboarding (first run)

Load when the profile is missing or incomplete, or the user asks to set up the search again.

## Step A: Security check + language (very first run only)

Check memory for `/areas/job-hunter-profile.md`. If `security_checked: true` is present — skip this step entirely.

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

## Step B: Profile questions (first run only)

Check memory for `/areas/job-hunter-profile.md`. If it has a complete profile — skip to the daily search (`modes/daily-search.md`).

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
8. What to EXCLUDE?
   a) Technologies / software that disqualify a vacancy only if they are *required* or part of the duties (a mention under «nice to have» will not block): ___
   b) Industries, employers, company types, formats you never want, wherever they are mentioned: ___
   c) Roles to skip by job title (for example, junior, intern): ___
9. Any geographic restrictions?
   - Countries/regions to EXCLUDE from results (e.g. Russia-only remote vacancies, specific countries): ___
   - Countries/regions to INCLUDE only (or "any"): ___
10. Resume language (your language / English / both): ___
11. Where is your resume?
    a) I'll upload a PDF now (used to read your skills)
    b) Link to your resume or profile (hh.ru resume, LinkedIn, etc.) — paste the URL; this link is also what is sent to HR contacts in messages
    c) Both
12. Work authorization: in which countries do you have a legal right to work?
    (This determines which vacancies require permits you don't have — those will be flagged, not hidden.)
13. English level: A1 / A2 / B1 / B2 / C1 / C2 / Native
    (Vacancies requiring a higher level than yours will be flagged in the report.)
14. Telegram vacancies: how fresh should they be? (vacancies and channels older than this many days are skipped; default 30 days): ___
15. Job platforms (hh.ru, LinkedIn, etc.): how fresh should vacancies be? (vacancies older than this many days are skipped; default 30 days): ___
16. How often should the skill do a full search for new Telegram channels and platforms? (every N days; between those runs it only re-reads the posts of channels it already knows; default 3 days): ___
17. Application pacing: standard or careful? (careful = slower, lower captcha risk; it also slows down automatically after any block; default standard): ___
18. Is there a job title you do NOT want to be called in cover letters, even if a vacancy carries it? (optional): ___
```

After the user responds:
- PDF → read contents, extract key skills, stack, experience
- Profile link → open in browser, read, extract data
- Save everything to the profile (see «Where the profile lives» in the main file), including:
  - `job_title: [value]` — the user's own name for their profession
  - `keywords: [list]` — search keywords
  - `geo_preference: [value]` — where they work from
  - `geo_exclusions: [list]` — geographic restrictions to exclude; use the token `RU-only` for «remote only inside Russia» (the filter recognises exactly this token)
  - `geo_inclusions: [list or "any"]` — geographic restrictions to include
  - `work_format: [remote/office/hybrid]`
  - `salary_floor: [amount]`
  - `salary_currency: [currency]`
  - `show_no_salary: [yes/no]`
  - `experience_years: [N]`
  - `experience_level: [junior/mid/senior/lead]`
  - `user_blockers_tech: [list]` — answer 8a (matched only in the requirements/duties blocks)
  - `user_blockers_global: [list]` — answer 8b (matched in the full text)
  - `role_exclusions: [list]` — answer 8c (matched in the title)
  - `resume_url: [URL]` — link from question 11
  - `discovery_interval_days: [N]` — default 3
  - `apply_pacing: [standard/careful]` — default standard
  - `cover_letter_title_exclusions: [list]`
  - `work_permit_countries: [list]`
  - `english_level: [B1/B2/C1/etc]`
  - `max_vacancy_age_days: [N]` — freshness of vacancies on platforms, default 30 if the user does not answer
  - `telegram_vacancy_max_age_days: [N]` — freshness of Telegram vacancies, default 30 if the user does not answer

---

## Step C: Platform onboarding (after the profile is set up)

Build a **personalized platform list** based on the profile. The list has two parts.

The platform catalogue is in `references/platforms.md`.

### Part B — Web search for new platforms (run once at onboarding, then on full-discovery runs)

See «Source expansion» in `modes/daily-search.md` for the full procedure; Telegram channels: `modes/telegram.md`. Run it now to discover platforms the fixed list doesn't cover.

Show the user the combined list (fixed + newly discovered) with a reason for each platform. Ask them to:
1. Confirm the list (they can remove items)
2. Log in to each platform in their browser

**For each platform:**
- Open in browser, verify login
- Record **all domains** actually used (including auth.*, api.*, static.*, subdomains)
- Save the full domain list to profile

**Permission rule — ONCE ONLY:** After confirming each platform, show the user the complete domain list and ask them to add ALL of it to "Always allowed" in browser settings. Explain: this prevents daily re-prompts. **Never ask for permissions again after onboarding.**
