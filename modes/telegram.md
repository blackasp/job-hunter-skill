# Mode: Telegram channels and vacancies

## Reading known channels (daily quick scan)

For each channel in the profile's Telegram channel list (`telegram_channels` or the «Telegram Channels» section), read the posts since the last run using the method in this file (public preview `https://t.me/s/<channel>` in the browser; `web.telegram.org` only as a fallback, see «Fallback: web.telegram.org» below). Extract vacancy posts, apply the filters from `references/filters.md`, and add matches to the pool. If channels mention other active channels — verify them as described below before adding to the list.

**TG vacancy links — mandatory:** every vacancy from a TG channel must carry the direct link to the post `https://t.me/channelname/NNN` (on the preview page it is the `data-post` attribute of the message; in web.telegram.org: right-click → «Copy link»). If the link cannot be obtained — do NOT include that vacancy in the report.

**Fallback:** if neither the preview page nor web.telegram.org can be opened — skip Telegram for this run, note it in the report, continue with other sources.

## Telegram vacancy search (on request, at onboarding, and on full-discovery runs)

Trigger phrases: «найди телеграм-каналы с вакансиями», «найди вакансии в телеграме», «find job Telegram channels». Works for any profession. It does not change the locked daily report format (`modes/report.md`).

### What tools actually work (checked in practice)

| Task | Works | Does not work / limits |
|------|-------|------------------------|
| Find channels | WebSearch / WebFetch (queries, tgstat.ru, telemetr.io, channel lists, mentions in other channels) | Catalog pages may be blocked or stale; a catalog description is NOT verification |
| Read posts of a public channel | Browser (Claude in Chrome or built-in browser): open `https://t.me/s/<channel>`, read the DOM with JavaScript: `data-post` (post id → link), `time[datetime]` (exact date), message text; older posts via `?before=<id>` | Only public channels with the web preview enabled |
| Read posts via other tools | — | The shell has no access to t.me; WebFetch returns only times without dates, so it cannot confirm freshness. Use it only to see that a page exists |
| Private channels, groups, comment threads, channels with the preview disabled | — | Cannot be verified automatically. List them separately as «не удалось проверить», never as verified |

Dates on the preview page are in UTC. If no browser is available at all — say so, give only discovered (unverified) channels marked as such, and do not report any vacancies.

JavaScript for reading a loaded preview page:
```js
[...document.querySelectorAll('.tgme_widget_message')].map(m => ({
  post: m.getAttribute('data-post'),                       // channel/ID
  date: m.querySelector('time')?.getAttribute('datetime'), // exact date, UTC
  text: m.querySelector('.tgme_widget_message_text')?.innerText || ''
}))
```
Channel title and subscribers: `.tgme_channel_info_header_title`, `.tgme_channel_info_counter .counter_value`.

### Step 1: Clarify field and role

Use `job_title` and `keywords` from the profile. If the profile has none (new user, or the user names another field in the request), ask once: «Какая сфера и роль? (например, системный аналитик, дизайнер, продакт-менеджер)» and use the answer for this search; save it to the profile only if the user is doing onboarding. Freshness: use `telegram_vacancy_max_age_days` from the profile (default 30 days if not set); the user can state another period in the request. Call it N below.

### Step 2: Discover candidate channels

- Web search in the user's language and English, e.g. `«<роль> вакансии телеграм канал»`, `«<profession> jobs telegram channel»`, `«вакансии <сфера> t.me»`, for the current year.
- Catalogs: tgstat.ru, telemetr.io (search by role keywords); lists and recommendations in articles, communities and forums.
- Channels mentioned or reposted inside already verified channels.
- Channels already in the user's profile.

Only real channels found in sources count as candidates. Never invent a channel name or link.

### Step 3: Verify each candidate by its posts

Open `https://t.me/s/<channel>` in the browser. A channel is **verified** only if ALL of these hold:
1. The posts can be read (preview works).
2. Among the last ~20 posts most are vacancies (not course ads, spam or news).
3. At least one vacancy post for the user's field and role is dated within the last N days (exact `datetime` seen on the page).

Page back with `?before=<oldest id>` up to 5 pages when the first page does not reach N days. Record for the channel: title, link, specialization (as actually seen in posts, not as in the description), date and link of the freshest relevant vacancy, approximate subscribers if shown.

Statuses: **проверен** (all conditions met), **нет свежих релевантных** (readable, but nothing relevant in N days — do not include in the list), **не удалось проверить** (preview closed, private, group or page not loading — list separately with the reason). A channel is never shown as verified because of its description alone.

### Step 4: Collect vacancies

From verified channels collect vacancy posts from the last N days. Apply the filters from `references/filters.md` (universal + the user's personal filters). For each vacancy give: title, date of the post, company, short summary (1–2 lines), and the direct link to the post `https://t.me/channelname/NNN`. A vacancy without a direct post link is not included. Remove duplicates (same company + role across channels; keep the earliest post and mention the others).

### Output format

1. **Параметры поиска:** роль/сфера, период свежести (N дней, по умолчанию 30), дата проверки.
2. **Проверенные каналы** — table: Название | Ссылка | Специализация | Свежая релевантная вакансия (дата + ссылка на пост).
3. **Свежие вакансии** — table: Должность | Компания | Дата публикации | Кратко | Ссылка на пост. Newest first.
4. **Ограничения поиска:** каналы, которые не удалось проверить (причина), каналы без свежих релевантных вакансий, случаи, когда свежесть не удалось подтвердить, и если результатов мало — прямо об этом сказать.

All links clickable `[text](url)`. Show only what was actually verified. Never invent channels, vacancies, dates or links; if there are few results, say so.

---

## Fallback: web.telegram.org

Use only when the public preview page does not work for a channel the user can open (for example, preview disabled).

- Open `web.telegram.org/a/` in the Chrome browser (not a cloud fetch — Telegram blocks bots) and wait for the chat list to load.
- **Hash URLs do NOT work.** Never use `web.telegram.org/k/#@channelname` or `/a/#@channelname` — Telegram Web ignores hash routing.
- Open each channel: click the Search icon → type the channel `@username` → wait for results → click the match → review posts since the last run → extract vacancy links and HR contacts → press Escape or Back → next channel.
- **On error** (the page fails to load or requires login): do NOT silently skip. Mark each channel «⚠️ требует авторизации» in the report's TG section and add to «Что сделать вручную»: «Открыть Telegram, проверить каналы вручную». Never leave the TG section empty without explanation.

## Messages to HR contacts found in posts

**Sent autonomously (mandatory).** When a vacancy post contains a direct HR contact (@username or link) and the vacancy passed all filters, the skill writes a short message to the contact and **sends it itself** via web.telegram.org, without asking the user (see «Autonomous sending» in `modes/apply.md`). The message: greeting, the role as the user's own `job_title`, one sentence of relevance to this vacancy, the link to the user's resume (`resume_url` from the profile, no file attachment), 3–4 sentences in all; no salary; never a title from `cover_letter_title_exclusions`. If `resume_url` is missing — note «⚠️ resume_url не найден — сообщение отправлено без ссылки на резюме». Wait between messages according to «Pacing» in `modes/apply.md`. Record every sent message in «TG-сообщения отправлены» with company, role, HR handle, and date. If web.telegram.org is not signed in, or the contact cannot be messaged (privacy settings, no username) — the vacancy goes to «Требуют ручного отклика» with the reason.

## When a message to HR cannot be sent

If the user asked to contact HR and a message cannot be sent, the skill records the concrete reason in the run journal and in «Что сделать вручную»: no contact in the post (which post, what the post links to instead), the contact's account is unreachable (the error text), `web.telegram.org` is not logged in (what the page shows), a needed detail is missing (resume link, contact channel, text), or a step only a person can do. It also states what is needed to continue («нужен вход в web.telegram.org», «в посте нет контакта — откликнуться по ссылке из поста»). «Не удалось» without a reason is not allowed; a post whose contact was not checked is recorded as «не проверен», not as «нет контакта».
