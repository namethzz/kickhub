import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Camera, ImagePlus, Trash2, Upload } from 'lucide-react';
import type { PublicPlayer } from '@/lib/api';
import { ACCEPTED_TYPES, assetUrl, importSocialPhoto, prepareImage, removeImage, uploadImage, type ImageKind, type SocialProvider } from '@/lib/profile-image';
import './profile-media.css';

type MenuItem = { label: string; icon?: ReactNode; danger?: boolean; onSelect: () => void };
type Props = { profile: PublicPlayer; own: boolean; onUpdated: (saved: PublicPlayer, message: string) => void; onProblem: (message: string) => void; onStatus: (message: string) => void };

const providerNames: Record<SocialProvider, string> = { google: 'Google', facebook: 'Facebook' };

/** A small trigger button that opens an accessible popover menu and closes on Escape or an outside click. */
function MediaMenu({ trigger, label, items, busy, className }: { trigger: ReactNode; label: string; items: MenuItem[]; busy: boolean; className: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); button.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <div className={`media-menu ${className}`} ref={root}>
    <button ref={button} type="button" className="media-trigger" aria-label={label} aria-haspopup="menu" aria-expanded={open} disabled={busy} onClick={() => setOpen(value => !value)}>{trigger}</button>
    {open && <div className="media-popover" role="menu" aria-label={label}>{items.map(item => <button key={item.label} type="button" role="menuitem" className={item.danger ? 'media-danger' : undefined} onClick={() => { setOpen(false); item.onSelect(); }}>{item.icon}{item.label}</button>)}</div>}
  </div>;
}

/** Shared upload/remove flow for one image kind. Photo problems surface as messages and never throw. */
function useImageActions(kind: ImageKind, { onUpdated, onProblem, onStatus }: Pick<Props, 'onUpdated' | 'onProblem' | 'onStatus'>) {
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const run = async (task: () => Promise<PublicPlayer>, message: string, working: string) => {
    if (busy) return;
    setBusy(true); onProblem(''); onStatus(working);
    try { onUpdated(await task(), message); }
    catch (error) { onStatus(''); onProblem((error as Error).message); }
    finally { setBusy(false); }
  };
  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void run(async () => uploadImage(kind, await prepareImage(file, kind)), kind === 'avatar' ? 'เปลี่ยนรูปโปรไฟล์แล้ว' : 'เปลี่ยนรูปพื้นหลังแล้ว', 'กำลังอัปโหลดรูป…');
  };
  const picker = <input ref={input} type="file" accept={ACCEPTED_TYPES.join(',')} hidden onChange={choose} />;
  return { busy, picker, pick: () => input.current?.click(), run };
}

export function ProfileAvatar({ profile, own, ...handlers }: Props) {
  const { busy, picker, pick, run } = useImageActions('avatar', handlers);
  const src = assetUrl(profile.avatar_url);
  const providers = (['google', 'facebook'] as const).filter(provider => profile.social_photos?.[provider]);
  const items: MenuItem[] = [
    { label: 'อัปโหลดรูปใหม่', icon: <Upload size={16} aria-hidden="true" />, onSelect: pick },
    ...providers.map(provider => ({ label: `ใช้รูปจาก ${providerNames[provider]}`, icon: <Camera size={16} aria-hidden="true" />, onSelect: () => void run(() => importSocialPhoto(provider), `ใช้รูปจาก ${providerNames[provider]} แล้ว`, `กำลังดึงรูปจาก ${providerNames[provider]}…`) })),
    ...(src ? [{ label: 'ลบรูปโปรไฟล์', icon: <Trash2 size={16} aria-hidden="true" />, danger: true, onSelect: () => void run(() => removeImage('avatar'), 'ลบรูปโปรไฟล์แล้ว', 'กำลังลบรูป…') }] : []),
  ];
  return <div className="player-avatar-wrap">
    <div className="player-avatar">{src ? <img className="player-avatar-img" src={src} alt={`รูปโปรไฟล์ของ ${profile.name}`} /> : profile.name.slice(0, 1)}</div>
    {own && <><MediaMenu className="media-menu-avatar" label="เปลี่ยนรูปโปรไฟล์" busy={busy} items={items} trigger={<Camera size={16} aria-hidden="true" />} />{picker}</>}
  </div>;
}

export function ProfileCover({ profile, own, ...handlers }: Props) {
  const { busy, picker, pick, run } = useImageActions('cover', handlers);
  const src = assetUrl(profile.cover_url);
  const items: MenuItem[] = [
    { label: 'อัปโหลดรูปพื้นหลัง', icon: <Upload size={16} aria-hidden="true" />, onSelect: pick },
    ...(src ? [{ label: 'ลบรูปพื้นหลัง', icon: <Trash2 size={16} aria-hidden="true" />, danger: true, onSelect: () => void run(() => removeImage('cover'), 'ลบรูปพื้นหลังแล้ว', 'กำลังลบรูป…') }] : []),
  ];
  return <div className="player-cover">
    {src ? <img className="player-cover-img" src={src} alt="" /> : <span>MEET YOUR NEXT TEAMMATE</span>}
    {own && <><MediaMenu className="media-menu-cover" label="เปลี่ยนรูปพื้นหลัง" busy={busy} items={items} trigger={<><ImagePlus size={16} aria-hidden="true" /><span>เปลี่ยนพื้นหลัง</span></>} />{picker}</>}
  </div>;
}
