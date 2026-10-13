import { useEffect, useState } from 'react';

const textInput = 'textarea, input:not([type]), input[type="text"], input[type="search"], input[type="email"], input[type="password"], input[type="tel"], input[type="url"], input[type="number"], [contenteditable="true"]';

// iOS keeps the layout viewport tall when the keyboard shrinks the visual viewport.
export default function useSoftKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    let closedHeight = window.innerHeight;
    let width = window.innerWidth;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (window.innerWidth !== width) {
        width = window.innerWidth;
        closedHeight = window.innerHeight;
      }
      const editing = document.activeElement?.matches(textInput);
      if (!editing) closedHeight = window.innerHeight;
      const covered = Math.max(closedHeight, window.innerHeight) - viewport.height;
      setOpen(Boolean(editing && viewport.scale === 1 && covered > 150));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    viewport.addEventListener('resize', schedule);
    window.addEventListener('resize', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    update();
    return () => {
      window.cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
    };
  }, []);
  return open;
}
