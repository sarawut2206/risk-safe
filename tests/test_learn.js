// ทดสอบวงจรเรียนรู้ (learn.js): ข้อมูลทั้งหมดในไฟล์นี้เป็นข้อมูลทดสอบที่สร้างเองเพื่อตรวจตรรกะ ไม่ใช่ผลวิจัย
// รัน: node tests/test_learn.js
const path = require('path');
const data = require(path.join(__dirname, '..', 'data.js'));
const E = require(path.join(__dirname, '..', 'engine.js'));
const Dc = require(path.join(__dirname, '..', 'decision.js'));
const L = require(path.join(__dirname, '..', 'learn.js'));
let checks = 0, fails = 0;
const ok = (name, cond, info) => { checks++; if (!cond) { fails++; console.log('FAIL', name, info === undefined ? '' : info); } };
const eq = (name, a, b) => ok(name, a === b, 'got ' + JSON.stringify(a) + ' want ' + JSON.stringify(b));

const exIn = { risk: data.example.risk, seven: data.example.seven, resource: data.example.resource };
const out = E.analyze(exIn, data, null, { guard: Dc.guard });

// 1) ล้างบันทึก: ค่านอกช่วงต้องถูกตัด
const c = L.cleanLog({ fidelity: 60, costLevel: 7, effect: 6, kpiBefore: '12', kpiAfter: 'abc', barriers: ['B1', 'ZZ'], repeat: 'อาจ', lesson: 'x'.repeat(900) });
eq('fidelity must be on grid', c.fidelity, null); eq('cost out of range', c.costLevel, null); eq('effect out of range', c.effect, null);
eq('kpi before parsed', c.kpiBefore, 12); eq('kpi after invalid', c.kpiAfter, null); eq('barrier filter', c.barriers.join(), 'B1'); eq('repeat invalid', c.repeat, ''); eq('lesson truncated', c.lesson.length, 600);
const c2 = L.cleanLog({ fidelity: 75, costLevel: 2, effect: 4, kpiBefore: 0, kpiAfter: 3, kpiDir: 'down', repeat: 'ใช่' });
eq('kpi zero is a value', c2.kpiBefore, 0); eq('dir down', c2.kpiDir, 'down'); eq('effect kept', c2.effect, 4);

// 2) รายงานต้องไม่มีชื่อโรงเรียนหรือข้อความอิสระโดยปริยาย
const track = { code: 'S123456', arm: 'intervention', snaps: [L.makeSnapshot(out, 'ก่อนเริ่ม')], status: {}, logs: {}, custom: [{ dom: 'V', elem: 'SYS', name: 'มาตรการใหม่ ก', effect: 4, desc: 'รายละเอียดที่อาจมีชื่อคน' }] };
const key = out.domains[0].code + ':' + out.domains[0].measures[0].id; // รูปแบบเดียวกับ mKey ใน app.js
track.logs[key] = { effect: 4, lesson: 'ครูสมชายช่วยทำ', fidelity: 100 }; track.status[key] = 'เสร็จแล้ว';
const school = { name: 'โรงเรียนลับ', students: '532', year: '2569', province: 'ขอนแก่น' };
const rep = L.makeReport(track, school, out);
const txt = JSON.stringify(rep);
ok('no school name', txt.indexOf('โรงเรียนลับ') < 0); ok('no province by default', rep.school.province === ''); ok('no lesson text by default', txt.indexOf('สมชาย') < 0 && txt.indexOf('ชื่อคน') < 0);
eq('size band', rep.school.sizeBand, 'กลาง'); eq('schema', rep.schema, L.SCHEMA); ok('valid', L.validateReport(rep).ok);
const rep2 = L.makeReport(track, school, out, { includeText: true, includeProvince: true });
ok('opt-in text', JSON.stringify(rep2).indexOf('สมชาย') >= 0); eq('opt-in province', rep2.school.province, 'ขอนแก่น');
ok('reject foreign file', !L.validateReport({ schema: 'x' }).ok); ok('reject wrong version', !L.validateReport({ schema: L.SCHEMA, version: 99, measures: [], snapshots: [] }).ok);
eq('measure rows == plan size', rep.measures.length, out.domains.reduce((s, d) => s + d.measures.length, 0));

// 3) เปรียบเทียบสองรอบ: ปรับ D +1 ทุกข้อ ความพร้อมต้องเพิ่มและ Δ ตรงมือคำนวณ
const better = JSON.parse(JSON.stringify(exIn)); Object.keys(better.seven).forEach((k) => { better.seven[k][0] = Math.min(5, better.seven[k][0] + 1); });
const out2 = E.analyze(better, data, null, { guard: Dc.guard });
const s1 = L.makeSnapshot(out, 'ก่อน', '2026-01-01T00:00:00Z'), s2 = L.makeSnapshot(out2, 'หลัง', '2026-06-01T00:00:00Z'), cmp = L.compare(s1, s2);
ok('ready improved', cmp.dReady > 0); ok('delta matches', Math.abs(cmp.dReady - (out2.readyMean - out.readyMean)) < 1e-3); eq('4 domains', cmp.domains.length, 4); eq('7 elements', cmp.elements.length, 7);

// 4) รวมหลายโรงเรียน: สร้างรายงานทดสอบรายมาตรการ
const mk = (code, sb, o) => ({ schema: L.SCHEMA, version: 1, code, arm: '', synthetic: true, snapshots: [], custom: o.custom || [], measures: [Object.assign({ sb, dom: 'V', cell: 'R1', order: 1, res: 1, status: 'เสร็จแล้ว', fidelity: 100, costLevel: 1, effect: 3, kpi: { before: null, after: null, dir: 'up' }, barriers: [], repeat: '' }, o)] });
const bank = data.bank;
const group = (fn, n) => Array.from({ length: n }, (_, i) => fn(i));
// SB-001: ทำครบ ผลต่ำ -> L1
let reps = group((i) => mk('A' + i, 'SB-001', { effect: 1 + (i % 2), fidelity: 100 }), 5);
// SB-002: ผลสูงและตัวชี้วัดดีขึ้นทุกโรงเรียน -> L2
reps = reps.concat(group((i) => mk('B' + i, 'SB-002', { effect: 5, kpi: { before: 10, after: 4, dir: 'down' } }), 5));
// SB-003: ใช้ทรัพยากรสูงกว่าที่ระบุ (res ในคลัง) -> L3
const res3 = (bank.find((b) => b.sb === 'SB-003') || {}).res || 1;
reps = reps.concat(group((i) => mk('C' + i, 'SB-003', { costLevel: Math.min(3, res3 + 1) }), 5));
// SB-004: ทำเสร็จน้อยและขาดระบบ -> L4
reps = reps.concat(group((i) => mk('D' + i, 'SB-004', { status: i < 1 ? 'เสร็จแล้ว' : 'กำลังดำเนินการ', barriers: ['B5'] }), 5));
// SB-005: ไม่เหมาะกับบริบท -> L5
reps = reps.concat(group((i) => mk('E' + i, 'SB-005', { barriers: i < 3 ? ['B8'] : [] }), 5));
// SB-006: 4 โรงเรียน (ต่ำกว่าเกณฑ์ 5) ผลต่ำ -> ต้องไม่ออกข้อเสนอ
reps = reps.concat(group((i) => mk('F' + i, 'SB-006', { effect: 1 }), 4));
// มาตรการใหม่ 3 โรงเรียนใช้ชื่อเดียวกัน (พิมพ์เล็กใหญ่/เว้นวรรคต่างกัน) -> L6
reps[0].custom = [{ dom: 'V', elem: 'SYS', name: 'บัดดี้โรงเรียน', effect: 4 }]; reps[5].custom = [{ dom: 'V', elem: 'SYS', name: ' บัดดี้โรงเรียน ', effect: 5 }]; reps[10].custom = [{ dom: 'A', elem: 'SYS', name: 'บัดดี้โรงเรียน', effect: 4 }];
const ag = L.aggregate(reps, bank);
const rules = (sb) => ag.proposals.filter((p) => p.sb === sb).map((p) => p.rule).sort().join();
eq('SB-001 L1', rules('SB-001'), 'L1'); eq('SB-002 L2', rules('SB-002'), 'L2'); eq('SB-003 L3', rules('SB-003'), 'L3'); eq('SB-004 L4', rules('SB-004'), 'L4'); eq('SB-005 L5', rules('SB-005'), 'L5');
eq('SB-006 below minN: none', rules('SB-006'), ''); ok('L6 custom measure', ag.proposals.some((p) => p.rule === 'L6' && p.name.trim() === 'บัดดี้โรงเรียน' && p.n === 3));
ok('every proposal awaits experts', ag.proposals.every((p) => /รอผู้เชี่ยวชาญ/.test(p.status))); ok('flags synthetic', ag.nSynthetic === reps.length);
const p2 = ag.per.find((p) => p.sb === 'SB-002'); eq('kpi share', p2.kpiShare, 1); eq('median effect', p2.medEffect, 5);
// ข้อมูลน้อยเกินไป: ไม่มีข้อเสนอและมีข้อความอธิบาย
const small = L.aggregate(reps.slice(0, 3), bank); eq('no proposals when tiny', small.proposals.length, 0); ok('sufficiency text', /ยังไม่มีมาตรการใด/.test(small.sufficiency.text));
const none = L.aggregate([], bank); eq('empty aggregate', none.nReports, 0);

// 5) คู่ก่อน–หลัง: ต้องมี ≥ 2 รอบ และใช้รอบแรกกับรอบสุดท้าย
const withSnaps = (code, a, b) => Object.assign(mk(code, 'SB-001', {}), { snapshots: [a, b] });
const pr = L.pairs([withSnaps('P1', s1, s2), mk('P2', 'SB-001', {})]);
eq('only schools with 2 snaps', pr.length, 1); ok('pair deltas', pr[0].dReady > 0 && pr[0].readyPost > pr[0].readyPre);
// 6) L7 ระดับช่อง R: ทำเสร็จเกือบหมดแต่ไม่ดีขึ้น
const flat = (code) => Object.assign(mk(code, 'SB-001', { status: 'เสร็จแล้ว' }), { snapshots: [s1, Object.assign({}, s1, { date: '2026-06-01T00:00:00Z' })] });
const ag7 = L.aggregate(group((i) => flat('G' + i), 5), bank);
ok('L7 when nothing improves despite completion', ag7.proposals.some((p) => p.rule === 'L7'), JSON.stringify(ag7.cells));
console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
