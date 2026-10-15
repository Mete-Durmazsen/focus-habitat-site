import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const store = 'https://apps.apple.com/app/id6820682982';
const cases = [
  { path: 'index.html', locale: 'en', badge: 'app-store-en.svg', old: 'Coming soon to the App Store', available: 'Available on the App Store', cta: 'Get the app', alt: 'Download on the App Store' },
  { path: 'tr/index.html', locale: 'tr', badge: 'app-store-tr.svg', old: 'App Store’da yakında', available: 'App Store’da yayında', cta: 'App Store’dan indir', alt: 'App Store’dan indir' },
];

for (const item of cases) {
  const html = readFileSync(new URL(item.path, root), 'utf8');
  test(item.locale + ': hero opens the real app listing without JavaScript', () => {
    const hero = html.match(/<div class="hero-actions">([\s\S]*?)<\/div>/)?.[1] ?? '';
    assert.ok(hero.includes('href="' + store + '"'), 'hero must link to App ID 6820682982');
    assert.ok(hero.includes(item.cta), 'hero must use localized download copy');
    assert.equal((html.match(new RegExp(store, 'g')) ?? []).length, 2, 'hero and closing must link to the same app');
  });
  test(item.locale + ': launch copy and Safari banner are localized and ready', () => {
    assert.ok(!html.includes(item.old), 'published launch variant must not say coming soon');
    assert.ok(html.includes(item.available), 'localized availability copy is required');
    assert.equal((html.match(/name="apple-itunes-app"/g) ?? []).length, 1);
    assert.ok(html.includes('content="app-id=6820682982"'));
    assert.ok(html.includes('responsive.css?v=app-store-launch-1'));
  });
  test(item.locale + ': one official, static badge is in the closing download link', () => {
    assert.equal((html.match(/class="store-badge"/g) ?? []).length, 1);
    const closing = html.match(/<section id="closing"[\s\S]*?<\/section>/)?.[0] ?? '';
    assert.ok(closing.includes('href="' + store + '"'));
    assert.ok(closing.includes(item.badge));
    assert.ok(closing.includes('alt="' + item.alt + '"'));
    assert.ok(!closing.includes('class="closing-note" data-reveal'), 'badge container must not animate');
    const css = readFileSync(new URL('responsive.css', root), 'utf8');
    assert.match(css, /\.store-badge\{[^}]*padding:12px/);
    assert.match(css, /\.store-badge img\{[^}]*height:48px[^}]*width:auto/);
  });
  test(item.locale + ': legal and support links remain available', () => {
    const prefix = item.locale === 'tr' ? '../' : '';
    for (const ref of ['privacy', 'support']) assert.ok(html.includes('href="' + prefix + ref + '"'));
    assert.ok(html.includes('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'));
  });
}

test('official badge sources stay intact and contain no active content', () => {
  for (const item of cases) {
    const svg = readFileSync(new URL('assets/badges/' + item.badge, root), 'utf8');
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('viewBox="0 0 '));
    assert.ok(svg.includes(item.locale === 'tr' ? 'Badge_TR' : 'Badge_US-UK'));
    assert.doesNotMatch(svg, /<script\b|<foreignObject\b|\bonload=|\bonerror=/i);
  }
});
