import { useEffect, useState } from 'react';
import { Flag } from 'lucide-react';
export function safeWebLink(value?: string) {
  try { const url = new URL(value || ''); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
export { facilityLabels } from './facilities';
export default function FieldPhoto({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return safeWebLink(src) && !failed ? <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} /> : <div className="field-photo-placeholder"><Flag size={36} /><span>เจอกันที่สนาม</span></div>;
}
