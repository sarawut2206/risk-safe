// ทดสอบตรรกะฝั่งตัวรับข้อมูล (apps-script/collect.gs) โดยโหลดไฟล์ในสภาพแวดล้อมจำลอง ไม่แตะบริการของ Google  รัน: node tests/test_collect_server.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const data = require(path.join(root, 'data.js')), C = require(path.join(root, 'collect.js'));
const ctx = { console, JSON, Math, Number, String, Object, Array, Date, isFinite }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'apps-script', 'collect.gs'), 'utf8'), ctx, { filename: 'collect.gs' });
let checks = 0, fails = 0;
const ok = (n, c, i) => { checks++; if (!c) { fails++; console.log('FAIL', n, i === undefined ? '' : i); } };
const items = { risk: data.riskItems.map((r) => r.id), seven: data.sevenItems.map((r) => r.id) }, MODES = ['tryout', 'live'];
const ans = () => { const a = C.blank.questionnaire(); Object.assign(a.part1, { students: '500', staff: '30', year: '2569', stratum: 'BKK1', safetyOfficer: 'มี', counselor: 'ไม่มี', budget: C.BUDGET[1], resource: 'ปานกลาง' }); data.riskItems.forEach((it) => { a.risk[it.id] = [3, 3]; }); data.sevenItems.forEach((it) => { a.seven[it.id] = [3, 4]; }); return a; };
const pk = (form, m, a) => C.pack(form, Object.assign({ school: 'S001', respondent: 'R1', consent: true, mode: 'live' }, m || {}), a);
const mkEnv = (roster) => { const raw = [], st = {}; return { roster, now: () => '2026-01-01T00:00:00Z', appendRaw: (r) => raw.push(r), upsertStatus: (s, col, ts) => { (st[s] = st[s] || {})[col] = ts; }, readStatus: (s) => st[s] || null, raw, st }; };
const post = (p, env, pin) => ctx.handlePost_(JSON.stringify({ pin, payload: p }), env, items, MODES);
// ผ่านเมื่อถูกต้อง
let env = mkEnv([{ code: 'S001', pin: '1234' }]); let r = post(pk('questionnaire', {}, ans()), env, '1234');
ok('valid submission accepted', r.ok && /^RC-/.test(r.receipt), JSON.stringify(r)); ok('raw row appended', env.raw.length === 1 && env.raw[0][1] === 'S001'); ok('status updated for respondent', !!env.st.S001.R1);
// รหัสผ่านและรายชื่อ
ok('wrong pin rejected', !post(pk('questionnaire', {}, ans()), mkEnv([{ code: 'S001', pin: '1234' }]), '0000').ok); ok('unknown school rejected', !post(pk('questionnaire', { school: 'S999' }, ans()), mkEnv([{ code: 'S001', pin: '' }]), '').ok);
ok('no pin required when roster pin empty', post(pk('questionnaire', {}, ans()), mkEnv([{ code: 'S001', pin: '' }]), '').ok); ok('no roster means open (try-out)', post(pk('questionnaire', {}, ans()), mkEnv([]), '').ok);
// ตรวจเนื้อข้อมูลฝั่งเซิร์ฟเวอร์ (ไม่เชื่อสิ่งที่ฝั่งเบราว์เซอร์ตรวจแล้ว: ปลอมแพ็กเองโดยไม่ผ่าน pack)
const forge = (fn) => { const a = ans(); fn(a); const p = { schema: C.SCHEMA, version: 1, form: 'questionnaire', mode: 'live', school: 'S001', respondent: 'R1', consent: { accepted: true }, answers: a, receipt: 'RC-X' }; return !post(p, mkEnv([]), '').ok; };
ok('rating out of range rejected', forge((a) => { a.risk.V1 = [6, 3]; })); ok('missing 7-S item rejected', forge((a) => { delete a.seven.STG1; })); ok('bad stratum rejected', forge((a) => { a.part1.stratum = 'XX'; }));
ok('overlong free text rejected', forge((a) => { a.part4.need = 'ก'.repeat(601); })); ok('non-integer students rejected', forge((a) => { a.part1.students = '12.5'; }));
ok('consent required', !post(pk('questionnaire', { consent: false }, ans()), mkEnv([]), '').ok); ok('demo mode not accepted', !post(pk('questionnaire', { mode: 'demo' }, ans()), mkEnv([]), '').ok);
ok('bad respondent rejected', !post(pk('questionnaire', { respondent: 'R9' }, ans()), mkEnv([]), '').ok); ok('foreign payload rejected', !ctx.handlePost_(JSON.stringify({ payload: { schema: 'x' } }), mkEnv([]), items, MODES).ok); ok('garbage body rejected', !ctx.handlePost_('not json', mkEnv([]), items, MODES).ok);
ok('oversize payload rejected', !ctx.handlePost_(JSON.stringify({ payload: Object.assign(pk('questionnaire', {}, ans()), { pad: 'x'.repeat(70000) }) }), mkEnv([]), items, MODES).ok);
// แบบฟอร์มที่ 2 และ 3
ok('incidents accepted', post(pk('incidents', { respondent: '' }, { year: '2569', noSystem: false, V: '1', A: '0', P: '2', H: '3' }), mkEnv([]), '').ok); ok('incidents no-system accepted', post(pk('incidents', { respondent: '' }, { year: '2569', noSystem: true, V: '', A: '', P: '', H: '' }), mkEnv([]), '').ok);
ok('incidents negative rejected', !post(pk('incidents', { respondent: '' }, { year: '2569', noSystem: false, V: '-1', A: '0', P: '2', H: '3' }), mkEnv([]), '').ok); ok('no-system with counts rejected', !post(pk('incidents', {}, { year: '2569', noSystem: true, V: '1', A: '', P: '', H: '' }), mkEnv([]), '').ok);
ok('documents accepted', post(pk('documents', { respondent: '' }, { items: { D1: 'มี', D2: 'ไม่มี', D3: 'กำลังจัดทำ', D4: 'มี', D5: 'มี' }, years: {} }), mkEnv([]), '').ok); ok('documents incomplete rejected', !post(pk('documents', {}, { items: { D1: 'มี' }, years: {} }), mkEnv([]), '').ok);
// สถานะ
env = mkEnv([{ code: 'S001', pin: '1234' }]); post(pk('questionnaire', { respondent: 'R1' }, ans()), env, '1234'); post(pk('questionnaire', { respondent: 'R2' }, ans()), env, '1234'); post(pk('incidents', { respondent: '' }, { year: '2569', noSystem: true, V: '', A: '', P: '', H: '' }), env, '1234');
let s = ctx.statusOf_('s001', '1234', env); ok('status counts', s.ok && s.questionnaire === 2 && s.incidents === true && s.documents === false, JSON.stringify(s)); ok('status wrong pin rejected', !ctx.statusOf_('S001', 'x', env).ok); ok('status does not leak answers', Object.keys(s).sort().join() === 'documents,incidents,ok,questionnaire');
// ค่าคงที่ฝั่งเซิร์ฟเวอร์ต้องตรงกับฝั่งเบราว์เซอร์
const same = (name, v) => JSON.stringify(vm.runInContext(name, ctx)) === JSON.stringify(v);
ok('server enums match the browser module', same('STRATA', C.STRATA.map((x) => x[0])) && same('RESOURCE', C.RESOURCE) && same('DOC_STATUS', C.DOC_STATUS) && same('DOC_IDS', C.DOCS.map((x) => x[0])) && same('ROLES', C.ROLES.map((x) => x[0])) && same('YESNO', C.YESNO));
console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
