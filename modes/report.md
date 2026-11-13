# Mode: report

## Report — Claude Docs document

**The daily report is a Claude Docs document** (not a chat message, not an HTML artifact). Create it via `mcp__Claude_Docs__batch` with `container.create`.

**⛔ FORMAT IS LOCKED. Never change section order, column names, or structure. Only the user can authorize format changes.**

**Document structure — REQUIRED sections in this exact order, every run, no exceptions:**

```
# Отчёт по поиску работы — [число месяца на русском]

[дата] · [mention пользователя]

[Краткое summary: первая строка — «N авто-откликов, N TG-сообщений, N вакансий требуют ручного отклика» (при необходимости с «отправлено без участия пользователя», «поиск новых платформ: пропущен, следующий [дата]»). Ниже — маркированный список «Источники»: по одному пункту на каждый обязательный источник в виде «[Источник] — проверен (N страниц, M проверено, K прошли фильтр) / недоступен (причина) / не поддерживает нужный поиск (что отсутствует) / не проверен (причина)». Источники со статусом «недоступен» и «не проверен» дополнительно попадают в «Что сделать вручную» с точным действием.]

## Авто-отклики [N]
Таблица: Платформа | Вакансия | Компания | Статус
- Вакансия — кликабельная ссылка: [Название вакансии](https://url)
- Статус — что сделано: «Отклик», «Отклик + сопроводительное письмо», «Отклик через форму» и т.д.
(Секция включает ВСЕ платформы вместе: hh.ru, getmatch, geekjob, hirify, и др. — не разбивать по платформам)

## TG-сообщения отправлены [N]
Таблица: Компания | Должность | Платформа | HR | Статус
- Должность — кликабельная ссылка на вакансию или пост в канале

## Требуют ручного отклика [N]
Таблица: Платформа | Компания | Должность | Как откликнуться
- Должность — кликабельная ссылка на вакансию
- Если пользователь пометил строку в последней колонке («просмотрено, больше не присылать» или любым ответом), вакансия записывается в профиль (`manual_reviewed`) и больше никогда не попадает в этот блок

## Заблокированы / Plus [N]
Таблица: Платформа | Компания | Должность | Причина
- Должность — кликабельная ссылка на вакансию (если доступна)

## Новые платформы — результаты поиска
Таблица: Платформа | Вакансия (ссылка) | Компания | Статус/Действие
- ТОЛЬКО платформы, найденные поиском новых платформ этого запуска и ещё не бывшие в профиле. Платформа из профиля (в том числе добавленная ранее в этот же день) здесь не показывается. Если новых платформ нет или поиск идёт по графику не в этот запуск — одна строка с пояснением и датой следующего поиска.
- Вакансия — кликабельная ссылка
- Статус/Действие — «Отклик отправлен», «Требуется регистрация», «Написано письмо», «Нет подходящих» и т.д.

## Что сделать вручную
Нумерованный список. Каждый пункт содержит кликабельную ссылку на вакансию/платформу и точное описание действия.

## Список новых платформ этого запуска
Таблица: Платформа | URL | Найдено вакансий | Добавлена в профиль?
(Перечислить ТОЛЬКО платформы, где в этом запуске найдена хотя бы одна подходящая вакансия.
После создания отчёта — автоматически добавить эти платформы в список известных платформ в /areas/job-hunter-profile.md)
```

**Rules for the document:**

1. **ALL links MUST be clickable** — format: `[anchor text](https://full-url)`. Never bare URLs. Applies to ALL sections — tables, lists, everywhere. No exceptions.
2. **Verify ALL links BEFORE finalizing** — after writing the document, navigate to each link in the browser. If a site returns ERR_CONNECTION_RESET, 404, or «Не удается получить доступ» — remove that row/item from the document or replace the link with «⚠️ сайт недоступен». A document with unverified links is NOT complete.
3. **Hirify short URL format** — use `https://hirify.me/jobs/[ID]` (no slug). These return HTTP 200.
4. **External career sites** — verify by navigating in browser (not `fetch()` — CORS will block). If unavailable, remove link.
5. **Document title** — in the user's chosen language, with the date. Russian users: «Отчёт по поиску работы — 9 ноября 2026».
6. **Link verification** — hh.ru and Hirify links: verify via fetch(url, {method:'HEAD'}) in browser console. External sites: navigate directly in a browser tab.
7. **New platforms auto-save** — after the report is finalized, add every platform from «Список новых платформ этого запуска» to the known platforms list in `/areas/job-hunter-profile.md` automatically.
8. **Format is immutable** — do NOT rearrange sections, rename columns, merge sections, or add/remove sections without explicit user instruction. The format above is the contract.
9. **New platforms section holds only new platforms.** Results for platforms already in the profile go to «Авто-отклики» (what was sent), «Требуют ручного отклика» (what needs the user), «Заблокированы / Plus» (what was filtered out) and the per-source list in the summary. They never appear in «Новые платформы — результаты поиска» or «Список новых платформ этого запуска».
10. **No walls of text.** Every comment, explanation or summary in the report (summary, the note under «TG-сообщения отправлены», the note under «Заблокированы / Plus», any other text) is written as short logical paragraphs or as a list: one item per platform, per reason or per step. Detail (numbers, reasons) stays; a single solid block of text is not allowed. The same applies to messages to the user outside the report.

---

**Invitations.** Show only invitations received within the last 2 months (cut-off: today minus 60 days), sorted by date, most recent first. For each: company, role, vacancy link, date received. Skip older invitations — they are stale. Invitations are shown inside the existing sections; no new section is added.

**Run journal.** After the report is final, write the run's entry to the journal (see `references/run-journal.md`) and, if the profile structure changed outside the skill update, give the reminder from «Profile template» in `references/run-journal.md`. The journal is not part of the report and does not change its format.

---

## ⛔ Agent 4 (Report) — Exit checklist

**Agent 4 may not declare the run complete until ALL of the following are true:**

- [ ] The report is a Claude Doc created via `mcp__Claude_Docs__batch` with `container.create` — not a chat message, not an HTML artifact
- [ ] All 7 required sections are present in this exact order: Авто-отклики, TG-сообщения, Требуют ручного отклика, Заблокированы/Plus, Новые платформы, Что сделать вручную, Список новых платформ
- [ ] Every vacancy row in every section has a clickable link in format `[Название](https://url)` — no bare URLs
- [ ] Every Telegram vacancy row has `tg_message_link` populated
- [ ] hh.ru and Hirify links were verified via `fetch(url, {method:'HEAD'})` from their domain; external links were verified by navigation in browser tab
- [ ] The summary section contains the per-source ledger list (one bullet per mandatory source, with status and numbers)
- [ ] No section is omitted even if empty — an empty section gets «Нет вакансий» or «—»
- [ ] No text block is a wall of text — all comments are in short paragraphs or lists (rule 10)
- [ ] New platforms from this run were saved to `/areas/job-hunter-profile.md`
- [ ] Run journal entry was written
- [ ] The Claude Doc link was provided to the user in the chat reply
