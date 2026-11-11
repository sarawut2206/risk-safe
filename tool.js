/* Risk Safe (R²-SAFE) ต้นแบบ: หน้าตาแบบแอป (มือถือก่อน) ของส่วนเครื่องมือประเมิน
   ไฟล์นี้สร้างเฉพาะ HTML ของหน้าเครื่องมือ ส่วนการคำนวณทั้งหมดมาจาก engine.js ไม่มีการส่งข้อมูลออกนอกเบราว์เซอร์ */
(function (root) {
  'use strict';

  // ---------- ไอคอน (เส้น 24px) ----------
  const P = {
    home: '<path d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
    alert: '<path d="M12 3.5 2.8 20h18.4z"/><path d="M12 10v4.5M12 17.2v.3"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6z"/>',
    shieldcheck: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12 2.3 2.3 4.2-4.6"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.2"/><path d="m16 8 5-5M18.5 3v3h3"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/><path d="m9 15 2 2 4-4"/>',
    people: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.2c2.7.2 4.5 2.4 4.5 5.3"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    cap: '<path d="m2.5 9 9.5-4.5L21.5 9 12 13.5z"/><path d="M6.5 11.3V16c0 1.4 2.5 2.7 5.5 2.7s5.5-1.3 5.5-2.7v-4.7M21.5 9v5"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2.5 19h19"/>',
    scale: '<path d="M12 4v16M7 20h10M4 7h16"/><path d="m4 7-2.5 6a3 3 0 0 0 5 0zM20 7l-2.5 6a3 3 0 0 0 5 0z"/>',
    pulse: '<path d="M2 12h4l2.5-6 4 12 2.5-6H22"/>',
    fist: '<path d="M7 12V8.5a1.5 1.5 0 0 1 3 0V12M10 11V7.5a1.5 1.5 0 0 1 3 0V11M13 11V8.5a1.5 1.5 0 0 1 3 0V13c0 4-2 6.5-5.5 6.5S6 17 6 14.5V12.5a1.5 1.5 0 0 1 1-1.4"/>',
    upload: '<path d="M12 16V5M7.5 9.5 12 5l4.5 4.5"/><path d="M4 16v3.5h16V16"/>',
    clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 12.5l2.3 2.3 4.5-4.8"/>',
    bars: '<path d="M5 20v-8M12 20V5M19 20v-11"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.2 1.1 2.2h5c0-1 .4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
    download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4 16v3.5h16V16"/>',
    print: '<path d="M7 9V3.5h10V9M7 17H4.5v-7h15v7H17"/><rect x="7" y="14" width="10" height="6.5"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>',
    chev: '<path d="m9 5 7 7-7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.4"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    building: '<path d="M3 20h18M5 20V10l7-5 7 5v10M9.5 20v-5h5v5M10 11h4"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  };
  const ic = (n, s) => '<svg class="ic" viewBox="0 0 24 24" width="' + (s || 22) + '" height="' + (s || 22) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>';

  // ภาพประกอบอาคารเรียนแบบเรียบ (ไม่ใช่ภาพโรงเรียนจริง)
  const SCHOOL = '<svg viewBox="0 0 220 120" role="img" aria-label="ภาพประกอบอาคารเรียน" class="school-ill">' +
    '<ellipse cx="108" cy="112" rx="104" ry="7" fill="#cfe3f5"/>' +
    '<rect x="20" y="52" width="176" height="58" rx="3" fill="#fff" stroke="#9db9d6"/>' +
    '<path d="M12 54 108 22l96 32z" fill="#d95f4b" stroke="#b64a39" stroke-linejoin="round"/>' +
    '<rect x="88" y="62" width="40" height="48" rx="2" fill="#5b8fcb"/><path d="M108 62v48" stroke="#fff" stroke-width="2"/>' +
    '<circle cx="108" cy="42" r="7" fill="#fff" stroke="#9db9d6"/><path d="M108 38v4h3" fill="none" stroke="#5b8fcb" stroke-width="1.6"/>' +
    '<g fill="#8ec0ee" stroke="#9db9d6"><rect x="34" y="66" width="16" height="16" rx="2"/><rect x="58" y="66" width="16" height="16" rx="2"/><rect x="142" y="66" width="16" height="16" rx="2"/><rect x="166" y="66" width="16" height="16" rx="2"/><rect x="34" y="88" width="16" height="14" rx="2"/><rect x="58" y="88" width="16" height="14" rx="2"/><rect x="142" y="88" width="16" height="14" rx="2"/><rect x="166" y="88" width="16" height="14" rx="2"/></g>' +
    '<path d="M205 110V30" stroke="#7a8da3" stroke-width="2"/><path d="M205 30h18v12h-18z" fill="#d95f4b"/><path d="M205 34h18v4h-18z" fill="#fff"/><path d="M205 36h18" stroke="#2a4f8f" stroke-width="3"/>' +
    '<circle cx="12" cy="92" r="11" fill="#7cc576"/><rect x="10.5" y="98" width="3" height="12" fill="#8a6a45"/></svg>';
  const LOGO = '<svg viewBox="0 0 40 46" width="38" height="44" aria-hidden="true"><path d="M20 2 3 8v14c0 11 7 19 17 22 10-3 17-11 17-22V8z" fill="#fff"/><path d="M20 5.5 6 10.3V22c0 9.2 5.8 15.8 14 18.6 8.2-2.8 14-9.4 14-18.6V10.3z" fill="#1d63b8"/><path d="M20 8 9 11.8V21h11z" fill="#d64545"/><path d="M20 8l11 3.8V21H20z" fill="#e0a526"/><path d="M9 21h11v17.3C13.6 36 9 30 9 22z" fill="#2e9e6b"/><path d="M20 21h11v1c0 8-4.6 14-11 16.3z" fill="#3b78c4"/></svg>';

  const HZ = { V: ['ความรุนแรง', 'fist'], A: ['อุบัติเหตุ/ภัยพิบัติ', 'alert'], P: ['ละเมิดสิทธิ', 'scale'], H: ['สุขภาวะ', 'pulse'] };
  const EL_IC = { STG: 'target', STR: 'building', SYS: 'gear', STY: 'people', STF: 'people', SKL: 'cap', VAL: 'heart' };
  const SCALE_WORD = ['น้อยมาก', 'น้อย', 'ปานกลาง', 'มาก', 'มากที่สุด'];
  const RC = { 'สูง': 'hi', 'กลาง': 'mid', 'ต่ำ': 'lo' };
  const RCR = { 'สูง': 'lo', 'กลาง': 'mid', 'ต่ำ': 'hi' }; // ความพร้อม: สูงคือดี
  const DOC_TYPES = [['SAR', 'อัปโหลด SAR', 'รายงานการประเมินตนเองของสถานศึกษา (SAR)', 'doc', 'red'], ['RAF', 'อัปโหลดแผนเผชิญเหตุ', 'แผนเผชิญเหตุของสถานศึกษา (ฉบับปัจจุบัน)', 'shield', 'blue'], ['INC', 'อัปโหลดรายงานเหตุการณ์', 'รายงานเหตุการณ์ความไม่ปลอดภัย (ย้อนหลัง/ล่าสุด)', 'alert', 'purple'], ['OTH', 'เพิ่มเอกสารอื่น', 'เช่น แผนความปลอดภัย นโยบาย คู่มือ หรือเอกสารที่เกี่ยวข้อง', 'plus', 'green']];
  const DOC_NAME = { SAR: 'SAR', RAF: 'แผนเผชิญเหตุ', INC: 'รายงานเหตุการณ์', ACT: 'แผนปฏิบัติการ', OTH: 'เอกสารอื่น' };

  function create(c) {
    const { S, D, E, esc, fmt, getOut } = c;
    const lv = (l) => (l ? '<span class="lv r-' + RC[l] + '">' + l + '</span>' : '<span class="lv na">ยังไม่มีข้อมูล</span>');
    const lvr = (l) => (l ? '<span class="lv r-' + RCR[l] + '">' + l + '</span>' : '<span class="lv na">ยังไม่มีข้อมูล</span>');
    const hasData = (out) => out.domains.some((d) => d.group);
    const banner = (icon, title, sub) => '<div class="tbanner"><span class="bi">' + ic(icon, 34) + '</span><div><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div></div>';
    const card = (title, body, opt) => { opt = opt || {}; return '<section class="tcard' + (opt.cls ? ' ' + opt.cls : '') + '">' + (title ? '<h2>' + (opt.icon ? '<span class="hi">' + ic(opt.icon, 22) + '</span>' : '') + title + (opt.aside ? '<span class="aside">' + opt.aside + '</span>' : '') + '</h2>' : '') + body + '</section>'; };
    const btn = (go, label, cls, icon) => '<button class="tbtn ' + (cls || '') + '" data-go="' + go + '">' + (icon ? ic(icon, 20) : '') + '<span>' + label + '</span>' + ic('chev', 18) + '</button>';
    const sizeOf = (n) => (!(n > 0) ? '' : n <= 120 ? 'ขนาดเล็ก' : n <= 600 ? 'ขนาดกลาง' : n <= 1500 ? 'ขนาดใหญ่' : 'ขนาดใหญ่พิเศษ');
    const dateTh = (d) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const kb = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
    const worstDomain = (out) => out.domains.filter((d) => d.risk).sort((a, b) => RANK_R[b.risk] - RANK_R[a.risk] || b.rd - a.rd)[0];
    const RANK_R = { 'สูง': 3, 'กลาง': 2, 'ต่ำ': 1 };

    function empty(msg) {
      return banner('clipboard', 'ยังไม่มีข้อมูลสำหรับวิเคราะห์', 'ต้องมีทั้งคะแนนความเสี่ยงและคะแนนความพร้อม 7-S') +
        card('', '<p class="lead">' + esc(msg || 'กรอกข้อมูลโรงเรียนเอง หรือโหลดข้อมูลตัวอย่าง (โรงเรียนสมมติ) เพื่อดูว่าระบบทำงานอย่างไร') + '</p><div class="row-btns"><button class="tbtn primary" data-act="example"><span>ใส่ข้อมูลตัวอย่างและดูผล</span>' + ic('chev', 18) + '</button><button class="tbtn" data-go="school"><span>เริ่มกรอกข้อมูลโรงเรียน</span>' + ic('chev', 18) + '</button></div>');
    }

    // ---------- เปลือกแอป ----------
    const NAVB = [['dash', 'หน้าแรก', 'home'], ['rassess', 'ความเสี่ยง', 'alert'], ['ready', 'ความพร้อม', 'shieldcheck'], ['strategy', 'กลยุทธ์', 'target'], ['plan', 'แผนงาน', 'calendar']];
    const ACTIVE = { moe: 'dash', plandoc: 'plan', brief: 'dash', school: 'dash', matrix: 'dash', rules: 'dash', pni: 'strategy', explain: 'strategy', track: 'plan', evaluate: 'dash', lab: 'dash' };
    // แถบขั้นตอน: บอกว่าอยู่ขั้นไหน ทำอะไรครบแล้ว และปุ่มทำต่อ (แสดงเฉพาะหน้าหลักของเครื่องมือ)
    const GUIDE_AT = { school: 0, rassess: 1, ready: 2, dash: 3, brief: 3, matrix: 3, strategy: 3, pni: 3, plan: 4, plandoc: 4 };
    function guide(cur) {
      const at = GUIDE_AT[cur]; if (at == null) return '';
      const f = c.filled(), sc = S.school, hasD = hasData(getOut());
      const steps = [['school', 'ข้อมูลโรงเรียน', !!(sc.name && sc.students)], ['rassess', 'ความเสี่ยง', f.r === f.rt], ['ready', 'ความพร้อม', f.s === f.st], ['strategy', 'ผลและมาตรการ', false], ['plan', 'แผนปฏิบัติการ', false]];
      let next = null;
      for (let i = 0; i < 3 && !next; i++) if (!steps[i][2] && i !== at) next = [steps[i][0], (i === 0 ? 'ใส่ข้อมูลโรงเรียน' : i === 1 ? 'ให้คะแนนความเสี่ยง' : 'ให้คะแนนความพร้อม')];
      if (!next) next = at < 3 ? (hasD ? ['strategy', 'ดูผลและมาตรการ'] : null) : (at === 3 ? ['plan', 'ไปแผนปฏิบัติการ'] : null);
      const done = (i) => (i < 3 ? steps[i][2] : i === 3 ? hasD && at > 3 : false);
      return '<nav class="guide" aria-label="ขั้นตอนการใช้งาน"><ol>' + steps.map((st, i) => '<li class="' + (i === at ? 'cur' : done(i) ? 'done' : '') + '"><button data-go="' + st[0] + '"' + (i === at ? ' aria-current="step"' : '') + '><b>' + (done(i) && i !== at ? ic('check', 14) : i + 1) + '</b><span>' + st[1] + '</span></button></li>').join('') + '</ol>' +
        (next ? '<button class="tbtn primary gnext" data-go="' + next[0] + '"><span>ทำต่อ: ' + next[1] + '</span>' + ic('chev', 18) + '</button>' : '<span class="gdone">' + ic('check', 18) + ' ครบทุกขั้นตอนแล้ว ปรับคะแนนหรือแผนได้ทุกเมื่อ</span>') + '</nav>';
    }
    function shell(cur, inner) {
      const act = ACTIVE[cur] || cur;
      return '<div class="tapp">' +
        '<div class="thead"><div class="tbrand">' + LOGO + '<div><b>R<sup>2</sup>-SAFE</b><span>ภาพรวมความปลอดภัยของโรงเรียน</span></div></div><div class="till">' + SCHOOL + '</div></div>' +
        '<div class="tctx"><span class="aud">' + ic('people', 18) + 'สำหรับผู้บริหารสถานศึกษา (ผู้อำนวยการโรงเรียน)</span>' +
        '<div class="ctxrow"><span>' + ic('building', 18) + '<small>โรงเรียน</small><b>' + esc(S.school.name || 'ยังไม่ระบุ') + '</b></span><span>' + ic('calendar', 18) + '<small>ปีการศึกษา</small><b>' + esc(S.school.year || '–') + '</b></span><button class="lnk" data-go="school">แก้ไข</button></div>' +
        '<div class="ttools"><span class="chip" id="fill-chip"></span><button class="lnk" data-act="example">ใส่ข้อมูลตัวอย่าง</button><button class="lnk" data-act="clear">ล้างข้อมูล</button><button class="lnk" data-go="moe">ประกาศ ศธ. 7 ข้อ</button><button class="lnk" data-go="rules">กฎและเกณฑ์</button><button class="lnk" data-go="explain">กฎตัดสินใจ</button><button class="lnk" data-go="track">ติดตามผล</button><button class="lnk" data-go="evaluate">ประเมินนวัตกรรม</button><button class="lnk" data-go="lab">ห้องวิเคราะห์</button></div></div>' +
        guide(cur) + '<div class="tbody">' + inner + '</div>' +
        '<p class="tnote">ต้นแบบเพื่อการวิจัย ใช้ข้อมูลจำลอง ข้อมูลที่กรอกอยู่ในเบราว์เซอร์นี้เท่านั้นและหายเมื่อรีเฟรช (ดาวน์โหลดแฟ้มงานเก็บไว้ได้ที่หน้า &quot;ติดตามผล&quot;) ไม่ใช้แทนการตอบสนองเหตุฉุกเฉิน (191 ตำรวจ · 1669 การแพทย์ฉุกเฉิน · 199 ดับเพลิง)</p>' +
        '<nav class="bnav" aria-label="เมนูเครื่องมือ">' + NAVB.map((n) => '<button data-go="' + n[0] + '"' + (n[0] === act ? ' aria-current="page"' : '') + '>' + ic(n[2], 26) + '<span>' + n[1] + '</span></button>').join('') + '</nav></div>';
    }

    // ---------- หน้า: ข้อมูลโรงเรียนและเอกสาร ----------
    function pageSchool() {
      const sc = S.school, f = c.filled();
      const fld = (k, label, icon, type, ph, suf) => '<label class="sfld"><span>' + ic(icon, 20) + label + '</span><span class="in"><input type="' + type + '" data-sf="' + k + '" value="' + esc(sc[k] == null ? '' : sc[k]) + '" placeholder="' + esc(ph) + '"' + (type === 'number' ? ' min="0" inputmode="numeric"' : '') + ' maxlength="80">' + (suf ? '<em>' + suf + '</em>' : '') + '</span></label>';
      let s = banner('building', 'ข้อมูลโรงเรียนและเอกสาร', 'ข้อมูลพื้นฐานและเอกสารประกอบการประเมิน');
      s += (root.RS_PLANUI ? root.RS_PLANUI.card('tool') : '');
      s += card('', '<div class="sname"><span class="bi2">' + ic('building', 30) + '</span><div><input class="nameinp" type="text" data-sf="name" value="' + esc(sc.name) + '" placeholder="ชื่อโรงเรียน (ชื่อสมมติ)" maxlength="80" aria-label="ชื่อโรงเรียน"><div class="sz">ขนาดโรงเรียน <span class="lv r-mid" id="size-chip">' + (sizeOf(+sc.students) || 'ระบุจำนวนนักเรียน') + '</span></div></div></div>' +
        '<div class="sfl">' + fld('students', 'นักเรียน', 'people', 'number', 'เช่น 532', 'คน') + fld('staff', 'ครูและบุคลากร', 'clipboard', 'number', 'เช่น 32', 'คน') + fld('year', 'ปีการศึกษา', 'calendar', 'number', 'เช่น 2569', '') + fld('province', 'จังหวัด', 'flag', 'text', 'เช่น ขอนแก่น', '') + '</div>' +
        '<p class="hint">ขนาดโรงเรียนจัดตามจำนวนนักเรียนด้วยเกณฑ์ทั่วไปของ สพฐ. (เล็ก ไม่เกิน 120 · กลาง 121–600 · ใหญ่ 601–1,500 · ใหญ่พิเศษ 1,501 ขึ้นไป) ใช้แสดงผลเท่านั้น ยังไม่ใช้ในการคำนวณ ไม่ควรกรอกชื่อบุคคล</p>', { cls: 'blue' });
      s += card('ทรัพยากรที่มีสำหรับงานความปลอดภัยปีนี้', '<p class="hint">ใช้จำกัดจำนวนและระดับของมาตรการที่ระบบเสนอ (บุคลากร งบประมาณ อุปกรณ์)</p><div class="seg" role="radiogroup" aria-label="ระดับทรัพยากร">' +
        ['จำกัด', 'ปานกลาง', 'เพียงพอ'].map((r) => '<button type="button" role="radio" aria-checked="' + (S.resource === r) + '" data-act="res" data-v="' + r + '"><b>' + r + '</b><small>ระดับ 1' + (r === 'จำกัด' ? '' : r === 'ปานกลาง' ? '–2' : '–3') + ' · สูงสุด ' + E.RESOURCE[r].max + ' ข้อต่อด้าน</small></button>').join('') + '</div>', { icon: 'gear' });

      // อ่านข้อมูลจากแผนปฏิบัติการ (PDF) ในเบราว์เซอร์ของผู้ใช้ ไม่อัปโหลด (ดู planui.js)
      s += (root.RS_PLANUI ? root.RS_PLANUI.detail('tool') : '');
      // เอกสาร: เก็บเฉพาะชื่อไฟล์ ขนาด และวันที่ ในเบราว์เซอร์นี้ ไม่อ่านเนื้อหา ไม่ส่งออก
      s += card('เอกสารโรงเรียน', '<p class="hint">การ์ดนี้ <b>ไม่อ่านเนื้อหาไฟล์และไม่อัปโหลดไฟล์ไปที่ใด</b> (การอ่านข้อมูลจากแผนปฏิบัติการใช้ปุ่มอัปโหลดด้านบนของหน้านี้ และอ่านในเครื่องของท่านเท่านั้น) จดเฉพาะชื่อไฟล์ ขนาด และวันที่ไว้เป็นรายการเอกสารที่ใช้ประกอบการให้คะแนน (หายเมื่อรีเฟรช) รองรับ PDF ไม่เกิน 50 MB ต่อไฟล์ ไม่ควรใส่เอกสารที่มีข้อมูลส่วนบุคคล</p>' +
        '<div class="docgrid">' + DOC_TYPES.map((d) => '<button class="doccard ' + d[4] + '" data-act="doc-pick" data-type="' + d[0] + '"><span class="di">' + ic(d[3], 28) + '</span><span><b>' + d[1] + '</b><small>' + d[2] + '</small></span>' + ic('chev', 18) + '</button>').join('') + '</div>' +
        '<input type="file" id="doc-file" accept="application/pdf,.pdf" multiple hidden>' +
        (S.docs.length ? '<ul class="doclist">' + S.docs.map((d, i) => '<li><span class="di sm">' + ic('doc', 20) + '</span><span class="dn"><b>' + esc(d.name) + '</b><small>' + DOC_NAME[d.type] + ' · ' + kb(d.size) + ' · เพิ่มเมื่อ ' + dateTh(d.date) + '</small></span><button class="icon-btn" data-act="doc-del" data-i="' + i + '" aria-label="ลบ ' + esc(d.name) + ' ออกจากรายการ">' + ic('trash', 18) + '</button></li>').join('') + '</ul>' : '<p class="muted">ยังไม่มีเอกสารในรายการ</p>') +
        '<p class="warn-note" id="doc-msg" role="status"></p>', { icon: 'upload' });

      const todo = [
        [S.school.name && S.school.students, 'ข้อมูลพื้นฐานโรงเรียน (ชื่อและจำนวนนักเรียน)'],
        [f.r === f.rt, 'คะแนนความเสี่ยง L × C ครบ ' + f.rt + ' ข้อ (กรอกแล้ว ' + f.r + ')'],
        [f.s === f.st, 'คะแนนความพร้อม 7-S (D และ I) ครบ ' + f.st + ' ข้อ (กรอกแล้ว ' + f.s + ')'],
        [S.docs.length > 0, 'รายการเอกสารที่ใช้ประกอบ (ไม่บังคับ แต่ช่วยตรวจย้อนกลับ)'],
      ];
      s += card('รายการที่ยังต้องกรอกหรือยืนยัน', '<ul class="todo">' + todo.map((t) => '<li class="' + (t[0] ? 'ok' : 'no') + '">' + ic(t[0] ? 'check' : 'info', 20) + '<span>' + esc(t[1]) + '</span></li>').join('') + '</ul>', { cls: 'amber', icon: 'alert' });
      s += '<div class="steps3"><h2>ขั้นตอนใช้งาน (3 ขั้นตอน)</h2><div><span><b>1</b>ข้อมูลโรงเรียน<small>ข้อมูลพื้นฐาน ทรัพยากร เอกสาร</small></span><span><b>2</b>ให้คะแนน<small>ความเสี่ยง L × C และความพร้อม 7-S</small></span><span><b>3</b>วิเคราะห์<small>กลุ่ม R1–R9 และมาตรการ</small></span></div></div>';
      s += '<div class="row-btns"><button class="tbtn primary wide" data-go="rassess">' + ic('bars', 22) + '<span>ถัดไป: ประเมินความเสี่ยง</span>' + ic('chev', 18) + '</button></div>';
      return s;
    }

    // ---------- แผนภูมิ ----------
    function chartRiskApp(out) {
      const x0 = 150, sc = 12, W = 440;
      let s = '<svg viewBox="0 0 ' + W + ' 214" role="img" aria-label="ดัชนีความเสี่ยงรายด้าน" class="chart">';
      [[out.params.riskLow, 'ต่ำ ≤ ' + out.params.riskLow], [out.params.riskMid, 'กลาง ≤ ' + out.params.riskMid]].forEach((t) => {
        s += '<line x1="' + (x0 + t[0] * sc) + '" y1="22" x2="' + (x0 + t[0] * sc) + '" y2="186" stroke="#9fb7d1" stroke-dasharray="4 4"/><text x="' + (x0 + t[0] * sc) + '" y="14" font-size="11" fill="#5b6e86" text-anchor="middle">' + t[1] + '</text>';
      });
      const col = { hi: '#e0645a', mid: '#f0b73c', lo: '#52b788' };
      out.domains.forEach((d, i) => {
        const y = 28 + i * 38, v = isFinite(d.rd) ? d.rd : 0;
        s += '<text x="0" y="' + (y + 18) + '" font-size="13" fill="#12304f">' + esc(HZ[d.code][0]) + '</text>';
        s += '<rect x="' + x0 + '" y="' + y + '" width="' + 25 * sc + '" height="26" rx="13" fill="#e8f0f9"/>';
        s += '<rect x="' + x0 + '" y="' + y + '" width="' + Math.max(8, v * sc) + '" height="26" rx="13" fill="' + (col[RC[d.risk]] || '#c9d6e4') + '"/>';
        s += '<text x="' + (x0 + Math.min(v, 21) * sc + 10) + '" y="' + (y + 18) + '" font-size="13" font-weight="700" fill="#12304f">' + fmt(d.rd, 2) + (d.override ? ' ▲' : '') + '</text>';
      });
      return s + '<text x="' + (x0 + 25 * sc) + '" y="208" font-size="11" fill="#5b6e86" text-anchor="end">ดัชนี R = ค่าเฉลี่ย L×C (1–25) · ▲ = ยกระดับ</text></svg>';
    }
    function chartD(out) {
      const x0 = 138, sc = 62, W = 460;
      let s = '<svg viewBox="0 0 ' + W + ' 250" role="img" aria-label="คะแนนความพร้อมตาม 7-S" class="chart">';
      for (let k = 1; k <= 5; k++) s += '<line x1="' + (x0 + (k - 1) * sc) + '" y1="6" x2="' + (x0 + (k - 1) * sc) + '" y2="212" stroke="#e1ebf5"/><text x="' + (x0 + (k - 1) * sc) + '" y="232" font-size="11" fill="#5b6e86" text-anchor="middle">' + k + '.00</text>';
      out.elements.forEach((e, i) => {
        const y = 10 + i * 29, w = isFinite(e.d) ? Math.max(4, (e.d - 1) * sc) : 0;
        s += '<text x="0" y="' + (y + 15) + '" font-size="12.5" fill="#12304f">' + esc(c.SHORT_EL[e.code]) + '</text><rect x="' + x0 + '" y="' + y + '" width="' + (4 * sc) + '" height="20" rx="10" fill="#eef4fa"/>';
        if (w) s += '<rect x="' + x0 + '" y="' + y + '" width="' + w + '" height="20" rx="10" fill="#27a58f"/><text x="' + (x0 + w + 6) + '" y="' + (y + 15) + '" font-size="12" font-weight="700" fill="#12304f">' + fmt(e.d, 2) + '</text>';
        if (isFinite(e.i)) s += '<line x1="' + (x0 + (e.i - 1) * sc) + '" y1="' + (y - 2) + '" x2="' + (x0 + (e.i - 1) * sc) + '" y2="' + (y + 22) + '" stroke="#1d63b8" stroke-width="3"><title>I = ' + fmt(e.i, 2) + '</title></line>';
      });
      return s + '</svg><div class="legend-row"><span><i class="dot" style="background:#27a58f"></i>D สภาพปัจจุบัน</span><span><i class="dot" style="background:#1d63b8"></i>เส้นตั้ง = I สภาพที่พึงประสงค์</span></div>';
    }
    function chartPniApp(out) {
      const list = out.elements.filter((e) => e.rank).sort((a, b) => a.rank - b.rank);
      if (!list.length) return '<p class="muted">ยังไม่มีคะแนน 7-S</p>';
      const mx = Math.max.apply(null, list.map((e) => e.pni).concat([0.01]));
      let s = '<svg viewBox="0 0 460 ' + (list.length * 32 + 22) + '" role="img" aria-label="PNI Modified รายองค์ประกอบ" class="chart">';
      const col = ['#e0645a', '#ec8a4c', '#f0b73c'];
      list.forEach((e, i) => {
        const y = 4 + i * 32, w = (e.pni / mx) * 250;
        s += '<text x="0" y="' + (y + 17) + '" font-size="12.5" fill="#12304f">' + esc(c.SHORT_EL[e.code]) + '</text><rect x="120" y="' + y + '" width="' + Math.max(6, w) + '" height="22" rx="11" fill="' + (col[i] || '#a9c9e8') + '"/><text x="' + (128 + w) + '" y="' + (y + 16) + '" font-size="12.5" font-weight="700" fill="#12304f">' + fmt(e.pni, 3) + '</text>';
      });
      return s + '</svg>';
    }

    // เมทริกซ์ 3×3 แบบการ์ดสี
    function matrixApp(out, compact) {
      const groups = {};
      if (out) out.domains.forEach((d) => { if (d.group) (groups[d.group] = groups[d.group] || []).push(d); });
      let s = '<div class="mx' + (compact ? ' compact' : '') + '"><div class="mx-top">ระดับความเสี่ยง ↑</div><div class="mx-g">';
      ['สูง', 'กลาง', 'ต่ำ'].forEach((rk, ri) => {
        s += '<div class="mx-l">' + rk + '</div>';
        ['ต่ำ', 'กลาง', 'สูง'].forEach((rd, ci) => {
          const p = D.packages.find((x) => x.risk === rk && x.ready === rd), n = ri * 3 + ci + 1, g = groups[p.code] || [];
          s += '<div class="mx-c t' + n + (g.length ? ' cur' : '') + '"><b>' + p.code + '</b>' + (compact ? '' : '<span>เสี่ยง' + rk + '<br>พร้อม' + rd + '</span>') + (g.length ? '<i class="who">' + g.map((d) => '<em title="' + esc(c.SHORT_DOM[d.code]) + '">' + d.code + '</em>').join('') + '</i>' : '') + '</div>';
        });
      });
      s += '<div></div>' + ['ต่ำ', 'กลาง', 'สูง'].map((x) => '<div class="mx-h">' + x + '</div>').join('') + '</div><div class="mx-x">ระดับความพร้อม →</div></div>';
      if (out && out.domains.some((d) => d.group)) s += '<p class="hint mxleg">ตัวอักษรในช่อง = ด้านของภัย: ' + out.domains.map((d) => '<b>' + d.code + '</b> ' + esc(HZ[d.code][0])).join(' · ') + '</p>';
      return s;
    }

    // ---------- หน้าแรก ----------
    function pageDash() {
      const out = getOut();
      if (!hasData(out)) return empty();
      const w = worstDomain(out), t1 = out.top3[0], nMeas = c.uniq([].concat.apply([], out.domains.map((d) => d.measures.map((m) => m.id)))).length;
      let s = '<div class="tbanner home"><div class="ib">' + SCHOOL + '</div><div class="hb"><h1>ภาพรวมโรงเรียน</h1><p>' + esc(S.school.name || 'โรงเรียนตัวอย่าง') + '</p><div class="duo"><div><small>ความเสี่ยงสูงสุดใน 4 ด้าน</small>' + lv(w.risk) + '</div><div><small>ความพร้อมขององค์กร (7-S)</small>' + lvr(out.readyFinal) + '</div></div></div></div>';
      s += '<div class="row-btns two"><button class="tbtn primary" data-go="brief">' + ic('doc', 22) + '<span>สรุปสำหรับผู้บริหาร (พิมพ์ 1 หน้า)</span>' + ic('chev', 18) + '</button><button class="tbtn" data-go="moe">' + ic('flag', 22) + '<span>ความสอดคล้องกับประกาศ ศธ. 7 มาตรการ</span>' + ic('chev', 18) + '</button></div>';
      s += '<div class="kpi4">' +
        '<div class="tcard kc">' + ic('alert', 26) + '<small>ด้านที่เสี่ยงสูงสุด</small><b>' + esc(HZ[w.code][0]) + '</b><span>ดัชนี R ' + fmt(w.rd, 2) + ' / 25 ' + (w.override ? '(ยกระดับ)' : '') + '</span></div>' +
        '<div class="tcard kc">' + ic('shieldcheck', 26) + '<small>ระดับความพร้อม</small><b>' + esc(out.readyFinal) + '</b><span>ค่าเฉลี่ย D ' + fmt(out.readyMean, 2) + ' / 5' + (out.floorHit ? ' (ใช้กฎเพดาน)' : '') + '</span></div>' +
        '<div class="tcard kc">' + ic('bars', 26) + '<small>ช่องว่างสูงสุดของ 7-S</small><b>' + esc(t1 ? c.SHORT_EL[t1.code] : '–') + '</b><span>PNI ' + (t1 ? fmt(t1.pni, 3) : '–') + ' (D ' + (t1 ? fmt(t1.d, 2) : '–') + ' → I ' + (t1 ? fmt(t1.i, 2) : '–') + ')</span></div>' +
        '<div class="tcard kc">' + ic('target', 26) + '<small>มาตรการที่ระบบเสนอ</small><b>' + nMeas + ' รายการ</b><span>ทรัพยากร' + esc(out.resource) + ' · สูงสุด ' + out.resourceMax + ' ข้อต่อด้าน</span></div></div>';
      s += '<div class="tgrid g2">' + card('ดัชนีความเสี่ยงรายด้าน', '<p class="hint">แท่งสีตามระดับ เส้นประคือค่าตัดระหว่างระดับ</p>' + chartRiskApp(out), { icon: 'pulse' }) +
        card('ตารางตัดสินใจ Risk × Readiness', matrixApp(out, true) + '<p><button class="tbtn sm" data-go="matrix"><span>ดูรายละเอียด R1–R9</span>' + ic('chev', 16) + '</button></p>', { icon: 'target' }) + '</div>';
      const now = w.measures.slice(0, 3);
      s += '<div class="tgrid g2">' + card('สิ่งที่ควรดำเนินการก่อน', '<p class="hint">จากด้านที่เสี่ยงสูงสุด (' + esc(c.SHORT_DOM[w.code]) + ' · กลุ่ม ' + w.group + ') เรียงตามกฎคัดเลือกของระบบ</p><ol class="nowl">' + now.map((m) => '<li><b>' + esc(m.name) + '</b><small>' + esc(c.cd(m)) + ' · ผู้รับผิดชอบ: ' + esc(m.owner) + '</small></li>').join('') + '</ol><p><button class="tbtn sm" data-act="strat" data-dom="' + w.code + '"><span>ดูมาตรการทั้งหมด</span>' + ic('chev', 16) + '</button></p>', { icon: 'clipboard', cls: 'blue' }) +
        card('เอกสารล่าสุด', (S.docs.length ? '<ul class="doclist">' + S.docs.slice(-3).reverse().map((d) => '<li><span class="di sm">' + ic('doc', 20) + '</span><span class="dn"><b>' + esc(d.name) + '</b><small>' + DOC_NAME[d.type] + ' · เพิ่มเมื่อ ' + dateTh(d.date) + '</small></span></li>').join('') + '</ul>' : '<p class="muted">ยังไม่มีเอกสารในรายการ เพิ่มได้ที่หน้า "ข้อมูลโรงเรียน"</p>') + '<p><button class="tbtn sm" data-go="school"><span>จัดการเอกสาร</span>' + ic('chev', 16) + '</button></p>', { icon: 'doc' }) + '</div>';
      s += '<div class="row-btns two"><button class="tbtn primary" data-go="rassess">' + ic('bars', 22) + '<span>ปรับคะแนนความเสี่ยง</span>' + ic('chev', 18) + '</button><button class="tbtn green" data-go="plan">' + ic('calendar', 22) + '<span>ดูแผนปฏิบัติการ</span>' + ic('chev', 18) + '</button></div>';
      s += card('ต่อยอด: อธิบายผล เรียนรู้ และพิสูจน์', '<div class="xlinks"><button class="tbtn" data-go="explain">' + ic('bulb', 22) + '<span><b>กฎตัดสินใจและเหตุผล</b><small>ทำไมเลือก ทำไมไม่เลือกอย่างอื่น</small></span>' + ic('chev', 18) + '</button><button class="tbtn" data-go="track">' + ic('flag', 22) + '<span><b>ติดตามผลและบทเรียน</b><small>บันทึกผลและประเมินซ้ำเป็นรอบ</small></span>' + ic('chev', 18) + '</button><button class="tbtn" data-go="evaluate">' + ic('clipboard', 22) + '<span><b>ประเมินนวัตกรรม</b><small>แบบประเมินผู้บริหารและผู้เชี่ยวชาญ</small></span>' + ic('chev', 18) + '</button><button class="tbtn" data-go="lab">' + ic('bars', 22) + '<span><b>ห้องวิเคราะห์ผู้วิจัย</b><small>รวมผลหลายโรงเรียนและตัวชี้วัด</small></span>' + ic('chev', 18) + '</button></div>', { icon: 'bulb' });
      return s;
    }

    // ---------- ประเมินความเสี่ยง ----------
    function pageRassess() {
      const out = getOut(), code = S.ui.riskDom, dm = out.domains.find((d) => d.code === code) || out.domains[0];
      let s = banner('clipboard', 'ประเมินความเสี่ยง', 'ให้คะแนนโอกาสเกิด (L) และผลกระทบ (C) ทีละข้อใน 4 ด้านของภัย');
      s += '<div class="hzs" role="group" aria-label="เลือกด้านของภัย">' + D.domains.map((d) => '<button class="hz hz-' + d.code + '" aria-pressed="' + (d.code === dm.code) + '" data-act="tab-risk" data-code="' + d.code + '">' + ic(HZ[d.code][1], 30) + '<b>' + HZ[d.code][0] + '</b><small>' + c.domFill(d.code) + '/' + D.riskItems.filter((x) => x.dom === d.code).length + ' ข้อ</small></button>').join('') + '</div>';
      s += card(esc(dm.name), c.legendBox('เกณฑ์คะแนน L โอกาสเกิด (ร่าง รอเดลฟาย)', D.lAnchors) + c.legendBox('เกณฑ์คะแนน C ผลกระทบ (ร่าง รอเดลฟาย)', D.cAnchors) +
        '<div class="ritems">' + D.riskItems.filter((r) => r.dom === dm.code).map((r) => {
          const v = S.risk[r.id] || [], lc = isFinite(v[0] * v[1]) && v[0] && v[1] ? v[0] * v[1] : null;
          const word = (i, a) => (v[i] ? '<small class="sw">' + v[i] + ' = ' + esc((a[v[i] - 1] || [])[1] || '') + '</small>' : '');
          return '<div class="ritem"><div class="rt"><span class="id">' + r.id + '</span><span>' + esc(r.text) + '<small>' + esc(r.space) + '</small></span></div><div class="rc"><div class="rl"><b>L</b> โอกาสเกิด' + c.pills('risk', r.id, 0, D.lAnchors) + word(0, D.lAnchors) + '</div><div class="rl"><b>C</b> ผลกระทบ' + c.pills('risk', r.id, 1, D.cAnchors) + word(1, D.cAnchors) + '</div><div class="rs">' + (lc ? 'L × C = <b>' + lc + '</b>' : 'ยังไม่ครบ') + '</div></div></div>';
        }).join('') + '</div>', { icon: HZ[dm.code][1] });
      const di = D.domains.findIndex((d) => d.code === dm.code), nx = D.domains[di + 1], pv = D.domains[di - 1];
      s += '<div class="tgrid g2">' + card('สูตรการประเมิน', '<div class="formula">ดัชนี R = ค่าเฉลี่ยของ (L × C) ทุกข้อ</div><p class="hint">ต่ำ ≤ ' + out.params.riskLow + ' · กลาง ≤ ' + out.params.riskMid + ' · สูง &gt; ' + out.params.riskMid + '<br>กฎยกระดับ: ข้อใดมี C = ' + out.params.overrideC + ' และ L ≥ ' + out.params.overrideL + ' จัดด้านนั้นเป็นความเสี่ยงสูง (แก้เกณฑ์ได้ที่หน้า "กฎและเกณฑ์")</p>', { icon: 'bulb' }) +
        card('ผลการประเมิน: ' + esc(HZ[dm.code][0]), '<div class="result r-' + (RC[dm.risk] || 'na') + '">' + (dm.risk ? '<b>ความเสี่ยง' + dm.risk + '</b><span>ดัชนี R = ' + fmt(dm.rd, 2) + ' (จาก ' + dm.n + ' ข้อ)' + (dm.override ? ' · ยกระดับตามกฎ' : '') + '</span>' : '<b>ยังไม่มีคะแนน</b><span>ให้คะแนน L และ C อย่างน้อย 1 ข้อ</span>') + '</div>', { icon: 'check' }) + '</div>';
      s += card('สรุปทั้ง 4 ด้าน', chartRiskApp(out), { icon: 'bars' });
      s += card('สิ่งที่ระบบใช้วิเคราะห์', '<ul class="uses"><li>' + ic('clipboard', 20) + '<span><b>คะแนนที่ผู้ใช้กรอก</b>ระบบใช้เฉพาะคะแนน L และ C ที่กรอกในหน้านี้</span></li><li>' + ic('doc', 20) + '<span><b>เอกสารโรงเรียน</b>ใช้เป็นหลักฐานประกอบการให้คะแนนของผู้ประเมิน ระบบไม่อ่านเนื้อหาไฟล์ที่เพิ่มในรายการนี้ ยกเว้นแผนปฏิบัติการที่ท่านเลือกให้อ่านข้อมูลพื้นฐาน (อ่านในเครื่อง ไม่อัปโหลด และไม่นำไปคำนวณคะแนนความเสี่ยงหรือความพร้อม)</span></li><li>' + ic('gear', 20) + '<span><b>เกณฑ์เบื้องต้น</b>ค่าตัดระดับเป็นร่างตามบทที่ 3 ยังไม่ผ่านเดลฟาย</span></li></ul>', { icon: 'info' });
      s += '<div class="row-btns two">' + (pv ? '<button class="tbtn" data-act="tab-risk" data-code="' + pv.code + '"><span>ย้อนกลับ: ' + HZ[pv.code][0] + '</span></button>' : '<button class="tbtn" data-go="school"><span>ย้อนกลับ: ข้อมูลโรงเรียน</span></button>') +
        (nx ? '<button class="tbtn primary" data-act="tab-risk" data-code="' + nx.code + '"><span>ถัดไป: ' + HZ[nx.code][0] + '</span>' + ic('chev', 18) + '</button>' : '<button class="tbtn primary" data-go="ready"><span>ถัดไป: ความพร้อม 7-S</span>' + ic('chev', 18) + '</button>') + '</div>';
      return s;
    }

    // ---------- ประเมินความพร้อม 7-S ----------
    function pageReady() {
      const out = getOut(), sel = S.ui.sevEl;
      const any = out.elements.some((e) => isFinite(e.d));
      // หลักฐานจากแผนปฏิบัติการที่ผู้ใช้อัปโหลด (ถ้ามี) แสดงใต้ข้อที่เกี่ยวข้อง เป็นหลักฐานประกอบ ไม่ใช่คะแนน
      const pe = (S.plan && S.plan.res && S.plan.res.itemEvidence) || null;
      const evChip = (id) => { const e = pe && pe[id]; if (!e) return ''; return e.found ? '<small class="pev f">' + ic('doc', 14) + ' พบในแผนปฏิบัติการ หน้า ' + e.page + ': ' + esc(e.snippet) + (e.note ? ' · ' + esc(e.note) : '') + '</small>' : '<small class="pev n">' + ic('info', 14) + ' ไม่พบคำที่เกี่ยวข้องในแผนปฏิบัติการ (อาจมีเป็นเอกสารแยก)' + (e.note ? ' · ' + esc(e.note) : '') + '</small>'; };
      const nEv = pe ? Object.keys(pe).filter((k) => pe[k].found).length : 0;
      const evBox = pe ? '<div class="pevbox">' + ic('doc', 20) + '<span><b>หลักฐานจากแผนปฏิบัติการ ' + esc(S.plan.file || '') + '</b> พบคำที่เกี่ยวข้อง ' + nEv + ' จาก ' + Object.keys(pe).length + ' ข้อ ติดป้ายไว้ใต้แต่ละข้อ ป้ายนี้เป็นเพียงหลักฐานประกอบ <b>ไม่ใช่คะแนน</b> เพราะแผนบอกสิ่งที่วางแผนไว้ ไม่ได้บอกว่าปฏิบัติจริงเพียงใด ข้อที่ไม่มีป้าย แผนปฏิบัติการไม่ใช่แหล่งหลักฐานที่เหมาะสม ให้ประเมินจากการปฏิบัติจริง ท่านเป็นผู้ให้คะแนน D และ I</span></div>' : '<div class="pevbox none">' + ic('upload', 20) + '<span>อัปโหลดแผนปฏิบัติการ (PDF) ที่หน้า <button class="lnk" data-go="school">ข้อมูลโรงเรียน</button> เพื่อให้ระบบแสดงหลักฐานจากแผนไว้ใต้ข้อที่เกี่ยวข้อง</span></div>';
      let s = banner('clipboard', 'ประเมินความพร้อมของโรงเรียน (7-S)', 'ประเมินความพร้อมขององค์กรในการบริหารจัดการความปลอดภัย เพื่อเห็นจุดแข็งและจุดที่ควรพัฒนา');
      s += '<div class="els">' + out.elements.map((e) => '<button class="elc' + (e.code === sel ? ' on' : '') + '" data-act="sev-pick" data-code="' + e.code + '" aria-pressed="' + (e.code === sel) + '">' + ic(EL_IC[e.code], 30) + '<b>' + esc(c.SHORT_EL[e.code]) + '</b><small>' + esc(e.name.replace(/^.*\(|\)$/g, '')) + '</small><span class="sc">' + (isFinite(e.d) ? 'D <b>' + fmt(e.d, 2) + '</b> / 5' : 'ยังไม่มีคะแนน') + '</span></button>').join('') + '</div>';
      const strong = out.elements.filter((e) => isFinite(e.d)).sort((a, b) => b.d - a.d).slice(0, 3);
      s += '<div class="tgrid g2">' +
        card('ความพร้อมโดยรวม', '<div class="bigres r-' + (RCR[out.readyFinal] || 'na') + '"><b>' + (out.readyFinal || 'ยังไม่มีข้อมูล') + '</b><span>' + (any ? 'ค่าเฉลี่ย D ' + fmt(out.readyMean, 2) + ' / 5.00' : 'ให้คะแนนด้านล่าง') + '</span></div>' + (out.floorHit ? '<p class="warn-note">ใช้กฎเพดาน: โครงสร้างหรือระบบต่ำกว่า ' + out.params.floorD + ' จึงลดจาก "สูง" เป็น "กลาง"</p>' : '') + '<p class="hint">ต่ำ ≤ ' + out.params.readyLow + ' · กลาง ≤ ' + out.params.readyMid + ' · สูง &gt; ' + out.params.readyMid + '</p>', { icon: 'shieldcheck' }) +
        card('ผลการประเมิน 7-S', any ? chartD(out) : '<p class="muted">ยังไม่มีคะแนน</p>', { icon: 'bars' }) + '</div>';
      s += '<div class="tgrid g2">' +
        card('จุดแข็ง (D สูงสุด 3 อันดับ)', any ? '<ol class="rank good">' + strong.map((e) => '<li><b>' + esc(c.SHORT_EL[e.code]) + '</b><small>D ' + fmt(e.d, 2) + ' / 5</small></li>').join('') + '</ol>' : '<p class="muted">–</p>', { icon: 'check', cls: 'green' }) +
        card('จุดที่ควรพัฒนา (ช่องว่าง PNI สูงสุด)', out.top3.length ? '<ol class="rank warn">' + out.top3.map((e) => '<li><b>' + esc(c.SHORT_EL[e.code]) + '</b><small>PNI ' + fmt(e.pni, 3) + ' · D ' + fmt(e.d, 2) + ' → I ' + fmt(e.i, 2) + '</small></li>').join('') + '</ol>' : '<p class="muted">ต้องมีทั้ง D และ I</p>', { icon: 'alert', cls: 'amber' }) + '</div>';
      const it = D.sevenItems.filter((x) => x.elem === sel);
      s += card('ให้คะแนน: ' + esc(out.elements.find((e) => e.code === sel).name), evBox + '<p class="hint">D = สภาพปัจจุบัน, I = สภาพที่พึงประสงค์ ให้คะแนน 1–5 ด้วยหลักฐานการปฏิบัติจริง ไม่ใช่เพียงมีหรือไม่มีนโยบาย (เลือกองค์ประกอบจากการ์ดด้านบน)</p>' + c.legendBox('เกณฑ์คะแนน D (I ใช้ระดับเดียวกัน)', D.dAnchors) +
        '<div class="ritems">' + it.map((x) => { const v = S.seven[x.id] || []; return '<div class="ritem"><div class="rt"><span class="id">' + x.id + '</span><span>' + esc(x.text) + evChip(x.id) + '</span></div><div class="rc"><div class="rl"><b>D</b> ปัจจุบัน' + c.pills('seven', x.id, 0, D.dAnchors) + (v[0] ? '<small class="sw">' + v[0] + ' = ' + esc((D.dAnchors[v[0] - 1] || [])[1] || '') + '</small>' : '') + '</div><div class="rl"><b>I</b> ที่พึงประสงค์' + c.pills('seven', x.id, 1, D.dAnchors) + '</div></div></div>'; }).join('') + '</div>', { icon: 'clipboard' });
      s += '<div class="row-btns two"><button class="tbtn" data-go="rassess"><span>ย้อนกลับ: ความเสี่ยง</span></button><button class="tbtn primary" data-go="pni">' + ic('bars', 22) + '<span>วิเคราะห์ช่องว่าง (PNI)</span>' + ic('chev', 18) + '</button></div>';
      return s;
    }

    // ---------- PNI ----------
    function pagePni() {
      const out = getOut(), any = out.elements.some((e) => e.rank);
      let s = banner('bars', 'วิเคราะห์ช่องว่างและความจำเป็น (PNI Modified)', 'จัดลำดับองค์ประกอบ 7-S ที่ควรพัฒนาก่อน');
      s += card('เข้าใจ PNI ง่าย ๆ ใน 30 วินาที', '<div class="pnix"><span class="px b"><b>D</b> = สภาพปัจจุบัน<small>ทำได้จริงตอนนี้</small></span><span class="px g"><b>I</b> = สภาพที่ต้องการ<small>ระดับที่อยากให้เป็น</small></span><span class="px y"><b>PNI = (I − D) / D</b></span></div>', { icon: 'info', cls: 'blue' });
      if (!any) return s + empty('ยังไม่มีคะแนน 7-S ให้ครบทั้ง D และ I');
      const order = out.elements.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99));
      const band = (r) => (r === 1 ? 'a' : r === 2 ? 'b' : r === 3 ? 'c' : 'd');
      s += card('ผลรายองค์ประกอบ', '<div class="scroll"><table class="pnit"><thead><tr><th>องค์ประกอบ 7-S</th><th class="n">D<small>ปัจจุบัน</small></th><th class="n">I<small>ที่ต้องการ</small></th><th class="n">PNI<small>ช่องว่าง</small></th></tr></thead><tbody>' +
        order.map((e) => '<tr><td>' + ic(EL_IC[e.code], 20) + esc(e.name) + '</td><td class="n">' + fmt(e.d, 2) + '</td><td class="n">' + fmt(e.i, 2) + '</td><td class="n"><span class="pv ' + band(e.rank) + '">' + fmt(e.pni, 3) + '</span></td></tr>').join('') + '</tbody></table></div><p class="hint">สีตามลำดับช่องว่าง (3 อันดับแรกเป็นโทนอุ่น) ไม่ใช่ค่าตัดทางสถิติ PNI Modified ในต้นแบบนี้ใช้จัดอันดับเท่านั้น</p>', { icon: 'bars' });
      s += '<div class="tgrid g2">' + card('เรื่องที่ควรพัฒนาก่อน', '<ol class="rank warn big">' + out.top3.map((e) => '<li><b>' + esc(c.SHORT_EL[e.code]) + '</b><small>PNI ' + fmt(e.pni, 3) + '</small></li>').join('') + '</ol>', { icon: 'check', cls: 'amber' }) +
        card('สรุปให้เข้าใจง่าย', '<div class="callout">PNI สูง = ช่องว่างมาก = ควรเร่งพัฒนา</div><ul class="ticks2"><li>PNI บอก "ช่องว่าง" ระหว่างสภาพที่ต้องการ (I) กับสภาพปัจจุบัน (D)</li><li>ระบบใช้ 3 อันดับแรกเลือกมาตรการจากคลังก่อน</li><li>ใช้ลำดับนี้ประกอบการตัดสินใจ ไม่ใช่เกณฑ์ผ่าน-ไม่ผ่าน</li></ul>', { icon: 'bulb' }) + '</div>';
      s += card('ภาพรวมช่องว่าง (PNI) ของแต่ละองค์ประกอบ', chartPniApp(out), { icon: 'bars' });
      s += '<div class="row-btns two"><button class="tbtn" data-go="ready"><span>ย้อนกลับ: ความพร้อม</span></button><button class="tbtn primary" data-go="matrix">' + ic('target', 22) + '<span>ดูตารางตัดสินใจ</span>' + ic('chev', 18) + '</button></div>';
      return s;
    }

    // ---------- เมทริกซ์ R1–R9 ----------
    function pageMatrix() {
      const out = getOut(), has = hasData(out);
      let s = banner('target', 'ผลวิเคราะห์ระดับความเสี่ยง × ความพร้อม', 'วิเคราะห์ตำแหน่งของโรงเรียนในเมทริกซ์ (Risk × Readiness) พร้อมผลสรุปและข้อเสนอแนะ');
      s += card('เมทริกซ์ความเสี่ยง × ความพร้อม (Risk-Readiness Matrix)', matrixApp(has ? out : null, false) + (has ? '' : '<p class="hint">ยังไม่มีข้อมูล จึงยังไม่มีตำแหน่งของโรงเรียน</p>'), { icon: 'target' });
      if (has) {
        const code = S.ui.mxDom && out.domains.some((d) => d.code === S.ui.mxDom && d.group) ? S.ui.mxDom : (worstDomain(out) || out.domains[0]).code;
        const d = out.domains.find((x) => x.code === code);
        s += '<div class="hzs sm" role="group" aria-label="เลือกด้านของภัย">' + out.domains.map((x) => '<button class="hz hz-' + x.code + '" aria-pressed="' + (x.code === code) + '" data-act="tab-mx" data-code="' + x.code + '">' + ic(HZ[x.code][1], 24) + '<b>' + HZ[x.code][0] + '</b><small>' + (x.group || '–') + '</small></button>').join('') + '</div>';
        s += '<div class="kpi3"><div class="tcard kc">' + ic('alert', 26) + '<small>ความเสี่ยงด้านนี้</small>' + lv(d.risk) + '<span>ดัชนี R ' + fmt(d.rd, 2) + ' / 25</span></div><div class="tcard kc">' + ic('shieldcheck', 26) + '<small>ความพร้อมรวม</small>' + lvr(d.ready) + '<span>ค่าเฉลี่ย D ' + fmt(out.readyMean, 2) + ' / 5</span></div><div class="tcard kc">' + ic('target', 26) + '<small>กลุ่มแนวทางตอบสนอง</small><b class="pk">' + d.group + '</b><span>' + esc(d.pkg.name) + '</span></div></div>';
        s += '<div class="verdict"><span class="vi">' + ic('clipboard', 34) + '</span><div><small>ระบบสรุปว่าอะไร</small><p>' + esc(HZ[d.code][0]) + ' มี<b class="lv r-' + RC[d.risk] + '">ความเสี่ยง' + d.risk + '</b> และองค์กรมี<b class="lv r-' + RCR[d.ready] + '">ความพร้อม' + d.ready + '</b> จึงจัดอยู่กลุ่ม <b>' + d.group + '</b>: ' + esc(d.pkg.name) + '</p></div></div>';
        s += card('เหตุผลที่ระบบสรุปเช่นนี้', '<ol class="why3"><li>ดัชนีความเสี่ยงของด้านนี้ = ' + fmt(d.rd, 2) + (d.override ? ' และเข้ากฎยกระดับ (มีข้อที่ C = ' + out.params.overrideC + ' และ L ≥ ' + out.params.overrideL + ') จึงจัดเป็นความเสี่ยงสูง' : ' อยู่ในช่วงความเสี่ยง' + d.risk) + '</li><li>ค่าเฉลี่ยความพร้อม D = ' + fmt(out.readyMean, 2) + (out.floorHit ? ' ซึ่งจะเป็นระดับ "สูง" แต่โครงสร้างหรือระบบต่ำกว่า ' + out.params.floorD + ' กฎเพดานจึงลดเป็น "กลาง"' : ' อยู่ในช่วงความพร้อม' + out.readyFinal) + '</li><li>เริ่มดำเนินการ: ' + esc(d.pkg.start) + ' · ทบทวน: ' + esc(d.pkg.review) + '</li></ol>', { icon: 'bulb' });
        s += card('ชุดการตัดสินใจของกลุ่ม ' + d.group, '<p class="hint">' + esc(d.pkg.summary) + '</p><ol class="why3">' + d.pkg.decisions.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>', { icon: 'clipboard' });
        s += '<div class="row-btns"><button class="tbtn primary wide" data-act="strat" data-dom="' + d.code + '">' + ic('target', 22) + '<span>ดูข้อเสนอกลยุทธ์</span>' + ic('chev', 18) + '</button></div>';
      }
      s += '<details class="tcard fold"><summary>กลุ่ม R1–R9 ทั้งหมด (ตารางเต็ม)</summary><div class="scroll"><table><thead><tr><th>กลุ่ม</th><th>ความเสี่ยง</th><th>ความพร้อม</th><th>แนวทาง</th><th>คำอธิบาย</th><th>เริ่ม</th><th>ทบทวน</th></tr></thead><tbody>' +
        D.packages.map((p) => '<tr><td><b>' + p.code + '</b></td><td>' + lv(p.risk) + '</td><td>' + lvr(p.ready) + '</td><td>' + esc(p.name) + '</td><td>' + esc(p.summary) + '</td><td>' + esc(p.start) + '</td><td>' + esc(p.review) + '</td></tr>').join('') + '</tbody></table></div></details>';
      return s;
    }

    // ---------- กลยุทธ์ ----------
    function pageStrategy() {
      const out = getOut();
      if (!hasData(out)) return empty();
      const dom = out.domains.find((d) => d.code === S.ui.stratDom) || out.domains[0], top = out.top3;
      let s = '<div class="tbanner"><span class="bi">' + ic('target', 34) + '</span><div><h1>ข้อเสนอกลยุทธ์จาก Strategy Bank</h1><p>คลังกลยุทธ์ ' + D.bank.length + ' รายการ เพื่อควบคุมความเสี่ยง เสริมความพร้อม และยกระดับความปลอดภัยในโรงเรียน</p></div></div>';
      s += '<div class="hzs sm" role="group" aria-label="เลือกด้านของภัย">' + out.domains.map((d) => '<button class="hz hz-' + d.code + '" aria-pressed="' + (d.code === dom.code) + '" data-act="tab-strat" data-code="' + d.code + '">' + ic(HZ[d.code][1], 24) + '<b>' + HZ[d.code][0] + '</b><small>' + (d.group || '–') + '</small></button>').join('') + '</div>';
      s += '<div class="hero2"><span class="tagt">★ กลุ่มแนวทางตอบสนองของด้านนี้</span><div class="hero2in"><div class="ib2">' + SCHOOL + '</div><div><h2>' + dom.group + ' ' + esc(dom.pkg.name) + '</h2><p>' + esc(dom.pkg.summary) + '</p><div class="legend-row"><span>เริ่มดำเนินการ: <b>' + esc(dom.pkg.start) + '</b></span><span>รอบทบทวน: <b>' + esc(dom.pkg.review) + '</b></span></div></div></div></div>';
      s += '<div class="why-chips"><b>เหตุผลที่ระบบแนะนำ (มาจากผลประเมิน)</b><span>' + lv(dom.risk).replace('lv ', 'lv wc ').replace('>', '>เสี่ยง') + '</span><span>' + lvr(dom.ready).replace('lv ', 'lv wc ').replace('>', '>พร้อม') + '</span>' + top.map((e) => '<span class="lv wc r-mid">ช่องว่าง: ' + esc(c.SHORT_EL[e.code]) + '</span>').join('') + '<span class="lv wc r-na2">ทรัพยากร' + esc(out.resource) + '</span></div>';
      s += card('ชุดการตัดสินใจ 6 ข้อของกลุ่ม ' + dom.group, '<div class="dec6">' + dom.pkg.decisions.map((x, i) => '<div><b>' + (i + 1) + '</b><span>' + esc(x) + '</span></div>').join('') + '</div>', { icon: 'clipboard', cls: 'blue' });
      s += card('มาตรการที่แนะนำ (' + dom.measures.length + ' ข้อ)', '<p class="hint">เรียงตามกฎคัดเลือกของระบบ: องค์ประกอบ 7-S ที่ช่องว่างสูงสุดก่อน แล้วลำดับ QSPM (ถ้ามี) ระดับหลักฐาน A→D และลำดับในคลัง แถบสีเขียวคือมาตรการที่ตอบ 3 อันดับช่องว่างสูงสุด ผู้อำนวยการเป็นผู้ตัดสินใจขั้นสุดท้าย</p><div class="meas">' +
        dom.measures.map((m) => '<div class="m' + (m.top ? ' top' : '') + '"><div class="mh"><span class="no">' + m.order + '</span><h4>' + esc(m.name) + ' <span class="pill">' + c.cd(m) + '</span></h4></div><div>' + esc(m.desc) + '</div><div class="meta"><span class="pill teal">' + esc(c.SHORT_EL[m.elem]) + '</span><span>ประเภท: ' + esc(m.type3) + '</span><span>ทรัพยากรระดับ ' + m.res + '</span><span>ผู้รับผิดชอบ: ' + esc(m.owner) + '</span></div><div class="kpi"><b>ตัวชี้วัด:</b> ' + esc(m.kpi) + '</div>' + c.evBadge(m) + c.preHtml(m) + c.extraHtml(m) + '<div class="why"><b>เหตุผลการเลือก:</b> ' + esc(m.why) + '</div></div>').join('') + '</div>', { icon: 'target' });
      s += c.stretchHtml(dom);
      s += '<div class="row-btns two"><button class="tbtn" data-go="explain">' + ic('bulb', 22) + '<span>ทำไมจึงเลือกแบบนี้และไม่เลือกอย่างอื่น</span></button><button class="tbtn" data-go="pni"><span>ดูช่องว่าง (PNI)</span></button><button class="tbtn primary" data-go="plan">' + ic('clipboard', 22) + '<span>สร้างแผนปฏิบัติการ</span>' + ic('chev', 18) + '</button></div>';
      return s;
    }

    // ---------- แผนปฏิบัติการ ----------
    function pagePlan() {
      const out = getOut();
      if (!hasData(out)) return empty();
      const rows = [];
      out.domains.forEach((d) => d.measures.forEach((m) => rows.push({ d, m, key: c.mKey(d.code, m.id) })));
      const st = (k) => S.status[k] || c.STATUS[0];
      const done = rows.filter((r) => st(r.key) === 'เสร็จแล้ว').length, doing = rows.filter((r) => st(r.key) === 'กำลังดำเนินการ').length, todo = rows.length - done - doing;
      const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
      let s = '<div class="tbanner prog"><span class="bi">' + ic('clipboard', 34) + '</span><div class="pw"><h1>สรุปความก้าวหน้าแผนปฏิบัติการด้านความปลอดภัย</h1><div class="pbar"><i style="width:' + pct(done, rows.length) + '%"></i></div><p>ความก้าวหน้าโดยรวม (' + done + ' / ' + rows.length + ' รายการ)</p></div><b class="pp">' + pct(done, rows.length) + '%</b></div>';
      s += '<div class="kpi4"><div class="tcard kc blue">' + ic('doc', 26) + '<small>มาตรการทั้งหมด</small><b>' + rows.length + ' รายการ</b></div><div class="tcard kc green">' + ic('check', 26) + '<small>เสร็จแล้ว</small><b>' + done + ' รายการ</b></div><div class="tcard kc amber">' + ic('gear', 26) + '<small>กำลังดำเนินการ</small><b>' + doing + ' รายการ</b></div><div class="tcard kc red">' + ic('calendar', 26) + '<small>ยังไม่เริ่ม</small><b>' + todo + ' รายการ</b></div></div>';
      s += card('ความก้าวหน้ารายด้าน', out.domains.map((d) => { const r = rows.filter((x) => x.d.code === d.code), dn = r.filter((x) => st(x.key) === 'เสร็จแล้ว').length; return '<div class="dp"><div><span>' + ic(HZ[d.code][1], 18) + esc(HZ[d.code][0]) + ' · ' + (d.group || '') + '</span><b>' + dn + '/' + r.length + '</b></div><div class="pbar sm"><i style="width:' + pct(dn, r.length) + '%"></i></div></div>'; }).join(''), { icon: 'bars' });
      s += card('แผนปฏิบัติการ', '<p class="hint">ปรับสถานะได้ในหน้านี้ (ไม่ถูกบันทึกถาวร) ตัวชี้วัดและผู้รับผิดชอบเป็นข้อเสนอเริ่มต้นจากคลัง ผู้อำนวยการปรับได้ ระยะเวลาเป็นช่วงที่ตารางตัดสินใจแนะนำ ยังไม่ใช่วันที่กำหนดจริง</p><div class="plan">' +
        rows.map((r, i) => '<div class="pr ' + ({ 'เสร็จแล้ว': 'done', 'กำลังดำเนินการ': 'doing' }[st(r.key)] || 'todo') + '"><span class="no">' + (i + 1) + '</span><div class="pb"><b>' + esc(c.cd(r.m) + ' ' + r.m.name) + '</b><small>' + esc(HZ[r.d.code][0]) + ' · ' + r.d.group + ' · ผู้รับผิดชอบ: ' + esc(r.m.owner) + '</small><small>ตัวชี้วัด: ' + esc(r.m.kpi) + '</small><small>เริ่ม: ' + esc(r.d.pkg.start) + ' · ทบทวน: ' + esc(r.d.pkg.review) + '</small><button class="tbtn sm pdopen" data-act="plandoc" data-k="' + r.key + '">' + ic('print', 18) + '<span>แผนต้นแบบ (พิมพ์ PDF)</span></button></div><select class="st" data-st="' + r.key + '" aria-label="สถานะ ' + esc(r.m.id) + '">' + c.STATUS.map((x) => '<option' + (st(r.key) === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></div>').join('') + '</div>', { icon: 'clipboard' });
      s += card('บันทึกการทบทวนหลังดำเนินการ (AAR)', '<p class="hint">สิ่งที่ตั้งใจ สิ่งที่เกิดขึ้นจริง ข้อเรียนรู้ และข้อมูลที่ต้องย้อนกลับไปปรับในขั้นที่ 1–4 (อย่าใส่ชื่อบุคคลหรือรายละเอียดที่ระบุตัวได้)</p><textarea id="aar" aria-label="บันทึกการทบทวนหลังดำเนินการ">' + esc(S.aar) + '</textarea>', { icon: 'doc' });
      s += '<div class="row-btns"><button class="tbtn primary wide" data-act="plandoc" data-k="all">' + ic('print', 22) + '<span>แผนต้นแบบทุกมาตรการ (' + rows.length + ' แผน) พิมพ์หรือบันทึกเป็น PDF</span>' + ic('chev', 18) + '</button></div>';
      s += '<div class="row-btns two"><button class="tbtn primary" data-act="csv">' + ic('download', 22) + '<span>ดาวน์โหลด CSV</span></button><button class="tbtn green" onclick="window.print()">' + ic('print', 22) + '<span>พิมพ์แผน</span></button><button class="tbtn" data-go="track">' + ic('flag', 22) + '<span>บันทึกผลและบทเรียน</span>' + ic('chev', 18) + '</button></div>';
      return s;
    }

    // ---------- สรุปสำหรับผู้บริหาร (พิมพ์ได้ 1 หน้า A4) ----------
    function pageBrief() {
      const out = getOut();
      if (!hasData(out)) return empty();
      const w = worstDomain(out), t1 = out.top3[0], sc = S.school, first = w.measures.slice(0, 3);
      const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
      let s = '<article class="brief" aria-label="สรุปสำหรับผู้บริหาร">' +
        '<header class="bhead"><div><span class="beyebrow">สรุปสำหรับผู้บริหาร · ความปลอดภัยสถานศึกษา</span><h1>' + esc(sc.name || 'โรงเรียนตัวอย่าง') + '</h1><p>ปีการศึกษา ' + esc(sc.year || '–') + (sc.students ? ' · นักเรียน ' + esc(sc.students) + ' คน' : '') + ' · จัดทำ ' + today + '</p></div><span class="bbadge">ต้นแบบเพื่อการวิจัย</span></header>' +
        '<section class="bans"><small>ข้อสรุป</small><p>ด้านที่ควรเร่งก่อนคือ <b>' + esc(HZ[w.code][0]) + '</b> (ความเสี่ยง<b>' + esc(w.risk) + '</b> · กลุ่มแนวทาง <b>' + esc(w.group) + '</b>) ความพร้อมขององค์กรอยู่ในระดับ<b>' + esc(out.readyFinal) + '</b>' + (t1 ? ' ช่องว่างสูงสุดอยู่ที่ <b>' + esc(c.SHORT_EL[t1.code]) + '</b>' : '') + '</p><p class="bsub">แนวทางของกลุ่มนี้: ' + esc(w.pkg.name) + ' · ' + esc(w.pkg.summary) + '</p></section>' +
        '<div class="bkpi"><div><small>ด้านที่เสี่ยงสูงสุด</small><b>' + esc(HZ[w.code][0]) + '</b><span>ดัชนี R ' + fmt(w.rd, 2) + ' / 25' + (w.override ? ' (ยกระดับตามกฎ)' : '') + '</span></div><div><small>ความพร้อมของโรงเรียน (7-S)</small><b>' + esc(out.readyFinal) + '</b><span>ค่าเฉลี่ย D ' + fmt(out.readyMean, 2) + ' / 5' + (out.floorHit ? ' (ใช้กฎเพดาน)' : '') + '</span></div><div><small>ทรัพยากรที่มี</small><b>' + esc(out.resource) + '</b><span>เสนอสูงสุด ' + out.resourceMax + ' ข้อต่อด้าน</span></div></div>' +
        '<h2>สถานะ 4 ด้านของภัย</h2><table class="btab"><thead><tr><th>ด้านของภัย</th><th>ความเสี่ยง</th><th>ความพร้อม</th><th>กลุ่ม</th><th>เริ่มดำเนินการ</th></tr></thead><tbody>' +
        out.domains.map((d) => '<tr><td>' + esc(HZ[d.code][0]) + '</td><td>' + lv(d.risk) + '</td><td>' + lvr(d.ready) + '</td><td><b>' + esc(d.group || '–') + '</b></td><td>' + (d.pkg ? esc(d.pkg.start) : '–') + '</td></tr>').join('') + '</tbody></table>' +
        '<div class="bcols"><section><h2>3 สิ่งที่ควรทำก่อน (ด้าน' + esc(HZ[w.code][0]) + ')</h2><ol class="bnow">' + first.map((m) => '<li><b>' + esc(m.name) + '</b><small>ผู้รับผิดชอบ: ' + esc(m.owner) + ' · ตัวชี้วัด: ' + esc(m.kpi) + '</small></li>').join('') + '</ol></section>' +
        '<section><h2>เรื่องที่ผู้อำนวยการต้องตัดสินใจ</h2><ul class="bdec">' + w.pkg.decisions.map((x) => '<li><i aria-hidden="true"></i><span>' + esc(x) + '</span></li>').join('') + '</ul></section></div>' +
        '<footer class="bfoot">ผลนี้เป็นข้อเสนอสนับสนุนการวางแผน ไม่ใช้ตัดสินหรือจัดอันดับโรงเรียน และไม่แทนดุลยพินิจของผู้อำนวยการ เกณฑ์และคลังมาตรการเป็นร่างที่ยังไม่ผ่านเดลฟาย ข้อมูลที่กรอกประมวลผลในเบราว์เซอร์นี้เท่านั้น เหตุฉุกเฉิน 191 ตำรวจ · 1669 การแพทย์ฉุกเฉิน · 199 ดับเพลิง</footer></article>';
      s += '<div class="row-btns two"><button class="tbtn primary" onclick="window.print()">' + ic('print', 22) + '<span>พิมพ์ หรือบันทึกเป็น PDF</span></button><button class="tbtn" data-go="strategy">' + ic('target', 22) + '<span>ดูมาตรการทั้งหมด</span>' + ic('chev', 18) + '</button><button class="tbtn green" data-go="plan">' + ic('calendar', 22) + '<span>ไปแผนปฏิบัติการ</span>' + ic('chev', 18) + '</button></div><p class="hint bhint">กดพิมพ์แล้วเลือกเครื่องพิมพ์ "บันทึกเป็น PDF" เพื่อส่งต่อให้คณะกรรมการหรือเจ้าหน้าที่ที่เกี่ยวข้อง</p>';
      return s;
    }

    // ---------- แผนต้นแบบรายมาตรการ (เอกสาร A4 พิมพ์หรือบันทึกเป็น PDF) ----------
    // ระดับหลักฐานมาจากข้อมูลของแต่ละมาตรการในคลัง (evg, evsrc, evnote) ไม่ใช่ข้อความที่เหมือนกันทุกข้อ
    const EVG_DOC = {
      A: ['A', 'มีงานทบทวนเชิงระบบรองรับ', 'มีงานวิจัยรองรับตามแหล่งที่ระบุ แต่ผลจริงขึ้นกับบริบทของโรงเรียน จึงต้องวัดตัวชี้วัดของโรงเรียนเอง'],
      B: ['B', 'รองรับบางส่วนหรือผลผสม', 'มีงานวิจัยรองรับบางส่วนหรือผลไม่ตรงกันทั้งหมด ควรเริ่มในขอบเขตที่ควบคุมได้และติดตามผล'],
      C: ['C', 'มีนโยบายหรือกฎหมายรองรับ ยังไม่มีงานวัดผล', 'มีนโยบายหรือแนวปฏิบัติรองรับ แต่ยังไม่พบงานที่วัดผลของมาตรการนี้ ควรเริ่มแบบนำร่องและเก็บข้อมูลตัวชี้วัด'],
      D: ['D', 'ยังไม่พบหลักฐาน', 'ยังไม่พบหลักฐานจากงานวิจัยหรือนโยบายในการค้นครั้งนี้ เป็นข้อเสนอของผู้วิจัย ควรปรึกษาผู้เชี่ยวชาญก่อนนำไปใช้'],
    };
    const RES_DOC = ['', 'ระดับ 1 (ใช้ทรัพยากรน้อย)', 'ระดับ 2 (ปานกลาง)', 'ระดับ 3 (ใช้ทรัพยากรมาก)'];
    const dots = (w) => '<span class="pblank" style="min-width:' + (w || 120) + 'px"></span>';
    function planRows(out) {
      const rows = []; out.domains.forEach((d) => d.measures.forEach((m) => rows.push({ d, m, key: c.mKey(d.code, m.id) }))); return rows;
    }
    function planDoc(r, i, n) {
      const d = r.d, m = r.m, sc = S.school, st = S.status[r.key] || c.STATUS[0], ev = EVG_DOC[m.evg] || EVG_DOC.D;
      const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
      const mo = root.RS_MOE ? root.RS_MOE.forSb(m.sb) : [], moeTxt = mo.length ? ' มาตรการนี้เกี่ยวข้องกับประกาศกระทรวงศึกษาธิการ เรื่อง มาตรการความปลอดภัยของสถานศึกษา (10 สิงหาคม 2569) ข้อ ' + mo.join(', ') : '';
      const sec = (no, t, body) => '<section class="ps"><h3>' + no + '. ' + t + '</h3>' + body + '</section>';
      const step = (t) => '<li>' + t + '</li>';
      const cbx = (label) => '<span class="pcb"><i class="cbx' + (label === st ? ' on' : '') + '" aria-hidden="true"></i>' + label + '</span>';
      const stepsHtml = '<ol class="pstep">' + [
        'ตั้งผู้รับผิดชอบ (' + esc(m.owner) + ') และตรวจเงื่อนไขก่อนดำเนินการตามข้อ 5',
        'เตรียมทรัพยากร: ' + esc(m.resources),
        'ดำเนินกิจกรรม: ' + esc(m.desc),
        'เก็บหลักฐานและสิ่งที่ส่งมอบ: ' + esc(m.output),
        'วัดผลด้วยตัวชี้วัดข้อ 6 และทบทวนตามรอบ (' + esc(d.pkg.review) + ') แล้วปรับแผน'].map(step).join('') + '</ol><p class="pnote">ขั้นตอนนี้เป็นกรอบต้นแบบที่สร้างจากข้อมูลของมาตรการ โรงเรียนปรับรายละเอียดและกำหนดวันที่ให้เหมาะกับบริบทของตน</p>';
      return '<article class="pdoc" aria-label="แผนต้นแบบ ' + esc(c.cd(m)) + '">' +
        '<header class="pdh"><div class="pdl">' + LOGO + '<div><b>แผนปฏิบัติการด้านความปลอดภัยสถานศึกษา</b><span>' + esc(sc.name || 'โรงเรียนตัวอย่าง') + ' · ปีการศึกษา ' + esc(sc.year || '–') + '</span></div></div><span class="pdcode">' + esc(c.cd(m)) + '</span></header>' +
        '<h1>' + esc(m.name) + '</h1>' +
        '<table class="pdmeta"><tbody><tr><th>ด้านของภัย</th><td>' + esc(HZ[d.code][0]) + ' (ความเสี่ยง' + esc(d.risk) + ')</td><th>กลุ่มแนวทาง</th><td>' + esc(d.group) + ' ' + esc(d.pkg.name) + '</td></tr>' +
        '<tr><th>องค์ประกอบ 7-S</th><td>' + esc(c.SHORT_EL[m.elem]) + '</td><th>ประเภท (3 ป.) / ช่วง</th><td>' + esc(m.type3) + ' / ' + esc(m.phase) + '</td></tr>' +
        '<tr><th>ผู้รับผิดชอบ</th><td>' + esc(m.owner) + '</td><th>กลุ่มเป้าหมาย</th><td>' + esc(m.target) + '</td></tr>' +
        '<tr><th>เริ่มดำเนินการ</th><td>' + esc(d.pkg.start) + '</td><th>ทรัพยากรที่ใช้</th><td>' + RES_DOC[m.res] + '</td></tr></tbody></table>' +
        sec(1, 'หลักการและเหตุผล', '<p>จากผลการประเมินของ' + esc(sc.name || 'โรงเรียน') + ' พบความเสี่ยงด้าน' + esc(HZ[d.code][0]) + 'ในระดับ' + esc(d.risk) + ' และความพร้อมขององค์กรในระดับ' + esc(d.ready) + ' จัดอยู่ในกลุ่มแนวทาง ' + esc(d.group) + ' (' + esc(d.pkg.summary) + ') มาตรการนี้ถูกเสนอเพราะ' + esc(m.why) + esc(moeTxt) + '</p>') +
        sec(2, 'วัตถุประสงค์', '<ol class="pl"><li>' + esc(m.desc) + '</li><li>เพื่อให้' + esc(m.target) + 'ได้รับการดำเนินการตามมาตรการนี้อย่างทั่วถึง</li></ol>') +
        sec(3, 'ขั้นตอนดำเนินงาน', stepsHtml) +
        sec(4, 'ผลผลิตและผลที่คาดว่าจะได้รับ', '<p>ผลผลิต: ' + esc(m.output) + '</p><p>ผลลัพธ์ที่คาดหวัง: ' + esc(m.outcome) + '</p>') +
        sec(5, 'ทรัพยากร งบประมาณ และเงื่อนไขก่อนดำเนินการ', '<p>ทรัพยากรที่ใช้: ' + esc(m.resources) + ' · เงื่อนไขก่อนดำเนินการ: ' + esc(m.prereq) + '</p><p>งบประมาณที่ขอ ' + dots(110) + ' บาท แหล่งงบ ' + dots(150) + '</p>') +
        sec(6, 'ตัวชี้วัดและการติดตาม', '<p>ตัวชี้วัด: ' + esc(m.kpi) + '</p><p>ค่าเป้าหมาย ' + dots(110) + ' ภายใน ' + dots(110) + '</p><p>ติดตามโดย ' + esc(m.owner) + ' ทบทวนตามรอบ: ' + esc(d.pkg.review) + '</p><p class="pst">สถานะ: ' + ['ยังไม่เริ่ม', 'กำลังดำเนินการ', 'เสร็จแล้ว'].map(cbx).join('') + '</p>') +
        '<section class="ps pev2 g' + ev[0] + '"><h3>7. หลักฐานทางวิชาการรองรับ <span class="pgr">ระดับ ' + ev[0] + '</span></h3><p><b>' + esc(ev[1]) + '</b>' + (m.evsrc ? ' · แหล่ง: ' + esc(m.evsrc) : '') + '</p><p>' + esc(m.evnote) + '</p><p class="pnote">' + esc(ev[2]) + ' (คลังมาตรการเป็นฉบับร่าง ยังไม่ผ่านเดลฟายและการตรวจหลักฐานรายข้อ)</p></section>' +
        '<div class="psign"><div><span></span><small>ผู้รับผิดชอบ</small></div><div><span></span><small>หัวหน้างาน</small></div><div><span></span><small>ผู้อำนวยการสถานศึกษา (ผู้อนุมัติ)</small></div></div>' +
        '<footer class="pdf">จัดทำจากระบบ Risk Safe (R²-SAFE) ต้นแบบงานวิจัย เมื่อ ' + today + ' · แผนที่ ' + (i + 1) + ' จาก ' + n + ' · ผลเป็นข้อเสนอสนับสนุนการวางแผน ผู้อำนวยการเป็นผู้ตัดสินใจขั้นสุดท้าย ไม่แทนการตอบสนองเหตุฉุกเฉิน (191 · 1669 · 199)</footer></article>';
    }
    function pagePlandoc() {
      const out = getOut();
      if (!hasData(out)) return empty();
      const rows = planRows(out), k = S.ui.planDoc || 'all', one = k !== 'all' ? rows.filter((r) => r.key === k) : [], list = one.length ? one : rows;
      let s = '<div class="pdbar"><div><h1>แผนต้นแบบรายมาตรการ</h1><p>แสดง ' + list.length + ' แผน' + (one.length ? ' (เลือกเฉพาะ ' + esc(c.cd(one[0].m)) + ')' : ' (ทุกมาตรการในแผนปฏิบัติการ)') + ' · ทุกแผนมีหัวข้อมาตรฐาน หลักฐานทางวิชาการตามระดับที่ระบุไว้ และช่องลงนาม พร้อมพิมพ์</p></div>' +
        '<div class="pdbtn"><button class="tbtn primary" onclick="window.print()">' + ic('print', 22) + '<span>พิมพ์ ' + (list.length > 1 ? 'ทั้ง ' + list.length + ' แผน' : 'แผนนี้') + ' หรือบันทึกเป็น PDF</span></button>' +
        (one.length ? '<button class="tbtn" data-act="plandoc" data-k="all">' + ic('doc', 20) + '<span>แสดงทุกแผน (' + rows.length + ')</span></button>' : '') + '<button class="tbtn" data-go="plan">' + ic('chev', 18) + '<span>กลับไปแผนปฏิบัติการ</span></button></div>' +
        '<p class="hint">กดพิมพ์แล้วเลือกเครื่องพิมพ์ "บันทึกเป็น PDF" ใช้กระดาษ A4 แนวตั้ง แต่ละแผนขึ้นหน้าใหม่</p></div>';
      s += '<div class="pdocs">' + list.map((r, i) => planDoc(r, i, list.length)).join('') + '</div>';
      return s;
    }

    // ---------- ประกาศ ศธ. 7 มาตรการความปลอดภัยของสถานศึกษา: ความสอดคล้องกับคลังมาตรการ ----------
    function pageMoe() {
      const M = root.RS_MOE;
      if (!M) return banner('flag', 'ประกาศ ศธ. 7 มาตรการ', 'โหลดข้อมูลไม่สำเร็จ');
      const byId = {}; D.bank.forEach((x) => { byId[x.sb] = x; });
      const st = (n) => (S.moe && S.moe[n]) || M.STATUS[0], sum = M.summary();
      const done = M.ITEMS.filter((i) => st(i.n) === 'ดำเนินการแล้ว').length, part = M.ITEMS.filter((i) => st(i.n) === 'มีบางส่วน').length, none = M.ITEMS.filter((i) => st(i.n) === 'ยังไม่มี').length;
      let s = banner('flag', 'ประกาศ ศธ. 7 มาตรการความปลอดภัยของสถานศึกษา', 'ตรวจว่าคลังมาตรการของระบบและโรงเรียนของท่านสอดคล้องกับประกาศอย่างไร');
      s += card('', '<p class="hint">' + esc(M.SOURCE.title) + ' ลงวันที่ ' + esc(M.SOURCE.date) + ' ตามนี้ <b>' + esc(M.SOURCE.note) + '</b> การจับคู่กับมาตรการในคลังและระดับความครอบคลุมเป็นการประเมินของผู้วิจัยจากชื่อและคำอธิบายมาตรการ ยังไม่ผ่านการตรวจโดยผู้เชี่ยวชาญ และคลังมาตรการยังเป็นฉบับร่างที่ยังไม่ผ่านเดลฟาย</p>', { cls: 'amber', icon: 'info' });
      s += '<div class="kpi4"><div class="tcard kc green">' + ic('check', 26) + '<small>คลังมาตรการครอบคลุมดี</small><b>' + sum.good + ' จาก ' + sum.total + ' ข้อ</b></div><div class="tcard kc amber">' + ic('info', 26) + '<small>ครอบคลุมบางส่วน</small><b>' + sum.partial + ' ข้อ</b></div><div class="tcard kc red">' + ic('alert', 26) + '<small>ยังไม่มีมาตรการเฉพาะ</small><b>' + sum.none + ' ข้อ</b></div><div class="tcard kc blue">' + ic('building', 26) + '<small>โรงเรียนของท่านดำเนินการแล้ว</small><b>' + done + ' ข้อ</b><span>บางส่วน ' + part + ' · ยังไม่มี ' + none + '</span></div></div>';
      s += M.ITEMS.map((i) => card('ข้อ ' + i.n + ' ' + esc(i.title),
        '<p class="moelv"><span class="lv ' + (i.level === 'good' ? 'r-lo' : i.level === 'partial' ? 'r-mid' : 'r-hi') + '">' + esc(M.LEVELS[i.level]) + '</span> คลังมาตรการของระบบ</p>' +
        '<h3 class="moeh">สิ่งที่ประกาศกำหนด (สรุป)</h3><ul class="moeul">' + i.req.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
        '<h3 class="moeh">มาตรการในคลังที่เกี่ยวข้อง</h3><p class="moechips">' + i.sb.map((id) => '<span class="moechip" title="' + esc(byId[id] ? byId[id].desc : '') + '"><b>' + esc(id) + '</b> ' + esc(byId[id] ? byId[id].name : '') + '</span>').join('') + '</p>' +
        '<h3 class="moeh">ที่ระบบยังไม่ครอบคลุม</h3><ul class="moeul gap">' + i.gaps.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
        (i.caution ? '<p class="warn-note">' + esc(i.caution) + '</p>' : '') +
        '<label class="moest">สถานะของโรงเรียนท่านในข้อนี้ <select class="st" data-moe="' + i.n + '" aria-label="สถานะข้อ ' + i.n + '">' + M.STATUS.map((x) => '<option' + (st(i.n) === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></label>', { icon: 'flag', cls: i.level === 'none' ? 'amber' : '' })).join('');
      s += card('ข้อเสนอเพิ่มในคลังมาตรการ (รอผู้เชี่ยวชาญและที่ปรึกษา)', '<ol class="moeul">' + [
        'ศูนย์พิทักษ์สิทธิ เสรีภาพ และความปลอดภัยระดับสถานศึกษา (จุดรวมรับแจ้ง ให้คำปรึกษา ประสานช่วยเหลือ เชื่อมศูนย์ของกระทรวง) (ข้อ 1)',
        'การสื่อสารหลังเกิดเหตุเพื่อลดพฤติกรรมเลียนแบบ (ข้อ 1 และ 6)',
        'การกำกับวัสดุ อุปกรณ์มีคมหรืออันตรายในการเรียนการสอน (ข้อ 2.2)',
        'ปฏิบัติการปฐมพยาบาลทางใจสำหรับครูแนะแนวและครูที่ปรึกษา (ข้อ 3.2)',
        'ทำเนียบเครือข่ายหน่วยงาน (ตำรวจ พนักงานอัยการ คุ้มครองสิทธิ สาธารณสุข นักจิตวิทยา นักสังคมสงเคราะห์ อาสาสมัคร องค์กรปกครองส่วนท้องถิ่น) (ข้อ 4)',
        'การเปิดพื้นที่ให้ผู้ปกครองเข้าสังเกตการณ์ตามแผนความปลอดภัย (ข้อ 5)',
        'เขตพื้นที่ปลอดภัย: ควบคุมการเข้า–ออก ลงทะเบียน คัดกรองสิ่งของต้องห้าม ขั้นตอนเมื่อไม่ให้ความร่วมมือ และแนวทางสั่งปิดสถานศึกษา (ข้อ 7)'].map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol><p class="hint">รายการเหล่านี้ยังไม่ได้เพิ่มเข้าคลัง (คลังยังมี ' + D.bank.length + ' รายการ) เพราะการเพิ่มมาตรการกระทบการเลือกมาตรการของระบบ จำนวนรายการในดุษฎีนิพนธ์ และต้องผ่านการตรวจโดยผู้เชี่ยวชาญก่อน</p>', { icon: 'clipboard' });
      s += '<div class="row-btns two"><button class="tbtn" data-go="strategy">' + ic('target', 22) + '<span>ดูมาตรการที่ระบบเสนอ</span>' + ic('chev', 18) + '</button><button class="tbtn" data-go="plan">' + ic('calendar', 22) + '<span>ไปแผนปฏิบัติการ</span>' + ic('chev', 18) + '</button></div>';
      return s;
    }

    // ---------- เหตุการณ์เฉพาะส่วนนี้ ----------
    function bind() {
      document.addEventListener('click', (e) => {
        const t = e.target.closest('button'); if (!t || !t.dataset.act) return;
        const a = t.dataset.act;
        if (a === 'res') { S.resource = t.dataset.v; c.render(true); }
        else if (a === 'sev-pick') { S.ui.sevEl = t.dataset.code; c.render(true); const f = document.querySelector('.ritems'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        else if (a === 'tab-mx') { S.ui.mxDom = t.dataset.code; c.render(true); }
        else if (a === 'doc-pick') { S.ui.docType = t.dataset.type; const f = document.getElementById('doc-file'); if (f) f.click(); }
        else if (a === 'doc-del') { S.docs.splice(+t.dataset.i, 1); c.render(true); }
      });
      document.addEventListener('change', (e) => {
        const t = e.target; if (t.id !== 'doc-file') return;
        const msg = []; let added = 0;
        Array.prototype.forEach.call(t.files || [], (f) => {
          if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') { msg.push('"' + f.name + '" ไม่ใช่ไฟล์ PDF'); return; }
          if (f.size > 50 * 1048576) { msg.push('"' + f.name + '" ใหญ่เกิน 50 MB'); return; }
          S.docs.push({ type: S.ui.docType || 'OTH', name: f.name.slice(0, 120), size: f.size, date: Date.now() }); added++;
        });
        c.render(true);
        const m = document.getElementById('doc-msg'); if (m) m.textContent = (added ? 'เพิ่มในรายการแล้ว ' + added + ' ไฟล์ (ไม่ได้อ่านเนื้อหาหรืออัปโหลดไฟล์) ' : '') + (msg.length ? 'เพิ่มไม่ได้: ' + msg.join(', ') : '');
      });
      document.addEventListener('input', (e) => {
        const t = e.target, k = t.dataset && t.dataset.sf; if (!k) return;
        S.school[k] = t.value;
        if (k === 'students') { const z = document.getElementById('size-chip'); if (z) z.textContent = sizeOf(+t.value) || 'ระบุจำนวนนักเรียน'; }
      });
    }

    const h = { ic, banner, card, btn, lv, lvr, empty, hasData, dateTh, sizeOf, HZ, EL_IC, RC, RCR, SCHOOL };
    return { h, shell, bind, pages: { dash: pageDash, school: pageSchool, rassess: pageRassess, ready: pageReady, pni: pagePni, matrix: pageMatrix, strategy: pageStrategy, plan: pagePlan, brief: pageBrief, plandoc: pagePlandoc, moe: pageMoe }, ids: ['dash', 'school', 'rassess', 'ready', 'pni', 'matrix', 'strategy', 'plan', 'brief', 'plandoc', 'moe', 'rules'] };
  }
  root.RS_TOOL = { create };
})(window);
