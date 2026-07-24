import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import test from 'node:test';

const js=readFileSync(new URL('../media-page-fixes.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../media-page-fixes.css',import.meta.url),'utf8');

test('media page fixes parse',()=>assert.doesNotThrow(()=>new Script(js)));

test('media card labels stack and wrap on narrow screens',()=>{
  assert.match(js,/mediaTileTextFixed/);
  assert.match(css,/overflow-wrap:anywhere/);
  assert.match(css,/mediaTileTextFixed>b/);
  assert.match(css,/@media\(max-width:680px\)/);
});

test('photo deletion removes database, storage, journal, and local media records',()=>{
  assert.match(js,/Delete Photo/);
  assert.match(js,/firebase\.database\(\)\.ref\(dataPath\(d,p\)\)\.remove/);
  assert.match(js,/firebase\.storage\(\)\.ref\(p\.storagePath\)\.delete/);
  assert.match(js,/delete journal\[p\.id\]/);
  assert.match(js,/d\.media=.*filter/);
  assert.match(js,/Only the person who uploaded this photo or an Administrator/);
});

test('media journal exposes a comprehensive categorized emoji library',()=>{
  assert.match(js,/Full emoji list/);
  assert.match(js,/Faces & people/);
  assert.match(js,/Travel & places/);
  assert.match(js,/Animals/);
  assert.match(js,/Food & drinks/);
  assert.ok((js.match(/data-media-emoji/g)||[]).length>=2);
  assert.match(css,/mediaEmojiGrid/);
});
