# 🔍 Job Hunter — Claude Skill

A universal job search automation skill for Claude.  
Works for any profession, any country, any language.

---

> **Stay updated:** Click **Watch → Releases only** at the top of this page to get notified when a new version comes out.

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
- **Captcha-risk pacing** — human-like random delays (3–8 s per application, 30–60 s after every 5, 3–5 min after every 20) that can only be made slower (`apply_pacing: careful`), and slow down automatically for 7 days after any captcha or block
- **Network error resilience** — try/catch on all fetch calls; single error never aborts the run
- **User name from API** — always fetched from `api.hh.ru/me`, never guessed
- **Interview invitations** — the last 2 months, newest first, with company, role, link and date
- **Application limit** — none by default; an optional daily limit can be set at any time with a single phrase
- **Zero results explained** — if 0 vacancies pass filters, the report includes a full breakdown by filter and a suggestion to relax the top one
- **All result pages, stop on freshness** — every page of a platform is read, newest first, until a whole page is older than your freshness limit
- **Search-only on platforms without a login** — newly found platforms are searched and reported («Требуется регистрация») but never applied to or registered on
- **Telegram channels verified by their posts** — a channel is listed only if a relevant vacancy of the last N days was actually seen in it; unreadable channels are reported separately
- **Personal settings kept apart from the rules** — profession, keywords, geography, blockers, freshness, pacing and the salary question are per-user; a new user starts with no filters
- **Technology blockers read in the right place** — only the «Requirements» and «Responsibilities» blocks; «nice to have» does not block
- **Run journal** — start/end of every step, pages and vacancies per platform, blocks; decides when the next full discovery is due
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
3. Upload the skill **as a folder** (or a zip) containing `job-hunter-skill.md` as the entry file together with the `modes/` and `references/` folders. The entry file loads the modes it needs; if only the entry file is installed, it reads the rest from this repository.
4. Save

### Structure

```
job-hunter-skill.md        entry file: rules, settings model, map of modes
modes/                     onboarding, daily-search, telegram, apply, report, creative
references/                platforms, filters, run-journal, profile-template
```

Personal settings are never stored in this repository (it is public); `references/profile-template.md` is a neutral template of the fields.

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
2. Opens the run journal and decides between a quick scan and a full discovery of new channels and platforms (every 3 days by default)
3. Searches all platforms (all pages, newest first) and re-reads Telegram channels
4. Filters and ranks by your profile
5. Asks for confirmation before applying in a live session (treated as given in advance in a scheduled run)
6. Submits applications with short unique cover letters (4–5 sentences) at a human pace
7. Creates a report with direct links — **always created, even if 0 vacancies found** — and writes the journal row

**Every phase is mandatory.** If a phase fails for technical reasons, the skill logs it in the report and continues automatically — it never stops mid-run to ask questions. This makes it safe to run as a scheduled task while you sleep.

---

## For artists — creative opportunities (independent from job search)

A separate mode for creative practitioners. Runs independently — has its own profile, its own report, never mixes with the job search.

On first run the skill asks once: your medium, career stage, geography, what to find, deadline horizon. Saves it. Never asks again.

---

### What you can ask for

**Open calls & competitions:**
```
Find open calls for digital art
Find open calls for AI art with deadline in the next 3 months
Find competitions for light installations
Find open calls on e-flux
```

**Residencies:**
```
Find residencies for new media artists
Find residencies in Europe for digital art
Find residencies with stipend for emerging artists
```

**Art fairs:**
```
Find art fairs I can apply to as an artist
Find fairs for digital / AI art
Find fairs with open applications in 2025
Which art fairs accept artists directly (not only galleries)?
```

**Galleries:**
```
Find galleries that show digital art and accept submissions
Find galleries for AI art in Berlin
Find galleries specializing in light and sound installations
Find galleries open to unsolicited proposals
```

**Combined:**
```
Find all opportunities for my work — open calls, residencies, fairs, galleries
Find everything for digital media artists in the next 6 months
Update my creative profile (medium / geography / what to find)
```

---

### What the report contains

Each result gets its own block with:
- Direct link to the **application page** (never the homepage)
- Deadline (or "rolling" if ongoing)
- Fee, stipend, accommodation — if mentioned
- One-sentence note on fit with your medium
- Whether fairs accept artists directly or only through galleries

Expired links and past-year calls are removed automatically. If a link can't be verified, it's noted in the report rather than silently included.

---

### Rules
- **1-year horizon** by default — only future deadlines (configurable: 3 months / 6 months / 1 year / custom — set during onboarding or changed anytime: "change deadline horizon")
- **Medium matching** — a painting gallery won't appear in results for AI/digital art
- **Link verification** — every link checked: must open, lead to the current cycle, point to the apply page
- Rolling / ongoing deadlines included and labeled clearly

---

## Limitations

- Auto-applications only work where browser UI is available
- Vacancies with test tasks go to a separate list — no auto-apply
- Telegram search requires an active session in web.telegram.org
- The skill never stores passwords or asks for API keys
- Open call link verification may fall back to secondary sources when direct fetch is blocked

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full history of changes.

---

## Author

[Mari](https://github.com/blackasp)

---
---

# 🔍 Job Hunter — скилл для Claude

Универсальный скилл для автоматизации поиска работы в Claude.  
Работает для любой профессии, любой страны, любого языка.

---

> **Следи за обновлениями:** Нажми **Watch → Releases only** в правом верхнем углу страницы, чтобы получать уведомления о новых версиях.

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
- **Пауза против капчи** — случайные задержки как у человека (3–8 с на отклик, 30–60 с после каждых 5, 3–5 мин после каждых 20); их можно только замедлить (`apply_pacing: careful`), а после любой капчи или блокировки скилл замедляется сам на 7 дней
- **Устойчивость к сетевым ошибкам** — try/catch на все fetch-запросы; одна ошибка не прерывает весь запуск
- **Имя из API** — всегда из `api.hh.ru/me`, никогда не угадывается
- **Все приглашения** — показываются без фильтра по дате
- **Лимит откликов** — по умолчанию нет; необязательный дневной лимит можно задать одной фразой одной фразой
- **Объяснение нулевого результата** — если 0 вакансий прошло фильтры, отчёт содержит разбивку по каждому фильтру и предложение ослабить главный
- **Все страницы выдачи, остановка по свежести** — читаются все страницы площадки, от новых к старым, пока вся страница не окажется старше порога свежести
- **Только поиск на площадках без входа** — новые площадки ищутся и попадают в отчёт («Требуется регистрация»), но скилл не откликается и не регистрируется
- **Telegram-каналы проверяются по постам** — канал в списке только если в нём реально видна релевантная вакансия за последние N дней; недоступные каналы указываются отдельно
- **Личные настройки отдельно от правил** — профессия, слова, география, блокеры, свежесть, темп откликов и вопрос о зарплате задаются на пользователя; новый пользователь начинает без фильтров
- **Блокеры-технологии ищутся в нужном месте** — только в блоках «Требования» и «Обязанности»; «будет плюсом» не блокирует
- **Журнал запусков** — время каждого шага, страницы и вакансии по площадкам, блокировки; по нему определяется срок следующей полной проверки
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
3. Загрузи скилл **папкой** (или zip): входной файл `job-hunter-skill.md` вместе с папками `modes/` и `references/`. Входной файл подгружает нужные режимы; если установлен только он, остальное читается из этого репозитория.
4. Сохрани

### Структура

```
job-hunter-skill.md        входной файл: правила, модель настроек, карта режимов
modes/                     онбординг, ежедневный поиск, telegram, отклики, отчёт, творчество
references/                площадки, фильтры, журнал запусков, шаблон профиля
```

Личные настройки в этом репозитории не хранятся (он публичный); `references/profile-template.md` — нейтральный шаблон полей.

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
2. Открывает журнал запусков и выбирает: быстрый просмотр или полный поиск новых каналов и площадок (по умолчанию раз в 3 дня)
3. Ищет вакансии на всех площадках (все страницы, от новых к старым) и перечитывает Telegram-каналы
4. Фильтрует и ранжирует по твоему профилю
5. В живой сессии спрашивает подтверждение перед откликами (в запуске по расписанию оно считается данным заранее)
6. Отправляет отклики с короткими уникальными письмами (4–5 предложений) в человеческом темпе
7. Создаёт отчёт — **всегда, даже если 0 вакансий найдено** — и записывает строку в журнал

**Каждая фаза обязательна.** Если фаза не выполнилась по технической причине — скилл записывает это в отчёт и идёт дальше автоматически. Никаких остановок и вопросов посреди запуска — можно ставить на ночное расписание.

---

## Для художников — творческие возможности (независимо от поиска работы)

Отдельный режим для творческих практиков. Запускается независимо — свой профиль, свой отчёт, никогда не смешивается с поиском работы.

При первом запуске скилл спрашивает один раз: медиум, стадия карьеры, география, что искать, горизонт дедлайнов. Сохраняет. Больше не спрашивает.

---

### Что можно попросить

**Опен-коллы и конкурсы:**
```
Найди опен-коллы для диджитал-арта
Найди опен-коллы для AI art с дедлайном в ближайшие 3 месяца
Найди конкурсы для световых инсталляций
Найди опен-коллы на e-flux
```

**Резиденции:**
```
Найди резиденции для new media художников
Найди резиденции в Европе для диджитал-арта
Найди резиденции со стипендией для emerging artists
```

**Ярмарки:**
```
Найди арт-ярмарки, куда я могу подать заявку как художник
Найди ярмарки для диджитал / AI art
Найди ярмарки с открытыми заявками в 2025 году
Какие арт-ярмарки принимают художников напрямую, без галереи?
```

**Галереи:**
```
Найди галереи, которые показывают диджитал-арт и принимают заявки
Найди галереи для AI art в Берлине
Найди галереи, специализирующиеся на световых и звуковых инсталляциях
Найди галереи, открытые для unsolicited proposals
```

**Всё сразу:**
```
Найди все возможности для моих работ — опен-коллы, резиденции, ярмарки, галереи
Найди всё для digital media художников на ближайшие 6 месяцев
Обнови мой творческий профиль (медиум / география / что искать)
```

---

### Что содержит отчёт

Каждый результат — отдельный блок с:
- Прямой ссылкой на **страницу подачи** (никогда — на главную сайта)
- Дедлайном (или «rolling», если постоянный)
- Стоимостью участия, стипендией, жильём — если указано
- Одним предложением о соответствии твоему медиуму
- Пометкой, принимает ли ярмарка художников напрямую или только через галерею

Просроченные ссылки и прошлогодние коллы удаляются автоматически. Если ссылка не верифицируется — она отмечается в отчёте, а не включается молча.

---

### Правила
- **Горизонт 1 год** по умолчанию — только будущие дедлайны (настраивается: 3 месяца / 6 месяцев / 1 год / произвольно — задаётся при опросе или меняется в любой момент: «поменяй горизонт дедлайнов»)
- **Соответствие медиуму** — галерея для живописи не появится в результатах для AI/digital art
- **Проверка ссылок** — каждая ссылка проверяется: должна открываться, вести на текущий цикл, указывать на страницу подачи
- Rolling / ongoing дедлайны включаются и помечаются отдельно

---

## Ограничения

- Авто-отклики работают только там, где есть браузерный интерфейс
- Вакансии с тестовым заданием — в отдельный список, без авто-отклика
- Telegram-поиск требует активной сессии в web.telegram.org
- Скилл не хранит пароли и не запрашивает API-ключи
- Проверка ссылок для опен-коллов может использовать вторичные источники, если прямой доступ заблокирован

---

## Список изменений

См. [CHANGELOG.md](./CHANGELOG.md) для полной истории обновлений.

---

## Автор

[Mari](https://github.com/blackasp)
