// ทดสอบแผนดำเนินการรายมาตรการ (actplan.js): 7 ขั้นเรียงตามเวลา ใช้ข้อมูลของมาตรการจริง ไม่มีค่าว่างหรือ undefined และไม่อ้างผลเกินจริง  รัน: node tests/test_actplan.js
const path = require('path');
const root = path.join(__dirname, '..');
const D = require(path.join(root, 'data.js')), A = require(path.join(root, 'actplan.js'));
let checks = 0, fails = 0;
const ok = (n, c, i) => { checks++; if (!c) { fails++; console.log('FAIL', n, i === undefined ? '' : i); } };
const eq = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a) + ' != ' + JSON.stringify(b));
const sb = (id) => D.bank.find((x) => x.sb === id);
const ctx = { review: 'ทุกเดือน', start: 'ภายใน 1 สัปดาห์' };
const weeks = (when) => { const m = /(\d+)(?:–(\d+))?$/.exec(when); return m ? [+m[1], +(m[2] || m[1])] : null; };

ok('every measure gets 6 steps', D.bank.every((m) => A.steps(m, ctx).length === 6));
ok('no step has an empty or undefined field', D.bank.every((m) => A.steps(m, ctx).every((x) => ['when', 'what', 'brief', 'who', 'out'].every((k) => x[k] && !/undefined|NaN|null/.test(x[k])))));
ok('week ranges never go backwards and never start before week 1', D.bank.every((m) => { const w = A.steps(m, ctx).slice(0, 5).map((x) => weeks(x.when)); return w.every((r) => r && r[0] >= 1 && r[0] <= r[1]) && w.every((r, i) => i === 0 || r[0] >= w[i - 1][0]); }));
ok('plan length follows the resource level (4, 8 and 12 weeks)', [1, 2, 3].every((lv) => D.bank.filter((m) => m.res === lv).every((m) => weeks(A.steps(m, ctx)[4].when)[1] === A.TOTAL[lv])));
ok('the last step is measurement and review with the review cycle of the group', D.bank.every((m) => { const s = A.steps(m, ctx)[5]; return /ทุกเดือน/.test(s.when) && s.what.indexOf(m.kpi) >= 0; }));

const s2 = A.steps(sb('SB-002'), ctx);   // มีเงื่อนไขก่อนดำเนินการ
ok('a measure with a prerequisite checks it in step 1', s2[0].what.indexOf(sb('SB-002').prereq) >= 0 && /เงื่อนไข/.test(s2[0].out));
const s1 = A.steps(sb('SB-001'), ctx);   // ไม่มีเงื่อนไข
ok('book brief lists the prerequisite measure codes', /SB-052/.test(A.steps(sb('SB-011'), ctx)[0].brief) && A.steps(sb('SB-001'), ctx)[0].brief === 'ประชุมมอบหมายงาน');
ok('a measure without a prerequisite says it can start at once', /เริ่มได้ทันที/.test(s1[0].what) && s1[0].out.indexOf('เงื่อนไข') < 0);
ok('the main activity step quotes the measure description and the output step quotes the output', D.bank.every((m) => { const s = A.steps(m, ctx); return s[2].what.indexOf(m.desc) >= 0 && s[4].what.indexOf(m.output) >= 0 && s[4].out === m.output; }));
ok('resources step carries the resource note of its level', [1, 2, 3].every((lv) => D.bank.filter((m) => m.res === lv).every((m) => A.steps(m, ctx)[1].what.indexOf(A.RESNOTE[lv]) >= 0)));
ok('each phase has its own testing step', ['ป้องกัน', 'เตรียมพร้อม', 'ตอบสนอง', 'ฟื้นฟู'].map((p) => A.steps(D.bank.find((m) => m.phase === p), ctx)[3].what).every((t, i, a) => a.indexOf(t) === i));
ok('recovery measures test with simulated cases, not real student data', /ไม่ใช้ข้อมูลจริงของนักเรียน/.test(A.steps(D.bank.find((m) => m.phase === 'ฟื้นฟู'), ctx)[3].what));
ok('owner is named in every step that has an owner column', D.bank.every((m) => A.steps(m, ctx).every((x) => x.who.indexOf(m.owner) >= 0 || x.who === 'ผู้อำนวยการ')));
ok('works without a context object', A.steps(sb('SB-001')).length === 6 && /ตามรอบทบทวน/.test(A.steps(sb('SB-001'))[5].when));
ok('no wording promises success', D.bank.every((m) => !/ได้ผลแน่นอน|พิสูจน์แล้ว|รับรองผล|ปลอดภัย 100/.test(JSON.stringify(A.steps(m, ctx)))));

console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
