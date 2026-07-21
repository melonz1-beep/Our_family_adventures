import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const premium = readFileSync(new URL('../scrapbook-premium-10-3-14.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const worker = readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
const manifest = readFileSync(new URL('../manifest.json', import.meta.url), 'utf8');
const themes = [
  'sea-glass.svg','warm-sand.svg','chalkboard-memories.svg','soft-paisley.svg','christmas.svg','halloween.svg','easter.svg','patriotic.svg','remembrance.svg','celebration.svg','baby-keepsake.svg','autumn-gathering.svg','pet-memories.svg','wedding-romance.svg','happy-hour.svg','camping-under-the-stars.svg','lighthouse.svg'
];

test('premium scrapbook browser script parses', () => {
  assert.doesNotThrow(() => new Script(premium));
});

test('all requested premium theme assets exist and contain detailed SVG artwork', () => {
  for (const file of themes) {
    const url = new URL(`../assets/scrapbook-themes/${file}`, import.meta.url);
    assert.ok(existsSync(url), `${file} is missing`);
    const svg = readFileSync(url, 'utf8');
    assert.match(svg, /<svg/);
    assert.ok(svg.length > 1200, `${file} is too small to be a detailed illustration`);
    assert.match(svg, /(?:linearGradient|radialGradient|filter)/, `${file} needs depth or texture`);
    assert.match(worker, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('the release loads only the new premium theme and deletion layer', () => {
  assert.match(index, /scrapbook-premium-10-3-14\.css\?v=10\.3\.14/);
  assert.match(index, /scrapbook-premium-10-3-14\.js\?v=10\.3\.14/);
  assert.doesNotMatch(index, /scrapbook-studio-2-professional-10-3-13\.js/);
  assert.doesNotMatch(index, /scrapbook-page-delete-10-3-13\.js/);
});

test('draft and finalized deletion use the configured family and clean every storage layer', () => {
  assert.match(premium, /context\(\)\.familyId/);
  assert.match(premium, /scrapbookStudioV2/);
  assert.match(premium, /publicData\/shared\/scrapbooks/);
  assert.match(premium, /familyTrips/);
  assert.match(premium, /privateTrips/);
  assert.match(premium, /ofa-scrapbook-assets/);
  assert.match(premium, /\.studioPageRow/);
  assert.match(premium, /\.ss2-draft-row/);
  assert.match(premium, /ofa-scrapbook-delete-queue/);
});

test('release version is consistently 10.3.14', () => {
  for (const source of [premium,index,worker,manifest]) assert.match(source, /10\.3\.14/);
  assert.match(worker, /const CACHE='ofa-10-3-14'/);
  assert.match(manifest, /index\.html\?v=10\.3\.14/);
});
