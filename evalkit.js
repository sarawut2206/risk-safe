/* R²-SAFE ต้นแบบ: ชุดเครื่องมือพิสูจน์ประสิทธิภาพของกลไก
   (1) แบบประเมินผู้เชี่ยวชาญ: ตัดสินกรณีจำลอง 27 กรณี + ให้คะแนนกลไก 15 ข้อ
   (2) แบบประเมินผู้บริหาร: 4 ด้านตามมาตรฐานการประเมิน (ประโยชน์ ความเป็นไปได้ ความเหมาะสม ความถูกต้อง) + SUS
   (3) ตัววิเคราะห์ผลและตารางตัวชี้วัดความสำเร็จ (scorecard) ไม่มีข้อมูลในไฟล์นี้ ผลคำนวณจากไฟล์ที่ผู้วิจัยนำเข้าเท่านั้น
   ข้อคำถามและเกณฑ์เป็นร่างของผู้วิจัย ต้องผ่านการตรวจความตรงเชิงเนื้อหา (IOC) และได้รับรองจริยธรรมก่อนใช้เก็บข้อมูลจริง */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const ST = isNode ? require('./stats.js') : root.RS_STATS;
  const EN = isNode ? require('./engine.js') : root.RS_ENGINE;

  const SCHEMA_EXPERT = 'r2safe-expert-eval', SCHEMA_ADMIN = 'r2safe-admin-eval', VERSION = 1;
  const CASESET = 'cases-v1-seed-20260';

  // ---------- เกณฑ์ (ร่าง ต้องล็อกก่อนเก็บข้อมูล) ----------
  const CRIT = {
    medianMin: 4.0, iqrMax: 1.0,   // เกณฑ์เดลฟายรายข้อ (ตามแบบเดลฟาย v2)
    minShare: 7 / 9,               // ข้อเสนอเพิ่ม: สัดส่วนผู้เชี่ยวชาญที่ให้ 4–5 (รอที่ปรึกษาตัดสิน)
    kappaMin: 0.61, alphaMin: 0.667, // ความสอดคล้อง (ข้อเสนอผู้วิจัย รอที่ปรึกษาตัดสิน)
    fitMedianMin: 4, fitShareMin: 0.7,
    aspectMin: 3.51, susMin: 68,   // ผู้บริหาร: ระดับ "มาก" ขึ้นไป และค่ากลางของ SUS
    pilotMinSchools: 8, alpha: 0.05,
  };

  // ---------- ข้อคำถาม ----------
  const EXPERT_ITEMS = [
    { id: 'M1', g: 'กลไกตัดสินใจ', t: 'กฎรายแกน (A1–A3 ตามระดับความเสี่ยง และ B1–B3 ตามระดับความพร้อม) ชัดเจนและนำไปปฏิบัติได้' },
    { id: 'M2', g: 'กลไกตัดสินใจ', t: 'กลยุทธ์เฉพาะช่อง R1–R9 เหมาะกับระดับความเสี่ยงและความพร้อมของแต่ละช่อง' },
    { id: 'M3', g: 'กลไกตัดสินใจ', t: 'เงื่อนไขขั้นต่ำของแต่ละช่อง (เช่น ความเสี่ยงสูงต้องมีมาตรการควบคุม) เหมาะสม ไม่มากหรือน้อยเกินไป' },
    { id: 'M4', g: 'กลไกตัดสินใจ', t: 'ลำดับก่อนหลังของการลงมือในแต่ละช่องสมเหตุสมผล' },
    { id: 'M5', g: 'กลไกตัดสินใจ', t: 'ค่าตัดระดับความเสี่ยง (6.0 และ 12.0) และระดับความพร้อม (2.60 และ 3.40) เหมาะสม' },
    { id: 'M6', g: 'กลไกตัดสินใจ', t: 'กฎยกระดับ (C = 5 และ L ≥ 2) และกฎเพดาน (D ของโครงสร้างและระบบ) เหมาะสม' },
    { id: 'X1', g: 'การอธิบายเหตุผล', t: 'การแสดงเหตุผล "ทำไมเลือก" รายมาตรการเข้าใจง่ายและตรวจย้อนกลับได้' },
    { id: 'X2', g: 'การอธิบายเหตุผล', t: 'การแสดง "ทำไมไม่เลือก" (ด่านที่ตกและเงื่อนไขที่จะทำให้ผลเปลี่ยน) เป็นประโยชน์ต่อผู้บริหาร' },
    { id: 'X3', g: 'การอธิบายเหตุผล', t: 'ข้อมูลระยะห่างจากเส้นแบ่งช่วยให้ผู้บริหารเห็นความไม่แน่นอนของผล' },
    { id: 'L1', g: 'การเรียนรู้จากผลงาน', t: 'ข้อมูลที่ให้โรงเรียนบันทึกหลังดำเนินการครบถ้วนพอสำหรับพัฒนาคลัง' },
    { id: 'L2', g: 'การเรียนรู้จากผลงาน', t: 'กฎเสนอปรับคลัง (L1–L7) สมเหตุสมผล และการให้ผู้เชี่ยวชาญตัดสินก่อนปรับคลังเหมาะสม' },
    { id: 'L3', g: 'การเรียนรู้จากผลงาน', t: 'กระบวนการนำบทเรียนกลับสู่คลังมีความเป็นไปได้' },
    { id: 'O1', g: 'ภาพรวม', t: 'กลไกโดยรวมเหมาะกับการใช้ในโรงเรียนมัธยมศึกษา' },
    { id: 'O2', g: 'ภาพรวม', t: 'กลไกเป็นประโยชน์ต่อการตัดสินใจของผู้อำนวยการสถานศึกษา' },
    { id: 'O3', g: 'ภาพรวม', t: 'กลไกมีส่วนที่เพิ่มขึ้นจากการใช้ ISO 31000 และ 7-S แยกกัน' },
  ];
  const ADMIN_ASPECTS = [
    { id: 'U', name: 'ด้านประโยชน์ (Utility)', items: [
      ['U1', 'ผลวิเคราะห์ตรงกับสถานการณ์ความปลอดภัยของโรงเรียน'], ['U2', 'ช่วยจัดลำดับสิ่งที่ต้องทำก่อนหลังได้'], ['U3', 'เหตุผลที่แสดงช่วยอธิบายต่อคณะครูหรือต้นสังกัดได้'],
      ['U4', 'แผนปฏิบัติการที่ได้นำไปใช้ต่อได้จริง'], ['U5', 'ช่วยให้เห็นช่องว่างของความพร้อมขององค์กร']] },
    { id: 'F', name: 'ด้านความเป็นไปได้ (Feasibility)', items: [
      ['F1', 'เวลาที่ใช้ประเมินเหมาะสม'], ['F2', 'ใช้ทรัพยากรที่โรงเรียนมีอยู่ได้'], ['F3', 'ผู้เกี่ยวข้องใช้ได้โดยไม่ต้องอบรมมาก'],
      ['F4', 'ข้อมูลที่ต้องกรอกหาได้จริงในโรงเรียน'], ['F5', 'มาตรการที่เสนอทำได้ในบริบทของโรงเรียน']] },
    { id: 'P', name: 'ด้านความเหมาะสม (Propriety)', items: [
      ['P1', 'ข้อมูลที่ใช้ไม่ละเมิดความเป็นส่วนตัวของบุคคล'], ['P2', 'ภาษาและตัวชี้วัดเหมาะกับวัฒนธรรมของโรงเรียน'], ['P3', 'ไม่ก่อภาระเกินควรต่อครูและนักเรียน'],
      ['P4', 'ผลที่ได้ไม่ถูกนำไปใช้ตัดสินลงโทษบุคคล'], ['P5', 'เปิดโอกาสให้ผู้เกี่ยวข้องมีส่วนร่วมในการให้คะแนน']] },
    { id: 'A', name: 'ด้านความถูกต้อง (Accuracy)', items: [
      ['A1', 'ระดับความเสี่ยงที่ได้สอดคล้องกับประสบการณ์จริงของโรงเรียน'], ['A2', 'ระดับความพร้อมที่ได้สอดคล้องกับประสบการณ์จริงของโรงเรียน'], ['A3', 'มาตรการที่เสนอสอดคล้องกับปัญหาที่พบ'],
      ['A4', 'เหตุผลที่อธิบายตรวจสอบย้อนกลับได้'], ['A5', 'คาดว่าผลจะใกล้เคียงกันถ้าคนละคนประเมินซ้ำ']] },
  ];
  // SUS (Brooke, 1996) คำแปลเป็นของผู้วิจัย ต้องตรวจความตรงของภาษาก่อนใช้ ข้อคี่เป็นข้อความเชิงบวก ข้อคู่เป็นเชิงลบ
  const SUS_ITEMS = [
    ['S1', 'ฉันคิดว่าจะใช้ระบบนี้บ่อย'], ['S2', 'ฉันพบว่าระบบนี้ซับซ้อนโดยไม่จำเป็น'], ['S3', 'ฉันคิดว่าระบบนี้ใช้ง่าย'], ['S4', 'ฉันคิดว่าต้องมีผู้ช่วยเทคนิคจึงจะใช้ระบบนี้ได้'],
    ['S5', 'ฉันพบว่าฟังก์ชันต่าง ๆ ในระบบนี้เข้ากันได้ดี'], ['S6', 'ฉันคิดว่าระบบนี้มีความไม่สอดคล้องกันมากเกินไป'], ['S7', 'ฉันคิดว่าคนส่วนใหญ่เรียนรู้การใช้ระบบนี้ได้เร็ว'],
    ['S8', 'ฉันพบว่าระบบนี้ใช้งานยุ่งยากมาก'], ['S9', 'ฉันรู้สึกมั่นใจเมื่อใช้ระบบนี้'], ['S10', 'ฉันต้องเรียนรู้หลายอย่างก่อนจึงจะเริ่มใช้ระบบนี้ได้'],
  ];
  const band = (m) => (m >= 4.51 ? 'มากที่สุด' : m >= 3.51 ? 'มาก' : m >= 2.51 ? 'ปานกลาง' : m >= 1.51 ? 'น้อย' : 'น้อยที่สุด');

  // ---------- ชุดกรณีจำลอง 27 กรณี (ช่อง R ละ 3 กรณี: กลาง ใกล้เส้นแบ่ง และกรณีพิเศษ) ----------
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const EL = ['STG', 'STR', 'SYS', 'STY', 'STF', 'SKL', 'VAL'];
  const RISK_BAND = { 'สูง': [[14, 20], [6.5, 11.5], [12.1, 12.7]], 'กลาง': [[8.5, 9.5], [6.2, 6.8], [11.3, 11.9]], 'ต่ำ': [[2.5, 4.5], [5.3, 5.9], [1.5, 2.5]] };
  const READY_BAND = { 'ต่ำ': [[1.6, 2.2], [2.2, 2.5], [2.45, 2.6]], 'กลาง': [[2.9, 3.2], [3.5, 3.9], [2.62, 2.78]], 'สูง': [[3.9, 4.6], [3.6, 3.9], [3.41, 3.55]] };
  const r1 = (x) => Math.round(x * 10) / 10, r2 = (x) => Math.round(x * 100) / 100;
  function makeCases(domains) {
    const rnd = mulberry32(20260), cases = [], DOMS = domains || [{ code: 'V', name: 'ภัยจากการใช้ความรุนแรงของมนุษย์' }, { code: 'A', name: 'ภัยจากอุบัติเหตุและภัยพิบัติ' }, { code: 'P', name: 'ภัยจากการละเมิดสิทธิ' }, { code: 'H', name: 'ภัยจากผลกระทบทางสุขภาวะทางกายและจิตใจ' }];
    const RL = ['สูง', 'กลาง', 'ต่ำ'], YL = ['ต่ำ', 'กลาง', 'สูง'];
    for (let ci = 0; ci < 9; ci++) {
      const risk = RL[Math.floor(ci / 3)], ready = YL[ci % 3], target = 'R' + (ci + 1);
      for (let v = 0; v < 3; v++) {
        // v0: กลางแถบทั้งสองแกน · v1: ความเสี่ยงกรณีพิเศษ/ใกล้เส้น + ความพร้อมกลางแถบหรือกรณีพิเศษ · v2: ความเสี่ยงกลางแถบ + ความพร้อมใกล้เส้น
        const rb = RISK_BAND[risk][v === 0 ? 0 : v === 1 ? 1 : 0], yb = READY_BAND[ready][v === 0 ? 0 : v === 1 ? 1 : 2];
        const override = risk === 'สูง' && v === 1;
        const floorCase = ready === 'กลาง' && v === 1;
        let made = null;
        for (let tries = 0; tries < 2000 && !made; tries++) {
          const rd = r1(rb[0] + rnd() * (rb[1] - rb[0]));
          const goal = yb[0] + rnd() * (yb[1] - yb[0]);
          const d = EL.map(() => r2(Math.max(1, Math.min(5, goal + (rnd() - 0.5) * 0.9))));
          if (floorCase) d[2] = r2(2.0 + rnd() * 0.55);                 // ระบบต่ำกว่าเพดาน
          else if (ready === 'สูง') { d[1] = Math.max(d[1], 2.7); d[2] = Math.max(d[2], 2.7); }
          const mean = r2(d.reduce((s, x) => s + x, 0) / 7);
          const rk = EN.classifyRisk(rd, override), ry = EN.classifyReady(mean, d[1], d[2]);
          if (rk === risk && ry.final === ready && (!floorCase || ry.floorHit) && (floorCase || !ry.floorHit) && mean >= yb[0] - 0.02 && mean <= yb[1] + 0.02) made = { rd, d, mean, strD: d[1], sysD: d[2], override, floorHit: ry.floorHit };
        }
        if (!made) throw new Error('สร้างกรณีไม่สำเร็จ ' + target + ' v' + v);
        const dom = DOMS[(ci * 3 + v) % 4];
        cases.push({ target, dom: dom.code, domName: dom.name, rd: made.rd, override: made.override, elemD: made.d.slice(), readyMean: made.mean, strD: made.strD, sysD: made.sysD, sys: { risk, ready, cell: target }, kind: floorCase ? 'floor' : override ? 'override' : v === 0 ? 'central' : 'near' });
      }
    }
    // สลับลำดับแบบกำหนดผลได้ เพื่อไม่ให้กรณีของช่องเดียวกันอยู่ติดกัน
    for (let i = cases.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = cases[i]; cases[i] = cases[j]; cases[j] = t; }
    cases.forEach((c, i) => { c.id = 'C' + String(i + 1).padStart(2, '0'); });
    return cases;
  }
  const LV_R = { 'ต่ำ': 0, 'กลาง': 1, 'สูง': 2 };

  // ---------- วิเคราะห์ผู้เชี่ยวชาญ ----------
  function validExpert(f) { return f && f.schema === SCHEMA_EXPERT && f.version === VERSION; }
  function validAdmin(f) { return f && f.schema === SCHEMA_ADMIN && f.version === VERSION; }
  function analyzeExperts(files, cases, paramsIn) {
    const P = Object.assign({}, CRIT, paramsIn || {});
    const F = files.filter(validExpert), n = F.length;
    if (!n) return { n: 0 };
    const need = Math.ceil(n * P.minShare - 1e-9);
    const items = EXPERT_ITEMS.map((it) => {
      const v = F.map((f) => (f.items || {})[it.id]).filter((x) => Number.isInteger(x) && x >= 1 && x <= 5);
      const ge4 = v.filter((x) => x >= 4).length, med = ST.median(v), q = ST.iqr(v);
      const classic = v.length > 0 && med >= P.medianMin && q <= P.iqrMax;
      return { id: it.id, g: it.g, t: it.t, n: v.length, median: med, iqr: q, ge4, share: v.length ? ge4 / v.length : null, classic, pass: classic && ge4 >= need };
    });
    // กรณีจำลอง
    const axis = (key) => F.map((f) => cases.map((c) => { const a = (f.cases || {})[c.id]; return a && LV_R[a[key]] != null ? LV_R[a[key]] : null; }));
    const sysR = cases.map((c) => LV_R[c.sys.risk]), sysY = cases.map((c) => LV_R[c.sys.ready]);
    const expR = axis('risk'), expY = axis('ready');
    const per = F.map((f, i) => {
      const kr = ST.kappa(sysR, expR[i].map((x) => (x == null ? -1 : x)), 3, 'quadratic'), ky = ST.kappa(sysY, expY[i].map((x) => (x == null ? -1 : x)), 3, 'quadratic');
      let cellAgree = 0, cellN = 0;
      cases.forEach((c, k) => { if (expR[i][k] != null && expY[i][k] != null) { cellN++; if (expR[i][k] === sysR[k] && expY[i][k] === sysY[k]) cellAgree++; } });
      return { code: f.code || ('#' + (i + 1)), kRisk: kr.kappa, kReady: ky.kappa, aRisk: kr.agree, aReady: ky.agree, cell: cellN ? cellAgree / cellN : null, answered: kr.n };
    });
    // ฉันทามติ = มัธยฐานของผู้เชี่ยวชาญ (ปัดครึ่งขึ้น) รายกรณี
    const cons = (arr) => cases.map((c, k) => { const v = arr.map((r) => r[k]).filter((x) => x != null); return v.length ? Math.floor(ST.median(v) + 0.5) : -1; });
    const cR = cons(expR), cY = cons(expY);
    const kcR = ST.kappa(sysR, cR, 3, 'quadratic'), kcY = ST.kappa(sysY, cY, 3, 'quadratic');
    let cellC = 0, cellCn = 0; cases.forEach((c, k) => { if (cR[k] >= 0 && cY[k] >= 0) { cellCn++; if (cR[k] === sysR[k] && cY[k] === sysY[k]) cellC++; } });
    const unitsOf = (arr, extra) => cases.map((c, k) => arr.map((r) => r[k]).concat(extra ? [extra[k]] : []));
    const aR = ST.alpha(unitsOf(expR), 'ordinal').alpha, aY = ST.alpha(unitsOf(expY), 'ordinal').alpha;
    const aRs = ST.alpha(unitsOf(expR, sysR), 'ordinal').alpha, aYs = ST.alpha(unitsOf(expY, sysY), 'ordinal').alpha;
    const fits = []; const byCell = {};
    F.forEach((f) => cases.forEach((c) => { const a = (f.cases || {})[c.id]; if (a && Number.isInteger(a.fit) && a.fit >= 1 && a.fit <= 5) { fits.push(a.fit); (byCell[c.target] = byCell[c.target] || []).push(a.fit); } }));
    const fitByCell = Object.keys(byCell).sort().map((k) => ({ cell: k, n: byCell[k].length, median: ST.median(byCell[k]), share: byCell[k].filter((x) => x >= 4).length / byCell[k].length }));
    const mean = (a) => { const v = a.filter((x) => typeof x === 'number' && isFinite(x)); return v.length ? ST.mean(v) : null; };
    return { n, need, params: P, items, per, consensus: { kRisk: kcR.kappa, kReady: kcY.kappa, cell: cellCn ? cellC / cellCn : null, aRisk: kcR.agree, aReady: kcY.agree },
      alpha: { risk: aR, ready: aY, riskWithSystem: aRs, readyWithSystem: aYs }, kMean: { risk: mean(per.map((p) => p.kRisk)), ready: mean(per.map((p) => p.kReady)) },
      fit: { n: fits.length, median: fits.length ? ST.median(fits) : null, share: fits.length ? fits.filter((x) => x >= 4).length / fits.length : null, byCell: fitByCell } };
  }

  // ---------- วิเคราะห์ผู้บริหาร ----------
  function susScore(s) {
    let tot = 0; for (let i = 1; i <= 10; i++) { const v = (s || {})['S' + i]; if (!Number.isInteger(v) || v < 1 || v > 5) return null; tot += i % 2 === 1 ? v - 1 : 5 - v; }
    return tot * 2.5;
  }
  function analyzeAdmins(files, paramsIn) {
    const P = Object.assign({}, CRIT, paramsIn || {});
    const F = files.filter(validAdmin), n = F.length; if (!n) return { n: 0 };
    const aspects = ADMIN_ASPECTS.map((a) => {
      const items = a.items.map(([id, t]) => { const v = F.map((f) => (f.items || {})[id]).filter((x) => Number.isInteger(x) && x >= 1 && x <= 5); return { id, t, n: v.length, mean: v.length ? ST.mean(v) : null, sd: v.length > 1 ? ST.sd(v) : null }; });
      const per = F.map((f) => { const v = a.items.map(([id]) => (f.items || {})[id]).filter((x) => Number.isInteger(x) && x >= 1 && x <= 5); return v.length === a.items.length ? ST.mean(v) : null; }).filter((x) => x != null);
      const m = per.length ? ST.mean(per) : null;
      return { id: a.id, name: a.name, items, n: per.length, mean: m, sd: per.length > 1 ? ST.sd(per) : null, level: m == null ? '' : band(m), pass: m != null && m >= P.aspectMin };
    });
    const sus = F.map((f) => susScore(f.sus)).filter((x) => x != null);
    return { n, params: P, aspects, sus: { n: sus.length, mean: sus.length ? ST.mean(sus) : null, median: sus.length ? ST.median(sus) : null, sd: sus.length > 1 ? ST.sd(sus) : null, shareAtLeast: sus.length ? sus.filter((x) => x >= P.susMin).length / sus.length : null, pass: sus.length > 0 && ST.mean(sus) >= P.susMin } };
  }

  // ---------- นำร่อง ก่อน–หลัง ----------
  function analyzePilot(pairRows, paramsIn) {
    const P = Object.assign({}, CRIT, paramsIn || {});
    const n = pairRows.length; if (!n) return { n: 0 };
    const rp = pairRows.map((r) => r.readyPre), rq = pairRows.map((r) => r.readyPost), kp = pairRows.map((r) => r.riskPre), kq = pairRows.map((r) => r.riskPost);
    const out = { n, params: P, ready: { t: ST.pairedT(rp, rq), w: ST.wilcoxon(rp, rq) }, risk: { t: ST.pairedT(kp, kq), w: ST.wilcoxon(kp, kq) }, done: ST.median(pairRows.map((r) => r.done).filter((x) => typeof x === 'number')) };
    const iv = pairRows.filter((r) => r.arm === 'intervention'), cp = pairRows.filter((r) => r.arm === 'comparison');
    if (iv.length >= 2 && cp.length >= 2) out.arms = { ready: ST.welch(iv.map((r) => r.dReady), cp.map((r) => r.dReady)), risk: ST.welch(iv.map((r) => r.dRisk), cp.map((r) => r.dRisk)), nIv: iv.length, nCp: cp.length };
    out.note = out.arms ? 'มีกลุ่มเปรียบเทียบ จึงดูผลต่างของการเปลี่ยนแปลงระหว่างกลุ่มได้ แต่ถ้าไม่ได้สุ่มกลุ่ม ยังสรุปเหตุและผลไม่ได้เต็มที่' : 'ไม่มีกลุ่มเปรียบเทียบ ผลก่อน–หลังบอกได้เพียงการเปลี่ยนแปลง ไม่ใช่ผลของกลไก (ความสุกงอมตามเวลา ฤดูกาล และเหตุการณ์ภายนอกปะปนอยู่)';
    return out;
  }

  // ---------- ตารางตัวชี้วัดความสำเร็จ ----------
  function scorecard(res, paramsIn) {
    const P = Object.assign({}, CRIT, paramsIn || {}), rows = [];
    const NA = 'ยังไม่มีข้อมูล', OK = 'ผ่าน', NO = 'ไม่ผ่าน';
    const e = res.experts, a = res.admins, p = res.pilot, l = res.learning;
    const f = (x, d) => (typeof x === 'number' && isFinite(x) ? x.toFixed(d == null ? 2 : d) : '–');
    rows.push(!e || !e.n ? { id: 'C1', text: 'ผู้เชี่ยวชาญเห็นว่ากลไกเหมาะสมทุกข้อ (Median ≥ ' + P.medianMin + ' IQR ≤ ' + P.iqrMax + ' และให้ 4–5 อย่างน้อย 7 ใน 9)', status: NA, detail: '' } : { id: 'C1', text: 'ผู้เชี่ยวชาญเห็นว่ากลไกเหมาะสมทุกข้อ (Median ≥ ' + P.medianMin + ' IQR ≤ ' + P.iqrMax + ' และให้ 4–5 อย่างน้อย 7 ใน 9 คน)', status: e.items.every((x) => x.pass) ? OK : NO, detail: 'ผ่าน ' + e.items.filter((x) => x.pass).length + ' จาก ' + e.items.length + ' ข้อ (ผู้เชี่ยวชาญ ' + e.n + ' คน)' });
    rows.push(!e || !e.n ? { id: 'C2', text: 'ระบบกับฉันทามติผู้เชี่ยวชาญสอดคล้องกัน (kappa ถ่วงน้ำหนัก ≥ ' + P.kappaMin + ' ทั้งความเสี่ยงและความพร้อม)', status: NA, detail: '' } : { id: 'C2', text: 'ระบบกับฉันทามติผู้เชี่ยวชาญสอดคล้องกัน (kappa ถ่วงน้ำหนัก ≥ ' + P.kappaMin + ' ทั้งความเสี่ยงและความพร้อม)', status: e.consensus.kRisk >= P.kappaMin && e.consensus.kReady >= P.kappaMin ? OK : NO, detail: 'ความเสี่ยง κw = ' + f(e.consensus.kRisk) + ' · ความพร้อม κw = ' + f(e.consensus.kReady) + ' · ตรงช่อง R ' + f(e.consensus.cell * 100, 0) + '%' });
    rows.push(!e || !e.n || e.n < 2 ? { id: 'C3', text: 'ผู้เชี่ยวชาญเห็นตรงกันเอง (alpha ลำดับ ≥ ' + P.alphaMin + ')', status: NA, detail: '' } : { id: 'C3', text: 'ผู้เชี่ยวชาญเห็นตรงกันเอง (alpha ลำดับ ≥ ' + P.alphaMin + ')', status: e.alpha.risk >= P.alphaMin && e.alpha.ready >= P.alphaMin ? OK : NO, detail: 'ความเสี่ยง α = ' + f(e.alpha.risk) + ' · ความพร้อม α = ' + f(e.alpha.ready) });
    rows.push(!e || !e.fit || !e.fit.n ? { id: 'C4', text: 'ผู้เชี่ยวชาญเห็นว่าแนวทางที่ระบบเสนอเหมาะสม (มัธยฐาน ≥ ' + P.fitMedianMin + ' และให้ 4–5 ไม่ต่ำกว่า ' + Math.round(P.fitShareMin * 100) + '%)', status: NA, detail: '' } : { id: 'C4', text: 'ผู้เชี่ยวชาญเห็นว่าแนวทางที่ระบบเสนอเหมาะสม (มัธยฐาน ≥ ' + P.fitMedianMin + ' และให้ 4–5 ไม่ต่ำกว่า ' + Math.round(P.fitShareMin * 100) + '%)', status: e.fit.median >= P.fitMedianMin && e.fit.share >= P.fitShareMin ? OK : NO, detail: 'มัธยฐาน ' + f(e.fit.median, 1) + ' · ให้ 4–5 ' + f(e.fit.share * 100, 0) + '% (' + e.fit.n + ' คำตอบ)' });
    rows.push(!a || !a.n ? { id: 'C5', text: 'ผู้บริหารประเมินทั้ง 4 ด้านระดับมากขึ้นไป (ค่าเฉลี่ย ≥ ' + P.aspectMin + ') และ SUS ≥ ' + P.susMin, status: NA, detail: '' } : { id: 'C5', text: 'ผู้บริหารประเมินทั้ง 4 ด้านระดับมากขึ้นไป (ค่าเฉลี่ย ≥ ' + P.aspectMin + ') และ SUS ≥ ' + P.susMin, status: a.aspects.every((x) => x.pass) && a.sus.pass ? OK : NO, detail: a.aspects.map((x) => x.id + ' ' + f(x.mean)).join(' · ') + ' · SUS ' + f(a.sus.mean, 1) + ' (ผู้บริหาร ' + a.n + ' คน)' });
    rows.push(!p || !p.n ? { id: 'C6', text: 'นำร่อง: ความพร้อมเพิ่มขึ้นอย่างมีนัยสำคัญ (วิลคอกซัน p < ' + P.alpha + ' อย่างน้อย ' + P.pilotMinSchools + ' โรงเรียน)', status: NA, detail: '' } : { id: 'C6', text: 'นำร่อง: ความพร้อมเพิ่มขึ้นอย่างมีนัยสำคัญ (วิลคอกซัน p < ' + P.alpha + ' อย่างน้อย ' + P.pilotMinSchools + ' โรงเรียน)', status: p.n < P.pilotMinSchools ? NA : (p.ready.w.ok && p.ready.w.p < P.alpha && p.ready.t.meanDiff > 0 ? OK : NO), detail: 'โรงเรียน ' + p.n + ' แห่ง · เปลี่ยน ' + f(p.ready.t.meanDiff, 2) + (p.ready.w.ok ? ' · p = ' + f(p.ready.w.p, 3) : '') + (p.n < P.pilotMinSchools ? ' · ข้อมูลน้อยกว่าเกณฑ์ ยังไม่ตัดสิน' : '') });
    rows.push(!l || !l.nReports ? { id: 'C7', text: 'วงจรเรียนรู้ทำงานได้: มีข้อมูลถึงเกณฑ์และออกข้อเสนอปรับคลังที่ผู้เชี่ยวชาญตรวจได้', status: NA, detail: '' } : { id: 'C7', text: 'วงจรเรียนรู้ทำงานได้: มีข้อมูลถึงเกณฑ์และออกข้อเสนอปรับคลังที่ผู้เชี่ยวชาญตรวจได้', status: l.sufficiency.measuresWithEnough > 0 ? OK : NO, detail: l.sufficiency.text + ' · ข้อเสนอ ' + l.proposals.length + ' ข้อ' });
    return rows;
  }

  const api = { SCHEMA_EXPERT, SCHEMA_ADMIN, VERSION, CASESET, CRIT, EXPERT_ITEMS, ADMIN_ASPECTS, SUS_ITEMS, band, makeCases, validExpert, validAdmin, analyzeExperts, analyzeAdmins, susScore, analyzePilot, scorecard };
  if (isNode) module.exports = api; else root.RS_EVAL = api;
})(typeof window !== 'undefined' ? window : this);
