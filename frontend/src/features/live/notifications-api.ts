import { api } from '@/lib/api';
export type NotificationItem = { _id: string; party_id: string; party_name: string; type: 'request' | 'submitted' | 'approved' | 'declined' | 'joined' | 'cancelled' | 'updated' | 'party_cancelled' | 'chat'; actor_name: string; created_at: string; read: boolean };
export type NotificationFeed = { items: NotificationItem[]; total: number; unread: number; asOf: string; page: number; pageSize: number };
export const notificationChanged = 'kickhub-notifications-changed';
export async function markNotificationRead(id: string) {
  await api(`/api/v2/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
  window.dispatchEvent(new Event(notificationChanged));
}
export async function markPartyActivityRead(partyId: string, through: string) {
  await api(`/api/v2/parties/${encodeURIComponent(partyId)}/notifications/read`, { method: 'PATCH', body: JSON.stringify({ through }) });
  window.dispatchEvent(new Event(notificationChanged));
}
