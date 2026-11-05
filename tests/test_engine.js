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

// ลำดับ QSPM (qpri): ค่าว่างต้องไม่เปลี่ยนผล ส่วนค่าที่ใส่ต้องดันมาตรการขึ้น/ลงภายในกลุ่มเดียวกัน
{
  const clone = (mut) => { const d = Object.assign({}, data, { bank: data.bank.map((b) => Object.assign({}, b)) }); mut(d.bank); return d; };
  const base = analyze({ risk: data.example.risk, seven: data.example.seven, resource: data.example.resource }, data);
  const same = analyze({ risk: data.example.risk, seven: data.example.seven, resource: data.example.resource }, clone((b) => b.forEach((x) => { x.qpri = 1; })));
  eq('qpri=1 everywhere keeps result', same.domains.map((d) => d.measures.map((m) => m.id).join(',')).join('|'), base.domains.map((d) => d.measures.map((m) => m.id).join(',')).join('|'));
  const v = base.domains[0], first = v.measures[0].id, last = v.measures[v.measures.length - 1].id;
  const swapped = analyze({ risk: data.example.risk, seven: data.example.seven, resource: data.example.resource }, clone((b) => { b.find((x) => x.id === first).qpri = 3; }));
  const ids = swapped.domains[0].measures.map((m) => m.id);
  eq('qpri=3 pushes first measure down', ids[0] !== first, true);
  // มาตรการใหม่ (V13) ที่ได้ qpri=1 ขณะที่ตัวเก่าในกลุ่มบักเก็ตเดียวกันถูกดัน qpri=2 ต้องมีโอกาสถูกเลือก
  const promo = analyze({ risk: data.example.risk, seven: data.example.seven, resource: data.example.resource }, clone((b) => { b.forEach((x) => { if (x.dom === 'V' || x.dom === 'X') x.qpri = x.id === 'V13' ? 1 : 2; }); }));
  eq('promoted new measure V13 now selected', promo.domains[0].measures.some((m) => m.id === 'V13'), true);
}

// ระดับหลักฐาน (evg) และการแยกมาตรการที่เกินทรัพยากร และการแจ้งเงื่อนไขก่อนดำเนินการ
{
  const ex = { risk: data.example.risk, seven: data.example.seven, resource: data.example.resource };
  const base = analyze(ex, data);
  const clone = (mut) => { const d = Object.assign({}, data, { bank: data.bank.map((b) => Object.assign({}, b)) }); mut(d.bank); return d; };
  eq('every bank item has evidence grade A-D', data.bank.every((b) => 'ABCD'.indexOf(b.evg) >= 0), true);
  const noEv = analyze(ex, clone((b) => b.forEach((x) => { delete x.evg; })));
  const ids = (o) => o.domains.map((d) => d.measures.map((m) => m.id).join(',')).join('|');
  eq('grade ordering changes at least one selection vs no grades', ids(noEv) !== ids(base), true);
  // ในกลุ่มเดียวกันที่ 7-S อยู่/ไม่อยู่ใน 3 อันดับเท่ากัน ลำดับต้องไม่ทำให้เกรดแย่ขึ้นก่อนเกรดดีกว่า
  let okOrder = true;
  base.domains.forEach((d) => { for (let i = 1; i < d.measures.length; i++) { const a = d.measures[i - 1], b = d.measures[i]; if (a.top === b.top && 'ABCD'.indexOf(a.evg) > 'ABCD'.indexOf(b.evg)) okOrder = false; } });
  eq('within same 7-S bucket, better evidence grade never ranked after worse', okOrder, true);
  const lim = analyze({ risk: data.example.risk, seven: data.example.seven, resource: 'จำกัด' }, data);
  eq('over-resource measures are listed separately, not dropped', lim.domains.every((d) => Array.isArray(d.stretch)) && lim.domains.some((d) => d.stretch.length > 0), true);
  eq('stretch measures all exceed available resource', lim.domains.every((d) => d.stretch.every((m) => m.res > 1)), true);
  const withPre = base.domains.flatMap((d) => d.measures).filter((m) => m.prereqInfo.length);
  eq('prerequisite info present for measures that have a prerequisite', withPre.length > 0 && withPre.every((m) => m.prereqInfo.every((p) => /^SB-\d{3}$/.test(p.sb) && typeof p.selected === 'boolean')), true);
}

console.log(checks + ' checks, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
