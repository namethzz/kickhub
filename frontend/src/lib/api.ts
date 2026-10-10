export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${import.meta.env.VITE_API_URL || ''}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { if (response.status === 401) localStorage.removeItem('token'); throw new Error(data.message || data.error || 'ระบบไม่พร้อมใช้งาน กรุณาลองใหม่'); }
  return data;
}
export type PublicPlayer = { _id: string; name: string; bio: string; area: string; preferred_position: string; level: string; role: string; email?: string };
export type Member = { user_id: string; name: string; position: string | null };
export type JoinRequest = Member & { _id: string; status: 'pending'|'approved'|'declined'|'cancelled' };
export type LiveParty = { _id: string; party_name: string; mode: 'fixed'|'flexible'; access: 'open'|'approval'; field_id: string; field_name: string; address: string; user_id: string; host_name: string; description: string; start_datetime: string; end_datetime: string; price: number; google_map: string; capacity: number; required_positions: {position:string;amount:number}[]; participants: Member[]; join_requests: JoinRequest[] };
export type LiveField = { _id: string; field_name: string; address: string; price: number; field_type: string; image?: string; open: string; close: string; facilities?: string[] | Record<string, boolean> };
export type FieldDetail = LiveField & { description?: string; google_map: string; mobile_number: string; owner_id: string };
export type DiscoveryParty = Pick<LiveParty, '_id' | 'party_name' | 'mode' | 'access' | 'field_id' | 'field_name' | 'address' | 'start_datetime' | 'end_datetime' | 'price' | 'capacity'> & { player_count: number };
export type DiscoveryFeed = { fields: LiveField[]; parties: DiscoveryParty[] };
