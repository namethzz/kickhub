import kickPlayer from '../assets/kick-player.png';

// Line-art footballer mid-kick, tinted with the brand lime via a CSS mask.
export default function BrandMark() {
  const mask = `url(${kickPlayer})`;
  return (
    <span className="kh-brand-icon" aria-hidden="true">
      <span className="kh-brand-icon-art" style={{ WebkitMaskImage: mask, maskImage: mask }} />
    </span>
  );
}
