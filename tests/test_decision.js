// ทดสอบชั้นกฎการเลือกกลยุทธ์ (decision.js) และร่องรอยการจับคู่ที่เพิ่มใน engine.js
// รัน: node tests/test_decision.js
const path = require('path');
const data = require(path.join(__dirname, '..', 'data.js'));
const E = require(path.join(__dirname, '..', 'engine.js'));
const Dc = require(path.join(__dirname, '..', 'decision.js'));
let checks = 0, fails = 0;
const ok = (name, cond, info) => { checks++; if (!cond) { fails++; console.log('FAIL', name, info === undefined ? '' : info); } };
const eq = (name, a, b) => ok(name, a === b, 'got ' + a + ' want ' + b);

const exIn = { risk: data.example.risk, seven: data.example.seven, resource: data.example.resource };
const base = E.analyze(exIn, data), guarded = E.analyze(exIn, data, null, { guard: Dc.guard });

// 1) ไม่ใส่ guard ผลต้องเหมือนเดิมทุกประการ และตัวอย่างหลักที่ผ่านกฎอยู่แล้วต้องไม่ถูกสลับ
base.domains.forEach((d, i) => {
  eq(d.code + ' no-guard ids == engineIds', d.measures.map((m) => m.id).join(','), d.engineIds.join(','));
  eq(d.code + ' example not swapped', guarded.domains[i].measures.map((m) => m.id).join(','), d.measures.map((m) => m.id).join(','));
  ok(d.code + ' eval covers every bank item', d.eval.length === data.bank.length);
});

// 2) กวาดโปรไฟล์ทดสอบ 600 แบบ (ครบ 9 ช่อง × 3 ระดับทรัพยากร): ผลต้องตอบกฎทุกข้อ ไม่ซ้ำ ไม่เกินเพดาน ไม่เกินทรัพยากร และสลับเฉพาะเมื่อจำเป็น
function rng(s) { return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
const r = rng(11); let swapped = 0, doms = 0;
for (let t = 0; t < 600; t++) {
  const riskT = ['สูง', 'กลาง', 'ต่ำ'][t % 3], readyT = ['ต่ำ', 'กลาง', 'สูง'][Math.floor(t / 3) % 3], res = ['จำกัด', 'ปานกลาง', 'เพียงพอ'][Math.floor(t / 9) % 3];
  const lo = { 'สูง': [3.2, 5], 'กลาง': [2, 3.2], 'ต่ำ': [1, 2] }[riskT], dd = { 'ต่ำ': [1.2, 2.4], 'กลาง': [2.8, 3.2], 'สูง': [3.8, 4.8] }[readyT];
  const input = { risk: {}, seven: {}, resource: res };
  data.riskItems.forEach((it) => { const v = lo[0] + r() * (lo[1] - lo[0]); input.risk[it.id] = [Math.max(1, Math.min(5, Math.round(v + (r() - 0.5)))), Math.max(1, Math.min(5, Math.round(v + (r() - 0.5))))]; });
  data.sevenItems.forEach((it) => { const d = Math.max(1, Math.min(5, Math.round(dd[0] + r() * (dd[1] - dd[0])))); input.seven[it.id] = [d, Math.min(5, d + Math.floor(r() * 3))]; });
  const o = E.analyze(input, data, null, { guard: Dc.guard }), resCode = { 'จำกัด': 1, 'ปานกลาง': 2, 'เพียงพอ': 3 }[res];
  o.domains.forEach((d) => {
    if (!d.group) return; doms++;
    const ids = d.measures.map((m) => m.id);
    ok('no dup', new Set(ids).size === ids.length); ok('cap', ids.length <= o.resourceMax, ids.length);
    ok('resource', d.measures.every((m) => m.res <= resCode));
    ok('fit gates', d.measures.every((m) => (m.dom === d.code || m.dom === 'X') && m.risk.indexOf(d.risk) >= 0 && m.ready.indexOf(d.ready) >= 0));
    const checksD = Dc.audit(d, data);
    ok('audit all pass ' + d.group, checksD.every((c) => c.ok) || d.unmet.length > 0, JSON.stringify(checksD.filter((c) => !c.ok).map((c) => c.pred)));
    if (d.swaps.length) { swapped++; ok('swap only when engine list failed', Dc.audit(Object.assign({}, d, { measures: data.bank.filter((b) => d.engineIds.indexOf(b.id) >= 0) }), data).some((c) => !c.ok)); }
    ok('eval selected == measures', d.eval.filter((e) => e.reason === 'selected').length === d.measures.length);
    ok('eval reasons valid', d.eval.every((e) => ['selected', 'swapped', 'dom', 'risk', 'ready', 'res', 'cap'].indexOf(e.reason) >= 0));
    d.swaps.forEach((s) => ok('swap has rule', !!s.rule && !!s.label));
  });
}
ok('guard actually used in sweep', swapped > 0, swapped);
console.log('  sweep: ' + doms + ' ด้าน-โปรไฟล์ สลับ ' + swapped + ' ด้าน (' + (100 * swapped / doms).toFixed(1) + '%) — โปรไฟล์ทดสอบสุ่ม ไม่ใช่ข้อมูลโรงเรียนจริง');

// 3) ระยะห่างจากเส้นแบ่ง คำนวณมือได้
const P = E.DEFAULT_PARAMS;
const bnd = Dc.boundary({ risk: 'กลาง', rd: 9, override: false }, { params: P, readyMean: 3.0, readyBefore: 'กลาง', readyFinal: 'กลาง', floorHit: false });
eq('risk up gap', bnd.risk.up.gap, 3); eq('risk down gap', bnd.risk.down.gap, 3); eq('ready up gap (3.40-3.0)', Math.round(bnd.ready.up.gap * 100) / 100, 0.4); eq('not near', bnd.near, false);
const near = Dc.boundary({ risk: 'กลาง', rd: 11.8, override: false }, { params: P, readyMean: 3.0, readyBefore: 'กลาง', readyFinal: 'กลาง', floorHit: false });
eq('near flag risk', near.near, true);
const ovr = Dc.boundary({ risk: 'สูง', rd: 8, override: true }, { params: P, readyMean: 3.0, readyBefore: 'กลาง', readyFinal: 'กลาง', floorHit: false });
eq('override noted', ovr.risk.override, true); eq('override has no index margin', ovr.risk.margin, null);
const fl = Dc.boundary({ risk: 'กลาง', rd: 9, override: false }, { params: P, readyMean: 3.7, readyBefore: 'สูง', readyFinal: 'กลาง', floorHit: true });
ok('floor note', !!fl.ready.floorNote);

// 4) ทำไมไม่เลือกช่องอื่น: ครบ 8 ช่อง เรียงตามระยะ และข้อความอ้างตัวเลขจริง
const d0 = guarded.domains[0], con = Dc.contrast(d0, guarded, data);
eq('contrast 8 cells', con.length, 8); ok('sorted by distance', con.every((c, i) => i === 0 || con[i - 1].distance <= c.distance));
// ตัวเลขในเหตุผลต้องตรงมือคำนวณ: ด้าน V ของตัวอย่าง D เฉลี่ย 2.50 ช่อง R1 (ความพร้อมต่ำ) -> R3 ต้องถึงระดับสูง (> 3.4) ขาดอีก 0.90, R2 ต้องถึงกลาง (> 2.6) ขาดอีก 0.10
const cR3 = con.find((q) => q.code === 'R3'), cR2 = con.find((q) => q.code === 'R2');
ok('R3 reason uses readyMid', /3\.4/.test(cR3.reasons.join()) && /0\.90/.test(cR3.reasons.join()), cR3.reasons.join());
ok('R2 reason uses readyLow', /2\.6/.test(cR2.reasons.join()) && /0\.10/.test(cR2.reasons.join()), cR2.reasons.join());
ok('every contrast has reason', con.every((c) => c.reasons.length >= 1 && c.notFit)); ok('adjacent first has 1 axis', con[0].distance === 1);

// 5) ตารางกฎ: ครบ 9 ช่อง ทุกช่องมีเงื่อนไขอย่างน้อย 2 ข้อ และคลังตอบได้ทุกเงื่อนไขที่ทรัพยากรระดับ 1
Object.keys(Dc.CELLS).forEach((k) => { ok(k + ' reqs', Dc.requirements(k).length >= 2); ok(k + ' stance text', Dc.CELLS[k].intent.length > 20 && Dc.CELLS[k].avoid.length >= 1 && Dc.CELLS[k].watch.length >= 1); });
eq('9 cells', Object.keys(Dc.CELLS).length, 9);
const cov = Dc.coverage(data);
ok('coverage has no empty requirement at resource 1', cov.filter((c) => c.res === 1 && c.n === 0).length === 0, JSON.stringify(cov.filter((c) => c.res === 1 && c.n === 0).slice(0, 3)));
console.log('  คลังบางที่สุดที่ทรัพยากรระดับ 1: ' + cov.filter((c) => c.res === 1).sort((a, b) => a.n - b.n).slice(0, 3).map((c) => c.cell + '/' + c.dom + '/' + c.pred + '=' + c.n).join(', '));

// 6) ลำดับลงมือไม่เปลี่ยนรายการ
const seq = Dc.sequence(d0); eq('sequence same size', seq.length, d0.measures.length); eq('sequence same ids', seq.map((s) => s.id).sort().join(), d0.measures.map((m) => m.id).sort().join());
// 7) ข้อมูลว่างต้องไม่ล้ม
const empty = E.analyze({ risk: {}, seven: {}, resource: 'จำกัด' }, data, null, { guard: Dc.guard }); ok('empty ok', empty.domains.every((d) => d.group === null && d.measures.length === 0));
// 8) ตารางเงื่อนไขของแต่ละช่องต้องตรงกับข้อกำหนดที่เขียนแยกไว้ตรงนี้ (กันการแก้ตารางผิดโดยตัวตรวจกฎผ่านเอง)
const SPEC = { R1: ['CONTROL>=1', 'FOUNDATION>=1'], R2: ['CONTROL>=1', 'CAPABILITY>=1'], R3: ['CONTROL>=1', 'SUSTAIN>=1', 'PROACTIVE>=1'],
  R4: ['PROACTIVE>=1', 'FOUNDATION>=1', 'CAPABILITY>=1'], R5: ['PROACTIVE>=1', 'CAPABILITY>=1'], R6: ['PROACTIVE>=1', 'SUSTAIN>=1'],
  R7: ['REPRESS<=1', 'FOUNDATION>=1'], R8: ['REPRESS<=1', 'CAPABILITY>=1'], R9: ['REPRESS<=1', 'SUSTAIN>=1'] };
Object.keys(SPEC).forEach((k) => {
  const got = Dc.requirements(k).map((r) => r.pred + (r.min != null ? '>=' + r.min : '<=' + r.max)).sort().join();
  eq(k + ' requirement table matches the written specification', got, SPEC[k].slice().sort().join());
});
// 9) การสลับของตัวบังคับกฎต้องเลือกมาตรการอันดับท้ายสุดที่ถอดได้โดยไม่ทำให้เงื่อนไขที่ผ่านอยู่แล้วเสียไป (คำนวณซ้ำด้วยวิธีตรง ๆ)
let swapChecked = 0, swapBad = 0;
for (let t = 0; t < 300; t++) {
  const riskT = ['สูง', 'กลาง', 'ต่ำ'][t % 3], readyT = ['ต่ำ', 'กลาง', 'สูง'][Math.floor(t / 3) % 3];
  const lo = { 'สูง': [3.2, 5], 'กลาง': [2, 3.2], 'ต่ำ': [1, 2] }[riskT], dd = { 'ต่ำ': [1.2, 2.4], 'กลาง': [2.8, 3.2], 'สูง': [3.8, 4.8] }[readyT];
  const input = { risk: {}, seven: {}, resource: 'จำกัด' };
  data.riskItems.forEach((it) => { const v = lo[0] + r() * (lo[1] - lo[0]); input.risk[it.id] = [Math.max(1, Math.min(5, Math.round(v))), Math.max(1, Math.min(5, Math.round(v + (r() - 0.5))))]; });
  data.sevenItems.forEach((it) => { const d = Math.max(1, Math.min(5, Math.round(dd[0] + r() * (dd[1] - dd[0])))); input.seven[it.id] = [d, Math.min(5, d + 1)]; });
  const o = E.analyze(input, data, null, { guard: Dc.guard });
  o.domains.forEach((d) => {
    if (!d.group || !d.swaps.length) return;
    const s = d.swaps[0]; if (!s.out) return;
    const byId = {}; data.bank.forEach((b) => { byId[b.id] = b; });
    const cur = d.engineIds.map((id) => byId[id]), add = byId[s.in], reqs = Dc.requirements(d.group);
    const sat = (list, q) => { const c = list.filter((b) => Dc.PRED[q.pred].test(b)).length; return (q.min == null || c >= q.min) && (q.max == null || c <= q.max); };
    const q = reqs.find((x) => x.src === s.rule && x.pred === s.pred), before = reqs.map((x) => sat(cur, x));
    const removable = cur.filter((v) => { const after = cur.filter((x) => x !== v).concat([add]); return reqs.every((x, k) => !before[k] || sat(after, x)) && sat(after, q); });
    swapChecked++; if (!removable.length || removable[removable.length - 1].id !== s.out) swapBad++;
  });
}
ok('guard swaps (' + swapChecked + ') always remove the lowest-ranked removable measure', swapChecked > 20 && swapBad === 0, 'checked ' + swapChecked + ' bad ' + swapBad);
// 10) ตัวอธิบายเหตุผล (whyNot / explainDomain) ต้องสอดคล้องกับผลคัดเลือกจริงในทุกด้าน
let expl = 0;
const scenarios = [guarded].concat(Array.from({ length: 40 }, (_, t) => {
  const lo = [[1, 2], [2, 3.2], [3.2, 5]][t % 3], dd = [[1.2, 2.4], [2.8, 3.2], [3.8, 4.8]][Math.floor(t / 3) % 3];
  const input = { risk: {}, seven: {}, resource: ['จำกัด', 'ปานกลาง', 'เพียงพอ'][t % 3] };
  data.riskItems.forEach((it) => { const v = lo[0] + r() * (lo[1] - lo[0]); input.risk[it.id] = [Math.max(1, Math.min(5, Math.round(v))), Math.max(1, Math.min(5, Math.round(v + (r() - 0.5))))]; });
  data.sevenItems.forEach((it) => { const d = Math.max(1, Math.min(5, Math.round(dd[0] + r() * (dd[1] - dd[0])))); input.seven[it.id] = [d, Math.min(5, d + 1)]; });
  return E.analyze(input, data, null, { guard: Dc.guard });
}));
scenarios.forEach((o) => o.domains.forEach((d) => {
  if (!d.group) return; expl++;
  const x = Dc.explainDomain(d, o, data), w = x.why, c = w.counts;
  eq('counts sum to bank size', c.selected + c.swapped + c.dom + c.risk + c.ready + c.res + c.cap, data.bank.length);
  Object.keys(c).forEach((k) => eq('count[' + k + '] equals tally of rows with that reason', c[k], w.rows.filter((m) => m.reason === k).length));
  eq('selected count equals plan size', c.selected, d.measures.length); eq('selected rows equal plan size', w.selected.length, d.measures.length);
  ok('selected rows pass all four gates', w.selected.every((m) => m.gates.dom && m.gates.risk && m.gates.ready && m.gates.res));
  ok('selected rows keep plan order', w.selected.every((m, k) => m.id === d.measures[k].id));
  ok('every row has a reason text', w.rows.every((m) => m.reasonText && m.reasonText.length > 2));
  ok('counterfactual present for every non-selected fit/gate failure', w.rows.filter((m) => ['risk', 'ready', 'res', 'cap', 'swapped'].indexOf(m.reason) >= 0).every((m) => m.counterfactual && m.counterfactual.length > 5));
  const caps = w.rows.filter((m) => m.reason === 'cap').sort((a, b) => a.poolRank - b.poolRank);
  eq('near-miss list is the best-ranked capped measures', w.nearMiss.map((m) => m.id).join(), caps.slice(0, 3).map((m) => m.id).join());
  ok('capped measures rank below the cut', caps.every((m) => m.poolRank > Math.min.apply(null, w.selected.map((s) => s.poolRank || 0).filter(Boolean)) - 1));
  eq('explain checks == requirements', x.checks.length, Dc.requirements(d.group).length); eq('explain contrast 8 cells', x.contrast.length, 8); eq('explain sequence size', x.sequence.length, d.measures.length);
  w.selected.forEach((m, k) => { const nx = w.selected[k + 1]; if (nx && m.top && !nx.top) ok('tie-break cites 7-S gap when only the first is in top-3', /7-S/.test(m.tie), m.tie); });
}));
ok('explainer exercised on many domains', expl > 100, expl);
console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
