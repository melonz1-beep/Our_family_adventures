import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../scrapbook-studio-2.css', import.meta.url), 'utf8');
const studio = readFileSync(new URL('../scrapbook-studio-2.js', import.meta.url), 'utf8');
const worker = readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');

test('mobile editor cannot inherit the fixed stage width', () => {
  assert.match(css, /grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /\.ss2-stage-wrap\{[^}]*min-width:0[^}]*overflow:hidden/);
});

test('studio covers and isolates itself from the app chrome', () => {
  assert.match(css, /\.ss2\{[^}]*z-index:2147483647/);
  assert.match(css, /body\.ss2-open #shell>header[^}]*display:none!important/);
});

test('fit is clamped to the visible viewport', () => {
  assert.match(studio, /Math\.min\(rect\.width,document\.documentElement\.clientWidth/);
  assert.match(studio, /availableWidth\/900,availableHeight\/675/);
  const phoneWidth = 412 - 16;
  assert.ok(phoneWidth / 900 < 0.5, 'a 900px stage should scale below 50% on a 412px phone');
});

test('PWA core cache only references files that exist', () => {
  const core = worker.match(/const CORE=\[(.*?)\];/s)?.[1] || '';
  const paths = [...core.matchAll(/'\.\/(.*?)'/g)].map(([, path]) => path.split('?')[0]);
  for (const path of paths) {
    assert.doesNotThrow(() => readFileSync(new URL(`../${path || 'index.html'}`, import.meta.url)));
  }
  assert.doesNotMatch(worker, /badge-96\.png/);
});
