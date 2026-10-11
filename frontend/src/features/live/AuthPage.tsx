import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { loadFacebook, facebookLogin } from '@/lib/facebook';
import { AuthFormSplitScreen, type AuthFormValues } from '@/components/ui/login';
import { safeReturnPath } from './auth-return';

export default function AuthPage({ signup = false }: { signup?: boolean }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');
  const ownerIntent = searchParams.get('role') === 'owner' || safeReturnPath(next) === '/Owner';
  const [facebookReady, setFacebookReady] = useState(false);
  const [facebookNote, setFacebookNote] = useState('กำลังเตรียม Facebook Login…');
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleNote, setGoogleNote] = useState('กำลังเตรียม Google Login…');
  useEffect(() => {
    let active = true;
    api<{ enabled: boolean; clientId: string }>('/api/auth/google/config').then(config => {
      if (!active) return;
      if (config.enabled) { setGoogleClientId(config.clientId); setGoogleNote(''); }
      else setGoogleNote('Google Login ยังไม่เปิดใช้งาน สมัครหรือเข้าสู่ระบบด้วยอีเมลได้เลย');
    }).catch(() => { if (active) setGoogleNote('Google Login ไม่พร้อมในขณะนี้ กรุณาใช้อีเมล'); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    api<{ enabled: boolean; appId: string; version: string }>('/api/auth/facebook/config').then(async config => {
      if (!config.enabled) { if (active) setFacebookNote('Facebook Login ยังไม่เปิดใช้งาน สมัครหรือเข้าสู่ระบบด้วยอีเมลได้เลย'); return; }
      await loadFacebook(config.appId, config.version);
      if (active) { setFacebookReady(true); setFacebookNote(''); }
    }).catch(() => { if (active) setFacebookNote('Facebook Login ไม่พร้อมในขณะนี้ กรุณาใช้อีเมล'); });
    return () => { active = false; };
  }, []);
  function complete(token: string) {
    localStorage.setItem('token', token);
    navigate(safeReturnPath(next, signup ? '/profile' : '/team'), { replace: true });
  }
  const submit = async (values: AuthFormValues) => {
    const result = await api<{ token: string }>(signup ? '/api/auth/register' : '/api/auth/login', { method: 'POST', body: JSON.stringify(values) });
    complete(result.token);
  };
  const social = async (values: Pick<AuthFormValues, 'role' | 'rememberMe'>) => {
    const accessToken = await facebookLogin();
    const result = await api<{ token: string }>('/api/auth/facebook', { method: 'POST', body: JSON.stringify({ accessToken, ...values }) });
    complete(result.token);
  };
  const google = async (credential: string, values: Pick<AuthFormValues, 'role' | 'rememberMe'>) => {
    const result = await api<{ token: string }>('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential, ...values }) });
    complete(result.token);
  };
  const switchParams = new URLSearchParams();
  if (next) switchParams.set('next', safeReturnPath(next));
  if (ownerIntent) switchParams.set('role', 'owner');
  const switchHref = `${signup ? '/login' : '/signup'}${switchParams.size ? `?${switchParams}` : ''}`;
  return <AuthFormSplitScreen key={`${signup ? 'signup' : 'login'}-${ownerIntent ? 'owner' : 'user'}`} signup={signup} initialRole={signup && ownerIntent ? 'owner' : 'user'} logo={<Link to="/home">kick<span>hub</span><i /></Link>} title={signup ? (ownerIntent ? 'สนามของคุณ เริ่มตรงนี้' : 'ทีมใหม่ เริ่มจากคุณ') : 'ยินดีต้อนรับกลับ'} description={ownerIntent ? (signup ? 'สมัครบัญชีเจ้าของสนาม แล้วเพิ่มสนามให้ผู้เล่นค้นพบ' : 'เข้าสู่ระบบด้วยบัญชีเจ้าของสนาม เพื่อจัดการข้อมูลสนามของคุณ') : signup ? 'สร้างบัญชี แล้วเจอเพื่อนร่วมสนามที่ชอบฟุตบอลเหมือนกัน' : 'เข้าสู่ระบบ แล้วไปต่อกับเกมที่คุณรัก'} imageSrc={`${import.meta.env.BASE_URL}auth-sports.webp`} imageAlt="ลูกฟุตบอลติดตาข่ายในสนาม พร้อมข้อความ The Power of Sports" onSubmit={submit} createAccountHref={switchHref} onFacebook={social} facebookReady={facebookReady} facebookNote={facebookNote} googleClientId={googleClientId} googleNote={googleNote} onGoogle={google} />;
}
