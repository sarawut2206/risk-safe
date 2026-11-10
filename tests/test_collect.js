// ทดสอบตรรกะระบบรวบรวมข้อมูล (collect.js): ข้อมูลทั้งหมดเป็นข้อมูลทดสอบที่สร้างขึ้น ไม่ใช่โรงเรียนจริง  รัน: node tests/test_collect.js
const path = require('path'), fs = require('fs');
const root = path.join(__dirname, '..');
const data = require(path.join(root, 'data.js')), E = require(path.join(root, 'engine.js')), Dc = require(path.join(root, 'decision.js')), C = require(path.join(root, 'collect.js'));
let checks = 0, fails = 0;
const ok = (n, c, i) => { checks++; if (!c) { fails++; console.log('FAIL', n, i === undefined ? '' : i); } };
const eq = (n, a, b) => ok(n, a === b, 'got ' + JSON.stringify(a) + ' want ' + JSON.stringify(b));
const near = (n, a, b, t) => ok(n, Math.abs(a - b) <= (t || 1e-9), 'got ' + a + ' want ' + b);

// ---------- ตัวสร้างข้อมูลทดสอบ ----------
const full = (over) => {
  const a = C.blank.questionnaire(); Object.assign(a.part1, { students: '532', staff: '32', year: '2569', stratum: 'CEN1', safetyOfficer: 'มี', counselor: 'ไม่มี', budget: C.BUDGET[1], resource: 'ปานกลาง' }, (over && over.part1) || {});
  data.riskItems.forEach((it) => { a.risk[it.id] = (over && over.risk && over.risk[it.id]) || [3, 3]; });
  data.sevenItems.forEach((it) => { a.seven[it.id] = (over && over.seven && over.seven[it.id]) || [3, 4]; });
  return a;
};
const meta = (school, resp, extra) => Object.assign({ school, respondent: resp, consent: true, consentAt: '2026-01-01T00:00:00Z', mode: 'tryout', submittedAt: '2026-01-02T00:00:00Z' }, extra || {});
const schoolPayloads = (code, ans) => ['R1', 'R2', 'R3'].map((r, i) => C.pack('questionnaire', meta(code, r), (ans && ans[i]) || full()))
  .concat([C.pack('incidents', meta(code), { year: '2569', noSystem: false, V: '2', A: '1', P: '0', H: '3' }), C.pack('documents', meta(code), { items: { D1: 'มี', D2: 'มี', D3: 'กำลังจัดทำ', D4: 'มี', D5: 'ไม่มี' }, years: {} })]);

// 1) ความครบถ้วน
let pq = C.progressQ(C.blank.questionnaire(), data); eq('blank total', pq.total, 8 + 60 + 76); eq('blank done (only the default year counts)', pq.done, 1); ok('blank incomplete', !pq.complete);
pq = C.progressQ(full(), data); ok('full complete', pq.complete && pq.pct === 100, JSON.stringify(pq.parts.p1.missing));
const half = full(); delete half.risk.V1; half.seven.STG1 = [3, null]; half.part1.stratum = '';
pq = C.progressQ(half, data); eq('missing risk items counted', pq.parts.p2.missing.length, 2); eq('missing 7-S item counted', pq.parts.p3.missing.join(), 'STG1:I'); eq('missing part1', pq.parts.p1.missing.join(), 'stratum'); eq('done = total - 4', pq.done, pq.total - 4);
const bad = full(); bad.risk.V1 = [6, 3]; bad.seven.STG2 = [0, 3]; pq = C.progressQ(bad, data); ok('out-of-range ratings rejected', pq.parts.p2.missing.indexOf('V1:L') >= 0 && pq.parts.p3.missing.indexOf('STG2:D') >= 0);
const badp1 = full({ part1: { students: '-5', staff: 'abc' } }); eq('invalid numbers flagged', C.part1Missing(badp1.part1).join(), 'students,staff');
// 2) เหตุการณ์และเอกสาร
ok('incidents complete', C.checkIncidents({ year: '2569', noSystem: false, V: '0', A: '2', P: '1', H: '5' }).complete);
ok('incidents need all four counts', !C.checkIncidents({ year: '2569', noSystem: false, V: '0', A: '', P: '1', H: '5' }).complete);
ok('no-system needs empty counts', C.checkIncidents({ year: '2569', noSystem: true, V: '', A: '', P: '', H: '' }).complete);
ok('no-system with counts is an error', !C.checkIncidents({ year: '2569', noSystem: true, V: '1', A: '', P: '', H: '' }).complete);
ok('negative or decimal counts rejected', !C.checkIncidents({ year: '2569', noSystem: false, V: '-1', A: '2.5', P: '1', H: '5' }).complete);
ok('documents complete', C.checkDocuments({ items: { D1: 'มี', D2: 'ไม่มี', D3: 'กำลังจัดทำ', D4: 'มี', D5: 'มี' }, years: { D1: '2568' } }).complete);
ok('documents missing item', !C.checkDocuments({ items: { D1: 'มี' }, years: {} }).complete); ok('document year out of range', !C.checkDocuments({ items: { D1: 'มี', D2: 'มี', D3: 'มี', D4: 'มี', D5: 'มี' }, years: { D1: '1999' } }).complete);
// 3) แพ็กและตรวจคำตอบ
const p0 = C.pack('questionnaire', meta('s001', 'R2'), full());
eq('school code upper-cased', p0.school, 'S001'); ok('receipt format', /^RC-[0-9A-F]{8}$/.test(p0.receipt)); ok('valid payload', C.validatePayload(p0, data).ok);
eq('receipt deterministic', C.pack('questionnaire', meta('s001', 'R2'), full()).receipt, p0.receipt); ok('receipt changes with content', C.pack('questionnaire', meta('s001', 'R2'), full({ part1: { students: '533' } })).receipt !== p0.receipt);
ok('reject without consent', !C.validatePayload(C.pack('questionnaire', meta('S001', 'R2', { consent: false }), full()), data).ok);
ok('reject incomplete questionnaire', !C.validatePayload(C.pack('questionnaire', meta('S001', 'R2'), half), data).ok);
ok('reject bad school code', !C.validatePayload(C.pack('questionnaire', meta('ชื่อโรงเรียน', 'R2'), full()), data).ok); ok('reject bad respondent', !C.validatePayload(C.pack('questionnaire', meta('S001', 'R9'), full()), data).ok);
ok('reject foreign file', !C.validatePayload({ schema: 'x' }, data).ok); ok('reject wrong version', !C.validatePayload(Object.assign({}, p0, { version: 9 }), data).ok);
ok('incident payload valid', C.validatePayload(C.pack('incidents', meta('S001'), { year: '2569', noSystem: true, V: '', A: '', P: '', H: '' }), data).ok);
ok('payload carries no free-text identifiers by default', JSON.stringify(p0).indexOf('ชื่อ') < 0);

// 4) รวมระดับโรงเรียน = ค่าเฉลี่ยของ 3 คน
const a1 = full({ risk: { V1: [2, 2] }, seven: { STG1: [2, 3] } }), a2 = full({ risk: { V1: [4, 4] }, seven: { STG1: [4, 5] } }), a3 = full({ risk: { V1: [3, 3] }, seven: { STG1: [3, 4] } });
const sch = C.groupBySchool(schoolPayloads('S010', [a1, a2, a3]))[0], ag = C.aggregateSchool(sch, data);
ok('aggregate complete with 3', ag.complete && ag.n === 3); near('mean of three L', ag.input.risk.V1[0], 3); near('mean of three C', ag.input.risk.V1[1], 3); near('mean of three D', ag.input.seven.STG1[0], 3); near('mean of three I', ag.input.seven.STG1[1], 4);
eq('resource uses the lowest reported', ag.input.resource, 'ปานกลาง');
const lowRes = C.groupBySchool(schoolPayloads('S011', [full({ part1: { resource: 'เพียงพอ' } }), full({ part1: { resource: 'จำกัด' } }), full({ part1: { resource: 'ปานกลาง' } })]))[0];
eq('resource = lowest of 3 answers', C.aggregateSchool(lowRes, data).input.resource, 'จำกัด');
const two = C.groupBySchool(schoolPayloads('S012', [a1, a2, a3]).slice(0, 2).concat([C.pack('incidents', meta('S012'), { year: '2569', noSystem: true, V: '', A: '', P: '', H: '' })]))[0];
ok('two respondents are not enough', !C.aggregateSchool(two, data).complete && C.aggregateSchool(two, data).n === 2);
// กฎยกระดับ: อย่างน้อย 2 ใน 3 คนให้ C=5 และ L≥2
const ov = (vals) => C.aggregateSchool(C.groupBySchool(schoolPayloads('S013', vals.map((v) => full({ risk: { V3: v } }))))[0], data);
ok('1 of 3 with C=5 does not escalate', !ov([[3, 5], [3, 3], [3, 3]]).input.overrideDomains.V); ok('2 of 3 with C=5 and L>=2 escalates', ov([[3, 5], [2, 5], [3, 3]]).input.overrideDomains.V === true);
ok('C=5 but L=1 does not count', !ov([[1, 5], [1, 5], [1, 5]]).input.overrideDomains.V); ok('escalation limited to its own domain', !ov([[3, 5], [3, 5], [3, 3]]).input.overrideDomains.A);
const aggOv = ov([[3, 5], [2, 5], [3, 3]]); const outOv = E.analyze(aggOv.input, data, null, { guard: Dc.guard });
eq('engine escalates the flagged domain though the mean C is below 5', outOv.domains.find((d) => d.code === 'V').risk, 'สูง'); ok('mean C of that item is below 5', aggOv.input.risk.V3[1] < 5);
eq('engine without the flag does not escalate', E.analyze({ risk: aggOv.input.risk, seven: aggOv.input.seven, resource: aggOv.input.resource }, data).domains.find((d) => d.code === 'V').risk !== 'สูง', true);
// ผู้ตอบต่างกันชัดเจน (> 2.00)
const dv = C.aggregateSchool(C.groupBySchool(schoolPayloads('S014', [full({ seven: Object.fromEntries(data.sevenItems.filter((s) => s.elem === 'STR').map((s) => [s.id, [1, 5]])) }), full({ seven: Object.fromEntries(data.sevenItems.filter((s) => s.elem === 'STR').map((s) => [s.id, [4, 5]])) }), full()]))[0], data);
ok('divergent respondents flagged (diff 3.0)', dv.divergent.some((x) => x.elem === 'STR' && Math.abs(x.diff - 3) < 1e-9)); eq('no flag for identical respondents', C.aggregateSchool(sch, data).divergent.filter((x) => x.elem !== 'STG').length, 0);
// ส่งซ้ำ: ฉบับล่าสุดแทน
const old = C.pack('questionnaire', meta('S015', 'R1', { submittedAt: '2026-01-01T00:00:00Z' }), full()), neu = C.pack('questionnaire', meta('S015', 'R1', { submittedAt: '2026-02-01T00:00:00Z' }), full({ part1: { students: '700' } }));
eq('latest submission wins', C.groupBySchool([neu, old])[0].q.R1.answers.part1.students, '700');

// 5) ความสอดคล้องภายในโรงเรียน (คำนวณมือ / scipy)
near('rwg all raters identical = 1', C.rwgJ([[3, 3, 3], [4, 4, 4]], 5), 1);
near('rwg hand calc J=2 (0.956522)', C.rwgJ([[3, 3, 4], [4, 4, 4]], 5), 1.8333333333 / 1.9166666667, 1e-9);
eq('rwg negative truncated to 0', C.rwgJ([[1, 5, 3]], 5), 0); ok('rwg needs >= 2 raters', isNaN(C.rwgJ([[3], [4]], 5)));
const ref = JSON.parse(fs.readFileSync(path.join(__dirname, 'ref_collect.json'), 'utf8'));
ref.icc.forEach((c, i) => near('ICC(1) matches independent computation #' + i, C.icc1(c.groups), c.icc1, 1e-9));
ref.spearman.forEach((c, i) => { const r = C.spearman(c.x, c.y); near('spearman rho vs scipy #' + i, r.rho, c.rho, 1e-9); near('spearman p vs scipy (t approx) #' + i, r.p, c.p, 0.02); });
ok('ICC(1) needs equal group sizes', isNaN(C.icc1([[1, 2, 3], [1, 2]]))); ok('identical raters give ICC near 1', C.icc1([[1, 1, 1], [3, 3, 3], [5, 5, 5], [2, 2, 2]]) > 0.99);
// agreement ทั้งชุด: ผู้ตอบเหมือนกันทุกคน -> rwg = 1
const same = []; for (let i = 0; i < 6; i++) same.push(...schoolPayloads('S' + (100 + i), [full({ risk: { V1: [1 + (i % 5), 3] } }), full({ risk: { V1: [1 + (i % 5), 3] } }), full({ risk: { V1: [1 + (i % 5), 3] } })]));
const agr = C.agreement(C.groupBySchool(same), data); eq('agreement counted 6 schools', agr.schools, 6); ok('perfect rater agreement -> median rwg 1', agr.per.every((g) => Math.abs(g.medianRwg - 1) < 1e-9)); eq('agreement groups = 8 risk + 14 7-S', agr.per.length, 8 + 14);

// 6) ความครบถ้วนเทียบรายชื่อ
const pay = schoolPayloads('S020').concat(schoolPayloads('S021').slice(0, 2));
const comp = C.completeness(pay, [{ code: 'S020', stratum: 'BKK1' }, { code: 'S021', stratum: 'BKK2' }, { code: 'S022', stratum: 'CEN2' }], data);
eq('complete school', comp[0].complete, true); eq('partial school nq', comp[1].nq, 2); eq('partial school incomplete', comp[1].complete, false); eq('never started', comp[2].started, false); eq('stratum from roster', comp[1].stratum, 'BKK2');
// 7) CSV
const csv = C.parseCsv('code,stratum,pin\r\nS001,"BKK1",1234\nS002,"CEN,1",5678\n"S003","x ""q"" y",9\n');
eq('csv rows', csv.length, 4); eq('csv quoted comma kept', csv[2][1], 'CEN,1'); eq('csv escaped quote', csv[3][1], 'x "q" y');
const rr = C.parseRoster('code,stratum\nS001,BKK1\nS001,BKK2\nbad code,CEN1\nS002,CEN2\n'); eq('roster accepts valid unique', rr.roster.length, 2); eq('roster reports 2 errors', rr.errors.length, 2); ok('roster needs code column', C.parseRoster('a,b\n1,2').errors.length === 1);
const lr = C.longRows(schoolPayloads('S030'), data); eq('long rows count (3 respondents x (8+30+38) + header)', lr.length, 1 + 3 * (8 + 30 + 38)); ok('csv has BOM and escapes quotes', C.toCsv([['a"b', 'c']]).charCodeAt(0) === 0xFEFF && C.toCsv([['a"b']]).indexOf('"a""b"') > 0);
// 8) ไฟล์ตัวอย่างสมมติของแดชบอร์ด: ต้องตรวจผ่านและมีป้าย synthetic ทุกไฟล์
const cidx = JSON.parse(fs.readFileSync(path.join(root, 'examples', 'collect-index.json'), 'utf8')); let exPay = [];
cidx.forEach((n) => { ok(n + ' exists and is named synthetic', fs.existsSync(path.join(root, 'examples', n)) && /^synthetic-/.test(n)); if (/\.json$/.test(n)) exPay = exPay.concat(JSON.parse(fs.readFileSync(path.join(root, 'examples', n), 'utf8'))); });
ok('all example payloads valid', exPay.length > 50 && exPay.every((p) => C.validatePayload(p, data).ok)); ok('all example payloads flagged synthetic', exPay.every((p) => p.synthetic === true));
const exRoster = C.parseRoster(fs.readFileSync(path.join(root, 'examples', 'synthetic-collect-roster.csv'), 'utf8')); eq('example roster has no errors', exRoster.errors.length, 0);
const exComp = C.completeness(exPay, exRoster.roster, data); ok('examples include complete, partial and unstarted schools', exComp.some((r) => r.complete) && exComp.some((r) => r.started && !r.complete) && exComp.some((r) => !r.started));
console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
