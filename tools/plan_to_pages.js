// แปลงแผนปฏิบัติการ (PDF) เป็นข้อความรายหน้า (pages.json) เพื่อทดสอบ planread.js ด้วยไฟล์จริงโดยไม่ต้องเปิดเว็บ
// ใช้ pdf.js ฉบับเดียวกับที่ฝังในเว็บ ติดตั้งไว้นอก repo ก่อน: npm install pdfjs-dist@3.11.174
// รัน: node tools/plan_to_pages.js แผน.pdf pages.json   แล้ว  PLAN_PAGES_JSON=pages.json node tests/test_planread.js
// หมายเหตุ: ไฟล์แผนจริงมีชื่อบุคคล ไม่ควรเก็บ PDF หรือ pages.json ไว้ใน repo
const fs = require('fs'), path = require('path');
const R = require(path.join(__dirname, '..', 'planread.js'));
const [, , src, dst] = process.argv;
if (!src || !dst) { console.log('ใช้: node tools/plan_to_pages.js แผน.pdf pages.json'); process.exit(1); }
let pdfjs; try { pdfjs = require('pdfjs-dist/legacy/build/pdf.js'); } catch (e) { console.log('ไม่พบ pdfjs-dist (npm install pdfjs-dist@3.11.174)'); process.exit(1); }
(async () => {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(src)), verbosity: 0 }).promise, pages = [];
  for (let n = 1; n <= doc.numPages; n++) { const tc = await (await doc.getPage(n)).getTextContent(); pages.push({ n, lines: R.linesFromItems(tc.items) }); }
  fs.writeFileSync(dst, JSON.stringify(pages));
  const out = R.parse(pages);
  console.log(doc.numPages + ' หน้า · พบ ' + out.evidence.length + ' ค่า · โครงการ ' + out.projects.length + ' รายการ');
  out.evidence.forEach((e) => console.log(e.label + ': ' + e.value + ' (หน้า ' + e.page + ', ' + e.conf + ')'));
})();
