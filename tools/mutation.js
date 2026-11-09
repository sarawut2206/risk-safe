// ทดสอบการกลายพันธุ์ (mutation testing): ใส่ข้อผิดพลาดเล็ก ๆ ลงในสำเนาของ engine.js / decision.js ทีละจุด แล้วดูว่าชุดทดสอบจับได้หรือไม่
// ใช้ประเมินว่าชุดทดสอบ "ตรวจได้จริง" ไม่ใช่ผ่านเพราะไม่ได้ตรวจอะไร  รัน: node tools/mutation.js  (ผล: analysis/mutation-results.json)
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const root = path.join(__dirname, '..');
const SUITES = ['test_engine.js', 'test_decision.js', 'test_boundary.js'];
const MUTANTS = [
  ['engine.js', 'M01 ค่าตัดความเสี่ยงต่ำ ≤ เป็น <', 'rd <= P.riskLow + EPS', 'rd < P.riskLow'],
  ['engine.js', 'M02 ค่าตัดความเสี่ยงกลาง ≤ เป็น <', 'rd <= P.riskMid + EPS', 'rd < P.riskMid'],
  ['engine.js', 'M03 ค่าตัดความพร้อมต่ำ ≤ เป็น <', 'meanD <= P.readyLow + EPS', 'meanD < P.readyLow'],
  ['engine.js', 'M04 ค่าตัดความพร้อมกลาง ≤ เป็น <', 'meanD <= P.readyMid + EPS', 'meanD < P.readyMid'],
  ['engine.js', 'M05 กฎเพดานใช้ && แทน ||', 'strD < P.floorD - EPS || sysD < P.floorD - EPS', 'strD < P.floorD - EPS && sysD < P.floorD - EPS'],
  ['engine.js', 'M06 กฎเพดานตัดเงื่อนไขระบบ', 'strD < P.floorD - EPS || sysD < P.floorD - EPS', 'strD < P.floorD - EPS'],
  ['engine.js', 'M07 กฎยกระดับเปลี่ยน L≥2 เป็น L>2', 'p[1] === P.overrideC && p[0] >= P.overrideL', 'p[1] === P.overrideC && p[0] > P.overrideL'],
  ['engine.js', 'M08 ปิดกฎยกระดับ', 'const override = pairs.some((p) => p[1] === P.overrideC && p[0] >= P.overrideL);', 'const override = false;'],
  ['engine.js', 'M09 สูตรช่อง R คูณ 3 เป็น 2', "'R' + (RISK_ORDER.indexOf(risk) * 3 +", "'R' + (RISK_ORDER.indexOf(risk) * 2 +"],
  ['engine.js', 'M10 เพดานจำนวนข้อเกินหนึ่ง', '.slice(0, res.max);', '.slice(0, res.max + 1);'],
  ['engine.js', 'M11 ตัวกรองทรัพยากร ≤ เป็น <', 'let cand = ranked.filter(({ b }) => b.res <= res.code)', 'let cand = ranked.filter(({ b }) => b.res < res.code)'],
  ['engine.js', 'M12 ตัดน้ำหนัก 7-S ช่องว่างสูง', '(topCodes.indexOf(b.elem) >= 0 ? 200000 : 100000)', '(100000)'],
  ['engine.js', 'M13 ไม่ใช้ลำดับ QSPM', '(Math.max(1, Math.min(20, Math.floor(Number(b.qpri)) || 1)) - 1) * 1000', '0'],
  ['engine.js', 'M14 ไม่กรองระดับความเสี่ยงของมาตรการ', "b.risk.indexOf(dom.risk) >= 0 && b.ready.indexOf(readyFinal) >= 0;", 'b.ready.indexOf(readyFinal) >= 0;'],
  ['engine.js', 'M15 ไม่กรองระดับความพร้อมของมาตรการ', "b.risk.indexOf(dom.risk) >= 0 && b.ready.indexOf(readyFinal) >= 0;", 'b.risk.indexOf(dom.risk) >= 0;'],
  ['engine.js', 'M16 ดัชนีความเสี่ยงหารด้วยจำนวนข้อทั้งหมดแทนข้อที่ตอบ', 'pairs.reduce((s, p) => s + p[0] * p[1], 0) / pairs.length', 'pairs.reduce((s, p) => s + p[0] * p[1], 0) / items.length'],
  ['engine.js', 'M17 PNI ไม่หารด้วย D', 'pni = (i - d) / d;', 'pni = (i - d);'],
  ['decision.js', 'D01 เงื่อนไข A1 ใช้กลุ่มผิด', "req: [{ pred: 'CONTROL', min: 1 }] },\n    'กลาง'", "req: [{ pred: 'PROACTIVE', min: 1 }] },\n    'กลาง'"],
  ['decision.js', 'D02 ตัวบังคับกฎไม่ทำงาน', 'if (sat(cur, q)) return;', 'return;'],
  ['decision.js', 'D03 ตัวตรวจกฎใช้ > แทน ≥', '(r.min == null || hits.length >= r.min)', '(r.min == null || hits.length > r.min)'],
  ['decision.js', 'D04 ปิดธงใกล้เส้นแบ่งด้านความเสี่ยง', 'const NEAR = { risk: 0.5, ready: 0.15 };', 'const NEAR = { risk: 0, ready: 0.15 };'],
  ['decision.js', 'D05 เกณฑ์ที่ต้องเกินของช่องเป้าหมายสลับกัน (ความพร้อม)', "const need = p.ready === 'กลาง' ? P.readyLow : P.readyMid;", "const need = p.ready === 'กลาง' ? P.readyMid : P.readyLow;"],
  ['decision.js', 'D06 แปลงรหัสช่องเป็นระดับผิด', "const LEVELS_R = ['สูง', 'กลาง', 'ต่ำ'], LEVELS_Y = ['ต่ำ', 'กลาง', 'สูง'];", "const LEVELS_R = ['ต่ำ', 'กลาง', 'สูง'], LEVELS_Y = ['ต่ำ', 'กลาง', 'สูง'];"],
  ['decision.js', 'D07 เงื่อนไข B3 ใช้กลุ่มผิด', "req: [{ pred: 'SUSTAIN', min: 1 }] },", "req: [{ pred: 'CAPABILITY', min: 1 }] },"],
  ['decision.js', 'D08 ข้อจำกัดปราบปรามเมื่อความเสี่ยงต่ำหลวมขึ้น', "req: [{ pred: 'REPRESS', max: 1 }]", "req: [{ pred: 'REPRESS', max: 9 }]"],
  ['decision.js', 'D09 เลือกผู้ถูกสลับจากอันดับสูงสุดแทนอันดับท้าย', 'const victim = cur.slice().reverse().find(', 'const victim = cur.slice().find('],
  ['decision.js', 'W01 รายการ "ใกล้ได้รับเลือก" เรียงกลับด้าน', 'sort((a, b) => a.poolRank - b.poolRank).slice(0, 3)', 'sort((a, b) => b.poolRank - a.poolRank).slice(0, 3)'],
  ['decision.js', 'W02 เหตุผลลำดับ 7-S ใช้เงื่อนไขกลับ', 'if (ea.top !== eb.top) return a.top ?', 'if (ea.top === eb.top) return a.top ?'],
  ['decision.js', 'W03 นับเหตุผลตกด่านผิดกลุ่ม', 'dom.eval.forEach((e) => { cnt[e.reason]++; });', 'dom.eval.forEach((e) => { cnt[e.reason === "cap" ? "res" : e.reason]++; });'],
  ['decision.js', 'D10 ขอบเขตระยะห่างเส้นแบ่งความเสี่ยงคำนวณจากค่าตัดผิด', "if (dom.risk === 'กลาง') { r.up = { to: 'สูง', gap: P.riskMid - rd,", "if (dom.risk === 'กลาง') { r.up = { to: 'สูง', gap: P.riskLow - rd,"],
];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r2mut-'));
const copyAll = () => { fs.mkdirSync(path.join(tmp, 'tests'), { recursive: true }); ['data.js', 'engine.js', 'decision.js', 'stats.js'].forEach((f) => fs.copyFileSync(path.join(root, f), path.join(tmp, f))); fs.readdirSync(path.join(root, 'tests')).forEach((f) => fs.copyFileSync(path.join(root, 'tests', f), path.join(tmp, 'tests', f))); };
copyAll();
const runSuites = () => { for (const s of SUITES) { const r = cp.spawnSync(process.execPath, [path.join(tmp, 'tests', s)], { cwd: tmp, timeout: 120000, encoding: 'utf8' }); if (r.status !== 0) return s; } return null; };
const base = runSuites(); if (base) { console.log('ชุดทดสอบฐานยังไม่ผ่านที่ ' + base); process.exit(1); }
const results = [];
for (const [file, name, from, to] of MUTANTS) {
  const orig = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
  if (orig.indexOf(from) < 0) { results.push({ name, status: 'ข้าม (ไม่พบข้อความต้นฉบับ)' }); continue; }
  fs.writeFileSync(path.join(tmp, file), orig.replace(from, to));
  const killedBy = runSuites();
  results.push({ name, file, status: killedBy ? 'ถูกจับได้' : 'รอดจากการทดสอบ', killedBy: killedBy || '' });
  fs.writeFileSync(path.join(tmp, file), orig);
  console.log((killedBy ? 'KILLED  ' : 'SURVIVED') + ' ' + name + (killedBy ? ' (' + killedBy + ')' : ''));
}
const valid = results.filter((r) => !/^ข้าม/.test(r.status)), killed = valid.filter((r) => r.status === 'ถูกจับได้').length;
const out = { suites: SUITES, total: valid.length, killed, survived: valid.length - killed, mutation_score_pct: +(100 * killed / valid.length).toFixed(1), results };
fs.mkdirSync(path.join(root, 'analysis'), { recursive: true });
fs.writeFileSync(path.join(root, 'analysis', 'mutation-results.json'), JSON.stringify(out, null, 1) + '\n');
console.log('mutation score ' + out.mutation_score_pct + '% (' + killed + '/' + valid.length + ')');
fs.rmSync(tmp, { recursive: true, force: true });
