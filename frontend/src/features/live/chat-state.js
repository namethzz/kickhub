/** @typedef {{ _id: string, sender_id: string, sender_name: string, text: string, created_at: string }} Message */
/** @param {Message[]} current @param {Message[]} incoming */
export function mergeMessages(current, incoming) {
  return [...new Map([...current, ...incoming].map(message => [message._id, message])).values()]
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a._id.localeCompare(b._id)).slice(-200);
}
export function messageId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16)); bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
