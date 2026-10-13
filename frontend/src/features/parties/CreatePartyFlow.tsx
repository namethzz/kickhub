import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ImagePlus, ShieldCheck, Users } from 'lucide-react';
import { api, type LiveField, type LiveParty } from '@/lib/api';
import { ACCEPTED_TYPES, prepareImage, uploadPartyCover } from '@/lib/profile-image';
import { ModePicker } from './ModePicker';
import { estimateShare, modeInfo, positions, saveDraft, type Access, type PartyDraft, type PartyMode, type Position } from './party-model';
import { hasFieldPrice } from '../fields/field-display';
import './parties.css';
function localToday() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
export default function CreatePartyFlow() {
  const [searchParams] = useSearchParams();
  const selectedField = searchParams.get('field') || '';
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<PartyMode>(searchParams.get('mode') === 'fixed' ? 'fixed' : 'flexible');
  const [access, setAccess] = useState<Access>(searchParams.get('mode') === 'fixed' ? 'approval' : 'open');
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState<{ id: string; name: string; area: string; price: number | null }[]>([]);
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
  // Cover photo: resized in the browser, kept here until the party exists, then uploaded to it.
  const [cover, setCover] = useState<Blob | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [coverError, setCoverError] = useState('');
  const [coverFailed, setCoverFailed] = useState('');
  const coverInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!cover) { setCoverPreview(''); return; }
    const url = URL.createObjectURL(cover);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);
  const pickCover = async (file?: File) => {
    if (!file) return;
    setCoverError('');
    try { setCover(await prepareImage(file, 'party')); } catch (error) { setCoverError((error as Error).message); }
  };
  const heading = useRef<HTMLHeadingElement>(null);
  const field = fields.find(item => item.id === fieldId);
  const capacity = mode === 'flexible' ? count : Object.values(slots).reduce((total, value) => total + value, 0);
  const knownPrice = !!field && hasFieldPrice(field);
  const totalCost = (field?.price ?? 0) * duration;
  const share = estimateShare(totalCost, capacity);
  const changeStep = (value: number) => { setStep(value); setError(''); requestAnimationFrame(() => { heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); heading.current?.focus({ preventScroll: true }); }); };
  const validate = () => {
    if (!field) return 'กรุณาเลือกสนามที่เปิดใช้งาน';
    if (!knownPrice && price === null) return 'ยังไม่ทราบราคาสนาม กรุณายืนยันกับสนามแล้วกรอกค่าต่อคน';
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
      // The party is already published at this point, so a failed photo must not hide that: report it and offer a retry.
      if (cover) { try { await uploadPartyCover(result._id, cover); } catch (coverProblem) { setCoverFailed((coverProblem as Error).message || 'อัปโหลดรูปไม่สำเร็จ'); } }
      setPublished(result._id);
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  };
  const retryCover = async () => {
    if (!cover || !published || busy) return;
    setBusy(true);
    try { await uploadPartyCover(published, cover); setCoverFailed(''); } catch (error) { setCoverFailed((error as Error).message || 'อัปโหลดรูปไม่สำเร็จ'); } finally { setBusy(false); }
  };
  if (fieldsLoading) return <main className="party-app"><p role="status">กำลังโหลดสนาม…</p></main>;
  if (!field) return <main className="party-app"><div className="party-empty"><h1>ยังสร้างปาร์ตี้ไม่ได้</h1><p role="alert">{fieldsError || 'ยังไม่มีสนามที่เปิดใช้งาน ให้เจ้าของสนามเพิ่มสนามก่อน'}</p><Link className="kh-button kh-primary" to={localStorage.getItem('token') ? '/team' : `/login?next=${encodeURIComponent('/create-party' + (selectedField ? `?field=${encodeURIComponent(selectedField)}` : ''))}`}>{localStorage.getItem('token') ? 'กลับไปค้นหา' : 'เข้าสู่ระบบ'}</Link><Link className="party-back" to="/field">เลือกสนามใหม่ →</Link></div></main>;
  if (published) return <main className="party-app party-create-page"><div className="party-saved"><span><Check size={36}/></span><h1>เผยแพร่ปาร์ตี้แล้ว</h1><p>ผู้เล่นสามารถค้นหาและเข้าร่วมตามเงื่อนไขที่คุณตั้งไว้ การเผยแพร่นี้ยังไม่ใช่การจองหรือชำระค่าสนาม</p>{coverFailed && <div className="party-cover-warning" role="alert"><p>เผยแพร่ปาร์ตี้แล้ว แต่อัปโหลดรูปปกไม่สำเร็จ: {coverFailed}</p><button type="button" disabled={busy} className="kh-button party-secondary" onClick={retryCover}>{busy ? 'กำลังอัปโหลด…' : 'ลองอัปโหลดรูปอีกครั้ง'}</button></div>}<Link className="kh-button kh-primary kh-full" to={`/parties/${published}`}>ดูปาร์ตี้ของฉัน</Link></div></main>;
  if (saved) return <main className="party-app party-create-page"><div className="party-saved"><span><Check size={36} /></span><h1>ฉบับร่างพร้อมแล้ว</h1><p>เก็บไว้ในเบราว์เซอร์นี้ ยังไม่ได้เผยแพร่หรือจองสนาม</p><div><strong>{title}</strong><p>{modeInfo[mode].title} · {capacity} คน</p><p>{mode === 'fixed' ? `ตำแหน่งของคุณ: ${positions.find(item => item.code === hostPosition)?.name}` : 'ไม่ล็อคตำแหน่ง'}</p><p>ประมาณ ฿{share}/คน เมื่อครบจำนวน</p></div><Link className="kh-button kh-primary kh-full" to="/demo/team?tab=drafts">ดูฉบับร่างของฉัน <ArrowRight size={18} /></Link></div></main>;
  return <main className="party-app party-create-page"><Link className="party-back" to="/team"><ArrowLeft size={18} />กลับไปค้นหาปาร์ตี้</Link><div className="party-page-head"><div><span className="party-kicker">START YOUR OWN GAME</span><h1 ref={heading} tabIndex={-1}>สร้างปาร์ตี้ของคุณ</h1><p>ชวนคนที่ชอบฟุตบอลเหมือนกันมาลงสนาม</p></div></div><ol className="party-steps" aria-label="ขั้นตอนสร้างปาร์ตี้">{['เลือกโหมด', 'จัดปาร์ตี้', 'ตรวจสอบ'].map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined} className={step >= index ? 'active' : ''}><span>{step > index ? <Check size={15} /> : index + 1}</span>{label}</li>)}</ol><p className="party-draft-note">ตั้งค่าปาร์ตี้ ตรวจสอบ แล้วเผยแพร่ให้เพื่อนค้นหาได้</p>
    <form onSubmit={event => { event.preventDefault(); if (step === 0) changeStep(1); else if (step === 1) { const message = validate(); if (message) setError(message); else changeStep(2); } else publish(); }}>
      {step === 0 && <section className="party-form-section"><h2>อยากเล่นแบบไหน?</h2><ModePicker value={mode} onChange={value => { setMode(value); setAccess(value === 'fixed' ? 'approval' : 'open'); }} /><div className="party-mode-description"><h3>{modeInfo[mode].title}</h3><p>{modeInfo[mode].detail}</p><ul>{mode === 'flexible' ? <><li>รับคนได้มากขึ้น ไม่กำหนดตำแหน่ง</li><li>คนหารมากขึ้น ค่าใช้จ่ายต่อคนลดลงเมื่อค่ารวมเท่ากัน</li><li>เหมาะกับการเจอเพื่อนใหม่และสลับทีมเล่น</li></> : <><li>เลือกตำแหน่งของตัวเองก่อน</li><li>กำหนดจำนวนคนที่ต้องการในแต่ละตำแหน่ง</li><li>ตั้งให้เจ้าของปาร์ตี้อนุมัติก่อนรับสมาชิกได้</li></>}</ul></div></section>}
      {step === 1 && <><section className="party-form-section"><h2>ชื่อและสนาม</h2><label>ชื่อปาร์ตี้<input required maxLength={70} value={title} onChange={event => setTitle(event.target.value)} placeholder="เช่น เลิกงานแล้ว มาเตะกัน" /></label><label>สนามที่เปิดใช้งาน<select value={fieldId} onChange={event => { setFieldId(event.target.value); setPrice(null); }}>{fields.map(item => <option key={item.id} value={item.id}>{item.name} · {item.area}</option>)}</select></label><div className="party-form-grid"><label>วันที่เตะ<input type="date" required min={localToday()} value={date} onChange={event => setDate(event.target.value)} /></label><label>เริ่มเวลา<input type="time" required value={time} onChange={event => setTime(event.target.value)} /></label></div><label>ระยะเวลา (ชั่วโมง)<input type="number" min="0.5" max="6" step="0.5" required value={duration || ''} onChange={event => setDuration(event.target.valueAsNumber)} /></label></section>
      <section className="party-form-section party-cover-section"><h2>รูปปกปาร์ตี้ <small>ไม่บังคับ</small></h2>
        <input ref={coverInput} type="file" accept={ACCEPTED_TYPES.join(',')} style={{ display: 'none' }} aria-label="เลือกรูปปกปาร์ตี้" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void pickCover(file); }} />
        {coverPreview
          ? <div className="party-cover-preview"><img src={coverPreview} alt="ตัวอย่างรูปปกปาร์ตี้" /><div className="party-cover-actions"><button type="button" onClick={() => coverInput.current?.click()}>เปลี่ยนรูป</button><button type="button" onClick={() => { setCover(null); setCoverError(''); }}>ลบรูป</button></div></div>
          : <button type="button" className="party-cover-empty" onClick={() => coverInput.current?.click()}><ImagePlus size={26} aria-hidden="true" /><strong>เพิ่มรูปปกปาร์ตี้</strong><small>JPG, PNG หรือ WebP · ภาพแนวนอนสวยที่สุด</small></button>}
        {coverError && <p className="party-error" role="alert">{coverError}</p>}
        <small className="party-help">รูปจะแสดงบนการ์ดปาร์ตี้ ระบบครอปเป็นอัตราส่วน 16:9 ให้อัตโนมัติ ถ้าไม่เลือกจะใช้ภาพสนามแบบมินิมอลแทน</small>
      </section>
      <section className="party-form-section"><h2>{mode === 'fixed' ? 'จัดตำแหน่งในทีม' : 'รับเพื่อนกี่คนดี?'}</h2>{mode === 'flexible' ? <label>ผู้เล่นรวมเจ้าของปาร์ตี้<input type="number" required min="2" max="40" step="1" value={count || ''} onChange={event => setCount(event.target.valueAsNumber)} /></label> : <><div className="party-slots">{positions.map(item => <label key={item.code}><span><b>{item.code}</b>{item.name}</span><input type="number" required min="0" max="22" step="1" value={Number.isNaN(slots[item.code]) ? '' : slots[item.code]} aria-label={`จำนวน${item.name}`} onChange={event => setSlots(previous => ({ ...previous, [item.code]: event.target.valueAsNumber }))} /></label>)}</div><label>ตำแหน่งของคุณ<select required value={hostPosition} onChange={event => setHostPosition(event.target.value as Position | '')}><option value="">เลือกตำแหน่งของคุณ</option>{positions.map(item => <option key={item.code} value={item.code} disabled={!slots[item.code]}>{item.name}</option>)}</select></label><small className="party-help">จำนวนแต่ละตำแหน่งนับรวมตัวคุณแล้ว รวม {Number.isFinite(capacity) ? capacity : 0} คน</small></>}
      {knownPrice ? <div className="party-cost-estimate"><div><small>ประมาณการค่าสนาม</small><strong>฿{Number.isFinite(totalCost) ? totalCost.toLocaleString('th-TH') : 0}</strong><span>{field.price!.toLocaleString('th-TH')} บาท/ชม. × {Number.isFinite(duration) ? duration : 0} ชม.</span></div><div><small>ถ้าครบ {Number.isFinite(capacity) ? capacity : 0} คน</small><strong>฿{Number.isFinite(share) ? share : 0}<em>/คน</em></strong></div></div> : <p className="party-help">ยังไม่ทราบค่าสนาม กรุณาสอบถามสนามก่อนกรอกค่าต่อคน ระบบจะไม่คำนวณราคาแทน</p>}<label>ราคาที่เรียกเก็บต่อคน (บาท)<input type="number" min="0" max="100000" step="0.01" value={price ?? (knownPrice && Number.isFinite(share) ? share : '')} onChange={event=>setPrice(event.target.value === '' ? null : event.target.valueAsNumber)} /></label><small className="party-help">เป็นการหารค่าสนามตามราคาของสนาม จำนวนคนจริงอาจทำให้ค่าใช้จ่ายเปลี่ยน ยังไม่รวมค่าใช้จ่ายอื่น</small></section>
      <section className="party-form-section"><h2>ใครเข้าร่วมได้บ้าง?</h2><div className="party-access-options">{(['open', 'approval'] as const).map(value => <label key={value} className={access === value ? 'selected' : ''}><input type="radio" name="access" checked={access === value} onChange={() => setAccess(value)} />{value === 'open' ? <Users size={20} /> : <ShieldCheck size={20} />}<span><strong>{value === 'open' ? 'เปิดรับทุกคน' : 'เจ้าของอนุมัติก่อน'}</strong><small>{value === 'open' ? 'เข้าร่วมได้เมื่อมีที่ว่าง' : 'เลือกคนเข้าทีมจากคำขอเข้าร่วม'}</small></span></label>)}</div><label>รายละเอียดเพิ่มเติม<textarea maxLength={600} rows={3} value={description} onChange={event => setDescription(event.target.value)} placeholder="บอกระดับฝีเท้า วิธีแบ่งทีม หรือสิ่งที่ควรเตรียมมา" /></label></section></>}
      {step === 2 && <section className="party-form-section party-review">{coverPreview && <img className="party-review-cover" src={coverPreview} alt="รูปปกปาร์ตี้" />}<span className="party-pill">{modeInfo[mode].title}</span><h2>{title}</h2><dl><div><dt>สนาม</dt><dd>{field.name}</dd></div><div><dt>วัน / เวลา</dt><dd>{date} · {time} · {duration} ชม.</dd></div><div><dt>จำนวนรวม</dt><dd>{capacity} คน</dd></div>{mode === 'fixed' && <><div><dt>ตำแหน่งของคุณ</dt><dd>{positions.find(item => item.code === hostPosition)?.name}</dd></div><div><dt>จำนวนตำแหน่ง</dt><dd>{positions.map(item => `${item.code} ${slots[item.code]}`).join(' · ')}</dd></div></>}<div><dt>การเข้าร่วม</dt><dd>{access === 'approval' ? 'เจ้าของอนุมัติก่อน' : 'เปิดรับทุกคน'}</dd></div><div><dt>ค่าสนามรวม</dt><dd>{knownPrice ? `฿${totalCost.toLocaleString('th-TH')}` : 'ยังไม่ทราบ — ยืนยันกับสนาม'}</dd></div><div><dt>ราคาที่เรียกเก็บ / คน</dt><dd>฿{price ?? share}</dd></div></dl>{description && <p>{description}</p>}<p className="party-preview-note">การเผยแพร่จะเปิดให้ผู้เล่นค้นหาได้ แต่ยังไม่ถือว่าจองหรือชำระค่าสนาม กรุณาตกลงการจองกับเจ้าของสนามก่อน</p></section>}
      {error && <p className="party-error" role="alert">{error}</p>}
      <div className="party-form-actions">{step === 2 && <button type="button" disabled={busy} className="kh-button party-secondary" onClick={submit}>เก็บฉบับร่าง</button>}{step > 0 && <button type="button" disabled={busy} className="kh-button party-secondary" onClick={() => changeStep(step - 1)}><ArrowLeft size={17} />ย้อนกลับ</button>}<button type="submit" disabled={busy} className="kh-button kh-primary">{busy ? 'กำลังเผยแพร่…' : step === 2 ? 'เผยแพร่ปาร์ตี้' : 'ถัดไป'}{step === 2 ? <Check size={18} /> : <ArrowRight size={18} />}</button></div>
    </form></main>;
}
