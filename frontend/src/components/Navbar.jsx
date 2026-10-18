import { NavLink, Link } from 'react-router-dom';
import { FiHome, FiUsers, FiMapPin, FiArrowUpRight, FiUser, FiPlus, FiCalendar } from 'react-icons/fi';
import BrandMark from './BrandMark';
import NotificationBell from '../features/live/NotificationBell';
import ThemeToggle from './ThemeToggle';
import useSoftKeyboardOpen from './useSoftKeyboardOpen';
import useMyPartyCounts, { upcomingTotal } from './useMyPartyCounts';
import './my-parties-entry.css';
const items = [
  { name: 'หน้าหลัก', icon: FiHome, path: '/home' },
  { name: 'ค้นหาปาร์ตี้', icon: FiUsers, path: '/team' },
  { name: 'สร้างปาร์ตี้', icon: FiPlus, path: '/create-party' },
  { name: 'ค้นหาสนาม', icon: FiMapPin, path: '/field' },
];
const myParties = { name: 'ปาร์ตี้ของฉัน', short: 'ตี้ของฉัน', icon: FiCalendar, path: '/my-parties' };
export default function Navbar() {
  const keyboardOpen = useSoftKeyboardOpen();
  const total = upcomingTotal(useMyPartyCounts());
  // The visible badge is decorative; the link's accessible name carries the count.
  const badge = total > 0 && <b className="kh-nav-badge" aria-hidden="true">{total > 99 ? '99+' : total}</b>;
  const mineLabel = total > 0 ? `${myParties.name} · ${total} นัดที่กำลังจะมาถึง` : myParties.name;
  const MineIcon = myParties.icon;
  return <>
    <header className="kh-header">
      <div className="kh-header-inner">
        <Link to="/home" className="kh-brand" aria-label="Kickhub หน้าหลัก"><BrandMark /></Link>
        <nav className="kh-desktop-nav" aria-label="เมนูหลัก">{items.map(item => <NavLink key={item.path} to={item.path}>{item.name}</NavLink>)}</nav>
        <div className="kh-header-actions">
          <NavLink className="kh-nav-mine" to={myParties.path} aria-label={mineLabel} title={myParties.name}>
            <MineIcon aria-hidden="true" />
            <span className="kh-nav-label kh-nav-label--full" aria-hidden="true">{myParties.name}</span>
            <span className="kh-nav-label kh-nav-label--short" aria-hidden="true">{myParties.short}</span>
            {badge}
          </NavLink>
          <ThemeToggle /><NotificationBell /><Link className="kh-owner-link" to="/Owner">สำหรับเจ้าของสนาม <FiArrowUpRight /></Link><Link className="kh-login" to="/profile" aria-label="บัญชีของฉัน"><FiUser /><span>บัญชีของฉัน</span></Link>
        </div>
      </div>
    </header>
    <nav className="kh-mobile-nav" aria-label="เมนูมือถือ" hidden={keyboardOpen}>
      {[items[0], items[1], items[2], null, items[3]].map(item => {
        if (!item) return <NavLink key={myParties.path} className="kh-nav-mine" to={myParties.path} aria-label={mineLabel}><span className="kh-nav-icon"><MineIcon aria-hidden="true" />{badge}</span><span className="kh-nav-text" aria-hidden="true">{myParties.name}</span></NavLink>;
        const Icon = item.icon;
        return <NavLink key={item.path} className={item.path === '/create-party' ? 'kh-nav-create' : undefined} to={item.path}><span className="kh-nav-icon"><Icon aria-hidden="true" /></span><span className="kh-nav-text">{item.name}</span></NavLink>;
      })}
    </nav>
  </>;
}
