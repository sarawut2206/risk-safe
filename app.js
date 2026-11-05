/* R²-SAFE ต้นแบบ V0.2: หน้าจอแดชบอร์ด ประมวลผลในเบราว์เซอร์เท่านั้น ไม่เก็บ ไม่ส่งข้อมูลออก */
(function () {
  'use strict';
  const D = RS_DATA, E = RS_ENGINE;
  const S = {
    risk: {}, seven: {}, resource: 'ปานกลาง', params: Object.assign({}, E.DEFAULT_PARAMS),
    status: {}, aar: '',
    ui: { step: 1, riskDom: 'V', sevEl: 'STG', stratDom: 'V', bank: { q: '', dom: '', el: '', t3: '', res: '' } },
  };
  const SHORT_DOM = { V: 'ความรุนแรงของมนุษย์', A: 'อุบัติเหตุและภัยพิบัติ', P: 'การละเมิดสิทธิ', H: 'สุขภาวะกายและจิตใจ' };
  const SHORT_EL = { STG: 'กลยุทธ์', STR: 'โครงสร้าง', SYS: 'ระบบ', STY: 'รูปแบบการบริหาร', STF: 'บุคลากร', SKL: 'ทักษะ', VAL: 'ค่านิยมร่วม' };
  const STATUS = ['ยังไม่เริ่ม', 'กำลังดำเนินการ', 'เสร็จแล้ว'];
  const RANKCOL = { hi: '#d64545', mid: '#e0a526', lo: '#2e9e6b' };

  const ICON = {
    dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    input: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13 7l4 4"/></svg>',
    matrix: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>',
    strategy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>',
    plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></svg>',
    bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5c0-1 3.6-2 8-2s8 1 8 2-3.6 2-8 2-8-1-8-2z"/><path d="M4 5v7c0 1 3.6 2 8 2s8-1 8-2V5M4 12v7c0 1 3.6 2 8 2s8-1 8-2v-7"/></svg>',
    rules: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>',
    about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  };
  const PAGES = [
    { id: 'dash', label: 'ภาพรวม', title: 'ภาพรวมความเสี่ยงและความพร้อม', sub: 'สรุปผลจากข้อมูลที่กรอก: ระดับความเสี่ยงรายด้าน ความพร้อมตาม 7-S และกลุ่มแนวทางตอบสนอง' },
    { id: 'input', label: 'ป้อนข้อมูล', title: 'ป้อนข้อมูลโรงเรียน', sub: 'กรอก 3 ส่วน: ทรัพยากร ความเสี่ยง 4 ด้านของภัย และความพร้อมตาม 7-S ใช้ข้อมูลจำลองหรือรหัสแทนชื่อจริง' },
    { id: 'matrix', label: 'ตารางความเสี่ยง × ความพร้อม', title: 'ตารางตัดสินใจ Risk × Readiness (R1–R9)', sub: 'จับคู่ระดับความเสี่ยงรายด้านกับระดับความพร้อมขององค์กร เป็นกลุ่มแนวทางตอบสนอง' },
    { id: 'strategy', label: 'กลยุทธ์ที่เสนอ', title: 'กลยุทธ์และมาตรการที่ระบบเสนอ', sub: 'พร้อมเหตุผลของการเลือกที่ตรวจย้อนกลับได้ ผู้อำนวยการเป็นผู้ตัดสินใจขั้นสุดท้าย' },
    { id: 'plan', label: 'แผนปฏิบัติการและติดตามผล', title: 'แผนปฏิบัติการและติดตามผล', sub: 'ผู้รับผิดชอบ ตัวชี้วัด ระยะเวลา และสถานะการดำเนินงาน (ต้นแบบ: สถานะไม่ถูกบันทึกถาวร)' },
    { sep: 'ข้อมูลอ้างอิง' },
    { id: 'bank', label: 'คลังมาตรการ', title: 'คลังมาตรการ (Strategy Bank) ร่างเริ่มต้น 62 รายการ', sub: 'ร่างที่ผู้วิจัยจัดทำ ยังไม่ผูกแหล่งอ้างอิงรายข้อและยังไม่ผ่านเดลฟาย ใช้สาธิตการทำงานของระบบ' },
    { id: 'rules', label: 'กฎและเกณฑ์', title: 'กฎการตัดสินใจและเกณฑ์เบื้องต้น', sub: 'ค่าเริ่มต้นเป็นร่างตามบทที่ 3 ยังไม่ผ่านเดลฟาย แก้ได้เพื่อทดสอบความไวของผล' },
    { id: 'about', label: 'เกี่ยวกับต้นแบบ', title: 'เกี่ยวกับต้นแบบ R²-SAFE', sub: 'ระบบนี้ตอบอะไร ทำงานอย่างไร และสถานะของต้นแบบ' },
  ];

  // ---------- ตัวช่วย ----------
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (x, n) => (isFinite(x) ? x.toFixed(n) : '–');
  const cls = { 'สูง': 'hi', 'กลาง': 'mid', 'ต่ำ': 'lo' };
  const riskTag = (l) => (l ? '<span class="tag ' + cls[l] + '">' + l + '</span>' : '–');
  const readyTag = (l) => (l ? '<span class="tag ' + ({ 'สูง': 'lo', 'กลาง': 'mid', 'ต่ำ': 'hi' }[l]) + '">' + l + '</span>' : '–');
  const elName = (c) => (D.elements.find((e) => e.code === c) || {}).name || c;
  const getOut = () => E.analyze({ risk: S.risk, seven: S.seven, resource: S.resource }, D, S.params);
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

  // ---------- แผนภูมิ SVG ----------
  function chartRisk(out) {
    const x0 = 178, sc = 13.6, W = 580;
    let s = '<svg viewBox="0 0 ' + W + ' 235" role="img" aria-label="ดัชนีความเสี่ยงรายด้าน">';
    [[out.params.riskLow, 'ต่ำ ≤ ' + out.params.riskLow], [out.params.riskMid, 'กลาง ≤ ' + out.params.riskMid]].forEach((t) => {
      s += '<line x1="' + (x0 + t[0] * sc) + '" y1="22" x2="' + (x0 + t[0] * sc) + '" y2="205" stroke="#9fb0c4" stroke-dasharray="4 4"/><text x="' + (x0 + t[0] * sc) + '" y="15" font-size="11" fill="#5d6c80" text-anchor="middle">' + t[1] + '</text>';
    });
    out.domains.forEach((d, i) => {
      const y = 36 + i * 44, v = isFinite(d.rd) ? d.rd : 0, c = RANKCOL[cls[d.risk]] || '#c9d3df';
      s += '<text x="0" y="' + (y + 17) + '" font-size="13" fill="#14233a">' + esc(d.code + ' ' + SHORT_DOM[d.code]) + '</text>';
      s += '<rect x="' + x0 + '" y="' + y + '" width="' + (25 * sc) + '" height="26" rx="5" fill="#f1f5f9"/>';
      s += '<rect x="' + x0 + '" y="' + y + '" width="' + Math.max(2, v * sc) + '" height="26" rx="5" fill="' + c + '"/>';
      s += '<text x="' + (x0 + Math.min(v, 21) * sc + 8) + '" y="' + (y + 18) + '" font-size="13" font-weight="700" fill="#14233a">' + fmt(d.rd, 2) + (d.risk ? ' · ' + d.risk : '') + (d.override ? ' (ยกระดับ)' : '') + '</text>';
    });
    s += '<text x="' + (x0 + 25 * sc) + '" y="226" font-size="11" fill="#5d6c80" text-anchor="end">ดัชนี R = ค่าเฉลี่ย L×C (1–25)</text></svg>';
    return s;
  }
  function chartRadar(out) {
    const cx = 190, cy = 150, R = 100, n = out.elements.length;
    const pt = (i, v) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n, r = (R * v) / 5; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    let s = '<svg viewBox="0 0 380 300" role="img" aria-label="สภาพปัจจุบันและสภาพที่พึงประสงค์ตาม 7-S">';
    for (let k = 1; k <= 5; k++) s += '<polygon points="' + out.elements.map((_, i) => pt(i, k).join(',')).join(' ') + '" fill="none" stroke="#dbe3ec"/>';
    out.elements.forEach((e, i) => {
      const p = pt(i, 5), l = pt(i, 5.9);
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="#dbe3ec"/>';
      s += '<text x="' + l[0] + '" y="' + (l[1] + 4) + '" font-size="12" fill="#14233a" text-anchor="' + (l[0] < cx - 8 ? 'end' : l[0] > cx + 8 ? 'start' : 'middle') + '">' + esc(SHORT_EL[e.code]) + '</text>';
    });
    const poly = (key, stroke, fill, dash) => '<polygon points="' + out.elements.map((e, i) => pt(i, isFinite(e[key]) ? e[key] : 0).join(',')).join(' ') + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2"' + (dash ? ' stroke-dasharray="6 4"' : '') + '/>';
    s += poly('i', '#0f7b6c', 'rgba(15,123,108,.10)', true) + poly('d', '#1f5fae', 'rgba(31,95,174,.25)', false);
    s += '</svg><div class="legend-row"><span><i class="dot" style="background:#1f5fae"></i>D สภาพปัจจุบัน</span><span><i class="dot" style="background:#0f7b6c"></i>I สภาพที่พึงประสงค์</span><span>วงนอกสุด = 5</span></div>';
    return s;
  }
  function chartPni(out) {
    const list = out.elements.filter((e) => e.rank).sort((a, b) => a.rank - b.rank);
    const mx = Math.max.apply(null, list.map((e) => e.pni).concat([0.01]));
    let s = '<svg viewBox="0 0 440 ' + (list.length * 34 + 8) + '" role="img" aria-label="PNI Modified รายองค์ประกอบ">';
    list.forEach((e, i) => {
      const y = 4 + i * 34, w = (e.pni / mx) * 230, top = e.rank <= 3;
      s += '<text x="0" y="' + (y + 18) + '" font-size="13" fill="#14233a">' + e.rank + '. ' + esc(SHORT_EL[e.code]) + '</text>';
      s += '<rect x="130" y="' + y + '" width="' + Math.max(2, w) + '" height="24" rx="5" fill="' + (top ? '#0f7b6c' : '#aab9cb') + '"/>';
      s += '<text x="' + (136 + w) + '" y="' + (y + 17) + '" font-size="12" font-weight="700" fill="#14233a">' + fmt(e.pni, 3) + '</text>';
    });
    return s + '</svg><div class="legend-row"><span><i class="dot" style="background:#0f7b6c"></i>3 อันดับช่องว่างสูงสุด (ใช้เลือกมาตรการก่อน)</span></div>';
  }

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
  function emptyState() {
    return '<div class="card empty"><h2>ยังไม่มีข้อมูลสำหรับวิเคราะห์</h2><p>กรอกข้อมูลโรงเรียนเองใน 3 ขั้นตอน หรือโหลดข้อมูลตัวอย่าง (โรงเรียนสมมติ) เพื่อดูว่าระบบทำงานอย่างไร</p>' +
      '<button class="btn primary" data-act="example">ใส่ข้อมูลตัวอย่างและดูผล</button> <button class="btn" data-go="input">กรอกข้อมูลเอง</button></div>';
  }
  function pageDash() {
    const out = getOut();
    if (!out.domains.some((d) => d.group)) return emptyState();
    const hi = out.domains.filter((d) => d.risk === 'สูง'), nMeas = uniq([].concat.apply([], out.domains.map((d) => d.measures.map((m) => m.id)))).length, t1 = out.top3[0];
    let s = '<div class="grid g4">';
    s += '<div class="card kpi"><div class="lab">ระดับความพร้อมรวม (7-S)</div><div class="val">' + fmt(out.readyMean, 2) + ' <small>/ 5</small></div><div>' + readyTag(out.readyFinal) + '</div><div class="note">' + (out.floorHit ? 'ใช้กฎเพดาน: โครงสร้างหรือระบบต่ำกว่า ' + out.params.floorD : 'ค่าเฉลี่ย D ของ 7 องค์ประกอบ') + '</div></div>';
    s += '<div class="card kpi"><div class="lab">ด้านที่มีความเสี่ยงสูง</div><div class="val">' + hi.length + ' <small>จาก ' + out.domains.length + ' ด้าน</small></div><div class="note">' + (hi.length ? esc(hi.map((d) => SHORT_DOM[d.code]).join(' · ')) : 'ไม่มีด้านที่จัดเป็นความเสี่ยงสูง') + '</div></div>';
    s += '<div class="card kpi"><div class="lab">ช่องว่างสูงสุดของ 7-S</div><div class="val" style="font-size:1.45rem">' + esc(t1 ? SHORT_EL[t1.code] : '–') + '</div><div class="note">PNI Modified ' + (t1 ? fmt(t1.pni, 3) : '–') + ' (D ' + (t1 ? fmt(t1.d, 2) : '–') + ' → I ' + (t1 ? fmt(t1.i, 2) : '–') + ')</div></div>';
    s += '<div class="card kpi"><div class="lab">มาตรการที่ระบบเสนอ</div><div class="val">' + nMeas + ' <small>รายการ</small></div><div class="note">ทรัพยากรที่มี: ' + esc(out.resource) + ' (สูงสุด ' + out.resourceMax + ' ข้อต่อด้าน)</div></div></div>';
    s += '<div class="grid g21" style="margin-top:14px"><div class="card"><h3>ดัชนีความเสี่ยงรายด้าน</h3><p class="hint">แท่งสีตามระดับ เส้นประคือค่าตัดระดับต่ำและกลาง</p>' + chartRisk(out) + '<div class="legend-row"><span><i class="dot" style="background:#d64545"></i>สูง</span><span><i class="dot" style="background:#e0a526"></i>กลาง</span><span><i class="dot" style="background:#2e9e6b"></i>ต่ำ</span></div></div>';
    s += '<div class="card"><h3>ตารางตัดสินใจ R1–R9</h3><p class="hint">กรอบเข้มคือกลุ่มที่ด้านของภัยตกอยู่</p>' + matrixHtml(out, true) + '<p style="margin:10px 0 0"><button class="btn sm" data-go="matrix">ดูรายละเอียด</button></p></div></div>';
    s += '<div class="grid g2" style="margin-top:14px"><div class="card"><h3>ความพร้อมตาม 7-S: สภาพปัจจุบันเทียบสภาพที่พึงประสงค์</h3>' + chartRadar(out) + '</div>';
    s += '<div class="card"><h3>ช่องว่างตาม PNI Modified</h3><p class="hint">PNI = (I − D) / D จัดอันดับองค์ประกอบที่ควรพัฒนาก่อน</p>' + chartPni(out) + '</div></div>';
    s += '<div class="card" style="margin-top:14px"><h3>สรุปรายด้านและกลุ่มแนวทางตอบสนอง</h3><div class="scroll"><table><thead><tr><th>ด้านของภัย</th><th class="n">ดัชนี R</th><th>ความเสี่ยง</th><th>ความพร้อม</th><th>กลุ่ม</th><th>แนวทางตอบสนอง</th><th></th></tr></thead><tbody>' +
      out.domains.map((d) => '<tr><td>' + esc(d.code + ' ' + d.name) + '</td><td class="n">' + fmt(d.rd, 2) + '</td><td>' + riskTag(d.risk) + (d.override ? ' <span class="pill">ยกระดับ</span>' : '') + '</td><td>' + readyTag(d.ready) + '</td><td><b>' + (d.group || '–') + '</b></td><td>' + esc(d.pkg ? d.pkg.name : '–') + '</td><td><button class="btn sm" data-act="strat" data-dom="' + d.code + '">ดูมาตรการ</button></td></tr>').join('') +
      '</tbody></table></div></div>';
    return s;
  }

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
  function stepper() {
    const f = filled(), st = S.ui.step;
    const tab = (n, label, done) => '<button class="step ' + (st === n ? 'on ' : '') + (done ? 'done' : '') + '" data-act="step" data-step="' + n + '"><b>' + (done && st !== n ? '✓' : n) + '</b>' + label + '</button>';
    return '<div class="stepper">' + tab(1, 'ทรัพยากร', true) + tab(2, 'ความเสี่ยง (' + f.r + '/' + f.rt + ')', f.r === f.rt) + tab(3, 'ความพร้อม 7-S (' + f.s + '/' + f.st + ')', f.s === f.st) + '</div>';
  }
  function pageInput() {
    let s = stepper();
    const st = S.ui.step;
    if (st === 1) {
      s += '<div class="card"><h3>ระดับทรัพยากรที่มีสำหรับงานความปลอดภัยปีนี้</h3><p class="hint">ใช้จำกัดจำนวนและระดับของมาตรการที่ระบบเสนอ (บุคลากร งบประมาณ อุปกรณ์)</p><div class="field"><select id="res-level" aria-label="ระดับทรัพยากร">' +
        ['จำกัด', 'ปานกลาง', 'เพียงพอ'].map((r) => '<option value="' + r + '"' + (S.resource === r ? ' selected' : '') + '>' + r + ' — มาตรการทรัพยากรระดับ 1' + (r === 'จำกัด' ? '' : r === 'ปานกลาง' ? '–2' : '–3') + ' สูงสุด ' + E.RESOURCE[r].max + ' ข้อต่อด้าน</option>').join('') + '</select></div>' +
        '<div class="alert-note" style="margin-top:14px;font-size:.9rem;color:#5d6c80">ข้อมูลที่กรอกประมวลผลในเบราว์เซอร์เท่านั้น และจะหายเมื่อรีเฟรชหน้า อย่ากรอกชื่อบุคคลหรือรายละเอียดเหตุการณ์จริง</div>' +
        '<div class="nav-row"><span></span><button class="btn primary" data-act="step" data-step="2">ถัดไป: ความเสี่ยง</button></div></div>';
    } else if (st === 2) {
      s += '<div class="card"><h3>ความเสี่ยง 4 ด้านของภัย</h3><p class="hint">L = ความถี่ในปีการศึกษา, C = ความรุนแรงของผลกระทบ ให้คะแนน 1–5 (ชี้ที่ตัวเลขเพื่อดูความหมาย คลิกซ้ำเพื่อลบ)</p>' + legendBox('เกณฑ์คะแนน L ความถี่ (ร่าง รอเดลฟาย)', D.lAnchors) + legendBox('เกณฑ์คะแนน C ผลกระทบ (ร่าง รอเดลฟาย)', D.cAnchors);
      s += '<div class="tabs" role="group" aria-label="เลือกด้านของภัย">' + D.domains.map((d) => '<button aria-pressed="' + (S.ui.riskDom === d.code) + '" data-act="tab-risk" data-code="' + d.code + '">' + esc(SHORT_DOM[d.code]) + '<small>' + domFill(d.code) + '/' + D.riskItems.filter((x) => x.dom === d.code).length + '</small></button>').join('') + '</div>';
      s += '<div>' + D.riskItems.filter((r) => r.dom === S.ui.riskDom).map((r) => '<div class="item"><div class="t"><span class="id">' + r.id + '</span>' + esc(r.text) + '<small>' + esc(r.space) + '</small></div><div class="ctls"><span class="ctl">L ' + pills('risk', r.id, 0, D.lAnchors) + '</span><span class="ctl">C ' + pills('risk', r.id, 1, D.cAnchors) + '</span></div></div>').join('') + '</div>';
      const di = D.domains.findIndex((d) => d.code === S.ui.riskDom), nx = D.domains[di + 1];
      s += '<div class="nav-row"><button class="btn" data-act="' + (di ? 'tab-risk' : 'step') + '" data-code="' + (di ? D.domains[di - 1].code : '') + '" data-step="1">ย้อนกลับ</button>' +
        (nx ? '<button class="btn primary" data-act="tab-risk" data-code="' + nx.code + '">ถัดไป: ' + esc(SHORT_DOM[nx.code]) + '</button>' : '<button class="btn primary" data-act="step" data-step="3">ถัดไป: ความพร้อม 7-S</button>') + '</div></div>';
    } else {
      s += '<div class="card"><h3>ความพร้อมตามกรอบ McKinsey 7-S</h3><p class="hint">D = สภาพปัจจุบัน, I = สภาพที่พึงประสงค์ ให้คะแนน 1–5 ด้วยหลักฐานการปฏิบัติจริง ไม่ใช่เพียงมีหรือไม่มีนโยบาย</p>' + legendBox('เกณฑ์คะแนน D (I ใช้ระดับเดียวกัน)', D.dAnchors);
      s += '<div class="tabs" role="group" aria-label="เลือกองค์ประกอบ 7-S">' + D.elements.map((e) => '<button aria-pressed="' + (S.ui.sevEl === e.code) + '" data-act="tab-sev" data-code="' + e.code + '">' + esc(SHORT_EL[e.code]) + '<small>' + elFill(e.code) + '/' + D.sevenItems.filter((x) => x.elem === e.code).length + '</small></button>').join('') + '</div>';
      s += '<div>' + D.sevenItems.filter((x) => x.elem === S.ui.sevEl).map((x) => '<div class="item"><div class="t"><span class="id">' + x.id + '</span>' + esc(x.text) + '</div><div class="ctls"><span class="ctl">D ' + pills('seven', x.id, 0, D.dAnchors) + '</span><span class="ctl">I ' + pills('seven', x.id, 1, D.dAnchors) + '</span></div></div>').join('') + '</div>';
      const ei = D.elements.findIndex((e) => e.code === S.ui.sevEl), nx = D.elements[ei + 1];
      s += '<div class="nav-row"><button class="btn" data-act="' + (ei ? 'tab-sev' : 'step') + '" data-code="' + (ei ? D.elements[ei - 1].code : '') + '" data-step="2">ย้อนกลับ</button>' +
        (nx ? '<button class="btn primary" data-act="tab-sev" data-code="' + nx.code + '">ถัดไป: ' + esc(SHORT_EL[nx.code]) + '</button>' : '<button class="btn primary" data-go="dash">ดูผลวิเคราะห์</button>') + '</div></div>';
    }
    return s;
  }

  function pageMatrix() {
    const out = getOut();
    let s = '<div class="card"><h3>ตารางตัดสินใจ 3 × 3</h3><p class="hint">แถว = ระดับความเสี่ยงของด้านของภัย, คอลัมน์ = ระดับความพร้อมขององค์กร (กรอบเข้มและตัวอักษรย่อ V A P H คือด้านที่ตกอยู่ในกลุ่มนั้นตามข้อมูลที่กรอก) สีเข้มคือเร่งด่วนกว่า</p>' + matrixHtml(hasData() ? out : null, false) + '</div>';
    s += '<div class="card" style="margin-top:14px"><h3>กลุ่มแนวทางตอบสนองและชุดการตัดสินใจ</h3><div class="scroll"><table><thead><tr><th>กลุ่ม</th><th>ความเสี่ยง</th><th>ความพร้อม</th><th>แนวทาง</th><th>คำอธิบาย</th><th>เริ่มดำเนินการ</th><th>ทบทวน</th></tr></thead><tbody>' +
      D.packages.map((p) => '<tr><td><b>' + p.code + '</b></td><td>' + riskTag(p.risk) + '</td><td>' + readyTag(p.ready) + '</td><td>' + esc(p.name) + '</td><td>' + esc(p.summary) + '</td><td>' + esc(p.start) + '</td><td>' + esc(p.review) + '</td></tr>').join('') + '</tbody></table></div></div>';
    return s;
  }

  function pageStrategy() {
    const out = getOut();
    if (!out.domains.some((d) => d.group)) return emptyState();
    const dom = out.domains.find((d) => d.code === S.ui.stratDom) || out.domains[0];
    let s = '<div class="tabs" role="group" aria-label="เลือกด้านของภัย">' + out.domains.map((d) => '<button aria-pressed="' + (d.code === dom.code) + '" data-act="tab-strat" data-code="' + d.code + '">' + esc(SHORT_DOM[d.code]) + ' <small>' + (d.group || '–') + '</small></button>').join('') + '</div>';
    s += '<div class="grid g21"><div class="stack">';
    s += '<div class="card pkg"><div class="lab" style="color:#5d6c80;font-size:.85rem">' + esc(dom.code + ' ' + dom.name) + ' · ความเสี่ยง ' + riskTag(dom.risk) + ' × ความพร้อม ' + readyTag(dom.ready) + '</div><div class="big">' + dom.group + ' ' + esc(dom.pkg.name) + '</div><div>' + esc(dom.pkg.summary) + '</div>' +
      '<div class="legend-row"><span>เริ่มดำเนินการ: <b>' + esc(dom.pkg.start) + '</b></span><span>รอบทบทวน: <b>' + esc(dom.pkg.review) + '</b></span></div><b style="display:block;margin-top:8px">ชุดการตัดสินใจ 6 ข้อ</b><ol>' + dom.pkg.decisions.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol></div>';
    s += '<div class="card"><h3>มาตรการที่เสนอ (' + dom.measures.length + ' ข้อ)</h3><p class="hint">เรียงตามความตรงกับองค์ประกอบ 7-S ที่ช่องว่างสูงสุด แล้วตามลำดับในคลัง แถบสีเขียวคือมาตรการที่ตอบ 3 อันดับช่องว่างสูงสุด</p><div class="meas">' +
      dom.measures.map((m) => '<div class="m' + (m.top ? ' top' : '') + '"><h4>' + m.order + '. ' + esc(m.name) + ' <span class="pill">' + m.id + '</span></h4><div>' + esc(m.desc) + '</div><div class="meta"><span class="pill teal">' + esc(SHORT_EL[m.elem]) + '</span><span>ประเภท: ' + esc(m.type3) + '</span><span>ทรัพยากรระดับ ' + m.res + '</span><span>ผู้รับผิดชอบ: ' + esc(m.owner) + '</span></div><div class="kpi"><b>ตัวชี้วัด:</b> ' + esc(m.kpi) + '</div><div class="why"><b>เหตุผลการเลือก:</b> ' + esc(m.why) + '</div></div>').join('') + '</div></div></div>';
    s += '<div class="stack"><div class="card"><h3>ช่องว่าง 7-S ที่ใช้เลือกมาตรการ</h3>' + chartPni(out) + '</div>' +
      '<div class="card"><h3>ขั้นต่อไป</h3><p class="hint">นำมาตรการไปจัดทำแผนปฏิบัติการและติดตามผล</p><button class="btn primary" data-go="plan">ไปที่แผนปฏิบัติการ</button> <button class="btn" onclick="window.print()">พิมพ์หน้านี้</button></div></div></div>';
    return s;
  }

  function pagePlan() {
    const out = getOut();
    if (!out.domains.some((d) => d.group)) return emptyState();
    const rows = [];
    out.domains.forEach((d) => d.measures.forEach((m) => rows.push({ d, m, key: mKey(d.code, m.id) })));
    const done = rows.filter((r) => S.status[r.key] === 'เสร็จแล้ว').length, doing = rows.filter((r) => S.status[r.key] === 'กำลังดำเนินการ').length;
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
    let s = '<div class="grid g4"><div class="card kpi"><div class="lab">ความก้าวหน้ารวม</div><div class="val">' + pct(done, rows.length) + '% <small>(' + done + '/' + rows.length + ')</small></div><div class="prog" style="margin-top:6px"><i style="width:' + pct(done, rows.length) + '%"></i></div></div>' +
      '<div class="card kpi"><div class="lab">กำลังดำเนินการ</div><div class="val">' + doing + '</div></div><div class="card kpi"><div class="lab">ยังไม่เริ่ม</div><div class="val">' + (rows.length - done - doing) + '</div></div>' +
      '<div class="card kpi"><div class="lab">ส่งออก</div><div style="margin-top:6px"><button class="btn sm primary" data-act="csv">ดาวน์โหลด CSV</button> <button class="btn sm" onclick="window.print()">พิมพ์</button></div></div></div>';
    s += '<div class="card" style="margin-top:14px"><h3>ความก้าวหน้ารายด้าน</h3>' + out.domains.map((d) => { const r = rows.filter((x) => x.d.code === d.code), dn = r.filter((x) => S.status[x.key] === 'เสร็จแล้ว').length; return '<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:.9rem"><span>' + esc(d.code + ' ' + SHORT_DOM[d.code]) + ' · ' + (d.group || '') + '</span><span>' + dn + '/' + r.length + '</span></div><div class="prog"><i style="width:' + pct(dn, r.length) + '%"></i></div></div>'; }).join('') + '</div>';
    s += '<div class="card" style="margin-top:14px"><h3>แผนปฏิบัติการ</h3><p class="hint">ปรับสถานะได้ในหน้านี้ (ไม่ถูกบันทึกถาวร) ตัวชี้วัดและผู้รับผิดชอบเป็นข้อเสนอเริ่มต้นจากคลัง ผู้อำนวยการปรับได้</p><div class="scroll"><table><thead><tr><th>ด้าน</th><th>มาตรการ</th><th>ผู้รับผิดชอบ</th><th>ตัวชี้วัด</th><th>เริ่ม</th><th>ทบทวน</th><th>สถานะ</th></tr></thead><tbody>' +
      rows.map((r) => '<tr><td>' + esc(r.d.code + ' · ' + r.d.group) + '</td><td><b>' + esc(r.m.id + ' ' + r.m.name) + '</b></td><td>' + esc(r.m.owner) + '</td><td>' + esc(r.m.kpi) + '</td><td>' + esc(r.d.pkg.start) + '</td><td>' + esc(r.d.pkg.review) + '</td><td><select class="st" data-st="' + r.key + '" aria-label="สถานะ ' + esc(r.m.id) + '">' + STATUS.map((x) => '<option' + ((S.status[r.key] || STATUS[0]) === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></td></tr>').join('') + '</tbody></table></div></div>';
    s += '<div class="card" style="margin-top:14px"><h3>บันทึกการทบทวนหลังดำเนินการ (AAR)</h3><p class="hint">สิ่งที่ตั้งใจ สิ่งที่เกิดขึ้นจริง ข้อเรียนรู้ และข้อมูลที่ต้องย้อนกลับไปปรับในขั้นที่ 1–4 (อย่าใส่ชื่อบุคคลหรือรายละเอียดที่ระบุตัวได้)</p><textarea id="aar" aria-label="บันทึกการทบทวนหลังดำเนินการ">' + esc(S.aar) + '</textarea></div>';
    return s;
  }

  function benchFilters() {
    const b = S.ui.bank;
    const opt = (items, cur, all) => '<option value="">' + all + '</option>' + items.map((i) => '<option value="' + esc(i[0]) + '"' + (cur === i[0] ? ' selected' : '') + '>' + esc(i[1]) + '</option>').join('');
    return '<div class="filters"><label>ค้นหา<input type="search" id="f-q" value="' + esc(b.q) + '" placeholder="ชื่อ รายละเอียด ตัวชี้วัด"></label>' +
      '<label>ด้านของภัย<select id="f-dom">' + opt(D.domains.map((d) => [d.code, d.code + ' ' + SHORT_DOM[d.code]]).concat([['X', 'X ข้ามด้าน']]), b.dom, 'ทั้งหมด') + '</select></label>' +
      '<label>องค์ประกอบ 7-S<select id="f-el">' + opt(D.elements.map((e) => [e.code, SHORT_EL[e.code]]), b.el, 'ทั้งหมด') + '</select></label>' +
      '<label>ประเภท 3 ป.<select id="f-t3">' + opt(uniq(D.bank.map((x) => x.type3)).map((t) => [t, t]), b.t3, 'ทั้งหมด') + '</select></label>' +
      '<label>ทรัพยากร<select id="f-res">' + opt([['1', 'ระดับ 1'], ['2', 'ระดับ 2'], ['3', 'ระดับ 3']], b.res, 'ทั้งหมด') + '</select></label></div>';
  }
  function bankRows() {
    const b = S.ui.bank, q = b.q.trim().toLowerCase();
    return D.bank.filter((x) => (!b.dom || x.dom === b.dom) && (!b.el || x.elem === b.el) && (!b.t3 || x.type3 === b.t3) && (!b.res || String(x.res) === b.res) && (!q || (x.name + x.desc + x.kpi + x.owner).toLowerCase().indexOf(q) >= 0));
  }
  function bankTable() {
    const rows = bankRows();
    return '<p class="hint" aria-live="polite">แสดง ' + rows.length + ' จาก ' + D.bank.length + ' รายการ</p><div class="scroll"><table><thead><tr><th>รหัส</th><th>ด้าน</th><th>มาตรการ</th><th>7-S</th><th>3 ป.</th><th>ระยะ</th><th class="n">ทรัพยากร</th><th>ผู้รับผิดชอบ</th><th>ตัวชี้วัด</th><th>เหมาะกับความเสี่ยง</th><th>เหมาะกับความพร้อม</th></tr></thead><tbody>' +
      rows.map((x) => '<tr><td>' + x.id + '</td><td>' + x.dom + '</td><td><b>' + esc(x.name) + '</b><br>' + esc(x.desc) + '</td><td>' + esc(SHORT_EL[x.elem]) + '</td><td>' + esc(x.type3) + '</td><td>' + esc(x.phase) + '</td><td class="n">' + x.res + '</td><td>' + esc(x.owner) + '</td><td>' + esc(x.kpi) + '</td><td>' + esc(x.risk) + '</td><td>' + esc(x.ready) + '</td></tr>').join('') + '</tbody></table></div>';
  }
  function pageBank() { return '<div class="card">' + benchFilters() + '<div id="bank-wrap">' + bankTable() + '</div></div>'; }

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
      '<div class="card" style="margin-top:14px"><h3>สถานะของต้นแบบ</h3><ul style="padding-left:1.2em;margin:6px 0"><li>เครื่องคำนวณย้ายจากเครื่องมือ Excel ต้นแบบ และทดสอบเทียบผล 70 รายการกับ Excel ด้วยข้อมูลตัวอย่างชุดเดียวกัน (โฟลเดอร์ <code>tests</code> ใน GitHub)</li><li>ข้อมูลตัวอย่างเป็นโรงเรียนสมมติ ไม่ใช่ผลของโรงเรียนจริง</li><li>เกณฑ์ ตารางตัดสินใจ และคลังมาตรการ 62 รายการเป็นร่างเริ่มต้น ยังไม่ผ่านเดลฟาย การตรวจ IOC และการประเมินโดยผู้ทรงคุณวุฒิ</li><li>ยังไม่มี QSPM ระบบสมาชิก ฐานข้อมูล และการบันทึกประวัติการอนุมัติ ซึ่งวางแผนไว้หลังเกณฑ์ผ่านเดลฟายและได้รับการรับรองจริยธรรมการวิจัย</li><li>ผลของระบบเป็นข้อเสนอสนับสนุนการวางแผน ไม่ใช้แทนดุลยพินิจของผู้อำนวยการ ไม่ใช้ตัดสินหรือจัดอันดับโรงเรียน และไม่ใช้แทนการตอบสนองเหตุฉุกเฉิน</li></ul></div>';
  }

  // ---------- เราเตอร์และการวาด ----------
  const RENDER = { dash: pageDash, input: pageInput, matrix: pageMatrix, strategy: pageStrategy, plan: pagePlan, bank: pageBank, rules: pageRules, about: pageAbout };
  let cur = 'dash';
  function chip() {
    const f = filled();
    const c = $('#fill-chip'); c.textContent = 'กรอกแล้ว ' + f.pct + '%'; c.className = 'chip' + (f.pct === 100 ? ' ok' : '');
  }
  function buildNav() {
    $('#nav').innerHTML = PAGES.map((p) => p.sep ? '<div class="sep">' + p.sep + '</div>' : '<button data-go="' + p.id + '" aria-current="' + (p.id === cur ? 'page' : 'false') + '">' + ICON[p.id] + '<span>' + p.label + '</span></button>').join('');
  }
  function render(keepScroll) {
    const p = PAGES.find((x) => x.id === cur);
    $('#page-title').textContent = p.title; $('#page-sub').textContent = p.sub;
    document.title = p.title + ' · R²-SAFE ต้นแบบ';
    $('#view').innerHTML = RENDER[cur]();
    buildNav(); chip();
    if (!keepScroll) window.scrollTo({ top: 0 });
  }
  function go(id) {
    if (!RENDER[id]) id = 'dash';
    cur = id; try { history.replaceState(null, '', '#' + id); } catch (e) { /* ไม่เป็นไร */ }
    render();
  }
  function loadExample() {
    S.risk = JSON.parse(JSON.stringify(D.example.risk)); S.seven = JSON.parse(JSON.stringify(D.example.seven)); S.resource = D.example.resource;
  }
  function csv() {
    const out = getOut(), rows = [['ด้าน', 'กลุ่ม R', 'ความเสี่ยง', 'ความพร้อม', 'ลำดับ', 'รหัส', 'มาตรการ', '7-S', 'ประเภท 3 ป.', 'ทรัพยากร', 'ผู้รับผิดชอบ', 'ตัวชี้วัด', 'เริ่มดำเนินการ', 'รอบทบทวน', 'สถานะ', 'เหตุผลการเลือก']];
    out.domains.forEach((d) => d.measures.forEach((m) => rows.push([d.code + ' ' + d.name, d.group, d.risk, d.ready, m.order, m.id, m.name, elName(m.elem), m.type3, m.res, m.owner, m.kpi, d.pkg.start, d.pkg.review, S.status[mKey(d.code, m.id)] || STATUS[0], m.why])));
    const text = '﻿' + rows.map((r) => r.map((c) => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); a.download = 'r2safe-action-plan-sample.csv'; document.body.append(a); a.click(); a.remove();
  }

  // ---------- เหตุการณ์ ----------
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, [data-go]'); if (!t) return;
    if (t.dataset.go) { go(t.dataset.go); return; }
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
    else if (a === 'csv') csv();
    else if (a === 'params-reset') { S.params = Object.assign({}, E.DEFAULT_PARAMS); render(true); }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'res-level') S.resource = t.value;
    else if (t.dataset.st) S.status[t.dataset.st] = t.value, render(true);
    else if (t.dataset.param) { const v = parseFloat(t.value); if (isFinite(v)) { S.params[t.dataset.param] = v; render(true); } }
    else if (t.id === 'f-dom') { S.ui.bank.dom = t.value; $('#bank-wrap').innerHTML = bankTable(); }
    else if (t.id === 'f-el') { S.ui.bank.el = t.value; $('#bank-wrap').innerHTML = bankTable(); }
    else if (t.id === 'f-t3') { S.ui.bank.t3 = t.value; $('#bank-wrap').innerHTML = bankTable(); }
    else if (t.id === 'f-res') { S.ui.bank.res = t.value; $('#bank-wrap').innerHTML = bankTable(); }
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'f-q') { S.ui.bank.q = t.value; $('#bank-wrap').innerHTML = bankTable(); }
    else if (t.id === 'aar') S.aar = t.value;
  });
  $('#btn-example').addEventListener('click', () => { loadExample(); go('dash'); });
  $('#btn-clear').addEventListener('click', () => { S.risk = {}; S.seven = {}; S.status = {}; S.aar = ''; render(true); });
  window.addEventListener('hashchange', () => { const h = location.hash.replace('#', ''); if (h && h !== cur) go(h); });

  const h0 = location.hash.replace('#', '');
  cur = RENDER[h0] ? h0 : 'dash'; render();
})();
