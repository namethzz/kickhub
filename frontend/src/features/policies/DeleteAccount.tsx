import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type PublicPlayer } from '@/lib/api';
import { PolicyLinks } from './PolicyPages';
export default function DeleteAccount() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicPlayer | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; api<PublicPlayer>('/api/v2/me').then(data => { if (active) setProfile(data); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  async function remove(event: React.FormEvent) {
    event.preventDefault(); if (!profile || busy || confirmation !== 'ลบบัญชี') return;
    setBusy(true); setError('');
    try {
      await api('/api/account', { method: 'DELETE', body: JSON.stringify({ confirmation }) });
      localStorage.removeItem('token'); localStorage.removeItem('kickhub.partyDrafts.v1');
      navigate('/account-deleted', { replace: true });
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="party-app policy-page"><Link className="party-back" to="/profile">← กลับบัญชีของฉัน</Link><span className="party-kicker">ACCOUNT SETTINGS</span><h1>ลบบัญชีและข้อมูล</h1>
    {loading ? <p role="status">กำลังตรวจสอบบัญชี…</p> : profile ? <form className="party-form-section delete-account-form" onSubmit={remove}><h2>บัญชี {profile.name}</h2><p>{profile.email}</p><p>การลบย้อนกลับไม่ได้ ปาร์ตี้ที่คุณสร้างและแชตในปาร์ตี้นั้นจะถูกลบ คุณจะออกจากปาร์ตี้อื่น ข้อความที่คุณส่งและคำขอเข้าร่วมจะถูกลบ สนามที่คุณเป็นเจ้าของจะถูกซ่อนและลบข้อมูลติดต่อ</p><p>ฉบับร่างในเบราว์เซอร์นี้จะถูกลบด้วย <Link to="/data-deletion">อ่านรายละเอียดทั้งหมด →</Link></p><label>พิมพ์ “ลบบัญชี” เพื่อยืนยัน<input value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" disabled={busy} /></label><button className="kh-button delete-account-button" type="submit" disabled={busy || confirmation !== 'ลบบัญชี'}>{busy ? 'กำลังลบบัญชี…' : 'ยืนยันลบบัญชีของฉัน'}</button></form> : null}
    {error && <p className="party-error" role="alert">{error}</p>}
    {!loading && <Link className="party-back" to="/login?next=%2Faccount%2Fdelete">เข้าสู่ระบบอีกครั้งก่อนลบบัญชี →</Link>}
    <PolicyLinks />
  </main>;
}
export function AccountDeleted() {
  return <main className="party-app policy-page"><span className="party-kicker">ACCOUNT CLOSED</span><h1>ลบบัญชีเรียบร้อยแล้ว</h1><p>บัญชีและข้อมูลที่เกี่ยวข้องถูกลบจากระบบหลักแล้ว การเชื่อมต่อในเบราว์เซอร์นี้สิ้นสุดลง</p><Link className="kh-button kh-dark" to="/home">กลับหน้าหลัก</Link><PolicyLinks /></main>;
}
