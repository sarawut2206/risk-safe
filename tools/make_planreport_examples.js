// สร้างไฟล์ตัวอย่างสมมติของแบบบันทึกผลการนำแผนไปใช้ (planreport) สำหรับทดสอบแท็บ "ผลการใช้แผน" ของแดชบอร์ดผู้วิจัย
// ข้อมูลสุ่มด้วยเมล็ดคงที่ ไม่ใช่โรงเรียนจริง ไม่ใช่ผลวิจัย  รัน: node tools/make_planreport_examples.js (รันหลัง tools/make_collect_examples.js เพราะไฟล์นั้นเขียน collect-index.json ใหม่)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const data = require(path.join(root, 'data.js')), PR = require(path.join(root, 'planrec.js')), ACT = require(path.join(root, 'actplan.js'));
const dir = path.join(root, 'examples');
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(777), pick = (a) => a[Math.floor(rnd() * a.length)], rint = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1)), clamp = (x) => Math.max(1, Math.min(5, x));
const idxPath = path.join(dir, 'collect-index.json');
let names = JSON.parse(fs.readFileSync(idxPath, 'utf8')).filter((n) => !/^synthetic-planreport-/.test(n));
fs.readdirSync(dir).filter((n) => /^synthetic-planreport-/.test(n)).forEach((n) => fs.unlinkSync(path.join(dir, n)));
const bank = data.bank.filter((b) => b.sb), out = [];
for (let i = 1; i <= 10; i++) {
  const code = 'S' + String(i).padStart(3, '0'), list = [], count = 3 + (i % 3), used = {};
  const base = 2.6 + rnd() * 1.8;   // ระดับโดยรวมของโรงเรียน (ต่างกันเพื่อให้แดชบอร์ดมีความแปรปรวน)
  for (let k = 0; k < count; k++) {
    let m; do { m = pick(bank); } while (used[m.sb]); used[m.sb] = 1;
    const a = PR.blank(), planned = ACT.TOTAL[m.res] || 8, stage = rnd(), doneN = stage < 0.2 ? rint(2, 4) : 6;
    a.respRole = pick(['R1', 'R2', 'R3', 'OT']); a.weeksActual = String(Math.max(1, Math.round(planned * (0.7 + rnd() * 0.9))));
    PR.STEP_IDS.forEach((s, j) => { const done = j < doneN; a.steps[s] = { status: done ? 'เสร็จแล้ว' : (j === doneN ? 'กำลังดำเนินการ' : 'ยังไม่เริ่ม'), evidence: done ? (rnd() < 0.85 ? 'มี' : 'ไม่มี') : '' }; });
    const hit = rnd() * 5 < base - 0.3; a.kpi = { target: 'ร้อยละ 80', actual: 'ร้อยละ ' + rint(45, 95), met: doneN < 6 ? 'ยังวัดไม่ได้' : (hit ? 'บรรลุตามเป้า' : pick(['บรรลุบางส่วน', 'ยังไม่บรรลุ'])) };
    const intended = rint(20, 400); a.reach = { intended: String(intended), reached: String(Math.round(intended * (0.5 + rnd() * 0.5))) };
    a.resource = { people: String(rint(2, 12)), hours: String(rint(4, 80)), cost: String(m.res === 1 ? rint(0, 1500) : m.res === 2 ? rint(1000, 12000) : rint(8000, 60000)) };
    const inc = rnd() < 0.5; a.change = { value: pick(['ดีขึ้น', 'ดีขึ้น', 'เท่าเดิม', 'ประเมินยังไม่ได้']), incBefore: inc ? String(rint(2, 14)) : '', incAfter: '' }; if (inc) a.change.incAfter = String(Math.max(0, Number(a.change.incBefore) - rint(-2, 6)));
    PR.ALIGN.forEach((x) => { a.align[x[0]] = clamp(Math.round(base + (rnd() - 0.5) * 2)); }); PR.SAT.forEach((x) => { a.sat[x[0]] = clamp(Math.round(base + 0.3 + (rnd() - 0.5) * 2)); });
    const ob = pick([['none'], ['time'], ['staff', 'time'], ['budget'], ['teachers'], ['parents', 'time'], ['law']]); ob.forEach((x) => { a.obst[x] = true; });
    if (rnd() < 0.4) a.adapt = 'ปรับช่วงเวลาให้ตรงกับตารางสอน'; if (rnd() < 0.3) a.suggest = 'ควรมีตัวอย่างแบบฟอร์มเพิ่ม';
    const dm = rnd() < 0.7 ? m.dom : 'X';
    list.push(PR.pack({ school: code, measure: m.sb, domain: ['V', 'A', 'P', 'H', 'X'].indexOf(m.dom) >= 0 ? m.dom : 'X', group: 'R' + rint(1, 9), plannedWeeks: planned, consent: true, consentAt: '2026-03-01T00:00:00Z', mode: 'tryout', synthetic: true, submittedAt: '2026-03-' + String(10 + k).padStart(2, '0') + 'T08:00:00Z' }, a));
  }
  const n = 'synthetic-planreport-' + code + '.json'; fs.writeFileSync(path.join(dir, n), JSON.stringify(list) + '\n'); out.push(n);
}
const at = names.indexOf('synthetic-collect-roster.csv'); names.splice(at < 0 ? names.length : at, 0, ...out);
fs.writeFileSync(idxPath, JSON.stringify(names, null, 1) + '\n');
console.log('สร้าง ' + out.length + ' ไฟล์ตัวอย่างบันทึกผลการนำแผนไปใช้');
