import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Bell, CheckCheck, CheckCircle2, ChevronLeft, ChevronRight, Clock3, RefreshCw, UserMinus, UserPlus, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { ApiError, when } from './LiveParties';
import { markNotificationRead, notificationChanged, type NotificationFeed } from './notifications-api';
import './notifications.css';
const messages = {
  request: { title: 'มีคำขอเข้าร่วมใหม่', icon: UserPlus },
  submitted: { title: 'ส่งคำขอเข้าร่วมแล้ว', icon: Clock3 },
  approved: { title: 'หัวตี้อนุมัติแล้ว ไปเตะด้วยกัน!', icon: CheckCircle2 },
  declined: { title: 'คำขอไม่ได้รับอนุมัติ', icon: XCircle },
  joined: { title: 'มีเพื่อนเข้าร่วมปาร์ตี้', icon: UserPlus },
  updated: { title: 'หัวตี้เปลี่ยนรายละเอียดนัด ตรวจสอบก่อนลงสนาม', icon: RefreshCw },
  party_cancelled: { title: 'หัวตี้ยกเลิกปาร์ตี้แล้ว', icon: XCircle },
  cancelled: { title: 'มีผู้เล่นยกเลิกการเข้าร่วม', icon: UserMinus },
};
export default function LiveNotifications() {
  const [params, setParams] = useSearchParams();
  const unreadOnly = params.get('filter') === 'unread';
  const rawPage = Number(params.get('page') || 1);
  const page = Number.isInteger(rawPage) && rawPage > 0 && rawPage <= 10000 ? rawPage : 1;
  const [feed, setFeed] = useState<NotificationFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    api<NotificationFeed>(`/api/v2/notifications?filter=${unreadOnly ? 'unread' : 'all'}&page=${page}`).then(data => { if (active) setFeed(data); }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [unreadOnly, page, reload]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') setReload(value => value + 1); };
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener(notificationChanged, refresh);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener(notificationChanged, refresh); };
  }, []);
  async function readAll() {
    if (!feed || busy) return;
    setBusy(true); setActionError(''); setNotice('');
    try {
      await api('/api/v2/notifications/read', { method: 'PATCH', body: JSON.stringify({ through: feed.asOf }) });
      setNotice('อ่านแจ้งเตือนทั้งหมดก่อนการอัปเดตครั้งล่าสุดแล้ว'); setParams({ filter: unreadOnly ? 'unread' : 'all', page: '1' }); setReload(value => value + 1); window.dispatchEvent(new Event(notificationChanged));
    } catch (error) { setActionError((error as Error).message); }
    finally { setBusy(false); }
  }
  const pages = feed ? Math.max(1, Math.ceil(feed.total / feed.pageSize)) : 1;
  return <main className="party-app kh-notifications-page">
    <Link className="party-back" to="/my-parties"><ArrowLeft size={16} />ปาร์ตี้ของฉัน</Link>
    <div className="party-page-head"><div><span className="party-kicker">STAY IN THE GAME</span><h1>แจ้งเตือน</h1><p>คำขอใหม่ ผลอนุมัติ และความเคลื่อนไหวในตี้ของคุณ</p></div><span className="kh-inbox-emblem"><Bell size={24} /></span></div>
    <div className="kh-inbox-controls"><div className="kh-inbox-tabs">{[['all', 'ทั้งหมด'], ['unread', 'ยังไม่อ่าน']].map(([value, label]) => <button className={(unreadOnly ? 'unread' : 'all') === value ? 'active' : ''} aria-pressed={(unreadOnly ? 'unread' : 'all') === value} key={value} onClick={() => setParams({ filter: value, page: '1' })}>{label}{value === 'unread' && !loading && !error && feed && <b>{feed.unread}</b>}</button>)}</div><button className="kh-inbox-refresh" disabled={loading || busy} onClick={() => setReload(value => value + 1)} aria-label="อัปเดตแจ้งเตือน"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /></button></div>
    <div className="kh-inbox-caption"><span>{loading ? 'กำลังอัปเดต…' : !error && feed ? `ยังไม่อ่าน ${feed.unread} รายการ` : 'แจ้งเตือนของคุณ'}</span><button onClick={readAll} disabled={loading || busy || !!error || !feed?.unread}><CheckCheck size={17} />{busy ? 'กำลังบันทึก…' : 'อ่านทั้งหมด'}</button></div>
    {notice && <p className="party-draft-note" role="status">{notice}</p>}{actionError && <p className="party-error" role="alert">{actionError}</p>}
    {loading ? <div className="kh-inbox-loading" role="status">กำลังโหลดแจ้งเตือน…</div> : error ? <ApiError message={error} retry={() => setReload(value => value + 1)} /> : feed && <>
      <div className="kh-inbox-list">{feed.items.map(item => {
        const { icon: Icon, title } = messages[item.type];
        const href = item.type === 'request' ? `/party-requests/${item.party_id}` : `/parties/${item.party_id}`;
        return <Link key={item._id} to={href} onClick={() => { if (!item.read) void markNotificationRead(item._id).catch(() => {}); }} className={`kh-inbox-item ${item.read ? '' : 'unread'}`}><span className={`kh-inbox-icon ${item.type}`}><Icon size={20} /></span><div className="kh-inbox-text"><div><h2>{title}</h2>{!item.read && <span className="kh-inbox-dot" aria-label="ยังไม่อ่าน" />}</div><p>{['request', 'joined', 'cancelled'].includes(item.type) ? `${item.actor_name} · ` : ''}{item.party_name}</p><time dateTime={item.created_at}>{when(item.created_at)}</time></div><ArrowUpRight className="kh-inbox-arrow" size={18} /></Link>;
      })}</div>
      {!feed.items.length && <section className="party-empty kh-inbox-empty"><Bell size={32} /><h3>{unreadOnly ? 'อ่านครบแล้ว พร้อมลงสนาม' : 'ยังไม่มีแจ้งเตือน'}</h3><p>กิจกรรมใหม่เกี่ยวกับคำขอและปาร์ตี้ของคุณจะแสดงที่นี่</p><Link className="kh-button kh-dark" to="/my-parties">ดูปาร์ตี้ของฉัน</Link>{page > 1 && <button className="kh-inbox-read" onClick={() => setParams({ filter: unreadOnly ? 'unread' : 'all', page: '1' })}>กลับหน้าแรก</button>}</section>}
      {feed.total > feed.pageSize && <nav className="kh-inbox-pagination" aria-label="หน้าแจ้งเตือน"><button disabled={page <= 1} onClick={() => setParams({ filter: unreadOnly ? 'unread' : 'all', page: String(page - 1) })} aria-label="หน้าก่อนหน้า"><ChevronLeft size={18} /></button><span>หน้า {page} / {pages}</span><button disabled={page >= pages} onClick={() => setParams({ filter: unreadOnly ? 'unread' : 'all', page: String(page + 1) })} aria-label="หน้าถัดไป"><ChevronRight size={18} /></button></nav>}
    </>}
  </main>;
}
