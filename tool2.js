/* Risk Safe (R²-SAFE) ต้นแบบ: หน้าจอส่วนต่อยอด 4 หน้า
   explain = กฎตัดสินใจและเหตุผล (ทำไมเลือก/ไม่เลือก) · track = ติดตามผลและบทเรียนของโรงเรียน
   evaluate = แบบประเมินนวัตกรรมสำหรับผู้บริหารและผู้เชี่ยวชาญ · lab = ห้องวิเคราะห์ของผู้วิจัย
   ทุกอย่างประมวลผลในเบราว์เซอร์ ไฟล์ที่ส่งออกอยู่ในเครื่องของผู้ใช้ ไม่มีการส่งข้อมูลไปเซิร์ฟเวอร์ใด */
(function (root) {
  'use strict';
  const L = root.RS_LEARN, V = root.RS_EVAL, Dc = root.RS_DECISION, ST = root.RS_STATS;

  function create(c, h) {
    const { S, D, E, esc, fmt, getOut } = c;
    const { ic, banner, card, lv, lvr, empty, hasData, dateTh, HZ } = h;
    const n2 = (x, d) => (typeof x === 'number' && isFinite(x) ? x.toFixed(d == null ? 2 : d) : '–');
    const pct = (x) => (typeof x === 'number' && isFinite(x) ? Math.round(x * 100) + '%' : '–');
    const WORK_KEY = 'r2safe-work-v1', FLAG_KEY = 'r2safe-save-flag';
    const tabs = (key, items, cur) => '<div class="xtabs" role="tablist">' + items.map((t) => '<button role="tab" aria-selected="' + (t[0] === cur) + '" data-act="xtab" data-k="' + key + '" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
    const chip = (t, cls) => '<span class="xchip ' + (cls || '') + '">' + t + '</span>';
    const tick = (ok) => '<span class="xt ' + (ok ? 'ok' : 'no') + '" aria-label="' + (ok ? 'ผ่าน' : 'ไม่ผ่าน') + '">' + ic(ok ? 'check' : 'info', 16) + '</span>';
    const domPick = (key, cur, out) => '<div class="hzs sm" role="group" aria-label="เลือกด้านของภัย">' + out.domains.map((d) => '<button class="hz hz-' + d.code + '" aria-pressed="' + (d.code === cur) + '" data-act="xdom" data-k="' + key + '" data-v="' + d.code + '"' + (d.group ? '' : ' disabled') + '>' + ic(HZ[d.code][1], 24) + '<b>' + HZ[d.code][0] + '</b><small>' + (d.group || '–') + '</small></button>').join('') + '</div>';
    const chips = (path, vals, labels, cur, num) => '<div class="xchips" role="radiogroup">' + vals.map((v, i) => '<button type="button" role="radio" aria-checked="' + (cur === v) + '" data-act="rate" data-path="' + path + '" data-v="' + esc(v) + '"' + (num ? ' data-n="1"' : '') + '><b>' + esc(labels ? labels[i] : v) + '</b></button>').join('') + '</div>';
    const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
    const setPath = (o, p, v) => { const k = p.split('.'); let a = o; for (let i = 0; i < k.length - 1; i++) { if (a[k[i]] == null || typeof a[k[i]] !== 'object') a[k[i]] = {}; a = a[k[i]]; } a[k[k.length - 1]] = v; };
    const FR = '<p class="warn-note">ร่างของผู้วิจัย ยังไม่ผ่านการตรวจโดยผู้เชี่ยวชาญ (เดลฟาย) ค่าและกฎทั้งหมดปรับได้ตามผลเดลฟาย</p>';
    const csvText = (rows) => '﻿' + rows.map((r) => r.map((x) => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json;charset=utf-8' })); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
    const T = () => S.track;
    const ruleOn = () => S.ui.useRules !== false;

    // ====================================================================
    // หน้า: กฎตัดสินใจและเหตุผล
    // ====================================================================
    function switchCard(out) {
      const sw = out.domains.reduce((s, d) => s + (d.swaps || []).length, 0), un = out.domains.reduce((s, d) => s + (d.unmet || []).length, 0);
      return '<div class="tcard xsw"><div><b>ตัวบังคับกฎกลยุทธ์ตามช่อง R</b><small>' + (ruleOn() ? 'เปิดอยู่: รายการมาตรการต้องตอบเงื่อนไขของช่อง R ถ้าไม่ตอบจะสลับมาตรการอันดับท้ายออกและบันทึกเหตุผล' + (hasData(out) ? ' (ตอนนี้สลับ ' + sw + ' ข้อ' + (un ? ' ไม่พบมาตรการแก้ได้ ' + un + ' เงื่อนไข' : '') + ')' : '') : 'ปิดอยู่: ใช้เฉพาะการจัดอันดับเดิม ซึ่งตรงกับเครื่องมือ Excel ต้นแบบ ตัวตรวจกฎยังรายงานว่าข้อใดไม่ตอบเงื่อนไข') + '</small></div><button type="button" role="switch" class="xswbtn" aria-checked="' + ruleOn() + '" data-act="use-rules" aria-label="เปิดหรือปิดตัวบังคับกฎ"><i></i></button></div>';
    }
    function matrixRules(out) {
      const here = {}; out.domains.forEach((d) => { if (d.group) (here[d.group] = here[d.group] || []).push(d.code); });
      const sel = S.ui.exCell || (Object.keys(here)[0]) || 'R1';
      const cell = (code) => { const k = Dc.CELLS[code], p = Dc.cellParts(code); return '<button class="xm' + (sel === code ? ' sel' : '') + ' ' + ({ 'สูง': 'xr-hi', 'กลาง': 'xr-mid', 'ต่ำ': 'xr-lo' }[p.risk]) + '" data-act="ex-cell" data-code="' + code + '" aria-pressed="' + (sel === code) + '"><b>' + code + '</b><span>' + esc(k.stance) + '</span><small>TOWS ' + k.tows + '</small>' + (here[code] ? '<em>โรงเรียนนี้: ' + here[code].map((x) => HZ[x][0]).join(', ') + '</em>' : '') + '</button>'; };
      let g = '<div class="xmx"><div class="xcorner">ความเสี่ยง ↓ · ความพร้อม →</div>' + ['ต่ำ', 'กลาง', 'สูง'].map((y) => '<div class="xh">พร้อม' + y + '</div>').join('');
      ['สูง', 'กลาง', 'ต่ำ'].forEach((r, i) => { g += '<div class="xh">เสี่ยง' + r + '</div>'; for (let j = 0; j < 3; j++) g += cell('R' + (i * 3 + j + 1)); });
      return g + '</div>';
    }
    function cellDetail(code) {
      const k = Dc.CELLS[code], p = Dc.cellParts(code), pkg = D.packages.find((x) => x.code === code) || {}, reqs = Dc.requirements(code);
      const rl = (id) => (Dc.RULES.find((r) => r.id === id) || {}).text || '';
      return '<h3 class="xh3">' + code + ' ' + esc(k.stance) + '</h3><p>' + esc(k.intent) + '</p><div class="xmeta"><span>ความเสี่ยง ' + lv(p.risk) + '</span><span>ความพร้อม ' + lvr(p.ready) + '</span><span>เริ่มดำเนินการ: <b>' + esc(pkg.start || '–') + '</b></span><span>ทบทวน: <b>' + esc(pkg.review || '–') + '</b></span></div>' +
        '<h4 class="xh4">เงื่อนไขที่รายการมาตรการของช่องนี้ต้องตอบ</h4><ul class="xl">' + reqs.map((r) => '<li>' + chip(r.src, 'blue') + ' ' + (r.min != null ? 'มี' : 'ไม่เกิน ' + r.max + ' ข้อใน') + ' <b>' + esc(Dc.PRED[r.pred].label) + '</b>' + (r.min != null ? ' อย่างน้อย ' + r.min + ' ข้อ' : '') + '<small>' + esc(rl(r.src)) + '</small></li>').join('') + '</ul>' +
        '<h4 class="xh4">ลำดับลงมือ (ทำก่อน → หลัง)</h4><ol class="xo">' + k.order.map((o) => '<li>' + esc(Dc.PRED[o].label) + '</li>').join('') + '</ol>' +
        '<div class="tgrid g2"><div class="xbox no"><b>สิ่งที่ไม่ควรทำในช่องนี้</b><ul>' + k.avoid.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div><div class="xbox warn"><b>สัญญาณที่ต้องเปลี่ยนแนวทาง</b><ul>' + k.watch.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div></div>' +
        '<p class="hint"><b>ไม่เหมาะเมื่อ:</b> ' + esc(k.notFit) + '</p><p class="hint">ป้าย TOWS (' + k.tows + ') แสดงเพื่อเทียบกับตรรกะที่มาของมาตรการ ไม่ได้ใช้คำนวณ</p>';
    }
    function tabRules(out) {
      let s = card('หลักการของกลไก', '<ol class="xo big"><li><b>ความเสี่ยงกำหนดความเร่งด่วนและความเข้มของการควบคุม</b> ความเสี่ยงสูงต้องมีมาตรการควบคุมก่อนเสมอ ความเสี่ยงต่ำต้องไม่ลงแรงเกินสัดส่วน</li><li><b>ความพร้อมกำหนดว่าต้องสร้างอะไรก่อนและทำขั้นสูงได้แค่ไหน</b> ความพร้อมต่ำต้องวางฐานก่อน ความพร้อมสูงต้องรักษาและถ่ายทอด</li><li><b>สองแกนทำงานร่วมกัน</b> ช่อง R1–R9 กำหนดลำดับก่อนหลังและสิ่งที่ไม่ควรทำ ไม่ใช่เพียงนำสองตัวแปรมาจับคู่</li></ol>' + FR, { icon: 'bulb', cls: 'blue' });
      s += card('ตาราง R1–R9: กลยุทธ์ของแต่ละช่อง', '<p class="hint">กดช่องเพื่อดูกฎ เงื่อนไข ลำดับลงมือ และสิ่งที่ไม่ควรทำ ช่องที่มีกรอบสีคือช่องที่โรงเรียนนี้อยู่ (ถ้ากรอกข้อมูลแล้ว)</p>' + matrixRules(out), { icon: 'target' });
      const sel = S.ui.exCell || (out.domains.find((d) => d.group) || {}).group || 'R1';
      s += card('รายละเอียดช่อง ' + sel, cellDetail(sel), { icon: 'clipboard' });
      s += card('กฎรายแกน 6 ข้อ', '<div class="xscroll"><table class="xtb"><thead><tr><th>รหัส</th><th>เงื่อนไข</th><th>ทำไม</th></tr></thead><tbody>' + ['สูง', 'กลาง', 'ต่ำ'].map((l) => Dc.AXIS_RISK[l]).concat(['ต่ำ', 'กลาง', 'สูง'].map((l) => Dc.AXIS_READY[l])).map((a) => '<tr><td>' + chip(a.code, 'blue') + '</td><td><b>' + esc(a.title) + '</b><br>' + esc(a.text) + '</td><td>' + esc(a.why) + '</td></tr>').join('') + '</tbody></table></div>', { icon: 'doc' });
      s += '<details class="tcard xdet"><summary>กฎทั้งหมด ' + Dc.RULES.length + ' ข้อ (จัดระดับ · จับคู่มาตรการ · กลยุทธ์)</summary><div class="xscroll"><table class="xtb"><thead><tr><th>รหัส</th><th>กลุ่ม</th><th>กฎ</th><th>สถานะ</th></tr></thead><tbody>' + Dc.RULES.map((r) => '<tr><td>' + chip(r.id, 'blue') + '</td><td>' + esc(r.group) + '</td><td>' + esc(r.text) + '</td><td>' + esc(r.src) + '</td></tr>').join('') + '</tbody></table></div></details>';
      return s;
    }
    const pickDom = (out) => out.domains.find((d) => d.code === S.ui.exDom && d.group) || out.domains.find((d) => d.group);
    function gauge(label, v, min, max, cuts, unitNote, colors) {
      const pos = (x) => Math.max(0, Math.min(100, (x - min) / (max - min) * 100));
      const segs = []; let prev = min; cuts.concat([max]).forEach((cx, i) => { segs.push('<i style="left:' + pos(prev) + '%;width:' + (pos(cx) - pos(prev)) + '%;background:' + colors[i] + '"></i>'); prev = cx; });
      return '<div class="xg"><div class="xgl"><b>' + label + '</b><span>' + unitNote + '</span></div><div class="xgb">' + segs.join('') + cuts.map((cx) => '<u style="left:' + pos(cx) + '%"><s>' + cx + '</s></u>').join('') + '<em style="left:' + pos(v) + '%"><s>' + n2(v) + '</s></em></div></div>';
    }
    function tabWhy(out) {
      const dom = pickDom(out); if (!dom) return empty();
      const x = Dc.explainDomain(dom, out, D), P = out.params, b = x.boundary, w = x.why;
      let s = domPick('exDom', dom.code, out);
      s += card('ขั้นตอนที่ระบบใช้ตัดสินด้านนี้ (' + esc(HZ[dom.code][0]) + ')', '<ol class="xo big">' +
        '<li><b>ความเสี่ยง:</b> ดัชนี R = ' + n2(dom.rd) + ' จาก ' + dom.n + ' ข้อ (ต่ำ ≤ ' + P.riskLow + ' · กลาง ≤ ' + P.riskMid + ' · สูง > ' + P.riskMid + ') ' + lv(dom.risk) + (dom.override ? ' <small>ยกระดับตามกฎ C = ' + P.overrideC + ' และ L ≥ ' + P.overrideL + '</small>' : '') + '</li>' +
        '<li><b>ความพร้อม:</b> ค่าเฉลี่ย D = ' + n2(out.readyMean) + ' (ต่ำ ≤ ' + P.readyLow + ' · กลาง ≤ ' + P.readyMid + ' · สูง > ' + P.readyMid + ') ' + lvr(out.readyFinal) + (out.floorHit ? ' <small>ลดเป็นกลางตามกฎเพดาน</small>' : '') + '</li>' +
        '<li><b>ช่อง R:</b> ' + dom.group + ' ' + esc(x.cell.stance) + '</li>' +
        '<li><b>กฎที่ใช้:</b> ' + x.axes.map((a) => chip(a.code, 'blue')).join(' ') + chip('I-' + dom.group, 'blue') + ' <small>' + x.axes.map((a) => esc(a.title)).join(' · ') + '</small></li>' +
        '<li><b>คัดมาตรการ:</b> ผ่านด่าน 4 ด่าน (ด้านของภัย ระดับความเสี่ยง ระดับความพร้อม ทรัพยากร) เหลือ ' + w.pool.nPool + ' ข้อ เรียงคะแนนแล้วรับ ' + w.pool.nSelected + ' ข้อ ตามเพดาน ' + w.pool.cap + ' ข้อ ของทรัพยากร' + esc(out.resource) + '</li></ol>', { icon: 'search' });
      let g = gauge('ดัชนีความเสี่ยง R', Math.max(1, Math.min(25, dom.rd)), 1, 25, [P.riskLow, P.riskMid], 'เขียว = ต่ำ · เหลือง = กลาง · แดง = สูง', ['#d4f1cc', '#ffeaa8', '#ffd9d6']);
      g += gauge('ค่าเฉลี่ยความพร้อม D', Math.max(1, Math.min(5, out.readyMean)), 1, 5, [P.readyLow, P.readyMid], 'แดง = ต่ำ · เหลือง = กลาง · เขียว = สูง', ['#ffd9d6', '#ffeaa8', '#d4f1cc']);
      const nb = [];
      if (b.risk) { if (b.risk.override) nb.push('ความเสี่ยง: ' + esc(b.risk.notes)); [b.risk.up, b.risk.down].forEach((m) => { if (m) nb.push('ความเสี่ยงจะเป็น <b>' + m.to + '</b> ถ้า' + esc(m.rule) + ' (ห่างอีก ' + n2(m.gap) + ') ช่องจะเป็น <b>' + E.cellOf(m.to, out.readyFinal) + '</b>'); }); }
      if (b.ready) { if (b.ready.floorNote) nb.push('ความพร้อม: ' + esc(b.ready.floorNote)); [b.ready.up, b.ready.down].forEach((m) => { if (m) nb.push('ความพร้อมจะเป็น <b>' + m.to + '</b> ถ้า' + esc(m.rule) + ' (ห่างอีก ' + n2(m.gap) + ') ช่องจะเป็น <b>' + E.cellOf(dom.risk, m.to) + '</b>'); }); }
      s += card('ผลนี้ใกล้เส้นแบ่งแค่ไหน', g + (b.near ? '<p class="xwarn">' + ic('alert', 18) + ' ผลอยู่ใกล้เส้นแบ่งของ' + [b.risk && b.risk.margin != null && b.risk.margin <= Dc.NEAR.risk ? 'ความเสี่ยง (ห่าง ' + n2(b.risk.margin) + ')' : '', b.ready && b.ready.margin != null && b.ready.margin <= Dc.NEAR.ready ? 'ความพร้อม (ห่าง ' + n2(b.ready.margin) + ')' : ''].filter(Boolean).join(' และ') + ' ควรทบทวนการให้คะแนนข้อสำคัญก่อนตัดสินใจ เพราะคะแนนเปลี่ยนเล็กน้อยอาจเปลี่ยนช่อง R (เกณฑ์ใกล้เส้นแบ่ง: ดัชนีความเสี่ยงไม่เกิน ' + Dc.NEAR.risk + ' ค่าเฉลี่ย D ไม่เกิน ' + Dc.NEAR.ready + ' เป็นค่าเริ่มต้นของผู้วิจัย)</p>' : '<p class="hint">ผลอยู่ห่างเส้นแบ่งพอสมควร คะแนนเปลี่ยนเล็กน้อยไม่ทำให้ช่อง R เปลี่ยน</p>') + '<ul class="xl">' + nb.map((t) => '<li>' + t + '</li>').join('') + '</ul>', { icon: 'pulse' });
      s += card('ตรวจรายการกับกฎของช่อง ' + dom.group, '<ul class="xl chk">' + x.checks.map((k) => '<li>' + tick(k.ok) + '<span>' + chip(k.src, 'blue') + ' ' + (k.min != null ? 'ต้องมี' : 'ไม่เกิน ' + k.max + ' ข้อ') + ' <b>' + esc(k.label) + '</b>' + (k.min != null ? ' ≥ ' + k.min + ' ข้อ' : '') + ' · พบ ' + k.count + ' ข้อ' + (k.fixes.length ? '<small>ตัวเลือกที่แก้ได้ (ถูกตัดเพราะเพดาน): ' + k.fixes.map((f) => esc(f.sb + ' ' + f.name)).join('; ') + '</small>' : '') + '</span></li>').join('') + '</ul>' +
        (x.swaps.length ? '<div class="xbox warn"><b>สลับตามกฎ ' + x.swaps.length + ' ข้อ</b><ul>' + x.swaps.map((q) => '<li>เพิ่ม <b>' + esc(q.inSb || q.in || '–') + '</b>' + (q.out ? ' แทน <b>' + esc(q.outSb || q.out) + '</b>' : '') + ' ตามกฎ ' + chip(q.rule, 'blue') + ' (' + esc(q.label) + ')</li>').join('') + '</ul></div>' : '<p class="hint">การจัดอันดับเดิมตอบกฎครบทุกข้อ ไม่ต้องสลับ</p>') +
        (x.unmet.length ? '<div class="xbox no"><b>ช่องว่างของคลัง</b><ul>' + x.unmet.map((q) => '<li>' + chip(q.rule, 'blue') + ' ' + esc(q.label) + ': ' + esc(q.why) + '</li>').join('') + '</ul></div>' : ''), { icon: 'shieldcheck' });
      s += card('ลำดับลงมือตามกฎ (ไม่ใช่ลำดับคะแนน)', '<p class="hint">ลำดับของช่อง ' + dom.group + ': ' + x.cell.order.map((o) => esc(Dc.PRED[o].label)).join(' → ') + '</p><ol class="xo">' + x.sequence.map((q) => '<li><b>' + esc(q.sb + ' ' + q.name) + '</b> ' + chip(esc(q.wave), 'teal') + ' <small>อันดับตามคะแนน ' + q.dataRank + '</small></li>').join('') + '</ol>', { icon: 'calendar' });
      s += card('ทำไมจึงเลือกแต่ละมาตรการ', '<div class="xscroll"><table class="xtb"><thead><tr><th>#</th><th>มาตรการ</th><th>ด่านที่ผ่าน</th><th>อันดับ</th><th>เหตุผลลำดับ</th></tr></thead><tbody>' + w.selected.map((m) => '<tr><td>' + m.order + '</td><td><b>' + esc(m.sb) + '</b> ' + esc(m.name) + (dom.measures[m.order - 1] && dom.measures[m.order - 1].viaRule ? '<br>' + chip('เพิ่มตามกฎ ' + esc(dom.measures[m.order - 1].viaRule), 'warn') : '') + '</td><td>' + ['dom:ด้านของภัย', 'risk:ระดับความเสี่ยง', 'ready:ระดับความพร้อม', 'res:ทรัพยากร'].map((q) => { const k = q.split(':'); return '<span class="xg4">' + tick(m.gates[k[0]]) + k[1] + '</span>'; }).join('') + '</td><td>' + (m.poolRank || '–') + '/' + w.pool.nPool + (m.top ? '<br>' + chip('7-S ช่องว่างสูง', 'ok') : '') + '</td><td>' + esc(m.tie || (m.order === w.selected.length ? '(ข้อสุดท้ายที่เลือก)' : '')) + '</td></tr>').join('') + '</tbody></table></div>', { icon: 'check' });
      return s;
    }
    function tabWhyNot(out) {
      const dom = pickDom(out); if (!dom) return empty();
      const x = Dc.explainDomain(dom, out, D), w = x.why, cn = w.counts;
      let s = domPick('exDom', dom.code, out);
      s += card('ทำไมไม่เลือกกลยุทธ์ช่องอื่น (ด้านนี้อยู่ช่อง ' + dom.group + ')', '<p class="hint">เรียงจากช่องที่ใกล้ที่สุด ตัวเลขทั้งหมดมาจากผลประเมินของโรงเรียนนี้</p><div class="xcons">' + x.contrast.map((q) => '<div class="xcon"><div class="xch"><b>' + q.code + '</b> ' + esc(q.stance) + ' ' + chip(q.distance === 1 ? 'ต่างหนึ่งแกน' : 'ต่างสองแกน', q.distance === 1 ? 'warn' : '') + '</div><ul>' + q.reasons.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul><small>' + esc(q.notFit) + '</small></div>').join('') + '</div>', { icon: 'target' });
      const parts = [['selected', 'เลือก', '#2e9e6b'], ['swapped', 'ถูกสลับตามกฎ', '#7a5bd6'], ['cap', 'เหมาะแต่เกินเพดาน', '#e0a526'], ['res', 'เกินทรัพยากร', '#d97b2d'], ['ready', 'ไม่เหมาะกับความพร้อม', '#d64545'], ['risk', 'ไม่เหมาะกับความเสี่ยง', '#c0589b'], ['dom', 'คนละด้านของภัย', '#9aa9bb']];
      const tot = D.bank.length;
      s += card('ทำไมไม่เลือกมาตรการอื่น (คลัง ' + tot + ' ข้อ)', '<div class="xbar">' + parts.map((p) => cn[p[0]] ? '<i style="width:' + (cn[p[0]] / tot * 100) + '%;background:' + p[2] + '" title="' + p[1] + ' ' + cn[p[0]] + '"></i>' : '').join('') + '</div><ul class="xleg">' + parts.map((p) => '<li><i style="background:' + p[2] + '"></i>' + p[1] + ' <b>' + (cn[p[0]] || 0) + '</b></li>').join('') + '</ul><p class="hint">แต่ละข้อถูกตรวจตามลำดับด่าน: ด้านของภัย → ความเสี่ยง → ความพร้อม → ทรัพยากร → เพดานจำนวนข้อ ข้อที่ตกด่านแรกจะแสดงเหตุผลของด่านนั้น</p>', { icon: 'bars' });
      const near = w.nearMiss.concat(w.stretch);
      s += card('มาตรการที่ใกล้ได้รับเลือก', near.length ? '<div class="xcons">' + near.map((m) => '<div class="xcon"><div class="xch"><b>' + esc(m.sb) + '</b> ' + esc(m.name) + ' ' + chip(esc(m.reasonText), m.reason === 'cap' ? 'warn' : '') + '</div><small>' + esc(m.counterfactual) + '</small></div>').join('') + '</div>' : '<p class="muted">ไม่มี</p>', { icon: 'flag' });
      const ft = S.ui.exFilter || '';
      s += '<details class="tcard xdet"' + (ft ? ' open' : '') + '><summary>ดูรายข้อทั้งหมด ' + tot + ' ข้อ พร้อมเหตุผล</summary><div class="xfil"><label>กรองตามเหตุผล <select data-set="ui.exFilter" data-r="1"><option value="">ทั้งหมด</option>' + parts.map((p) => '<option value="' + p[0] + '"' + (ft === p[0] ? ' selected' : '') + '>' + p[1] + '</option>').join('') + '</select></label></div><div class="xscroll"><table class="xtb"><thead><tr><th>รหัส</th><th>มาตรการ</th><th>ผล</th><th>เงื่อนไขที่จะทำให้เปลี่ยน</th></tr></thead><tbody>' + w.rows.filter((r) => !ft || r.reason === ft).map((r) => '<tr><td>' + esc(r.sb || r.id) + '</td><td>' + esc(r.name) + '</td><td>' + esc(r.reasonText) + '</td><td>' + esc(r.counterfactual) + '</td></tr>').join('') + '</tbody></table></div></details>';
      return s;
    }
    function tabBank() {
      const res = S.ui.exRes || 1, cov = Dc.coverage(D).filter((r) => r.res === res);
      const cell = {}; cov.forEach((r) => { const k = r.cell + r.dom; if (!cell[k] || r.n < cell[k].n) cell[k] = r; });
      const rows = Object.keys(Dc.CELLS).map((code) => '<tr><th>' + code + '</th>' + D.domains.map((d) => { const r = cell[code + d.code]; return '<td class="xcv ' + (r.n === 0 ? 'z' : r.n <= 1 ? 'l' : r.n <= 2 ? 'm' : 'h') + '" title="' + esc(r.label) + '">' + r.n + '<small>' + esc(r.label.slice(0, 14)) + '</small></td>'; }).join('') + '</tr>').join('');
      const thin = Object.keys(cell).map((k) => cell[k]).filter((r) => r.n <= 1).sort((a, b) => a.n - b.n);
      return card('ตรวจความครอบคลุมของคลัง', '<p class="hint">ในแต่ละช่อง R × ด้านของภัย มีมาตรการในคลังที่ตอบเงื่อนไขขั้นต่ำของช่องอย่างน้อยกี่ข้อ (นับเงื่อนไขที่บางที่สุด) คำนวณจากคลังทั้ง ' + D.bank.length + ' ข้อ เพื่อหาช่องว่างที่ต้องเพิ่มมาตรการก่อนเดลฟาย</p><div class="seg" role="radiogroup" aria-label="ระดับทรัพยากร">' + [1, 2, 3].map((r) => '<button type="button" role="radio" aria-checked="' + (res === r) + '" data-act="ex-res" data-v="' + r + '"><b>ทรัพยากรระดับ ' + r + '</b><small>' + (r === 1 ? 'จำกัด' : r === 2 ? 'ปานกลาง' : 'เพียงพอ') + '</small></button>').join('') + '</div><div class="xscroll"><table class="xtb xcvt"><thead><tr><th>ช่อง</th>' + D.domains.map((d) => '<th>' + esc(HZ[d.code][0]) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div><p class="hint">สีแดง = ไม่มีเลย · ส้ม = 1 ข้อ · เหลือง = 2 ข้อ · เขียว = 3 ข้อขึ้นไป</p>' + (thin.length ? '<div class="xbox warn"><b>ช่องที่บาง (' + thin.length + ')</b><ul>' + thin.slice(0, 12).map((r) => '<li>' + r.cell + ' · ' + esc(HZ[r.dom][0]) + ': ' + esc(r.label) + ' มี ' + r.n + ' ข้อ</li>').join('') + '</ul></div>' : '<p class="hint">ไม่มีช่องที่บางที่ระดับทรัพยากรนี้</p>'), { icon: 'bars' });
    }
    function pageExplain() {
      const out = getOut(), tab = S.ui.exTab || 'rules';
      let s = banner('bulb', 'กฎตัดสินใจและเหตุผลของผลลัพธ์', 'ทำไมจึงเลือกกลยุทธ์นี้ และทำไมไม่เลือกอย่างอื่น');
      s += tabs('exTab', [['rules', 'กฎตัดสินใจ'], ['why', 'ทำไมเลือก'], ['whynot', 'ทำไมไม่เลือก'], ['bank', 'ตรวจคลัง']], tab) + switchCard(out);
      if (tab === 'rules') return s + tabRules(out);
      if (tab === 'bank') return s + tabBank();
      if (!hasData(out)) return s + empty();
      return s + (tab === 'why' ? tabWhy(out) : tabWhyNot(out));
    }

    // ====================================================================
    // หน้า: ติดตามผลและบทเรียน
    // ====================================================================
    const planRows = (out) => { const r = []; out.domains.forEach((d) => d.measures.forEach((m) => r.push({ d, m, key: c.mKey(d.code, m.id) }))); return r; };
    const lg = (key) => (T().logs[key] = T().logs[key] || {});
    function logForm(r) {
      const key = r.key, v = L.cleanLog(T().logs[key]), p = 'track.logs.' + key + '.';
      const bar = L.BARRIERS.map((b) => '<label class="xck"><input type="checkbox" data-arr="' + p + 'barriers" data-v="' + b[0] + '"' + (v.barriers.indexOf(b[0]) >= 0 ? ' checked' : '') + '> ' + esc(b[1]) + '</label>').join('');
      return '<div class="lgf"><div class="lgr"><label>สถานะ<select data-st="' + key + '">' + L.STATUS.map((x) => '<option' + ((S.status[key] || L.STATUS[0]) === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></label></div>' +
        '<div class="lgr"><b>ทำตามแผนได้ครบถ้วนเพียงใด</b>' + chips(p + 'fidelity', L.FIDELITY, L.FIDELITY.map((x) => x + '%'), v.fidelity, true) + '</div>' +
        '<div class="lgr"><b>ผลที่เห็นหลังทำ</b>' + chips(p + 'effect', [1, 2, 3, 4, 5], L.EFFECT, v.effect, true) + '</div>' +
        '<div class="lgr"><b>ทรัพยากรที่ใช้จริง</b> <small>คลังระบุระดับ ' + r.m.res + '</small>' + chips(p + 'costLevel', [1, 2, 3], ['ระดับ 1 (น้อย)', 'ระดับ 2 (กลาง)', 'ระดับ 3 (มาก)'], v.costLevel, true) + '</div>' +
        '<div class="lgr"><b>ตัวชี้วัด:</b> ' + esc(r.m.kpi) + '<div class="lgk"><label>ก่อนทำ<input type="number" step="any" data-set="' + p + 'kpiBefore" value="' + (v.kpiBefore == null ? '' : v.kpiBefore) + '"></label><label>หลังทำ<input type="number" step="any" data-set="' + p + 'kpiAfter" value="' + (v.kpiAfter == null ? '' : v.kpiAfter) + '"></label><label>ทิศทางที่ดี<select data-set="' + p + 'kpiDir"><option value="up"' + (v.kpiDir === 'up' ? ' selected' : '') + '>ยิ่งมากยิ่งดี</option><option value="down"' + (v.kpiDir === 'down' ? ' selected' : '') + '>ยิ่งน้อยยิ่งดี</option></select></label></div></div>' +
        '<div class="lgr"><b>อุปสรรคที่พบ</b><div class="xcks">' + bar + '</div></div>' +
        '<div class="lgr"><label>จะทำซ้ำหรือไม่<select data-set="' + p + 'repeat"><option value="">ยังไม่ตอบ</option>' + ['ใช่', 'ไม่', 'ไม่แน่ใจ'].map((x) => '<option' + (v.repeat === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></label></div>' +
        '<div class="lgr"><label>บทเรียน (ไม่ต้องใส่ชื่อบุคคลหรือรายละเอียดที่ระบุตัวได้)<textarea data-set="' + p + 'lesson" maxlength="600" rows="3">' + esc(v.lesson) + '</textarea></label></div></div>';
    }
    function trackLog(out) {
      const rows = planRows(out), open = S.ui.lgOpen || {};
      const done = (r) => { const v = T().logs[r.key]; return v && (v.effect || v.fidelity != null || v.costLevel); };
      let s = card('บันทึกผลรายมาตรการ', '<p class="hint">บันทึกสิ่งที่เกิดขึ้นจริงของแต่ละมาตรการ ข้อมูลนี้เป็นวัตถุดิบของวงจรเรียนรู้ ใช้ปรับคลังเมื่อรวมหลายโรงเรียนและผ่านผู้เชี่ยวชาญแล้วเท่านั้น (บันทึกแล้ว ' + rows.filter(done).length + ' จาก ' + rows.length + ' ข้อ)</p>', { icon: 'clipboard' });
      out.domains.forEach((d) => { if (!d.measures.length) return; s += '<section class="tcard"><h2>' + esc(HZ[d.code][0]) + ' · ' + d.group + '</h2>' + d.measures.map((m) => { const key = c.mKey(d.code, m.id), r = { d, m, key }, st = S.status[key] || L.STATUS[0], isOpen = open[key]; return '<div class="lgrow"><button class="lgh" data-act="lg-open" data-key="' + key + '" aria-expanded="' + !!isOpen + '"><span><b>' + esc(c.cd(m)) + '</b> ' + esc(m.name) + '</span>' + chip(st, st === L.STATUS[2] ? 'ok' : st === L.STATUS[1] ? 'warn' : '') + (done(r) ? chip('บันทึกแล้ว', 'teal') : '') + ic('chev', 16) + '</button>' + (isOpen ? logForm(r) : '') + '</div>'; }).join('') + '</section>'; });
      return s;
    }
    function trackRounds(out) {
      const sn = T().snaps, last = sn[sn.length - 1], prev = sn[sn.length - 2];
      const w = out.domains.filter((d) => d.group).sort((a, b) => b.rd - a.rd)[0], rv = w ? w.pkg.review : '';
      let s = card('บันทึกผลการประเมินเป็นรอบ', '<p class="hint">กดบันทึกเมื่อให้คะแนนความเสี่ยงและความพร้อมเสร็จ (รอบแรก = ก่อนเริ่มมาตรการ) แล้วกลับมาประเมินซ้ำตามรอบทบทวน' + (rv ? ' ของด้านที่เสี่ยงสูงสุด (' + esc(rv) + ')' : '') + ' ปรับคะแนนในหน้า "ความเสี่ยง" และ "ความพร้อม" ให้ตรงสถานการณ์ปัจจุบันก่อนบันทึกทุกครั้ง</p><div class="xrow"><label>ชื่อรอบ<input type="text" data-set="track.snapLabel" value="' + esc(T().snapLabel || (sn.length ? 'รอบที่ ' + sn.length : 'ก่อนเริ่ม')) + '" maxlength="40"></label><button class="tbtn primary" data-act="snap-save">' + ic('check', 20) + '<span>บันทึกรอบนี้</span></button></div>' +
        (sn.length ? '<div class="xscroll"><table class="xtb"><thead><tr><th>รอบ</th><th>วันที่</th><th>ความพร้อม (D เฉลี่ย)</th><th>ดัชนีความเสี่ยงเฉลี่ย 4 ด้าน</th><th>ช่อง R ราย 4 ด้าน</th><th></th></tr></thead><tbody>' + sn.map((q, i) => '<tr><td><b>' + esc(q.label) + '</b></td><td>' + dateTh(q.date) + '</td><td>' + n2(q.ready.mean) + ' ' + lvr(q.ready.level) + '</td><td>' + n2(Object.keys(q.domains).map((k) => q.domains[k].rd).filter((x) => x != null).reduce((a, x, _, ar) => a + x / ar.length, 0)) + '</td><td>' + Object.keys(q.domains).map((k) => k + ':' + (q.domains[k].cell || '–')).join(' ') + '</td><td><button class="icon-btn" data-act="snap-del" data-i="' + i + '" aria-label="ลบรอบ ' + esc(q.label) + '">' + ic('trash', 18) + '</button></td></tr>').join('') + '</tbody></table></div>' : '<p class="muted">ยังไม่มีรอบที่บันทึก</p>'), { icon: 'calendar' });
      if (last && prev) {
        const cp = L.compare(prev, last), dRd = (x) => (x == null ? '–' : (x > 0 ? '+' : '') + x.toFixed(2));
        s += card('เปรียบเทียบ ' + esc(prev.label) + ' → ' + esc(last.label), '<div class="kpi4"><div class="tcard kc"><small>ความพร้อม (D เฉลี่ย)</small><b>' + dRd(cp.dReady) + '</b><span>' + n2(prev.ready.mean) + ' → ' + n2(last.ready.mean) + '</span></div><div class="tcard kc"><small>ดัชนีความเสี่ยงเฉลี่ย</small><b>' + dRd(cp.dRiskMean) + '</b><span>ค่าลบ = ความเสี่ยงลดลง</span></div></div><div class="xscroll"><table class="xtb"><thead><tr><th>ด้าน</th><th>ดัชนี R ก่อน → หลัง</th><th>เปลี่ยน</th><th>ช่อง R</th></tr></thead><tbody>' + cp.domains.map((q) => '<tr><td>' + esc(HZ[q.code][0]) + '</td><td>' + n2(q.rdA) + ' → ' + n2(q.rdB) + '</td><td>' + dRd(q.dRd) + '</td><td>' + (q.cellA || '–') + ' → ' + (q.cellB || '–') + '</td></tr>').join('') + '</tbody></table></div><div class="xscroll"><table class="xtb"><thead><tr><th>องค์ประกอบ 7-S</th><th>D ก่อน → หลัง</th><th>เปลี่ยน</th></tr></thead><tbody>' + cp.elements.map((q) => '<tr><td>' + esc(c.SHORT_EL[q.code]) + '</td><td>' + n2(q.dA) + ' → ' + n2(q.dB) + '</td><td>' + dRd(q.dD) + '</td></tr>').join('') + '</tbody></table></div><p class="xwarn">' + ic('alert', 18) + ' ตัวเลขนี้บอกว่าคะแนนเปลี่ยนไปเท่าใด ไม่ได้พิสูจน์ว่าการเปลี่ยนมาจากมาตรการ เพราะไม่มีกลุ่มเปรียบเทียบ และผู้ให้คะแนนอาจให้คะแนนต่างจากเดิมด้วยเหตุอื่น</p>', { icon: 'bars', cls: 'blue' });
      }
      return s;
    }
    function trackCustom() {
      const cu = T().custom, nc = S.ui.newCustom || (S.ui.newCustom = { dom: 'V', elem: 'SYS', name: '', effect: '', desc: '' });
      return card('มาตรการที่โรงเรียนทำเองและไม่อยู่ในคลัง', '<p class="hint">ถ้าโรงเรียนทำสิ่งที่มีประโยชน์แต่คลังไม่มี บันทึกไว้ที่นี่ ถ้าหลายโรงเรียนเสนอคล้ายกัน ระบบจะเสนอให้ผู้เชี่ยวชาญพิจารณาเพิ่มเข้าคลัง</p><div class="xrow wrap"><label>ด้านของภัย<select data-set="ui.newCustom.dom">' + D.domains.map((d) => '<option value="' + d.code + '"' + (nc.dom === d.code ? ' selected' : '') + '>' + esc(HZ[d.code][0]) + '</option>').join('') + '</select></label><label>องค์ประกอบ 7-S<select data-set="ui.newCustom.elem">' + D.elements.map((e) => '<option value="' + e.code + '"' + (nc.elem === e.code ? ' selected' : '') + '>' + esc(c.SHORT_EL[e.code]) + '</option>').join('') + '</select></label><label>ผลที่เห็น (1–5)<select data-set="ui.newCustom.effect"><option value="">–</option>' + [1, 2, 3, 4, 5].map((x) => '<option' + (String(nc.effect) === String(x) ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></label></div><label class="xfull">ชื่อมาตรการ<input type="text" data-set="ui.newCustom.name" value="' + esc(nc.name) + '" maxlength="120" placeholder="เช่น ระบบเพื่อนช่วยเพื่อนช่วงพักกลางวัน"></label><label class="xfull">รายละเอียดสั้น ๆ (ไม่ใส่ชื่อบุคคล)<textarea data-set="ui.newCustom.desc" maxlength="300" rows="2">' + esc(nc.desc) + '</textarea></label><p><button class="tbtn primary sm" data-act="cust-add">' + ic('plus', 18) + '<span>เพิ่มมาตรการ</span></button></p>' +
        (cu.length ? '<ul class="doclist">' + cu.map((q, i) => '<li><span class="dn"><b>' + esc(q.name) + '</b><small>' + esc(HZ[q.dom][0]) + ' · ' + esc(c.SHORT_EL[q.elem]) + (q.effect ? ' · ผลที่เห็น ' + q.effect + '/5' : '') + '</small></span><button class="icon-btn" data-act="cust-del" data-i="' + i + '" aria-label="ลบ ' + esc(q.name) + '">' + ic('trash', 18) + '</button></li>').join('') + '</ul>' : '<p class="muted">ยังไม่มีรายการ</p>'), { icon: 'bulb' });
    }
    function workFile() { return { schema: 'r2safe-workfile', version: 1, savedAt: new Date().toISOString(), school: S.school, resource: S.resource, risk: S.risk, seven: S.seven, params: S.params, status: S.status, aar: S.aar, track: { logs: T().logs, snaps: T().snaps, custom: T().custom, code: T().code, arm: T().arm } }; }
    function loadWork(o) {
      if (!o || o.schema !== 'r2safe-workfile') throw new Error('ไม่ใช่แฟ้มงาน R²-SAFE');
      S.school = Object.assign({ name: '', students: '', staff: '', year: '2569', province: '' }, o.school || {}); S.resource = ['จำกัด', 'ปานกลาง', 'เพียงพอ'].indexOf(o.resource) >= 0 ? o.resource : 'ปานกลาง';
      S.risk = o.risk || {}; S.seven = o.seven || {}; S.params = Object.assign({}, E.DEFAULT_PARAMS, o.params || {}); S.status = o.status || {}; S.aar = String(o.aar || '');
      const t = o.track || {}; S.track.logs = t.logs || {}; S.track.snaps = Array.isArray(t.snaps) ? t.snaps : []; S.track.custom = Array.isArray(t.custom) ? t.custom : []; S.track.code = t.code || ''; S.track.arm = t.arm || '';
    }
    function trackExport(out) {
      const t = T(), prevSize = JSON.stringify(L.makeReport(trackFor(), S.school, out, { includeText: t.includeText, includeProvince: t.includeProvince })).length;
      return card('แฟ้มงานของโรงเรียน (เก็บไว้เอง)', '<p class="hint">ข้อมูลที่กรอกหายเมื่อรีเฟรช ดาวน์โหลดแฟ้มงานไว้เพื่อกลับมาทำต่อในรอบทบทวนถัดไป แฟ้มนี้อยู่ในเครื่องของท่านเท่านั้น มีชื่อโรงเรียนและคะแนนทั้งหมด จึงไม่ควรส่งให้ผู้อื่นโดยไม่จำเป็น</p><div class="row-btns two"><button class="tbtn primary" data-act="file-save">' + ic('download', 22) + '<span>ดาวน์โหลดแฟ้มงาน</span></button><button class="tbtn" data-act="file-load">' + ic('upload', 22) + '<span>เปิดแฟ้มงานที่เคยบันทึก</span></button></div><input type="file" id="work-file" accept="application/json,.json" hidden><label class="xck big"><input type="checkbox" data-set="track.saveLocal" data-r="1"' + (t.saveLocal ? ' checked' : '') + '> บันทึกอัตโนมัติในเบราว์เซอร์เครื่องนี้ <small>(ไม่แนะนำบนเครื่องที่ใช้ร่วมกัน ข้อมูลอยู่ในเครื่องนี้เท่านั้น ไม่ส่งออก)</small></label><p class="warn-note" id="work-msg" role="status"></p>', { icon: 'download' }) +
        card('รายงานส่งผู้วิจัย (ไม่ระบุชื่อ)', '<p class="hint">ใช้เมื่อโรงเรียนเข้าร่วมการทดลองใช้และผู้วิจัยผ่านการรับรองจริยธรรมแล้วเท่านั้น รายงานนี้<b>ไม่มี</b>ชื่อโรงเรียน ชื่อบุคคล หรือข้อความอิสระ (เว้นแต่เลือกแนบ) มีเพียงขนาดโรงเรียน ผลประเมินรายรอบ และผลรายมาตรการ รหัสโรงเรียนสุ่มโดยเครื่องของท่าน</p>' +
        '<div class="xrow wrap"><label>กลุ่มของโรงเรียน (ผู้วิจัยแจ้ง)<select data-set="track.arm"><option value="">ไม่ระบุ</option><option value="intervention"' + (t.arm === 'intervention' ? ' selected' : '') + '>กลุ่มทดลอง</option><option value="comparison"' + (t.arm === 'comparison' ? ' selected' : '') + '>กลุ่มเปรียบเทียบ</option></select></label></div>' +
        '<label class="xck"><input type="checkbox" data-set="track.includeText" data-r="1"' + (t.includeText ? ' checked' : '') + '> แนบข้อความบทเรียนและรายละเอียดมาตรการใหม่ (ตรวจแล้วว่าไม่มีชื่อบุคคล)</label><label class="xck"><input type="checkbox" data-set="track.includeProvince" data-r="1"' + (t.includeProvince ? ' checked' : '') + '> ระบุจังหวัด (ไม่แนะนำ ถ้าโรงเรียนในจังหวัดมีน้อย อาจระบุตัวได้)</label>' +
        '<label class="xck big"><input type="checkbox" data-set="track.consent" data-r="1"' + (t.consent ? ' checked' : '') + '> โรงเรียนยินยอมส่งรายงานนี้ให้ผู้วิจัย (ส่งเองทางช่องทางที่ผู้วิจัยแจ้ง เว็บนี้ไม่ส่งข้อมูลออก)</label>' +
        '<p><button class="tbtn green" data-act="rep-dl"' + (t.consent ? '' : ' disabled') + '>' + ic('download', 22) + '<span>ดาวน์โหลดรายงานส่งผู้วิจัย (' + Math.max(1, Math.round(prevSize / 1024)) + ' KB)</span></button></p>', { icon: 'shieldcheck', cls: 'green' });
    }
    function trackFor() { return { logs: T().logs, status: S.status, snaps: T().snaps, custom: T().custom, code: T().code, arm: T().arm }; }
    function pageTrack() {
      const out = getOut(), tab = S.ui.trkTab || 'log';
      let s = banner('flag', 'ติดตามผลและบทเรียน', 'บันทึกผลหลังดำเนินการ ประเมินซ้ำเป็นรอบ และส่งบทเรียนกลับไปพัฒนาคลัง');
      s += tabs('trkTab', [['log', 'ผลรายมาตรการ'], ['rounds', 'ประเมินซ้ำ'], ['custom', 'มาตรการใหม่'], ['export', 'แฟ้มและรายงาน']], tab);
      if (!hasData(out)) return s + empty('ต้องมีผลประเมินและแผนมาตรการก่อนจึงจะบันทึกผลได้');
      return s + (tab === 'log' ? trackLog(out) : tab === 'rounds' ? trackRounds(out) : tab === 'custom' ? trackCustom() : trackExport(out));
    }

    // ====================================================================
    // หน้า: ประเมินนวัตกรรม (ผู้ตอบ)
    // ====================================================================
    const ETHICS = '<p class="warn-note">แบบนี้ใช้เก็บข้อมูลวิจัยจริงได้ต่อเมื่อโครงการผ่านการรับรองจริยธรรมการวิจัยและผู้ตอบยินยอมแล้วเท่านั้น ไม่ต้องใส่ชื่อจริง ใช้รหัสที่ผู้วิจัยแจ้ง คำตอบถูกบันทึกเป็นไฟล์ในเครื่องของท่าน เว็บนี้ไม่ส่งข้อมูลออก ท่านส่งไฟล์ให้ผู้วิจัยเอง</p>';
    const SC5 = ['น้อยที่สุด', 'น้อย', 'ปานกลาง', 'มาก', 'มากที่สุด'];
    const count = (o, keys) => keys.filter((k) => Number.isInteger(o[k])).length;
    function evalAdmin() {
      const a = S.eval.admin, ids = [], sus = V.SUS_ITEMS.map((x) => x[0]);
      V.ADMIN_ASPECTS.forEach((x) => x.items.forEach((i) => ids.push(i[0])));
      const done = count(a.items, ids) + count(a.sus, sus), tot = ids.length + sus.length;
      let s = card('ผู้บริหารสถานศึกษา: ประเมินการใช้เครื่องมือ', '<p class="hint">ตอบหลังลองใช้เครื่องมือแล้ว ให้คะแนน 1 (น้อยที่สุด) ถึง 5 (มากที่สุด) ตอบแล้ว ' + done + ' จาก ' + tot + ' ข้อ</p><div class="pbar"><i style="width:' + Math.round(done / tot * 100) + '%"></i></div><label class="xfull">รหัสผู้ตอบ (ที่ผู้วิจัยแจ้ง เช่น A01 ห้ามใช้ชื่อจริง)<input type="text" data-set="eval.admin.code" value="' + esc(a.code) + '" maxlength="12"></label>' + ETHICS, { icon: 'people' });
      V.ADMIN_ASPECTS.forEach((as) => { s += card(esc(as.name), as.items.map((i) => '<div class="xq"><p>' + esc(i[1]) + '</p>' + chips('eval.admin.items.' + i[0], [1, 2, 3, 4, 5], ['1', '2', '3', '4', '5'], a.items[i[0]], true) + '</div>').join('') + '<p class="hint">1 = ' + SC5[0] + ' · 3 = ' + SC5[2] + ' · 5 = ' + SC5[4] + '</p>'); });
      s += card('ความง่ายในการใช้งาน (SUS)', '<p class="hint">1 = ไม่เห็นด้วยอย่างยิ่ง · 5 = เห็นด้วยอย่างยิ่ง คำแปลเป็นร่างของผู้วิจัย รอตรวจความตรงของภาษา</p>' + V.SUS_ITEMS.map((i) => '<div class="xq"><p>' + esc(i[1]) + '</p>' + chips('eval.admin.sus.' + i[0], [1, 2, 3, 4, 5], ['1', '2', '3', '4', '5'], a.sus[i[0]], true) + '</div>').join(''));
      s += card('ข้อเสนอแนะ', '<label class="xfull">ข้อดีและสิ่งที่ควรปรับปรุง (ไม่ใส่ชื่อบุคคล)<textarea data-set="eval.admin.comment" maxlength="800" rows="4">' + esc(a.comment) + '</textarea></label><p><button class="tbtn primary" data-act="ev-dl" data-role="admin"' + (a.code ? '' : ' disabled') + '>' + ic('download', 22) + '<span>' + (a.code ? 'ดาวน์โหลดไฟล์คำตอบ' : 'ใส่รหัสผู้ตอบก่อนดาวน์โหลด') + '</span></button></p>');
      return s;
    }
    const FIELDS = ['ความปลอดภัยและการจัดการภัยพิบัติ', 'การบริหารการศึกษา', 'สุขภาพจิตและการคุ้มครองเด็ก', 'การบริหารความเสี่ยง (ISO 31000)', 'อื่น ๆ'];
    function caseCard(cs) {
      const a = (S.eval.expert.cases[cs.id] = S.eval.expert.cases[cs.id] || {}), p = 'eval.expert.cases.' + cs.id + '.', both = a.risk && a.ready, k = both ? Dc.CELLS[cs.sys.cell] : null;
      return '<div class="tcard xcase"><h3 class="xh3">กรณี ' + cs.id + ' · ' + esc(cs.domName) + '</h3><div class="xmeta"><span>ดัชนีความเสี่ยง (1–25): <b>' + cs.rd.toFixed(1) + '</b></span><span>มีข้อผลกระทบรุนแรงสุด (C = 5) ที่เกิดได้ (L ≥ 2): <b>' + (cs.override ? 'มี' : 'ไม่มี') + '</b></span></div><div class="xscroll"><table class="xtb xsm"><thead><tr>' + D.elements.map((e) => '<th>' + esc(c.SHORT_EL[e.code]) + '</th>').join('') + '<th>เฉลี่ย</th></tr></thead><tbody><tr>' + cs.elemD.map((v) => '<td>' + v.toFixed(2) + '</td>').join('') + '<td><b>' + cs.readyMean.toFixed(2) + '</b></td></tr></tbody></table></div><p class="hint">ตารางคือค่าเฉลี่ยความพร้อม D รายองค์ประกอบ 7-S (1–5)</p>' +
        '<div class="lgr"><b>ท่านเห็นว่าความเสี่ยงของด้านนี้อยู่ระดับ</b>' + chips(p + 'risk', ['ต่ำ', 'กลาง', 'สูง'], null, a.risk) + '</div><div class="lgr"><b>ท่านเห็นว่าความพร้อมขององค์กรอยู่ระดับ</b>' + chips(p + 'ready', ['ต่ำ', 'กลาง', 'สูง'], null, a.ready) + '</div>' +
        (both ? '<div class="xbox"><b>แนวทางที่ระบบเสนอสำหรับกรณีนี้: ' + esc(k.stance) + '</b><p>' + esc(k.intent) + '</p></div><div class="lgr"><b>แนวทางนี้เหมาะสมเพียงใด</b>' + chips(p + 'fit', [1, 2, 3, 4, 5], ['1', '2', '3', '4', '5'], a.fit, true) + '</div>' + (a.fit && a.fit <= 3 ? '<label class="xfull">ท่านเห็นว่าควรใช้แนวทางใดแทน<select data-set="' + p + 'alt"><option value="">ไม่ระบุ</option>' + Object.keys(Dc.CELLS).map((q) => '<option value="' + q + '"' + (a.alt === q ? ' selected' : '') + '>' + esc(Dc.CELLS[q].stance) + '</option>').join('') + '</select></label>' : '') : '<p class="hint">เลือกระดับทั้งสองอย่างก่อน แล้วจะแสดงแนวทางที่ระบบเสนอให้ประเมิน</p>') + '</div>';
    }
    function evalExpert() {
      const e = S.eval.expert, cases = V.makeCases(D.domains), ids = V.EXPERT_ITEMS.map((x) => x.id);
      const ca = cases.filter((q) => e.cases[q.id] && e.cases[q.id].risk && e.cases[q.id].ready && Number.isInteger(e.cases[q.id].fit)).length, ib = count(e.items, ids);
      let s = card('ผู้เชี่ยวชาญ: ประเมินกลไกตัดสินใจ', '<p class="hint">ส่วน ก ตัดสินกรณีจำลอง ' + cases.length + ' กรณี (ตอบแล้ว ' + ca + ') ส่วน ข ให้คะแนนกลไก ' + ids.length + ' ข้อ (ตอบแล้ว ' + ib + ') <b>กรุณาอย่าเปิดหน้า "กฎตัดสินใจ" หรือ "กฎและเกณฑ์" ก่อนตอบส่วน ก</b> เพื่อให้ท่านตัดสินจากประสบการณ์ ไม่ใช่จากค่าตัดของระบบ</p><div class="pbar"><i style="width:' + Math.round((ca + ib) / (cases.length + ids.length) * 100) + '%"></i></div><div class="xrow wrap"><label>รหัสผู้ตอบ (เช่น E01 ห้ามใช้ชื่อจริง)<input type="text" data-set="eval.expert.code" value="' + esc(e.code) + '" maxlength="12"></label><label>ความเชี่ยวชาญหลัก<select data-set="eval.expert.field"><option value="">เลือก</option>' + FIELDS.map((f) => '<option' + (e.field === f ? ' selected' : '') + '>' + f + '</option>').join('') + '</select></label></div>' + ETHICS, { icon: 'people' });
      s += '<h2 class="xsec">ส่วน ก กรณีจำลอง ' + cases.length + ' กรณี</h2><p class="hint">ทุกกรณีเป็นข้อมูลจำลองที่ผู้วิจัยสร้าง ไม่ใช่โรงเรียนจริง ชุดกรณีเหมือนกันสำหรับผู้เชี่ยวชาญทุกคน (' + V.CASESET + ')</p>' + cases.map(caseCard).join('');
      s += '<h2 class="xsec">ส่วน ข ให้คะแนนกลไก</h2>';
      const groups = []; V.EXPERT_ITEMS.forEach((it) => { if (groups.indexOf(it.g) < 0) groups.push(it.g); });
      groups.forEach((g) => { s += card(esc(g), V.EXPERT_ITEMS.filter((it) => it.g === g).map((it) => '<div class="xq"><p><b>' + it.id + '</b> ' + esc(it.t) + '</p>' + chips('eval.expert.items.' + it.id, [1, 2, 3, 4, 5], ['1', '2', '3', '4', '5'], e.items[it.id], true) + '</div>').join('') + '<p class="hint">1 = ไม่เหมาะสมอย่างยิ่ง · 3 = ปานกลาง · 5 = เหมาะสมที่สุด</p>'); });
      s += card('ข้อเสนอแนะ', '<label class="xfull">ข้อเสนอแนะต่อกฎ ช่อง R ค่าตัด หรือกระบวนการเรียนรู้ (ไม่ใส่ชื่อบุคคล)<textarea data-set="eval.expert.comment" maxlength="1200" rows="5">' + esc(e.comment) + '</textarea></label><p><button class="tbtn primary" data-act="ev-dl" data-role="expert"' + (e.code ? '' : ' disabled') + '>' + ic('download', 22) + '<span>' + (e.code ? 'ดาวน์โหลดไฟล์คำตอบ' : 'ใส่รหัสผู้ตอบก่อนดาวน์โหลด') + '</span></button></p>');
      return s;
    }
    function pageEvaluate() {
      const tab = S.ui.evTab || 'admin';
      return banner('clipboard', 'ประเมินนวัตกรรม', 'แบบประเมินสำหรับผู้บริหารสถานศึกษาและผู้เชี่ยวชาญ') + tabs('evTab', [['admin', 'ผู้บริหารสถานศึกษา'], ['expert', 'ผู้เชี่ยวชาญ']], tab) + (tab === 'admin' ? evalAdmin() : evalExpert());
    }

    // ====================================================================
    // หน้า: ห้องวิเคราะห์ของผู้วิจัย
    // ====================================================================
    const LB = () => S.lab;
    const syn = () => LB().reports.some((r) => r.synthetic) || LB().experts.some((r) => r.synthetic) || LB().admins.some((r) => r.synthetic);
    const synBanner = () => (syn() ? '<p class="xwarn">' + ic('alert', 18) + ' <b>มีข้อมูลสมมติปะปนอยู่</b> ผลที่แสดงเป็นเพียงการทดสอบการทำงานของเครื่องมือ ไม่ใช่ผลวิจัย ห้ามนำไปรายงาน</p>' : '');
    function ingest(text, name) {
      let o; try { o = JSON.parse(text); } catch (e) { return 'อ่านไฟล์ ' + name + ' ไม่ได้ (ไม่ใช่ JSON)'; }
      const put = (arr, o2, key) => { const k = o2.code || name; const i = arr.findIndex((x) => (x.code || '') === k && k); if (i >= 0) arr[i] = o2; else arr.push(o2); };
      if (o && o.schema === L.SCHEMA) { const v = L.validateReport(o); if (!v.ok) return name + ': ' + v.why; put(LB().reports, o); return ''; }
      if (V.validExpert(o)) { put(LB().experts, o); return ''; }
      if (V.validAdmin(o)) { put(LB().admins, o); return ''; }
      return name + ': ไม่ใช่ไฟล์ของ R²-SAFE (หรือเวอร์ชันไม่ตรง)';
    }
    const labRes = () => {
      const cases = V.makeCases(D.domains), l = LB();
      const learning = L.aggregate(l.reports, D.bank, l.learnP), ex = V.analyzeExperts(l.experts, cases, l.crit), ad = V.analyzeAdmins(l.admins, l.crit), pilot = V.analyzePilot(L.pairs(l.reports), l.crit);
      return { learning, experts: ex, admins: ad, pilot, score: V.scorecard({ learning, experts: ex, admins: ad, pilot }, l.crit), cases };
    };
    const numField = (path, label, val, step) => '<label class="xnf">' + label + '<input type="number" step="' + (step || 'any') + '" data-set="' + path + '" data-r="1" data-num="1" value="' + val + '"></label>';
    function labImport() {
      const l = LB();
      return card('นำเข้าไฟล์', '<p class="hint">เลือกไฟล์ JSON ที่ได้รับจากโรงเรียน ผู้เชี่ยวชาญ และผู้บริหาร (หลายไฟล์พร้อมกันได้) ระบบอ่านในเบราว์เซอร์นี้เท่านั้น ไม่ส่งไฟล์ไปที่ใด ถ้ารหัสผู้ส่งซ้ำ ไฟล์ใหม่จะแทนไฟล์เดิม ข้อมูลหายเมื่อรีเฟรช</p><div class="row-btns two"><button class="tbtn primary" data-act="lab-pick">' + ic('upload', 22) + '<span>เลือกไฟล์ JSON</span></button><button class="tbtn" data-act="lab-ex">' + ic('doc', 22) + '<span>โหลดไฟล์ตัวอย่างสมมติ (ทดสอบเครื่องมือ)</span></button></div><input type="file" id="lab-file" accept="application/json,.json" multiple hidden><div class="kpi4"><div class="tcard kc"><small>รายงานโรงเรียน</small><b>' + l.reports.length + '</b></div><div class="tcard kc"><small>ผู้เชี่ยวชาญ</small><b>' + l.experts.length + '</b></div><div class="tcard kc"><small>ผู้บริหาร</small><b>' + l.admins.length + '</b></div></div>' + synBanner() + (l.msgs.length ? '<ul class="xl">' + l.msgs.map((m) => '<li>' + esc(m) + '</li>').join('') + '</ul>' : '') + '<p><button class="tbtn sm" data-act="lab-clear">' + ic('trash', 18) + '<span>ล้างข้อมูลที่นำเข้า</span></button></p>', { icon: 'upload' });
    }
    function labLearn(r) {
      const g = r.learning, P = g.params, l = LB();
      let s = card('เกณฑ์ของกฎเสนอปรับคลัง (ค่าเริ่มต้นของผู้วิจัย)', FR + '<div class="xnfs">' + numField('lab.learnP.minN', 'โรงเรียนขั้นต่ำต่อมาตรการ', P.minN, 1) + numField('lab.learnP.lowEffect', 'มัธยฐานผลต่ำ ≤', P.lowEffect, 0.5) + numField('lab.learnP.highEffect', 'มัธยฐานผลสูง ≥', P.highEffect, 0.5) + numField('lab.learnP.kpiShare', 'สัดส่วนตัวชี้วัดดีขึ้น', P.kpiShare, 0.05) + numField('lab.learnP.costOverrun', 'สัดส่วนใช้ทรัพยากรเกิน', P.costOverrun, 0.05) + numField('lab.learnP.barrierShare', 'สัดส่วนอุปสรรคเดียวกัน', P.barrierShare, 0.05) + '</div>', { icon: 'gear' });
      s += synBanner() + card('ข้อเสนอปรับคลัง (' + g.proposals.length + ' ข้อ)', '<p class="hint">' + esc(g.sufficiency.text) + ' ทุกข้อเสนอต้องผ่านผู้เชี่ยวชาญ ระบบไม่ปรับคลังเอง ผลจากโรงเรียนที่ไม่มีกลุ่มเปรียบเทียบใช้ปรับคลังได้ แต่ไม่ใช้ยกระดับหลักฐาน A–D</p>' + (g.proposals.length ? '<div class="xscroll"><table class="xtb"><thead><tr><th>กฎ</th><th>มาตรการ</th><th>ข้อเสนอ</th><th>หลักฐานจากข้อมูล</th></tr></thead><tbody>' + g.proposals.map((p) => '<tr><td>' + chip(p.rule, 'blue') + '</td><td><b>' + esc(p.sb) + '</b> ' + esc(p.name) + '</td><td>' + esc(p.ruleText) + '</td><td>' + esc(p.because) + '</td></tr>').join('') + '</tbody></table></div><p><button class="tbtn sm" data-act="lab-csv" data-k="proposals">' + ic('download', 18) + '<span>ดาวน์โหลดข้อเสนอ (CSV)</span></button></p>' : '<p class="muted">ยังไม่มีข้อเสนอ</p>'), { icon: 'bulb', cls: 'blue' });
      s += card('สถิติรายมาตรการ', g.per.length ? '<div class="xscroll"><table class="xtb xsm"><thead><tr><th>มาตรการ</th><th>โรงเรียน</th><th>เสร็จ</th><th>ผลที่เห็น (มัธยฐาน)</th><th>ทำครบถ้วน (มัธยฐาน)</th><th>ตัวชี้วัดดีขึ้น</th><th>ใช้ทรัพยากรเกิน</th></tr></thead><tbody>' + g.per.map((p) => '<tr><td><b>' + esc(p.sb) + '</b> ' + esc(p.name) + '</td><td>' + p.n + '</td><td>' + pct(p.completion) + '</td><td>' + (p.medEffect == null ? '–' : p.medEffect) + ' <small>(n=' + p.nEffect + ')</small></td><td>' + (p.medFidelity == null ? '–' : p.medFidelity + '%') + '</td><td>' + pct(p.kpiShare) + ' <small>(n=' + p.nKpi + ')</small></td><td>' + pct(p.overrunShare) + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="muted">ยังไม่มีข้อมูล</p>', { icon: 'bars' });
      if (g.cells.length) s += card('การเปลี่ยนแปลงตามช่อง R (รอบแรก → รอบสุดท้าย)', '<div class="xscroll"><table class="xtb"><thead><tr><th>ช่อง</th><th>หน่วย (โรงเรียน × ด้าน)</th><th>มัธยฐานการเปลี่ยนดัชนี R</th><th>มัธยฐานการเปลี่ยน D เฉลี่ย</th><th>มัธยฐานสัดส่วนมาตรการเสร็จ</th></tr></thead><tbody>' + g.cells.map((q) => '<tr><td>' + q.cell + '</td><td>' + q.n + '</td><td>' + n2(q.medDRd) + '</td><td>' + n2(q.medDReady) + '</td><td>' + pct(q.medDone) + '</td></tr>').join('') + '</tbody></table></div>', { icon: 'target' });
      if (g.custom.length) s += card('มาตรการใหม่ที่โรงเรียนเสนอ', '<ul class="xl">' + g.custom.map((q) => '<li><b>' + esc(q.name) + '</b> · ' + q.nSchools + ' โรงเรียน' + (q.medEffect != null ? ' · ผลที่เห็น (มัธยฐาน) ' + q.medEffect : '') + '</li>').join('') + '</ul>', { icon: 'plus' });
      return s;
    }
    function labExperts(r) {
      const e = r.experts, P = (e.params || V.CRIT);
      if (!e.n) return card('ผู้เชี่ยวชาญ', '<p class="muted">ยังไม่มีไฟล์ผู้เชี่ยวชาญ นำเข้าที่แท็บ "นำเข้า"</p>', { icon: 'people' });
      let s = synBanner() + card('เกณฑ์ (ร่าง ต้องล็อกก่อนเก็บข้อมูล)', FR + '<div class="xnfs">' + numField('lab.crit.medianMin', 'Median ≥', P.medianMin, 0.5) + numField('lab.crit.iqrMax', 'IQR ≤', P.iqrMax, 0.5) + numField('lab.crit.kappaMin', 'kappa ≥', P.kappaMin, 0.01) + numField('lab.crit.alphaMin', 'alpha ≥', P.alphaMin, 0.01) + numField('lab.crit.fitShareMin', 'สัดส่วนให้ 4–5 ≥', P.fitShareMin, 0.05) + '</div><p class="hint">ผู้เชี่ยวชาญ ' + e.n + ' คน · เกณฑ์ข้อเสนอเพิ่ม: ให้ 4–5 อย่างน้อย ' + e.need + ' คน (7 ใน 9) รอที่ปรึกษาตัดสิน</p>', { icon: 'gear' });
      s += card('ผลรายข้อของกลไก (ส่วน ข)', '<div class="xscroll"><table class="xtb"><thead><tr><th>ข้อ</th><th>ข้อความ</th><th>Median</th><th>IQR</th><th>ให้ 4–5</th><th>เกณฑ์เดิม</th><th>รวมเกณฑ์ 7/9</th></tr></thead><tbody>' + e.items.map((q) => '<tr><td><b>' + q.id + '</b></td><td>' + esc(q.t) + '</td><td>' + n2(q.median, 1) + '</td><td>' + n2(q.iqr, 1) + '</td><td>' + q.ge4 + '/' + q.n + '</td><td>' + tick(q.classic) + '</td><td>' + tick(q.pass) + '</td></tr>').join('') + '</tbody></table></div>', { icon: 'clipboard' });
      s += card('ความสอดคล้องระหว่างระบบกับผู้เชี่ยวชาญ (ส่วน ก)', '<div class="kpi4"><div class="tcard kc"><small>κ ถ่วงน้ำหนัก ความเสี่ยง (ฉันทามติ)</small><b>' + n2(e.consensus.kRisk) + '</b></div><div class="tcard kc"><small>κ ถ่วงน้ำหนัก ความพร้อม (ฉันทามติ)</small><b>' + n2(e.consensus.kReady) + '</b></div><div class="tcard kc"><small>ตรงช่อง R กับฉันทามติ</small><b>' + pct(e.consensus.cell) + '</b></div><div class="tcard kc"><small>alpha ผู้เชี่ยวชาญด้วยกัน (ความเสี่ยง / ความพร้อม)</small><b>' + n2(e.alpha.risk) + ' / ' + n2(e.alpha.ready) + '</b></div></div><div class="xscroll"><table class="xtb"><thead><tr><th>ผู้เชี่ยวชาญ</th><th>κw ความเสี่ยง</th><th>κw ความพร้อม</th><th>ตรงช่อง R</th><th>ตอบ</th></tr></thead><tbody>' + e.per.map((q) => '<tr><td>' + esc(q.code) + '</td><td>' + n2(q.kRisk) + '</td><td>' + n2(q.kReady) + '</td><td>' + pct(q.cell) + '</td><td>' + q.answered + '/27</td></tr>').join('') + '</tbody></table></div><p class="hint">ฉันทามติ = มัธยฐานของผู้เชี่ยวชาญรายกรณี (ปัดครึ่งขึ้น) kappa ถ่วงน้ำหนักแบบกำลังสองบนระดับต่ำ–กลาง–สูง ผลนี้วัดความสอดคล้องกับฉันทามติ ไม่ใช่ความถูกต้องของระบบ</p>', { icon: 'target', cls: 'blue' });
      s += card('ความเหมาะสมของแนวทางที่ระบบเสนอ', '<p>คำตอบทั้งหมด ' + e.fit.n + ' · มัธยฐาน <b>' + n2(e.fit.median, 1) + '</b> · ให้ 4–5 <b>' + pct(e.fit.share) + '</b></p><div class="xscroll"><table class="xtb"><thead><tr><th>ช่อง R</th><th>คำตอบ</th><th>มัธยฐาน</th><th>ให้ 4–5</th></tr></thead><tbody>' + e.fit.byCell.map((q) => '<tr><td>' + q.cell + ' ' + esc(Dc.CELLS[q.cell].stance) + '</td><td>' + q.n + '</td><td>' + n2(q.median, 1) + '</td><td>' + pct(q.share) + '</td></tr>').join('') + '</tbody></table></div>', { icon: 'check' });
      return s;
    }
    function labAdmins(r) {
      const a = r.admins;
      if (!a.n) return card('ผู้บริหาร', '<p class="muted">ยังไม่มีไฟล์ผู้บริหาร นำเข้าที่แท็บ "นำเข้า"</p>', { icon: 'people' });
      return synBanner() + card('ผลการประเมิน 4 ด้านจากผู้บริหาร ' + a.n + ' คน', '<div class="xscroll"><table class="xtb"><thead><tr><th>ด้าน</th><th>ค่าเฉลี่ย</th><th>SD</th><th>ระดับ</th><th>เกณฑ์ ≥ ' + a.params.aspectMin + '</th></tr></thead><tbody>' + a.aspects.map((q) => '<tr><td>' + esc(q.name) + '</td><td>' + n2(q.mean) + '</td><td>' + n2(q.sd) + '</td><td>' + esc(q.level) + '</td><td>' + tick(q.pass) + '</td></tr>').join('') + '</tbody></table></div><p>SUS: ค่าเฉลี่ย <b>' + n2(a.sus.mean, 1) + '</b> · มัธยฐาน ' + n2(a.sus.median, 1) + ' · SD ' + n2(a.sus.sd, 1) + ' (ตอบครบ ' + a.sus.n + ' คน) · ถึง ' + a.params.susMin + ' ' + pct(a.sus.shareAtLeast) + ' ' + tick(a.sus.pass) + '</p>', { icon: 'people' }) +
        a.aspects.map((q) => '<details class="tcard xdet"><summary>รายข้อ ' + esc(q.name) + '</summary><div class="xscroll"><table class="xtb"><tbody>' + q.items.map((i) => '<tr><td><b>' + i.id + '</b></td><td>' + esc(i.t) + '</td><td>' + n2(i.mean) + '</td><td>SD ' + n2(i.sd) + '</td></tr>').join('') + '</tbody></table></div></details>').join('');
    }
    function labPilot(r) {
      const p = r.pilot;
      if (!p.n) return card('นำร่อง ก่อน–หลัง', '<p class="muted">ยังไม่มีโรงเรียนที่มีอย่างน้อย 2 รอบประเมิน</p>', { icon: 'bars' });
      const row = (name, t, w) => '<tr><td>' + name + '</td><td>' + n2(t.meanDiff, 3) + '</td><td>[' + n2(t.ci && t.ci[0], 3) + ', ' + n2(t.ci && t.ci[1], 3) + ']</td><td>' + n2(t.dz) + '</td><td>' + n2(t.p, 4) + '</td><td>' + (w.ok ? n2(w.p, 4) + ' <small>(' + esc(w.method) + ')</small>' : '–') + '</td></tr>';
      let s = synBanner() + card('ก่อน–หลัง จากโรงเรียน ' + p.n + ' แห่ง (รอบแรก → รอบสุดท้าย)', '<div class="xscroll"><table class="xtb"><thead><tr><th>ตัวแปร</th><th>เปลี่ยนเฉลี่ย (หลัง − ก่อน)</th><th>ช่วงเชื่อมั่น 95%</th><th>dz</th><th>p (t จับคู่)</th><th>p (วิลคอกซัน)</th></tr></thead><tbody>' + (p.ready.t.ok ? row('ความพร้อม D เฉลี่ย (เพิ่ม = ดี)', p.ready.t, p.ready.w) : '') + (p.risk.t.ok ? row('ดัชนีความเสี่ยงเฉลี่ย 4 ด้าน (ลด = ดี)', p.risk.t, p.risk.w) : '') + '</tbody></table></div><p class="xwarn">' + ic('alert', 18) + ' ' + esc(p.note) + '</p>' + (p.n < 8 ? '<p class="hint">โรงเรียนน้อยกว่า 8 แห่ง ช่วงเชื่อมั่นกว้างและการทดสอบมีอำนาจต่ำ ให้อ่านเป็นข้อมูลเบื้องต้น</p>' : ''), { icon: 'bars', cls: 'blue' });
      if (p.arms) s += card('เปรียบเทียบการเปลี่ยนแปลงระหว่างกลุ่ม', '<p>กลุ่มทดลอง ' + p.arms.nIv + ' · กลุ่มเปรียบเทียบ ' + p.arms.nCp + '</p><div class="xscroll"><table class="xtb"><thead><tr><th>ตัวแปร</th><th>ผลต่างของการเปลี่ยน (ทดลอง − เปรียบเทียบ)</th><th>ช่วงเชื่อมั่น 95%</th><th>p (เวลช์)</th></tr></thead><tbody>' + [['ความพร้อม D', p.arms.ready], ['ดัชนีความเสี่ยง', p.arms.risk]].map((q) => '<tr><td>' + q[0] + '</td><td>' + n2(q[1].diff, 3) + '</td><td>[' + n2(q[1].ci && q[1].ci[0], 3) + ', ' + n2(q[1].ci && q[1].ci[1], 3) + ']</td><td>' + n2(q[1].p, 4) + '</td></tr>').join('') + '</tbody></table></div>', { icon: 'target' });
      return s;
    }
    function labScore(r) {
      const st = { 'ผ่าน': 'ok', 'ไม่ผ่าน': 'no', 'ยังไม่มีข้อมูล': '' };
      return synBanner() + card('ตัวชี้วัดความสำเร็จของนวัตกรรม', FR + '<p class="hint">เกณฑ์ทุกข้อต้องกำหนดและล็อกก่อนเก็บข้อมูล เพื่อไม่ให้ปรับเกณฑ์ตามผล ถ้าไม่มีข้อมูล ตารางจะแสดง "ยังไม่มีข้อมูล" ไม่ใช่ผ่านหรือไม่ผ่าน</p><ul class="xscore">' + r.score.map((q) => '<li class="' + st[q.status] + '"><span class="xsid">' + q.id + '</span><div><b>' + esc(q.text) + '</b><small>' + esc(q.detail) + '</small></div>' + chip(q.status, st[q.status]) + '</li>').join('') + '</ul><p><button class="tbtn sm" data-act="lab-csv" data-k="score">' + ic('download', 18) + '<span>ดาวน์โหลดตัวชี้วัด (CSV)</span></button></p>', { icon: 'flag' });
    }
    function pageLab() {
      const tab = S.ui.labTab || 'import', r = labRes();
      let s = banner('bars', 'ห้องวิเคราะห์ของผู้วิจัย', 'รวมผลจากโรงเรียน ผู้เชี่ยวชาญ และผู้บริหาร เพื่อพิสูจน์ประสิทธิภาพและพัฒนาคลัง');
      s += tabs('labTab', [['import', 'นำเข้า'], ['learn', 'บทเรียน'], ['experts', 'ผู้เชี่ยวชาญ'], ['admins', 'ผู้บริหาร'], ['pilot', 'ก่อน–หลัง'], ['score', 'ตัวชี้วัด']], tab);
      return s + ({ import: labImport, learn: () => labLearn(r), experts: () => labExperts(r), admins: () => labAdmins(r), pilot: () => labPilot(r), score: () => labScore(r) }[tab])();
    }
    function labCsv(k) {
      const r = labRes();
      if (k === 'proposals') return csvText([['กฎ', 'มาตรการ', 'ชื่อ', 'จำนวนโรงเรียน', 'ข้อเสนอ', 'หลักฐานจากข้อมูล', 'สถานะ']].concat(r.learning.proposals.map((p) => [p.rule, p.sb, p.name, p.n, p.ruleText, p.because, p.status])));
      return csvText([['ตัวชี้วัด', 'เกณฑ์', 'สถานะ', 'รายละเอียด']].concat(r.score.map((q) => [q.id, q.text, q.status, q.detail])));
    }

    // ====================================================================
    // บันทึกในเครื่อง (ต้องเปิดเอง)
    // ====================================================================
    let saveT = null;
    function persist() {
      try {
        if (!T().saveLocal) { localStorage.removeItem(WORK_KEY); localStorage.setItem(FLAG_KEY, '0'); return; }
        clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(WORK_KEY, JSON.stringify(workFile())); localStorage.setItem(FLAG_KEY, '1'); } catch (e) { /* เต็มหรือถูกบล็อก ไม่เป็นไร */ } }, 400);
      } catch (e) { /* ไม่มี localStorage */ }
    }
    function restore() {
      try { if (localStorage.getItem(FLAG_KEY) !== '1') return false; const t = localStorage.getItem(WORK_KEY); if (!t) return false; loadWork(JSON.parse(t)); T().saveLocal = true; return true; } catch (e) { return false; }
    }

    // ====================================================================
    // เหตุการณ์
    // ====================================================================
    function rerender(keep) { const sc = window.scrollY; c.render(true); if (keep) window.scrollTo({ top: sc }); }
    function bind() {
      document.addEventListener('click', (e) => {
        const t = e.target.closest('button'); if (!t || !t.dataset.act || t.disabled) return;
        const a = t.dataset.act;
        if (a === 'xtab') { S.ui[t.dataset.k] = t.dataset.v; c.render(); }
        else if (a === 'xdom') { S.ui[t.dataset.k] = t.dataset.v; rerender(true); }
        else if (a === 'ex-cell') { S.ui.exCell = t.dataset.code; rerender(true); }
        else if (a === 'ex-res') { S.ui.exRes = +t.dataset.v; rerender(true); }
        else if (a === 'use-rules') { S.ui.useRules = !ruleOn(); rerender(true); }
        else if (a === 'rate') {
          const raw = t.dataset.v, v = t.dataset.n ? +raw : raw, cur = getPath(S, t.dataset.path);
          setPath(S, t.dataset.path, cur === v ? null : v);
          const sc = window.scrollY; c.render(true); window.scrollTo({ top: sc });
          const again = document.querySelector('[data-act="rate"][data-path="' + t.dataset.path + '"][data-v="' + raw + '"]'); if (again) again.focus({ preventScroll: true });
        }
        else if (a === 'lg-open') { S.ui.lgOpen = S.ui.lgOpen || {}; S.ui.lgOpen[t.dataset.key] = !S.ui.lgOpen[t.dataset.key]; rerender(true); }
        else if (a === 'snap-save') { const o = getOut(); if (!hasData(o)) return; T().snaps.push(L.makeSnapshot(o, T().snapLabel || (T().snaps.length ? 'รอบที่ ' + T().snaps.length : 'ก่อนเริ่ม'))); T().snapLabel = ''; rerender(true); }
        else if (a === 'snap-del') { T().snaps.splice(+t.dataset.i, 1); rerender(true); }
        else if (a === 'cust-add') { const nc = S.ui.newCustom; if (!nc || !String(nc.name || '').trim()) return; T().custom.push({ dom: nc.dom, elem: nc.elem, name: String(nc.name).trim(), effect: nc.effect ? +nc.effect : null, desc: String(nc.desc || '').trim() }); S.ui.newCustom = null; rerender(true); }
        else if (a === 'cust-del') { T().custom.splice(+t.dataset.i, 1); rerender(true); }
        else if (a === 'file-save') { download('r2safe-workfile-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(workFile(), null, 1)); }
        else if (a === 'file-load') { const f = document.getElementById('work-file'); if (f) f.click(); }
        else if (a === 'rep-dl') {
          const o = getOut(); if (!T().code) T().code = 'S' + Math.random().toString(36).slice(2, 8).toUpperCase();
          const rep = L.makeReport(trackFor(), S.school, o, { includeText: T().includeText, includeProvince: T().includeProvince });
          download('r2safe-report-' + T().code + '.json', JSON.stringify(rep, null, 1));
        }
        else if (a === 'ev-dl') {
          const role = t.dataset.role, now = new Date().toISOString();
          if (role === 'admin') { const x = S.eval.admin; download('r2safe-admin-' + x.code + '.json', JSON.stringify({ schema: V.SCHEMA_ADMIN, version: V.VERSION, code: x.code, createdAt: now, items: x.items, sus: x.sus, comment: x.comment }, null, 1)); }
          else { const x = S.eval.expert; download('r2safe-expert-' + x.code + '.json', JSON.stringify({ schema: V.SCHEMA_EXPERT, version: V.VERSION, caseSet: V.CASESET, code: x.code, field: x.field, createdAt: now, cases: x.cases, items: x.items, comment: x.comment }, null, 1)); }
        }
        else if (a === 'lab-pick') { const f = document.getElementById('lab-file'); if (f) f.click(); }
        else if (a === 'lab-clear') { S.lab.reports = []; S.lab.experts = []; S.lab.admins = []; S.lab.msgs = []; rerender(true); }
        else if (a === 'lab-ex') {
          S.lab.msgs = [];
          fetch('examples/index.json').then((r) => { if (!r.ok) throw new Error('ไม่พบ examples/index.json'); return r.json(); })
            .then((list) => Promise.all(list.map((n) => fetch('examples/' + n).then((r) => r.text()).then((tx) => ingest(tx, n)))))
            .then((m) => { S.lab.msgs = m.filter(Boolean); rerender(true); })
            .catch((er) => { S.lab.msgs = ['โหลดไฟล์ตัวอย่างไม่ได้: ' + er.message + ' (ใช้ได้เมื่อเปิดผ่านเว็บ ไม่ใช่เปิดไฟล์ตรง)']; rerender(true); });
        }
        else if (a === 'lab-csv') { download('r2safe-' + t.dataset.k + '.csv', labCsv(t.dataset.k), 'text/csv;charset=utf-8'); }
      });
      // ช่องกรอกและตัวเลือกที่ผูกกับ state โดยตรง: data-set="เส้นทาง" (data-r = วาดใหม่หลังเปลี่ยน, data-num = ตัวเลข)
      document.addEventListener('input', (e) => {
        const t = e.target; if (!t.dataset || !t.dataset.set || t.dataset.r || t.tagName === 'SELECT' || t.type === 'checkbox') return;
        setPath(S, t.dataset.set, t.type === 'number' ? t.value : t.value); persist();
        if (t.dataset.set.indexOf('eval.') === 0 && (t.dataset.set.endsWith('.code'))) { const b = document.querySelector('[data-act="ev-dl"]'); if (b) { b.disabled = !t.value; const sp = b.querySelector('span'); if (sp) sp.textContent = t.value ? 'ดาวน์โหลดไฟล์คำตอบ' : 'ใส่รหัสผู้ตอบก่อนดาวน์โหลด'; } }
      });
      document.addEventListener('change', (e) => {
        const t = e.target; if (!t || !t.dataset) return;
        if (t.dataset.arr) { const arr = getPath(S, t.dataset.arr) || []; const i = arr.indexOf(t.dataset.v); if (t.checked && i < 0) arr.push(t.dataset.v); if (!t.checked && i >= 0) arr.splice(i, 1); setPath(S, t.dataset.arr, arr); persist(); return; }
        if (t.dataset.set) {
          const v = t.type === 'checkbox' ? t.checked : (t.dataset.num ? (t.value === '' ? undefined : parseFloat(t.value)) : t.value);
          setPath(S, t.dataset.set, v);
          if (t.dataset.set === 'track.saveLocal') persist();
          if (t.dataset.r) { if (t.dataset.num && v === undefined) { const p = t.dataset.set.split('.'); const o = getPath(S, p.slice(0, -1).join('.')); if (o) delete o[p[p.length - 1]]; } rerender(true); }
          persist(); return;
        }
        if (t.id === 'lab-file') {
          S.lab.msgs = []; const files = Array.prototype.slice.call(t.files || []);
          Promise.all(files.map((f) => (f.size > 5 * 1048576 ? Promise.resolve(f.name + ': ใหญ่เกิน 5 MB') : f.text().then((tx) => ingest(tx, f.name))))).then((m) => { S.lab.msgs = m.filter(Boolean); rerender(true); });
        } else if (t.id === 'work-file') {
          const f = (t.files || [])[0]; if (!f) return;
          f.text().then((tx) => { try { loadWork(JSON.parse(tx)); rerender(true); const m = document.getElementById('work-msg'); if (m) m.textContent = 'เปิดแฟ้มงานแล้ว'; } catch (er) { const m = document.getElementById('work-msg'); if (m) m.textContent = 'เปิดไม่ได้: ' + er.message; } });
        }
      });
    }

    return { bind, persist, restore, workFile, pages: { explain: pageExplain, track: pageTrack, evaluate: pageEvaluate, lab: pageLab } };
  }
  root.RS_TOOL2 = { create };
})(window);
