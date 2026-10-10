import { useEffect, useState } from 'react';
const defaultFieldPhoto = `${import.meta.env.BASE_URL}สนามของเรา.png`;
export function safeWebLink(value?: string) {
  try { const url = new URL(value || ''); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
export { facilityLabels } from './facilities';
export default function FieldPhoto({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const photo = safeWebLink(src) && !failed ? src : defaultFieldPhoto;
  return <img src={photo} alt={name} loading="lazy" onError={photo === defaultFieldPhoto ? undefined : () => setFailed(true)} />;
}
