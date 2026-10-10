import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { FiArrowDown, FiArrowUpRight, FiCheck } from 'react-icons/fi';
import { TbBallFootball } from 'react-icons/tb';
import './parallax-scrolling.css';

// Adapted from the supplied GSAP/Lenis layered parallax component.
// One original image, plus independent atmosphere, content and foreground layers.
export function ParallaxComponent({ targetRef }) {
  const parallaxRef = useRef(null);
  const lenisRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add({
      desktop: '(min-width: 1025px) and (pointer: fine)',
      mobile: '(max-width: 1024px), (pointer: coarse)',
      reduced: '(prefers-reduced-motion: reduce)',
    }, context => {
      const { desktop, reduced } = context.conditions;
      if (reduced) return;
      const root = parallaxRef.current;
      const layers = root.querySelector('[data-parallax-layers]');
      const timeline = gsap.timeline({ scrollTrigger: {
        trigger: root, start: 'top top', end: 'bottom top',
        scrub: true, invalidateOnRefresh: true,
      } });
      const offsets = desktop ? [22, 16, 10, 5] : [8, 6, 3, 1];
      offsets.forEach((yPercent, index) => timeline.to(
        layers.querySelectorAll(`[data-parallax-layer="${index + 1}"]`),
        { yPercent, ease: 'none' }, 0,
      ));

      // Keep touch scrolling native on iPhone/iPad. Only desktop wheel input is smoothed.
      let lenis;
      let tick;
      if (desktop) {
        lenis = new Lenis({ smoothWheel: true, syncTouch: false, duration: 0.9 });
        lenisRef.current = lenis;
        lenis.on('scroll', ScrollTrigger.update);
        tick = time => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
      }
      return () => {
        if (tick) gsap.ticker.remove(tick);
        if (lenis) {
          lenis.off('scroll', ScrollTrigger.update);
          lenis.destroy();
          lenisRef.current = null;
        }
        // matchMedia reverts only this component's animation/ScrollTrigger instances.
      };
    }, parallaxRef);
    return () => media.revert();
  }, []);

  const findMatch = () => {
    const target = targetRef?.current;
    if (!target) return;
    if (lenisRef.current) lenisRef.current.scrollTo(target, { offset: -24 });
    else target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    target.querySelector('input')?.focus({ preventScroll: true });
  };

  return <section className="kh-parallax" ref={parallaxRef} aria-labelledby="kh-hero-title">
    <div className="kh-parallax__layers" data-parallax-layers>
      <div className="kh-parallax__photo" data-parallax-layer="1" aria-hidden="true" />
      <div className="kh-parallax__atmosphere" data-parallax-layer="2" aria-hidden="true" />
      <div className="kh-parallax__shade" aria-hidden="true" />
      <div className="kh-parallax__content" data-parallax-layer="3">
        <span className="kh-parallax__eyebrow"><i /> FIND YOUR PEOPLE. PLAY YOUR GAME.</span>
        <span className="kh-parallax__wordmark" aria-hidden="true">KICK<span>HUB.</span></span>
        <h1 id="kh-hero-title">มาเดี่ยวก็มีทีม<span>ลงสนามไปด้วยกัน.</span></h1>
        <p>ไม่ต้องรอเพื่อนให้ครบ แค่เลือกแมตช์ที่ใช่<br className="kh-parallax__break" /> แล้วเจอเพื่อนใหม่ในเกมที่คุณรัก</p>
        <div className="kh-parallax__actions"><button className="kh-button kh-primary" onClick={findMatch}>หาเพื่อนเตะบอล <FiArrowUpRight /></button><Link className="kh-button kh-ghost" to="/field">ค้นหาสนาม <TbBallFootball /></Link></div>
        <div className="kh-parallax__benefits"><span><FiCheck /> มาเดี่ยวได้</span><span><FiCheck /> ทุกระดับฝีเท้า</span><span><FiCheck /> เลือกเวลาที่ใช่</span></div>
      </div>
      <div className="kh-parallax__foreground" data-parallax-layer="4" aria-hidden="true"><span>01 / THE GAME BRINGS US TOGETHER</span><TbBallFootball /></div>
    </div>
    <div className="kh-parallax__bottom"><span><i /> YOUR NEXT GAME STARTS HERE</span><button onClick={findMatch} aria-label="เลื่อนลงเพื่อเลือกแมตช์">เลือกแมตช์ <FiArrowDown /></button></div>
  </section>;
}
