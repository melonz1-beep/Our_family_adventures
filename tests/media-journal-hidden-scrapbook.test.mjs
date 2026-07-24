import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import test from 'node:test';

const js=readFileSync(new URL('../media-journal.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../media-journal.css',import.meta.url),'utf8');

test('media journal patch parses',()=>assert.doesNotThrow(()=>new Script(js)));
test('scrapbook route and visible entry points are blocked while code remains untouched',()=>{
  assert.match(js,/HIDDEN='scrapbook'/);
  assert.match(js,/r===HIDDEN\?'media':r/);
  assert.match(js,/hideScrapbook/);
  assert.match(js,/location\.replace\('#media'/);
});
test('photo journal attaches captions and emojis to existing media',()=>{
  for(const token of ['Family Photo Journal','mediaJournalPhoto','mediaJournalEmoji','mediaJournalCaption','journalCaption','journalEmoji'])assert.match(js,new RegExp(token));
  assert.match(js,/publicData\/shared\/media/);
  assert.match(js,/collections\/media/);
  assert.match(js,/firebase\.database\(\)\.ref\(path\(d,p\)\)\.update/);
});
test('photo selection uses visible thumbnails instead of a text-only dropdown',()=>{
  assert.match(js,/mediaJournalPicker/);
  assert.match(js,/data-pick/);
  assert.match(js,/Tap a photo thumbnail/);
  assert.match(css,/mediaJournalPick img/);
  assert.match(css,/object-fit:cover/);
});
test('signed-in invited members receive full-size jpg downloads',()=>{
  assert.match(js,/firebase\?\.auth\?\.\(\)\.currentUser/);
  assert.match(js,/Download JPG/);
  assert.match(js,/canvas\.width=w;canvas\.height=h/);
  assert.match(js,/image\/jpeg',\.98/);
  assert.match(js,/original full resolution \(up to 20 MB each\)/);
});
test('journal layout is responsive and has dark mode support',()=>{
  assert.match(css,/mediaJournalComposer/);
  assert.match(css,/mediaJournalEntry/);
  assert.match(css,/\.dark \.mediaJournalSection/);
  assert.match(css,/@media\(max-width:680px\)/);
});
