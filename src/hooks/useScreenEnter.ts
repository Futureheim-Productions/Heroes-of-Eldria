import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

/** Fades/slides the screen in when mounted. */
export function useScreenEnter<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const tween = gsap.fromTo(
      ref.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' },
    );
    return () => {
      tween.kill();
    };
  }, []);
  return ref;
}

/** Staggers children of a container in. */
export function useStaggerIn<T extends HTMLElement = HTMLDivElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const kids = Array.from(ref.current.children);
    if (!kids.length) return;
    const tween = gsap.fromTo(
      kids,
      { opacity: 0, y: 10, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.28,
        stagger: 0.035,
        ease: 'power2.out',
        clearProps: 'transform',
      },
    );
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}
