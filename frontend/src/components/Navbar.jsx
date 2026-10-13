import { NavLink, Link } from 'react-router-dom';
import { FiHome, FiUsers, FiMapPin, FiArrowUpRight, FiUser, FiPlusCircle, FiCalendar } from 'react-icons/fi';
import BrandMark from './BrandMark';
import NotificationBell from '../features/live/NotificationBell';
import ThemeToggle from './ThemeToggle';
import useSoftKeyboardOpen from './useSoftKeyboardOpen';
import useMyPartyCounts, { upcomingTotal } from './useMyPartyCounts';
import './my-parties-entry.css';
const items = [
  { name: 'หน้าหลัก', icon: FiHome, path: '/home' },
  { name: 'ค้นหาปาร์ตี้', icon: FiUsers, path: '/team' },
  { name: 'สร้างปาร์ตี้', icon: FiPlusCircle, path: '/create-party' },
  { name: 'ค้นหาสนาม', icon: FiMapPin, path: '/field' },
];
const myParties = { name: 'ปาร์ตี้ของฉัน', short: 'ตี้ของฉัน', icon: FiCalendar, path: '/my-parties' };
export default function Navbar() {
  const keyboardOpen = useSoftKeyboardOpen();
  const total = upcomingTotal(useMyPartyCounts());
  const badge = total > 0 && <b className="kh-nav-badge" aria-label={`${total} นัดที่กำลังจะมาถึง`}>{total > 99 ? '99+' : total}</b>;
  const MineIcon = myParties.icon;
  return <>
    <header className="kh-header">
      <div className="kh-header-inner">
        <Link to="/home" className="kh-brand" aria-label="Kickhub หน้าหลัก"><BrandMark />kick<span>hub</span><i /></Link>
        <nav className="kh-desktop-nav" aria-label="เมนูหลัก">
          {items.map(item => <NavLink key={item.path} to={item.path}>{item.name}</NavLink>)}
          <NavLink className="kh-nav-mine" to={myParties.path}><MineIcon aria-hidden="true" />{myParties.name}{badge}</NavLink>
        </nav>
        <div className="kh-header-actions"><ThemeToggle /><NotificationBell /><Link className="kh-owner-link" to="/Owner">สำหรับเจ้าของสนาม <FiArrowUpRight /></Link><Link className="kh-login" to="/profile"><FiUser /><span>บัญชีของฉัน</span></Link></div>
      </div>
    </header>
    <nav className="kh-mobile-nav" aria-label="เมนูมือถือ" hidden={keyboardOpen}>
      {items.slice(0, 3).map(({ icon: Icon, ...item }) => <NavLink key={item.path} to={item.path}><Icon /><span>{item.name}</span></NavLink>)}
      <NavLink className="kh-nav-mine" to={myParties.path} aria-label={myParties.name}><span className="kh-nav-icon"><MineIcon aria-hidden="true" />{badge}</span><span>{myParties.short}</span></NavLink>
      {items.slice(3).map(({ icon: Icon, ...item }) => <NavLink key={item.path} to={item.path}><Icon /><span>{item.name}</span></NavLink>)}
      <NavLink to="/profile"><FiUser /><span>โปรไฟล์</span></NavLink>
    </nav>
  </>;
}
