import { useEffect, useRef, useState } from 'react';
import { CalendarPlus, Check, Copy, Share2 } from 'lucide-react';
import type { LiveParty } from '@/lib/api';
import { partyCalendar, partyUrl, shareSummary } from './party-export';
import './party-quick-actions.css';

export default function PartyQuickActions({ party, joined }: { party: LiveParty; joined: boolean }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [manualCopy, setManualCopy] = useState(false);
  const copyInput = useRef<HTMLInputElement>(null);
  const url = partyUrl(party._id, `${window.location.origin}${import.meta.env.BASE_URL}`);
  const cancelled = party.status === 'cancelled';
  const finished = new Date(party.end_datetime).getTime() <= Date.now();
  useEffect(() => { setNotice(''); setError(''); setManualCopy(false); }, [party._id, party.party_name, party.start_datetime, party.end_datetime, party.price, party.status]);
  useEffect(() => { if (manualCopy) { copyInput.current?.focus(); copyInput.current?.select(); } }, [manualCopy]);
  async function copyLink() {
    if (busy) return; setBusy(true); setError(''); setNotice('');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url); setNotice('คัดลอกลิงก์แล้ว ส่งให้เพื่อนได้เลย'); setManualCopy(false);
    } catch { setManualCopy(true); setNotice('เลือกและคัดลอกลิงก์ด้านล่างเพื่อส่งให้เพื่อน'); }
    finally { setBusy(false); }
  }
  async function share() {
    if (busy) return; setError(''); setNotice('');
    if (!navigator.share) { await copyLink(); return; }
    setBusy(true);
    try { await navigator.share({ title: `KickHub · ${party.party_name}`, text: shareSummary(party), url }); }
    catch (error) { if ((error as Error).name !== 'AbortError') { setManualCopy(true); setNotice('แชร์จากเบราว์เซอร์นี้ไม่ได้ คัดลอกลิงก์ด้านล่างได้เลย'); } }
    finally { setBusy(false); }
  }
  function calendar() {
    setError(''); setNotice(''); let objectUrl = '';
    try {
      const contents = partyCalendar(party, url);
      objectUrl = URL.createObjectURL(new Blob([contents], { type: 'text/calendar;charset=utf-8' }));
      const anchor = document.createElement('a'); anchor.href = objectUrl; anchor.download = `kickhub-${party._id}.ics`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setNotice('สร้างไฟล์นัดแล้ว เปิดไฟล์ .ics เพื่อเพิ่มลงปฏิทินของคุณ');
    } catch (error) { setError((error as Error).message); }
    finally { if (objectUrl) window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10000); }
  }
  if (cancelled || finished) return null;
  return <section className="party-quick-actions" aria-label="แชร์และบันทึกนัด">
    <div className="party-quick-buttons"><button onClick={share} disabled={busy}><Share2 size={18} />แชร์ปาร์ตี้</button><button onClick={copyLink} disabled={busy}><Copy size={18} />คัดลอกลิงก์</button>{joined && <button onClick={calendar} disabled={busy}><CalendarPlus size={18} />เพิ่มลงปฏิทิน</button>}</div>
    {joined && <p className="party-quick-hint">ไฟล์ปฏิทินไม่อัปเดตอัตโนมัติ หากนัดเปลี่ยนหรือยกเลิก ให้แก้ในปฏิทินด้วย</p>}
    {manualCopy && <label className="party-quick-copy">ลิงก์ปาร์ตี้<input ref={copyInput} readOnly value={url} onFocus={event => event.currentTarget.select()} aria-label="ลิงก์ปาร์ตี้สำหรับคัดลอก" /></label>}
    {notice && <p className="party-quick-notice" role="status"><Check size={16} />{notice}</p>}
    {error && <p className="party-error" role="alert">{error}</p>}
  </section>;
}
