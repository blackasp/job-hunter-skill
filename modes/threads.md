# Mode: Threads (threads.com)

Threads is a **mandatory source** (Universal rule 13) and is searched **first in Phase A, before hh.ru**: it is the fastest source (one list page per query, no descriptions to open for most posts), so it must never be squeezed out by the big platforms. It needs a confirmed login in the browser; without it the ledger row is «не проверен — нет входа».

Vacancies on Threads are mostly posts of aggregator accounts that repost vacancies, plus posts of recruiters and teams. There is no application form: the response goes through the contact named in the post (usually Telegram), see «What happens with a found vacancy».

## Settings (profile fields, field names only)

| Field | Meaning |
|---|---|
| `threads_queries` | search phrases built from `job_title` and `keywords` (all inflections: «системный аналитик», «системного аналитика», «system analyst», «вакансия системный аналитик»). Do not add words like «ищем»: they distort the results |
| `threads_accounts` | aggregator / recruiter accounts whose posts are read in full each run |
| `threads_last_checked_date` | date of the last Threads search; empty = never |
| `threads_first_run_days` | depth of the first search, default 30 days |
| `threads_overlap_days` | overlap of every next search with the previous one, default 3 days |

## Search window

- **First run** (`threads_last_checked_date` empty): the last `threads_first_run_days` days.
- **Next runs:** from `threads_last_checked_date` minus `threads_overlap_days` days to today. The overlap catches late-indexed posts and comments; posts already seen (by post id, kept in the run journal and the profile history) are skipped silently.
- After the search write `threads_last_checked_date` (today) to the profile and the result to the run journal.

## Which criteria apply

**Personal criteria** (from the profile, the same as on every other source): role and title exclusions, `user_blockers_tech`, `user_blockers_global`, geography (`geo_exclusions`), salary only when the post states one, seniority, English level, experience. They are applied to the post text and, where the post is promising, to the author's replies and the first comments.

**System criteria** (technical, not set by the user):
- the post is inside the search window (`time[datetime]` of the post);
- the post is not a duplicate (post id, or the same vacancy text reposted by another account — keep one, the earliest);
- the post is a vacancy or a team looking for a person, not a person looking for work, an ad for courses or mentoring, a self-promotion, a discussion or a question;
- the post has a working direct link `https://www.threads.com/@<account>/post/<id>` — without it the vacancy is not reported;
- replies written by the author («В ответ @…») are read as part of the same vacancy (stack, requirements, contacts are often split into replies).

## Soft filter (mandatory for Threads)

Threads posts are short and often do not name the work format. So the filter is **soft**:

1. **Exclude** only on a stated fact: office or hybrid is written; the vacancy is Russia-only («по РФ», «по России», «на территории РФ», «РФ/РБ», «Удалёнка · Россия», only Russian cities); a blocker from the personal criteria is named; the role or seniority does not fit (junior, intern, another profession).
2. **If remote / location is not written — the vacancy is kept**, in the report with the label «формат не указан». Never drop a post for the absence of the word «удалённо». (Confirmed mistake of 2026-11-11: a filter that required a remote word discarded 31 posts, including a good vacancy; the user then found it by hand.)
3. If a comment under the post says the format is office or Russia-only — exclude it and name the comment as the reason.
4. A post that states «удалённо» without a geography restriction goes to the normal pool.

## How to search (checked in practice)

1. Open `https://www.threads.com/search?q=<query>&serp_type=default&filter=recent` in the browser (Claude in Chrome with the user's login). Run **every** query of `threads_queries`: different phrases return different posts («вакансия системный аналитик» finds vacancy posts that «системный аналитик» ranks low).
2. Collect posts while scrolling, in a background loop, and poll the result (a long loop inside one JavaScript call hits the tool timeout):
   - links: `a[href*="/post/"]` → `/@<account>/post/<id>`; date: `time[datetime]` (UTC); text: the post container's `innerText`;
   - the search results mix posts and replies; the order is **not strictly chronological**, so do not stop at the first old post: stop when the last 20 new posts are all older than the window (or after a reasonable scroll limit with the reason noted).
3. Read each account of `threads_accounts` the same way (open the profile, scroll to the window start).
4. Filter in code first (window, vacancy markers, soft filter), then read the remaining posts; open the post page for promising ones to read the author's replies and comments (`get_page_text`).
5. The browser tool blocks outputs that contain URLs: print account and post id, build the links yourself.

## What happens with a found vacancy

- The vacancy goes into the common pool and is processed like vacancies of other sources (filters, blockers, report); there is no separate report format.
- **Contact in Telegram / e-mail in the post:** the skill writes the message (with `resume_url`) and sends it itself, as for Telegram vacancies (`modes/telegram.md`, `modes/apply.md` «Autonomous sending»). If the post does not state the work format, the message also asks whether the role is remote and from which countries. The cover-letter rules of `modes/apply.md` apply.
- **Link to a vacancy on another platform with a login** (hh.ru, Habr Career): apply there (`modes/apply.md`, «Cross-platform apply»).
- **No contact and no link, or sending is impossible** (no login for the messenger, phone only): the vacancy goes to the manual table with the link and the exact reason.
- Vacancies with the label «формат не указан» are listed in the report with that label in the usual sections, not hidden.

## Ledger and journal

One ledger row «Threads» with: queries run, accounts read, window (from – to), posts read, posts that passed the filter, label «формат не указан» count, plus per-vacancy links. When nothing suitable is found, the row says so with the numbers («проверено N постов за период, подходящих нет»), never just «ничего нет».
