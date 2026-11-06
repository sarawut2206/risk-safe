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
console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
