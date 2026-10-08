// Small shared motion helpers. Each one is decorative: skipping it never changes state or meaning.
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
export const motionAllowed = () => !reduceMotion.matches && !document.hidden && !document.documentElement.classList.contains('motion-paused');

const counters = new WeakMap();
const frames = new WeakMap();

// Counts a number up or down to its new value. The first call only sets the value.
export function tweenNumber(element, to, { duration = 750, format = value => String(Math.round(value)) } = {}) {
  if (!element) return;
  const from = counters.has(element) ? counters.get(element) : to;
  counters.set(element, to);
  cancelAnimationFrame(frames.get(element));
  if (from === to || !motionAllowed()) { element.textContent = format(to); return; }
  const start = performance.now();
  const step = now => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    element.textContent = format(from + (to - from) * eased);
    if (t < 1) frames.set(element, requestAnimationFrame(step));
  };
  frames.set(element, requestAnimationFrame(step));
}

// A small burst of warm light around an element, for earned moments.
export function sparkle(target, { count = 12, spread = 70, rise = 26 } = {}) {
  if (!target || !motionAllowed()) return;
  const rect = target.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > innerHeight || rect.width === 0) return;
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  // Inside an open modal dialog, effects must join its top layer to be visible.
  const layer = target.closest('dialog[open]') || document.querySelector('dialog[open]') || document.body;
  const colors = ['#f3d488', '#e8bf5f', '#fff1c4', '#c9a24b'];
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    const star = i % 3 === 0;
    const size = star ? 9 + Math.random() * 7 : 3 + Math.random() * 4;
    dot.className = star ? 'spark is-star' : 'spark';
    dot.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${colors[i % colors.length]}`;
    layer.append(dot);
    const angle = (i / count) * Math.PI * 2 + Math.random() * .7;
    const distance = spread * (.55 + Math.random() * .6);
    const x = Math.cos(angle) * distance, y = Math.sin(angle) * distance;
    const animation = dot.animate([
      { transform: 'translate(-50%, -50%) scale(.2) rotate(0deg)', opacity: 0 },
      { transform: `translate(calc(-50% + ${x * .45}px), calc(-50% + ${y * .45}px)) scale(1) rotate(45deg)`, opacity: 1, offset: .28 },
      { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y - rise}px)) scale(.3) rotate(120deg)`, opacity: 0 }
    ], { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.3,1)' });
    animation.onfinish = animation.oncancel = () => dot.remove();
  }
}

// A one-off swell. It uses transform, so resting translate/scale styles are left alone.
export function pulse(element, { scale = 1.12, duration = 900 } = {}) {
  if (!element?.animate || !motionAllowed()) return;
  element.animate([
    { transform: 'scale(1)' },
    { transform: `scale(${scale})`, offset: .35 },
    { transform: 'scale(1)' }
  ], { duration, easing: 'cubic-bezier(.34,1.56,.64,1)' });
}
