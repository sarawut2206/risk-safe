// ทดสอบฐานงานวิจัยของมาตรการ (evidence.js): ต้องแยกฐานจากบทที่ 2 ออกจากหลักฐานผลมาตรการ ไม่อ้างแหล่งที่ไม่อยู่ในบทที่ 2 ว่าอยู่ในบทที่ 2 และหลักการและเหตุผลของแผนต้องอ้างอิงสั้นโดยไม่อ้างเกินหลักฐาน  รัน: node tests/test_evidence.js
const path = require('path');
const root = path.join(__dirname, '..');
const D = require(path.join(root, 'data.js')), EV = require(path.join(root, 'evidence.js'));
let checks = 0, fails = 0;
const ok = (n, c, i) => { checks++; if (!c) { fails++; console.log('FAIL', n, i === undefined ? '' : i); } };
const eq = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a) + ' != ' + JSON.stringify(b));
const sb = (id) => D.bank.find((x) => x.sb === id);

// ---------- รายการอ้างอิงจากบทที่ 2 ----------
eq('42 references taken from chapter 2 (16 earlier + 26 added in thesis v15)', Object.keys(EV.REFS).length, 42);
ok('every reference has full text, short form and chapter 2 section', Object.values(EV.REFS).every((r) => r.full.length > 40 && r.short && /^2\.\d/.test(r.sec)));
ok('CSSF full reference is the 2022-2030 framework', /Comprehensive school safety framework 2022/.test(EV.REFS.cssf.full) && EV.REFS.cssf.sec === '2.3.2');
ok('ISO 31000 reference is the 2018 edition', /ISO 31000:2018/.test(EV.REFS.iso.full));
ok('no reference keeps the author check note', Object.values(EV.REFS).every((r) => !/\[ตรวจ/.test(r.full)));
eq('four Thai strategy studies from Table 2.1', EV.THAI.map((t) => t.key), ['nitta', 'sumit', 'suras', 'pong']);
ok('every Thai study has context, method and result', EV.THAI.every((t) => t.ctx && t.method && t.result));

// ---------- แหล่งหลักฐานของคลังมาตรการ ----------
const all = {}; D.bank.forEach((m) => EV.sources(m).forEach((s) => { all[s.src] = s.inCh2; }));
eq('29 distinct evidence sources in the bank', Object.keys(all).length, 29);
ok('all 29 sources are now in chapter 2 (3 earlier + 26 in section 2.9.4 since thesis v15)', Object.keys(all).every((k) => all[k]));
eq('the 26 added sources point to section 2.9.4', Object.keys(EV.IN_CH2).filter((k) => EV.IN_CH2[k].sec === '2.9.4').length, 26);
ok('every source maps to a reference that exists', Object.keys(EV.IN_CH2).every((k) => EV.REFS[EV.IN_CH2[k].ref]));
eq('no source is missing from chapter 2', Object.keys(EV.notInCh2(D.bank)).length, 0);
ok('notInCh2 still reports a source that has no chapter 2 entry', EV.notInCh2([{ sb: 'SB-X', evsrc: 'Unknown 2099' }])['Unknown 2099'].join() === 'SB-X');
eq('SB-014 cites CSSF, Marzban and Seddighi', EV.sources(sb('SB-014')).map((s) => [s.src, s.inCh2, s.sec]), [['Marzban 2026', true, '2.9.3'], ['GADRRRES 2022 (CSSF)', true, '2.3.2'], ['Seddighi 2022', true, '2.9.4']]);
ok('references with unchecked fields keep a visible bracket note', Object.values(EV.REFS).filter((r) => /\[/.test(r.full)).length >= 10);
ok('Wiggers and Paas full reference is the 2022 parental discipline review', /Wiggers, M\., and Paas, F\. \(2022\)/.test(EV.REFS.wiggers.full));
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
eq('references used keep chapter 2 order, include the Thai studies and the evidence sources of the measure', EV.refsUsed([sb('SB-005')]), ['moe64', 'cssf', 'iso', 's7', 'hreb', 'nitta', 'sumit', 'suras', 'pong', 'cipriano', 'lester', 'lodi']);

// ---------- หลักการและเหตุผลของแผน (rationale): ข้อความอ่านง่าย แล้วรวมที่มาไว้เป็นหมายเหตุท้ายสรุป ----------
const ctx = (o) => Object.assign({ school: 'โรงเรียนทดสอบ', hz: 'ความรุนแรง', risk: 'สูง', rd: '12.50', ready: 'ต่ำ', group: 'R3', pkgName: 'ควบคุมก่อน', pkgSummary: 'สรุปกลุ่ม', top: true, rank: 1, pni: '0.250', moe: [3] }, o || {});
const rat = (id, o) => EV.rationale(sb(id), ctx(o));
const body = (id, o) => rat(id, o).filter((x) => !x.note), note = (id, o) => rat(id, o).find((x) => x.note);
const txt = (arr) => arr.map((x) => x.text).join(' ');
const CITE = /\(\s*[^()]*ข้อ 2\.\d[^()]*\)|[A-Za-z]+,? (?:และ|et al\.|\d{4}).*ข้อ 2\./;   // การอ้างอิงแทรกในประโยค
eq('rationale has four body parts and one source note, in a fixed order', rat('SB-005').map((x) => x.lead), ['สถานการณ์ของโรงเรียน (จากผลประเมิน)', 'ทำไมต้องมีมาตรการนี้', 'ทำไมวางแผนแบบนี้', 'หลักฐานรองรับผลของมาตรการ', 'หมายเหตุที่มา']);
ok('the note is the last part and the body parts are lists of short items', rat('SB-005').slice(-1)[0].note === true && body('SB-005').every((x) => Array.isArray(x.items) && x.items.length >= 2 && x.items.every((t) => t.length <= 190) && x.text === x.items.join(' ')));
ok('body text has no citation inside the sentences (no author-year, no chapter 2 section)', D.bank.every((m) => body(m.sb).every((x) => !/ข้อ 2\.\d|\b(19|20)\d{2}\b|GADRRRES|McKinsey|Hrebiniak|Liou|ISO/.test(x.text))));
const t0 = body('SB-005')[0].text;
ok('situation states the school, the hazard, the risk, readiness and the R group in plain words', /โรงเรียนทดสอบ/.test(t0) && /ด้านความรุนแรง/.test(t0) && /ความเสี่ยงระดับสูง/.test(t0) && /12\.50 จากเต็ม 25/.test(t0) && /ความพร้อมระดับต่ำ/.test(t0) && /กลุ่มแนวทาง R3 คือ ควบคุมก่อน/.test(t0));
ok('why-part states the 7-S gap rank when the element is in the top three, and says so when it is not', /ช่องว่างอันดับ 1/.test(body('SB-005')[1].text) && /ไม่ใช่ช่องว่างอันดับต้น/.test(body('SB-005', { top: false })[1].text) && !/ช่องว่างอันดับ \d/.test(body('SB-005', { top: false })[1].text));
const t1 = body('SB-005')[1].text;
ok('why-part names the measure, its type in plain words, its expected outcome and the MOE item', t1.indexOf('"' + sb('SB-005').name + '"') >= 0 && /เป็นมาตรการ(ป้องกัน|ปลูกฝัง|จัดการเมื่อเกิดเหตุ) คือ/.test(t1) && t1.indexOf(sb('SB-005').outcome) >= 0 && /ของกระทรวงศึกษาธิการ ข้อ 3/.test(t1) && !/ของกระทรวงศึกษาธิการ ข้อ/.test(body('SB-005', { moe: [] })[1].text));
ok('online measures mention the online dimension in plain words, other measures do not', /รวมมิติออนไลน์ไว้ด้วย/.test(body('SB-006')[1].text) && !/ออนไลน์/.test(body('SB-003')[1].text));
ok('response and recovery measures say they must handle and recover from incidents', /รับมือและฟื้นฟูอย่างเป็นระบบ/.test(body('SB-011')[1].text) && !/รับมือและฟื้นฟู/.test(body('SB-003')[1].text));
const t2 = body('SB-005')[2].text;
ok('design part explains why the plan names owner, resources, KPI and review, and says Thai studies are not proof of effect', /ผู้รับผิดชอบ ทรัพยากร ตัวชี้วัด และรอบทบทวน/.test(t2) && /ไม่ใช่หลักฐานว่ามาตรการนี้ได้ผลในโรงเรียนอื่น/.test(t2));
const t3 = body('SB-049')[3].text;
ok('evidence part gives the grade in plain words, the number of sources, and tells the school to measure its own results', /ระดับ B มีงานวิจัยรองรับบางส่วน/.test(t3) && /อ้างอิง 2 แหล่ง/.test(t3) && /วัดผลด้วยตัวชี้วัดของตนเอง/.test(t3));
ok('each grade has its own plain wording', ['A', 'B', 'C', 'D'].every((g) => { const m = D.bank.find((x) => x.evg === g); return m && body(m.sb)[3].text.indexOf('ระดับ ' + g + ' ') >= 0; }) && new Set(['A', 'B', 'C', 'D'].map((g) => body(D.bank.find((x) => x.evg === g).sb)[3].items[0].replace(/ \(อ้างอิง.*$/, ''))).size === 4);
const nt = note('SB-049').text;
ok('source note lists the author, year and chapter 2 section of each basis, labelled by topic', /วัดความเสี่ยง: ISO \(2018\) ข้อ 2\.4/.test(nt) && /ประเมินความพร้อม 7-S: McKinsey \(2008\) ข้อ 2\.2/.test(nt) && /ประเภท 3 ป\. และขอบข่ายภัย: กระทรวงศึกษาธิการ \(2564\) ข้อ 2\.3\.5/.test(nt) && /GADRRRES \(2022\) ข้อ 2\.3\.2/.test(nt) && /โครงสร้างแผน: Hrebiniak \(2006\) ข้อ 2\.8/.test(nt) && /Langford และคณะ \(2015\) ข้อ 2\.9\.4/.test(nt) && /ข้อ 2\.9\.1/.test(nt));
ok('source note adds the MOE announcement, the online studies and the crisis model only where they apply', /ประกาศกระทรวงศึกษาธิการ.*ข้อ 3/.test(note('SB-005').text) && !/ประกาศกระทรวงศึกษาธิการ/.test(note('SB-005', { moe: [] }).text) && /Cosma et al\. \(2024\)|Cosma/.test(note('SB-006').text) && /ไม่ใช่หลักฐานว่ามาตรการได้ผล/.test(note('SB-006').text) && !/Cosma/.test(note('SB-005').text) && /Liou \(2015\) ข้อ 2\.7/.test(note('SB-011').text) && !/Liou/.test(note('SB-003').text));
ok('a measure without sources says nothing about sources in the evidence part', D.bank.filter((m) => !String(m.evsrc || '').trim()).every((m) => !/อ้างอิง \d+ แหล่ง/.test(body(m.sb)[3].text) && !/หลักฐานของผลมาตรการ:/.test(note(m.sb).text)));
ok('every measure gets a note with only chapter 2 citations and no placeholder text', D.bank.every((m) => { const n = note(m.sb).text; return !/undefined|NaN/.test(n) && !/ยังไม่อยู่ในบทที่ 2/.test(n) && (n.match(/ข้อ 2\.\d/g) || []).length >= 6; }));
ok('rationale never claims proven success', D.bank.every((m) => !/พิสูจน์แล้ว|ได้ผลแน่นอน|แก้ปัญหาได้แน่นอน|ยืนยันผลแล้ว/.test(txt(EV.rationale(m, ctx())))));
eq('srcLine for the whole-plan measure lists short citations with chapter 2 sections', EV.srcLine(sb('SB-049')).split('; ').slice(0, 5), ['GADRRRES, 2022 (2.3.2)', 'กระทรวงศึกษาธิการ, 2564 (2.3.5)', 'ISO, 2018 (2.4)', 'McKinsey, 2008 (2.2)', 'Hrebiniak, 2006 (2.8)']);
ok('srcLine also lists the evidence source with its chapter 2 section', EV.srcLine(sb('SB-049')).indexOf('Langford และคณะ, 2015 (2.9.4)') >= 0);

// ---------- ถ้อยคำไม่เกินหลักฐาน ----------
ok('grades C and D tell the school to pilot or consult an expert', /นำร่อง/.test(EV.EVG.C[2]) && /ปรึกษาผู้เชี่ยวชาญ/.test(EV.EVG.D[2]));
ok('grade A and B texts require the school to measure its own results', /วัดตัวชี้วัดของโรงเรียนเอง/.test(EV.EVG.A[2]) && /ติดตามผล/.test(EV.EVG.B[2]));
const text = JSON.stringify([EV.EVG, D.bank.map((m) => EV.basis(m).map((b) => b.text))]);
ok('no wording claims proven success', !/พิสูจน์แล้ว|ได้ผลแน่นอน|แก้ปัญหาได้แน่นอน|ยืนยันผลแล้ว/.test(text));

console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
