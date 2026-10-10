export const players = [
  { id: 'nont', name: 'นนท์', initials: 'N', area: 'ลาดพร้าว, กรุงเทพฯ', position: 'กองกลาง', level: 'เล่นเพื่อออกกำลังกาย', bio: 'ชอบเตะบอลหลังเลิกงาน มาเดี่ยวก็เล่นด้วยกันได้ เน้นสนุกและให้ทุกคนได้ลงสนาม', tags: ['รับมือใหม่', 'บุฟเฟต์'], parties: ['demo-1'] },
  { id: 'ton', name: 'ต้น', initials: 'T', area: 'รังสิต, ปทุมธานี', position: 'กองหน้า', level: 'เล่นเป็นประจำ', bio: 'วันหยุดชอบลงสนามกับเพื่อนใหม่ เล่นแบบเป็นกันเองและแบ่งทีมให้สูสีกัน', tags: ['เตะวันหยุด', 'บุฟเฟต์'], parties: ['demo-2'] },
  { id: 'jay', name: 'เจ', initials: 'J', area: 'บางนา, กรุงเทพฯ', position: 'กองหน้า', level: 'มีประสบการณ์', bio: 'กำลังหาเพื่อนมาเติมทีม ชอบเล่นเป็นทีมและนัดหมายเวลาให้ชัดเจน', tags: ['ล็อคตำแหน่ง', '7 คน'], parties: ['demo-3'] },
  { id: 'beam', name: 'บีม', initials: 'B', area: 'บางนา, กรุงเทพฯ', position: 'ผู้รักษาประตู', level: 'เล่นเป็นประจำ', bio: 'เล่นผู้รักษาประตูเป็นหลัก พร้อมเจอทีมใหม่และช่วยทีมในเกมรับ', tags: ['ผู้รักษาประตู', 'ล็อคตำแหน่ง'], parties: [] },
  { id: 'mint', name: 'มิ้นท์', initials: 'M', area: 'บางนา, กรุงเทพฯ', position: 'กองหลัง', level: 'เล่นเป็นประจำ', bio: 'ชอบเล่นเกมรับ เตะเพื่อออกกำลังกายและหาเพื่อนใหม่ในสนาม', tags: ['กองหลัง', 'ล็อคตำแหน่ง'], parties: [] },
];
export const hostIds: Record<string, string> = { 'demo-1': 'nont', 'demo-2': 'ton', 'demo-3': 'jay' };
export function findPlayer(id?: string) { return players.find(player => player.id === id); }
