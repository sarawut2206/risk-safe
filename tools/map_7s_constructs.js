// จับคู่ข้อประเมิน 7-S ทั้ง 38 ข้อ กับองค์ประกอบของ "ความพร้อมขององค์กร" ในทฤษฎีความพร้อม (R = MC2 ของ Scaccia et al., 2015 และทฤษฎีของ Weiner, 2009)
// เพื่อตอบว่า 7-S ใช้แทนการประเมินความพร้อมได้มากน้อยเพียงใด  การจัดกลุ่มเป็นดุลยพินิจของผู้วิจัย ต้องให้ผู้เชี่ยวชาญตรวจ (IOC) ก่อนใช้อ้างอิง
// รัน: node tools/map_7s_constructs.js  (ผล: analysis/sevenS_construct_map.json)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const data = require(path.join(root, 'data.js'));
const CONSTRUCTS = {
  ISC: { th: 'ขีดความสามารถเฉพาะด้านความปลอดภัย (innovation-specific capacity)', def: 'ความรู้ ทักษะ ขั้นตอน ผู้รับผิดชอบ และทรัพยากรที่ใช้กับงานความปลอดภัยโดยตรง', src: 'Scaccia et al. (2015)' },
  GC: { th: 'ขีดความสามารถทั่วไปขององค์กร (general capacity)', def: 'การนำองค์กร วัฒนธรรมการทำงาน อัตรากำลังและภาระงาน กระบวนการบริหารทั่วไป', src: 'Scaccia et al. (2015)' },
  MOT: { th: 'แรงจูงใจและการให้ความสำคัญ (motivation / change valence)', def: 'ระดับที่องค์กรให้คุณค่าและให้ความสำคัญกับความปลอดภัยเมื่อเทียบกับเรื่องอื่น', src: 'Scaccia et al. (2015); Weiner (2009) ส่วน change valence' },
  CE: { th: 'ความเชื่อมั่นร่วมว่าทำได้ (change efficacy)', def: 'การประเมินร่วมของบุคลากรว่าองค์กรมีความสามารถ ทรัพยากร และสถานการณ์พร้อมที่จะทำการเปลี่ยนแปลงนั้น', src: 'Weiner (2009); วัดด้วย ORIC (Shea et al., 2014)' },
  CC: { th: 'ความผูกพันร่วมต่อการเปลี่ยนแปลง (change commitment)', def: 'ความมุ่งมั่นร่วมของบุคลากรที่จะลงมือทำการเปลี่ยนแปลงนั้น', src: 'Weiner (2009); วัดด้วย ORIC (Shea et al., 2014)' },
};
// ข้อ -> [กลุ่มหลัก, กลุ่มรอง หรือ '', เหตุผลสั้น]
const M = {
  STG1: ['ISC', '', 'แผนความปลอดภัยเป็นลายลักษณ์อักษร: ขีดความสามารถเฉพาะด้าน'], STG2: ['ISC', '', 'จัดลำดับความเสี่ยงจากข้อมูลเหตุการณ์: ทักษะวิเคราะห์เฉพาะด้าน'],
  STG3: ['GC', '', 'เป้าหมายและตัวชี้วัด: การวางแผนทั่วไป'], STG4: ['ISC', 'MOT', 'งบประมาณที่ระบุชัด: ทรัพยากรเฉพาะด้านและสัญญาณการให้ความสำคัญ'],
  STG5: ['GC', '', 'สอดคล้องแนวทางต้นสังกัด: การกำกับทั่วไป'], STG6: ['GC', '', 'ทบทวนแผนปีละครั้ง: วงจรบริหารทั่วไป'],
  STR1: ['ISC', '', 'คำสั่งแต่งตั้งผู้รับผิดชอบความปลอดภัย'], STR2: ['ISC', '', 'สายแจ้งเหตุและผู้ตัดสินใจ'], STR3: ['ISC', '', 'ผู้รับผิดชอบรายด้านของภัย'], STR4: ['ISC', '', 'ช่องทางติดต่อหน่วยงานภายนอก'], STR5: ['GC', '', 'ประชุมคณะทำงานสม่ำเสมอ'],
  SYS1: ['ISC', '', 'ช่องทางแจ้งเหตุ'], SYS2: ['ISC', '', 'ขั้นตอนรับแจ้งถึงติดตามผล'], SYS3: ['ISC', '', 'ระบบบันทึกเหตุการณ์'], SYS4: ['ISC', '', 'การจัดการข้อมูลส่วนบุคคลของผู้เรียน'], SYS5: ['ISC', '', 'แผนเผชิญเหตุและการซ้อม'], SYS6: ['ISC', 'GC', 'ติดตามผลหลังเกิดเหตุและบันทึกบทเรียน'],
  STY1: ['MOT', 'GC', 'ผู้บริหารเป็นแบบอย่าง: สัญญาณความสำคัญและการนำ'], STY2: ['GC', '', 'เปิดรับเสียงสะท้อน'], STY3: ['GC', 'MOT', 'ตัดสินใจโดยคำนึงสิทธิผู้เรียน'], STY4: ['GC', '', 'กำกับติดตามเป็นระยะ'], STY5: ['GC', '', 'รับฟังข้อเสนอแนะของครู'],
  STF1: ['ISC', '', 'ผู้ดูแลช่วยเหลือนักเรียนที่มีเวลาชัดเจน'], STF2: ['ISC', '', 'บุคลากรด้านสุขภาพกายและจิต'], STF3: ['GC', '', 'ภาระงานไม่ซ้อน: อัตรากำลังทั่วไป'], STF4: ['GC', '', 'อัตรากำลังเวรยามเพียงพอ'], STF5: ['GC', '', 'การสนับสนุนบุคลากร'],
  SKL1: ['ISC', '', 'ประเมินความเสี่ยงและสัญญาณเตือน'], SKL2: ['ISC', '', 'ช่วยเหลือเบื้องต้นและส่งต่อ'], SKL3: ['ISC', '', 'ปฐมพยาบาลและตอบสนองเหตุ'], SKL4: ['ISC', '', 'ใช้เทคโนโลยีอย่างปลอดภัย'], SKL5: ['ISC', '', 'สื่อสารและดูแลผู้ได้รับผลกระทบ'], SKL6: ['GC', 'ISC', 'แผนพัฒนาสมรรถนะรายปี'],
  VAL1: ['MOT', '', 'ไม่ยอมรับความรุนแรง: ค่านิยม'], VAL2: ['MOT', '', 'ช่วยเหลือโดยไม่ตีตรา'], VAL3: ['MOT', '', 'ความปลอดภัยเป็นความรับผิดชอบร่วม'], VAL4: ['MOT', '', 'ศักดิ์ศรีและความเป็นส่วนตัวของผู้เรียน'], VAL5: ['GC', '', 'ยกย่องและถ่ายทอดแนวปฏิบัติที่ดี: วัฒนธรรมองค์กร'],
};
const HARD = { STG: 'แข็ง', STR: 'แข็ง', SYS: 'แข็ง', STY: 'อ่อน', STF: 'อ่อน', SKL: 'อ่อน', VAL: 'อ่อน' };
const rows = data.sevenItems.map((s) => { const m = M[s.id]; if (!m) throw new Error('missing map ' + s.id); return { id: s.id, elem: s.elem, hardSoft: HARD[s.elem], text: s.text, primary: m[0], secondary: m[1], why: m[2] }; });
const count = (f) => rows.filter(f).length;
const cov = Object.keys(CONSTRUCTS).map((k) => ({ code: k, name: CONSTRUCTS[k].th, primary: count((r) => r.primary === k), anyMention: count((r) => r.primary === k || r.secondary === k) }));
const byElem = data.elements.map((e) => { const r = rows.filter((x) => x.elem === e.code); return { elem: e.code, n: r.length, ISC: r.filter((x) => x.primary === 'ISC').length, GC: r.filter((x) => x.primary === 'GC').length, MOT: r.filter((x) => x.primary === 'MOT').length }; });
// กำลังทดสอบความสัมพันธ์ (Fisher z, สองข้าง α = .05, กำลัง 80%): r ที่ตรวจพบได้ตามจำนวนโรงเรียน
const detectableR = (n) => Math.tanh((1.959964 + 0.841621) / Math.sqrt(n - 3));
const power = [60, 85, 108, 150, 180].map((n) => ({ n, r: +detectableR(n).toFixed(3) }));
const out = { constructs: CONSTRUCTS, rows, coverage: cov, byElement: byElem, total: rows.length, hardItems: count((r) => r.hardSoft === 'แข็ง'), softItems: count((r) => r.hardSoft === 'อ่อน'), measuresPracticeNotAttitude: true, uncovered: ['CE', 'CC'], detectableCorrelation: power };
fs.mkdirSync(path.join(root, 'analysis'), { recursive: true });
fs.writeFileSync(path.join(root, 'analysis', 'sevenS_construct_map.json'), JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify({ total: out.total, coverage: cov, byElem, power }, null, 1));
