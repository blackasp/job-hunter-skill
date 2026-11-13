# Profile template (neutral — no personal values)

Fields the skill reads from the user's personal profile. The working copy lives in the user's own memory (see «Where the profile lives» in `SKILL.md`), not in this repository. Empty or missing fields mean «no filter».

```yaml
language:                          # chosen in onboarding
security_checked: false

## Search profile
job_title:                         # the user's own name for their profession
keywords: []                       # search keywords, any language
geo_preference:                    # where the user works from
geo_exclusions: []                 # e.g. [RU-only]
geo_inclusions: any                # or a list
work_format:                       # remote / office / hybrid
experience_years:
experience_level:                  # junior / mid / senior / lead
english_level:                     # A1–C2
work_permit_countries: []

## Freshness and cadence
max_vacancy_age_days: 30           # platforms
telegram_vacancy_max_age_days: 30
max_applications_per_source_per_run:          # optional cap of applications sent per source per run (e.g. 30); empty = no cap
discovery_interval_days: 7         # full search for new channels/platforms

## Threads (modes/threads.md)
threads_queries: []                # search phrasings built from job_title / keywords
threads_accounts: []               # aggregator / recruiter accounts read in full each run
threads_last_checked_date:         # empty = never searched
threads_first_run_days: 30
threads_overlap_days: 3

## Filters (personal)
user_blockers_tech: []             # block only if required / part of duties
user_blockers_global: []           # block anywhere in the text
role_exclusions: []                # block by title
show_no_salary: yes
salary_floor:                      # the skill asks per run if empty
salary_currency:
cover_letter_title_exclusions: []

## Resume
resume_url:                        # link; sent to HR contacts in messages
resume_hash:

## Platforms and channels
platforms: []                      # name, domains, login_confirmed: yes/no
telegram_channels: []              # name, link, specialization, last relevant vacancy, checked on

## Run state
last_run_date:
last_full_discovery_date:
run_journal_url:
applied_ids: []
manual_reviewed: []                # vacancies the user already handled by hand; never listed for manual review again
```
