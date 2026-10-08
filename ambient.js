// Ambient life for the page: light, depth, entrances and the phone showcase.
// Everything here is decorative. It pauses offscreen and in hidden tabs, and stays off under Reduce Motion.
import { reduceMotion } from './fx.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const html = document.documentElement;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const motionOn = () => !reduceMotion.matches && !html.classList.contains('motion-paused');
const canObserve = 'IntersectionObserver' in window;
const motes = [];

function syncMotionClasses() {
  html.classList.toggle('motion-ok', motionOn());
  html.classList.toggle('reveal-ready', motionOn() && canObserve);
}

// Section headings rise line by line. The text and its order stay the same.
function splitHeadings() {
  for (const heading of $$('[data-reveal] h2')) {
    if (heading.querySelector('.line')) continue;
    const parts = heading.innerHTML.split(/<br\s*\/?>/i).map(part => part.trim()).filter(Boolean);
    heading.innerHTML = parts.map((part, index) => `<span class="line"><span style="--i:${index}">${part}</span></span>`).join(' ');
  }
}

function initReveals() {
  $$('[data-stagger]').forEach(group => [...group.children].forEach((child, index) => child.style.setProperty('--stagger', index)));
  const targets = $$('[data-reveal]');
  if (!canObserve) { targets.forEach(target => target.classList.add('is-in')); return; }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    }
  }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
  targets.forEach(target => observer.observe(target));
}

// One scheduled reader; the room and text never drift apart while scrolling.
function initScroll() {
  const bar = $('.scroll-progress span'), header = $('.site-header');
  let queued = false;
  const update = () => {
    queued = false;
    const max = html.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
    header?.classList.toggle('is-scrolled', scrollY > 24);
  };
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request, { passive: true });
  request();
}

// The header turns to night glass over the evening sections.
function initHeaderTone() {
  const header = $('.site-header'), nights = $$('.is-night');
  if (!header || !nights.length || !canObserve) return;
  const active = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) entry.isIntersecting ? active.add(entry.target) : active.delete(entry.target);
    header.classList.toggle('on-night', active.size > 0);
  }, { rootMargin: '0px 0px -93% 0px' });
  nights.forEach(section => observer.observe(section));
}

function initCurrentNav() {
  const links = $$('#site-nav a[href^="#"]');
  if (!links.length || !canObserve) return;
  // Only a section crossing the middle of the viewport is marked current.
  const current = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) entry.isIntersecting ? current.add(entry.target.id) : current.delete(entry.target.id);
    links.forEach(link => link.classList.toggle('is-current', current.has(link.getAttribute('href').slice(1))));
  }, { rootMargin: '-45% 0px -50% 0px' });
  for (const link of links) {
    const section = $(link.getAttribute('href'));
    if (section) observer.observe(section);
  }
}

// The room leans gently toward the pointer, with the light layer moving a little further.
function initHeroPointer() {
  const room = $('#room'), stage = $('.opening .stage'), light = $('.opening .sunlight');
  if (!room || !stage) return;
  let targetX = 0, targetY = 0, x = 0, y = 0, frame = 0;
  const loop = () => {
    x += (targetX - x) * .06;
    y += (targetY - y) * .06;
    stage.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
    if (light) light.style.translate = `${(x * 1.6).toFixed(2)}px ${(y * 1.3).toFixed(2)}px`;
    frame = Math.abs(targetX - x) > .04 || Math.abs(targetY - y) > .04 ? requestAnimationFrame(loop) : 0;
  };
  room.addEventListener('pointermove', event => {
    if (!finePointer.matches || !motionOn()) return;
    const rect = room.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - .5) * -16;
    targetY = ((event.clientY - rect.top) / rect.height - .5) * -10;
    if (!frame) frame = requestAnimationFrame(loop);
  });
  room.addEventListener('pointerleave', () => {
    targetX = 0; targetY = 0;
    if (!frame) frame = requestAnimationFrame(loop);
  });
  reduceMotion.addEventListener('change', () => {
    if (motionOn()) return;
    cancelAnimationFrame(frame); frame = 0; x = y = targetX = targetY = 0;
    stage.style.removeProperty('translate');
    light?.style.removeProperty('translate');
  });
}

// Floating dust in the sunlight, and fireflies by the night lamp.
function glowSprite(rgb) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, `rgba(${rgb},1)`);
  gradient.addColorStop(.18, `rgba(${rgb},.85)`);
  gradient.addColorStop(.45, `rgba(${rgb},.22)`);
  gradient.addColorStop(1, `rgba(${rgb},0)`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return canvas;
}

class Motes {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.options = { density: 60, rgb: '255,230,186', size: [.6, 2.2], drift: .2, rise: -.12, wind: .04, glow: 4.2, alpha: [.35, .95], firefly: false, ...options };
    this.sprite = glowSprite(this.options.rgb);
    this.particles = [];
    this.pointer = null;
    this.running = false;
    this.visible = false;
    this.width = 0;
    this.height = 0;
    this.last = 0;
    this.frame = this.frame.bind(this);
    this.resize();
    if ('ResizeObserver' in window) new ResizeObserver(() => this.resize()).observe(canvas);
    if (canObserve) new IntersectionObserver(([entry]) => { this.visible = entry.isIntersecting; this.sync(); }, { rootMargin: '10% 0px' }).observe(canvas);
    const host = canvas.closest('.workshop, .chapter-stage, .closing') || canvas.parentElement;
    host.addEventListener('pointermove', event => {
      if (!finePointer.matches) return;
      const rect = canvas.getBoundingClientRect();
      this.pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    });
    host.addEventListener('pointerleave', () => { this.pointer = null; });
  }
  resize() {
    const ratio = Math.min(2, devicePixelRatio || 1);
    const width = this.canvas.clientWidth, height = this.canvas.clientHeight;
    if (!width || !height) return;
    this.width = width; this.height = height;
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.round(this.options.density * Math.min(1.5, Math.max(.35, (width * height) / (1280 * 720))));
    while (this.particles.length < count) this.particles.push(this.spawn(true));
    this.particles.length = count;
    this.sync();
  }
  spawn(initial) {
    const { size, alpha } = this.options;
    return {
      x: Math.random() * this.width,
      y: initial ? Math.random() * this.height : this.height + 10,
      r: size[0] + Math.random() * (size[1] - size[0]),
      a: alpha[0] + Math.random() * (alpha[1] - alpha[0]),
      phase: Math.random() * Math.PI * 2,
      speed: .5 + Math.random(),
      twinkle: .0005 + Math.random() * .0016,
      vx: 0,
      vy: 0
    };
  }
  frame(now) {
    if (!this.running) return;
    const step = Math.min(3, this.last ? (now - this.last) / 16.7 : 1);
    this.last = now;
    const { context, width, height, options, pointer } = this;
    const seconds = now * .001;
    context.clearRect(0, 0, width, height);
    for (const particle of this.particles) {
      const swayX = Math.sin(seconds * .35 * particle.speed + particle.phase) * options.drift;
      const swayY = Math.cos(seconds * .27 * particle.speed + particle.phase * 1.3) * options.drift * .6;
      if (pointer) {
        const dx = particle.x - pointer.x, dy = particle.y - pointer.y, distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < 16000) {
          const distance = Math.sqrt(distanceSquared) || 1, force = (1 - distance / 126) * .8;
          particle.vx += dx / distance * force;
          particle.vy += dy / distance * force;
        }
      }
      particle.vx *= .92;
      particle.vy *= .92;
      particle.x += (swayX + options.wind + particle.vx) * step;
      particle.y += (options.rise * particle.speed + swayY + particle.vy) * step;
      if (particle.y < -14) Object.assign(particle, this.spawn(false));
      else if (particle.y > height + 14) particle.y = -10;
      if (particle.x < -14) particle.x = width + 10;
      else if (particle.x > width + 14) particle.x = -10;
      const light = options.firefly
        ? .08 + Math.pow(Math.max(0, Math.sin(seconds * particle.twinkle * 900 + particle.phase)), 6)
        : .6 + .4 * Math.sin(now * particle.twinkle + particle.phase);
      context.globalAlpha = Math.max(0, Math.min(1, particle.a * light));
      const size = particle.r * options.glow;
      context.drawImage(this.sprite, particle.x - size, particle.y - size, size * 2, size * 2);
    }
    context.globalAlpha = 1;
    this.raf = requestAnimationFrame(this.frame);
  }
  sync() {
    const should = this.visible && !document.hidden && motionOn() && this.width > 0;
    if (should && !this.running) { this.running = true; this.last = 0; this.raf = requestAnimationFrame(this.frame); }
    else if (!should && this.running) { this.running = false; cancelAnimationFrame(this.raf); }
    if (!motionOn() && this.width) this.context.clearRect(0, 0, this.width, this.height);
  }
}

function initMotes() {
  const settings = [
    ['.hero-motes', { density: 72, rgb: '255,234,192', size: [.5, 2.1], drift: .18, rise: -.1, wind: .06, glow: 4.6, alpha: [.3, .9] }],
    ['.stage-motes', { density: 36, rgb: '255,236,196', size: [.5, 1.8], drift: .16, rise: -.08, wind: .03, glow: 4.4, alpha: [.25, .8] }],
    ['.fireflies', { density: 24, rgb: '255,204,112', size: [1.1, 2.4], drift: .34, rise: -.03, wind: 0, glow: 6, alpha: [.55, 1], firefly: true }]
  ];
  for (const [selector, options] of settings) {
    const canvas = $(selector);
    if (canvas?.getContext) motes.push(new Motes(canvas, options));
  }
  const sync = () => motes.forEach(item => item.sync());
  document.addEventListener('visibilitychange', sync);
  reduceMotion.addEventListener('change', sync);
  document.addEventListener('motionpreferencechange', sync);
}

// Questions open and close smoothly; the native details element still holds the state.
function initFaq() {
  for (const details of $$('.faq details')) {
    const summary = $('summary', details), body = $('.faq-body', details);
    if (!summary || !body) continue;
    let animation = null, closing = false;
    summary.addEventListener('click', event => {
      if (!motionOn() || !body.animate) return;
      event.preventDefault();
      const current = body.getBoundingClientRect().height;
      const opening = !details.open || closing;
      animation?.cancel();
      if (opening) {
        closing = false;
        details.open = true;
        const end = body.scrollHeight;
        animation = body.animate([{ height: `${current}px`, opacity: current ? 1 : 0 }, { height: `${end}px`, opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' });
      } else {
        closing = true;
        animation = body.animate([{ height: `${current}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 360, easing: 'cubic-bezier(.4,0,.2,1)' });
        animation.onfinish = () => { details.open = false; closing = false; };
      }
    });
  }
}

// A soft lamp follows the pointer in the night privacy section.
function initCursorLight() {
  const section = $('.privacy-section'), light = $('.cursor-light');
  if (!section || !light) return;
  section.addEventListener('pointermove', event => {
    if (!finePointer.matches || !motionOn()) return;
    const rect = section.getBoundingClientRect();
    light.style.transform = `translate(${(event.clientX - rect.left).toFixed(0)}px, ${(event.clientY - rect.top).toFixed(0)}px)`;
    section.classList.add('is-lit');
  });
  section.addEventListener('pointerleave', () => section.classList.remove('is-lit'));
}

// CSS loops pause while their section is offscreen.
function initIdle() {
  if (!canObserve) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle('is-idle', !entry.isIntersecting);
  }, { rootMargin: '10% 0px' });
  $$('[data-ambient]').forEach(section => observer.observe(section));
}

export function initAmbient() {
  syncMotionClasses();
  splitHeadings();
  initReveals();
  initScroll();
  initHeaderTone();
  initCurrentNav();
  // Architecture remains fixed; the light and particles supply depth.
  initMotes();
  initFaq();
  initCursorLight();
  initIdle();
  reduceMotion.addEventListener('change', syncMotionClasses);
  document.addEventListener('motionpreferencechange', syncMotionClasses);
}
