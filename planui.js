/* Risk Safe (R²-SAFE): หน้าจออ่านข้อมูลจากแผนปฏิบัติการ (PDF) ใช้ 2 ที่ ได้แก่ หน้า "ข้อมูลโรงเรียนและเอกสาร" ของเครื่องมือประเมิน
   และตอนที่ 1 ของแบบสอบถามในระบบรวบรวมข้อมูล (แต่ละที่กำหนดช่องปลายทางผ่าน cfg)
   ไฟล์ PDF ถูกอ่านในเบราว์เซอร์ของผู้ใช้ด้วยโปรแกรมอ่าน PDF (pdf.js) ที่อยู่ในเว็บนี้ ไม่อัปโหลดไฟล์ ไม่ส่งข้อความหรือผลที่อ่านไปที่ใด
   ผลที่อ่านเป็นข้อเสนอ ผู้ใช้ตรวจ แก้ และเลือกก่อนนำไปกรอก ตรรกะการอ่านอยู่ที่ planread.js */
(function (root) {
  'use strict';
  const PR = root.RS_PLAN;
  const MAXMB = 50, MAXPAGES = 400, PDFJS = 'vendor/pdfjs/pdf.min.js?v=3.11.174', WORKER = 'vendor/pdfjs/pdf.worker.min.js?v=3.11.174';
  const CONF = { high: ['ok', 'มั่นใจสูง'], medium: ['warn', 'ตรวจอีกครั้ง'], low: ['warn', 'เดา ต้องตรวจ'] };
  const fmt = (n) => Number(n).toLocaleString('en-US');
  const insts = {};

  // cfg: { id, state, title, intro, map: { คีย์ผลที่อ่าน: { to, type?, options?, init?(e), on? } }, budgetTo?, set(to, value), done(), esc, ic, card, render() }
  function create(cfg) {
    const { esc, ic } = cfg, P = cfg.state, MAP = cfg.map, id = cfg.id;
    if (P.busy === undefined) Object.assign(P, { busy: false, msg: '', file: '', res: null, edit: {}, sel: {}, psel: {}, bud: false, applied: '' });
    const clean = () => { P.busy = false; P.msg = ''; P.file = ''; P.res = null; P.edit = {}; P.sel = {}; P.psel = {}; P.bud = false; P.applied = ''; };

    function loadPdfJs() {
      return new Promise((resolve, reject) => {
        if (root.pdfjsLib) { resolve(root.pdfjsLib); return; }
        const s = document.createElement('script'); s.src = PDFJS;
        s.onload = () => { try { root.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER; resolve(root.pdfjsLib); } catch (e) { reject(e); } };
        s.onerror = () => reject(new Error('โหลดโปรแกรมอ่าน PDF ไม่ได้ ตรวจว่าเปิดเว็บผ่านที่อยู่เว็บ (ไม่ใช่เปิดไฟล์โดยตรง) และเชื่อมต่ออินเทอร์เน็ตแล้ว'));
        document.head.appendChild(s);
      });
    }
    const setProg = (t) => { const e = document.getElementById('plan-prog-' + id); if (e) e.textContent = t; };

    async function readFile(f) {
      clean();
      if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') { P.msg = '"' + f.name + '" ไม่ใช่ไฟล์ PDF'; cfg.render(); return; }
      if (f.size > MAXMB * 1048576) { P.msg = 'ไฟล์ใหญ่เกิน ' + MAXMB + ' MB'; cfg.render(); return; }
      P.busy = true; P.file = f.name.slice(0, 120); cfg.render();
      try {
        const lib = await loadPdfJs();
        const doc = await lib.getDocument({ data: new Uint8Array(await f.arrayBuffer()), verbosity: 0 }).promise;
        const n = Math.min(doc.numPages, MAXPAGES), pages = [];
        for (let i = 1; i <= n; i++) {
          setProg('กำลังอ่านหน้า ' + i + ' จาก ' + n);
          const pg = await doc.getPage(i), tc = await pg.getTextContent();
          pages.push({ n: i, lines: PR.linesFromItems(tc.items) });
          if (i % 8 === 0) await new Promise((r) => setTimeout(r, 0));
        }
        const res = PR.parse(pages); res.totalPages = doc.numPages; res.truncated = doc.numPages > n;
        P.res = res; P.busy = false;
        res.evidence.forEach((e) => { const m = MAP[e.key]; if (!m) return; P.edit[e.key] = m.init ? m.init(e) : String(e.value); P.sel[e.key] = m.on !== false && P.edit[e.key] !== ''; });
        res.projects.forEach((p, i) => { P.psel[i] = !p.soft && p.amount != null; });
        if (cfg.auto && !res.empty) { apply(true); if (cfg.record) cfg.record(f); }
        P.msg = res.empty ? 'ไฟล์นี้แทบไม่มีข้อความให้อ่าน (น่าจะเป็นภาพสแกน) ต้องกรอกเอง หรือแปลงเป็น PDF ที่เลือกข้อความได้ก่อน' : '';
      } catch (e) {
        P.busy = false; P.res = null;
        P.msg = (e && e.name === 'PasswordException') ? 'ไฟล์มีรหัสผ่าน อ่านไม่ได้' : 'อ่านไฟล์ไม่สำเร็จ: ' + ((e && e.message) || 'ไม่ทราบสาเหตุ');
      }
      cfg.render();
    }

    const total = () => (P.res ? P.res.projects.reduce((s, p, i) => s + (P.psel[i] && p.amount ? p.amount : 0), 0) : 0);
    const totHtml = () => 'รวมที่เลือก <b>' + fmt(total()) + '</b> บาท · ช่วงงบตามแบบสอบถามของระบบรวบรวมข้อมูล: <b>' + esc(PR.budgetBand(total())) + '</b>';

    function control(e, m) {
      const v = P.edit[e.key] != null ? P.edit[e.key] : e.value;
      if (m.options) return '<select data-pv="' + e.key + '" data-pi="' + id + '" aria-label="' + esc(e.label) + '"><option value="">เลือก</option>' + m.options.map((o) => '<option value="' + esc(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>';
      return '<input type="' + (m.type || 'text') + '" data-pv="' + e.key + '" data-pi="' + id + '" value="' + esc(v) + '" maxlength="80" aria-label="' + esc(e.label) + '">';
    }
    function evRow(e) {
      const m = MAP[e.key], cf = CONF[e.conf] || CONF.medium;
      return '<div class="plrow"><label class="plck">' + (m ? '<input type="checkbox" data-psel="' + e.key + '" data-pi="' + id + '"' + (P.sel[e.key] ? ' checked' : '') + ' aria-label="ใช้ค่า' + esc(e.label) + '">' : '<span class="plno" title="ข้อมูลประกอบ ไม่ได้กรอกลงฟอร์ม">–</span>') + '</label>' +
        '<div class="plmain"><small>' + esc(e.label) + (m ? '' : ' (ข้อมูลประกอบ)') + '</small>' + (m ? control(e, m) : '<b>' + esc(e.value) + '</b>') + '<span class="chip ' + cf[0] + '">' + cf[1] + '</span></div>' +
        '<div class="plsrc"><span>หน้า ' + e.page + '</span><em>' + esc(e.snippet) + '</em>' + (e.note ? '<small>' + esc(e.note) + '</small>' : '') + '</div></div>';
    }

    function projectsHtml(res) {
      if (!res.projects.length) return '<p class="muted">ไม่พบโครงการที่ชื่อเกี่ยวกับความปลอดภัยหรือสุขภาวะในตารางแผนงาน (ตารางอาจใช้รูปแบบอื่น)</p>';
      const doms = ['V', 'A', 'P', 'H'].filter((d) => res.projects.some((p) => p.dom === d));
      return '<p class="hint">เลือกจากชื่อโครงการด้วยคำสำคัญเท่านั้น (ไม่ใช่การประเมิน) ติ๊กออกรายการที่ไม่เกี่ยว รายการที่เป็นเบี้ยประกันหรือค่าตรวจสุขภาพที่มักมาจากเงินผู้ปกครองไม่ถูกติ๊กไว้ให้ ยอดเงินอ่านจากช่องแรกที่พบตัวเลขในแถวนั้น ตรวจกับตารางต้นฉบับ</p>' +
        doms.map((d) => '<h4 class="pldom">' + esc(PR.DOM_NAME[d]) + '</h4>' + res.projects.map((p, i) => [p, i]).filter((x) => x[0].dom === d).map((x) => {
          const p = x[0], i = x[1];
          return '<label class="plpr"><input type="checkbox" data-ppsel="' + i + '" data-pi="' + id + '"' + (P.psel[i] ? ' checked' : '') + (p.amount == null ? ' disabled' : '') + '><span><b>' + esc(p.code) + '</b> ' + esc(p.title) + (p.soft ? ' <span class="chip warn">มักเป็นเงินผู้ปกครอง</span>' : '') + '<small>หน้า ' + p.page + ' · ' + (p.amount != null ? fmt(p.amount) + ' บาท' : 'ไม่พบตัวเลขงบในแถวนี้') + '</small></span></label>';
        }).join('')).join('') +
        '<p class="pltot" id="pl-tot-' + id + '">' + totHtml() + '</p>' +
        (cfg.budgetTo ? '<label class="plpr plbud"><input type="checkbox" data-pbud="1" data-pi="' + id + '"' + (P.bud ? ' checked' : '') + '><span>นำช่วงงบที่คำนวณได้ไปกรอกในช่อง "ช่วงงบประมาณด้านความปลอดภัยต่อปี" <small>ผู้ตอบควรตรวจว่ายอดนี้ตรงกับงบด้านความปลอดภัยของโรงเรียนจริงหรือไม่ ก่อนติ๊ก</small></span></label>' : '');
    }

    function hintsHtml(res) {
      return '<ul class="plhint">' + res.hints.map((x) => '<li class="' + (x.found ? 'f' : 'n') + '">' + ic(x.found ? 'check' : 'info', 18) + '<span><b>' + esc(x.id + ' ' + x.label) + '</b><small>' + esc(x.note) + '</small></span></li>').join('') + '</ul>' +
        '<p class="hint">พบหรือไม่พบคำในแผนไม่ได้แปลว่าโรงเรียนมีหรือไม่มีเอกสารนั้น ใช้เป็นข้อสังเกตเท่านั้น</p>' +
        '<p class="hint">หัวข้อของแผนที่เป็นหลักฐานประกอบแต่ละองค์ประกอบ 7-S: ' + res.sevenEvidence.map((e) => '<span class="chip ' + (e.found ? 'ok' : 'warn') + '">' + esc(e.name) + (e.found ? ' พบ' : ' ไม่พบ') + '</span>').join(' ') + '</p>';
    }

    function pickRow() {
      return '<div class="row-btns"><button class="tbtn primary' + (cfg.auto ? ' plbig' : '') + '" data-act="plan-pick" data-pi="' + id + '"' + (P.busy ? ' disabled' : '') + '>' + ic('upload', 24) + '<span>' + (cfg.auto ? 'อัปโหลดแผนปฏิบัติการ (PDF)' : 'เลือกไฟล์แผนปฏิบัติการ (PDF)') + '</span></button>' + (P.res || P.msg ? '<button class="tbtn" data-act="plan-clear" data-pi="' + id + '">ล้างผลที่อ่าน</button>' : '') + '</div>' +
        '<input type="file" id="plan-file-' + id + '" data-pi="' + id + '" accept="application/pdf,.pdf" hidden>';
    }
    function statusHtml() {
      return (P.busy ? '<p class="plbusy" role="status"><span class="spin"></span><span id="plan-prog-' + id + '">กำลังเตรียมอ่าน ' + esc(P.file) + '</span></p>' : '') + (P.msg ? '<p class="warn-note" role="status">' + esc(P.msg) + '</p>' : '');
    }
    function reviewHtml(res) {
      let s = '<p class="plfile">' + ic('doc', 18) + '<span>' + esc(P.file) + ' · ' + res.totalPages + ' หน้า' + (res.truncated ? ' (อ่านเฉพาะ ' + res.pages + ' หน้าแรก)' : '') + '</span></p>';
      s += '<h3 class="plh">ข้อมูลที่อ่านได้ (ตรวจและแก้ได้ก่อนใช้)</h3>' + (res.evidence.length ? '<div class="pltab">' + res.evidence.filter((e) => (cfg.hide || []).indexOf(e.key) < 0).map(evRow).join('') + '</div>' : '<p class="muted">ไม่พบข้อมูลพื้นฐานที่รู้จักในไฟล์นี้</p>');
      const names = { name: 'ชื่อโรงเรียน', students: 'จำนวนนักเรียน', staff: 'จำนวนครูและบุคลากร', province: 'จังหวัด', fiscalYear: 'ปีงบประมาณ' };
      const miss = res.missing.filter((k) => cfg.missingKeys.indexOf(k) >= 0);
      if (miss.length) s += '<p class="warn-note">ไม่พบ: ' + miss.map((k) => names[k]).join(', ') + ' ต้องกรอกเอง</p>';
      s += '<div class="row-btns"><button class="tbtn primary" data-act="plan-apply" data-pi="' + id + '">' + ic('check', 22) + '<span>' + (cfg.auto ? 'นำค่าที่แก้หรือติ๊กไปกรอกใหม่' : 'นำค่าที่ติ๊กไปกรอกในแบบฟอร์ม') + '</span></button></div>';
      if (P.applied && !cfg.auto) s += '<p class="xok" role="status">' + ic('check', 18) + ' ' + esc(P.applied) + '</p>';
      s += '<details class="xd" open><summary>โครงการที่เกี่ยวกับความปลอดภัยและสุขภาวะในแผน (' + res.projects.length + ' รายการ)</summary>' + projectsHtml(res) + '</details>';
      s += '<details class="xd"><summary>ข้อสังเกตจากเนื้อหาแผน (เอกสารความปลอดภัย D1–D5 และหัวข้อ 7-S)</summary>' + hintsHtml(res) + '</details>';
      return s;
    }
    function summaryHtml(res) {
      const n = (P.filled || []).length;
      return '<p class="xok" role="status">' + ic('check', 18) + ' อ่าน "' + esc(P.file) + '" (' + res.totalPages + ' หน้า) แล้ว กรอกให้อัตโนมัติ ' + n + ' ช่อง' + (n ? '' : ' (ไม่พบค่าที่รู้จัก)') + '</p>' +
        (n ? '<ul class="plfilled">' + P.filled.map((x) => '<li><span>' + esc(x.label) + '</span><b>' + esc(x.value) + '</b></li>').join('') + '</ul>' : '') +
        (P.checks && P.checks.length ? '<p class="hint"><b>ข้อควรตรวจ</b></p><ul class="plchk">' + P.checks.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
        '<p class="hint">เพิ่มไฟล์นี้ในรายการเอกสารด้านล่างแล้ว ค่าที่กรอกให้แก้ได้ที่ช่องด้านล่างโดยตรง <button class="lnk" data-act="plan-scroll" data-pi="' + id + '">ดูที่มาของแต่ละค่า โครงการด้านความปลอดภัย และข้อสังเกตจากแผน</button></p>';
    }
    function card() {
      let s = '<p class="hint">' + cfg.intro + '</p>' + pickRow() + statusHtml();
      const res = P.res;
      if (res && !res.empty) s += cfg.auto ? summaryHtml(res) : reviewHtml(res);
      return cfg.card(cfg.title, s, { icon: 'upload', cls: 'green' });
    }
    function detail() {
      const res = P.res; if (!cfg.auto || !res || res.empty) return '';
      return cfg.card('ที่มาของค่าที่อ่านได้และโครงการด้านความปลอดภัย', '<span id="plan-detail-' + id + '"></span>' + reviewHtml(res), { icon: 'doc' });
    }

    function apply(silent) {
      let n = 0; const bad = []; P.filled = []; P.checks = [];
      Object.keys(MAP).forEach((k) => {
        if (!P.sel[k]) return; const v = String(P.edit[k] == null ? '' : P.edit[k]).trim(); if (v === '') return;
        const m = MAP[k], label = (P.res && P.res.evidence.find((e) => e.key === k) || {}).label || k;
        if (m.check && !m.check(v)) { bad.push(label); return; }
        cfg.set(m.to, v); n++;
        const ev = P.res && P.res.evidence.find((e) => e.key === k);
        P.filled.push({ label: label, value: /^\d+$/.test(v) && k !== 'fiscalYear' ? fmt(v) : v });
        if (ev && ev.note) P.checks.push(label + ': ' + ev.note);
      });
      if (cfg.budgetTo && P.bud) { cfg.set(cfg.budgetTo, PR.budgetBand(total())); n++; }
      P.applied = (n ? (silent ? 'กรอกให้อัตโนมัติ ' : 'นำไปกรอกแล้ว ') + n + ' ช่อง ตรวจที่ช่องด้านบนได้ (ข้อมูลที่ไม่ได้ติ๊กไม่ถูกเปลี่ยน)' : 'ยังไม่ได้ติ๊กช่องใดให้นำไปกรอก') + (bad.length ? ' · กรอกไม่ได้เพราะค่าไม่ถูกต้อง: ' + bad.join(', ') : '');
      if (!silent) cfg.done();
    }

    function bind() {
      const mine = (t) => t && t.dataset && t.dataset.pi === id;
      document.addEventListener('click', (e) => {
        const t = e.target.closest('button'); if (!mine(t) || !t.dataset.act) return;
        if (t.dataset.act === 'plan-pick') { const f = document.getElementById('plan-file-' + id); if (f) f.click(); }
        else if (t.dataset.act === 'plan-clear') { clean(); cfg.render(); }
        else if (t.dataset.act === 'plan-apply') apply();
        else if (t.dataset.act === 'plan-scroll') { const d = document.getElementById('plan-detail-' + id); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
      document.addEventListener('change', (e) => {
        const t = e.target; if (!mine(t)) return;
        if (t.type === 'file') { const f = t.files && t.files[0]; t.value = ''; if (f) readFile(f); return; }
        if (t.dataset.psel) { P.sel[t.dataset.psel] = t.checked; return; }
        if (t.dataset.pbud) { P.bud = t.checked; return; }
        if (t.dataset.pv && t.tagName === 'SELECT') { P.edit[t.dataset.pv] = t.value; P.sel[t.dataset.pv] = t.value !== ''; const ck = document.querySelector('[data-psel="' + t.dataset.pv + '"][data-pi="' + id + '"]'); if (ck) ck.checked = t.value !== ''; return; }
        if (t.dataset.ppsel != null && t.dataset.ppsel !== '') { P.psel[t.dataset.ppsel] = t.checked; const tt = document.getElementById('pl-tot-' + id); if (tt && P.res) tt.innerHTML = totHtml(); }
      });
      document.addEventListener('input', (e) => { const t = e.target; if (mine(t) && t.dataset.pv && t.tagName === 'INPUT') { P.edit[t.dataset.pv] = t.value; P.sel[t.dataset.pv] = true; const ck = document.querySelector('[data-psel="' + t.dataset.pv + '"][data-pi="' + id + '"]'); if (ck) ck.checked = true; } });
    }

    const inst = { card, detail, bind, apply, state: P };
    insts[id] = inst;
    return inst;
  }

  root.RS_PLANUI = { create, card: (id) => (insts[id || 'tool'] ? insts[id || 'tool'].card() : ''), detail: (id) => (insts[id || 'tool'] ? insts[id || 'tool'].detail() : ''), inst: (id) => insts[id] };
})(typeof window !== 'undefined' ? window : this);
