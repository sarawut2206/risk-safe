// ทดสอบตัวตรวจและตัวโหลดคลังมาตรการ  รัน: node tests/test_bankloader.js
const path = require('path');
const data = require(path.join(__dirname, '..', 'data.js'));
const { validateBank, fetchBank } = require(path.join(__dirname, '..', 'bankloader.js'));
const ctx = { domains: data.domains.map((d) => d.code), elements: data.elements.map((e) => e.code) };
let checks = 0, fails = 0;
const ok = (name, cond) => { checks++; if (!cond) { fails++; console.log('FAIL', name); } };
const clone = () => JSON.parse(JSON.stringify(data.bank));

// 1) คลังที่ฝังในเว็บต้องผ่านตัวตรวจทั้ง 68 แถว
const v = validateBank(clone(), ctx);
ok('bundled bank valid', v.ok && v.rows.length === 68);
ok('SB codes unique and sequential', v.rows.every((r, i) => r.sb === 'SB-' + String(i + 1).padStart(3, '0')));
ok('extra fields kept', v.rows.every((r) => r.tows && r.target && r.output && r.outcome && r.evid && r.status));
ok('prerequisites point to existing SB codes', v.rows.every((r) => (r.prereq.match(/SB-\d{3}/g) || []).every((c) => v.rows.some((x) => x.sb === c))));
ok('backward compatible: row without extra fields is valid', validateBank(clone().map((r) => ({ id: r.id, dom: r.dom, name: r.name, desc: r.desc, elem: r.elem, type3: r.type3, pillar: r.pillar, phase: r.phase, res: r.res, owner: r.owner, kpi: r.kpi, risk: r.risk, ready: r.ready, online: r.online })), ctx).ok);

// 1ข) ข้อมูลตั้งต้นใน apps-script/Code.gs (SEED) ต้องผ่านตัวตรวจ และตรงกับ data.js แถวต่อแถว
{
  const vm = require('vm'), fs = require('fs');
  const src = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8');
  const sandbox = {};
  vm.runInNewContext(src + ';\nthis.HEAD = HEAD; this.SEED = SEED;', sandbox);
  const rows = sandbox.SEED.map((r) => { const o = {}; sandbox.HEAD.forEach((k, j) => { o[k] = (k === 'res') ? Number(r[j]) : String(r[j]).trim(); }); return o; });
  const g = validateBank(rows, ctx);
  ok('Code.gs SEED valid (68 rows)', g.ok && g.rows.length === 68);
  ok('Code.gs SEED equals data.js', g.ok && JSON.stringify(g.rows) === JSON.stringify(v.rows));
}

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
bad('รหัส SB ผิดรูปแบบ', (b) => { b[0].sb = 'SB-1'; });
bad('TOWS ผิด', (b) => { b[0].tows = 'XX'; });
bad('ฟิลด์เสริมยาวเกิน', (b) => { b[0].output = 'ก'.repeat(301); });
bad('qpri = 0', (b) => { b[0].qpri = 0; });
bad('qpri เกิน 20', (b) => { b[0].qpri = 21; });
bad('qpri ไม่ใช่จำนวนเต็ม', (b) => { b[0].qpri = 1.5; });
{ const b = clone(); b[0].qpri = '2'; b[1].qpri = ''; const r = validateBank(b, ctx); ok('qpri "2" (จากชีต) แปลงเป็นตัวเลข และค่าว่างใช้ได้', r.ok && r.rows[0].qpri === 2 && r.rows[1].qpri === undefined); }
bad('evg ผิด', (b) => { b[0].evg = 'E'; });
ok('evg A-D with source and note kept by loader', v.rows.every((r) => 'ABCD'.indexOf(r.evg) >= 0 && typeof r.evnote === 'string' && r.evnote.length > 0));
bad('แถวน้อยเกินไป', (b) => { b.length = 5; });
ok('reject non-array', !validateBank({ a: 1 }, ctx).ok);

// 3) fetchBank ด้วย fetch จำลอง
const respond = (text, status) => async () => ({ ok: status === undefined || status < 400, status: status || 200, text: async () => text });
(async () => {
  global.fetch = respond(JSON.stringify({ ok: true, version: 'v9', updated: '2026-11-05', note: 'ทดสอบ', count: 68, bank: clone() }));
  const good = await fetchBank('https://example.test/x', ctx, 1000);
  ok('fetch ok rows', good.rows.length === 68 && good.version === 'v9' && good.updated === '2026-11-05');

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
