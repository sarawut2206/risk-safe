// ทดสอบ stats.js เทียบกับ scipy (ค่าอ้างอิงสร้างโดย work/ref_stats.py) และค่าตัวอย่างในตำรา
// รัน: node tests/test_stats.js
const path = require('path'), fs = require('fs');
const S = require(path.join(__dirname, '..', 'stats.js'));
let checks = 0, fails = 0;
const near = (name, a, b, tol) => { checks++; if (!(Math.abs(a - b) <= (tol || 1e-6))) { fails++; console.log('FAIL', name, 'got', a, 'want', b); } };
const refPath = path.join(__dirname, 'ref_stats.json');
if (fs.existsSync(refPath)) {
  const cases = JSON.parse(fs.readFileSync(refPath, 'utf8'));
  cases.forEach((c, i) => {
    if (c.kind === 'paired') {
      const r = S.pairedT(c.pre, c.post); const w = S.wilcoxon(c.pre, c.post);
      near('t#' + i, r.t, c.t, 1e-9); near('p#' + i, r.p, c.p, 1e-9); near('lo#' + i, r.ci[0], c.lo, 1e-7); near('hi#' + i, r.ci[1], c.hi, 1e-7); near('dz#' + i, r.dz, c.dz, 1e-9);
      near('wp#' + i, w.p, c.pp != null ? c.pp : c.ex, 1e-12); near('wT#' + i, w.T, c.wT, 1e-9); // เทียบกับการสลับเครื่องหมายทุกแบบ (n ≤ 20) หรือ scipy exact
    } else if (c.kind === 'paired_ties') {
      const w = S.wilcoxon(c.pre, c.post); near('wTies p#' + i, w.p, c.pp, 1e-12); near('wTies T#' + i, w.T, c.wT, 1e-9);
    } else if (c.kind === 'welch') {
      const r = S.welch(c.a, c.b); near('welch t#' + i, r.t, c.t, 1e-9); near('welch p#' + i, r.p, c.p, 1e-9); near('welch df#' + i, r.df, c.df, 1e-7); near('welch lo#' + i, r.ci[0], c.lo, 1e-7); near('welch hi#' + i, r.ci[1], c.hi, 1e-7);
    } else if (c.kind === 'tinv') c.vals.forEach((v) => near('tinv df=' + v[0], S.tInv(0.975, v[0]), v[1], 1e-6));
    else if (c.kind === 'kappa') {
      near('kappa none#' + i, S.kappa(c.x, c.y, c.K, 'none').kappa, c.none, 1e-12); near('kappa linear#' + i, S.kappa(c.x, c.y, c.K, 'linear').kappa, c.lin, 1e-12); near('kappa quad#' + i, S.kappa(c.x, c.y, c.K, 'quadratic').kappa, c.quad, 1e-12);
    }
  });
} else console.log('ไม่พบ ref_stats.json ข้ามชุดเทียบ scipy');
// alpha ของคริพเพนดอร์ฟ: ข้อมูลตัวอย่างจาก Krippendorff (2011) ค่าที่ตีพิมพ์: nominal .743, interval .849, ordinal .815
const N = null, K = [[1, 1, N, 1], [2, 2, 3, 2], [3, 3, 3, 3], [3, 3, 3, 3], [2, 2, 2, 2], [1, 2, 3, 4], [4, 4, 4, 4], [1, 1, 2, 1], [2, 2, 2, 2], [N, 5, 5, 5], [N, N, 1, 1], [N, 3, N, N]];
near('alpha nominal', S.alpha(K, 'nominal').alpha, 0.743, 5e-4); near('alpha interval', S.alpha(K, 'interval').alpha, 0.849, 5e-4); near('alpha ordinal', S.alpha(K, 'ordinal').alpha, 0.815, 5e-4);
// ค่ากรณีเล็ก ๆ ที่คำนวณมือได้
near('quantile', S.quantile([1, 2, 3, 4, 5], 0.25), 2); near('iqr', S.iqr([1, 2, 3, 4, 5]), 2); near('median even', S.median([1, 2, 3, 4]), 2.5);
near('kappa perfect', S.kappa([0, 1, 2, 1], [0, 1, 2, 1], 3, 'quadratic').kappa, 1);
console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
