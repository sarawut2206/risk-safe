/* ตั้งค่า R²-SAFE
   bankUrl = ที่อยู่ Google Apps Script web app ที่ส่งคลังมาตรการ (อ่านอย่างเดียว) เว็บนี้ไม่ส่งข้อมูลที่ผู้ใช้กรอกไปที่ URL นี้
   ว่างไว้ = ใช้ข้อมูลที่ฝังในเว็บ (data.js) */
window.RS_CONFIG = {
  bankUrl: 'https://script.google.com/macros/s/AKfycbwDvESTZXk-EdGg7wozY7TJ7JZ-gBiAqmByWR82f-Mga1J2zsaiTLoihA2X2JC5DnT6/exec',
  timeoutMs: 8000,
  // ระบบรวบรวมข้อมูลสถานศึกษา (หน้า #portal)
  // collectMode: 'demo' = ทดลองกรอก ไม่ส่งข้อมูล (ค่าเริ่มต้น) · 'tryout' = ทดลองใช้กับผู้ให้ข้อมูล 30 คน · 'live' = เก็บข้อมูลวิจัยจริง
  // เปลี่ยนเป็น tryout หรือ live ได้เมื่อผ่านการรับรองจริยธรรม ตรวจ IOC และติดตั้ง apps-script/collect.gs แล้วเท่านั้น
  // collectUrl = ที่อยู่เว็บแอปของ collect.gs ว่างไว้ = ส่งตรงไม่ได้ (ผู้ตอบดาวน์โหลดไฟล์ส่งผู้วิจัยแทน)
  collectMode: 'demo',
  collectUrl: '',
};
