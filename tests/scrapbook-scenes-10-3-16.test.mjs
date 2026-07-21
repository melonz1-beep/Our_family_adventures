import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import test from 'node:test';

const scenes=readFileSync(new URL('../scrapbook-scenes-10-3-16.js',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const worker=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
const manifest=readFileSync(new URL('../manifest.json',import.meta.url),'utf8');

const themes=['Lighthouse','Happy Hour','Wedding Romance','Pet Memories','Baby Keepsake','Celebration','Winter Wonderland','Chalkboard Memories','Vintage Scroll','Warm Sand','Soft Paisley','Christmas 🎄','Halloween 🎃','Easter 🐰','Sea Glass'];

test('scene layer parses',()=>assert.doesNotThrow(()=>new Script(scenes)));

test('all requested themes have both recognizable scenes and protected photo zones',()=>{
 for(const theme of themes){
  assert.match(scenes,new RegExp(`'${theme.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}'`));
 }
 assert.match(scenes,/const safe=\{/);
 assert.match(scenes,/const scenes=\{/);
 assert.match(scenes,/sceneLayoutVersion=RELEASE/);
});

test('chalkboard is truly black and winter trees sit outside the center safe zone',()=>{
 assert.match(scenes,/'Chalkboard Memories':svg\('#0a0a0a'/);
 assert.match(scenes,/'Winter Wonderland':\{x:200,y:70,w:500,h:455\}/);
 assert.match(scenes,/translate\(30 145\)/);
 assert.match(scenes,/translate\(720 130\)/);
});

test('safe layout is persisted to page objects after background and layout choices',()=>{
 assert.match(scenes,/localStorage\.setItem\(PREFIX\+entry\.id,JSON\.stringify\(page\)\)/);
 assert.match(scenes,/closest\('#ss2-theme-layout,\[data-layout\]'\)/);
 assert.match(scenes,/e\.target\?\.id==='ss2-theme'/);
 assert.match(scenes,/p\.x=Math\.round/);
 assert.match(scenes,/p\.y=Math\.round/);
});

test('release wiring and cache are consistently 10.3.16',()=>{
 for(const source of [scenes,index,worker,manifest])assert.match(source,/10\.3\.16/);
 assert.match(index,/scrapbook-scenes-10-3-16\.js\?v=10\.3\.16/);
 assert.match(worker,/const CACHE='ofa-10-3-16'/);
 assert.match(worker,/scrapbook-scenes-10-3-16\.js\?v=10\.3\.16/);
 assert.match(manifest,/index\.html\?v=10\.3\.16/);
});