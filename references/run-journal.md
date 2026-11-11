# Run journal

The journal answers three questions: *when was the last run, when was the last full discovery, and how long do the steps take.* It is how the skill decides between a quick scan and a full discovery, how pacing escalates after a block, and how timings can be audited with real numbers instead of estimates.

## Where it is kept

- **One living Claude Docs document** «Журнал запусков Job Hunter» (one table, one row per run, newest at the bottom). Its link is stored in the profile as `run_journal_url`. If the document does not exist yet, create it at the first run and save the link.
- The profile also holds two plain dates for quick decisions: `last_run_date` and `last_full_discovery_date`.
- The journal is **not** part of the locked report and does not change its format. Never put personal values into the repository.
- If the document cannot be written, keep the row in the session and show it in the report's summary line; tell the user once.

## Row format

| Field | Content |
|---|---|
| Дата | run date |
| Тип | live / unattended; quick / full discovery |
| Старт – конец | local time with UTC offset |
| Шаги, длительность | journal check; platforms; Telegram; web search for platforms; filtering; applications (including waits); report; journal |
| По площадкам | `[Platform]: N страниц, M проверено, K прошли фильтр` |
| Итоги | passed filter; applied (HTTP 200); manual; test assignments; blocked |
| Ошибки / блокировки | platform, kind (captcha, 429, login, unreachable, safety check), time |
| Подтверждение | asked / treated as given in advance |
| Следующая полная проверка | `last_full_discovery_date + discovery_interval_days` |

## How it is used

1. **Start of run:** read the last rows. Decide quick scan or full discovery (`modes/daily-search.md`, Step 2b). If a platform had a captcha, 429 or blocked click in the last 7 days, double the pacing for it (`modes/apply.md`, «Pacing»).
2. **During the run:** note the start and end of each step. Use real clock readings, never estimates.
3. **End of run:** write the row, update `last_run_date` (and `last_full_discovery_date` after a full discovery).
4. **Timing questions:** answer only from the rows; if fewer than 3 runs are logged, say the sample is too small for averages.

## Profile template reminder

At the end of a run (after the journal row), check whether the profile's structure changed outside the skill update. If it did, give the reminder defined in «Where the profile lives» in the main file.
