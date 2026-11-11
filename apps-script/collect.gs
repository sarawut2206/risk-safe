/* R²-SAFE: ตัวรับข้อมูลจากระบบรวบรวมข้อมูลสถานศึกษา (Google Apps Script web app) แยกจากโปรเจกต์คลังมาตรการ (Code.gs)
   ใช้เมื่อผู้วิจัยได้รับการรับรองจริยธรรมและเปิดเก็บข้อมูลแล้วเท่านั้น (ดูข้อ 3.9 ของโครงร่าง)

   วิธีติดตั้ง
   1) สร้าง Google Sheet ใหม่ที่ผู้วิจัยคนเดียวเข้าถึงได้ (ไม่แชร์สาธารณะ) เพิ่มแผ่นชื่อ roster หัวคอลัมน์ code, stratum, pin (หนึ่งแถวต่อหนึ่งโรงเรียน)
   2) เมนู ส่วนขยาย > Apps Script วางโค้ดนี้ ตั้งค่าที่ โครงการ > คุณสมบัติสคริปต์: ALLOW_MODES = tryout,live (หรือเฉพาะ live) ADMIN_KEY = รหัสลับของผู้วิจัย
   3) ทำให้ใช้งาน > เว็บแอป: ดำเนินการในฐานะ = ฉัน, ผู้มีสิทธิ์เข้าถึง = ทุกคน คัดลอก URL
   4) ในเว็บไซต์ แก้ config.js: collectUrl = URL นั้น และ collectMode = 'tryout' หรือ 'live'
   ความปลอดภัย: URL ของเว็บแอปเป็นสาธารณะ จึงรับเฉพาะรหัสโรงเรียนที่อยู่ในแผ่น roster และรหัสผ่านตรงกับ pin (ถ้ามี) ไม่ส่งคำตอบกลับ ส่งกลับเพียงจำนวนที่ได้รับ
   ข้อมูลดิบอยู่ที่แผ่น raw (JSON ต่อแถว) นำไปนำเข้าที่แดชบอร์ดผู้วิจัยบนเว็บไซต์ได้ ดู README  ข้อมูลที่เก็บมีเฉพาะรหัสและคะแนน ไม่มีชื่อบุคคล */
var SHEET_RAW = 'raw', SHEET_STATUS = 'status', SHEET_ROSTER = 'roster';
var SCHEMA = 'r2safe-collect', VERSION = 1, MAX_JSON = 60000;
var ROLES = ['R1', 'R2', 'R3'], FORMS = ['questionnaire', 'incidents', 'documents', 'planreport'];
var STRATA = ['BKK1', 'BKK2', 'CEN1', 'CEN2'], YESNO = ['มี', 'ไม่มี'], RESOURCE = ['จำกัด', 'ปานกลาง', 'เพียงพอ'], DOC_STATUS = ['มี', 'กำลังจัดทำ', 'ไม่มี'];
var DOC_IDS = ['D1', 'D2', 'D3', 'D4', 'D5'];   // รายการข้อของตอนที่ 2 และ 3 ตั้งผ่านคุณสมบัติสคริปต์ RISK_IDS และ SEVEN_IDS (พิมพ์ค่าด้วย node tools/print_item_ids.js)

function intIn_(v, lo, hi) { var n = (typeof v === 'string' && v.trim() !== '') ? Number(v) : v; return (typeof n === 'number' && isFinite(n) && Math.floor(n) === n && n >= lo && n <= hi) ? n : null; }
function rating_(v) { return intIn_(v, 1, 5) !== null; }

// ---------- แบบบันทึกผลการนำแผนรายมาตรการไปใช้ (planreport) ต้องตรงกับ planrec.js ฝั่งเบราว์เซอร์ ----------
var PLAN_ROLES = ['R1', 'R2', 'R3', 'OT'], PLAN_STEPS = ['s1', 's2', 's3', 's4', 's5', 's6'], STEP_STATUS = ['ยังไม่เริ่ม', 'กำลังดำเนินการ', 'เสร็จแล้ว', 'ไม่ได้ทำ'], PLAN_EVID = ['มี', 'ไม่มี'];
var KPI_MET = ['บรรลุตามเป้า', 'บรรลุบางส่วน', 'ยังไม่บรรลุ', 'ยังวัดไม่ได้'], CHANGE = ['ดีขึ้น', 'เท่าเดิม', 'แย่ลง', 'ประเมินยังไม่ได้'];
var ALIGN_IDS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'], SAT_IDS = ['S1', 'S2', 'S3', 'S4', 'S5'], OBST_IDS = ['time', 'budget', 'staff', 'parents', 'teachers', 'students', 'agency', 'law', 'plan', 'none'];
var PLAN_DOMAINS = ['V', 'A', 'P', 'H', 'X'], PLAN_GROUPS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9'];
var NAME_LIKE = /(นาย|นางสาว|นาง|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.)\s*[ก-๙]{2,}/;   // ห้ามใส่ชื่อบุคคลในช่องข้อความ
function blankStr_(v) { return v === null || v === undefined || String(v).trim() === ''; }
function checkPlanReport_(p) {
  if (!/^SB-\d{3}$/.test(p.measure || '')) return 'รหัสมาตรการไม่ถูกต้อง';
  if (p.domain && PLAN_DOMAINS.indexOf(p.domain) < 0) return 'ด้านของภัยไม่ถูกต้อง';
  if (p.group && PLAN_GROUPS.indexOf(p.group) < 0) return 'กลุ่มแนวทางไม่ถูกต้อง';
  if (p.plannedWeeks !== undefined && p.plannedWeeks !== null && intIn_(p.plannedWeeks, 0, 104) === null) return 'จำนวนสัปดาห์ตามแผนไม่ถูกต้อง';
  var a = p.answers, i, k;
  if (intIn_(a.year, 2560, 2600) === null) return 'ปีการศึกษาไม่ถูกต้อง';
  if (PLAN_ROLES.indexOf(a.respRole) < 0) return 'ผู้กรอกไม่ถูกต้อง';
  if (intIn_(a.weeksActual, 0, 104) === null) return 'จำนวนสัปดาห์ที่ใช้ไม่ถูกต้อง';
  var st = a.steps || {};
  for (i = 0; i < PLAN_STEPS.length; i++) {
    var s = st[PLAN_STEPS[i]] || {};
    if (STEP_STATUS.indexOf(s.status) < 0) return 'สถานะขั้นตอนไม่ครบ';
    if (s.status === 'เสร็จแล้ว' && PLAN_EVID.indexOf(s.evidence) < 0) return 'ขั้นที่เสร็จแล้วต้องระบุว่ามีหลักฐานหรือไม่';
    if (!blankStr_(s.evidence) && PLAN_EVID.indexOf(s.evidence) < 0) return 'ค่าหลักฐานไม่ถูกต้อง';
  }
  var kp = a.kpi || {}; if (KPI_MET.indexOf(kp.met) < 0) return 'ผลตัวชี้วัดไม่ถูกต้อง';
  var rc = a.reach || {}; if (intIn_(rc.intended, 0, 99999) === null || intIn_(rc.reached, 0, 99999) === null || intIn_(rc.reached, 0, 99999) > intIn_(rc.intended, 0, 99999)) return 'จำนวนผู้รับประโยชน์ไม่ถูกต้อง';
  var rs = a.resource || {}; if (intIn_(rs.people, 0, 9999) === null || intIn_(rs.hours, 0, 99999) === null || intIn_(rs.cost, 0, 99999999) === null) return 'ทรัพยากรที่ใช้ไม่ถูกต้อง';
  var ch = a.change || {}; if (CHANGE.indexOf(ch.value) < 0) return 'การเปลี่ยนแปลงที่สังเกตไม่ถูกต้อง';
  var b = blankStr_(ch.incBefore), f = blankStr_(ch.incAfter);
  if (b !== f || (!b && (intIn_(ch.incBefore, 0, 99999) === null || intIn_(ch.incAfter, 0, 99999) === null))) return 'จำนวนเหตุก่อนและหลังต้องกรอกคู่กัน';
  for (i = 0; i < ALIGN_IDS.length; i++) if (!rating_((a.align || {})[ALIGN_IDS[i]])) return 'ความสอดคล้องไม่ครบ';
  for (i = 0; i < SAT_IDS.length; i++) if (!rating_((a.sat || {})[SAT_IDS[i]])) return 'ความพึงพอใจไม่ครบ';
  var ob = a.obst || {}, picked = OBST_IDS.filter(function (x) { return ob[x] === true; });
  if (!picked.length) return 'ยังไม่ได้เลือกอุปสรรค (เลือก ไม่พบอุปสรรค ถ้าไม่มี)';
  if (picked.indexOf('none') >= 0 && picked.length > 1) return 'เลือกไม่พบอุปสรรคพร้อมอุปสรรคอื่นไม่ได้';
  var texts = [a.adapt, a.suggest, kp.target, kp.actual], lens = [400, 400, 60, 60];
  for (k = 0; k < texts.length; k++) { var t = texts[k]; if (!blankStr_(t) && (typeof t !== 'string' || t.length > lens[k] || NAME_LIKE.test(t))) return 'ข้อความยาวเกินกำหนดหรือมีชื่อบุคคล'; }
  return '';
}

// ตรวจข้อมูลที่รับมา ไม่เชื่อสิ่งที่ฝั่งเบราว์เซอร์ตรวจแล้ว  items = { risk: [รหัสข้อ], seven: [รหัสข้อ] }
function checkPayload_(p, items, allowModes) {
  if (!p || p.schema !== SCHEMA) return 'ไม่ใช่ข้อมูลของ R²-SAFE';
  if (p.version !== VERSION) return 'เวอร์ชันไม่ตรง';
  if (FORMS.indexOf(p.form) < 0) return 'ชนิดแบบฟอร์มไม่ถูกต้อง';
  if (typeof p.school !== 'string' || !/^[A-Z0-9\-]{2,16}$/.test(p.school)) return 'รหัสโรงเรียนไม่ถูกต้อง';
  if (allowModes.indexOf(p.mode) < 0) return 'โหมด ' + p.mode + ' ไม่เปิดรับข้อมูล';
  if (!p.consent || p.consent.accepted !== true) return 'ไม่มีการยืนยันความยินยอม';
  var a = p.answers; if (!a || typeof a !== 'object') return 'ไม่มีคำตอบ';
  var i;
  if (p.form === 'questionnaire') {
    if (ROLES.indexOf(p.respondent) < 0) return 'ผู้ตอบไม่ถูกต้อง';
    var p1 = a.part1 || {};
    if (intIn_(p1.students, 1, 20000) === null || intIn_(p1.staff, 1, 5000) === null || intIn_(p1.year, 2560, 2600) === null) return 'ตอนที่ 1 ไม่ถูกต้อง';
    if (STRATA.indexOf(p1.stratum) < 0 || YESNO.indexOf(p1.safetyOfficer) < 0 || YESNO.indexOf(p1.counselor) < 0 || RESOURCE.indexOf(p1.resource) < 0 || typeof p1.budget !== 'string' || p1.budget.length > 60) return 'ตอนที่ 1 ไม่ถูกต้อง';
    for (i = 0; i < items.risk.length; i++) { var r = (a.risk || {})[items.risk[i]]; if (!r || !rating_(r[0]) || !rating_(r[1])) return 'ตอนที่ 2 ไม่ครบหรือไม่ถูกต้อง'; }
    for (i = 0; i < items.seven.length; i++) { var s = (a.seven || {})[items.seven[i]]; if (!s || !rating_(s[0]) || !rating_(s[1])) return 'ตอนที่ 3 ไม่ครบหรือไม่ถูกต้อง'; }
    var p4 = a.part4 || {}; if (String(p4.need || '').length > 600 || String(p4.suggest || '').length > 600) return 'ข้อความปลายเปิดยาวเกิน 600 ตัวอักษร';
  } else if (p.form === 'incidents') {
    if (intIn_(a.year, 2560, 2600) === null) return 'ปีการศึกษาไม่ถูกต้อง';
    var keys = ['V', 'A', 'P', 'H'];
    for (i = 0; i < keys.length; i++) { var v = a[keys[i]]; if (a.noSystem === true) { if (v !== '' && v != null) return 'ไม่มีระบบบันทึกต้องไม่มีจำนวน'; } else if (intIn_(v, 0, 99999) === null) return 'จำนวนเหตุการณ์ไม่ถูกต้อง'; }
  } else if (p.form === 'planreport') {
    var pe = checkPlanReport_(p); if (pe) return pe;
  } else {
    for (i = 0; i < DOC_IDS.length; i++) { if (DOC_STATUS.indexOf((a.items || {})[DOC_IDS[i]]) < 0) return 'แบบตรวจเอกสารไม่ครบ'; var y = (a.years || {})[DOC_IDS[i]]; if (y !== '' && y != null && intIn_(y, 2550, 2600) === null) return 'ปีที่จัดทำไม่ถูกต้อง'; }
  }
  return '';
}

// env: { roster: [{code, pin}], appendRaw(row), upsertStatus(school, col, ts), now() }
function handlePost_(body, env, items, allowModes) {
  var data; try { data = JSON.parse(body); } catch (e) { return { ok: false, error: 'อ่านข้อมูลไม่ได้' }; }
  if (JSON.stringify(data.payload || {}).length > MAX_JSON) return { ok: false, error: 'ข้อมูลใหญ่เกินกำหนด' };
  var p = data.payload, err = checkPayload_(p, items, allowModes); if (err) return { ok: false, error: err };
  if (env.roster && env.roster.length) {
    var row = env.roster.filter(function (r) { return r.code === p.school; })[0];
    if (!row) return { ok: false, error: 'ไม่พบรหัสโรงเรียนในรายชื่อ' };
    if (row.pin && String(row.pin) !== String(data.pin || '')) return { ok: false, error: 'รหัสผ่านโรงเรียนไม่ถูกต้อง' };
  }
  var ts = env.now();
  env.appendRaw([ts, p.school, p.form, p.form === 'planreport' ? p.measure : (p.respondent || ''), p.mode, p.receipt || '', JSON.stringify(p)]);
  env.upsertStatus(p.school, p.form === 'questionnaire' ? p.respondent : p.form, ts);
  return { ok: true, receipt: p.receipt || '', received: ts };
}
function statusOf_(school, pin, env) {
  if (!/^[A-Za-z0-9\-]{2,16}$/.test(school || '')) return { ok: false, error: 'รหัสโรงเรียนไม่ถูกต้อง' };
  school = school.toUpperCase();
  if (env.roster && env.roster.length) { var row = env.roster.filter(function (r) { return r.code === school; })[0]; if (!row) return { ok: false, error: 'ไม่พบรหัสโรงเรียนในรายชื่อ' }; if (row.pin && String(row.pin) !== String(pin || '')) return { ok: false, error: 'รหัสผ่านโรงเรียนไม่ถูกต้อง' }; }
  var st = env.readStatus(school) || {};
  return { ok: true, questionnaire: ROLES.filter(function (r) { return !!st[r]; }).length, incidents: !!st.incidents, documents: !!st.documents, planreports: env.countPlans ? env.countPlans(school) : (st.planreport ? 1 : 0) };
}

// ---------- ส่วนที่ผูกกับบริการของ Google (ไม่ได้ทดสอบนอก Apps Script) ----------
function props_() { return PropertiesService.getScriptProperties(); }
function allowModes_() { return String(props_().getProperty('ALLOW_MODES') || 'tryout,live').split(',').map(function (x) { return x.trim(); }); }
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet_(name, header) { var sh = ss_().getSheetByName(name); if (!sh) { sh = ss_().insertSheet(name); if (header) sh.appendRow(header); } return sh; }
function itemsFromSheet_() {
  // รายการรหัสข้อต้องตรงกับ data.js: ตั้งผ่านคุณสมบัติสคริปต์ RISK_IDS และ SEVEN_IDS (คั่นด้วยจุลภาค) หรือแก้ค่าคงที่ด้านล่าง
  var r = props_().getProperty('RISK_IDS'), s = props_().getProperty('SEVEN_IDS');
  if (!r || !s) throw new Error('ยังไม่ได้ตั้งค่า RISK_IDS และ SEVEN_IDS ในคุณสมบัติสคริปต์ (ดู README)');
  return { risk: r.split(',').map(function (x) { return x.trim(); }), seven: s.split(',').map(function (x) { return x.trim(); }) };
}
function rosterFromSheet_() {
  var sh = ss_().getSheetByName(SHEET_ROSTER); if (!sh) return [];
  var v = sh.getDataRange().getValues(), head = v[0].map(function (h) { return String(h).trim().toLowerCase(); }), ci = head.indexOf('code'), pi = head.indexOf('pin'), out = [];
  for (var i = 1; i < v.length; i++) { var code = String(v[i][ci] || '').trim().toUpperCase(); if (code) out.push({ code: code, pin: pi >= 0 ? String(v[i][pi] || '').trim() : '' }); }
  return out;
}
function realEnv_() {
  return {
    roster: rosterFromSheet_(),
    now: function () { return new Date().toISOString(); },
    appendRaw: function (row) { sheet_(SHEET_RAW, ['timestamp', 'school', 'form', 'respondent', 'mode', 'receipt', 'json']).appendRow(row); },
    upsertStatus: function (school, col, ts) {
      var sh = sheet_(SHEET_STATUS, ['school', 'R1', 'R2', 'R3', 'incidents', 'documents', 'planreport']), v = sh.getDataRange().getValues(), cols = ['school', 'R1', 'R2', 'R3', 'incidents', 'documents', 'planreport'], ci = cols.indexOf(col), row = -1;
      for (var i = 1; i < v.length; i++) if (String(v[i][0]) === school) { row = i + 1; break; }
      if (row < 0) { sh.appendRow([school, '', '', '', '', '', '']); row = sh.getLastRow(); }
      sh.getRange(row, ci + 1).setValue(ts);
    },
    countPlans: function (school) {   // จำนวนมาตรการที่โรงเรียนส่งบันทึกผลแล้ว (นับรหัสมาตรการไม่ซ้ำจากแผ่น raw)
      var sh = ss_().getSheetByName(SHEET_RAW); if (!sh) return 0; var v = sh.getDataRange().getValues(), seen = {}, n = 0;
      for (var i = 1; i < v.length; i++) if (String(v[i][1]) === school && String(v[i][2]) === 'planreport' && !seen[v[i][3]]) { seen[v[i][3]] = 1; n++; }
      return n;
    },
    readStatus: function (school) {
      var sh = ss_().getSheetByName(SHEET_STATUS); if (!sh) return null; var v = sh.getDataRange().getValues(), cols = ['school', 'R1', 'R2', 'R3', 'incidents', 'documents', 'planreport'];
      for (var i = 1; i < v.length; i++) if (String(v[i][0]) === school) { var o = {}; cols.forEach(function (c, k) { o[c] = v[i][k]; }); return o; }
      return null;
    },
  };
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doPost(e) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (er) { return json_({ ok: false, error: 'ระบบไม่ว่าง ลองใหม่อีกครั้ง' }); }
  try { return json_(handlePost_(e && e.postData ? e.postData.contents : '', realEnv_(), itemsFromSheet_(), allowModes_())); }
  catch (er) { return json_({ ok: false, error: 'ระบบขัดข้อง' }); }
  finally { lock.releaseLock(); }
}
function doGet(e) {
  var q = (e && e.parameter) || {};
  if (q.action === 'status') return json_(statusOf_(q.school, q.pin, realEnv_()));
  return json_({ ok: true, service: 'r2safe-collect', version: VERSION });
}
