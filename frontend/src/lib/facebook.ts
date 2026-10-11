type FacebookSDK = {
  init: (options: { appId: string; version: string; cookie: boolean; xfbml: boolean }) => void;
  login: (callback: (result: { authResponse?: { accessToken: string } }) => void, options: { scope: string; auth_type: string }) => void;
};
declare global { interface Window { FB?: FacebookSDK } }
let loading: Promise<FacebookSDK> | undefined;
export function loadFacebook(appId: string, version: string) {
  if (!loading) loading = new Promise<FacebookSDK>((resolve, reject) => {
    const init = () => { if (!window.FB) { reject(new Error('โหลด Facebook ไม่สำเร็จ')); return; } window.FB.init({ appId, version, cookie: false, xfbml: false }); resolve(window.FB); };
    if (window.FB) { init(); return; }
    const script = document.createElement('script');
    script.id = 'kickhub-facebook-sdk'; script.src = 'https://connect.facebook.net/th_TH/sdk.js'; script.async = true;
    const timer = window.setTimeout(() => { script.remove(); reject(new Error('โหลด Facebook ไม่สำเร็จ กรุณาลองใหม่')); }, 15000);
    script.onload = () => { clearTimeout(timer); init(); };
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('โหลด Facebook ไม่สำเร็จ กรุณาลองใหม่')); };
    document.head.appendChild(script);
  }).catch(error => { loading = undefined; throw error; });
  return loading;
}
export function facebookLogin() {
  return new Promise<string>((resolve, reject) => {
    if (!window.FB) { reject(new Error('Facebook ยังไม่พร้อม กรุณาลองใหม่')); return; }
    // Called directly from the button click so the browser permits the popup.
    window.FB.login(result => { if (result.authResponse?.accessToken) resolve(result.authResponse.accessToken); else reject(new Error('ยกเลิก Facebook Login คุณสามารถลองใหม่ได้')); }, { scope: 'public_profile,email', auth_type: 'rerequest' });
  });
}
