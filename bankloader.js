/* R²-SAFE: ตัวโหลดคลังมาตรการจากชีตภายนอก (อ่านอย่างเดียว)
   ตรวจข้อมูลอย่างเข้มก่อนใช้ ถ้าผิดแม้แถวเดียวจะไม่ใช้ทั้งชุด และเว็บจะใช้ข้อมูลที่ฝังไว้แทน
   ไม่ส่งข้อมูลที่ผู้ใช้กรอกออกไปที่ใด */
(function (root) {
  'use strict';
  const LEVELS = ['สูง', 'กลาง', 'ต่ำ'];
  const TYPES3 = ['ป้องกัน', 'ปลูกฝัง', 'ปราบปราม'];
  const isStr = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

  function levelList(v) {
    if (typeof v !== 'string') return null;
    const parts = v.split(',').map((x) => x.trim());
    return parts.length && parts.every((p) => LEVELS.indexOf(p) >= 0) ? parts : null;
  }

  function validateBank(rows, ctx) {
    const errors = [];
    if (!Array.isArray(rows)) return { ok: false, errors: ['ข้อมูลไม่ใช่รายการ'], rows: [] };
    if (rows.length < 10 || rows.length > 300) errors.push('จำนวนแถวผิดปกติ: ' + rows.length);
    const domains = ctx.domains.concat(['X']);
    const seen = {};
    const clean = [];
    rows.forEach((r, i) => {
      const at = 'แถว ' + (i + 1) + (r && r.id ? ' (' + r.id + ')' : '') + ': ';
      if (!r || typeof r !== 'object') { errors.push(at + 'ไม่ใช่ข้อมูล'); return; }
      const res = Number(r.res);
      const bad = [];
      if (!/^[VAPHX]\d{2}$/.test(String(r.id))) bad.push('รหัส');
      if (seen[r.id]) bad.push('รหัสซ้ำ');
      if (domains.indexOf(r.dom) < 0) bad.push('ด้านของภัย');
      if (ctx.elements.indexOf(r.elem) < 0) bad.push('องค์ประกอบ 7-S');
      if (!isStr(r.name, 200)) bad.push('ชื่อมาตรการ');
      if (!isStr(r.desc, 600)) bad.push('รายละเอียด');
      if (TYPES3.indexOf(r.type3) < 0) bad.push('ประเภท 3 ป.');
      if (!isStr(r.pillar, 60)) bad.push('เสาหลัก');
      if (!isStr(r.phase, 40)) bad.push('ระยะ');
      if (!(Number.isInteger(res) && res >= 1 && res <= 3)) bad.push('ทรัพยากร');
      if (!isStr(r.owner, 160)) bad.push('ผู้รับผิดชอบ');
      if (!isStr(r.kpi, 300)) bad.push('ตัวชี้วัด');
      if (!levelList(r.risk)) bad.push('เหมาะกับความเสี่ยง');
      if (!levelList(r.ready)) bad.push('เหมาะกับความพร้อม');
      if (r.online !== 'Y' && r.online !== 'N') bad.push('ออนไลน์ (Y/N)');
      if (bad.length) { errors.push(at + 'ไม่ผ่าน: ' + bad.join(', ')); return; }
      seen[r.id] = true;
      clean.push({
        id: r.id, dom: r.dom, name: r.name.trim(), desc: r.desc.trim(), elem: r.elem, type3: r.type3, pillar: r.pillar.trim(), phase: r.phase.trim(),
        res: res, owner: r.owner.trim(), kpi: r.kpi.trim(), risk: levelList(r.risk).join(','), ready: levelList(r.ready).join(','), online: r.online,
      });
    });
    return { ok: errors.length === 0, errors: errors.slice(0, 8), rows: errors.length ? [] : clean };
  }

  async function fetchBank(url, ctx, timeoutMs) {
    if (!url) throw new Error('ยังไม่ได้ตั้งค่า URL');
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs || 8000) : null;
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow', cache: 'no-store', credentials: 'omit', signal: ctl ? ctl.signal : undefined });
      if (!res.ok) throw new Error('เซิร์ฟเวอร์ตอบ ' + res.status);
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch (e) { throw new Error('ข้อมูลที่ได้ไม่ใช่ JSON (สคริปต์อาจยังไม่มี doGet ที่ถูกต้อง)'); }
      if (!json || json.ok !== true || !Array.isArray(json.bank)) throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
      const v = validateBank(json.bank, ctx);
      if (!v.ok) throw new Error('ข้อมูลในชีตไม่ผ่านการตรวจ: ' + v.errors.join(' | '));
      return { rows: v.rows, version: String(json.version || '').slice(0, 40), updated: String(json.updated || '').slice(0, 40), note: String(json.note || '').slice(0, 160) };
    } finally { if (timer) clearTimeout(timer); }
  }

  const api = { validateBank, fetchBank };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RS_BANKLOADER = api;
})(typeof window !== 'undefined' ? window : this);
