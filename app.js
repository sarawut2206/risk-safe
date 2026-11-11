/* Risk Safe (R²-SAFE) ต้นแบบ V0.3: เว็บไซต์พร้อมเครื่องมือ ประมวลผลในเบราว์เซอร์เท่านั้น ไม่เก็บ ไม่ส่งข้อมูลออก */
(function () {
  'use strict';
  const D = RS_DATA, E = RS_ENGINE;
  const S = {
    risk: {}, seven: {}, resource: 'ปานกลาง', params: Object.assign({}, E.DEFAULT_PARAMS),
    status: {}, moe: {}, aar: '', docs: [], school: { name: '', students: '', staff: '', year: '2569', province: '' },
    // ติดตามผลและบทเรียน / แบบประเมินนวัตกรรม / ห้องวิเคราะห์ของผู้วิจัย (ทั้งหมดอยู่ในเบราว์เซอร์นี้ ส่งออกเป็นไฟล์เมื่อผู้ใช้สั่งเท่านั้น)
    track: { logs: {}, snaps: [], custom: [], code: '', arm: '', consent: false, saveLocal: false, includeText: false, includeProvince: false, snapLabel: '' },
    eval: { admin: { code: '', items: {}, sus: {}, comment: '' }, expert: { code: '', field: '', cases: {}, items: {}, comment: '' } },
    lab: { reports: [], experts: [], admins: [], msgs: [], learnP: {}, crit: {} },
    // ระบบรวบรวมข้อมูลสถานศึกษา: ร่างอยู่ในเบราว์เซอร์นี้ ส่งออกเมื่อผู้ตอบกดส่งหรือดาวน์โหลดเองเท่านั้น (ดู tool3.js)
    collect: { code: '', pin: '', role: '', drafts: {}, storeOk: true, msg: '', remote: null },
    clab: { payloads: [], roster: [], msgs: [], mode: 'all', base: '' },
    ui: { step: 1, rtab: 'risk', riskDom: 'V', sevEl: 'STG', stratDom: 'V', mxDom: '', docType: 'SAR', useRules: true, clabTab: 'import', cdraft: null, exTab: 'rules', exDom: '', exCell: '', exRes: 1, exFilter: '', trkTab: 'log', evTab: 'admin', labTab: 'import', lgOpen: {}, bank: { q: '', dom: '', el: '', t3: '', res: '', ev: '' } },
  };
  const BUNDLED_BANK = D.bank.slice();
  const cd = (x) => x.sb || x.id; // รหัสที่แสดง: SB-xxx (ตามดุษฎีนิพนธ์) ถ้าไม่มีใช้รหัสเดิม
  const extra = (x) => [['กลุ่มเป้าหมาย', x.target], ['เงื่อนไขก่อนดำเนินการ', x.prereq], ['ทรัพยากรที่ต้องใช้', x.resources], ['ผลผลิต', x.output], ['ผลลัพธ์ที่คาดหวัง', x.outcome], ['ประเภท TOWS', x.tows ? x.tows + ' (ตรรกะที่มาของมาตรการ ไม่ใช่สถานะของโรงเรียน)' : ''], ['ลำดับ QSPM ในประเด็นเดียวกัน (1 = ดีที่สุด)', x.qpri], ['ระดับหลักฐาน', x.evg ? x.evg + ' · ' + (EVG_TXT[x.evg] || '') : ''], ['แหล่งหลักฐาน', x.evsrc], ['สิ่งที่หลักฐานรองรับและข้อจำกัด', x.evnote], ['สถานะตรวจหลักฐาน', x.evid], ['สถานะมาตรการ', x.status]].filter((p) => p[1]);
  const EVG_TXT = { A: 'มีทบทวนเชิงระบบรองรับ', B: 'รองรับบางส่วนหรือผลผสม', C: 'มีนโยบายหรือกฎหมายรองรับ ยังไม่มีงานวัดผล', D: 'ยังไม่พบหลักฐาน' };
  const evBadge = (x) => x.evg ? '<div class="evb"><span class="chip ' + (x.evg === 'A' || x.evg === 'B' ? 'ok' : 'warn') + '" title="' + esc(x.evnote || '') + '">หลักฐานระดับ ' + esc(x.evg) + ' · ' + esc(EVG_TXT[x.evg] || '') + '</span>' + (x.evsrc ? ' <span class="muted">' + esc(x.evsrc) + '</span>' : '') + '</div>' : '';
  const preHtml = (m) => (m.prereqInfo || []).length ? '<div class="pre"><b>ควรมีก่อน:</b> ' + m.prereqInfo.map((p) => esc(p.sb + (p.name ? ' ' + p.name : '')) + ' ' + (p.selected ? '<span class="chip ok">อยู่ในรายการนี้</span>' : '<span class="chip warn">ไม่อยู่ในรายการ ตรวจว่ามีอยู่แล้วหรือไม่</span>')).join('; ') + '</div>' : '';
  const stretchHtml = (dom) => (dom.stretch && dom.stretch.length) ? '<div class="card"><h3>เหมาะกับโรงเรียน แต่เกินทรัพยากรที่มี (' + dom.stretch.length + ' ข้อ)</h3><p class="hint">ไม่รวมในรายการหลัก ควรพิจารณาขอสนับสนุนจากต้นสังกัดหรือเครือข่าย ผู้อำนวยการเป็นผู้ตัดสิน</p>' + dom.stretch.map((m) => '<div class="m"><h4>' + esc(m.name) + ' <span class="pill">' + cd(m) + '</span></h4><div>' + esc(m.desc) + '</div><div class="meta"><span>ทรัพยากรระดับ ' + m.res + '</span><span>ผู้รับผิดชอบ: ' + esc(m.owner) + '</span></div>' + evBadge(m) + '<div class="why">' + esc(m.why) + '</div></div>').join('') + '</div>' : '';
  const extraHtml = (x) => { const e = extra(x); return e.length ? '<details class="xd"><summary>รายละเอียดเพิ่มเติม</summary><dl>' + e.map((p) => '<dt>' + esc(p[0]) + '</dt><dd>' + esc(p[1]) + '</dd>').join('') + '</dl></details>' : ''; };
  const BANKSRC = { source: 'ฝังในเว็บ', version: '', updated: '', note: '', error: '', loading: false };
  const SHORT_DOM = { V: 'ความรุนแรงของมนุษย์', A: 'อุบัติเหตุและภัยพิบัติ', P: 'การละเมิดสิทธิ', H: 'สุขภาวะกายและจิตใจ' };
  const SHORT_EL = { STG: 'กลยุทธ์', STR: 'โครงสร้าง', SYS: 'ระบบ', STY: 'รูปแบบการบริหาร', STF: 'บุคลากร', SKL: 'ทักษะ', VAL: 'ค่านิยมร่วม' };
  const STATUS = ['ยังไม่เริ่ม', 'กำลังดำเนินการ', 'เสร็จแล้ว'];
  const RANKCOL = { hi: '#d64545', mid: '#e0a526', lo: '#2e9e6b' };

  const LOGO = '<svg viewBox="0 0 40 46" width="34" height="40" aria-hidden="true"><path d="M20 2 3 8v14c0 11 7 19 17 22 10-3 17-11 17-22V8z" fill="#fff"/><path d="M20 5.5 6 10.3V22c0 9.2 5.8 15.8 14 18.6 8.2-2.8 14-9.4 14-18.6V10.3z" fill="#0e1f3f"/><path d="M20 8 9 11.8V21h11z" fill="#d64545"/><path d="M20 8l11 3.8V21H20z" fill="#e0a526"/><path d="M9 21h11v17.3C13.6 36 9 30 9 22z" fill="#2e9e6b"/><path d="M20 21h11v1c0 8-4.6 14-11 16.3z" fill="#3b78c4"/></svg>';
  const ICON = {
    bank: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5c0-1 3.6-2 8-2s8 1 8 2-3.6 2-8 2-8-1-8-2z"/><path d="M4 5v7c0 1 3.6 2 8 2s8-1 8-2V5M4 12v7c0 1 3.6 2 8 2s8-1 8-2v-7"/></svg>',
    risk: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 2.5 20h19L12 3z"/><path d="M12 10v5M12 17.6v.4"/></svg>',
    tool: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>',
  };
  // เมนูบน (nav) และหน้าทั้งหมด; field nav = เมนูบนที่ต้องไฮไลต์เมื่ออยู่หน้านี้
  const NAV = [
    { id: 'bank', label: 'คลังกลยุทธ์' },
    { id: 'risk', label: 'ฐานข้อมูลความเสี่ยง' },
    { id: 'input', label: 'เครื่องมือประเมิน' },
    { id: 'evaluate', label: 'ประเมินนวัตกรรม' },
    { id: 'portal', label: 'เก็บข้อมูลโรงเรียน' },
    { id: 'about', label: 'เกี่ยวกับโครงการ' },
  ];
  const PORTAL = ['portal', 'form1', 'form2', 'form3', 'collectlab'];
  const TOOL = ['school', 'dash', 'rassess', 'ready', 'pni', 'matrix', 'strategy', 'brief', 'plandoc', 'moe', 'planbook', 'plan', 'explain', 'track', 'evaluate', 'lab', 'rules'];
  const PAGES = [
    { id: 'home', nav: '', title: 'Risk Safe ระบบบริหารความปลอดภัยบนฐานความเสี่ยง', sub: '' },
    { id: 'bank', nav: 'bank', eyebrow: 'คลังกลยุทธ์', title: 'คลังมาตรการ (Strategy Bank) ฉบับร่าง 68 รายการ', sub: 'ร่างที่ผู้วิจัยจัดทำ ยังไม่ได้ตรวจหลักฐานและแหล่งอ้างอิงรายข้อ และยังไม่ผ่านเดลฟาย ใช้สาธิตการทำงานของระบบ' },
    { id: 'risk', nav: 'risk', eyebrow: 'ฐานข้อมูลความเสี่ยง', title: 'ข้อประเมินและเกณฑ์ความเสี่ยง', sub: 'รายการข้อประเมินความเสี่ยง 4 ด้านของภัยและข้อประเมินความพร้อม 7-S ที่เครื่องมือใช้ (ร่างรอเดลฟาย) นี่ไม่ใช่ฐานข้อมูลเหตุการณ์จริงของโรงเรียนใด' },
    { id: 'school', nav: 'input', eyebrow: 'เครื่องมือประเมิน', title: 'ข้อมูลโรงเรียนและเอกสาร', sub: '' },
    { id: 'rassess', nav: 'input', eyebrow: 'เครื่องมือประเมิน', title: 'ประเมินความเสี่ยง', sub: '' },
    { id: 'ready', nav: 'input', eyebrow: 'เครื่องมือประเมิน', title: 'ประเมินความพร้อม 7-S', sub: '' },
    { id: 'pni', nav: 'input', eyebrow: 'เครื่องมือประเมิน', title: 'วิเคราะห์ช่องว่าง PNI', sub: '' },
    { id: 'dash', nav: 'input', eyebrow: 'เครื่องมือประเมิน', title: 'ภาพรวมความเสี่ยงและความพร้อม', sub: 'สรุปผลจากข้อมูลที่กรอก: ระดับความเสี่ยงรายด้าน ความพร้อมตาม 7-S และกลุ่มแนวทางตอบสนอง' },
    { id: 'matrix', nav: 'input', eyebrow: 'เครื่องมือประเมิน', title: 'ตารางตัดสินใจ Risk × Readiness (R1–R9)', sub: 'จับคู่ระดับความเสี่ยงรายด้านกับระดับความพร้อมขององค์กร เป็นกลุ่มแนวทางตอบสนอง' },
    { id: 'strategy', nav: 'input', eyebrow: 'เครื่องมือประเมิน', title: 'กลยุทธ์และมาตรการที่ระบบเสนอ', sub: 'พร้อมเหตุผลของการเลือกที่ตรวจย้อนกลับได้ ผู้อำนวยการเป็นผู้ตัดสินใจขั้นสุดท้าย' },
    { id: 'brief', nav: 'input', eyebrow: 'เครื่องมือประเมิน', title: 'สรุปสำหรับผู้บริหาร', sub: '' },
    { id: 'plandoc', nav: 'input', eyebrow: 'เครื่องมือประเมิน', title: 'แผนต้นแบบรายมาตรการ', sub: '' },
    { id: 'moe', nav: 'input', eyebrow: 'เครื่องมือประเมิน', title: 'ประกาศ ศธ. 7 มาตรการความปลอดภัย', sub: '' },
    { id: 'planbook', nav: 'input', eyebrow: 'เครื่องมือประเมิน', title: 'เล่มแผนปฏิบัติการ', sub: '' },
    { id: 'plan', nav: 'input', eyebrow: 'เครื่องมือประเมิน', title: 'แผนปฏิบัติการและติดตามผล', sub: 'ผู้รับผิดชอบ ตัวชี้วัด ระยะเวลา และสถานะการดำเนินงาน (ต้นแบบ: สถานะไม่ถูกบันทึกถาวร)' },
    { id: 'rules', nav: 'input', eyebrow: 'เครื่องมือประเมิน', title: 'กฎการตัดสินใจและเกณฑ์เบื้องต้น', sub: 'ค่าเริ่มต้นเป็นร่างตามบทที่ 3 ยังไม่ผ่านเดลฟาย แก้ได้เพื่อทดสอบความไวของผล' },
    { id: 'explain', nav: 'input', eyebrow: 'เครื่องมือประเมิน', title: 'กฎตัดสินใจและเหตุผลของผลลัพธ์', sub: '' },
    { id: 'track', nav: 'input', eyebrow: 'เครื่องมือประเมิน', title: 'ติดตามผลและบทเรียน', sub: '' },
    { id: 'evaluate', nav: 'evaluate', eyebrow: 'ประเมินนวัตกรรม', title: 'ประเมินนวัตกรรม', sub: '' },
    { id: 'lab', nav: 'evaluate', eyebrow: 'ประเมินนวัตกรรม', title: 'ห้องวิเคราะห์ของผู้วิจัย', sub: '' },
    { id: 'portal', nav: 'portal', eyebrow: 'เก็บข้อมูลโรงเรียน', title: 'ระบบรวบรวมข้อมูลสถานศึกษา', sub: '' },
    { id: 'form1', nav: 'portal', eyebrow: 'เก็บข้อมูลโรงเรียน', title: 'แบบสอบถามความเสี่ยงและความพร้อม', sub: '' },
    { id: 'form2', nav: 'portal', eyebrow: 'เก็บข้อมูลโรงเรียน', title: 'แบบบันทึกจำนวนเหตุการณ์', sub: '' },
    { id: 'form3', nav: 'portal', eyebrow: 'เก็บข้อมูลโรงเรียน', title: 'แบบตรวจเอกสารนโยบาย', sub: '' },
    { id: 'collectlab', nav: 'portal', eyebrow: 'เก็บข้อมูลโรงเรียน', title: 'แดชบอร์ดผู้วิจัย', sub: '' },
    { id: 'about', nav: 'about', eyebrow: 'เกี่ยวกับโครงการ', title: 'เกี่ยวกับต้นแบบ Risk Safe (R²-SAFE)', sub: 'ระบบนี้ตอบอะไร ทำงานอย่างไร และสถานะของต้นแบบ' },
  ];
  
  // ---------- ตัวช่วย ----------
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (x, n) => (isFinite(x) ? x.toFixed(n) : '–');
  const cls = { 'สูง': 'hi', 'กลาง': 'mid', 'ต่ำ': 'lo' };
  const riskTag = (l) => (l ? '<span class="tag ' + cls[l] + '">' + l + '</span>' : '–');
  const readyTag = (l) => (l ? '<span class="tag ' + ({ 'สูง': 'lo', 'กลาง': 'mid', 'ต่ำ': 'hi' }[l]) + '">' + l + '</span>' : '–');
  const elName = (c) => (D.elements.find((e) => e.code === c) || {}).name || c;
  const getOut = () => E.analyze({ risk: S.risk, seven: S.seven, resource: S.resource }, D, S.params, S.ui.useRules === false ? null : { guard: RS_DECISION.guard });
  const filled = () => {
    const r = D.riskItems.filter((x) => { const p = S.risk[x.id] || []; return p[0] != null && p[1] != null; }).length;
    const s = D.sevenItems.filter((x) => { const p = S.seven[x.id] || []; return p[0] != null && p[1] != null; }).length;
    return { r, s, rt: D.riskItems.length, st: D.sevenItems.length, pct: Math.round(((r + s) / (D.riskItems.length + D.sevenItems.length)) * 100) };
  };
  const domFill = (code) => D.riskItems.filter((x) => x.dom === code && (S.risk[x.id] || [])[0] != null && (S.risk[x.id] || [])[1] != null).length;
  const elFill = (code) => D.sevenItems.filter((x) => x.elem === code && (S.seven[x.id] || [])[0] != null && (S.seven[x.id] || [])[1] != null).length;
  const hasData = () => getOut().domains.some((d) => d.group);
  const uniq = (a) => Array.from(new Set(a));
  const mKey = (dom, id) => dom + ':' + id;

  // ---------- ตารางเมทริกซ์ ----------
  function matrixHtml(out, compact) {
    const groups = {};
    if (out) out.domains.forEach((d) => { if (d.group) (groups[d.group] = groups[d.group] || []).push(d); });
    let s = '<div class="matrix"><div></div>' + ['ต่ำ', 'กลาง', 'สูง'].map((r) => '<div class="h">ความพร้อม' + r + '</div>').join('');
    ['สูง', 'กลาง', 'ต่ำ'].forEach((rk, ri) => {
      s += '<div class="h">ความเสี่ยง' + rk + '</div>';
      ['ต่ำ', 'กลาง', 'สูง'].forEach((rd, ci) => {
        const p = D.packages.find((x) => x.risk === rk && x.ready === rd), n = ri * 3 + ci + 1, g = groups[p.code] || [];
        s += '<div class="cell u' + n + (g.length ? ' cur' : '') + '"><b class="code">' + p.code + '</b>' + (compact ? '' : '<span class="nm">' + esc(p.name) + '</span>') +
          (g.length ? '<div class="doms" title="ด้านที่อยู่ในกลุ่มนี้">' + g.map((d) => '<span>' + d.code + '</span>').join('') + '</div>' : '') + '</div>';
      });
    });
    return s + '</div>';
  }

  // ---------- เนื้อหาแต่ละหน้า ----------
  // ----- ป้อนข้อมูล -----
  function pills(kind, id, idx, anchors) {
    const cur = (S[kind][id] || [])[idx];
    let s = '<span class="pills" role="radiogroup" aria-label="' + esc(kind === 'risk' ? (idx ? 'C' : 'L') : (idx ? 'I' : 'D')) + ' ' + id + '">';
    for (let n = 1; n <= 5; n++) s += '<button type="button" role="radio" aria-checked="' + (cur === n) + '" data-kind="' + kind + '" data-id="' + id + '" data-idx="' + idx + '" data-val="' + n + '" title="' + esc((anchors[n - 1] || [])[1] || '') + '">' + n + '</button>';
    return s + '</span>';
  }
  function legendBox(title, anchors) {
    return '<details class="legend-box"><summary>' + title + '</summary><ol>' + anchors.map((a) => '<li value="' + a[0] + '">' + esc(a[1]) + '</li>').join('') + '</ol></details>';
  }
  function benchFilters() {
    const b = S.ui.bank;
    const opt = (items, cur, all) => '<option value="">' + all + '</option>' + items.map((i) => '<option value="' + esc(i[0]) + '"' + (cur === i[0] ? ' selected' : '') + '>' + esc(i[1]) + '</option>').join('');
    return '<div class="filters"><label>ค้นหา<input type="search" id="f-q" value="' + esc(b.q) + '" placeholder="ชื่อ รายละเอียด ตัวชี้วัด"></label>' +
      '<label>ด้านของภัย<select id="f-dom">' + opt(D.domains.map((d) => [d.code, d.code + ' ' + SHORT_DOM[d.code]]).concat([['X', 'X ข้ามด้าน']]), b.dom, 'ทั้งหมด') + '</select></label>' +
      '<label>องค์ประกอบ 7-S<select id="f-el">' + opt(D.elements.map((e) => [e.code, SHORT_EL[e.code]]), b.el, 'ทั้งหมด') + '</select></label>' +
      '<label>ประเภท 3 ป.<select id="f-t3">' + opt(uniq(D.bank.map((x) => x.type3)).map((t) => [t, t]), b.t3, 'ทั้งหมด') + '</select></label>' +
      '<label>ทรัพยากร<select id="f-res">' + opt([['1', 'ระดับ 1'], ['2', 'ระดับ 2'], ['3', 'ระดับ 3']], b.res, 'ทั้งหมด') + '</select></label>' +
      '<label>ระดับหลักฐาน<select id="f-ev">' + opt([['A', 'A ทบทวนเชิงระบบรองรับ'], ['B', 'B รองรับบางส่วน'], ['C', 'C นโยบายหรือกฎหมาย'], ['D', 'D ยังไม่พบหลักฐาน']], b.ev, 'ทั้งหมด') + '</select></label></div>';
  }
  function bankRows() {
    const b = S.ui.bank, q = b.q.trim().toLowerCase();
    return D.bank.filter((x) => (!b.dom || x.dom === b.dom) && (!b.el || x.elem === b.el) && (!b.t3 || x.type3 === b.t3) && (!b.res || String(x.res) === b.res) && (!b.ev || x.evg === b.ev) && (!q || (x.name + x.desc + x.kpi + x.owner).toLowerCase().indexOf(q) >= 0));
  }
  function bankTable() {
    const rows = bankRows();
    return '<p class="hint" aria-live="polite">แสดง ' + rows.length + ' จาก ' + D.bank.length + ' รายการ</p><div class="scroll"><table><thead><tr><th>รหัส</th><th>ด้าน</th><th>มาตรการ</th><th>7-S</th><th>3 ป.</th><th>ระยะ</th><th class="n">ทรัพยากร</th><th>ผู้รับผิดชอบ</th><th>ตัวชี้วัด</th><th>เหมาะกับความเสี่ยง</th><th>เหมาะกับความพร้อม</th></tr></thead><tbody>' +
      rows.map((x) => '<tr><td>' + esc(cd(x)) + (/^เสนอเพิ่ม/.test(x.status || '') ? ' <span class="chip warn">เพิ่มใหม่</span>' : '') + '</td><td>' + x.dom + '</td><td><b>' + esc(x.name) + '</b><br>' + esc(x.desc) + evBadge(x) + extraHtml(x) + '</td><td>' + esc(SHORT_EL[x.elem]) + '</td><td>' + esc(x.type3) + '</td><td>' + esc(x.phase) + '</td><td class="n">' + x.res + '</td><td>' + esc(x.owner) + '</td><td>' + esc(x.kpi) + '</td><td>' + esc(x.risk) + '</td><td>' + esc(x.ready) + '</td></tr>').join('') + '</tbody></table></div>';
  }
  function bankStatus() {
    const b = BANKSRC, remote = b.source === 'Google Sheets';
    let s = '<div class="card" style="margin-bottom:14px"><div style="display:flex;gap:12px;justify-content:space-between;align-items:center;flex-wrap:wrap"><div>';
    s += '<b>แหล่งข้อมูลคลังมาตรการ: </b>' + (b.loading ? '<span class="chip">กำลังโหลดจาก Google Sheets…</span>' : remote ? '<span class="chip ok">Google Sheets</span>' : '<span class="chip warn">ข้อมูลที่ฝังในเว็บ</span>');
    if (remote) s += ' <span class="muted">เวอร์ชัน ' + esc(b.version || '–') + (b.updated ? ' · อัปเดต ' + esc(b.updated) : '') + (b.note ? ' · ' + esc(b.note) : '') + '</span>';
    if (!remote && b.error) s += '<div class="hint" style="margin:6px 0 0">โหลดจาก Google Sheets ไม่ได้ จึงใช้ข้อมูลที่ฝังไว้: ' + esc(b.error) + '</div>';
    if (remote) s += '<div class="hint" style="margin:6px 0 0">ผู้มีสิทธิ์แก้ชีตแก้คลังได้ เว็บตรวจรูปแบบข้อมูลทุกแถวก่อนใช้ ผลวิเคราะห์ทุกหน้าใช้คลังชุดนี้</div>';
    return s + '</div><button class="btn sm" data-act="reload-bank"' + (b.loading ? ' disabled' : '') + '>โหลดใหม่</button></div></div>';
  }
  function pageBank() { return bankStatus() + '<div class="card">' + benchFilters() + '<div id="bank-wrap">' + bankTable() + '</div></div>'; }
  async function loadRemoteBank() {
    const cfg = window.RS_CONFIG || {};
    if (!cfg.bankUrl || !window.RS_BANKLOADER) return;
    BANKSRC.loading = true; if (cur === 'bank') render(true);
    try {
      const r = await RS_BANKLOADER.fetchBank(cfg.bankUrl, { domains: D.domains.map((d) => d.code), elements: D.elements.map((e) => e.code) }, cfg.timeoutMs);
      D.bank = r.rows; Object.assign(BANKSRC, { source: 'Google Sheets', version: r.version, updated: r.updated, note: r.note, error: '' });
    } catch (e) {
      D.bank = BUNDLED_BANK.slice(); Object.assign(BANKSRC, { source: 'ฝังในเว็บ', version: '', updated: '', note: '', error: (e && e.name === 'AbortError') ? 'หมดเวลารอ' : (e && e.message === 'Failed to fetch') ? 'เชื่อมต่อ Google Sheets ไม่ได้ (สคริปต์ยังไม่มี doGet ที่ถูกต้อง หรือยังไม่ได้ deploy ใหม่ หรือเครือข่ายถูกบล็อก)' : String(e && e.message || e).slice(0, 220) });
    }
    BANKSRC.loading = false;
    if (['home', 'bank', 'strategy', 'plan', 'dash', 'matrix'].indexOf(cur) >= 0) render(true);
  }

  function pageRules() {
    const meta = [
      ['riskLow', 'ค่าตัดความเสี่ยงต่ำ (ดัชนี ≤)', 'ดัชนี R = ค่าเฉลี่ย L×C (ช่วง 1–25)', 0.5],
      ['riskMid', 'ค่าตัดความเสี่ยงปานกลาง (ดัชนี ≤)', 'มากกว่าค่านี้ = ความเสี่ยงสูง', 0.5],
      ['overrideC', 'กฎยกระดับ: ค่า C ที่ถือว่ารุนแรงสูงสุด', 'ข้อใดมี C เท่านี้และ L ถึงขั้นต่ำ จัดด้านนั้นเป็นความเสี่ยงสูง', 1],
      ['overrideL', 'กฎยกระดับ: ค่า L ขั้นต่ำ (≥)', '', 1],
      ['readyLow', 'ค่าตัดความพร้อมต่ำ (ค่าเฉลี่ย D ≤)', 'ช่วงกว้าง 0.80 ตามเกณฑ์แปลผล', 0.05],
      ['readyMid', 'ค่าตัดความพร้อมปานกลาง (ค่าเฉลี่ย D ≤)', 'มากกว่าค่านี้ = ความพร้อมสูง', 0.05],
      ['floorD', 'กฎเพดาน: D ขั้นต่ำของโครงสร้างและระบบ', 'ต่ำกว่านี้ไม่จัดความพร้อมเป็นระดับสูง', 0.01],
    ];
    let s = '<div class="grid g12"><div class="card"><h3>กฎการตัดสินใจ 8 ข้อ</h3><ol style="padding-left:1.3em;margin:6px 0">' +
      ['จำแนกระดับความเสี่ยงของภัยแต่ละด้าน (พร้อมกฎยกระดับเมื่อมีผลกระทบรุนแรงสูงสุดและเกิดซ้ำ)', 'จำแนกระดับความพร้อมขององค์กร (พร้อมกฎเพดานเมื่อโครงสร้างหรือระบบต่ำกว่าเกณฑ์)', 'จับคู่สองแกนเป็นกลุ่ม R1–R9', 'จัดอันดับช่องว่าง 7-S ด้วย PNI Modified แล้วเลือก 3 องค์ประกอบที่ช่องว่างสูงสุด', 'คัดมาตรการจากคลังที่ตรงกับด้านของภัยและองค์ประกอบ 7-S', 'ใช้ทรัพยากรที่โรงเรียนมีจริงเป็นข้อจำกัดของจำนวนและลำดับมาตรการ', 'ใช้ QSPM จัดลำดับเมื่อมีมาตรการทางเลือกหลายข้อในประเด็นเดียวกัน (ต้นแบบนี้ยังไม่มี QSPM)', 'กำหนดผู้รับผิดชอบ ระยะเวลา ตัวชี้วัด และแสดงเหตุผลของการเลือกทุกข้อ'].map((x) => '<li>' + x + '</li>').join('') + '</ol></div>';
    s += '<div class="card"><h3>เกณฑ์เบื้องต้น (แก้ได้)</h3><p class="hint">เมื่อแก้ค่า ผลวิเคราะห์ทุกหน้าคำนวณใหม่ ใช้ทดสอบความไวของการจัดกลุ่ม</p><div class="scroll"><table><thead><tr><th>เกณฑ์</th><th>ค่า</th><th>ความหมาย</th></tr></thead><tbody>' +
      meta.map((m) => '<tr><td>' + esc(m[1]) + '</td><td><input type="number" step="' + m[3] + '" data-param="' + m[0] + '" value="' + S.params[m[0]] + '" aria-label="' + esc(m[1]) + '"></td><td>' + esc(m[2]) + '</td></tr>').join('') + '</tbody></table></div><p><button class="btn sm" data-act="params-reset">คืนค่าเริ่มต้น</button></p></div></div>';
    return s;
  }

  function pageAbout() {
    return '<div class="grid g2"><div class="card"><h3>ระบบนี้ตอบคำถาม 5 ข้อ</h3><ol style="padding-left:1.3em"><li>โรงเรียนมีความเสี่ยงด้านใด</li><li>มีความพร้อมในการจัดการความเสี่ยงเพียงใด</li><li>ควรเลือกกลยุทธ์อะไรก่อน</li><li>ต้องใช้ทรัพยากรและมอบหมายใคร</li><li>จะติดตามความก้าวหน้าได้อย่างไร</li></ol>' +
      '<p>จับคู่<b>ระดับความเสี่ยงรายด้านของภัย</b>กับ<b>ระดับความพร้อมตามกรอบ 7-S</b> เป็นกลุ่ม R1–R9 แล้วคัดมาตรการจากคลังพร้อมเหตุผลที่ตรวจย้อนกลับได้</p></div>' +
      '<div class="card"><h3>กระบวนการ 6 ขั้นตอน</h3><ol style="padding-left:1.3em"><li>วิเคราะห์ความเสี่ยง (ISO 31000, L×C)</li><li>วิเคราะห์ความพร้อม (McKinsey 7-S, D และ I)</li><li>จัดลำดับความสำคัญ (PNI Modified = (I−D)/D)</li><li>เลือกกลยุทธ์ (ตาราง Risk × Readiness และคลังมาตรการ)</li><li>ขับเคลื่อน (แผนปฏิบัติการ ผู้รับผิดชอบ)</li><li>ติดตามและเรียนรู้ (ตัวชี้วัด และย้อนกลับไปขั้น 1–4)</li></ol><p class="hint">ขั้นที่ 1 และ 2 ดำเนินการคู่ขนานกัน</p></div></div>' +
      '<div class="card" style="margin-top:14px"><h3>สถานะของต้นแบบ</h3><ul style="padding-left:1.2em;margin:6px 0"><li>เครื่องคำนวณย้ายจากเครื่องมือ Excel ต้นแบบ และทดสอบเทียบผล 70 รายการกับ Excel ด้วยข้อมูลตัวอย่างชุดเดียวกัน (โฟลเดอร์ <code>tests</code> ใน GitHub)</li><li>ข้อมูลตัวอย่างเป็นโรงเรียนสมมติ ไม่ใช่ผลของโรงเรียนจริง</li><li>คลังมาตรการดึงจาก Google Sheets (อ่านอย่างเดียว) ถ้าโหลดไม่ได้หรือข้อมูลไม่ผ่านการตรวจ เว็บใช้ข้อมูลที่ฝังไว้ เครื่องมือประเมินไม่ส่งข้อมูลที่ผู้ใช้กรอกไปที่ใด ส่วนระบบรวบรวมข้อมูลสถานศึกษาส่งข้อมูลถึงผู้วิจัยเฉพาะเมื่อผู้วิจัยเปิดใช้และผู้ตอบกดส่งเอง</li><li>เกณฑ์ ตารางตัดสินใจ และคลังมาตรการ 68 รายการเป็นร่างเริ่มต้น ยังไม่ผ่านเดลฟาย การตรวจ IOC และการประเมินโดยผู้ทรงคุณวุฒิ</li><li>ยังไม่มี QSPM ระบบสมาชิก ฐานข้อมูล และการบันทึกประวัติการอนุมัติ ซึ่งวางแผนไว้หลังเกณฑ์ผ่านเดลฟายและได้รับการรับรองจริยธรรมการวิจัย</li><li>ผลของระบบเป็นข้อเสนอสนับสนุนการวางแผน ไม่ใช้แทนดุลยพินิจของผู้อำนวยการ ไม่ใช้ตัดสินหรือจัดอันดับโรงเรียน และไม่ใช้แทนการตอบสนองเหตุฉุกเฉิน</li></ul></div>';
  }

  // ---------- ตาราง 5×5 (L × C) ----------
  function matrix5() {
    const p = S.params;
    const lv = (v) => (v <= p.riskLow ? 'lo' : v <= p.riskMid ? 'mid' : 'hi');
    let s = '<div class="m5"><div class="m5-y">ความถี่ในปีการศึกษา (L)</div><div class="m5-grid">';
    for (let l = 5; l >= 1; l--) {
      s += '<div class="m5-r" title="' + esc((D.lAnchors[l - 1] || [])[1] || '') + '">L' + l + '</div>';
      for (let c = 1; c <= 5; c++) {
        const v = l * c, ov = c >= p.overrideC && l >= p.overrideL;
        s += '<div class="m5c ' + lv(v) + (ov ? ' ov' : '') + '" title="L' + l + ' × C' + c + ' = ' + v + (ov ? ' (เข้ากฎยกระดับ)' : '') + '">' + v + '</div>';
      }
    }
    s += '<div></div>';
    for (let c = 1; c <= 5; c++) s += '<div class="m5-h" title="' + esc((D.cAnchors[c - 1] || [])[1] || '') + '">C' + c + '</div>';
    s += '</div></div><div class="m5-note">ผลกระทบ (C) →</div>';
    s += '<div class="m5-leg"><span><i style="background:#bfecd0"></i>ต่ำ (≤ ' + p.riskLow + ')</span><span><i style="background:#fde9a6"></i>กลาง (≤ ' + p.riskMid + ')</span><span><i style="background:#f1a9a0"></i>สูง (&gt; ' + p.riskMid + ')</span><span>▲ กรอบเส้นประ = เข้ากฎยกระดับ (C ≥ ' + p.overrideC + ' และ L ≥ ' + p.overrideL + ')</span></div>';
    return s;
  }

  // ---------- หน้าแรก ----------
  function pageHome() {
    const nItems = D.riskItems.length + D.sevenItems.length;
    const stats = [[D.bank.length, 'มาตรการในคลัง', 'ฉบับร่าง รอเดลฟาย'], [D.domains.length, 'ด้านของภัย', 'V · A · P · H'], [D.elements.length, 'องค์ประกอบ 7-S', 'ตามกรอบ McKinsey'], [nItems, 'ข้อประเมิน', 'ความเสี่ยง + ความพร้อม']];
    const mods = [
      ['bank', 'bank', 'คลังกลยุทธ์', 'คลังมาตรการ ' + D.bank.length + ' รายการ กรองตามด้านของภัย องค์ประกอบ 7-S ประเภท 3 ป. และระดับทรัพยากร พร้อมผู้รับผิดชอบและตัวชี้วัด', 'เปิดคลังกลยุทธ์ →'],
      ['risk', 'risk', 'ฐานข้อมูลความเสี่ยง', 'ข้อประเมินความเสี่ยง ' + D.riskItems.length + ' ข้อใน 4 ด้านของภัย และข้อประเมิน 7-S ' + D.sevenItems.length + ' ข้อ พร้อมเกณฑ์คะแนน L × C และตารางให้คะแนน 5 × 5', 'ดูข้อประเมินและเกณฑ์ →'],
      ['input', 'tool', 'เครื่องมือประเมิน', 'กรอกข้อมูลโรงเรียน ระบบวิเคราะห์ความเสี่ยง × ความพร้อม จัดกลุ่ม R1–R9 เสนอมาตรการพร้อมเหตุผล และแผนปฏิบัติการ', 'เริ่มประเมิน →'],
    ];
    const steps = [['วิเคราะห์ความเสี่ยง', 'ISO 31000: L × C'], ['วิเคราะห์ความพร้อม', 'McKinsey 7-S: D และ I'], ['จัดลำดับความสำคัญ', 'PNI Modified'], ['เลือกกลยุทธ์', 'ตาราง Risk × Readiness'], ['ขับเคลื่อน', 'แผนปฏิบัติการ'], ['ติดตามและเรียนรู้', 'ตัวชี้วัดและ AAR']];
    let s = '<section class="hero start-hero hexbg"><div class="wrap"><span class="pillb">ต้นแบบงานวิจัยดุษฎีนิพนธ์ · มหาวิทยาลัยสยาม</span>' +
      '<h1>ระบบบริหารความปลอดภัยบนฐานความเสี่ยง</h1><p class="goldt">คลังกลยุทธ์และเครื่องมือตัดสินใจสำหรับโรงเรียนมัธยมศึกษา สังกัด สพฐ.</p>' +
      '<p class="lead">ให้คะแนนความเสี่ยงและความพร้อมของโรงเรียน ระบบจัดกลุ่มแนวทาง R1–R9 เสนอมาตรการที่ควรทำก่อนพร้อมเหตุผล และจัดแผนปฏิบัติการ ผู้อำนวยการเป็นผู้ตัดสินใจขั้นสุดท้าย</p>' +
      '<h2 class="startq">ท่านมาเพื่ออะไร เลือก 1 ข้อ</h2><div class="startgrid">' +
      '<div class="scard first"><span class="sbadge">เริ่มที่นี่ถ้าเข้ามาครั้งแรก</span><span class="who">ผู้อำนวยการ · ผู้บริหาร</span><h3>อยากเห็นว่าโรงเรียนควรทำอะไรก่อน</h3><p>ดูผลของโรงเรียนตัวอย่างทันที ไม่ต้องกรอกอะไร แล้วค่อยใส่ข้อมูลโรงเรียนของท่านเอง</p><button class="btn gold lg" data-act="example">ดูผลตัวอย่างใน 1 คลิก</button><a class="slink" href="#input" data-go="input">หรือ ประเมินโรงเรียนของฉัน →</a></div>' +
      '<div class="scard"><span class="who">ครูที่ได้รับมอบหมาย</span><h3>เตรียมข้อมูลให้ผู้บริหาร</h3><p>อัปโหลดแผนปฏิบัติการประจำปี (PDF) ระบบอ่านจำนวนนักเรียนและบุคลากรให้เอง ไม่ต้องพิมพ์ ไฟล์อยู่ในเครื่องของท่าน ไม่ถูกส่งออก</p><a class="btn gold lg" href="#school" data-go="school">อัปโหลดแผนปฏิบัติการ</a></div>' +
      '<div class="scard"><span class="who">โรงเรียนที่ร่วมงานวิจัย</span><h3>มีรหัสโรงเรียนจากผู้วิจัย</h3><p>ใส่รหัสแล้วตอบแบบสอบถาม 3 แบบ (ความเสี่ยงและความพร้อม เหตุการณ์ เอกสารนโยบาย) ระบบบันทึกร่างให้ในเครื่องนี้</p><a class="btn gold lg" href="#portal" data-go="portal">เข้าระบบเก็บข้อมูล</a></div></div>' +
      '<p class="fine">ต้นแบบเชิงวิจัย ข้อมูลตัวอย่างเป็นโรงเรียนสมมติ ไม่ใช่เว็บไซต์ทางการของ สพฐ. และเครื่องมือประเมินไม่เก็บหรือส่งข้อมูลที่กรอก (ระบบรวบรวมข้อมูลสถานศึกษาส่งข้อมูลถึงผู้วิจัยเมื่อเปิดใช้และผู้ตอบกดส่งเท่านั้น)</p></div></section>';
    s += '<section class="howto"><div class="wrap"><h2>ใช้งาน 3 ขั้นตอน</h2><ol class="how3"><li><b>1</b><div><strong>ใส่ข้อมูลโรงเรียน</strong><span>พิมพ์เอง หรืออัปโหลดแผนปฏิบัติการให้ระบบอ่านให้</span></div></li><li><b>2</b><div><strong>ให้คะแนน</strong><span>ความเสี่ยง 4 ด้าน และความพร้อม 7-S กดเลือกระดับ 1–5 ทีละข้อ</span></div></li><li><b>3</b><div><strong>รับผลและแผน</strong><span>กลุ่มแนวทาง R1–R9 มาตรการที่ควรทำก่อนพร้อมเหตุผล และแผนปฏิบัติการ ผู้รับผิดชอบ ตัวชี้วัด</span></div></li></ol><p class="howfine">ไม่ต้องสมัครสมาชิก ข้อมูลที่กรอกอยู่ในเครื่องของท่านและหายเมื่อรีเฟรช (ดาวน์โหลดแฟ้มงานเก็บไว้ได้ที่หน้า ติดตามผล)</p></div></section>';
    s += '<section class="stats"><div class="wrap">' + stats.map((x) => '<div class="stat"><b>' + x[0] + '</b><span>' + x[1] + '</span><small>' + x[2] + '</small></div>').join('') + '</div></section>';
    s += '<section class="sec"><div class="wrap"><h2 class="t">สามส่วนหลักของระบบ</h2><p class="t-sub">จากข้อมูลความเสี่ยงและความพร้อม ไปสู่มาตรการที่ลงมือทำได้จริง</p><div class="mods">' +
      mods.map((m) => '<div class="mod"><div class="ic">' + ICON[m[1]] + '</div><h3>' + m[2] + '</h3><p>' + m[3] + '</p><a href="#' + m[0] + '" data-go="' + m[0] + '">' + m[4] + '</a></div>').join('') + '</div></div></section>';
    s += '<section class="sec dark hexbg"><div class="wrap split"><div><span class="pillb">ตารางตัดสินใจ 3 × 3</span><h2>จับคู่ความเสี่ยง × ความพร้อม เป็นแนวทางตอบสนอง R1–R9</h2>' +
      '<p>ระบบจำแนกระดับความเสี่ยงของภัยแต่ละด้าน (ต่ำ กลาง สูง) และระดับความพร้อมขององค์กรตามกรอบ 7-S (ต่ำ กลาง สูง) แล้วจับคู่เป็น 1 ใน 9 กลุ่ม โดยแต่ละกลุ่มมีชุดการตัดสินใจ 6 ข้อและมาตรการจากคลังกลยุทธ์</p>' +
      '<ul class="ticks"><li>ดัชนีความเสี่ยงรายด้าน = ค่าเฉลี่ย L × C (ความถี่ × ผลกระทบ ระดับ 1–5) มีกฎยกระดับเมื่อมีผลกระทบรุนแรงสูงสุดและเกิดซ้ำ</li><li>ความพร้อมวัดจาก 7 องค์ประกอบ มีกฎเพดานเมื่อโครงสร้างหรือระบบอ่อน</li><li>ตารางนี้เป็นต้นแบบเพื่อตรวจสอบกับผู้เชี่ยวชาญ ไม่ใช่เกณฑ์ที่ผ่านเดลฟายแล้ว</li></ul>' +
      '<p style="margin-top:18px"><a class="btn gold" href="#matrix" data-go="matrix">ดูกลุ่ม R1–R9 ทั้งหมด</a></p></div><div class="m5box m3box">' + matrixHtml(null, false) + '<div class="m5-note">แถว = ระดับความเสี่ยง · คอลัมน์ = ระดับความพร้อม · สีเข้มกว่า = เร่งด่วนกว่า</div></div></div></section>';
    s += '<section class="sec"><div class="wrap"><h2 class="t">กระบวนการ 6 ขั้นตอน</h2><p class="t-sub">ขั้นที่ 1 และ 2 ดำเนินการคู่ขนานกัน แล้ววนกลับมาปรับจากผลการติดตาม</p><div class="flow">' +
      steps.map((x, i) => '<div class="st"><b>' + (i + 1) + '</b><div>' + x[0] + '</div><small>' + x[1] + '</small></div>').join('') + '</div></div></section>';
    s += '<section class="noteband"><div class="wrap"><b>ข้อควรทราบก่อนใช้งาน</b><ul><li>เกณฑ์ ตารางตัดสินใจ และคลังมาตรการเป็นร่างเริ่มต้น ยังไม่ผ่านเดลฟายและการตรวจ IOC</li><li>ผลของระบบเป็นข้อเสนอสนับสนุนการวางแผน ไม่ใช้ตัดสินหรือจัดอันดับโรงเรียน และไม่ใช้แทนการตอบสนองเหตุฉุกเฉิน</li><li>ข้อมูลที่กรอกประมวลผลในเบราว์เซอร์ของท่านเท่านั้น และหายเมื่อรีเฟรชหน้า อย่ากรอกชื่อบุคคลหรือรายละเอียดเหตุการณ์จริง</li></ul></div></section>';
    s += '<section class="ctaband"><div class="wrap"><h2>พร้อมเริ่มต้นบริหารความปลอดภัยอย่างเป็นระบบ</h2><p>ลองกับข้อมูลโรงเรียนสมมติ แล้วดูว่าระบบเสนอมาตรการและเหตุผลอย่างไร</p><a class="btn lg" href="#input" data-go="input">เริ่มต้นใช้งาน</a> <button class="btn lg" style="background:transparent;color:var(--navy)" data-act="example">ดูตัวอย่างผลลัพธ์</button></div></section>';
    return s;
  }

  // ---------- ฐานข้อมูลความเสี่ยง (ข้อประเมินและเกณฑ์) ----------
  function anchorList(title, anchors) {
    return '<div class="card"><h3>' + title + '</h3><ol style="padding-left:1.3em;margin:6px 0">' + anchors.map((a) => '<li value="' + a[0] + '">' + esc(a[1]) + '</li>').join('') + '</ol></div>';
  }
  function pageRisk() {
    const t = S.ui.rtab;
    const tab = (id, l) => '<button aria-current="' + (t === id ? 'page' : 'false') + '" data-act="rtab" data-tab="' + id + '">' + l + '</button>';
    let s = '<div class="toolbar"><div class="tool-tabs">' + tab('risk', 'ข้อประเมินความเสี่ยง (' + D.riskItems.length + ')') + tab('seven', 'ข้อประเมิน 7-S (' + D.sevenItems.length + ')') + tab('scale', 'เกณฑ์คะแนนรายข้อ') + '</div><div class="tool-actions"><a class="btn primary sm" href="#input" data-go="input">ใช้ข้อประเมินเหล่านี้ในเครื่องมือ</a></div></div>';
    if (t === 'risk') {
      s += D.domains.map((d) => '<div class="card" style="margin-bottom:14px"><h3>' + esc(d.code + ' ' + d.name) + '</h3><div class="scroll"><table><thead><tr><th>รหัส</th><th>ข้อประเมิน</th><th>พื้นที่ที่เกี่ยวข้อง</th></tr></thead><tbody>' +
        D.riskItems.filter((x) => x.dom === d.code).map((x) => '<tr><td>' + x.id + '</td><td>' + esc(x.text) + '</td><td>' + esc(x.space) + '</td></tr>').join('') + '</tbody></table></div></div>').join('');
    } else if (t === 'seven') {
      s += D.elements.map((e) => '<div class="card" style="margin-bottom:14px"><h3>' + esc(e.code + ' ' + e.name) + '</h3><div class="scroll"><table><thead><tr><th>รหัส</th><th>ข้อประเมิน</th></tr></thead><tbody>' +
        D.sevenItems.filter((x) => x.elem === e.code).map((x) => '<tr><td>' + x.id + '</td><td>' + esc(x.text) + '</td></tr>').join('') + '</tbody></table></div></div>').join('');
    } else {
      s += '<div class="grid g12"><div class="card light"><h3>ตารางให้คะแนนรายข้อ L × C (5 × 5)</h3><p class="hint">ใช้ให้คะแนนแต่ละข้อประเมิน ไม่ใช่ตารางตัดสินใจ (ตารางตัดสินใจคือ 3 × 3 ในหน้า R1–R9) ค่าในช่อง = L × C ของแต่ละข้อ (ค่าตัดระดับปรับได้ในหน้า "กฎและเกณฑ์")</p><div class="m5box">' + matrix5() + '</div></div><div class="stack">' +
        anchorList('เกณฑ์คะแนน L ความถี่ (ร่าง รอเดลฟาย)', D.lAnchors) + anchorList('เกณฑ์คะแนน C ผลกระทบ (ร่าง รอเดลฟาย)', D.cAnchors) + anchorList('เกณฑ์คะแนน D และ I ความพร้อม (ร่าง รอเดลฟาย)', D.dAnchors) + '</div></div>';
    }
    return s;
  }

  // ---------- เราเตอร์และการวาด ----------
  const UI = RS_TOOL.create({ S, D, E, esc, fmt, getOut, cd, evBadge, preHtml, extraHtml, stretchHtml, pills, legendBox, filled, domFill, uniq, mKey, STATUS, SHORT_DOM, SHORT_EL, render: (k) => render(k) });
  UI.bind();
  const UI2 = RS_TOOL2.create({ S, D, E, esc, fmt, getOut, cd, mKey, SHORT_DOM, SHORT_EL, render: (k) => render(k) }, UI.h);
  UI2.bind();
  UI2.restore();
  // อ่านข้อมูลจากแผนปฏิบัติการ (PDF) ในหน้าข้อมูลโรงเรียนของเครื่องมือประเมิน (ปลายทางคือ S.school)
  const UIP = RS_PLANUI.create({ id: 'tool', state: (S.plan = S.plan || {}), esc, ic: UI.h.ic, card: UI.h.card, render: () => render(true), done: () => render(true), auto: true, set: (to, v) => { S.school[to] = v; },
    record: (f) => { const nm = f.name.slice(0, 120); if (!S.docs.some((d) => d.name === nm)) S.docs.push({ type: 'ACT', name: nm, size: f.size, date: Date.now() }); }, missingKeys: ['name', 'students', 'staff', 'province', 'fiscalYear'],
    title: 'อัปโหลดแผนปฏิบัติการ ให้ระบบกรอกข้อมูลให้',
    intro: 'กดปุ่มด้านล่างแล้วเลือกไฟล์แผนปฏิบัติการประจำปีของโรงเรียน ระบบอ่านไฟล์และกรอกข้อมูลโรงเรียนให้ทันที (ชื่อโรงเรียน จำนวนนักเรียน ครูและบุคลากร ปี จังหวัด) พร้อมเพิ่มไฟล์ในรายการเอกสารและสรุปโครงการที่เกี่ยวกับความปลอดภัยไว้ให้ดู <b>ไฟล์ถูกอ่านในเครื่องของท่านเท่านั้น ไม่อัปโหลดและไม่ส่งข้อความไปที่ใด</b> ใช้ได้กับ PDF ที่เลือกข้อความได้ (ไม่ใช่ภาพสแกน) ไม่เกิน 50 MB ค่าที่ได้เป็นข้อเสนอจากเอกสาร ท่านควรตรวจก่อนใช้ ไม่ใช่การประเมินความเสี่ยงหรือความพร้อม',
    map: { name: { to: 'name' }, students: { to: 'students', type: 'number' }, staff: { to: 'staff', type: 'number' }, fiscalYear: { to: 'year', type: 'number' }, province: { to: 'province' } } });
  UIP.bind();
  const UI3 = RS_TOOL3.create({ S, D, E, esc, fmt, LOGO, go: (id) => go(id), render: (k) => render(k) }, UI.h);
  UI3.bind();
  const RENDER = Object.assign({ home: pageHome, bank: pageBank, risk: pageRisk, rules: pageRules, about: pageAbout }, UI.pages, UI2.pages, UI3.pages);
  let cur = 'home';
  function chip() {
    const c = $('#fill-chip'); if (!c) return;
    const f = filled(); c.textContent = 'กรอกแล้ว ' + f.pct + '%'; c.className = 'chip' + (f.pct === 100 ? ' ok' : '');
  }
  function buildNav() {
    const p = PAGES.find((x) => x.id === cur);
    $('#nav').innerHTML = NAV.map((n) => '<a href="#' + n.id + '" data-go="' + n.id + '"' + (p.nav === n.id ? ' aria-current="page"' : '') + '>' + n.label + '</a>').join('');
  }
  function buildFoot() {
    $('#site-foot').innerHTML = '<div class="wrap"><div class="fcols"><div><div class="logo">' + LOGO + '<span>Risk Safe</span></div><p>ต้นแบบงานวิจัยดุษฎีนิพนธ์ สาขาวิชานวัตกรรมการบริหารการศึกษา มหาวิทยาลัยสยาม ระบบสนับสนุนการเลือกกลยุทธ์การบริหารความปลอดภัยของโรงเรียนมัธยมศึกษาบนฐานความเสี่ยงและความพร้อม</p></div>' +
      '<div><h4>เมนู</h4>' + NAV.map((n) => '<a href="#' + n.id + '" data-go="' + n.id + '">' + n.label + '</a>').join('') + '<a href="#rules" data-go="rules">กฎและเกณฑ์</a></div>' +
      '<div><h4>หมายเหตุ</h4><p>ไม่ใช่เว็บไซต์ทางการของ สพฐ. หรือหน่วยงานใด ข้อมูลตัวอย่างเป็นโรงเรียนสมมติ และเครื่องมือประเมินไม่เก็บหรือส่งข้อมูลที่ผู้ใช้กรอก (ระบบรวบรวมข้อมูลสถานศึกษาส่งข้อมูลถึงผู้วิจัยเฉพาะเมื่อผู้วิจัยเปิดใช้และผู้ตอบกดส่งเอง)</p><a href="https://github.com/sarawut2206/risk-safe" rel="noopener">ซอร์สโค้ดบน GitHub</a></div></div>' +
      '<div class="fbot"><span>ต้นแบบ V0.3 · ปี 2569 · ผลลัพธ์เป็นข้อเสนอสนับสนุนการวางแผน ไม่แทนดุลยพินิจของผู้อำนวยการ</span><span>เหตุฉุกเฉิน โทร 191 · 1669 · 199</span></div></div>';
  }
  function render(keepScroll) {
    const p = PAGES.find((x) => x.id === cur);
    document.title = cur === 'home' ? 'Risk Safe ระบบบริหารความปลอดภัยบนฐานความเสี่ยง (ต้นแบบ)' : p.title + ' · Risk Safe ต้นแบบ';
    if (cur === 'home') $('#view').innerHTML = RENDER.home();
    else if (PORTAL.indexOf(cur) >= 0) $('#view').innerHTML = RENDER[cur]();
    else if (TOOL.indexOf(cur) >= 0 && cur !== 'rules') $('#view').innerHTML = UI.shell(cur, RENDER[cur]());
    else $('#view').innerHTML = '<section class="phero hexbg"><div class="wrap"><span class="eyebrow">' + esc(p.eyebrow) + '</span><h1>' + esc(p.title) + '</h1><p>' + esc(p.sub) + '</p></div></section><div class="wrap body">' + RENDER[cur]() + '</div>';
    document.body.classList.toggle('pb-on', cur === 'planbook');
    document.body.classList.toggle('pd-on', cur === 'plandoc');
    document.body.classList.toggle('tool-on', (TOOL.indexOf(cur) >= 0 && cur !== 'rules') || PORTAL.indexOf(cur) >= 0);
    buildNav(); buildFoot(); chip(); UI2.persist();
    if (!keepScroll) window.scrollTo({ top: 0 });
  }
  function go(id) {
    if (id === 'input') id = 'dash';
    if (!RENDER[id]) id = 'home';
    cur = id; try { history.replaceState(null, '', '#' + id); } catch (e) { /* ไม่เป็นไร */ }
    const nav = $('#nav'); if (nav) nav.classList.remove('open'); const b = $('#burger'); if (b) b.setAttribute('aria-expanded', 'false');
    render();
  }
  function loadExample() {
    S.risk = JSON.parse(JSON.stringify(D.example.risk)); S.seven = JSON.parse(JSON.stringify(D.example.seven)); S.resource = D.example.resource;
    S.school = { name: 'โรงเรียนตัวอย่าง (สมมติ)', students: '532', staff: '32', year: '2569', province: '' };
  }
  function csv() {
    const out = getOut(), rows = [['ด้าน', 'กลุ่ม R', 'ความเสี่ยง', 'ความพร้อม', 'ลำดับ', 'รหัส', 'มาตรการ', '7-S', 'ประเภท 3 ป.', 'ทรัพยากร', 'ผู้รับผิดชอบ', 'ตัวชี้วัด', 'เริ่มดำเนินการ', 'รอบทบทวน', 'สถานะ', 'ระดับหลักฐาน', 'เหตุผลการเลือก']];
    out.domains.forEach((d) => d.measures.forEach((m) => rows.push([d.code + ' ' + d.name, d.group, d.risk, d.ready, m.order, cd(m), m.name, elName(m.elem), m.type3, m.res, m.owner, m.kpi, d.pkg.start, d.pkg.review, S.status[mKey(d.code, m.id)] || STATUS[0], m.evg || '', m.why])));
    const text = '﻿' + rows.map((r) => r.map((c) => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); a.download = 'r2safe-action-plan-sample.csv'; document.body.append(a); a.click(); a.remove();
  }

  // ---------- เหตุการณ์ ----------
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, [data-go]'); if (!t) return;
    if (t.id === 'burger') { const n = $('#nav'); const o = n.classList.toggle('open'); t.setAttribute('aria-expanded', String(o)); return; }
    if (t.dataset.go) { e.preventDefault(); go(t.dataset.go); return; }
    if (t.matches('.pills button')) {
      const k = t.dataset.kind, id = t.dataset.id, i = +t.dataset.idx, v = +t.dataset.val;
      const st = S[k]; st[id] = st[id] || [null, null]; st[id][i] = st[id][i] === v ? null : v;
      t.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(st[id][i] === +b.dataset.val)));
      chip();
      // อัปเดตตัวนับบนแท็บและขั้นตอน โดยไม่วาดหน้าใหม่ (เพื่อไม่ให้เลื่อนหน้า)
      const sc = window.scrollY; const keep = document.activeElement; render(true); window.scrollTo({ top: sc });
      const again = document.querySelector('.pills button[data-kind="' + k + '"][data-id="' + id + '"][data-idx="' + i + '"][data-val="' + v + '"]'); if (again) again.focus(); else if (keep && keep.focus) keep.focus();
      return;
    }
    const a = t.dataset.act; if (!a) return;
    if (a === 'example') { loadExample(); go('dash'); }
    else if (a === 'step') { S.ui.step = +t.dataset.step; render(); }
    else if (a === 'tab-risk') { S.ui.riskDom = t.dataset.code; render(true); }
    else if (a === 'tab-sev') { S.ui.sevEl = t.dataset.code; render(true); }
    else if (a === 'tab-strat') { S.ui.stratDom = t.dataset.code; render(true); }
    else if (a === 'strat') { S.ui.stratDom = t.dataset.dom; go('strategy'); }
    else if (a === 'plandoc') { S.ui.planDoc = t.dataset.k || 'all'; go('plandoc'); }
    else if (a === 'clear') {
      const has = S.track.snaps.length || Object.keys(S.track.logs).length || S.track.custom.length;
      if (has && !window.confirm('ล้างข้อมูลทั้งหมดรวมถึงบันทึกติดตามผลและรอบประเมินที่บันทึกไว้ใช่หรือไม่ (ดาวน์โหลดแฟ้มงานไว้ก่อนได้ที่หน้า "ติดตามผล")')) return;
      S.risk = {}; S.seven = {}; S.status = {}; S.moe = {}; S.aar = ''; S.docs = []; S.track.logs = {}; S.track.snaps = []; S.track.custom = []; render(true);
    }
    else if (a === 'rtab') { S.ui.rtab = t.dataset.tab; render(true); }
    else if (a === 'csv') csv();
    else if (a === 'reload-bank') loadRemoteBank();
    else if (a === 'params-reset') { S.params = Object.assign({}, E.DEFAULT_PARAMS); render(true); }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'res-level') S.resource = t.value;
    else if (t.dataset.st) S.status[t.dataset.st] = t.value, render(true);
    else if (t.dataset.moe) { S.moe[t.dataset.moe] = t.value; render(true); }
    else if (t.dataset.param) { const v = parseFloat(t.value); if (isFinite(v)) { S.params[t.dataset.param] = v; render(true); } }
    else if (t.id === 'f-dom') { S.ui.bank.dom = t.value; $('#bank-wrap').innerHTML = bankTable(); }
    else if (t.id === 'f-el') { S.ui.bank.el = t.value; $('#bank-wrap').innerHTML = bankTable(); }
    else if (t.id === 'f-t3') { S.ui.bank.t3 = t.value; $('#bank-wrap').innerHTML = bankTable(); }
    else if (t.id === 'f-res') { S.ui.bank.res = t.value; $('#bank-wrap').innerHTML = bankTable(); }
    else if (t.id === 'f-ev') { S.ui.bank.ev = t.value; $('#bank-wrap').innerHTML = bankTable(); }
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'f-q') { S.ui.bank.q = t.value; $('#bank-wrap').innerHTML = bankTable(); }
    else if (t.id === 'aar') S.aar = t.value;
  });
  // อ่านรหัสโรงเรียนและผู้ตอบจากลิงก์ (#form1?s=S001&r=R2) แล้วล้างพารามิเตอร์ออกจากแถบที่อยู่
  function parseHash() { const raw = location.hash.replace('#', ''), i = raw.indexOf('?'), q = {}; if (i >= 0) raw.slice(i + 1).split('&').forEach((kv) => { const p = kv.split('='); if (p[0]) { try { q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); } catch (e) { /* ข้าม */ } } }); return { id: i < 0 ? raw : raw.slice(0, i), q }; }
  window.addEventListener('hashchange', () => { const ph = parseHash(); UI3.applyQuery(ph.q); if (ph.id && (ph.id !== cur || Object.keys(ph.q).length)) go(ph.id); });

  const ph0 = parseHash(); UI3.applyQuery(ph0.q);
  if (ph0.q.example === '1') loadExample();   // ลิงก์ตัวอย่างสำหรับแสดงให้ผู้อื่นดู เช่น #planbook?example=1
  const h0 = ph0.id;
  cur = RENDER[h0] ? h0 : (h0 === 'input' ? 'dash' : 'home'); render();
  if (Object.keys(ph0.q).length) { try { history.replaceState(null, '', '#' + cur); } catch (e) { /* ไม่เป็นไร */ } }
  loadRemoteBank();
})();
