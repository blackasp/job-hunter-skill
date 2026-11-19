# Reference: hh.ru API Setup

## Почему это важно

hh.ru требует от всех приложений, обращающихся к API, передавать специальный заголовок `HH-User-Agent`. Без него запросы блокируются с ошибкой **«blacklisted user-agent»** (HTTP 403). Это **постоянное требование** — оно действует давно и применяется ко всем WebFetch и прямым API-запросам к `api.hh.ru`, `hh.ru` и зеркалам (rabota.by, hh.kz, hh1.az и т.д.).

## Обязательный заголовок

```
HH-User-Agent: JobHunterSkill/1.0 ({contact_email})
```

Где `{contact_email}` — контактный email регистранта из поля профиля `hh_contact_email` (если не задано — email пользователя).

Пример:
```
HH-User-Agent: JobHunterSkill/1.0 (user@example.com)
```

## Как передавать заголовок

Все запросы к hh.ru через WebFetch или REST API должны включать этот заголовок. В коде скилла:

```js
const hhUserAgent = `JobHunterSkill/1.0 (${profile.hh_contact_email || profile.email || 'user@example.com'})`;

// Добавлять к каждому запросу:
fetch('https://api.hh.ru/...', {
  headers: { 'HH-User-Agent': hhUserAgent }
});
```

## Поля профиля (добавить в job-hunter-profile.md)

```yaml
hh_client_id: ""          # Client ID из dev.hh.ru после регистрации приложения
hh_contact_email: ""      # Email для заголовка HH-User-Agent
```

## Регистрация на dev.hh.ru (рекомендуется для полного API-доступа)

Для полного доступа к API (включая endpoint'ы со стороны соискателя — `/applicant/negotiations`, `/resumes` и т.д.) необходимо зарегистрировать приложение на **dev.hh.ru**:

1. Перейти на **dev.hh.ru** → «Мои приложения» → «Создать приложение»
2. Заполнить форму (см. тексты ниже)
3. Скопировать полученный **Client ID** в поле профиля `hh_client_id`

### Тексты для формы на dev.hh.ru

**Название приложения:** JobHunterSkill

**Redirect URI:**
Если OAuth-авторизация через браузер не нужна: `https://localhost/callback`
Если есть личный домен — указать его.

**Description of the application / Описание приложения:**
> A personal job search automation tool. It runs daily searches across multiple job platforms, filters vacancies by saved preferences (role, work format, salary), and helps draft cover letters. All activity is on behalf of the account owner for their own personal job search.

**Information about the creator / Информация о создателе:**
> Individual developer. The application is created for personal use only.

**Who will use it / Кто будет использовать:**
> Only the account owner — for their own personal job search on hh.ru. No third parties.

**What tasks should the application solve / Задачи приложения:**
> 1. Daily search for fresh vacancies by keywords and filters (job title, work format, salary, publication date).
> 2. Fetching full vacancy details (requirements, description, salary).
> 3. Checking previously submitted responses to avoid duplicates.
> 4. Submitting responses with a cover letter.

**Functionality / Функциональность и API-методы:**
> - Search vacancies: `GET /vacancies`
> - Get vacancy details: `GET /vacancies/{id}`
> - Get current user info: `GET /me`
> - List user's resumes: `GET /resumes`
> - Get resume details: `GET /resumes/{id}`
> - List submitted responses: `GET /negotiations` / `GET /applicant/negotiations`
> - Submit a response: `POST /negotiations`

## Когда появляется «blacklisted user-agent»

Если прогон сообщает `blacklisted user-agent`:
1. В этом запросе не было заголовка `HH-User-Agent` или он был дефолтным.
2. Добавить заголовок **ко всем** WebFetch и API-запросам к любому домену hh.ru.
3. Если регистрация на dev.hh.ru уже выполнена — проверить, что `hh_client_id` и `hh_contact_email` заполнены в профиле.
4. Это не временная блокировка — это постоянная политика. Повторные попытки без исправления не помогут.
