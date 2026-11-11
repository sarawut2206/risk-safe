/* R²-SAFE: อ่านข้อมูลพื้นฐานของโรงเรียนจากข้อความของ "แผนปฏิบัติการประจำปี" (PDF) อัตโนมัติ
   ไฟล์นี้ไม่มี DOM และไม่ส่งข้อมูลไปที่ใด รับข้อความที่ดึงจาก PDF แล้ว (ทีละหน้า ทีละบรรทัด) แล้วคืนค่า
   ที่พบพร้อมหน้าที่พบ ข้อความต้นฉบับ และระดับความมั่นใจ ให้ผู้ใช้ตรวจก่อนนำไปใช้ ไม่เดาค่าที่ไม่พบ
   ข้อจำกัด: อ่านเฉพาะ PDF ที่มีชั้นข้อความ (ไม่ใช่ภาพสแกน) รูปแบบตารางของแต่ละโรงเรียนต่างกัน
   ค่าที่ได้เป็นข้อเสนอ ไม่ใช่ข้อเท็จจริงจนกว่าผู้ใช้ยืนยัน และไม่ใช่การประเมินความเสี่ยงหรือความพร้อม */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;

  // ---------- ข้อความไทยจาก PDF ----------
  // ฟอนต์ของเอกสารราชการจำนวนมากแปลงสระอำเป็น "ช่องว่าง + า/ำ" และบางฟอนต์ใช้ ำ แทน า
  // fixThai: ช่องว่าง+(า|ำ) = สระอำ ส่วน ำ ที่ไม่มีช่องว่างนำหน้า = า (ใช้แสดงผล)
  const fixThai = (s, artefact) => {
    const t = String(s || '');
    if (artefact === false) return t;
    return REPAIR.reduce((a, r) => a.split(r[0]).join(r[1]), t.replace(/ [ำา]/g, '\u0001').replace(/ำ/g, 'า').replace(/\u0001/g, 'ำ'));
  };
  // คำที่สระอำหายไปทั้งตัวเมื่อดึงข้อความ (ไม่มีช่องว่างเหลือให้ซ่อม) ใช้แก้เฉพาะข้อความที่แสดงผล
  const REPAIR = [['แกนนา', 'แกนนำ'], ['จานวน', 'จำนวน'], ['ประจาปี', 'ประจำปี'], ['สานัก', 'สำนัก'], ['ดาเนิน', 'ดำเนิน'], ['กาหนด', 'กำหนด'], ['ทางาน', 'ทำงาน'], ['คานา', 'คำนำ'], ['ลาดับ', 'ลำดับ'], ['ตาแหน่ง', 'ตำแหน่ง'], ['ชานาญ', 'ชำนาญ'], ['นามา', 'นำมา']];
  // เอกสารที่ฟอนต์ทำให้สระอำกลายเป็น "ช่องว่าง+า/ำ" จึงต้องซ่อม เอกสารปกติ (สระอำถูกต้อง) ต้องไม่แตะ
  const hasArtefact = (pages) => pages.reduce((n, p) => n + p.lines.reduce((m, l) => m + (l.match(/[ก-ฮ][่-๋]? [ำา]/g) || []).length, 0), 0) >= 20;
  // loose: ใช้เทียบรูปแบบ รวมสระอำทุกแบบเป็น า และตัดช่องว่างที่แทรกก่อนสระ
  const loose = (s) => String(s || '').replace(/\s?[ำา]/g, 'า').replace(/ํ/g, '');
  const num = (s) => parseInt(String(s).replace(/,/g, ''), 10);
  const NUMT = /^\d{1,3}(?:,\d{3})*$|^\d+$/;

  // รวมชิ้นข้อความของ pdf.js เป็นบรรทัด (จัดกลุ่มตามพิกัด y และเรียงตามพิกัด x)
  function linesFromItems(items) {
    const rows = [];
    items.forEach((it) => {
      if (!it || typeof it.str !== 'string' || !it.str.length || !it.transform) return;
      const x = it.transform[4], y = it.transform[5], h = Math.abs(it.transform[3]) || 10;
      let row = rows.find((r) => Math.abs(r.y - y) <= Math.max(2, h * 0.3));
      if (!row) { row = { y, h, parts: [] }; rows.push(row); }
      row.parts.push({ x, w: it.width || 0, s: it.str, h });
    });
    rows.sort((a, b) => b.y - a.y);
    return rows.map((r) => {
      r.parts.sort((a, b) => a.x - b.x);
      let out = '', end = null;
      r.parts.forEach((p) => {
        if (end !== null && p.x - end > p.h * 0.25 && !/^\s/.test(p.s) && !/\s$/.test(out)) out += ' ';
        out += p.s; end = p.x + p.w;
      });
      return out.replace(/\s+/g, ' ').trim();
    }).filter(Boolean);
  }

  // ---------- โครงการที่เกี่ยวกับความปลอดภัย ----------
  // กลุ่มคำสำคัญตาม 4 ด้านของภัยในระบบ (เป็นกฎคำค้นอย่างง่าย ผู้ใช้ต้องตรวจและเลือกเอง)
  const DOMAIN_KW = [
    ['V', 'ความรุนแรงของมนุษย์', ['ห้องเรียนสีขาว', 'ระบบดูแลช่วยเหลือนักเรียน', 'ดูแลช่วยเหลือ', 'ความรุนแรง', 'รังแก', 'แกนนำ', 'เฝ้าระวัง', 'ป้องกันและแก้ไข']],
    ['A', 'อุบัติเหตุและภัยพิบัติ', ['รักษาความปลอดภัย', 'ความปลอดภัย', 'อัคคีภัย', 'ดับเพลิง', 'อพยพ', 'เผชิญเหตุ', 'เวรยาม', 'กล้องวงจรปิด', 'จราจร', 'ภัยพิบัติ', 'ปฐมพยาบาล', 'อุบัติเหตุ']],
    ['P', 'การละเมิดสิทธิ', ['คุ้มครองข้อมูล', 'ข้อมูลส่วนบุคคล', 'PDPA', 'ล่วงละเมิด', 'สิทธิเด็ก', 'คุ้มครองเด็ก']],
    ['H', 'สุขภาวะกายและจิตใจ', ['สุขภาพจิต', 'ส่งเสริมสุขภาพนักเรียน', 'ตรวจสุขภาพ', 'เวชภัณฑ์', 'อนามัย', 'สารเสพติด', 'บุหรี่', 'TO BE NUMBER ONE', 'คลินิก', 'โภชนาการ', 'น้ำดื่ม', 'สุขาภิบาล']],
  ];
  // รายการที่เกี่ยวข้องแต่ไม่ควรนับเป็นงบความปลอดภัยของโรงเรียนโดยปริยาย (เช่น เบี้ยประกันที่ผู้ปกครองจ่าย)
  const SOFT_KW = ['ประกันอุบัติเหตุ', 'ตรวจสุขภาพ', 'ส่งเสริมการออกกำลังกาย', 'กีฬา'];
  const DOM_NAME = { V: 'ความรุนแรงของมนุษย์', A: 'อุบัติเหตุและภัยพิบัติ', P: 'การละเมิดสิทธิ', H: 'สุขภาวะกายและจิตใจ' };

  function classify(title) {
    const t = loose(title); let best = null;
    DOMAIN_KW.forEach((d) => d[2].forEach((k) => { if (t.indexOf(loose(k)) >= 0 && (!best || k.length > best.k.length)) best = { dom: d[0], k }; }));
    return best;
  }

  function parseProjects(pages, fx) {
    fx = fx || ((s) => s);
    const items = [];
    pages.forEach((pg) => {
      const L = pg.lines;
      for (let i = 0; i < L.length; i++) {
        const m = L[i].match(/^(\d{1,2}\.\d{1,2}\.\d{1,2})\s+(.+)$/); if (!m) continue;
        // ชื่อกิจกรรมอาจต่อเนื่องหลายบรรทัด จนกว่าจะเจอรหัสถัดไป
        let text = m[2], j = i + 1;
        while (j < L.length && j < i + 4 && !/^\d{1,2}\.\d{1,2}(\.\d{1,2})?\s/.test(L[j]) && !/^(รวม|แผนงาน|ตาราง)/.test(L[j])) { text += ' ' + L[j]; j++; }
        const tokens = text.split(' '), amounts = [];
        let title = [];
        tokens.forEach((tk) => { if (NUMT.test(tk) && num(tk) >= 100 && /,/.test(tk) || (NUMT.test(tk) && num(tk) >= 1000)) amounts.push(num(tk)); else if (!amounts.length) title.push(tk); });
        title = fx(title.join(' ')).replace(/\s+(ต\.ค|พ\.ย|ธ\.ค|ม\.ค|ก\.พ|มี\.ค|เม\.ย|พ\.ค|มิ\.ย|ก\.ค|ส\.ค|ก\.ย)[\s.\-–].*$/, '').trim();
        if (!title) continue;
        const cl = classify(title); if (!cl) continue;
        const amount = amounts.length ? amounts[0] : null;
        items.push({ code: m[1], title: title.slice(0, 140), amount, dom: cl.dom, kw: cl.k, soft: SOFT_KW.some((k) => loose(title).indexOf(loose(k)) >= 0), page: pg.n });
      }
    });
    return items;
  }

  // ---------- ตัวอ่านหลัก ----------
  function parse(pages) {
    const out = { fields: {}, evidence: [], projects: [], hints: [], pages: pages.length, textChars: 0 };
    const P = pages.map((p, i) => ({ n: p.n || i + 1, lines: p.lines || [] }));
    P.forEach((p) => { p.loose = p.lines.map(loose); out.textChars += p.lines.join('').length; });
    const artefact = hasArtefact(P), fx = (s) => fixThai(s, artefact); out.artefact = artefact;
    const add = (key, label, value, page, snippet, conf, note) => { out.fields[key] = value; out.evidence.push({ key, label, value, page, snippet: fx(snippet || '').slice(0, 160), conf, note: note || '' }); };

    // 1) ชื่อโรงเรียนและปีงบประมาณ จากคำนำ/ปก
    const head = P.slice(0, 12);
    for (const p of head) {
      const t = p.loose.join(' ');
      const m = t.match(/แผนปฏิบัติการ\s*(โรงเรียน[^\s]{2,40}?)\s*ประจา\s*ปี/);
      if (m) { const raw = p.lines.join(' '); const mm = raw.replace(/\s+/g, ' ').match(/แผนปฏิบัติการ\s*(โรงเรียน\S{2,40}?)\s*ประจ/); add('name', 'ชื่อโรงเรียน', fx(mm ? mm[1] : m[1]), p.n, m[0], 'high', 'ตรวจวรรณยุกต์และสระในชื่อ เพราะฟอนต์บางชนิดทำให้สระเพี้ยน'); break; }
    }
    if (!out.fields.name) {
      const cnt = {}; head.forEach((p) => p.lines.forEach((l) => { const m = l.match(/(โรงเรียน[^\s\d]{3,40})/); if (m) cnt[m[1]] = (cnt[m[1]] || 0) + 1; }));
      const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
      if (top) add('name', 'ชื่อโรงเรียน', fx(top), head[0].n, top, 'low', 'เดาจากชื่อที่พบบ่อยที่สุดในหน้าแรก ๆ');
    }
    const yc = {};
    head.forEach((p) => p.loose.join(' ').replace(/ปีงบประมาณ\s*(?:พ\.ศ\.)?\s*(25\d\d)/g, (_, y) => { yc[y] = (yc[y] || 0) + 1; }));
    const yk = Object.keys(yc).sort((a, b) => yc[b] - yc[a])[0];
    if (yk) add('fiscalYear', 'ปีงบประมาณของแผน (พ.ศ.)', yk, (head.find((p) => p.loose.join(' ').indexOf('ปีงบประมาณ พ.ศ. ' + yk) >= 0 || p.loose.join(' ').indexOf('ปีงบประมาณ ' + yk) >= 0) || head[0]).n, 'ปีงบประมาณ พ.ศ. ' + yk, 'high', 'ปีงบประมาณเริ่ม 1 ต.ค. ช่อง "ปีการศึกษา" ในเครื่องมืออาจต่างจากนี้ 1 ปี ตรวจก่อนใช้');

    // 2) ที่อยู่: จังหวัด และ สพม./สพป.
    for (const p of P.slice(0, 30)) {
      const full = p.lines.join(' ').replace(/\s+/g, ' ');
      let m = full.match(/(?:จังหวัด|จ\.)\s*([ก-๙]{2,30})\s+(\d{5})/) || full.match(/(?:เขต|แขวง)\s*[ก-๙]+\s*(กรุงเทพมหานคร)\s*(\d{5})/);
      if (m && !out.fields.province) add('province', 'จังหวัด', m[1], p.n, m[0], 'high', '');
      const s = loose(full).match(/สานักงานเขตพื้นที่การศึกษา(มัธยมศึกษา|ประถมศึกษา)\s*([ก-๙]+?)\s*เขต\s*(\d+)/);
      if (s && !out.fields.area) {
        out.fields.area = 'สพ' + (s[1] === 'มัธยมศึกษา' ? 'ม' : 'ป') + '. ' + s[2] + ' เขต ' + s[3];
        const stratum = (s[1] === 'มัธยมศึกษา' && /กรุงเทพ/.test(s[2]) && (s[3] === '1' || s[3] === '2')) ? 'BKK' + s[3] : '';
        out.evidence.push({ key: 'area', label: 'เขตพื้นที่การศึกษา', value: out.fields.area, page: p.n, snippet: fx(s[0]).slice(0, 160), conf: 'high', note: '' });
        if (stratum) { out.fields.stratum = stratum; out.evidence.push({ key: 'stratum', label: 'ชั้นภูมิในการวิจัย', value: stratum, page: p.n, snippet: fx(s[0]).slice(0, 160), conf: 'high', note: 'ใช้กับแบบสอบถามของระบบรวบรวมข้อมูลเท่านั้น' }); }
      }
      if (out.fields.province && out.fields.area) break;
    }

    // 3) นักเรียน: ตาราง "จำนวนนักเรียน" แถว "รวมทั้งหมด ชาย หญิง รวม ห้อง" ตรวจชาย+หญิง=รวม
    for (const p of P) {
      const txt = p.loose.join(' ');
      if (!/นักเรียนชาย/.test(txt) || !/นักเรียนหญิง/.test(txt)) continue;
      for (let i = 0; i < p.lines.length; i++) {
        const m = p.loose[i].match(/รวมทั้งหมด\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)(?:\s+([\d,]+))?/);
        if (!m) continue;
        const male = num(m[1]), fem = num(m[2]), tot = num(m[3]), rooms = m[4] ? num(m[4]) : null, ok = male + fem === tot;
        const date = (p.lines.join(' ').match(/ข้อมูล\s*ณ\s*วันที่\s*([^\n]{3,30}?)(?=\s{2,}|$)/) || [])[1];
        add('students', 'จำนวนนักเรียนทั้งหมด', tot, p.n, p.lines[i], ok ? 'high' : 'medium', (ok ? 'ชาย ' + male + ' + หญิง ' + fem + ' = ' + tot + ' ตรงกัน' : 'ชายบวกหญิงไม่เท่ากับยอดรวม ตรวจจากเอกสาร') + (date ? ' · ข้อมูล ณ ' + fx(date).trim() : ''));
        if (rooms) add('rooms', 'จำนวนห้องเรียน', rooms, p.n, p.lines[i], ok ? 'high' : 'medium', '');
        break;
      }
      if (out.fields.students) break;
    }

    // 4) ครูและบุคลากร: ตาราง "จำนวนบุคลากร" แถว "รวม ชาย หญิง รวม ร้อยละ"
    for (const p of P) {
      const txt = p.loose.join(' ');
      if (!/ผู้บริหาร/.test(txt) || !/(ข้าราชการครู)/.test(txt) || !/(ชาย)/.test(txt)) continue;
      let teachers = null, tpage = p.n;
      for (let i = 0; i < p.lines.length; i++) {
        const t = p.loose[i].match(/ข้าราชการครู\s+(\d+)\s+(\d+)\s+(\d+)/); if (t) teachers = num(t[3]);
        const m = p.loose[i].match(/^รวม\s+(\d+)\s+(\d+)\s+(\d+)\s+[\d.]+$/);
        if (m && !out.fields.staff) {
          const male = num(m[1]), fem = num(m[2]), tot = num(m[3]), ok = male + fem === tot;
          const date = (p.lines.join(' ').match(/ข้อมูล\s*ณ\s*วันที่\s*([^\n]{3,30}?)(?=\s{2,}|$)/) || [])[1];
          add('staff', 'ครูและบุคลากรทั้งหมด', tot, p.n, p.lines[i], ok ? 'high' : 'medium', (ok ? 'ชาย ' + male + ' + หญิง ' + fem + ' = ' + tot + ' ตรงกัน' : 'ชายบวกหญิงไม่เท่ากับยอดรวม ตรวจจากเอกสาร') + (date ? ' · ข้อมูล ณ ' + fx(date).trim() : '') + ' · นับรวมลูกจ้างและพนักงานทำความสะอาดด้วย' + (teachers ? ' (ข้าราชการครู ' + teachers + ' คน)' : ''));
        }
      }
      if (out.fields.staff) break;
    }

    // 5) ครูแนะแนว: แถว "แนะแนว a b c รวม" ในตารางครูตามกลุ่มสาระ
    for (const p of P.slice(0, 30)) {
      if (!/กลุ่มสาระการเรียนรู้/.test(p.loose.join(' '))) continue;
      const i = p.loose.findIndex((l) => /^แนะแนว\s+[\d-]+(\s+[\d-]+){2,3}$/.test(l));
      if (i >= 0) { const nums = p.loose[i].split(' ').slice(1).map((x) => (x === '-' ? 0 : num(x))); const tot = nums[nums.length - 1];
        out.fields.guidance = tot; out.evidence.push({ key: 'guidance', label: 'ครูกลุ่มสาระแนะแนว', value: tot + ' คน', page: p.n, snippet: p.lines[i], conf: 'medium', note: 'ใช้ประกอบการตอบว่ามีผู้ดูแลสุขภาพจิต/แนะแนวหรือไม่ ไม่ได้แปลว่ามีนักจิตวิทยาประจำโรงเรียน' }); break; }
    }

    // 6) โครงการที่เกี่ยวกับความปลอดภัย (ตารางแผนงาน/โครงการ)
    out.projects = parseProjects(P, fx);

    // 7) ข้อสังเกตจากเนื้อหาแผน (พบ/ไม่พบคำสำคัญ ไม่ใช่การยืนยันว่าโรงเรียนมีหรือไม่มี)
    const all = P.map((p) => p.loose.join(' ')).join(' ');
    const has = (re) => re.test(all);
    const hint = (id, label, re, foundTxt, missTxt) => out.hints.push({ id, label, found: has(re), note: has(re) ? foundTxt : missTxt });
    hint('D1', 'แผนความปลอดภัยหรือแผนเผชิญเหตุ', /เผชิญเหตุ|แผนความปลอดภัย|แผนฉุกเฉิน/, 'พบคำว่าแผนเผชิญเหตุ/แผนความปลอดภัยในแผนปฏิบัติการ', 'ไม่พบคำว่าแผนเผชิญเหตุหรือแผนความปลอดภัยในแผนปฏิบัติการ (อาจมีเป็นเอกสารแยก)');
    hint('D2', 'คำสั่งแต่งตั้งผู้รับผิดชอบงานความปลอดภัย', /งานความปลอดภัย|ผู้รับผิดชอบงานความปลอดภัย|เวรยาม/, 'พบงานความปลอดภัยและผู้รับผิดชอบในตารางโครงการ (ยังไม่ใช่หลักฐานคำสั่งแต่งตั้ง)', 'ไม่พบงานความปลอดภัยในแผน');
    hint('D3', 'ช่องทางรับแจ้งเหตุ', /รับแจ้งเหตุ|แจ้งเหตุ|สายด่วน|กล่องรับเรื่อง/, 'พบคำที่เกี่ยวกับการแจ้งเหตุ', 'ไม่พบคำที่เกี่ยวกับช่องทางแจ้งเหตุในแผน');
    hint('D4', 'แนวปฏิบัติเมื่อเกิดเหตุ', /แนวปฏิบัติเมื่อเกิดเหตุ|ขั้นตอนการปฏิบัติเมื่อเกิดเหตุ|อพยพ|ซ้อมแผน/, 'พบคำที่เกี่ยวกับแนวปฏิบัติ/การอพยพ/การซ้อมแผน', 'ไม่พบคำที่เกี่ยวกับแนวปฏิบัติเมื่อเกิดเหตุหรือการซ้อมแผนในแผน');
    hint('D5', 'ระบบติดตามและรายงานผล', /กากับ\s*ตรวจสอบ\s*และรายงาน|ติดตามและรายงาน|ติดตามประเมินผล/, 'พบหัวข้อกำกับ ตรวจสอบ และรายงานของแผน (ระดับโรงเรียน ไม่เฉพาะความปลอดภัย)', 'ไม่พบหัวข้อติดตามและรายงานผลในแผน');
    // โครงสร้างแผนที่ใช้เป็นหลักฐานประกอบ 7-S (ไม่ใช่คะแนน)
    out.sevenEvidence = [
      ['STG', 'กลยุทธ์', /วิสัยทัศน์|พันธกิจ|ยุทธศาสตร์|กลยุทธ์/],
      ['STR', 'โครงสร้าง', /โครงสร้างการบริหาร|โครงสร้างองค์กร|กลุ่มบริหารงาน/],
      ['SYS', 'ระบบ', /ระบบงาน|ระบบดูแลช่วยเหลือ|ระบบประกันคุณภาพ/],
      ['STY', 'รูปแบบการบริหาร', /การมีส่วนร่วม|ภาวะผู้นำ|รูปแบบการบริหาร/],
      ['STF', 'บุคลากร', /จานวนบุคลากร|ครูและบุคลากร/],
      ['SKL', 'ทักษะ', /วุฒิการศึกษา|พัฒนาครู|พัฒนาบุคลากร/],
      ['VAL', 'ค่านิยมร่วม', /ค่านิยม|ปรัชญา|คติธรรม|เอกลักษณ์|อัตลักษณ์/],
    ].map((e) => ({ code: e[0], name: e[1], found: e[2].test(all) }));

    // หลักฐานประกอบรายข้อของ 7-S: พบ/ไม่พบคำในแผน พร้อมหน้าและข้อความ ไม่ใช่คะแนน D หรือ I
    // (แผนปฏิบัติการบอกสิ่งที่วางแผนไว้ ไม่ได้บอกว่าปฏิบัติจริงเพียงใด จึงไม่ให้คะแนนและไม่เสนอคะแนนเริ่มต้น) เลือกเฉพาะข้อที่แผนอาจมีร่องรอยเอกสาร
    const ITEM_EV = [
      ['STG1', /แผนความปลอดภัย|แผนเผชิญเหตุ|แผนฉุกเฉิน/, ''],
      ['STR1', /คาสั่งแต่งตั้ง|คณะทางาน.{0,20}ความปลอดภัย|คณะกรรมการ.{0,20}ความปลอดภัย/, 'ยังไม่ใช่หลักฐานคำสั่งแต่งตั้งที่ลงนามแล้ว'],
      ['STR5', /ประชุม.{0,25}ความปลอดภัย|ความปลอดภัย.{0,25}ประชุม/, ''],
      ['SYS1', /รับแจ้งเหตุ|แจ้งเหตุ|สายด่วน|กล่องรับเรื่อง/, 'ยังไม่ทราบจำนวนช่องทางและช่องทางที่ไม่ใช้อุปกรณ์ดิจิทัล'],
      ['SYS5', /ซักซ้อม|ซ้อมแผน|ซ้อมอพยพ|อพยพ|ซ้อมดับเพลิง/, 'ยังไม่ทราบว่าซักซ้อมจริงอย่างน้อยปีละครั้งหรือไม่'],
      ['STF2', /ห้องพยาบาล|พยาบาล|นักจิตวิทยา|ครูแนะแนว|งานแนะแนว/, 'ไม่ได้แปลว่ามีผู้รับผิดชอบเฉพาะด้านสุขภาพกายและสุขภาพจิต'],
      ['STF4', /เวรยาม|ยามรักษา|รปภ|รักษาการณ์/, 'ยังไม่ทราบว่าอัตรากำลังเพียงพอในช่วงเวลาเสี่ยงหรือไม่'],
      ['SKL3', /ปฐมพยาบาล|ช่วยฟื้นคืนชีพ|CPR/, ''],
      ['SKL6', /พัฒนาครู|พัฒนาบุคลากร|อบรมครู/, 'เป็นแผนพัฒนาทั่วไป ไม่แน่ว่าเฉพาะด้านความปลอดภัย'],
      ['STY4', /กากับ\s*(ติดตาม|ตรวจสอบ)|ติดตามประเมินผล|ติดตามและรายงาน/, 'เป็นหัวข้อกำกับของแผนทั้งโรงเรียน ไม่เฉพาะด้านความปลอดภัย'],
    ];
    out.itemEvidence = {};
    ITEM_EV.forEach((e) => {
      let hit = null;
      for (const p of P) { const i = p.loose.findIndex((l) => e[1].test(l)); if (i >= 0) { hit = { page: p.n, snippet: fx(p.lines[i]).slice(0, 120) }; break; } }
      out.itemEvidence[e[0]] = hit ? { found: true, page: hit.page, snippet: hit.snippet, note: e[2] } : { found: false, note: e[2] };
    });
    const bp = out.projects.filter((x) => !x.soft && x.amount > 0);
    out.itemEvidence.STG4 = bp.length ? { found: true, page: bp[0].page, snippet: 'พบโครงการด้านความปลอดภัย ' + bp.length + ' รายการ งบรวม ' + bp.reduce((a, x) => a + x.amount, 0).toLocaleString('en-US') + ' บาท (ตามรายการที่ระบบเลือกให้ ท่านตรวจในการ์ดโครงการ)', note: 'ไม่ได้แปลว่าแผนความปลอดภัยของโรงเรียนระบุงบไว้ชัดเจน' } : { found: false, note: '' };

    out.missing = ['name', 'students', 'staff', 'province', 'fiscalYear'].filter((k) => out.fields[k] == null);
    out.empty = out.textChars < 200 * Math.max(1, P.length) * 0.05;   // ไม่มีชั้นข้อความ (น่าจะเป็นภาพสแกน)
    return out;
  }

  // ผลรวมงบที่ผู้ใช้เลือกกับช่วงงบตามแบบสอบถามของระบบรวบรวมข้อมูล
  function budgetBand(total) {
    if (!total || total <= 0) return 'ไม่มีงบเฉพาะด้านความปลอดภัย';
    if (total <= 10000) return 'ไม่เกิน 10,000 บาทต่อปี';
    if (total <= 50000) return '10,001–50,000 บาทต่อปี';
    if (total <= 100000) return '50,001–100,000 บาทต่อปี';
    return 'มากกว่า 100,000 บาทต่อปี';
  }

  const api = { hasArtefact, fixThai, loose, linesFromItems, parse, parseProjects, classify, budgetBand, DOM_NAME };
  if (isNode) module.exports = api; else root.RS_PLAN = api;
})(typeof window !== 'undefined' ? window : this);
