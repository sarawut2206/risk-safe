/* R²-SAFE: ตรรกะของระบบรวบรวมข้อมูลสถานศึกษา (School Data Collection Portal)
   แบบฟอร์ม 3 ชุดตามระยะที่ 2: (1) แบบสอบถามความเสี่ยงและความพร้อม โรงเรียนละ 3 คน (2) แบบบันทึกจำนวนเหตุการณ์ (3) แบบตรวจเอกสารนโยบาย
   ไฟล์นี้ไม่มี DOM และไม่ส่งข้อมูลไปที่ใด ทำหน้าที่ตรวจความครบถ้วน แพ็กคำตอบ รวมเป็นข้อมูลระดับโรงเรียน (ค่าเฉลี่ยของ 3 คน ตามข้อ 3.6 ของโครงร่าง)
   และคำนวณความสอดคล้องภายในโรงเรียน (rwg(j), ICC(1)) กับสถิติตรวจสอบอื่น ๆ  ข้อความและเกณฑ์เป็นร่างของผู้วิจัย รอ IOC และการรับรองจริยธรรม */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const ST = isNode ? require('./stats.js') : root.RS_STATS;
  const SCHEMA = 'r2safe-collect', VERSION = 1;
  const ROLES = [['R1', 'ผู้อำนวยการโรงเรียน'], ['R2', 'รองผู้อำนวยการที่รับผิดชอบงานความปลอดภัย'], ['R3', 'ครูผู้รับผิดชอบงานความปลอดภัย']];
  const STRATA = [['BKK1', 'สพม.กรุงเทพมหานคร เขต 1'], ['BKK2', 'สพม.กรุงเทพมหานคร เขต 2'], ['CEN1', 'เขตตรวจราชการที่ 1 (ภาคกลาง)'], ['CEN2', 'เขตตรวจราชการที่ 2 (ภาคกลาง)']];
  const YESNO = ['มี', 'ไม่มี'];
  const BUDGET = ['ไม่มีงบเฉพาะด้านความปลอดภัย', 'ไม่เกิน 10,000 บาทต่อปี', '10,001–50,000 บาทต่อปี', '50,001–100,000 บาทต่อปี', 'มากกว่า 100,000 บาทต่อปี'];
  const RESOURCE = ['จำกัด', 'ปานกลาง', 'เพียงพอ'];
  const DOC_STATUS = ['มี', 'กำลังจัดทำ', 'ไม่มี'];
  const DOCS = [
    ['D1', 'แผนความปลอดภัยหรือแผนเผชิญเหตุ (ฉบับปีการศึกษาปัจจุบัน)'], ['D2', 'คำสั่งแต่งตั้งคณะกรรมการหรือผู้รับผิดชอบงานความปลอดภัย'],
    ['D3', 'ช่องทางรับแจ้งเหตุที่ใช้งานได้จริง'], ['D4', 'แนวปฏิบัติเมื่อเกิดเหตุ (ขั้นตอนรับแจ้ง ตอบสนอง ส่งต่อ)'], ['D5', 'ระบบติดตามและรายงานผลการดำเนินงานด้านความปลอดภัย'],
  ];
  const DOMAIN_KEYS = ['V', 'A', 'P', 'H'];
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const int = (v, lo, hi) => { const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v; return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };

  // ---------- แบบฟอร์มเปล่า ----------
  const blank = {
    questionnaire: () => ({ part1: { students: '', staff: '', year: '2569', stratum: '', safetyOfficer: '', counselor: '', budget: '', resource: '' }, risk: {}, seven: {}, part4: { need: '', suggest: '' } }),
    incidents: () => ({ year: '2569', noSystem: false, V: '', A: '', P: '', H: '' }),
    documents: () => ({ items: {}, years: {} }),
  };

  // ---------- ความครบถ้วน ----------
  function part1Missing(p) {
    const m = [];
    if (int(p.students, 1, 20000) == null) m.push('students'); if (int(p.staff, 1, 5000) == null) m.push('staff'); if (int(p.year, 2560, 2600) == null) m.push('year');
    if (!STRATA.some((s) => s[0] === p.stratum)) m.push('stratum'); if (YESNO.indexOf(p.safetyOfficer) < 0) m.push('safetyOfficer'); if (YESNO.indexOf(p.counselor) < 0) m.push('counselor');
    if (BUDGET.indexOf(p.budget) < 0) m.push('budget'); if (RESOURCE.indexOf(p.resource) < 0) m.push('resource');
    return m;
  }
  function progressQ(a, data) {
    const p1 = part1Missing(a.part1 || {}), m2 = [], m3 = [];
    data.riskItems.forEach((it) => { const v = (a.risk || {})[it.id] || []; if (int(v[0], 1, 5) == null) m2.push(it.id + ':L'); if (int(v[1], 1, 5) == null) m2.push(it.id + ':C'); });
    data.sevenItems.forEach((it) => { const v = (a.seven || {})[it.id] || []; if (int(v[0], 1, 5) == null) m3.push(it.id + ':D'); if (int(v[1], 1, 5) == null) m3.push(it.id + ':I'); });
    const t1 = 8, t2 = data.riskItems.length * 2, t3 = data.sevenItems.length * 2, total = t1 + t2 + t3, done = (t1 - p1.length) + (t2 - m2.length) + (t3 - m3.length);
    return { total, done, pct: Math.round(100 * done / total), parts: { p1: { total: t1, missing: p1 }, p2: { total: t2, missing: m2 }, p3: { total: t3, missing: m3 } }, complete: done === total };
  }
  function checkIncidents(a) {
    const err = [];
    if (int(a.year, 2560, 2600) == null) err.push('year');
    if (a.noSystem) { DOMAIN_KEYS.forEach((k) => { if (a[k] !== '' && a[k] != null) err.push(k + ':ต้องเว้นว่างเมื่อไม่มีระบบบันทึก'); }); }
    else DOMAIN_KEYS.forEach((k) => { if (int(a[k], 0, 99999) == null) err.push(k); });
    return { complete: err.length === 0, errors: err };
  }
  function checkDocuments(a) {
    const err = [];
    DOCS.forEach((d) => { if (DOC_STATUS.indexOf((a.items || {})[d[0]]) < 0) err.push(d[0]); const y = (a.years || {})[d[0]]; if (y !== '' && y != null && int(y, 2550, 2600) == null) err.push(d[0] + ':year'); });
    return { complete: err.length === 0, errors: err };
  }
  const progressOf = (form, a, data) => (form === 'questionnaire' ? progressQ(a, data) : form === 'incidents' ? Object.assign({ pct: checkIncidents(a).complete ? 100 : 0 }, checkIncidents(a)) : Object.assign({ pct: checkDocuments(a).complete ? 100 : 0 }, checkDocuments(a)));

  // ---------- แพ็กคำตอบ ----------
  function fnv(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).toUpperCase().padStart(8, '0'); }
  const codeOk = (c) => typeof c === 'string' && /^[A-Za-z0-9\-]{2,16}$/.test(c);
  function pack(form, meta, answers) {
    const p = { schema: SCHEMA, version: VERSION, form, mode: meta.mode || 'demo', school: String(meta.school || '').trim().toUpperCase(), respondent: form === 'questionnaire' ? meta.respondent : '', consent: { accepted: !!meta.consent, at: meta.consentAt || null },
      startedAt: meta.startedAt || null, submittedAt: meta.submittedAt || new Date().toISOString(), synthetic: !!meta.synthetic, answers };
    p.receipt = 'RC-' + fnv(JSON.stringify([p.school, p.form, p.respondent, p.submittedAt, answers]));
    return p;
  }
  function validatePayload(p, data) {
    if (!p || p.schema !== SCHEMA) return { ok: false, why: 'ไม่ใช่ไฟล์คำตอบของ R²-SAFE' };
    if (p.version !== VERSION) return { ok: false, why: 'เวอร์ชันไม่ตรง' };
    if (['questionnaire', 'incidents', 'documents'].indexOf(p.form) < 0) return { ok: false, why: 'ชนิดแบบฟอร์มไม่ถูกต้อง' };
    if (!codeOk(p.school)) return { ok: false, why: 'รหัสโรงเรียนไม่ถูกต้อง' };
    if (!p.consent || p.consent.accepted !== true) return { ok: false, why: 'ไม่มีการยืนยันความยินยอม' };
    if (p.form === 'questionnaire') { if (!ROLES.some((r) => r[0] === p.respondent)) return { ok: false, why: 'ไม่ระบุผู้ตอบ' }; if (!progressQ(p.answers, data).complete) return { ok: false, why: 'แบบสอบถามยังกรอกไม่ครบ' }; }
    if (p.form === 'incidents' && !checkIncidents(p.answers).complete) return { ok: false, why: 'แบบบันทึกเหตุการณ์ยังไม่ครบหรือไม่ถูกต้อง' };
    if (p.form === 'documents' && !checkDocuments(p.answers).complete) return { ok: false, why: 'แบบตรวจเอกสารยังไม่ครบ' };
    return { ok: true };
  }

  // ---------- รวมเป็นข้อมูลระดับโรงเรียน ----------
  const latestBy = (list, keyf) => { const m = {}; list.slice().sort((a, b) => String(a.submittedAt).localeCompare(String(b.submittedAt))).forEach((p) => { m[keyf(p)] = p; }); return m; };
  function groupBySchool(payloads) {
    const out = {};
    payloads.forEach((p) => { (out[p.school] = out[p.school] || []).push(p); });
    return Object.keys(out).sort().map((code) => {
      const L = out[code], q = latestBy(L.filter((p) => p.form === 'questionnaire'), (p) => p.respondent), inc = latestBy(L.filter((p) => p.form === 'incidents'), () => 'x').x || null, doc = latestBy(L.filter((p) => p.form === 'documents'), () => 'x').x || null;
      return { code, q, incidents: inc, documents: doc, synthetic: L.some((p) => p.synthetic) };
    });
  }
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  // รวมแบบสอบถามของโรงเรียน: ค่าเฉลี่ยรายข้อของผู้ตอบ (ข้อ 3.6) กฎยกระดับตรวจจากรายคน: ข้อที่ผู้ตอบ ≥ ครึ่งหนึ่ง (อย่างน้อย 2 ใน 3) ให้ C = 5 และ L ≥ 2 ยกระดับด้านนั้น
  function aggregateSchool(school, data, opts) {
    opts = opts || {};
    const minN = opts.minRespondents || 3, resp = ROLES.map((r) => school.q[r[0]]).filter(Boolean).filter((p) => progressQ(p.answers, data).complete);
    if (resp.length < minN) return { complete: false, n: resp.length };
    const risk = {}, seven = {}, overrideDomains = {}, need = Math.ceil(resp.length / 2);
    data.riskItems.forEach((it) => {
      const Ls = resp.map((p) => p.answers.risk[it.id][0]), Cs = resp.map((p) => p.answers.risk[it.id][1]);
      risk[it.id] = [mean(Ls), mean(Cs)];
      const votes = resp.filter((p) => p.answers.risk[it.id][1] === 5 && p.answers.risk[it.id][0] >= 2).length;
      if (votes >= need) overrideDomains[it.dom] = true;
    });
    data.sevenItems.forEach((it) => { seven[it.id] = [mean(resp.map((p) => p.answers.seven[it.id][0])), mean(resp.map((p) => p.answers.seven[it.id][1]))]; });
    const res = resp.map((p) => p.answers.part1.resource), order = RESOURCE.slice();
    const resource = order[Math.min.apply(null, res.map((r) => order.indexOf(r)))]; // ตัดสินด้วยระดับต่ำสุดที่ผู้ตอบรายงาน (ปลอดภัยไว้ก่อน ผู้วิจัยปรับได้)
    // ผู้ตอบต่างกันชัดเจน: ค่าเฉลี่ยองค์ประกอบ D ของสองคนใดต่างกันเกิน 2.00
    const divergent = [];
    data.elements.forEach((e) => {
      const ids = data.sevenItems.filter((s) => s.elem === e.code).map((s) => s.id), m = resp.map((p) => mean(ids.map((id) => p.answers.seven[id][0])));
      for (let i = 0; i < m.length; i++) for (let j = i + 1; j < m.length; j++) if (Math.abs(m[i] - m[j]) > 2.0) divergent.push({ elem: e.code, a: resp[i].respondent, b: resp[j].respondent, diff: Math.abs(m[i] - m[j]) });
    });
    return { complete: true, n: resp.length, input: { risk, seven, resource, overrideDomains }, resp, divergent, p1: resp.map((p) => p.answers.part1) };
  }

  // ---------- ความสอดคล้องภายในโรงเรียน ----------
  // rwg(J) ของ James, Demaree และ Wolf (1984) กรณีมาตรวัด A ระดับ และการแจกแจงว่างแบบสม่ำเสมอ ค่าที่ติดลบตัดเป็น 0 ตามธรรมเนียม (LeBreton และ Senter, 2008)
  function rwgJ(matrix, A) {
    // matrix[รายข้อ][ผู้ตอบ]
    const J = matrix.length, sig = (A * A - 1) / 12;
    if (!J || matrix[0].length < 2) return NaN;
    const sbar = mean(matrix.map((row) => ST.sd(row) ** 2)), r = 1 - sbar / sig;
    const v = (J * r) / (J * r + sbar / sig);
    return isFinite(v) ? Math.max(0, v) : NaN;
  }
  // ICC(1) แบบทางเดียว: groups[กลุ่ม][ผู้ตอบ] ต้องมีจำนวนผู้ตอบเท่ากันทุกกลุ่ม
  function icc1(groups) {
    const n = groups.length, k = groups[0] ? groups[0].length : 0;
    if (n < 2 || k < 2 || groups.some((g) => g.length !== k)) return NaN;
    const gm = groups.map(mean), grand = mean(gm);
    const msb = k * gm.reduce((s, m) => s + (m - grand) ** 2, 0) / (n - 1);
    const msw = groups.reduce((s, g, i) => s + g.reduce((t, x) => t + (x - gm[i]) ** 2, 0), 0) / (n * (k - 1));
    return (msb - msw) / (msb + (k - 1) * msw);
  }
  // สหสัมพันธ์สเปียร์แมน (อันดับเฉลี่ยเมื่อค่าเท่ากัน) พร้อม p แบบประมาณด้วย t
  function rank(a) { const idx = a.map((v, i) => i).sort((x, y) => a[x] - a[y]), r = new Array(a.length); for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && a[idx[j + 1]] === a[idx[i]]) j++; for (let k = i; k <= j; k++) r[idx[k]] = (i + j) / 2 + 1; i = j + 1; } return r; }
  function spearman(x, y) {
    const n = Math.min(x.length, y.length); if (n < 3) return { n, rho: NaN, p: NaN };
    const rx = rank(x.slice(0, n)), ry = rank(y.slice(0, n)), mx = mean(rx), my = mean(ry);
    let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (rx[i] - mx) * (ry[i] - my); sxx += (rx[i] - mx) ** 2; syy += (ry[i] - my) ** 2; }
    const rho = sxx && syy ? sxy / Math.sqrt(sxx * syy) : NaN, t = rho * Math.sqrt((n - 2) / (1 - rho * rho));
    return { n, rho, p: isFinite(t) ? 2 * (1 - ST.tCdf(Math.abs(t), n - 2)) : (Math.abs(rho) === 1 ? 0 : NaN) };
  }
  function agreement(schools, data) {
    const A = 5, groups = [], per = [];
    const def = [];
    data.domains.forEach((d) => { const ids = data.riskItems.filter((r) => r.dom === d.code).map((r) => r.id); def.push({ key: 'L-' + d.code, label: 'ความถี่ L ' + d.code, get: (p, id) => p.answers.risk[id][0], ids }); def.push({ key: 'C-' + d.code, label: 'ผลกระทบ C ' + d.code, get: (p, id) => p.answers.risk[id][1], ids }); });
    data.elements.forEach((e) => { const ids = data.sevenItems.filter((s) => s.elem === e.code).map((s) => s.id); def.push({ key: 'D-' + e.code, label: 'สภาพปัจจุบัน D ' + e.code, get: (p, id) => p.answers.seven[id][0], ids }); def.push({ key: 'I-' + e.code, label: 'สภาพพึงประสงค์ I ' + e.code, get: (p, id) => p.answers.seven[id][1], ids }); });
    const ag = schools.map((s) => ({ s, a: aggregateSchool(s, data) })).filter((x) => x.a.complete && x.a.n === 3);
    def.forEach((g) => {
      const rw = ag.map((x) => rwgJ(g.ids.map((id) => x.a.resp.map((p) => g.get(p, id))), A)).filter(isFinite);
      const comp = ag.map((x) => x.a.resp.map((p) => mean(g.ids.map((id) => g.get(p, id)))));
      per.push({ key: g.key, label: g.label, schools: rw.length, medianRwg: rw.length ? ST.median(rw) : NaN, shareAtLeast70: rw.length ? rw.filter((v) => v >= 0.7).length / rw.length : NaN, icc1: icc1(comp) });
    });
    return { schools: ag.length, per };
  }

  // ---------- ความครบถ้วนเทียบรายชื่อโรงเรียน ----------
  function completeness(payloads, roster, data) {
    const bySchool = {}; groupBySchool(payloads).forEach((s) => { bySchool[s.code] = s; });
    const codes = roster && roster.length ? roster.map((r) => r.code) : Object.keys(bySchool);
    return codes.map((code) => {
      const s = bySchool[code], r = (roster || []).find((x) => x.code === code) || {};
      const q = ROLES.map((x) => ({ role: x[0], done: !!(s && s.q[x[0]] && progressQ(s.q[x[0]].answers, data).complete) })), nq = q.filter((x) => x.done).length;
      const inc = !!(s && s.incidents && checkIncidents(s.incidents.answers).complete), doc = !!(s && s.documents && checkDocuments(s.documents.answers).complete);
      return { code, stratum: r.stratum || (s && s.q.R1 && s.q.R1.answers.part1.stratum) || '', nq, q, incidents: inc, documents: doc, complete: nq === 3 && inc && doc, started: !!s, synthetic: !!(s && s.synthetic) };
    });
  }

  // ---------- CSV ----------
  function parseCsv(text) {
    const rows = []; let row = [], cur = '', q = false;
    text = String(text).replace(/^﻿/, '');
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ',') { row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim() !== ''));
  }
  function parseRoster(text) {
    const rows = parseCsv(text); if (!rows.length) return { roster: [], errors: ['ไฟล์ว่าง'] };
    const head = rows[0].map((h) => h.trim().toLowerCase()), ci = head.indexOf('code'), si = head.indexOf('stratum'), pi = head.indexOf('pin');
    if (ci < 0) return { roster: [], errors: ['ต้องมีคอลัมน์ code (รหัสโรงเรียน)'] };
    const roster = [], errors = [], seen = {};
    rows.slice(1).forEach((r, k) => { const code = (r[ci] || '').trim().toUpperCase(); if (!codeOk(code)) { errors.push('แถว ' + (k + 2) + ': รหัสไม่ถูกต้อง'); return; } if (seen[code]) { errors.push('แถว ' + (k + 2) + ': รหัสซ้ำ ' + code); return; } seen[code] = 1; roster.push({ code, stratum: si >= 0 ? (r[si] || '').trim() : '', pin: pi >= 0 ? (r[pi] || '').trim() : '' }); });
    return { roster, errors };
  }
  const csvEsc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const toCsv = (rows) => '﻿' + rows.map((r) => r.map(csvEsc).join(',')).join('\r\n');
  function longRows(payloads, data) {
    const rows = [['school', 'respondent', 'role', 'part', 'item', 'value1', 'value2', 'mode', 'synthetic']];
    payloads.filter((p) => p.form === 'questionnaire').forEach((p) => {
      const role = (ROLES.find((r) => r[0] === p.respondent) || [])[1] || '', a = p.answers;
      Object.keys(a.part1).forEach((k) => rows.push([p.school, p.respondent, role, 'part1', k, a.part1[k], '', p.mode, p.synthetic]));
      data.riskItems.forEach((it) => rows.push([p.school, p.respondent, role, 'risk', it.id, a.risk[it.id][0], a.risk[it.id][1], p.mode, p.synthetic]));
      data.sevenItems.forEach((it) => rows.push([p.school, p.respondent, role, 'seven', it.id, a.seven[it.id][0], a.seven[it.id][1], p.mode, p.synthetic]));
    });
    return rows;
  }

  const api = { SCHEMA, VERSION, ROLES, STRATA, YESNO, BUDGET, RESOURCE, DOC_STATUS, DOCS, DOMAIN_KEYS, blank, part1Missing, progressQ, checkIncidents, checkDocuments, progressOf, pack, validatePayload, codeOk, groupBySchool, aggregateSchool, rwgJ, icc1, spearman, agreement, completeness, parseCsv, parseRoster, toCsv, longRows, fnv };
  if (isNode) module.exports = api; else root.RS_COLLECT = api;
})(typeof window !== 'undefined' ? window : this);
