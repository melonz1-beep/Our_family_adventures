(()=>{'use strict';
const RELEASE='10.3.15';
const KEY='ofa-scrapbook-studio-2',INDEX=`${KEY}-draft-index`,ACTIVE=`${KEY}-active-draft`,PREFIX=`${KEY}-draft:`,RECOVERY=`${KEY}-recovery`,APP_DATA='ofa-9-data',QUEUE='ofa-scrapbook-delete-queue';
const ASSET_DB='ofa-scrapbook-assets',ASSET_STORE='photos';
const THEMES={
 'Sea Glass':'assets/scrapbook-themes/sea-glass-realistic.svg',
 'Warm Sand':'assets/scrapbook-themes/warm-sand-realistic.svg',
 'Chalkboard Memories':'assets/scrapbook-themes/chalkboard-memories-realistic.svg',
 'Soft Paisley':'assets/scrapbook-themes/soft-paisley-realistic.svg',
 'Christmas 🎄':'assets/scrapbook-themes/christmas-realistic.svg',
 'Halloween 🎃':'assets/scrapbook-themes/halloween-realistic.svg',
 'Easter 🐰':'assets/scrapbook-themes/easter-realistic.svg',
 'Patriotic 🇺🇸':'assets/scrapbook-themes/patriotic-realistic.svg',
 'Pet Memories':'assets/scrapbook-themes/pet-memories-realistic.svg',
 'Wedding Romance':'assets/scrapbook-themes/wedding-romance-realistic.svg',
 'Happy Hour':'assets/scrapbook-themes/happy-hour-realistic.svg',
 'Baby Keepsake':'assets/scrapbook-themes/baby-keepsake-realistic.svg',
 'Winter Wonderland':'assets/scrapbook-themes/winter-wonderland-realistic.svg',
 'Vintage Scroll':'assets/scrapbook-themes/vintage-scroll-realistic.svg',
 'Remembrance':'assets/scrapbook-themes/remembrance.svg',
 'Celebration':'assets/scrapbook-themes/celebration.svg',
 'Autumn Gathering':'assets/scrapbook-themes/autumn-gathering.svg',
 'Camping Under the Stars':'assets/scrapbook-themes/camping-under-the-stars.svg',
 'Lighthouse':'assets/scrapbook-themes/lighthouse.svg'
};
const FRAME_PRESETS=[
 {label:'Classic Polaroid',detail:'Heavy white paper with a writing edge',shape:'polaroid',border:'#fffaf1',width:7,shadow:24,glow:0,swatch:'paper'},
 {label:'Deckled Heritage',detail:'Layered antique paper and soft age',shape:'vintage',border:'#e6d2a8',width:15,shadow:22,glow:0,swatch:'deckle'},
 {label:'Gilded Keepsake',detail:'Warm metallic gallery frame',shape:'vintage',border:'#b78b45',width:13,shadow:19,glow:4,swatch:'gold'},
 {label:'Linen Mat',detail:'Soft woven neutral mat',shape:'puzzle',border:'#e8dfcf',width:17,shadow:16,glow:0,swatch:'linen'},
 {label:'Wood Gallery',detail:'Rich stained wood scrapbook frame',shape:'vintage',border:'#795239',width:18,shadow:25,glow:0,swatch:'wood'},
 {label:'Oval Cameo',detail:'Layered oval portrait mat',shape:'oval',border:'#efe2ca',width:13,shadow:19,glow:3,swatch:'cameo'},
 {label:'Floral Die-Cut',detail:'Dimensional petal paper cutout',shape:'flower',border:'#ead7d8',width:11,shadow:20,glow:3,swatch:'floral'},
 {label:'Heart Keepsake',detail:'Layered romantic paper heart',shape:'heart',border:'#e2b5b9',width:12,shadow:21,glow:4,swatch:'heart'},
 {label:'Seaside Shell',detail:'Pearl-toned coastal cutout',shape:'shell',border:'#d8e6df',width:11,shadow:18,glow:5,swatch:'shell'},
 {label:'Chipboard Hexagon',detail:'Thick natural scrapbook board',shape:'hexagon',border:'#b89870',width:14,shadow:22,glow:0,swatch:'chipboard'}
];
const json=(text,fallback)=>{try{return JSON.parse(text||'')}catch{return fallback}};
const context=()=>window.OurFamilyAdventuresBridge?.getContext?.()||{};
const safeFamily=value=>String(value||'default-family').toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')||'default-family';
const familyId=()=>safeFamily(context().familyId);
const currentUid=()=>window.firebase?.auth?.().currentUser?.uid||context().uid||localStorage.getItem('ofa-uid')||'local-user';
const cssEscape=value=>window.CSS?.escape?CSS.escape(String(value)):String(value).replace(/["\\]/g,'\\$&');
function readIndex(){const value=json(localStorage.getItem(INDEX),[]);return Array.isArray(value)?value:[]}
function writeIndex(rows){localStorage.setItem(INDEX,JSON.stringify(rows))}
function readPage(id){return json(localStorage.getItem(PREFIX+id),null)}
function readAppData(){const value=json(localStorage.getItem(APP_DATA),{});return value&&typeof value==='object'?value:{}}
function findRecord(data,id){return (Array.isArray(data.scrapbooks)?data.scrapbooks:[]).find(item=>String(item?.studioId||item?.id)===String(id))||null}
function readQueue(){const rows=json(localStorage.getItem(QUEUE),[]);return Array.isArray(rows)?rows:[]}
function writeQueue(rows){rows.length?localStorage.setItem(QUEUE,JSON.stringify(rows)):localStorage.removeItem(QUEUE)}
function pageInfo(id,ownerHint=''){
 const meta=readIndex().find(item=>String(item.id)===String(id))||{},page=readPage(id)||{},data=readAppData(),record=findRecord(data,id)||{};
 return {id:String(id),meta,page,record,owner:String(page.owner||meta.owner||record.owner||record.createdBy||ownerHint||currentUid()),tripId:String(page.tripId||meta.tripId||record.tripId||''),recordId:String(record.id||id),status:page.status||meta.status||(record.status==='published'?'final':'draft'),title:page.title||meta.title||record.title||'Untitled scrapbook'};
}
function mayDelete(info){const uid=currentUid(),role=String(localStorage.getItem('ofa-role')||'');return !info.owner||info.owner==='local-user'||info.owner===uid||role==='Admin'}
function removeLocalMirror(id){const data=readAppData();if(Array.isArray(data.scrapbooks)){data.scrapbooks=data.scrapbooks.filter(item=>String(item?.studioId||item?.id)!==String(id));localStorage.setItem(APP_DATA,JSON.stringify(data))}}
function removeRecovery(id){const value=json(sessionStorage.getItem(RECOVERY),null);if(value&&String(value.id)===String(id))sessionStorage.removeItem(RECOVERY)}
function purgeAssets(pageId){return new Promise(resolve=>{try{const request=indexedDB.open(ASSET_DB,1);request.onerror=()=>resolve(false);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(ASSET_STORE))request.result.createObjectStore(ASSET_STORE)};request.onsuccess=()=>{const db=request.result,tx=db.transaction(ASSET_STORE,'readwrite'),store=tx.objectStore(ASSET_STORE),cursor=store.openCursor();cursor.onsuccess=()=>{const c=cursor.result;if(!c)return;if(String(c.key).startsWith(`${pageId}:`))c.delete();c.continue()};tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();resolve(false)}}}catch{resolve(false)}})}
function purgeLocal(info){localStorage.removeItem(PREFIX+info.id);const base=json(localStorage.getItem(KEY),null);if(base&&String(base.id)===info.id)localStorage.removeItem(KEY);writeIndex(readIndex().filter(item=>String(item.id)!==info.id));if(String(localStorage.getItem(ACTIVE)||'')===info.id)localStorage.removeItem(ACTIVE);removeRecovery(info.id);removeLocalMirror(info.id);purgeAssets(info.id)}
function jobFrom(info){return {pageId:info.id,recordId:info.recordId,owner:info.owner,tripId:info.tripId,familyId:familyId(),createdAt:Date.now()}}
function queueJob(job){writeQueue([job,...readQueue().filter(item=>String(item.pageId)!==String(job.pageId))])}
function remotePaths(job){const family=safeFamily(job.familyId),owners=new Set([job.owner,currentUid()].filter(value=>value&&value!=='local-user')),paths=new Set();owners.forEach(owner=>paths.add(`families/${family}/scrapbookStudioV2/${owner}/${job.pageId}`));const recordId=job.recordId||job.pageId;paths.add(`families/${family}/publicData/shared/scrapbooks/${recordId}`);if(job.tripId){paths.add(`families/${family}/familyTrips/${job.tripId}/collections/scrapbooks/${recordId}`);paths.add(`families/${family}/privateTrips/${job.tripId}/collections/scrapbooks/${recordId}`)}return [...paths]}
async function removeRemote(job){const user=window.firebase?.auth?.().currentUser;if(!user||!window.firebase?.database)return false;const results=await Promise.allSettled(remotePaths(job).map(path=>firebase.database().ref(path).remove()));return results.every(result=>result.status==='fulfilled')}
async function flushQueue(){if(!window.firebase?.auth?.().currentUser||!window.firebase?.database)return;const pending=readQueue(),keep=[];for(const job of pending){purgeLocal(pageInfo(job.pageId,job.owner));if(!(await removeRemote(job)))keep.push(job)}writeQueue(keep)}
async function deletePage(info,row){if(!mayDelete(info)){alert('Only the page owner or an administrator can delete this scrapbook page.');return}const kind=info.status==='final'?'finalized page':'draft';if(!confirm(`Permanently delete “${info.title}” (${kind})? This removes it from the app and cannot be undone.`))return;const job=jobFrom(info);queueJob(job);purgeLocal(info);row?.remove();const removed=await removeRemote(job);if(removed)writeQueue(readQueue().filter(item=>String(item.pageId)!==info.id));else sessionStorage.setItem('ofa-scrapbook-delete-note','Page deleted on this device. Cloud deletion will retry automatically when signed in and connected.');location.replace(`${location.pathname}${location.search}#scrapbook`)}
function themeUrl(name){const path=THEMES[name];return path?`url("${new URL(`${path}?v=${RELEASE}`,document.baseURI).href}")`:''}
function applyStage(){const stage=document.querySelector('#ss2-stage');if(!stage)return;const name=stage.dataset.theme||document.querySelector('#ss2-theme')?.value||'';const image=themeUrl(name);if(image&&stage.dataset.realisticTheme!==name){stage.style.setProperty('background-image',image,'important');stage.dataset.realisticTheme=name}}
function applyPreviews(){document.querySelectorAll('.ss2-draft-preview[data-theme],.studioPageThumb[data-theme]').forEach(node=>{const name=node.dataset.theme||'',image=themeUrl(name);if(image&&node.dataset.realisticTheme!==name){node.style.setProperty('background-image',image,'important');node.dataset.realisticTheme=name}})}
function studioRowInfo(row){const open=[...row.querySelectorAll('button')].find(button=>/openStudioPage/.test(button.getAttribute('onclick')||''));if(!open)return null;const match=(open.getAttribute('onclick')||'').match(/openStudioPage\('([^']*)','([^']*)'\)/);return match?pageInfo(match[1],match[2]):null}
function enhanceStudioRows(){document.querySelectorAll('.studioPageRow').forEach(row=>{if(row.querySelector('.studio-delete-page'))return;const info=studioRowInfo(row);if(!info)return;if(readQueue().some(job=>String(job.pageId)===info.id)){row.remove();return}const button=document.createElement('button');button.type='button';button.className='studio-delete-page';button.textContent='Delete';button.onclick=event=>{event.preventDefault();event.stopPropagation();deletePage(pageInfo(info.id,info.owner),row)};row.append(button)})}
function enhanceStudioLibrary(){document.querySelectorAll('.ss2-draft-row').forEach(row=>{if(row.querySelector('.ss2-delete-page'))return;const open=row.querySelector('[data-open-draft]');if(!open)return;const info=pageInfo(open.dataset.openDraft);if(readQueue().some(job=>String(job.pageId)===info.id)){row.remove();return}const button=document.createElement('button');button.type='button';button.className='ss2-delete-page';button.textContent='Delete';button.onclick=event=>{event.preventDefault();event.stopPropagation();deletePage(pageInfo(info.id),row)};open.after(button)})}
function addCurrentDelete(){const top=document.querySelector('.ss2-top');if(!top||top.querySelector('#ss2-delete-current'))return;const id=localStorage.getItem(ACTIVE);if(!id||!readIndex().some(item=>String(item.id)===String(id)))return;const button=document.createElement('button');button.type='button';button.id='ss2-delete-current';button.className='ss2-delete-current';button.textContent='Delete Page';button.onclick=()=>deletePage(pageInfo(id),null);top.append(button)}
function makeSection(title,help=''){const section=document.createElement('section');section.className='ss2-flow-section';section.innerHTML=`<h3>${title}</h3>${help?`<p>${help}</p>`:''}`;return section}
function move(node,parent){if(node)parent.append(node);return node}
function findTextHeading(root,text){return [...root.querySelectorAll('h3')].find(node=>node.textContent.trim()===text)}
function buildFrameGallery(originalButtons){const gallery=document.createElement('div');gallery.className='ss2-premium-frame-gallery';FRAME_PRESETS.forEach(preset=>{const button=document.createElement('button');button.type='button';button.className='ss2-frame-card';button.innerHTML=`<span class="ss2-frame-sample ${preset.swatch}"><i></i></span><b>${preset.label}</b><small>${preset.detail}</small>`;button.onclick=()=>{const original=originalButtons.find(item=>item.dataset.frame===preset.shape);if(!original)return;original.click();setTimeout(()=>applyFramePreset(preset),0)};gallery.append(button)});return gallery}
function setControl(prop,value){const input=document.querySelector(`#ss2-controls [data-prop="${prop}"]`);if(!input)return false;input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));return true}
function applyFramePreset(preset){setControl('border',preset.border);setControl('borderWidth',preset.width);setControl('shadow',preset.shadow);setControl('glow',preset.glow);setTimeout(()=>{decorateEffects();const note=document.querySelector('#ss2-notice');if(note){note.textContent=`${preset.label} frame applied`;note.classList.add('show');setTimeout(()=>note.classList.remove('show'),1900)}},0)}
function setupMenuFlow(){const panel=document.querySelector('.ss2-left');if(!panel||panel.dataset.flowVersion===RELEASE)return;panel.dataset.flowVersion=RELEASE;const close=panel.querySelector('.ss2-panel-close'),flow=document.createElement('div');flow.className='ss2-editor-flow';
 const title=makeSection('1. Title','Name the scrapbook page before adding the design.');move(panel.querySelector('.ss2-page-name'),title);flow.append(title);
 const backgrounds=makeSection('2. Backgrounds','Choose a realistic illustrated background.');move(panel.querySelector('#ss2-theme'),backgrounds);flow.append(backgrounds);
 const frames=makeSection('3. Frames','Select a photo, then choose a dimensional scrapbook frame.');move(panel.querySelector('#ss2-frame-all'),frames);const originals=[...panel.querySelectorAll('[data-frame]')];const originalGrid=originals[0]?.closest('.ss2-grid');if(originalGrid){originalGrid.classList.add('ss2-original-frame-grid');frames.append(originalGrid)}frames.append(buildFrameGallery(originals));flow.append(frames);
 const photos=makeSection('4. Photos','Upload from your phone or choose saved Media photos.');const photoButton=panel.querySelector('#ss2-photo'),fileInput=panel.querySelector('#ss2-files'),photoActions=document.createElement('div');photoActions.className='ss2-photo-actions';move(photoButton,photoActions);move(fileInput,photoActions);photos.append(photoActions);const source=panel.querySelector('.ss2-source-section'),mediaGrid=source?.querySelector('.ss2-media-grid'),mediaButton=source?.querySelector('#ss2-add-media');move(mediaGrid,photos);move(mediaButton,photos);if(!mediaGrid){const empty=[...(source?.querySelectorAll('p')||[])].find(p=>/No saved Media photos/.test(p.textContent));move(empty,photos)}flow.append(photos);
 const text=makeSection('5. Text & Stickers','Add journaling, captions, labels, or decorative stickers.');const textActions=document.createElement('div');textActions.className='ss2-text-actions';move(panel.querySelector('#ss2-text'),textActions);move(panel.querySelector('#ss2-emoji'),textActions);text.append(textActions);move(source?.querySelector('.ss2-text-presets'),text);move(panel.querySelector('#ss2-stickers'),text);flow.append(text);
 const layouts=makeSection('6. Layouts','Arrange photos after the background and frames are selected.');move(panel.querySelector('#ss2-theme-layout'),layouts);move(panel.querySelector('.ss2-layout-grid'),layouts);flow.append(layouts);
 [...panel.children].forEach(child=>{if(child!==close&&child!==flow)child.classList.add('ss2-flow-obsolete')});panel.append(flow)}
function decorateEffects(){document.querySelectorAll('.ss2-object').forEach(object=>{const frame=object.querySelector('.ss2-frame');if(!frame)return;const raw=frame.style.boxShadow||'';if(raw&&raw!=='none'){const nums=[...raw.matchAll(/(-?\d+(?:\.\d+)?)px/g)].map(match=>Number(match[1]));const shadow=Math.max(0,nums[2]||0),glow=Math.max(0,nums[5]||0);object.dataset.shadow=String(shadow);object.dataset.glow=String(glow)}const shadow=Number(object.dataset.shadow)||0,glow=Number(object.dataset.glow)||0,filters=[];if(shadow)filters.push(`drop-shadow(0 ${Math.max(3,shadow*.42)}px ${Math.max(3,shadow*.55)}px rgba(25,18,14,.58))`);if(glow)filters.push(`drop-shadow(0 0 ${Math.max(4,glow*.8)}px rgba(255,246,205,.95))`,`drop-shadow(0 0 ${Math.max(7,glow*1.4)}px rgba(255,255,255,.62))`);object.style.filter=filters.join(' ');frame.style.boxShadow='none'})}
let scheduled=false;function run(){scheduled=false;applyStage();applyPreviews();enhanceStudioRows();enhanceStudioLibrary();addCurrentDelete();setupMenuFlow();decorateEffects()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(run)}
function showDeleteNote(){const note=sessionStorage.getItem('ofa-scrapbook-delete-note');if(!note)return;sessionStorage.removeItem('ofa-scrapbook-delete-note');setTimeout(()=>{const toast=document.querySelector('#toast');if(toast){toast.textContent=note;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),4500)}},500)}
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-theme','style']});
document.addEventListener('change',event=>{if(event.target?.id==='ss2-theme')setTimeout(()=>{const stage=document.querySelector('#ss2-stage');if(stage)delete stage.dataset.realisticTheme;schedule()},0)});
if(window.firebase?.auth)firebase.auth().onAuthStateChanged(user=>{if(user)flushQueue()});
addEventListener('load',()=>{schedule();flushQueue();showDeleteNote()});schedule();flushQueue();showDeleteNote();window.OFAScrapbookPremiumVersion=RELEASE;window.OFADeleteScrapbookPage=id=>deletePage(pageInfo(id),null);
})();