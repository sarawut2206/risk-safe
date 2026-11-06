/* R²-SAFE ต้นแบบ: สถิติที่ใช้พิสูจน์ประสิทธิภาพของกลไก (เขียนเองทั้งหมด ไม่พึ่งไลบรารี ตรวจเทียบกับ scipy และค่าตัวอย่างในตำราแล้วใน tests/test_eval.js)
   ไม่มีข้อมูลสมมติในไฟล์นี้ ฟังก์ชันทุกตัวรับข้อมูลที่ผู้เรียกส่งมาเท่านั้น */
(function (root) {
  'use strict';

  const num = (a) => a.filter((x) => typeof x === 'number' && isFinite(x));
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const mean = (a) => (a.length ? sum(a) / a.length : NaN);
  const sd = (a) => { if (a.length < 2) return NaN; const m = mean(a); return Math.sqrt(sum(a.map((x) => (x - m) * (x - m))) / (a.length - 1)); };
  // เปอร์เซ็นไทล์แบบเส้นตรง (เหมือน QUARTILE.INC ของ Excel และ numpy ค่าเริ่มต้น)
  function quantile(a, q) {
    const s = num(a).slice().sort((x, y) => x - y); if (!s.length) return NaN;
    const pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
    return s[lo] + (s[hi] - s[lo]) * (pos - lo);
  }
  const median = (a) => quantile(a, 0.5);
  const iqr = (a) => quantile(a, 0.75) - quantile(a, 0.25);

  // ---------- การแจกแจง t ----------
  function lgamma(x) {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t);
    let s = 1.000000000190015; for (let j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function betacf(a, b, x) {
    const MAXIT = 300, EPS = 3e-15, FPMIN = 1e-300;
    const qab = a + b, qap = a + 1, qam = a - 1; let c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
      const del = d * c; h *= del; if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  function betai(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function tCdf(t, df) { const x = df / (df + t * t), p = 0.5 * betai(df / 2, 0.5, x); return t > 0 ? 1 - p : p; }
  function tInv(p, df) { let lo = -2000, hi = 2000; for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (tCdf(mid, df) < p) lo = mid; else hi = mid; } return (lo + hi) / 2; }
  // ฟังก์ชันปกติมาตรฐาน (ใช้ในค่าประมาณของวิลคอกซัน)
  // erfc แม่นราว 1e-13: อนุกรมเทย์เลอร์เมื่อ |x| < 3 และเศษส่วนต่อเนื่องเมื่อ |x| ≥ 3
  function erfc(x) {
    const z = Math.abs(x); let r;
    if (z < 3) { let term = z, s = z; for (let n = 1; n < 120; n++) { term *= -z * z / n; s += term / (2 * n + 1); } r = 1 - 2 / Math.sqrt(Math.PI) * s; }
    else { let f = 0; for (let k = 60; k >= 1; k--) f = k / 2 / (z + f); r = Math.exp(-z * z) / Math.sqrt(Math.PI) / (z + f); }
    return x >= 0 ? r : 2 - r;
  }
  const normSf = (z) => 0.5 * erfc(z / Math.SQRT2);

  // ---------- ทดสอบสองกลุ่มจับคู่ (ก่อน–หลัง) ----------
  function pairedT(pre, post, conf) {
    const d = [], n0 = Math.min(pre.length, post.length);
    for (let i = 0; i < n0; i++) if (typeof pre[i] === 'number' && typeof post[i] === 'number' && isFinite(pre[i]) && isFinite(post[i])) d.push(post[i] - pre[i]);
    const n = d.length; if (n < 2) return { n, ok: false };
    const m = mean(d), s = sd(d), se = s / Math.sqrt(n), df = n - 1, conf1 = conf || 0.95;
    const t = s === 0 ? (m === 0 ? 0 : Infinity * Math.sign(m)) : m / se;
    const p = s === 0 ? (m === 0 ? 1 : 0) : 2 * (1 - tCdf(Math.abs(t), df));
    const q = tInv(1 - (1 - conf1) / 2, df);
    return { ok: true, n, df, meanDiff: m, sd: s, se, t, p, ci: [m - q * se, m + q * se], dz: s === 0 ? NaN : m / s, diffs: d };
  }
  // วิลคอกซันอันดับเครื่องหมาย: แจกแจงแม่นตรงเมื่อไม่มีค่าเท่ากัน/ศูนย์และ n ≤ 50 มิฉะนั้นใช้ค่าประมาณปกติ (ตามค่าเริ่มต้นของ scipy)
  function wilcoxon(pre, post) {
    const d = [];
    for (let i = 0; i < Math.min(pre.length, post.length); i++) if (isFinite(pre[i]) && isFinite(post[i])) d.push(post[i] - pre[i]);
    const nz = d.filter((x) => x !== 0), n = nz.length; if (n < 1) return { n: 0, ok: false, zeros: d.length };
    const abs = nz.map(Math.abs), idx = abs.map((v, i) => i).sort((a, b) => abs[a] - abs[b]), ranks = new Array(n);
    let tie = 0, hasTie = false;
    for (let i = 0; i < n;) { let j = i; while (j + 1 < n && abs[idx[j + 1]] === abs[idx[i]]) j++; const r = (i + j + 2) / 2; for (let k = i; k <= j; k++) ranks[idx[k]] = r; const t = j - i + 1; if (t > 1) { hasTie = true; tie += t * (t * t - 1); } i = j + 1; }
    let rp = 0, rm = 0; nz.forEach((x, i) => { if (x > 0) rp += ranks[i]; else rm += ranks[i]; });
    const T = Math.min(rp, rm); let p, method;
    if (n <= 50) {
      // การแจกแจงแม่นตรงของผลรวมอันดับเมื่อสลับเครื่องหมายได้ทุกแบบ (ใช้อันดับเฉลี่ยเมื่อมีค่าเท่ากัน คูณ 2 ให้เป็นจำนวนเต็ม)
      const w = ranks.map((r) => Math.round(2 * r)), max = w.reduce((s, x) => s + x, 0), cnt = new Array(max + 1).fill(0); cnt[0] = 1;
      w.forEach((r) => { for (let s = max; s >= r; s--) cnt[s] += cnt[s - r]; });
      const lim = Math.round(2 * T); let c = 0; for (let s = 0; s <= lim; s++) c += cnt[s];
      p = Math.min(1, 2 * c / Math.pow(2, n)); method = hasTie ? 'แม่นตรง (มีค่าเท่ากัน ใช้อันดับเฉลี่ย)' : 'แม่นตรง';
    } else {
      const mn = n * (n + 1) / 4, se = Math.sqrt((n * (n + 1) * (2 * n + 1) - 0.5 * tie) / 24);
      p = se === 0 ? 1 : Math.min(1, 2 * normSf(Math.abs((T - mn) / se))); method = 'ค่าประมาณปกติ';
    }
    return { ok: true, n, zeros: d.length - n, rPlus: rp, rMinus: rm, T, p, method };
  }
  // ทดสอบ t ของเวลช์ (สองกลุ่มอิสระ เช่น กลุ่มทดลองกับกลุ่มเปรียบเทียบ)
  function welch(a, b, conf) {
    a = num(a); b = num(b); if (a.length < 2 || b.length < 2) return { ok: false, n1: a.length, n2: b.length };
    const m1 = mean(a), m2 = mean(b), v1 = sd(a) ** 2, v2 = sd(b) ** 2, se = Math.sqrt(v1 / a.length + v2 / b.length);
    const df = (v1 / a.length + v2 / b.length) ** 2 / ((v1 / a.length) ** 2 / (a.length - 1) + (v2 / b.length) ** 2 / (b.length - 1));
    const t = (m1 - m2) / se, p = 2 * (1 - tCdf(Math.abs(t), df)), q = tInv(1 - (1 - (conf || 0.95)) / 2, df);
    const sp = Math.sqrt(((a.length - 1) * v1 + (b.length - 1) * v2) / (a.length + b.length - 2));
    return { ok: true, n1: a.length, n2: b.length, m1, m2, diff: m1 - m2, se, t, df, p, ci: [m1 - m2 - q * se, m1 - m2 + q * se], d: sp ? (m1 - m2) / sp : NaN };
  }

  // ---------- ความสอดคล้อง ----------
  // kappa ของโคเฮน (w: 'none' | 'linear' | 'quadratic') ค่าหมวดต้องเป็นเลขลำดับ 0..K-1
  function kappa(x, y, K, w) {
    const O = Array.from({ length: K }, () => new Array(K).fill(0)); let n = 0;
    for (let i = 0; i < Math.min(x.length, y.length); i++) if (Number.isInteger(x[i]) && Number.isInteger(y[i]) && x[i] >= 0 && y[i] >= 0 && x[i] < K && y[i] < K) { O[x[i]][y[i]]++; n++; }
    if (!n) return { n: 0, kappa: NaN, agree: NaN };
    const r = O.map((row) => sum(row)), c = O[0].map((_, j) => sum(O.map((row) => row[j])));
    const wt = (i, j) => (w === 'quadratic' ? ((i - j) / (K - 1)) ** 2 : w === 'linear' ? Math.abs(i - j) / (K - 1) : i === j ? 0 : 1);
    let dO = 0, dE = 0; for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) { dO += wt(i, j) * O[i][j] / n; dE += wt(i, j) * r[i] * c[j] / (n * n); }
    let agree = 0; for (let i = 0; i < K; i++) agree += O[i][i]; agree /= n;
    return { n, kappa: dE === 0 ? NaN : 1 - dO / dE, agree, matrix: O };
  }
  // alpha ของคริพเพนดอร์ฟ: units = แถวละหน่วย (กรณี) คอลัมน์ละผู้ประเมิน ค่าว่าง = null; metric: 'nominal' | 'ordinal' | 'interval'
  function alpha(units, metric) {
    const vals = {}; const o = {};
    units.forEach((u) => {
      const v = u.filter((x) => x != null && isFinite(x)); const m = v.length; if (m < 2) return;
      for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) if (i !== j) { const k = v[i] + '|' + v[j]; o[k] = (o[k] || 0) + 1 / (m - 1); vals[v[i]] = 1; vals[v[j]] = 1; }
    });
    const cats = Object.keys(vals).map(Number).sort((a, b) => a - b); if (cats.length < 2) return { alpha: cats.length ? NaN : NaN, n: 0 };
    const nc = {}; cats.forEach((c) => { nc[c] = sum(cats.map((k) => o[c + '|' + k] || 0)); });
    const n = sum(cats.map((c) => nc[c]));
    const delta = (c, k) => {
      if (c === k) return 0;
      if (metric === 'interval') return (c - k) ** 2;
      if (metric === 'ordinal') { const lo = Math.min(c, k), hi = Math.max(c, k); let s = 0; cats.forEach((g) => { if (g >= lo && g <= hi) s += nc[g]; }); return (s - (nc[c] + nc[k]) / 2) ** 2; }
      return 1;
    };
    let dO = 0, dE = 0; cats.forEach((c) => cats.forEach((k) => { const d = delta(c, k); dO += (o[c + '|' + k] || 0) * d; dE += nc[c] * nc[k] * d; }));
    dO /= n; dE /= n * (n - 1);
    return { alpha: dE === 0 ? NaN : 1 - dO / dE, n };
  }

  const api = { mean, sd, median, quantile, iqr, tCdf, tInv, pairedT, wilcoxon, welch, kappa, alpha, normSf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RS_STATS = api;
})(typeof window !== 'undefined' ? window : this);
