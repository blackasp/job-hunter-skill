# Mode: creative opportunities

## Creative opportunities (on request)

A separate mode for artists, designers, and creative practitioners. Runs independently from the job search — does not affect the daily run, application history, or profile.

**Trigger phrases (any language):**
- "find open calls", "find residencies", "find art fairs", "find galleries for my work"
- "найди опен-коллы", "найди резиденции", "найди ярмарки", "найди галереи под мои работы"
- "find opportunities for [medium]", "where can I submit my work", "find calls for digital art / AI art / light installations"

**Before searching:** ask the user (once, save to profile):
1. Medium / format: digital art, AI art, painting, photography, light/sound installation, video, mixed media — or combination
2. Career stage: emerging / mid-career / established
3. Geography: open to international / Europe only / specific countries
4. What to find (they can pick several):
   - Open calls & competitions
   - Residencies
   - Art fairs (to apply as exhibitor)
   - Galleries (to approach for representation or exhibition)
5. Deadline horizon: how far ahead to look? Options: 3 months / 6 months / 1 year / custom. **Default: 1 year.** User can change anytime by saying "update my creative profile" or "change deadline horizon".

Save answers as `creative_profile` in `/areas/job-hunter-profile.md`. On subsequent runs — skip the interview, use saved profile.

---

### 6a: Open calls & competitions

Search sources:
- **Aggregators:** e-flux.com/announcements, artrabbit.com, callforentry.org (CaFÉ), submittable.com, transartists.org, resartis.org
- **Medium-specific:** Ars Electronica (digital/AI), FILE Festival, ISEA, Prix Net Art — for digital/AI/interactive work
- **Web search:** `"open call" [medium] [year] deadline site:e-flux.com OR site:artrabbit.com`

**Rules:**
- Deadline must be in the future (today or later) — never show expired calls
- Use the deadline horizon from `creative_profile` (default: 1 year ahead)
- Rolling / ongoing deadlines: include and label clearly as "rolling"
- Verify each link: must open without error, lead to the current cycle (not a past year's closed call)
- If direct fetch is blocked → use secondary source (aggregator page, cached version), note in report

---

### 6b: Residencies

Search sources: resartis.org, transartists.org, artistcommunities.org, e-flux.com/announcements

Filter by:
- Medium compatibility (a residency for painters ≠ a residency for digital/AI art)
- Geography (if user specified)
- Duration (note it — some are 1 week, some 3 months)
- Whether stipend / accommodation is provided — flag this

---

### 6c: Art fairs (exhibitor applications)

Art fairs where artists or galleries can apply to exhibit:

**Major international:** Frieze, Art Basel, NADA, Untitled Art Fair, Liste, CHART, Future Fair
**Digital/new media focused:** Ars Electronica Festival, transmediale, ISEA, Mutek
**Emerging artist fairs:** Supermarket Art Fair, VOLTA, Paper Positions

Search for: `"[fair name] [year] application" OR "open application [fair name]"`

**Rules:**
- Application deadline must be in the future
- Distinguish: some fairs accept galleries only, some accept artists directly — note which
- Include application fee if mentioned
- Link must go to the application page, not the fair's homepage

---

### 6d: Galleries (for representation or exhibition proposals)

**Only suggest galleries that match the user's medium.** A gallery that shows oil paintings is irrelevant for AI/digital art.

**For digital / AI art / new media:**
Search: `"digital art gallery" open submissions [year]`, `"AI art" gallery representation`, `"new media art" gallery call`

Known galleries in this space: Bitforms Gallery (NY), Gazelli Art House (London/Baku), Nome Gallery (Berlin), Carroll/Fletcher (London), Panke Gallery (Berlin), ADM Gallery (Singapore), DAM Gallery (Berlin/Frankfurt)

**For light/sound/installation (large-format work):**
Requires venues with technical capacity (high ceilings, blackout, AV infrastructure). Search: `"immersive art" venue open call`, `"light installation" residency`, `"sound installation" exhibition proposal`

**Output per gallery:**
- Name + city
- What they show (medium)
- Whether they accept unsolicited submissions (and how)
- Direct link to submissions page or contact
- Note if submissions are currently open vs. ongoing

---

### 6e: Report format for creative opportunities

Create a separate Claude Docs document (never mix with job search report):

```
# 🎨 Творческие возможности — [дата]

## 📊 Итого
- Опен-коллы: N (дедлайны до [горизонт из creative_profile, по умолчанию 1 год])
- Резиденции: N
- Арт-ярмарки (открытые заявки): N
- Галереи (принимают заявки): N
- Удалено (истёк дедлайн / ссылка не работает): N

---

## 📋 Опен-коллы и конкурсы [N]
Для каждого — отдельный блок:
**[Название]**
🔗 [ссылка на страницу подачи заявки]
📅 Дедлайн: [дата] / Rolling
💰 Взнос: [сумма или «бесплатно»]
📍 [место или «международный / онлайн»]
📝 [1 предложение о том, что ищут]

---

## 🏡 Резиденции [N]
Для каждой:
**[Название] — [место]**
🔗 [ссылка]
📅 Дедлайн: [дата] / Rolling
⏱ Длительность: [недели/месяцы]
💰 Стипендия / жильё: [да/нет/частично]
📝 [соответствие медиуму + 1 предложение]

---

## 🖼 Арт-ярмарки — открытые заявки [N]
Для каждой:
**[Название ярмарки] — [город, год]**
🔗 [ссылка на страницу заявки]
📅 Дедлайн заявки: [дата]
👤 Принимают: художников напрямую / только галереи / и тех и других
💰 Стоимость стенда: [если указана]

---

## 🏛 Галереи — принимают заявки [N]
Для каждой:
**[Название галереи] — [город]**
🔗 [страница для заявок]
📬 Как подать: [email / онлайн-форма / опен-колл]
🎨 Фокус: [что показывают]
📝 [1 предложение о соответствии]

---

## ⚠️ Примечания
(Ссылки без верификации, ярмарки только для галерей, опен-коллы за пределами горизонта и т.д.)
```

---
