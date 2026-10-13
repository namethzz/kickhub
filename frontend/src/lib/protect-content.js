// Discourages selecting / copying page content.
// Form fields stay fully usable (typing, selecting, copy/paste inside inputs).
// Note: this is a deterrent only — it cannot stop determined users
// (view-source, screenshots, devtools, reader mode, etc.).

const EDITABLE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

const isEditable = target =>
  target instanceof Element && Boolean(target.closest(EDITABLE));

export function protectContent() {
  if (typeof document === 'undefined') return;

  const block = event => {
    if (!isEditable(event.target)) event.preventDefault();
  };

  document.addEventListener('copy', block);
  document.addEventListener('cut', block);
  document.addEventListener('selectstart', block);
  // Stops dragging images/links out of the page (and drag-selecting text).
  document.addEventListener('dragstart', block);
}
