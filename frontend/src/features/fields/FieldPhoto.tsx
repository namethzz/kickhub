import { useEffect, useState } from 'react';
const defaultFieldPhoto = `${import.meta.env.BASE_URL}field.jpg`;
export function safeWebLink(value?: string) {
  try { const url = new URL(value || ''); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
export { facilityLabels } from './facilities';
export default function FieldPhoto({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const photo = safeWebLink(src) && !failed ? src : defaultFieldPhoto;
  const fallback = photo === defaultFieldPhoto;
  return <img src={photo} alt={fallback ? 'ภาพประกอบสนามฟุตบอล' : name} loading="lazy" decoding="async" onError={photo === defaultFieldPhoto ? undefined : () => setFailed(true)} />;
}
