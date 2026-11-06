// ทดสอบชุดประเมิน (evalkit.js): ข้อมูลในไฟล์นี้เป็นข้อมูลทดสอบที่สร้างเองให้คำนวณมือได้ ไม่ใช่ผลวิจัย
// รัน: node tests/test_eval.js
const path = require('path');
const data = require(path.join(__dirname, '..', 'data.js'));
const E = require(path.join(__dirname, '..', 'engine.js'));
const Dc = require(path.join(__dirname, '..', 'decision.js'));
const L = require(path.join(__dirname, '..', 'learn.js'));
const V = require(path.join(__dirname, '..', 'evalkit.js'));
let checks = 0, fails = 0;
const ok = (name, cond, info) => { checks++; if (!cond) { fails++; console.log('FAIL', name, info === undefined ? '' : info); } };
const eq = (name, a, b) => ok(name, a === b, 'got ' + JSON.stringify(a) + ' want ' + JSON.stringify(b));
const near = (name, a, b, t) => ok(name, Math.abs(a - b) <= (t || 1e-9), 'got ' + a + ' want ' + b);

// 1) ชุดกรณีจำลอง: 27 กรณี ช่องละ 3 กรณี ทุกกรณีจัดช่องตรงเป้าตามตรรกะเดียวกับ engine และสร้างซ้ำได้เหมือนเดิม
const cases = V.makeCases(data.domains);
eq('27 cases', cases.length, 27);
const per = {}; cases.forEach((c) => { per[c.target] = (per[c.target] || 0) + 1; }); ok('3 per cell', Object.keys(per).length === 9 && Object.keys(per).every((k) => per[k] === 3));
cases.forEach((c) => { const rk = E.classifyRisk(c.rd, c.override), ry = E.classifyReady(c.readyMean, c.strD, c.sysD); ok(c.id + ' classifies to target', E.cellOf(rk, ry.final) === c.target, c.id + ' ' + c.target); ok(c.id + ' mean matches elements', Math.abs(c.elemD.reduce((s, x) => s + x, 0) / 7 - c.readyMean) < 0.011); });
eq('deterministic', JSON.stringify(V.makeCases(data.domains)), JSON.stringify(cases)); eq('unique ids', new Set(cases.map((c) => c.id)).size, 27);
ok('includes override and floor cases', cases.some((c) => c.kind === 'override') && cases.some((c) => c.kind === 'floor'));

// 2) SUS: ค่ามาตรฐาน
const sus = (f) => { const o = {}; for (let i = 1; i <= 10; i++) o['S' + i] = f(i); return o; };
eq('SUS best = 100', V.susScore(sus((i) => (i % 2 ? 5 : 1))), 100); eq('SUS worst = 0', V.susScore(sus((i) => (i % 2 ? 1 : 5))), 0); eq('SUS neutral = 50', V.susScore(sus(() => 3)), 50);
eq('SUS incomplete = null', V.susScore({ S1: 5 }), null);

// 3) ผู้เชี่ยวชาญ 3 คน: ข้อคะแนน [5,5,3] ผ่านเกณฑ์เดิม (Median 5 IQR 1) แต่ไม่ผ่านเกณฑ์ 7/9 (ให้ 4–5 เพียง 2 จาก 3)
const mkExpert = (code, mod) => {
  const f = { schema: V.SCHEMA_EXPERT, version: 1, code, items: {}, cases: {} };
  V.EXPERT_ITEMS.forEach((it) => { f.items[it.id] = 5; });
  cases.forEach((c) => { f.cases[c.id] = { risk: c.sys.risk, ready: c.sys.ready, fit: 5 }; });
  if (mod) mod(f); return f;
};
const ex = [mkExpert('E1'), mkExpert('E2'), mkExpert('E3', (f) => { f.items.M1 = 3; })];
const ra = V.analyzeExperts(ex, cases);
eq('n experts', ra.n, 3); eq('need = ceil(3*7/9)', ra.need, 3);
const m1 = ra.items.find((x) => x.id === 'M1'); eq('M1 median', m1.median, 5); eq('M1 iqr', m1.iqr, 1); eq('M1 classic passes', m1.classic, true); eq('M1 fails 7/9 rule', m1.pass, false);
eq('other item passes', ra.items.find((x) => x.id === 'M2').pass, true);
near('perfect agreement kappa risk', ra.consensus.kRisk, 1); near('perfect agreement kappa ready', ra.consensus.kReady, 1); eq('cell agreement 100%', ra.consensus.cell, 1);
near('alpha ordinal when all agree', ra.alpha.risk, 1); eq('fit median', ra.fit.median, 5); eq('fit share', ra.fit.share, 1);
// ผู้เชี่ยวชาญคนหนึ่งตอบสุ่มสลับกลับด้าน: kappa ของคนนั้นต้องติดลบ ฉันทามติ (มัธยฐานของ 3 คน) ยังตรงกับระบบ
const flip = { 'สูง': 'ต่ำ', 'กลาง': 'กลาง', 'ต่ำ': 'สูง' };
const ex2 = [mkExpert('E1'), mkExpert('E2'), mkExpert('E3', (f) => cases.forEach((c) => { f.cases[c.id].risk = flip[c.sys.risk]; }))];
const rb = V.analyzeExperts(ex2, cases);
ok('flipped expert kappa negative', rb.per[2].kRisk < 0, rb.per[2].kRisk); near('consensus still equals system', rb.consensus.kRisk, 1); ok('alpha drops', rb.alpha.risk < 0.667, rb.alpha.risk);
eq('no experts', V.analyzeExperts([], cases).n, 0); eq('ignores foreign files', V.analyzeExperts([{ schema: 'x' }], cases).n, 0);

// 4) ผู้บริหาร: ทุกข้อ 4 -> ค่าเฉลี่ยทุกด้าน 4 (ระดับมาก) ผ่าน SUS 100 ผ่าน
const mkAdmin = (code, v, s) => { const f = { schema: V.SCHEMA_ADMIN, version: 1, code, items: {}, sus: s || sus((i) => (i % 2 ? 5 : 1)) }; V.ADMIN_ASPECTS.forEach((a) => a.items.forEach(([id]) => { f.items[id] = v; })); return f; };
const ad = V.analyzeAdmins([mkAdmin('A1', 4), mkAdmin('A2', 4), mkAdmin('A3', 5)]);
eq('4 aspects', ad.aspects.length, 4); near('aspect mean', ad.aspects[0].mean, 13 / 3); eq('level มาก', ad.aspects[0].level, 'มาก'); ok('all pass', ad.aspects.every((a) => a.pass)); eq('SUS mean', ad.sus.mean, 100); ok('SUS pass', ad.sus.pass);
const ad2 = V.analyzeAdmins([mkAdmin('A1', 3), mkAdmin('A2', 3)]); ok('mean 3 fails', ad2.aspects.every((a) => !a.pass)); eq('level ปานกลาง', ad2.aspects[0].level, 'ปานกลาง');
eq('band edges', [V.band(4.51), V.band(3.51), V.band(2.51), V.band(1.51), V.band(1.0)].join(), 'มากที่สุด,มาก,ปานกลาง,น้อย,น้อยที่สุด');

// 5) นำร่อง: 8 โรงเรียนทดสอบ ความพร้อมเพิ่มทุกแห่ง
const exIn = { risk: data.example.risk, seven: data.example.seven, resource: data.example.resource };
const out0 = E.analyze(exIn, data, null, { guard: Dc.guard });
const rows = [];
for (let i = 0; i < 8; i++) {
  const b = JSON.parse(JSON.stringify(exIn)); Object.keys(b.seven).forEach((k, j) => { b.seven[k][0] = Math.min(5, b.seven[k][0] + (j % 3 === 0 ? 1 : 0) + (i % 2)); });
  const o1 = E.analyze(b, data, null, { guard: Dc.guard });
  rows.push({ schema: L.SCHEMA, version: 1, code: 'P' + i, arm: i < 4 ? 'intervention' : 'comparison', measures: [], custom: [], snapshots: [L.makeSnapshot(out0, 'ก่อน', '2026-01-01T00:00:00Z'), L.makeSnapshot(o1, 'หลัง', '2026-06-01T00:00:00Z')] });
}
const pr = V.analyzePilot(L.pairs(rows)); eq('pilot n', pr.n, 8); ok('ready improved', pr.ready.t.meanDiff > 0); ok('arms compared', !!pr.arms && pr.arms.ready.ok); ok('honest note', /ไม่ใช่ผล|สรุปเหตุ/.test(pr.note));
eq('pilot empty', V.analyzePilot([]).n, 0);

// 6) ตารางตัวชี้วัด: ไม่มีข้อมูล = "ยังไม่มีข้อมูล" ไม่ใช่ผ่านหรือไม่ผ่าน
const none = V.scorecard({}); eq('7 criteria', none.length, 7); ok('all unknown without data', none.every((r) => r.status === 'ยังไม่มีข้อมูล'));
const full = V.scorecard({ experts: ra, admins: ad, pilot: pr, learning: L.aggregate([], data.bank) });
eq('C1 fails with 7/9 rule', full.find((r) => r.id === 'C1').status, 'ไม่ผ่าน'); eq('C2 pass', full.find((r) => r.id === 'C2').status, 'ผ่าน'); eq('C5 pass', full.find((r) => r.id === 'C5').status, 'ผ่าน');
eq('C6 undecided when n < 8? (n=8 decided)', full.find((r) => r.id === 'C6').status === 'ยังไม่มีข้อมูล', false); eq('C7 no data', full.find((r) => r.id === 'C7').status, 'ยังไม่มีข้อมูล');
console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
