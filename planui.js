/* Risk Safe (R²-SAFE): หน้าจออ่านข้อมูลจากแผนปฏิบัติการ (PDF) ในหน้า "ข้อมูลโรงเรียนและเอกสาร"
   ไฟล์ PDF ถูกอ่านในเบราว์เซอร์ของผู้ใช้ด้วยโปรแกรมอ่าน PDF (pdf.js) ที่อยู่ในเว็บนี้ ไม่อัปโหลดไฟล์ ไม่ส่งข้อความหรือผลที่อ่านไปที่ใด
   ผลที่อ่านเป็นข้อเสนอ ผู้ใช้ตรวจ แก้ และเลือกก่อนนำไปกรอก ตรรกะการอ่านอยู่ที่ planread.js */
(function (root) {
  'use strict';
  const PR = root.RS_PLAN;
  const MAXMB = 50, MAXPAGES = 400, PDFJS = 'vendor/pdfjs/pdf.min.js?v=3.11.174', WORKER = 'vendor/pdfjs/pdf.worker.min.js?v=3.11.174';
  // ช่องที่นำไปกรอกในหน้าข้อมูลโรงเรียนได้ (key ของผลที่อ่าน -> ช่องใน S.school)
  const APPLY = { name: 'name', students: 'students', staff: 'staff', fiscalYear: 'year', province: 'province' };
  const CONF = { high: ['ok', 'มั่นใจสูง'], medium: ['warn', 'ตรวจอีกครั้ง'], low: ['warn', 'เดา ต้องตรวจ'] };
  let inst = null;

  function create(c, h) {
    const { S, esc } = c, ic = h.ic, fmt = (n) => Number(n).toLocaleString('en-US');
    S.plan = S.plan || { busy: false, msg: '', file: '', res: null, edit: {}, sel: {}, psel: {}, applied: '' };
    const P = S.plan;
    const clean = () => { P.busy = false; P.msg = ''; P.file = ''; P.res = null; P.edit = {}; P.sel = {}; P.psel = {}; P.applied = ''; };

    function loadPdfJs() {
      return new Promise((resolve, reject) => {
        if (root.pdfjsLib) { resolve(root.pdfjsLib); return; }
        const s = document.createElement('script'); s.src = PDFJS;
        s.onload = () => { try { root.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER; resolve(root.pdfjsLib); } catch (e) { reject(e); } };
        s.onerror = () => reject(new Error('โหลดโปรแกรมอ่าน PDF ไม่ได้ ตรวจว่าเปิดเว็บผ่านที่อยู่เว็บ (ไม่ใช่เปิดไฟล์โดยตรง) และเชื่อมต่ออินเทอร์เน็ตแล้ว'));
        document.head.appendChild(s);
      });
    }
    const setProg = (t) => { const e = document.getElementById('plan-prog'); if (e) e.textContent = t; };

    async function readFile(f) {
      clean();
      if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') { P.msg = '"' + f.name + '" ไม่ใช่ไฟล์ PDF'; c.render(true); return; }
      if (f.size > MAXMB * 1048576) { P.msg = 'ไฟล์ใหญ่เกิน ' + MAXMB + ' MB'; c.render(true); return; }
      P.busy = true; P.file = f.name.slice(0, 120); c.render(true);
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
        Object.keys(APPLY).forEach((k) => { if (res.fields[k] != null) { P.edit[k] = String(res.fields[k]); P.sel[k] = k !== 'fiscalYear'; } });
        res.projects.forEach((p, i) => { P.psel[i] = !p.soft && p.amount != null; });
        P.msg = res.empty ? 'ไฟล์นี้แทบไม่มีข้อความให้อ่าน (น่าจะเป็นภาพสแกน) ต้องกรอกเอง หรือแปลงเป็น PDF ที่เลือกข้อความได้ก่อน' : '';
      } catch (e) {
        P.busy = false; P.res = null;
        P.msg = (e && e.name === 'PasswordException') ? 'ไฟล์มีรหัสผ่าน อ่านไม่ได้' : 'อ่านไฟล์ไม่สำเร็จ: ' + ((e && e.message) || 'ไม่ทราบสาเหตุ');
      }
      c.render(true);
    }

    const total = () => (P.res ? P.res.projects.reduce((s, p, i) => s + (P.psel[i] && p.amount ? p.amount : 0), 0) : 0);

    function evRow(e) {
      const ap = APPLY[e.key], cf = CONF[e.conf] || CONF.medium;
      const val = ap ? '<input type="' + (e.key === 'students' || e.key === 'staff' || e.key === 'fiscalYear' ? 'number' : 'text') + '" data-pv="' + e.key + '" value="' + esc(P.edit[e.key] != null ? P.edit[e.key] : e.value) + '" maxlength="80" aria-label="' + esc(e.label) + '">' : '<b>' + esc(e.value) + '</b>';
      return '<div class="plrow"><label class="plck">' + (ap ? '<input type="checkbox" data-psel="' + e.key + '"' + (P.sel[e.key] ? ' checked' : '') + ' aria-label="ใช้ค่า' + esc(e.label) + '">' : '<span class="plno" title="ข้อมูลประกอบ ไม่ได้กรอกลงฟอร์ม">–</span>') + '</label>' +
        '<div class="plmain"><small>' + esc(e.label) + (ap ? '' : ' (ข้อมูลประกอบ)') + '</small>' + val + '<span class="chip ' + cf[0] + '">' + cf[1] + '</span></div>' +
        '<div class="plsrc"><span>หน้า ' + e.page + '</span><em>' + esc(e.snippet) + '</em>' + (e.note ? '<small>' + esc(e.note) + '</small>' : '') + '</div></div>';
    }

    function projectsHtml(res) {
      if (!res.projects.length) return '<p class="muted">ไม่พบโครงการที่ชื่อเกี่ยวกับความปลอดภัยหรือสุขภาวะในตารางแผนงาน (ตารางอาจใช้รูปแบบอื่น)</p>';
      const doms = ['V', 'A', 'P', 'H'].filter((d) => res.projects.some((p) => p.dom === d));
      const t = total();
      return '<p class="hint">เลือกจากชื่อโครงการด้วยคำสำคัญเท่านั้น (ไม่ใช่การประเมิน) ติ๊กออกรายการที่ไม่เกี่ยว รายการที่เป็นเบี้ยประกันหรือค่าตรวจสุขภาพที่มักมาจากเงินผู้ปกครองไม่ถูกติ๊กไว้ให้ ยอดเงินอ่านจากช่องแรกที่พบตัวเลขในแถวนั้น ตรวจกับตารางต้นฉบับ</p>' +
        doms.map((d) => '<h4 class="pldom">' + esc(PR.DOM_NAME[d]) + '</h4>' + res.projects.map((p, i) => [p, i]).filter((x) => x[0].dom === d).map((x) => {
          const p = x[0], i = x[1];
          return '<label class="plpr"><input type="checkbox" data-ppsel="' + i + '"' + (P.psel[i] ? ' checked' : '') + (p.amount == null ? ' disabled' : '') + '><span><b>' + esc(p.code) + '</b> ' + esc(p.title) + (p.soft ? ' <span class="chip warn">มักเป็นเงินผู้ปกครอง</span>' : '') + '<small>หน้า ' + p.page + ' · ' + (p.amount != null ? fmt(p.amount) + ' บาท' : 'ไม่พบตัวเลขงบในแถวนี้') + '</small></span></label>';
        }).join('')).join('') +
        '<p class="pltot" id="pl-tot">รวมที่เลือก <b>' + fmt(t) + '</b> บาท · ช่วงงบตามแบบสอบถามของระบบรวบรวมข้อมูล: <b>' + esc(PR.budgetBand(t)) + '</b></p>';
    }

    function hintsHtml(res) {
      return '<ul class="plhint">' + res.hints.map((x) => '<li class="' + (x.found ? 'f' : 'n') + '">' + ic(x.found ? 'check' : 'info', 18) + '<span><b>' + esc(x.id + ' ' + x.label) + '</b><small>' + esc(x.note) + '</small></span></li>').join('') + '</ul>' +
        '<p class="hint">พบหรือไม่พบคำในแผนไม่ได้แปลว่าโรงเรียนมีหรือไม่มีเอกสารนั้น ใช้เป็นข้อสังเกตเท่านั้น</p>' +
        '<p class="hint">หัวข้อของแผนที่เป็นหลักฐานประกอบแต่ละองค์ประกอบ 7-S: ' + res.sevenEvidence.map((e) => '<span class="chip ' + (e.found ? 'ok' : 'warn') + '">' + esc(e.name) + (e.found ? ' พบ' : ' ไม่พบ') + '</span>').join(' ') + '</p>';
    }

    function card() {
      let s = '<p class="hint">เลือกไฟล์แผนปฏิบัติการประจำปีของโรงเรียน ระบบจะอ่านชื่อโรงเรียน จำนวนนักเรียน ครูและบุคลากร จังหวัด และโครงการที่เกี่ยวกับความปลอดภัย แล้วให้ท่านตรวจก่อนนำไปกรอก <b>ไฟล์ถูกอ่านในเครื่องของท่านเท่านั้น ไม่อัปโหลดและไม่ส่งข้อความไปที่ใด</b> ใช้ได้กับ PDF ที่เลือกข้อความได้ (ไม่ใช่ภาพสแกน) ไม่เกิน ' + MAXMB + ' MB ผลที่อ่านเป็นข้อเสนอ ไม่ใช่การประเมินความเสี่ยงหรือความพร้อม</p>' +
        '<div class="row-btns"><button class="tbtn primary" data-act="plan-pick"' + (P.busy ? ' disabled' : '') + '>' + ic('upload', 22) + '<span>เลือกไฟล์แผนปฏิบัติการ (PDF)</span></button>' + (P.res || P.msg ? '<button class="tbtn" data-act="plan-clear">ล้างผลที่อ่าน</button>' : '') + '</div>' +
        '<input type="file" id="plan-file" accept="application/pdf,.pdf" hidden>';
      if (P.busy) s += '<p class="plbusy" role="status"><span class="spin"></span><span id="plan-prog">กำลังเตรียมอ่าน ' + esc(P.file) + '</span></p>';
      if (P.msg) s += '<p class="warn-note" role="status">' + esc(P.msg) + '</p>';
      const res = P.res;
      if (res && !res.empty) {
        s += '<p class="plfile">' + ic('doc', 18) + '<span>' + esc(P.file) + ' · ' + res.totalPages + ' หน้า' + (res.truncated ? ' (อ่านเฉพาะ ' + res.pages + ' หน้าแรก)' : '') + '</span></p>';
        s += '<h3 class="plh">ข้อมูลที่อ่านได้ (ตรวจและแก้ได้ก่อนใช้)</h3>' + (res.evidence.length ? '<div class="pltab">' + res.evidence.map(evRow).join('') + '</div>' : '<p class="muted">ไม่พบข้อมูลพื้นฐานที่รู้จักในไฟล์นี้</p>');
        if (res.missing.length) s += '<p class="warn-note">ไม่พบ: ' + res.missing.map((k) => ({ name: 'ชื่อโรงเรียน', students: 'จำนวนนักเรียน', staff: 'จำนวนครูและบุคลากร', province: 'จังหวัด', fiscalYear: 'ปีงบประมาณ' }[k])).join(', ') + ' ต้องกรอกเอง</p>';
        s += '<div class="row-btns"><button class="tbtn primary" data-act="plan-apply">' + ic('check', 22) + '<span>นำค่าที่ติ๊กไปกรอกในแบบฟอร์ม</span></button></div>';
        if (P.applied) s += '<p class="xok" role="status">' + ic('check', 18) + ' ' + esc(P.applied) + '</p>';
        s += '<details class="xd" open><summary>โครงการที่เกี่ยวกับความปลอดภัยและสุขภาวะในแผน (' + res.projects.length + ' รายการ)</summary>' + projectsHtml(res) + '</details>';
        s += '<details class="xd"><summary>ข้อสังเกตจากเนื้อหาแผน (เอกสารความปลอดภัย D1–D5 และหัวข้อ 7-S)</summary>' + hintsHtml(res) + '</details>';
      }
      return h.card('อ่านข้อมูลจากแผนปฏิบัติการ (PDF) อัตโนมัติ', s, { icon: 'upload', cls: 'green' });
    }

    function apply() {
      let n = 0;
      Object.keys(APPLY).forEach((k) => { if (P.sel[k] && P.edit[k] != null && String(P.edit[k]).trim() !== '') { S.school[APPLY[k]] = String(P.edit[k]).trim(); n++; } });
      P.applied = n ? 'นำไปกรอกแล้ว ' + n + ' ช่อง ตรวจที่ช่องด้านบนได้ (ข้อมูลที่ไม่ได้ติ๊กไม่ถูกเปลี่ยน)' : 'ยังไม่ได้ติ๊กช่องใดให้นำไปกรอก';
      c.render(true);
    }

    function bind() {
      document.addEventListener('click', (e) => {
        const t = e.target.closest('button'); if (!t || !t.dataset.act) return;
        if (t.dataset.act === 'plan-pick') { const f = document.getElementById('plan-file'); if (f) f.click(); }
        else if (t.dataset.act === 'plan-clear') { clean(); c.render(true); }
        else if (t.dataset.act === 'plan-apply') apply();
      });
      document.addEventListener('change', (e) => {
        const t = e.target; if (!t || !t.id && !t.dataset) return;
        if (t.id === 'plan-file') { const f = t.files && t.files[0]; t.value = ''; if (f) readFile(f); return; }
        if (t.dataset.psel) { P.sel[t.dataset.psel] = t.checked; return; }
        if (t.dataset.ppsel != null && t.dataset.ppsel !== '') { P.psel[t.dataset.ppsel] = t.checked; const tt = document.getElementById('pl-tot'); if (tt && P.res) { const tot = total(); tt.innerHTML = 'รวมที่เลือก <b>' + fmt(tot) + '</b> บาท · ช่วงงบตามแบบสอบถามของระบบรวบรวมข้อมูล: <b>' + esc(PR.budgetBand(tot)) + '</b>'; } }
      });
      document.addEventListener('input', (e) => { const t = e.target; if (t && t.dataset && t.dataset.pv) { P.edit[t.dataset.pv] = t.value; P.sel[t.dataset.pv] = true; const ck = document.querySelector('[data-psel="' + t.dataset.pv + '"]'); if (ck) ck.checked = true; } });
    }

    inst = { card, bind, apply, state: P };
    return inst;
  }

  root.RS_PLANUI = { create, card: () => (inst ? inst.card() : '') };
})(typeof window !== 'undefined' ? window : this);
