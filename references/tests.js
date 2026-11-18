#!/usr/bin/env node
'use strict';

// ─── Polyfill window for Node.js ───────────────────────────────────────────
const window = {};

// ─── Paste filter implementation verbatim from references/filters.md ───────
window.W = s => new RegExp('(^|[^а-яёa-z0-9])(?:' + s + ')([^а-яёa-z0-9]|$)', 'i');
const esc = k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = k => new RegExp('(^|[^а-яёa-z0-9])' + esc(k) + '([^а-яёa-z0-9]|$)', 'i');

window.requirementsBlock = (desc) => {
  const text = (desc || '').replace(/\r/g, '');
  const head = /^\s*(требовани[яй]|ожидани[яй]|обязанности|задачи|чем\s+предстоит\s+заниматься|что\s+нужно\s+делать|requirements|responsibilities|you\s+will|what\s+you.ll\s+do|будет\s+плюсом|желательно|nice\s+to\s+have|условия|мы\s+предлагаем|о\s+компании|бонусы)[^\n]{0,40}:?\s*$/gim;
  const marks = [...text.matchAll(head)].map(m => ({ i: m.index, name: m[1].toLowerCase() }));
  if (!marks.length) return text;   // no structure => whole text (safe default)
  const counts = /^(требовани|ожидани|обязанност|задачи|чем|что\s+нужно|requirements|responsibilities|you|what)/;
  let out = '';
  marks.forEach((m, k) => { if (counts.test(m.name)) out += text.slice(m.i, marks[k + 1] ? marks[k + 1].i : text.length) + '\n'; });
  return out.trim() || '';   // structure found but no requirements sections => empty (fix BUG-6)
};

window.filterFull = (name, desc, vac, profile) => {
  if (vac && vac.employment?.id === 'probation') return { pass: false, reason: 'probation-hh' };
  const titleOnly = (name || '').replace(/\s+/g, ' ').trim();
  const full = (titleOnly + ' ' + (desc || '')).replace(/\s+/g, ' ');
  // Pass 1: title-only hard stops (before keyword match — fix BUG-B, BUG-C)
  if (profile.experience_level && profile.experience_level !== 'junior') {
    if (/стажировк|стажер|стажёр|стажёром|ученик|ищем\s+стаж/i.test(titleOnly)) return { pass: false, reason: 'intern' };
    if (window.W('junior|intern|trainee|apprentice').test(titleOnly)) return { pass: false, reason: 'junior' };
    if (/младший\s+аналитик/i.test(titleOnly)) return { pass: false, reason: 'junior' };
  }
  for (const r of (profile.role_exclusions || [])) if (wordRe(r).test(titleOnly)) return { pass: false, reason: 'role-excluded:' + r };
  // Pass 2: role match
  const roles = (profile.keywords || []).concat(profile.job_title ? [profile.job_title] : []).map(esc).join('|');
  if (roles && !new RegExp(roles, 'i').test(titleOnly)) return { pass: false, reason: 'role-mismatch' };
  // Pass 3: personal filters (fix BUG-A: резидент[а-яё]* covers резидентов/резидента etc.)
  if ((profile.geo_exclusions || []).some(g => /^ru-only$/i.test(g)) &&
      /удалённо\s+по\s+Росси|удаленно\s+по\s+Росси|удалённо\s+по\s+РФ|удаленно\s+по\s+РФ|на\s+территории\s+РФ|на\s+территории\s+России|работ[а-яё]*\s+в\s+РФ|только\s+в\s+РФ|только\s+в\s+России|резидент[а-яё]*\s+РФ|только\s+для\s+граждан\s+РФ|только\s+граждан[а-яё]*\s+РФ/i.test(full))
    return { pass: false, reason: 'RU-only' };
  const globalB = profile.user_blockers_global || profile.user_blockers || [];
  for (const b of globalB) if (wordRe(b).test(full)) return { pass: false, reason: 'blocker-global:' + b };
  const req = window.requirementsBlock(desc);
  const reqFull = titleOnly + (req ? ' ' + req : '');
  for (const b of (profile.user_blockers_tech || [])) if (wordRe(b).test(reqFull)) return { pass: false, reason: 'blocker-tech:' + b };
  const checks = ['experience-level', 'role-exclusions', 'role-match', 'geo-exclusions', 'blockers-global', 'blockers-tech'];
  return { pass: true, checks };
};

// ─── Paste dedup implementation verbatim from references/dedup.md ───────────
window.normText = s => (s || '').toLowerCase().replace(/[«»""''\-–—\/\\|]/g, ' ').replace(/\s+/g, ' ').trim();
window.normCompany = s => window.normText(s)
  .replace(/\b(ооо|оао|зао|пао|ао|нко|ип|inc\.?|ltd\.?|llc\.?|gmbh|s\.?a\.?|b\.?v\.?|corp\.?)\b/gi, '')
  .replace(/\s+/g, ' ').trim();
window.normUrl = u => {
  if (!u) return '';
  try {
    const p = new URL(u.startsWith('http') ? u : 'https://' + u);
    return (p.hostname.replace(/^www\./, '') + p.pathname).replace(/\/$/, '').toLowerCase();
  } catch { return (u || '').toLowerCase().trim(); }
};
window.trigramSim = (a, b) => {
  if (!a || !b) return 0;
  const tri = s => { const t = new Set(); for (let i = 0; i < s.length - 2; i++) t.add(s.slice(i, i + 3)); return t; };
  const ta = tri(a), tb = tri(b);
  let inter = 0;
  ta.forEach(g => { if (tb.has(g)) inter++; });
  return (2 * inter) / (ta.size + tb.size || 1);
};
window.vacancyFingerprint = (a, b) => {
  const signals = [];
  let score = 0;
  if (a.id && b.id && a.id === b.id) return { score: 100, signals: ['exact-id'] };
  const normA_url = window.normUrl(a.url);
  const normB_url = window.normUrl(b.url);
  if (normA_url && normB_url && normA_url === normB_url) {
    signals.push('exact-url'); score += 90;
  } else if (normA_url && normB_url) {
    const canon = u => u.split('?')[0];
    if (canon(normA_url) === canon(normB_url)) { signals.push('canonical-url'); score += 80; }
  }
  const compA = window.normCompany(a.company), compB = window.normCompany(b.company);
  const titleA = window.normText(a.title), titleB = window.normText(b.title);
  if (compA && compB && compA === compB) {
    if (titleA && titleB && titleA === titleB) { signals.push('exact-company-title'); score += 60; }
    else if (titleA && titleB) {
      const sim = window.trigramSim(titleA, titleB);
      if (sim >= 0.85) { signals.push('company-match+title-sim:' + sim.toFixed(2)); score += 50; }
    }
  }
  if (score === 0) return { score: 0, signals: ['distinct'] };
  if (a.location && b.location) {
    const locA = window.normText(a.location), locB = window.normText(b.location);
    if (locA && locB && locA === locB) { signals.push('location-match'); score += 10; }
  }
  if (a.posted_date && b.posted_date) {
    const diff = Math.abs(new Date(a.posted_date) - new Date(b.posted_date)) / 86400000;
    if (diff <= 7) { signals.push('date-within-7d'); score += 5; }
  }
  if (a.salary_min != null && b.salary_min != null && a.salary_min > 0 && b.salary_min > 0) {
    const ratio = Math.abs(a.salary_min - b.salary_min) / Math.max(a.salary_min, b.salary_min);
    if (ratio <= 0.1) { signals.push('salary-match'); score += 5; }
  }
  return { score, signals };
};
window.mergeVacancies = (canonical, duplicate) => {
  const seen_in = [...(canonical.seen_in || [{ platform: canonical.platform, url: canonical.url, id: canonical.id, posted_date: canonical.posted_date, source_channel: canonical.source_channel || null, tg_message_link: canonical.tg_message_link || null }])];
  seen_in.push({ platform: duplicate.platform, url: duplicate.url, id: duplicate.id, posted_date: duplicate.posted_date, source_channel: duplicate.source_channel || null, tg_message_link: duplicate.tg_message_link || null });
  const dates = seen_in.map(s => s.posted_date).filter(Boolean).sort();
  return { ...canonical, seen_in, posted_date: dates[0] || canonical.posted_date, dedup_confidence: 'confident', dedup_flag: null };
};
window.dedupVacancies = (raw, history) => {
  const result = [], usedIdx = new Set();
  for (let i = 0; i < raw.length; i++) {
    if (usedIdx.has(i)) continue;
    let canonical = { ...raw[i] };
    if (!canonical.seen_in) canonical.seen_in = [{ platform: canonical.platform, url: canonical.url, id: canonical.id, posted_date: canonical.posted_date, source_channel: canonical.source_channel || null, tg_message_link: canonical.tg_message_link || null }];
    for (let j = i + 1; j < raw.length; j++) {
      if (usedIdx.has(j)) continue;
      const fp = window.vacancyFingerprint(canonical, raw[j]);
      if (fp.score >= 70) { canonical = window.mergeVacancies(canonical, raw[j]); usedIdx.add(j); }
      else if (fp.score >= 50) {
        canonical = window.mergeVacancies(canonical, raw[j]);
        canonical.dedup_confidence = 'probable'; canonical.dedup_flag = 'probable'; canonical.dedup_signals = fp.signals;
        usedIdx.add(j);
      }
    }
    for (const h of (history || [])) {
      const fp = window.vacancyFingerprint(canonical, h);
      if (fp.score >= 70) { canonical.seen_before = true; canonical.seen_before_id = h.id; break; }
    }
    result.push(canonical);
  }
  return result;
};

// ─── Mari's real profile (from /areas/job-hunter-profile.md) ────────────────
const PROFILE = {
  job_title: "системный аналитик",
  keywords: [
    "системный аналитик", "system analyst", "systems analyst",
    "product analyst", "продуктовый аналитик",
    "бизнес-системный аналитик", "fullstack analyst", "фулстек аналитик",
    "аналитик данных", "data analyst"
  ],
  experience_level: "senior",
  geo_exclusions: ["RU-only"],
  role_exclusions: ["QA", "тестировщик", "DevOps", "разработчик", "программист", "frontend", "backend"],
  user_blockers_global: ["1С", "1C", "SAP"],
  user_blockers_tech: [
    "1С", "1C", "SAP",
    "Oracle APEX", "Bitrix", "Битрикс",
    "геймдев", "game dev", "gamedev"
  ]
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PASS = true, FAIL = false;

function makeVac(overrides = {}) {
  return {
    employment: { id: 'full' },
    ...overrides
  };
}

function run(id, scenario, name, desc, vacOverrides, expectedPass, expectedReasonPrefix, notes, extraCheck) {
  const vac = makeVac(vacOverrides);
  const result = window.filterFull(name, desc, vac, PROFILE);
  const passOk = result.pass === expectedPass;
  const reasonOk = expectedReasonPrefix
    ? (result.reason || '').startsWith(expectedReasonPrefix)
    : true;
  const extraOk = extraCheck ? extraCheck(result) : true;
  const ok = passOk && reasonOk && extraOk;
  const extraNote = (!extraOk && extraCheck) ? ' [extra-check failed]' : '';
  return { id, scenario, name, expected: expectedPass, got: result.pass, reason: result.reason || '', expectedReason: expectedReasonPrefix || '', ok, notes: notes + extraNote };
}

// ─── TEST CASES ──────────────────────────────────────────────────────────────
// Format: run(id, scenario, title, desc, vacOverrides, expectedPass, expectedReasonPrefix, notes)

const tests = [

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 1: Нормальная подходящая вакансия (должна пройти)
  // ══════════════════════════════════════════════════════════════════
  run('T-01', 'pass-normal',
    'Системный аналитик',
    `Требования:
Опыт работы системным аналитиком от 3 лет.
Знание UML, BPMN, REST API.
Опыт написания технических заданий.

Обязанности:
Анализ бизнес-требований, написание спецификаций.`,
    {}, PASS, '', 'Нормальная вакансия системного аналитика — должна пройти'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 2: Роль не совпадает (role-mismatch)
  // ══════════════════════════════════════════════════════════════════
  run('T-02', 'role-mismatch',
    'Frontend разработчик React',
    `Требования:
Опыт работы с React от 2 лет.
Знание TypeScript.`,
    {}, FAIL, 'role-excluded:разработчик', '"разработчик" в role_exclusions — отклоняется до role-match'),

  run('T-03', 'role-mismatch',
    'Менеджер по продажам',
    'Активные продажи, работа с клиентами.',
    {}, FAIL, 'role-mismatch', 'Менеджер по продажам — не аналитик'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 3: Junior/стажёр (должен отклониться)
  // ══════════════════════════════════════════════════════════════════
  run('T-04', 'junior-title',
    'Junior системный аналитик',
    `Требования:
Опыт от 0 лет. Готовы обучать.`,
    {}, FAIL, 'junior', 'Junior в заголовке — должен отклониться'),

  // FIX BUG-C: intern/junior/trainee checks now run BEFORE keyword-match
  run('T-05', 'intern-title',
    'Стажёр-аналитик',
    'Стажировка для студентов и выпускников.',
    {}, FAIL, 'intern', 'Стажёр в заголовке — должен отклониться по intern'),

  // FIX BUG-C: «Младший аналитик» теперь ловится junior-check до keyword-match
  run('T-06', 'junior-title-2',
    'Младший аналитик',
    `Требования: опыт от 1 года.`,
    {}, FAIL, 'junior', 'Младший аналитик — должен отклониться по junior'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 4: Probation (стажировка в hh.ru employment type)
  // ══════════════════════════════════════════════════════════════════
  run('T-07', 'probation-hh',
    'Системный аналитик',
    'Анализ требований, документация.',
    { employment: { id: 'probation' } }, FAIL, 'probation-hh',
    'employment.id=probation — специальный тип занятости hh.ru'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 5: Глобальный блокер 1С в заголовке
  // ══════════════════════════════════════════════════════════════════
  run('T-08', 'blocker-global-title',
    'Системный аналитик 1С',
    `Требования:
Опыт работы с 1С: Предприятие обязателен.`,
    {}, FAIL, 'blocker-global:', '1С в заголовке — глобальный блокер'),

  run('T-09', 'blocker-global-desc',
    'Системный аналитик',
    `Требования:
Знание конфигураций 1С: Предприятие.
Опыт написания ТЗ для 1С.`,
    {}, FAIL, 'blocker-global:', '1С в описании — глобальный блокер должен сработать'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 6: BUG #1 — 1С в описании должен блокировать,
  // НО только если это слово "1С", а не часть другого слова.
  // Проверяем wordRe-поведение на "1С".
  // ══════════════════════════════════════════════════════════════════
  // BUG-NOTE: T-10 был написан с ошибочным ожиданием.
  // «Р1С» в тексте не матчит, НО «не 1С-предприятие» — тоже в тексте,
  // и wordRe('1С') матчит там «1С» после пробела.
  // Таким образом, тест изначально некорректно составлен — надо убрать «не 1С» из текста.
  run('T-10', 'bug1-1c-boundary',
    'Системный аналитик',
    `Требования:
Опыт работы с системами класса ERP.
Знание: Р1С (ресурсное планирование). Работа с системами учёта.`,
    // «Р1С» без упоминания «1С» отдельно — wordRe('1С') не должен матчить
    // т.к. «Р» перед «1С» — буква/цифра, т.е. не граница слова
    {}, PASS, '', 'BUG#1 диагностика (исправлено): "Р1С" (только) не должно быть блокером'),

  run('T-11', 'bug1-1c-in-requirements',
    'Системный аналитик',
    `О компании:
Крупный ритейлер, 500+ сотрудников.

Требования:
Опыт работы с 1С: Управление торговлей обязателен.

Условия:
Удалённая работа, полный день.`,
    // 1С в блоке требований — ДОЛЖЕН быть заблокирован глобальным блокером
    {}, FAIL, 'blocker-global:', 'BUG#1: 1С в блоке требований — глобальный блокер'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 7: Технический блокер только в требованиях
  // ══════════════════════════════════════════════════════════════════
  run('T-12', 'blocker-tech-in-req',
    'Системный аналитик',
    `О компании:
Мы разрабатываем геймдев платформу.

Требования:
Опыт в геймдев проектах приветствуется.
Знание REST API, OpenAPI.

Условия:
Удалённо, конкурентная зарплата.`,
    // "геймдев" в требованиях — tech blocker
    {}, FAIL, 'blocker-tech:', 'геймдев в требованиях — tech blocker'),

  run('T-13', 'blocker-tech-only-in-company',
    'Системный аналитик',
    `О компании:
Наша компания работает в сфере геймдев и entertainment.

Требования:
Опыт работы системным аналитиком от 3 лет.
Знание REST API, Swagger.

Условия:
Полностью удалённо.`,
    // "геймдев" только в О компании, НЕ в требованиях
    // requirementsBlock должен выделить только блок требований
    // ОЖИДАНИЕ: PASS (геймдев не в req-блоке, а tech-blocker проверяется только в req)
    // НО: если requirementsBlock вернёт весь текст (fallback) — будет FAIL
    // Это кейс для проверки правильности requirementsBlock
    {}, PASS, '', 'T-13: геймдев только в О компании — tech blocker НЕ должен сработать'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 8: RU-only геофильтр
  // ══════════════════════════════════════════════════════════════════
  run('T-14', 'ru-only-explicit',
    'Системный аналитик',
    `Требования:
Опыт работы от 3 лет.

Условия:
Удалённо по России. Работа на территории РФ обязательна.`,
    {}, FAIL, 'RU-only', 'Явное указание "удалённо по России" — должен отклониться'),

  run('T-15', 'ru-only-rf',
    'Системный аналитик',
    `Требования:
Опыт работы от 3 лет.

Условия:
Удалённо по РФ. Гражданство РФ.`,
    {}, FAIL, 'RU-only', '"удалённо по РФ" — должен отклониться'),

  run('T-16', 'ru-only-residents',
    'Системный аналитик',
    `Требования:
Опыт работы от 3 лет.

Условия:
Только для резидентов РФ. Полная занятость.`,
    {}, FAIL, 'RU-only', '"только для резидентов РФ" — должен отклониться'),

  run('T-17', 'ru-only-worldwide',
    'Системный аналитик',
    `Требования:
Опыт работы от 3 лет. Знание REST API.

Условия:
Работаем со всем миром. Часовой пояс UTC+2..UTC+8.`,
    {}, PASS, '', 'Международная вакансия без RU-only — должна пройти'),

  // BUG #2 диагностика: неполный RU-only regex
  run('T-18', 'bug2-ru-only-territories',
    'Системный аналитик',
    `Требования:
Опыт работы от 3 лет.

Условия:
Работа на территории России. Полная занятость, удалённо.`,
    // "на территории России" — есть ли в regex?
    // Проверяем: "на\s+территории\s+России" покрывается через "на\s+территории\s+РФ|на\s+территории\s+России"
    {}, FAIL, 'RU-only', 'BUG#2: "на территории России" — должен отклониться'),

  run('T-19', 'bug2-ru-only-citizens',
    'Системный аналитик',
    `Требования:
Опыт работы от 3 лет.

Условия:
Только для граждан РФ. Удалённая работа.`,
    {}, FAIL, 'RU-only', 'BUG#2: "только для граждан РФ" — должен отклониться'),

  run('T-20', 'bug2-ru-only-propiska',
    'Системный аналитик',
    `Требования:
Опыт работы от 3 лет.

Условия:
Необходима прописка в Москве или Санкт-Петербурге. Удалённо по России.`,
    {}, FAIL, 'RU-only', 'BUG#2: "удалённо по России" — должен отклониться'),

  run('T-21', 'bug2-ru-only-missed-variant',
    'Системный аналитик',
    `Требования:
Опыт работы от 3 лет.

Условия:
Работа только в России. Удалённый формат.`,
    // "только в России" — есть ли в regex? Проверяем "только\s+в\s+России"
    {}, FAIL, 'RU-only', 'BUG#2 edge case: "работа только в России" — покрыто ли регексом?'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 9: role_exclusions
  // ══════════════════════════════════════════════════════════════════
  run('T-22', 'role-excluded-qa',
    'QA аналитик',
    `Требования:
Опыт тестирования ПО от 2 лет.`,
    {}, FAIL, 'role-excluded:QA', '"QA аналитик" — должен отклониться по role_exclusions'),

  run('T-23', 'role-excluded-devops',
    'DevOps/аналитик инфраструктуры',
    `Требования:
Знание Kubernetes, Terraform.`,
    {}, FAIL, 'role-excluded:DevOps', '"DevOps/аналитик инфраструктуры" — должен отклониться по role_exclusions'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 10: SAP глобальный блокер
  // ══════════════════════════════════════════════════════════════════
  run('T-24', 'blocker-sap',
    'Системный аналитик SAP',
    `Требования:
Опыт внедрения SAP S/4HANA обязателен.`,
    {}, FAIL, 'blocker-global:', 'SAP в заголовке — глобальный блокер'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 11: requirementsBlock fallback — нет заголовков
  // ══════════════════════════════════════════════════════════════════
  run('T-25', 'req-block-no-headings',
    'Системный аналитик',
    // Описание без каких-либо заголовков — сплошной текст
    `Мы ищем опытного системного аналитика для работы над enterprise-продуктом. Вам предстоит анализировать требования бизнеса, писать технические задания и работать с командой разработки. Опыт работы от 3 лет. Знание REST API, SQL. Геймдев опыт будет плюсом, но не обязателен.`,
    // "геймдев" в сплошном тексте без заголовков — requirementsBlock вернёт весь текст (fallback #1)
    // => tech blocker "геймдев" должен сработать, т.к. весь текст = req-блок
    // ОЖИДАНИЕ: FAIL с blocker-tech (потому что fallback возвращает весь текст)
    {}, FAIL, 'blocker-tech:', 'T-25: нет заголовков — fallback #1 возвращает весь текст, геймдев блокирует'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 12: requirementsBlock fallback — заголовки есть, но не "counts"
  // ══════════════════════════════════════════════════════════════════
  run('T-26', 'req-block-fallback2',
    'Системный аналитик',
    `Мы предлагаем:
Конкурентная зарплата, ДМС.

Бонусы:
13-я зарплата.

О компании:
Лидер рынка геймдев.`,
    // BUG-6 FIX: только "мы предлагаем", "бонусы", "о компании" — ни один не requirements-секция
    // requirementsBlock возвращает '' (пустую строку, не весь текст)
    // => tech blocker "геймдев" НЕ срабатывает
    // ОЖИДАНИЕ: PASS (правильное поведение после fix)
    {}, PASS, '', 'T-26: BUG-6 fix — только мы предлагаем/бонусы/о компании — геймдев там не блокирует'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 13: Вакансия data analyst — keyword match
  // ══════════════════════════════════════════════════════════════════
  run('T-27', 'pass-data-analyst',
    'Data Analyst (аналитик данных)',
    `Требования:
Опыт работы с SQL, Python от 2 лет.
Опыт построения дашбордов.`,
    {}, PASS, '', 'Data Analyst — должен пройти (в keywords)'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 14: Product analyst — keyword match
  // ══════════════════════════════════════════════════════════════════
  run('T-28', 'pass-product-analyst',
    'Product Analyst',
    `Requirements:
3+ years experience as Product or Systems Analyst.
SQL, Python, A/B testing.`,
    {}, PASS, '', 'Product Analyst — должен пройти (в keywords)'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 15: Английская вакансия с intern в заголовке
  // ══════════════════════════════════════════════════════════════════
  run('T-29', 'junior-intern-en',
    'Intern Systems Analyst',
    `Requirements:
0-1 year experience.`,
    {}, FAIL, 'junior', '"intern" в английском заголовке — должен отклониться'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 16: Нет описания вакансии (desc = null)
  // ══════════════════════════════════════════════════════════════════
  run('T-30', 'null-desc',
    'Системный аналитик',
    null,
    {}, PASS, '', 'Нет описания (null) — не должно падать, должно пройти'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 17: Пустое название (name = "")
  // ══════════════════════════════════════════════════════════════════
  run('T-31', 'empty-name',
    '',
    'Требования:\nОпыт работы системным аналитиком от 3 лет.',
    {}, FAIL, 'role-mismatch', 'Пустое название — keywords не найдены в пустой строке'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 18: Аналитик данных — 1С только в О компании (не в требованиях)
  // Глобальный блокер 1С должен блокировать независимо от раздела
  // ══════════════════════════════════════════════════════════════════
  run('T-32', 'global-blocker-company-section',
    'Системный аналитик',
    `О компании:
Мы автоматизируем учёт на базе 1С: Предприятие.

Требования:
Опыт работы от 3 лет. REST API, SQL.

Условия:
Полностью удалённо.`,
    // 1С в О компании — global blocker проверяется по full тексту => FAIL
    {}, FAIL, 'blocker-global:', 'T-32: 1С в О компании — global blocker должен сработать'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 19: Вакансия с нейтральной фразой "работа в России" (не RU-only)
  // ══════════════════════════════════════════════════════════════════
  run('T-33', 'ru-neutral-mention',
    'Системный аналитик',
    `Требования:
Опыт работы от 3 лет.

О компании:
Мы работаем в России, Казахстане и Беларуси.

Условия:
Полностью удалённо из любой точки мира.`,
    // "работаем в России" — не должно матчить RU-only regex (нет "удалённо по России", "территории РФ" etc.)
    {}, PASS, '', 'T-33: "работаем в России" без RU-only формулировок — не должно блокировать'),

  // ══════════════════════════════════════════════════════════════════
  // SCENARIO 20: Trainee в заголовке (английский эквивалент)
  // ══════════════════════════════════════════════════════════════════
  run('T-34', 'trainee-title',
    'Trainee Analyst',
    'Requirements: no experience needed.',
    {}, FAIL, 'junior', '"Trainee Analyst" — должен отклониться по intern/trainee-check'),

  // ══════════════════════════════════════════════════════════════════
  // BONUS: Граничные случаи
  // ══════════════════════════════════════════════════════════════════

  // SAP в описании в разделе требований
  run('T-35', 'blocker-sap-desc',
    'Системный аналитик',
    `Требования:
Знание SAP ERP обязательно.
Опыт работы с модулями MM, SD.`,
    {}, FAIL, 'blocker-global:', 'SAP в описании — глобальный блокер'),

  // Битрикс (tech blocker) в требованиях
  run('T-36', 'blocker-tech-bitrix',
    'Системный аналитик',
    `Требования:
Опыт разработки модулей для Битрикс обязателен.`,
    {}, FAIL, 'blocker-tech:', 'Битрикс в требованиях — tech blocker'),

  // Нормальная вакансия с хорошим описанием на английском
  run('T-37', 'pass-english-vacancy',
    'Systems Analyst',
    `Requirements:
3+ years as Systems or Business Analyst.
Strong knowledge of REST API, OpenAPI, SQL.
Experience with Agile/Scrum teams.

Responsibilities:
Gather and document requirements.
Write technical specifications.

What we offer:
Remote-friendly, worldwide team.`,
    {}, PASS, '', 'Английская вакансия Systems Analyst — должна пройти'),

  // Вакансия "аналитик" без квалификатора — keyword match проверяем
  run('T-38', 'analyst-no-qualifier',
    'Аналитик',
    `Требования:
Опыт работы аналитиком от 2 лет.`,
    // "аналитик" без "системный/продуктовый/данных" — НЕТ в keywords
    // role_match: keywords = [..., "системный аналитик", "product analyst", ...]
    // "аналитик" само по себе не в keywords => role-mismatch
    {}, FAIL, 'role-mismatch', 'T-38: просто "аналитик" не в keywords — role-mismatch'),

  // Вакансия с "стажировка" в описании, не в заголовке
  run('T-39', 'intern-in-desc-not-title',
    'Системный аналитик',
    `О нас:
Мы предлагаем стажировки студентам, но эта позиция — для специалистов.

Требования:
Опыт работы от 3 лет.`,
    // "стажировка" в описании, не в заголовке
    // intern-check: /стажировк|стажер|стажёр/.test(titleOnly) — проверяет только заголовок
    {}, PASS, '', 'T-39: стажировки упомянуты в описании, но не в заголовке — должна пройти'),

  // Oracle APEX в требованиях (tech blocker)
  run('T-40', 'blocker-oracle-apex',
    'Системный аналитик',
    `Требования:
Знание Oracle APEX обязательно для данной позиции.`,
    {}, FAIL, 'blocker-tech:', 'Oracle APEX в требованиях — tech blocker'),

  // ══════════════════════════════════════════════════════════════════
  // STAGE 2 TESTS — проверка BUG-6 и поведения requirementsBlock
  // ══════════════════════════════════════════════════════════════════

  // BUG-6: tech blocker только в «Будет плюсом» — НЕ должен блокировать
  run('T-41', 'nice-to-have-no-block',
    'Системный аналитик',
    `Требования:
Опыт работы системным аналитиком от 3 лет.
Знание UML, REST API.

Будет плюсом:
Опыт работы с Oracle APEX.`,
    {}, PASS, '', 'T-41: Oracle APEX только в Будет плюсом — не должен блокировать (BUG-6 fix)'),

  // BUG-6: tech blocker только в «Условия» — НЕ должен блокировать
  run('T-42', 'conditions-no-block',
    'Системный аналитик',
    `Условия:
Удалённая работа.
Oracle APEX используется в отдельных проектах, но не обязателен.`,
    {}, PASS, '', 'T-42: Oracle APEX только в Условия — не должен блокировать (BUG-6 fix)'),

  // BUG-6: tech blocker только в «О компании» — НЕ должен блокировать
  run('T-43', 'about-company-no-block',
    'Системный аналитик',
    `О компании:
Мы разрабатываем решения на Oracle APEX для клиентов.

Задачи:
Анализ требований бизнеса.`,
    {}, PASS, '', 'T-43: Oracle APEX только в О компании — не должен блокировать (BUG-6 fix)'),

  // BUG-6: tech blocker В требованиях И в Будет плюсом — должен блокировать (по требованиям)
  // Note: не используем SAP здесь (global blocker сработает раньше); используем Oracle APEX в обоих местах
  run('T-44', 'blocker-in-req-and-nice-to-have',
    'Системный аналитик',
    `Требования:
Знание Oracle APEX обязательно.

Будет плюсом:
Опыт с Oracle APEX и другими BI инструментами.`,
    {}, FAIL, 'blocker-tech:', 'T-44: Oracle APEX в требованиях (и в Будет плюсом) — должен блокировать по требованиям'),

  // Нет заголовков совсем — весь текст как требования (safe default)
  run('T-45', 'no-headings-safe-default',
    'Системный аналитик',
    `Компания ищет аналитика. Oracle APEX обязателен для работы на проекте.`,
    {}, FAIL, 'blocker-tech:', 'T-45: нет заголовков, Oracle APEX в тексте — весь текст = требования, блокировать'),

  // Нет заголовков, нет tech blockers — должна пройти
  run('T-46', 'no-headings-pass',
    'Системный аналитик',
    `Компания ищет опытного системного аналитика для работы с REST API и UML.`,
    {}, PASS, '', 'T-46: нет заголовков, нет blockers — должна пройти'),

  // Только «Будет плюсом» и «Условия», нет requirements-секций — Bitrix не блокирует
  run('T-47', 'only-nontechnical-sections',
    'Системный аналитик',
    `Будет плюсом:
Знание Bitrix желательно.

Условия:
Удалённая работа, зарплата 200k.`,
    {}, PASS, '', 'T-47: только Будет плюсом+Условия, Bitrix там — не блокировать (BUG-6 fix)'),

  // global blocker (1С) в О компании — ДОЛЖЕН блокировать (global = весь текст)
  run('T-48', 'global-blocker-in-about-company',
    'Системный аналитик',
    `О компании:
Мы — крупный вендор 1С в России.

Требования:
Опыт системного анализа.`,
    {}, FAIL, 'blocker-global:', 'T-48: 1С в О компании — global blocker должен сработать'),

  // filterFull возвращает checks при pass: true
  run('T-49', 'pass-returns-checks',
    'Системный аналитик',
    `Требования:
Опыт работы от 3 лет.`,
    {}, PASS, '', 'T-49: пройденная вакансия должна иметь checks в результате',
    r => Array.isArray(r.checks) && r.checks.length > 0),

  // Tech blocker «Битрикс» (кириллица) в требованиях — должен блокировать
  run('T-50', 'blocker-bitrix-cyrillic',
    'Системный аналитик',
    `Требования:
Опыт работы с Битрикс обязателен.`,
    {}, FAIL, 'blocker-tech:', 'T-50: Битрикс (кириллица) в требованиях — tech blocker'),

  // «Желательно» section — не должно блокировать tech blocker
  run('T-51', 'jelatelno-no-block',
    'Системный аналитик',
    `Требования:
Опыт работы от 3 лет.

Желательно:
Знание Битрикс приветствуется.`,
    {}, PASS, '', 'T-51: Битрикс только в Желательно — не должен блокировать'),

  // «Nice to have» (english) — не должно блокировать tech blocker
  run('T-52', 'nice-to-have-en-no-block',
    'Systems Analyst',
    `Requirements:
Experience with REST API, SQL.

Nice to have:
Bitrix experience is a plus.`,
    {}, PASS, '', 'T-52: Bitrix только в Nice to have (EN) — не должен блокировать'),

];

// ─── DEDUP TEST CASES (T-53–T-59) ────────────────────────────────────────────
// These test dedupVacancies() and vacancyFingerprint() directly.
// Format: { id, scenario, fn, expected (bool or value), notes }

function makeRaw(overrides = {}) {
  return {
    id: overrides.id || 'hh_100',
    platform: overrides.platform || 'hh.ru',
    title: overrides.title || 'Системный аналитик',
    company: overrides.company || 'Acme Ltd',
    url: overrides.url || 'https://hh.ru/vacancy/100',
    location: overrides.location || 'Удалённо',
    posted_date: overrides.posted_date || '2026-11-18T10:00:00Z',
    salary_min: overrides.salary_min ?? null,
    source_channel: overrides.source_channel || null,
    tg_message_link: overrides.tg_message_link || null,
    ...overrides
  };
}

const dedupTests = [];
let dPassed = 0, dFailed = 0;

function runDedup(id, scenario, fn, notes) {
  let ok = false, detail = '';
  try { const r = fn(); ok = r.ok !== false; detail = r.detail || ''; }
  catch (e) { ok = false; detail = e.message; }
  dedupTests.push({ id, scenario, ok, notes: notes + (detail ? ' | ' + detail : '') });
}

// T-53: Same vacancy on two platforms — confident merge
runDedup('T-53', 'dedup-two-platforms', () => {
  const a = makeRaw({ id: 'hh_200', platform: 'hh.ru', url: 'https://hh.ru/vacancy/200', title: 'Системный аналитик', company: 'Яндекс', location: 'Удалённо', posted_date: '2026-11-18T10:00:00Z' });
  const b = makeRaw({ id: 'gm_200', platform: 'getmatch', url: 'https://getmatch.ru/vacancies/200', title: 'Системный аналитик', company: 'Яндекс', location: 'Удалённо', posted_date: '2026-11-18T11:00:00Z' });
  const result = window.dedupVacancies([a, b], []);
  if (result.length !== 1) return { ok: false, detail: 'expected 1 merged, got ' + result.length };
  if (!result[0].seen_in || result[0].seen_in.length !== 2) return { ok: false, detail: 'seen_in should have 2 entries, got ' + (result[0].seen_in || []).length };
  if (result[0].dedup_confidence !== 'confident') return { ok: false, detail: 'confidence should be confident, got ' + result[0].dedup_confidence };
  return { ok: true };
}, 'T-53: same title+company on hh.ru+getmatch — должны слиться в одну запись с seen_in[2]');

// T-54: Same vacancy with different URLs (tracking params) — confident merge
runDedup('T-54', 'dedup-canonical-url', () => {
  const a = makeRaw({ id: 'hh_300', url: 'https://hh.ru/vacancy/300' });
  const b = makeRaw({ id: 'hh_300b', url: 'https://hh.ru/vacancy/300?from=recommend&hhtmFrom=main' });
  const fp = window.vacancyFingerprint(a, b);
  if (fp.score < 80) return { ok: false, detail: 'score=' + fp.score + ', expected >=80 (canonical URL match)' };
  return { ok: true };
}, 'T-54: одинаковый URL без query params — confident (canonical-url signal)');

// T-55: Same vacancy re-discovered in next run — seen_before: true
runDedup('T-55', 'dedup-seen-before', () => {
  const vac = makeRaw({ id: 'hh_400', url: 'https://hh.ru/vacancy/400', title: 'Системный аналитик', company: 'Mail.ru' });
  const history = [{ id: 'hh_400', url: 'https://hh.ru/vacancy/400', company: 'Mail.ru', title: 'Системный аналитик' }];
  const result = window.dedupVacancies([vac], history);
  if (!result[0].seen_before) return { ok: false, detail: 'seen_before should be true' };
  if (result[0].seen_before_id !== 'hh_400') return { ok: false, detail: 'seen_before_id mismatch' };
  if (result.length !== 1) return { ok: false, detail: 'vacancy should NOT be removed, length=' + result.length };
  return { ok: true };
}, 'T-55: вакансия уже была в истории — seen_before=true, но НЕ удаляется из результатов');

// T-56: Two similar vacancies from same company — probable duplicate
runDedup('T-56', 'dedup-probable-same-company', () => {
  const a = makeRaw({ id: 'hh_500', title: 'Системный аналитик (Финтех)', company: 'Тинькофф', url: 'https://hh.ru/vacancy/500', location: 'Москва' });
  const b = makeRaw({ id: 'hh_501', title: 'Системный аналитик в команду Финтех', company: 'Тинькофф', url: 'https://hh.ru/vacancy/501', location: 'Москва' });
  const result = window.dedupVacancies([a, b], []);
  // Both should be in result — either as merged probable or as distinct
  // The key: if merged, dedup_flag must be 'probable'; if distinct, length must be 2
  if (result.length === 1) {
    if (result[0].dedup_flag !== 'probable') return { ok: false, detail: 'merged but dedup_flag should be probable, got ' + result[0].dedup_flag };
  } else if (result.length !== 2) {
    return { ok: false, detail: 'expected 1 (probable) or 2 (distinct), got ' + result.length };
  }
  return { ok: true };
}, 'T-56: два похожих заголовка в одной компании — probable duplicate или distinct (не confident)');

// T-57: Same title in different cities — distinct vacancies
runDedup('T-57', 'dedup-different-cities', () => {
  const a = makeRaw({ id: 'hh_600', title: 'Системный аналитик', company: 'Сбер', url: 'https://hh.ru/vacancy/600', location: 'Москва', posted_date: '2026-11-18T10:00:00Z' });
  const b = makeRaw({ id: 'hh_601', title: 'Системный аналитик', company: 'Сбер', url: 'https://hh.ru/vacancy/601', location: 'Санкт-Петербург', posted_date: '2026-11-18T10:00:00Z' });
  const fp = window.vacancyFingerprint(a, b);
  // Different URLs, same company+title: score should be 60 (exact-company-title)
  // Different location: NO location-match bonus
  // Result: score = 60, falls in probable range (50-69)
  if (fp.score >= 70) return { ok: false, detail: 'score=' + fp.score + ' should be <70 (different cities = not confident)' };
  return { ok: true };
}, 'T-57: одинаковое название в разных городах — не confident (score<80)');

// T-58: Different vacancies with same title — distinct (different companies)
runDedup('T-58', 'dedup-different-companies', () => {
  const a = makeRaw({ id: 'hh_700', title: 'Системный аналитик', company: 'Газпром', url: 'https://hh.ru/vacancy/700' });
  const b = makeRaw({ id: 'hh_701', title: 'Системный аналитик', company: 'Лукойл', url: 'https://hh.ru/vacancy/701' });
  const fp = window.vacancyFingerprint(a, b);
  if (fp.score >= 50) return { ok: false, detail: 'different companies should be distinct (score<50), got ' + fp.score };
  const result = window.dedupVacancies([a, b], []);
  if (result.length !== 2) return { ok: false, detail: 'different companies must stay separate, got ' + result.length };
  return { ok: true };
}, 'T-58: одинаковое название, разные компании — distinct, обе вакансии сохраняются');

// T-59: Existing filterFull results not lost — dedup runs first, filter sees all deduped entries
runDedup('T-59', 'dedup-no-data-loss', () => {
  const vacancies = [
    makeRaw({ id: 'hh_800', title: 'Системный аналитик', company: 'Yandex', url: 'https://hh.ru/vacancy/800' }),
    makeRaw({ id: 'hh_801', title: 'Продуктовый аналитик', company: 'VK', url: 'https://hh.ru/vacancy/801' }),
    makeRaw({ id: 'hh_802', title: 'Аналитик данных', company: 'Ozon', url: 'https://hh.ru/vacancy/802' }),
  ];
  const result = window.dedupVacancies(vacancies, []);
  if (result.length !== 3) return { ok: false, detail: 'all 3 distinct vacancies must survive dedup, got ' + result.length };
  // Every item must have seen_in
  for (const v of result) {
    if (!v.seen_in || v.seen_in.length < 1) return { ok: false, detail: 'seen_in missing on ' + v.id };
  }
  return { ok: true };
}, 'T-59: 3 разные вакансии — все сохраняются после дедупликации, у каждой есть seen_in');

// ─── Results output ──────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const failures = [];
const unexpected_passes = [];

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║    JOB HUNTER filterFull() + dedup — v3.0 TEST RUN (Stage 3)║');
console.log('║          Stage 3: dedupVacancies() / vacancyFingerprint()    ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log(`${'ID'.padEnd(6)} ${'SCENARIO'.padEnd(32)} ${'EXP'.padEnd(5)} ${'GOT'.padEnd(5)} ${'REASON'.padEnd(30)} RESULT`);
console.log('─'.repeat(100));

for (const t of tests) {
  const expStr = t.expected ? 'PASS' : 'FAIL';
  const gotStr = t.got ? 'PASS' : 'FAIL';
  const mark = t.ok ? '✓' : '✗';
  const reasonStr = t.reason.substring(0, 29).padEnd(30);
  console.log(`${t.id.padEnd(6)} ${t.scenario.padEnd(32)} ${expStr.padEnd(5)} ${gotStr.padEnd(5)} ${reasonStr} ${mark}`);
  if (t.ok) passed++;
  else {
    failed++;
    failures.push(t);
  }
}

console.log('─'.repeat(100));
console.log(`\nИТОГО: ${tests.length} тестов | ✓ прошло: ${passed} | ✗ провалено: ${failed}\n`);

if (failures.length > 0) {
  console.log('══ ПРОВАЛЕНО ══════════════════════════════════════════════════');
  for (const t of failures) {
    console.log(`\n${t.id} [${t.scenario}]`);
    console.log(`  Название: "${t.name}"`);
    console.log(`  Ожидалось: ${t.expected ? 'PASS' : 'FAIL'} (reason prefix: "${t.expectedReason}")`);
    console.log(`  Получено:  ${t.got ? 'PASS' : 'FAIL'} reason="${t.reason}"`);
    console.log(`  Примечание: ${t.notes}`);
  }
  console.log('');
}

// ─── Grouped summary by scenario type ────────────────────────────────────────
const groups = {};
for (const t of tests) {
  const g = t.scenario.split('-').slice(0, 2).join('-');
  if (!groups[g]) groups[g] = { pass: 0, fail: 0, total: 0 };
  groups[g].total++;
  if (t.ok) groups[g].pass++; else groups[g].fail++;
}

console.log('══ ГРУППЫ СЦЕНАРИЕВ ═══════════════════════════════════════════');
for (const [g, s] of Object.entries(groups)) {
  const bar = '█'.repeat(s.pass) + '░'.repeat(s.fail);
  console.log(`  ${g.padEnd(20)} ${bar} ${s.pass}/${s.total}`);
}
console.log('');

// ─── Dedup tests results ──────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║          DEDUP TESTS (T-53–T-59) — Stage 3                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log(`${'ID'.padEnd(6)} ${'SCENARIO'.padEnd(32)} RESULT`);
console.log('─'.repeat(60));
for (const t of dedupTests) {
  const mark = t.ok ? '✓' : '✗';
  console.log(`${t.id.padEnd(6)} ${t.scenario.padEnd(32)} ${mark}  ${t.ok ? '' : t.notes}`);
  if (t.ok) dPassed++; else { dFailed++; }
}
console.log('─'.repeat(60));
console.log(`\nИТОГО (dedup): ${dedupTests.length} тестов | ✓ прошло: ${dPassed} | ✗ провалено: ${dFailed}\n`);

if (dFailed > 0) {
  console.log('══ ПРОВАЛЕНО (dedup) ═══════════════════════════════════════════');
  for (const t of dedupTests) {
    if (!t.ok) console.log(`\n${t.id} [${t.scenario}]\n  ${t.notes}`);
  }
  console.log('');
}

// ─── Infrastructure requirements ─────────────────────────────────────────────
console.log('══ ИНФРАСТРУКТУРА ═══════════════════════════════════════════');
console.log('  T-01–T-52: filterFull() — без внешних зависимостей.');
console.log('  T-53–T-59: dedupVacancies() / vacancyFingerprint() — без внешних зависимостей.');
console.log('  Не требуют: hh.ru API, сетевые вызовы, база данных.');
console.log('');

const totalFailed = failed + dFailed;
process.exit(totalFailed > 0 ? 1 : 0);
