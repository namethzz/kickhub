import { useState, type ReactNode } from 'react';
import { assetUrl } from '@/lib/profile-image';
import './party-cover.css';

// Minimal top-down pitch drawn in lines; shown when a party has no cover photo (or it fails to load).
function PitchFallback() {
  return <div className="party-card-media-fallback" aria-hidden="true">
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="22" y="18" width="276" height="144" rx="6" />
      <path d="M160 18v144" />
      <circle cx="160" cy="90" r="26" />
      <circle cx="160" cy="90" r="2.5" fill="currentColor" />
      <path d="M22 54h42v72H22" />
      <path d="M298 54h-42v72h42" />
      <path d="M22 76h18v28H22" />
      <path d="M298 76h-18v28h18" />
    </svg>
  </div>;
}

/** 16:9 media area for a party card: the cover photo, or a pitch drawing. Children are overlaid on top (badges, chips). */
export function PartyCover({ src, children }: { src?: string; children?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  const url = assetUrl(src);
  return <div className="party-card-media">
    {url && !failed
      ? <img src={url} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      : <PitchFallback />}
    {children}
  </div>;
}
