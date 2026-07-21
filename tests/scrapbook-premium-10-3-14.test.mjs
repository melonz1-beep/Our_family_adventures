import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import test from 'node:test';

const premium = readFileSync(new URL('../scrapbook-premium-10-3-15.js', import.meta.url), 'utf8');
const effectsFix = readFileSync(new URL('../scrapbook-premium-10-3-15-fixes.js', import.meta.url), 'utf8');
const premiumCss = readFileSync(new URL('../scrapbook-premium-10-3-15.css', import.meta.url), 'utf8');
const coreStudio = readFileSync(new URL('../scrapbook-studio-2.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const worker = readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
const manifest = readFileSync(new URL('../manifest.json', import.meta.url), 'utf8');
const themes = [
  'pet-memories-realistic.svg','wedding-romance-realistic.svg','happy-hour-realistic.svg','baby-keepsake-realistic.svg','winter-wonderland-realistic.svg','chalkboard-memories-realistic.svg','vintage-scroll-realistic.svg','warm-sand-realistic.svg','soft-paisley-realistic.svg','christmas-realistic.svg','halloween-realistic.svg','easter-realistic.svg','patriotic-realistic.svg','sea-glass-realistic.svg'
];

test('10.3.15 premium scrapbook browser scripts parse', () => {
  assert.doesNotThrow(() => new Script(premium));
  assert.doesNotThrow(() => new Script(effectsFix));
});

test('all requested realistic backgrounds exist with texture, depth, and release caching', () => {
  for (const file of themes) {
    const url = new URL(`../assets/scrapbook-themes/${file}`, import.meta.url);
    assert.ok(existsSync(url), `${file} is missing`);
    const svg = readFileSync(url, 'utf8');
    assert.match(svg, /<svg/);
    assert.ok(svg.length > 1800, `${file} needs more detailed artwork`);
    assert.match(svg, /(?:linearGradient|radialGradient)/, `${file} needs shaded materials`);
    assert.match(svg, /filter/, `${file} needs texture, lighting, or depth`);
    assert.match(worker, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('editor menu follows title, backgrounds, frames, photos, text, and layouts', () => {
  const labels = ['1. Title','2. Backgrounds','3. Frames','4. Photos','5. Text & Stickers','6. Layouts'];
  let previous = -1;
  for (const label of labels) {
    const position = premium.indexOf(label);
    assert.ok(position > previous, `${label} is missing or out of order`);
    previous = position;
  }
  assert.match(premium, /ss2-editor-flow/);
  assert.match(premiumCss, /ss2-flow-section/);
  assert.match(effectsFix, /Apply this frame to every photo/);
  assert.match(effectsFix, /input\.closest\('label'\)/);
});

test('dimensional scrapbook frames replace emoji-only frame choices', () => {
  for (const name of ['Classic Polaroid','Deckled Heritage','Gilded Keepsake','Linen Mat','Wood Gallery','Oval Cameo','Floral Die-Cut','Heart Keepsake','Seaside Shell','Chipboard Hexagon']) assert.match(premium, new RegExp(name));
  assert.match(premium, /FRAME_PRESETS/);
  assert.match(premiumCss, /ss2-premium-frame-gallery/);
  assert.match(premiumCss, /data-shape=polaroid/);
  assert.match(premiumCss, /data-shape=vintage/);
  assert.match(premiumCss, /data-shape=oval/);
});

test('shadow and glow values persist and render outside the clipped photo frame', () => {
  assert.match(coreStudio, /data-prop="shadow"/);
  assert.match(coreStudio, /data-prop="glow"/);
  assert.match(premium, /setControl\('shadow',preset\.shadow\)/);
  assert.match(premium, /setControl\('glow',preset\.glow\)/);
  assert.match(effectsFix, /values\[1\]/);
  assert.match(effectsFix, /values\[2\]/);
  assert.match(effectsFix, /actualShadow/);
  assert.match(effectsFix, /actualGlow/);
  assert.match(effectsFix, /drop-shadow/);
  assert.match(effectsFix, /object\.style\.filter=next/);
  assert.match(premiumCss, /\.ss2-object\{overflow:visible!important\}/);
});

test('draft and finalized deletion still uses the configured family and every storage layer', () => {
  assert.match(premium, /context\(\)\.familyId/);
  assert.match(premium, /scrapbookStudioV2/);
  assert.match(premium, /publicData\/shared\/scrapbooks/);
  assert.match(premium, /familyTrips/);
  assert.match(premium, /privateTrips/);
  assert.match(premium, /ofa-scrapbook-assets/);
  assert.match(premium, /ofa-scrapbook-delete-queue/);
});

test('only the 10.3.15 premium layer is loaded', () => {
  assert.match(index, /scrapbook-premium-10-3-15\.css\?v=10\.3\.15/);
  assert.match(index, /scrapbook-premium-10-3-15\.js\?v=10\.3\.15/);
  assert.match(index, /scrapbook-premium-10-3-15-fixes\.js\?v=10\.3\.15/);
  assert.doesNotMatch(index, /scrapbook-premium-10-3-14/);
  assert.doesNotMatch(index, /scrapbook-studio-2-professional-10-3-13\.js/);
  assert.doesNotMatch(index, /scrapbook-page-delete-10-3-13\.js/);
});

test('release version and PWA cache are consistently 10.3.15', () => {
  for (const source of [premium,effectsFix,index,worker,manifest]) assert.match(source, /10\.3\.15/);
  assert.match(worker, /const CACHE='ofa-10-3-15'/);
  assert.match(worker, /scrapbook-premium-10-3-15-fixes\.js/);
  assert.match(manifest, /index\.html\?v=10\.3\.15/);
});