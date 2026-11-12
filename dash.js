/* Risk Safe (R²-SAFE) ต้นแบบ: หน้าแรกและแดชบอร์ดตามบทบาท (ผู้อำนวยการ รองผู้อำนวยการ ผู้รับผิดชอบงานความปลอดภัย)
   ไฟล์นี้สร้างเฉพาะ HTML ตัวเลขทุกตัวคำนวณจากข้อมูลที่ผู้ใช้กรอกในเครื่องนี้ (engine.js) ไม่มีตัวเลขสมมติ
   ถ้ายังไม่กรอกข้อมูล จะแสดง ยังไม่มีข้อมูล และปุ่มโหลดข้อมูลตัวอย่าง (โรงเรียนสมมติ) */
(function (root) {
  'use strict';

  const RANK = { 'สูง': 3, 'กลาง': 2, 'ต่ำ': 1 };
  const toneRisk = { 'สูง': 'hi', 'กลาง': 'mid', 'ต่ำ': 'lo' };
  const toneReady = { 'สูง': 'lo', 'กลาง': 'mid', 'ต่ำ': 'hi' };   // ความพร้อมสูง = ดี
  const ROLE_LABEL = { roleDir: 'ผู้อำนวยการ', roleDeputy: 'รองผู้อำนวยการ', roleTeacher: 'ผู้รับผิดชอบงานความปลอดภัย', portal: 'โรงเรียนที่ร่วมวิจัย', roleResearch: 'ผู้วิจัย' };

  function create(c, h) {
    const { S, D, E, esc, fmt, getOut, filled, STATUS, mKey, SHORT_EL, ROLE_PAGES, C, guard } = c;
    const ic = h.ic, HZ = h.HZ;
    const dthai = (t) => new Date(t).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

    // ---------- ข้อมูลสรุปจากผลวิเคราะห์และสถานะแผน ----------
    function model() {
      const out = getOut(), has = out.domains.some((d) => d.group), f = filled();
      const rows = [];
      out.domains.forEach((d) => d.measures.forEach((m) => { const key = mKey(d.code, m.id); rows.push({ d, m, key, st: S.status[key] || STATUS[0] }); }));
      const n = rows.length, done = rows.filter((r) => r.st === STATUS[2]).length, doing = rows.filter((r) => r.st === STATUS[1]).length, todo = n - done - doing;
      const rds = out.domains.filter((d) => isFinite(d.rd)).map((d) => d.rd);
      const worst = out.domains.filter((d) => d.risk).sort((a, b) => RANK[b.risk] - RANK[a.risk] || b.rd - a.rd)[0] || null;
      const hi = out.domains.filter((d) => d.risk === 'สูง'), mid = out.domains.filter((d) => d.risk === 'กลาง');
      // ควรทำก่อน = มาตรการลำดับ 1–3 ของแต่ละด้านที่ความเสี่ยงสูง (ถ้าไม่มีด้านสูง ใช้ด้านที่เสี่ยงสูงสุด) ที่ยังไม่เสร็จ
      const hot = hi.length ? hi.map((d) => d.code) : worst ? [worst.code] : [];
      rows.forEach((r) => { r.urgent = hot.indexOf(r.d.code) >= 0 && r.m.order <= 3 && r.st !== STATUS[2]; });
      const urgent = rows.filter((r) => r.urgent);
      return {
        out, has, f, rows, n, done, doing, todo, worst, hi, mid, urgent,
        pctDone: n ? Math.round((done / n) * 100) : 0, avg: n ? Math.round((done * 100 + doing * 50) / n) : 0,
        rdAvg: rds.length ? rds.reduce((a, b) => a + b, 0) / rds.length : NaN,
        sc: S.school,
      };
    }

    // ---------- ชิ้นส่วนหน้าตา ----------
    const tag = (tone, text) => '<span class="dtag ' + tone + '">' + esc(text) + '</span>';
    const stat = (icon, tone, label, value, unit, extra) => '<div class="dsh-st ' + tone + '"><span class="dsh-si">' + ic(icon, 30) + '</span><div><small>' + label + '</small><b>' + value + (unit ? '<em>' + unit + '</em>' : '') + '</b>' + (extra || '') + '</div></div>';
    const panel = (title, icon, body, opt) => { opt = opt || {}; return '<section class="dsh-pn' + (opt.cls ? ' ' + opt.cls : '') + '"><h2>' + ic(icon, 22) + '<span>' + title + '</span>' + (opt.aside ? '<span class="dsh-as">' + opt.aside + '</span>' : '') + '</h2><div class="dsh-pb">' + body + '</div></section>'; };
    const go = (id, label, cls) => '<button class="dbtn ' + (cls || '') + '" data-go="' + id + '"><span>' + label + '</span>' + ic('chev', 16) + '</button>';
    const ex = () => '<button class="dbtn gold" data-act="example">' + ic('bulb', 18) + '<span>ใส่ข้อมูลตัวอย่าง (โรงเรียนสมมติ)</span></button>';
    const donut = (pct, label) => { const r = 46, L = 2 * Math.PI * r; return '<svg class="dsh-ring" viewBox="0 0 120 120" role="img" aria-label="' + esc(label + ' ' + pct + '%') + '"><circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#dbe9f6" stroke-width="13"/><circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#12a28f" stroke-width="13" stroke-linecap="round" stroke-dasharray="' + (L * pct / 100).toFixed(1) + ' ' + L.toFixed(1) + '" transform="rotate(-90 60 60)"/><text x="60" y="55" text-anchor="middle" class="rl">' + esc(label) + '</text><text x="60" y="80" text-anchor="middle" class="rv">' + pct + '%</text></svg>'; };
    const stChip = (st) => '<span class="dsc ' + (st === STATUS[2] ? 'ok' : st === STATUS[1] ? 'go' : 'no') + '">' + esc(st) + '</span>';
    const bar = (pct, tone) => '<span class="dsh-bar"><i class="' + (tone || '') + '" style="width:' + Math.max(0, Math.min(100, pct)) + '%"></i></span>';

    function hero(title, sub, roleId, m) {
      const chips = '<span>' + ic('building', 16) + ' ' + esc(m.sc.name || 'ยังไม่ระบุโรงเรียน') + '</span><span>' + ic('calendar', 16) + ' ปีการศึกษา ' + esc(m.sc.year || '–') + '</span><span id="fill-chip" class="chip"></span>' +
        '<button class="dlink" data-act="example">ใส่ข้อมูลตัวอย่าง</button><button class="dlink" data-act="clear">ล้างข้อมูล</button><button class="dlink" data-go="school">แก้ข้อมูลโรงเรียน</button>';
      return '<section class="dsh-hero"><div class="wrap"><div class="dsh-ht"><h1>' + esc(title) + '</h1><p>' + esc(sub) + '</p><div class="dsh-ctx">' + chips + '</div></div>' +
        '<span class="dsh-rolepill">' + ic('people', 22) + esc(ROLE_LABEL[roleId]) + '</span><div class="dsh-ill" aria-hidden="true">' + h.SCHOOL + '</div></div></section>';
    }
    const noData = (m, who) => '<section class="dsh-empty"><div class="dsh-eic">' + ic('clipboard', 44) + '</div><h2>ยังไม่มีข้อมูลสำหรับแสดงในแดชบอร์ด</h2><p>แดชบอร์ดนี้คำนวณจากคะแนนความเสี่ยงและความพร้อม 7-S ที่โรงเรียนกรอก ตอนนี้กรอกแล้ว ' + m.f.pct + '% ' + (who === 'teacher' ? '' : 'ท่านดูผลตัวอย่างได้ทันที หรือให้ผู้รับผิดชอบงานความปลอดภัยกรอกข้อมูลโรงเรียนก่อน') + '</p><div class="dsh-eb">' + ex() + go('rassess', 'ไปให้คะแนนความเสี่ยง', 'line') + go('ready', 'ไปให้คะแนนความพร้อม', 'line') + go('school', 'ข้อมูลโรงเรียนและอัปโหลดแผน', 'line') + '</div></section>';
    const roleMenu = (roleId) => '<section class="dsh-pn"><h2>' + ic('target', 22) + '<span>เมนูงานทั้งหมดของบทบาทนี้</span></h2><div class="dsh-pb"><div class="dsh-tasks">' + ROLE_PAGES[roleId].tasks.map((t, i) => '<a href="#' + t[0] + '" data-go="' + t[0] + '"><b>' + (i + 1) + '</b><span><strong>' + esc(t[1]) + '</strong><small>' + esc(t[2]) + '</small></span>' + ic('chev', 16) + '</a>').join('') + '</div></div></section>';
    const fine = '<p class="dsh-fine">ต้นแบบเชิงวิจัย ตัวเลขทั้งหมดคำนวณจากข้อมูลที่กรอกในเครื่องนี้ ผลของระบบเป็นข้อเสนอสนับสนุนการวางแผน ผู้อำนวยการเป็นผู้ตัดสินใจขั้นสุดท้าย ไม่ใช่เว็บไซต์ทางการของ สพฐ. และไม่แทนการตอบสนองเหตุฉุกเฉิน</p>';
    const page = (inner) => inner + '<div class="wrap dsh-tail">' + fine + '</div>';

    // ---------- หน้าแรก ----------
    function pageHome() {
      const nItems = D.riskItems.length + D.sevenItems.length;
      const stats = [['alert', 'รร', D.domains.length, 'กลุ่มความเสี่ยง (ด้านของภัย)'], ['shield', 'tl', D.elements.length, 'มิติความพร้อม (7-S)'], ['clipboard', 'gn', D.bank.length, 'มาตรการในคลัง (ฉบับร่าง)'], ['bars', 'bl', 'R1–R9', 'ตารางตัดสินใจ ความเสี่ยง × ความพร้อม']];
      const roles = [
        ['roleDir', 'people', 'dir', 'ผู้อำนวยการ', 'ดูภาพรวม ตัดสินใจเชิงกลยุทธ์และอนุมัติแนวทาง'],
        ['roleDeputy', 'people', 'dep', 'รองผู้อำนวยการ', 'ติดตามงาน วิเคราะห์ข้อมูล และกำกับแผนปฏิบัติการ'],
        ['roleTeacher', 'clipboard', 'tch', 'ผู้รับผิดชอบ', 'กรอกข้อมูลโรงเรียน อัปเดตหลักฐาน และดำเนินมาตรการ'],
      ];
      const steps = [['ประเมินความเสี่ยง', 'L × C 4 ด้านของภัย'], ['ประเมินความพร้อม', 'McKinsey 7-S'], ['ระบบแนะนำกลยุทธ์', 'กลุ่ม R1–R9 + คลังมาตรการ'], ['นำไปใช้และติดตามผล', 'แผน ตัวชี้วัด บทเรียน']];
      return '<section class="dsh-hero home"><div class="wrap"><div class="dsh-ht"><h1>ระบบบริหารความปลอดภัยบนฐานความเสี่ยง<br>และความพร้อมของโรงเรียน</h1><p>เครื่องมือช่วยตัดสินใจและขับเคลื่อนกลยุทธ์สำหรับโรงเรียนมัธยมศึกษา</p><p class="dsh-sub2">ประเมินความเสี่ยง ประเมินความพร้อม เชื่อมโยงคลังกลยุทธ์ และช่วยตัดสินใจเชิงบริหาร (' + nItems + ' ข้อประเมิน)</p><ul class="dsh-feat">' + ['ประเมินความเสี่ยง', 'วิเคราะห์ความพร้อม', 'เลือกกลยุทธ์ที่เหมาะสม', 'จัดทำแผนและติดตามผล'].map((x) => '<li>' + ic('check', 16) + x + '</li>').join('') + '</ul>' +
        '<div class="dsh-cta"><button class="dbtn gold lg" data-act="example">' + ic('bulb', 20) + '<span>ดูผลตัวอย่างใน 1 คลิก</span></button><button class="dbtn line lg" data-go="school"><span>เริ่มกรอกข้อมูลโรงเรียนของฉัน</span>' + ic('chev', 16) + '</button></div></div><div class="dsh-ill big" aria-hidden="true">' + h.SCHOOL + '</div></div></section>' +
        '<div class="wrap"><div class="dsh-stats four">' + stats.map((x) => '<div class="dsh-st ' + x[1] + '"><span class="dsh-si">' + ic(x[0], 30) + '</span><div><b>' + x[2] + '</b><small>' + x[3] + '</small></div></div>').join('') + '</div>' +
        '<h2 class="dsh-h2"><span>เริ่มใช้งานตามบทบาท</span></h2><div class="dsh-roles">' + roles.map((r) => '<div class="dsh-role ' + r[2] + '"><div class="dsh-ri">' + ic(r[1], 44) + '</div><div><h3>' + r[3] + '</h3><p>' + r[4] + '</p><button class="dbtn solid" data-go="' + r[0] + '"><span>เข้าสู่หน้าบทบาทนี้</span>' + ic('chev', 16) + '</button></div></div>').join('') + '</div>' +
        '<p class="dsh-more">บทบาทอื่น: <a href="#portal" data-go="portal">โรงเรียนที่ร่วมวิจัย (กรอกแบบเก็บข้อมูลด้วยรหัสโรงเรียน)</a> · <a href="#roleResearch" data-go="roleResearch">ผู้วิจัยและข้อมูลโครงการ</a></p>' +
        '<div class="dsh-flow"><div class="dsh-fh">กระบวนการใช้งานหลัก<br><small>(4 ขั้นตอน)</small></div>' + steps.map((s, i) => '<div class="dsh-fs"><b>' + (i + 1) + '</b><span>' + s[0] + '<small>' + s[1] + '</small></span></div>').join('<i class="dsh-arr">→</i>') + '</div>' +
        overview() +
        '<div class="dsh-note"><b>ข้อควรทราบก่อนใช้งาน</b><ul><li>เกณฑ์ ตารางตัดสินใจ และคลังมาตรการเป็นร่างเริ่มต้น ยังไม่ผ่านเดลฟายและการตรวจ IOC ข้อมูลตัวอย่างเป็นโรงเรียนสมมติ</li><li>ผลของระบบเป็นข้อเสนอสนับสนุนการวางแผน ไม่ใช้ตัดสินหรือจัดอันดับโรงเรียน และไม่ใช้แทนการตอบสนองเหตุฉุกเฉิน</li><li>ข้อมูลที่กรอกประมวลผลในเบราว์เซอร์ของท่านเท่านั้นและหายเมื่อรีเฟรชหน้า (ดาวน์โหลดแฟ้มงานเก็บไว้ได้ที่หน้า ติดตามผล) อย่ากรอกชื่อบุคคลหรือรายละเอียดเหตุการณ์จริง</li></ul></div></div>';
    }

    // ---------- ภาพรวมสถานะของโรงเรียน (หน้าแรก): ข้อมูลของผู้ใช้ ถ้ายังไม่กรอกใช้โรงเรียนตัวอย่างสมมติและบอกชัดเจน ----------
    const PALETTE = ['#e0594f', '#e8a23a', '#3b82c4', '#3fae7a'];
    function donutSegs(vals, label, sub) {
      const r = 46, L = 2 * Math.PI * r, tot = vals.reduce((a, b) => a + b, 0) || 1; let off = 0;
      const arcs = vals.map((v, i) => { const len = L * v / tot, e = '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="' + PALETTE[i % 4] + '" stroke-width="16" stroke-dasharray="' + len.toFixed(1) + ' ' + (L - len).toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 60 60)"/>'; off += len; return e; }).join('');
      return '<svg class="dsh-dn" viewBox="0 0 120 120" role="img" aria-label="' + esc(label) + '">' + arcs + '<text x="60" y="58" text-anchor="middle" class="rv">' + esc(label) + '</text><text x="60" y="74" text-anchor="middle" class="rl">' + esc(sub || '') + '</text></svg>';
    }
    function miniMatrix(domains) {
      const g = {}; domains.forEach((d) => { if (d.group) (g[d.group] = g[d.group] || []).push(d.code); });
      let t = '<div class="dsh-mx"><span></span>' + ['ต่ำ', 'กลาง', 'สูง'].map((x) => '<b>พร้อม' + x + '</b>').join('');
      ['สูง', 'กลาง', 'ต่ำ'].forEach((rk, ri) => { t += '<b class="rh">เสี่ยง' + rk + '</b>'; ['ต่ำ', 'กลาง', 'สูง'].forEach((rd, ci) => { const p = D.packages.find((x) => x.risk === rk && x.ready === rd); const has = g[p.code] || []; t += '<div class="mc r' + ri + (has.length ? ' cur' : '') + '" title="' + esc(p.name) + '"><b>' + p.code + '</b><small>' + has.map((x) => esc(x)).join(' ') + '</small></div>'; }); });
      return t + '</div>';
    }
    function overview() {
      const own = getOut(), mine = own.domains.some((d) => d.group);
      const src = mine ? { o: own, name: S.school.name || 'โรงเรียนของท่าน', tagTxt: 'ข้อมูลของท่านในเครื่องนี้' } : { o: E.analyze({ risk: D.example.risk, seven: D.example.seven, resource: D.example.resource }, D, S.params, { guard }), name: 'โรงเรียนตัวอย่าง (สมมติ)', tagTxt: 'ตัวอย่าง: โรงเรียนสมมติ ไม่ใช่ข้อมูลจริง' };
      const o = src.o, doms = o.domains.filter((d) => d.risk), cnt = (lv) => doms.filter((d) => d.risk === lv).length;
      const w = doms.slice().sort((a, b) => RANK[b.risk] - RANK[a.risk] || b.rd - a.rd)[0];
      const rds = doms.map((d) => (isFinite(d.rd) ? d.rd : 0)), tot = rds.reduce((a, b) => a + b, 0) || 1;
      const st = (icon, tone, label, val, sub) => '<div class="dsh-ov ' + tone + '"><span class="dsh-si">' + ic(icon, 26) + '</span><div><small>' + label + '</small><b>' + val + '</b>' + (sub ? '<span class="dsh-sm">' + sub + '</span>' : '') + '</div></div>';
      const top3 = (w ? w.measures : []).slice(0, 3);
      return '<div class="dsh-ovh"><h2>' + ic('bars', 24) + ' ภาพรวมสถานะความปลอดภัยของโรงเรียน <span class="dsh-ex">' + esc(src.tagTxt) + '</span></h2></div><div class="dsh-ovs">' +
        st('building', 'bl', 'โรงเรียน', esc(src.name), 'ปีการศึกษา ' + esc(S.school.year || '–')) + st('alert', 'tr', 'ความเสี่ยงสูง', cnt('สูง') + ' <em>ด้าน</em>', 'จาก 4 ด้านของภัย') + st('alert', 'ye', 'ความเสี่ยงปานกลาง', cnt('กลาง') + ' <em>ด้าน</em>', '') + st('check', 'gn', 'ความเสี่ยงต่ำ', cnt('ต่ำ') + ' <em>ด้าน</em>', '') + st('target', 'tl', 'ความพร้อมเฉลี่ย (D)', fmt(o.readyMean, 2) + ' <em>/ 5</em>', 'ระดับ' + esc(o.readyFinal || '–')) + '</div>' +
        '<div class="dsh-ovg"><section class="dsh-pn nm"><h2 class="lt">แผนภาพความเสี่ยง–ความพร้อม (R1–R9)</h2><div class="dsh-pb">' + miniMatrix(o.domains) + '<p class="dsh-hint">ตัวอักษรในช่อง = ด้านของภัยที่อยู่ในกลุ่มนั้น (V ความรุนแรง · A อุบัติเหตุ · P ละเมิดสิทธิ · H สุขภาวะ)</p></div></section>' +
        '<section class="dsh-pn nm"><h2 class="lt">สัดส่วนดัชนีความเสี่ยง 4 ด้าน</h2><div class="dsh-pb dsh-dnw">' + donutSegs(rds, doms.length + ' ด้าน', 'ดัชนี L × C') + '<ul class="dsh-lg">' + doms.map((d, i) => '<li><i style="background:' + PALETTE[i % 4] + '"></i><span>' + esc(HZ[d.code][0]) + '</span><b>' + Math.round(rds[i] / tot * 100) + '%</b></li>').join('') + '</ul></div></section>' +
        '<section class="dsh-pn nm"><h2 class="lt">การใช้กลยุทธ์ (Strategy Bank)</h2><div class="dsh-pb"><div class="dsh-sbk"><div><small>กลยุทธ์ทั้งหมดในคลัง</small><b>' + D.bank.length + ' <em>รายการ</em></b></div><div class="dsh-t3"><small>กลยุทธ์ที่แนะนำ (Top 3 ของด้านที่เสี่ยงสูงสุด)</small><ol>' + top3.map((m) => '<li>' + esc(m.name) + '</li>').join('') + '</ol></div></div></div></section></div>' +
        '<div class="dsh-quick"><b>' + ic('target', 22) + ' ใช้งานด่วน</b>' + [['rassess', 'alert', 'ประเมินความเสี่ยงของโรงเรียน'], ['ready', 'bars', 'ประเมินความพร้อม (7-S)'], ['strategy', 'target', 'เลือกกลยุทธ์ (R1–R9)'], ['plan', 'clipboard', 'จัดทำแผนปฏิบัติการ']].map((q) => '<button data-go="' + q[0] + '">' + ic(q[1], 22) + '<span>' + q[2] + '</span>' + ic('chev', 16) + '</button>').join('') + '</div>';
    }

    // ---------- แดชบอร์ดผู้วิจัย: แสดงจากไฟล์คำตอบที่นำเข้า (S.clab) บอกสถานะข้อมูลที่ได้แล้วและที่ยังรอ ----------
    function rmodel() {
      const L = S.clab, pl = L.payloads.filter((p) => L.mode === 'all' || p.mode === L.mode), schools = C.groupBySchool(pl), comp = C.completeness(pl, L.roster, D);
      const prof = schools.map((x) => ({ s: x, a: C.aggregateSchool(x, D) })).filter((x) => x.a.complete).map((x) => ({ code: x.s.code, out: E.analyze(x.a.input, D, null, { guard }) }));
      const mean = (a) => { const v = a.filter(isFinite); return v.length ? v.reduce((p, q) => p + q, 0) / v.length : NaN; };
      const target = L.roster.length || schools.length, done = comp.filter((r) => r.complete).length, started = comp.filter((r) => r.started).length;
      const man = S.ui.rdStage = S.ui.rdStage || [0, 0, 0, 0];
      const auto2 = target ? (done === target ? 2 : started ? 1 : 0) : null, auto4 = S.lab.experts.length ? 1 : null;
      const stage = [man[0], auto2 == null ? man[1] : auto2, man[2], auto4 == null ? man[3] : auto4];
      return { L, pl, schools, comp, prof, target, done, started, mean, stage, auto: [false, auto2 != null, false, auto4 != null], respondents: schools.reduce((n, x) => n + Object.keys(x.q).length, 0), syn: pl.some((p) => p.synthetic), nonLive: pl.filter((p) => p.mode !== 'live').length };
    }
    const SIDE = [['roleResearch', 'home', 'แดชบอร์ดผู้วิจัย'], ['cl:import', 'upload', 'จัดการข้อมูลวิจัย (นำเข้า)'], ['lab', 'gear', 'ห้องวิเคราะห์ (เครื่องมือวิจัย)'], ['bank', 'doc', 'Strategy Bank'], ['cl:profiles', 'bars', 'วิเคราะห์ผล'], ['cl:export', 'download', 'รายงานผล (ส่งออก)'], ['evaluate', 'clipboard', 'ประเมินนวัตกรรม'], ['rules', 'target', 'กฎและเกณฑ์ (จัดการระบบ)']];
    const sideNav = (cur) => '<nav class="rs-side" aria-label="เมนูผู้วิจัย">' + SIDE.map((x) => (x[0].indexOf('cl:') === 0 ? '<button data-act="cljump" data-v="' + x[0].slice(3) + '">' : '<button data-go="' + x[0] + '"' + (x[0] === cur ? ' aria-current="page"' : '') + '>') + ic(x[1], 20) + '<span>' + x[2] + '</span></button>').join('') + '</nav>';
    function pageResearch() {
      const m = rmodel(), L = m.L, n = m.prof.length, noteNone = '<p class="rs-none">' + ic('info', 18) + ' ยังไม่มีข้อมูลให้แสดง (ยังไม่มีโรงเรียนที่ตอบแบบสอบถามครบ 3 คน) นำเข้าไฟล์คำตอบหรือโหลดตัวอย่างสมมติเพื่อทดสอบเครื่องมือ</p>';
      const stNames = [['วิเคราะห์และสังเคราะห์', 'เอกสาร / สัมภาษณ์'], ['สำรวจและวิเคราะห์', 'โรงเรียน / ผู้ให้ข้อมูล'], ['พัฒนาระบบ', 'กลยุทธ์ / R1–R9'], ['ตรวจสอบและปรับปรุง', 'ผู้ทรงคุณวุฒิ / กรณีตัวอย่าง']];
      const stTxt = ['ยังไม่ระบุ', 'กำลังดำเนินการ', 'เสร็จแล้ว'], stPct = Math.round(m.stage.reduce((a, v) => a + (v === 2 ? 100 : v === 1 ? 50 : 0), 0) / 4);
      const curSt = m.stage.findIndex((v) => v !== 2);

      // 1 ภาพรวมโครงการ
      const stats = '<div class="dsh-stats four rs">' +
        '<div class="dsh-st bl"><span class="dsh-si">' + ic('building', 30) + '</span><div><small>โรงเรียนในกลุ่มศึกษา</small><b>' + (m.target || 0) + '<em>โรงเรียน</em></b><span class="dsh-sm">' + (L.roster.length ? 'ตามรายชื่อที่นำเข้า' : m.target ? 'นับจากโรงเรียนที่ส่งข้อมูล' : 'ยังไม่ได้นำเข้ารายชื่อ') + ' · ส่งแล้ว ' + m.started + ' · ครบทุกชุด ' + m.done + '</span></div></div>' +
        '<div class="dsh-st gn"><span class="dsh-si">' + ic('people', 30) + '</span><div><small>ผู้ให้ข้อมูล (แบบสอบถาม)</small><b>' + m.respondents + '<em>คน</em></b><span class="dsh-sm">' + (m.target ? 'เป้าหมาย ' + m.target * 3 + ' คน (ผอ. / รองผอ. / ครู)' : 'ผอ. / รองผอ. / ครูผู้รับผิดชอบ') + '</span></div></div>' +
        '<div class="dsh-st ye"><span class="dsh-si">' + ic('doc', 30) + '</span><div><small>กลยุทธ์ในคลัง (Strategy Bank)</small><b>' + D.bank.length + '<em>รายการ</em></b><span class="dsh-sm">ฉบับร่าง ยังไม่ผ่านเดลฟาย</span></div></div>' +
        '<div class="dsh-st tl"><span class="dsh-si">' + ic('bars', 30) + '</span><div><small>สถานะการดำเนินงานวิจัย</small><b class="sm">' + (curSt < 0 ? 'ครบทุกระยะ' : 'ระยะที่ ' + (curSt + 1) + ' : ' + stNames[curSt][0]) + '</b><span class="rs-prg"><span class="dsh-bar"><i class="ok" style="width:' + stPct + '%"></i></span><b>' + stPct + '%</b></span></div></div></div>';

      // 2 วิเคราะห์ข้อมูล
      let anal;
      if (!n) anal = noteNone;
      else {
        const rds = D.domains.map((d) => m.mean(m.prof.map((p) => p.out.domains.find((x) => x.code === d.code).rd)));
        const rm = m.mean(m.prof.map((p) => p.out.readyMean)), lv = { 'สูง': 0, 'กลาง': 0, 'ต่ำ': 0 }; m.prof.forEach((p) => { if (p.out.readyFinal) lv[p.out.readyFinal]++; });
        const pni = D.elements.map((e) => ({ code: e.code, v: m.mean(m.prof.map((p) => p.out.elements.find((x) => x.code === e.code).pni)) })).sort((a, b) => b.v - a.v), mxp = Math.max.apply(null, pni.map((x) => (isFinite(x.v) ? x.v : 0)).concat([0.001]));
        const len = Math.PI * 70, arc = 'M20 90 A70 70 0 0 1 160 90';
        anal = '<div class="rs-3"><section class="rs-sub"><h3>ภาพรวมความเสี่ยง (4 ด้านของภัย)</h3><div class="dsh-dnw">' + donutSegs(rds.map((v) => (isFinite(v) ? v : 0)), 'ดัชนีเฉลี่ย', n + ' โรงเรียน') + '<ul class="dsh-lg">' + D.domains.map((d, i) => '<li><i style="background:' + PALETTE[i % 4] + '"></i><span>' + esc(HZ[d.code][0]) + '</span><b>' + fmt(rds[i], 1) + '</b></li>').join('') + '</ul></div><p class="dsh-hint">สัดส่วนของวงกลมเทียบจากดัชนี L × C เฉลี่ยของ ' + n + ' โรงเรียนที่ข้อมูลครบ</p></section>' +
          '<section class="rs-sub"><h3>ระดับความพร้อมของโรงเรียน (7-S)</h3><svg class="rs-gauge" viewBox="0 0 180 110" role="img" aria-label="ความพร้อมเฉลี่ย ' + fmt(rm, 2) + ' จาก 5"><path d="' + arc + '" fill="none" stroke="#dbe9f6" stroke-width="16" stroke-linecap="round"/><path d="' + arc + '" fill="none" stroke="#3fae7a" stroke-width="16" stroke-linecap="round" stroke-dasharray="' + (len * Math.max(0, Math.min(1, rm / 5))).toFixed(1) + ' ' + len.toFixed(1) + '"/><text x="90" y="86" text-anchor="middle" class="gv">' + fmt(rm, 2) + '</text><text x="90" y="104" text-anchor="middle" class="gl">/ 5</text></svg><p class="rs-lv">ความพร้อมระดับสูง ' + lv['สูง'] + ' · กลาง ' + lv['กลาง'] + ' · ต่ำ ' + lv['ต่ำ'] + ' โรงเรียน</p></section>' +
          '<section class="rs-sub"><h3>ช่องว่างความพร้อม (PNI Modified เฉลี่ย)</h3>' + pni.map((x, i) => '<div class="dsh-rb s"><span>' + esc(SHORT_EL[x.code]) + '</span><span class="dsh-trk"><i class="' + (i < 3 ? 'mid' : 'blu') + '" style="width:' + Math.max(3, (isFinite(x.v) ? x.v : 0) / mxp * 100).toFixed(0) + '%"></i></span><b>' + fmt(x.v, 3) + '</b></div>').join('') + '</section></div>';
      }

      // 3 กลยุทธ์
      const dist = {}; D.packages.forEach((p) => { dist[p.code] = 0; }); const perDom = {}; D.domains.forEach((d) => { perDom[d.code] = {}; });
      m.prof.forEach((p) => p.out.domains.forEach((d) => { if (d.group) { dist[d.group]++; perDom[d.code][d.group] = (perDom[d.code][d.group] || 0) + 1; } }));
      const h1 = D.domains.filter((d) => { const v = Object.keys(perDom[d.code]).map((k) => perDom[d.code][k]), tot = v.reduce((a, b) => a + b, 0); return tot && v.length >= 5 && Math.max.apply(null, v) / tot <= 0.5; }).length;
      const cell = (rk, rd) => { const p = D.packages.find((x) => x.risk === rk && x.ready === rd); return '<div class="mc r' + ['สูง', 'กลาง', 'ต่ำ'].indexOf(rk) + (dist[p.code] ? ' cur' : '') + '" title="' + esc(p.name) + '"><b>' + p.code + '</b><small>' + dist[p.code] + ' ด้าน</small></div>'; };
      const grid = '<div class="dsh-mx"><span></span>' + ['ต่ำ', 'กลาง', 'สูง'].map((x) => '<b>พร้อม' + x + '</b>').join('') + ['สูง', 'กลาง', 'ต่ำ'].map((rk) => '<b class="rh">เสี่ยง' + rk + '</b>' + ['ต่ำ', 'กลาง', 'สูง'].map((rd) => cell(rk, rd)).join('')).join('') + '</div>';
      const evg = { A: 0, B: 0, C: 0, D: 0 }; D.bank.forEach((b) => { if (evg[b.evg] != null) evg[b.evg]++; });
      const ph = {}; D.bank.forEach((b) => { ph[b.phase] = (ph[b.phase] || 0) + 1; });
      const strat = '<div class="rs-2"><section class="rs-sub"><h3>ผลการจัดกลุ่ม R1–R9 (จำนวนด้าน × โรงเรียน)</h3>' + (n ? grid + '<p class="dsh-hint">นับจาก ' + n + ' โรงเรียน × 4 ด้าน = ' + n * 4 + ' ช่อง · สมมติฐาน H1 (กระจายอย่างน้อย 5 จาก 9 ช่อง ไม่เกินร้อยละ 50 ช่องเดียว) ผ่าน ' + h1 + ' จาก 4 ด้าน <button class="dlink dk" data-act="cljump" data-v="profiles">ดูรายละเอียด</button></p>' : noteNone) + '</section>' +
        '<section class="rs-sub"><h3>คลังกลยุทธ์และตารางตัดสินใจ</h3><div class="rs-bank"><div><small>ระดับหลักฐานของมาตรการ</small>' + ['A', 'B', 'C', 'D'].map((g) => '<div class="dsh-fl"><span>ระดับ ' + g + '</span>' + bar(D.bank.length ? evg[g] / D.bank.length * 100 : 0, g === 'A' || g === 'B' ? 'ok' : '') + '<b>' + evg[g] + '</b></div>').join('') + '</div><div><small>จำนวนมาตรการตามระยะ</small>' + Object.keys(ph).map((k) => '<div class="dsh-fl"><span>' + esc(k) + '</span>' + bar(ph[k] / D.bank.length * 100) + '<b>' + ph[k] + '</b></div>').join('') + '</div></div><p class="dsh-hint"><button class="dlink dk" data-go="bank">เปิดคลังกลยุทธ์ ' + D.bank.length + ' รายการ</button> · <button class="dlink dk" data-go="rules">กฎและเกณฑ์ตัดสินใจ</button> · <button class="dlink dk" data-go="matrix">ตาราง R1–R9</button></p></section></div>';

      // 4 ตรวจสอบคุณภาพ
      const qc = [['ผู้ทรงคุณวุฒิที่ประเมิน', S.lab.experts.length, 'คน'], ['ผู้บริหารที่ตอบแบบประเมิน (SUS)', S.lab.admins.length, 'คน'], ['รายงานโรงเรียนในห้องวิเคราะห์', S.lab.reports.length, 'ฉบับ']];
      const quality = '<div class="rs-q">' + qc.map((q) => '<div class="rs-qc"><small>' + q[0] + '</small><b>' + q[1] + '<em>' + q[2] + '</em></b>' + (q[1] ? '<span class="dsc go">มีข้อมูลนำเข้า</span>' : '<span class="dsc no">รอดำเนินการ</span>') + '</div>').join('') + '<div class="rs-qc"><small>ทดสอบเครื่องคำนวณเทียบ Excel</small><b>70<em>รายการ</em></b><span class="dsc ok">ผ่านแล้ว (โฟลเดอร์ tests)</span></div></div><p class="dsh-hint">แบบประเมินสำหรับผู้ทรงคุณวุฒิและผู้บริหารอยู่ที่หน้า <button class="dlink dk" data-go="evaluate">ประเมินนวัตกรรม</button> นำเข้าคำตอบมาดูผลที่ <button class="dlink dk" data-go="lab">ห้องวิเคราะห์</button></p>';

      // 5 รายงาน
      const rep = '<div class="rs-rep"><button class="dbtn solid" data-act="cljump" data-v="export">' + ic('download', 20) + '<span>ส่งออกตาราง CSV (รายผู้ตอบ / ระดับโรงเรียน / ความครบถ้วน)</span></button><button class="dbtn line" data-act="cljump" data-v="plans">' + ic('bars', 20) + '<span>ผลการใช้แผนของโรงเรียน</span></button><button class="dbtn line" data-go="track">' + ic('doc', 20) + '<span>แฟ้มงานและบทเรียน (ติดตามผล)</span></button></div><p class="dsh-hint">ตารางและกราฟในหน้านี้คำนวณใหม่ทุกครั้งจากไฟล์ที่นำเข้า (เบราว์เซอร์นี้เท่านั้น ไม่ส่งออกไปที่ใด) เมื่อรีเฟรชต้องนำเข้าใหม่ จึงควรส่งออก CSV เก็บไว้ทุกครั้งที่วิเคราะห์</p>';

      // กระบวนการวิจัย
      const proc = '<div class="dsh-flow rs-flow"><div class="dsh-fh">กระบวนการวิจัย<br><small>(R&amp;D : 4 ระยะ)</small></div>' + stNames.map((x, i) => '<div class="dsh-fs rs-fs ' + (m.stage[i] === 2 ? 'done' : i === curSt ? 'cur' : '') + '"><b>' + (i + 1) + '</b><span>' + x[0] + '<small>' + x[1] + '</small><em>' + stTxt[m.stage[i]] + (m.auto[i] ? ' (จากข้อมูลที่นำเข้า)' : '') + '</em></span>' + (m.auto[i] ? '' : '<button class="dlink dk" data-act="rdstage" data-i="' + i + '" aria-label="เปลี่ยนสถานะระยะที่ ' + (i + 1) + '">เปลี่ยน</button>') + '</div>').join('') + '</div>';

      const quick = '<div class="dsh-quick rs-quick"><b>' + ic('target', 22) + ' ทางลัดการทำงาน</b>' + [['cl:import', 'clipboard', 'นำเข้าไฟล์คำตอบ'], ['cl:links', 'people', 'ลิงก์ผู้ตอบ'], ['bank', 'doc', 'จัดการ Strategy Bank'], ['cl:profiles', 'bars', 'วิเคราะห์ R1–R9'], ['cl:export', 'download', 'สร้างรายงาน']].map((q) => '<button ' + (q[0].indexOf('cl:') === 0 ? 'data-act="cljump" data-v="' + q[0].slice(3) + '"' : 'data-go="' + q[0] + '"') + '>' + ic(q[1], 22) + '<span>' + q[2] + '</span>' + ic('chev', 16) + '</button>').join('') + '</div>';

      const warn = (m.syn ? '<p class="xw">' + ic('alert', 18) + ' <b>มีข้อมูลสมมติในรายการที่นำเข้า</b> ตัวเลขทั้งหมดใช้ทดสอบเครื่องมือเท่านั้น ไม่ใช่ผลวิจัย</p>' : m.nonLive ? '<p class="xw">' + ic('alert', 18) + ' มีไฟล์จากโหมดทดลอง ' + m.nonLive + ' ไฟล์ เลือกตัวกรองโหมดเป็น live ที่หน้านำเข้าเพื่อดูเฉพาะข้อมูลที่เก็บจริง</p>' : '');
      const status = '<div class="rs-status"><span>' + ic('info', 16) + ' สถานะข้อมูล: ไฟล์คำตอบที่ใช้ ' + m.pl.length + ' ไฟล์ · โรงเรียนที่มีข้อมูลครบ 3 คน ' + n + ' แห่ง · รายชื่อโรงเรียน ' + L.roster.length + ' แห่ง</span><button class="dbtn gold sm" data-act="cljump" data-v="import">นำเข้าไฟล์</button><button class="dbtn line sm" data-act="cl-ex">โหลดตัวอย่างสมมติ (ทดสอบ)</button></div>';

      const sec = (no, title, icon, body) => '<section class="dsh-pn rs"><h2>' + ic(icon, 22) + '<span>' + no + '. ' + title + '</span></h2><div class="dsh-pb">' + body + '</div></section>';
      return '<div class="rs-wrap"><aside>' + sideNav('roleResearch') + '</aside><div class="rs-main"><header class="rs-hd"><span class="rs-flask">' + ic('bulb', 38) + '</span><div><h1>แดชบอร์ดผู้วิจัย <small>(Research Dashboard)</small></h1><p>ภาพรวมการดำเนินงานวิจัยและฐานข้อมูลโครงการ R²-SAFE · ใช้บริหารข้อมูลวิจัย วิเคราะห์ผล พัฒนาระบบ และตรวจสอบคุณภาพนวัตกรรม</p></div></header>' +
        status + warn + stats + sec(1, 'ภาพรวมโครงการวิจัยและความก้าวหน้า', 'flag', proc) + sec(2, 'การวิเคราะห์ข้อมูล', 'bars', anal) + sec(3, 'การพัฒนากลยุทธ์', 'target', strat) + sec(4, 'การตรวจสอบคุณภาพระบบ', 'shieldcheck', quality) + sec(5, 'รายงานผลการวิจัย', 'download', rep) + quick + roleMenu('roleResearch') + '<p class="dsh-fine">ต้นแบบเชิงวิจัย แดชบอร์ดนี้แสดงเฉพาะข้อมูลที่นำเข้าในเครื่องนี้ ข้อมูลที่ยังไม่ได้เก็บแสดงเป็น รอดำเนินการ ไม่ใช้ตัวเลขสมมติแทน</p></div></div>';
    }

    // ---------- แดชบอร์ดผู้อำนวยการ ----------
    function pageDir() {
      const m = model();
      let s = hero('แดชบอร์ดผู้อำนวยการ', 'ภาพรวมเพื่อการตัดสินใจเชิงกลยุทธ์และการอนุมัติแนวทาง', 'roleDir', m);
      if (!m.has) return page(s + '<div class="wrap">' + noData(m) + roleMenu('roleDir') + '</div>');
      const o = m.out, w = m.worst, ap = S.ui.approval || { s: 'wait' };
      const apTxt = ap.s === 'ok' ? ['อนุมัติแนวทางแล้ว', 'lo', 'เมื่อ ' + dthai(ap.at) + ' (บันทึกชั่วคราวในเครื่องนี้)'] : ap.s === 'back' ? ['ส่งกลับเพื่อปรับปรุง', 'mid', 'เมื่อ ' + dthai(ap.at) + ' (บันทึกชั่วคราวในเครื่องนี้)'] : ['รอพิจารณา', 'mid', 'ยังไม่ได้ตัดสินใจในเครื่องนี้'];
      s += '<div class="wrap"><div class="dsh-stats five">' +
        stat('alert', 'tr', 'ดัชนีความเสี่ยงเฉลี่ย 4 ด้าน', fmt(m.rdAvg, 1), '/ 25', tag(toneRisk[w.risk], 'ด้านสูงสุด: ความเสี่ยง' + w.risk)) +
        stat('shield', 'tl', 'ระดับความพร้อมเฉลี่ย (D)', fmt(o.readyMean, 1), '/ 5.0', tag(toneReady[o.readyFinal], 'ความพร้อมระดับ' + o.readyFinal)) +
        stat('bars', 'bl', 'กลุ่มของด้านที่เสี่ยงสูงสุด', esc(w.group), '', '<span class="dsh-sm">' + esc(w.pkg.name) + '</span>') +
        stat('target', 'gn', 'มาตรการที่ควรทำก่อน', m.urgent.length, 'รายการ', m.urgent.length ? tag('hi', 'ลำดับ 1–3 ของด้านเสี่ยงสูง') : tag('lo', 'ไม่มีค้าง')) +
        stat('clipboard', 'bl', 'สถานะการอนุมัติแผน', '<span class="dsh-ap">' + apTxt[0] + '</span>', '', '<span class="dsh-sm">' + apTxt[2] + '</span>') + '</div>';

      // ข้อเสนอแนะเชิงกลยุทธ์
      const dec = w.pkg.decisions.slice(0, 3);
      const chips = o.domains.filter((d) => d.group).map((d) => '<span class="dtag ' + toneRisk[d.risk] + '" title="ความเสี่ยง' + esc(d.risk) + ' ความพร้อม' + esc(d.ready) + '">' + esc(HZ[d.code][0]) + ' ' + esc(d.group) + '</span>').join(' ');
      const strat = '<div class="dsh-strat"><div class="dsh-rbox"><small>ผลประเมิน (ด้านที่เสี่ยงสูงสุด: ' + esc(HZ[w.code][0]) + ')</small><b>' + esc(w.group) + '</b><span>' + esc(w.pkg.name) + '</span></div>' +
        '<div class="dsh-apr"><h3>แนวทางเชิงกลยุทธ์ที่แนะนำ <small>(' + dec.length + ' ข้อแรกจากชุดการตัดสินใจกลุ่ม ' + esc(w.group) + ')</small></h3><ol>' + dec.map((x) => '<li><span>' + esc(x) + '</span></li>').join('') + '</ol></div></div>' +
        '<p class="dsh-chips"><b>กลุ่มรายด้าน:</b> ' + chips + '</p><p class="dsh-sum">' + esc(w.pkg.summary) + '</p>';
      const decide = '<div class="dsh-dec"><button class="dbtn solid" data-go="brief">' + ic('doc', 20) + '<span>พิจารณารายงานสรุป</span>' + ic('chev', 16) + '</button><button class="dbtn green" data-act="approve">' + ic('check', 20) + '<span>อนุมัติแนวทาง</span>' + ic('chev', 16) + '</button><button class="dbtn line" data-act="sendback"><span>ส่งกลับเพื่อปรับปรุง</span>' + ic('chev', 16) + '</button></div>' +
        '<p class="dsh-hint">ปุ่มอนุมัติและส่งกลับใช้จดสถานะชั่วคราวในหน้านี้ ไม่ใช่เอกสารอนุมัติ การลงนามอนุมัติใช้แผนต้นแบบที่พิมพ์จากหน้า "แผนปฏิบัติการ" ' + (ap.s !== 'wait' ? '<button class="dlink dk" data-act="approval-reset">ยกเลิกสถานะ</button>' : '') + '</p>';

      // ความก้าวหน้า
      const stages = [['จัดทำแผน', true, 'มาตรการ ' + m.n + ' รายการ'], ['เริ่มดำเนินการ', m.doing + m.done > 0, m.doing + m.done + ' จาก ' + m.n + ' รายการเริ่มแล้ว'], ['ติดตามผล', S.track.snaps.length > 0, 'รอบประเมินที่บันทึก ' + S.track.snaps.length], ['สรุปผลและรายงาน', m.n > 0 && m.done === m.n, 'เสร็จ ' + m.done + ' จาก ' + m.n]];
      let cur = stages.findIndex((x) => !x[1]);
      const prog = '<div class="dsh-prog"><div class="dsh-pg1">' + donut(m.pctDone, 'เสร็จแล้ว') + '</div><div class="dsh-pg2"><h3>สรุปผลการติดตาม</h3><ul class="dsh-sl"><li>' + stChip(STATUS[2]) + '<b>' + m.done + '</b> รายการ</li><li>' + stChip(STATUS[1]) + '<b>' + m.doing + '</b> รายการ</li><li>' + stChip(STATUS[0]) + '<b>' + m.todo + '</b> รายการ</li></ul><p class="dsh-hint">ปรับสถานะรายมาตรการได้ที่หน้า <a href="#plan" data-go="plan">แผนปฏิบัติการ</a></p></div>' +
        '<div class="dsh-pg3"><h3>ไทม์ไลน์ตามแผน</h3><ol class="dsh-tl">' + stages.map((x, i) => '<li class="' + (x[1] ? 'done' : i === cur ? 'cur' : '') + '"><i>' + (x[1] ? ic('check', 14) : '') + '</i><b>' + x[0] + '</b><small>' + esc(x[2]) + '</small></li>').join('') + '</ol></div></div>';

      // ประเด็นที่ผู้บริหารควรทราบ
      const item = (icon, tone, title, sub, badge, to, dom) => '<button class="dsh-is" ' + (dom ? 'data-act="strat" data-dom="' + dom + '"' : 'data-go="' + to + '"') + '><span class="dsh-ii ' + tone + '">' + ic(icon, 26) + '</span><span class="dsh-it"><b>' + title + '</b><small>' + sub + '</small></span>' + badge + ic('chev', 16) + '</button>';
      const gapNames = o.top3.map((e) => SHORT_EL[e.code]).join(' · ');
      const issues = item('alert', 'r', 'ประเด็นความเสี่ยงเร่งด่วน', m.hi.length ? 'ด้านที่ความเสี่ยงสูง: ' + esc(m.hi.map((d) => HZ[d.code][0]).join(', ')) : 'ไม่พบด้านที่ความเสี่ยงสูง (ด้านที่ปานกลาง ' + m.mid.length + ' ด้าน)', tag(m.hi.length ? 'hi' : 'lo', m.hi.length + ' ด้าน'), '', m.hi.length ? m.hi[0].code : w.code) +
        item('bars', 'y', 'ช่องว่างความพร้อมที่ต้องพัฒนา', 'อันดับสูงสุด 3 องค์ประกอบ 7-S: ' + esc(gapNames), tag('mid', o.top3.length + ' ด้าน'), 'pni') +
        item('clipboard', 'r', 'มาตรการที่ยังไม่เริ่ม', 'จาก ' + m.n + ' มาตรการในแผน (ปรับสถานะที่หน้าแผนปฏิบัติการ)', tag(m.todo ? 'hi' : 'lo', m.todo + ' รายการ'), 'plan');
      const docs = [['brief', 'สรุปสำหรับผู้บริหาร 1 หน้า', 'พิมพ์หรือบันทึกเป็น PDF ได้'], ['planbook', 'เล่มแผนปฏิบัติการ', 'เล่ม A4 แนวนอน มีสารบัญและตัวชี้วัดของ ศธ.'], ['plandoc', 'แผนต้นแบบรายมาตรการ', 'แผน 3 หน้าต่อมาตรการ พร้อมช่องลงนาม'], ['planpack:all', 'แผนทั้งแผนพร้อมเอกสารแนบ', 'แผน แบบบันทึกผล และเอกสารประกอบ 6 ฉบับ'], ['moe', 'เทียบประกาศ ศธ. 7 มาตรการ', 'ดูว่าครอบคลุมกี่ข้อ ข้อใดยังขาด']];
      const docHtml = docs.map((x) => '<button class="dsh-dc" ' + (x[0].indexOf(':') > 0 ? 'data-act="planpack" data-k="all"' : 'data-go="' + x[0] + '"') + '><span class="dsh-pdf">' + ic('doc', 24) + '</span><span class="dsh-it"><b>' + x[1] + '</b><small>' + x[2] + '</small></span>' + ic('chev', 16) + '</button>').join('');

      s += '<div class="dsh-cols"><div class="dsh-main">' + panel('ข้อเสนอแนะเชิงกลยุทธ์สำหรับโรงเรียนนี้', 'target', strat) + panel('การตัดสินใจของผู้อำนวยการ', 'scale', decide) + panel('ความก้าวหน้าการดำเนินงาน', 'bars', prog) + '</div>' +
        '<div class="dsh-side">' + panel('ประเด็นที่ผู้บริหารควรทราบ', 'alert', issues) + panel('เอกสารสำคัญที่พิมพ์ได้', 'doc', docHtml) + '</div></div>' + roleMenu('roleDir') + '</div>';
      return page(s);
    }

    // ---------- แดชบอร์ดรองผู้อำนวยการ ----------
    function pageDeputy() {
      const m = model();
      let s = hero('แดชบอร์ดรองผู้อำนวยการ', 'ติดตามงาน วิเคราะห์ข้อมูล และกำกับแผนปฏิบัติการ', 'roleDeputy', m);
      if (!m.has) return page(s + '<div class="wrap">' + noData(m) + roleMenu('roleDeputy') + '</div>');
      const o = m.out, P = o.params;
      s += '<div class="wrap"><div class="dsh-stats five">' +
        stat('clipboard', 'bl', 'งานที่กำลังดำเนินการ', m.doing, 'งาน', '<span class="dsh-sm">จากมาตรการในแผน ' + m.n + ' รายการ</span>') +
        stat('alert', 'tr', 'ด้านที่ความเสี่ยงสูงหรือกลาง', m.hi.length + m.mid.length, 'ด้าน', '<span class="dsh-sm">สูง ' + m.hi.length + ' · กลาง ' + m.mid.length + ' · ต่ำ ' + (o.domains.filter((d) => d.risk === 'ต่ำ').length) + '</span>') +
        stat('building', 'tl', 'ข้อมูลที่กรอกแล้ว', m.f.pct, '%', '<span class="dsh-sm">ความเสี่ยง ' + m.f.r + '/' + m.f.rt + ' · 7-S ' + m.f.s + '/' + m.f.st + '</span>') +
        stat('doc', 'gn', 'แผนปฏิบัติการ', m.n, 'มาตรการ', '<span class="dsh-sm">ยังไม่เริ่ม ' + m.todo + ' · เสร็จ ' + m.done + '</span>') +
        stat('bars', 'bl', 'ความคืบหน้าเฉลี่ย', m.avg, '%', '<span class="dsh-sm">ยังไม่เริ่ม 0 · กำลังทำ 50 · เสร็จ 100</span>') + '</div>';

      const trs = m.rows.slice(0, 8).map((r, i) => '<tr><td>' + (i + 1) + '</td><td><b>' + esc(r.m.name) + '</b><small>' + esc(c.cd(r.m)) + ' · ' + esc(HZ[r.d.code][0]) + '</small></td><td class="pg">' + bar(r.st === STATUS[2] ? 100 : r.st === STATUS[1] ? 50 : 0, r.st === STATUS[2] ? 'ok' : '') + '</td><td>' + stChip(r.st) + '</td><td>' + esc(r.d.pkg.start) + '</td><td>' + esc(r.m.owner) + '</td></tr>').join('');
      const table = '<div class="dsh-sc"><table class="dsh-tb"><thead><tr><th>#</th><th>มาตรการ</th><th>ความคืบหน้า</th><th>สถานะ</th><th>เริ่มดำเนินการ</th><th>ผู้รับผิดชอบ</th></tr></thead><tbody>' + trs + '</tbody></table></div>' +
        (m.n > 8 ? '<p class="dsh-more2"><button class="dlink dk" data-go="plan">ดูทั้งหมด ' + m.n + ' รายการและปรับสถานะที่หน้าแผนปฏิบัติการ</button></p>' : '');

      const rbars = o.domains.filter((d) => isFinite(d.rd)).map((d) => '<div class="dsh-rb"><span>' + esc(HZ[d.code][0]) + '</span><span class="dsh-trk"><i class="' + toneRisk[d.risk] + '" style="width:' + Math.min(100, d.rd / 25 * 100).toFixed(0) + '%"></i><u style="left:' + (P.riskLow / 25 * 100) + '%"></u><u style="left:' + (P.riskMid / 25 * 100) + '%"></u></span><b>' + fmt(d.rd, 1) + '</b>' + tag(toneRisk[d.risk], d.risk) + '</div>').join('');
      const maxP = Math.max.apply(null, o.elements.map((e) => (isFinite(e.pni) ? e.pni : 0)).concat([0.001]));
      const gbars = o.elements.filter((e) => e.rank).sort((a, b) => a.rank - b.rank).map((e) => '<div class="dsh-rb"><span>' + esc(SHORT_EL[e.code]) + '</span><span class="dsh-trk"><i class="' + (e.rank <= 3 ? 'mid' : 'blu') + '" style="width:' + Math.max(3, (e.pni / maxP * 100)).toFixed(0) + '%"></i></span><b>' + fmt(e.pni, 3) + '</b><small>อันดับ ' + e.rank + '</small></div>').join('');
      const meaning = ['<li>' + (m.hi.length ? 'พบ ' + m.hi.length + ' ด้านที่ความเสี่ยงสูง (' + esc(m.hi.map((d) => HZ[d.code][0]).join(', ')) + ') ควรเร่งมาตรการของด้านเหล่านี้ก่อน' : 'ไม่พบด้านที่ความเสี่ยงสูง ตามเกณฑ์เบื้องต้นของระบบ') + '</li>',
        '<li>ช่องว่างความพร้อมสูงสุด 3 อันดับ: ' + esc(o.top3.map((e) => SHORT_EL[e.code]).join(', ')) + '</li>',
        '<li>ความพร้อมรวมอยู่ระดับ' + esc(o.readyFinal) + (o.floorHit ? ' (กฎเพดานทำให้ไม่จัดเป็นระดับสูง เพราะโครงสร้างหรือระบบต่ำกว่าเกณฑ์)' : '') + '</li>'].join('');
      const analysis = '<div class="dsh-an"><div><h3>ดัชนีความเสี่ยงรายด้าน (L × C เฉลี่ย จาก 25)</h3>' + rbars + '<p class="dsh-hint">เส้นขีดบนแถบ = ค่าตัดระดับต่ำ/กลาง (' + P.riskLow + ') และกลาง/สูง (' + P.riskMid + ') ตามเกณฑ์เบื้องต้นที่ยังไม่ผ่านเดลฟาย</p></div>' +
        '<div><h3>ช่องว่างความพร้อม 7-S (PNI Modified)</h3>' + gbars + '</div><div class="dsh-mn"><h3>ความหมายเชิงบริหาร</h3><ul>' + meaning + '</ul></div></div>';

      const tools = '<div class="dsh-tools">' + [['plan', 'target', 'ตรวจแผนปฏิบัติการ', 'ดูและปรับสถานะรายมาตรการ'], ['track', 'bars', 'ติดตามผลและบทเรียน', 'รอบประเมินและเปรียบเทียบก่อนหลัง'], ['dash', 'doc', 'ดูรายงานวิเคราะห์', 'ภาพรวมความเสี่ยงและความพร้อม'], ['planrec', 'clipboard', 'ผลการนำแผนไปใช้', 'ตรวจและกรอกผลรายมาตรการ']].map((t) => '<button class="dsh-tl2" data-go="' + t[0] + '">' + ic(t[1], 30) + '<b>' + t[2] + '</b><small>' + t[3] + '</small></button>').join('') + '</div>';

      const watch = m.rows.filter((r) => r.st === STATUS[0]).sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)).slice(0, 5);
      const wl = watch.length ? watch.map((r) => '<button class="dsh-is" data-go="plan"><span class="dsh-ii ' + (r.urgent ? 'r' : 'y') + '">' + ic('clipboard', 22) + '</span><span class="dsh-it"><b>' + esc(r.m.name) + '</b><small>' + esc(c.cd(r.m)) + ' · ' + esc(HZ[r.d.code][0]) + ' · ผู้รับผิดชอบ ' + esc(r.m.owner) + '</small></span>' + tag(r.urgent ? 'hi' : 'mid', r.urgent ? 'ควรทำก่อน' : 'ยังไม่เริ่ม') + ic('chev', 16) + '</button>').join('') : '<p class="dsh-ok">' + ic('check', 18) + ' ทุกมาตรการเริ่มดำเนินการแล้ว</p>';

      const dm = D.domains.map((d) => { const t = D.riskItems.filter((x) => x.dom === d.code).length, f = c.domFill(d.code); return '<div class="dsh-fl"><span>' + esc(HZ[d.code][0]) + '</span>' + bar(t ? f / t * 100 : 0, f === t ? 'ok' : '') + '<b>' + f + '/' + t + '</b></div>'; }).join('');
      const el = D.elements.map((e) => { const t = D.sevenItems.filter((x) => x.elem === e.code).length, f = c.elFill(e.code); return '<div class="dsh-fl"><span>' + esc(SHORT_EL[e.code]) + '</span>' + bar(t ? f / t * 100 : 0, f === t ? 'ok' : '') + '<b>' + f + '/' + t + '</b></div>'; }).join('');
      const fillP = '<div class="dsh-two"><div><h3>ข้อประเมินความเสี่ยงที่ให้คะแนนแล้ว</h3>' + dm + '<p class="dsh-hint"><button class="dlink dk" data-go="rassess">ตรวจและให้คะแนนความเสี่ยง</button></p></div><div><h3>ข้อประเมินความพร้อม 7-S ที่ให้คะแนนแล้ว</h3>' + el + '<p class="dsh-hint"><button class="dlink dk" data-go="ready">ตรวจและให้คะแนนความพร้อม</button></p></div></div>';

      s += '<div class="dsh-cols2 a"><div>' + panel('สถานะการดำเนินงานตามแผน', 'bars', table) + '</div><div>' + panel('วิเคราะห์ความเสี่ยงและความพร้อม', 'target', analysis) + '</div></div>' +
        '<div class="dsh-cols2 b"><div>' + panel('เครื่องมือประสานงานและกำกับแผน', 'gear', tools) + panel('ความครบถ้วนของข้อมูลที่ผู้รับผิดชอบกรอก', 'clipboard', fillP) + '</div><div>' + panel('รายการที่ต้องเร่งติดตาม', 'alert', wl, { aside: m.todo ? m.todo + ' รายการยังไม่เริ่ม' : '' }) + '</div></div>' + roleMenu('roleDeputy') + '</div>';
      return page(s);
    }

    // ---------- แดชบอร์ดผู้รับผิดชอบงานความปลอดภัย ----------
    function pageTeacher() {
      const m = model(), f = m.f, sc = m.sc, K = S.collect;
      const state = (a, t) => (t > 0 && a >= t ? 'ok' : a > 0 ? 'go' : 'no');
      const stTxt = { ok: 'ครบแล้ว', go: 'กำลังดำเนินการ', no: 'ยังไม่เริ่ม' };
      const stLarge = (k) => '<span class="dsc lg ' + k + '">' + ic(k === 'ok' ? 'check' : k === 'go' ? 'pulse' : 'alert', 16) + ' ' + stTxt[k] + '</span>';
      const sR = state(f.r, f.rt), sS = state(f.s, f.st), schoolOk = !!(sc.name && sc.students && sc.staff);
      const code = (K.code || '').toUpperCase(), drafts = code ? Object.keys(K.drafts || {}).filter((k) => k.split('|')[1] === code).length : 0;
      const planSt = m.n ? state(m.done + m.doing, m.n) : 'no';
      let s = hero('หน้าปฏิบัติงานผู้รับผิดชอบ', 'กรอกข้อมูล อัปโหลดหลักฐาน และดำเนินมาตรการตามแผน', 'roleTeacher', m);
      s += '<div class="wrap"><div class="dsh-stats five">' +
        '<div class="dsh-st tr"><span class="dsh-si">' + ic('alert', 30) + '</span><div><small>แบบประเมินความเสี่ยง</small>' + stLarge(sR) + '<span class="dsh-sm">ให้คะแนนแล้ว ' + f.r + ' จาก ' + f.rt + ' ข้อ</span></div></div>' +
        '<div class="dsh-st tl"><span class="dsh-si">' + ic('shield', 30) + '</span><div><small>แบบประเมินความพร้อม 7-S</small>' + stLarge(sS) + '<span class="dsh-sm">ให้คะแนนแล้ว ' + f.s + ' จาก ' + f.st + ' ข้อ</span></div></div>' +
        '<div class="dsh-st gn"><span class="dsh-si">' + ic('doc', 30) + '</span><div><small>เอกสารโรงเรียนที่เพิ่มไว้</small><b>' + S.docs.length + '<em>รายการ</em></b><span class="dsh-sm">เก็บเฉพาะชื่อไฟล์ ไม่ส่งออก</span></div></div>' +
        '<div class="dsh-st bl"><span class="dsh-si">' + ic('shieldcheck', 30) + '</span><div><small>มาตรการที่ดำเนินการแล้ว</small><b>' + m.done + '<em>/ ' + m.n + '</em></b>' + (m.n ? '<span class="dsh-sm">กำลังทำ ' + m.doing + ' · ยังไม่เริ่ม ' + m.todo + '</span>' : '<span class="dsh-sm">ยังไม่มีแผน (กรอกคะแนนก่อน)</span>') + '</div></div>' +
        '<div class="dsh-st ' + (code ? 'gn' : 'tr') + '"><span class="dsh-si">' + ic('upload', 30) + '</span><div><small>ระบบเก็บข้อมูลของผู้วิจัย</small>' + (code ? '<span class="dsc lg ' + (drafts ? 'go' : 'no') + '">' + ic(drafts ? 'pulse' : 'alert', 16) + ' ' + (drafts ? 'มีร่างแล้ว ' + drafts + ' แบบ' : 'ยังไม่เริ่มกรอก') + '</span>' : '<span class="dsc lg no">' + ic('alert', 16) + ' ยังไม่ได้ใส่รหัส</span>') + '<span class="dsh-sm">' + (code ? 'รหัสโรงเรียน ' + esc(code) : 'ใช้เมื่อโรงเรียนร่วมวิจัย') + '</span></div></div></div>';

      const task = (i, icon, title, sub, st, btn, to, k) => '<tr><td>' + i + '</td><td><span class="dsh-ti">' + ic(icon, 22) + '</span></td><td><b>' + title + '</b><small>' + sub + '</small></td><td><span class="dsc ' + st + '">' + stTxt[st] + '</span></td><td><button class="dbtn ' + (st === 'ok' ? 'line' : 'solid') + ' sm" ' + (k ? 'data-act="' + to + '" data-k="all"' : 'data-go="' + to + '"') + '><span>' + btn + '</span>' + ic('chev', 14) + '</button></td></tr>';
      const tasks = [
        task(1, 'building', 'ข้อมูลโรงเรียน', schoolOk ? esc(sc.name) + ' · นักเรียน ' + esc(sc.students) + ' คน' : 'ชื่อโรงเรียน จำนวนนักเรียนและบุคลากร (อัปโหลดแผนประจำปีให้ระบบอ่านได้)', schoolOk ? 'ok' : (sc.name || sc.students || sc.staff) ? 'go' : 'no', schoolOk ? 'ดู / แก้ไข' : 'กรอกข้อมูล', 'school'),
        task(2, 'alert', 'ให้คะแนนความเสี่ยง 4 ด้านของภัย', 'ตอบตามเหตุที่พบจริง ใช้ตัวเลขรวม ไม่ใส่ชื่อนักเรียน (' + f.r + '/' + f.rt + ' ข้อ)', sR, sR === 'ok' ? 'ดู / แก้ไข' : 'ให้คะแนน', 'rassess'),
        task(3, 'shield', 'ให้คะแนนความพร้อม 7-S', 'ตอบตามสิ่งที่โรงเรียนมีอยู่จริง (' + f.s + '/' + f.st + ' ข้อ)', sS, sS === 'ok' ? 'ดู / แก้ไข' : 'ให้คะแนน', 'ready'),
        task(4, 'shieldcheck', 'ดำเนินมาตรการตามแผน', m.n ? 'ปรับสถานะรายมาตรการ (เสร็จแล้ว ' + m.done + ' · กำลังทำ ' + m.doing + ' จาก ' + m.n + ')' : 'แผนจะปรากฏเมื่อกรอกคะแนนความเสี่ยงและความพร้อมครบ', m.n ? planSt : 'no', 'ไปที่แผน', 'plan'),
        task(5, 'print', 'พิมพ์แผนและเอกสารแนบเสนอ ผอ. ลงนาม', 'แผนต้นแบบรายมาตรการ แบบบันทึกผล และเอกสารประกอบ 6 ฉบับ', m.n ? 'go' : 'no', 'พิมพ์เอกสาร', 'planpack', true),
        task(6, 'clipboard', 'กรอกผลการนำแผนไปใช้ในโปรแกรม', code ? 'นำข้อมูลจากแบบบันทึกผลมากรอก (ร่างที่บันทึกในเครื่องนี้ ' + drafts + ' แบบ)' : 'ต้องมีรหัสโรงเรียนจากผู้วิจัย (ถ้าร่วมวิจัย)', drafts ? 'go' : 'no', 'กรอกผล', 'planrec'),
      ].join('');
      const todoTbl = '<div class="dsh-sc"><table class="dsh-tb tk"><thead><tr><th>#</th><th></th><th>งาน / รายการที่ต้องดำเนินการ</th><th>สถานะ</th><th>การดำเนินการ</th></tr></thead><tbody>' + tasks + '</tbody></table></div>';
      const left = panel('งานที่ต้องทำ', 'clipboard', todoTbl, { aside: 'ยังไม่ครบ ' + [schoolOk, sR === 'ok', sS === 'ok', m.n > 0 && m.done === m.n].filter((x) => !x).length + ' รายการหลัก' });

      const tile = (icon, label, btn, to) => '<button class="dsh-tile" data-go="' + to + '">' + ic(icon, 34) + '<b>' + label + '</b><span class="dbtn solid sm">' + btn + ' ' + ic('chev', 14) + '</span></button>';
      const fillBox = '<div class="dsh-tiles">' + tile('clipboard', 'ประเมิน<br>ความเสี่ยง', 'เริ่มกรอก', 'rassess') + tile('shield', 'ประเมิน<br>ความพร้อม', 'เริ่มกรอก', 'ready') + tile('upload', 'อัปโหลด<br>แผนและเอกสาร', 'อัปโหลด', 'school') + tile('shieldcheck', 'บันทึกผล<br>มาตรการ', 'บันทึก', 'planrec') + '</div>';
      const DN = { SAR: 'SAR', RAF: 'แผนเผชิญเหตุ', INC: 'รายงานเหตุการณ์', ACT: 'แผนปฏิบัติการ', OTH: 'เอกสารอื่น' };
      const docs = S.docs.length ? '<ul class="dsh-dl">' + S.docs.slice(-4).reverse().map((d) => '<li><span class="dsh-pdf">' + ic('doc', 20) + '</span><span class="dsh-it"><b>' + esc(d.name) + '</b><small>' + esc(DN[d.type] || d.type) + ' · เพิ่มเมื่อ ' + dthai(d.date) + '</small></span></li>').join('') + '</ul>' : '<p class="dsh-ok2">ยังไม่มีเอกสารที่เพิ่มไว้ เพิ่มได้ที่หน้า <a href="#school" data-go="school">ข้อมูลโรงเรียนและเอกสาร</a> (ระบบเก็บเฉพาะชื่อไฟล์ ขนาด และวันที่ ในเครื่องนี้)</p>';
      const right = panel('กรอกข้อมูลโรงเรียน', 'building', fillBox) + panel('เอกสารที่เพิ่มไว้ล่าสุด', 'doc', docs, { aside: '<a href="#school" data-go="school">ดูทั้งหมด</a>' });

      const next = [];
      if (!schoolOk) next.push('กรอกข้อมูลโรงเรียน หรืออัปโหลดแผนปฏิบัติการประจำปีให้ระบบอ่านให้');
      if (sR !== 'ok') next.push('ให้คะแนนความเสี่ยงให้ครบ ' + f.rt + ' ข้อ (เหลือ ' + (f.rt - f.r) + ' ข้อ)');
      if (sS !== 'ok') next.push('ให้คะแนนความพร้อม 7-S ให้ครบ ' + f.st + ' ข้อ (เหลือ ' + (f.st - f.s) + ' ข้อ)');
      if (!next.length && m.n) { next.push('พิมพ์แผนและเอกสารแนบ เสนอผู้อำนวยการลงนาม'); next.push('ดำเนินมาตรการตามแผนและปรับสถานะรายมาตรการ'); next.push('จดผลในแบบบันทึกผล แล้วนำข้อมูลมากรอกในหน้า บันทึกผลการนำแผนไปใช้'); }
      const nextBox = '<div class="dsh-nx"><span class="dsh-nxi">' + ic('clipboard', 56) + '</span><div><h3>สิ่งที่ควรดำเนินการต่อไป</h3><ol>' + next.slice(0, 3).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol></div></div>';
      const helps = '<div class="dsh-hp"><button data-go="about"><span>' + ic('bulb', 26) + '</span><b>ขั้นตอนการกรอกข้อมูล</b><small>ให้คะแนนระดับ 1–5 ทีละข้อ ใช้ตัวเลขรวม ไม่ใส่ชื่อนักเรียนหรือรายละเอียดเหตุการณ์จริง</small></button>' +
        '<button data-go="school"><span>' + ic('upload', 26) + '</span><b>วิธีเพิ่มเอกสารและอัปโหลดแผน</b><small>ไฟล์ PDF ถูกอ่านในเครื่องของท่านเท่านั้น ไม่อัปโหลดไปที่ใด ไม่เกิน 50 MB</small></button>' +
        '<button data-go="portal"><span>' + ic('info', 26) + '</span><b>ข้อมูลอยู่ที่ไหน</b><small>ข้อมูลที่กรอกอยู่ในเครื่องนี้และหายเมื่อรีเฟรช ดาวน์โหลดแฟ้มงานเก็บไว้ได้ที่หน้า ติดตามผล โรงเรียนที่ร่วมวิจัยส่งข้อมูลเมื่อกดส่งเอง</small></button></div>';

      s += '<div class="dsh-cols t"><div>' + left + '</div><div>' + right + '</div></div><div class="dsh-cols2 b2"><div>' + panel('แนวทางที่ได้รับมอบหมาย', 'target', nextBox) + '</div><div>' + panel('คำแนะนำการใช้งาน', 'info', helps) + '</div></div>' + roleMenu('roleTeacher') + '</div>';
      return page(s);
    }

    return { pages: { home: pageHome, roleDir: pageDir, roleDeputy: pageDeputy, roleTeacher: pageTeacher, roleResearch: pageResearch } };
  }

  const api = { create, ROLE_LABEL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RS_DASH = api;
})(typeof window !== 'undefined' ? window : this);
