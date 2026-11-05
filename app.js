/* R²-SAFE ต้นแบบ: หน้าจอ ประมวลผลในเบราว์เซอร์เท่านั้น ไม่เก็บข้อมูล ไม่ส่งข้อมูลออก */
(function () {
  'use strict';
  const D = RS_DATA, E = RS_ENGINE;
  const state = { risk: {}, seven: {}, resource: 'ปานกลาง', params: Object.assign({}, E.DEFAULT_PARAMS) };

  // ---------- ตัวช่วย ----------
  function h(tag, attrs, kids) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v); else if (v !== false && v != null) el.setAttribute(k, v);
    });
    [].concat(kids || []).forEach((c) => el.append(c && c.nodeType ? c : document.createTextNode(c == null ? '' : String(c))));
    return el;
  }
  const $ = (s, r) => (r || document).querySelector(s);
  const fmt = (x, n) => (isFinite(x) ? x.toFixed(n) : '–');
  const lvlClass = { 'สูง': 'hi', 'กลาง': 'mid', 'ต่ำ': 'lo' };
  const tag = (lvl, text) => h('span', { class: 'tag ' + (lvlClass[lvl] || ''), text: text || lvl || '–' });
  // ความพร้อม: สูง = ดี จึงสลับสี
  const readyTag = (lvl) => h('span', { class: 'tag ' + ({ 'สูง': 'lo', 'กลาง': 'mid', 'ต่ำ': 'hi' }[lvl] || ''), text: lvl || '–' });

  // ---------- แท็บ ----------
  function show(name) {
    document.querySelectorAll('.panel').forEach((p) => { p.hidden = p.id !== 'tab-' + name; });
    document.querySelectorAll('#tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === name ? 'true' : 'false'));
    if (name === 'result') renderResult();
    if (name === 'rules') renderRules();
    window.scrollTo({ top: 0 });
    try { history.replaceState(null, '', '#' + name); } catch (e) { /* ไม่เป็นไร */ }
  }
  document.querySelectorAll('#tabs button').forEach((b) => b.addEventListener('click', () => show(b.dataset.tab)));
  document.addEventListener('click', (e) => { const g = e.target.closest('[data-go]'); if (g) { if (g.dataset.go === 'input' && g.classList.contains('primary') && g.textContent.indexOf('ตัวอย่าง') >= 0) loadExample(); show(g.dataset.go); } });

  // ---------- ฟอร์มป้อนข้อมูล ----------
  function legendList(anchors, title) {
    return h('div', {}, [h('b', { text: title }), h('ol', {}, anchors.map((a) => h('li', { value: a[0], text: a[1] })))]);
  }
  function scoreSelect(kind, id, idx, titleAnchors) {
    const sel = h('select', { 'aria-label': kind + ' ' + id, 'data-kind': kind, 'data-id': id, 'data-idx': idx });
    sel.append(h('option', { value: '', text: '–' }));
    for (let n = 1; n <= 5; n++) sel.append(h('option', { value: n, text: n, title: (titleAnchors[n - 1] || [])[1] || '' }));
    sel.addEventListener('change', onScore);
    return sel;
  }
  function buildForms() {
    $('#legend-l').replaceChildren(legendList(D.lAnchors, 'L ความถี่'));
    $('#legend-c').replaceChildren(legendList(D.cAnchors, 'C ผลกระทบ'));
    $('#legend-d').replaceChildren(legendList(D.dAnchors, 'D สภาพปัจจุบัน (I ใช้ระดับเดียวกัน)'));
    const rf = $('#risk-form'); rf.replaceChildren();
    D.domains.forEach((dom) => {
      const g = h('div', { class: 'group' }, [h('h4', { text: dom.code + ' · ' + dom.name })]);
      D.riskItems.filter((r) => r.dom === dom.code).forEach((r) => {
        g.append(h('div', { class: 'row' }, [
          h('span', { class: 'id', text: r.id }),
          h('span', {}, [r.text, h('span', { class: 'space', text: r.space })]),
          h('span', { class: 'ctl' }, [
            h('label', {}, ['L', scoreSelect('risk', r.id, 0, D.lAnchors)]),
            h('label', {}, ['C', scoreSelect('risk', r.id, 1, D.cAnchors)]),
          ]),
        ]));
      });
      rf.append(g);
    });
    const sf = $('#seven-form'); sf.replaceChildren();
    D.elements.forEach((el) => {
      const g = h('div', { class: 'group' }, [h('h4', { text: el.name })]);
      D.sevenItems.filter((s) => s.elem === el.code).forEach((s) => {
        g.append(h('div', { class: 'row' }, [
          h('span', { class: 'id', text: s.id }),
          h('span', { text: s.text }),
          h('span', { class: 'ctl' }, [
            h('label', {}, ['D', scoreSelect('seven', s.id, 0, D.dAnchors)]),
            h('label', {}, ['I', scoreSelect('seven', s.id, 1, D.dAnchors)]),
          ]),
        ]));
      });
      sf.append(g);
    });
  }
  function onScore(e) {
    const s = e.target, k = s.dataset.kind, id = s.dataset.id, i = +s.dataset.idx;
    const store = state[k]; store[id] = store[id] || [null, null];
    store[id][i] = s.value === '' ? null : +s.value;
    updateStatus();
  }
  function syncSelects() {
    document.querySelectorAll('select[data-kind]').forEach((s) => {
      const v = (state[s.dataset.kind][s.dataset.id] || [])[+s.dataset.idx];
      s.value = v == null ? '' : String(v);
    });
    $('#res-level').value = state.resource;
    updateStatus();
  }
  function updateStatus() {
    const r = D.riskItems.filter((x) => { const p = state.risk[x.id] || []; return p[0] != null && p[1] != null; }).length;
    const s = D.sevenItems.filter((x) => { const p = state.seven[x.id] || []; return p[0] != null && p[1] != null; }).length;
    $('#fill-status').textContent = 'กรอกแล้ว: ความเสี่ยง ' + r + '/' + D.riskItems.length + ' ข้อ · 7-S ' + s + '/' + D.sevenItems.length + ' ข้อ';
  }
  function loadExample() {
    state.risk = JSON.parse(JSON.stringify(D.example.risk)); state.seven = JSON.parse(JSON.stringify(D.example.seven));
    state.resource = D.example.resource; syncSelects();
  }
  $('#btn-example').addEventListener('click', loadExample);
  $('#btn-clear').addEventListener('click', () => { state.risk = {}; state.seven = {}; syncSelects(); });
  $('#res-level').addEventListener('change', (e) => { state.resource = e.target.value; });

  // ---------- ผลวิเคราะห์ ----------
  function table(head, rows, cls) {
    return h('div', { class: 'scroll' }, [h('table', { class: cls || '' }, [
      h('thead', {}, [h('tr', {}, head.map((t) => h('th', typeof t === 'object' && t.n ? { class: 'num', text: t.n } : { text: t })))]),
      h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', c && c.n ? { class: 'num' } : {}, [c && c.n !== undefined ? c.n : c]))))),
    ])]);
  }
  function renderResult() {
    const body = $('#result-body'); body.replaceChildren();
    const out = E.analyze({ risk: state.risk, seven: state.seven, resource: state.resource }, D, state.params);
    const any = out.domains.some((d) => d.group);
    body.append(h('div', { class: 'alert', text: 'ข้อสำคัญ: หากเกิดเหตุฉุกเฉินจริง ให้ปฏิบัติตามแผนเผชิญเหตุและกฎหมายทันที ไม่ต้องรอระบบนี้ ผลด้านล่างใช้ช่วยวางแผนเชิงกลยุทธ์และเป็นข้อเสนอเท่านั้น ผู้อำนวยการเป็นผู้ตัดสินใจขั้นสุดท้าย ข้อมูลในหน้านี้เป็นข้อมูลจำลองหรือที่คุณกรอกเอง ไม่ใช่ผลที่ผ่านการรับรอง' }));
    if (!any) {
      body.append(h('div', { class: 'empty' }, ['ยังกรอกข้อมูลไม่พอ ', h('button', { class: 'btn primary', 'data-go': 'input', text: 'ไปกรอกข้อมูล' }), ' หรือกดใส่ข้อมูลตัวอย่าง']));
      return;
    }
    // A
    body.append(h('h3', { text: 'A. ความเสี่ยงรายด้าน (ขั้นที่ 1) และกลุ่มแนวทางตอบสนอง (ขั้นที่ 4)' }));
    body.append(table(['ด้านของภัย', { n: 'ดัชนี R (L×C เฉลี่ย)' }, { n: 'C สูงสุด' }, 'กฎยกระดับ', 'ระดับความเสี่ยง', 'ระดับความพร้อม', 'กลุ่ม R', 'แนวทางตอบสนอง'],
      out.domains.map((d) => [d.code + ' ' + d.name, { n: fmt(d.rd, 2) }, { n: isFinite(d.cmax) ? d.cmax : '–' }, d.override ? 'ใช้ (มีข้อ C=' + out.params.overrideC + ' และ L≥' + out.params.overrideL + ')' : 'ไม่',
        d.risk ? tag(d.risk) : '–', d.ready ? readyTag(d.ready) : '–', d.group ? h('b', { text: d.group }) : '–', d.pkg ? d.pkg.name : 'ข้อมูลไม่พอ'])));
    // B
    body.append(h('h3', { text: 'B. ความพร้อมตาม 7-S (ขั้นที่ 2) และ PNI Modified (ขั้นที่ 3)' }));
    body.append(table(['องค์ประกอบ', { n: 'D เฉลี่ย' }, { n: 'I เฉลี่ย' }, { n: 'ช่องว่าง (I−D)' }, { n: 'PNI Modified' }, { n: 'อันดับ' }],
      out.elements.map((e) => [e.name, { n: fmt(e.d, 2) }, { n: fmt(e.i, 2) }, { n: fmt(e.gap, 2) }, { n: fmt(e.pni, 3) }, { n: e.rank || '–' }])));
    body.append(h('p', {}, ['ค่าเฉลี่ย D ของ 7 องค์ประกอบ = ', h('b', { text: fmt(out.readyMean, 2) }), ' ระดับก่อนใช้กฎเพดาน: ', out.readyBefore ? readyTag(out.readyBefore) : '–', ' ระดับสุดท้าย: ', out.readyFinal ? readyTag(out.readyFinal) : '–',
      out.floorHit ? ' (ใช้กฎเพดาน: โครงสร้างหรือระบบต่ำกว่า ' + out.params.floorD + ' จึงไม่จัดเป็นระดับสูง)' : '']));
    body.append(h('p', {}, ['3 องค์ประกอบที่ช่องว่างสูงสุด (ใช้เลือกมาตรการก่อน): ', h('b', { text: out.top3.map((e) => e.name).join(' · ') || '–' })]));
    // C รายด้าน
    body.append(h('h3', { text: 'C. แนวทางและมาตรการที่ระบบเสนอรายด้าน (จำนวนสูงสุดตามทรัพยากร: ' + out.resource + ' = ' + out.resourceMax + ' ข้อต่อด้าน)' }));
    out.domains.forEach((d) => {
      if (!d.pkg) return;
      const pk = h('div', { class: 'pkg' }, [
        h('h4', {}, [d.code + ' ' + d.name + ' → ', h('b', { text: d.group + ' ' + d.pkg.name })]),
        h('div', { text: d.pkg.summary }),
        h('div', { class: 'muted', text: 'เริ่มดำเนินการ: ' + d.pkg.start + ' · รอบทบทวน: ' + d.pkg.review }),
        h('b', { text: 'ชุดการตัดสินใจ 6 ข้อ' }),
        h('ol', {}, d.pkg.decisions.map((x) => h('li', { text: x }))),
      ]);
      body.append(pk);
      body.append(table(['ที่', 'รหัส', 'มาตรการ', '7-S', 'ประเภท', 'ทรัพยากร', 'ผู้รับผิดชอบ', 'ตัวชี้วัด', 'เหตุผลการเลือก (ตรวจย้อนกลับได้)'],
        d.measures.map((m) => [{ n: m.order }, m.id, h('span', {}, [h('b', { text: m.name }), h('br'), m.desc]), (D.elements.find((e) => e.code === m.elem) || {}).name, m.type3, { n: m.res }, m.owner, m.kpi, m.why])));
    });
    body.append(h('p', { class: 'muted', text: 'ผู้อำนวยการสามารถปรับ เลือก หรือไม่เลือกข้อเสนอได้ พร้อมบันทึกเหตุผล (ฟังก์ชันบันทึกประวัติการอนุมัติจะอยู่ในขั้นพัฒนาต่อ)' }));
    body.append(h('div', { class: 'bar' }, [h('button', { class: 'btn', text: 'พิมพ์หรือบันทึกเป็น PDF', onclick: () => window.print() })]));
  }

  // ---------- คลังมาตรการ ----------
  function buildBankFilters() {
    const opt = (sel, items, all) => { sel.replaceChildren(h('option', { value: '', text: all })); items.forEach(([v, t]) => sel.append(h('option', { value: v, text: t }))); };
    opt($('#f-dom'), D.domains.map((d) => [d.code, d.code + ' ' + d.name]).concat([['X', 'X มาตรการข้ามด้าน']]), 'ทั้งหมด');
    opt($('#f-el'), D.elements.map((e) => [e.code, e.name]), 'ทั้งหมด');
    opt($('#f-t3'), Array.from(new Set(D.bank.map((b) => b.type3))).map((t) => [t, t]), 'ทั้งหมด');
    ['#f-q', '#f-dom', '#f-el', '#f-t3', '#f-res'].forEach((s) => $(s).addEventListener('input', renderBank));
    $('#bank-table thead').replaceChildren(h('tr', {}, ['รหัส', 'ด้าน', 'มาตรการ', '7-S', '3 ป.', 'ระยะ', { n: 'ทรัพยากร' }, 'ผู้รับผิดชอบ', 'ตัวชี้วัด', 'เหมาะกับความเสี่ยง', 'เหมาะกับความพร้อม'].map((t) => h('th', typeof t === 'object' ? { class: 'num', text: t.n } : { text: t }))));
  }
  function renderBank() {
    const q = $('#f-q').value.trim().toLowerCase(), dm = $('#f-dom').value, el = $('#f-el').value, t3 = $('#f-t3').value, rs = $('#f-res').value;
    const rows = D.bank.filter((b) => (!dm || b.dom === dm) && (!el || b.elem === el) && (!t3 || b.type3 === t3) && (!rs || String(b.res) === rs) &&
      (!q || (b.name + b.desc + b.kpi + b.owner).toLowerCase().indexOf(q) >= 0));
    const tb = $('#bank-table tbody'); tb.replaceChildren();
    rows.forEach((b) => tb.append(h('tr', {}, [b.id, b.dom, h('span', {}, [h('b', { text: b.name }), h('br'), b.desc]), (D.elements.find((e) => e.code === b.elem) || {}).name, b.type3, b.phase, h('span', { text: b.res }), b.owner, b.kpi, b.risk, b.ready].map((c, i) => h('td', i === 6 ? { class: 'num' } : {}, [c])))));
    $('#bank-count').textContent = 'แสดง ' + rows.length + ' จาก ' + D.bank.length + ' รายการ';
  }

  // ---------- ตารางตัดสินใจและเกณฑ์ ----------
  function renderRules() {
    const out = E.analyze({ risk: state.risk, seven: state.seven, resource: state.resource }, D, state.params);
    const current = new Set(out.domains.map((d) => d.group).filter(Boolean));
    const m = $('#matrix'); m.replaceChildren(h('div', { class: 'h', text: 'ความเสี่ยง \\ ความพร้อม' }), h('div', { class: 'h', text: 'ต่ำ' }), h('div', { class: 'h', text: 'กลาง' }), h('div', { class: 'h', text: 'สูง' }));
    ['สูง', 'กลาง', 'ต่ำ'].forEach((r) => {
      m.append(h('div', { class: 'h', text: r }));
      ['ต่ำ', 'กลาง', 'สูง'].forEach((d) => {
        const p = D.packages.find((x) => x.risk === r && x.ready === d);
        m.append(h('div', { class: current.has(p.code) ? 'cur' : '' }, [h('b', { text: p.code + ' ' }), p.name, current.has(p.code) ? h('div', { class: 'muted', text: '← ด้านที่อยู่ในกลุ่มนี้ตามข้อมูลที่กรอก' }) : '']));
      });
    });
    const meta = [
      ['riskLow', 'ค่าตัดความเสี่ยงต่ำ (ดัชนี ≤)', 'ดัชนี R = ค่าเฉลี่ยของ L×C (ช่วง 1–25)', 0.5],
      ['riskMid', 'ค่าตัดความเสี่ยงปานกลาง (ดัชนี ≤)', 'มากกว่าค่านี้ = ความเสี่ยงสูง', 0.5],
      ['overrideC', 'กฎยกระดับ: ค่า C ที่ถือว่ารุนแรงสูงสุด', 'ข้อใดมี C เท่านี้และ L ถึงขั้นต่ำ จัดด้านนั้นเป็นความเสี่ยงสูง', 1],
      ['overrideL', 'กฎยกระดับ: ค่า L ขั้นต่ำ (≥)', '', 1],
      ['readyLow', 'ค่าตัดความพร้อมต่ำ (ค่าเฉลี่ย D ≤)', 'ช่วงกว้าง 0.80 ตามเกณฑ์แปลผล', 0.05],
      ['readyMid', 'ค่าตัดความพร้อมปานกลาง (ค่าเฉลี่ย D ≤)', 'มากกว่าค่านี้ = ความพร้อมสูง', 0.05],
      ['floorD', 'กฎเพดาน: D ขั้นต่ำของโครงสร้างและระบบ', 'ต่ำกว่านี้ไม่จัดความพร้อมเป็นระดับสูง', 0.01],
    ];
    const tb = $('#params-table tbody'); tb.replaceChildren();
    meta.forEach(([k, name, note, step]) => {
      const inp = h('input', { type: 'number', step: step, value: state.params[k], 'aria-label': name });
      inp.addEventListener('change', () => { const v = parseFloat(inp.value); if (isFinite(v)) { state.params[k] = v; renderRules(); } });
      tb.append(h('tr', {}, [h('td', { text: name }), h('td', {}, [inp]), h('td', { text: note })]));
    });
  }
  $('#btn-params-reset').addEventListener('click', () => { state.params = Object.assign({}, E.DEFAULT_PARAMS); renderRules(); });

  // ---------- เริ่มต้น ----------
  buildForms(); buildBankFilters(); renderBank(); updateStatus();
  const start = (location.hash || '').replace('#', '');
  show(['about', 'input', 'result', 'bank', 'rules'].indexOf(start) >= 0 ? start : 'about');
})();
