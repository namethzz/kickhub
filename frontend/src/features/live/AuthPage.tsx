import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { loadFacebook, facebookLogin } from '@/lib/facebook';
import { AuthFormSplitScreen, type AuthFormValues } from '@/components/ui/login';
import { safeReturnPath } from './auth-return';
import SocialRoleChoice from './SocialRoleChoice';
type SocialResult = { status: 'ok'; token: string; role?: 'user' | 'owner' } | { status: 'role_required'; signupToken: string; name: string };
type PendingSignup = { signupToken: string; name: string; provider: 'google' | 'facebook'; rememberMe: boolean };

export default function AuthPage({ signup = false }: { signup?: boolean }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');
  const ownerIntent = searchParams.get('role') === 'owner' || safeReturnPath(next) === '/Owner';
  const [pending, setPending] = useState<PendingSignup | null>(null);
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
  function complete(token: string, role?: 'user' | 'owner') {
    localStorage.setItem('token', token);
    navigate(safeReturnPath(next, role === 'owner' ? '/Owner' : signup ? '/profile' : '/team'), { replace: true });
  }
  const submit = async (values: AuthFormValues) => {
    const result = await api<{ token: string }>(signup ? '/api/auth/register' : '/api/auth/login', { method: 'POST', body: JSON.stringify(values) });
    complete(result.token);
  };
  const social = async (values: Pick<AuthFormValues, 'role' | 'rememberMe'>) => {
    const accessToken = await facebookLogin();
    const result = await api<SocialResult>('/api/auth/facebook', { method: 'POST', body: JSON.stringify({ accessToken, rememberMe: values.rememberMe, ...(signup ? { role: values.role } : {}) }) });
    finishSocial(result, 'facebook', values.rememberMe);
  };
  const google = async (credential: string, values: Pick<AuthFormValues, 'role' | 'rememberMe'>) => {
    const result = await api<SocialResult>('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential, rememberMe: values.rememberMe, ...(signup ? { role: values.role } : {}) }) });
    finishSocial(result, 'google', values.rememberMe);
  };
  function finishSocial(result: SocialResult, provider: 'google' | 'facebook', rememberMe: boolean) {
    if (result.status === 'role_required') setPending({ signupToken: result.signupToken, name: result.name, provider, rememberMe });
    else complete(result.token, result.role);
  }
  async function finishSignup(role: 'user' | 'owner') {
    if (!pending) return;
    const result = await api<{ token: string; role: 'user' | 'owner' }>('/api/auth/social/complete', { method: 'POST', body: JSON.stringify({ signupToken: pending.signupToken, role, rememberMe: pending.rememberMe }) });
    complete(result.token, result.role);
  }
  const switchParams = new URLSearchParams();
  if (next) switchParams.set('next', safeReturnPath(next));
  if (ownerIntent) switchParams.set('role', 'owner');
  const switchHref = `${signup ? '/login' : '/signup'}${switchParams.size ? `?${switchParams}` : ''}`;
  if (pending) return <SocialRoleChoice name={pending.name} provider={pending.provider} initialRole={ownerIntent ? 'owner' : undefined} onComplete={finishSignup} onCancel={() => setPending(null)} />;
  return <AuthFormSplitScreen key={`${signup ? 'signup' : 'login'}-${ownerIntent ? 'owner' : 'user'}`} signup={signup} initialRole={signup && ownerIntent ? 'owner' : 'user'} logo={<Link to="/home">kick<span>hub</span><i /></Link>} title={signup ? (ownerIntent ? 'สนามของคุณ เริ่มตรงนี้' : 'ทีมใหม่ เริ่มจากคุณ') : 'ยินดีต้อนรับกลับ'} description={ownerIntent ? (signup ? 'สมัครบัญชีเจ้าของสนาม แล้วเพิ่มสนามให้ผู้เล่นค้นพบ' : 'เข้าสู่ระบบด้วยบัญชีเจ้าของสนาม เพื่อจัดการข้อมูลสนามของคุณ') : signup ? 'สร้างบัญชี แล้วเจอเพื่อนร่วมสนามที่ชอบฟุตบอลเหมือนกัน' : 'เข้าสู่ระบบ แล้วไปต่อกับเกมที่คุณรัก'} imageSrc={`${import.meta.env.BASE_URL}auth-sports.webp`} imageAlt="ลูกฟุตบอลติดตาข่ายในสนาม พร้อมข้อความ The Power of Sports" onSubmit={submit} createAccountHref={switchHref} onFacebook={social} facebookReady={facebookReady} facebookNote={facebookNote} googleClientId={googleClientId} googleNote={googleNote} onGoogle={google} />;
}
