import { Users, ShieldCheck, Check } from 'lucide-react';
import { modeInfo, type PartyMode } from './party-model';
export function ModePicker({ value, onChange }: { value: PartyMode; onChange: (mode: PartyMode) => void }) {
  return <div className="party-modes" role="group" aria-label="เลือกโหมดปาร์ตี้">{(['flexible', 'fixed'] as const).map(mode => {
    const Icon = mode === 'flexible' ? Users : ShieldCheck;
    return <button key={mode} className={value === mode ? 'selected' : ''} aria-pressed={value === mode} onClick={() => onChange(mode)} type="button"><span className="party-mode-icon"><Icon size={23} /></span><strong>{modeInfo[mode].title}</strong><small>{modeInfo[mode].subtitle}</small>{value === mode && <Check size={16} className="party-mode-check" />}</button>;
  })}</div>;
}
