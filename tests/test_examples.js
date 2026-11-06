// ทดสอบไฟล์ตัวอย่างสมมติใน examples/: ต้องอ่านได้ ผ่านตัวตรวจ และมีป้าย synthetic ทุกไฟล์ (ป้องกันการนำไปปะปนกับข้อมูลจริง)
// รัน: node tests/test_examples.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const data = require(path.join(root, 'data.js')), L = require(path.join(root, 'learn.js')), V = require(path.join(root, 'evalkit.js'));
let checks = 0, fails = 0;
const ok = (name, cond, info) => { checks++; if (!cond) { fails++; console.log('FAIL', name, info === undefined ? '' : info); } };
const list = JSON.parse(fs.readFileSync(path.join(root, 'examples', 'index.json'), 'utf8'));
ok('index lists files', list.length >= 20, list.length);
const files = list.map((n) => { ok(n + ' exists', fs.existsSync(path.join(root, 'examples', n))); return JSON.parse(fs.readFileSync(path.join(root, 'examples', n), 'utf8')); });
ok('every file is flagged synthetic', files.every((f) => f.synthetic === true));
ok('every file name says synthetic', list.filter((n) => n !== 'index.json').every((n) => /^synthetic-/.test(n)), list.join());
ok('no real-looking school names', files.every((f) => JSON.stringify(f).indexOf('โรงเรียน') < 0 || !f.school || !f.school.name));
const reps = files.filter((f) => f.schema === L.SCHEMA), ex = files.filter(V.validExpert), ad = files.filter(V.validAdmin);
ok('all school reports valid', reps.length > 0 && reps.every((r) => L.validateReport(r).ok)); ok('expert files', ex.length === 9); ok('admin files', ad.length === 10);
ok('files are accounted for', reps.length + ex.length + ad.length === files.length);
ok('unique codes', new Set(reps.map((r) => r.code)).size === reps.length && new Set(ex.map((r) => r.code)).size === ex.length);
const a = L.aggregate(reps, data.bank); ok('aggregate flags all as synthetic', a.nSynthetic === reps.length);
const e = V.analyzeExperts(ex, V.makeCases(data.domains)); ok('experts analysable', e.n === 9 && e.per.length === 9);
ok('pilot pairs', L.pairs(reps).length === reps.length);
console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
