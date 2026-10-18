import icon from '../assets/brand/kickhub-icon.webp';
import wordmark from '../assets/brand/kickhub-wordmark.png';
import wordmarkOnDark from '../assets/brand/kickhub-wordmark-on-dark.png';
import './brand.css';

// App icon plus the KICKHUB wordmark. Both wordmark colourways load; CSS shows the one that suits the background.
// The wrapping link carries the accessible name, so the images stay decorative.
export default function BrandMark() {
  return <>
    <img className="kh-brand-icon" src={icon} alt="" width="40" height="40" />
    <span className="kh-brand-word">
      <img className="kh-brand-word-light" src={wordmark} alt="" width="609" height="83" />
      <img className="kh-brand-word-dark" src={wordmarkOnDark} alt="" width="609" height="83" />
    </span>
  </>;
}
