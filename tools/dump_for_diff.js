// สร้างโปรไฟล์ทดสอบและผลจาก engine.js เพื่อให้ tools/diff_test.py (เขียนแยกใหม่ด้วย Python) คำนวณซ้ำและเทียบกัน
// รัน: node tools/dump_for_diff.js [จำนวนโปรไฟล์]  -> analysis/diff_dump.json
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const data = require(path.join(root, 'data.js')), E = require(path.join(root, 'engine.js'));
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(271828), pick = (a) => a[Math.floor(rnd() * a.length)], clamp = (x) => Math.max(1, Math.min(5, x));
const N = +process.argv[2] || 3000, cases = [];
for (let t = 0; t < N; t++) {
  const mode = t % 5, input = { risk: {}, seven: {}, resource: pick(['จำกัด', 'ปานกลาง', 'เพียงพอ']) };
  const dBase = rnd() * 4 + 1;
  data.domains.forEach((d) => { const b = rnd() * 4 + 1; data.riskItems.filter((r) => r.dom === d.code).forEach((it) => { input.risk[it.id] = mode === 3 ? [pick([1, 5]), pick([1, 5])] : [clamp(Math.round(b + (rnd() - 0.5) * 3)), clamp(Math.round(b + (rnd() - 0.5) * 3))]; }); });
  data.sevenItems.forEach((it) => { const v = mode === 3 ? pick([1, 5]) : clamp(Math.round(dBase + (rnd() - 0.5) * 3)); input.seven[it.id] = [v, clamp(v + Math.floor(rnd() * 3) - (mode === 4 ? 1 : 0))]; });
  if (mode === 2) { // ข้อมูลไม่ครบ
    Object.keys(input.risk).forEach((k) => { if (rnd() < 0.3) delete input.risk[k]; });
    Object.keys(input.seven).forEach((k) => { if (rnd() < 0.3) delete input.seven[k]; });
  }
  const o = E.analyze(input, data);
  cases.push({ input, out: {
    readyMean: o.readyMean, readyBefore: o.readyBefore, readyFinal: o.readyFinal, floorHit: o.floorHit,
    elements: o.elements.map((e) => ({ code: e.code, d: e.d, i: e.i, pni: e.pni, rank: e.rank })),
    domains: o.domains.map((d) => ({ code: d.code, n: d.n, rd: d.rd, cmax: d.cmax, override: d.override, risk: d.risk, group: d.group, selected: d.measures.map((m) => m.id), stretch: (d.stretch || []).map((m) => m.id) })),
  } });
}
const bank = data.bank.map((b) => ({ id: b.id, dom: b.dom, risk: b.risk, ready: b.ready, res: b.res, elem: b.elem, qpri: b.qpri == null ? null : b.qpri, evg: b.evg || null }));
fs.mkdirSync(path.join(root, 'analysis'), { recursive: true });
fs.writeFileSync(path.join(root, 'analysis', 'diff_dump.json'), JSON.stringify({ meta: { n: N, params: E.DEFAULT_PARAMS }, domains: data.domains.map((d) => d.code), elements: data.elements.map((e) => e.code), riskItems: data.riskItems.map((r) => ({ id: r.id, dom: r.dom })), sevenItems: data.sevenItems.map((s) => ({ id: s.id, elem: s.elem })), bank, cases }));
console.log('dumped', N, 'profiles');
