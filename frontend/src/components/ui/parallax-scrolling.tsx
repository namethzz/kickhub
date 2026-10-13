'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { ArrowDown, ArrowUpRight, Check, Goal } from 'lucide-react';
import './parallax-scrolling.css';

type ParallaxProps = {
  imageSrc?: string;
  targetRef?: RefObject<HTMLElement | null>;
};

// Same four-layer timeline and DOM structure as the supplied component.
// The uploaded photo is a single flattened image: extra layers are CSS atmosphere
// and pitch graphics, rather than claiming separate photographic cutouts exist.
export function ParallaxComponent({ imageSrc = '/hero-stadium-v2.png', targetRef }: ParallaxProps = {}) {
  const parallaxRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const root = parallaxRef.current;
    const triggerElement = root?.querySelector<HTMLElement>('[data-parallax-layers]');
    if (!root || !triggerElement) return;
    const media = gsap.matchMedia();
    media.add({
      reduce: '(prefers-reduced-motion: reduce)',
      normal: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 1025px) and (pointer: fine)',
    }, context => {
      if (context.conditions?.reduce) return;
      const tl = gsap.timeline({ scrollTrigger: {
        trigger: triggerElement,
        start: '0% 0%',
        end: '100% 0%',
        scrub: 0,
        invalidateOnRefresh: true,
      } });
      const layers = [
        { layer: '1', yPercent: 70 },
        { layer: '2', yPercent: 55 },
        { layer: '3', yPercent: 40 },
        { layer: '4', yPercent: 10 },
      ];
      layers.forEach((layerObj, idx) => {
        tl.to(triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
          { yPercent: layerObj.yPercent, ease: 'none' }, idx === 0 ? undefined : '<');
      });

      // Native touch scrolling on iPhone/iPad; Lenis only smooths desktop wheel input.
      let lenis: Lenis | undefined;
      let tick: ((time: number) => void) | undefined;
      if (context.conditions?.desktop) {
        lenis = new Lenis({ smoothWheel: true, syncTouch: false });
        lenisRef.current = lenis;
        lenis.on('scroll', ScrollTrigger.update);
        tick = time => lenis?.raf(time * 1000);
        gsap.ticker.add(tick);
      }
      return () => {
        if (tick) gsap.ticker.remove(tick);
        lenis?.off('scroll', ScrollTrigger.update);
        lenis?.destroy();
        lenisRef.current = null;
      };
    }, root);
    // Reverts this Hero's timeline and trigger only, including StrictMode remounts.
    return () => media.revert();
  }, []);

  const findMatch = () => {
    const target = targetRef?.current;
    if (!target) return;
    if (lenisRef.current) lenisRef.current.scrollTo(target, { offset: -24 });
    else target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    // Let touch users choose when to open the keyboard after scrolling to matches.
    if (window.matchMedia('(min-width: 1025px) and (pointer: fine)').matches) {
      target.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
    }
  };

  return (
    <div className="parallax" ref={parallaxRef}>
      <section className="parallax__header" aria-labelledby="kh-hero-title">
        <div className="parallax__visuals">
          <div className="parallax__black-line-overflow" aria-hidden="true" />
          <div data-parallax-layers className="parallax__layers">
            <div data-parallax-layer="1" className="parallax__photo-layer" aria-hidden="true">
              <img src={imageSrc} loading="eager" fetchPriority="high" width="1672" height="941" alt="" className="parallax__layer-img" />
            </div>
            <div data-parallax-layer="2" className="parallax__light-layer" aria-hidden="true" />
            <div className="parallax__shade" aria-hidden="true" />
            <div data-parallax-layer="3" className="parallax__layer-title">
              <span className="parallax__eyebrow"><i /> FIND YOUR PEOPLE. PLAY YOUR GAME.</span>
              <h1 id="kh-hero-title" className="parallax__title">KICK<span>HUB.</span></h1>
              <p className="parallax__subtitle">มาเดี่ยวก็มีทีม<span>ลงสนามไปด้วยกัน.</span></p>
              <p className="parallax__description">ไม่ต้องรอเพื่อนให้ครบ เลือกแมตช์ที่ใช่<br />แล้วเจอเพื่อนใหม่ในเกมที่คุณรัก</p>
              <div className="parallax__actions">
                {targetRef ? <button className="kh-button kh-primary" onClick={findMatch}>หาเพื่อนเตะบอล <ArrowUpRight size={18} /></button> : <Link className="kh-button kh-primary" to="/team">หาเพื่อนเตะบอล <ArrowUpRight size={18} /></Link>}
                <Link className="kh-button kh-ghost" to="/field">ค้นหาสนาม <Goal size={18} /></Link>
              </div>
              <div className="parallax__benefits"><span><Check /> มาเดี่ยวได้</span><span><Check /> ทุกระดับฝีเท้า</span><span><Check /> เลือกเวลาเอง</span></div>
            </div>
            <div data-parallax-layer="4" className="parallax__pitch-layer" aria-hidden="true"><div className="parallax__pitch-line" /><span>THE GAME BRINGS US TOGETHER</span></div>
          </div>
          <div className="parallax__fade" aria-hidden="true" />
        </div>
      </section>
      <section className="parallax__content" aria-label="เริ่มเลือกแมตช์">
        <Goal className="osmo-icon-svg" aria-hidden="true" />
        <p>สนามเดียวกัน เพื่อนใหม่ด้วยกัน</p>
        {targetRef ? <button onClick={findMatch}>เลือกแมตช์ของคุณ <ArrowDown size={17} /></button> : <Link to="/team">เลือกแมตช์ของคุณ <ArrowDown size={17} /></Link>}
      </section>
    </div>
  );
}
