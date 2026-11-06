/* R²-SAFE ต้นแบบ: เครื่องคำนวณกลไกตัดสินใจ (ย้ายตรรกะจากเครื่องมือ Excel ต้นแบบ)
   ทุกเกณฑ์เป็นค่าเริ่มต้นตามร่างบทที่ 3 ยังไม่ผ่านเดลฟาย ประมวลผลในเบราว์เซอร์เท่านั้น ไม่ส่งข้อมูลออก */
(function (root) {
  'use strict';

  const DEFAULT_PARAMS = {
    riskLow: 6.0,      // ดัชนีความเสี่ยง ≤ ค่านี้ = ต่ำ
    riskMid: 12.0,     // ≤ ค่านี้ = กลาง มากกว่านั้น = สูง
    overrideC: 5,      // กฎยกระดับ: ผลกระทบรุนแรงสูงสุด
    overrideL: 2,      // กฎยกระดับ: ความถี่ขั้นต่ำ
    readyLow: 2.60,    // ค่าเฉลี่ย D ≤ ค่านี้ = ต่ำ
    readyMid: 3.40,    // ≤ ค่านี้ = กลาง มากกว่านั้น = สูง
    floorD: 2.61,      // กฎเพดาน: D ของโครงสร้างและระบบต้องไม่ต่ำกว่าค่านี้ จึงจะได้ระดับสูง
  };
  const RESOURCE = { 'จำกัด': { code: 1, max: 4 }, 'ปานกลาง': { code: 2, max: 6 }, 'เพียงพอ': { code: 3, max: 8 } };
  const RISK_ORDER = ['สูง', 'กลาง', 'ต่ำ'];
  const READY_ORDER = ['ต่ำ', 'กลาง', 'สูง'];

  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);

  // ตัวจัดระดับ (ใช้ซ้ำในชั้นกฎตัดสินใจและชุดกรณีผู้เชี่ยวชาญ ให้ตรรกะเดียวกับ analyze ทุกครั้ง)
  function classifyRisk(rd, override, P) {
    P = Object.assign({}, DEFAULT_PARAMS, P || {});
    return !isFinite(rd) ? null : override ? 'สูง' : rd <= P.riskLow ? 'ต่ำ' : rd <= P.riskMid ? 'กลาง' : 'สูง';
  }
  function classifyReady(meanD, strD, sysD, P) {
    P = Object.assign({}, DEFAULT_PARAMS, P || {});
    const before = !isFinite(meanD) ? null : meanD <= P.readyLow ? 'ต่ำ' : meanD <= P.readyMid ? 'กลาง' : 'สูง';
    const floorHit = before === 'สูง' && (strD < P.floorD || sysD < P.floorD);
    return { before, final: floorHit ? 'กลาง' : before, floorHit };
  }
  function cellOf(risk, ready) {
    return risk && ready ? 'R' + (RISK_ORDER.indexOf(risk) * 3 + READY_ORDER.indexOf(ready) + 1) : null;
  }

  function analyze(input, data, paramsIn, opts) {
    const guard = opts && typeof opts.guard === 'function' ? opts.guard : null; // ชั้นกฎกลยุทธ์ (ไม่ใส่ = ผลตรงกับ Excel)
    const P = Object.assign({}, DEFAULT_PARAMS, paramsIn || {});
    const res = RESOURCE[input.resource] || RESOURCE['ปานกลาง'];

    // ---- ขั้นที่ 2–3: ความพร้อม 7-S และ PNI Modified ----
    const elements = data.elements.map((el, idx) => {
      const items = data.sevenItems.filter((s) => s.elem === el.code);
      const D = items.map((s) => (input.seven[s.id] || [])[0]).filter(isNum);
      const I = items.map((s) => (input.seven[s.id] || [])[1]).filter(isNum);
      const d = mean(D), i = mean(I), gap = i - d, pni = (i - d) / d;
      const score = isFinite(pni) ? pni + gap / 1000 - (14 + idx) / 1e7 : NaN; // ตรงกับสูตรจัดอันดับใน Excel
      return { code: el.code, name: el.name, d, i, gap, pni, score, rank: null };
    });
    elements
      .filter((e) => isFinite(e.score))
      .sort((a, b) => b.score - a.score)
      .forEach((e, k) => { e.rank = k + 1; });
    const dMeans = elements.map((e) => e.d).filter(isFinite);
    const readyMean = mean(dMeans);
    const byCode = Object.fromEntries(elements.map((e) => [e.code, e]));
    const rc = classifyReady(readyMean, byCode.STR.d, byCode.SYS.d, P);
    const readyBefore = rc.before, floorHit = rc.floorHit, readyFinal = rc.final;
    const top3 = elements.filter((e) => e.rank && e.rank <= 3).sort((a, b) => a.rank - b.rank);

    // ---- ขั้นที่ 1: ความเสี่ยงรายด้าน และขั้นที่ 4: กลุ่ม R ----
    const domains = data.domains.map((dom) => {
      const items = data.riskItems.filter((r) => r.dom === dom.code);
      const pairs = items.map((r) => input.risk[r.id] || []).filter((p) => isNum(p[0]) && isNum(p[1]));
      const cAll = items.map((r) => (input.risk[r.id] || [])[1]).filter(isNum);
      const rd = pairs.length ? pairs.reduce((s, p) => s + p[0] * p[1], 0) / pairs.length : NaN;
      const cmax = cAll.length ? Math.max.apply(null, cAll) : NaN;
      const override = pairs.some((p) => p[1] === P.overrideC && p[0] >= P.overrideL);
      const risk = classifyRisk(rd, override, P);
      const group = cellOf(risk, readyFinal);
      const pkg = group ? data.packages.find((p) => p.code === group) : null;
      return { code: dom.code, name: dom.name, n: pairs.length, rd, cmax, override, risk, ready: readyFinal, group, pkg, measures: [] };
    });

    // ---- ขั้นที่ 4: เลือกมาตรการจากคลัง (กฎ 8 ข้อ ข้อ 4–8) ----
    const topCodes = top3.map((e) => e.code);
    domains.forEach((dom) => {
      if (!dom.risk || !readyFinal) return;
      // ลำดับคะแนนคัดเลือก (มากไปน้อย): (1) องค์ประกอบ 7-S อยู่ใน 3 อันดับช่องว่างสูงสุดก่อน
      // (2) ลำดับ QSPM (qpri, 1 = ดีที่สุดในประเด็นเดียวกัน; ว่างถือเป็น 1)
      // (3) ระดับหลักฐาน A→D (evg; ไม่มีค่าถือว่าเท่ากันหมด) (4) ลำดับในคลัง ใช้ตัดสินเมื่อทุกข้อข้างต้นเท่ากัน
      const GRADE = { A: 0, B: 1, C: 2, D: 3 };
      const keyOf = (b, idx) => (topCodes.indexOf(b.elem) >= 0 ? 200000 : 100000) -
        (Math.max(1, Math.min(20, Math.floor(Number(b.qpri)) || 1)) - 1) * 1000 - (GRADE[b.evg] || 0) * 100 - idx;
      const fits = (b) => (b.dom === dom.code || b.dom === 'X') && b.risk.indexOf(dom.risk) >= 0 && b.ready.indexOf(readyFinal) >= 0;
      const ranked = data.bank.map((b, idx) => ({ b, score: keyOf(b, idx) })).filter(({ b }) => fits(b)).sort((x, y) => y.score - x.score);
      let cand = ranked.filter(({ b }) => b.res <= res.code).slice(0, res.max);
      dom.engineIds = cand.map(({ b }) => b.id); dom.swaps = []; dom.unmet = [];
      if (guard) { const g = guard({ dom, cand, ranked, resCode: res.code, cap: res.max, data }); if (g && g.cand) { cand = g.cand; dom.swaps = g.swaps || []; dom.unmet = g.unmet || []; } }
      // ร่องรอยการจับคู่: ทุกมาตรการในคลังผ่านด่านใดและตกที่ด่านใด (ใช้อธิบายว่าทำไมเลือกและทำไมไม่เลือก)
      const fitPos = {}; ranked.forEach(({ b }, k) => { fitPos[b.id] = k + 1; });
      const poolPos = {}; ranked.filter(({ b }) => b.res <= res.code).forEach(({ b }, k) => { poolPos[b.id] = k + 1; });
      const chosen = {}; cand.forEach(({ b }) => { chosen[b.id] = true; });
      dom.eval = data.bank.map((b, idx) => {
        const gates = { dom: b.dom === dom.code || b.dom === 'X', risk: b.risk.indexOf(dom.risk) >= 0, ready: b.ready.indexOf(readyFinal) >= 0, res: b.res <= res.code };
        const swapped = dom.swaps.some((s) => s.out === b.id);
        const reason = chosen[b.id] ? 'selected' : swapped ? 'swapped' : !gates.dom ? 'dom' : !gates.risk ? 'risk' : !gates.ready ? 'ready' : !gates.res ? 'res' : 'cap';
        return { id: b.id, sb: b.sb || '', gates, reason, fitRank: fitPos[b.id] || null, poolRank: poolPos[b.id] || null, score: keyOf(b, idx), top: topCodes.indexOf(b.elem) >= 0 };
      });
      dom.pool = { cap: res.max, nFit: ranked.length, nPool: Object.keys(poolPos).length, nSelected: cand.length, cutScore: cand.length ? cand[cand.length - 1].score : null };
      // มาตรการที่เหมาะแต่ใช้ทรัพยากรเกินที่มี ไม่ตัดทิ้งเงียบ ๆ แต่แยกแสดง (ข้อ B5: เสนอขอสนับสนุนจากต้นสังกัด/เครือข่าย)
      dom.stretch = ranked.filter(({ b }) => b.res > res.code).slice(0, 2).map(({ b }) => Object.assign({
        why: 'เหมาะกับความเสี่ยงระดับ' + dom.risk + ' และความพร้อมระดับ' + readyFinal + ' แต่ต้องใช้ทรัพยากรระดับ ' + b.res + ' เกินที่มี (' + input.resource + ') จึงไม่รวมในรายการหลัก ควรพิจารณาขอสนับสนุนจากต้นสังกัดหรือเครือข่าย',
      }, b));
      const selSb = {};
      cand.forEach(({ b }) => { if (b.sb) selSb[b.sb] = true; });
      const bySb = {};
      data.bank.forEach((b) => { if (b.sb) bySb[b.sb] = b; });
      dom.measures = cand.map((c, k) => {
        const el = byCode[c.b.elem];
        const top = topCodes.indexOf(c.b.elem) >= 0;
        const why =
          'ตรงกับองค์ประกอบ ' + el.name +
          (top ? ' ซึ่งมีช่องว่างอันดับ ' + el.rank + ' (PNI ' + el.pni.toFixed(3) + ')' : ' (ไม่อยู่ใน 3 อันดับช่องว่างสูงสุด)') +
          '; เหมาะกับความเสี่ยงระดับ' + dom.risk + ' และความพร้อมระดับ' + readyFinal +
          '; ใช้ทรัพยากรระดับ ' + c.b.res + ' ไม่เกินที่มี (' + input.resource + ')';
        // เงื่อนไขก่อนดำเนินการ: แจ้งว่ามาตรการที่ต้องมีก่อนอยู่ในรายการด้วยหรือไม่ (ไม่ได้สลับลำดับอัตโนมัติ ผู้อำนวยการตรวจสอบเอง)
        const pre = (String(c.b.prereq || '').match(/SB-\d{3}/g) || []).map((sb) => ({ sb, name: bySb[sb] ? bySb[sb].name : '', selected: !!selSb[sb] }));
        const rankWhy = (c.b.qpri ? '; ลำดับ QSPM ในประเด็น = ' + c.b.qpri : '') + (c.b.evg ? '; ระดับหลักฐาน ' + c.b.evg : '');
        const sw = dom.swaps.find((s) => s.in === c.b.id);
        const ruleWhy = sw ? '; เพิ่มตามกฎ ' + sw.rule + ' (' + sw.label + ')' + (sw.out ? ' แทน ' + (bySb[sw.outSb] ? sw.outSb : sw.out) : '') : '';
        return Object.assign({ order: k + 1, why: why + rankWhy + ruleWhy, top, prereqInfo: pre, viaRule: sw ? sw.rule : '' }, c.b);
      });
    });

    return {
      params: P, resource: input.resource, resourceMax: res.max,
      elements, readyMean, readyBefore, readyFinal, floorHit, top3, domains,
    };
  }

  const api = { analyze, classifyRisk, classifyReady, cellOf, DEFAULT_PARAMS, RESOURCE, RISK_ORDER, READY_ORDER };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RS_ENGINE = api;
})(typeof window !== 'undefined' ? window : this);
