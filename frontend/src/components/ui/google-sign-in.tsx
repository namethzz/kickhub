import { useEffect, useRef, useState } from 'react';

type Identity = {
  initialize: (options: { client_id: string; callback: (response: { credential: string }) => void; auto_select: boolean; ux_mode: string }) => void;
  renderButton: (element: HTMLElement, options: { type: string; theme: string; size: string; text: string; shape: string; width: number; locale: string }) => void;
};
declare global { interface Window { google?: { accounts: { id: Identity } } } }
let loading: Promise<Identity> | undefined;
function loadGoogle() {
  if (!loading) loading = new Promise<Identity>((resolve, reject) => {
    if (window.google?.accounts.id) { resolve(window.google.accounts.id); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client?hl=th'; script.async = true;
    const timer = window.setTimeout(() => { script.remove(); reject(new Error('โหลด Google ไม่สำเร็จ กรุณารีเฟรชแล้วลองใหม่')); }, 15000);
    script.onload = () => { clearTimeout(timer); if (window.google?.accounts.id) resolve(window.google.accounts.id); else reject(new Error('โหลด Google ไม่สำเร็จ')); };
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('โหลด Google ไม่สำเร็จ กรุณารีเฟรชแล้วลองใหม่')); };
    document.head.appendChild(script);
  }).catch(error => { loading = undefined; throw error; });
  return loading;
}

/** Render Google's official button so both popup login and Google branding are supported. */
export function GoogleSignIn({ clientId, disabled, onCredential }: { clientId: string; disabled: boolean; onCredential: (credential: string) => void }) {
  const element = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const blocked = useRef(disabled);
  callback.current = onCredential; blocked.current = disabled;
  const [note, setNote] = useState('กำลังเตรียม Google Login…');
  useEffect(() => {
    let active = true;
    let observer: ResizeObserver | undefined;
    const host = element.current;
    loadGoogle().then(identity => {
      if (!active || !host) return;
      identity.initialize({ client_id: clientId, callback: response => { if (active && !blocked.current && response.credential) callback.current(response.credential); }, auto_select: false, ux_mode: 'popup' });
      let previousWidth = 0;
      const render = () => {
        const width = Math.min(400, Math.floor(host.getBoundingClientRect().width));
        if (width < 1 || width === previousWidth) return;
        previousWidth = width; host.replaceChildren();
        identity.renderButton(host, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width, locale: 'th' });
      };
      render(); observer = new ResizeObserver(render); observer.observe(host); setNote('');
    }).catch(error => { if (active) setNote((error as Error).message); });
    return () => { active = false; observer?.disconnect(); host?.replaceChildren(); };
  }, [clientId]);
  return <div className="kh-auth-google-wrap"><div className="kh-auth-google" ref={element} inert={disabled} aria-busy={disabled} />{note && <p className="kh-auth-note" role="status">{note}</p>}</div>;
}
