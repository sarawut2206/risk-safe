/* R²-SAFE ต้นแบบ: ชั้นกฎการเลือกกลยุทธ์และตัวอธิบายการจับคู่ (Strategy Matching)
   - ไม่แก้ผลการคัดเลือกของ engine.js (ผลยังตรงกับเครื่องมือ Excel) แต่ตรวจสอบและอธิบายผลนั้นด้วยกฎที่เขียนไว้ชัดเจน
   - ทุกกฎและค่าเกณฑ์เป็นร่างข้อเสนอของผู้วิจัย ยังไม่ผ่านเดลฟาย ปรับได้ที่ตาราง AXIS_* และ CELLS ด้านล่างโดยไม่ต้องแก้โค้ดส่วนอื่น
   - ประมวลผลในเบราว์เซอร์เท่านั้น ไม่ส่งข้อมูลออก */
(function (root) {
  'use strict';

  const DRAFT = 'ร่างข้อเสนอของผู้วิจัย รอผู้เชี่ยวชาญตรวจในเดลฟาย';
  // ผลอยู่ใกล้เส้นแบ่งเมื่อห่างจากค่าตัดไม่เกินค่านี้ (ค่าเริ่มต้นของผู้วิจัย)
  const NEAR = { risk: 0.5, ready: 0.15 };

  // ---------- นิยามกลุ่มมาตรการ (ใช้ตรวจว่ารายการที่เลือกตอบกฎหรือไม่) ----------
  const has = (arr, v) => arr.indexOf(v) >= 0;
  const PRED = {
    CONTROL: { label: 'มาตรการควบคุมและรับมือเหตุ', hint: 'ระยะตอบสนองหรือเตรียมพร้อม หรือประเภทปราบปราม', test: (b) => b.phase === 'ตอบสนอง' || b.phase === 'เตรียมพร้อม' || b.type3 === 'ปราบปราม' },
    FOUNDATION: { label: 'ฐานโครงสร้าง ระบบ และกลยุทธ์', hint: 'องค์ประกอบ 7-S: กลยุทธ์ โครงสร้าง ระบบ', test: (b) => has(['STG', 'STR', 'SYS'], b.elem) },
    CAPABILITY: { label: 'พัฒนาบุคลากรและรูปแบบการบริหาร', hint: 'องค์ประกอบ 7-S: ทักษะ บุคลากร รูปแบบการบริหาร', test: (b) => has(['SKL', 'STF', 'STY'], b.elem) },
    SUSTAIN: { label: 'รักษา ปลูกฝัง และถ่ายทอดแนวปฏิบัติ', hint: 'ค่านิยมร่วม หรือประเภทปลูกฝัง', test: (b) => b.elem === 'VAL' || b.type3 === 'ปลูกฝัง' },
    PROACTIVE: { label: 'มาตรการป้องกันล่วงหน้า', hint: 'ระยะป้องกัน', test: (b) => b.phase === 'ป้องกัน' },
    REPRESS: { label: 'มาตรการประเภทปราบปราม', hint: 'ใช้นับเพื่อจำกัดสัดส่วนเมื่อความเสี่ยงต่ำ', test: (b) => b.type3 === 'ปราบปราม' },
  };

  // ---------- กฎรายแกน: ระดับความเสี่ยง และระดับความพร้อม ----------
  const AXIS_RISK = {
    'สูง': { code: 'A1', title: 'ความเสี่ยงสูง: ควบคุมก่อน', text: 'ถ้าความเสี่ยงด้านใดสูง ต้องมีมาตรการควบคุมหรือรับมือเหตุอย่างน้อย 1 ข้อในรายการ และไม่รอให้ความพร้อมสูงก่อนจึงเริ่ม', why: 'ความเสี่ยงสูงต้องจัดการก่อนตามหลักการจัดลำดับความสำคัญของการจัดการความเสี่ยง (ISO 31000 หมวดการประเมินและการจัดการความเสี่ยง)', req: [{ pred: 'CONTROL', min: 1 }] },
    'กลาง': { code: 'A2', title: 'ความเสี่ยงกลาง: ป้องกันไม่ให้สูงขึ้น', text: 'ถ้าความเสี่ยงระดับกลาง ต้องมีมาตรการป้องกันล่วงหน้าอย่างน้อย 1 ข้อ เพื่อไม่ให้ขยับเป็นสูง', why: 'ความเสี่ยงกลางยังจัดการด้วยการป้องกันได้ถูกกว่าการรอให้เกิดเหตุ', req: [{ pred: 'PROACTIVE', min: 1 }] },
    'ต่ำ': { code: 'A3', title: 'ความเสี่ยงต่ำ: ใช้แรงให้พอเหมาะ', text: 'ถ้าความเสี่ยงต่ำ ไม่เกิน 1 ข้อในรายการเป็นประเภทปราบปราม เพื่อไม่ลงทรัพยากรควบคุมเกินสัดส่วน', why: 'มาตรการต้องได้สัดส่วนกับระดับความเสี่ยง', req: [{ pred: 'REPRESS', max: 1 }] },
  };
  const AXIS_READY = {
    'ต่ำ': { code: 'B1', title: 'ความพร้อมต่ำ: วางฐานก่อน', text: 'ถ้าความพร้อมต่ำ ต้องมีมาตรการวางฐานโครงสร้าง ระบบ หรือกลยุทธ์อย่างน้อย 1 ข้อ และไม่เสนอมาตรการขั้นสูงที่ต้องมีระบบรองรับ', why: 'มาตรการที่ต้องพึ่งระบบจะไม่ได้ผลถ้ายังไม่มีผู้รับผิดชอบ ช่องทางแจ้งเหตุ และแผนเผชิญเหตุ', req: [{ pred: 'FOUNDATION', min: 1 }] },
    'กลาง': { code: 'B2', title: 'ความพร้อมกลาง: เพิ่มความสามารถของคน', text: 'ถ้าความพร้อมกลาง ต้องมีมาตรการพัฒนาบุคลากรหรือรูปแบบการบริหารอย่างน้อย 1 ข้อ', why: 'ฐานมีแล้ว คอขวดมักอยู่ที่ทักษะและการนำไปใช้จริง', req: [{ pred: 'CAPABILITY', min: 1 }] },
    'สูง': { code: 'B3', title: 'ความพร้อมสูง: รักษาและถ่ายทอด', text: 'ถ้าความพร้อมสูง ต้องมีมาตรการรักษาและถ่ายทอดแนวปฏิบัติ (ค่านิยม หรือการปลูกฝัง) อย่างน้อย 1 ข้อ', why: 'องค์กรที่พร้อมแล้วต้องรักษาระดับและขยายผลสู่ผู้เรียนและเครือข่าย', req: [{ pred: 'SUSTAIN', min: 1 }] },
  };

  // ---------- กฎเฉพาะช่อง R1–R9 (ปฏิสัมพันธ์ของสองแกน) ----------
  // order = ลำดับก่อนหลังของการลงมือ (กลุ่มมาตรการที่ควรทำก่อน); extra = เงื่อนไขเพิ่มเติมเฉพาะช่อง
  const CELLS = {
    R1: { stance: 'ควบคุมเร่งด่วนและวางฐานคู่ขนาน', tows: 'WT', order: ['CONTROL', 'FOUNDATION', 'CAPABILITY', 'PROACTIVE', 'SUSTAIN'],
      intent: 'ความเสี่ยงสูงรอไม่ได้แต่ฐานระบบยังไม่พร้อม จึงควบคุมจุดเสี่ยงรุนแรงทันทีด้วยมาตรการชั่วคราว พร้อมสร้างผู้รับผิดชอบ ช่องทางแจ้งเหตุ และแผนเผชิญเหตุคู่ขนานกัน',
      avoid: ['เริ่มด้วยโครงการขั้นสูงที่ต้องมีระบบรองรับ เช่น การวิเคราะห์ข้อมูลเชิงรุก', 'รอให้ระบบสมบูรณ์ก่อนจึงควบคุมจุดเสี่ยง'],
      watch: ['เกิดเหตุรุนแรงซ้ำในรอบทบทวน: แจ้งต้นสังกัดและเพิ่มความถี่ทบทวน', 'ความพร้อมขยับเป็นกลาง: เปลี่ยนไปใช้แนวทาง R2'],
      notFit: 'ไม่เหมาะเมื่อความเสี่ยงไม่สูง เพราะเป็นการลงทรัพยากรควบคุมเร่งด่วนเกินสัดส่วน' },
    R2: { stance: 'กำกับใกล้ชิดและเพิ่มความสามารถเฉพาะทาง', tows: 'WT/ST', order: ['CONTROL', 'CAPABILITY', 'FOUNDATION', 'PROACTIVE', 'SUSTAIN'],
      intent: 'มีฐานระดับหนึ่งแล้ว จึงเพิ่มการควบคุมในจุดและเวลาเสี่ยง กำกับรายสัปดาห์ และเสริมความสามารถของครูแกนนำ',
      avoid: ['สร้างระบบใหม่ทั้งชุดโดยไม่ใช้ฐานเดิม', 'ลดความถี่กำกับก่อนเหตุซ้ำลดลง'],
      watch: ['อัตราเหตุซ้ำไม่ลดใน 2 รอบทบทวน: ทบทวนว่ามาตรการควบคุมตรงจุดหรือไม่', 'ความพร้อมขยับเป็นสูง: เปลี่ยนไปใช้แนวทาง R3'],
      notFit: 'ไม่เหมาะเมื่อความพร้อมต่ำ เพราะการกำกับใกล้ชิดต้องมีผู้รับผิดชอบและสายรายงานที่ใช้งานได้ก่อน' },
    R3: { stance: 'เชิงรุกและเฝ้าระวังขั้นสูง', tows: 'ST', order: ['CONTROL', 'PROACTIVE', 'CAPABILITY', 'SUSTAIN', 'FOUNDATION'],
      intent: 'ความพร้อมสูงแต่ความเสี่ยงยังสูง จึงใช้ข้อมูลเหตุวิเคราะห์เชิงรุก ซ้อมขั้นสูง และจัดการความเสี่ยงคงเหลือ',
      avoid: ['สร้างฐานซ้ำที่มีอยู่แล้ว', 'ลดการซ้อมและการเฝ้าระวังเพราะมองว่าระบบพร้อมแล้ว'],
      watch: ['ความเสี่ยงคงเหลือยังสูงหลังซ้อมขั้นสูง: ทบทวนข้อสมมติของการประเมิน L และ C', 'ความเสี่ยงลดเป็นกลาง: เปลี่ยนไปใช้แนวทาง R6'],
      extra: [{ pred: 'PROACTIVE', min: 1 }],
      notFit: 'ไม่เหมาะเมื่อความพร้อมยังไม่สูง เพราะมาตรการขั้นสูงต้องมีโครงสร้างและระบบรองรับ ไม่เช่นนั้นเป็นภาระโดยไม่ลดความเสี่ยง' },
    R4: { stance: 'วางฐานและพัฒนาคนก่อนความเสี่ยงจะสูงขึ้น', tows: 'WT', order: ['FOUNDATION', 'CAPABILITY', 'CONTROL', 'PROACTIVE', 'SUSTAIN'],
      intent: 'ความเสี่ยงกลางแต่ความพร้อมต่ำ จึงสร้างระบบพื้นฐานและพัฒนาสมรรถนะบุคลากรก่อนที่ความเสี่ยงจะสูงขึ้น',
      avoid: ['ใช้ทรัพยากรหลักกับมาตรการขั้นสูง', 'เลื่อนการตั้งผู้รับผิดชอบรายด้านออกไป'],
      watch: ['ดัชนีความเสี่ยงขยับเข้าใกล้เส้นแบ่งระดับสูง: เปลี่ยนไปใช้แนวทาง R1', 'ความพร้อมขยับเป็นกลาง: เปลี่ยนไปใช้แนวทาง R5'],
      extra: [{ pred: 'CAPABILITY', min: 1 }],
      notFit: 'ไม่เหมาะเมื่อความเสี่ยงสูง เพราะต้องควบคุมจุดเสี่ยงก่อนการพัฒนาระยะยาว' },
    R5: { stance: 'ปรับปรุงกระบวนการและติดตามความเสี่ยง', tows: 'WT/WO', order: ['PROACTIVE', 'CAPABILITY', 'FOUNDATION', 'CONTROL', 'SUSTAIN'],
      intent: 'ความเสี่ยงและความพร้อมระดับกลาง จึงทำกระบวนการให้เป็นระบบ ลดงานซ้อน และติดตามความเสี่ยงสม่ำเสมอ',
      avoid: ['เพิ่มโครงการจำนวนมากโดยไม่ทบทวนกระบวนการเดิม'],
      watch: ['รายการความเสี่ยงใดมีแนวโน้มสูงขึ้นสองรอบติดกัน: จัดการเฉพาะรายการนั้นทันที'],
      notFit: 'ไม่เหมาะเมื่อความเสี่ยงสูงหรือความพร้อมต่ำ เพราะต้องควบคุมหรือวางฐานก่อนการปรับกระบวนการ' },
    R6: { stance: 'เพิ่มประสิทธิภาพและจัดการเฉพาะจุด', tows: 'ST/SO', order: ['PROACTIVE', 'CAPABILITY', 'SUSTAIN', 'CONTROL', 'FOUNDATION'],
      intent: 'ความเสี่ยงกลางและความพร้อมสูง จึงใช้ความสามารถที่มีเพิ่มประสิทธิภาพและจัดการเฉพาะจุดที่ยังเสี่ยง',
      avoid: ['ขยายระบบทั้งชุดโดยไม่ระบุจุดเสี่ยงที่ต้องแก้'],
      watch: ['ความเสี่ยงเฉพาะจุดสูงขึ้นเป็นสูง: เปลี่ยนไปใช้แนวทาง R3'],
      notFit: 'ไม่เหมาะเมื่อความพร้อมยังไม่สูง เพราะการเพิ่มประสิทธิภาพต้องมีระบบเดิมที่ทำงานอยู่' },
    R7: { stance: 'เสริมความพร้อมเป็นระยะ ไม่เร่งรัด', tows: 'WO', order: ['FOUNDATION', 'CAPABILITY', 'PROACTIVE', 'SUSTAIN', 'CONTROL'],
      intent: 'ความเสี่ยงต่ำแต่ความพร้อมต่ำ จึงวางฐานทีละขั้นตามภาคเรียน ใช้โอกาสที่ยังไม่มีแรงกดดันสร้างระบบ',
      avoid: ['ใช้มาตรการปราบปรามหรือควบคุมเข้มโดยความเสี่ยงไม่สูง'],
      watch: ['ความเสี่ยงขยับเป็นกลางในรอบทบทวน: เปลี่ยนไปใช้แนวทาง R4'],
      notFit: 'ไม่เหมาะเมื่อความเสี่ยงไม่ต่ำ เพราะการค่อยเป็นค่อยไปอาจช้าเกินไป' },
    R8: { stance: 'รักษามาตรฐานและพัฒนาระบบ', tows: 'WO/SO', order: ['CAPABILITY', 'FOUNDATION', 'SUSTAIN', 'PROACTIVE', 'CONTROL'],
      intent: 'ความเสี่ยงต่ำและความพร้อมกลาง จึงรักษามาตรฐานเดิมและพัฒนาระบบให้ต่อเนื่อง',
      avoid: ['ลดการทบทวนประจำภาคเรียน'],
      watch: ['คะแนนความพร้อมต่ำลงในรอบทบทวน: ตรวจว่าบุคลากรหรือผู้รับผิดชอบเปลี่ยนหรือไม่'],
      notFit: 'ไม่เหมาะเมื่อความเสี่ยงสูง เพราะต้องมีมาตรการควบคุมในรายการ' },
    R9: { stance: 'รักษา ตรวจสอบ และถ่ายทอดแนวปฏิบัติที่ดี', tows: 'SO', order: ['SUSTAIN', 'PROACTIVE', 'CAPABILITY', 'FOUNDATION', 'CONTROL'],
      intent: 'ความเสี่ยงต่ำและความพร้อมสูง จึงรักษาระดับ ตรวจสอบภายใน และถ่ายทอดแนวปฏิบัติสู่ผู้เรียนและเครือข่าย',
      avoid: ['เพิ่มมาตรการใหม่จำนวนมากที่ไม่ตอบความเสี่ยงที่พบ'],
      watch: ['ความเสี่ยงด้านใดขยับเป็นกลาง: เปลี่ยนไปใช้แนวทาง R6'],
      notFit: 'ไม่เหมาะเมื่อความพร้อมยังไม่สูง เพราะการถ่ายทอดแนวปฏิบัติต้องมีสิ่งที่ทำได้ดีแล้วให้ถ่ายทอด' },
  };

  // ---------- รายการกฎทั้งหมด (แสดงในหน้ากฎและตรวจสอบโดยผู้เชี่ยวชาญ) ----------
  const RULES = [
    { id: 'K1', group: 'จัดระดับ', text: 'ระดับความเสี่ยงรายด้านมาจากค่าเฉลี่ยของ L × C ทุกข้อในด้านนั้น เทียบกับค่าตัดต่ำ/กลาง/สูง', src: 'engine.js (ตรงกับ Excel)' },
    { id: 'K2', group: 'จัดระดับ', text: 'กฎยกระดับ: ถ้ามีข้อที่ C = 5 และ L ≥ 2 ให้ด้านนั้นเป็นความเสี่ยงสูง แม้ค่าเฉลี่ยไม่ถึง', src: 'engine.js (ตรงกับ Excel)' },
    { id: 'K3', group: 'จัดระดับ', text: 'ระดับความพร้อมมาจากค่าเฉลี่ย D ของ 7 องค์ประกอบ เทียบกับค่าตัดต่ำ/กลาง/สูง', src: 'engine.js (ตรงกับ Excel)' },
    { id: 'K4', group: 'จัดระดับ', text: 'กฎเพดาน: ถ้า D ของโครงสร้างหรือระบบต่ำกว่าค่าเพดาน ห้ามได้ความพร้อมระดับสูง (ลดเป็นกลาง)', src: 'engine.js (ตรงกับ Excel)' },
    { id: 'K5', group: 'จัดระดับ', text: 'ช่อง R = ระดับความเสี่ยง (สูง→ต่ำ) × ระดับความพร้อม (ต่ำ→สูง) เรียง R1 ถึง R9 รายด้านของภัย', src: 'engine.js (ตรงกับ Excel)' },
    { id: 'S1', group: 'จับคู่มาตรการ', text: 'ด่านที่ 1 ด้านของภัย: มาตรการต้องตรงด้านนั้นหรือเป็นมาตรการร่วมทุกด้าน (X)', src: 'engine.js' },
    { id: 'S2', group: 'จับคู่มาตรการ', text: 'ด่านที่ 2 ระดับความเสี่ยง: ระดับของด้านนั้นต้องอยู่ในช่วงที่มาตรการระบุว่าเหมาะ', src: 'engine.js' },
    { id: 'S3', group: 'จับคู่มาตรการ', text: 'ด่านที่ 3 ระดับความพร้อม: ระดับขององค์กรต้องอยู่ในช่วงที่มาตรการระบุว่าเหมาะ', src: 'engine.js' },
    { id: 'S4', group: 'จับคู่มาตรการ', text: 'ด่านที่ 4 ทรัพยากร: ระดับทรัพยากรที่มาตรการต้องใช้ต้องไม่เกินที่โรงเรียนมี (ที่เกินแสดงแยกเป็น "เกินทรัพยากร")', src: 'engine.js' },
    { id: 'S5', group: 'จับคู่มาตรการ', text: 'เรียงตามคะแนน: องค์ประกอบ 7-S อยู่ใน 3 อันดับช่องว่างสูงสุดก่อน แล้วลำดับ QSPM แล้วระดับหลักฐาน A→D แล้วลำดับในคลัง', src: 'engine.js (ข้อเสนอผู้วิจัย รอที่ปรึกษายืนยัน)' },
    { id: 'S6', group: 'จับคู่มาตรการ', text: 'รับตามเพดานจำนวนข้อต่อด้านตามระดับทรัพยากร (จำกัด 4 · ปานกลาง 6 · เพียงพอ 8)', src: 'engine.js' },
  ];
  ['สูง', 'กลาง', 'ต่ำ'].forEach((l) => { const a = AXIS_RISK[l]; RULES.push({ id: a.code, group: 'กลยุทธ์ตามความเสี่ยง', text: a.text, why: a.why, src: DRAFT }); });
  ['ต่ำ', 'กลาง', 'สูง'].forEach((l) => { const a = AXIS_READY[l]; RULES.push({ id: a.code, group: 'กลยุทธ์ตามความพร้อม', text: a.text, why: a.why, src: DRAFT }); });
  Object.keys(CELLS).forEach((k) => RULES.push({ id: 'I-' + k, group: 'กลยุทธ์เฉพาะช่อง', text: k + ' ' + CELLS[k].stance + ': ' + CELLS[k].intent, src: DRAFT }));

  const LEVELS_R = ['สูง', 'กลาง', 'ต่ำ'], LEVELS_Y = ['ต่ำ', 'กลาง', 'สูง'];
  const cellParts = (code) => { const n = +code.slice(1) - 1; return { risk: LEVELS_R[Math.floor(n / 3)], ready: LEVELS_Y[n % 3] }; };
  const f1 = (x, n) => (isFinite(x) ? x.toFixed(n) : '–');

  // เงื่อนไขทั้งหมดของช่อง = เงื่อนไขแกนความเสี่ยง + แกนความพร้อม + เงื่อนไขเฉพาะช่อง (ตัดซ้ำ)
  function requirements(code) {
    const p = cellParts(code), list = [];
    const add = (src, r) => { if (!list.some((x) => x.pred === r.pred && x.min === r.min && x.max === r.max)) list.push({ src, pred: r.pred, min: r.min, max: r.max }); };
    AXIS_RISK[p.risk].req.forEach((r) => add(AXIS_RISK[p.risk].code, r));
    AXIS_READY[p.ready].req.forEach((r) => add(AXIS_READY[p.ready].code, r));
    (CELLS[code].extra || []).forEach((r) => add('I-' + code, r));
    return list;
  }

  // ตรวจรายการที่ engine เลือกกับกฎ: ผ่าน/ไม่ผ่าน พร้อมมาตรการที่ตรงเงื่อนไขและตัวเลือกที่ถูกตัดซึ่งแก้ได้
  function audit(dom, data) {
    if (!dom.group) return [];
    const byId = {}; data.bank.forEach((b) => { byId[b.id] = b; });
    return requirements(dom.group).map((r) => {
      const P = PRED[r.pred];
      const hits = dom.measures.filter((m) => P.test(m));
      const ok = (r.min == null || hits.length >= r.min) && (r.max == null || hits.length <= r.max);
      let fixes = [];
      if (!ok && r.min != null) {
        fixes = dom.eval.filter((e) => e.reason === 'cap' && P.test(byId[e.id])).sort((a, b) => b.score - a.score).slice(0, 2).map((e) => ({ id: e.id, sb: e.sb, name: byId[e.id].name, poolRank: e.poolRank }));
      }
      return { src: r.src, pred: r.pred, label: P.label, min: r.min, max: r.max, count: hits.length, ok, hits: hits.map((m) => m.id), fixes };
    });
  }

  // ตัวบังคับกฎ: ถ้ารายการที่จัดอันดับได้ไม่ตอบเงื่อนไขของช่อง R ให้สลับมาตรการที่อันดับต่ำสุดที่ไม่จำเป็นออก
  // แล้วเอามาตรการที่ตอบเงื่อนไขและอันดับสูงสุดในกลุ่มที่เหมาะ (ผ่านด่านด้าน/ความเสี่ยง/ความพร้อม/ทรัพยากรแล้ว) เข้ามาแทน
  // ทุกการสลับถูกบันทึกพร้อมเหตุผล ถ้าไม่มีมาตรการที่แก้ได้จะบันทึกเป็นช่องว่างของคลัง (ไม่แก้ตัวเลขเงียบ ๆ)
  function guard(ctx) {
    const dom = ctx.dom; let cur = ctx.cand.slice();
    const swaps = [], unmet = [];
    if (!dom.group) return { cand: cur, swaps, unmet };
    const reqs = requirements(dom.group);
    const n = (list, pred) => list.filter((x) => PRED[pred].test(x.b)).length;
    const sat = (list, q) => (q.min == null || n(list, q.pred) >= q.min) && (q.max == null || n(list, q.pred) <= q.max);
    const rest = () => ctx.ranked.filter((x) => x.b.res <= ctx.resCode && cur.indexOf(x) < 0);
    const nameOf = (x) => x.b.sb || x.b.id;
    const record = (q, add, out) => swaps.push({ rule: q.src, pred: q.pred, label: PRED[q.pred].label, in: add.b.id, inSb: add.b.sb || '', out: out ? out.b.id : '', outSb: out ? (out.b.sb || '') : '' });
    reqs.filter((q) => q.min != null).forEach((q) => {
      if (sat(cur, q)) return;
      const cands = rest().filter((x) => PRED[q.pred].test(x.b));
      if (!cands.length) { unmet.push({ rule: q.src, pred: q.pred, label: PRED[q.pred].label, why: 'ไม่มีมาตรการในคลังที่ตอบเงื่อนไขนี้และเหมาะกับด้าน ระดับความเสี่ยง ระดับความพร้อม และทรัพยากรของโรงเรียน (ช่องว่างของคลัง)' }); return; }
      const add = cands[0];
      if (cur.length < ctx.cap) { cur.push(add); record(q, add, null); return; }
      const before = reqs.map((r) => sat(cur, r));
      const victim = cur.slice().reverse().find((v) => {
        const after = cur.filter((x) => x !== v).concat([add]);
        return reqs.every((r, k) => !before[k] || sat(after, r)) && sat(after, q);
      });
      if (!victim) { unmet.push({ rule: q.src, pred: q.pred, label: PRED[q.pred].label, why: 'สลับแล้วทำให้เงื่อนไขอื่นไม่ผ่าน จึงไม่สลับ (เพดานจำนวนข้อเต็มด้วยมาตรการที่จำเป็นทั้งหมด)' }); return; }
      cur = cur.filter((x) => x !== victim).concat([add]); record(q, add, victim);
    });
    reqs.filter((q) => q.max != null).forEach((q) => {
      while (n(cur, q.pred) > q.max) {
        const out = cur.slice().reverse().find((x) => PRED[q.pred].test(x.b));
        const add = rest().find((x) => !PRED[q.pred].test(x.b));
        cur = cur.filter((x) => x !== out); if (add) { cur.push(add); record(q, add, out); } else swaps.push({ rule: q.src, pred: q.pred, label: PRED[q.pred].label, in: '', inSb: '', out: out.b.id, outSb: out.b.sb || '' });
      }
    });
    cur.sort((a, b) => b.score - a.score);
    return { cand: cur, swaps, unmet };
  }

  // ลำดับลงมือตามกฎของช่อง (ไม่เปลี่ยนรายการที่เลือก)
  function sequence(dom) {
    if (!dom.group) return [];
    const order = CELLS[dom.group].order;
    return dom.measures.map((m, i) => {
      let w = order.findIndex((k) => PRED[k].test(m)); if (w < 0) w = order.length;
      return { m, w, i };
    }).sort((a, b) => a.w - b.w || a.i - b.i).map((x, k) => ({ step: k + 1, id: x.m.id, sb: x.m.sb, name: x.m.name, wave: x.w < order.length ? PRED[order[x.w]].label : 'อื่น ๆ', dataRank: x.m.order }));
  }

  // ระยะห่างจากเส้นแบ่ง: ต้องเปลี่ยนเท่าใดจึงข้ามไปช่องข้างเคียง
  function boundary(dom, out) {
    const P = out.params, res = { risk: null, ready: null, near: false, notes: [] };
    if (dom.risk) {
      const rd = dom.rd, byIdx = rd <= P.riskLow ? 'ต่ำ' : rd <= P.riskMid ? 'กลาง' : 'สูง';
      const r = { value: rd, level: dom.risk, byIndex: byIdx, override: dom.override && byIdx !== 'สูง', up: null, down: null };
      if (!r.override) {
        if (dom.risk === 'ต่ำ') r.up = { to: 'กลาง', gap: P.riskLow - rd, rule: 'ดัชนี R ต้องเกิน ' + P.riskLow };
        if (dom.risk === 'กลาง') { r.up = { to: 'สูง', gap: P.riskMid - rd, rule: 'ดัชนี R ต้องเกิน ' + P.riskMid }; r.down = { to: 'ต่ำ', gap: rd - P.riskLow, rule: 'ดัชนี R ต้องไม่เกิน ' + P.riskLow }; }
        if (dom.risk === 'สูง') r.down = { to: 'กลาง', gap: rd - P.riskMid, rule: 'ดัชนี R ต้องไม่เกิน ' + P.riskMid + ' และไม่มีข้อที่ C = ' + P.overrideC + ' กับ L ≥ ' + P.overrideL };
      } else r.notes = 'ยกระดับตามกฎ (มีข้อ C = ' + P.overrideC + ' และ L ≥ ' + P.overrideL + ') แม้ดัชนี R ' + f1(rd, 2) + ' จะอยู่ระดับ' + byIdx;
      const gaps = [r.up, r.down].filter(Boolean).map((x) => x.gap);
      r.margin = gaps.length ? Math.min.apply(null, gaps) : null;
      res.risk = r; if (r.margin != null && r.margin <= NEAR.risk) res.near = true;
    }
    const m = out.readyMean;
    if (isFinite(m)) {
      const r = { value: m, level: out.readyFinal, floorHit: out.floorHit, up: null, down: null };
      if (out.readyBefore === 'ต่ำ') r.up = { to: 'กลาง', gap: P.readyLow - m, rule: 'ค่าเฉลี่ย D ต้องเกิน ' + P.readyLow };
      if (out.readyBefore === 'กลาง') { r.up = { to: 'สูง', gap: P.readyMid - m, rule: 'ค่าเฉลี่ย D ต้องเกิน ' + P.readyMid + ' และ D ของโครงสร้างกับระบบไม่ต่ำกว่า ' + P.floorD }; r.down = { to: 'ต่ำ', gap: m - P.readyLow, rule: 'ค่าเฉลี่ย D ต้องไม่เกิน ' + P.readyLow }; }
      if (out.readyBefore === 'สูง') r.down = { to: 'กลาง', gap: m - P.readyMid, rule: 'ค่าเฉลี่ย D ต้องไม่เกิน ' + P.readyMid };
      if (out.floorHit) r.floorNote = 'ค่าเฉลี่ย D อยู่ระดับสูง แต่ D ของโครงสร้างหรือระบบต่ำกว่า ' + P.floorD + ' จึงลดเป็นกลางตามกฎเพดาน';
      const gaps = [r.up, r.down].filter(Boolean).map((x) => x.gap);
      r.margin = gaps.length ? Math.min.apply(null, gaps) : null;
      res.ready = r; if (r.margin != null && r.margin <= NEAR.ready) res.near = true;
    }
    return res;
  }

  // ทำไมไม่เลือกช่องอื่น: เทียบแต่ละช่องกับค่าจริงของด้านนั้น
  function contrast(dom, out, data) {
    if (!dom.group) return [];
    const P = out.params, b = boundary(dom, out), here = cellParts(dom.group);
    const rank = (l) => LEVELS_R.indexOf(l); // 0 สูง .. 2 ต่ำ
    const rankY = (l) => LEVELS_Y.indexOf(l); // 0 ต่ำ .. 2 สูง
    return Object.keys(CELLS).filter((k) => k !== dom.group).map((k) => {
      const p = cellParts(k), reasons = []; let dist = 0;
      if (p.risk !== here.risk) {
        dist++;
        const hi = rank(p.risk) < rank(here.risk);
        if (b.risk && b.risk.override && hi === false) reasons.push('ด้านนี้ถูกยกระดับเป็นความเสี่ยงสูงตามกฎ จึงไม่ใช้แนวทางของความเสี่ยง' + p.risk);
        else if (hi) {
          const need = p.risk === 'กลาง' ? P.riskLow : P.riskMid; // ค่าที่ต้องเกินเพื่อถึงระดับเป้าหมาย
          reasons.push('ดัชนีความเสี่ยง ' + f1(dom.rd, 2) + ' ยังไม่ถึงระดับ' + p.risk + ' (ต้องเกิน ' + need + ' ขาดอีก ' + f1(need - dom.rd, 2) + ')');
        } else reasons.push('ความเสี่ยงด้านนี้อยู่ระดับ' + here.risk + ' (ดัชนี ' + f1(dom.rd, 2) + ') สูงกว่าระดับ' + p.risk + ' ที่แนวทางนี้ออกแบบไว้');
      }
      if (p.ready !== here.ready) {
        dist++;
        const hi = rankY(p.ready) > rankY(here.ready);
        if (hi) {
          const need = p.ready === 'กลาง' ? P.readyLow : P.readyMid; // ค่าที่ต้องเกินเพื่อถึงระดับเป้าหมาย
          reasons.push('ค่าเฉลี่ย D ' + f1(out.readyMean, 2) + ' ยังไม่ถึงระดับความพร้อม' + p.ready + ' (ต้องเกิน ' + need + ' ขาดอีก ' + f1(need - out.readyMean, 2) + ')' + (out.floorHit ? ' และติดกฎเพดาน' : ''));
        } else reasons.push('ความพร้อมขององค์กรอยู่ระดับ' + here.ready + ' (ค่าเฉลี่ย D ' + f1(out.readyMean, 2) + ') สูงกว่าระดับ' + p.ready + ' ที่แนวทางนี้ออกแบบไว้');
      }
      return { code: k, stance: CELLS[k].stance, name: (data.packages.find((x) => x.code === k) || {}).name, distance: dist, reasons, notFit: CELLS[k].notFit };
    }).sort((a, b2) => a.distance - b2.distance || a.code.localeCompare(b2.code));
  }

  // เหตุผลระดับมาตรการ: ทำไมเลือก และทำไมไม่เลือกข้ออื่น
  const REASON_TXT = { selected: 'เลือก', swapped: 'ถูกสลับออกตามกฎกลยุทธ์', dom: 'คนละด้านของภัย', risk: 'ไม่เหมาะกับระดับความเสี่ยงนี้', ready: 'ไม่เหมาะกับระดับความพร้อมนี้', res: 'เกินทรัพยากรที่มี', cap: 'เหมาะ แต่เกินเพดานจำนวนข้อ' };
  function tieBreak(a, b, byId) {
    if (!b) return '';
    const ea = a.eval, eb = b.eval; if (!ea || !eb) return '';
    if (ea.top !== eb.top) return a.top ? 'อยู่ก่อนเพราะองค์ประกอบ 7-S ของข้อนี้อยู่ใน 3 อันดับช่องว่างสูงสุด' : '';
    const A = byId[a.id], B = byId[b.id];
    const qa = Math.max(1, Math.floor(Number(A.qpri)) || 1), qb = Math.max(1, Math.floor(Number(B.qpri)) || 1);
    if (qa !== qb) return 'อยู่ก่อนเพราะลำดับ QSPM ดีกว่า (' + qa + ' เทียบ ' + qb + ')';
    const ga = 'ABCD'.indexOf(A.evg) < 0 ? 0 : 'ABCD'.indexOf(A.evg), gb = 'ABCD'.indexOf(B.evg) < 0 ? 0 : 'ABCD'.indexOf(B.evg);
    if (ga !== gb) return 'อยู่ก่อนเพราะระดับหลักฐานดีกว่า (' + A.evg + ' เทียบ ' + B.evg + ')';
    return 'คะแนนเท่ากัน จึงเรียงตามลำดับในคลัง';
  }

  function whyNot(dom, out, data) {
    const byId = {}; data.bank.forEach((b) => { byId[b.id] = b; });
    const cnt = { selected: 0, swapped: 0, dom: 0, risk: 0, ready: 0, res: 0, cap: 0 };
    dom.eval.forEach((e) => { cnt[e.reason]++; });
    const row = (e) => { const b = byId[e.id]; return { id: e.id, sb: e.sb, name: b.name, reason: e.reason, reasonText: REASON_TXT[e.reason], poolRank: e.poolRank, fitRank: e.fitRank, top: e.top, elem: b.elem, res: b.res, riskSet: b.risk, readySet: b.ready, evg: b.evg || '', counterfactual: '' }; };
    const rows = dom.eval.map(row);
    const nextRes = { 'จำกัด': 'ปานกลาง', 'ปานกลาง': 'เพียงพอ' }[out.resource];
    rows.forEach((r) => {
      if (r.reason === 'risk') r.counterfactual = 'จะเข้าข่ายถ้าด้านนี้มีความเสี่ยงระดับ ' + r.riskSet.replace(/,/g, ' หรือ ');
      else if (r.reason === 'ready') r.counterfactual = 'จะเข้าข่ายถ้าความพร้อมขององค์กรอยู่ระดับ ' + r.readySet.replace(/,/g, ' หรือ ');
      else if (r.reason === 'res') r.counterfactual = 'จะเข้าข่ายถ้ามีทรัพยากรระดับ ' + r.res + ' ขึ้นไป หรือได้รับการสนับสนุนจากต้นสังกัด';
      else if (r.reason === 'swapped') { const s = dom.swaps.find((x) => x.out === r.id); r.counterfactual = 'ถูกสลับออกเพื่อให้มี' + (s ? s.label + ' ตามกฎ ' + s.rule + ' แทนด้วย ' + (s.inSb || s.in) : 'มาตรการตามกฎ'); }
      else if (r.reason === 'cap') r.counterfactual = 'อันดับที่ ' + r.poolRank + ' จากที่เหมาะ ' + dom.pool.nPool + ' ข้อ รับได้ ' + dom.pool.cap + ' ข้อ' + (nextRes ? ' (ถ้าทรัพยากรเป็น' + nextRes + ' เพดานเพิ่ม)' : '');
    });
    const selected = dom.measures.map((m, k) => {
      const r = rows.find((x) => x.id === m.id), next = dom.measures[k + 1];
      const e = dom.eval.find((x) => x.id === m.id);
      return Object.assign({ order: m.order, gates: e.gates, tie: tieBreak({ id: m.id, top: m.top, eval: e }, next ? { id: next.id, eval: dom.eval.find((x) => x.id === next.id) } : null, byId) }, r);
    });
    const near = rows.filter((r) => r.reason === 'cap').sort((a, b) => a.poolRank - b.poolRank).slice(0, 3);
    return { counts: cnt, selected, nearMiss: near, stretch: rows.filter((r) => r.reason === 'res').sort((a, b) => a.fitRank - b.fitRank).slice(0, 3), rows, pool: dom.pool };
  }

  function explainDomain(dom, out, data) {
    if (!dom.group) return null;
    const cell = CELLS[dom.group], pkg = data.packages.find((p) => p.code === dom.group);
    return {
      code: dom.group, cell, pkg, risk: dom.risk, ready: dom.ready,
      axes: [AXIS_RISK[dom.risk], AXIS_READY[dom.ready]],
      checks: audit(dom, data), swaps: dom.swaps || [], unmet: dom.unmet || [], sequence: sequence(dom), boundary: boundary(dom, out),
      contrast: contrast(dom, out, data), why: whyNot(dom, out, data),
    };
  }

  // ตรวจคลัง: ในแต่ละช่อง R × ด้านของภัย × ระดับทรัพยากร มีมาตรการที่ตอบเงื่อนไขของช่องกี่ข้อ (หาช่องว่างของคลัง)
  function coverage(data) {
    const rows = [];
    Object.keys(CELLS).forEach((code) => {
      const p = cellParts(code), reqs = requirements(code).filter((r) => r.min != null);
      data.domains.forEach((d) => [1, 2, 3].forEach((res) => {
        const pool = data.bank.filter((b) => (b.dom === d.code || b.dom === 'X') && b.risk.indexOf(p.risk) >= 0 && b.ready.indexOf(p.ready) >= 0 && b.res <= res);
        reqs.forEach((r) => rows.push({ cell: code, dom: d.code, res, pred: r.pred, label: PRED[r.pred].label, src: r.src, pool: pool.length, n: pool.filter(PRED[r.pred].test).length }));
      }));
    });
    return rows;
  }

  const api = { guard, PRED, AXIS_RISK, AXIS_READY, CELLS, RULES, NEAR, DRAFT, REASON_TXT, requirements, cellParts, audit, sequence, boundary, contrast, whyNot, explainDomain, coverage };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RS_DECISION = api;
})(typeof window !== 'undefined' ? window : this);
