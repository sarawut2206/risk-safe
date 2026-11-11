// ทดสอบฐานงานวิจัยของมาตรการ (evidence.js): ต้องแยกฐานจากบทที่ 2 ออกจากหลักฐานผลมาตรการ และไม่อ้างแหล่งที่ไม่อยู่ในบทที่ 2 ว่าอยู่ในบทที่ 2  รัน: node tests/test_evidence.js
const path = require('path');
const root = path.join(__dirname, '..');
const D = require(path.join(root, 'data.js')), EV = require(path.join(root, 'evidence.js'));
let checks = 0, fails = 0;
const ok = (n, c, i) => { checks++; if (!c) { fails++; console.log('FAIL', n, i === undefined ? '' : i); } };
const eq = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a) + ' != ' + JSON.stringify(b));
const sb = (id) => D.bank.find((x) => x.sb === id);

// ---------- รายการอ้างอิงจากบทที่ 2 ----------
eq('16 references taken from chapter 2', Object.keys(EV.REFS).length, 16);
ok('every reference has full text, short form and chapter 2 section', Object.values(EV.REFS).every((r) => r.full.length > 40 && r.short && /^2\.\d/.test(r.sec)));
ok('CSSF full reference is the 2022-2030 framework', /Comprehensive school safety framework 2022/.test(EV.REFS.cssf.full) && EV.REFS.cssf.sec === '2.3.2');
ok('ISO 31000 reference is the 2018 edition', /ISO 31000:2018/.test(EV.REFS.iso.full));
ok('no reference keeps the author check note', Object.values(EV.REFS).every((r) => !/\[ตรวจ/.test(r.full)));
eq('four Thai strategy studies from Table 2.1', EV.THAI.map((t) => t.key), ['nitta', 'sumit', 'suras', 'pong']);
ok('every Thai study has context, method and result', EV.THAI.every((t) => t.ctx && t.method && t.result));

// ---------- แหล่งหลักฐานของคลังมาตรการ ----------
const all = {}; D.bank.forEach((m) => EV.sources(m).forEach((s) => { all[s.src] = s.inCh2; }));
eq('29 distinct evidence sources in the bank', Object.keys(all).length, 29);
eq('only three sources are in chapter 2', Object.keys(all).filter((k) => all[k]).sort(), ['GADRRRES 2022 (CSSF)', 'Marzban 2026', 'พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล 2562']);
eq('26 sources are not in chapter 2', Object.keys(EV.notInCh2(D.bank)).length, 26);
ok('notInCh2 lists the measures that use each missing source', EV.notInCh2(D.bank)['Cipriano 2023'].length === 3 && EV.notInCh2(D.bank)['Cipriano 2023'].every((x) => /^SB-\d+$/.test(x)));
eq('SB-014 cites CSSF and Marzban (in chapter 2) and Seddighi (not)', EV.sources(sb('SB-014')).map((s) => [s.src, s.inCh2]), [['Marzban 2026', true], ['GADRRRES 2022 (CSSF)', true], ['Seddighi 2022', false]]);
ok('measures without sources return an empty list', EV.sources({ evsrc: '' }).length === 0 && EV.sources({}).length === 0);

// ---------- ฐานจากบทที่ 2 ที่คำนวณจากข้อมูลของมาตรการ ----------
const keys = (m) => EV.basis(m).map((b) => b.refs.join('+'));
D.bank.forEach((m) => { const k = keys(m); ok('base set present for ' + m.sb, ['cssf', 'moe64', 'iso', 's7', 'hreb'].every((x) => k.indexOf(x) >= 0), k.join()); });
ok('online measures cite the cyberbullying evidence and say it is not proof of effect', keys(sb('SB-006')).indexOf('cosma+weera+panja+thana') >= 0 && /ไม่ใช่หลักฐานว่ามาตรการนี้ได้ผล/.test(EV.basis(sb('SB-006')).find((b) => b.refs.indexOf('cosma') >= 0).text));
ok('offline measures do not cite the cyberbullying evidence', keys(sb('SB-005')).indexOf('cosma+weera+panja+thana') < 0);
ok('crackdown and recovery measures cite the crisis model', keys(sb('SB-011')).indexOf('liou') >= 0 && keys(sb('SB-064')).indexOf('liou') >= 0);
ok('prevention-only measures do not cite the crisis model', keys(sb('SB-003')).indexOf('liou') < 0);
ok('PDPA measures cite the data protection study', keys(sb('SB-026')).indexOf('pdpa') >= 0 && keys(sb('SB-005')).indexOf('pdpa') < 0);
ok('CSSF pillar comes from the measure pillar field', /เสาหลักที่ 3/.test(EV.basis(sb('SB-005')).find((b) => b.refs[0] === 'cssf').text) && /รากฐาน/.test(EV.basis(sb('SB-050')).find((b) => b.refs[0] === 'cssf').text));
ok('every citation names a chapter 2 section', D.bank.every((m) => EV.basis(m).every((b) => /^2\.\d/.test(b.sec))));
eq('references used keep chapter 2 order and always include the Thai studies', EV.refsUsed([sb('SB-005')]), ['moe64', 'cssf', 'iso', 's7', 'hreb', 'nitta', 'sumit', 'suras', 'pong']);

// ---------- ถ้อยคำไม่เกินหลักฐาน ----------
ok('grades C and D tell the school to pilot or consult an expert', /นำร่อง/.test(EV.EVG.C[2]) && /ปรึกษาผู้เชี่ยวชาญ/.test(EV.EVG.D[2]));
ok('grade A and B texts require the school to measure its own results', /วัดตัวชี้วัดของโรงเรียนเอง/.test(EV.EVG.A[2]) && /ติดตามผล/.test(EV.EVG.B[2]));
const text = JSON.stringify([EV.EVG, D.bank.map((m) => EV.basis(m).map((b) => b.text))]);
ok('no wording claims proven success', !/พิสูจน์แล้ว|ได้ผลแน่นอน|แก้ปัญหาได้แน่นอน|ยืนยันผลแล้ว/.test(text));

console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
