import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { notificationChanged, type NotificationFeed } from './notifications-api';
import './notifications.css';
export default function NotificationBell() {
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let active = true;
    let running = false;
    let queued = false;
    async function refresh() {
      if (document.visibilityState !== 'visible') return;
      if (running) { queued = true; return; }
      if (!localStorage.getItem('token')) { setUnread(0); return; }
      running = true;
      try { const data = await api<NotificationFeed>('/api/v2/notifications'); if (active) setUnread(data.unread); }
      catch { if (active) setUnread(0); }
      finally { running = false; if (queued && active) { queued = false; void refresh(); } }
    }
    refresh();
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener(notificationChanged, refresh);
    return () => { active = false; clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener(notificationChanged, refresh); };
  }, [location.pathname]);
  return <Link to="/notifications" className="kh-notification-bell" aria-label={`แจ้งเตือน${unread ? ` ยังไม่อ่าน ${unread} รายการ` : ''}`}><Bell size={20} />{unread > 0 && <span aria-hidden="true">{unread > 99 ? '99+' : unread}</span>}</Link>;
}
