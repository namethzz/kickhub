import { fieldHours, fieldAddress, hasFieldPrice } from './field-display';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Clock, ArrowUpRight, Flag, SlidersHorizontal } from 'lucide-react';
import { api, type LiveField } from '@/lib/api';
import { ApiError } from '../live/LiveParties';
import FieldPhoto from './FieldPhoto';
import './fields.css';
export default function LiveFields() {
  const [fields, setFields] = useState<LiveField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('newest');
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    api<LiveField[]>('/api/v2/fields').then(data => { if (active) setFields(data); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  const results = fields.filter(field => `${field.field_name} ${fieldAddress(field)}`.toLowerCase().includes(query.trim().toLowerCase()) && (!type || field.field_type === type));
  if (sort !== 'newest') results.sort((a, b) => a.price == null ? (b.price == null ? 0 : 1) : b.price == null ? -1 : sort === 'low' ? a.price - b.price : b.price - a.price);
  return <main className="party-app fields-page">
    <section className="fields-hero">
      <img className="fields-hero-image" src={`${import.meta.env.BASE_URL}owner-stadium.jpg`} alt="" />
      <div className="fields-hero-copy"><span className="party-kicker">FIND YOUR HOME GROUND</span><h1>สนามที่ใช่<br /><span>เกมถัดไปเริ่มที่นี่.</span></h1><p>ค้นหาสนามใกล้คุณ เลือกบรรยากาศที่ชอบ แล้วชวนเพื่อนมาเตะด้วยกัน</p><a className="kh-button kh-primary" href="#field-results">ค้นหาสนาม <ArrowUpRight size={18} /></a></div>
      <div className="fields-hero-note"><MapPin size={18} /><span>สนามฟุตบอล · ฟุตซอล · หญ้าเทียม</span></div>
    </section>
    <section className="fields-content" id="field-results" aria-label="ค้นหาและเลือกสนาม">
    <div className="fields-toolbar">
      <label className="party-search"><Search size={20} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="ค้นหาชื่อสนาม ที่อยู่ หรือย่าน…" aria-label="ค้นหาสนาม" /></label>
      <div className="fields-filters"><label><span><SlidersHorizontal size={14} />ประเภทสนาม</span><select value={type} onChange={event => setType(event.target.value)}><option value="">ทุกประเภท</option>{[...new Set(fields.map(field => field.field_type))].filter(Boolean).map(value => <option key={value} value={value}>{value}</option>)}</select></label><label><span>เรียงตาม</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">เพิ่มล่าสุด</option><option value="low">ราคาน้อยไปมาก</option><option value="high">ราคามากไปน้อย</option></select></label></div>
    </div>
    {loading ? <p role="status" className="player-caption">กำลังค้นหาสนาม…</p> : error ? <ApiError message={error} retry={() => setReload(value => value + 1)} /> : <>
      <div className="party-results-heading"><h2>สนามที่เปิดรับ</h2><span>{results.length} สนาม</span></div>
      <div className="fields-grid">{results.map(field => <article className="fields-card" key={field._id}>
        <Link className="fields-photo" to={`/fields/${field._id}`} aria-label={`ดูสนาม ${field.field_name}`}><FieldPhoto src={field.image} name={field.field_name} /><span className="party-pill">{field.field_type}</span>{!field.image && <span className="fields-image-note">ภาพประกอบ</span>}</Link>
        <div className="fields-card-content"><h2><Link to={`/fields/${field._id}`}>{field.field_name}</Link></h2><div className="fields-card-facts"><p className="party-location"><MapPin size={17} /><span>{fieldAddress(field)}</span></p><p className="fields-hours"><Clock size={17} /><span>{fieldHours(field)}</span></p></div>
        <div className="fields-card-price"><span>ราคาใช้สนาม</span><strong>{hasFieldPrice(field) ? <>฿{field.price!.toLocaleString('th-TH')}<small> / ชั่วโมง</small></> : 'สอบถามราคากับสนาม'}</strong>{field.price_note && <p>{field.price_note}</p>}</div>
        <Link className="kh-button kh-dark fields-card-link" to={`/fields/${field._id}`}>ดูรายละเอียดสนาม <ArrowUpRight size={17} /></Link></div>
      </article>)}</div>
      {!results.length && <div className="party-empty"><Flag /><h3>{fields.length ? 'ยังไม่พบสนามที่ตรงใจ' : 'ยังไม่มีสนามเปิดรับ'}</h3><p>{fields.length ? 'ลองเปลี่ยนคำค้นหาหรือเลือกทุกประเภท' : 'สนามที่เจ้าของเปิดรับจะแสดงที่นี่'}</p>{fields.length ? <button className="kh-button kh-dark" onClick={() => { setQuery(''); setType(''); }}>ล้างตัวกรอง</button> : <Link className="kh-button kh-dark" to="/Owner">สำหรับเจ้าของสนาม</Link>}</div>}
    </>}
    <p className="fields-caption">ราคาและเวลาอาจแตกต่างตามขนาดสนามและช่วงเวลา กรุณาติดต่อสนามเพื่อยืนยันก่อนจอง</p>
    </section>
  </main>;
}
