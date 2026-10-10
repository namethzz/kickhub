import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiArrowRight, FiArrowUpRight, FiMapPin, FiClock, FiSearch, FiX, FiCheck, FiSliders, FiCalendar } from 'react-icons/fi';
import { TbBallFootball, TbSoccerField } from 'react-icons/tb';
import { matches, fields } from '../data/discovery';
import { ParallaxComponent } from '@/components/ui/parallax-scrolling';

function DetailDialog({ item, kind, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  const isMatch = kind === 'matches';
  return <dialog data-lenis-prevent ref={dialog} className="kh-dialog" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }} aria-labelledby="detail-title">
    <div className="kh-dialog-head"><span className="kh-eyebrow">{isMatch ? 'MATCH DETAILS' : 'FIELD DETAILS'}</span><button className="kh-icon-button" onClick={onClose} aria-label="ปิดรายละเอียด"><FiX /></button></div>
    <span className="kh-demo-label">ตัวอย่างสำหรับทดลองหน้าตา</span>
    <h2 id="detail-title">{isMatch ? item.title : item.name}</h2>
    <p className="kh-muted"><FiMapPin /> {isMatch ? `${item.field} · ` : ''}{item.area}</p>
    {!isMatch && <img className="kh-dialog-image" src={item.image} alt="ภาพสนามตัวอย่าง" />}
    <div className="kh-detail-grid"><div><small>{isMatch ? 'วันและเวลา' : 'เปิดให้บริการ'}</small><strong>{isMatch ? `${item.day} ${item.time}` : item.hours}</strong></div><div><small>{isMatch ? 'ค่าใช้จ่ายต่อคน' : 'ราคาต่อชั่วโมง'}</small><strong>฿{item.price.toLocaleString('th-TH')}</strong></div><div><small>{isMatch ? 'จำนวนผู้เล่น' : 'ประเภทสนาม'}</small><strong>{isMatch ? `${item.players} / ${item.capacity} คน` : item.type}</strong></div><div><small>{isMatch ? 'ระดับการเล่น' : 'สิ่งอำนวยความสะดวก'}</small><strong>{isMatch ? item.level : item.features.join(' · ')}</strong></div></div>
    {isMatch && <><h3>เกี่ยวกับนัดนี้</h3><p>{item.description}</p><p className="kh-muted">ตำแหน่งที่เปิดรับ: {item.positions}</p></>}
    <div className="kh-demo-note">ข้อมูลนี้เป็นตัวอย่าง ยังไม่เปิด{isMatch ? 'เข้าร่วมแมตช์' : 'จองสนาม'}จริง ไม่มีการเรียกเก็บเงิน</div>
    <button className="kh-button kh-primary kh-full" onClick={onClose}>กลับไปเลือก{isMatch ? 'แมตช์' : 'สนาม'} <FiArrowRight /></button>
  </dialog>;
}
function MatchCard({ match, onSelect }) {
  const free = match.capacity - match.players;
  return <article className={`kh-match-card kh-tone-${match.tone}`}>
    <div className="kh-card-top"><span className="kh-tag">{match.tag}</span><span className="kh-format"><TbBallFootball /> {match.format}</span></div>
    <h3>{match.title}</h3><p className="kh-card-place"><FiMapPin /> {match.field}</p><p className="kh-card-area">{match.area}</p>
    <div className="kh-match-time"><span><FiCalendar />{match.day}</span><strong>{match.time}</strong></div>
    <div className="kh-match-meta"><span>{match.level}</span><span>{match.positions}</span></div>
    <div className="kh-player-row"><div className="kh-avatars"><span>{match.initials}</span><span>K</span><span>P</span></div><div><strong>ขาดอีก {free} คน</strong><small>{match.players}/{match.capacity} คนเข้าร่วม</small></div></div>
    <div className="kh-progress" role="meter" aria-label="จำนวนผู้เล่น" aria-valuenow={match.players} aria-valuemin={0} aria-valuemax={match.capacity}><span style={{ width: `${match.players / match.capacity * 100}%` }} /></div>
    <div className="kh-card-footer"><p><strong>฿{match.price}</strong><small> / คน</small></p><button className="kh-card-button" onClick={() => onSelect(match)}>ดูแมตช์ <FiArrowUpRight /></button></div>
  </article>;
}
function FieldCard({ field, onSelect }) {
  return <article className="kh-field-card"><div className="kh-field-image"><img src={field.image} alt={`ภาพประกอบสนาม ${field.name}`} loading="lazy" /><span>{field.type}</span></div><div className="kh-field-body"><h3>{field.name}</h3><p className="kh-card-place"><FiMapPin />{field.area}</p><p className="kh-card-place"><FiClock />{field.hours}</p><div className="kh-facilities">{field.features.map(feature => <span key={feature}><FiCheck />{feature}</span>)}</div><div className="kh-card-footer"><p><strong>฿{field.price.toLocaleString('th-TH')}</strong><small> / ชม.</small></p><button className="kh-card-button" onClick={() => onSelect(field)}>ดูสนาม <FiArrowUpRight /></button></div></div></article>;
}
export default function Home() {
  const location = useLocation();
  const kind = location.pathname === '/field' ? 'fields' : 'matches';
  const isHome = location.pathname === '/home' || location.pathname === '/';
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('ทั้งหมด');
  const [level, setLevel] = useState('ทั้งหมด');
  const [day, setDay] = useState('ทั้งหมด');
  const [selected, setSelected] = useState(null);
  const section = useRef(null);
  useEffect(() => { setSelected(null); }, [location.pathname]);
  const collection = kind === 'fields' ? fields : matches;
  const filtered = collection.filter(item => {
    const text = `${item.title || item.name} ${item.field || ''} ${item.area}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (area === 'ทั้งหมด' || item.area.includes(area)) && (kind === 'fields' || ((level === 'ทั้งหมด' || item.level === level) && (day === 'ทั้งหมด' || item.day === day)));
  });
  const reset = () => { setQuery(''); setArea('ทั้งหมด'); setLevel('ทั้งหมด'); setDay('ทั้งหมด'); };
  return <main className="kh-main">
    {isHome ? <ParallaxComponent targetRef={section} /> : <section className="kh-page-heading"><span className="kh-eyebrow">{kind === 'fields' ? 'FIND YOUR PITCH' : 'FIND YOUR PEOPLE'}</span><h1>{kind === 'fields' ? 'สนามที่ใช่ สำหรับเกมของคุณ' : 'มาเดี่ยว กลับไปมีทีม'}</h1><p>เลือก{kind === 'fields' ? 'สนามจากพื้นที่และสิ่งอำนวยความสะดวก' : 'นัดเตะจากพื้นที่ เวลา และระดับที่เหมาะกับคุณ'}</p></section>}
    {isHome && <div className="kh-how"><span><b>01</b> หาแมตช์ที่ใช่</span><i /><span><b>02</b> รู้เวลาและค่าใช้จ่าย</span><i /><span><b>03</b> นัดเจอกันที่สนาม <TbBallFootball /></span></div>}
    <section ref={section} className="kh-discovery" aria-labelledby="discovery-title"><div className="kh-section-heading"><div><span className="kh-eyebrow">{kind === 'fields' ? 'THE RIGHT PLACE TO PLAY' : 'GOOD GAMES. GREAT COMPANY.'}</span><h2 id="discovery-title">{kind === 'fields' ? 'ค้นหาสนามฟุตบอล' : 'เลือกแมตช์ แล้วไปเตะกัน'} <span className="kh-count">{filtered.length}</span></h2></div><span className="kh-demo-label">ข้อมูลตัวอย่าง · Preview</span></div>
      <form className="kh-searchbar" onSubmit={e => { e.preventDefault(); section.current.scrollIntoView({ behavior: 'smooth' }); }}><label className="kh-search-input"><FiSearch /><input aria-label="ค้นหาชื่อแมตช์ สนาม หรือพื้นที่" value={query} onChange={e => setQuery(e.target.value)} placeholder={kind === 'fields' ? 'ค้นหาชื่อสนาม หรือพื้นที่…' : 'ค้นหาชื่อแมตช์ สนาม หรือพื้นที่…'} /></label><label className="kh-area-select"><FiMapPin /><select aria-label="พื้นที่" value={area} onChange={e => setArea(e.target.value)}><option value="ทั้งหมด">ทุกพื้นที่</option><option>กรุงเทพฯ</option><option>ปทุมธานี</option></select></label><button className="kh-button kh-dark" type="submit">ค้นหา <FiArrowRight /></button></form>
      {kind === 'matches' && <div className="kh-filters"><span><FiSliders /> ระดับการเล่น</span><div className="kh-filter-chips">{['ทั้งหมด', 'ทุกระดับ', 'มีประสบการณ์'].map(value => <button aria-pressed={level === value} className={level === value ? 'active' : ''} key={value} onClick={() => setLevel(value)}>{value === 'ทุกระดับ' ? 'มือใหม่ก็เล่นได้' : value}</button>)}</div><label className="kh-day-select"><FiCalendar /><select aria-label="วันเตะบอล" value={day} onChange={e => setDay(e.target.value)}><option value="ทั้งหมด">ทุกวัน</option><option>เสาร์</option><option>อาทิตย์</option></select></label></div>}
      <div className="kh-card-grid">{filtered.map(item => kind === 'fields' ? <FieldCard key={item.id} field={item} onSelect={setSelected} /> : <MatchCard key={item.id} match={item} onSelect={setSelected} />)}</div>
      {filtered.length === 0 && <div className="kh-empty"><FiSearch /><h3>ยังไม่พบ{kind === 'fields' ? 'สนาม' : 'แมตช์'}ที่ตรงกับตัวกรอง</h3><p>ลองเปลี่ยนพื้นที่หรือคำค้นหา เพื่อดูตัวเลือกเพิ่มเติม</p><button className="kh-button kh-dark" onClick={reset}>ล้างตัวกรอง</button></div>}
      <p className="kh-data-caption">รายการ ราคา และช่วงเวลาในหน้านี้เป็นข้อมูลสาธิตสำหรับรีวิว UI ยังไม่ใช่รายการที่เปิดรับจริง</p>
    </section>
    {isHome && <section className="kh-owner-banner"><div className="kh-owner-symbol"><TbSoccerField /></div><div><span className="kh-eyebrow">FOR FIELD OWNERS</span><h2>สนามของคุณ ทีมใหม่ของพวกเขา</h2><p>จัดการข้อมูลสนามและนัดหมายในพื้นที่สำหรับเจ้าของสนาม</p></div><Link className="kh-button kh-dark" to="/Owner">ไปจัดการสนาม <FiArrowUpRight /></Link></section>}
    <footer className="kh-footer"><Link to="/home" className="kh-footer-brand">kickhub<span>®</span></Link><p>เจอเพื่อนใหม่ ในเกมที่คุณรัก</p><Link to="/Owner">พื้นที่เจ้าของสนาม <FiArrowUpRight /></Link></footer>
    {selected && <DetailDialog key={selected.id} item={selected} kind={kind} onClose={() => setSelected(null)} />}
  </main>;
}
