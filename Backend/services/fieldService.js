// Shared allowlist and validation for owner create/update operations.
function fieldInput(body, partial = false) {
  const data = {};
  const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
  const required = { field_name: 120, field_type: 60, mobile_number: 30, address: 500, open: 5, close: 5, google_map: 2000 };
  for (const [key, max] of Object.entries({ ...required, description: 2000, image: 2000 })) {
    if (!(key in body) && partial) continue;
    if (!(key in body) && !(key in required)) continue;
    if (typeof body[key] !== 'string' || body[key].trim().length > max || (key in required && !body[key].trim())) fail('กรุณากรอกข้อมูลสนามให้ครบและไม่เกินความยาวที่กำหนด');
    data[key] = body[key].trim();
  }
  for (const key of ['open', 'close']) if (key in data && !/^([01]\d|2[0-3]):[0-5]\d$/.test(data[key])) fail('เวลาเปิดและปิดต้องอยู่ในรูปแบบ HH:mm');
  for (const key of ['google_map', 'image']) if (data[key]) {
    let url; try { url = new URL(data[key]); } catch { fail('ลิงก์แผนที่และรูปต้องเป็น URL ที่ถูกต้อง'); }
    if (!['https:', 'http:'].includes(url.protocol)) fail('ลิงก์ต้องใช้ http หรือ https');
  }
  if (!partial || 'price' in body) {
    if ((typeof body.price !== 'number' && typeof body.price !== 'string') || body.price === '' || !Number.isFinite(Number(body.price)) || Number(body.price) < 0 || Number(body.price) > 100000) fail('ราคาต้องอยู่ระหว่าง 0–100,000 บาท');
    data.price = Number(body.price);
  }
  if ('is_active' in body) { if (typeof body.is_active !== 'boolean') fail('สถานะสนามไม่ถูกต้อง'); data.is_active = body.is_active; }
  if ('facilities' in body) {
    if (!Array.isArray(body.facilities) || body.facilities.length > 20 || body.facilities.some(item => typeof item !== 'string' || item.length > 60)) fail('สิ่งอำนวยความสะดวกไม่ถูกต้อง');
    data.facilities = [...new Set(body.facilities)];
  }
  return data;
}
module.exports = { fieldInput };
