# JOB HUNTER 2.1 — Release Report

**Дата:** 2026-11-18  
**Версия:** 2.1  
**Статус:** ✅ Выпущена. Тег: `v2.1`. Дата релиза: 2026-11-18.

---

## 1. Список изменений по этапам

### Stage 1 — Filter hardening (PR #22, merged)
- Исправлены 3 бага в `filterFull()` (BUG-A, BUG-B, BUG-C)
- Добавлено 40 тестов (`references/tests.js`)
- Создана базовая линия `references/tests-baseline.md`

### Stage 2 — requirementsBlock fix (PR #24, merged)
- Исправлен BUG-6: `requirementsBlock()` возвращала весь текст когда находила только заголовки типа «Будет плюсом» / «Условия» — теперь возвращает `''`
- Добавлены тесты T-41–T-52 (12 тестов на nice-to-have / условия / о компании)
- Итого фильтр-тестов: 52/52

### Stage 3 — Deduplication (PR #25, merged)
- Создан `references/dedup.md` с полной реализацией:
  - `dedupVacancies(raw, history)` — основная функция
  - `vacancyFingerprint(a, b)` — score + signals; порог ≥70 = confident, 50–69 = probable
  - `mergeVacancies(canonical, duplicate)` — аккумулирует `seen_in[]`, не перезаписывает оригинал
  - `normText`, `normCompany`, `normUrl`, `trigramSim` — вспомогательные функции
- Agent 1.5 определён как под-шаг внутри Agent 2 (не отдельный агент)
- Добавлены тесты T-53–T-59 (7 тестов)

### Stage 4 — Freshness validation (PR #27, merged)
- Создан `references/freshness.md` с полной реализацией:
  - `checkFreshness(vacancy, profile)` — 4 статуса: `актуальна` / `вероятно устарела` / `закрыта` / `неизвестно`
  - Строгое разделение 4 полей дат: `published_at`, `updated_at`, `discovered_at`, `verified_at`
  - `discovered_at` **никогда** не используется вместо `published_at`
  - Порог: `max_vacancy_age_days` из профиля (default 30)
- Обновлён `references/filters.md` — добавлено правило #2 (freshness)
- Добавлены тесты T-60–T-67 (8 тестов)

### Stage 5 — Интеграция и финальная проверка (PR #28, merged)

#### 5.1 Исправлена несогласованность в orchestrator.md
- **Проблема:** Step 2 указывал «Load: `references/filters.md` ONLY», но Agent 2 должен запускать `dedupVacancies` и `checkFreshness` — из файлов, которые не были указаны в загрузке.
- **Исправлено:** Step 2 теперь загружает `references/filters.md` + `references/dedup.md` + `references/freshness.md` и явно описывает порядок вызовов: dedup → freshness → filterFull.

#### 5.2 Freshness в отчёте
- **Проблема:** Статус свежести вакансии нигде не отображался в отчёте, несмотря на то что pipeline его вычисляет.
- **Исправлено:** В `modes/report.md` добавлена колонка «Свежесть» в таблицы «Авто-отклики» и «Требуют ручного отклика».

#### 5.3 Регрессионное тестирование
- Результаты: **67/67 тестов проходят** (см. раздел 3)

#### 5.4 Документация
- Обновлён `references/tests-baseline.md` с 40 до 67 тестов, добавлена таблица регрессионной истории

---

## 2. Изменённые файлы

| Файл | Этап | Изменение |
|------|------|----------|
| `references/filters.md` | Stage 1 + Stage 4 | filterFull() переписан (BUG-A/B/C), правило freshness #2 добавлено |
| `references/dedup.md` | Stage 3 | Создан новый файл |
| `references/freshness.md` | Stage 4 | Создан новый файл |
| `references/tests.js` | Stage 1–4 | Расширен с 40 до 67 тестов |
| `references/tests-baseline.md` | Stage 1 + Stage 5 | Обновлена базовая линия (40→67) |
| `modes/orchestrator.md` | Stage 5 | Step 2: добавлены dedup.md и freshness.md в загрузку |
| `modes/report.md` | Stage 5 | Колонка «Свежесть» в «Авто-отклики» и «Требуют ручного отклика» |

---

## 3. Результаты тестирования

```
Команда: node references/tests.js

Filter (T-01–T-52):   52/52 ✓
Dedup  (T-53–T-59):    7/7  ✓
Freshness (T-60–T-67): 8/8  ✓
─────────────────────────────
ИТОГО:                67/67 ✓
```

### Сравнение с базовой линией

| Метрика | До (baseline v2.1 initial) | После |
|---------|---------------------------|-------|
| Всего тестов | 40 | 67 |
| Провалено | 0 | 0 |
| Покрытых сценариев | filter only | filter + dedup + freshness |
| Новые тесты | — | +27 (dedup: 7, freshness: 8, requirementsBlock: 12) |
| Регрессии | — | 0 |
| Ложных срабатываний | 0 | 0 |
| Потерянных вакансий | 0 | 0 |

**Улучшений над базовой линией:** 27 новых тестов покрывают ранее непроверенную логику дедупликации, свежести и граничные случаи requirementsBlock. Регрессий нет.

---

## 4. Проверка согласованности пайплайна (5.1)

Пайплайн в `modes/orchestrator.md` после исправления:

```
Agent 1 (Search)
  → raw_vacancies[]

Agent 2 (Filter) — загружает filters.md + dedup.md + freshness.md
  1. dedupVacancies(raw_vacancies, history)   → deduped_vacancies[]
  2. checkFreshness(vacancy, profile)          → freshness gate
  3. filterFull(name, desc, vac, profile)      → filtered_vacancies[]

Agent 3 (Apply)
  → apply_results[]

Agent 4 (Report)
  → Claude Doc
```

**Порядок в `references/filters.md`** (универсальные фильтры):
1. Role match
2. Freshness (checkFreshness)
3. Deduplication (run BEFORE filterFull)
4. Work permit check
5. English level check

Архитектурная заметка: в таблице фильтров freshness (#2) стоит перед dedup (#3), но дедупликация запускается отдельным шагом ДО вызова filterFull — это корректно. Порядок в таблице отражает логику фильтрации, а не порядок вызовов функций.

---

## 5. Проверка отчёта (5.2)

Пользователь может понять из отчёта:

| Информация | Где отображается |
|-----------|----------------|
| Почему вакансия включена | filter_passed: true + reason отсутствует |
| Какие обязательные критерии выполнены | checks[] в filter result |
| Что неизвестно | Свежесть ⚠️ неизвестно в колонке «Свежесть» |
| Риски | ⚠️ Требуется разрешение на работу / ⚠️ Требуется уровень |
| Свежесть вакансии | Колонка «Свежесть» — актуальна / ⚠️ неизвестно |
| Возможный дубликат | 👁 seen_before / ⚠️ dedup_flag: probable |

Статусы «вероятно устарела» и «закрыта» в отчёт не попадают — вакансии заблокированы на этапе фильтрации с `blocked_reason: freshness-stale / freshness-closed`.

---

## 6. Известные ограничения

### Дедупликация
- Алиасинг компаний (Яндекс vs Yandex) не обрабатывается — потенциальные дубли могут пройти
- Telegram-репосты с изменёнными URL — не определяются как дубли
- Нет нечёткого сравнения описаний (только тайтл + компания + URL)

### Freshness
- `updated_at` из hh.ru API отражает «обновление позиции» (refresh), а не реальное изменение вакансии — вакансия может быть старой при свежем `updated_at`
- Платформы без `published_at` (часть Telegram-каналов) будут часто давать статус `неизвестно` — ожидаемо и задокументировано
- Единственный 404 не считается закрытием — нужна явная метка от работодателя

### Тесты
- Нет E2E тестов на Agent 1 (search), Agent 3 (apply), Agent 4 (report) — требуют инфраструктуры (mock API)
- Нет интеграционного теста полного пайплайна

---

## 7. Сознательно отложено на следующий этап

| Фича | Причина отложки |
|------|----------------|
| E2E pipeline тест | Требует mock hh.ru API + mock apply flow |
| Company aliasing в dedup | Объём работы несоразмерен текущему этапу; задокументировано как known limitation |
| Автоматическое обновление `verified_at` | Требует изменений в Agent 1 (search) |
| Fuzzy description matching в dedup | Неопределённая польза при высокой сложности |
| Freshness в «Заблокированы / Plus» | Заблокированные вакансии видны пользователю с blocked_reason — этого достаточно |

---

## 8. Рекомендации для следующего этапа

1. **Stage 6 — E2E тест:** mock-прогон полного пайплайна с заранее известными входными данными; проверить, что отчёт содержит ровно те вакансии, что прошли все фильтры.
2. **Stage 6 — Автообновление `verified_at`:** Agent 1 при успешной загрузке страницы вакансии устанавливает `verified_at = now()`.
3. **Мониторинг:** после первого реального прогона с v2.1 — проверить, сколько вакансий получают freshness `неизвестно` и насколько это мешает работе.
