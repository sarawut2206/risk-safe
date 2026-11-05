// ทดสอบตัวตรวจและตัวโหลดคลังมาตรการ  รัน: node tests/test_bankloader.js
const path = require('path');
const data = require(path.join(__dirname, '..', 'data.js'));
const { validateBank, fetchBank } = require(path.join(__dirname, '..', 'bankloader.js'));
const ctx = { domains: data.domains.map((d) => d.code), elements: data.elements.map((e) => e.code) };
let checks = 0, fails = 0;
const ok = (name, cond) => { checks++; if (!cond) { fails++; console.log('FAIL', name); } };
const clone = () => JSON.parse(JSON.stringify(data.bank));

// 1) คลังที่ฝังในเว็บต้องผ่านตัวตรวจทั้ง 62 แถว
const v = validateBank(clone(), ctx);
ok('bundled bank valid', v.ok && v.rows.length === 62);

// 2) ข้อมูลผิดรูปแบบต้องถูกปฏิเสธทั้งชุด
const bad = (name, mut) => { const b = clone(); mut(b); const r = validateBank(b, ctx); ok('reject: ' + name, !r.ok && r.rows.length === 0); };
bad('รหัสผิด', (b) => { b[0].id = 'Z99'; });
bad('รหัสซ้ำ', (b) => { b[1].id = b[0].id; });
bad('ด้านผิด', (b) => { b[0].dom = 'Q'; });
bad('7-S ผิด', (b) => { b[0].elem = 'XXX'; });
bad('ทรัพยากรนอกช่วง', (b) => { b[0].res = 9; });
bad('ทรัพยากรไม่ใช่จำนวนเต็ม', (b) => { b[0].res = 1.5; });
bad('ระดับความเสี่ยงผิด', (b) => { b[0].risk = 'สูง,ไม่ทราบ'; });
bad('ชื่อว่าง', (b) => { b[0].name = '   '; });
bad('ข้อความยาวเกิน', (b) => { b[0].desc = 'ก'.repeat(601); });
bad('ประเภท 3 ป. ผิด', (b) => { b[0].type3 = 'อื่น'; });
bad('ออนไลน์ไม่ใช่ Y/N', (b) => { b[0].online = 'ใช่'; });
bad('แถวน้อยเกินไป', (b) => { b.length = 5; });
ok('reject non-array', !validateBank({ a: 1 }, ctx).ok);

// 3) fetchBank ด้วย fetch จำลอง
const respond = (text, status) => async () => ({ ok: status === undefined || status < 400, status: status || 200, text: async () => text });
(async () => {
  global.fetch = respond(JSON.stringify({ ok: true, version: 'v9', updated: '2026-11-05', note: 'ทดสอบ', count: 62, bank: clone() }));
  const good = await fetchBank('https://example.test/x', ctx, 1000);
  ok('fetch ok rows', good.rows.length === 62 && good.version === 'v9' && good.updated === '2026-11-05');

  const expectFail = async (name, fn, re) => { try { await fn(); ok(name + ' (ควรล้มเหลว)', false); } catch (e) { ok(name, re.test(e.message)); } };
  global.fetch = respond('<!DOCTYPE html><html>ข้อผิดพลาด ไม่พบฟังก์ชันของสคริปต์: doGet</html>');
  await expectFail('HTML error page (เหมือน URL ปัจจุบัน)', () => fetchBank('https://example.test/x', ctx, 1000), /ไม่ใช่ JSON/);
  global.fetch = respond(JSON.stringify({ ok: false, error: 'ไม่พบแผ่น' }));
  await expectFail('ok=false', () => fetchBank('https://example.test/x', ctx, 1000), /รูปแบบ/);
  const b2 = clone(); b2[3].res = 7;
  global.fetch = respond(JSON.stringify({ ok: true, bank: b2 }));
  await expectFail('ข้อมูลผิดในชีต', () => fetchBank('https://example.test/x', ctx, 1000), /ไม่ผ่านการตรวจ/);
  global.fetch = respond('', 500);
  await expectFail('HTTP 500', () => fetchBank('https://example.test/x', ctx, 1000), /500/);
  await expectFail('ไม่ตั้ง URL', () => fetchBank('', ctx, 1000), /URL/);

  console.log(checks + ' checks, ' + fails + ' failed');
  process.exit(fails ? 1 : 0);
})();
