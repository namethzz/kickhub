import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Pencil, XCircle, ArrowLeft, Check, Users } from 'lucide-react';
import { api, type LiveParty } from '@/lib/api';
import { notificationChanged } from './notifications-api';
import './host-party.css';

const localDateTime = (value: string) => {
  const date = new Date(value);
  return new Date(+date - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export default function HostPartyActions({ party, onUpdated }: { party: LiveParty; onUpdated: (party: LiveParty) => void }) {
  const [action, setAction] = useState<'edit' | 'cancel' | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (action) { heading.current?.focus(); heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); } }, [action]);
  function open(next: 'edit' | 'cancel') {
    setName(party.party_name); setDescription(party.description || '');
    setStart(localDateTime(party.start_datetime)); setEnd(localDateTime(party.end_datetime)); setPrice(String(party.price));
    setReason(''); setError(''); setNotice(''); setAction(next);
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!action || busy) return;
    setError(''); setNotice('');
    const startDate = new Date(start), endDate = new Date(end), amount = Number(price);
    if (action === 'edit' && (!name.trim() || !Number.isFinite(+startDate) || !Number.isFinite(+endDate) || +startDate <= Date.now() || +endDate <= +startDate || +endDate - +startDate > 6 * 3600000 || !price.trim() || !Number.isFinite(amount) || amount < 0 || amount > 100000)) { setError('ตรวจชื่อ ราคา และเวลาอีกครั้ง เวลาเริ่มต้องอยู่ในอนาคตและระยะเวลาไม่เกิน 6 ชั่วโมง'); return; }
    setBusy(true);
    try {
      const updated = await api<LiveParty>(`/api/v2/parties/${party._id}${action === 'cancel' ? '/cancel' : ''}`, {
        method: action === 'cancel' ? 'POST' : 'PATCH',
        body: JSON.stringify(action === 'cancel' ? { reason } : { party_name: name.trim(), description: description.trim(), start_datetime: startDate.toISOString(), end_datetime: endDate.toISOString(), price: amount }),
      });
      onUpdated(updated); setAction(null); setNotice(action === 'cancel' ? 'ยกเลิกปาร์ตี้แล้ว และแจ้งสมาชิกกับผู้ที่รออนุมัติแล้ว' : 'บันทึกแล้ว หากข้อมูลเปลี่ยน สมาชิกและผู้ที่รออนุมัติจะได้รับแจ้งเตือน');
      window.dispatchEvent(new Event(notificationChanged));
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  const editable = party.status !== 'cancelled' && new Date(party.start_datetime).getTime() > Date.now();
  return <section className="host-party-panel" aria-label="เครื่องมือหัวตี้">
    {notice && <p className="party-draft-note" role="status">{notice}</p>}
    {error && !editable && <p className="party-error" role="alert">{error}</p>}
    {editable && <>
      <div className="host-party-heading"><span><Users size={18} /> เครื่องมือหัวตี้</span><small>จัดการได้ก่อนเริ่มเกม</small></div>
      {!action ? <div className="host-party-buttons"><button className="kh-button kh-dark" onClick={() => open('edit')}><Pencil size={17} />แก้ไขนัด</button><button className="host-party-danger" onClick={() => open('cancel')}><XCircle size={17} />ยกเลิกปาร์ตี้</button></div> : <form onSubmit={submit} className="party-form-section">
        <h2 ref={heading} tabIndex={-1}>{action === 'edit' ? 'แก้ไขนัดของคุณ' : 'ยืนยันยกเลิกทั้งปาร์ตี้'}</h2>
        {action === 'edit' ? <>
          <p className="player-caption">สมาชิกและผู้ที่รออนุมัติจะได้รับแจ้งเตือนเมื่อข้อมูลเปลี่ยน กรุณายืนยันเวลาสนามก่อนบันทึก</p>
          <label>ชื่อปาร์ตี้<input required maxLength={200} value={name} onChange={event => setName(event.target.value)} disabled={busy} /></label>
          <div className="party-form-grid"><label>เริ่มเตะ<input required type="datetime-local" value={start} onChange={event => setStart(event.target.value)} disabled={busy} /></label><label>จบเกม<input required type="datetime-local" value={end} onChange={event => setEnd(event.target.value)} disabled={busy} /></label></div>
          <label>ราคาต่อคน (บาท)<input required type="number" min="0" max="100000" step="0.01" inputMode="decimal" value={price} onChange={event => setPrice(event.target.value)} disabled={busy} /></label>
          <label>รายละเอียด<textarea rows={4} maxLength={600} value={description} onChange={event => setDescription(event.target.value)} disabled={busy} /></label>
          <p className="party-help">สนาม โหมด และตำแหน่งสมาชิกคงเดิม หากต้องการจัดทีมรูปแบบใหม่ ให้สร้างปาร์ตี้ใหม่</p>
        </> : <>
          <p className="player-caption">“{party.party_name}” จะหยุดรับผู้เล่นและย้ายไปประวัติ สมาชิกและผู้ที่รออนุมัติจะได้รับแจ้งเตือน การยกเลิกนี้เปิดกลับไม่ได้</p>
          <label>เหตุผลที่แจ้งสมาชิก (ไม่บังคับ)<textarea rows={3} maxLength={300} value={reason} onChange={event => setReason(event.target.value)} disabled={busy} placeholder="เช่น สนามไม่ว่างในเวลาที่นัดไว้" /></label>
          <p className="party-help">หากจองหรือชำระค่าสนามไว้แล้ว ให้ติดต่อสนามโดยตรงเพื่อจัดการการจอง</p>
        </>}
        {error && <p className="party-error" role="alert">{error}</p>}
        <div className="host-party-buttons"><button type="button" disabled={busy} className="kh-button party-secondary" onClick={() => { setAction(null); setError(''); }}><ArrowLeft size={17} />กลับ</button><button disabled={busy} type="submit" className={action === 'cancel' ? 'host-party-danger host-party-danger--solid' : 'kh-button kh-primary'}>{action === 'edit' ? <Check size={17} /> : <XCircle size={17} />}{busy ? 'กำลังบันทึก…' : action === 'edit' ? 'บันทึกและแจ้งสมาชิก' : 'ยืนยันยกเลิกปาร์ตี้'}</button></div>
      </form>}
    </>}
  </section>;
}
