import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Phone, ArrowUpRight, Users, Plus, CircleCheck } from 'lucide-react';
import { api, type FieldDetail } from '@/lib/api';
import { ApiError } from '../live/LiveParties';
import FieldPhoto, { safeWebLink, facilityLabels } from './FieldPhoto';
import './fields.css';
export default function LiveFieldDetail() {
  const { fieldId } = useParams();
  const [field, setField] = useState<FieldDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setField(null);
    api<FieldDetail>(`/api/v2/fields/${fieldId}`).then(data => { if (active) setField(data); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fieldId, reload]);
  if (loading) return <main className="party-app"><p role="status">กำลังโหลดรายละเอียดสนาม…</p></main>;
  if (!field) return <main className="party-app"><Link className="party-back" to="/field">← กลับไปค้นหาสนาม</Link><ApiError message={error} retry={() => setReload(value => value + 1)} /></main>;
  const map = safeWebLink(field.google_map);
  const phone = field.mobile_number.replace(/[^\d+]/g, '');
  const facilities = facilityLabels(field.facilities);
  const fieldQuery = `field=${encodeURIComponent(field._id)}`;
  return <main className="party-app field-detail-page"><Link className="party-back" to="/field"><ArrowLeft size={18} />ค้นหาสนาม</Link>
    <div className="field-detail-photo"><FieldPhoto src={field.image} name={field.field_name} /><span className="party-pill">{field.field_type}</span></div>
    <div className="field-detail-layout"><div><section className="field-detail-intro"><span className="party-kicker">YOUR NEXT GAME STARTS HERE</span><h1>{field.field_name}</h1><p className="party-location"><MapPin size={17} />{field.address}</p><div className="field-detail-hours"><Clock size={19} /><div><strong>{field.open}–{field.close}</strong><small>เวลาเปิด–ปิดที่เจ้าของสนามระบุ</small></div></div></section>
      <section className="party-form-section"><h2>เกี่ยวกับสนาม</h2><p className="field-description">{field.description || 'เจ้าของสนามยังไม่ได้เพิ่มรายละเอียด ติดต่อสอบถามก่อนเดินทางได้เลย'}</p>{facilities.length > 0 && <><h3>สิ่งอำนวยความสะดวก</h3><div className="field-facilities">{facilities.map(item => <span key={item}><CircleCheck size={15} />{item}</span>)}</div></>}</section>
      <section className="party-form-section"><h2>เดินทางและติดต่อ</h2><p className="field-description">{field.address}</p><div className="field-contact-actions">{map && <a className="kh-button party-secondary" href={map} target="_blank" rel="noreferrer"><MapPin size={17} />เปิดแผนที่ <ArrowUpRight size={15} /></a>}{phone && <a className="kh-button party-secondary" href={`tel:${phone}`}><Phone size={17} />{field.mobile_number}</a>}</div><Link className="party-back" to={`/players/${field.owner_id}`} state={{ from: `/fields/${field._id}` }}>ดูโปรไฟล์เจ้าของสนาม →</Link></section>
    </div><aside className="field-game-card"><span className="party-kicker">LET'S PLAY TOGETHER</span><div className="field-price"><strong>฿{field.price.toLocaleString('th-TH')}</strong><span>/ ชั่วโมง</span></div><p>หาเพื่อนที่เลือกสนามนี้ หรือเปิดปาร์ตี้ใหม่แล้วแบ่งค่าใช้จ่ายกัน</p><Link className="kh-button kh-primary kh-full" to={`/create-party?${fieldQuery}`}><Plus size={18} />สร้างปาร์ตี้ที่สนามนี้</Link><Link className="kh-button kh-dark kh-full" to={`/team?${fieldQuery}`}><Users size={18} />ค้นหาปาร์ตี้ที่สนามนี้</Link><small>สร้างปาร์ตี้ยังไม่ถือเป็นการจองสนาม กรุณาติดต่อเจ้าของเพื่อยืนยันเวลาและค่าใช้จ่าย</small></aside></div>
  </main>;
}
