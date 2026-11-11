/* R²-SAFE: เล่มแผนปฏิบัติการด้านความปลอดภัยสถานศึกษา (A4 แนวนอน ตัวอักษร TH Sarabun New สารบัญ ตัวเลขไทย)
   รูปแบบตารางโครงการอ้างอิงจาก "แผนการปฏิบัติการความปลอดภัย ปีงบประมาณ พ.ศ. 2566 กระทรวงศึกษาธิการ"
   (ระยะเวลา | ชื่อโครงการ | หลักการ | วัตถุประสงค์ | การดำเนินการ | การติดตาม/ประเมินผล)
   ความสอดคล้องกับ 7 มาตรการของประกาศ ศธ. ลงวันที่ 10 สิงหาคม 2569 มาจาก moe.js
   ไฟล์นี้ไม่ส่งข้อมูลไปที่ใด build() เป็นฟังก์ชันล้วน ทดสอบด้วย node ได้ ส่วน mount() ใช้ DOM เพื่อวัดความสูงและแบ่งหน้า */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;

  // ---------- ตัวเลขไทย (คงรหัส SB-xxx, R1–R9, 7-S, ISO 31000 เบอร์ฉุกเฉิน และ URL กับ DOI ในรายการอ้างอิงไว้) ----------
  const TH = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  const KEEP = /(&#\d+;|https?:\/\/[^\s<]+|10\.\d{4,9}\/[^\s<]+|SB-\d+|\bR\d\b|\b[VAPH]\d\b|7-S|ISO 31000|\b(?:191|1669|199)\b)|\d/g;
  const thaiDigits = (s) => String(s).replace(KEEP, (m, k) => k || TH[+m]);
  const thaiText = (html) => String(html).split(/(<[^>]+>)/).map((p) => (p.charAt(0) === '<' ? p : thaiDigits(p))).join('');

  const EVG = { A: 'A', B: 'B', C: 'C', D: 'D' };
  const REFS = [
    'ประกาศกระทรวงศึกษาธิการ เรื่อง มาตรการความปลอดภัยของสถานศึกษา ลงวันที่ 10 สิงหาคม 2569 (ผู้จัดทำสรุปจากภาพสแกนของประกาศ ไม่ใช่ข้อความทางการ ตรวจกับฉบับจริงก่อนอ้างอิง)',
    'กระทรวงศึกษาธิการ. แผนการปฏิบัติการความปลอดภัย ปีงบประมาณ พ.ศ. 2566 (ตัวชี้วัด "ระดับความสำเร็จในการจัดการศึกษาเพื่อความปลอดภัย" ตามประกาศนโยบายและจุดเน้นของกระทรวงศึกษาธิการ ลงวันที่ 29 ธันวาคม 2564 และรูปแบบตารางโครงการ)',
    'ISO 31000 การบริหารความเสี่ยง (ใช้ในการให้คะแนนความเสี่ยง L × C)',
    'McKinsey 7-S Framework (ใช้ในการประเมินความพร้อมขององค์กร)',
    'ระบบ Risk Safe (R²-SAFE) ต้นแบบงานวิจัยดุษฎีนิพนธ์ มหาวิทยาลัยสยาม (กลุ่มแนวทาง R1–R9 และคลังมาตรการฉบับร่าง ยังไม่ผ่านเดลฟาย)',
  ];

  // ---------- การแบ่งหน้า (ฟังก์ชันล้วน) ----------
  // blocks: [{t:'html'} | {t:'table'}]  ms: ความสูงที่วัดได้ (html = ตัวเลข, table = {head, rows:[...]})  คืนค่าเป็นรายการหน้า
  function layout(blocks, ms, maxH) {
    const pages = []; let cur = [], used = 0;
    const flush = () => { if (cur.length) pages.push(cur); cur = []; used = 0; };
    // block ที่มี keep (หัวข้อและคำนำของตาราง) ต้องอยู่หน้าเดียวกับส่วนแรกของ block ถัดไป ไม่ปล่อยหัวข้อค้างท้ายหน้า
    const minOf = (j) => { const x = blocks[j]; if (!x) return 0; return x.t === 'html' ? ms[j] : (ms[j].rows.length ? ms[j].head + ms[j].rows[0] : 0); };
    blocks.forEach((b, i) => {
      if (b.t === 'html') {
        let need = ms[i];
        if (b.keep) { let j = i + 1; while (blocks[j] && blocks[j].t === 'html' && blocks[j].keep) { need += ms[j]; j++; } need += minOf(j); }
        if (used + need > maxH && used > 0) flush();
        cur.push({ b: i, from: 0, to: 1 }); used += ms[i]; return;
      }
      const head = ms[i].head, rows = ms[i].rows; let from = 0;
      while (from < rows.length) {
        if (used + head + rows[from] > maxH && used > 0) flush();
        let u = used + head, to = from;
        while (to < rows.length && (to === from || u + rows[to] <= maxH)) { u += rows[to]; to++; }
        cur.push({ b: i, from, to }); used = u; from = to;
        if (from < rows.length) flush();
      }
    });
    flush(); return pages;
  }

  // ---------- เนื้อหาเล่ม ----------
  function build(ctx) {
    const esc = ctx.esc, out = ctx.out, sc = ctx.school || {}, MOE = ctx.MOE, EVD = ctx.EVD, st = (k) => (ctx.status && ctx.status[k]) || 'ยังไม่เริ่ม';
    const rows = []; out.domains.forEach((d) => (d.measures || []).forEach((m) => rows.push({ d, m, key: ctx.mKey(d.code, m.id) })));
    const sbOf = (m) => m.sb || m.id, name = sc.name || 'โรงเรียนตัวอย่าง', year = sc.year || '';
    const blank = (n) => '<span class="pbdot" style="min-width:' + (n || 90) + 'px"></span>';
    const cb = (t) => '<span class="pbcb"></span>' + t;
    const kv = (pairs) => '<table class="pbt kv"><tbody>' + pairs.map((p) => '<tr><th>' + p[0] + '</th><td>' + p[1] + '</td></tr>').join('') + '</tbody></table>';
    const today = (ctx.today || new Date()).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    const dom = (code) => ctx.domName(code);

    const firstBySb = (arr) => { const seen = {}; return arr.filter((r) => { const k = sbOf(r.m); if (seen[k]) return false; seen[k] = true; return true; }); };
    const nUnique = firstBySb(rows).length;
    // ความสอดคล้องกับ 7 มาตรการ: มาตรการในแผนที่ตอบสนองแต่ละข้อ
    const moeRows = MOE.ITEMS.map((it) => ({ it, hit: firstBySb(rows.filter((r) => it.sb.indexOf(sbOf(r.m)) >= 0)) }));
    const covered = moeRows.filter((x) => x.hit.length > 0).length;
    const done = rows.filter((r) => st(r.key) === 'เสร็จแล้ว').length, complete = rows.filter((r) => r.m.owner && r.m.kpi).length;
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
    const grade = { A: 0, B: 0, C: 0, D: 0 }; firstBySb(rows).forEach((r) => { if (grade[r.m.evg] != null) grade[r.m.evg]++; });
    const srcs = {}; rows.forEach((r) => String(r.m.evsrc || '').split(';').map((x) => x.trim()).filter(Boolean).forEach((x) => { srcs[x] = (srcs[x] || 0) + 1; }));
    const srcList = Object.keys(srcs).sort();

    const H1 = (id, n, t) => ({ t: 'html', id, keep: true, html: '<h1 class="pbh1">ส่วนที่ ' + n + ' ' + t + '</h1>' });
    const H2 = (id, t) => ({ t: 'html', id, keep: true, html: '<h2 class="pbh2">' + t + '</h2>' });
    const P = (h, cls, keep) => ({ t: 'html', keep: keep !== undefined ? keep : cls === 'note', html: '<p class="pbp' + (cls ? ' ' + cls : '') + '">' + h + '</p>' });
    const T = (cls, head, rws) => ({ t: 'table', cls, head, rows: rws, html: '' });

    const sections = [];
    // ---- ส่วนที่ 1 ----
    const topGaps = (out.top3 || []).map((e) => ctx.elName(e.code)).join(' · ');
    sections.push({ id: 'p1', label: 'ส่วนที่ 1 ข้อมูลทั่วไปและผลการประเมินของโรงเรียน', blocks: [
      H1('p1', '1', 'ข้อมูลทั่วไปและผลการประเมินของโรงเรียน'),
      H2('p1-1', '1.1 ข้อมูลสถานศึกษา'),
      { t: 'html', html: kv([['ชื่อสถานศึกษา', esc(name)], ['จังหวัด', esc(sc.province || '–')], ['ปีการศึกษา', esc(year || '–')], ['จำนวนนักเรียน', sc.students ? esc(sc.students) + ' คน' + (ctx.sizeOf(+sc.students) ? ' (' + esc(ctx.sizeOf(+sc.students)) + ')' : '') : '–'], ['ครูและบุคลากร', sc.staff ? esc(sc.staff) + ' คน' : '–'], ['ทรัพยากรสำหรับงานความปลอดภัยปีนี้', esc(out.resource || '–') + (out.resourceMax ? ' (เสนอมาตรการสูงสุด ' + out.resourceMax + ' ข้อต่อด้าน)' : '')]]) },
      H2('p1-2', '1.2 ผลการประเมินความเสี่ยงและความพร้อม'),
      P('ความพร้อมขององค์กรโดยรวมตามกรอบ 7-S อยู่ในระดับ<b>' + esc(out.readyFinal || '–') + '</b>' + (isFinite(out.readyMean) ? ' (ค่าเฉลี่ย D = ' + out.readyMean.toFixed(2) + ' จาก 5)' : '') + (topGaps ? ' องค์ประกอบที่มีช่องว่างสูงสุด 3 อันดับ ได้แก่ ' + esc(topGaps) : ''), '', true),
      T('', '<tr><th>ด้านของภัย</th><th>ระดับความเสี่ยง</th><th>ระดับความพร้อม</th><th>กลุ่มแนวทาง</th><th>เริ่มดำเนินการ</th></tr>',
        out.domains.map((d) => '<tr><td>' + esc(dom(d.code)) + '</td><td class="c">' + esc(d.risk || '–') + '</td><td class="c">' + esc(d.ready || '–') + '</td><td>' + esc(d.group || '–') + (d.pkg ? ' ' + esc(d.pkg.name) : '') + '</td><td>' + (d.pkg ? esc(d.pkg.start) : '–') + '</td></tr>')),
      H2('p1-3', '1.3 หลักการและเหตุผล'),
      P('กระทรวงศึกษาธิการออกประกาศ เรื่อง มาตรการความปลอดภัยของสถานศึกษา ลงวันที่ 10 สิงหาคม 2569 ให้โรงเรียนเป็นพื้นที่ปลอดภัยอย่างแท้จริงเพื่อปกป้องผู้เรียน ครูและบุคลากรทางการศึกษาจากความรุนแรงทุกรูปแบบ โดยกำหนด 7 มาตรการ ได้แก่ ' + MOE.ITEMS.map((i) => i.n + ') ' + esc(i.title)).join(' ')),
      P(esc(name) + ' จัดทำแผนปฏิบัติการฉบับนี้จากผลการประเมินความเสี่ยงและความพร้อมด้วยระบบ Risk Safe (R²-SAFE) ซึ่งเป็นต้นแบบงานวิจัย โดยจับคู่ระดับความเสี่ยงรายด้านกับความพร้อมตามกรอบ 7-S เป็นกลุ่มแนวทาง R1–R9 แล้วคัดมาตรการจากคลังมาตรการ (ฉบับร่าง ยังไม่ผ่านเดลฟาย) พร้อมเหตุผลที่ตรวจย้อนกลับได้ ผู้อำนวยการสถานศึกษาเป็นผู้ตัดสินใจขั้นสุดท้าย และต้องตรวจสอบปรับปรุงก่อนประกาศใช้'),
    ] });
    // ---- ส่วนที่ 2 ----
    const crit = [['เป้าหมายขั้นต้น (50)', ['เร่งสร้างความปลอดภัยในสถานศึกษา ดำเนินการตามแผนและมาตรการด้านความปลอดภัยให้ผู้เรียน ครูและบุคลากรอย่างเข้มข้น', 'ศึกษา วิเคราะห์ ติดตามประเมินผล และแสวงหาสถานศึกษาที่ดำเนินการได้ดีเยี่ยม (Best Practice) เพื่อปรับปรุงและขยายผล']],
      ['เป้าหมายมาตรฐาน (75)', ['ปลูกฝังทัศนคติ พฤติกรรม และองค์ความรู้ โดยบูรณาการในการจัดการเรียนรู้ ควบคู่กับการใช้สื่อสังคมออนไลน์เชิงบวกและสร้างสรรค์', 'หาแนวทางปกป้องคุ้มครองต่อสถานการณ์ที่เกิดขึ้นกับผู้เรียน ครูและบุคลากร']],
      ['เป้าหมายขั้นสูง (100)', ['เสริมสร้างการรับรู้ ความเข้าใจ ความตระหนัก และคุณลักษณะที่พึงประสงค์ด้านสิ่งแวดล้อม รวมทั้งการปรับตัวรองรับการเปลี่ยนแปลงสภาพภูมิอากาศ', 'เร่งพัฒนาบทบาทและภารกิจของหน่วยงานด้านความปลอดภัยที่มีอยู่']]];
    sections.push({ id: 'p2', label: 'ส่วนที่ 2 ตัวชี้วัดและความสอดคล้องกับมาตรการของกระทรวงศึกษาธิการ', blocks: [
      H1('p2', '2', 'ตัวชี้วัดและความสอดคล้องกับมาตรการของกระทรวงศึกษาธิการ'),
      H2('p2-1', '2.1 ตัวชี้วัดตามนโยบายและจุดเน้นของกระทรวงศึกษาธิการ ด้านการจัดการศึกษาเพื่อความปลอดภัย (ต้นแบบ)'),
      P('ที่มา: แผนการปฏิบัติการความปลอดภัย ปีงบประมาณ พ.ศ. 2566 กระทรวงศึกษาธิการ ใช้เป็นต้นแบบรูปแบบตัวชี้วัดและเกณฑ์ ผู้จัดทำควรตรวจสอบกับตัวชี้วัดของปีปัจจุบันจากต้นสังกัดก่อนใช้จริง', 'note'),
      { t: 'html', html: kv([['ชื่อตัวชี้วัด', 'ระดับความสำเร็จในการจัดการศึกษาเพื่อความปลอดภัย'], ['คำอธิบาย', 'เร่งสร้างความปลอดภัยในสถานศึกษาเพื่อเพิ่มความเชื่อมั่นของสังคม โดยดำเนินการตามแผนและมาตรการอย่างเข้มข้น · ปลูกฝังทัศนคติ พฤติกรรม และองค์ความรู้โดยบูรณาการในการเรียนรู้ · เสริมสร้างการรับรู้ด้านสิ่งแวดล้อมและการปรับตัวต่อการเปลี่ยนแปลงสภาพภูมิอากาศ · พัฒนาบทบาทและภารกิจของหน่วยงานด้านความปลอดภัย'], ['กลุ่มเป้าหมาย', 'นักเรียน นักศึกษา ครูและบุคลากรทางการศึกษา สถานศึกษา และหน่วยงานทางการศึกษา'], ['ค่าเป้าหมาย (ปีงบประมาณ 2566)', 'ร้อยละ 100']]) },
      T('crit', '<tr><th style="width:20%">ระดับ</th><th>เกณฑ์การประเมิน</th><th style="width:20%">ผลของโรงเรียน (กรอกเมื่อสิ้นสุดปี)</th></tr>',
        crit.map((c) => '<tr><td><b>' + c[0] + '</b></td><td><ol class="pbol">' + c[1].map((x) => '<li>' + x + '</li>').join('') + '</ol></td><td class="c">' + cb('บรรลุ') + '</td></tr>')),
      H2('p2-2', '2.2 ความสอดคล้องของแผนนี้กับ 7 มาตรการของกระทรวงศึกษาธิการ (ประกาศ 10 สิงหาคม 2569)'),
      P('แผนนี้มีโครงการรองรับ ' + covered + ' จาก ' + MOE.ITEMS.length + ' มาตรการ ข้อที่ไม่มีโครงการรองรับต้องพิจารณาเพิ่มโครงการ (การจับคู่เป็นการประเมินของผู้วิจัย ยังไม่ผ่านผู้เชี่ยวชาญ)', '', true),
      T('moe', '<tr><th style="width:5%">ข้อ</th><th style="width:22%">มาตรการของกระทรวง</th><th style="width:34%">โครงการในแผนนี้ที่ตอบสนอง</th><th style="width:27%">ข้อสังเกต</th><th style="width:12%">สถานะของโรงเรียน</th></tr>',
        moeRows.map((x) => { const li = x.hit.slice(0, 5).map((r) => '<li>' + esc(sbOf(r.m)) + ' ' + esc(r.m.name) + '</li>').join('') + (x.hit.length > 5 ? '<li>และอีก ' + (x.hit.length - 5) + ' โครงการ</li>' : '');
          return '<tr><td class="c">' + x.it.n + '</td><td>' + esc(x.it.title) + '</td><td>' + (x.hit.length ? '<ul class="pbul">' + li + '</ul>' : '<b>ยังไม่มีโครงการรองรับในแผนนี้</b>') + '</td><td><small>' + (x.hit.length ? 'มี ' + x.hit.length + ' โครงการ · ' : '') + 'ที่ยังไม่ครอบคลุม: ' + esc(x.it.gaps[0]) + '</small></td><td class="c">' + esc((ctx.moeStatus && ctx.moeStatus[x.it.n]) || 'ยังไม่ได้ตรวจ') + '</td></tr>'; })),
      H2('p2-3', '2.3 ตัวชี้วัดความสำเร็จของแผนปฏิบัติการนี้'),
      T('', '<tr><th style="width:36%">ตัวชี้วัด</th><th style="width:16%">ค่าเป้าหมาย</th><th style="width:18%">ข้อมูลปัจจุบัน</th><th>วิธีวัดและผู้รับผิดชอบ</th></tr>', [
        '<tr><td>ร้อยละของโครงการในแผนที่ดำเนินการเสร็จ</td><td class="c">ร้อยละ 100 (ปรับได้)</td><td class="c">' + done + ' จาก ' + rows.length + ' (ร้อยละ ' + pct(done, rows.length) + ')</td><td>ติดตามจากสถานะในแผน โดยคณะทำงานความปลอดภัย</td></tr>',
        '<tr><td>จำนวนมาตรการตามประกาศ ศธ. ที่มีโครงการรองรับในแผน</td><td class="c">' + MOE.ITEMS.length + ' จาก ' + MOE.ITEMS.length + ' ข้อ</td><td class="c">' + covered + ' จาก ' + MOE.ITEMS.length + ' ข้อ</td><td>ตรวจตามตารางข้อ 2.2 ก่อนอนุมัติแผน โดยผู้อำนวยการ</td></tr>',
        '<tr><td>ร้อยละของโครงการที่ระบุผู้รับผิดชอบและตัวชี้วัดครบ</td><td class="c">ร้อยละ 100</td><td class="c">ร้อยละ ' + pct(complete, rows.length) + '</td><td>ตรวจเมื่ออนุมัติแผน โดยคณะทำงานความปลอดภัย</td></tr>',
        '<tr><td>ระดับความสำเร็จตามตัวชี้วัดของกระทรวง (ข้อ 2.1)</td><td class="c">ตามเกณฑ์ที่โรงเรียนกำหนด</td><td class="c">' + cb('ขั้นต้น') + '<br>' + cb('มาตรฐาน') + '<br>' + cb('ขั้นสูง') + '</td><td>ประเมินเมื่อสิ้นสุดปีการศึกษา โดยผู้อำนวยการและคณะทำงาน</td></tr>']),
      P('ค่าเป้าหมายเป็นข้อเสนอเริ่มต้น โรงเรียนปรับให้เหมาะสมกับบริบทของตน', 'note'),
    ] });
    // ---- ส่วนที่ 3 ----
    const planRow = (r, i) => {
      const d = r.d, m = r.m, mo = MOE.forSb(sbOf(m)), ev = EVG[m.evg] || 'D';
      return '<tr><td class="c">' + esc(d.pkg.start) + '<br><small>เริ่ม ' + blank(60) + '</small></td>' +
        '<td><b>' + (i + 1) + '. ' + esc(m.name) + '</b><br><small>' + esc(sbOf(m)) + ' · ' + esc(dom(d.code)) + ' · กลุ่ม ' + esc(d.group) + '</small><br><small>ผู้รับผิดชอบ: ' + esc(m.owner) + '</small><br><small>ฐานแนวคิด: CSSF ' + esc(m.pillar || '') + ' (บทที่ 2 ข้อ 2.3.2)</small><br><small>หลักฐานระดับ ' + ev + (EVD.sources(m).some((x) => !x.inCh2) ? ' (บางแหล่งยังไม่อยู่ในบทที่ 2)' : '') + (mo.length ? ' · ประกาศ ศธ. ข้อ ' + mo.join(', ') : '') + '</small></td>' +
        '<td>' + esc(m.why) + '<br><small>อ้างอิง: ' + esc(EVD.srcLine(m)) + '</small></td>' +
        '<td><ol class="pbol"><li>เพื่อ' + esc(m.desc) + '</li><li>เพื่อให้' + esc(m.outcome) + '</li></ol></td>' +
        '<td><ol class="pbol"><li>เสนอขออนุมัติโครงการ</li><li>ตั้งผู้รับผิดชอบและตรวจเงื่อนไขก่อนดำเนินการ (' + esc(m.prereq) + ')</li><li>ดำเนินกิจกรรม: ' + esc(m.desc) + '</li><li>เก็บหลักฐาน: ' + esc(m.output) + '</li></ol></td>' +
        '<td>ตัวชี้วัด: ' + esc(m.kpi) + '<br>ค่าเป้าหมาย ' + blank(50) + '<br>ทบทวน: ' + esc(d.pkg.review) + '<br>สถานะ: ' + esc(st(r.key)) + '</td></tr>';
    };
    sections.push({ id: 'p3', label: 'ส่วนที่ 3 แผนปฏิบัติการ', blocks: [
      H1('p3', '3', 'แผนปฏิบัติการด้านความปลอดภัยสถานศึกษา'),
      P('โครงการหรือมาตรการ ' + rows.length + ' รายการ (' + nUnique + ' มาตรการไม่ซ้ำ เพราะบางมาตรการใช้ร่วมกันหลายด้านของภัยจึงปรากฏหลายแถว) เรียงตามด้านของภัย ระยะเวลาเป็นช่วงที่ตารางตัดสินใจแนะนำ นับจากวันที่อนุมัติแผน โรงเรียนระบุวันที่เริ่มและค่าเป้าหมายเอง ตัวชี้วัดและผู้รับผิดชอบเป็นข้อเสนอเริ่มต้นจากคลังมาตรการ ผู้อำนวยการปรับได้', 'note'),
      T('pbplan', '<tr><th style="width:9%">ระยะเวลา</th><th style="width:17%">ชื่อโครงการ</th><th style="width:19%">หลักการ</th><th style="width:17%">วัตถุประสงค์</th><th style="width:20%">การดำเนินการ</th><th style="width:18%">การติดตาม/ประเมินผล</th></tr>', rows.map(planRow)),
    ] });
    // ---- ส่วนที่ 4 ----
    const sig = (role) => '<td class="sig"><div class="sigline"></div>(' + blank(150) + ')<br>' + role + '<br>วันที่ ' + blank(100) + '</td>';
    sections.push({ id: 'p4', label: 'ส่วนที่ 4 การติดตาม ประเมินผล และการอนุมัติ', blocks: [
      H1('p4', '4', 'การติดตาม ประเมินผล และการอนุมัติ'),
      H2('p4-1', '4.1 การติดตามผล'),
      T('', '<tr><th>ด้านของภัย</th><th>กลุ่มแนวทาง</th><th>รอบทบทวน</th><th>ผู้ติดตาม</th></tr>', out.domains.filter((d) => d.pkg).map((d) => '<tr><td>' + esc(dom(d.code)) + '</td><td>' + esc(d.group) + '</td><td>' + esc(d.pkg.review) + '</td><td>คณะทำงานความปลอดภัย</td></tr>')),
      H2('p4-2', '4.2 การประเมินผลและการรายงาน'),
      { t: 'html', html: '<ol class="pbol"><li>ประเมินผลตามตัวชี้วัดความสำเร็จของแผน (ข้อ 2.3) และตัวชี้วัดของกระทรวง (ข้อ 2.1) เมื่อสิ้นสุดปีการศึกษา</li><li>บันทึกการทบทวนหลังดำเนินการ (AAR) ทุกรอบทบทวน และนำผลไปปรับแผนรอบถัดไป</li><li>รายงานผลต่อผู้อำนวยการสถานศึกษาและต้นสังกัดตามระเบียบ</li></ol>' },
      H2('p4-3', '4.3 การอนุมัติแผน'),
      { t: 'html', html: '<table class="pbt sigt"><tbody><tr>' + sig('ผู้เสนอแผน (ผู้รับผิดชอบงานความปลอดภัย)') + sig('ผู้เห็นชอบ') + sig('ผู้อนุมัติ (ผู้อำนวยการสถานศึกษา)') + '</tr></tbody></table>' },
    ] });
    // ---- ภาคผนวก ----
    // ---- ภาคผนวก ----
    const measures = rows.map((r) => r.m), usedKeys = EVD.refsUsed(measures), miss = EVD.notInCh2(measures), allSrc = {};
    measures.forEach((m) => EVD.sources(m).forEach((x) => { (allSrc[x.src] = allSrc[x.src] || { x, sb: [] }).sb.push(m.sb || m.id); }));
    const srcNames = Object.keys(allSrc).sort((p, q) => (allSrc[q].x.inCh2 - allSrc[p].x.inCh2) || (p < q ? -1 : 1));
    sections.push({ id: 'pa', label: 'ภาคผนวก เอกสารอ้างอิงและหลักฐานทางวิชาการ', blocks: [
      { t: 'html', id: 'pa', keep: true, html: '<h1 class="pbh1">ภาคผนวก เอกสารอ้างอิงและหลักฐานทางวิชาการ</h1>' },
      H2('pa-1', 'ก. เอกสารอ้างอิง'),
      { t: 'html', html: '<ol class="pbol">' + REFS.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>' },
      P('เอกสารจากบทที่ 2 ของดุษฎีนิพนธ์ที่ใช้เป็นฐานของแผนนี้ (รายการอ้างอิงตามโครงร่างดุษฎีนิพนธ์ฉบับ v16 ข้อความในวงเล็บคือข้อของบทที่ 2 รายการที่ยังขาดเลขหน้าหรือ DOI มีวงเล็บเหลี่ยมกำกับ ต้องตรวจก่อนอ้างอิงในเอกสารทางการ)', 'note', true),
      { t: 'html', html: '<ol class="pbol">' + usedKeys.map((k) => '<li>' + esc(EVD.REFS[k].full) + ' (ข้อ ' + EVD.REFS[k].sec + ')</li>').join('') + '</ol>' },
      H2('pa-2', 'ข. หลักฐานทางวิชาการของผลมาตรการในแผนนี้'),
      P('ระดับหลักฐานของ ' + nUnique + ' มาตรการ (ไม่ซ้ำ) ในแผน: ระดับ A (มีงานทบทวนเชิงระบบรองรับ) ' + grade.A + ' · ระดับ B (รองรับบางส่วนหรือผลผสม) ' + grade.B + ' · ระดับ C (มีนโยบายหรือกฎหมายรองรับ ยังไม่มีงานวัดผล) ' + grade.C + ' · ระดับ D (ยังไม่พบหลักฐาน เป็นข้อเสนอของผู้วิจัย) ' + grade.D, '', true),
      P('แหล่งหลักฐานผลของมาตรการที่อยู่ในคลังมาตรการ ' + srcNames.length + ' แหล่ง อยู่ในบทที่ 2 ' + srcNames.filter((k) => allSrc[k].x.inCh2).length + ' แหล่ง' + (Object.keys(miss).length ? ' ส่วน ' + Object.keys(miss).length + ' แหล่งยังไม่อยู่ในบทที่ 2 และรายการอ้างอิง ต้องเพิ่มและตรวจที่มาก่อนอ้างอิงในเอกสารทางการ' : ' (ข้อ 2.9.4 ตารางที่ 2.5) ผลหลักได้จากบทคัดย่อและการค้นเว็บ ผู้วิจัยยังไม่ได้อ่านเนื้อเต็ม') , 'note', true),
      T('srcs', '<tr><th style="width:26%">แหล่ง (ชื่อย่อตามคลังมาตรการ)</th><th style="width:26%">สถานะในบทที่ 2</th><th>โครงการในแผนที่ใช้แหล่งนี้</th></tr>',
        srcNames.map((k) => '<tr><td>' + esc(k) + '</td><td>' + (allSrc[k].x.inCh2 ? 'อยู่ในบทที่ 2 ข้อ ' + allSrc[k].x.sec : '<b>ยังไม่อยู่ในบทที่ 2</b>') + '</td><td><small>' + esc(Array.from(new Set(allSrc[k].sb)).join(', ')) + '</small></td></tr>')),
      H2('pa-3', 'ค. ต้นแบบการพัฒนากลยุทธ์ความปลอดภัยในโรงเรียนไทย (ตารางที่ 2.1 ของบทที่ 2)'),
      P('ผลหลักมาจากบทคัดย่อของแต่ละงาน ผู้วิจัยดุษฎีนิพนธ์ยังต้องยืนยันด้วยการอ่านเนื้อเต็ม และผลของงานเหล่านี้เป็นชุดกลยุทธ์หรือรูปแบบสำหรับพื้นที่ที่ศึกษา ไม่ใช่หลักฐานว่ามาตรการแต่ละข้อได้ผลในโรงเรียนอื่น', 'note', true),
      T('thai', '<tr><th style="width:22%">ผู้วิจัย (ปี)</th><th style="width:28%">บริบทและกลุ่มตัวอย่าง</th><th style="width:22%">วิธีวิจัย</th><th>ผลหลักจากบทคัดย่อ</th></tr>',
        EVD.THAI.map((t) => '<tr><td>' + esc(t.who) + '</td><td>' + esc(t.ctx) + '</td><td>' + esc(t.method) + '</td><td>' + esc(t.result) + '</td></tr>')),
      P('หมายเหตุ: คลังมาตรการเป็นฉบับร่างที่ยังไม่ผ่านเดลฟายและการตรวจหลักฐานรายข้อโดยผู้เชี่ยวชาญ ระดับ C และ D ควรเริ่มแบบนำร่องและติดตามตัวชี้วัด ก่อนอ้างอิงในเอกสารทางการ ควรตรวจรายการอ้างอิงฉบับเต็มของแต่ละแหล่ง', 'note'),
    ] });

    // สารบัญ
    const toc = [];
    sections.forEach((s) => { toc.push({ id: s.id, label: s.label, level: 0 }); s.blocks.forEach((b) => { if (b.id && b.id !== s.id && /^h2/.test((b.html || '').replace('<', '').trim()) ) toc.push({ id: b.id, label: b.html.replace(/<[^>]+>/g, ''), level: 1 }); }); });
    const cover = '<div class="pbcover"><div class="pbcl">' + (ctx.logo || '') + '</div><div class="pbct">แผนปฏิบัติการด้านความปลอดภัยสถานศึกษา</div><div class="pbcs">ปีการศึกษา ' + esc(year) + '</div><div class="pbcn">' + esc(name) + '</div>' + (sc.province ? '<div class="pbcs">จังหวัด' + esc(sc.province) + '</div>' : '') +
      '<div class="pbdraft">ฉบับร่างจากระบบ Risk Safe (R²-SAFE) ต้นแบบงานวิจัย<br>ต้องได้รับการพิจารณา ปรับปรุง และอนุมัติโดยผู้อำนวยการสถานศึกษาก่อนประกาศใช้</div><div class="pbcf">จัดทำเมื่อ ' + today + '</div></div>';
    return { meta: { name, nameEsc: esc(name), year, today, rows: rows.length, unique: nUnique, covered, grade }, sections, toc, cover, rows };
  }

  // ---------- ประกอบหน้า (ต้องใช้ DOM) ----------
  function pageHtml(num, inner, model) {
    return '<section class="bpage"><div class="pbtop">หน้า ' + num + '</div><div class="pbbody">' + inner + '</div><div class="pbfoot">แผนปฏิบัติการด้านความปลอดภัยสถานศึกษา · ' + model.meta.nameEsc + ' · ฉบับร่างจากระบบ Risk Safe</div></section>';
  }
  function mount(host, model) {
    const doc = host.ownerDocument, th = thaiText;
    const wait = (doc.fonts && doc.fonts.ready) ? doc.fonts.ready : Promise.resolve();
    return wait.then(() => {
      const mk = (cls, inner) => { const d = doc.createElement('div'); d.className = 'pbbook ' + cls; d.innerHTML = inner; doc.body.appendChild(d); return d; };
      const probe = mk('pbprobe', '<section class="bpage"><div class="pbbody"></div></section>');
      const maxH = probe.querySelector('.pbbody').clientHeight; doc.body.removeChild(probe);
      const meas = mk('pbmeasure', '<section class="bpage"><div class="pbbody pbauto"></div></section>'), flow = meas.querySelector('.pbbody');
      const mh = (html) => { const el = doc.createElement('div'); el.className = 'pbblk'; el.innerHTML = th(html); flow.appendChild(el); const h = el.offsetHeight; flow.removeChild(el); return h; };
      const tbl = (b, inner) => '<table class="pbt ' + b.cls + '"><thead>' + b.head + '</thead><tbody>' + inner + '</tbody></table>';
      const anchors = {}, contentPages = []; let pageNo = 3;
      model.sections.forEach((s) => {
        const ms = s.blocks.map((b) => { if (b.t === 'html') return mh(b.html); const h0 = mh(tbl(b, '')); return { head: h0, rows: b.rows.map((r) => Math.max(8, mh(tbl(b, r)) - h0 + 1)) }; });
        layout(s.blocks, ms, maxH).forEach((pg) => {
          const inner = pg.map((pl) => { const b = s.blocks[pl.b]; if (b.id && pl.from === 0 && anchors[b.id] == null) anchors[b.id] = pageNo; return b.t === 'html' ? '<div class="pbblk">' + b.html + '</div>' : tbl(b, b.rows.slice(pl.from, pl.to).join('')); }).join('');
          contentPages.push(pageHtml(pageNo, inner, model)); pageNo++;
        });
      });
      doc.body.removeChild(meas);
      const tocHtml = '<h1 class="pbh1 c">สารบัญ</h1><table class="pbtoc"><tbody>' + model.toc.map((e) => '<tr class="l' + e.level + '"><td>' + e.label + '</td><td class="pg">' + (anchors[e.id] != null ? anchors[e.id] : '') + '</td></tr>').join('') + '</tbody></table>';
      const all = ['<section class="bpage pbcoverpage"><div class="pbbody">' + model.cover + '</div></section>', pageHtml(2, tocHtml, model)].concat(contentPages).join('');
      host.innerHTML = th(all); host.setAttribute('data-pages', String(pageNo - 1));
      return { pages: pageNo - 1, anchors, maxH };
    });
  }

  // ตรวจว่ามีฟอนต์ติดตั้งในเครื่อง (เทียบความกว้างข้อความกับฟอนต์สำรอง)
  function hasFont(doc, family) {
    try {
      const c = doc.createElement('canvas').getContext('2d'), t = 'ทดสอบฟอนต์ไทย สารบัญ ๑๒๓ ABC', w = (f) => { c.font = '32px ' + f; return c.measureText(t).width; };
      return w('"' + family + '", monospace') !== w('monospace') || w('"' + family + '", serif') !== w('serif');
    } catch (e) { return true; }
  }

  const api = { build, layout, mount, hasFont, thaiDigits, thaiText, REFS };
  if (isNode) module.exports = api; else root.RS_PLANBOOK = api;
})(typeof window !== 'undefined' ? window : this);
