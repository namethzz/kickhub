// Minimal top-down football pitch mark used next to the "kickhub" wordmark.
export default function BrandMark() {
  return (
    <span className="kh-brand-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M12 5v14" />
        <circle cx="12" cy="12" r="2.9" />
        <path d="M2.5 9h3.6v6H2.5" />
        <path d="M21.5 9h-3.6v6h3.6" />
      </svg>
    </span>
  );
}
