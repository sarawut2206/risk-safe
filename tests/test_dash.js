// ทดสอบหน้าแรกและแดชบอร์ดตามบทบาท (dash.js): ไม่มีค่า undefined/NaN ตัวเลขตรงกับข้อมูลที่กรอก และสถานะว่างทำงาน  รัน: node tests/test_dash.js
const path = require('path');
const root = path.join(__dirname, '..');
const D = require(path.join(root, 'data.js')), E = require(path.join(root, 'engine.js')), DEC = require(path.join(root, 'decision.js')), DASH = require(path.join(root, 'dash.js'));
let checks = 0, fails = 0;
const ok = (n, c, i) => { checks++; if (!c) { fails++; console.log('FAIL', n, i === undefined ? '' : i); } };
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, '');
const STATUS = ['ยังไม่เริ่ม', 'กำลังดำเนินการ', 'เสร็จแล้ว'];
const HZ = { V: ['ความรุนแรง'], A: ['อุบัติเหตุ'], P: ['ละเมิดสิทธิ'], H: ['สุขภาวะ'] };
const SHORT_EL = { STG: 'กลยุทธ์', STR: 'โครงสร้าง', SYS: 'ระบบ', STY: 'รูปแบบ', STF: 'บุคลากร', SKL: 'ทักษะ', VAL: 'ค่านิยม' };
const ROLE_PAGES = { roleDir: { tasks: [['brief', 'a', 'b']] }, roleDeputy: { tasks: [['plan', 'a', 'b']] }, roleTeacher: { tasks: [['school', 'a', 'b']] } };

function make(S) {
  const getOut = () => E.analyze({ risk: S.risk, seven: S.seven, resource: S.resource }, D, S.params, { guard: DEC.guard });
  const filled = () => { const r = D.riskItems.filter((x) => (S.risk[x.id] || [])[0] != null && (S.risk[x.id] || [])[1] != null).length, s = D.sevenItems.filter((x) => (S.seven[x.id] || [])[0] != null && (S.seven[x.id] || [])[1] != null).length; return { r, s, rt: D.riskItems.length, st: D.sevenItems.length, pct: Math.round(((r + s) / (D.riskItems.length + D.sevenItems.length)) * 100) }; };
  const domFill = (c) => D.riskItems.filter((x) => x.dom === c && (S.risk[x.id] || [])[0] != null).length;
  const elFill = (c) => D.sevenItems.filter((x) => x.elem === c && (S.seven[x.id] || [])[0] != null).length;
  const h = { ic: (n) => '<svg data-i="' + n + '"></svg>', HZ, SCHOOL: '<svg></svg>' };
  return DASH.create({ S, D, E, esc, fmt: (x, n) => (isFinite(x) ? x.toFixed(n) : '–'), getOut, filled, domFill, elFill, cd: (x) => x.sb || x.id, mKey: (d, i) => d + ':' + i, STATUS, SHORT_EL, ROLE_PAGES }, h).pages;
}
const base = () => ({ risk: {}, seven: {}, resource: 'ปานกลาง', params: Object.assign({}, E.DEFAULT_PARAMS), status: {}, docs: [], school: { name: '', students: '', staff: '', year: '2569' }, track: { snaps: [] }, collect: { code: '', drafts: {} }, ui: {} });
const bad = (h) => /undefined|NaN|\[object/.test(h);

// ไม่มีข้อมูล
const S0 = base(), P0 = make(S0);
['home', 'roleDir', 'roleDeputy', 'roleTeacher'].forEach((k) => ok('empty state renders without undefined/NaN: ' + k, P0[k]().length > 500 && !bad(P0[k]())));
ok('director and deputy show the no-data card and the example button when nothing is filled', ['roleDir', 'roleDeputy'].every((k) => /ยังไม่มีข้อมูลสำหรับแสดงในแดชบอร์ด/.test(P0[k]()) && /data-act="example"/.test(P0[k]())));
ok('teacher page still shows the task list with nothing filled (0 of 38 / 0 of 30 style counts)', /0 จาก/.test(P0.roleTeacher()) && /data-go="rassess"/.test(P0.roleTeacher()));
ok('home page has the four stats, three role cards and four-step flow', (() => { const h = P0.home(); return /R1–R9/.test(h) && ['roleDir', 'roleDeputy', 'roleTeacher'].every((r) => h.indexOf('data-go="' + r + '"') > 0) && (h.match(/dsh-fs/g) || []).length >= 4 && h.indexOf('>' + D.bank.length + '<') > 0; })());

// ข้อมูลตัวอย่าง
const S1 = base(); S1.risk = JSON.parse(JSON.stringify(D.example.risk)); S1.seven = JSON.parse(JSON.stringify(D.example.seven)); S1.resource = D.example.resource; S1.school = { name: 'โรงเรียนตัวอย่าง', students: '532', staff: '32', year: '2569' };
const P1 = make(S1), out = E.analyze({ risk: S1.risk, seven: S1.seven, resource: S1.resource }, D, S1.params, { guard: DEC.guard });
const n = out.domains.reduce((a, d) => a + d.measures.length, 0);
['roleDir', 'roleDeputy', 'roleTeacher'].forEach((k) => ok('example data renders without undefined/NaN: ' + k, !bad(P1[k]()) && !/ยังไม่มีข้อมูลสำหรับแสดงในแดชบอร์ด/.test(P1[k]())));
ok('director card shows the readiness mean and the R group of the worst domain', (() => { const w = out.domains.filter((d) => d.risk).sort((a, b) => ({ 'สูง': 3, 'กลาง': 2, 'ต่ำ': 1 }[b.risk] - { 'สูง': 3, 'กลาง': 2, 'ต่ำ': 1 }[a.risk]) || b.rd - a.rd)[0]; const h = P1.roleDir(); return h.indexOf(out.readyMean.toFixed(1)) > 0 && h.indexOf('<b>' + w.group + '</b>') > 0 && h.indexOf(w.pkg.decisions[0]) > 0; })());
ok('director progress counts follow the measure statuses', (() => { const keys = []; out.domains.forEach((d) => d.measures.forEach((m) => keys.push(d.code + ':' + m.id))); S1.status[keys[0]] = STATUS[2]; S1.status[keys[1]] = STATUS[1]; const h = P1.roleDir(); return h.indexOf('<b>1</b> รายการ') > 0 && new RegExp('<b>' + (n - 2) + '</b> รายการ').test(h) && h.indexOf(Math.round(100 / n) + '%') > 0; })());
ok('approval status shows the saved state and says it is only temporary', (() => { S1.ui.approval = { s: 'ok', at: Date.now() }; const h = P1.roleDir(); S1.ui.approval = null; return /อนุมัติแนวทางแล้ว/.test(h) && /ชั่วคราว/.test(h); })());
ok('deputy table lists measures with owner and start time, capped at 8 rows with a link to the rest', (() => { const h = P1.roleDeputy(); return (h.match(/<tr><td>\d+<\/td>/g) || []).length === Math.min(8, n) && (n <= 8 || h.indexOf('ดูทั้งหมด ' + n + ' รายการ') > 0); })());
ok('deputy risk bars show one row per domain', (P1.roleDeputy().match(/dsh-rb/g) || []).length >= 4 + 7);
ok('teacher page marks the risk and readiness forms complete when every item is scored', (() => { const full = base(); D.riskItems.forEach((x) => { full.risk[x.id] = [3, 3]; }); D.sevenItems.forEach((x) => { full.seven[x.id] = [3, 3]; }); const h = make(full).roleTeacher(); return (h.match(/dsc lg ok/g) || []).length >= 2; })());
ok('teacher page lists added documents and the research code state', (() => { const t = base(); t.docs = [{ type: 'ACT', name: 'แผนทดสอบ.pdf', size: 1000, date: Date.now() }]; t.collect = { code: 'S001', drafts: { 'rs|S001|questionnaire|R1': {} } }; const h = make(t).roleTeacher(); return h.indexOf('แผนทดสอบ.pdf') > 0 && /S001/.test(h) && /มีร่างแล้ว 1 แบบ/.test(h); })());
ok('no page invents an official contact, file size or school name', ['home', 'roleDir', 'roleDeputy', 'roleTeacher'].every((k) => !/moe\.go\.th|โทร\.? ?0-|สมชาย|d.d MB|ไฟล์ PDF [0-9.]+ MB/.test(P1[k]() + P0[k]())));
console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
