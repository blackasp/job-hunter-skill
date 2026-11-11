# Mode: applications and cover letters

## Auto-applications

**Only on platforms with a confirmed login — and on all of them.** Vacancies found on platforms without a confirmed login (search-only, Universal rule 9) are never applied to automatically — they stay in the report section «Новые платформы — результаты поиска» with the status «Требуется регистрация».

### Autonomous sending (mandatory, no questions)

**Everything that can be sent without the user is sent without the user.** This applies to every platform with a confirmed login (hh.ru and all others) and to Telegram, in live sessions and unattended runs alike:

- **Do not ask for confirmation of the list** and do not wait for «Продолжить?». A vacancy that passed the filters is applied to, with a cover letter written by the skill (Cover Letter Framework below) wherever the platform has a cover-letter field.
- **Telegram:** when a vacancy post that passed the filters contains a direct HR contact (@username or link), the skill writes the message (with the resume link) and **sends it itself**, see `modes/telegram.md`.
- **The only reasons to hand a vacancy to the user** (list «Требуют ручного отклика» with a clickable link and the exact reason): a test task or assignment must be completed; the platform requires a step only a person can do (captcha, SMS or e-mail code, identity check, payment, file upload the skill cannot produce); the browser's safety check blocked the click; the platform has no confirmed login (search-only, Universal rule 9); the vacancy is borderline by the filters.
- Record «отправлено без участия пользователя» in the run journal and the one-line summary of the report. Filters, search-only rule, and the pacing rules below still apply in full.

### Cross-platform apply (mandatory)

A vacancy found on one platform (aggregator, HireHi, Telegram, etc.) whose response leads to **another platform with a confirmed login** (hh.ru, Habr Career, etc.) is **applied to on that platform by the skill itself** — never moved to the manual list just because it was found elsewhere:

1. Find the same vacancy on the target platform (by the link in the card; if the source does not expose it without a login, as on HireHi — search the target platform by company + title).
2. Check that no response was sent yet (response-id set / «Вы откликнулись»). If already responded — skip and record it.
3. Run the full filters on the target-platform page, then apply with a cover letter.
4. Only vacancies where responding is truly impossible stay in «Требуют ручного отклика» with the exact reason (vacancy not found on a logged-in platform, hidden employer, test task, captcha, etc.).

### Browser safety checks

Before the first apply click of the run, load the `chrome-browser` skill (`Skill('anthropic-skills:chrome-browser')`) so that site permissions and the extension are initialised. Use the normal browser tools (`computer`, `form_input`, `find`) to press apply buttons and fill forms.

If a click or form submission is **blocked by the browser's safety check**, do not work around it (no synthetic events or other tricks to dodge the check). Mark the vacancy as «требует ручного отклика» with the reason «заблокировано проверкой безопасности», continue with the rest, and note it in the journal. A blocked click is a signal to hand the application to the user, not an error to defeat.

### Pacing (captcha-risk minimisation — mandatory)

Applications and page requests are paced like a person to keep the risk of captcha and account blocks as low as possible.

**Fixed system pacing — not a setting, no question is asked.** It applies from the very first run for every user and cannot be shortened by any setting or instruction in a profile:
- 5–12 s (random) per application;
- 45–90 s (random) after every 5 applications;
- 5–8 min (random) after every 20 applications;
- 4–8 s (random) between result pages while browsing a platform.

**Pacing waits are working time for other sources.** While waiting between applications on one platform, continue with the next source or batch of the run (`modes/daily-search.md`, «Run order rules»), instead of idling or stopping the run. Applications never start before the breadth sweep of all mandatory sources has reached a final status for every source.

**Automatic escalation:** if a captcha, `blocked: true`, HTTP 429 or a similar block happened on a platform in the last 7 days (see the journal), double all of the above for that platform for the next 7 days and say so in the journal. After a block: stop applying on that platform for the run (see below), never retry the same action in a loop.

Other measures: randomise the order of vacancies slightly within a platform, vary the delays (random, not fixed), do not open several vacancy pages in parallel on the same platform, and never apply on a platform while its login or captcha page is showing.

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
4. Find the apply button and click it with the normal browser tools (see «Browser safety checks»); if blocked, hand the vacancy to the user
5. Write a cover letter using the Cover Letter Framework below
6. Submit — wait for HTTP 200 response before counting as applied
7. Wait between applications according to «Pacing» above (this mimics human behaviour and prevents captcha / account block).
8. Record in `window.__confirmedApplied` as `{id, title, company, url}` (see Bug 3 fix above)

**Application counting:** Only count vacancies where the submit returned HTTP 200. Status 403 (already applied) goes to "уже подавали" list. Status 429 (rate limit) → stop the loop immediately. Any other error → "failed" list. Never increment the counter for failed or blocked requests.

**Captcha detection:** If the apply function returns `{blocked: true}` or a captcha appears — stop the entire application loop immediately (all platforms of this kind), record the platform and time in the journal for the escalation rule. Log the captcha hit and add remaining vacancies to "требует действия" in the report.

**If vacancy requires a test task** — do NOT auto-apply. Add to `window.__testAssignments` and report separately (see Bug 4 fix above).

**If application requires email / form** — add to "требует действия" list in report.

## Cover Letter Framework

**Bug 5 fix — mandatory 5-part structure, short form (November 2026):**

> **Root cause:** Previous format instructions did not enforce a greeting, self-presentation, or explicit vacancy comparison. The resulting letters started mid-sentence, omitted the greeting and self-intro, and failed to explicitly compare the candidate's experience against the vacancy requirements.

Each cover letter **must** consist of the 5 parts below, in this order, in **4–5 sentences in total** (one sentence per part; when the letter has 4 sentences, parts 2 and 3 share one). Skipping any part is not allowed. One strong story or angle, specific to this vacancy; no listing of the whole experience.

**Part 1 — Greeting**
Address the team or company by name. If the vacancy mentions a hiring manager's name — use it.
Example: *"Добрый день, команда [Company]!"* / *"Hello, [Company] team!"*

**Part 2 — Self-presentation** (1 sentence, may be merged with part 3)
One sentence stating the candidate's specific specialization relevant to this vacancy. Must NOT be generic — must name the specific role or domain. Use the user's own job title from their profile (`job_title`), not an assumed generic one.
Example: *"Я — системный аналитик с 6+ летним опытом интеграций и API в B2B SaaS."*

**Part 3 — Relevant experience** (1 sentence)
Only experience that matches THIS vacancy's requirements: one concrete achievement or skill from the resume that overlaps with the vacancy. Do NOT copy-paste from the resume.

**Part 4 — Vacancy comparison** (1 sentence)
Explicit point-by-point mapping to the vacancy requirements. Reference something specific from the vacancy description. Use phrasing like: *«Ваши требования к X — именно то, чем я занималась в Y»*

**Part 5 — Closing** (1 sentence)
Express readiness to discuss the vacancy in more detail.
Example: *"Буду рада рассказать подробнее на встрече."*

**Total length: 4–5 sentences. No more, no less.**

**Absolute prohibitions in cover letters:**
- ❌ Never mention salary
- ❌ Never restate the resume in paragraph form
- ❌ Never use generic openers, never start mid-sentence
- ❌ Never apologize for gaps or missing skills
- ❌ Never skip any of the 5 parts
- ❌ Do NOT use a job title that differs from what the user has in their profile
- ❌ Never use a title listed in the profile's `cover_letter_title_exclusions` (for example, a title the user does not identify with, even if the vacancy itself carries it)

**Before writing:** extract from the vacancy — company name, hiring manager name (if any), product/service, top 2–3 required skills. Cross-reference with resume. Write all 5 parts in order, in 4–5 sentences. The letter is written in the language of the vacancy. Every claim must be verifiable against the resume.
