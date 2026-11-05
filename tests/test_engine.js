// ทดสอบ: เครื่องคำนวณบนเว็บต้องให้ผลตรงกับเครื่องมือ Excel ต้นแบบ (ข้อมูลตัวอย่างสมมติชุดเดียวกัน)
// รัน: node tests/test_engine.js
const path = require('path');
const data = require(path.join(__dirname, '..', 'data.js'));
const { analyze } = require(path.join(__dirname, '..', 'engine.js'));
const exp = require(path.join(__dirname, 'expected_from_excel.json'));

const out = analyze({ risk: data.example.risk, seven: data.example.seven, resource: data.example.resource }, data);
let fails = 0, checks = 0;
const eq = (name, a, b, tol) => {
  checks++;
  const ok = typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= (tol || 1e-9) : a === b;
  if (!ok) { fails++; console.log('FAIL', name, 'web=', a, 'excel=', b); }
};

out.domains.forEach((d) => {
  const e = exp.domains[d.code];
  eq(d.code + ' Rd', d.rd, e.rd); eq(d.code + ' Cmax', d.cmax, e.cmax);
  eq(d.code + ' override', d.override ? 'ใช่' : 'ไม่', e.override);
  eq(d.code + ' risk', d.risk, e.risk); eq(d.code + ' ready', d.ready, e.ready); eq(d.code + ' group', d.group, e.group);
  const sel = d.measures.map((m) => m.id);
  eq(d.code + ' measures', sel.join(','), (exp.selected[d.code] || []).join(','));
});
out.elements.forEach((el) => {
  const e = exp.elements[el.code];
  eq(el.code + ' D', el.d, e.d); eq(el.code + ' I', el.i, e.i); eq(el.code + ' gap', el.gap, e.gap, 1e-9);
  eq(el.code + ' PNI', el.pni, e.pni); eq(el.code + ' rank', el.rank, e.rank);
});
eq('readiness mean', out.readyMean, exp.readiness.mean); eq('readiness before', out.readyBefore, exp.readiness.before); eq('readiness final', out.readyFinal, exp.readiness.final);

// กรณีทดสอบเพิ่ม: กฎเพดาน (D ของระบบต่ำแต่ค่าเฉลี่ยรวมสูง ต้องไม่ได้ระดับสูง)
const high = { risk: data.example.risk, seven: {}, resource: 'เพียงพอ' };
data.sevenItems.forEach((s) => { high.seven[s.id] = [s.elem === 'SYS' ? 2 : 5, 5]; });
const o2 = analyze(high, data);
eq('floor rule before', o2.readyBefore, 'สูง'); eq('floor rule final', o2.readyFinal, 'กลาง'); eq('floor flag', o2.floorHit, true);
// กรณีทดสอบเพิ่ม: ข้อมูลว่างต้องไม่ล้ม
const o3 = analyze({ risk: {}, seven: {}, resource: 'จำกัด' }, data);
eq('empty group', o3.domains[0].group, null);

console.log(checks + ' checks, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
