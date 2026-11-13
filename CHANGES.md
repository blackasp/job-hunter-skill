# Multi-Agent Architecture Refactor

## Summary

Refactored the daily search run from a monolithic single-context execution into a 4-agent pipeline. The root cause of recurring rule violations was identified: loading 5–7 mode files (~40 k tokens) into one model context caused rules written in early sections to be forgotten by the time later steps executed. The pipeline solves this by giving each agent a minimal, focused context.

---

## Problem being solved

Every daily search run loaded `daily-search.md`, `filters.md`, `apply.md`, `report.md`, `telegram.md`, `threads.md`, and the main skill file into a single context. By step 20 of a run, the model no longer reliably applied rules from step 1. This produced recurring errors:

- Sources skipped silently ("ran out of time")
- Salary check skipped before applying
- Test assignment check missing
- `window.__confirmedApplied` not updated correctly
- RU-only geo exclusion missed softer phrasings
- 1С tech blocker matched in full description instead of requirements block only
- Report sections missing or reordered

---

## Changes made

### New file: `modes/orchestrator.md`

Defines the 4-agent pipeline for daily search runs:

- **Agent 1 — Search** loads `modes/daily-search.md` + `modes/threads.md` + `modes/telegram.md` only. Runs full Phase A breadth sweep, then Phase B depth. Returns `raw_vacancies[]`.
- **Agent 2 — Filter** loads `references/filters.md` only. Applies `filterFull()` to every item. Returns `filtered_vacancies[]` with `filter_passed`, `blocked`, `needs_manual` flags.
- **Agent 3 — Apply** loads `modes/apply.md` only. Applies autonomously to all items where `filter_passed: true AND needs_manual: false`. Returns `apply_results[]`.
- **Agent 4 — Report** loads `modes/report.md` only. Creates the Claude Doc report from `filtered_vacancies[]` + `apply_results[]`.

Also defines:
- Strict JSON data contracts between agents (`raw_vacancies[]`, `filtered_vacancies[]`, `apply_results[]`)
- Orchestrator-level exit checklist (run is not complete unless all 4 agents finished and all checks pass)
- Rules enforced at orchestration level (not delegated to agents)

### Updated: `job-hunter-skill.md`

- Routing table: daily search run row now points to `modes/orchestrator.md` with explicit instruction **not** to load all mode files at once
- Added Universal rules 14, 15, 16:
  - Rule 14: Browser first, no workarounds (was present in installed skill, missing from repo)
  - Rule 15: Resolve redirects before listing as manual (same)
  - Rule 16: **Multi-agent pipeline is mandatory for daily runs** — loading all mode files into one context is explicitly prohibited

### Updated: `modes/daily-search.md`

Added **Agent 1 (Search) exit checklist** at the end of the file. Agent 1 may not hand off `raw_vacancies[]` until all checks pass:
- Every mandatory source has a ledger row with a final status
- Threads was searched first
- Phase A breadth sweep completed before any Phase B depth work
- Every `raw_vacancies[]` item has all required fields
- Telegram vacancies without `tg_message_link` are dropped
- Browser fallback was used for failed WebFetch calls

### Updated: `modes/apply.md`

Added **Agent 3 (Apply) exit checklist** at the end of the file. Agent 3 may not return `apply_results[]` until all checks pass:
- Salary check performed before every application (Bug 2 fix)
- Full object pushed to `window.__confirmedApplied`, not just ID (Bug 3 fix)
- Test assignment check performed before every application (Bug 4 fix)
- Pacing rules respected throughout
- No salary in cover letters
- All cover letters have exactly 5 parts and 4–5 sentences

### Updated: `modes/report.md`

Added **Agent 4 (Report) exit checklist** at the end of the file. Agent 4 may not declare the run complete until all checks pass:
- Report is a Claude Doc (not chat message, not HTML artifact)
- All 7 required sections present in correct order
- Every link is clickable (no bare URLs)
- All links verified
- No empty sections omitted — empty sections get «—»
- No walls of text

### Updated: `references/filters.md`

Added **Agent 2 (Filter) exit checklist** at the end of the file. Agent 2 may not return `filtered_vacancies[]` until all checks pass:
- `filterFull()` applied to every item, no sampling
- 1С check used `requirementsBlock()` — not full description (Bug 1 fix)
- RU-only geo exclusion used expanded regex (Bug 2 fix)
- Every item has `filter_passed`, `blocked`, `needs_manual` flags
- Every blocked/manual item has reason populated

---

## Token budget improvement

| Before | After |
|---|---|
| ~40 k tokens of instructions per run (all files in one context) | ~8–12 k tokens per agent (one mode file + relevant data only) |
| Rules from step 1 forgotten by step 20 | Each agent has fresh context, no rule forgotten |
| No structural enforcement — model must "remember" to check | Exit checklists block agent handoff until checks pass |

---

## Files changed

```
modes/orchestrator.md        — NEW
job-hunter-skill.md          — updated routing table, added rules 14–16
modes/daily-search.md        — added Agent 1 exit checklist
modes/apply.md               — added Agent 3 exit checklist
modes/report.md              — added Agent 4 exit checklist
references/filters.md        — added Agent 2 exit checklist
```
