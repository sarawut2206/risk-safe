/* R²-SAFE ต้นแบบ: วงจรเรียนรู้จากผลการดำเนินงาน
   โรงเรียนบันทึกผลรายมาตรการและประเมินซ้ำเป็นรอบ ส่งออกเป็นรายงานไม่ระบุชื่อ ผู้วิจัยรวมหลายโรงเรียนแล้วระบบเสนอ "ข้อเสนอปรับคลัง"
   หลักการ: (1) ไม่ปรับคลังอัตโนมัติ ทุกข้อเสนอต้องผ่านผู้เชี่ยวชาญ (2) ไม่สรุปเหตุและผลจากกลุ่มเดียวก่อน–หลัง (3) ข้อมูลน้อยกว่าเกณฑ์ไม่ออกข้อเสนอ
   ค่าเกณฑ์ทั้งหมดเป็นค่าเริ่มต้นของผู้วิจัย ยังไม่ผ่านผู้เชี่ยวชาญ ประมวลผลในเบราว์เซอร์ ไม่ส่งข้อมูลออก */
(function (root) {
  'use strict';
  const ST = typeof module !== 'undefined' && module.exports ? require('./stats.js') : root.RS_STATS;

  const SCHEMA = 'r2safe-school-report', VERSION = 1;
  const BARRIERS = [['B1', 'ขาดผู้รับผิดชอบที่ชัดเจน'], ['B2', 'งบประมาณไม่พอ'], ['B3', 'บุคลากรไม่พอหรือภาระงานมาก'], ['B4', 'ขาดความรู้หรือทักษะ'], ['B5', 'ขาดระบบหรือข้อมูลพื้นฐานรองรับ'], ['B6', 'ผู้เกี่ยวข้องยังไม่เห็นความสำคัญ'], ['B7', 'ขาดความร่วมมือจากผู้ปกครอง ชุมชน หรือหน่วยงานภายนอก'], ['B8', 'ไม่เหมาะกับบริบทของโรงเรียน']];
  const STATUS = ['ยังไม่เริ่ม', 'กำลังดำเนินการ', 'เสร็จแล้ว'];
  const EFFECT = ['ไม่เห็นผล', 'เห็นผลน้อย', 'ปานกลาง', 'เห็นผลมาก', 'เห็นผลมากที่สุด'];
  const FIDELITY = [0, 25, 50, 75, 100];
  const DEFAULTS = {
    minN: 5,            // จำนวนโรงเรียนขั้นต่ำต่อมาตรการก่อนออกข้อเสนอ
    lowEffect: 2,       // มัธยฐานผลที่เห็น ≤ ค่านี้ = ผลต่ำ
    highEffect: 4,      // มัธยฐานผลที่เห็น ≥ ค่านี้ = ผลสูง
    kpiShare: 0.6,      // สัดส่วนโรงเรียนที่ตัวชี้วัดดีขึ้นขั้นต่ำ
    fidelityOk: 70,     // มัธยฐานความครบถ้วนในการทำ ≥ ค่านี้ = ทำตามแผนเพียงพอ
    costOverrun: 0.5,   // สัดส่วนโรงเรียนที่ใช้ทรัพยากรจริงสูงกว่าที่คลังระบุ
    barrierShare: 0.4,  // สัดส่วนโรงเรียนที่ระบุอุปสรรคเดียวกัน
    completionLow: 0.5, // สัดส่วนที่ทำเสร็จต่ำกว่านี้ = ทำไม่สำเร็จเป็นส่วนมาก
    minCustom: 3,       // จำนวนโรงเรียนที่เสนอมาตรการใหม่คล้ายกัน
    cellCompletion: 0.7 // สัดส่วนมาตรการที่ทำเสร็จของโรงเรียนในช่อง R ก่อนตัดสินว่า "ทำแล้วแต่ไม่ดีขึ้น"
  };
  const RULE_TEXT = {
    L1: 'ทบทวนหรือพิจารณาถอดมาตรการ: โรงเรียนทำตามแผนครบถ้วนแล้วแต่มัธยฐานผลที่เห็นต่ำ',
    L2: 'บันทึกหลักฐานจากการใช้งานจริง: ผลที่เห็นสูงและตัวชี้วัดดีขึ้นในโรงเรียนส่วนใหญ่ (ไม่ใช่การยกระดับหลักฐาน A–D เพราะไม่มีกลุ่มเปรียบเทียบ)',
    L3: 'ทบทวนระดับทรัพยากรของมาตรการ: โรงเรียนส่วนใหญ่ใช้ทรัพยากรจริงสูงกว่าที่คลังระบุ',
    L4: 'ทบทวนเงื่อนไขก่อนดำเนินการ: ทำสำเร็จน้อยและอุปสรรคคือขาดระบบ/ผู้รับผิดชอบ',
    L5: 'ทบทวนช่วงที่เหมาะกับบริบท: โรงเรียนส่วนใหญ่ระบุว่าไม่เหมาะกับบริบท',
    L6: 'พิจารณาเพิ่มมาตรการใหม่: หลายโรงเรียนเสนอมาตรการคล้ายกันที่ไม่มีในคลัง',
    L7: 'ทบทวนกฎของช่อง R: โรงเรียนทำมาตรการส่วนใหญ่เสร็จแล้วแต่ความเสี่ยงไม่ลดหรือความพร้อมไม่ขึ้น',
  };

  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const clampInt = (v, lo, hi) => { const n = Math.round(Number(v)); return isFinite(n) && n >= lo && n <= hi ? n : null; };
  const sizeBand = (n) => (!(n > 0) ? '' : n <= 120 ? 'เล็ก' : n <= 600 ? 'กลาง' : n <= 1500 ? 'ใหญ่' : 'ใหญ่พิเศษ');

  // ล้างบันทึกรายมาตรการให้เหลือเฉพาะค่าที่ถูกต้อง
  function cleanLog(l) {
    l = l || {};
    const kb = (isNum(Number(l.kpiBefore)) && l.kpiBefore !== '' && l.kpiBefore != null) ? Number(l.kpiBefore) : null;
    const ka = (isNum(Number(l.kpiAfter)) && l.kpiAfter !== '' && l.kpiAfter != null) ? Number(l.kpiAfter) : null;
    return {
      fidelity: FIDELITY.indexOf(Number(l.fidelity)) >= 0 ? Number(l.fidelity) : null,
      costLevel: clampInt(l.costLevel, 1, 3), effect: clampInt(l.effect, 1, 5),
      kpiBefore: kb, kpiAfter: ka, kpiDir: l.kpiDir === 'down' ? 'down' : 'up',
      barriers: (Array.isArray(l.barriers) ? l.barriers : []).filter((b) => BARRIERS.some((x) => x[0] === b)),
      repeat: ['ใช่', 'ไม่', 'ไม่แน่ใจ'].indexOf(l.repeat) >= 0 ? l.repeat : '',
      lesson: String(l.lesson || '').slice(0, 600),
    };
  }

  // ภาพรวมผลการประเมินของโรงเรียน ณ รอบนั้น (สำหรับเปรียบเทียบก่อน–หลัง)
  function makeSnapshot(out, label, when) {
    const dom = {}; out.domains.forEach((d) => { dom[d.code] = { rd: isNum(d.rd) ? +d.rd.toFixed(4) : null, risk: d.risk, override: !!d.override, cell: d.group }; });
    const el = {}; out.elements.forEach((e) => { el[e.code] = isNum(e.d) ? +e.d.toFixed(4) : null; });
    return { label: String(label || '').slice(0, 40), date: when || new Date().toISOString(), resource: out.resource, ready: { mean: isNum(out.readyMean) ? +out.readyMean.toFixed(4) : null, level: out.readyFinal, floorHit: !!out.floorHit }, domains: dom, elements: el };
  }
  const meanRisk = (snap) => { const v = Object.keys(snap.domains).map((k) => snap.domains[k].rd).filter(isNum); return v.length ? ST.mean(v) : null; };
  function compare(a, b) {
    const dom = Object.keys(b.domains).map((k) => { const x = a.domains[k] || {}, y = b.domains[k]; return { code: k, rdA: x.rd, rdB: y.rd, dRd: isNum(x.rd) && isNum(y.rd) ? y.rd - x.rd : null, cellA: x.cell, cellB: y.cell, riskA: x.risk, riskB: y.risk }; });
    const el = Object.keys(b.elements).map((k) => ({ code: k, dA: a.elements[k], dB: b.elements[k], dD: isNum(a.elements[k]) && isNum(b.elements[k]) ? b.elements[k] - a.elements[k] : null }));
    return { domains: dom, elements: el, dReady: isNum(a.ready.mean) && isNum(b.ready.mean) ? b.ready.mean - a.ready.mean : null, readyA: a.ready.level, readyB: b.ready.level, dRiskMean: isNum(meanRisk(a)) && isNum(meanRisk(b)) ? meanRisk(b) - meanRisk(a) : null };
  }

  // รายงานส่งผู้วิจัย: ไม่มีชื่อโรงเรียน ชื่อบุคคล หรือข้อความอิสระ เว้นแต่ผู้ใช้เลือกแนบ
  function makeReport(track, school, out, opts) {
    opts = opts || {};
    const measures = [];
    out.domains.forEach((d) => d.measures.forEach((m) => {
      const key = d.code + ':' + m.id, lg = cleanLog((track.logs || {})[key]);
      const row = { sb: m.sb || m.id, dom: d.code, cell: d.group, order: m.order, res: m.res, status: (track.status || {})[key] || STATUS[0], fidelity: lg.fidelity, costLevel: lg.costLevel, effect: lg.effect, kpi: { before: lg.kpiBefore, after: lg.kpiAfter, dir: lg.kpiDir }, barriers: lg.barriers, repeat: lg.repeat };
      if (opts.includeText && lg.lesson) row.lesson = lg.lesson;
      measures.push(row);
    }));
    return {
      schema: SCHEMA, version: VERSION, generatedAt: new Date().toISOString(), synthetic: !!opts.synthetic,
      code: track.code || '', arm: ['intervention', 'comparison'].indexOf(track.arm) >= 0 ? track.arm : '',
      school: { sizeBand: sizeBand(+school.students), year: String(school.year || '').slice(0, 4), province: opts.includeProvince ? String(school.province || '').slice(0, 40) : '' },
      resource: out.resource, snapshots: (track.snaps || []).slice(0, 12), measures,
      custom: (track.custom || []).slice(0, 20).map((c) => ({ dom: c.dom, elem: c.elem, name: String(c.name || '').slice(0, 120), effect: clampInt(c.effect, 1, 5), desc: opts.includeText ? String(c.desc || '').slice(0, 300) : '' })),
    };
  }
  function validateReport(r) {
    if (!r || r.schema !== SCHEMA) return { ok: false, why: 'ไม่ใช่ไฟล์รายงานโรงเรียนของ R²-SAFE' };
    if (r.version !== VERSION) return { ok: false, why: 'เวอร์ชันของไฟล์ไม่ตรง (' + r.version + ')' };
    if (!Array.isArray(r.measures) || !Array.isArray(r.snapshots)) return { ok: false, why: 'โครงสร้างไฟล์ไม่ครบ' };
    return { ok: true };
  }

  // คู่ก่อน–หลังของโรงเรียน: รอบแรกกับรอบสุดท้าย (ต้องมี ≥ 2 รอบ)
  function pairs(reports) {
    const rows = [];
    reports.forEach((r) => {
      const s = (r.snapshots || []).slice().sort((x, y) => String(x.date).localeCompare(String(y.date)));
      if (s.length < 2) return;
      const a = s[0], b = s[s.length - 1], c = compare(a, b);
      rows.push({ code: r.code, arm: r.arm || '', readyPre: a.ready.mean, readyPost: b.ready.mean, riskPre: meanRisk(a), riskPost: meanRisk(b), dReady: c.dReady, dRisk: c.dRiskMean, done: r.measures.length ? r.measures.filter((m) => m.status === 'เสร็จแล้ว').length / r.measures.length : null, domains: c.domains });
    });
    return rows;
  }

  // รวมหลายโรงเรียน -> สถิติรายมาตรการ รายช่อง R และข้อเสนอปรับคลัง
  function aggregate(reports, bank, paramsIn) {
    const P = Object.assign({}, DEFAULTS, paramsIn || {});
    const byId = {}; bank.forEach((b) => { byId[b.sb || b.id] = b; });
    const acc = {};
    reports.forEach((r) => r.measures.forEach((m) => { (acc[m.sb] = acc[m.sb] || []).push(m); }));
    const med = (a) => (a.length ? ST.median(a) : null);
    const per = Object.keys(acc).sort().map((sb) => {
      const L = acc[sb], b = byId[sb] || {};
      const started = L.filter((x) => x.status !== STATUS[0]), done = L.filter((x) => x.status === STATUS[2]);
      const eff = L.map((x) => x.effect).filter(isNum), fid = started.map((x) => x.fidelity).filter(isNum);
      const kp = L.filter((x) => x.kpi && isNum(x.kpi.before) && isNum(x.kpi.after));
      const improved = kp.filter((x) => (x.kpi.after - x.kpi.before) * (x.kpi.dir === 'down' ? -1 : 1) > 0).length;
      const cost = L.map((x) => x.costLevel).filter(isNum), over = cost.filter((c) => c > (b.res || 1)).length;
      const bar = {}; BARRIERS.forEach((x) => { bar[x[0]] = L.filter((m) => (m.barriers || []).indexOf(x[0]) >= 0).length; });
      return { sb, name: b.name || '', res: b.res || null, n: L.length, nStarted: started.length, nDone: done.length, completion: L.length ? done.length / L.length : null,
        nEffect: eff.length, medEffect: med(eff), medFidelity: med(fid), nKpi: kp.length, kpiImproved: improved, kpiShare: kp.length ? improved / kp.length : null,
        nCost: cost.length, overrun: over, overrunShare: cost.length ? over / cost.length : null, barriers: bar, repeatYes: L.filter((x) => x.repeat === 'ใช่').length, nRepeat: L.filter((x) => x.repeat).length };
    });
    const proposals = [];
    const add = (rule, p, because) => proposals.push({ rule, ruleText: RULE_TEXT[rule], sb: p.sb, name: p.name, n: p.n, because, status: 'รอผู้เชี่ยวชาญพิจารณา (ไม่ปรับคลังอัตโนมัติ)' });
    per.forEach((p) => {
      if (p.n < P.minN) return;
      if (p.nEffect >= P.minN && p.medEffect <= P.lowEffect && isNum(p.medFidelity) && p.medFidelity >= P.fidelityOk) add('L1', p, 'ผู้ประเมิน ' + p.nEffect + ' โรงเรียน มัธยฐานผลที่เห็น ' + p.medEffect + ' จาก 5 และมัธยฐานความครบถ้วนในการทำ ' + p.medFidelity + '%');
      if (p.nEffect >= P.minN && p.medEffect >= P.highEffect && p.nKpi >= P.minN && p.kpiShare >= P.kpiShare) add('L2', p, 'มัธยฐานผลที่เห็น ' + p.medEffect + ' จาก 5 และตัวชี้วัดดีขึ้นใน ' + p.kpiImproved + ' จาก ' + p.nKpi + ' โรงเรียน (' + Math.round(p.kpiShare * 100) + '%)');
      if (p.nCost >= P.minN && p.overrunShare >= P.costOverrun) add('L3', p, 'ใช้ทรัพยากรจริงสูงกว่าระดับ ' + p.res + ' ที่คลังระบุใน ' + p.overrun + ' จาก ' + p.nCost + ' โรงเรียน');
      if (p.completion != null && p.completion < P.completionLow && p.barriers.B5 / p.n >= P.barrierShare) add('L4', p, 'ทำเสร็จ ' + p.nDone + ' จาก ' + p.n + ' โรงเรียน และ ' + p.barriers.B5 + ' โรงเรียนระบุว่าขาดระบบหรือข้อมูลพื้นฐานรองรับ');
      if (p.barriers.B8 / p.n >= P.barrierShare) add('L5', p, p.barriers.B8 + ' จาก ' + p.n + ' โรงเรียนระบุว่าไม่เหมาะกับบริบท');
    });
    // มาตรการใหม่ที่โรงเรียนเสนอ: รวมชื่อที่เหมือนกันหลังตัดช่องว่างและตัวพิมพ์ (ไม่ตีความความหมาย ผู้วิจัยรวมกลุ่มเองต่อ)
    const cu = {};
    reports.forEach((r, ri) => (r.custom || []).forEach((c) => { const k = String(c.name || '').trim().toLowerCase(); if (!k) return; (cu[k] = cu[k] || { name: c.name, schools: {}, effects: [] }); cu[k].schools[r.code || ('r' + ri)] = 1; if (isNum(c.effect)) cu[k].effects.push(c.effect); }));
    const custom = Object.keys(cu).map((k) => ({ name: cu[k].name, nSchools: Object.keys(cu[k].schools).length, medEffect: med(cu[k].effects) })).sort((a, b) => b.nSchools - a.nSchools);
    custom.filter((c) => c.nSchools >= P.minCustom).forEach((c) => proposals.push({ rule: 'L6', ruleText: RULE_TEXT.L6, sb: '', name: c.name, n: c.nSchools, because: c.nSchools + ' โรงเรียนเสนอมาตรการชื่อนี้' + (isNum(c.medEffect) ? ' มัธยฐานผลที่เห็น ' + c.medEffect + ' จาก 5' : ''), status: 'รอผู้เชี่ยวชาญพิจารณา (ไม่ปรับคลังอัตโนมัติ)' }));
    // รายช่อง R: เปลี่ยนแปลงของแต่ละ (โรงเรียน × ด้าน) จากรอบแรกถึงรอบสุดท้าย จัดกลุ่มตามช่อง R ของรอบแรก
    const cellU = {};
    pairs(reports).forEach((p) => p.domains.forEach((d) => { if (!d.cellA) return; (cellU[d.cellA] = cellU[d.cellA] || []).push({ dRd: d.dRd, dReady: p.dReady, done: p.done }); }));
    const cells = Object.keys(cellU).sort().map((k) => { const u = cellU[k]; return { cell: k, n: u.length, medDRd: med(u.map((x) => x.dRd).filter(isNum)), medDReady: med(u.map((x) => x.dReady).filter(isNum)), medDone: med(u.map((x) => x.done).filter(isNum)) }; });
    cells.forEach((c) => { if (c.n >= P.minN && isNum(c.medDone) && c.medDone >= P.cellCompletion && ((isNum(c.medDRd) && c.medDRd >= 0) || (isNum(c.medDReady) && c.medDReady <= 0))) proposals.push({ rule: 'L7', ruleText: RULE_TEXT.L7, sb: c.cell, name: 'ช่อง ' + c.cell, n: c.n, because: c.n + ' หน่วย (โรงเรียน×ด้าน) มัธยฐานสัดส่วนมาตรการเสร็จ ' + Math.round(c.medDone * 100) + '% แต่มัธยฐานการเปลี่ยนดัชนีความเสี่ยง ' + (isNum(c.medDRd) ? c.medDRd.toFixed(2) : '–') + ' และความพร้อม ' + (isNum(c.medDReady) ? c.medDReady.toFixed(2) : '–'), status: 'รอผู้เชี่ยวชาญพิจารณา (ไม่ปรับคลังอัตโนมัติ)' }); });
    const enough = per.filter((p) => p.n >= P.minN).length;
    return { params: P, nReports: reports.length, nSynthetic: reports.filter((r) => r.synthetic).length, per, cells, custom, proposals,
      sufficiency: { measuresWithEnough: enough, measures: per.length, text: enough ? 'มี ' + enough + ' มาตรการที่มีข้อมูลถึงเกณฑ์ ' + P.minN + ' โรงเรียน' : 'ยังไม่มีมาตรการใดมีข้อมูลถึง ' + P.minN + ' โรงเรียน จึงยังไม่ออกข้อเสนอปรับคลัง (ป้องกันการสรุปจากข้อมูลน้อย)' } };
  }

  const api = { SCHEMA, VERSION, BARRIERS, STATUS, EFFECT, FIDELITY, DEFAULTS, RULE_TEXT, cleanLog, makeSnapshot, compare, makeReport, validateReport, pairs, aggregate, sizeBand };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RS_LEARN = api;
})(typeof window !== 'undefined' ? window : this);
