export type NotificationItem = { _id: string; party_id: string; party_name: string; type: 'request' | 'submitted' | 'approved' | 'declined' | 'joined' | 'cancelled' | 'updated' | 'party_cancelled'; actor_name: string; created_at: string; read: boolean };
export type NotificationFeed = { items: NotificationItem[]; total: number; unread: number; asOf: string; page: number; pageSize: number };
export const notificationChanged = 'kickhub-notifications-changed';
