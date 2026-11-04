# 🔍 Job Hunter — Claude Skill

A universal job search automation skill for Claude.  
Works for any profession, any country, any language.

---

## What it does

- **Daily reports** — artifact with all found vacancies and direct links
- **Auto-applications** — submits applications where browser automation is possible
- **Smart filtering** — by stack, geo, salary, work format
- **Cover letters** — short (4–5 sentences), unique per vacancy, written in the vacancy's language
- **Multi-platform search** — hh.ru, LinkedIn, Habr Career, Telegram channels, niche job boards; **+8 remote platforms**: CONTRA, Himalayas, Dynamite Jobs, We Work Remotely, DailyRemote, JustRemote, Remote OK, ARC
- **Telegram channel discovery** — automatically finds active channels via tgstat.ru / telemetr.io
- **Resume tracking** — detects changes on every run
- **Security audit** — self-checks before working with personal data
- **Open calls, grants & residencies** — finds artistic opportunities with deadline verification (6-month horizon)
- **hh.ru field mapping** — reads `HH-Lux-InitialState` correctly (`vacancyId`, `compensation`, `@workSchedule`, `publicationTime/@timestamp`)
- **NAME-syntax search** — title-only search on hh.ru to avoid false positives from job descriptions
- **HTTP 200-only counting** — 403 = already applied, 429 = rate limit stop, others = failed; never counts errors
- **Captcha detection** — `{blocked: true}` stops the entire application loop immediately + PushNotification
- **Previously applied check** — loads negotiations history via DOM parsing before starting
- **Rate limit guard** — 800ms delay between applications
- **Network error resilience** — try/catch on all fetch calls; single error never aborts the run
- **User name from API** — always fetched from `api.hh.ru/me`, never guessed
- **All interview invitations** — shown without date filter
- **Configurable application limit** — set at onboarding: unlimited or N per day; changeable anytime with a single phrase
- **Zero results explained** — if 0 vacancies pass filters, the report includes a full breakdown by filter and a suggestion to relax the top one
- **Cold start detection** — if last run was 14+ days ago, re-checks platform auth and channel activity before searching

---

## Requirements

| | |
|---|---|
| **Platform** | Claude.ai |
| **Plan** | Pro or higher (Skills are not available on Free) |
| **Browser** | Claude in Chrome extension — for auto-applications and search |

### Recommended models

| Level | Model | Notes |
|-------|-------|-------|
| **Minimum** | Claude Haiku 5.5 | Basic search and filtering work. Cover letters will be generic. Complex checks (captcha, DOM parsing, hh.ru InitialState mapping) may be missed. |
| **Optimal** | **Claude Sonnet 5.5** | Handles all phases confidently: search, filtering, DOM parsing, vacancy-specific cover letters, report. Best speed/quality ratio. **Recommended for daily runs.** |
| **Maximum** | Claude Opus 5.5 / Fable 5.1 | Better with edge cases (broken DOM, unexpected response structure), more precise cover letters. Worth using for initial onboarding or if Sonnet consistently misses vacancies. |

---

## Installation

1. Open **claude.ai → Settings → Skills**
2. Click **Add skill**
3. Copy the contents of [`SKILL.md`](./SKILL.md) and paste
4. Save

---

## First run

Type in Claude:

```
Find me a job
```

The skill will run:
- Security check
- Language selection
- One-time onboarding (~2 minutes)
- Platform and Telegram channel setup

If you already have a job search profile in Claude's memory — it will offer to import it instead of asking everything from scratch.

---

## How to run daily search

**Option 1 — manual** (works right away):

```
Run job search
```

The skill searches, filters, applies, and creates a report artifact with direct links.

**Option 2 — scheduled** (via Claude Code):  
Set up a scheduled task in Claude Code — the skill will run automatically every day without your involvement.

---

## What happens on each run

1. Checks resume for changes
2. **Dynamically discovers platforms** via web search (never uses a fixed hardcoded list)
3. Searches all platforms and Telegram channels
4. Filters and ranks by your profile
5. Asks for confirmation before applying (or applies automatically in scheduled mode)
6. Submits applications with unique cover letters
7. Creates a report artifact with direct links — **always created, even if 0 vacancies found**

**Every phase is mandatory.** If a phase fails for technical reasons, the skill logs it in the report and continues automatically — it never stops mid-run to ask questions. This makes it safe to run as a scheduled task while you sleep.

---

## Open calls, grants & residencies (Phase 6)

A separate mode for creative practitioners — run independently from the job search.

```
Find open calls for artists
```

**Rules:**
- **6-month horizon** — searches at least 6 months ahead from today's date
- **No expired deadlines** — any opportunity with a deadline before today is excluded
- **Link verification** — every link is checked: must resolve without error, lead to the current cycle's page (not a prior year's closed call), and point to the specific apply page (not a generic homepage)
- Rolling / ongoing deadlines are included and labeled clearly
- Results organized into: Grants · Residencies · Open Calls · Aggregators

---

## Limitations

- Auto-applications only work where browser UI is available
- Vacancies with test tasks go to a separate list — no auto-apply
- Telegram search requires an active session in web.telegram.org
- The skill never stores passwords or asks for API keys
- Open call link verification may fall back to secondary sources when direct fetch is blocked

---

## Author

[Mari](https://github.com/blackasp)

---
---

# 🔍 Job Hunter — скилл для Claude

Универсальный скилл для автоматизации поиска работы в Claude.  
Работает для любой профессии, любой страны, любого языка.

---

## Что делает

- **Ежедневные отчёты** — артефакт со всеми найденными вакансиями и прямыми ссылками
- **Авто-отклики** — подаёт заявки там, где возможно через браузер
- **Умная фильтрация** — по стеку, гео, зарплате, формату работы
- **Сопроводительные письма** — короткие (4–5 предложений), уникальные для каждой вакансии, на языке вакансии
- **Поиск везде** — hh.ru, LinkedIn, Habr Career, Telegram-каналы, нишевые борды; **+8 remote-платформ**: CONTRA, Himalayas, Dynamite Jobs, We Work Remotely, DailyRemote, JustRemote, Remote OK, ARC
- **Telegram-каналы** — автоматически находит живые каналы через tgstat.ru / telemetr.io
- **Отслеживание резюме** — обнаруживает изменения при каждом запуске
- **Безопасность** — самопроверка перед работой с личными данными
- **Опен-коллы, гранты и резиденции** — поиск творческих возможностей с проверкой дедлайнов (горизонт 6 месяцев)
- **Маппинг полей hh.ru** — читает `HH-Lux-InitialState` корректно: `vacancyId`, `compensation`, `@workSchedule`, `publicationTime/@timestamp`
- **NAME-синтаксис** — поиск только по заголовку вакансии, исключает ложные срабатывания из описания
- **Счётчик только по HTTP 200** — 403 = уже откликались, 429 = стоп, остальное = ошибка; ошибки не считаются
- **Детекция капчи** — `{blocked: true}` останавливает весь цикл откликов + PushNotification
- **Проверка ранее поданных** — загружает историю переговоров через DOM-парсинг перед стартом
- **Защита от rate limit** — 800мс пауза между откликами
- **Устойчивость к сетевым ошибкам** — try/catch на все fetch-запросы; одна ошибка не прерывает весь запуск
- **Имя из API** — всегда из `api.hh.ru/me`, никогда не угадывается
- **Все приглашения** — показываются без фильтра по дате
- **Настраиваемый лимит откликов** — задаётся при онбординге: без лимита или N в день; меняется в любой момент одной фразой
- **Объяснение нулевого результата** — если 0 вакансий прошло фильтры, отчёт содержит разбивку по каждому фильтру и предложение ослабить главный
- **Определение холодного старта** — если последний запуск был 14+ дней назад, сначала проверяет авторизацию на платформах и активность каналов

---

## Требования

| | |
|---|---|
| **Платформа** | Claude.ai |
| **План** | Pro или выше (на Free скиллы недоступны) |
| **Браузер** | Claude in Chrome (расширение) — для авто-откликов и поиска |

### Рекомендуемые модели

| Уровень | Модель | Комментарий |
|---------|--------|-------------|
| **Минимум** | Claude Haiku 5.5 | Базовый поиск и фильтрация пройдут. Кавер-леттеры получатся шаблонными. Сложные проверки (капча, DOM-парсинг, маппинги InitialState) могут теряться. |
| **Оптимум** | **Claude Sonnet 5.5** | Уверенно выполняет все фазы: поиск, фильтрацию, DOM-парсинг, кавер-леттеры под вакансию, отчёт. Лучшее соотношение качества и скорости. **Рекомендуется для ежедневных запусков.** |
| **Максимум** | Claude Opus 5.5 / Fable 5.1 | Лучше справляется с нестандартными ситуациями (сломанный DOM, неожиданная структура ответа), пишет более точные кавер-леттеры. Имеет смысл для первого онбординга или если Sonnet стабильно пропускает вакансии. |

---

## Установка

1. Открой **claude.ai → Settings → Skills**
2. Нажми **Add skill**
3. Скопируй содержимое файла [`SKILL.md`](./SKILL.md) и вставь
4. Сохрани

---

## Первый запуск

Напиши в Claude:

```
Найди мне работу
```

Скилл сам проведёт:
- Проверку безопасности
- Выбор языка
- Онбординг (один раз, ~2 минуты)
- Настройку платформ и Telegram-каналов

Если у тебя уже есть профиль поиска в памяти Claude — скилл предложит импортировать его вместо повторного онбординга.

---

## Как запускать поиск

**Вариант 1 — вручную** (работает сразу):

```
Запусти поиск работы
```

Скилл ищет вакансии, фильтрует, отправляет отклики и создаёт отчёт-артефакт.

**Вариант 2 — по расписанию** (через Claude Code):  
Настрой scheduled task в Claude Code — скилл будет запускаться автоматически каждый день без твоего участия.

---

## Что происходит при каждом запуске

1. Проверяет резюме на изменения
2. **Динамически находит платформы** через веб-поиск (никакого жёстко заданного списка)
3. Ищет вакансии на всех платформах и в Telegram-каналах
4. Фильтрует и ранжирует по твоему профилю
5. Спрашивает подтверждение перед откликами (или откликается автоматически при запуске по расписанию)
6. Отправляет отклики с уникальными письмами
7. Создаёт отчёт-артефакт — **всегда, даже если 0 вакансий найдено**

**Каждая фаза обязательна.** Если фаза не выполнилась по технической причине — скилл записывает это в отчёт и идёт дальше автоматически. Никаких остановок и вопросов посреди запуска — можно ставить на ночное расписание.

---

## Опен-коллы, гранты и резиденции (Фаза 6)

Отдельный режим для творческих практиков — запускается независимо от поиска работы.

```
Найди опен-коллы для художников
```

**Правила:**
- **Горизонт 6 месяцев** — поиск не менее чем на 6 месяцев вперёд от текущей даты
- **Без просроченных дедлайнов** — любая возможность с дедлайном раньше сегодняшнего дня исключается
- **Проверка ссылок** — каждая ссылка проверяется: должна открываться без ошибки, вести на страницу текущего цикла (не прошлогоднего закрытого конкурса) и указывать на конкретную страницу подачи (не общую главную)
- Rolling / ongoing дедлайны включаются и помечаются отдельно
- Результаты сгруппированы по: Гранты · Резиденции · Опен-коллы · Агрегаторы

---

## Ограничения

- Авто-отклики работают только там, где есть браузерный интерфейс
- Вакансии с тестовым заданием — в отдельный список, без авто-отклика
- Telegram-поиск требует активной сессии в web.telegram.org
- Скилл не хранит пароли и не запрашивает API-ключи
- Проверка ссылок для опен-коллов может использовать вторичные источники, если прямой доступ заблокирован

---

## Автор

[Mari](https://github.com/blackasp)
