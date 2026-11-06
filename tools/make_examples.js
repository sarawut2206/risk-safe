// สร้างไฟล์ตัวอย่าง "สมมติ" สำหรับทดสอบห้องวิเคราะห์ (ทุกไฟล์มี synthetic:true และหน้าเว็บแสดงแถบเตือนเมื่อมีไฟล์เหล่านี้)
// ข้อมูลทั้งหมดสุ่มด้วยเมล็ดคงที่ ไม่ใช่ข้อมูลโรงเรียน ผู้เชี่ยวชาญ หรือผู้บริหารจริง และไม่ใช่ผลวิจัย
// รัน: node tools/make_examples.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const data = require(path.join(root, 'data.js')), E = require(path.join(root, 'engine.js')), Dc = require(path.join(root, 'decision.js')), L = require(path.join(root, 'learn.js')), V = require(path.join(root, 'evalkit.js'));
const dir = path.join(root, 'examples'); fs.mkdirSync(dir, { recursive: true });
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(777), pick = (a) => a[Math.floor(rnd() * a.length)], clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const names = [];
const write = (name, obj) => { fs.writeFileSync(path.join(dir, name), JSON.stringify(obj, null, 1) + '\n'); names.push(name); };

// รายงานโรงเรียนสมมติ 8 แห่ง: ข้อมูลตั้งต้นจากโรงเรียนตัวอย่างในเว็บ ปรับคะแนนเล็กน้อย แล้วจำลองผลหลังดำเนินการแบบสุ่ม
const base = { risk: data.example.risk, seven: data.example.seven, resource: data.example.resource };
for (let i = 1; i <= 8; i++) {
  const code = 'S' + String(i).padStart(2, '0');
  const jitter = (obj, lo, hi) => { const o = {}; Object.keys(obj).forEach((k) => { o[k] = obj[k].map((v) => clamp(v + (rnd() < 0.35 ? (rnd() < 0.5 ? -1 : 1) : 0), lo, hi)); }); return o; };
  const pre = { risk: jitter(base.risk, 1, 5), seven: jitter(base.seven, 1, 5), resource: pick(['จำกัด', 'ปานกลาง', 'เพียงพอ']) };
  const out0 = E.analyze(pre, data, null, { guard: Dc.guard });
  const post = { risk: pre.risk, seven: {}, resource: pre.resource };
  Object.keys(pre.seven).forEach((k) => { post.seven[k] = [clamp(pre.seven[k][0] + (rnd() < 0.5 ? 1 : 0), 1, 5), pre.seven[k][1]]; });
  const out1 = E.analyze(post, data, null, { guard: Dc.guard });
  const status = {}, logs = {};
  out0.domains.forEach((d) => d.measures.forEach((m) => {
    const key = d.code + ':' + m.id, r = rnd();
    status[key] = r < 0.6 ? 'เสร็จแล้ว' : r < 0.85 ? 'กำลังดำเนินการ' : 'ยังไม่เริ่ม';
    if (status[key] !== 'ยังไม่เริ่ม') logs[key] = { fidelity: pick([50, 75, 100, 100]), costLevel: clamp(m.res + (rnd() < 0.2 ? 1 : 0), 1, 3), effect: pick([2, 3, 3, 4, 4, 5]), kpiBefore: 10, kpiAfter: rnd() < 0.65 ? 6 : 12, kpiDir: 'down', barriers: rnd() < 0.3 ? [pick(['B1', 'B2', 'B3', 'B5'])] : [], repeat: pick(['ใช่', 'ใช่', 'ไม่แน่ใจ']) };
  }));
  const track = { code, arm: i <= 4 ? 'intervention' : 'comparison', snaps: [L.makeSnapshot(out0, 'ก่อนเริ่ม', '2026-01-15T00:00:00Z'), L.makeSnapshot(out1, 'รอบที่ 1', '2026-06-15T00:00:00Z')], logs, status, custom: i % 2 ? [{ dom: 'V', elem: 'SYS', name: 'ระบบเพื่อนช่วยเพื่อนช่วงพักกลางวัน', effect: 4, desc: '' }] : [] };
  write('synthetic-school-' + code + '.json', L.makeReport(track, { students: String(pick([90, 300, 532, 900, 1700])), year: '2569', province: '' }, out0, { synthetic: true }));
}

// ผู้เชี่ยวชาญสมมติ 9 คน: ส่วนมากตอบตรงกับระบบ บางกรณีคลาดเคลื่อน 1 ระดับ
const cases = V.makeCases(data.domains), LV = ['ต่ำ', 'กลาง', 'สูง'];
const shift = (l) => { const i = LV.indexOf(l); return LV[clamp(i + (rnd() < 0.5 ? -1 : 1), 0, 2)]; };
for (let i = 1; i <= 9; i++) {
  const f = { schema: V.SCHEMA_EXPERT, version: 1, synthetic: true, caseSet: V.CASESET, code: 'E' + String(i).padStart(2, '0'), field: pick(['ความปลอดภัยและการจัดการภัยพิบัติ', 'การบริหารการศึกษา', 'สุขภาพจิตและการคุ้มครองเด็ก']), createdAt: '2026-01-01T00:00:00Z', cases: {}, items: {}, comment: '' };
  cases.forEach((c) => { const wrongR = rnd() < 0.15, wrongY = rnd() < 0.15; f.cases[c.id] = { risk: wrongR ? shift(c.sys.risk) : c.sys.risk, ready: wrongY ? shift(c.sys.ready) : c.sys.ready, fit: clamp(pick([3, 4, 4, 5, 5]) - (wrongR || wrongY ? 1 : 0), 1, 5) }; });
  V.EXPERT_ITEMS.forEach((it) => { f.items[it.id] = pick([3, 4, 4, 4, 5, 5]); });
  write('synthetic-expert-' + f.code + '.json', f);
}
// ผู้บริหารสมมติ 10 คน
for (let i = 1; i <= 10; i++) {
  const f = { schema: V.SCHEMA_ADMIN, version: 1, synthetic: true, code: 'A' + String(i).padStart(2, '0'), createdAt: '2026-01-01T00:00:00Z', items: {}, sus: {}, comment: '' };
  V.ADMIN_ASPECTS.forEach((a) => a.items.forEach((q) => { f.items[q[0]] = pick([3, 4, 4, 4, 5]); }));
  V.SUS_ITEMS.forEach((q, k) => { f.sus[q[0]] = (k + 1) % 2 ? pick([3, 4, 4, 5]) : pick([1, 2, 2, 3]); });
  write('synthetic-admin-' + f.code + '.json', f);
}
fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(names, null, 1) + '\n');
console.log('สร้าง ' + names.length + ' ไฟล์ใน examples/');
