# Orchestrator — Multi-Agent Daily Search Pipeline

> Load this file when routing a daily search run. It replaces the single-context run with a 4-agent pipeline. Each agent loads ONLY its own mode file, so no agent carries the memory cost of the previous steps.

---

## Why this architecture exists

The monolithic run loaded 5–7 files (~40 k tokens) into one context. Rules written in the first section were forgotten by the time the model reached step 20. The pipeline below solves this by giving each agent a minimal, focused context.

---

## Pipeline overview

```
Orchestrator (this file + job-hunter-skill.md universal rules)
    │
    ├─► Agent 1 — SEARCH   (loads: modes/daily-search.md + modes/threads.md + modes/telegram.md)
    │       Output → raw_vacancies[]
    │
    ├─► Agent 2 — FILTER   (loads: references/filters.md)
    │       Input  ← raw_vacancies[]
    │       Output → filtered_vacancies[]
    │
    ├─► Agent 3 — APPLY    (loads: modes/apply.md)
    │       Input  ← filtered_vacancies[]
    │       Output → apply_results[]
    │
    └─► Agent 4 — REPORT   (loads: modes/report.md)
            Input  ← filtered_vacancies[] + apply_results[]
            Output → Claude Doc (run report)
```

---

## Data contracts

### Agent 1 → Agent 2: `raw_vacancies[]`

Each item must have:
```json
{
  "id": "<platform>_<vacancyId>",
  "platform": "hh.ru | linkedin | telegram | threads | ...",
  "title": "...",
  "company": "...",
  "url": "...",
  "salary_min": null,
  "salary_max": null,
  "salary_currency": null,
  "location": "...",
  "work_format": "remote | office | hybrid | unknown",
  "posted_date": "ISO-8601",
  "description_snippet": "first 400 chars of description",
  "full_description": "full text if already fetched, else null",
  "source_channel": "telegram channel name if TG, else null",
  "tg_message_link": "https://t.me/ch/NNN if TG, else null",
  "raw": {}
}
```

### Agent 2 → Agent 3: `filtered_vacancies[]`

Same shape as `raw_vacancies[]`, plus:
```json
{
  "filter_passed": true,
  "filter_reason": null,
  "needs_manual": false,
  "manual_reason": null,
  "blocked": false,
  "blocked_reason": null
}
```

Items with `blocked: true` are NOT passed to Agent 3. Items with `needs_manual: true` are passed to the report only.

### Agent 3 → Agent 4: `apply_results[]`

```json
{
  "vacancy_id": "<platform>_<vacancyId>",
  "action": "auto_applied | manual_required | skipped_test_task | skipped_no_login | skipped_plus | skipped_blocked",
  "cover_letter_sent": true,
  "applied_at": "ISO-8601",
  "tg_hr_message_sent": false,
  "notes": "..."
}
```

---

## Orchestrator dispatch instructions

When a daily search run is requested:

**Step 1 — Start Agent 1 (Search)**
- Load: `modes/daily-search.md`, `modes/threads.md`, `modes/telegram.md`
- Do NOT load apply.md or report.md at this step
- Agent 1 runs the full Phase A breadth sweep across all mandatory sources
- Agent 1 runs Phase B depth fetch for all candidates from Phase A
- Agent 1 returns `raw_vacancies[]`
- Write `raw_vacancies[]` to in-session variable before moving on

**Step 2 — Start Agent 2 (Filter)**
- Load: `references/filters.md` ONLY
- Pass `raw_vacancies[]` from Step 1
- Do NOT load apply.md or report.md at this step
- Agent 2 applies `filterFull()` to every item
- Agent 2 returns `filtered_vacancies[]` (with `blocked`, `needs_manual` flags)
- Write `filtered_vacancies[]` to in-session variable before moving on

**Step 3 — Start Agent 3 (Apply)**
- Load: `modes/apply.md` ONLY
- Pass only items where `filter_passed: true AND needs_manual: false AND blocked: false`
- Do NOT load daily-search.md or report.md at this step
- Agent 3 applies autonomously, writes cover letters, respects pacing rules
- Agent 3 returns `apply_results[]`

**Step 4 — Start Agent 4 (Report)**
- Load: `modes/report.md` ONLY
- Pass `filtered_vacancies[]` + `apply_results[]`
- Agent 4 creates the Claude Doc report
- Agent 4 writes the run journal entry

---

## Exit checklist for the Orchestrator

Before declaring the daily run complete, verify ALL of the following:

- [ ] Agent 1 ran and returned `raw_vacancies[]` (even if empty — that is a valid result)
- [ ] Agent 2 ran on the full `raw_vacancies[]` list, not a subset
- [ ] Agent 3 ran on every item where `filter_passed: true AND needs_manual: false`
- [ ] Agent 4 produced a Claude Doc with all 7 required sections
- [ ] Run journal was updated
- [ ] No agent was skipped due to "time ran out" or similar — if a real error occurred, it is logged in the report

If any check fails → note the failure in the report and do not mark the run as complete.

---

## Rules that apply at orchestration level

These rules come from `job-hunter-skill.md` and must be enforced by the Orchestrator, not delegated to individual agents:

1. All mandatory sources must be attempted — Agent 1 may not skip a source silently.
2. No salary mentioned in cover letters — Agent 3 must comply.
3. All links in the final report must be clickable and verified.
4. Telegram vacancies must include direct message links.
5. Report format is locked — Agent 4 must not alter section order.
6. Browser-first rule — if Agent 1 encounters ERR_CONNECTION_RESET or 403, it switches to browser immediately.
7. Pacing is fixed — Agent 3 may not speed up pacing regardless of vacancy count.
