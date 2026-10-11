import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Users } from 'lucide-react';
import { api, type LiveField, type LiveParty } from '@/lib/api';
import { ModePicker } from './ModePicker';
import { estimateShare, modeInfo, positions, saveDraft, type Access, type PartyDraft, type PartyMode, type Position } from './party-model';
import './parties.css';
function localToday() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
export default function CreatePartyFlow() {
  const [searchParams] = useSearchParams();
  const selectedField = searchParams.get('field') || '';
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<PartyMode>(searchParams.get('mode') === 'fixed' ? 'fixed' : 'flexible');
  const [access, setAccess] = useState<Access>(searchParams.get('mode') === 'fixed' ? 'approval' : 'open');
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState<{ id: string; name: string; area: string; price: number }[]>([]);
  const [fieldId, setFieldId] = useState('');
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [fieldsError, setFieldsError] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState('');
  useEffect(() => { let active=true;setFieldsLoading(true);setFieldsError(''); api<LiveField[]>('/api/v2/fields').then(data=>{if(active){const mapped=data.map(field=>({id:field._id,name:field.field_name,area:field.address,price:field.price}));setFields(mapped);setFieldId(selectedField || mapped[0]?.id || '');if(selectedField && !mapped.some(field=>field.id===selectedField))setFieldsError('สนามที่เลือกไม่เปิดรับแล้ว กรุณาเลือกสนามใหม่');}}).catch(error=>{if(active)setFieldsError(error.message);}).finally(()=>{if(active)setFieldsLoading(false);});return()=>{active=false;};}, [selectedField]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:00');
  const [duration, setDuration] = useState(2);
  const [count, setCount] = useState(24);
  const [slots, setSlots] = useState<Record<Position, number>>({ GK: 2, DF: 4, MF: 4, FW: 4 });
  const [hostPosition, setHostPosition] = useState<Position | ''>('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const field = fields.find(item => item.id === fieldId);
  const capacity = mode === 'flexible' ? count : Object.values(slots).reduce((total, value) => total + value, 0);
  const totalCost = (field?.price || 0) * duration;
  const share = estimateShare(totalCost, capacity);
  const changeStep = (value: number) => { setStep(value); setError(''); requestAnimationFrame(() => { heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); heading.current?.focus({ preventScroll: true }); }); };
  const validate = () => {
    if (!field) return 'กรุณาเลือกสนามที่เปิดใช้งาน';
    if (price !== null && (!Number.isFinite(price) || price < 0 || price > 100000)) return 'ราคาต่อคนไม่ถูกต้อง';
    if (!title.trim()) return 'กรุณาตั้งชื่อปาร์ตี้';
    if (!date || !time || !Number.isFinite(new Date(`${date}T${time}`).getTime()) || new Date(`${date}T${time}`).getTime() <= Date.now()) return 'กรุณาเลือกวันและเวลาในอนาคต';
    if (!Number.isFinite(duration) || duration < 0.5 || duration > 6 || duration * 2 % 1 !== 0) return 'ระยะเวลาเตะต้องเป็น 0.5–6 ชั่วโมง เพิ่มทีละครึ่งชั่วโมง';
    if (!Number.isInteger(capacity) || capacity < 2 || capacity > 40) return 'จำนวนผู้เล่นรวมต้องอยู่ระหว่าง 2–40 คน';
    if (mode === 'fixed' && (Object.values(slots).some(value => !Number.isInteger(value) || value < 0 || value > 22) || !hostPosition || slots[hostPosition] < 1)) return 'กรุณาเลือกตำแหน่งของคุณ และเปิดอย่างน้อย 1 ที่ในตำแหน่งนั้น';
    return '';
  };
  const submit = () => {
    const message = validate(); if (message) { setError(message); return; }
    const draft: PartyDraft = { id: `draft-${crypto.randomUUID()}`, title: title.trim(), fieldName: field?.name, price: price ?? share, mode, access, fieldId, date, time, duration, capacity, totalCost, hostPosition: mode === 'fixed' ? hostPosition : '', slots, description: description.trim(), createdAt: new Date().toISOString() };
    try { saveDraft(draft); setSaved(true); } catch { setError('บันทึกไม่ได้ เบราว์เซอร์อาจไม่อนุญาตให้เก็บข้อมูล กรุณาลองอีกครั้ง'); }
  };
  const publish = async () => {
    if (busy) return;
    const message = validate(); if (message) { setError(message); return; }
    setBusy(true); setError('');
    try {
      const start = new Date(`${date}T${time}`);
      const result = await api<LiveParty>('/api/v2/parties', { method: 'POST', body: JSON.stringify({ field_id: fieldId, party_name: title.trim(), mode, access, start_datetime: start.toISOString(), end_datetime: new Date(+start + duration * 3600000).toISOString(), price: price ?? share, total_required_players: capacity, required_positions: positions.map(item => ({ position: item.code, amount: slots[item.code] })), position: hostPosition, description: description.trim() }) });
      setPublished(result._id);
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  };
  if (fieldsLoading) return <main className="party-app"><p role="status">กำลังโหลดสนาม…</p></main>;
  if (!field) return <main className="party-app"><div className="party-empty"><h1>ยังสร้างปาร์ตี้ไม่ได้</h1><p role="alert">{fieldsError || 'ยังไม่มีสนามที่เปิดใช้งาน ให้เจ้าของสนามเพิ่มสนามก่อน'}</p><Link className="kh-button kh-primary" to={localStorage.getItem('token') ? '/team' : `/login?next=${encodeURIComponent('/create-party' + (selectedField ? `?field=${encodeURIComponent(selectedField)}` : ''))}`}>{localStorage.getItem('token') ? 'กลับไปค้นหา' : 'เข้าสู่ระบบ'}</Link><Link className="party-back" to="/field">เลือกสนามใหม่ →</Link></div></main>;
  if (published) return <main className="party-app party-create-page"><div className="party-saved"><span><Check size={36}/></span><h1>เผยแพร่ปาร์ตี้แล้ว</h1><p>ผู้เล่นสามารถค้นหาและเข้าร่วมตามเงื่อนไขที่คุณตั้งไว้ การเผยแพร่นี้ยังไม่ใช่การจองหรือชำระค่าสนาม</p><Link className="kh-button kh-primary kh-full" to={`/parties/${published}`}>ดูปาร์ตี้ของฉัน</Link></div></main>;
  if (saved) return <main className="party-app party-create-page"><div className="party-saved"><span><Check size={36} /></span><h1>ฉบับร่างพร้อมแล้ว</h1><p>เก็บไว้ในเบราว์เซอร์นี้ ยังไม่ได้เผยแพร่หรือจองสนาม</p><div><strong>{title}</strong><p>{modeInfo[mode].title} · {capacity} คน</p><p>{mode === 'fixed' ? `ตำแหน่งของคุณ: ${positions.find(item => item.code === hostPosition)?.name}` : 'ไม่ล็อคตำแหน่ง'}</p><p>ประมาณ ฿{share}/คน เมื่อครบจำนวน</p></div><Link className="kh-button kh-primary kh-full" to="/demo/team?tab=drafts">ดูฉบับร่างของฉัน <ArrowRight size={18} /></Link></div></main>;
  return <main className="party-app party-create-page"><Link className="party-back" to="/team"><ArrowLeft size={18} />กลับไปค้นหาปาร์ตี้</Link><div className="party-page-head"><div><span className="party-kicker">START YOUR OWN GAME</span><h1 ref={heading} tabIndex={-1}>สร้างปาร์ตี้ของคุณ</h1><p>ชวนคนที่ชอบฟุตบอลเหมือนกันมาลงสนาม</p></div></div><ol className="party-steps" aria-label="ขั้นตอนสร้างปาร์ตี้">{['เลือกโหมด', 'จัดปาร์ตี้', 'ตรวจสอบ'].map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined} className={step >= index ? 'active' : ''}><span>{step > index ? <Check size={15} /> : index + 1}</span>{label}</li>)}</ol><p className="party-draft-note">ตั้งค่าปาร์ตี้ ตรวจสอบ แล้วเผยแพร่ให้เพื่อนค้นหาได้</p>
    <form onSubmit={event => { event.preventDefault(); if (step === 0) changeStep(1); else if (step === 1) { const message = validate(); if (message) setError(message); else changeStep(2); } else publish(); }}>
      {step === 0 && <section className="party-form-section"><h2>อยากเล่นแบบไหน?</h2><ModePicker value={mode} onChange={value => { setMode(value); setAccess(value === 'fixed' ? 'approval' : 'open'); }} /><div className="party-mode-description"><h3>{modeInfo[mode].title}</h3><p>{modeInfo[mode].detail}</p><ul>{mode === 'flexible' ? <><li>รับคนได้มากขึ้น ไม่กำหนดตำแหน่ง</li><li>คนหารมากขึ้น ค่าใช้จ่ายต่อคนลดลงเมื่อค่ารวมเท่ากัน</li><li>เหมาะกับการเจอเพื่อนใหม่และสลับทีมเล่น</li></> : <><li>เลือกตำแหน่งของตัวเองก่อน</li><li>กำหนดจำนวนคนที่ต้องการในแต่ละตำแหน่ง</li><li>ตั้งให้เจ้าของปาร์ตี้อนุมัติก่อนรับสมาชิกได้</li></>}</ul></div></section>}
      {step === 1 && <><section className="party-form-section"><h2>ชื่อและสนาม</h2><label>ชื่อปาร์ตี้<input required maxLength={70} value={title} onChange={event => setTitle(event.target.value)} placeholder="เช่น เลิกงานแล้ว มาเตะกัน" /></label><label>สนามที่เปิดใช้งาน<select value={fieldId} onChange={event => setFieldId(event.target.value)}>{fields.map(item => <option key={item.id} value={item.id}>{item.name} · {item.area}</option>)}</select></label><div className="party-form-grid"><label>วันที่เตะ<input type="date" required min={localToday()} value={date} onChange={event => setDate(event.target.value)} /></label><label>เริ่มเวลา<input type="time" required value={time} onChange={event => setTime(event.target.value)} /></label></div><label>ระยะเวลา (ชั่วโมง)<input type="number" min="0.5" max="6" step="0.5" required value={duration || ''} onChange={event => setDuration(event.target.valueAsNumber)} /></label></section>
      <section className="party-form-section"><h2>{mode === 'fixed' ? 'จัดตำแหน่งในทีม' : 'รับเพื่อนกี่คนดี?'}</h2>{mode === 'flexible' ? <label>ผู้เล่นรวมเจ้าของปาร์ตี้<input type="number" required min="2" max="40" step="1" value={count || ''} onChange={event => setCount(event.target.valueAsNumber)} /></label> : <><div className="party-slots">{positions.map(item => <label key={item.code}><span><b>{item.code}</b>{item.name}</span><input type="number" required min="0" max="22" step="1" value={Number.isNaN(slots[item.code]) ? '' : slots[item.code]} aria-label={`จำนวน${item.name}`} onChange={event => setSlots(previous => ({ ...previous, [item.code]: event.target.valueAsNumber }))} /></label>)}</div><label>ตำแหน่งของคุณ<select required value={hostPosition} onChange={event => setHostPosition(event.target.value as Position | '')}><option value="">เลือกตำแหน่งของคุณ</option>{positions.map(item => <option key={item.code} value={item.code} disabled={!slots[item.code]}>{item.name}</option>)}</select></label><small className="party-help">จำนวนแต่ละตำแหน่งนับรวมตัวคุณแล้ว รวม {Number.isFinite(capacity) ? capacity : 0} คน</small></>}
      <div className="party-cost-estimate"><div><small>ประมาณการค่าสนาม</small><strong>฿{Number.isFinite(totalCost) ? totalCost.toLocaleString('th-TH') : 0}</strong><span>{field.price.toLocaleString('th-TH')} บาท/ชม. × {Number.isFinite(duration) ? duration : 0} ชม.</span></div><div><small>ถ้าครบ {Number.isFinite(capacity) ? capacity : 0} คน</small><strong>฿{Number.isFinite(share) ? share : 0}<em>/คน</em></strong></div></div><label>ราคาที่เรียกเก็บต่อคน (บาท)<input type="number" min="0" max="100000" step="0.01" value={price ?? (Number.isFinite(share) ? share : 0)} onChange={event=>setPrice(event.target.valueAsNumber)} /></label><small className="party-help">เป็นการหารค่าสนามตามราคาของสนาม จำนวนคนจริงอาจทำให้ค่าใช้จ่ายเปลี่ยน ยังไม่รวมค่าใช้จ่ายอื่น</small></section>
      <section className="party-form-section"><h2>ใครเข้าร่วมได้บ้าง?</h2><div className="party-access-options">{(['open', 'approval'] as const).map(value => <label key={value} className={access === value ? 'selected' : ''}><input type="radio" name="access" checked={access === value} onChange={() => setAccess(value)} />{value === 'open' ? <Users size={20} /> : <ShieldCheck size={20} />}<span><strong>{value === 'open' ? 'เปิดรับทุกคน' : 'เจ้าของอนุมัติก่อน'}</strong><small>{value === 'open' ? 'เข้าร่วมได้เมื่อมีที่ว่าง' : 'เลือกคนเข้าทีมจากคำขอเข้าร่วม'}</small></span></label>)}</div><label>รายละเอียดเพิ่มเติม<textarea maxLength={600} rows={3} value={description} onChange={event => setDescription(event.target.value)} placeholder="บอกระดับฝีเท้า วิธีแบ่งทีม หรือสิ่งที่ควรเตรียมมา" /></label></section></>}
      {step === 2 && <section className="party-form-section party-review"><span className="party-pill">{modeInfo[mode].title}</span><h2>{title}</h2><dl><div><dt>สนาม</dt><dd>{field.name}</dd></div><div><dt>วัน / เวลา</dt><dd>{date} · {time} · {duration} ชม.</dd></div><div><dt>จำนวนรวม</dt><dd>{capacity} คน</dd></div>{mode === 'fixed' && <><div><dt>ตำแหน่งของคุณ</dt><dd>{positions.find(item => item.code === hostPosition)?.name}</dd></div><div><dt>จำนวนตำแหน่ง</dt><dd>{positions.map(item => `${item.code} ${slots[item.code]}`).join(' · ')}</dd></div></>}<div><dt>การเข้าร่วม</dt><dd>{access === 'approval' ? 'เจ้าของอนุมัติก่อน' : 'เปิดรับทุกคน'}</dd></div><div><dt>ค่าสนามรวม</dt><dd>฿{totalCost.toLocaleString('th-TH')}</dd></div><div><dt>ราคาที่เรียกเก็บ / คน</dt><dd>฿{price ?? share}</dd></div></dl>{description && <p>{description}</p>}<p className="party-preview-note">การเผยแพร่จะเปิดให้ผู้เล่นค้นหาได้ แต่ยังไม่ถือว่าจองหรือชำระค่าสนาม กรุณาตกลงการจองกับเจ้าของสนามก่อน</p></section>}
      {error && <p className="party-error" role="alert">{error}</p>}
      <div className="party-form-actions">{step === 2 && <button type="button" disabled={busy} className="kh-button party-secondary" onClick={submit}>เก็บฉบับร่าง</button>}{step > 0 && <button type="button" disabled={busy} className="kh-button party-secondary" onClick={() => changeStep(step - 1)}><ArrowLeft size={17} />ย้อนกลับ</button>}<button type="submit" disabled={busy} className="kh-button kh-primary">{busy ? 'กำลังเผยแพร่…' : step === 2 ? 'เผยแพร่ปาร์ตี้' : 'ถัดไป'}{step === 2 ? <Check size={18} /> : <ArrowRight size={18} />}</button></div>
    </form></main>;
}
