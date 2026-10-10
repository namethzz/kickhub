import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Clock, Search, ArrowLeft, Pencil, CircleCheck, Pause, Flag } from 'lucide-react';
import { api, type PublicPlayer } from '@/lib/api';
import { ApiError } from '../live/LiveParties';
import './owner.css';

type Field = {
  _id: string; field_name: string; field_type: string; address: string; mobile_number: string;
  price: number; open: string; close: string; google_map: string; image?: string;
  facilities?: string[] | Record<string, boolean>; description?: string; is_active: boolean;
};
type Draft = Omit<Field, '_id' | 'price' | 'facilities'> & { price: string; facilities: string[] };
const amenities = ['ไฟส่องสว่าง', 'ที่จอดรถ', 'ห้องน้ำ', 'ร้านค้า', 'Wi-Fi ฟรี', 'ห้องเปลี่ยนเสื้อผ้า'];
const oldAmenities: Record<string, string> = { lights: 'ไฟส่องสว่าง', parking: 'ที่จอดรถ', restroom: 'ห้องน้ำ', shop: 'ร้านค้า', wifi: 'Wi-Fi ฟรี' };
const blank = (): Draft => ({ field_name: '', field_type: 'หญ้าเทียม', address: '', mobile_number: '', price: '', open: '09:00', close: '23:00', google_map: '', image: '', description: '', facilities: [], is_active: true });
function FieldImage({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const usable = src && /^https?:\/\//.test(src) && !failed;
  return usable ? <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} /> : <div className="owner-image-empty"><Flag size={36} /><span>สนามของคุณ</span></div>;
}
export default function OwnerDashboard() {
  const [fields, setFields] = useState<Field[]>([]);
  const [profile, setProfile] = useState<PublicPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    (async () => {
      try {
        const me = await api<PublicPlayer>('/api/v2/me');
        if (!active) return;
        setProfile(me);
        if (me.role === 'owner') {
          const list = await api<Field[]>('/api/owner-fields');
          if (active) setFields(list);
        }
      } catch (err) { if (active) setError((err as Error).message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [reload]);
  useEffect(() => { if (draft) heading.current?.focus(); }, [!!draft]);
  const openForm = (field?: Field) => {
    setError(''); setNotice(''); setEditingId(field?._id || null);
    setDraft(field ? { ...field, price: String(field.price), image: /^https?:\/\//.test(field.image || '') ? field.image : '', facilities: Array.isArray(field.facilities) ? field.facilities : Object.entries(field.facilities || {}).filter(([, value]) => value).map(([key]) => oldAmenities[key] || key) } : blank());
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const change = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(current => current && { ...current, [key]: value });
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!draft || busy) return;
    setBusy(true); setError('');
    try {
      const saved = await api<Field>(editingId ? `/api/update-fields/${editingId}` : '/api/add-fields', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify({ ...draft, price: Number(draft.price) }) });
      setFields(current => editingId ? current.map(field => field._id === editingId ? saved : field) : [saved, ...current]);
      setDraft(null); setNotice(editingId ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มสนามแล้ว ผู้เล่นสามารถเลือกสนามนี้ตอนสร้างปาร์ตี้ได้');
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const toggle = async (field: Field) => {
    if (busy) return; setBusy(true); setError('');
    try {
      const saved = await api<Field>(`/api/update-fields/${field._id}`, { method: 'PUT', body: JSON.stringify({ is_active: !field.is_active }) });
      setFields(current => current.map(item => item._id === field._id ? saved : item));
      setNotice(saved.is_active ? 'เปิดรับสนามแล้ว' : 'พักสนามแล้ว จะไม่แสดงในตัวเลือกสร้างปาร์ตี้ใหม่');
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  if (loading) return <main className="party-app"><p role="status">กำลังโหลดสนามของคุณ…</p></main>;
  if (!profile) return <main className="party-app"><ApiError message={error} retry={() => setReload(value => value + 1)} /></main>;
  if (profile.role !== 'owner') return <main className="party-app"><div className="party-empty"><Flag /><h1>พื้นที่สำหรับเจ้าของสนาม</h1><p>บัญชีนี้เป็นบัญชีผู้เล่น คุณสามารถค้นหาและสร้างปาร์ตี้ได้</p><Link to="/team" className="kh-button kh-primary">ค้นหาปาร์ตี้</Link><Link className="party-back" to="/profile">กลับไปโปรไฟล์</Link></div></main>;
  const results = fields.filter(field => `${field.field_name} ${field.address}`.toLowerCase().includes(query.trim().toLowerCase()) && (filter === 'all' || field.is_active === (filter === 'active')));
  return <main className={`party-app owner-page ${draft ? 'owner-page--form' : ''}`}>
    {draft ? <>
      <button type="button" className="owner-back" disabled={busy} onClick={() => { setDraft(null); setError(''); }}><ArrowLeft size={18} /> สนามของฉัน</button>
      <span className="party-kicker">BUILD YOUR HOME GROUND</span><h1 ref={heading} tabIndex={-1}>{editingId ? 'แก้ไขสนาม' : 'เพิ่มสนามใหม่'}</h1><p className="owner-intro">ให้เพื่อนร่วมสนามรู้จักสถานที่ของคุณ</p>
      <form onSubmit={save}>
        <section className="party-form-section"><h2>01 · ข้อมูลสนาม</h2>
          <label>ชื่อสนาม<input required maxLength={120} value={draft.field_name} onChange={event => change('field_name', event.target.value)} placeholder="เช่น KickHub Arena" /></label>
          <label>ที่อยู่ / ย่าน<input required maxLength={500} value={draft.address} onChange={event => change('address', event.target.value)} placeholder="ที่อยู่ที่ผู้เล่นค้นหาได้" /></label>
          <label>ลิงก์แผนที่<input required type="url" maxLength={2000} value={draft.google_map} onChange={event => change('google_map', event.target.value)} placeholder="https://maps.google.com/…" /></label>
          <div className="party-form-grid"><label>ประเภทสนาม<input required maxLength={60} list="field-types" value={draft.field_type} onChange={event => change('field_type', event.target.value)} /><datalist id="field-types"><option value="หญ้าเทียม" /><option value="หญ้าจริง" /><option value="ฟุตซอลในร่ม" /></datalist></label><label>เบอร์ติดต่อ<input required type="tel" maxLength={30} autoComplete="tel" value={draft.mobile_number} onChange={event => change('mobile_number', event.target.value)} /></label></div>
        </section>
        <section className="party-form-section"><h2>02 · ราคาและเวลา</h2><label>ราคาต่อชั่วโมง (บาท)<input required type="number" min="0" max="100000" step="0.01" inputMode="decimal" value={draft.price} onChange={event => change('price', event.target.value)} /></label><div className="party-form-grid"><label>เวลาเปิด<input required type="time" value={draft.open} onChange={event => change('open', event.target.value)} /></label><label>เวลาปิด<input required type="time" value={draft.close} onChange={event => change('close', event.target.value)} /></label></div><p className="party-help">รองรับสนามที่ปิดหลังเที่ยงคืน ราคานี้ใช้ช่วยคำนวณค่าใช้จ่ายตอนสร้างปาร์ตี้</p></section>
        <section className="party-form-section"><h2>03 · บรรยากาศและสิ่งอำนวยความสะดวก</h2><label>ลิงก์รูปสนาม (ไม่บังคับ)<input type="url" maxLength={2000} value={draft.image || ''} onChange={event => change('image', event.target.value)} placeholder="https://…/สนาม.jpg" /></label><p className="party-help">ใช้ลิงก์รูปที่เปิดดูได้สาธารณะ หากยังไม่มีรูป สามารถเพิ่มภายหลังได้</p><div className="owner-preview"><FieldImage src={draft.image} name={draft.field_name || 'ตัวอย่างรูปสนาม'} /></div><fieldset className="owner-amenities"><legend>สิ่งอำนวยความสะดวก</legend>{[...new Set([...amenities, ...draft.facilities])].map(item => <button key={item} type="button" aria-pressed={draft.facilities.includes(item)} onClick={() => change('facilities', draft.facilities.includes(item) ? draft.facilities.filter(value => value !== item) : [...draft.facilities, item])}>{draft.facilities.includes(item) && <CircleCheck size={15} />}{item}</button>)}</fieldset><label>รายละเอียดเพิ่มเติม<textarea rows={4} maxLength={2000} value={draft.description || ''} onChange={event => change('description', event.target.value)} placeholder="ขนาดสนาม วิธีเดินทาง หรือสิ่งที่ผู้เล่นควรรู้" /></label><label className="owner-visibility"><input type="checkbox" checked={draft.is_active} onChange={event => change('is_active', event.target.checked)} /><span>เปิดให้ผู้เล่นเลือกสนามนี้ตอนสร้างปาร์ตี้</span></label></section>
        {error && <p className="party-error" role="alert">{error}</p>}<div className="party-form-actions"><button type="button" className="kh-button party-secondary" disabled={busy} onClick={() => { setDraft(null); setError(''); }}>ยกเลิก</button><button className="kh-button kh-primary" disabled={busy} type="submit">{busy ? 'กำลังบันทึก…' : 'บันทึกสนาม'}</button></div>
      </form>
    </> : <>
      <section className="owner-welcome"><span className="party-kicker">YOUR HOME GROUND</span><h1>สนามของคุณ<br />เกมของทุกคน.</h1><p>สวัสดี {profile.name} · จัดการสนามให้พร้อมรับเพื่อนใหม่</p><button className="kh-button kh-primary" onClick={() => openForm()}><Plus size={18} /> เพิ่มสนามใหม่</button><Flag className="owner-welcome-icon" aria-hidden="true" /></section>
      <div className="owner-stats"><div><strong>{fields.length}</strong><span>สนามทั้งหมด</span></div><div><strong>{fields.filter(field => field.is_active).length}</strong><span>เปิดรับผู้เล่น</span></div><div><strong>{fields.filter(field => !field.is_active).length}</strong><span>พักสนาม</span></div></div>
      {notice && <p role="status" className="party-draft-note">{notice}</p>}{error && <p className="party-error" role="alert">{error}</p>}
      <label className="party-search"><Search size={19} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="ค้นหาสนามของคุณ…" aria-label="ค้นหาสนามของคุณ" /></label>
      <div className="party-main-tabs">{[['all', 'ทั้งหมด'], ['active', 'เปิดรับ'], ['paused', 'พักสนาม']].map(([value, name]) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{name}</button>)}</div>
      <div className="party-list">{results.map(field => <article key={field._id} className="party-list-card owner-field-card"><div className="owner-field-image"><FieldImage src={field.image} name={field.field_name} /><span className={`owner-status ${field.is_active ? 'is-active' : ''}`}>{field.is_active ? 'เปิดรับ' : 'พักสนาม'}</span></div><div className="party-card-body"><span className="party-kicker">{field.field_type}</span><h2>{field.field_name}</h2><p className="party-location"><MapPin size={15} />{field.address}</p><p className="owner-hours"><Clock size={15} /> {field.open}–{field.close}</p><div className="party-card-bottom"><div><strong>฿{field.price.toLocaleString('th-TH')}</strong><small> / ชั่วโมง</small></div><button type="button" disabled={busy} onClick={() => openForm(field)}><Pencil size={15} /> แก้ไข</button></div><button type="button" className="owner-toggle" disabled={busy} onClick={() => toggle(field)}>{field.is_active ? <Pause size={15} /> : <CircleCheck size={15} />}{field.is_active ? 'พักสนามชั่วคราว' : 'เปิดรับอีกครั้ง'}</button></div></article>)}</div>
      {!results.length && <div className="party-empty"><Flag /><h2>{fields.length ? 'ไม่พบสนามที่ตรงกับตัวเลือก' : 'สนามแรก เริ่มตรงนี้'}</h2><p>{fields.length ? 'ลองเปลี่ยนคำค้นหาหรือสถานะสนาม' : 'เพิ่มรายละเอียดสนาม แล้วผู้เล่นจะเลือกสนามของคุณตอนสร้างปาร์ตี้ได้'}</p>{!fields.length && <button className="kh-button kh-primary" onClick={() => openForm()}>เพิ่มสนามแรก</button>}</div>}
      <p className="owner-footnote">พักสนามเพื่อซ่อนจากตัวเลือกสร้างปาร์ตี้ใหม่ ปาร์ตี้เดิมยังอยู่ในระบบ</p><Link className="party-back" to="/team">ดูปาร์ตี้ของผู้เล่น →</Link>
    </>}
  </main>;
}
