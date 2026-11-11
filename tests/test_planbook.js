// ทดสอบเนื้อหาและการแบ่งหน้าของเล่มแผนปฏิบัติการ (planbook.js) ด้วยโรงเรียนสมมติจากข้อมูลตัวอย่าง  รัน: node tests/test_planbook.js
const path = require('path');
const root = path.join(__dirname, '..');
const D = require(path.join(root, 'data.js')), E = require(path.join(root, 'engine.js')), Dc = require(path.join(root, 'decision.js')), M = require(path.join(root, 'moe.js')), PB = require(path.join(root, 'planbook.js'));
let checks = 0, fails = 0;
const ok = (n, c, i) => { checks++; if (!c) { fails++; console.log('FAIL', n, i === undefined ? '' : i); } };
const eq = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a) + ' != ' + JSON.stringify(b));
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const out = E.analyze({ risk: D.example.risk, seven: D.example.seven, resource: D.example.resource }, D, E.DEFAULT_PARAMS, { guard: Dc.guard });
const HZ = { V: 'ความรุนแรง', A: 'อุบัติเหตุ/ภัยพิบัติ', P: 'ละเมิดสิทธิ', H: 'สุขภาวะ' };
const ctx = (over) => Object.assign({ esc, out, school: { name: 'โรงเรียนตัวอย่าง (สมมติ)', students: '532', staff: '32', year: '2569', province: '' }, status: {}, moeStatus: {}, MOE: M, mKey: (d, id) => d + ':' + id, domName: (c) => HZ[c] || c, elName: (c) => c, sizeOf: () => 'ขนาดกลาง', logo: '', today: new Date(2026, 10, 11) }, over || {});

// ---------- โครงเล่ม ----------
const m = PB.build(ctx());
eq('sections in order', m.sections.map((s) => s.id), ['p1', 'p2', 'p3', 'p4', 'pa']);
eq('toc covers sections and sub-headings', m.toc.map((e) => e.id), ['p1', 'p1-1', 'p1-2', 'p1-3', 'p2', 'p2-1', 'p2-2', 'p2-3', 'p3', 'p4', 'p4-1', 'p4-2', 'p4-3', 'pa', 'pa-1', 'pa-2']);
ok('every toc entry has an anchor block', m.toc.every((e) => m.sections.some((s) => s.blocks.some((b) => b.id === e.id))));
const nPlan = out.domains.reduce((a, d) => a + (d.measures || []).length, 0);
eq('plan rows = selected measures', m.meta.rows, nPlan);
const planTable = m.sections[2].blocks.find((b) => b.t === 'table');
eq('plan table has one row per measure', planTable.rows.length, nPlan);
ok('plan rows have the six official columns', planTable.rows.every((r) => (r.match(/<td/g) || []).length === 6));
ok('plan table header follows the ministry format', ['ระยะเวลา', 'ชื่อโครงการ', 'หลักการ', 'วัตถุประสงค์', 'การดำเนินการ', 'การติดตาม/ประเมินผล'].every((h) => planTable.head.indexOf(h) >= 0));

// ---------- ความสอดคล้องกับ 7 มาตรการ ----------
const moeTable = m.sections[1].blocks.find((b) => b.cls === 'moe');
eq('seven rows for the seven measures', moeTable.rows.length, 7);
const rowsAll = []; out.domains.forEach((d) => (d.measures || []).forEach((x) => rowsAll.push(x)));
const expectCovered = M.ITEMS.filter((it) => rowsAll.some((x) => it.sb.indexOf(x.sb || x.id) >= 0)).length;
eq('covered count matches an independent computation', m.meta.covered, expectCovered);
ok('summary sentence states covered count', m.sections[1].blocks.some((b) => b.html && b.html.indexOf('แผนนี้มีโครงการรองรับ ' + expectCovered + ' จาก 7') >= 0));
const none = M.ITEMS.filter((it) => !rowsAll.some((x) => it.sb.indexOf(x.sb || x.id) >= 0));
ok('a measure with no supporting project is flagged', none.every((it) => moeTable.rows[it.n - 1].indexOf('ยังไม่มีโครงการรองรับในแผนนี้') >= 0));
// เมื่อไม่มีมาตรการใดตรงกับข้อ 7 ต้องแจ้งว่าไม่มีโครงการรองรับ (ใช้ชุดมาตรการว่างเพื่อทดสอบทุกข้อ)
const empty = PB.build(ctx({ out: Object.assign({}, out, { domains: out.domains.map((d) => Object.assign({}, d, { measures: [] })) }) }));
ok('empty plan flags all seven items', empty.sections[1].blocks.find((b) => b.cls === 'moe').rows.every((r) => r.indexOf('ยังไม่มีโครงการรองรับในแผนนี้') >= 0) && empty.meta.covered === 0);

// ---------- ตัวชี้วัดของกระทรวงและการอ้างอิง ----------
const html = (mm) => mm.sections.map((s) => s.blocks.map((b) => (b.html || '') + (b.head || '') + (b.rows || []).join('')).join('')).join('') + mm.cover;
const all = html(m);
ok('ministry indicator name and 100 percent target are present', all.indexOf('ระดับความสำเร็จในการจัดการศึกษาเพื่อความปลอดภัย') >= 0 && all.indexOf('ร้อยละ 100') >= 0);
ok('three criteria levels (50, 75, 100) are present', ['เป้าหมายขั้นต้น (50)', 'เป้าหมายมาตรฐาน (75)', 'เป้าหมายขั้นสูง (100)'].every((x) => all.indexOf(x) >= 0));
ok('source and year of the ministry indicator are stated', all.indexOf('ปีงบประมาณ พ.ศ. 2566') >= 0 && all.indexOf('ตรวจสอบกับตัวชี้วัดของปีปัจจุบัน') >= 0);
ok('the 10 August 2569 announcement is cited', PB.REFS[0].indexOf('10 สิงหาคม 2569') >= 0 && all.indexOf('10 สิงหาคม 2569') >= 0);
const g = m.meta.grade; eq('evidence grades add up to the number of plan rows', g.A + g.B + g.C + g.D, nPlan);
const appx = m.sections[4].blocks.map((b) => b.html).join('');
ok('appendix lists the sources used by the plan', rowsAll.filter((x) => x.evsrc).every((x) => String(x.evsrc).split(';').every((s) => appx.indexOf(esc(s.trim())) >= 0)));
ok('appendix warns that the bank is a draft', appx.indexOf('ฉบับร่าง') >= 0 && appx.indexOf('ยังไม่ผ่านเดลฟาย') >= 0);
ok('cover says it is a draft needing approval', /ฉบับร่าง/.test(m.cover) && /อนุมัติ/.test(m.cover));

// ---------- ความปลอดภัยของข้อความ ----------
const bad = PB.build(ctx({ school: { name: '<img src=x onerror=alert(1)>', students: '', staff: '', year: '2569', province: '' } }));
ok('school name is escaped everywhere', html(bad).indexOf('<img') < 0 && bad.meta.nameEsc.indexOf('&lt;img') === 0);

// ---------- ตัวเลขไทย ----------
eq('digits become Thai', PB.thaiDigits('ปีการศึกษา 2569 จำนวน 24'), 'ปีการศึกษา ๒๕๖๙ จำนวน ๒๔');
eq('SB codes and R groups keep Latin digits', PB.thaiDigits('SB-064 กลุ่ม R1–R9 ตาม 7-S'), 'SB-064 กลุ่ม R1–R9 ตาม 7-S');
eq('risk item codes keep Latin digits', PB.thaiDigits('ข้อประเมิน V7 และ A3 จาก 12 ข้อ'), 'ข้อประเมิน V7 และ A3 จาก ๑๒ ข้อ');
eq('emergency numbers keep Latin digits', PB.thaiDigits('191 · 1669 · 199'), '191 · 1669 · 199');
eq('html entities are not corrupted', PB.thaiDigits('&#39;12&#39;'), '&#39;๑๒&#39;');
eq('tags and attributes are untouched', PB.thaiText('<span style="min-width:90px">12</span>'), '<span style="min-width:90px">๑๒</span>');

// ---------- การแบ่งหน้า ----------
const blocks = [{ t: 'html' }, { t: 'table' }, { t: 'html' }];
let pg = PB.layout(blocks, [100, { head: 40, rows: [200, 200, 200, 200] }, 50], 650);
eq('rows continue on the next page with the header repeated', pg.map((p) => p.map((x) => [x.b, x.from, x.to])), [[[0, 0, 1], [1, 0, 2]], [[1, 2, 4], [2, 0, 1]]]);
pg = PB.layout([{ t: 'html' }, { t: 'html' }], [400, 400], 650);
eq('html blocks that do not fit go to a new page', pg.length, 2);
pg = PB.layout([{ t: 'table' }], [{ head: 40, rows: [900] }], 650);
eq('a row taller than a page still gets its own page', pg.map((p) => p.map((x) => [x.b, x.from, x.to])), [[[0, 0, 1]]]);
pg = PB.layout([{ t: 'table' }], [{ head: 40, rows: [] }], 650);
eq('a table without rows adds nothing', pg.length, 0);
pg = PB.layout([{ t: 'table' }], [{ head: 30, rows: [300, 300, 300, 300, 300, 300] }], 650);
eq('tall rows are spread two per page', pg.map((p) => p.map((x) => x.to - x.from)), [[2], [2], [2]]);

// หัวข้อต้องไม่ค้างท้ายหน้าโดยตารางไปขึ้นหน้าถัดไป
pg = PB.layout([{ t: 'html' }, { t: 'html', keep: true }, { t: 'table' }], [400, 50, { head: 40, rows: [200] }], 650);
eq('a heading is moved with the first row of its table', pg.map((p) => p.map((x) => x.b)), [[0], [1, 2]]);
pg = PB.layout([{ t: 'html' }, { t: 'html' }, { t: 'table' }], [400, 50, { head: 40, rows: [200] }], 650);
eq('without keep the heading would be left behind', pg.map((p) => p.map((x) => x.b)), [[0, 1], [2]]);
pg = PB.layout([{ t: 'html', keep: true }, { t: 'html', keep: true }, { t: 'html' }], [100, 100, 100], 650);
eq('a chain of keep blocks that fits stays on one page', pg.length, 1);
ok('headings and note paragraphs of the book are marked keep', m.sections.every((s) => s.blocks.filter((b) => /^<h[12]/.test(b.html || '')).every((b) => b.keep === true)));
console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
