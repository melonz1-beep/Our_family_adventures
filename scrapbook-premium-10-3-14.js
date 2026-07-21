(()=>{'use strict';
const RELEASE='10.3.14';
const KEY='ofa-scrapbook-studio-2',INDEX=`${KEY}-draft-index`,ACTIVE=`${KEY}-active-draft`,PREFIX=`${KEY}-draft:`,RECOVERY=`${KEY}-recovery`,APP_DATA='ofa-9-data',QUEUE='ofa-scrapbook-delete-queue';
const ASSET_DB='ofa-scrapbook-assets',ASSET_STORE='photos';
const THEMES={
 'Sea Glass':'assets/scrapbook-themes/sea-glass.svg',
 'Warm Sand':'assets/scrapbook-themes/warm-sand.svg',
 'Chalkboard Memories':'assets/scrapbook-themes/chalkboard-memories.svg',
 'Soft Paisley':'assets/scrapbook-themes/soft-paisley.svg',
 'Christmas 🎄':'assets/scrapbook-themes/christmas.svg',
 'Halloween 🎃':'assets/scrapbook-themes/halloween.svg',
 'Easter 🐰':'assets/scrapbook-themes/easter.svg',
 'Patriotic 🇺🇸':'assets/scrapbook-themes/patriotic.svg',
 'Remembrance':'assets/scrapbook-themes/remembrance.svg',
 'Celebration':'assets/scrapbook-themes/celebration.svg',
 'Baby Keepsake':'assets/scrapbook-themes/baby-keepsake.svg',
 'Autumn Gathering':'assets/scrapbook-themes/autumn-gathering.svg',
 'Pet Memories':'assets/scrapbook-themes/pet-memories.svg',
 'Wedding Romance':'assets/scrapbook-themes/wedding-romance.svg',
 'Happy Hour':'assets/scrapbook-themes/happy-hour.svg',
 'Camping Under the Stars':'assets/scrapbook-themes/camping-under-the-stars.svg',
 'Lighthouse':'assets/scrapbook-themes/lighthouse.svg'
};
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
 const meta=readIndex().find(item=>String(item.id)===String(id))||{};
 const page=readPage(id)||{};
 const data=readAppData(),record=findRecord(data,id)||{};
 return {id:String(id),meta,page,record,owner:String(page.owner||meta.owner||record.owner||record.createdBy||ownerHint||currentUid()),tripId:String(page.tripId||meta.tripId||record.tripId||''),recordId:String(record.id||id),status:page.status||meta.status||(record.status==='published'?'final':'draft'),title:page.title||meta.title||record.title||'Untitled scrapbook'};
}
function mayDelete(info){const uid=currentUid(),role=String(localStorage.getItem('ofa-role')||'');return !info.owner||info.owner==='local-user'||info.owner===uid||role==='Admin'}
function removeLocalMirror(id){
 const data=readAppData();if(Array.isArray(data.scrapbooks)){data.scrapbooks=data.scrapbooks.filter(item=>String(item?.studioId||item?.id)!==String(id));localStorage.setItem(APP_DATA,JSON.stringify(data))}
}
function removeRecovery(id){const value=json(sessionStorage.getItem(RECOVERY),null);if(value&&String(value.id)===String(id))sessionStorage.removeItem(RECOVERY)}
function purgeAssets(pageId){return new Promise(resolve=>{try{const request=indexedDB.open(ASSET_DB,1);request.onerror=()=>resolve(false);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(ASSET_STORE))request.result.createObjectStore(ASSET_STORE)};request.onsuccess=()=>{const db=request.result,tx=db.transaction(ASSET_STORE,'readwrite'),store=tx.objectStore(ASSET_STORE),cursor=store.openCursor();cursor.onsuccess=()=>{const c=cursor.result;if(!c)return;if(String(c.key).startsWith(`${pageId}:`))c.delete();c.continue()};tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();resolve(false)}}}catch{resolve(false)}})}
function purgeLocal(info){
 localStorage.removeItem(PREFIX+info.id);
 const base=json(localStorage.getItem(KEY),null);if(base&&String(base.id)===info.id)localStorage.removeItem(KEY);
 writeIndex(readIndex().filter(item=>String(item.id)!==info.id));
 if(String(localStorage.getItem(ACTIVE)||'')===info.id)localStorage.removeItem(ACTIVE);
 removeRecovery(info.id);removeLocalMirror(info.id);purgeAssets(info.id);
}
function jobFrom(info){return {pageId:info.id,recordId:info.recordId,owner:info.owner,tripId:info.tripId,familyId:familyId(),createdAt:Date.now()}}
function queueJob(job){const next=[job,...readQueue().filter(item=>String(item.pageId)!==String(job.pageId))];writeQueue(next)}
function remotePaths(job){
 const family=safeFamily(job.familyId),owners=new Set([job.owner,currentUid()].filter(value=>value&&value!=='local-user'));
 const paths=new Set();owners.forEach(owner=>paths.add(`families/${family}/scrapbookStudioV2/${owner}/${job.pageId}`));
 const recordId=job.recordId||job.pageId;paths.add(`families/${family}/publicData/shared/scrapbooks/${recordId}`);
 if(job.tripId){paths.add(`families/${family}/familyTrips/${job.tripId}/collections/scrapbooks/${recordId}`);paths.add(`families/${family}/privateTrips/${job.tripId}/collections/scrapbooks/${recordId}`)}
 return [...paths];
}
async function removeRemote(job){
 const user=window.firebase?.auth?.().currentUser;if(!user||!window.firebase?.database)return false;
 const results=await Promise.allSettled(remotePaths(job).map(path=>firebase.database().ref(path).remove()));
 return results.every(result=>result.status==='fulfilled');
}
async function flushQueue(){
 if(!window.firebase?.auth?.().currentUser||!window.firebase?.database)return;
 const pending=readQueue(),keep=[];for(const job of pending){purgeLocal(pageInfo(job.pageId,job.owner));if(!(await removeRemote(job)))keep.push(job)}writeQueue(keep);
}
async function deletePage(info,row){
 if(!mayDelete(info)){alert('Only the page owner or an administrator can delete this scrapbook page.');return}
 const kind=info.status==='final'?'finalized page':'draft';if(!confirm(`Permanently delete “${info.title}” (${kind})? This removes it from the app and cannot be undone.`))return;
 const job=jobFrom(info);queueJob(job);purgeLocal(info);row?.remove();
 const removed=await removeRemote(job);if(removed)writeQueue(readQueue().filter(item=>String(item.pageId)!==info.id));
 else sessionStorage.setItem('ofa-scrapbook-delete-note','Page deleted on this device. Cloud deletion will retry automatically when signed in and connected.');
 location.replace(`${location.pathname}${location.search}#scrapbook`);
}
function themeUrl(name){const path=THEMES[name];return path?`url("${new URL(`${path}?v=${RELEASE}`,document.baseURI).href}")`:''}
function applyStage(){const stage=document.querySelector('#ss2-stage');if(!stage)return;const name=stage.dataset.theme||document.querySelector('#ss2-theme')?.value||'';const image=themeUrl(name);if(image&&stage.dataset.premiumTheme!==name){stage.style.setProperty('background-image',image,'important');stage.dataset.premiumTheme=name}}
function applyPreviews(){document.querySelectorAll('.ss2-draft-preview[data-theme],.studioPageThumb[data-theme]').forEach(node=>{const name=node.dataset.theme||'';const image=themeUrl(name);if(image&&node.dataset.premiumTheme!==name){node.style.setProperty('background-image',image,'important');node.dataset.premiumTheme=name}})}
function studioRowInfo(row){const open=[...row.querySelectorAll('button')].find(button=>/openStudioPage/.test(button.getAttribute('onclick')||''));if(!open)return null;const code=open.getAttribute('onclick')||'',match=code.match(/openStudioPage\('([^']*)','([^']*)'\)/);return match?pageInfo(match[1],match[2]):null}
function enhanceStudioRows(){document.querySelectorAll('.studioPageRow').forEach(row=>{if(row.querySelector('.studio-delete-page'))return;const info=studioRowInfo(row);if(!info)return;if(readQueue().some(job=>String(job.pageId)===info.id)){row.remove();return}const button=document.createElement('button');button.type='button';button.className='studio-delete-page';button.textContent='Delete';button.setAttribute('aria-label',`Delete ${info.title}`);button.onclick=event=>{event.preventDefault();event.stopPropagation();deletePage(pageInfo(info.id,info.owner),row)};row.append(button)})}
function enhanceStudioLibrary(){document.querySelectorAll('.ss2-draft-row').forEach(row=>{if(row.querySelector('.ss2-delete-page'))return;const open=row.querySelector('[data-open-draft]');if(!open)return;const info=pageInfo(open.dataset.openDraft);if(readQueue().some(job=>String(job.pageId)===info.id)){row.remove();return}const button=document.createElement('button');button.type='button';button.className='ss2-delete-page';button.textContent='Delete';button.onclick=event=>{event.preventDefault();event.stopPropagation();deletePage(pageInfo(info.id),row)};open.after(button)})}
function addCurrentDelete(){const top=document.querySelector('.ss2-top');if(!top||top.querySelector('#ss2-delete-current'))return;const id=localStorage.getItem(ACTIVE);if(!id)return;const info=pageInfo(id);if(!readIndex().some(item=>String(item.id)===String(id)))return;const button=document.createElement('button');button.type='button';button.id='ss2-delete-current';button.className='ss2-delete-current';button.textContent='Delete Page';button.onclick=()=>deletePage(pageInfo(id),null);top.append(button)}
let scheduled=false;function run(){scheduled=false;applyStage();applyPreviews();enhanceStudioRows();enhanceStudioLibrary();addCurrentDelete()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(run)}
function showDeleteNote(){const note=sessionStorage.getItem('ofa-scrapbook-delete-note');if(!note)return;sessionStorage.removeItem('ofa-scrapbook-delete-note');setTimeout(()=>{const toast=document.querySelector('#toast');if(toast){toast.textContent=note;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),4500)}},500)}
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-theme']});
document.addEventListener('change',event=>{if(event.target?.id==='ss2-theme')setTimeout(()=>{const stage=document.querySelector('#ss2-stage');if(stage)delete stage.dataset.premiumTheme;schedule()},0)});
if(window.firebase?.auth)firebase.auth().onAuthStateChanged(user=>{if(user)flushQueue()});
addEventListener('load',()=>{schedule();flushQueue();showDeleteNote()});schedule();flushQueue();showDeleteNote();window.OFAScrapbookPremiumVersion=RELEASE;window.OFADeleteScrapbookPage=id=>deletePage(pageInfo(id),null);
})();