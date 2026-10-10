import { matches } from '@/data/discovery';
export type PartyMode = 'flexible' | 'fixed';
export type Position = 'GK' | 'DF' | 'MF' | 'FW';
export type Access = 'open' | 'approval';
export const positions: { code: Position; name: string }[] = [
  { code: 'GK', name: 'ผู้รักษาประตู' }, { code: 'DF', name: 'กองหลัง' },
  { code: 'MF', name: 'กองกลาง' }, { code: 'FW', name: 'กองหน้า' },
];
export const modeInfo = {
  flexible: { title: 'บุฟเฟต์', subtitle: 'คนเยอะ หารเบา ๆ', detail: 'เปิดรับเพื่อนหลายคน ไม่ล็อคตำแหน่ง แบ่งทีมและสลับกันลงเล่น' },
  fixed: { title: 'ล็อคตำแหน่ง', subtitle: 'เลือกตำแหน่ง เลือกทีม', detail: 'เลือกตำแหน่งที่อยากเล่น และตั้งให้เจ้าของปาร์ตี้อนุมัติก่อนเข้าร่วมได้' },
};
export type PreviewParty = typeof matches[number] & {
  mode: PartyMode; access: Access; slots?: Record<Position, number>;
};
export const previewParties: PreviewParty[] = matches.map((item, index) => index === 2
  ? { ...item, mode: 'fixed', access: 'approval', slots: { GK: 1, DF: 1, MF: 0, FW: 0 } }
  : { ...item, mode: 'flexible', access: 'open', capacity: index === 0 ? 24 : 20, players: index === 0 ? 18 : 14, price: index === 0 ? 100 : 90 });
export type PartyDraft = {
  id: string; title: string; mode: PartyMode; access: Access; fieldId: string;
  date: string; time: string; duration: number; capacity: number; totalCost: number;
  hostPosition: Position | ''; slots: Record<Position, number>; description: string; createdAt: string;
};
export function estimateShare(total: number, players: number) {
  return players > 0 && total >= 0 ? Math.ceil(total / players) : 0;
}
const draftKey = 'kickhub.partyDrafts.v1';
export function readDrafts(): PartyDraft[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(draftKey) || '[]');
    return Array.isArray(data) ? data.filter((item): item is PartyDraft => item && typeof item.id === 'string' && typeof item.title === 'string' && ['fixed', 'flexible'].includes(item.mode) && typeof item.capacity === 'number' && item.capacity > 0 && typeof item.totalCost === 'number' && typeof item.fieldId === 'string' && typeof item.date === 'string' && typeof item.time === 'string' && ['open', 'approval'].includes(item.access)) : [];
  } catch { return []; }
}
export function saveDraft(draft: PartyDraft) {
  localStorage.setItem(draftKey, JSON.stringify([draft, ...readDrafts()].slice(0, 50)));
}
export function deleteDraft(id: string) {
  localStorage.setItem(draftKey, JSON.stringify(readDrafts().filter(item => item.id !== id)));
}
