/* R²-SAFE: แบบบันทึกผลการนำแผนรายมาตรการไปใช้ (Plan Implementation Report)
   โรงเรียนที่นำแผนไปใช้กรอกผลของแต่ละมาตรการ (ขั้นตอนที่ทำจริง ตัวชี้วัด ผู้รับประโยชน์ ทรัพยากร ความสอดคล้องกับกลยุทธ์ ความพึงพอใจ อุปสรรค)
   เพื่อให้ผู้วิจัยเห็นว่าแผนที่ระบบเสนอตอบสนองกลยุทธ์และวัตถุประสงค์อย่างไร ข้อมูลทั้งหมดเป็นการรายงานของผู้ปฏิบัติงานเอง
   ใช้อธิบายความเหมาะสม ความเป็นไปได้ ความเป็นประโยชน์ และความพอใจ ไม่ใช่หลักฐานว่าเหตุการณ์ไม่ปลอดภัยลดลงเพราะแผน (ดูข้อ 1.10 ของโครงร่าง)
   ห้ามกรอกชื่อบุคคลหรือข้อมูลที่ระบุตัวนักเรียน เก็บเฉพาะตัวเลขรวม คะแนน และข้อความสั้นที่ไม่ระบุตัวบุคคล
   ไฟล์นี้ไม่มี DOM และไม่ส่งข้อมูลไปที่ใด */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const ACT = isNode ? require('./actplan.js') : root.RS_ACTPLAN;
  const SCHEMA = 'r2safe-collect', VERSION = 1;

  const ROLES = [['R1', 'ผู้อำนวยการโรงเรียน'], ['R2', 'รองผู้อำนวยการที่รับผิดชอบงานความปลอดภัย'], ['R3', 'ครูผู้รับผิดชอบงานความปลอดภัย'], ['OT', 'ผู้รับผิดชอบมาตรการนี้ (ตำแหน่งอื่น)']];
  const STEP_STATUS = ['ยังไม่เริ่ม', 'กำลังดำเนินการ', 'เสร็จแล้ว', 'ไม่ได้ทำ'];
  const EVID = ['มี', 'ไม่มี'];
  const KPI_MET = ['บรรลุตามเป้า', 'บรรลุบางส่วน', 'ยังไม่บรรลุ', 'ยังวัดไม่ได้'];
  const CHANGE = ['ดีขึ้น', 'เท่าเดิม', 'แย่ลง', 'ประเมินยังไม่ได้'];
  const DOMAINS = ['V', 'A', 'P', 'H', 'X'];
  const GROUPS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9'];
  // ความสอดคล้องกับกลยุทธ์ที่ระบบเสนอ (มาตรวัด 5 ระดับ: 1 น้อยที่สุด ถึง 5 มากที่สุด)
  const ALIGN = [
    ['A1', 'แผนนี้ตรงกับระดับความเสี่ยงของด้านนี้ที่ระบบวิเคราะห์ให้'],
    ['A2', 'แผนนี้ช่วยลดช่องว่างองค์ประกอบ 7-S ที่ระบบชี้'],
    ['A3', 'แผนนี้สอดคล้องกับมาตรการความปลอดภัยของ ศธ.'],
    ['A4', 'โรงเรียนทำได้ตามช่วงเวลาที่แผนกำหนด'],
    ['A5', 'ทรัพยากรที่แผนกำหนดเพียงพอต่อการทำจริง'],
    ['A6', 'ผลที่ได้ตรงกับผลที่คาดหวังของแผน'],
  ];
  const SAT = [
    ['S1', 'ขั้นตอนในแผนชัดเจน อ่านแล้วทำตามได้'],
    ['S2', 'นำแผนไปใช้ได้ง่าย'],
    ['S3', 'แผนนี้เป็นประโยชน์ต่อโรงเรียน'],
    ['S4', 'ความพึงพอใจโดยรวมต่อแผนนี้'],
    ['S5', 'โรงเรียนตั้งใจใช้แผนนี้ต่อไป'],
  ];
  // ตัวชี้วัดของงานวิจัย (วัตถุประสงค์ข้อ 4: ความเหมาะสม ความเป็นไปได้ ความเป็นประโยชน์ ความสามารถในการใช้งาน) และความพึงพอใจ
  const DIMS = [
    ['fit', 'ความเหมาะสมกับบริบท (ตรงความเสี่ยง ช่องว่าง 7-S และมาตรการ ศธ.)', ['A1', 'A2', 'A3']],
    ['feasible', 'ความเป็นไปได้ (ทำได้ตามเวลาและทรัพยากร)', ['A4', 'A5']],
    ['useful', 'ความเป็นประโยชน์ (ผลตรงตามที่คาดหวัง ประโยชน์ต่อโรงเรียน)', ['A6', 'S3']],
    ['usable', 'ความสามารถในการใช้งาน (ชัดเจน ใช้ง่าย)', ['S1', 'S2']],
    ['satisfy', 'ความพึงพอใจและความตั้งใจใช้ต่อ', ['S4', 'S5']],
  ];
  const OBST = [['time', 'เวลาไม่พอ'], ['budget', 'งบประมาณไม่พอ'], ['staff', 'บุคลากรไม่พอหรือภาระงานมาก'], ['parents', 'ผู้ปกครองไม่ร่วมมือ'], ['teachers', 'ครูยังไม่เข้าใจหรือไม่ร่วมมือ'], ['students', 'นักเรียนไม่ร่วมมือ'], ['agency', 'หน่วยงานภายนอกไม่ตอบรับ'], ['law', 'ติดข้อกฎหมายหรือระเบียบ'], ['plan', 'ขั้นตอนในแผนไม่ตรงกับบริบทของโรงเรียน'], ['none', 'ไม่พบอุปสรรค']];
  const STEP_IDS = ['s1', 's2', 's3', 's4', 's5', 's6'];
  const NAME_LIKE = /(นาย|นางสาว|นาง|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.)\s*[ก-๙]{2,}/;   // ป้องกันการใส่ชื่อบุคคลในช่องข้อความ

  const isStr = (v) => typeof v === 'string';
  const int = (v, lo, hi) => { const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v; return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };
  const rating = (v) => int(v, 1, 5) !== null;
  const blankStr = (v) => v == null || String(v).trim() === '';

  function blank() {
    const steps = {}; STEP_IDS.forEach((k) => { steps[k] = { status: '', evidence: '' }; });
    return { year: '2569', respRole: '', weeksActual: '', steps, kpi: { target: '', actual: '', met: '' }, reach: { intended: '', reached: '' },
      resource: { people: '', hours: '', cost: '' }, change: { value: '', incBefore: '', incAfter: '' }, align: {}, sat: {}, obst: {}, adapt: '', suggest: '' };
  }

  // ขั้นตอนของมาตรการนี้ในแผน (ใช้เป็นแถวของแบบฟอร์ม): [{ id, when, name, out }]
  function stepsOf(m, ctx) {
    return ACT.steps(m, ctx || {}).map((x, i) => ({ id: STEP_IDS[i], when: x.when, name: x.brief, what: x.what, out: x.out }));
  }

  // ตรวจความครบถ้วนและความถูกต้อง: คืนรายการช่องที่ขาดหรือผิด (ว่าง = ครบ)
  function missing(a) {
    const m = [], st = a.steps || {};
    if (int(a.year, 2560, 2600) == null) m.push('year');
    if (!ROLES.some((r) => r[0] === a.respRole)) m.push('respRole');
    if (int(a.weeksActual, 0, 104) == null) m.push('weeksActual');
    STEP_IDS.forEach((k) => {
      const s = st[k] || {};
      if (STEP_STATUS.indexOf(s.status) < 0) m.push('steps.' + k + '.status');
      else if (s.status === 'เสร็จแล้ว' && EVID.indexOf(s.evidence) < 0) m.push('steps.' + k + '.evidence');
      else if (s.evidence && EVID.indexOf(s.evidence) < 0) m.push('steps.' + k + '.evidence');
    });
    const k = a.kpi || {}; if (KPI_MET.indexOf(k.met) < 0) m.push('kpi.met');
    if (String(k.target || '').length > 60 || String(k.actual || '').length > 60) m.push('kpi.text');
    const r = a.reach || {}; if (int(r.intended, 0, 99999) == null) m.push('reach.intended'); if (int(r.reached, 0, 99999) == null) m.push('reach.reached');
    if (int(r.intended, 0, 99999) != null && int(r.reached, 0, 99999) != null && int(r.reached, 0, 99999) > int(r.intended, 0, 99999)) m.push('reach.order');
    const rs = a.resource || {}; if (int(rs.people, 0, 9999) == null) m.push('resource.people'); if (int(rs.hours, 0, 99999) == null) m.push('resource.hours'); if (int(rs.cost, 0, 99999999) == null) m.push('resource.cost');
    const c = a.change || {}; if (CHANGE.indexOf(c.value) < 0) m.push('change.value');
    const b = blankStr(c.incBefore), f = blankStr(c.incAfter);
    if (b !== f) m.push('change.inc'); else if (!b && (int(c.incBefore, 0, 99999) == null || int(c.incAfter, 0, 99999) == null)) m.push('change.inc');
    ALIGN.forEach((x) => { if (!rating((a.align || {})[x[0]])) m.push('align.' + x[0]); });
    SAT.forEach((x) => { if (!rating((a.sat || {})[x[0]])) m.push('sat.' + x[0]); });
    const ob = a.obst || {}, picked = OBST.filter((x) => ob[x[0]] === true).map((x) => x[0]);
    if (!picked.length) m.push('obst'); else if (picked.indexOf('none') >= 0 && picked.length > 1) m.push('obst.none');
    ['adapt', 'suggest', 'kpi.target', 'kpi.actual'].forEach((key) => { const v = key.indexOf('.') > 0 ? (a.kpi || {})[key.split('.')[1]] : a[key]; if (!blankStr(v) && (!isStr(v) || v.length > (key.indexOf('.') > 0 ? 60 : 400) || NAME_LIKE.test(v))) m.push(key); });
    return m;
  }
  function progress(a) {
    const total = 3 + STEP_IDS.length + 1 + 2 + 3 + 1 + ALIGN.length + SAT.length + 1;   // ช่องที่ต้องกรอก 28 ช่อง (ช่องหลักฐานของขั้นตอนนับเมื่อขั้นนั้นเสร็จแล้ว)
    const miss = missing(a), done = Math.max(0, total - Math.min(total, miss.length));
    return { total, done, pct: Math.round(100 * done / total), missing: miss, complete: miss.length === 0 };
  }

  function validate(p, data) {
    if (!p || p.schema !== SCHEMA) return { ok: false, why: 'ไม่ใช่ไฟล์คำตอบของ R²-SAFE' };
    if (p.version !== VERSION) return { ok: false, why: 'เวอร์ชันไม่ตรง' };
    if (p.form !== 'planreport') return { ok: false, why: 'ชนิดแบบฟอร์มไม่ถูกต้อง' };
    if (!/^[A-Za-z0-9\-]{2,16}$/.test(p.school || '')) return { ok: false, why: 'รหัสโรงเรียนไม่ถูกต้อง' };
    if (!p.consent || p.consent.accepted !== true) return { ok: false, why: 'ไม่มีการยืนยันความยินยอม' };
    if (!/^SB-\d{3}$/.test(p.measure || '') || (data && data.bank && !data.bank.some((b) => b.sb === p.measure))) return { ok: false, why: 'ไม่พบมาตรการในคลัง' };
    if (p.domain && DOMAINS.indexOf(p.domain) < 0) return { ok: false, why: 'ด้านของภัยไม่ถูกต้อง' };
    if (p.group && GROUPS.indexOf(p.group) < 0) return { ok: false, why: 'กลุ่มแนวทางไม่ถูกต้อง' };
    if (p.plannedWeeks != null && int(p.plannedWeeks, 0, 104) == null) return { ok: false, why: 'จำนวนสัปดาห์ตามแผนไม่ถูกต้อง' };
    if (!p.answers || typeof p.answers !== 'object') return { ok: false, why: 'ไม่มีคำตอบ' };
    const miss = missing(p.answers); if (miss.length) return { ok: false, why: 'แบบบันทึกผลยังไม่ครบหรือไม่ถูกต้อง (' + miss.slice(0, 3).join(', ') + (miss.length > 3 ? ' ...' : '') + ')' };
    return { ok: true };
  }

  const fnv = (str) => { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).toUpperCase().padStart(8, '0'); };
  function pack(meta, answers) {
    const p = { schema: SCHEMA, version: VERSION, form: 'planreport', mode: meta.mode || 'demo', school: String(meta.school || '').trim().toUpperCase(), respondent: '', measure: meta.measure, domain: meta.domain || '', group: meta.group || '', plannedWeeks: int(meta.plannedWeeks, 1, 104) || 0,
      consent: { accepted: !!meta.consent, at: meta.consentAt || null }, startedAt: meta.startedAt || null, submittedAt: meta.submittedAt || new Date().toISOString(), synthetic: !!meta.synthetic, answers };
    p.receipt = 'RC-' + fnv(JSON.stringify([p.school, p.form, p.measure, p.submittedAt, answers]));
    return p;
  }

  // ---------- สรุปสำหรับผู้วิจัย ----------
  const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
  const median = (a) => { if (!a.length) return NaN; const b = a.slice().sort((x, y) => x - y), k = b.length >> 1; return b.length % 2 ? b[k] : (b[k - 1] + b[k]) / 2; };
  const num = (v) => (blankStr(v) ? NaN : Number(v));
  const items = (list) => list.map((x) => x[0]);
  // ใช้เฉพาะรายงานที่ครบถ้วน (ตรวจซ้ำ) และเลือกฉบับล่าสุดของแต่ละโรงเรียนต่อมาตรการ
  function latest(payloads) {
    const m = {};
    payloads.filter((p) => p && p.form === 'planreport' && !missing(p.answers || {}).length).slice().sort((a, b) => String(a.submittedAt).localeCompare(String(b.submittedAt))).forEach((p) => { m[p.school + '|' + p.measure] = p; });
    return Object.keys(m).sort().map((k) => m[k]);
  }
  function stats(list) {
    const n = list.length, A = items(ALIGN), S = items(SAT);
    const avg = (key, arr) => arr.reduce((o, k) => { o[k] = mean(list.map((p) => Number(p.answers[key][k]))); return o; }, {});
    const align = avg('align', A), sat = avg('sat', S), all = Object.assign({}, align, sat);
    const dims = DIMS.map((d) => ({ key: d[0], label: d[1], items: d[2], mean: mean(d[2].map((k) => all[k])) }));
    const stepsDone = list.map((p) => STEP_IDS.filter((k) => p.answers.steps[k].status === 'เสร็จแล้ว').length / STEP_IDS.length);
    const evid = list.map((p) => { const d = STEP_IDS.filter((k) => p.answers.steps[k].status === 'เสร็จแล้ว'); return d.length ? d.filter((k) => p.answers.steps[k].evidence === 'มี').length / d.length : NaN; }).filter(isFinite);
    const cover = list.map((p) => { const i = num(p.answers.reach.intended); return i > 0 ? num(p.answers.reach.reached) / i : NaN; }).filter(isFinite);
    const dist = (vals, key) => vals.reduce((o, v) => { o[v] = (o[v] || 0) + 1; return o; }, {});
    const obst = {}; OBST.forEach((x) => { obst[x[0]] = list.filter((p) => p.answers.obst[x[0]] === true).length; });
    const weeks = list.map((p) => num(p.answers.weeksActual)), ratio = list.filter((p) => p.plannedWeeks > 0).map((p) => num(p.answers.weeksActual) / p.plannedWeeks);
    const inc = list.filter((p) => !blankStr(p.answers.change.incBefore)).map((p) => [Number(p.answers.change.incBefore), Number(p.answers.change.incAfter)]);
    return { n, schools: new Set(list.map((p) => p.school)).size, align, sat, dims, meanStepsDone: mean(stepsDone), meanEvidence: mean(evid), meanCoverage: mean(cover),
      kpi: dist(list.map((p) => p.answers.kpi.met)), change: dist(list.map((p) => p.answers.change.value)), obst, medianWeeks: median(weeks), medianPeople: median(list.map((p) => num(p.answers.resource.people))), medianHours: median(list.map((p) => num(p.answers.resource.hours))), medianCost: median(list.map((p) => num(p.answers.resource.cost))),
      incPairs: inc.length, incBefore: inc.length ? mean(inc.map((x) => x[0])) : NaN, incAfter: inc.length ? mean(inc.map((x) => x[1])) : NaN, medianWeeksRatio: median(ratio) };
  }
  function summarize(payloads, bank) {
    const L = latest(payloads), byM = {};
    L.forEach((p) => { (byM[p.measure] = byM[p.measure] || []).push(p); });
    const nameOf = (sb) => ((bank || []).find((b) => b.sb === sb) || {}).name || '';
    const byDom = {}, byGroup = {};
    L.forEach((p) => { (byDom[p.domain || '-'] = byDom[p.domain || '-'] || []).push(p); (byGroup[p.group || '-'] = byGroup[p.group || '-'] || []).push(p); });
    return { overall: stats(L), measures: Object.keys(byM).sort().map((sb) => Object.assign({ sb, name: nameOf(sb) }, stats(byM[sb]))), domains: Object.keys(byDom).sort().map((k) => Object.assign({ key: k }, stats(byDom[k]))), groups: Object.keys(byGroup).sort().map((k) => Object.assign({ key: k }, stats(byGroup[k]))) };
  }
  function longRows(payloads, bank) {
    const rows = [['school', 'measure', 'name', 'domain', 'group', 'mode', 'synthetic', 'respRole', 'weeksActual', 'stepsDone', 'evidenceYes', 'kpiMet', 'kpiTarget', 'kpiActual', 'intended', 'reached', 'people', 'hours', 'cost', 'change', 'incBefore', 'incAfter']
      .concat(items(ALIGN)).concat(items(SAT)).concat(OBST.map((x) => 'obst_' + x[0])).concat(['adapt', 'suggest'])];
    latest(payloads).forEach((p) => {
      const a = p.answers, nm = ((bank || []).find((b) => b.sb === p.measure) || {}).name || '';
      rows.push([p.school, p.measure, nm, p.domain, p.group, p.mode, p.synthetic, a.respRole, a.weeksActual, STEP_IDS.filter((k) => a.steps[k].status === 'เสร็จแล้ว').length, STEP_IDS.filter((k) => a.steps[k].evidence === 'มี').length, a.kpi.met, a.kpi.target, a.kpi.actual, a.reach.intended, a.reach.reached, a.resource.people, a.resource.hours, a.resource.cost, a.change.value, a.change.incBefore, a.change.incAfter]
        .concat(items(ALIGN).map((k) => a.align[k])).concat(items(SAT).map((k) => a.sat[k])).concat(OBST.map((x) => a.obst[x[0]] === true ? 1 : 0)).concat([a.adapt, a.suggest]));
    });
    return rows;
  }

  const api = { SCHEMA, VERSION, ROLES, STEP_STATUS, EVID, KPI_MET, CHANGE, DOMAINS, GROUPS, ALIGN, SAT, DIMS, OBST, STEP_IDS, NAME_LIKE, blank, stepsOf, missing, progress, validate, pack, latest, summarize, longRows };
  if (isNode) module.exports = api; else root.RS_PLANREC = api;
})(typeof window !== 'undefined' ? window : this);
