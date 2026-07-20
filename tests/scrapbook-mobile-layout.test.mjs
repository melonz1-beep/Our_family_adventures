import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../scrapbook-studio-2.css', import.meta.url), 'utf8');
const studio = readFileSync(new URL('../scrapbook-studio-2.js', import.meta.url), 'utf8');
const worker = readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const databaseRules = readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8');
const storageRules = readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');
const firestoreRules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const functions = readFileSync(new URL('../Functions/index.js', import.meta.url), 'utf8');

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
  assert.match(css, /\.ss2-right\{left:0;right:0;top:36%/);
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
  assert.match(studio, /backgroundImage=cachedThemeArt\(state\.theme\)/);
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
  assert.match(studio, /function defaultTitle\(name=context\(\)\.name\)/);
  assert.match(studio, /e=>e\.target\.select\(\)/);
  assert.match(studio, /function saveDraft\(\)/);
  assert.match(studio, /function finalizePage\(\)/);
  assert.match(studio, /Finalized Page/);
  assert.match(css, /\.ss2\.viewing \.ss2-panel/);
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

test('the app and editor share drafts, user identity, theme, and Media photos', () => {
  assert.match(app, /window\.OurFamilyAdventuresBridge=/);
  assert.match(app, /savePage:saveStudioPageRecord/);
  assert.match(app, /media:arr\('media'\)/);
  assert.match(studio, /bridge\(\)\?\.savePage\?\.\(clone\(state\)\)/);
  assert.match(studio, /bridge\(\)\?\.uploadPhotos\?\.\(files\)/);
  assert.match(studio, /classList\.toggle\('dark',context\(\)\.theme==='dark'\)/);
  assert.match(studio, /async function openPage\(pageId/);
});

test('remote photo URLs remain portable while local uploads use IndexedDB', () => {
  assert.match(studio, /!\/\^https\?:\/i\.test\(String\(o\.src\)\)/);
  assert.match(studio, /String\(o\.src\)\.startsWith\('idb:'\)\|\|\/\^https\?:\/i/);
  assert.match(studio, /const family=context\(\)\.familyId/);
});

test('Memories link thumbnails to Media and can repair Firebase URLs', () => {
  assert.match(app, /mediaIds\.push\(r\.value\.id\)/);
  assert.match(app, /function memoryPhotoItems\(memory\)/);
  assert.match(app, /function repairMemoryThumbnail\(img,mediaId\)/);
  assert.match(app, /firebase\.storage\(\)\.ref\(media\.storagePath\)\.getDownloadURL\(\)/);
});

test('text cutouts and professional theme arrangements are available', () => {
  assert.match(studio, /data-text-preset="speech"/);
  assert.match(studio, /Font color/);
  assert.match(studio, /No background fill/);
  assert.match(studio, /function applyThemeLayout\(\)/);
  assert.match(studio, /const columns=Math\.min\(4,Math\.ceil\(Math\.sqrt\(rows\.length\*1\.3\)\)\)/);
  assert.match(css, /data-text-shape=speech/);
});

test('exports embed every photo instead of silently omitting remote images', () => {
  assert.match(studio, /function inlineExportImages\(clone\)/);
  assert.match(studio, /await inlineExportImages\(built\.clone\)/);
  assert.match(studio, /fetch\(src,\{mode:'cors'/);
  assert.match(studio, /img\.src=await blobToDataUrl/);
  assert.match(studio, /Export stopped because a photo could not be embedded/);
});

test('expressive editable text and visible mobile add feedback are available', () => {
  assert.match(studio, /data-text-value/);
  assert.match(studio, /plain:\['',330,90,'transparent'\]/);
  for (const shape of ['speech-right', 'thought', 'shout', 'torn', 'caption']) assert.match(studio, new RegExp(`data-text-preset="${shape}"`));
  assert.match(css, /data-text-shape=thought/);
  assert.match(css, /data-text-shape=shout/);
  assert.match(css, /\.ss2-left\{left:0;right:0;top:42%/);
});

test('page naming, multiple photo layouts, thumbnails, and portable final pages are wired', () => {
  assert.match(studio, /id="ss2-panel-title"/);
  for (const layout of ['collage', 'grid', 'feature', 'filmstrip', 'mosaic', 'freeform']) assert.match(studio, new RegExp(`data-layout="${layout}"`));
  assert.match(studio, /function applyLayoutMode\(mode\)/);
  assert.match(studio, /photoPreviews/);
  assert.match(app, /previewPhotos/);
  assert.match(app, /function portableStudioState\(page\)/);
  assert.match(app, /studioState/);
});

test('holiday artwork uses recognizable decorated trees and carved pumpkins', () => {
  assert.match(studio, /id='pine'/);
  assert.match(studio, /id='pumpkinGlow'/);
  assert.match(studio, /fill='#211922'/);
});

test('all release entry points use version 10.3.8', () => {
  for (const source of [app, studio, worker, index]) assert.match(source, /10\.3\.8/);
  for (const source of [app, studio, worker, index]) assert.doesNotMatch(source, /10\.3\.6/);
});

test('the source does not publish a default administrator PIN', () => {
  assert.match(app, /adminCode:''/);
  assert.match(app, /Create a new 4–12 digit admin PIN/);
  assert.doesNotMatch(app, /adminCode:'1218'/);
});

test('family data requires approved membership instead of any authenticated account', () => {
  assert.match(databaseRules, /familyMembers/);
  assert.match(databaseRules, /child\('active'\)\.val\(\) == true/);
  assert.doesNotMatch(databaseRules, /"\.read": "auth != null"/);
  assert.match(storageRules, /request\.auth\.token\.familyMember == true/);
  assert.match(storageRules, /request\.auth\.token\.familyId == familyId/);
  assert.match(firestoreRules, /allow read, write: if false/);
});

test('account creation is invitation-only and authorization is issued server-side', () => {
  assert.match(app, /A secure family invitation link is required to create an account/);
  assert.match(app, /httpsCallable\('authorizeFamilyMember'\)/);
  assert.match(functions, /exports\.authorizeFamilyMember = onCall/);
  assert.match(functions, /setCustomUserClaims/);
  assert.match(functions, /approvedBy: 'family-invitation'/);
});

test('public source contains no administrator email address', () => {
  for (const source of [app, databaseRules, storageRules, functions]) {
    assert.doesNotMatch(source, /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  }
});

test('PWA core cache only references files that exist', () => {
  const core = worker.match(/const CORE=\[(.*?)\];/s)?.[1] || '';
  const paths = [...core.matchAll(/'\.\/(.*?)'/g)].map(([, path]) => path.split('?')[0]);
  for (const path of paths) {
    assert.doesNotThrow(() => readFileSync(new URL(`../${path || 'index.html'}`, import.meta.url)));
  }
  assert.doesNotMatch(worker, /badge-96\.png/);
});
