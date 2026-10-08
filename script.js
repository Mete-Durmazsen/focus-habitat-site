import { initLanguage } from './i18n.js';
import { createHeroStory } from './hero-story.js';
import { initAmbient } from './ambient.js';
import { initTheme } from './theme.js';

const $ = selector => document.querySelector(selector);
const html = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const sprite = name => new URL(`./assets/art/${name}.webp`, import.meta.url).href;

// Deterministic earned-leaf samples; the website never writes app history.
function putBowl(container, count) {
  if (!container) return;
  container.replaceChildren();
  for (let i = 0; i < Math.min(35, Math.max(0, count)); i++) {
    const leaf = document.createElement('img');
    leaf.src = sprite(['leaf-moss', 'leaf-sage', 'leaf-walnut'][(i + Math.max(0, count - 35)) % 3]);
    leaf.alt = ''; leaf.width = 376; leaf.height = 305;
    leaf.style.setProperty('--x', `${26 + (i * 13 % 38)}%`);
    leaf.style.setProperty('--y', `${43 - Math.floor(i / 7) * 3 + (i % 3) * 2}%`);
    leaf.style.setProperty('--r', `${-55 + (i * 37 % 110)}deg`);
    container.append(leaf);
  }
}

initTheme();
initLanguage();
putBowl($('[data-bowl="keepsakes"]'), 35);
const heroStory = createHeroStory({ reduceMotion, sprite, putBowl, restore() {} });
initAmbient();

const menu = $('.menu-toggle'), nav = $('#site-nav');
const isTurkish = html.lang === 'tr';
menu.hidden = false;
function closeMenu() {
  nav.classList.remove('is-open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', isTurkish ? 'Menüyü aç' : 'Open menu');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  nav.classList.toggle('is-open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', isTurkish ? (open ? 'Menüyü kapat' : 'Menüyü aç') : (open ? 'Close menu' : 'Open menu'));
});
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menu.focus(); }
});

const motionSettings = $('#motion-settings');
motionSettings.hidden = reduceMotion.matches;
reduceMotion.addEventListener('change', () => { motionSettings.hidden = reduceMotion.matches; });
motionSettings.addEventListener('click', () => {
  const paused = html.classList.toggle('motion-paused');
  html.classList.toggle('motion-ok', !paused && !reduceMotion.matches);
  motionSettings.setAttribute('aria-pressed', String(paused));
  motionSettings.textContent = paused ? 'Resume motion' : 'Pause all motion';
  if (paused) heroStory.pause();
  document.dispatchEvent(new Event('motionpreferencechange'));
});

// All coordinates resize together. An in-flight example settles safely after reflow.
let previousSceneSize = null;
const sceneObserver = new ResizeObserver(entries => {
  const { width, height } = entries[0].contentRect;
  if (previousSceneSize && (Math.abs(width - previousSceneSize.width) > 1 || Math.abs(height - previousSceneSize.height) > 1)) heroStory.finishOnResize();
  previousSceneSize = { width, height };
});
sceneObserver.observe($('#room'));
window.addEventListener('pagehide', event => {
  if (event.persisted) { heroStory.pause(); return; }
  heroStory.destroy(); sceneObserver.disconnect();
});
window.addEventListener('pageshow', event => {
  if (event.persisted) document.dispatchEvent(new Event('motionpreferencechange'));
});
