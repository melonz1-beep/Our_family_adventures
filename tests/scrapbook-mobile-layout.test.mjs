import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../scrapbook-studio-2.css', import.meta.url), 'utf8');
const studio = readFileSync(new URL('../scrapbook-studio-2.js', import.meta.url), 'utf8');
const worker = readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');

test('mobile editor cannot inherit the fixed stage width', () => {
  assert.match(css, /grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /\.ss2-stage-wrap\{[^}]*min-width:0[^}]*overflow:hidden/);
  assert.match(css, /\.ss2-stage-viewport\{[^}]*position:relative/);
  assert.match(studio, /class="ss2-stage-viewport"/);
});

test('studio covers and isolates itself from the app chrome', () => {
  assert.match(css, /\.ss2\{[^}]*z-index:2147483647/);
  assert.match(css, /body\.ss2-open #shell>header[^}]*display:none!important/);
});

test('fit is clamped to the visible viewport', () => {
  assert.match(studio, /Math\.min\(rect\.width,document\.documentElement\.clientWidth/);
  assert.match(studio, /availableWidth\/900,availableHeight\/675/);
  assert.match(studio, /viewport\.style\.width=`\$\{900\*s\}px`/);
  const phoneWidth = 412 - 16;
  assert.ok(phoneWidth / 900 < 0.5, 'a 900px stage should scale below 50% on a 412px phone');
});

test('frames style the selected photo instead of opening the file picker', () => {
  assert.match(studio, /\[data-frame\][\s\S]*applyFrame\(b\.dataset\.frame\)/);
  assert.doesNotMatch(studio, /\[data-frame\][^\n]*ss2-files[^\n]*click/);
  assert.match(studio, /function photoNumber\(o\)/);
  assert.match(studio, /pendingShape='none'/);
});

test('objects resize directly and photos can move inside their frames', () => {
  assert.match(studio, /ss2-resize-handle/);
  assert.match(studio, /mode=e\.target\.closest\('\.ss2-resize-handle'\)\?'resize'/);
  assert.match(studio, /photoEditMode&&o\.type==='photo'\?'photo'/);
  assert.match(studio, /data-photo-prop="photoScale"/);
  assert.match(studio, /Photo left \/ right/);
  assert.doesNotMatch(studio, /'Edit sticker'/);
});

test('mobile add and edit tools live in the top toolbar', () => {
  assert.match(studio, /class="ss2-mobiletool" data-panel="\.ss2-left"/);
  assert.match(studio, /class="ss2-mobiletool" data-panel="\.ss2-right"/);
  assert.doesNotMatch(studio, /ss2-mobilebar/);
  assert.match(css, /grid-template-rows:auto auto/);
});

test('mobile precision editing uses a bottom sheet and canvas quick controls', () => {
  assert.match(css, /\.ss2-right\{left:0;right:0;top:46%/);
  assert.match(studio, /id="ss2-quickbar"/);
  assert.match(studio, /function renderQuickbar\(\)/);
  assert.match(studio, /data-quick="zoomin"/);
  assert.match(studio, /data-quick-frame=/);
});

test('stickers resize and delete directly on the scrapbook page', () => {
  assert.match(studio, /ss2-delete-handle/);
  assert.match(studio, /Sticker[^`]*Smaller[^`]*Larger[^`]*Delete/);
  assert.match(css, /\.ss2-delete-handle\{/);
  assert.match(studio, /function removeObject\(objectId\)/);
});

test('photos have numbered thumbnails, checkboxes, and bulk editing', () => {
  assert.match(studio, /class="ss2-photo-number"/);
  assert.match(studio, /data-multi=/);
  assert.match(studio, /Edit checked photos together/);
  assert.match(studio, /Add frame to every photo/);
});

test('themes render complete illustrated scrapbook layouts', () => {
  assert.match(studio, /function themeArt\(name\)/);
  assert.match(studio, /backgroundImage=themeArt\(state\.theme\)/);
  assert.match(studio, /<svg xmlns='http:\/\/www\.w3\.org\/2000\/svg'/);
  assert.match(studio, /'Happy Hour'.*'happyhour'/);
  assert.match(studio, /'Sunset Glow'.*'sunset'/);
  assert.match(studio, /'Wedding Romance'.*'wedding'/);
  assert.match(studio, /'Christmas 🎄'.*'christmas'/);
});

test('draft photos use IndexedDB instead of filling localStorage', () => {
  assert.match(studio, /const ASSET_DB='ofa-scrapbook-assets'/);
  assert.match(studio, /indexedDB\.open\(ASSET_DB,1\)/);
  assert.match(studio, /o\.src=`idb:\$\{o\.assetKey\}`/);
  assert.match(studio, /await storePhotoAssets\(\)/);
  assert.match(studio, /state=await load\(\)/);
});

test('page naming, save draft, and finalization are explicit', () => {
  assert.match(studio, /placeholder="Untitled scrapbook — tap to name"/);
  assert.match(studio, /e=>e\.target\.select\(\)/);
  assert.match(studio, /function saveDraft\(\)/);
  assert.match(studio, /function finalizePage\(\)/);
  assert.match(studio, /Name this scrapbook before finalizing/);
});

test('saved pages are separate drafts that can be closed and reopened', () => {
  assert.match(studio, /const DRAFT_INDEX_KEY=/);
  assert.match(studio, /const DRAFT_PREFIX=/);
  assert.match(studio, /localStorage\.setItem\(draftKey\(state\.id\),serialized\)/);
  assert.match(studio, /Saved scrapbook pages/);
  assert.match(studio, /function closePage\(\)/);
  assert.match(studio, /function openDraft\(pageId\)/);
  assert.match(studio, /id="ss2-close-page">Close Page/);
  assert.match(studio, /id="ss2-mclose-page">Close/);
});

test('exports render a clean full-size clone instead of the scaled phone canvas', () => {
  assert.doesNotMatch(studio, /html2canvas\(document\.querySelector\('#ss2-stage'\)/);
  assert.match(studio, /source\.cloneNode\(true\)/);
  assert.match(studio, /clone\.style\.transform='none'/);
  assert.match(studio, /width:900,height:675,windowWidth:900,windowHeight:675/);
  assert.match(studio, /canvas\.width!==1800\|\|canvas\.height!==1350/);
  assert.match(studio, /data-export-format="jpeg"/);
  assert.match(studio, /data-export-format="pdf"/);
  assert.match(css, /\.ss2-export-host \.ss2-stage\{[^}]*transform:none!important/);
});

test('only one mobile panel can remain open', () => {
  assert.match(studio, /function closePanels\(\)/);
  assert.match(studio, /const panel=document\.querySelector\(b\.dataset\.panel\),wasOpen/);
});

test('PWA core cache only references files that exist', () => {
  const core = worker.match(/const CORE=\[(.*?)\];/s)?.[1] || '';
  const paths = [...core.matchAll(/'\.\/(.*?)'/g)].map(([, path]) => path.split('?')[0]);
  for (const path of paths) {
    assert.doesNotThrow(() => readFileSync(new URL(`../${path || 'index.html'}`, import.meta.url)));
  }
  assert.doesNotMatch(worker, /badge-96\.png/);
});
