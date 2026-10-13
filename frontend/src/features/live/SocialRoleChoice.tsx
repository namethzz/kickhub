import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PolicyLinks } from '@/features/policies/PolicyPages';
import '@/components/ui/login.css';
type Role = 'user' | 'owner';
export default function SocialRoleChoice({ name, provider, initialRole, onComplete, onCancel }: { name: string; provider: 'google' | 'facebook'; initialRole?: Role; onComplete: (role: Role) => Promise<void>; onCancel: () => void }) {
  const [role, setRole] = useState<Role | null>(initialRole || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!role || busy) return;
    setBusy(true); setError('');
    try { await onComplete(role); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  return <main className="kh-auth-screen kh-auth-role-screen"><section className="kh-auth-form-panel">
    <button type="button" className="kh-auth-back kh-role-back" onClick={onCancel} disabled={busy}><ArrowLeft size={16} />กลับไปเลือกวิธีเข้าสู่ระบบ</button>
    <div className="kh-auth-content"><div className="kh-auth-logo"><Link to="/home">kick<span>hub</span><i /></Link></div><div><span className="kh-auth-eyebrow">ONE MORE STEP</span><h1 ref={heading} tabIndex={-1}>เลือกประเภทบัญชีของคุณ</h1><p className="kh-auth-description">สวัสดี {name} · ยืนยันด้วย {provider === 'google' ? 'Google' : 'Facebook'} แล้ว เลือกวิธีใช้ KickHub ก่อนสร้างบัญชี</p></div>
      <form onSubmit={submit} className="kh-auth-form"><fieldset className="kh-role-fieldset"><legend>คุณอยากใช้ KickHub แบบไหน?</legend><div className="kh-auth-roles">{(['user', 'owner'] as const).map(value => <button type="button" key={value} aria-pressed={role === value} className={role === value ? 'selected' : ''} onClick={() => setRole(value)} disabled={busy}>{value === 'user' ? <Users size={22} /> : <ShieldCheck size={22} />}<span><strong>{value === 'user' ? 'ผู้เล่น' : 'เจ้าของสนาม'}</strong><small>{value === 'user' ? 'ค้นหาและสร้างปาร์ตี้' : 'เพิ่มและจัดการสนาม'}</small></span></button>)}</div></fieldset>
      <p className="kh-auth-note">บัญชีจะถูกสร้างเมื่อคุณกดยืนยันเท่านั้น เจ้าของสนามสามารถค้นหาและเข้าร่วมปาร์ตี้ได้ด้วย</p>
      {error && <p className="kh-auth-error" role="alert">{error}</p>}
      <Button type="submit" className="kh-auth-submit" disabled={!role || busy}>{busy ? <Loader2 className="animate-spin" size={19} /> : <ArrowRight size={19} />}{busy ? 'กำลังสร้างบัญชี…' : 'ยืนยันและสร้างบัญชี'}</Button></form>
    </div><div className="kh-auth-footer"><PolicyLinks /></div>
  </section><aside className="kh-auth-art" aria-label="บรรยากาศฟุตบอล"><img src={`${import.meta.env.BASE_URL}auth-football.webp`} alt="ลูกฟุตบอลบนสนามหญ้า" /><div className="kh-auth-art-shade" /><div className="kh-auth-art-caption"><span>YOUR PLACE IN THE GAME</span><h2>เพื่อนร่วมเกม<br />หรือเจ้าของสนาม</h2><p>เริ่มในแบบที่ใช่สำหรับคุณ</p></div></aside></main>;
}
