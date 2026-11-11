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

// ---------- หลักการและเหตุผลของแผน (rationale) ----------
const ctx = (o) => Object.assign({ school: 'โรงเรียนทดสอบ', hz: 'ความรุนแรง', risk: 'สูง', rd: '12.50', ready: 'ต่ำ', group: 'R3', pkgName: 'ควบคุมก่อน', pkgSummary: 'สรุปกลุ่ม', top: true, rank: 1, pni: '0.250', moe: [3] }, o || {});
const rat = (id, o) => EV.rationale(sb(id), ctx(o));
const shortYr = (k) => EV.lite(k).replace(/ \((\d{4})\)$/, ', $1');
eq('rationale has four parts in a fixed order', rat('SB-005').map((x) => x.lead), ['สถานการณ์ที่ระบบวิเคราะห์ได้', 'เหตุผลที่ต้องมีมาตรการนี้', 'เหตุผลที่วางแผนในรูปแบบนี้', 'งานวิจัยที่รองรับผลของมาตรการนี้']);
const t0 = rat('SB-005')[0].text;
ok('situation uses the school analysis and cites ISO and 7-S', /โรงเรียนทดสอบ/.test(t0) && /ความเสี่ยงระดับสูง/.test(t0) && /R 12\.50/.test(t0) && /ISO, 2018 · ข้อ 2\.4/.test(t0) && /McKinsey, 2008 · ข้อ 2\.2/.test(t0) && /กลุ่มแนวทาง R3/.test(t0));
ok('why-part states the 7-S gap rank when the element is in the top three, and says so when it is not', /ช่องว่างอันดับ 1/.test(rat('SB-005')[1].text) && /ไม่อยู่ใน 3 อันดับช่องว่างสูงสุด/.test(rat('SB-005', { top: false })[1].text) && !/ช่องว่างอันดับ/.test(rat('SB-005', { top: false })[1].text));
const t1 = rat('SB-005')[1].text;
ok('why-part cites the 3 P framework, the CSSF pillar and the MOE announcement item', /3 ป\./.test(t1) && /กระทรวงศึกษาธิการ, 2564 · ข้อ 2\.3\.5/.test(t1) && /GADRRRES, 2022 · ข้อ 2\.3\.2/.test(t1) && /ประกาศกระทรวงศึกษาธิการ.*ข้อ 3/.test(t1) && !/ประกาศกระทรวงศึกษาธิการ/.test(rat('SB-005', { moe: [] })[1].text));
ok('online measures cite the cyberbullying studies and say they do not prove the measure works', /Cosma et al\., 2024/.test(rat('SB-006')[1].text) && /ไม่ใช่หลักฐานว่ามาตรการนี้ได้ผล/.test(rat('SB-006')[1].text) && !/Cosma/.test(t1));
ok('response and recovery measures cite the crisis model', /Liou, 2015 · ข้อ 2\.7/.test(rat('SB-011')[1].text) && !/Liou/.test(rat('SB-003')[1].text));
const t2 = rat('SB-005')[2].text;
ok('design part cites implementation theory and the four Thai studies and says they are not proof of effect', /Hrebiniak, 2006 · ข้อ 2\.8/.test(t2) && EV.THAI.every((t) => t2.indexOf(shortYr(t.key)) >= 0) && /ข้อ 2\.9\.1/.test(t2) && /ไม่ใช่หลักฐานว่ามาตรการนี้ได้ผล/.test(t2));
const t3 = rat('SB-049')[3].text;
ok('evidence part gives the grade and cites each source with its chapter 2 section', /ระดับ B/.test(t3) && /Langford และคณะ, 2015 · ข้อ 2\.9\.4/.test(t3) && /GADRRRES, 2022 · ข้อ 2\.3\.2/.test(t3));
ok('a measure without sources says none were found, not that it is proven', D.bank.filter((m) => !String(m.evsrc || '').trim()).every((m) => /ไม่พบแหล่ง/.test(EV.rationale(m, ctx())[3].text)));
ok('every measure gets a rationale with only chapter 2 citations', D.bank.every((m) => { const t = EV.rationale(m, ctx()).map((x) => x.text).join(' '); return !/undefined|NaN/.test(t) && !/ยังไม่อยู่ในบทที่ 2/.test(t) && (t.match(/ข้อ 2\.\d/g) || []).length >= 6; }));
ok('rationale never claims proven success', D.bank.every((m) => !/พิสูจน์แล้ว|ได้ผลแน่นอน|แก้ปัญหาได้แน่นอน|ยืนยันผลแล้ว/.test(EV.rationale(m, ctx()).map((x) => x.text).join(' '))));
eq('srcLine for the whole-plan measure lists short citations with chapter 2 sections', EV.srcLine(sb('SB-049')).split('; ').slice(0, 5), ['GADRRRES, 2022 (2.3.2)', 'กระทรวงศึกษาธิการ, 2564 (2.3.5)', 'ISO, 2018 (2.4)', 'McKinsey, 2008 (2.2)', 'Hrebiniak, 2006 (2.8)']);
ok('srcLine also lists the evidence source with its chapter 2 section', EV.srcLine(sb('SB-049')).indexOf('Langford และคณะ, 2015 (2.9.4)') >= 0);

// ---------- ถ้อยคำไม่เกินหลักฐาน ----------
ok('grades C and D tell the school to pilot or consult an expert', /นำร่อง/.test(EV.EVG.C[2]) && /ปรึกษาผู้เชี่ยวชาญ/.test(EV.EVG.D[2]));
ok('grade A and B texts require the school to measure its own results', /วัดตัวชี้วัดของโรงเรียนเอง/.test(EV.EVG.A[2]) && /ติดตามผล/.test(EV.EVG.B[2]));
const text = JSON.stringify([EV.EVG, D.bank.map((m) => EV.basis(m).map((b) => b.text))]);
ok('no wording claims proven success', !/พิสูจน์แล้ว|ได้ผลแน่นอน|แก้ปัญหาได้แน่นอน|ยืนยันผลแล้ว/.test(text));

console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
