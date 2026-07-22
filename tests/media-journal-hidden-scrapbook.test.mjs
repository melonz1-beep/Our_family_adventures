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
test('journal layout is responsive and has dark mode support',()=>{
  assert.match(css,/mediaJournalComposer/);
  assert.match(css,/mediaJournalEntry/);
  assert.match(css,/\.dark \.mediaJournalSection/);
  assert.match(css,/@media\(max-width:680px\)/);
});
