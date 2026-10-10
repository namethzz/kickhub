import { ParallaxComponent } from '@/components/ui/parallax-scrolling';

// Render inside the existing app's Router, like the production home page.
export default function ParallaxDemo() {
  return <>
    <ParallaxComponent />
    <div className="osmo-credits">
      <p className="osmo-credits__p">Parallax resource by <a target="_blank" rel="noopener noreferrer" href="https://www.osmo.supply/" className="osmo-credits__p-a">Osmo</a></p>
    </div>
  </>;
}
