'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, Users } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Checkbox } from './checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './form';
import { GoogleSignIn } from './google-sign-in';
import './login.css';

const schema = z.object({ name: z.string(), email: z.string().trim().email('กรุณากรอกอีเมลให้ถูกต้อง'), password: z.string().min(1, 'กรุณากรอกรหัสผ่าน').max(128, 'รหัสผ่านยาวเกินไป'), role: z.enum(['user', 'owner']), rememberMe: z.boolean() });
export type AuthFormValues = z.infer<typeof schema>;
type Props = {
  logo: ReactNode; title: string; description: string; imageSrc: string; imageAlt: string;
  onSubmit: (data: AuthFormValues) => Promise<void>; createAccountHref: string;
  signup?: boolean; onFacebook: (data: Pick<AuthFormValues, 'role' | 'rememberMe'>) => Promise<void>;
  facebookReady: boolean; facebookNote: string;
  googleClientId: string; googleNote: string; onGoogle: (credential: string, data: Pick<AuthFormValues, 'role' | 'rememberMe'>) => Promise<void>;
};

/** Live registration and login adapted from the supplied split-screen component. */
export function AuthFormSplitScreen({ logo, title, description, imageSrc, imageAlt, onSubmit, createAccountHref, signup = false, onFacebook, facebookReady, facebookNote, googleClientId, googleNote, onGoogle }: Props) {
  const [busy, setBusy] = useState<'email' | 'facebook' | 'google' | ''>('');
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();
  const form = useForm<AuthFormValues>({ resolver: zodResolver(schema.superRefine((values, context) => {
    if (signup && !values.name.trim()) context.addIssue({ code: 'custom', path: ['name'], message: 'กรุณากรอกชื่อที่แสดง' });
    if (signup && values.name.trim().length > 100) context.addIssue({ code: 'custom', path: ['name'], message: 'ชื่อยาวได้ไม่เกิน 100 ตัวอักษร' });
    if (signup && values.password.length < 8) context.addIssue({ code: 'custom', path: ['password'], message: 'ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร' });
  })), defaultValues: { name: '', email: '', password: '', role: 'user', rememberMe: false } });
  async function submit(values: AuthFormValues) {
    if (busyRef.current) return; busyRef.current = true; setBusy('email'); setError('');
    try { await onSubmit(values); } catch (error) { setError((error as Error).message); } finally { busyRef.current = false; setBusy(''); }
  }
  async function social() {
    if (busyRef.current) return; busyRef.current = true; setBusy('facebook'); setError('');
    try { await onFacebook({ role: form.getValues('role'), rememberMe: form.getValues('rememberMe') }); } catch (error) { setError((error as Error).message); } finally { busyRef.current = false; setBusy(''); }
  }
  async function google(credential: string) {
    if (busyRef.current) return; busyRef.current = true; setBusy('google'); setError('');
    try { await onGoogle(credential, { role: form.getValues('role'), rememberMe: form.getValues('rememberMe') }); } catch (error) { setError((error as Error).message); } finally { busyRef.current = false; setBusy(''); }
  }
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: reduceMotion ? 0 : 0.06 } } };
  const itemVariants = { hidden: { y: reduceMotion ? 0 : 12, opacity: 0 }, visible: { y: 0, opacity: 1 } };
  return <main className="kh-auth-screen">
    <section className="kh-auth-form-panel">
      <Link to="/home" className="kh-auth-back"><ArrowLeft size={16} />กลับหน้าหลัก</Link>
      <motion.div className="kh-auth-content" variants={containerVariants} initial={reduceMotion ? false : 'hidden'} animate="visible">
        <motion.div variants={itemVariants} className="kh-auth-logo">{logo}</motion.div>
        <motion.div variants={itemVariants}><span className="kh-auth-eyebrow">YOUR NEXT GAME STARTS HERE</span><h1>{title}</h1><p className="kh-auth-description">{description}</p></motion.div>
        <Form {...form}><form onSubmit={form.handleSubmit(submit)} className="kh-auth-form" noValidate>
          {signup && <motion.div variants={itemVariants}><FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>ชื่อที่แสดง</FormLabel><FormControl><Input autoComplete="name" placeholder="เพื่อนในทีมเรียกคุณว่า…" maxLength={100} disabled={!!busy} {...field} /></FormControl><FormMessage /></FormItem>} /></motion.div>}
          {signup && <FormField control={form.control} name="role" render={({ field }) => <FormItem><FormLabel>คุณอยากใช้ KickHub แบบไหน?</FormLabel><div className="kh-auth-roles" role="group" aria-label="ประเภทบัญชี">{(['user', 'owner'] as const).map(value => <button type="button" key={value} aria-pressed={field.value === value} className={field.value === value ? 'selected' : ''} onClick={() => field.onChange(value)} disabled={!!busy}>{value === 'user' ? <Users size={20} /> : <ShieldCheck size={20} />}<span><strong>{value === 'user' ? 'ผู้เล่น' : 'เจ้าของสนาม'}</strong><small>{value === 'user' ? 'หาเพื่อนเตะบอล' : 'จัดการสนามของคุณ'}</small></span></button>)}</div><FormMessage /></FormItem>} />}
          <motion.div variants={itemVariants}><FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>อีเมล</FormLabel><FormControl><Input type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" disabled={!!busy} {...field} /></FormControl><FormMessage /></FormItem>} /></motion.div>
          <motion.div variants={itemVariants}><FormField control={form.control} name="password" render={({ field }) => <FormItem><FormLabel>รหัสผ่าน</FormLabel><div className="kh-auth-password"><FormControl><Input type={visible ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} placeholder={signup ? 'อย่างน้อย 8 ตัวอักษร' : 'กรอกรหัสผ่านของคุณ'} disabled={!!busy} {...field} /></FormControl><button type="button" disabled={!!busy} onClick={() => setVisible(value => !value)} aria-label={visible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button></div><FormMessage /></FormItem>} /></motion.div>
          {!signup && <FormField control={form.control} name="rememberMe" render={({ field }) => <FormItem className="kh-auth-remember"><FormControl><Checkbox checked={field.value} onCheckedChange={value => field.onChange(value === true)} disabled={!!busy} /></FormControl><FormLabel>จดจำการเข้าสู่ระบบ 7 วัน</FormLabel></FormItem>} />}
          {error && <p className="kh-auth-error" role="alert">{error}</p>}
          <motion.div variants={itemVariants}><Button type="submit" disabled={!!busy} className="kh-auth-submit">{busy === 'email' ? <Loader2 className="animate-spin" size={19} /> : <ArrowRight size={19} />}{busy === 'email' ? 'กำลังดำเนินการ…' : signup ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'}</Button></motion.div>
        </form></Form>
        <motion.div variants={itemVariants} className="kh-auth-social"><div className="kh-auth-divider"><span>หรือใช้บัญชีของคุณ</span></div>{googleClientId ? <GoogleSignIn clientId={googleClientId} disabled={!!busy} onCredential={google} /> : <><Button type="button" variant="outline" className="kh-auth-google-unavailable" disabled>ดำเนินการต่อด้วย Google</Button>{googleNote && <p className="kh-auth-note" role="status">{googleNote}</p>}</>}{busy === 'google' && <p className="kh-auth-note" role="status">กำลังยืนยันบัญชี Google…</p>}<Button type="button" variant="outline" className="kh-auth-facebook" disabled={!!busy || !facebookReady} onClick={social}>{busy === 'facebook' ? <Loader2 className="animate-spin" size={20} /> : <span className="kh-facebook-mark" aria-hidden="true">f</span>}{busy === 'facebook' ? 'กำลังเชื่อมต่อ…' : 'ดำเนินการต่อด้วย Facebook'}</Button>{facebookNote && <p className="kh-auth-note" role="status">{facebookNote}</p>}</motion.div>
        <motion.p variants={itemVariants} className="kh-auth-switch">{signup ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'} <Link to={createAccountHref}>{signup ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</Link></motion.p>
      </motion.div>
      <p className="kh-auth-footer">KICKHUB · FIND YOUR PEOPLE. PLAY YOUR GAME.</p>
    </section>
    <aside className="kh-auth-art" aria-label="บรรยากาศฟุตบอล"><img src={imageSrc} alt={imageAlt} /><div className="kh-auth-art-shade" /><div className="kh-auth-art-caption"><span>MORE THAN A GAME</span><h2>มาเดี่ยวก็ได้<br />กลับไปมีทีม</h2><p>พื้นที่ของคนรักฟุตบอล และเพื่อนร่วมเกมคนต่อไปของคุณ</p></div></aside>
  </main>;
}
