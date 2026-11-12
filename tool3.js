/* Risk Safe (R²-SAFE): หน้าจอระบบรวบรวมข้อมูลสถานศึกษา (School Data Collection Portal) และแดชบอร์ดผู้วิจัย
   portal = หน้าแรก · form1 = แบบสอบถามความเสี่ยงและความพร้อม · form2 = แบบบันทึกจำนวนเหตุการณ์ · form3 = แบบตรวจเอกสารนโยบาย · collectlab = แดชบอร์ดผู้วิจัย
   ค่าเริ่มต้นเป็นโหมดทดลอง (demo) ไม่ส่งข้อมูลไปที่ใด จะส่งข้อมูลได้เฉพาะเมื่อผู้วิจัยตั้งค่า collectMode และ collectUrl ใน config.js และผู้ตอบกดส่งเอง */
(function (root) {
  'use strict';
  const C = root.RS_COLLECT, ST = root.RS_STATS, Dc = root.RS_DECISION, PR = root.RS_PLANREC, ACT = root.RS_ACTPLAN;

  function create(c, h) {
    const { S, D, E, esc, getOut } = c;
    const { ic, banner, card, HZ, hasData } = h;
    const LS_PREFIX = 'r2safe-collect-v1';
    const cfg = () => root.RS_CONFIG || {};
    const mode = () => (['demo', 'tryout', 'live'].indexOf(cfg().collectMode) >= 0 ? cfg().collectMode : 'demo');
    const endpoint = () => String(cfg().collectUrl || '');
    const win = () => C.collectWindow(cfg().collectOpen, cfg().collectClose, new Date());
    const blocked = () => mode() === 'live' && ['before', 'closed'].indexOf(win().state) >= 0;
    const blockWhy = () => { const w = win(); return w.state === 'before' ? 'ยังไม่ถึงวันเปิดเก็บข้อมูล (เปิด ' + C.thaiDate(w.open) + ')' : 'ปิดเก็บข้อมูลแล้วเมื่อ ' + C.thaiDate(w.close); };
    const n2 = (x, d) => (typeof x === 'number' && isFinite(x) ? x.toFixed(d == null ? 2 : d) : '–');
    const pct = (x) => (typeof x === 'number' && isFinite(x) ? Math.round(x * 100) + '%' : '–');
    const chip = (t, cls) => '<span class="xchip ' + (cls || '') + '">' + t + '</span>';
    const roleName = (r) => (C.ROLES.find((x) => x[0] === r) || [, ''])[1];
    const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
    const setPath = (o, p, v) => { const k = p.split('.'); let a = o; for (let i = 0; i < k.length - 1; i++) { if (a[k[i]] == null || typeof a[k[i]] !== 'object') a[k[i]] = {}; a = a[k[i]]; } a[k[k.length - 1]] = v; };
    function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json;charset=utf-8' })); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }

    // ---------- สถานะและฉบับร่าง (เก็บในเบราว์เซอร์นี้เมื่อผู้ใช้เปิดหน้าฟอร์ม ไม่ส่งออก) ----------
    const K = S.collect;                                   // { code, pin, role, drafts:{}, storeOk:true, msg:'' }
    try { const last = JSON.parse(localStorage.getItem(LS_PREFIX + '|last') || 'null'); if (last && !K.code) { K.code = String(last.code || '').slice(0, 16); if (!K.role) K.role = last.role || ''; } } catch (e) { /* ไม่มี */ }
    const rememberLast = () => { try { if (K.code) localStorage.setItem(LS_PREFIX + '|last', JSON.stringify({ code: K.code, role: K.role })); } catch (e) { /* ไม่เป็นไร */ } };
    const codeOk = () => C.codeOk(K.code);
    const keyOf = (form, resp) => [LS_PREFIX, K.code.toUpperCase(), form, form === 'questionnaire' ? (resp || K.role || '-') : (form === 'planreport' ? (resp || '-') : '-')].join('|');
    function loadDraft(form, resp) {
      const key = keyOf(form, resp);
      if (K.drafts[key]) return K.drafts[key];
      let d = null;
      try { const t = localStorage.getItem(key); if (t) d = JSON.parse(t); } catch (e) { K.storeOk = false; }
      if (!d || !d.answers) d = { answers: C.blank[form](), consent: { accepted: false, at: null }, startedAt: null, submitted: null, downloaded: null };
      K.drafts[key] = d; return d;
    }
    let saveT = null;
    function persist(form, resp) {
      const key = keyOf(form, resp), d = K.drafts[key]; if (!d) return;
      clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(key, JSON.stringify(d)); } catch (e) { K.storeOk = false; } }, 350);
    }
    const statusOf = (form, resp) => {
      if (!codeOk()) return { t: 'ยังไม่ได้ใส่รหัสโรงเรียน', cls: '', pct: 0 };
      const key = keyOf(form, resp); let d = K.drafts[key];
      if (!d) { try { const t = localStorage.getItem(key); if (t) d = JSON.parse(t); } catch (e) { /* ไม่มี */ } }
      if (!d) return { t: 'ยังไม่เริ่ม', cls: '', pct: 0 };
      if (d.submitted) return { t: 'ส่งแล้ว (' + d.submitted.receipt + ')', cls: 'ok', pct: 100 };
      const p = C.progressOf(form, d.answers, D).pct || 0;
      return { t: d.downloaded ? 'บันทึกเป็นไฟล์แล้ว ' + p + '%' : (p === 100 ? 'กรอกครบแล้ว ยังไม่ได้ส่ง' : (p ? 'กำลังกรอก ' + p + '%' : 'ยังไม่เริ่ม')), cls: p === 100 ? 'teal' : (p ? 'warn' : ''), pct: p };
      /* หมายเหตุ: ข้อความสถานะด้านบนปรับตามความครบถ้วนแล้ว */
    };

    // ---------- ส่วนประกอบร่วม ----------
    function modeBanner() {
      const m = mode();
      const t = { demo: ['xwarn', 'โหมดทดลองกรอก: ข้อมูลที่กรอกใช้ดูการทำงานของแบบฟอร์มเท่านั้น ไม่ถูกส่งไปที่ใดและไม่ถูกนำไปวิจัย ระบบยังไม่เปิดเก็บข้อมูลจริง (ต้องผ่านการรับรองจริยธรรม การตรวจ IOC และการทดลองใช้กับผู้ให้ข้อมูล 30 คนก่อน)'],
        tryout: ['xwarn', 'โหมดทดลองใช้ (try-out): ใช้กับผู้ให้ข้อมูล 30 คนจากโรงเรียนนอกกลุ่มตัวอย่างเพื่อตรวจคุณภาพเครื่องมือ ข้อมูลไม่ถูกนับเป็นข้อมูลวิจัยหลัก'],
        live: blocked() ? ['xwarn', 'ระบบยังไม่รับข้อมูลวิจัยตอนนี้: ' + blockWhy() + ' ท่านดาวน์โหลดไฟล์คำตอบเก็บไว้ได้ และติดต่อผู้วิจัยหากต้องการส่งภายหลัง'] : ['xok', 'ระบบเปิดเก็บข้อมูลวิจัย' + (win().state === 'open' ? ' ถึงวันที่ ' + C.thaiDate(win().close) + ' (' + (win().daysLeft > 0 ? 'เหลืออีก ' + win().daysLeft + ' วัน' : 'ปิดวันนี้') + ')' : '') + ': ข้อมูลจะถูกส่งถึงผู้วิจัยเมื่อท่านกดปุ่มส่งเท่านั้น']}[m];
      return '<p class="' + t[0] + ' cpmode">' + ic(m === 'live' ? 'check' : 'alert', 18) + ' ' + t[1] + '</p>';
    }
    function head(cur) {
      const tabs = [['portal', 'หน้าแรก'], ['form1', '1 แบบสอบถาม'], ['form2', '2 เหตุการณ์'], ['form3', '3 เอกสารนโยบาย'], ['planrec', '4 ผลการใช้แผน']];
      return '<div class="thead cph"><div class="tbrand">' + (c.LOGO || '') + '<div><b>R<sup>2</sup>-SAFE</b><span>ระบบรวบรวมข้อมูลสถานศึกษา · School Data Collection Portal</span></div></div></div>' +
        '<nav class="cpnav" aria-label="แบบฟอร์ม">' + tabs.map((t) => '<button data-go="' + t[0] + '"' + (t[0] === cur ? ' aria-current="page"' : '') + '>' + t[1] + '</button>').join('') + '</nav>' +
        (codeOk() ? '<p class="cpwho">' + ic('building', 16) + ' รหัสโรงเรียน <b>' + esc(K.code.toUpperCase()) + '</b>' + (cur === 'form1' && K.role ? ' · ผู้ตอบ <b>' + esc(roleName(K.role)) + '</b>' : '') + '</p>' : '');
    }
    const shell = (cur, inner) => '<div class="tapp cpapp">' + head(cur) + '<div class="tbody">' + modeBanner() + inner + '</div><p class="tnote">ระบบนี้เก็บเฉพาะข้อมูลระดับโรงเรียนและคำตอบของผู้ปฏิบัติงาน ไม่เก็บข้อมูลส่วนบุคคลของนักเรียน ไม่ต้องใส่ชื่อบุคคลหรือชื่อโรงเรียน ใช้เฉพาะรหัสที่ผู้วิจัยแจ้ง</p></div>';
    const needCode = (what) => card('ใส่รหัสโรงเรียนก่อน', '<p class="lead">ก่อนเปิด' + what + ' ให้ใส่รหัสโรงเรียนที่ผู้วิจัยแจ้งในหน้าแรก (ไม่ต้องใส่ชื่อโรงเรียน)</p><div class="row-btns"><button class="tbtn primary" data-go="portal"><span>ไปหน้าแรก</span>' + ic('chev', 18) + '</button></div>', { icon: 'info' });
    const CONSENT = '<p class="hint">งานวิจัยนี้ศึกษาการบริหารความปลอดภัยสถานศึกษา เพื่อพัฒนาระบบช่วยตัดสินใจเลือกกลยุทธ์ การเข้าร่วมเป็นไปโดยสมัครใจ ท่านถอนตัวได้ทุกเมื่อโดยไม่มีผลต่อท่านหรือโรงเรียน ข้อมูลรายงานเป็นภาพรวมหรือรายกลุ่ม ใช้รหัสแทนชื่อโรงเรียนและผู้ตอบ ไม่ต้องกรอกชื่อบุคคลหรือรายละเอียดเหตุการณ์ และหากข้อความปลายเปิดมีข้อมูลที่ระบุตัวบุคคลได้ ผู้วิจัยจะลบก่อนวิเคราะห์ ข้อมูลที่กรอกถูกเก็บร่างไว้ในเบราว์เซอร์เครื่องนี้ ไม่ส่งออกจนกว่าท่านกดส่งหรือดาวน์โหลดไฟล์เอง ข้อความชี้แจงฉบับเต็มและเลขที่รับรองจริยธรรมจะระบุก่อนเปิดเก็บข้อมูลจริง [ระบุ]</p>';
    function consentCard(d) {
      return card('ความยินยอมเข้าร่วมวิจัย', CONSENT + '<label class="xck big"><input type="checkbox" data-cset="consent.accepted" ' + (d.consent.accepted ? 'checked' : '') + '> ข้าพเจ้าอ่านข้อความชี้แจงแล้ว สมัครใจเข้าร่วม และยินยอมให้ใช้คำตอบนี้ในงานวิจัย</label>', { icon: 'shieldcheck', cls: d.consent.accepted ? 'green' : 'amber' });
    }
    const chips = (path, vals, cur, labels) => '<div class="xchips cpc" role="radiogroup">' + vals.map((v, i) => '<button type="button" role="radio" aria-checked="' + (String(cur) === String(v)) + '" data-act="cch" data-path="' + path + '" data-v="' + esc(v) + '"><b>' + esc(labels ? labels[i] : v) + '</b></button>').join('') + '</div>';
    const sel = (path, opts, cur, ph) => '<select data-cset="' + path + '"><option value="">' + (ph || 'เลือก') + '</option>' + opts.map((o) => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(v) + '"' + (cur === v ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>';
    const fld = (label, inner, hint) => '<div class="cpf"><span>' + label + '</span>' + inner + (hint ? '<small>' + hint + '</small>' : '') + '</div>';
    const num = (path, cur, ph) => '<input type="text" inputmode="numeric" data-cset="' + path + '" value="' + esc(cur == null ? '' : cur) + '" placeholder="' + (ph || '') + '" maxlength="6">';
    function actions(form, d, complete, resp) {
      const m = mode(), canSend = !!endpoint() && m !== 'demo' && !blocked();
      const r = d.submitted;
      return card('ส่งข้อมูล', (r ? '<p class="xok">' + ic('check', 18) + ' ส่งถึงผู้วิจัยแล้วเมื่อ ' + new Date(r.at).toLocaleString('th-TH') + ' รหัสรับ <b>' + esc(r.receipt) + '</b> (เก็บรหัสนี้ไว้อ้างอิง)</p>' : '') +
        '<div class="row-btns two"><button class="tbtn" data-act="cdl" data-form="' + form + '"' + (d.consent.accepted ? '' : ' disabled') + '>' + ic('download', 22) + '<span>ดาวน์โหลดไฟล์คำตอบ</span></button><button class="tbtn primary" data-act="csend" data-form="' + form + '"' + (complete && d.consent.accepted && canSend ? '' : ' disabled') + '>' + ic('upload', 22) + '<span>ส่งถึงผู้วิจัย</span></button></div>' +
        '<p class="hint">' + (m === 'demo' ? 'โหมดทดลองไม่เปิดการส่ง ' : (blocked() ? blockWhy() + ' จึงส่งตรงไม่ได้ ' : (!endpoint() ? 'ผู้วิจัยยังไม่ได้ตั้งที่อยู่รับข้อมูล จึงส่งตรงไม่ได้ ' : ''))) + 'ถ้าส่งตรงไม่ได้ ให้ดาวน์โหลดไฟล์คำตอบแล้วส่งให้ผู้วิจัยตามช่องทางที่แจ้ง ปุ่มส่งจะใช้ได้เมื่อกรอกครบและยืนยันความยินยอมแล้ว</p><p class="warn-note" id="csend-msg" role="status">' + esc(K.msg || '') + '</p><p><button class="tbtn sm" onclick="window.print()">' + ic('print', 18) + '<span>พิมพ์แบบฟอร์ม (สำรองกรณีไม่สะดวกกรอกออนไลน์)</span></button> <button class="tbtn sm" data-act="cclear" data-form="' + form + '">' + ic('trash', 18) + '<span>ล้างร่างของแบบนี้ในเครื่องนี้</span></button></p>', { icon: 'upload' });
    }
    const barInner = (p) => '<div class="cpprog"><b>ความคืบหน้า ' + p.pct + '%</b><span>' + p.done + ' จาก ' + p.total + ' ช่อง</span></div><div class="pbar"><i style="width:' + p.pct + '%"></i></div>';
    const progressBar = (p) => '<div class="tcard cpstick" id="cpbar">' + barInner(p) + '</div>';
    // การ์ด "ตรวจก่อนส่ง" ของแต่ละแบบ (แยกฟังก์ชันเพื่ออัปเดตทันทีขณะพิมพ์โดยไม่วาดหน้าใหม่)
    function buildCheck(form, d) {
      if (form === 'questionnaire') { const pr = C.progressQ(d.answers, D); return card('ตรวจก่อนส่ง', pr.complete ? '<p class="xok">' + ic('check', 18) + ' กรอกครบทุกช่องแล้ว</p>' : '<p class="xwarn">' + ic('alert', 18) + ' ยังไม่ครบ: ตอนที่ 1 ' + pr.parts.p1.missing.length + ' ช่อง · ตอนที่ 2 ' + pr.parts.p2.missing.length + ' ช่อง · ตอนที่ 3 ' + pr.parts.p3.missing.length + ' ช่อง</p><p><button class="tbtn sm" data-act="cnext">' + ic('search', 18) + '<span>ไปที่ช่องแรกที่ยังไม่ได้กรอก</span></button></p>', { icon: 'check' }); }
      if (form === 'planreport') { const pr = PR.progress(d.answers); return card('ตรวจก่อนส่ง', pr.complete ? '<p class="xok">' + ic('check', 18) + ' กรอกครบทุกช่องแล้ว</p>' : '<p class="xwarn">' + ic('alert', 18) + ' ยังไม่ครบหรือไม่ถูกต้อง ' + pr.missing.length + ' ช่อง (ช่องที่ยังขาดมีกรอบสีเหลือง) ความคืบหน้า ' + pr.pct + '%</p><p><button class="tbtn sm" data-act="cnext">' + ic('chev', 16) + '<span>ไปช่องที่ยังขาด</span></button></p>', { icon: 'check' }); }
      const ck = form === 'incidents' ? C.checkIncidents(d.answers) : C.checkDocuments(d.answers);
      return card('ตรวจก่อนส่ง', ck.complete ? '<p class="xok">' + ic('check', 18) + ' กรอกครบแล้ว</p>' : '<p class="xwarn">' + ic('alert', 18) + ' ยังกรอกไม่ครบหรือไม่ถูกต้อง ' + ck.errors.length + ' ช่อง' + (form === 'incidents' ? ' (ตัวเลขจำนวนเต็มไม่ติดลบ)' : '') + '</p>', { icon: 'check' });
    }
    function updateLive() {
      const cd = S.ui.cdraft; if (!cd) return; const pr = C.progressOf(cd.form, cd.d.answers, D);
      const chk = document.getElementById('cpcheck'); if (chk) chk.innerHTML = buildCheck(cd.form, cd.d);
      const bar = document.getElementById('cpbar'); if (bar && cd.form === 'questionnaire') bar.innerHTML = barInner(pr);
      const send = document.querySelector('[data-act="csend"]'); if (send) send.disabled = !(pr.complete && cd.d.consent.accepted && endpoint() && mode() !== 'demo' && !blocked());
    }

    // ---------- หน้าแรก ----------
    function pagePortal() {
      const m = mode(), ok = codeOk();
      let s = banner('clipboard', 'ระบบรวบรวมข้อมูลสถานศึกษา', 'สำรวจความเสี่ยงและความพร้อมด้านความปลอดภัยของโรงเรียน (ระยะที่ 2 ของงานวิจัย R²-SAFE)');
      s += card('รหัสโรงเรียนของท่าน', '<p class="hint">ใส่รหัสโรงเรียนที่ผู้วิจัยแจ้ง (ตัวอักษรและตัวเลข เช่น S001) <b>ห้ามใส่ชื่อโรงเรียนหรือชื่อบุคคล</b> ถ้าระบบเปิดส่งตรง ผู้วิจัยอาจแจ้งรหัสผ่านของโรงเรียนด้วย</p><div class="xrow wrap"><label>รหัสโรงเรียน<input type="text" data-cset-top="code" value="' + esc(K.code) + '" maxlength="16" autocomplete="off" placeholder="เช่น S001"></label><label>รหัสผ่านโรงเรียน (ถ้ามี)<input type="password" data-cset-top="pin" value="' + esc(K.pin) + '" maxlength="20" autocomplete="off"></label></div>' + (K.code && !ok ? '<p class="xwarn">' + ic('alert', 18) + ' รหัสต้องเป็นตัวอักษรอังกฤษ ตัวเลข หรือขีด ความยาว 2–16 ตัว</p>' : '') + (K.storeOk === false ? '<p class="xwarn">' + ic('alert', 18) + ' เบราว์เซอร์นี้ไม่อนุญาตให้เก็บร่าง กรุณาดาวน์โหลดไฟล์ก่อนปิดหน้า</p>' : ''), { icon: 'building' });
      const stat = (form, resp) => { const t = statusOf(form, resp); return chip(esc(t.t), t.cls); };
      s += '<div class="cpforms">' +
        '<section class="tcard cpform"><span class="cpno">01</span><h2>แบบสอบถามความเสี่ยงและความพร้อม</h2><p class="hint">ผู้บริหารและครู 3 คน คนละ 1 ชุด ข้อมูลทั่วไป · ความเสี่ยง 4 ด้าน (L, C) · McKinsey 7-S (D, I) · ข้อเสนอแนะ ใช้เวลาประมาณ 30–40 นาที [ประมาณการ รอผลทดลองใช้]</p>' +
        '<ul class="cproles">' + C.ROLES.map((r) => '<li><span><b>' + r[0] + '</b> ' + esc(r[1]) + '</span>' + stat('questionnaire', r[0]) + '<button class="tbtn sm" data-act="copen" data-form="form1" data-role="' + r[0] + '"' + (ok ? '' : ' disabled') + '>เปิด</button></li>').join('') + '</ul></section>' +
        '<section class="tcard cpform"><span class="cpno">02</span><h2>บันทึกจำนวนเหตุการณ์</h2><p class="hint">ผู้ประสานงานโรงเรียน 1 ชุด จำนวนเหตุรวม 4 ด้านในปีการศึกษา ไม่ระบุชื่อและรายละเอียดคดี ถ้าไม่มีระบบบันทึกให้เลือก "ไม่มีระบบบันทึก"</p><p>' + stat('incidents') + '</p><button class="tbtn sm" data-act="copen" data-form="form2"' + (ok ? '' : ' disabled') + '>เปิดแบบฟอร์ม</button></section>' +
        '<section class="tcard cpform"><span class="cpno">03</span><h2>ตรวจสอบเอกสารนโยบาย</h2><p class="hint">ผู้ประสานงานโรงเรียน 1 ชุด แผนความปลอดภัย คำสั่งแต่งตั้ง ช่องทางแจ้งเหตุ แนวปฏิบัติ ระบบติดตาม อ้างอิงเอกสารจริงของโรงเรียน</p><p>' + stat('documents') + '</p><button class="tbtn sm" data-act="copen" data-form="form3"' + (ok ? '' : ' disabled') + '>เปิดแบบฟอร์ม</button></section></div>';
      s += card('04 บันทึกผลการนำแผนไปใช้', '<p class="hint">หลังนำแผนปฏิบัติการของแต่ละมาตรการไปใช้ กรอกผลที่ได้ ได้แก่ ขั้นตอนที่ทำจริง ผลตัวชี้วัด จำนวนผู้เข้าร่วม ทรัพยากรที่ใช้ ความสอดคล้องกับกลยุทธ์ ความพึงพอใจ และอุปสรรค ผู้วิจัยใช้ข้อมูลนี้ดูว่าแผนตอบสนองกลยุทธ์อย่างไร ไม่ต้องใส่ชื่อบุคคลหรือข้อมูลที่ระบุตัวนักเรียน</p><div class="row-btns"><button class="tbtn primary" data-go="planrec"' + (ok ? '' : ' disabled') + '>' + ic('clipboard', 22) + '<span>เปิดแบบบันทึกผลการนำแผนไปใช้</span></button><button class="tbtn" data-act="recform" data-k="all">' + ic('print', 22) + '<span>พิมพ์แบบบันทึกผลสำหรับจดระหว่างทำ</span></button></div>', { icon: 'clipboard' });
      s += card('สถานะการส่งของโรงเรียน', ok && endpoint() && m !== 'demo' ? '<p class="hint">ตรวจว่าระบบของผู้วิจัยได้รับข้อมูลของรหัสนี้แล้วกี่ชุด (ระบบตอบเฉพาะว่าได้รับหรือยัง ไม่ส่งคำตอบกลับ)</p><p><button class="tbtn sm" data-act="cstatus">' + ic('search', 18) + '<span>ตรวจสถานะจากระบบ</span></button></p><div id="cstatus-out">' + (K.remote ? remoteStatus(K.remote) : '') + '</div>' : '<p class="muted">สถานะที่แสดงในแต่ละแบบฟอร์มมาจากเครื่องนี้เท่านั้น (ร่างและไฟล์ที่ดาวน์โหลด) ' + (m === 'demo' ? 'โหมดทดลองไม่เชื่อมต่อระบบของผู้วิจัย' : (!endpoint() ? 'ผู้วิจัยยังไม่ได้ตั้งที่อยู่รับข้อมูล' : 'ใส่รหัสโรงเรียนก่อน')) + '</p>', { icon: 'flag' });
      s += card('ขั้นตอน', '<ol class="xo big"><li>ผู้ประสานงานของโรงเรียนใส่รหัสโรงเรียนที่ผู้วิจัยแจ้ง</li><li>ผู้ตอบ 3 คนเปิดลิงก์ของตนเอง (มีรหัสผู้ตอบ R1, R2, R3 ในลิงก์) กรอกแบบสอบถามคนละชุด แยกกัน ห้ามตอบแทนกันหรือปรึกษาก่อนตอบ</li><li>ผู้ประสานงานกรอกแบบบันทึกจำนวนเหตุการณ์และแบบตรวจเอกสารนโยบาย</li><li>ระบบเก็บร่างอัตโนมัติในเครื่อง ออกจากหน้าแล้วกลับมากรอกต่อได้ ตรวจช่องที่ยังไม่ได้กรอกได้ก่อนส่ง</li><li>กดส่งถึงผู้วิจัย หรือดาวน์โหลดไฟล์คำตอบแล้วส่งตามช่องทางที่ผู้วิจัยแจ้ง</li><li>ผู้วิจัยรวมข้อมูลเป็นระดับโรงเรียนเมื่อได้ผู้ตอบครบ 3 คน</li></ol>', { icon: 'calendar' });
      s += card('ความเป็นส่วนตัว', '<ul class="xl"><li>เก็บเฉพาะรหัสโรงเรียน รหัสผู้ตอบ (R1–R3) คะแนนและตัวเลขรวม ไม่เก็บชื่อบุคคล ชื่อโรงเรียน หรือข้อมูลของนักเรียน</li><li>ร่างที่กรอกอยู่ในเบราว์เซอร์เครื่องนี้ ไม่ส่งออกจนกว่าท่านกดส่งหรือดาวน์โหลดไฟล์ ควรใช้เครื่องของตนเอง ถ้าใช้เครื่องร่วมกันให้กด "ล้างร่าง" หลังส่ง</li><li>ช่องข้อความปลายเปิดห้ามใส่ชื่อบุคคลหรือรายละเอียดที่ระบุตัวได้</li><li>ผลประเมินของแต่ละโรงเรียนไม่เปิดเผยต่อสาธารณะ รายงานเป็นภาพรวมหรือรายกลุ่ม</li></ul>', { icon: 'shieldcheck' });
      return s;
    }
    const remoteStatus = (r) => (r.error ? '<p class="xwarn">' + ic('alert', 18) + ' ' + esc(r.error) + '</p>' : '<ul class="xl chk"><li><span>แบบสอบถาม R1 R2 R3: ได้รับ <b>' + r.questionnaire + '</b> จาก 3 ชุด</span></li><li><span>แบบบันทึกจำนวนเหตุการณ์: <b>' + (r.incidents ? 'ได้รับแล้ว' : 'ยังไม่ได้รับ') + '</b></span></li><li><span>แบบตรวจเอกสารนโยบาย: <b>' + (r.documents ? 'ได้รับแล้ว' : 'ยังไม่ได้รับ') + '</b></span></li></ul>');

    // ---------- แบบสอบถาม ----------
    const FIRST = { students: 'จำนวนนักเรียน', staff: 'จำนวนครูและบุคลากร', year: 'ปีการศึกษา', stratum: 'สังกัดพื้นที่', safetyOfficer: 'ผู้รับผิดชอบงานความปลอดภัย', counselor: 'ผู้ดูแลสุขภาพจิต/แนะแนว', budget: 'ช่วงงบประมาณ', resource: 'ระดับทรัพยากร' };
    function roleChooser() {
      return card('เลือกผู้ตอบ', '<p class="hint">เลือกตำแหน่งของท่าน แต่ละตำแหน่งตอบ 1 ชุด ลิงก์ที่ผู้วิจัยส่งให้จะระบุตำแหน่งไว้แล้ว</p><div class="cproles2">' + C.ROLES.map((r) => '<button class="tbtn' + (K.role === r[0] ? ' primary' : '') + '" data-act="crole" data-role="' + r[0] + '"><span><b>' + r[0] + '</b> ' + esc(r[1]) + '</span></button>').join('') + '</div>', { icon: 'people' });
    }
    function pageForm1() {
      let s = banner('clipboard', 'แบบสอบถามความเสี่ยงและความพร้อมของโรงเรียน', 'แบบที่ 1 · ใช้เวลาประมาณ 30–40 นาที [ประมาณการ รอผลทดลองใช้]');
      if (!codeOk()) return shell('form1', s + needCode('แบบสอบถาม'));
      if (!C.ROLES.some((r) => r[0] === K.role)) return shell('form1', s + roleChooser());
      const d = loadDraft('questionnaire', K.role); S.ui.cdraft = { form: 'questionnaire', resp: K.role, d };
      const a = d.answers, pr = C.progressQ(a, D), p1 = a.part1;
      s += consentCard(d);
      if (!d.consent.accepted) return shell('form1', s + '<p class="muted cppad">ยืนยันความยินยอมก่อนจึงจะเริ่มตอบได้</p>');
      s += progressBar(pr);
      const miss1 = pr.parts.p1.missing;
      const mk = (k) => (miss1.indexOf(k) >= 0 ? ' cpmiss' : '');
      s += PUI.card() + PUI.detail() + '<section id="q-p1">' + card('ตอนที่ 1 ข้อมูลทั่วไปและทรัพยากรที่มี', '<div class="cpgrid">' +
        '<div class="' + mk('students') + '">' + fld('จำนวนนักเรียนทั้งหมด (คน)', num('answers.part1.students', p1.students, 'เช่น 532')) + '</div>' +
        '<div class="' + mk('staff') + '">' + fld('จำนวนครูและบุคลากร (คน)', num('answers.part1.staff', p1.staff, 'เช่น 32')) + '</div>' +
        '<div class="' + mk('year') + '">' + fld('ปีการศึกษาที่ตอบ (พ.ศ.)', num('answers.part1.year', p1.year, '2569')) + '</div>' +
        '<div class="' + mk('stratum') + '">' + fld('สังกัดพื้นที่', sel('answers.part1.stratum', C.STRATA, p1.stratum)) + '</div>' +
        '<div class="' + mk('safetyOfficer') + '">' + fld('มีผู้รับผิดชอบงานความปลอดภัยโดยเฉพาะหรือไม่', chips('answers.part1.safetyOfficer', C.YESNO, p1.safetyOfficer)) + '</div>' +
        '<div class="' + mk('counselor') + '">' + fld('มีผู้ดูแลสุขภาพจิต/แนะแนวหรือไม่', chips('answers.part1.counselor', C.YESNO, p1.counselor)) + '</div>' +
        '<div class="' + mk('budget') + '">' + fld('ช่วงงบประมาณด้านความปลอดภัยต่อปี', sel('answers.part1.budget', C.BUDGET, p1.budget), 'ช่วงงบเป็นร่าง รอผู้เชี่ยวชาญตรวจ (IOC)') + '</div>' +
        '<div class="' + mk('resource') + '">' + fld('ทรัพยากรโดยรวมสำหรับงานความปลอดภัยของโรงเรียน', chips('answers.part1.resource', C.RESOURCE, p1.resource), 'จำกัด · ปานกลาง · เพียงพอ (บุคลากร งบประมาณ อุปกรณ์) ใช้จำกัดจำนวนมาตรการที่ระบบเสนอ') + '</div></div>', { icon: 'building' }) + '</section>';
      // ตอนที่ 2
      const anch = (arr) => '<ul class="cpleg">' + arr.map((x) => '<li><b>' + x[0] + '</b> ' + esc(x[1]) + '</li>').join('') + '</ul>';
      s += '<section id="q-p2">' + card('ตอนที่ 2 การประเมินความเสี่ยง 4 ด้านของภัย', '<p class="hint">ให้คะแนนทุกข้อ 2 ค่า: <b>L</b> ความถี่ในรอบปีการศึกษา และ <b>C</b> ความรุนแรงของผลกระทบหากเกิดเหตุ ตอบจากสิ่งที่เกิดหรือเห็นในโรงเรียนของท่าน ไม่ต้องระบุตัวบุคคลหรือรายละเอียดเหตุการณ์ เกณฑ์คะแนนเป็นร่าง รอผู้เชี่ยวชาญตรวจ</p><details class="xdet cpdet"><summary>ดูความหมายของคะแนน L และ C</summary><h4 class="xh4">L ความถี่</h4>' + anch(D.lAnchors) + '<h4 class="xh4">C ผลกระทบ</h4>' + anch(D.cAnchors) + '</details>', { icon: 'alert' });
      D.domains.forEach((dm) => {
        s += '<section class="tcard"><h2>' + ic(HZ[dm.code][1], 22) + ' ' + esc(dm.name) + '</h2>' + D.riskItems.filter((r) => r.dom === dm.code).map((it) => {
          const v = a.risk[it.id] || [], miss = pr.parts.p2.missing, missL = miss.indexOf(it.id + ':L') >= 0, missC = miss.indexOf(it.id + ':C') >= 0;
          return '<div class="cpq' + (missL || missC ? ' cpmiss' : '') + '" id="q-' + it.id + '"><p><span class="id">' + it.id + '</span> ' + esc(it.text) + (it.space ? ' <small>(' + esc(it.space) + ')</small>' : '') + '</p>' +
            '<div class="cprow"><b>L</b>' + chips('answers.risk.' + it.id + '.0', [1, 2, 3, 4, 5], v[0]) + (v[0] ? '<small>' + v[0] + ' = ' + esc((D.lAnchors[v[0] - 1] || [])[1] || '') + '</small>' : '') + '</div>' +
            '<div class="cprow"><b>C</b>' + chips('answers.risk.' + it.id + '.1', [1, 2, 3, 4, 5], v[1]) + (v[1] ? '<small>' + v[1] + ' = ' + esc((D.cAnchors[v[1] - 1] || [])[1] || '') + '</small>' : '') + '</div></div>';
        }).join('') + '</section>';
      });
      s += '</section>';
      // ตอนที่ 3
      s += '<section id="q-p3">' + card('ตอนที่ 3 ความพร้อมในการบริหารจัดการตามกรอบ 7-S', '<p class="hint">ทุกข้อให้คะแนน 2 ค่า: <b>D</b> สภาพปัจจุบันของโรงเรียน และ <b>I</b> สภาพที่ท่านเห็นว่าควรเป็น ตอบตามที่ปฏิบัติอยู่จริง ไม่ใช่ที่ตั้งใจจะทำ</p><details class="xdet cpdet"><summary>ดูความหมายของคะแนนระดับการปฏิบัติ</summary>' + anch(D.dAnchors) + '</details>', { icon: 'shieldcheck' });
      D.elements.forEach((el) => {
        s += '<section class="tcard"><h2>' + esc(el.name) + '</h2>' + D.sevenItems.filter((x) => x.elem === el.code).map((it) => {
          const v = a.seven[it.id] || [], miss = pr.parts.p3.missing, bad = miss.indexOf(it.id + ':D') >= 0 || miss.indexOf(it.id + ':I') >= 0;
          return '<div class="cpq' + (bad ? ' cpmiss' : '') + '" id="q-' + it.id + '"><p><span class="id">' + it.id + '</span> ' + esc(it.text) + '</p>' +
            '<div class="cprow"><b>D</b>' + chips('answers.seven.' + it.id + '.0', [1, 2, 3, 4, 5], v[0]) + (v[0] ? '<small>' + v[0] + ' = ' + esc((D.dAnchors[v[0] - 1] || [])[1] || '') + '</small>' : '') + '</div>' +
            '<div class="cprow"><b>I</b>' + chips('answers.seven.' + it.id + '.1', [1, 2, 3, 4, 5], v[1]) + '</div></div>';
        }).join('') + '</section>';
      });
      s += '</section>';
      const G1 = '<div class="cpguide"><b>แนวทางการตอบ</b> เขียน 1–3 ประโยค ให้ครอบคลุมเท่าที่ทราบ (ไม่ต้องครบทุกข้อ)<ul>' +
        '<li><b>ด้านของภัย</b> ระบุว่าเป็นด้านใด: ความรุนแรงของมนุษย์ · อุบัติเหตุและภัยพิบัติ · การละเมิดสิทธิ · สุขภาวะกายและจิตใจ</li>' +
        '<li><b>สภาพปัญหา</b> เป็นภาพรวม เช่น เกิดบ่อยหรือรุนแรงเพียงใด ไม่ระบุคนหรือเหตุการณ์ใดเหตุการณ์หนึ่ง</li>' +
        '<li><b>เหตุผล</b> ทำไมต้องพัฒนาก่อนเรื่องอื่น เช่น เสี่ยงสูง ยังไม่มีแนวปฏิบัติ ขาดบุคลากร งบประมาณ หรืออุปกรณ์</li>' +
        '<li><b>สิ่งที่ทำแล้วและสิ่งที่ยังขาด</b> (ถ้ามี)</li></ul>' +
        '<div class="ex"><b>ตัวอย่าง (สมมติ ไม่ใช่ข้อมูลจริง)</b> ด้านอุบัติเหตุและภัยพิบัติ: ซ้อมอพยพยังไม่ครบทุกอาคาร และยังไม่มีผู้รับแจ้งเหตุที่ชัดเจนในช่วงนอกเวลาเรียน อยากพัฒนาแนวปฏิบัติเมื่อเกิดเหตุและแผนซ้อมประจำปี</div></div>';
      const G2 = '<div class="cpguide"><b>แนวทางการตอบ</b> เขียนได้ เช่น<ul>' +
        '<li>สิ่งที่อยากให้ระบบนี้ช่วยโรงเรียน (มาตรการ ตัวอย่างแผน แบบฟอร์ม)</li>' +
        '<li>ข้อคำถามที่ไม่ชัดเจนหรือตอบยาก ให้ระบุรหัสข้อ เช่น V3 หรือ STG2</li>' +
        '<li>ข้อจำกัดของโรงเรียนที่ผู้วิจัยควรทราบ เช่น ขนาด บุคลากร งบประมาณ</li>' +
        '<li>ความเห็นเรื่องการใช้งานแบบสอบถาม เช่น ความยาว เวลาที่ใช้ การตอบบนมือถือ</li></ul>' +
        '<div class="ex"><b>ตัวอย่าง (สมมติ ไม่ใช่ข้อมูลจริง)</b> ข้อ STG2 ตีความยาก อยากให้มีตัวอย่างเอกสารที่นับว่ามี และอยากได้ตัวอย่างแผนเผชิญเหตุสำหรับโรงเรียนขนาดใหญ่</div></div>';
      s += card('ตอนที่ 4 ข้อเสนอแนะและปัญหาที่ต้องการพัฒนา (ไม่บังคับ)', '<p class="cpguide"><b>ตอนที่ 4 ไม่บังคับ</b> ไม่ส่งผลต่อการคำนวณกลุ่ม R1–R9 ผู้วิจัยใช้อ่านประกอบผลภาพรวมของโรงเรียน ตอบสั้น ๆ ไม่เกิน 600 ตัวอักษรต่อช่อง</p><p class="xwarn">' + ic('alert', 18) + ' ห้ามใส่ชื่อบุคคล ชื่อนักเรียน ชั้นหรือห้องที่ระบุตัวได้ วันที่หรือสถานที่เกิดเหตุ หรือรายละเอียดเหตุการณ์ที่ระบุตัวได้ ให้เขียนเป็นภาพรวมของโรงเรียน</p>' + fld('ปัญหาด้านความปลอดภัยที่โรงเรียนต้องการพัฒนามากที่สุด', G1 + '<textarea data-cset="answers.part4.need" maxlength="600" rows="5" placeholder="เขียนตามแนวทางด้านบน เช่น ด้านอุบัติเหตุและภัยพิบัติ: ...">' + esc(a.part4.need) + '</textarea>') + fld('ข้อเสนอแนะอื่น ๆ', G2 + '<textarea data-cset="answers.part4.suggest" maxlength="600" rows="4" placeholder="เช่น สิ่งที่อยากให้ระบบช่วย ข้อคำถามที่ตอบยาก (ระบุรหัสข้อ) หรือความเห็นเรื่องการใช้งาน">' + esc(a.part4.suggest) + '</textarea>'), { icon: 'doc' });
      s += '<div id="cpcheck">' + buildCheck('questionnaire', d) + '</div>';
      return shell('form1', s + actions('questionnaire', d, pr.complete, K.role));
    }

    // ---------- แบบบันทึกจำนวนเหตุการณ์ ----------
    function pageForm2() {
      let s = banner('alert', 'แบบบันทึกจำนวนเหตุการณ์ความไม่ปลอดภัย', 'แบบที่ 2 · ผู้ประสานงานโรงเรียน 1 ชุด · จำนวนรวมเท่านั้น');
      if (!codeOk()) return shell('form2', s + needCode('แบบบันทึกจำนวนเหตุการณ์'));
      const d = loadDraft('incidents'); S.ui.cdraft = { form: 'incidents', resp: '', d };
      const a = d.answers, ck = C.checkIncidents(a);
      s += consentCard(d);
      if (!d.consent.accepted) return shell('form2', s);
      const miss = (k) => (ck.errors.some((e) => e.split(':')[0] === k) ? ' cpmiss' : '');
      s += card('เหตุการณ์ในปีการศึกษา', '<p class="xwarn">' + ic('alert', 18) + ' ใช้จำนวนรวมของโรงเรียนเท่านั้น ไม่ต้องระบุชื่อนักเรียน ผู้เกี่ยวข้อง หรือรายละเอียดคดี ข้อมูลนี้ใช้ตรวจความสอดคล้องกับการรับรู้ในแบบสอบถาม ไม่ใช้ตัดสินระดับความเสี่ยง</p><div class="cpgrid"><div class="' + miss('year') + '">' + fld('ปีการศึกษาที่รายงาน (พ.ศ.)', num('answers.year', a.year, '2569')) + '</div></div>' +
        '<label class="xck big"><input type="checkbox" data-cset="answers.noSystem" data-rr="1"' + (a.noSystem ? ' checked' : '') + '> โรงเรียนไม่มีระบบบันทึกเหตุการณ์ (นับเป็นข้อมูลด้านความพร้อมของระบบด้วย)</label>' +
        '<div class="cpgrid">' + D.domains.map((dm) => '<div class="' + miss(dm.code) + '">' + fld('จำนวนเหตุ' + esc(HZ[dm.code][0]) + ' (ครั้ง)', a.noSystem ? '<input type="text" disabled placeholder="ไม่มีระบบบันทึก">' : num('answers.' + dm.code, a[dm.code], '0 ถ้าไม่มีเหตุ')) + '</div>').join('') + '</div>', { icon: 'alert' });
      return shell('form2', s + '<div id="cpcheck">' + buildCheck('incidents', d) + '</div>' + actions('incidents', d, ck.complete));
    }

    // ---------- แบบตรวจเอกสารนโยบาย ----------
    function pageForm3() {
      let s = banner('doc', 'แบบตรวจสอบเอกสารนโยบายและระบบความปลอดภัย', 'แบบที่ 3 · ผู้ประสานงานโรงเรียน 1 ชุด · อ้างอิงเอกสารจริงของโรงเรียน');
      if (!codeOk()) return shell('form3', s + needCode('แบบตรวจเอกสาร'));
      const d = loadDraft('documents'); S.ui.cdraft = { form: 'documents', resp: '', d };
      const a = d.answers, ck = C.checkDocuments(a);
      s += consentCard(d);
      if (!d.consent.accepted) return shell('form3', s);
      s += card('รายการเอกสารและระบบ', '<p class="hint">ตอบตามเอกสารที่โรงเรียนมีอยู่จริง ณ วันที่กรอก "กำลังจัดทำ" หมายถึงมีร่างหรือกำลังดำเนินการแต่ยังไม่ประกาศใช้ ไม่ต้องแนบไฟล์เอกสาร</p>' + C.DOCS.map((x) => '<div class="cpq' + (ck.errors.some((e) => e.split(':')[0] === x[0]) ? ' cpmiss' : '') + '"><p><span class="id">' + x[0] + '</span> ' + esc(x[1]) + '</p><div class="cprow">' + chips('answers.items.' + x[0], C.DOC_STATUS, (a.items || {})[x[0]]) + '</div><div class="cprow"><label class="cpyear">ปีที่จัดทำหรือปรับปรุงล่าสุด (พ.ศ. ถ้าทราบ)' + num('answers.years.' + x[0], (a.years || {})[x[0]], '2568') + '</label></div></div>').join(''), { icon: 'doc' });
      return shell('form3', s + '<div id="cpcheck">' + buildCheck('documents', d) + '</div>' + actions('documents', d, ck.complete));
    }

    // ---------- ส่ง / ดาวน์โหลด ----------
    function payloadOf(form) {
      const cd = S.ui.cdraft; if (!cd || cd.form !== form) return null;
      if (form === 'planreport') { const mt = cd.d.meta || {}; return PR.pack({ school: K.code, measure: cd.resp, domain: mt.domain, group: mt.group, plannedWeeks: mt.plannedWeeks, consent: cd.d.consent.accepted, consentAt: cd.d.consent.at, startedAt: cd.d.startedAt, mode: mode() }, JSON.parse(JSON.stringify(cd.d.answers))); }
      return C.pack(form, { school: K.code, respondent: cd.resp, consent: cd.d.consent.accepted, consentAt: cd.d.consent.at, startedAt: cd.d.startedAt, mode: mode() }, JSON.parse(JSON.stringify(cd.d.answers)));
    }
    async function doSend(form) {
      const p = payloadOf(form), v = C.validatePayload(p, D); if (!v.ok) { K.msg = 'ส่งไม่ได้: ' + v.why; return; }
      if (!endpoint() || mode() === 'demo') { K.msg = 'โหมดนี้ไม่เปิดการส่ง'; return; }
      if (blocked()) { K.msg = 'ส่งไม่ได้: ' + blockWhy() + ' (ดาวน์โหลดไฟล์แล้วติดต่อผู้วิจัยได้)'; return; }
      K.msg = 'กำลังส่ง...'; c.render(true);
      try {
        const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 20000);
        const r = await fetch(endpoint(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ pin: K.pin, payload: p }), signal: ctl.signal, redirect: 'follow' }); clearTimeout(tm);
        const j = await r.json();
        if (j && j.ok) { S.ui.cdraft.d.submitted = { receipt: j.receipt || p.receipt, at: new Date().toISOString() }; K.msg = 'ส่งสำเร็จ'; persist(S.ui.cdraft.form, S.ui.cdraft.resp); }
        else K.msg = 'ส่งไม่สำเร็จ: ' + ((j && j.error) || 'ระบบปฏิเสธข้อมูล') + ' (ดาวน์โหลดไฟล์แล้วส่งให้ผู้วิจัยแทนได้)';
      } catch (e) { K.msg = 'ส่งไม่สำเร็จ (เชื่อมต่อไม่ได้หรือหมดเวลา) ดาวน์โหลดไฟล์คำตอบแล้วส่งให้ผู้วิจัยแทนได้'; }
      c.render(true);
    }
    async function doStatus() {
      try { const r = await fetch(endpoint() + '?action=status&school=' + encodeURIComponent(K.code.toUpperCase()) + '&pin=' + encodeURIComponent(K.pin)); const j = await r.json(); K.remote = j && j.ok ? j : { error: (j && j.error) || 'ตรวจสถานะไม่ได้' }; }
      catch (e) { K.remote = { error: 'เชื่อมต่อระบบไม่ได้' }; }
      c.render(true);
    }


    // ====================================================================
    // แบบที่ 4: บันทึกผลการนำแผนรายมาตรการไปใช้ (planreport)
    // ====================================================================
    function recOptions() {
      const out = (getOut && hasData(getOut())) ? getOut() : null, seen = {}, inPlan = [];
      if (out) out.domains.forEach((dm) => dm.measures.forEach((m) => { if (m.sb && !seen[m.sb]) { seen[m.sb] = { d: dm, m }; inPlan.push(m.sb); } }));
      return { seen, inPlan };
    }
    const numw = (path, cur, ph, max) => '<input type="text" inputmode="numeric" data-cset="' + path + '" value="' + esc(cur == null ? '' : cur) + '" placeholder="' + (ph || '') + '" maxlength="' + (max || 6) + '">';
    const txt = (path, cur, ph, max) => '<input type="text" data-cset="' + path + '" value="' + esc(cur == null ? '' : cur) + '" placeholder="' + (ph || '') + '" maxlength="' + (max || 60) + '">';
    function pagePlanrec() {
      let s = banner('clipboard', 'บันทึกผลการนำแผนไปใช้', 'แบบที่ 4 · ผู้ปฏิบัติงานของโรงเรียน 1 ชุดต่อมาตรการ · ตัวเลขรวมและข้อความสั้นที่ไม่ระบุตัวบุคคล');
      if (!codeOk()) return shell('planrec', s + needCode('แบบบันทึกผลการนำแผนไปใช้'));
      const { seen, inPlan } = recOptions(), bankAll = D.bank.filter((b) => b.sb);
      let sb = S.ui.recSb && bankAll.some((b) => b.sb === S.ui.recSb) ? S.ui.recSb : (inPlan[0] || '');
      S.ui.recSb = sb;
      const opt = (b) => '<option value="' + esc(b.sb) + '"' + (b.sb === sb ? ' selected' : '') + '>' + esc(b.sb + ' ' + b.name) + '</option>';
      s += card('เลือกมาตรการที่โรงเรียนนำไปใช้', '<p class="hint">ตอบทีละมาตรการ ถ้านำแผนไปใช้หลายมาตรการ ให้กลับมาเลือกมาตรการถัดไป ฉบับร่างของแต่ละมาตรการเก็บแยกกันในเครื่องนี้</p><div class="cpf"><select data-cset-rec="sb" aria-label="เลือกมาตรการ"><option value="">เลือกมาตรการ</option>' +
        (inPlan.length ? '<optgroup label="มาตรการในแผนของท่าน (' + inPlan.length + ')">' + inPlan.map((id) => opt(seen[id].m)).join('') + '</optgroup>' : '') +
        '<optgroup label="มาตรการอื่นในคลัง">' + bankAll.filter((b) => !seen[b.sb]).map(opt).join('') + '</optgroup></select></div>' + (inPlan.length ? '' : '<p class="hint">ยังไม่ได้สร้างแผนในเครื่องนี้ จึงแสดงทุกมาตรการในคลังให้เลือก</p>'), { icon: 'target' });
      if (!sb) return shell('planrec', s);
      const m = D.bank.find((b) => b.sb === sb), row = seen[sb] || null, d0 = row ? row.d : null;
      const d = loadDraft('planreport', sb); S.ui.cdraft = { form: 'planreport', resp: sb, d };
      d.meta = { domain: d0 ? d0.code : (m.dom || ''), group: d0 && d0.group ? d0.group : '', plannedWeeks: ACT.TOTAL[m.res] || 8 };
      const a = d.answers, ck = PR.progress(a), miss = (k) => (ck.missing.some((e) => e === k || e.indexOf(k + '.') === 0) ? ' cpmiss' : '');
      const hz = d0 ? HZ[d0.code][0] : (HZ[m.dom] ? HZ[m.dom][0] : 'ทุกด้านร่วมกัน');
      s += card(esc(m.name), '<ul class="xl"><li>รหัส ' + esc(m.sb) + ' · ด้าน' + esc(hz) + (d0 && d0.group ? ' · กลุ่มแนวทาง ' + esc(d0.group) : '') + '</li><li>กลุ่มเป้าหมาย: ' + esc(m.target) + ' · ผู้รับผิดชอบ: ' + esc(m.owner) + '</li><li>ผลที่คาดหวัง: ' + esc(m.outcome) + '</li><li>ตัวชี้วัดของแผน: ' + esc(m.kpi) + '</li></ul>', { icon: 'doc' });
      s += consentCard(d);
      if (!d.consent.accepted) return shell('planrec', s);
      const steps = PR.stepsOf(m, { review: d0 ? d0.pkg.review : '', start: d0 ? d0.pkg.start : '' });
      s += card('1. ข้อมูลทั่วไป', '<div class="cpgrid"><div class="' + miss('year') + '">' + fld('ปีการศึกษาที่นำแผนไปใช้', numw('answers.year', a.year, '2569', 4)) + '</div><div class="' + miss('weeksActual') + '">' + fld('จำนวนสัปดาห์ที่ใช้จริง (นับจากเริ่มจนถึงวันที่กรอก)', numw('answers.weeksActual', a.weeksActual, '', 3), 'แผนกำหนดประมาณ ' + d.meta.plannedWeeks + ' สัปดาห์ ใส่ 0 ถ้ายังไม่ได้เริ่ม') + '</div></div><div class="' + miss('respRole') + '">' + fld('ผู้กรอกแบบนี้', chips('answers.respRole', PR.ROLES.map((r) => r[0]), a.respRole, PR.ROLES.map((r) => r[1]))) + '</div>', { icon: 'building' });
      s += card('2. ขั้นตอนที่ทำจริง (ตามแผน 6 ขั้น)', '<p class="hint">เลือกสถานะของแต่ละขั้น ถ้า "เสร็จแล้ว" ให้บอกว่าโรงเรียนมีหลักฐานหรือผลที่ได้ของขั้นนั้นเก็บไว้หรือไม่ (ไม่ต้องแนบไฟล์)</p>' + steps.map((x, k) => {
        const st = a.steps[x.id] || {}, bad = miss('steps.' + x.id);
        return '<div class="cpq' + bad + '"><p><span class="id">ขั้น ' + (k + 1) + '</span> <b>' + esc(x.when) + '</b> ' + esc(x.what) + '</p><div class="cpgrid"><div>' + fld('สถานะ', sel('answers.steps.' + x.id + '.status', PR.STEP_STATUS, st.status).replace('<select ', '<select data-rr="1" ')) + '</div>' +
          (st.status === 'เสร็จแล้ว' ? '<div>' + fld('มีหลักฐานหรือผลที่ได้ของขั้นนี้', sel('answers.steps.' + x.id + '.evidence', PR.EVID, st.evidence, 'เลือก'), 'ผลที่ได้ตามแผน: ' + esc(x.out)) + '</div>' : '') + '</div></div>';
      }).join(''), { icon: 'list' });
      s += card('3. ตัวชี้วัด', '<p class="hint">ตัวชี้วัดของแผนนี้: <b>' + esc(m.kpi) + '</b></p><div class="cpgrid"><div>' + fld('ค่าเป้าหมายที่ตั้งไว้ (ข้อความสั้น)', txt('answers.kpi.target', a.kpi.target, 'เช่น ร้อยละ 80')) + '</div><div>' + fld('ค่าที่วัดได้จริง (ข้อความสั้น)', txt('answers.kpi.actual', a.kpi.actual, 'เช่น ร้อยละ 85')) + '</div></div><div class="' + miss('kpi') + '">' + fld('ผลเทียบกับเป้าหมาย', chips('answers.kpi.met', PR.KPI_MET, a.kpi.met)) + '</div>', { icon: 'target' });
      s += card('4. ผู้รับประโยชน์และทรัพยากรที่ใช้', '<p class="xwarn">' + ic('alert', 18) + ' ใช้จำนวนรวมเท่านั้น ไม่ระบุชื่อ</p><div class="cpgrid"><div class="' + miss('reach.intended') + miss('reach.order') + '">' + fld('จำนวนที่ตั้งใจให้เข้าร่วม (' + esc(m.target) + ') คน', numw('answers.reach.intended', a.reach.intended, '', 5)) + '</div><div class="' + miss('reach.reached') + miss('reach.order') + '">' + fld('จำนวนที่เข้าร่วมจริง (คน)', numw('answers.reach.reached', a.reach.reached, '', 5), 'ต้องไม่เกินจำนวนที่ตั้งใจ') + '</div></div>' +
        '<div class="cpgrid"><div class="' + miss('resource.people') + '">' + fld('จำนวนผู้ปฏิบัติงาน (คน)', numw('answers.resource.people', a.resource.people, '', 4)) + '</div><div class="' + miss('resource.hours') + '">' + fld('เวลาที่ใช้รวม (ชั่วโมง)', numw('answers.resource.hours', a.resource.hours, '', 5)) + '</div><div class="' + miss('resource.cost') + '">' + fld('ค่าใช้จ่ายรวม (บาท)', numw('answers.resource.cost', a.resource.cost, '0 ถ้าไม่มี', 8)) + '</div></div>', { icon: 'users' });
      s += card('5. สถานการณ์ด้าน' + esc(hz) + 'หลังนำแผนไปใช้', '<div class="' + miss('change.value') + '">' + fld('ผู้ปฏิบัติงานสังเกตว่าด้านนี้เป็นอย่างไร', chips('answers.change.value', PR.CHANGE, a.change.value), 'เป็นการประเมินของผู้กรอก ไม่ใช่ข้อสรุปว่าเกิดจากแผน') + '</div><div class="cpgrid ' + miss('change.inc') + '"><div>' + fld('จำนวนเหตุของด้านนี้ ช่วงก่อนใช้แผน (ครั้ง ถ้ามีบันทึก)', numw('answers.change.incBefore', a.change.incBefore, '', 5)) + '</div><div>' + fld('จำนวนเหตุช่วงเวลาเท่ากัน หลังใช้แผน (ครั้ง)', numw('answers.change.incAfter', a.change.incAfter, '', 5), 'กรอกทั้งคู่หรือเว้นว่างทั้งคู่') + '</div></div>', { icon: 'alert' });
      const likert = (list, key) => '<ul class="cpleg"><li><b>1</b> น้อยที่สุด</li><li><b>5</b> มากที่สุด</li></ul>' + list.map((x) => '<div class="cpq' + miss(key + '.' + x[0]) + '"><p><span class="id">' + x[0] + '</span> ' + esc(x[1]) + '</p><div class="cprow">' + chips('answers.' + key + '.' + x[0], [1, 2, 3, 4, 5], (a[key] || {})[x[0]]) + '</div></div>').join('');
      s += card('6. ความสอดคล้องกับกลยุทธ์ที่ระบบเสนอ', likert(PR.ALIGN, 'align'), { icon: 'bars' });
      s += card('7. ความพึงพอใจ', likert(PR.SAT, 'sat'), { icon: 'check' });
      s += card('8. อุปสรรคที่พบ', '<div class="' + miss('obst') + '"><p class="hint">เลือกได้หลายข้อ ถ้าไม่พบอุปสรรคให้เลือกข้อสุดท้ายข้อเดียว</p>' + PR.OBST.map((x) => '<label class="xck big"><input type="checkbox" data-cset="answers.obst.' + x[0] + '" data-rr="1"' + ((a.obst || {})[x[0]] === true ? ' checked' : '') + '> ' + esc(x[1]) + '</label>').join('') + '</div>', { icon: 'alert' });
      s += card('9. การปรับแผนและข้อเสนอแนะ (ไม่บังคับ)', '<p class="xwarn">' + ic('alert', 18) + ' ห้ามใส่ชื่อบุคคล ชื่อนักเรียน หรือรายละเอียดที่ระบุตัวได้ ระบบไม่รับข้อความที่มีคำนำหน้าชื่อตามด้วยชื่อ</p>' + fld('สิ่งที่โรงเรียนปรับจากแผน (ไม่เกิน 400 ตัวอักษร)', '<textarea data-cset="answers.adapt" maxlength="400" rows="3">' + esc(a.adapt) + '</textarea>') + fld('ข้อเสนอแนะต่อแผนนี้ (ไม่เกิน 400 ตัวอักษร)', '<textarea data-cset="answers.suggest" maxlength="400" rows="3">' + esc(a.suggest) + '</textarea>'), { icon: 'doc' });
      return shell('planrec', s + '<div id="cpcheck">' + buildCheck('planreport', d) + '</div>' + actions('planreport', d, ck.complete));
    }

    // ---------- แดชบอร์ดผู้วิจัย: ผลการนำแผนไปใช้ ----------
    function dashPlans() {
      const list = filtered().filter((p) => p.form === 'planreport'), sm = PR.summarize(list, D.bank), o = sm.overall;
      const n1 = (x) => (typeof x === 'number' && isFinite(x) ? x.toFixed(2) : '–');
      if (!o.n) return synBanner() + card('ผลการนำแผนไปใช้', '<p class="hint">ยังไม่มีไฟล์บันทึกผลการนำแผนไปใช้ (แบบที่ 4) ที่ครบถ้วน นำเข้าไฟล์ JSON ที่โรงเรียนดาวน์โหลดหรือส่งออกจากชีต raw ในแท็บ "นำเข้า" หรือกด "โหลดข้อมูลตัวอย่างสมมติ"</p>', { icon: 'bars' });
      const kpiTxt = (k) => PR.KPI_MET.map((x) => x + ' ' + (k[x] || 0)).join(' · '), chgTxt = (k) => PR.CHANGE.map((x) => x + ' ' + (k[x] || 0)).join(' · ');
      let h2 = synBanner() + '<p class="xwarn">' + ic('alert', 18) + ' ข้อมูลทั้งหมดเป็นการรายงานของผู้ปฏิบัติงานโรงเรียนเอง ใช้อธิบายความเหมาะสม ความเป็นไปได้ ความเป็นประโยชน์ ความสามารถในการใช้งาน และความพึงพอใจของแผน ไม่ใช่หลักฐานว่าเหตุการณ์ไม่ปลอดภัยลดลงเพราะแผน (ข้อ 1.10) มาตรการที่มีรายงานน้อยกว่า 3 ฉบับแสดงเป็นค่าพรรณนาเท่านั้น</p>';
      h2 += '<div class="kpi4"><div class="tcard kc"><small>บันทึกผลที่ครบถ้วน</small><b>' + o.n + '</b></div><div class="tcard kc"><small>โรงเรียน</small><b>' + o.schools + '</b></div><div class="tcard kc"><small>ทำครบขั้นเฉลี่ย</small><b>' + pct(o.meanStepsDone) + '</b></div><div class="tcard kc"><small>เข้าถึงกลุ่มเป้าหมายเฉลี่ย</small><b>' + pct(o.meanCoverage) + '</b></div></div>';
      h2 += card('ผลตามมิติของงานวิจัย (ค่าเฉลี่ย 1–5)', '<div class="xscroll"><table class="xtb"><thead><tr><th>มิติ</th><th>ข้อที่ใช้</th><th>ค่าเฉลี่ย</th></tr></thead><tbody>' + o.dims.map((d2) => '<tr><td>' + esc(d2.label) + '</td><td>' + d2.items.join(', ') + '</td><td><b>' + n1(d2.mean) + '</b></td></tr>').join('') + '</tbody></table></div><p class="hint">ผลตัวชี้วัด: ' + esc(kpiTxt(o.kpi)) + '<br>การเปลี่ยนแปลงที่ผู้กรอกสังเกต: ' + esc(chgTxt(o.change)) + '<br>มีหลักฐานของขั้นที่เสร็จแล้วเฉลี่ย ' + pct(o.meanEvidence) + ' · ใช้เวลามัธยฐาน ' + n2(o.medianWeeks, 1) + ' สัปดาห์ (เทียบแผน ' + n2(o.medianWeeksRatio, 2) + ' เท่า) · ผู้ปฏิบัติงานมัธยฐาน ' + n2(o.medianPeople, 0) + ' คน · ' + n2(o.medianHours, 0) + ' ชั่วโมง · ' + n2(o.medianCost, 0) + ' บาท</p>', { icon: 'bars' });
      h2 += card('รายมาตรการ', '<div class="xscroll"><table class="xtb"><thead><tr><th>มาตรการ</th><th>n</th><th>ทำครบขั้น</th><th>บรรลุเป้า</th><th>เข้าถึง</th><th>สอดคล้อง A1–A6</th><th>พึงพอใจ S1–S5</th></tr></thead><tbody>' + sm.measures.map((x) => {
        const A = PR.ALIGN.map((i) => x.align[i[0]]), Sx = PR.SAT.map((i) => x.sat[i[0]]), mean2 = (v) => v.reduce((t, y) => t + y, 0) / v.length;
        return '<tr><td><b>' + esc(x.sb) + '</b> ' + esc(x.name) + (x.n < 3 ? ' ' + chip('n น้อย', 'warn') : '') + '</td><td>' + x.n + '</td><td>' + pct(x.meanStepsDone) + '</td><td>' + (x.kpi['บรรลุตามเป้า'] || 0) + '/' + x.n + '</td><td>' + pct(x.meanCoverage) + '</td><td>' + n1(mean2(A)) + '</td><td>' + n1(mean2(Sx)) + '</td></tr>';
      }).join('') + '</tbody></table></div>', { icon: 'target' });
      h2 += card('อุปสรรคที่พบ (จำนวนรายงาน)', '<ul class="xl">' + PR.OBST.map((x) => [x[1], o.obst[x[0]] || 0]).sort((p, q) => q[1] - p[1]).map((x) => '<li><span>' + esc(x[0]) + ': <b>' + x[1] + '</b> จาก ' + o.n + '</span></li>').join('') + '</ul>', { icon: 'alert' });
      const grp = (arr, lab) => '<div class="xscroll"><table class="xtb"><thead><tr><th>' + lab + '</th><th>n</th><th>เหมาะสม</th><th>เป็นไปได้</th><th>เป็นประโยชน์</th><th>ใช้งานง่าย</th><th>พึงพอใจ</th></tr></thead><tbody>' + arr.map((x) => '<tr><td>' + esc(x.key === '-' ? 'ไม่ระบุ' : x.key === 'X' ? 'ทุกด้านร่วมกัน' : (HZ[x.key] ? HZ[x.key][0] : x.key)) + '</td><td>' + x.n + '</td>' + x.dims.map((d2) => '<td>' + n1(d2.mean) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
      h2 += card('แยกตามด้านของภัยและกลุ่มแนวทาง', grp(sm.domains, 'ด้านของภัย') + grp(sm.groups, 'กลุ่มแนวทาง'), { icon: 'bars' });
      h2 += card('ส่งออก', '<p class="hint">CSV รูปแบบกว้าง หนึ่งแถวต่อหนึ่งมาตรการต่อหนึ่งโรงเรียน (ใช้ฉบับล่าสุดที่ครบถ้วน) เปิดด้วย Excel ได้</p><button class="tbtn primary" data-act="cl-csv" data-k="plans">' + ic('download', 22) + '<span>ดาวน์โหลด CSV ผลการใช้แผน</span></button>', { icon: 'download' });
      return h2;
    }

    // ====================================================================
    // แดชบอร์ดผู้วิจัย
    // ====================================================================
    const L = () => S.clab;
    const filtered = () => L().payloads.filter((p) => L().mode === 'all' || p.mode === L().mode);
    function ingest(text, name) {
      let o; try { o = JSON.parse(text); } catch (e) { return name + ': ไม่ใช่ JSON'; }
      const list = Array.isArray(o) ? o : [o], bad = [];
      list.forEach((p, i) => { const v = C.validatePayload(p, D); if (!v.ok) { bad.push((list.length > 1 ? name + ' รายการที่ ' + (i + 1) : name) + ': ' + v.why); return; }
        const kf = (x) => x.school + '|' + x.form + '|' + x.respondent + '|' + (x.measure || ''), k = kf(p), at = L().payloads.findIndex((x) => kf(x) === k);
        if (at >= 0) { if (String(p.submittedAt) >= String(L().payloads[at].submittedAt)) L().payloads[at] = p; } else L().payloads.push(p); });
      return bad.join('; ');
    }
    const tabsHtml = (cur) => '<div class="xtabs" role="tablist">' + [['import', 'นำเข้า'], ['complete', 'ความครบถ้วน'], ['profiles', 'โปรไฟล์โรงเรียน'], ['agree', 'ความสอดคล้อง'], ['plans', 'ผลการใช้แผน'], ['export', 'ส่งออก'], ['links', 'ลิงก์ผู้ตอบ']].map((t) => '<button role="tab" aria-selected="' + (t[0] === cur) + '" data-act="clabtab" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
    const synBanner = () => { const l = L().payloads; const syn = l.filter((p) => p.synthetic).length, nonLive = l.filter((p) => p.mode !== 'live').length; return (syn ? '<p class="xwarn">' + ic('alert', 18) + ' <b>มีข้อมูลสมมติ ' + syn + ' ไฟล์</b> ผลที่แสดงใช้ทดสอบเครื่องมือเท่านั้น ไม่ใช่ผลวิจัย</p>' : '') + (nonLive && !syn ? '<p class="xwarn">' + ic('alert', 18) + ' มีไฟล์จากโหมดทดลอง ' + nonLive + ' ไฟล์ ใช้ตัวกรองโหมดเลือกเฉพาะข้อมูลที่เปิดเก็บจริง (live)</p>' : ''); };
    const schoolsAll = () => C.groupBySchool(filtered());
    const profilesOf = () => schoolsAll().map((s) => ({ s, a: C.aggregateSchool(s, D) })).filter((x) => x.a.complete).map((x) => ({ code: x.s.code, a: x.a, out: E.analyze(x.a.input, D, null, { guard: Dc.guard }), inc: x.s.incidents, doc: x.s.documents, syn: x.s.synthetic }));
    function dashImport() {
      const l = L(), schools = schoolsAll();
      return card('นำเข้าไฟล์', '<p class="hint">นำเข้า (1) รายชื่อโรงเรียน CSV ที่มีคอลัมน์ code, stratum, pin (เลือกได้) และ (2) ไฟล์คำตอบ JSON ที่โรงเรียนดาวน์โหลดหรือที่ส่งออกจากชีตของระบบรับข้อมูล (ไฟล์เดียวหรือชุดรวมก็ได้) ระบบอ่านในเบราว์เซอร์นี้เท่านั้น ไม่ส่งไฟล์ไปที่ใด ถ้าส่งซ้ำ ฉบับล่าสุดแทนฉบับเดิม ข้อมูลหายเมื่อรีเฟรช</p><div class="row-btns two"><button class="tbtn" data-act="cl-pick-roster">' + ic('upload', 22) + '<span>เลือกรายชื่อโรงเรียน (CSV)</span></button><button class="tbtn primary" data-act="cl-pick-resp">' + ic('upload', 22) + '<span>เลือกไฟล์คำตอบ (JSON)</span></button></div><input type="file" id="cl-roster" accept=".csv,text/csv" hidden><input type="file" id="cl-resp" accept="application/json,.json" multiple hidden>' +
        '<p><button class="tbtn sm" data-act="cl-ex">' + ic('doc', 18) + '<span>โหลดข้อมูลตัวอย่างสมมติ (ทดสอบเครื่องมือ)</span></button> <button class="tbtn sm" data-act="cl-clear">' + ic('trash', 18) + '<span>ล้างข้อมูลที่นำเข้า</span></button></p>' +
        '<div class="xrow wrap"><label>กรองตามโหมดของข้อมูล<select data-cset-lab="mode"><option value="all"' + (l.mode === 'all' ? ' selected' : '') + '>ทุกโหมด</option><option value="live"' + (l.mode === 'live' ? ' selected' : '') + '>เฉพาะเก็บจริง (live)</option><option value="tryout"' + (l.mode === 'tryout' ? ' selected' : '') + '>เฉพาะทดลองใช้ (tryout)</option><option value="demo"' + (l.mode === 'demo' ? ' selected' : '') + '>เฉพาะโหมดทดลองกรอก (demo)</option></select></label></div>' +
        '<div class="kpi4"><div class="tcard kc"><small>รายชื่อโรงเรียน</small><b>' + l.roster.length + '</b></div><div class="tcard kc"><small>ไฟล์คำตอบที่ใช้</small><b>' + filtered().length + '</b></div><div class="tcard kc"><small>โรงเรียนที่มีข้อมูล</small><b>' + schools.length + '</b></div></div>' + synBanner() + (l.msgs.length ? '<ul class="xl">' + l.msgs.map((m) => '<li>' + esc(m) + '</li>').join('') + '</ul>' : ''), { icon: 'upload' });
    }
    function schedCard(rows) {
      const w = C.collectWindow(cfg().collectOpen, cfg().collectClose, new Date());
      if (w.invalid) return card('ช่วงเวลาเก็บข้อมูล', '<p class="xwarn">' + ic('alert', 18) + ' collectOpen หรือ collectClose ใน config.js ไม่ใช่รูปแบบ ปปปป-ดด-วว (ค.ศ.) ระบบจึงยังไม่ใช้ช่วงเวลา</p>', { icon: 'flag' });
      if (w.state === 'none') return card('ช่วงเวลาเก็บข้อมูล', '<p class="hint">ยังไม่ได้ตั้งวันเปิดเก็บข้อมูลใน config.js (collectOpen รูปแบบ ปปปป-ดด-วว ค.ศ. เช่น 2027-01-25) ตามแผน 4 สัปดาห์ เมื่อตั้งแล้ว ระบบคำนวณวันติดตามผู้ไม่ตอบ (สัปดาห์ที่ 2 และ 3) และวันปิดให้</p>', { icon: 'flag' });
      const nS = rows.filter((r) => !r.started).length, nP = rows.filter((r) => r.started && !r.complete).length;
      const st = { before: ['ยังไม่ถึงวันเปิด', 'warn'], open: ['กำลังเปิดเก็บ' + (w.daysLeft > 0 ? ' เหลืออีก ' + w.daysLeft + ' วัน' : ' ปิดวันนี้'), 'ok'], closed: ['ปิดเก็บแล้ว', ''] }[w.state];
      const rem = w.reminders.map((d, i) => '<tr><td>ติดตามครั้งที่ ' + (i + 1) + ' (สัปดาห์ที่ ' + (i + 2) + ')</td><td>' + C.thaiDate(d) + '</td></tr>').join('');
      return card('ช่วงเวลาเก็บข้อมูล', '<p>' + chip(st[0], st[1]) + '</p><div class="xscroll"><table class="xtb xsm"><thead><tr><th>กำหนด</th><th>วันที่</th></tr></thead><tbody>' + (w.open ? '<tr><td>เปิดเก็บ (สัปดาห์ที่ 1)</td><td>' + C.thaiDate(w.open) + '</td></tr>' : '') + rem + '<tr><td>ปิดเก็บ (วันสุดท้ายที่ส่งได้)</td><td>' + C.thaiDate(w.close) + '</td></tr></tbody></table></div><p class="hint">' + (rows.length ? 'ถึงวันติดตาม ส่งข้อความเตือนโรงเรียนที่ยังไม่เริ่ม ' + nS + ' แห่ง และที่ค้าง ' + nP + ' แห่ง (ดูรายชื่อในตารางด้านล่าง หรือส่งออกที่แท็บส่งออก)' : 'นำเข้ารายชื่อโรงเรียนที่แท็บนำเข้า เพื่อดูจำนวนโรงเรียนที่ต้องติดตาม') + '</p>', { icon: 'flag' });
    }
    function dashComplete() {
      const rows = C.completeness(filtered(), L().roster, D), done = rows.filter((r) => r.complete).length, started = rows.filter((r) => r.started).length;
      const byS = {}; rows.forEach((r) => { const k = r.stratum || 'ไม่ระบุ'; (byS[k] = byS[k] || { n: 0, done: 0 }); byS[k].n++; if (r.complete) byS[k].done++; });
      const yes = (v) => (v ? '<span class="xt ok">' + ic('check', 14) + '</span>' : '<span class="xt no">–</span>');
      return synBanner() + schedCard(rows) + card('ความครบถ้วน', '<div class="kpi4"><div class="tcard kc green"><small>ครบทุกชุด</small><b>' + done + '</b><span>จาก ' + rows.length + ' โรงเรียน (' + pct(rows.length ? done / rows.length : NaN) + ')</span></div><div class="tcard kc"><small>เริ่มส่งแล้ว</small><b>' + started + '</b></div><div class="tcard kc amber"><small>ยังไม่ส่งเลย</small><b>' + (rows.length - started) + '</b></div></div><div class="xscroll"><table class="xtb xsm"><thead><tr><th>พื้นที่</th><th>โรงเรียน</th><th>ครบ</th><th>ร้อยละ</th></tr></thead><tbody>' + Object.keys(byS).sort().map((k) => '<tr><td>' + esc((C.STRATA.find((x) => x[0] === k) || [, k])[1]) + '</td><td>' + byS[k].n + '</td><td>' + byS[k].done + '</td><td>' + pct(byS[k].done / byS[k].n) + '</td></tr>').join('') + '</tbody></table></div>' +
        '<div class="xscroll"><table class="xtb xsm"><thead><tr><th>รหัส</th><th>พื้นที่</th><th>R1</th><th>R2</th><th>R3</th><th>เหตุการณ์</th><th>เอกสาร</th><th>สถานะ</th></tr></thead><tbody>' + rows.map((r) => '<tr><td><b>' + esc(r.code) + '</b></td><td>' + esc(r.stratum) + '</td>' + r.q.map((x) => '<td>' + yes(x.done) + '</td>').join('') + '<td>' + yes(r.incidents) + '</td><td>' + yes(r.documents) + '</td><td>' + (r.complete ? chip('ครบ', 'ok') : r.started ? chip('ค้าง', 'warn') : chip('ยังไม่เริ่ม')) + '</td></tr>').join('') + '</tbody></table></div>' + (rows.length ? '' : '<p class="muted">ยังไม่มีข้อมูล นำเข้าที่แท็บนำเข้า</p>'), { icon: 'flag' });
    }
    function dashProfiles() {
      const pf = profilesOf();
      if (!pf.length) return synBanner() + card('โปรไฟล์โรงเรียน', '<p class="muted">ยังไม่มีโรงเรียนที่มีแบบสอบถามครบ 3 คน</p>', { icon: 'target' });
      const dist = {}; D.domains.forEach((d) => { dist[d.code] = {}; for (let i = 1; i <= 9; i++) dist[d.code]['R' + i] = 0; });
      pf.forEach((p) => p.out.domains.forEach((d) => { if (d.group) dist[d.code][d.group]++; }));
      const h1 = D.domains.map((d) => { const v = Object.keys(dist[d.code]).map((k) => dist[d.code][k]), tot = v.reduce((a, b) => a + b, 0), occ = v.filter((x) => x > 0).length, mx = tot ? Math.max.apply(null, v) / tot : NaN; return { code: d.code, occ, mx, ok: occ >= 5 && mx <= 0.5, n: tot }; });
      return synBanner() + card('การกระจายของโรงเรียนในช่อง R1–R9 (สมมติฐาน H1)', '<p class="hint">H1: แต่ละด้านมีโรงเรียนอยู่อย่างน้อย 5 จาก 9 ช่อง และไม่มีช่องใดมีโรงเรียนเกินร้อยละ 50 คำนวณจาก ' + pf.length + ' โรงเรียนที่มีแบบสอบถามครบ 3 คน (ค่าเฉลี่ยของ 3 คน กฎยกระดับตรวจจากรายคน: อย่างน้อย 2 ใน 3 คนให้ C = 5 และ L ≥ 2 [วิธีรวมเพื่อใช้กฎยกระดับเป็นข้อเสนอผู้วิจัย รอที่ปรึกษา])</p><div class="xscroll"><table class="xtb xsm"><thead><tr><th>ด้าน</th>' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => '<th>R' + i + '</th>').join('') + '<th>ช่องที่มีโรงเรียน</th><th>ช่องที่มากสุด</th><th>H1</th></tr></thead><tbody>' + D.domains.map((d, i) => '<tr><td>' + esc(HZ[d.code][0]) + '</td>' + Object.keys(dist[d.code]).map((k) => '<td>' + dist[d.code][k] + '</td>').join('') + '<td>' + h1[i].occ + '/9</td><td>' + pct(h1[i].mx) + '</td><td>' + (h1[i].ok ? chip('ผ่าน', 'ok') : chip('ไม่ผ่าน', 'no')) + '</td></tr>').join('') + '</tbody></table></div>', { icon: 'target', cls: 'blue' }) +
        card('โปรไฟล์รายโรงเรียน', '<div class="xscroll"><table class="xtb xsm"><thead><tr><th>รหัส</th><th>ความพร้อม</th><th>D เฉลี่ย</th>' + D.domains.map((d) => '<th>' + d.code + '</th>').join('') + '<th>ผู้ตอบต่างกันชัด</th></tr></thead><tbody>' + pf.map((p) => '<tr><td><b>' + esc(p.code) + '</b></td><td>' + esc(p.out.readyFinal || '–') + '</td><td>' + n2(p.out.readyMean) + '</td>' + p.out.domains.map((d) => '<td>' + (d.group || '–') + (d.override ? '*' : '') + '</td>').join('') + '<td>' + (p.a.divergent.length ? chip(p.a.divergent.length + ' จุด ตรวจกับผู้ให้ข้อมูล', 'warn') : '–') + '</td></tr>').join('') + '</tbody></table></div><p class="hint">* ยกระดับตามกฎ · "ผู้ตอบต่างกันชัด" = ค่าเฉลี่ยองค์ประกอบ D ของสองคนต่างกันเกิน 2.00 ต้องตรวจกับผู้ให้ข้อมูลหรือเอกสารก่อนสรุป (ข้อ 3.6)</p>', { icon: 'building' });
    }
    function dashAgree() {
      const sc = schoolsAll(), ag = C.agreement(sc, D);
      const pf = profilesOf().filter((p) => p.inc && !p.inc.answers.noSystem);
      const sp = D.domains.map((d) => {
        const ids = D.riskItems.filter((r) => r.dom === d.code).map((r) => r.id), x = pf.map((p) => +p.inc.answers[d.code]), y = pf.map((p) => ids.reduce((s, id) => s + p.a.input.risk[id][0], 0) / ids.length);
        return Object.assign({ code: d.code }, C.spearman(x, y));
      });
      return synBanner() + card('ความสอดคล้องของผู้ตอบภายในโรงเรียน', '<p class="hint">ใช้ ' + ag.schools + ' โรงเรียนที่มีผู้ตอบครบ 3 คน rwg(j) (James et al., 1984; ค่าติดลบตัดเป็น 0) เกณฑ์ .70 และ ICC(1) ของคะแนนเฉลี่ยรายผู้ตอบ เพื่อให้เหตุผลว่าการรวมคำตอบ 3 คนเป็นข้อมูลระดับโรงเรียนเหมาะสม (ข้อ 3.4)</p>' + (ag.schools < 2 ? '<p class="muted">ยังมีโรงเรียนไม่พอ (ต้องมีอย่างน้อย 2 แห่ง)</p>' : '<div class="xscroll"><table class="xtb xsm"><thead><tr><th>กลุ่มข้อ</th><th>rwg(j) มัธยฐาน</th><th>โรงเรียนที่ rwg ≥ .70</th><th>ICC(1)</th></tr></thead><tbody>' + ag.per.map((g) => '<tr><td>' + esc(g.label) + '</td><td>' + n2(g.medianRwg) + '</td><td>' + pct(g.shareAtLeast70) + '</td><td>' + n2(g.icc1) + '</td></tr>').join('') + '</tbody></table></div>'), { icon: 'people' }) +
        card('จำนวนเหตุการณ์จริงเทียบกับการรับรู้ (ข้อ 3.3.2)', '<p class="hint">สหสัมพันธ์สเปียร์แมนระหว่างจำนวนเหตุรวมของแต่ละด้านกับค่าเฉลี่ยความถี่ L ของด้านนั้น เฉพาะโรงเรียนที่มีระบบบันทึก (' + pf.length + ' แห่ง) ใช้ตรวจความสอดคล้อง ไม่ใช่ตัดสินความเสี่ยง และจำนวนเหตุยังไม่ปรับตามขนาดโรงเรียน</p>' + (pf.length < 3 ? '<p class="muted">ยังมีโรงเรียนไม่พอ (ต้องมีอย่างน้อย 3 แห่ง)</p>' : '<div class="xscroll"><table class="xtb xsm"><thead><tr><th>ด้าน</th><th>n</th><th>rho</th><th>p (ประมาณ)</th></tr></thead><tbody>' + sp.map((r) => '<tr><td>' + esc(HZ[r.code][0]) + '</td><td>' + r.n + '</td><td>' + n2(r.rho) + '</td><td>' + n2(r.p, 3) + '</td></tr>').join('') + '</tbody></table></div>'), { icon: 'bars' });
    }
    function schoolWide() {
      const pf = profilesOf(), head = ['school', 'synthetic', 'n_respondents', 'stratum', 'students_mean', 'resource', 'ready_mean', 'ready_level', 'floor_hit'].concat(D.domains.map((d) => 'risk_index_' + d.code)).concat(D.domains.map((d) => 'risk_' + d.code)).concat(D.domains.map((d) => 'cell_' + d.code)).concat(D.domains.map((d) => 'override_' + d.code)).concat(D.elements.map((e) => 'D_' + e.code)).concat(['inc_no_system', 'inc_V', 'inc_A', 'inc_P', 'inc_H', 'inc_year']).concat(C.DOCS.map((x) => 'doc_' + x[0])).concat(['divergent_points']);
      const rows = [head];
      pf.forEach((p) => { const i = p.inc ? p.inc.answers : null, dd = p.doc ? p.doc.answers.items : {};
        rows.push([p.code, p.syn, p.a.n, p.a.p1[0].stratum, n2(p.a.p1.reduce((s, x) => s + (+x.students), 0) / p.a.p1.length, 0), p.a.input.resource, n2(p.out.readyMean, 4), p.out.readyFinal, p.out.floorHit].concat(p.out.domains.map((d) => n2(d.rd, 4))).concat(p.out.domains.map((d) => d.risk)).concat(p.out.domains.map((d) => d.group)).concat(p.out.domains.map((d) => d.override)).concat(p.out.elements.map((e) => n2(e.d, 4))).concat(i ? [i.noSystem, i.V, i.A, i.P, i.H, i.year] : ['', '', '', '', '', '']).concat(C.DOCS.map((x) => dd[x[0]] || '')).concat([p.a.divergent.length])); });
      return rows;
    }
    function dashExport() {
      return synBanner() + card('ส่งออกข้อมูลสำหรับวิเคราะห์', '<p class="hint">ไฟล์ CSV เข้ารหัส UTF-8 เปิดด้วย Excel ได้ ข้อมูลรายผู้ตอบเป็นรูปแบบยาว (หนึ่งแถวต่อหนึ่งข้อ) ข้อมูลระดับโรงเรียนคำนวณด้วยเครื่องคำนวณเดียวกับเครื่องมือประเมิน (ค่าเฉลี่ยของ 3 คน)</p><div class="row-btns"><button class="tbtn primary" data-act="cl-csv" data-k="long">' + ic('download', 22) + '<span>รายผู้ตอบ (รูปแบบยาว)</span></button><button class="tbtn primary" data-act="cl-csv" data-k="wide">' + ic('download', 22) + '<span>ระดับโรงเรียน (ครบ 3 คน)</span></button><button class="tbtn" data-act="cl-csv" data-k="comp">' + ic('download', 22) + '<span>ความครบถ้วนรายโรงเรียน</span></button></div>', { icon: 'download' });
    }
    function dashLinks() {
      const l = L(), base = l.base || (location.origin + location.pathname);
      const rows = l.roster;
      return card('ตัวสร้างลิงก์ผู้ตอบ', '<p class="hint">สร้างลิงก์เฉพาะของผู้ตอบแต่ละคน (R1 ผู้อำนวยการ, R2 รองผู้อำนวยการ, R3 ครูผู้รับผิดชอบ) และของผู้ประสานงาน (แบบที่ 2 และ 3) ใช้ได้เมื่อนำเข้ารายชื่อโรงเรียนแล้ว ลิงก์มีเฉพาะรหัสโรงเรียนและรหัสผู้ตอบ ไม่มีรหัสผ่าน ส่งรหัสผ่านโรงเรียนแยกต่างหาก</p><label class="xfull">ที่อยู่เว็บไซต์ที่ใช้เก็บข้อมูล<input type="text" data-cset-lab="base" value="' + esc(base) + '"></label>' + (rows.length ? '<p><button class="tbtn primary sm" data-act="cl-links">' + ic('download', 18) + '<span>ดาวน์โหลดตารางลิงก์ (CSV)</span></button></p><div class="xscroll"><table class="xtb xsm"><thead><tr><th>รหัส</th><th>R1</th><th>R2</th><th>R3</th><th>แบบ 2</th><th>แบบ 3</th></tr></thead><tbody>' + rows.slice(0, 8).map((r) => '<tr><td>' + esc(r.code) + '</td>' + ['R1', 'R2', 'R3'].map((x) => '<td><a href="' + esc(linkOf(base, 'form1', r.code, x)) + '">เปิด</a></td>').join('') + '<td><a href="' + esc(linkOf(base, 'form2', r.code)) + '">เปิด</a></td><td><a href="' + esc(linkOf(base, 'form3', r.code)) + '">เปิด</a></td></tr>').join('') + '</tbody></table></div><p class="hint">แสดง 8 แถวแรก ไฟล์ CSV มีครบทุกโรงเรียน (' + rows.length + ' แห่ง)</p>' : '<p class="muted">ยังไม่ได้นำเข้ารายชื่อโรงเรียน</p>'), { icon: 'doc' });
    }
    const linkOf = (base, form, code, role) => base + '#' + form + '?s=' + encodeURIComponent(code) + (role ? '&r=' + role : '');
    function pageLab() {
      const tab = S.ui.clabTab || 'import';
      let s = banner('bars', 'แดชบอร์ดผู้วิจัย: เก็บข้อมูลโรงเรียน', 'ความครบถ้วน โปรไฟล์โรงเรียน ความสอดคล้องของผู้ตอบ และการส่งออก');
      s += tabsHtml(tab);
      const body = { import: dashImport, complete: dashComplete, profiles: dashProfiles, agree: dashAgree, plans: dashPlans, export: dashExport, links: dashLinks }[tab]();
      return '<div class="tapp cpapp"><div class="tbody">' + s + body + '</div></div>';
    }

    // ====================================================================
    // เหตุการณ์
    // ====================================================================
    function rerender(keep) { const sc = window.scrollY; c.render(true); if (keep) window.scrollTo({ top: sc }); }
    // อ่านตอนที่ 1 จากแผนปฏิบัติการ (PDF) ในเบราว์เซอร์ของผู้ตอบ ไม่อัปโหลด ผู้ตอบตรวจและเลือกเองก่อนกรอก (ดู planui.js)
    const PUI = root.RS_PLANUI.create({ id: 'portal', state: (S.planPortal = S.planPortal || {}), esc, ic, card, render: () => rerender(true), done: () => rerender(true), budgetTo: 'budget', missingKeys: ['students', 'staff'], hide: ['name', 'province'], auto: true, autoConf: ['high'], detailCollapsed: true,
      set: (to, v) => { const cd = S.ui.cdraft; if (!cd || cd.form !== 'questionnaire') return; setPath(cd.d.answers, 'part1.' + to, v); if (!cd.d.startedAt) cd.d.startedAt = new Date().toISOString(); persist(cd.form, cd.resp); },
      title: 'อัปโหลดแผนปฏิบัติการ ให้ระบบกรอกตอนที่ 1 ให้ (ไม่บังคับ)',
      intro: 'ถ้าโรงเรียนมีแผนปฏิบัติการประจำปีเป็นไฟล์ PDF กดปุ่มด้านล่างแล้วเลือกไฟล์ ระบบกรอกตอนที่ 1 ให้ทันทีเมื่อตัวเลขในแผนตรวจสอบกันได้ (จำนวนนักเรียนและบุคลากร ชายบวกหญิงต้องเท่ากับยอดรวม) และสังกัดพื้นที่ตรงกับรายการ ส่วนค่าที่ยังไม่แน่ใจ (ครูแนะแนว ช่วงงบ) ระบบแสดงให้ท่านตรวจก่อนกรอกเอง <b>ไฟล์ถูกอ่านในเครื่องของท่านเท่านั้น ไม่อัปโหลด และไม่ถูกส่งถึงผู้วิจัย</b> ผู้วิจัยได้รับเฉพาะคำตอบที่ท่านกดส่ง ตอนที่ 2–4 ท่านต้องตอบเอง เพราะเป็นการประเมินของท่าน',
      map: { students: { to: 'students', type: 'number', check: (v) => /^\d{1,7}$/.test(v) }, staff: { to: 'staff', type: 'number', check: (v) => /^\d{1,6}$/.test(v) },
        fiscalYear: { to: 'year', type: 'number', on: false, check: (v) => /^25\d\d$/.test(v) },
        stratum: { to: 'stratum', options: C.STRATA.map((x) => [x[0], x[1]]), check: (v) => C.STRATA.some((x) => x[0] === v) },
        guidance: { to: 'counselor', options: C.YESNO.map((x) => [x, x]), on: false, init: (e) => (parseInt(e.value, 10) > 0 ? 'มี' : ''), check: (v) => C.YESNO.indexOf(v) >= 0 } } });
    PUI.bind();
    function applyQuery(q) { if (!q) return; if (q.s) { K.code = String(q.s).slice(0, 16); } if (q.m && /^SB-\d{3}$/.test(q.m)) S.ui.recSb = q.m; if (q.r && C.ROLES.some((r) => r[0] === q.r)) K.role = q.r; }
    function bind() {
      document.addEventListener('click', (e) => {
        const t = e.target.closest('button'); if (!t || !t.dataset.act || t.disabled) return; const a = t.dataset.act;
        if (a === 'cch') {
          const cd = S.ui.cdraft; if (!cd) return; const rel = t.dataset.path.replace(/^answers\./, ''), raw = t.dataset.v;
          const parts = rel.split('.'), last = parts[parts.length - 1], isIdx = /^[01]$/.test(last);
          if (isIdx) { const key = parts.slice(0, -1).join('.'), arr = (getPath(cd.d.answers, key) || [null, null]).slice(); arr[+last] = arr[+last] === +raw ? null : +raw; setPath(cd.d.answers, key, arr); }
          else { const cur = getPath(cd.d.answers, rel); setPath(cd.d.answers, rel, cur === raw ? '' : raw); }
          if (!cd.d.startedAt) cd.d.startedAt = new Date().toISOString(); persist(cd.form, cd.resp);
          const sc = window.scrollY; c.render(true); window.scrollTo({ top: sc });
          const again = document.querySelector('[data-act="cch"][data-path="' + t.dataset.path + '"][data-v="' + raw + '"]'); if (again) again.focus({ preventScroll: true });
        }
        else if (a === 'copen') { if (t.dataset.role) K.role = t.dataset.role; rememberLast(); K.msg = ''; c.go(t.dataset.form); }
        else if (a === 'crole') { K.role = t.dataset.role; rememberLast(); rerender(true); }
        else if (a === 'cnext') { const m = document.querySelector('.cpmiss'); if (m) { m.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
        else if (a === 'cdl') {
          const form = t.dataset.form, p = payloadOf(form); if (!p) return; const cd = S.ui.cdraft; cd.d.downloaded = new Date().toISOString(); persist(cd.form, cd.resp);
          download('r2safe-' + p.school + '-' + form + (p.respondent ? '-' + p.respondent : (p.measure ? '-' + p.measure : '')) + '-' + p.mode + '.json', JSON.stringify(p, null, 1)); rerender(true);
        }
        else if (a === 'csend') doSend(t.dataset.form);
        else if (a === 'cclear') { const cd = S.ui.cdraft; if (cd && window.confirm('ล้างร่างของแบบนี้ในเครื่องนี้ใช่หรือไม่ (ไฟล์ที่ดาวน์โหลดหรือข้อมูลที่ส่งแล้วไม่หาย)')) { const key = keyOf(cd.form, cd.resp); delete K.drafts[key]; try { localStorage.removeItem(key); } catch (er) { /* ไม่เป็นไร */ } K.msg = ''; rerender(false); } }
        else if (a === 'cstatus') doStatus();
        else if (a === 'clabtab') { S.ui.clabTab = t.dataset.v; c.render(); }
        else if (a === 'cl-pick-roster') { const f = document.getElementById('cl-roster'); if (f) f.click(); }
        else if (a === 'cl-pick-resp') { const f = document.getElementById('cl-resp'); if (f) f.click(); }
        else if (a === 'cl-clear') { L().payloads = []; L().roster = []; L().msgs = []; rerender(true); }
        else if (a === 'cl-ex') {
          L().msgs = []; fetch('examples/collect-index.json').then((r) => { if (!r.ok) throw new Error('ไม่พบ examples/collect-index.json'); return r.json(); })
            .then((list) => Promise.all(list.map((n) => fetch('examples/' + n).then((r) => r.text()).then((tx) => (/\.csv$/i.test(n) ? (() => { const r2 = C.parseRoster(tx); L().roster = r2.roster; return r2.errors.join('; '); })() : ingest(tx, n))))))
            .then((m) => { L().msgs = m.filter(Boolean); L().mode = 'all'; rerender(true); }).catch((er) => { L().msgs = ['โหลดไฟล์ตัวอย่างไม่ได้: ' + er.message + ' (ใช้ได้เมื่อเปิดผ่านเว็บ ไม่ใช่เปิดไฟล์ตรง)']; rerender(true); });
        }
        else if (a === 'cl-csv') {
          const k = t.dataset.k, f = filtered();
          if (k === 'plans') download('r2safe-planreports.csv', C.toCsv(PR.longRows(f, D.bank)), 'text/csv;charset=utf-8');
          else if (k === 'long') download('r2safe-responses-long.csv', C.toCsv(C.longRows(f, D)), 'text/csv;charset=utf-8');
          else if (k === 'wide') download('r2safe-school-level.csv', C.toCsv(schoolWide()), 'text/csv;charset=utf-8');
          else download('r2safe-completeness.csv', C.toCsv([['school', 'stratum', 'R1', 'R2', 'R3', 'incidents', 'documents', 'complete']].concat(C.completeness(f, L().roster, D).map((r) => [r.code, r.stratum].concat(r.q.map((x) => x.done)).concat([r.incidents, r.documents, r.complete])))), 'text/csv;charset=utf-8');
        }
        else if (a === 'cl-links') { const base = L().base || (location.origin + location.pathname); download('r2safe-links.csv', C.toCsv([['school', 'stratum', 'R1', 'R2', 'R3', 'form2_incidents', 'form3_documents']].concat(L().roster.map((r) => [r.code, r.stratum, linkOf(base, 'form1', r.code, 'R1'), linkOf(base, 'form1', r.code, 'R2'), linkOf(base, 'form1', r.code, 'R3'), linkOf(base, 'form2', r.code), linkOf(base, 'form3', r.code)]))), 'text/csv;charset=utf-8'); }
      });
      document.addEventListener('input', (e) => {
        const t = e.target; if (!t || !t.dataset) return;
        if (t.dataset.csetTop) { K[t.dataset.csetTop] = t.value; rememberLast(); const b = document.querySelectorAll('.cpform button[data-act="copen"]'); b.forEach((x) => { x.disabled = !C.codeOk(K.code); }); return; }
        if (t.dataset.cset && t.type !== 'checkbox' && t.tagName !== 'SELECT') { const cd = S.ui.cdraft; if (!cd) return; setPath(cd.d, t.dataset.cset.indexOf('consent.') === 0 ? t.dataset.cset : t.dataset.cset, t.value); if (!cd.d.startedAt) cd.d.startedAt = new Date().toISOString(); persist(cd.form, cd.resp); updateLive(); }
        if (t.dataset.csetLab) { L()[t.dataset.csetLab] = t.value; }
      });
      document.addEventListener('change', (e) => {
        const t = e.target; if (!t || !t.dataset) return;
        if (t.dataset.csetTop) { rerender(true); return; }
        if (t.dataset.csetRec !== undefined) { S.ui.recSb = t.value; rerender(true); return; }
        if (t.dataset.csetLab) { L()[t.dataset.csetLab] = t.value; rerender(true); return; }
        if (t.dataset.cset) {
          const cd = S.ui.cdraft; if (!cd) return;
          if (t.dataset.cset === 'consent.accepted') { cd.d.consent.accepted = t.checked; cd.d.consent.at = t.checked ? new Date().toISOString() : null; persist(cd.form, cd.resp); rerender(true); return; }
          const v = t.type === 'checkbox' ? t.checked : t.value; setPath(cd.d.answers, t.dataset.cset.replace(/^answers\./, ''), v);
          if (cd.form === 'planreport' && /^answers\.obst\./.test(t.dataset.cset) && v) { const key = t.dataset.cset.split('.')[2]; PR.OBST.forEach((x) => { if (key === 'none' ? x[0] !== 'none' : x[0] === 'none') cd.d.answers.obst[x[0]] = false; }); }
          if (t.dataset.cset === 'answers.noSystem' && v) DOMAINS_CLEAR(cd.d.answers);
          if (!cd.d.startedAt) cd.d.startedAt = new Date().toISOString(); persist(cd.form, cd.resp); if (t.dataset.rr) rerender(true); else updateLive(); return;
        }
        if (t.id === 'cl-roster') { const f = (t.files || [])[0]; if (f) f.text().then((tx) => { const r = C.parseRoster(tx); L().roster = r.roster; L().msgs = r.errors; rerender(true); }); }
        else if (t.id === 'cl-resp') { L().msgs = []; Promise.all(Array.prototype.slice.call(t.files || []).map((f) => (f.size > 20 * 1048576 ? Promise.resolve(f.name + ': ใหญ่เกิน 20 MB') : f.text().then((tx) => ingest(tx, f.name))))).then((m) => { L().msgs = m.filter(Boolean); rerender(true); }); }
      });
    }
    function DOMAINS_CLEAR(a) { C.DOMAIN_KEYS.forEach((k) => { a[k] = ''; }); }
    // หมายเหตุ: ช่องข้อความ (input) ของ cset ตั้งค่าตรงบนฉบับร่างโดยไม่วาดหน้าใหม่ เพื่อไม่ให้เสียตำแหน่งเคอร์เซอร์
    return { bind, applyQuery, pages: { portal: () => shell('portal', pagePortal()), form1: pageForm1, form2: pageForm2, form3: pageForm3, planrec: pagePlanrec, collectlab: pageLab } };
  }
  root.RS_TOOL3 = { create };
})(window);
