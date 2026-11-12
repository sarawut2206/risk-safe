// ทดสอบชุดเอกสารประกอบแผน 6 ฉบับ (actdocs.js): ตรงกับ "ผลที่ได้" ของแผนดำเนินการ 6 ขั้น เติมข้อมูลของมาตรการจริง และบอกว่าต้องกรอกส่วนใดในโปรแกรม  รัน: node tests/test_actdocs.js
const path = require('path');
const root = path.join(__dirname, '..');
const D = require(path.join(root, 'data.js')), A = require(path.join(root, 'actdocs.js')), ACT = require(path.join(root, 'actplan.js')), PR = require(path.join(root, 'planrec.js'));
let checks = 0, fails = 0;
const ok = (n, c, i) => { checks++; if (!c) { fails++; console.log('FAIL', n, i === undefined ? '' : i); } };
const eq = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a) + ' != ' + JSON.stringify(b));
const sb = (id) => D.bank.find((x) => x.sb === id);
const ctx = { hz: 'ความรุนแรง', group: 'R1', review: 'ทุกเดือน', start: 'ภายใน 1 สัปดาห์', bank: D.bank };
const of = (m) => A.docs(m, ctx);
const flat = (dc) => JSON.stringify(dc.blocks);

ok('every measure gets 6 documents numbered 1 to 6', D.bank.every((m) => of(m).map((x) => x.n).join() === '1,2,3,4,5,6' && of(m).map((x) => x.code).join() === 'D1,D2,D3,D4,D5,D6'));
ok('document n produces exactly the output of plan step n', D.bank.every((m) => { const st = ACT.steps(m, { review: ctx.review, start: ctx.start }); return of(m).every((dc, i) => dc.produces === st[i].out && dc.when === st[i].when); }));
ok('no document contains an undefined value, and a null appears only as a blank line in a key-value row', D.bank.every((m) => !/undefined|NaN/.test(JSON.stringify(of(m))) && of(m).every((dc) => dc.blocks.every((b) => b.t === 'kv' || !/\bnull\b/.test(JSON.stringify(b))))));
ok('every document has a title, blocks, a signature block and a pointer to the online form', D.bank.every((m) => of(m).every((dc) => dc.title.length > 8 && dc.blocks.length >= 4 && dc.blocks.some((b) => b.t === 'sign' && b.who.length === 3) && /ส่วนที่ [2-8]/.test(dc.web))));
ok('every document names the measure and its code', D.bank.every((m) => of(m).every((dc) => flat(dc).indexOf(JSON.stringify(m.name).slice(1, -1)) >= 0 && flat(dc).indexOf(m.sb) >= 0)));
// เนื้อหาเฉพาะฉบับ
const m11 = sb('SB-011'), d11 = of(m11);
ok('document 1 lists each prerequisite measure with its name and a yes/no check', (() => { const t = d11[0].blocks.find((b) => b.t === 'table' && b.head[0] === 'เงื่อนไข'); return t && t.rows.length === 2 && t.rows[0][0].indexOf('SB-052') === 0 && t.rows[0][0].indexOf(sb('SB-052').name) > 0 && /\[ \] มีแล้ว/.test(t.rows[0][1]); })());
ok('document 1 says so when there is no prerequisite', /เริ่มได้ทันที/.test(flat(of(sb('SB-001'))[0])) && !of(sb('SB-001'))[0].blocks.some((b) => b.t === 'table' && b.head[0] === 'เงื่อนไข'));
ok('document 2 turns the resource text into rows and keeps the resource level note', (() => { const t = d11[1].blocks.find((b) => b.t === 'table' && b.head[0] === 'รายการ'); return t && t.rows.slice(0, 3).map((r) => r[0]).join('|') === 'แผนซักซ้อม|เวลา 1–2 ชั่วโมง|อุปกรณ์สื่อสาร' && flat(d11[1]).indexOf(ACT.RESNOTE[2]) > 0; })());
ok('resource rows never split a number from its unit', D.bank.every((m) => A.split(m.resources).every((x) => !/^\d+$/.test(x) && !/^(วัน|ชั่วโมง|ครั้ง|คน)/.test(x))));
ok('document 3 is titled with the output and shows the measure-specific step text', d11[2].title === 'แบบร่างผลงาน: ' + m11.output && d11[2].blocks.some((b) => b.t === 'box' && b.text === require(path.join(root, 'actsteps.js')).get('SB-011')[0].replace(/^[^:]*:\s*/, '')));
ok('document 4 is named after the test method of the phase', ['ป้องกัน', 'เตรียมพร้อม', 'ตอบสนอง', 'ฟื้นฟู'].every((p) => { const m = D.bank.find((x) => x.phase === p); return of(m)[3].title === 'บันทึกผลการ' + A.TRY_LABEL[p]; }));
ok('recovery measures warn not to use real student data', D.bank.filter((m) => m.phase === 'ฟื้นฟู').every((m) => /ห้ามใช้ข้อมูลจริงของนักเรียน/.test(flat(of(m)[3]))) && !D.bank.filter((m) => m.phase !== 'ฟื้นฟู').some((m) => /ห้ามใช้ข้อมูลจริงของนักเรียน/.test(flat(of(m)[3]))));
ok('document 5 has the communication and evidence registers with the measure output', (() => { const t = of(sb('SB-052'))[4].blocks.filter((b) => b.t === 'table'); return t.length === 2 && t[1].rows[0][0] === sb('SB-052').output && t[0].rows.length === 3; })());
ok('document 6 carries the KPI, the review cycle and the expected outcome', D.bank.every((m) => { const f = flat(of(m)[5]); return f.indexOf(m.kpi) >= 0 && f.indexOf('ทุกเดือน') >= 0 && f.indexOf(m.outcome) >= 0; }));
// ตรงกับหน้ากรอกออนไลน์
ok('the online section named on each document exists in the online form (sections 2 to 8)', D.bank.every((m) => of(m).every((dc) => (dc.web.match(/ส่วนที่ (\d)/g) || []).every((x) => +x.replace(/\D/g, '') >= 2 && +x.replace(/\D/g, '') <= 9))));
ok('documents 1 to 5 point at the plan steps and document 6 at KPI and situation', of(m11)[0].web.indexOf('ขั้น 1') > 0 && of(m11)[4].web.indexOf('ขั้น 5') > 0 && /ส่วนที่ 3/.test(of(m11)[5].web) && /ส่วนที่ 5/.test(of(m11)[5].web));
ok('the KPI result and situation choices match the online form options', PR.KPI_MET.every((x) => flat(of(m11)[5]).indexOf(x) >= 0) && PR.CHANGE.every((x) => flat(of(m11)[5]).indexOf(x) >= 0));
ok('the step status choices on document 4 follow the safety rule of not claiming results', D.bank.every((m) => !/ได้ผลแน่นอน|รับรองผล|พิสูจน์แล้ว/.test(JSON.stringify(of(m)))));
ok('documents never ask for a student name field', D.bank.every((m) => !/ชื่อนักเรียน.*:\s*\.\.\./.test(JSON.stringify(of(m)))) && D.bank.every((m) => of(m).filter((dc) => dc.code !== 'D1').every((dc) => !dc.blocks.some((b) => b.t === 'table' && b.head.indexOf('ชื่อ–สกุล') >= 0))));
ok('works with no context', A.docs(sb('SB-001')).length === 6);
console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
