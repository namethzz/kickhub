import { NavLink, Link } from 'react-router-dom';
import { FiHome, FiUsers, FiMapPin, FiArrowUpRight, FiUser } from 'react-icons/fi';
import { TbBallFootball } from 'react-icons/tb';
const items = [
  { name: 'หน้าหลัก', icon: FiHome, path: '/home' },
  { name: 'หาเพื่อนเตะบอล', icon: FiUsers, path: '/team' },
  { name: 'ค้นหาสนาม', icon: FiMapPin, path: '/field' },
];
export default function Navbar() {
  return <>
    <header className="kh-header">
      <div className="kh-header-inner">
        <Link to="/home" className="kh-brand" aria-label="Kickhub หน้าหลัก"><span className="kh-brand-icon"><TbBallFootball /></span>kick<span>hub</span><i /></Link>
        <nav className="kh-desktop-nav" aria-label="เมนูหลัก">{items.map(item => <NavLink key={item.path} to={item.path}>{item.name}</NavLink>)}</nav>
        <div className="kh-header-actions"><Link className="kh-owner-link" to="/Owner">สำหรับเจ้าของสนาม <FiArrowUpRight /></Link><Link className="kh-login" to="/login"><FiUser /><span>เข้าสู่ระบบ</span></Link></div>
      </div>
    </header>
    <nav className="kh-mobile-nav" aria-label="เมนูมือถือ">
      {items.map(({ icon: Icon, ...item }) => <NavLink key={item.path} to={item.path}><Icon /><span>{item.name}</span></NavLink>)}
      <NavLink to="/login"><FiUser /><span>บัญชีของฉัน</span></NavLink>
    </nav>
  </>;
}
