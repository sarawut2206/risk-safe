// วิเคราะห์ความไวของการตัดสินใจ (จำลอง ไม่ใช่ข้อมูลจริง): คะแนนคลาดเคลื่อนเล็กน้อยทำให้ช่อง R เปลี่ยนบ่อยแค่ไหน
// และธงเตือน "ใกล้เส้นแบ่ง" ทำนายการเปลี่ยนช่องได้ดีเพียงใด  รัน: node tools/sensitivity.js  (ผลบันทึกที่ analysis/sensitivity-results.json)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const data = require(path.join(root, 'data.js')), E = require(path.join(root, 'engine.js')), Dc = require(path.join(root, 'decision.js'));
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(31415), pick = (a) => a[Math.floor(rnd() * a.length)], clamp = (x) => Math.max(1, Math.min(5, x));
const N = +process.argv[2] || 6000, NOISE_P = 0.2, REPS = 5;

function randomInput() {
  const input = { risk: {}, seven: {}, resource: 'ปานกลาง' };
  // ความเสี่ยงแต่ละด้านสุ่มระดับฐานต่างกัน และ D ทั้งโรงเรียนสุ่มระดับฐาน เพื่อให้ครอบคลุมทั้ง 9 ช่อง
  const dBase = rnd() * 4 + 1;
  data.domains.forEach((d) => { const b = rnd() * 4 + 1; data.riskItems.filter((r) => r.dom === d.code).forEach((it) => { input.risk[it.id] = [clamp(Math.round(b + (rnd() - 0.5) * 2)), clamp(Math.round(b + (rnd() - 0.5) * 2))]; }); });
  data.sevenItems.forEach((it) => { const v = clamp(Math.round(dBase + (rnd() - 0.5) * 2)); input.seven[it.id] = [v, Math.min(5, v + 1)]; });
  return input;
}
const noisy = (input) => {
  const o = JSON.parse(JSON.stringify(input));
  Object.keys(o.risk).forEach((k) => { for (let j = 0; j < 2; j++) if (rnd() < NOISE_P) o.risk[k][j] = clamp(o.risk[k][j] + (rnd() < 0.5 ? -1 : 1)); });
  Object.keys(o.seven).forEach((k) => { if (rnd() < NOISE_P) o.seven[k][0] = clamp(o.seven[k][0] + (rnd() < 0.5 ? -1 : 1)); });
  return o;
};
const byCell = {}, tot = { n: 0, flip: 0, near: 0, nearFlip: 0, farFlip: 0, singleN: 0, singleFlip: 0, thrN: 0, thrFlip: 0, overrideN: 0, overrideFlip: 0 };
for (let t = 0; t < N; t++) {
  const inp = randomInput(), o0 = E.analyze(inp, data);
  const nearBy = {}; o0.domains.forEach((d) => { if (d.group) nearBy[d.code] = Dc.boundary(d, o0).near; });
  for (let r = 0; r < REPS; r++) {
    const o1 = E.analyze(noisy(inp), data);
    o0.domains.forEach((d, i) => {
      if (!d.group) return;
      const flip = o1.domains[i].group !== d.group, c = (byCell[d.group] = byCell[d.group] || { n: 0, flip: 0, near: 0, nearFlip: 0 });
      c.n++; tot.n++; if (flip) { c.flip++; tot.flip++; }
      if (nearBy[d.code]) { c.near++; tot.near++; if (flip) { c.nearFlip++; tot.nearFlip++; } } else if (flip) tot.farFlip++;
      if (d.override) { tot.overrideN++; if (flip) tot.overrideFlip++; }
    });
  }
  // เปลี่ยนคะแนนข้อเดียว ±1 (เหตุการณ์ที่ผู้ประเมินสองคนต่างกันหนึ่งข้อ)
  const sk = pick(Object.keys(inp.seven)), cp = JSON.parse(JSON.stringify(inp)); cp.seven[sk][0] = clamp(cp.seven[sk][0] + (rnd() < 0.5 ? -1 : 1));
  const rk = pick(Object.keys(inp.risk)), cp2 = JSON.parse(JSON.stringify(cp)); cp2.risk[rk][pick([0, 1])] = clamp(cp2.risk[rk][0] + (rnd() < 0.5 ? -1 : 1));
  const o2 = E.analyze(cp2, data); o0.domains.forEach((d, i) => { if (!d.group) return; tot.singleN++; if (o2.domains[i].group !== d.group) tot.singleFlip++; });
  // เกณฑ์ตัดคลาดเคลื่อน ±10% (ทดสอบความไวต่อค่าเริ่มต้นที่ยังไม่ผ่านเดลฟาย)
  const P = E.DEFAULT_PARAMS, sgn = rnd() < 0.5 ? 0.9 : 1.1, o3 = E.analyze(inp, data, { riskLow: P.riskLow * sgn, riskMid: P.riskMid * sgn, readyLow: P.readyLow * sgn, readyMid: P.readyMid * sgn });
  o0.domains.forEach((d, i) => { if (!d.group) return; tot.thrN++; if (o3.domains[i].group !== d.group) tot.thrFlip++; });
}
const pct = (a, b) => (b ? +(100 * a / b).toFixed(1) : null);
const res = { n_profiles: N, noise_prob_per_item: NOISE_P, reps: REPS, units: tot.n, flip_rate_pct: pct(tot.flip, tot.n),
  near_flag_share_pct: pct(tot.near, tot.n), flip_rate_if_near_pct: pct(tot.nearFlip, tot.near), flip_rate_if_not_near_pct: pct(tot.farFlip, tot.n - tot.near),
  sensitivity_of_near_flag_pct: pct(tot.nearFlip, tot.flip), ppv_of_near_flag_pct: pct(tot.nearFlip, tot.near),
  single_item_pair_flip_rate_pct: pct(tot.singleFlip, tot.singleN), threshold_pm10_flip_rate_pct: pct(tot.thrFlip, tot.thrN),
  override_cases_flip_rate_pct: pct(tot.overrideFlip, tot.overrideN),
  by_cell: Object.keys(byCell).sort().map((k) => ({ cell: k, n: byCell[k].n, flip_rate_pct: pct(byCell[k].flip, byCell[k].n), near_share_pct: pct(byCell[k].near, byCell[k].n) })) };
fs.mkdirSync(path.join(root, 'analysis'), { recursive: true });
fs.writeFileSync(path.join(root, 'analysis', 'sensitivity-results.json'), JSON.stringify(res, null, 1) + '\n');
console.log(JSON.stringify(res, null, 1));
