import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import test from 'node:test';

const js=readFileSync(new URL('../scrapbook-complete-10-3-17.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../scrapbook-complete-10-3-17.css',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const worker=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
const manifest=readFileSync(new URL('../manifest.json',import.meta.url),'utf8');

test('complete scrapbook script parses',()=>assert.doesNotThrow(()=>new Script(js)));

test('all requested dramatic backgrounds and remembrance are present',()=>{
 for(const name of ['Lighthouse','Celebration','Baby Keepsake','Winter Wonderland','Chalkboard Memories','Happy Hour','Vintage Scroll','Warm Sand','Soft Paisley','Christmas 🎄','Halloween 🎃','Easter 🐰','Sea Glass','Remembrance']) assert.match(js,new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 assert.match(js,/ensureRemembrance/);
 assert.match(js,/#030303/);
 assert.match(js,/HAPPY HOUR/);
});

test('irregular frames use smooth SVG masks and distinct shapes',()=>{
 for(const shape of ['heart','flower','star','shell','puzzle','beach']) assert.match(js,new RegExp(`${shape}:maskSvg`));
 assert.match(css,/ss2-shell-real/);
 assert.match(css,/ss2-beach-real/);
 assert.match(js,/maskSize='100% 100%'/);
});

test('text shapes are recognizable',()=>{
 assert.match(css,/data-text-shape=thought.*:before/s);
 assert.match(css,/data-text-shape=label.*clip-path/s);
 assert.match(css,/data-text-shape=caption.*clip-path/s);
});

test('layers, move handle, stickers, shadow and glow are functional',()=>{
 assert.match(js,/ss2-layer-actions/);
 assert.match(js,/Bring forward/);
 assert.match(js,/Send backward/);
 assert.match(js,/ss2-move-handle/);
 assert.match(js,/extraStickers/);
 assert.match(js,/drop-shadow/);
 assert.match(js,/data-prop="shadow"/);
 assert.match(js,/data-prop="glow"/);
});

test('high resolution export preserves fitted photo aspect ratios',()=>{
 assert.match(js,/rasterizeImage/);
 assert.match(js,/Math\.max\(w\/nw,h\/nh\)/);
 assert.match(js,/Math\.min\(w\/nw,h\/nh\)/);
 assert.match(js,/scale:3/);
 assert.match(js,/\.98/);
 assert.match(js,/without stretching/);
});

test('release and cache are consistently 10.3.17',()=>{
 for(const source of [js,index,worker,manifest]) assert.match(source,/10\.3\.17/);
 assert.match(index,/scrapbook-complete-10-3-17\.css\?v=10\.3\.17/);
 assert.match(index,/scrapbook-complete-10-3-17\.js\?v=10\.3\.17/);
 assert.match(worker,/const CACHE='ofa-10-3-17'/);
 assert.match(manifest,/index\.html\?v=10\.3\.17/);
});