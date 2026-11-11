// ทดสอบข้อมูลความสอดคล้องกับประกาศ ศธ. 7 มาตรการ (moe.js)  รัน: node tests/test_moe.js
const path = require('path');
const root = path.join(__dirname, '..');
const data = require(path.join(root, 'data.js')), M = require(path.join(root, 'moe.js'));
let checks = 0, fails = 0;
const ok = (n, c, i) => { checks++; if (!c) { fails++; console.log('FAIL', n, i === undefined ? '' : i); } };
const eq = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a) + ' != ' + JSON.stringify(b));

eq('seven items numbered 1..7', M.ITEMS.map((i) => i.n), [1, 2, 3, 4, 5, 6, 7]);
ok('every item has title, requirements and a valid level', M.ITEMS.every((i) => i.title && i.req.length >= 2 && Object.keys(M.LEVELS).indexOf(i.level) >= 0));
const bankIds = new Set(data.bank.map((x) => x.sb));
ok('every mapped SB id exists in the bank', M.ITEMS.every((i) => i.sb.every((id) => bankIds.has(id))), JSON.stringify(M.ITEMS.map((i) => i.sb.filter((id) => !bankIds.has(id)))));
ok('no duplicate SB id inside one item', M.ITEMS.every((i) => new Set(i.sb).size === i.sb.length));
ok('items that are not fully covered state their gaps', M.ITEMS.filter((i) => i.level !== 'good').every((i) => i.gaps.length >= 1));
eq('summary counts', M.summary(), { good: 3, partial: 3, none: 1, total: 7 });
eq('SB-056 supports items 5 and 6', M.forSb('SB-056'), [5, 6]);
eq('SB-002 supports item 1', M.forSb('SB-002'), [1]);
eq('SB-039 supports items 1, 3 and 4', M.forSb('SB-039'), [1, 3, 4]);
eq('unknown SB id maps to nothing', M.forSb('SB-999'), []);
ok('item 7 (no dedicated measure) carries a rights caution', M.ITEMS[6].level === 'none' && /สิทธิ/.test(M.ITEMS[6].caution));
ok('source note says it is a summary, not the official text', /ไม่ใช่ข้อความทางการ/.test(M.SOURCE.note) && M.SOURCE.date === '10 สิงหาคม 2569');
ok('status options start with not yet checked', M.STATUS[0] === 'ยังไม่ได้ตรวจ' && M.STATUS.length === 4);
console.log(checks + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
