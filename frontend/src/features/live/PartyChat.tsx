import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, RefreshCw, ArrowDown } from 'lucide-react';
import { api } from '@/lib/api';
import { mergeMessages, messageId } from './chat-state';
import { notificationChanged } from './notifications-api';
import './party-chat.css';

type Message = { _id: string; sender_id: string; sender_name: string; text: string; created_at: string };
type Chat = { messages: Message[]; readOnly: boolean; reason: string; hasOlder: boolean; retention: number };
export default function PartyChat({ partyId, actorId }: { partyId: string; actorId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [olderBusy, setOlderBusy] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [denied, setDenied] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [newMessages, setNewMessages] = useState(false);
  const [readError, setReadError] = useState('');
  const list = useRef<HTMLDivElement>(null);
  const alive = useRef(false), fetching = useRef(false), sendingRef = useRef(false), loaded = useRef(false), nearBottom = useRef(true);
  const pending = useRef<{ id: string; text: string } | null>(null);
  const knownIds = useRef(new Set<string>());
  const latestCursor = useRef(''), acknowledged = useRef(''), reading = useRef(false);
  const url = `/api/v2/parties/${partyId}/messages`;
  const handleError = useCallback((err: Error & { status?: number }) => {
    if (!alive.current) return;
    setError(err.message);
    if (err.status === 401 || err.status === 403) { setDenied(true); setMessages([]); setState(null); loaded.current = false; knownIds.current.clear(); }
  }, []);
  const acknowledge = useCallback(async (): Promise<void> => {
    if (reading.current || !nearBottom.current || !alive.current || document.visibilityState !== 'visible') return;
    const cursor = latestCursor.current;
    if (!cursor || cursor === acknowledged.current) return;
    if (!list.current?.querySelector(`[data-message-id="${cursor}"]`)) return;
    reading.current = true;
    try {
      const result = await api<{ changed: boolean }>(`${url}/read`, { method: 'PATCH', body: JSON.stringify({ message_id: cursor }) });
      if (!alive.current) return;
      acknowledged.current = cursor; setReadError('');
      if (result.changed) window.dispatchEvent(new Event(notificationChanged));
    } catch (err) {
      if (alive.current) setReadError('บันทึกสถานะอ่านไม่สำเร็จ จะลองใหม่เมื่อแชตอัปเดต');
      if ([401, 403].includes((err as Error & { status?: number }).status || 0)) handleError(err as Error);
    } finally {
      reading.current = false;
      if (alive.current && latestCursor.current !== cursor) void acknowledge();
    }
  }, [url, handleError]);
  const refresh = useCallback(async (replace = false) => {
    if (fetching.current) return; fetching.current = true;
    try {
      const data = await api<Chat>(url);
      if (!alive.current) return;
      latestCursor.current = data.messages.at(-1)?._id || '';
      setDenied(false); setError(''); setState(data);
      if (replace || !loaded.current) { setHasOlder(data.hasOlder); setMessages(data.messages); knownIds.current.clear(); nearBottom.current = true; }
      else { if (!nearBottom.current && data.messages.some(item => !knownIds.current.has(item._id))) setNewMessages(true); setMessages(current => mergeMessages(current, data.messages)); }
      data.messages.forEach(item => knownIds.current.add(item._id));
      loaded.current = true;
    } catch (err) { handleError(err as Error); }
    finally { fetching.current = false; if (alive.current) setLoading(false); }
  }, [url, handleError]);
  useEffect(() => {
    alive.current = true; void refresh();
    const update = () => { if (document.visibilityState === 'visible') void refresh(); };
    const timer = window.setInterval(update, 10000); document.addEventListener('visibilitychange', update);
    return () => { alive.current = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, [refresh]);
  useEffect(() => { if (nearBottom.current && list.current) { list.current.scrollTop = list.current.scrollHeight; setNewMessages(false); void acknowledge(); } }, [messages, acknowledge]);
  async function older() {
    if (olderBusy || !messages.length) return;
    setOlderBusy(true); setError('');
    const box = list.current, previousHeight = box?.scrollHeight || 0, previousTop = box?.scrollTop || 0;
    nearBottom.current = false;
    try {
      const data = await api<Chat>(`${url}?before=${encodeURIComponent(messages[0]._id)}`);
      if (!alive.current) return;
      setState(data); setHasOlder(data.hasOlder); setMessages(current => mergeMessages(current, data.messages));
      data.messages.forEach(item => knownIds.current.add(item._id));
      requestAnimationFrame(() => { if (alive.current && box) box.scrollTop = previousTop + box.scrollHeight - previousHeight; });
    } catch (err) { handleError(err as Error); }
    finally { if (alive.current) setOlderBusy(false); }
  }
  async function send() {
    const value = text.trim(); if (!value || sendingRef.current || state?.readOnly || denied) return;
    sendingRef.current = true; setSending(true); setError('');
    try {
      if (!pending.current || pending.current.text !== value) pending.current = { id: messageId(), text: value };
      const message = await api<Message>(url, { method: 'POST', body: JSON.stringify({ text: value, client_id: pending.current.id }) });
      if (!alive.current) return;
      pending.current = null; setText(''); nearBottom.current = true; knownIds.current.add(message._id); setMessages(current => mergeMessages(current, [message]));
    } catch (err) { handleError(err as Error); }
    finally { sendingRef.current = false; if (alive.current) setSending(false); }
  }
  function keyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    event.preventDefault();
    if (!event.repeat && state && !sendingRef.current) event.currentTarget.form?.requestSubmit();
  }
  return <section className="party-chat" aria-label="แชตสมาชิกปาร์ตี้">
    <div className="party-chat-head"><div><MessageCircle size={19} /><strong>คุยกับทีม</strong></div><button type="button" onClick={() => void refresh(true)} aria-label="โหลดแชตใหม่"><RefreshCw size={17} /></button></div>
    <p className="party-chat-hint">เฉพาะหัวตี้และสมาชิก · เก็บล่าสุด 200 ข้อความ · อัปเดตทุก 10 วินาทีขณะเปิดหน้า</p>
    {loading ? <p className="party-chat-hint" role="status">กำลังโหลดแชต…</p> : !denied && <>
      {hasOlder && <button className="party-chat-older" onClick={older} disabled={olderBusy}>{olderBusy ? 'กำลังโหลด…' : 'โหลดข้อความก่อนหน้า'}</button>}
      <div data-lenis-prevent className="party-chat-messages" ref={list} role="log" aria-label="ข้อความในปาร์ตี้" aria-live="polite" aria-relevant="additions" onScroll={() => { const box = list.current; if (box) { nearBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight < 60; if (nearBottom.current) { setNewMessages(false); void acknowledge(); } } }}>
        {!messages.length && <div className="party-chat-empty"><MessageCircle size={28} /><strong>เริ่มคุยกับทีมได้เลย</strong><p>ทักทายเพื่อน หรือคุยเรื่องจุดนัดพบก่อนลงสนาม</p></div>}
        {messages.map(message => <article className="party-chat-message" data-own={message.sender_id === actorId} key={message._id} data-message-id={message._id}><Link to={`/players/${message.sender_id}`} state={{ from: `/parties/${partyId}` }} className="party-chat-sender">{message.sender_name}{message.sender_id === actorId ? ' · คุณ' : ''}</Link><p>{message.text}</p><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'short', timeStyle: 'short' })}</time></article>)}
      </div>
      {newMessages && <button className="party-chat-new" onClick={() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; nearBottom.current = true; setNewMessages(false); void acknowledge(); }}><ArrowDown size={16} />มีข้อความใหม่</button>}
    </>}
    {error && <p className="party-error" role="alert">{error} <button className="party-chat-retry" onClick={() => void refresh(true)}>โหลดใหม่</button></p>}
    {readError && !denied && <p className="party-chat-hint" role="status">{readError}</p>}
    {state?.readOnly ? <p className="party-chat-hint" role="status">{state.reason}</p> : !denied && <form className="party-chat-compose" onSubmit={event => { event.preventDefault(); void send(); }}><label htmlFor="party-chat-text">ข้อความถึงทีม</label><textarea id="party-chat-text" value={text} onChange={event => setText(event.target.value)} onKeyDown={keyDown} maxLength={1000} rows={2} disabled={!state} readOnly={sending} placeholder="พิมพ์ข้อความ…" /><div><small>{text.length}/1,000 · กดส่ง หรือ Enter บนคอมพิวเตอร์ · Shift+Enter ขึ้นบรรทัดใหม่</small><button className="kh-button kh-dark" disabled={sending || !state || !text.trim()} type="submit"><Send size={16} />{sending ? 'กำลังส่ง…' : 'ส่ง'}</button></div></form>}
  </section>;
}
