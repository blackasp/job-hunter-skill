# Platform reference

Catalogue of job platforms by profession and geography, with per-platform search specifics. Used by `modes/onboarding.md` (building the user's platform list) and `modes/daily-search.md` (searching them). All platforms here are *candidates*: which ones are used is decided by the user's profile. A platform is searched with auto-apply only if the profile marks a confirmed login for it.

## Global rules: platform selection and reporting

**Platform selection by profession.** Each platform group is tagged `[scope: ...]`. Only search groups whose scope overlaps with the user's profession. Match logic:
- IT/tech roles (developer, analyst, QA, DevOps, PM, data) → groups tagged `IT`, `tech`, `analytics`, `universal`
- HR/recruitment roles → groups tagged `HR`, `universal`; skip `IT`-only groups
- Design roles → groups tagged `design`, `universal`; `IT` groups optional (many have design roles)
- Marketing/affiliate roles → groups tagged `marketing`, `affiliate`, `digital`, `universal`
- Finance/analytics roles → groups tagged `finance`, `analytics`, `BI`, `data`, `universal`
- `universal` groups (hh.ru, LinkedIn, remote aggregators) → always include regardless of profession
- When unsure — include the group; a 0-result check is cheap and the user decides over time

**Always report, even 0 results.** Every platform that was searched must appear in the run report. If a platform returned 0 matching vacancies — write status «проверен — 0 вакансий». Never silently skip a searched platform from the report. The user decides which platforms stay on their list based on actual results over time.

## Known platforms

Priority logic (determined dynamically by profession + geo). Select the most relevant platforms for the user's profession and location. All platforms below are available — choose the best fit, or include all when unsure.

**Level 1 — Russian-speaking IT (системный аналитик, разработчик, QA, DevOps, PM, дизайнер и др.):** `[scope: IT, tech, analytics, design, PM]`
- hh.ru + country HH domains: hh.kz, hh.uz, hh.ge, hh.am, cy.hh.ru, rabota.by
- [Habr Career](https://career.habr.com) — IT-специалисты, Россия и СНГ
- [getmatch.ru](https://getmatch.ru) — IT, русскоязычные компании с релокацией
- [geekjob.ru](https://geekjob.ru) — IT-вакансии
- [hirify.me](https://hirify.me) — AI-подбор вакансий, загрузка резюме
- [jobtoo.ru](https://jobtoo.ru) — IT и аналитика
- [talent-move.ru](https://talent-move.ru) — IT и аналитика
- [JobRocket](https://jobrocket.ru/ru/) — IT-вакансии с вилками и контактами рекрутёров (бета); удалённые помечены «Удаленно», свободного поиска нет — фильтр по категориям и технологиям
- [HireHi](https://hirehi.ru/) — агрегатор IT и digital вакансий; есть фильтр удалённого формата и поиск с операторами (+ обязательно, - исключить); вход по коду на почту или через Яндекс

**Level 1 — International IT / remote-friendly:** `[scope: IT, tech, analytics, PM, universal]`
- [LinkedIn](https://linkedin.com/jobs) — универсальная международная площадка
- [Indeed](https://indeed.com) — крупнейший агрегатор вакансий
- [Glassdoor](https://glassdoor.com) — вакансии + отзывы о компаниях
- [Wellfound](https://wellfound.com) (ex-Angel.co) — стартапы, tech-компании
- [Remote.co](https://remote.co) — только удалённые вакансии
- [We Work Remotely](https://weworkremotely.com) — популярная площадка удалённых вакансий
- [Working Nomads](https://workingnomads.com) — удалённые вакансии для цифровых кочевников
- [Daily Remote](https://dailyremote.com) — агрегатор удалённых вакансий
- [JustRemote](https://justremote.co) — фильтрованные удалённые позиции
- [Jobgether](https://jobgether.com) — удалённые вакансии, фокус на Европу
- [Remote Work](https://remoteok.com) — RemoteOK, агрегатор удалённых позиций

**Level 1 — Affiliate marketing, digital, AI:** `[scope: marketing, affiliate, AI, digital]`
- [ArbiHunter](https://arbihunter.com) — топ-площадка для Affiliate marketing, AI, digital; рекрутеры предпочитают её
- [AI Jobs](https://aijobs.net) — вакансии в AI/ML

**Level 1 — Дизайн:** `[scope: design, UI/UX, graphics]`
- [Behance Jobs](https://behance.net/joblist) — дизайнеры
- [Dribbble Jobs](https://dribbble.com/jobs) — UI/UX и графические дизайнеры
- [LinkedIn](https://linkedin.com/jobs) — дизайн и продукт

**Level 1 — Финансы, аналитика:** `[scope: finance, analytics, BI, data]`
- [LinkedIn](https://linkedin.com/jobs)
- [eFinancialCareers](https://efinancialcareers.com) — финансы и аналитика

**Level 1 — Нишевые и специализированные (remote/international):** `[scope: IT, tech, remote, universal]`
- [4dayweek.io](https://4dayweek.io) — вакансии с 4-дневной рабочей неделей; международные компании; без регистрации
- [Workaem](https://workaem.com) — агрегатор IT и digital вакансий, Россия и мир; без регистрации
- [CareerSpace](https://careerspace.app) — IT-карьера, подбор и рекомендации; без регистрации для просмотра
- [finder.work](https://finder.work) — удалённые вакансии, агрегатор; без регистрации
- [Сети / Vseti](https://www.vseti.app/jobs) — IT-соцсеть с вакансиями, удалёнка; без регистрации для просмотра
- [Remocate](https://www.remocate.app) — удалёнка и релокация; без регистрации
- [Generalist World](https://generalistworld.com) — платформа для специалистов с широким набором навыков; без регистрации

**Level 2 — Агрегаторы и нишевые платформы (универсальные):** `[scope: universal]`
- [WANTAPPLY](https://wantapply.com) — международные позиции напрямую от работодателей
- [FlexJobs](https://flexjobs.com) — гибкие и удалённые вакансии (платная подписка, но качество высокое)
- [PowerToFly](https://powertofly.com) — удалённые вакансии, фокус на diversity
- [Otta](https://otta.com) — tech-компании, подбор по ценностям
- [Toptal](https://toptal.com) — фриланс высокого уровня (разработчики, дизайнеры, финансы)
- [Crossover](https://crossover.com) — удалённые позиции, долгосрочные контракты (специфика: фиксированные ставки)
- [Monster.com](https://monster.com) — классический агрегатор
- [Simply Hired](https://simplyhired.com) — агрегатор, много позиций США
- [RemoteWoman](https://remotewoman.com) — удалённые вакансии, фокус на женщин в tech

**Level 2 — Прямые карьерные страницы tech-компаний:** `[scope: IT, tech]`
- [Supabase Careers](https://supabase.com/careers#positions) — open-source backend платформа
- Добавлять карьерные страницы конкретных компаний по запросу пользователя

**Level 3 — Telegram channels** (live, active — see `modes/telegram.md`)

**hirify.me specifics:** AI-powered job matching platform. Supports resume upload and automatic vacancy matching. Check the personal feed on each run (login required). URL: https://hirify.me/

**jobtoo.ru specifics:** Open https://jobtoo.ru/, search by user's profession keywords (from profile `keywords`) with remote filter.

**talent-move.ru specifics:** Open https://talent-move.ru/, search by user's profession keywords (from profile `keywords`) with remote filter.

**ArbiHunter specifics:** Open https://arbihunter.com, search by profession keywords. Особенно актуален для digital, affiliate, AI-специалистов.

**Supabase Careers specifics:** Open https://supabase.com/careers#positions — список открытых позиций. Нет фильтра по ключевому слову, просматривать весь список вручную.

**WANTAPPLY specifics:** Open https://wantapply.com, search by profession keywords. Много позиций зарубежом напрямую от работодателей.

**4dayweek.io specifics:** Open https://4dayweek.io/jobs, use search by keyword (e.g. "system analyst", "analyst"). Filter: Remote. No registration required to browse. Always include this platform in every run report — even if no vacancies found, mark status «проверен — 0 вакансий». Matching vacancies go to «Новые платформы — результаты поиска» with status «Требуется регистрация».

**Workaem specifics:** Open https://workaem.com, search by profession keywords. Агрегатор IT и digital вакансий для РФ и мира; отфильтровать «Удалённо». Без регистрации. Вакансии «только для РФ» — исключать. Always include in every run report even if no vacancies found.

**CareerSpace specifics:** Open https://careerspace.app, browse or search vacancies by keywords. Просмотр вакансий доступен без регистрации. Регистрация нужна только для отклика. Always include in every run report even if no vacancies found.

**finder.work specifics:** Open https://finder.work, search by keywords. Удалённые вакансии. Без регистрации для просмотра. Always include in every run report even if no vacancies found.

**Vseti specifics:** Open https://www.vseti.app/jobs, search by profession keywords. IT-соцсеть с разделом вакансий. Без регистрации для просмотра. Always include in every run report even if no vacancies found.

**Remocate specifics:** Open https://www.remocate.app, browse vacancies. Удалёнка и релокация. Без регистрации для просмотра. Always include in every run report even if no vacancies found.

**Generalist World specifics:** Open https://generalistworld.com, search by keywords. Для специалистов с широкими навыками. Без регистрации для просмотра. Always include in every run report even if no vacancies found.
