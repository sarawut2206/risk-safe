// ทดสอบแบบบันทึกผลการนำแผนไปใช้ (planrec.js): โครงข้อมูล ความครบถ้วน การแพ็ก/ตรวจ สรุปสำหรับผู้วิจัย และไฟล์ตัวอย่างสมมติ  รัน: node tests/test_planrec.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const D = require(path.join(root, 'data.js')), PR = require(path.join(root, 'planrec.js')), C = require(path.join(root, 'collect.js')), ACT = require(path.join(root, 'actplan.js'));
let checks = 0, fails = 0;
const ok = (n, c, i) => { checks++; if (!c) { fails++; console.log('FAIL', n, i === undefined ? '' : i); } };
const eq = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a) + ' != ' + JSON.stringify(b));
const sb = (id) => D.bank.find((x) => x.sb === id);

const full = (o) => { const a = PR.blank(); a.respRole = 'R1'; a.weeksActual = '6'; PR.STEP_IDS.forEach((k) => { a.steps[k] = { status: 'เสร็จแล้ว', evidence: 'มี' }; }); a.kpi = { target: 'ร้อยละ 80', actual: 'ร้อยละ 90', met: 'บรรลุตามเป้า' }; a.reach = { intended: '50', reached: '40' }; a.resource = { people: '4', hours: '12', cost: '1500' }; a.change = { value: 'ดีขึ้น', incBefore: '', incAfter: '' }; PR.ALIGN.forEach((x) => { a.align[x[0]] = 4; }); PR.SAT.forEach((x) => { a.sat[x[0]] = 5; }); a.obst = { none: true }; return Object.assign(a, o || {}); };
const miss = (fn) => { const a = full(); fn(a); return PR.missing(a); };

// ---------- โครงข้อมูล ----------
eq('six step ids', PR.STEP_IDS, ['s1', 's2', 's3', 's4', 's5', 's6']); eq('6 alignment and 5 satisfaction items', [PR.ALIGN.length, PR.SAT.length], [6, 5]);
ok('every alignment and satisfaction item belongs to exactly one research dimension', PR.ALIGN.concat(PR.SAT).every((x) => PR.DIMS.filter((d) => d[2].indexOf(x[0]) >= 0).length === 1) && PR.DIMS.reduce((n, d) => n + d[2].length, 0) === 11);
eq('the five research dimensions', PR.DIMS.map((d) => d[0]), ['fit', 'feasible', 'useful', 'usable', 'satisfy']);
ok('collect.js knows the new form', C.blank.planreport && C.PR === PR && C.progressOf('planreport', PR.blank(), D).pct < 10);
// ---------- ตรวจความครบถ้วน ----------
ok('a blank report is incomplete', PR.missing(PR.blank()).length > 20 && PR.progress(PR.blank()).complete === false); ok('a full report is complete with 100 percent', PR.missing(full()).length === 0 && PR.progress(full()).pct === 100);
ok('missing role', miss((a) => { a.respRole = ''; }).indexOf('respRole') >= 0); ok('weeks must be 0 to 104', miss((a) => { a.weeksActual = '105'; }).indexOf('weeksActual') >= 0 && !miss((a) => { a.weeksActual = '0'; }).length);
ok('a finished step needs an evidence answer', miss((a) => { a.steps.s4.evidence = ''; }).indexOf('steps.s4.evidence') >= 0); ok('an unfinished step needs none', !miss((a) => { a.steps.s6 = { status: 'กำลังดำเนินการ', evidence: '' }; }).length);
ok('bad step status', miss((a) => { a.steps.s1.status = 'x'; }).indexOf('steps.s1.status') >= 0);
ok('kpi result required', miss((a) => { a.kpi.met = ''; }).indexOf('kpi.met') >= 0); ok('kpi text over 60 characters rejected', miss((a) => { a.kpi.actual = 'ก'.repeat(61); }).length > 0);
ok('reached cannot exceed intended', miss((a) => { a.reach.reached = '60'; }).indexOf('reach.order') >= 0); ok('counts must be whole numbers', miss((a) => { a.resource.hours = '1.5'; }).indexOf('resource.hours') >= 0 && miss((a) => { a.resource.cost = '-5'; }).indexOf('resource.cost') >= 0);
ok('incident counts come as a pair', miss((a) => { a.change.incBefore = '4'; }).indexOf('change.inc') >= 0 && !miss((a) => { a.change.incBefore = '4'; a.change.incAfter = '2'; }).length);
ok('ratings 1 to 5 only', miss((a) => { a.align.A3 = 0; }).indexOf('align.A3') >= 0 && miss((a) => { a.sat.S2 = 6; }).indexOf('sat.S2') >= 0 && miss((a) => { delete a.sat.S5; }).indexOf('sat.S5') >= 0);
ok('obstacles: at least one, and none excludes the rest', miss((a) => { a.obst = {}; }).indexOf('obst') >= 0 && miss((a) => { a.obst = { none: true, time: true }; }).indexOf('obst.none') >= 0 && !miss((a) => { a.obst = { time: true, staff: true }; }).length);
ok('person names are refused in free text, ordinary words are not', miss((a) => { a.adapt = 'นางสาวสมหญิง ไม่ร่วมมือ'; }).indexOf('adapt') >= 0 && miss((a) => { a.suggest = 'เด็กชายสมชาย มาสาย'; }).indexOf('suggest') >= 0 && miss((a) => { a.kpi.actual = 'นายสมศักดิ์'; }).length > 0 && !miss((a) => { a.adapt = 'ผู้อำนวยการและครูแนะแนวช่วยกันติดตาม นักเรียนทุกชั้นเข้าร่วม'; }).length);
ok('free text over 400 characters refused', miss((a) => { a.adapt = 'ก'.repeat(401); }).indexOf('adapt') >= 0);
// ---------- ขั้นตอนของแบบตรงกับแผน ----------
ok('the form rows are the six plan steps of the measure', D.bank.every((m) => { const st = PR.stepsOf(m, { review: 'ทุกเดือน' }), a = ACT.steps(m, { review: 'ทุกเดือน' }); return st.length === 6 && st.every((x, i) => x.id === PR.STEP_IDS[i] && x.what === a[i].what && x.out === a[i].out && x.when === a[i].when); }));
// ---------- แพ็กและตรวจ ----------
const meta = { school: 's001', measure: 'SB-004', domain: 'V', group: 'R1', plannedWeeks: 8, consent: true, mode: 'tryout' };
const p = PR.pack(meta, full());
ok('payload shape', p.schema === C.SCHEMA && p.form === 'planreport' && p.school === 'S001' && p.measure === 'SB-004' && p.plannedWeeks === 8 && /^RC-[0-9A-F]{8}$/.test(p.receipt) && p.respondent === ''); ok('valid payload accepted by collect.js', C.validatePayload(p, D).ok);
ok('no consent refused', !C.validatePayload(PR.pack(Object.assign({}, meta, { consent: false }), full()), D).ok); ok('unknown measure refused', !C.validatePayload(PR.pack(Object.assign({}, meta, { measure: 'SB-999' }), full()), D).ok);
ok('bad domain or group refused', !C.validatePayload(PR.pack(Object.assign({}, meta, { domain: 'Z' }), full()), D).ok && !C.validatePayload(PR.pack(Object.assign({}, meta, { group: 'R12' }), full()), D).ok);
ok('incomplete report refused with a reason', (() => { const r = C.validatePayload(PR.pack(meta, PR.blank()), D); return !r.ok && /ยังไม่ครบ/.test(r.why); })());
ok('receipt depends on the content', PR.pack(meta, full()).receipt !== PR.pack(meta, full({ weeksActual: '7' })).receipt);
// ---------- สรุปสำหรับผู้วิจัย ----------
const mk = (school, measure, o, extra) => PR.pack(Object.assign({}, meta, { school, measure, submittedAt: '2026-03-01T00:00:00Z' }, extra || {}), full(o));
const L = [mk('S001', 'SB-004'), mk('S002', 'SB-004', { kpi: { target: '', actual: '', met: 'ยังไม่บรรลุ' } }), mk('S001', 'SB-005', { reach: { intended: '100', reached: '25' } })];
let sm = PR.summarize(L, D.bank); eq('3 reports, 2 schools, 2 measures', [sm.overall.n, sm.overall.schools, sm.measures.length], [3, 2, 2]);
eq('kpi distribution', [sm.overall.kpi['บรรลุตามเป้า'], sm.overall.kpi['ยังไม่บรรลุ']], [2, 1]); ok('mean coverage is reached over intended', Math.abs(sm.overall.meanCoverage - ((0.8 + 0.8 + 0.25) / 3)) < 1e-9);
ok('dimension means are computed from their items', sm.overall.dims.find((d) => d.key === 'fit').mean === 4 && sm.overall.dims.find((d) => d.key === 'satisfy').mean === 5);
ok('step completion is the share of the six steps finished', sm.overall.meanStepsDone === 1);
ok('only the latest report per school and measure counts', PR.latest(L.concat([mk('S001', 'SB-004', { weeksActual: '9' }, { submittedAt: '2026-04-01T00:00:00Z' })])).length === 3 && PR.latest(L.concat([mk('S001', 'SB-004', { weeksActual: '9' }, { submittedAt: '2026-04-01T00:00:00Z' })])).find((x) => x.school === 'S001' && x.measure === 'SB-004').answers.weeksActual === '9');
ok('incomplete reports are left out of the summary', PR.summarize(L.concat([PR.pack(Object.assign({}, meta, { school: 'S009' }), PR.blank())]), D.bank).overall.n === 3);
ok('summary by domain and group', sm.domains.length === 1 && sm.groups[0].key === 'R1' && sm.domains[0].n === 3);
ok('weeks ratio uses the planned weeks stored in the payload', Math.abs(sm.overall.medianWeeksRatio - 6 / 8) < 1e-9);
const lr = PR.longRows(L, D.bank); eq('long rows: header plus one per report', lr.length, 4); ok('long rows keep one column per rating and obstacle', lr[0].length === 22 + 11 + PR.OBST.length + 2 && lr.every((r) => r.length === lr[0].length));
ok('empty summary does not break', PR.summarize([], D.bank).overall.n === 0 && PR.summarize([], D.bank).measures.length === 0);
// ---------- ไฟล์ตัวอย่างสมมติ ----------
const idx = JSON.parse(fs.readFileSync(path.join(root, 'examples', 'collect-index.json'), 'utf8')).filter((n) => /^synthetic-planreport-/.test(n));
let ex = []; idx.forEach((n) => { ex = ex.concat(JSON.parse(fs.readFileSync(path.join(root, 'examples', n), 'utf8'))); });
ok('example reports exist, are valid and flagged synthetic', ex.length >= 30 && ex.every((q) => q.form === 'planreport' && q.synthetic === true && C.validatePayload(q, D).ok));
const sx = PR.summarize(ex, D.bank); ok('example summary has several schools, measures and groups', sx.overall.schools >= 8 && sx.measures.length >= 10 && sx.groups.length >= 3 && sx.overall.dims.every((d) => d.mean >= 1 && d.mean <= 5));
ok('example reports are never mixed with real ones (all in tryout mode, never live)', ex.every((q) => q.mode === 'tryout'));
console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
