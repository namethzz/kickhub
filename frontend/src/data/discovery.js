// Preview fixtures only. These records are never sent to the booking or party API.
export const matches = [
  { id: 'demo-1', title: 'เลิกงานแล้ว มาเตะกัน', field: 'Green Park Football', area: 'ลาดพร้าว, กรุงเทพฯ', day: 'เสาร์', time: '18:00 – 20:00', price: 150, players: 10, capacity: 14, level: 'ทุกระดับ', format: '7 คน', host: 'นนท์', initials: 'N', tone: 'lime', tag: 'รับมือใหม่', positions: 'เล่นได้ทุกตำแหน่ง', description: 'เตะสนุก ๆ หลังเลิกงาน ไม่เน้นผลแพ้ชนะ มาเดี่ยวได้ แบ่งทีมหน้างาน และช่วยกันหารค่าสนาม' },
  { id: 'demo-2', title: 'Sunday football club', field: 'Kick Arena', area: 'รังสิต, ปทุมธานี', day: 'อาทิตย์', time: '17:00 – 19:00', price: 120, players: 8, capacity: 12, level: 'ทุกระดับ', format: '6 คน', host: 'ต้น', initials: 'T', tone: 'orange', tag: 'เตะชิล ๆ', positions: 'เล่นได้ทุกตำแหน่ง', description: 'นัดเตะวันหยุดสำหรับคนอยากขยับร่างกายและเจอเพื่อนใหม่ เตรียมรองเท้าและน้ำดื่มมาได้เลย' },
  { id: 'demo-3', title: 'เติมทีมให้ครบ แล้วลงสนาม', field: 'The Field Bangkok', area: 'บางนา, กรุงเทพฯ', day: 'เสาร์', time: '20:00 – 22:00', price: 180, players: 12, capacity: 14, level: 'มีประสบการณ์', format: '7 คน', host: 'เจ', initials: 'J', tone: 'purple', tag: 'ขาดอีก 2 คน', positions: 'กองหลัง / ผู้รักษาประตู', description: 'ทีมมีผู้เล่นประจำแล้ว กำลังหากองหลังและผู้รักษาประตูเพิ่ม เหมาะกับคนที่เคยลงสนามและอยากเล่นเป็นทีม' },
];
export const fields = [
  { id: 'field-demo-1', name: 'Green Park Football', area: 'ลาดพร้าว, กรุงเทพฯ', price: 1200, hours: '10:00 – 23:00', type: 'สนามกลางแจ้ง', features: ['ที่จอดรถ', 'ห้องอาบน้ำ', 'ไฟสนาม'], image: '/field.jpg' },
  { id: 'field-demo-2', name: 'Kick Arena', area: 'รังสิต, ปทุมธานี', price: 900, hours: '09:00 – 00:00', type: 'สนามหญ้าเทียม', features: ['ที่จอดรถ', 'ห้องน้ำ', 'พื้นที่พัก'], image: '/thefield.png' },
  { id: 'field-demo-3', name: 'The Field Bangkok', area: 'บางนา, กรุงเทพฯ', price: 1500, hours: '10:00 – 23:00', type: 'สนามหญ้าเทียม', features: ['ห้องอาบน้ำ', 'ไฟสนาม', 'ที่จอดรถ'], image: '/field.jpg' },
];
