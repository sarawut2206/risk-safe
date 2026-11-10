// สร้างไฟล์ตัวอย่างสมมติสำหรับทดสอบแดชบอร์ดผู้วิจัยของระบบรวบรวมข้อมูล (ทุกไฟล์มี synthetic:true)
// ข้อมูลสุ่มด้วยเมล็ดคงที่ ไม่ใช่โรงเรียนจริง ไม่ใช่ผลวิจัย  รัน: node tools/make_collect_examples.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const data = require(path.join(root, 'data.js')), C = require(path.join(root, 'collect.js'));
const dir = path.join(root, 'examples'); fs.mkdirSync(dir, { recursive: true });
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(424242), pick = (a) => a[Math.floor(rnd() * a.length)], clamp = (x) => Math.max(1, Math.min(5, x));
const N = 16, strata = ['BKK1', 'BKK2', 'CEN1', 'CEN2'], names = [], roster = ['code,stratum,pin'];
for (let i = 1; i <= N; i++) {
  const code = 'S' + String(i).padStart(3, '0'), stratum = strata[(i - 1) % 4]; roster.push(code + ',' + stratum + ',' + (1000 + i));
  // ระดับฐานของโรงเรียน: ความเสี่ยงรายด้านและความพร้อมต่างกันเพื่อให้กระจายหลายช่อง R
  const riskBase = {}; data.domains.forEach((d) => { riskBase[d.code] = 1.3 + rnd() * 3.4; }); const dBase = 1.5 + rnd() * 3.2;
  const students = String(pick([180, 420, 650, 900, 1400])), staff = String(pick([14, 28, 45, 70]));
  const respondents = ['R1', 'R2', 'R3'].map((r) => {
    const a = C.blank.questionnaire(); Object.assign(a.part1, { students, staff, year: '2569', stratum, safetyOfficer: pick(['มี', 'มี', 'ไม่มี']), counselor: pick(['มี', 'ไม่มี']), budget: pick(C.BUDGET), resource: pick(C.RESOURCE) });
    data.riskItems.forEach((it) => { const b = riskBase[it.dom]; a.risk[it.id] = [clamp(Math.round(b + (rnd() - 0.5) * 2)), clamp(Math.round(b + (rnd() - 0.5) * 2))]; });
    data.sevenItems.forEach((it) => { const d = clamp(Math.round(dBase + (rnd() - 0.5) * 2.2)); a.seven[it.id] = [d, clamp(d + 1 + Math.floor(rnd() * 2))]; });
    return { r, a };
  });
  const base = { school: code, consent: true, consentAt: '2026-01-10T00:00:00Z', mode: 'tryout', synthetic: true };
  const out = [];
  const missingR3 = i === 5, noIncident = i === 9, noDoc = i === 12, notStarted = i === 16;
  if (!notStarted) {
    respondents.forEach((x, k) => { if (missingR3 && k === 2) return; out.push(C.pack('questionnaire', Object.assign({}, base, { respondent: x.r, submittedAt: '2026-01-1' + (k + 1) + 'T08:00:00Z' }), x.a)); });
    if (!noIncident) { const ns = i % 5 === 0; out.push(C.pack('incidents', Object.assign({}, base, { submittedAt: '2026-01-15T08:00:00Z' }), ns ? { year: '2569', noSystem: true, V: '', A: '', P: '', H: '' } : { year: '2569', noSystem: false, V: String(Math.round(riskBase.V * 2 + rnd() * 3)), A: String(Math.round(riskBase.A * 2 + rnd() * 3)), P: String(Math.round(riskBase.P + rnd() * 2)), H: String(Math.round(riskBase.H * 2 + rnd() * 3)) })); }
    if (!noDoc) out.push(C.pack('documents', Object.assign({}, base, { submittedAt: '2026-01-16T08:00:00Z' }), { items: Object.fromEntries(C.DOCS.map((d) => [d[0], pick(C.DOC_STATUS)])), years: {} }));
  }
  if (out.length) { const n = 'synthetic-collect-' + code + '.json'; fs.writeFileSync(path.join(dir, n), JSON.stringify(out) + '\n'); names.push(n); }
}
fs.writeFileSync(path.join(dir, 'synthetic-collect-roster.csv'), roster.join('\n') + '\n'); names.push('synthetic-collect-roster.csv');
fs.writeFileSync(path.join(dir, 'collect-index.json'), JSON.stringify(names, null, 1) + '\n');
console.log('สร้าง ' + names.length + ' ไฟล์ในส่วนตัวอย่างระบบรวบรวมข้อมูล');
