// ทดสอบกลไกตัดสินใจเชิงขอบเขตและคุณสมบัติ: ค่าตัดทุกจุด กฎยกระดับ กฎเพดาน ความเป็นเอกภาพ ความไม่ขึ้นกับลำดับข้อ ข้อมูลไม่ครบ
// ใช้ข้อมูลที่สร้างขึ้นเพื่อทดสอบตรรกะเท่านั้น ไม่ใช่ข้อมูลโรงเรียน  รัน: node tests/test_boundary.js
const path = require('path');
const data = require(path.join(__dirname, '..', 'data.js'));
const E = require(path.join(__dirname, '..', 'engine.js'));
const Dc = require(path.join(__dirname, '..', 'decision.js'));
let checks = 0, fails = 0;
const ok = (name, cond, info) => { checks++; if (!cond) { fails++; console.log('FAIL', name, info === undefined ? '' : info); } };
const eq = (name, a, b) => ok(name, a === b, 'got ' + JSON.stringify(a) + ' want ' + JSON.stringify(b));
const GUARD = { guard: Dc.guard };
const run = (input, withGuard) => E.analyze(input, data, null, withGuard ? GUARD : null);

// ---------- ตัวสร้างข้อมูลทดสอบ ----------
// risk: { V: [[L,C], ...] หรือ [L,C] ใช้ทุกข้อ, ... } ; seven: { STG: [d1..], ... } หรือ ตัวเลขเดียวใช้ทุกข้อ
function build(riskSpec, sevenSpec, resource) {
  const input = { risk: {}, seven: {}, resource: resource || 'ปานกลาง' };
  data.domains.forEach((d) => {
    const items = data.riskItems.filter((r) => r.dom === d.code), spec = riskSpec[d.code] || [1, 1];
    items.forEach((it, k) => { input.risk[it.id] = Array.isArray(spec[0]) ? spec[k % spec.length].slice() : spec.slice(); });
  });
  data.elements.forEach((e) => {
    const items = data.sevenItems.filter((s) => s.elem === e.code), spec = sevenSpec[e.code];
    items.forEach((it, k) => { const d = Array.isArray(spec) ? spec[k % spec.length] : spec; input.seven[it.id] = [d, Math.min(5, d + 1)]; });
  });
  return input;
}
const uniformSeven = (v) => Object.fromEntries(data.elements.map((e) => [e.code, v]));
const n = (code) => data.riskItems.filter((r) => r.dom === code).length;

// ---------- 1) ค่าตัดความเสี่ยง 6.0 / 12.0 (ทุกข้อให้ผลคูณเท่ากันเป๊ะ) ----------
const r1 = run(build({ V: [2, 3], A: [2, 4], P: [3, 4], H: [4, 4] }, uniformSeven(3)));
const lvl = (o, c) => o.domains.find((d) => d.code === c).risk;
eq('rd = 6.0 exactly -> ต่ำ', lvl(r1, 'V'), 'ต่ำ'); eq('rd = 8 -> กลาง', lvl(r1, 'A'), 'กลาง'); eq('rd = 12.0 exactly -> กลาง', lvl(r1, 'P'), 'กลาง'); eq('rd = 16 -> สูง', lvl(r1, 'H'), 'สูง');
// เกินค่าตัดเพียงเล็กน้อย: ข้อหนึ่งเพิ่มผลคูณ แต่ไม่ถึงกฎยกระดับ (C ไม่ใช่ 5)
const mixLow = Array.from({ length: n('V') }, (_, k) => (k === 0 ? [2, 4] : [2, 3]));        // เฉลี่ย 6.25 > 6
const mixHigh = Array.from({ length: n('A') }, (_, k) => (k === 0 ? [4, 4] : [3, 4]));       // เฉลี่ยเกิน 12 เล็กน้อย
const r2 = run(build({ V: mixLow, A: mixHigh, P: [2, 3], H: [2, 3] }, uniformSeven(3)));
eq('rd just above 6 -> กลาง', lvl(r2, 'V'), 'กลาง'); eq('rd just above 12 -> สูง', lvl(r2, 'A'), 'สูง');
ok('rd values exact', Math.abs(r2.domains[0].rd - 6.25) < 1e-12 && Math.abs(r2.domains[1].rd - (12 * 7 + 16) / 8) < 1e-12, r2.domains[0].rd + ' ' + r2.domains[1].rd);

// ---------- 2) กฎยกระดับ: C = 5 และ L ≥ 2 ----------
const lowBase = (extra) => { const v = Array.from({ length: n('V') }, () => [1, 1]); v[0] = extra; return build({ V: v, A: [1, 1], P: [1, 1], H: [1, 1] }, uniformSeven(3)); };
const o51 = run(lowBase([1, 5])), o52 = run(lowBase([2, 5])), o45 = run(lowBase([5, 4])), o55 = run(lowBase([5, 5]));
eq('C=5 L=1 no override', lvl(o51, 'V'), 'ต่ำ'); eq('C=5 L=2 override', lvl(o52, 'V'), 'สูง'); eq('C=4 L=5 no override', lvl(o45, 'V'), 'ต่ำ'); eq('C=5 L=5 override', lvl(o55, 'V'), 'สูง');
eq('override flag set', o52.domains[0].override, true); eq('override isolated to its own domain', lvl(o52, 'A'), 'ต่ำ');
ok('override index still low', o52.domains[0].rd < 6, o52.domains[0].rd);
eq('override cell uses สูง row', o52.domains[0].group, 'R' + (E.RISK_ORDER.indexOf('สูง') * 3 + E.READY_ORDER.indexOf(o52.readyFinal) + 1));
// ค่ายกระดับปรับได้: เปลี่ยนเกณฑ์เป็น L ≥ 3 แล้ว L=2 ต้องไม่ยกระดับ
const oAlt = E.analyze(lowBase([2, 5]), data, { overrideL: 3 });
eq('override threshold is a parameter', oAlt.domains[0].risk, 'ต่ำ');

// ---------- 3) ค่าตัดความพร้อม 2.60 / 3.40 และกฎเพดาน 2.61 (คำนวณมือแล้ว ค่าเฉลี่ยของ D รายองค์ประกอบ) ----------
// 5 ข้อ: STR STY STF VAL ; 6 ข้อ: STG SYS SKL
// 2.60 เป๊ะ: องค์ประกอบ 5 ข้อ 4 อัน D = 3.8 ([4,4,4,4,3]) และ 6 ข้อ 3 อัน D = 1.0 -> (4*3.8 + 3*1)/7 = 2.6
const s260 = { STR: [4, 4, 4, 4, 3], STY: [4, 4, 4, 4, 3], STF: [4, 4, 4, 4, 3], VAL: [4, 4, 4, 4, 3], STG: 1, SYS: 1, SKL: 1 };
const rd260 = run(build({ V: [2, 3] }, s260));
ok('mean D ~ 2.60', Math.abs(rd260.readyMean - 2.6) < 1e-12, rd260.readyMean);
eq('mean D = 2.60 exactly -> ต่ำ (ค่าตัดเป็น ≤)', rd260.readyFinal, 'ต่ำ');
// ใกล้ 2.60: ปรับข้อหนึ่ง +1 ใน STG ให้ D เพิ่ม 1/6 -> เฉลี่ยเพิ่ม 1/42
const s261 = Object.assign({}, s260, { STG: [2, 1, 1, 1, 1, 1] });
eq('mean D just above 2.60 -> กลาง', run(build({ V: [2, 3] }, s261)).readyFinal, 'กลาง');
// 3.40 เป๊ะ: 5 ข้อ D รวม 18.8 (4.8,4.8,4.6,4.6) และ 6 ข้อ 3 อัน D = 10/6
const s340 = { STR: [5, 5, 5, 5, 4], STY: [5, 5, 5, 5, 4], STF: [5, 5, 5, 4, 4], VAL: [5, 5, 5, 4, 4], STG: [2, 2, 2, 2, 1, 1], SYS: [2, 2, 2, 2, 1, 1], SKL: [2, 2, 2, 2, 1, 1] };
const rd340 = run(build({ V: [2, 3] }, s340));
ok('mean D ~ 3.40', Math.abs(rd340.readyMean - 3.4) < 1e-12, rd340.readyMean);
eq('mean D = 3.40 exactly -> กลาง', rd340.readyFinal, 'กลาง');
const s341 = Object.assign({}, s340, { STG: [3, 2, 2, 2, 1, 1] });
ok('just above 3.40 and floor satisfied? (STR/SYS D >= 2.61)', run(build({ V: [2, 3] }, s341)).readyMean > 3.4);
// กฎเพดาน: ค่าเฉลี่ยสูง (> 3.40) แต่ D ของระบบหรือโครงสร้างต่ำกว่า 2.61 ต้องได้กลาง
const hiBase = { STG: 5, STR: 5, SYS: 5, STY: 5, STF: 5, SKL: 5, VAL: 5 };
eq('all D=5 -> สูง', run(build({ V: [2, 3] }, hiBase)).readyFinal, 'สูง');
eq('SYS D=2.5 (< 2.61) -> floor to กลาง', run(build({ V: [2, 3] }, Object.assign({}, hiBase, { SYS: [3, 3, 3, 2, 2, 2] }))).readyFinal, 'กลาง');
eq('SYS D=2.667 (>= 2.61) keeps สูง', run(build({ V: [2, 3] }, Object.assign({}, hiBase, { SYS: [3, 3, 3, 3, 2, 2] }))).readyFinal, 'สูง');
eq('STR D=2.6 (< 2.61) -> floor to กลาง', run(build({ V: [2, 3] }, Object.assign({}, hiBase, { STR: [3, 3, 3, 2, 2] }))).readyFinal, 'กลาง');
eq('STR D=2.8 keeps สูง', run(build({ V: [2, 3] }, Object.assign({}, hiBase, { STR: [3, 3, 3, 3, 2] }))).readyFinal, 'สูง');
ok('floor flag reported', run(build({ V: [2, 3] }, Object.assign({}, hiBase, { SYS: [3, 3, 3, 2, 2, 2] }))).floorHit === true);
eq('floor does not touch กลาง/ต่ำ', run(build({ V: [2, 3] }, Object.assign({}, uniformSeven(3), { SYS: 1 }))).floorHit, false);

// ข้อบกพร่องที่ทดสอบเทียบสองการเขียนพบ: ค่าเฉลี่ยที่ควรเท่ากับ 2.60 พอดี ถูกคำนวณเป็น 2.6000000000000005 ต้องไม่ถูกจัดเป็นกลาง
const sFloat = { STG: [3, 3, 2, 2, 2, 2], STR: [3, 3, 3, 2, 2], SYS: [3, 3, 2, 2, 2, 2], STY: [2, 2, 2, 2, 1], STF: [4, 4, 3, 3, 3], SKL: [3, 3, 2, 2, 2, 2], VAL: [4, 4, 3, 3, 3] };
const oF = run(build({ V: [2, 3] }, sFloat));
ok('float-edge profile: true mean is exactly 2.60', Math.abs(oF.readyMean - 2.6) < 1e-12, oF.readyMean);
eq('float-edge profile (2.6000000000000005) -> ต่ำ', oF.readyFinal, 'ต่ำ');
eq('classifyReady tolerates float noise at 2.60', E.classifyReady(2.6000000000000005, 3, 3).final, 'ต่ำ'); eq('classifyReady tolerates float noise at 3.40', E.classifyReady(3.4000000000000004, 3, 3).final, 'กลาง');
eq('classifyRisk tolerates float noise at 6.0', E.classifyRisk(6.000000000000001, false), 'ต่ำ'); eq('classifyRisk tolerates float noise at 12.0', E.classifyRisk(12.000000000000002, false), 'กลาง');
eq('real excess above 2.60 still กลาง', E.classifyReady(2.601, 3, 3).final, 'กลาง'); eq('real excess above 6 still กลาง', E.classifyRisk(6.01, false), 'กลาง');

// ---------- 4) ครบ 9 ช่อง × 4 ด้าน × 3 ทรัพยากร: แต่ละฉากทัศน์ต้องได้ช่องตามที่ออกแบบ ตอบกฎ ไม่เกินเพดาน ----------
const RISK_SPEC = { 'สูง': [4, 4], 'กลาง': [3, 3], 'ต่ำ': [2, 2] };            // ผลคูณ 16, 9, 4 เฉลี่ยทุกข้อ
const READY_SPEC = { 'ต่ำ': 2, 'กลาง': 3, 'สูง': 5 };                          // D ทุกข้อ (สูง = 5 ผ่านกฎเพดาน)
let scen = 0;
['สูง', 'กลาง', 'ต่ำ'].forEach((rk, ri) => ['ต่ำ', 'กลาง', 'สูง'].forEach((yk, yi) => ['จำกัด', 'ปานกลาง', 'เพียงพอ'].forEach((res) => data.domains.forEach((dm) => {
  const spec = {}; data.domains.forEach((d) => { spec[d.code] = d.code === dm.code ? RISK_SPEC[rk] : [1, 1]; });
  const o = run(build(spec, uniformSeven(READY_SPEC[yk]), res), true), d = o.domains.find((x) => x.code === dm.code), want = 'R' + (ri * 3 + yi + 1);
  scen++;
  eq(want + '/' + dm.code + '/' + res + ' cell', d.group, want);
  ok(want + ' within cap', d.measures.length <= o.resourceMax && d.measures.length > 0, d.measures.length);
  ok(want + ' rules satisfied', Dc.audit(d, data).every((c) => c.ok) || d.unmet.length > 0);
  ok(want + ' no resource overrun', d.measures.every((m) => m.res <= { 'จำกัด': 1, 'ปานกลาง': 2, 'เพียงพอ': 3 }[res]));
}))));
eq('108 designed scenarios', scen, 108);

// ---------- 5) คุณสมบัติ: ความเป็นเอกภาพ (เพิ่มความเสี่ยงห้ามทำให้ระดับลด เพิ่ม D ห้ามทำให้ระดับลด) ----------
function rng(s) { return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
const rnd = rng(2026), pick = (a) => a[Math.floor(rnd() * a.length)];
const RANK_R = { 'ต่ำ': 0, 'กลาง': 1, 'สูง': 2 };
function randomInput() {
  const input = { risk: {}, seven: {}, resource: pick(['จำกัด', 'ปานกลาง', 'เพียงพอ']) };
  const base = rnd() * 4 + 1, bd = rnd() * 4 + 1;
  data.riskItems.forEach((it) => { input.risk[it.id] = [Math.max(1, Math.min(5, Math.round(base + (rnd() - 0.5) * 2))), Math.max(1, Math.min(5, Math.round(base + (rnd() - 0.5) * 2)))]; });
  data.sevenItems.forEach((it) => { const d = Math.max(1, Math.min(5, Math.round(bd + (rnd() - 0.5) * 2))); input.seven[it.id] = [d, Math.min(5, d + Math.floor(rnd() * 3))]; });
  return input;
}
let monoBad = 0, monoRuns = 0;
for (let t = 0; t < 4000; t++) {
  const inp = randomInput(), o0 = run(inp);
  const rid = pick(data.riskItems).id, k = pick([0, 1]);
  if (inp.risk[rid][k] < 5) { const up = JSON.parse(JSON.stringify(inp)); up.risk[rid][k] += 1; const o1 = run(up); const dom = data.riskItems.find((x) => x.id === rid).dom; monoRuns++; if (RANK_R[o1.domains.find((d) => d.code === dom).risk] < RANK_R[o0.domains.find((d) => d.code === dom).risk]) monoBad++; }
  const sid = pick(data.sevenItems).id;
  if (inp.seven[sid][0] < 5) { const up = JSON.parse(JSON.stringify(inp)); up.seven[sid][0] += 1; const o1 = run(up); monoRuns++; if (RANK_R[o1.readyFinal] < RANK_R[o0.readyFinal]) monoBad++; }
}
eq('monotonic: raising L/C or D never lowers the level (' + monoRuns + ' pairs)', monoBad, 0);

// ---------- 6) ไม่ขึ้นกับลำดับข้อ / ซ้ำได้ / ข้อมูลไม่ครบ ----------
let permBad = 0;
for (let t = 0; t < 300; t++) {
  const inp = randomInput(), o0 = run(inp, true);
  const shuf = (obj) => { const keys = Object.keys(obj).sort(() => rnd() - 0.5), r = {}; keys.forEach((k) => { r[k] = obj[k]; }); return r; };
  const o1 = run({ risk: shuf(inp.risk), seven: shuf(inp.seven), resource: inp.resource }, true);
  const sig = (o) => o.domains.map((d) => d.group + ':' + d.measures.map((m) => m.id).join('.')).join('|') + o.readyFinal;
  if (sig(o0) !== sig(o1) || sig(o0) !== sig(run(inp, true))) permBad++;
}
eq('order of items and repeated runs do not change decisions', permBad, 0);
// ข้อมูลไม่ครบ: เหลือบางข้อก็ต้องไม่ล้ม และด้านที่ไม่มีข้อมูลต้องไม่มีช่อง
const part = randomInput(); Object.keys(part.risk).filter((k) => k.startsWith('H')).forEach((k) => delete part.risk[k]);
const op = run(part, true); eq('domain without data has no cell', op.domains.find((d) => d.code === 'H').group, null); ok('other domains unaffected', op.domains.filter((d) => d.code !== 'H').every((d) => d.group));
const half = randomInput(); Object.keys(half.seven).forEach((k, i) => { if (i % 2) delete half.seven[k]; }); ok('half of 7-S items still runs', run(half, true).readyFinal !== undefined);
const nul = { risk: {}, seven: {}, resource: 'จำกัด' }; ok('empty input no crash', run(nul, true).domains.every((d) => d.group === null));
// ค่านอกช่วง/ไม่ใช่ตัวเลขต้องถูกข้าม ไม่ทำให้เกิดผลเพี้ยน
const bad = randomInput(); bad.risk.V1 = [NaN, 9]; bad.risk.V2 = ['x', 3]; ok('non-numeric ratings ignored', Number.isFinite(run(bad, true).domains[0].rd));
// ข้อมูลไม่ครบ: ดัชนีความเสี่ยงต้องเฉลี่ยจากข้อที่ตอบเท่านั้น (ไม่หารด้วยจำนวนข้อทั้งหมด)
const pr = build({ V: [4, 4], A: [1, 1], P: [1, 1], H: [1, 1] }, uniformSeven(3));
const vIds = data.riskItems.filter((r) => r.dom === 'V').map((r) => r.id);
vIds.slice(4).forEach((id) => { delete pr.risk[id]; });                            // เหลือ 4 ข้อ ผลคูณ 16 ทุกข้อ
const opr = run(pr);
ok('partial answers: rd averaged over answered items only', Math.abs(opr.domains[0].rd - 16) < 1e-12 && opr.domains[0].n === 4, opr.domains[0].rd + ' n=' + opr.domains[0].n);
eq('partial answers keep the level of the answered items', opr.domains[0].risk, 'สูง');
console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
