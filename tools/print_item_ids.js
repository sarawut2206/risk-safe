// พิมพ์ค่า RISK_IDS และ SEVEN_IDS สำหรับตั้งใน คุณสมบัติสคริปต์ ของ Apps Script (apps-script/collect.gs)  รัน: node tools/print_item_ids.js
const data = require('../data.js');
console.log('RISK_IDS=' + data.riskItems.map((r) => r.id).join(','));
console.log('SEVEN_IDS=' + data.sevenItems.map((r) => r.id).join(','));
