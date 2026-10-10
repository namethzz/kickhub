import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, MapPin, Clock, Search, Calendar, Users, ShieldCheck, Goal } from 'lucide-react';
import { api, type DiscoveryFeed, type DiscoveryParty, type LiveField } from '@/lib/api';
import { ParallaxComponent } from '@/components/ui/parallax-scrolling';
import FieldPhoto from '@/features/fields/FieldPhoto';
import { modeInfo } from '@/features/parties/party-model';
import './home-live.css';

const formatDate = (value: string) => new Date(value).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
const formatTime = (value: string) => new Date(value).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
const money = (value: number) => value.toLocaleString('th-TH');

function PartyCard({ party }: { party: DiscoveryParty }) {
  const available = Math.max(0, party.capacity - party.player_count);
  return <article className={`kh-match-card kh-tone-${party.mode === 'fixed' ? 'purple' : 'green'}`}>
    <div className="kh-card-top"><span className="kh-tag">{modeInfo[party.mode].title}</span><span className="kh-format">{party.access === 'approval' ? <ShieldCheck size={15} /> : <Users size={15} />}{party.access === 'approval' ? 'หัวตี้อนุมัติ' : 'เปิดรับทุกคน'}</span></div>
    <h3>{party.party_name}</h3><p className="kh-card-place"><MapPin size={15} />{party.field_name}</p><p className="kh-card-area">{party.address}</p>
    <div className="kh-match-time"><span><Calendar size={15} />{formatDate(party.start_datetime)}</span><strong>{formatTime(party.start_datetime)}–{formatTime(party.end_datetime)}</strong></div>
    <div className="kh-player-row"><Users size={24} /><div><strong>{available ? `ว่างอีก ${available} คน` : 'ผู้เล่นครบแล้ว'}</strong><small>{party.player_count}/{party.capacity} คนเข้าร่วม</small></div></div>
    <div className="kh-progress" role="meter" aria-label="จำนวนผู้เล่น" aria-valuenow={party.player_count} aria-valuemin={0} aria-valuemax={party.capacity}><span style={{ width: `${Math.min(100, party.player_count / party.capacity * 100)}%` }} /></div>
    <div className="kh-card-footer"><p><strong>฿{money(party.price)}</strong><small> / คน</small></p><Link className="kh-card-button" to={`/parties/${party._id}`}>ดูปาร์ตี้ <ArrowUpRight size={16} /></Link></div>
  </article>;
}
function FieldCard({ field }: { field: LiveField }) {
  return <article className="kh-field-card"><Link className="kh-field-image kh-live-field-photo" to={`/fields/${field._id}`} aria-label={`ดูสนาม ${field.field_name}`}><FieldPhoto src={field.image} name={field.field_name} /><span>{field.field_type}</span></Link><div className="kh-field-body"><h3>{field.field_name}</h3><p className="kh-card-place"><MapPin size={15} />{field.address}</p><p className="kh-card-place"><Clock size={15} />{field.open}–{field.close}</p><div className="kh-card-footer"><p><strong>฿{money(field.price)}</strong><small> / ชม.</small></p><Link className="kh-card-button" to={`/fields/${field._id}`}>ดูสนาม <ArrowUpRight size={16} /></Link></div></div></article>;
}
export default function Home() {
  const section = useRef<HTMLElement>(null);
  const [kind, setKind] = useState<'parties' | 'fields'>('parties');
  const [mode, setMode] = useState('all');
  const [query, setQuery] = useState('');
  const [feed, setFeed] = useState<DiscoveryFeed>({ fields: [], parties: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api<DiscoveryFeed>('/api/v2/discover').then(data => { if (active) setFeed(data); }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  const term = query.trim().toLowerCase();
  const parties = feed.parties.filter(party => (mode === 'all' || party.mode === mode) && `${party.party_name} ${party.field_name} ${party.address}`.toLowerCase().includes(term));
  const fields = feed.fields.filter(field => `${field.field_name} ${field.address}`.toLowerCase().includes(term));
  const count = kind === 'parties' ? parties.length : fields.length;
  const filtered = Boolean(term || (kind === 'parties' && mode !== 'all'));
  return <main className="kh-main kh-main--home">
    <ParallaxComponent targetRef={section} />
    <div className="kh-how"><span><b>01</b> หาเกมที่ใช่</span><i /><span><b>02</b> เลือกโหมดและทีม</span><i /><span><b>03</b> เจอกันที่สนาม <Goal /></span></div>
    <section ref={section} className="kh-discovery" aria-labelledby="discovery-title">
      <div className="kh-section-heading"><div><span className="kh-eyebrow">GOOD GAMES. GREAT COMPANY.</span><h2 id="discovery-title">{kind === 'parties' ? 'หาเพื่อน ลงสนาม' : 'สนามสำหรับเกมถัดไป'}{!loading && !error && <span className="kh-count">{count}</span>}</h2></div><Link className="kh-button kh-primary" to="/create-party">สร้างปาร์ตี้ <ArrowUpRight size={17} /></Link></div>
      <div className="kh-home-tabs" role="group" aria-label="เลือกรายการ"><button aria-pressed={kind === 'parties'} className={kind === 'parties' ? 'active' : ''} onClick={() => setKind('parties')}><Users size={19} />ค้นหาปาร์ตี้</button><button aria-pressed={kind === 'fields'} className={kind === 'fields' ? 'active' : ''} onClick={() => setKind('fields')}><Goal size={19} />ค้นหาสนาม</button></div>
      <form className="kh-searchbar" onSubmit={event => { event.preventDefault(); section.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }}><label className="kh-search-input"><Search size={20} /><input aria-label="ค้นหาปาร์ตี้ สนาม หรือพื้นที่" value={query} onChange={event => setQuery(event.target.value)} placeholder={kind === 'fields' ? 'ชื่อสนาม ที่อยู่ หรือย่าน…' : 'ชื่อปาร์ตี้ สนาม หรือย่าน…'} /></label><button className="kh-button kh-dark" type="submit">ค้นหา <ArrowRight size={17} /></button></form>
      {kind === 'parties' && <div className="kh-filters"><span>โหมดปาร์ตี้</span><div className="kh-filter-chips">{[['all', 'ทุกโหมด'], ['flexible', 'บุฟเฟต์'], ['fixed', 'ล็อคตำแหน่ง']].map(([value, label]) => <button key={value} aria-pressed={mode === value} className={mode === value ? 'active' : ''} onClick={() => setMode(value)}>{label}</button>)}</div></div>}
      {loading ? <div className="kh-empty" role="status"><p>กำลังค้นหาเกมถัดไปของคุณ…</p></div> : error ? <div className="kh-empty"><h3>ยังโหลดรายการไม่ได้</h3><p role="alert">{error}</p><button className="kh-button kh-dark" onClick={() => setReload(value => value + 1)}>ลองใหม่</button></div> : <><div className="kh-card-grid">{kind === 'parties' ? parties.map(party => <PartyCard key={party._id} party={party} />) : fields.map(field => <FieldCard key={field._id} field={field} />)}</div>{!count && <div className="kh-empty"><Search size={28} /><h3>{filtered ? 'ยังไม่พบรายการที่ตรงใจ' : kind === 'parties' ? 'เกมถัดไป เริ่มจากคุณ' : 'ยังไม่มีสนามเปิดรับ'}</h3><p>{filtered ? 'ลองเปลี่ยนคำค้นหาหรือเลือกทุกโหมด' : kind === 'parties' ? 'เลือกสนามและสร้างปาร์ตี้ ให้เพื่อนใหม่มาร่วมทีม' : 'สนามที่เจ้าของเปิดใช้งานจะแสดงที่นี่'}</p>{filtered ? <button className="kh-button kh-dark" onClick={() => { setQuery(''); setMode('all'); }}>ล้างตัวกรอง</button> : <Link className="kh-button kh-primary" to={kind === 'parties' ? '/create-party' : '/Owner'}>{kind === 'parties' ? 'สร้างปาร์ตี้แรก' : 'สำหรับเจ้าของสนาม'}</Link>}</div>}</>}
      <p className="kh-data-caption">{kind === 'parties' ? 'แสดงปาร์ตี้ที่ยังไม่เริ่มเกม เข้าสู่ระบบเพื่อเข้าร่วมหรือส่งคำขอให้หัวตี้' : 'ราคาสนามต่อชั่วโมง กรุณายืนยันเรทและการจองกับเจ้าของสนาม'}</p>
    </section>
    <section className="kh-owner-banner"><div className="kh-owner-symbol"><Goal /></div><div><span className="kh-eyebrow">FOR FIELD OWNERS</span><h2>สนามของคุณ ทีมใหม่ของพวกเขา</h2><p>เพิ่มสนาม จัดการรายละเอียด และเปิดให้ผู้เล่นค้นพบ</p></div><Link className="kh-button kh-dark" to="/Owner">ไปจัดการสนาม <ArrowUpRight size={17} /></Link></section>
    <footer className="kh-footer"><Link to="/home" className="kh-footer-brand">kickhub<span>®</span></Link><p>เจอเพื่อนใหม่ ในเกมที่คุณรัก</p><Link to="/Owner">พื้นที่เจ้าของสนาม <ArrowUpRight size={16} /></Link></footer>
  </main>;
}
