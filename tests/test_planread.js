// ทดสอบตัวอ่านแผนปฏิบัติการ (planread.js) ด้วยข้อความสมมติที่จำลองโครงสร้างตารางของแผนจริง ไม่มีข้อมูลของโรงเรียนจริง
// ทดสอบกับไฟล์จริงได้ (ไม่บังคับ): PLAN_PAGES_JSON=<ไฟล์ pages.json ที่ได้จาก pdf.js> node tests/test_planread.js
const fs = require('fs'), path = require('path');
const R = require(path.join(__dirname, '..', 'planread.js'));
let checks = 0, fails = 0;
const ok = (n, c, i) => { checks++; if (!c) { fails++; console.log('FAIL', n, i === undefined ? '' : i); } };
const eq = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a) + ' != ' + JSON.stringify(b));

// ---------- ข้อความไทยจาก PDF ----------
eq('space+า = ำ', R.fixThai('จ านวน'), 'จำนวน');
eq('space+ำ = ำ', R.fixThai('ค ำน ำ'), 'คำนำ');
eq('unspaced ำ = า (ฟอนต์หัวข้อ)', R.fixThai('ข้ำรำชกำร'), 'ข้าราชการ');
eq('dropped nikhahit repaired by list', R.fixThai('ประจาปี'), 'ประจำปี');
eq('normal text untouched when no artefact', R.fixThai('คำนำ จำนวน', false), 'คำนำ จำนวน');
eq('loose merges all sara-am forms', R.loose('จ านวน') === R.loose('จำนวน') && R.loose('จำนวน') === R.loose('จานวน'), true);
ok('artefact detected on spaced text', R.hasArtefact([{ lines: new Array(25).fill('ส านักงาน') }]));
ok('artefact not detected on clean text', !R.hasArtefact([{ lines: new Array(50).fill('สำนักงาน จำนวน') }]));

// ---------- บรรทัดจากชิ้นข้อความ ----------
const it = (s, x, y, w) => ({ str: s, transform: [10, 0, 0, 10, x, y], width: w });
eq('lines grouped by y and sorted by x', R.linesFromItems([it('2,952', 300, 500, 30), it('รวมทั้งหมด', 100, 500, 60), it('ลำดับ', 50, 600, 30)]), ['ลำดับ', 'รวมทั้งหมด 2,952']);
eq('adjacent pieces are not split', R.linesFromItems([it('25', 100, 500, 12), it('67', 112, 500, 12)]), ['2567']);
eq('empty items ignored', R.linesFromItems([it('', 1, 1, 1), null, { str: 'x' }]), []);

// ---------- ผลอ่านจากแผนสมมติ ----------
const pg = (n, lines) => ({ n, lines });
const synth = () => [
  pg(1, ['แผนปฏิบัติการ', 'ประจ าปีงบประมาณ พ.ศ. 2570']),
  pg(2, ['ค าน า', 'แผนปฏิบัติการโรงเรียนตัวอย่างวิทยา ประจ าปีงบประมาณ พ.ศ. 2570 เป็นคู่มือ']),
  pg(3, ['ตั้งอยู่เลขที่ 1 ต าบลในเมือง อ าเภอเมือง จังหวัดขอนแก่น 40000', 'ส านักงานเขตพื้นที่การศึกษามัธยมศึกษา กรุงเทพมหานคร เขต 2']),
  pg(4, ['จ านวนบุคลากร', 'ครูและบุคลากรทางการศึกษา ชาย หญิง รวม ร้อยละ', '1. ผู้บริหาร 1 1 2 5.0', '2. ข้าราชการครู 10 20 30 75.0', '3. ลูกจ้าง 4 4 8 20.0', 'รวม 15 25 40 100', 'ข้อมูล ณ วันที่ 1 มิถุนายน 2569']),
  pg(5, ['กลุ่มสาระการเรียนรู้ ข้าราชการครู พนักงานราชการ ครูอัตราจ้าง รวม', 'คณิตศาสตร์ 5 - 1 6', 'แนะแนว 2 - - 2', 'รวม 7 - 1 8']),
  pg(6, ['จ านวนนักเรียน', 'ชั้น นักเรียนชาย นักเรียนหญิง รวม จ านวนห้องเรียน', 'ม. 1 50 60 110 3', 'รวมทั้งหมด 150 170 320 9', 'ข้อมูล ณ วันที่ 10 พ.ย. 2569']),
  pg(7, ['1.4.1 ส่งเสริมการออกก าลังกายเพื่อสุขภาพ 10,000 ต.ค.69-ก.ย.70 บริหารวิชาการ', '1.4.8 งานประกันอุบัติเหตุนักเรียน 70,000 พ.ค.-มิ.ย.70 บริหารทั่วไป', '4.1.19 งานรักษาความปลอดภัย 250,000 ต.ค.69 - ก.ย.70 บริหารงานบุคคล', '5.2.5 ห้องเรียนสีขาว 5,000 ต.ค.69-ก.ย.70 บริหารงานบุคคล', '5.2.6 ซ้อมแผนอพยพหนีไฟ ต.ค.69-ก.ย.70 บริหารทั่วไป', '5.2.7 คุ้มครองข้อมูลส่วนบุคคล PDPA 8,000 ต.ค.69-ก.ย.70 บริหารทั่วไป', '5.3.1 ค่ายภาษาอังกฤษ 40,000 ต.ค.69 บริหารวิชาการ']),
  pg(8, ['การก ากับ ตรวจสอบ และรายงาน', 'วิสัยทัศน์ พันธกิจ ค่านิยมร่วม โครงสร้างการบริหาร']),
];
// เติมบรรทัดให้พอตรวจ artefact
const base = synth(); base.push(pg(9, new Array(30).fill('จ านวน ส านัก ด าเนิน')));
const out = R.parse(base);
eq('name parsed', out.fields.name, 'โรงเรียนตัวอย่างวิทยา');
eq('fiscal year parsed', out.fields.fiscalYear, '2570');
eq('province parsed (จังหวัด)', out.fields.province, 'ขอนแก่น');
eq('students total from table', out.fields.students, 320);
eq('rooms from table', out.fields.rooms, 9);
eq('staff total from table', out.fields.staff, 40);
eq('guidance count', out.fields.guidance, 2);
eq('area parsed', out.fields.area, 'สพม. กรุงเทพมหานคร เขต 2');
eq('stratum BKK2', out.fields.stratum, 'BKK2');
ok('artefact mode on', out.artefact === true);
const ev = (k) => out.evidence.find((e) => e.key === k);
eq('students high confidence when sum matches', ev('students').conf, 'high');
ok('students note shows sum check and date', /150 \+ หญิง 170 = 320/.test(ev('students').note) && /10 พ\.ย\. 2569/.test(ev('students').note), ev('students').note);
eq('staff evidence page', ev('staff').page, 4);
ok('staff note says includes non-teaching staff', /นับรวมลูกจ้าง/.test(ev('staff').note));
eq('no missing fields', out.missing, []);
ok('every evidence has page, snippet and confidence', out.evidence.every((e) => e.page > 0 && e.snippet && ['high', 'medium', 'low'].includes(e.conf)));

// โครงการที่เกี่ยวกับความปลอดภัย
const pj = (code) => out.projects.find((p) => p.code === code);
ok('sports project not counted as safety', !pj('1.4.1'));
ok('unrelated project not counted', !pj('5.3.1'));
eq('security project amount and domain', [pj('4.1.19').amount, pj('4.1.19').dom], [250000, 'A']);
eq('white classroom is violence domain', pj('5.2.5').dom, 'V');
ok('insurance is flagged soft', pj('1.4.8').soft === true);
eq('project without amount keeps null', pj('5.2.6').amount, null);
eq('PDPA project is rights domain', pj('5.2.7').dom, 'P');
eq('title repaired', pj('4.1.19').title, 'งานรักษาความปลอดภัย');
ok('project title does not contain dates', out.projects.every((p) => !/ต\.ค\.|พ\.ค\./.test(p.title)));

// ข้อสังเกต
const hint = (id) => out.hints.find((h) => h.id === id);
ok('D4 found from evacuation project', hint('D4').found);
ok('D1 not found when no plan words', !hint('D1').found);
ok('D5 found from reporting section', hint('D5').found);
ok('7-S evidence has 7 items', out.sevenEvidence.length === 7 && out.sevenEvidence.find((e) => e.code === 'VAL').found);

// ผลรวมเลือกช่วงงบ
eq('band none', R.budgetBand(0), 'ไม่มีงบเฉพาะด้านความปลอดภัย');
eq('band edge 10000', R.budgetBand(10000), 'ไม่เกิน 10,000 บาทต่อปี');
eq('band 10001', R.budgetBand(10001), '10,001–50,000 บาทต่อปี');
eq('band edge 50000', R.budgetBand(50000), '10,001–50,000 บาทต่อปี');
eq('band 100000', R.budgetBand(100000), '50,001–100,000 บาทต่อปี');
eq('band over', R.budgetBand(100001), 'มากกว่า 100,000 บาทต่อปี');
const C = require(path.join(__dirname, '..', 'collect.js'));
ok('every band is an option of the collection form', [0, 5000, 20000, 80000, 500000].every((v) => C.BUDGET.includes(R.budgetBand(v))));

// ---------- กรณีผิดปกติ ----------
const mis = R.parse([pg(1, ['จ านวนนักเรียน', 'นักเรียนชาย นักเรียนหญิง', 'รวมทั้งหมด 100 100 250 5'])]);
eq('students mismatch lowers confidence', mis.evidence.find((e) => e.key === 'students').conf, 'medium');
ok('mismatch note warns', /ไม่เท่ากับ/.test(mis.evidence.find((e) => e.key === 'students').note));
const none = R.parse([pg(1, ['ข้อความทั่วไปไม่มีข้อมูลโรงเรียน'])]);
eq('nothing found gives empty fields', none.fields, {});
ok('missing list names the five basic fields', none.missing.length === 5);
const blank = R.parse([pg(1, []), pg(2, []), pg(3, [])]);
ok('no text layer flagged as empty', blank.empty === true);
ok('parse never throws on empty input', R.parse([]).missing.length === 5);
// เอกสารปกติ (สระอำถูกต้อง) ห้ามถูกแก้
const clean = R.parse([pg(1, ['แผนปฏิบัติการโรงเรียนสำโรงวิทยา ประจำปีงบประมาณ พ.ศ. 2570', 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษา กรุงเทพมหานคร เขต 1'])]);
eq('clean document keeps sara-am in name', clean.fields.name, 'โรงเรียนสำโรงวิทยา');
ok('clean document is not in artefact mode', clean.artefact === false);

// ---------- ไฟล์จริง (ไม่บังคับ) ----------
if (process.env.PLAN_PAGES_JSON && fs.existsSync(process.env.PLAN_PAGES_JSON)) {
  const real = R.parse(JSON.parse(fs.readFileSync(process.env.PLAN_PAGES_JSON, 'utf8')));
  ok('real: name starts with โรงเรียน', /^โรงเรียน/.test(real.fields.name || ''));
  ok('real: students and staff found and sums match', real.evidence.filter((e) => (e.key === 'students' || e.key === 'staff') && e.conf === 'high').length === 2);
  ok('real: has projects', real.projects.length > 0);
  console.log('real file: ' + JSON.stringify(real.fields));
}
console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
