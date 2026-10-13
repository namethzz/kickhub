import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { Lock, X } from 'lucide-react';
import { api, type PublicPlayer } from '@/lib/api';
import { positions } from '../parties/party-model';
import { ProfileAvatar, ProfileCover } from './ProfileMedia';
import './profile-editor.css';

const LIMITS = { name: 100, area: 100, bio: 600 } as const;
const levelOptions = [
  { value: 'beginner', title: 'มือใหม่', hint: 'เพิ่งเริ่มเตะ ยังไม่คล่อง' },
  { value: 'casual', title: 'เตะเพื่อออกกำลังกาย', hint: 'เล่นสนุก ไม่เน้นแข่งขัน' },
  { value: 'experienced', title: 'มีประสบการณ์', hint: 'เล่นประจำ ฟอร์มดี' },
];
const positionOptions = [{ code: '', name: 'ทุกตำแหน่ง' }, ...positions];

type Values = { name: string; area: string; bio: string; preferred_position: string; level: string };
const valuesOf = (profile: PublicPlayer): Values => ({ name: profile.name || '', area: profile.area || '', bio: profile.bio || '', preferred_position: profile.preferred_position || '', level: profile.level || 'casual' });
const trimmed = (values: Values): Values => ({ ...values, name: values.name.trim(), area: values.area.trim(), bio: values.bio.trim() });

type Props = {
  profile: PublicPlayer;
  onClose: () => void;
  onSaved: (saved: PublicPlayer) => void;
  /** Photos are saved the moment they are picked, so the page must learn about them immediately. */
  onPhotos: (saved: PublicPlayer, message: string) => void;
};

function Counter({ value, max, id }: { value: string; max: number; id: string }) {
  const near = value.length >= max * 0.9;
  return <span id={id} className={near ? 'pe-count pe-near' : 'pe-count'} aria-live="off">{value.length}/{max}</span>;
}

/** Edit-profile dialog: full screen on phones, centered card on larger screens. */
export default function ProfileEditor({ profile, onClose, onSaved, onPhotos }: Props) {
  const [initial] = useState(() => valuesOf(profile));
  const [values, setValues] = useState<Values>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [photoNote, setPhotoNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [touchedName, setTouchedName] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const keepEditing = useRef<HTMLButtonElement>(null);
  const pressedBackdrop = useRef(false);

  const current = trimmed(values);
  const dirty = (Object.keys(initial) as (keyof Values)[]).some(key => current[key] !== initial[key].trim());
  const nameMissing = !current.name;
  const set = <K extends keyof Values>(key: K, value: Values[K]) => { setValues(previous => ({ ...previous, [key]: value })); setError(''); };

  // Open as a modal: the browser traps focus, makes the page behind inert and handles Escape for us.
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement as HTMLElement | null;
    if (element && !element.open) element.showModal();
    document.documentElement.classList.add('pe-lock');
    title.current?.focus();
    return () => {
      document.documentElement.classList.remove('pe-lock');
      if (element?.open) element.close();
      opener?.focus?.();
    };
  }, []);
  useEffect(() => { if (confirming) keepEditing.current?.focus(); }, [confirming]);

  const requestClose = () => {
    if (saving) return;
    if (dirty) setConfirming(true); else onClose();
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setTouchedName(true);
    if (nameMissing || !dirty) return;
    setSaving(true); setError('');
    try {
      const saved = await api<PublicPlayer>('/api/v2/me', { method: 'PATCH', body: JSON.stringify(current) });
      onSaved(saved);
    } catch (problem) {
      setError((problem as Error).message);
      setSaving(false);
    }
  };

  const media = {
    profile, own: true,
    onProblem: setPhotoError,
    onStatus: setPhotoNote,
    onUpdated: (saved: PublicPlayer, message: string) => { onPhotos(saved, message); setPhotoNote(message); },
  };

  const onBackdropDown = (event: ReactPointerEvent<HTMLDialogElement>) => { pressedBackdrop.current = event.target === event.currentTarget; };
  const onBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => { if (pressedBackdrop.current && event.target === event.currentTarget) requestClose(); pressedBackdrop.current = false; };

  return <dialog ref={dialog} className="profile-editor" aria-labelledby="pe-title" onCancel={event => { event.preventDefault(); requestClose(); }} onPointerDown={onBackdropDown} onClick={onBackdropClick}>
    <form onSubmit={save} noValidate>
      <header className="pe-head">
        <h2 id="pe-title" className="pe-title" tabIndex={-1} ref={title}>แก้ไขโปรไฟล์</h2>
        <button type="button" className="pe-close" aria-label="ปิด" onClick={requestClose}><X size={20} aria-hidden="true" /></button>
      </header>

      <div className="pe-body">
        <section className="pe-photos" aria-label="รูปโปรไฟล์และรูปพื้นหลัง">
          <ProfileCover {...media} />
          <ProfileAvatar {...media} />
          <p className="pe-hint" role="status">{photoNote || 'รูปจะบันทึกทันทีที่เลือก ไม่ต้องกดบันทึกอีกครั้ง'}</p>
          {photoError && <p className="party-error pe-photo-error" role="alert">{photoError}</p>}
        </section>

        <section className="pe-section">
          <div className="pe-field">
            <label className="pe-label" htmlFor="pe-name">ชื่อที่แสดง</label>
            <input id="pe-name" className="pe-input" value={values.name} maxLength={LIMITS.name} autoComplete="name" required aria-required="true" aria-invalid={touchedName && nameMissing} aria-describedby="pe-name-meta" onBlur={() => setTouchedName(true)} onChange={event => set('name', event.target.value)} />
            <div className="pe-meta" id="pe-name-meta"><span className="pe-error-text" role={touchedName && nameMissing ? 'alert' : undefined}>{touchedName && nameMissing ? 'กรุณากรอกชื่อ' : ''}</span><Counter id="pe-name-count" value={values.name} max={LIMITS.name} /></div>
          </div>

          <div className="pe-field">
            <label className="pe-label" htmlFor="pe-area">พื้นที่ที่เตะประจำ</label>
            <input id="pe-area" className="pe-input" value={values.area} maxLength={LIMITS.area} placeholder="เช่น ลาดพร้าว หรืออารีย์" autoComplete="address-level2" aria-describedby="pe-area-meta" onChange={event => set('area', event.target.value)} />
            <div className="pe-meta" id="pe-area-meta"><span /><Counter id="pe-area-count" value={values.area} max={LIMITS.area} /></div>
          </div>

          <div className="pe-field">
            <label className="pe-label" htmlFor="pe-bio">แนะนำตัว</label>
            <textarea id="pe-bio" className="pe-input pe-textarea" rows={4} value={values.bio} maxLength={LIMITS.bio} placeholder="เล่าให้เพื่อนร่วมทีมรู้จักคุณ เช่น ชอบเล่นตำแหน่งไหน เตะวันไหนว่าง" aria-describedby="pe-bio-meta" onChange={event => set('bio', event.target.value)} />
            <div className="pe-meta" id="pe-bio-meta"><span /><Counter id="pe-bio-count" value={values.bio} max={LIMITS.bio} /></div>
          </div>
        </section>

        <section className="pe-section">
          <fieldset className="pe-field pe-fieldset">
            <legend className="pe-label">ตำแหน่งที่ชอบ</legend>
            <div className="pe-chips">
              {positionOptions.map(option => <label key={option.code || 'any'} className="pe-chip">
                <input type="radio" name="preferred_position" value={option.code} checked={values.preferred_position === option.code} onChange={() => set('preferred_position', option.code)} />
                <span className="pe-chip-face">{option.name}</span>
              </label>)}
            </div>
          </fieldset>

          <fieldset className="pe-field pe-fieldset">
            <legend className="pe-label">ระดับการเล่น</legend>
            <div className="pe-levels">
              {levelOptions.map(option => <label key={option.value} className="pe-level">
                <input type="radio" name="level" value={option.value} checked={values.level === option.value} onChange={() => set('level', option.value)} />
                <span className="pe-level-face"><strong>{option.title}</strong><small>{option.hint}</small></span>
              </label>)}
            </div>
          </fieldset>
        </section>

        <section className="pe-section">
          <div className="pe-field">
            <label className="pe-label" htmlFor="pe-email">อีเมล</label>
            <div className="pe-locked"><Lock size={16} aria-hidden="true" /><input id="pe-email" className="pe-input" value={profile.email || ''} readOnly aria-describedby="pe-email-hint" /></div>
            <p className="pe-hint" id="pe-email-hint">ใช้เข้าสู่ระบบ คนอื่นมองไม่เห็น และเปลี่ยนไม่ได้ในตอนนี้</p>
          </div>
        </section>
      </div>

      <footer className="pe-foot">
        {error && <p className="party-error pe-save-error" role="alert">{error}</p>}
        {confirming
          ? <div className="pe-confirm" role="alertdialog" aria-labelledby="pe-confirm-text">
              <p id="pe-confirm-text">ทิ้งการแก้ไขที่ยังไม่บันทึกไหม</p>
              <div className="pe-actions">
                <button type="button" className="pe-btn pe-btn-danger" onClick={onClose}>ทิ้งการแก้ไข</button>
                <button type="button" className="pe-btn pe-btn-ghost" ref={keepEditing} onClick={() => setConfirming(false)}>แก้ไขต่อ</button>
              </div>
            </div>
          : <div className="pe-actions">
              <button type="button" className="pe-btn pe-btn-ghost" onClick={requestClose} disabled={saving}>ยกเลิก</button>
              <button type="submit" className="pe-btn pe-btn-primary" disabled={!dirty || saving} aria-disabled={!dirty || saving}>{saving ? 'กำลังบันทึก…' : 'บันทึก'}</button>
            </div>}
      </footer>
    </form>
  </dialog>;
}
