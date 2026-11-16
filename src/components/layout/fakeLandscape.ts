// Fake landscape: a phone held upright (or stuck there by the iPhone rotation lock – web pages can't rotate
// or lock the screen on iOS) gets the whole page turned 90° with CSS, so the game is always played sideways.
// The rotation sits on <body>, so portals (modals) turn with it. Hit-testing follows the CSS transform, so
// taps just work; only code that reads raw clientX/clientY or getBoundingClientRect() needs the helpers
// below to get values in the page's own (rotated) frame.

const coarse = window.matchMedia('(pointer: coarse)');

export const fakeLandscape = { on: false };

/** Upright touch screens get faked; tablets wider than 900px are fine upright, as before. */
const shouldFake = () =>
  coarse.matches && window.innerWidth < window.innerHeight && window.innerWidth <= 900;

function apply() {
  const root = document.documentElement;
  fakeLandscape.on = shouldFake();
  root.classList.toggle('fake-landscape', fakeLandscape.on);
  // media queries still see the upright viewport, so the "short screen" one is mirrored with a class:
  // the page's height is the screen's width
  root.classList.toggle('fake-short', fakeLandscape.on && window.innerWidth <= 420);
  // the real viewport in px (iOS changes innerHeight as its toolbars show and hide, so no vh units)
  root.style.setProperty('--vw', `${window.innerWidth}px`);
  root.style.setProperty('--vh', `${window.innerHeight}px`);
}

/** Screen (client) coordinates → page coordinates, which are rotated 90° clockwise when faked. */
export function toLocal(clientX: number, clientY: number) {
  return fakeLandscape.on
    ? { x: clientY, y: window.innerWidth - clientX }
    : { x: clientX, y: clientY };
}

/** getBoundingClientRect() in page coordinates (the on-screen box is turned when faked). */
export function localRect(el: Element) {
  const r = el.getBoundingClientRect();
  if (!fakeLandscape.on) return r;
  const W = window.innerWidth;
  return {
    left: r.top,
    right: r.bottom,
    top: W - r.right,
    bottom: W - r.left,
    width: r.height,
    height: r.width,
  };
}

export function installFakeLandscape() {
  apply();
  // iOS reports the old size while a rotation is still running – apply again once it has settled
  let settle = 0;
  const onChange = () => {
    apply();
    clearTimeout(settle);
    settle = window.setTimeout(apply, 350);
  };
  coarse.addEventListener('change', onChange);
  window.addEventListener('resize', onChange);
  window.addEventListener('orientationchange', onChange);
}
