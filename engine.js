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

  function analyze(input, data, paramsIn) {
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
    const readyBefore = !isFinite(readyMean) ? null : readyMean <= P.readyLow ? 'ต่ำ' : readyMean <= P.readyMid ? 'กลาง' : 'สูง';
    const byCode = Object.fromEntries(elements.map((e) => [e.code, e]));
    const floorHit = readyBefore === 'สูง' && (byCode.STR.d < P.floorD || byCode.SYS.d < P.floorD);
    const readyFinal = floorHit ? 'กลาง' : readyBefore;
    const top3 = elements.filter((e) => e.rank && e.rank <= 3).sort((a, b) => a.rank - b.rank);

    // ---- ขั้นที่ 1: ความเสี่ยงรายด้าน และขั้นที่ 4: กลุ่ม R ----
    const domains = data.domains.map((dom) => {
      const items = data.riskItems.filter((r) => r.dom === dom.code);
      const pairs = items.map((r) => input.risk[r.id] || []).filter((p) => isNum(p[0]) && isNum(p[1]));
      const cAll = items.map((r) => (input.risk[r.id] || [])[1]).filter(isNum);
      const rd = pairs.length ? pairs.reduce((s, p) => s + p[0] * p[1], 0) / pairs.length : NaN;
      const cmax = cAll.length ? Math.max.apply(null, cAll) : NaN;
      const override = pairs.some((p) => p[1] === P.overrideC && p[0] >= P.overrideL);
      const risk = !isFinite(rd) ? null : override ? 'สูง' : rd <= P.riskLow ? 'ต่ำ' : rd <= P.riskMid ? 'กลาง' : 'สูง';
      const group = risk && readyFinal ? 'R' + (RISK_ORDER.indexOf(risk) * 3 + READY_ORDER.indexOf(readyFinal) + 1) : null;
      const pkg = group ? data.packages.find((p) => p.code === group) : null;
      return { code: dom.code, name: dom.name, n: pairs.length, rd, cmax, override, risk, ready: readyFinal, group, pkg, measures: [] };
    });

    // ---- ขั้นที่ 4: เลือกมาตรการจากคลัง (กฎ 8 ข้อ ข้อ 4–8) ----
    const topCodes = top3.map((e) => e.code);
    domains.forEach((dom) => {
      if (!dom.risk || !readyFinal) return;
      const cand = data.bank
        .map((b, idx) => ({ b, idx }))
        .filter(({ b }) =>
          (b.dom === dom.code || b.dom === 'X') &&
          b.risk.indexOf(dom.risk) >= 0 &&
          b.ready.indexOf(readyFinal) >= 0 &&
          b.res <= res.code)
        .map(({ b, idx }) => ({ b, score: (topCodes.indexOf(b.elem) >= 0 ? 20000 : 10000) - idx }))
        .sort((x, y) => y.score - x.score)
        .slice(0, res.max);
      dom.measures = cand.map((c, k) => {
        const el = byCode[c.b.elem];
        const top = topCodes.indexOf(c.b.elem) >= 0;
        const why =
          'ตรงกับองค์ประกอบ ' + el.name +
          (top ? ' ซึ่งมีช่องว่างอันดับ ' + el.rank + ' (PNI ' + el.pni.toFixed(3) + ')' : ' (ไม่อยู่ใน 3 อันดับช่องว่างสูงสุด)') +
          '; เหมาะกับความเสี่ยงระดับ' + dom.risk + ' และความพร้อมระดับ' + readyFinal +
          '; ใช้ทรัพยากรระดับ ' + c.b.res + ' ไม่เกินที่มี (' + input.resource + ')';
        return Object.assign({ order: k + 1, why, top }, c.b);
      });
    });

    return {
      params: P, resource: input.resource, resourceMax: res.max,
      elements, readyMean, readyBefore, readyFinal, floorHit, top3, domains,
    };
  }

  const api = { analyze, DEFAULT_PARAMS, RESOURCE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RS_ENGINE = api;
})(typeof window !== 'undefined' ? window : this);
