// จำลองว่า "ถ้าผู้เชี่ยวชาญตรงกับระบบในระดับหนึ่ง" ชุดกรณี 27 กรณีจะผ่านเกณฑ์ kappa/alpha บ่อยแค่ไหน (วางแผนก่อนเก็บข้อมูล ไม่ใช่ผลวิจัย)
// สมมติ: ผู้เชี่ยวชาญแต่ละคนให้ระดับเดียวกับระบบด้วยความน่าจะเป็น p ที่เหลือคลาดเคลื่อน 1 ระดับ  รัน: node tools/simulate_concordance.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const data = require(path.join(root, 'data.js')), V = require(path.join(root, 'evalkit.js'));
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(8675309), LV = ['ต่ำ', 'กลาง', 'สูง'], cases = V.makeCases(data.domains);
const S = 600, PS = [0.7, 0.8, 0.85, 0.9, 0.95], NS = [5, 9, 15];
const shift = (l) => { const i = LV.indexOf(l); if (i === 0) return LV[1]; if (i === 2) return LV[1]; return LV[rnd() < 0.5 ? 0 : 2]; };
const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor((s.length - 1) * f)]; };
const rows = [];
NS.forEach((nE) => PS.forEach((p) => {
  let passK = 0, passA = 0, passBoth = 0, passIndiv = 0; const ks = [], as = [], ms = [];
  for (let s = 0; s < S; s++) {
    const files = [];
    for (let e = 0; e < nE; e++) { const f = { schema: V.SCHEMA_EXPERT, version: 1, code: 'E' + e, items: {}, cases: {} }; cases.forEach((c) => { f.cases[c.id] = { risk: rnd() < p ? c.sys.risk : shift(c.sys.risk), ready: rnd() < p ? c.sys.ready : shift(c.sys.ready), fit: 4 }; }); files.push(f); }
    const r = V.analyzeExperts(files, cases), k = Math.min(r.consensus.kRisk, r.consensus.kReady), a = Math.min(r.alpha.risk, r.alpha.ready);
    const km = Math.min(r.kMean.risk, r.kMean.ready); ms.push(km); if (km >= 0.61) passIndiv++; ks.push(k); as.push(a); const pk = k >= 0.61, pa = a >= 0.667; if (pk) passK++; if (pa) passA++; if (pk && pa) passBoth++;
  }
  rows.push({ experts: nE, p_agree_with_system: p, sims: S, median_min_kappa_w: +q(ks, 0.5).toFixed(3), p5_min_kappa_w: +q(ks, 0.05).toFixed(3), median_min_alpha: +q(as, 0.5).toFixed(3), p5_min_alpha: +q(as, 0.05).toFixed(3),
    pass_kappa_pct: +(100 * passK / S).toFixed(1), median_mean_individual_kappa_w: +q(ms, 0.5).toFixed(3), pass_individual_kappa_pct: +(100 * passIndiv / S).toFixed(1), pass_alpha_pct: +(100 * passA / S).toFixed(1), pass_both_pct: +(100 * passBoth / S).toFixed(1) });
}));
fs.mkdirSync(path.join(root, 'analysis'), { recursive: true });
fs.writeFileSync(path.join(root, 'analysis', 'concordance-simulation.json'), JSON.stringify({ design: '27 cases (3 per R cell)', note: 'simulation under assumed expert accuracy, not research results', rows }, null, 1) + '\n');
rows.forEach((r) => console.log(r.experts + ' experts, p=' + r.p_agree_with_system + ': median kw ' + r.median_min_kappa_w + ' alpha ' + r.median_min_alpha + ' indiv-kw ' + r.median_mean_individual_kappa_w + ' (pass ' + r.pass_individual_kappa_pct + '%) | pass consensus-kappa ' + r.pass_kappa_pct + '% alpha ' + r.pass_alpha_pct + '% both ' + r.pass_both_pct + '%'));
