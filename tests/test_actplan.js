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
const gen = (m) => Object.assign({}, m, { sb: '' });   // ไม่มีรหัสคลัง จึงใช้กรอบทั่วไปตามช่วง
ok('without specific steps the generic frame quotes the description and the output', D.bank.every((m) => { const s = A.steps(gen(m), ctx); return s[2].what.indexOf(m.desc) >= 0 && s[4].what.indexOf(m.output) >= 0 && s[4].out === m.output; }));
ok('with specific steps the output step still delivers the measure output', D.bank.every((m) => A.steps(m, ctx)[4].out === m.output));
ok('resources step carries the resource note of its level', [1, 2, 3].every((lv) => D.bank.filter((m) => m.res === lv).every((m) => A.steps(m, ctx)[1].what.indexOf(A.RESNOTE[lv]) >= 0)));
ok('each phase has its own generic testing step', ['ป้องกัน', 'เตรียมพร้อม', 'ตอบสนอง', 'ฟื้นฟู'].map((p) => A.steps(gen(D.bank.find((m) => m.phase === p)), ctx)[3].what).every((t, i, a) => a.indexOf(t) === i));
ok('generic recovery frame tests with simulated cases, not real student data', /ไม่ใช้ข้อมูลจริงของนักเรียน/.test(A.steps(gen(D.bank.find((m) => m.phase === 'ฟื้นฟู')), ctx)[3].what));
ok('owner is named in every step that has an owner column', D.bank.every((m) => A.steps(m, ctx).every((x) => x.who.indexOf(m.owner) >= 0 || x.who === 'ผู้อำนวยการ')));
ok('works without a context object', A.steps(sb('SB-001')).length === 6 && /ตามรอบทบทวน/.test(A.steps(sb('SB-001'))[5].when));
ok('no wording promises success', D.bank.every((m) => !/ได้ผลแน่นอน|พิสูจน์แล้ว|รับรองผล|ปลอดภัย 100/.test(JSON.stringify(A.steps(m, ctx)))));


// ---------- ขั้นตอนเฉพาะรายมาตรการ (actsteps.js) ----------
const AS = require(path.join(root, 'actsteps.js'));
eq('68 measures have specific steps and none extra', Object.keys(AS.S).sort(), D.bank.map((m) => m.sb).sort());
ok('every measure has exactly 3 steps written as "heading: detail"', D.bank.every((m) => AS.get(m.sb).length === 3 && AS.get(m.sb).every((x) => /^[^:]{4,40}: .{20,}$/.test(x))));
ok('step text fits the one-page plan (at most 140 characters)', D.bank.every((m) => AS.get(m.sb).every((x) => x.length <= 140)));
ok('every measure code mentioned in a step exists in the bank', Object.values(AS.S).every((v) => (v.join(' ').match(/SB-\d{3}/g) || []).every((c) => D.bank.some((m) => m.sb === c))));
ok('a step never points to its own measure', D.bank.every((m) => AS.get(m.sb).join(' ').indexOf(m.sb) < 0));
ok('no two measures share the same main activity text', new Set(D.bank.map((m) => AS.get(m.sb)[0])).size === D.bank.length);
ok('plan rows 3 to 5 use the specific steps and keep the generic rows around them', D.bank.every((m) => { const r = A.steps(m, ctx), c = AS.get(m.sb); return r[2].what === c[0] && r[3].what === c[1] && r[4].what === c[2] && /^ประชุมชี้แจง/.test(r[0].what) && /^วัดผล/.test(r[5].what); }));
ok('book brief uses the heading of the specific step and the output of the measure', D.bank.every((m) => { const r = A.steps(m, ctx); return r[2].brief === AS.head(AS.get(m.sb)[0]) && r[4].brief.indexOf(m.output) >= 0; }));
ok('recovery and response measures that handle personal data keep the sensitive-record wording', ['SB-046', 'SB-064', 'SB-067', 'SB-068'].every((id) => /(จำกัดสิทธิ์|ที่จำกัด|ความลับ|ไม่ใช้ข้อมูลจริง|ไม่ระบุตัว)/.test(AS.get(id).join(' '))));
ok('measures about law, data and mental health tell the school to consult an expert or the parent body', ['SB-025', 'SB-026', 'SB-037', 'SB-068'].every((id) => /ปรึกษา|ต้นสังกัด|ฝ่ายกฎหมาย|หน่วยงานสาธารณสุข|ผู้เชี่ยวชาญ|หน่วยสาธารณสุข/.test(AS.get(id).join(' '))));
ok('specific steps never promise results', Object.values(AS.S).every((v) => !/ได้ผลแน่นอน|รับรองผล|ปลอดภัย 100|พิสูจน์แล้ว/.test(v.join(' '))));

console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
