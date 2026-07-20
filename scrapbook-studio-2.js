(()=>{'use strict';
const V='10.3.4';
const KEY='ofa-scrapbook-studio-2';
const RECOVERY_KEY=`${KEY}-recovery`;
const HISTORY_LIMIT=35;
const SAVE_DELAY=1200;
const MAX_IMAGE_EDGE=2400;
const THEMES={
' Sea Glass':['linear-gradient(135deg,#dff7f4,#a8d8d2 55%,#f6e6c8)','🐚'],
'Mountain Escape':['linear-gradient(#9ecfe3 0 45%,#557b67 46% 70%,#d6c7a0 71%)','🏔️'],
'Lighthouse':['linear-gradient(#b9e4f4 0 58%,#5db0c7 59% 75%,#ead9b5 76%)','⚓'],
'Camping Under the Stars':['radial-gradient(circle at 30% 20%,#fff 0 1px,transparent 2px),linear-gradient(#0e2041,#273c64 60%,#284d39 61%)','⛺'],
'Happy Hour':['linear-gradient(135deg,#ffd6a5,#fdffb6,#caffbf)','🍹'],'Celebration':['radial-gradient(circle,#fff5 0 3px,transparent 4px),linear-gradient(135deg,#ffcad4,#bde0fe)','🎉'],
'Wedding Romance':['linear-gradient(135deg,#fff,#f6dbe4)','💍'],'Pet Memories':['linear-gradient(135deg,#f7ead7,#d8e2dc)','🐾'],'Baby Keepsake':['linear-gradient(135deg,#e9f5ff,#fff1f6)','🍼'],
'Autumn Gathering':['linear-gradient(135deg,#f6bd60,#d97746,#8c5e3c)','🍂'],'Sunset Glow':['linear-gradient(#ff9a76,#f7c873,#6d7aa8)','🌅'],'Winter Wonderland':['linear-gradient(#effaff,#bfd7ea)','❄️'],
'Chalkboard Memories':['linear-gradient(135deg,#263b35,#17241f)','✎'],'Vintage Scroll':['linear-gradient(135deg,#f4e1b7,#cfae78)','📜'],'Watercolor Wash':['linear-gradient(135deg,#cce3de,#eaf4f4,#f6fff8,#f4d6cc)','🎨'],
'Warm Sand':['linear-gradient(135deg,#f3e1c3,#d8b384)','🏖️'],'Soft Paisley':['radial-gradient(ellipse at 20% 20%,#ffffff80 0 12%,transparent 13%),linear-gradient(135deg,#d8c7e8,#f0d8de)','🌸'],
'Christmas 🎄':['linear-gradient(135deg,#174c3c,#b02a37)','🎄'],'Halloween 🎃':['linear-gradient(135deg,#2b193d,#f28c28)','🎃'],'Easter 🐰':['linear-gradient(135deg,#f7d6e0,#d6f7e8,#e6dcf7)','🐰'],'Patriotic 🇺🇸':['linear-gradient(135deg,#b22234 0 33%,#fff 34% 66%,#3c3b6e 67%)','🇺🇸']
};
THEMES['Sea Glass']=THEMES[' Sea Glass'];delete THEMES[' Sea Glass'];
const THEME_META={
 'Sea Glass':['#dff7f4','#8ccbc5','#e8cfa2','sea'],'Mountain Escape':['#d8edf5','#54745e','#a88361','mountain'],
 'Lighthouse':['#d8f1fb','#d44f4f','#3d8eac','lighthouse'],'Camping Under the Stars':['#101d3b','#f5c96a','#254c37','camp'],
 'Happy Hour':['#fff1c9','#df7c65','#79a891','party'],'Celebration':['#fff0f5','#d56f91','#6ea7c8','party'],
 'Wedding Romance':['#fffaf4','#c993a4','#b79a62','floral'],'Pet Memories':['#f6eee2','#8d6e59','#7f9b82','pet'],
 'Baby Keepsake':['#eff7ff','#82acd0','#edb4c4','baby'],'Autumn Gathering':['#f5dfbd','#a95031','#d79535','autumn'],
 'Sunset Glow':['#ffd7b2','#d76767','#6b6599','mountain'],'Winter Wonderland':['#edf8ff','#7ca8c5','#ffffff','winter'],
 'Chalkboard Memories':['#17231f','#f7e6a8','#e884a7','chalk'],'Vintage Scroll':['#f3dfb8','#8b5d3b','#b99058','vintage'],
 'Watercolor Wash':['#fffaf7','#d8879c','#68a7b5','watercolor'],'Warm Sand':['#f2dfb8','#cb9a58','#58a9bd','sea'],
 'Soft Paisley':['#eee5f4','#9a71aa','#d68c9e','paisley'],'Christmas 🎄':['#173d34','#cf4451','#e4c26d','christmas'],
 'Halloween 🎃':['#20142f','#ef8c35','#8c6bb1','halloween'],'Easter 🐰':['#fff5ec','#d89fbe','#8fc9b3','baby'],
 'Patriotic 🇺🇸':['#f8f5ee','#b5283b','#334c83','patriotic']
};
function themeArt(name){
 const [paper,accent,second,kind]=THEME_META[name]||THEME_META['Sea Glass'];
 const scenes={
  sea:`<path d='M0 510 Q110 450 220 510 T440 510 T660 510 T900 510 V675 H0Z' fill='${second}' opacity='.5'/><path d='M0 555 Q100 515 200 555 T400 555 T600 555 T900 555' fill='none' stroke='${accent}' stroke-width='14' opacity='.65'/><g fill='none' stroke='${accent}' stroke-width='6' opacity='.75'><path d='M72 92 q42-55 84 0 q-42 48-84 0Z'/><path d='M760 570 q55-68 110 0 q-55 58-110 0Z'/></g>`,
  mountain:`<circle cx='740' cy='110' r='58' fill='${second}' opacity='.55'/><path d='M0 535 170 280 310 470 455 220 650 480 760 320 900 520V675H0Z' fill='${accent}' opacity='.7'/><path d='m345 350 110-130 76 110-42-20-34 50-35-48Z' fill='#fff' opacity='.72'/><g fill='${second}' opacity='.8'><path d='m90 560 38-92 38 92Z'/><path d='m700 560 46-112 46 112Z'/></g>`,
  lighthouse:`<path d='M0 505 Q130 470 260 505 T520 505 T780 505 T900 505V675H0Z' fill='${second}' opacity='.62'/><g transform='translate(700 155)'><path d='m45 40 34 315H0L32 40Z' fill='#fffaf1' stroke='${accent}' stroke-width='8'/><path d='M8 228h62v55H4Z' fill='${accent}'/><path d='M20 0h42l17 42H2Z' fill='${accent}'/><rect x='16' y='42' width='50' height='38' rx='5' fill='${second}'/></g><path d='M760 176 900 98M760 190 900 220' stroke='#fff7c2' stroke-width='15' opacity='.45'/>`,
  camp:`<g fill='#fff8cf' opacity='.85'><circle cx='90' cy='90' r='4'/><circle cx='220' cy='145' r='5'/><circle cx='410' cy='70' r='4'/><circle cx='620' cy='125' r='6'/><circle cx='825' cy='72' r='4'/></g><path d='M0 555 140 430 255 555 370 405 500 555 650 420 790 555 900 455V675H0Z' fill='${second}'/><g transform='translate(350 385)'><path d='m0 170 105-170 105 170Z' fill='${accent}'/><path d='m105 0 20 170H85Z' fill='#fff0c2'/></g>`,
  party:`<path d='M35 80 Q450 205 865 80' fill='none' stroke='${accent}' stroke-width='5'/><g fill='${second}'><path d='m85 95 45 75 35-56Z'/><path d='m250 126 46 75 38-58Z'/><path d='m430 139 48 76 37-64Z'/><path d='m620 125 44 75 40-61Z'/><path d='m790 95 42 72 36-58Z'/></g><g fill='none' stroke='${accent}' stroke-width='10' opacity='.7'><circle cx='115' cy='555' r='55'/><circle cx='780' cy='535' r='70'/></g><g fill='${accent}' opacity='.6'><circle cx='210' cy='280' r='9'/><rect x='570' y='275' width='16' height='42' transform='rotate(28 578 296)'/><circle cx='680' cy='370' r='10'/></g>`,
  floral:`<path d='M65 610 Q150 420 290 505M835 65Q710 245 600 135' fill='none' stroke='${second}' stroke-width='12'/><g fill='${accent}' opacity='.7'><circle cx='80' cy='590' r='42'/><circle cx='145' cy='530' r='34'/><circle cx='218' cy='510' r='46'/><circle cx='815' cy='78' r='42'/><circle cx='748' cy='122' r='35'/><circle cx='675' cy='145' r='45'/></g><rect x='48' y='42' width='804' height='590' rx='36' fill='none' stroke='${second}' stroke-width='6' stroke-dasharray='18 12'/>`,
  pet:`<g fill='${accent}' opacity='.18'><circle cx='115' cy='120' r='24'/><circle cx='82' cy='82' r='12'/><circle cx='112' cy='70' r='12'/><circle cx='142' cy='82' r='12'/><circle cx='760' cy='535' r='34'/><circle cx='720' cy='490' r='16'/><circle cx='760' cy='475' r='16'/><circle cx='800' cy='490' r='16'/></g><path d='M40 610 Q250 565 430 620 T860 595' fill='none' stroke='${second}' stroke-width='18' stroke-linecap='round'/><path d='M100 585h105M123 555h60' stroke='${accent}' stroke-width='18' stroke-linecap='round'/>`,
  baby:`<g fill='#fff' opacity='.8'><ellipse cx='150' cy='135' rx='95' ry='38'/><ellipse cx='710' cy='170' rx='120' ry='45'/></g><path d='M35 80 Q450 175 865 80' fill='none' stroke='${accent}' stroke-width='5'/><g fill='${second}' opacity='.7'><circle cx='120' cy='110' r='22'/><rect x='270' y='115' width='38' height='38' transform='rotate(18 289 134)'/><circle cx='455' cy='137' r='23'/><rect x='640' y='110' width='40' height='40' transform='rotate(-16 660 130)'/></g><path d='M0 590Q150 535 300 590T600 590T900 590V675H0Z' fill='${accent}' opacity='.3'/>`,
  autumn:`<path d='M40 40Q210 170 260 360M860 635Q700 505 650 320' fill='none' stroke='#765038' stroke-width='18'/><g fill='${accent}' opacity='.8'><ellipse cx='135' cy='125' rx='34' ry='18' transform='rotate(35 135 125)'/><ellipse cx='215' cy='235' rx='38' ry='20' transform='rotate(-20 215 235)'/><ellipse cx='745' cy='455' rx='42' ry='22' transform='rotate(30 745 455)'/><ellipse cx='810' cy='545' rx='35' ry='19' transform='rotate(-28 810 545)'/></g><g fill='${second}' opacity='.7'><ellipse cx='185' cy='170' rx='30' ry='17'/><ellipse cx='700' cy='395' rx='34' ry='18'/></g>`,
  winter:`<path d='M0 530Q140 455 280 530T560 530T900 520V675H0Z' fill='#fff' opacity='.9'/><g fill='none' stroke='${accent}' stroke-width='5' opacity='.6'><path d='m110 90v70m-30-52 60 35m0-35-60 35'/><path d='m760 120v90m-40-67 80 45m0-45-80 45'/></g><g fill='${second}' opacity='.6'><path d='m280 570 55-145 55 145Z'/><path d='m540 575 70-190 70 190Z'/></g>`,
  chalk:`<rect x='30' y='30' width='840' height='615' rx='22' fill='none' stroke='${accent}' stroke-width='7' stroke-dasharray='22 12'/><g fill='none' stroke='${second}' stroke-width='8' opacity='.75'><path d='m80 120 35-35 35 35 35-35'/><path d='M710 545q55-80 110 0q-55 55-110 0Z'/><circle cx='180' cy='520' r='55'/></g><g fill='${accent}' opacity='.7'><circle cx='390' cy='85' r='7'/><circle cx='520' cy='590' r='9'/></g>`,
  vintage:`<rect x='32' y='32' width='836' height='611' rx='24' fill='none' stroke='${accent}' stroke-width='7'/><rect x='52' y='52' width='796' height='571' rx='18' fill='none' stroke='${second}' stroke-width='3'/><g fill='none' stroke='${accent}' stroke-width='8'><path d='M45 170Q45 45 170 45M730 45Q855 45 855 170M45 505Q45 630 170 630M730 630Q855 630 855 505'/></g><path d='M260 78Q450 125 640 78M260 597Q450 550 640 597' fill='none' stroke='${second}' stroke-width='8'/>`,
  watercolor:`<g opacity='.35'><ellipse cx='135' cy='145' rx='180' ry='125' fill='${accent}'/><ellipse cx='760' cy='170' rx='175' ry='140' fill='${second}'/><ellipse cx='500' cy='565' rx='260' ry='115' fill='#e7b65f'/><path d='M40 400Q260 320 470 410T860 390' fill='none' stroke='${accent}' stroke-width='55' stroke-linecap='round'/></g>`,
  paisley:`<g fill='none' stroke='${accent}' stroke-width='12' opacity='.55'><path d='M100 180c120-150 200 60 70 115-80 34-110-40-70-115Z'/><path d='M660 480c140-170 225 70 75 130-95 35-125-50-75-130Z'/></g><g fill='${second}' opacity='.35'><circle cx='150' cy='230' r='24'/><circle cx='710' cy='545' r='32'/></g>`,
  christmas:`<path d='M40 75Q450 160 860 75' fill='none' stroke='${second}' stroke-width='12'/><g fill='${accent}'><circle cx='150' cy='100' r='14'/><circle cx='310' cy='125' r='14'/><circle cx='480' cy='128' r='14'/><circle cx='650' cy='112' r='14'/></g><g fill='${second}' opacity='.8'><path d='m95 590 80-190 80 190Z'/><path d='m690 590 65-160 65 160Z'/></g><g fill='${accent}'><rect x='360' y='530' width='100' height='75'/><rect x='475' y='505' width='125' height='100'/></g>`,
  halloween:`<path d='M35 35Q220 80 300 240M865 35Q680 80 600 240' fill='none' stroke='${second}' stroke-width='5'/><g fill='${accent}' opacity='.85'><ellipse cx='120' cy='555' rx='70' ry='58'/><ellipse cx='780' cy='545' rx='82' ry='68'/></g><g fill='#111' opacity='.75'><path d='m350 110 35 20 35-20-20 34 20 28-35-14-35 14 20-28Z'/><path d='m520 180 30 18 30-18-16 30 16 25-30-12-30 12 17-25Z'/></g>`,
  patriotic:`<path d='M25 70Q450 180 875 70' fill='none' stroke='${accent}' stroke-width='8'/><g fill='${second}'><path d='m70 88 55 90 45-69Z'/><path d='m260 125 55 90 45-72Z'/><path d='m455 135 55 90 45-74Z'/><path d='m650 115 55 90 45-75Z'/></g><g fill='${accent}' opacity='.55'><path d='m120 500 12 25 28 4-20 20 5 29-25-14-26 14 6-29-21-20 29-4Z'/><path d='m770 470 14 30 32 5-23 22 6 33-29-16-29 16 6-33-23-22 32-5Z'/></g><path d='M0 610h900' stroke='${accent}' stroke-width='45'/><path d='M0 650h900' stroke='${second}' stroke-width='45'/>`
 };
 const scene=scenes[kind]||scenes.watercolor;
 const svg=`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 675'><defs><linearGradient id='paper' x1='0' y1='0' x2='1' y2='1'><stop stop-color='${paper}'/><stop offset='1' stop-color='${second}' stop-opacity='.3'/></linearGradient><pattern id='grain' width='18' height='18' patternUnits='userSpaceOnUse'><circle cx='3' cy='4' r='1.2' fill='${accent}' opacity='.12'/></pattern></defs><rect width='900' height='675' fill='url(#paper)'/><rect width='900' height='675' fill='url(#grain)'/>${scene}<rect x='18' y='18' width='864' height='639' rx='24' fill='none' stroke='#fff' stroke-width='5' opacity='.65'/><rect x='30' y='30' width='840' height='615' rx='18' fill='none' stroke='${accent}' stroke-width='2' opacity='.45'/></svg>`;
 return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
const STICKERS={
'Seasonal':['🐰','🥕','🥚','🎄','🎅','❄️','🎃','👻','🦃','🍂','🎆','🇺🇸'],
'Military':['🪖','🎖️','⭐','🇺🇸','⚓','✈️','🚁','🛡️'],
'Travel':['✈️','🧳','🗺️','📍','🚗','🏨','🎫','📷'],
'Outdoors':['⛺','🏔️','🌲','🔥','🎣','🛶','🏖️','🌊','⚓','🏍️'],
'Animals':['🐕','🐈','🐐','🐎','🐦','🐾','🦋','🐝'],
'Events':['💍','🎂','🎓','🎉','🎈','💐','👶','🍼'],
'Food & Drinks':['🍔','🍕','🍰','☕','🍷','🍺','🍹','🥂'],
'Flowers':['🌻','🌹','🌸','🌼','🌺','🌷','🪻','🍀']
};
const SHAPES=['none','heart','star','flower','oval','hexagon','puzzle','polaroid','shell','beach','vintage'];
let state=null,history=[],future=[],selected=null,saveTimer=null,gesture=null,pendingShape=null;
let multiSelected=new Set(),editAll=false,frameAll=false,photoEditMode=false;
let renderController=null,lastLocalHash='',lastFirebaseHash='',syncPromise=Promise.resolve(),moveFrame=0,dirty=false,closing=false;
const imageAssets=new Map();
const uid=()=>localStorage.getItem('ofa-uid')||'local-user';
const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const clone=x=>typeof structuredClone==='function'?structuredClone(x):JSON.parse(JSON.stringify(x));
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function blank(){return {id:id(),title:'Untitled Scrapbook Page',theme:'Sea Glass',objects:[],updatedAt:Date.now(),owner:uid(),version:V}}
function normalize(raw){const next=raw&&Array.isArray(raw.objects)?raw:blank();next.version=V;next.theme=THEMES[next.theme]?next.theme:'Sea Glass';return next}
function load(){
 try{
  const primary=JSON.parse(localStorage.getItem(KEY)||'null');
  const recovery=JSON.parse(sessionStorage.getItem(RECOVERY_KEY)||'null');
  const best=recovery&&(!primary||Number(recovery.updatedAt)>Number(primary.updatedAt))?recovery:primary;
  const next=normalize(best);
  lastLocalHash=hash(JSON.stringify(next));
  return next;
 }catch(e){console.warn('Scrapbook recovery reset',e);return blank()}
}
function setStatus(text){const el=document.querySelector('#ss2-status');if(el)el.textContent=text}
function serializeCurrent(){state.updatedAt=Date.now();state.version=V;return JSON.stringify(state)}
async function storageSafe(serialized){
 try{
  if(!navigator.storage?.estimate)return true;
  const {usage=0,quota=0}=await navigator.storage.estimate();
  const projected=usage+new Blob([serialized]).size;
  return !quota||projected<quota*.94;
 }catch{return true}
}
async function persist({force=false,sync=true}={}){
 if(!state)return false;
 clearTimeout(saveTimer);saveTimer=null;
 const serialized=serializeCurrent();
 const currentHash=hash(serialized);
 if(!force&&!dirty&&currentHash===lastLocalHash){setStatus('Saved');return true}
 try{
  if(!(await storageSafe(serialized)))throw new DOMException('Device storage is nearly full','QuotaExceededError');
  localStorage.setItem(KEY,serialized);
  sessionStorage.setItem(RECOVERY_KEY,serialized);
  lastLocalHash=currentHash;dirty=false;setStatus('Saved');
  if(sync)queueFirebaseSync(serialized,currentHash);
  return true;
 }catch(e){
  console.warn('Scrapbook save protection',e);
  try{sessionStorage.setItem(RECOVERY_KEY,serialized)}catch{}
  setStatus('Storage full · recovery kept');
  return false;
 }
}
function scheduleSave(){dirty=true;setStatus('Saving…');clearTimeout(saveTimer);saveTimer=setTimeout(()=>persist(),SAVE_DELAY)}
function queueFirebaseSync(serialized,currentHash){
 if(currentHash===lastFirebaseHash)return;
 syncPromise=syncPromise.catch(()=>{}).then(async()=>{
  try{
   const user=window.firebase?.auth?.().currentUser;
   if(!user||!window.firebase?.database)return;
   if(currentHash===lastFirebaseHash)return;
   const payload=JSON.parse(serialized);
   await firebase.database().ref(`families/default-family/scrapbookStudioV2/${user.uid}/${payload.id}`).update(payload);
   lastFirebaseHash=currentHash;
  }catch(e){console.warn('Scrapbook 2 sync',e);setStatus('Saved on device')}
 });
}
function compactSnapshot(){
 const snap=clone(state);
 snap.objects.forEach(o=>{if(o.type==='photo'&&o.src){const key=`asset:${o.id}`;imageAssets.set(key,o.src);o.src=key}});
 return snap;
}
function restoreSnapshot(snap){
 const next=clone(snap);
 next.objects.forEach(o=>{if(o.type==='photo'&&String(o.src).startsWith('asset:'))o.src=imageAssets.get(o.src)||''});
 return next;
}
function snapshot(){
 history.push(compactSnapshot());
 if(history.length>HISTORY_LIMIT)history.shift();
 future=[];
 updateUndoButtons();
}
function undo(){if(!history.length)return;future.push(compactSnapshot());state=restoreSnapshot(history.pop());selected=null;renderStage();scheduleSave();updateUndoButtons()}
function redo(){if(!future.length)return;history.push(compactSnapshot());state=restoreSnapshot(future.pop());selected=null;renderStage();scheduleSave();updateUndoButtons()}
function updateUndoButtons(){['#ss2-undo','#ss2-mundo'].forEach(s=>{const e=document.querySelector(s);if(e)e.disabled=!history.length});['#ss2-redo','#ss2-mredo'].forEach(s=>{const e=document.querySelector(s);if(e)e.disabled=!future.length})}
function obj(){return state?.objects.find(x=>x.id===selected)}
function photos(){return state.objects.filter(o=>o.type==='photo')}
function photoNumber(o){return photos().findIndex(p=>p.id===o.id)+1}
function editTargets(){const current=obj();if(editAll&&multiSelected.size)return photos().filter(o=>multiSelected.has(o.id));return current?[current]:[]}
function frameTargets(){if(frameAll)return photos();if(multiSelected.size)return photos().filter(o=>multiSelected.has(o.id));const current=obj();return current&&current.type==='photo'?[current]:[]}
function add(type,extra={}){snapshot();const base={id:id(),type,x:110,y:90,w:220,h:170,r:0,z:state.objects.length+1,locked:false,opacity:1,group:null};state.objects.push(Object.assign(base,extra));selected=base.id;renderStage();scheduleSave()}
async function compressImage(file){
 const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
 try{
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=data});
  const ratio=Math.min(1,MAX_IMAGE_EDGE/Math.max(img.naturalWidth,img.naturalHeight));
  if(ratio===1&&file.size<1_500_000)return data;
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
  canvas.getContext('2d',{alpha:false}).drawImage(img,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',.82);
 }catch{return data}
}
async function addPhoto(file,shape='none'){
 setStatus('Preparing photo…');
 const src=await compressImage(file);
 add('photo',{src,name:file.name||'',shape,border:'#fff',borderWidth:0,shadow:0,glow:0,fit:'cover',flipX:1,flipY:1,photoScale:1,photoX:0,photoY:0});
}
function addText(){add('text',{text:'Double-tap to edit',fontSize:34,color:'#263238',fontWeight:700,w:330,h:90})}
function addSticker(text){add('sticker',{text,fontSize:70,w:100,h:100})}
function render(){
 document.body.classList.add('ss2-open');document.querySelector('.ss2')?.remove();
 document.body.insertAdjacentHTML('beforeend',`<section class="ss2"><div class="ss2-top"><button id="ss2-close">← App</button><h2>Scrapbook Studio 2.0</h2><input id="ss2-title" value="${esc(state.title)}" aria-label="Page title"><span id="ss2-status">Saved</span><button class="desktop" id="ss2-undo">Undo</button><button class="desktop" id="ss2-redo">Redo</button><button class="primary" id="ss2-export">PDF/JPEG</button><button class="ss2-mobiletool" data-panel=".ss2-left">＋ Add</button><button class="ss2-mobiletool" id="ss2-mundo">↶</button><button class="ss2-mobiletool" id="ss2-mredo">↷</button><button class="ss2-mobiletool" data-panel=".ss2-right">☷ Edit</button></div><div class="ss2-body"><aside class="ss2-panel ss2-left"><button class="ss2-panel-close" type="button" aria-label="Close add panel">×</button><h3>Add</h3><div class="ss2-grid"><button id="ss2-photo">📷</button><button id="ss2-text">T</button><button id="ss2-emoji">😊</button></div><input hidden multiple type="file" accept="image/*" id="ss2-files"><h3>Scrapbook layouts</h3><p>Complete illustrated papers, borders, and decorations.</p><select id="ss2-theme">${Object.keys(THEMES).map(t=>`<option ${t===state.theme?'selected':''}>${t}</option>`).join('')}</select><h3>Frames</h3><label class="ss2-check"><input id="ss2-frame-all" type="checkbox" ${frameAll?'checked':''}> Add frame to every photo</label><p>Or check photos in Edit to frame only those.</p><div class="ss2-grid">${SHAPES.map(s=>`<button data-frame="${s}" title="${s}">${({none:'▢',heart:'❤️',star:'⭐',flower:'🌸',oval:'⭕',hexagon:'🔷',puzzle:'🧩',polaroid:'📷',shell:'🌊',beach:'🏖️',vintage:'📜'})[s]}</button>`).join('')}</div><div id="ss2-stickers">${Object.entries(STICKERS).map(([g,a])=>`<h3>${g}</h3><div class="ss2-grid">${a.map(s=>`<button data-sticker="${s}">${s}</button>`).join('')}</div>`).join('')}</div></aside><main class="ss2-stage-wrap"><div class="ss2-stage-viewport"><div class="ss2-stage" id="ss2-stage"></div></div></main><aside class="ss2-panel ss2-right"><button class="ss2-panel-close" type="button" aria-label="Close edit panel">×</button><h3>Edit</h3><div class="ss2-controls" id="ss2-controls"></div><h3>Layers</h3><div class="ss2-list" id="ss2-layers"></div></aside></div></section>`);
 bind();renderStage();fit();updateUndoButtons();
}
function objectMarkup(o){
 const style=`width:${o.w}px;height:${o.h}px;transform:translate3d(${o.x}px,${o.y}px,0) rotate(${o.r}deg) scale(${o.flipX||1},${o.flipY||1});z-index:${o.z};opacity:${o.opacity??1}`;
 const photoDecor=o.type==='photo'?`border-color:${o.border||'#fff'};border-width:${o.borderWidth||0}px;box-shadow:0 ${Math.max(2,o.shadow||0)/2}px ${o.shadow||0}px #0007,0 0 ${o.glow||0}px #fff;`:'';
 let inner='';
 if(o.type==='photo')inner=`<div class="ss2-object-content ss2-frame" data-shape="${o.shape||'none'}" style="${photoDecor}"><img draggable="false" src="${o.src}" style="object-fit:${o.fit||'cover'};transform:translate3d(${o.photoX||0}px,${o.photoY||0}px,0) scale(${o.photoScale||1})"></div><span class="ss2-photo-number">${photoNumber(o)}</span>`;
 else inner=`<div class="ss2-object-content"><div class="ss2-text" style="font-size:${o.type==='sticker'?Math.max(18,Math.min(o.w,o.h)*.72):(o.fontSize||50)}px;color:${o.color||'#263238'};font-weight:${o.fontWeight||400}">${esc(o.text)}</div></div>`;
 if(o.id===selected)inner+='<button class="ss2-resize-handle" type="button" aria-label="Resize selected object"></button>';
 const cls=`ss2-object ${o.id===selected?'selected':''} ${multiSelected.has(o.id)?'multi-selected':''} ${o.locked?'locked':''}`;
 return `<div class="${cls}" data-id="${o.id}" style="${style}">${inner}</div>`;
}
function renderStage(){
 const st=document.querySelector('#ss2-stage');if(!st||!state)return;
 const th=THEMES[state.theme]||THEMES['Sea Glass'];st.style.background=th[0];st.style.backgroundImage=themeArt(state.theme);st.style.backgroundSize='cover';st.style.backgroundPosition='center';st.dataset.corner='';
 st.innerHTML=state.objects.length?state.objects.slice().sort((a,b)=>a.z-b.z).map(objectMarkup).join(''):'<div class="ss2-empty">Tap + to add photos, stickers, or text</div>';
 st.querySelectorAll('.ss2-object').forEach(el=>{el.onpointerdown=startGesture;el.ondblclick=editObject});
 renderControls();renderLayers();
}
function renderControls(){
 const c=document.querySelector('#ss2-controls'),o=obj();if(!c)return;if(!o){c.innerHTML=`${photoSelectionTools()}<p>Select an object on the page or choose a numbered photo below.</p>`;return}
 const targets=editTargets(),sizeName=o.type==='photo'?'Frame':o.type==='sticker'?'Sticker':'Object';
 const photoTools=o.type==='photo'?`<h3>Photo inside frame</h3><button data-action="inside" class="${photoEditMode?'active':''}">${photoEditMode?'Move photo now':'Edit photo inside frame'}</button><p class="ss2-help">Use these sliders or turn on photo editing and drag the photo.</p><label>Photo zoom <input data-photo-prop="photoScale" type="range" min=".25" max="4" step=".05" value="${o.photoScale||1}"></label><label>Photo left / right <input data-photo-prop="photoX" type="range" min="-500" max="500" value="${o.photoX||0}"></label><label>Photo up / down <input data-photo-prop="photoY" type="range" min="-400" max="400" value="${o.photoY||0}"></label><div class="ss2-grid"><button data-action="centerphoto">Center</button><button data-action="fit">Fit</button><button data-action="fill">Fill</button><button data-action="flipx">Flip ↔</button><button data-action="flipy">Flip ↕</button><button data-action="replace">Replace</button></div><h3>Frame style</h3><label>Border <input data-prop="border" type="color" value="${o.border||'#ffffff'}"></label><label>Border thickness <input data-prop="borderWidth" type="range" min="0" max="40" value="${o.borderWidth||0}"></label><label>Shadow <input data-prop="shadow" type="range" min="0" max="50" value="${o.shadow||0}"></label><label>Glow <input data-prop="glow" type="range" min="0" max="40" value="${o.glow||0}"></label>`:'';
 c.innerHTML=`<h3>${o.type==='photo'?'Photo '+photoNumber(o):o.type}</h3>${photoSelectionTools()}${editAll&&targets.length?`<p class="ss2-bulk-note">Editing ${targets.length} checked photos together.</p>`:''}<div class="ss2-grid"><button data-action="forward">Forward</button><button data-action="back">Back</button><button data-action="duplicate">Duplicate</button><button data-action="lock">${o.locked?'Unlock':'Lock'}</button><button data-action="group">${o.group?'Ungroup':'Group'}</button><button data-action="delete">Delete</button></div><h3>${sizeName} size</h3><label>${sizeName} width <input data-prop="w" type="range" min="30" max="850" value="${o.w}"></label><label>${sizeName} height <input data-prop="h" type="range" min="30" max="630" value="${o.h}"></label><label>Rotate <input data-prop="r" type="range" min="-180" max="180" value="${o.r}"></label><label>Opacity <input data-prop="opacity" type="range" min=".1" max="1" step=".05" value="${o.opacity??1}"></label>${photoTools}`;
 c.querySelectorAll('[data-prop]').forEach(input=>{
  let captured=false;
  const capture=()=>{if(!captured){snapshot();captured=true}};
  input.onpointerdown=capture;input.onfocus=capture;
  input.oninput=()=>{capture();editTargets().forEach(current=>{current[input.dataset.prop]=input.type==='range'?Number(input.value):input.value;updateObjectElement(current)});scheduleSave()};
  input.onchange=()=>{captured=false;renderControls()};
 });
 c.querySelectorAll('[data-photo-prop]').forEach(input=>{
  let captured=false;const capture=()=>{if(!captured){snapshot();captured=true}};input.onpointerdown=capture;input.onfocus=capture;
  input.oninput=()=>{capture();editTargets().filter(current=>current.type==='photo').forEach(current=>{current[input.dataset.photoProp]=Number(input.value);updateObjectElement(current)});scheduleSave()};
  input.onchange=()=>{captured=false;renderControls()};
 });
 c.querySelectorAll('[data-action]').forEach(e=>e.onclick=()=>action(e.dataset.action));
 const all=document.querySelector('#ss2-select-all'),none=document.querySelector('#ss2-select-none'),bulk=document.querySelector('#ss2-edit-all');
 if(all)all.onclick=()=>{multiSelected=new Set(photos().map(x=>x.id));renderStage()};
 if(none)none.onclick=()=>{multiSelected.clear();editAll=false;renderStage()};
 if(bulk)bulk.onchange=()=>{editAll=bulk.checked;if(editAll&&!multiSelected.size)multiSelected=new Set(photos().map(x=>x.id));renderStage()};
}
function photoSelectionTools(){if(!photos().length)return'';return `<div class="ss2-selection-tools"><button id="ss2-select-all">Select all photos</button><button id="ss2-select-none">Clear</button></div><label class="ss2-check"><input id="ss2-edit-all" type="checkbox" ${editAll?'checked':''}> Edit checked photos together</label>`}
function updateObjectElement(o){const el=document.querySelector(`.ss2-object[data-id="${CSS.escape(o.id)}"]`);if(!el){renderStage();return}const fresh=document.createRange().createContextualFragment(objectMarkup(o)).firstElementChild;el.replaceWith(fresh);fresh.onpointerdown=startGesture;fresh.ondblclick=editObject}
function renderLayers(){const l=document.querySelector('#ss2-layers');if(!l)return;l.innerHTML=state.objects.slice().sort((a,b)=>b.z-a.z).map(o=>{if(o.type==='photo'){const n=photoNumber(o);return `<div class="ss2-layer-row ${o.id===selected?'active':''}"><button data-layer="${o.id}"><img src="${o.src}" alt=""><span><b>Photo ${n}</b><small>${o.shape&&o.shape!=='none'?o.shape+' frame':'No frame'}</small></span></button><label title="Include Photo ${n} in bulk edits"><input data-multi="${o.id}" type="checkbox" ${multiSelected.has(o.id)?'checked':''}><span>Select</span></label></div>`}return `<div class="ss2-layer-row ${o.id===selected?'active':''}"><button data-layer="${o.id}"><span><b>${o.locked?'🔒 ':''}${o.type==='text'?'T '+esc(o.text).slice(0,18):o.text+' sticker'}</b></span></button></div>`}).join('');l.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>{selected=b.dataset.layer;photoEditMode=false;renderStage()});l.querySelectorAll('[data-multi]').forEach(i=>i.onchange=()=>{i.checked?multiSelected.add(i.dataset.multi):multiSelected.delete(i.dataset.multi);renderStage()})}
function action(a){
 const o=obj();if(!o)return;if(a==='inside'){photoEditMode=!photoEditMode;renderStage();return}snapshot();
 if(a==='delete'){state.objects=state.objects.filter(x=>x.id!==o.id);multiSelected.delete(o.id);selected=null}
 if(a==='duplicate'){const n=clone(o);n.id=id();n.x+=24;n.y+=24;n.z=Math.max(0,...state.objects.map(x=>x.z))+1;state.objects.push(n);selected=n.id}
 if(a==='lock')o.locked=!o.locked;
 if(a==='forward')o.z=Math.max(0,...state.objects.map(x=>x.z))+1;
 if(a==='back')o.z=Math.min(0,...state.objects.map(x=>x.z))-1;
 if(a==='group'){if(o.group){const g=o.group;state.objects.filter(x=>x.group===g).forEach(x=>x.group=null)}else{o.group=id()}}
 const targetPhotos=editTargets().filter(x=>x.type==='photo');
 if(a==='fit')targetPhotos.forEach(x=>x.fit='contain');if(a==='fill')targetPhotos.forEach(x=>x.fit='cover');if(a==='flipx')targetPhotos.forEach(x=>x.flipX=(x.flipX||1)*-1);if(a==='flipy')targetPhotos.forEach(x=>x.flipY=(x.flipY||1)*-1);
 if(a==='centerphoto')targetPhotos.forEach(x=>{x.photoX=0;x.photoY=0});
 if(a==='replace'){pendingShape=o.shape||'none';document.querySelector('#ss2-files').dataset.replace=o.id;document.querySelector('#ss2-files').click();return}
 renderStage();scheduleSave();
}
function editObject(){selected=this.dataset.id;const o=obj();if(!o||o.locked)return;if(o.type==='text'){const text=prompt('Edit text',o.text);if(text!==null){snapshot();o.text=text;renderStage();scheduleSave()}}else renderStage()}
function startGesture(e){
 selected=this.dataset.id;const o=obj();if(!o||o.locked||e.button>0)return;e.preventDefault();
 try{this.setPointerCapture(e.pointerId)}catch{}
 const mode=e.target.closest('.ss2-resize-handle')?'resize':photoEditMode&&o.type==='photo'?'photo':'move';
 snapshot();gesture={pointerId:e.pointerId,x:e.clientX,y:e.clientY,ox:o.x,oy:o.y,ow:o.w,oh:o.h,opx:o.photoX||0,opy:o.photoY||0,mode,o,el:this,lastX:e.clientX,lastY:e.clientY};
 this.onpointermove=moveGesture;this.onpointerup=endGesture;this.onpointercancel=endGesture;renderControls();renderLayers();
}
function moveGesture(e){if(!gesture||e.pointerId!==gesture.pointerId)return;gesture.lastX=e.clientX;gesture.lastY=e.clientY;if(moveFrame)return;moveFrame=requestAnimationFrame(()=>{moveFrame=0;if(!gesture)return;const s=scale(),dx=(gesture.lastX-gesture.x)/s,dy=(gesture.lastY-gesture.y)/s,o=gesture.o;if(gesture.mode==='resize'){o.w=Math.max(40,Math.min(900-o.x,gesture.ow+dx));o.h=Math.max(40,Math.min(675-o.y,gesture.oh+dy));gesture.el.style.width=`${o.w}px`;gesture.el.style.height=`${o.h}px`;const sticker=gesture.el.querySelector('.ss2-text');if(o.type==='sticker'&&sticker)sticker.style.fontSize=`${Math.max(18,Math.min(o.w,o.h)*.72)}px`}else if(gesture.mode==='photo'){o.photoX=gesture.opx+dx;o.photoY=gesture.opy+dy;const img=gesture.el.querySelector('img');if(img)img.style.transform=`translate3d(${o.photoX}px,${o.photoY}px,0) scale(${o.photoScale||1})`}else{o.x=Math.max(-o.w+30,Math.min(870,gesture.ox+dx));o.y=Math.max(-o.h+30,Math.min(645,gesture.oy+dy));gesture.el.style.transform=`translate3d(${o.x}px,${o.y}px,0) rotate(${o.r}deg) scale(${o.flipX||1},${o.flipY||1})`}})}
function endGesture(e){if(!gesture||e.pointerId!==gesture.pointerId)return;if(moveFrame){cancelAnimationFrame(moveFrame);moveFrame=0}const el=gesture.el;gesture=null;el.onpointermove=null;el.onpointerup=null;el.onpointercancel=null;renderStage();scheduleSave()}
function scale(){return Number(document.querySelector('#ss2-stage')?.dataset.scale||1)}
function fit(){
 const wrap=document.querySelector('.ss2-stage-wrap'),viewport=document.querySelector('.ss2-stage-viewport'),st=document.querySelector('#ss2-stage');if(!wrap||!viewport||!st)return;
 const rect=wrap.getBoundingClientRect(),css=getComputedStyle(wrap);
 const px=v=>Number.parseFloat(v)||0;
 const viewportWidth=Math.min(rect.width,document.documentElement.clientWidth||innerWidth);
 const viewportHeight=Math.min(rect.height,window.visualViewport?.height||innerHeight);
 const availableWidth=Math.max(1,viewportWidth-px(css.paddingLeft)-px(css.paddingRight));
 const availableHeight=Math.max(1,viewportHeight-px(css.paddingTop)-px(css.paddingBottom));
 const s=Math.max(.1,Math.min(1,availableWidth/900,availableHeight/675));
 viewport.style.width=`${900*s}px`;viewport.style.height=`${675*s}px`;
 st.style.transform=`scale(${s})`;st.dataset.scale=String(s);
}
function closePanels(){document.querySelectorAll('.ss2-panel.open').forEach(p=>p.classList.remove('open'))}
function applyFrame(shape){
 const targets=frameTargets();if(!targets.length){alert('Select a photo, check photos in Edit, or turn on “Add frame to every photo.”');return}
 snapshot();targets.forEach(o=>{o.shape=shape;if(shape==='none'){o.borderWidth=0;o.shadow=0;o.glow=0}else if(!Number(o.borderWidth)){o.borderWidth=6}});
 renderStage();scheduleSave();closePanels();
}
function bind(){
 renderController?.abort();renderController=new AbortController();const {signal}=renderController;
 const on=(target,type,fn,options={})=>target?.addEventListener(type,fn,{...options,signal});
 on(document.querySelector('#ss2-close'),'click',close);
 on(document.querySelector('#ss2-title'),'input',e=>{state.title=e.target.value;scheduleSave()});
 on(document.querySelector('#ss2-undo'),'click',undo);on(document.querySelector('#ss2-redo'),'click',redo);on(document.querySelector('#ss2-mundo'),'click',undo);on(document.querySelector('#ss2-mredo'),'click',redo);
 on(document.querySelector('#ss2-photo'),'click',()=>{pendingShape='none';document.querySelector('#ss2-files').click()});
 on(document.querySelector('#ss2-files'),'change',handleFiles);
 on(document.querySelector('#ss2-text'),'click',addText);on(document.querySelector('#ss2-emoji'),'click',()=>{const text=prompt('Enter emoji','😊');if(text)addSticker(text)});
 on(document.querySelector('#ss2-frame-all'),'change',e=>{frameAll=e.target.checked});
 document.querySelectorAll('[data-frame]').forEach(b=>on(b,'click',()=>applyFrame(b.dataset.frame)));
 document.querySelectorAll('[data-sticker]').forEach(b=>on(b,'click',()=>addSticker(b.dataset.sticker)));
 on(document.querySelector('#ss2-theme'),'change',e=>{snapshot();state.theme=e.target.value;renderStage();scheduleSave();closePanels()});
 document.querySelectorAll('[data-panel]').forEach(b=>on(b,'click',()=>{const panel=document.querySelector(b.dataset.panel),wasOpen=panel?.classList.contains('open');closePanels();if(panel&&!wasOpen)panel.classList.add('open')}));
 document.querySelectorAll('.ss2-panel-close').forEach(b=>on(b,'click',closePanels));
 on(document.querySelector('#ss2-export'),'click',exportPage);
}
async function handleFiles(e){
 const input=e.currentTarget;const files=[...input.files];const replaceId=input.dataset.replace||'';delete input.dataset.replace;input.value='';
 const shape=pendingShape||'none';pendingShape=null;if(!files.length)return;
 if(replaceId){const target=state.objects.find(x=>x.id===replaceId);if(target){snapshot();target.src=await compressImage(files[0]);target.name=files[0].name||target.name||'';target.shape=shape;selected=target.id;renderStage();scheduleSave()}return}
 for(const file of files)await addPhoto(file,shape);
}
async function exportPage(){
 const editor=document.querySelector('.ss2');editor?.classList.add('exporting');setStatus('Exporting…');
 try{const canvas=await html2canvas(document.querySelector('#ss2-stage'),{scale:2,useCORS:true,backgroundColor:null});const jpeg=canvas.toDataURL('image/jpeg',.92);const a=document.createElement('a');a.href=jpeg;a.download=(state.title||'scrapbook')+'-10.3.4.jpg';a.click();const {jsPDF}=window.jspdf||{};if(jsPDF){const pdf=new jsPDF({orientation:'landscape',unit:'px',format:[900,675]});pdf.addImage(jpeg,'JPEG',0,0,900,675);pdf.save((state.title||'scrapbook')+'-10.3.4.pdf')}}finally{editor?.classList.remove('exporting');setStatus('Saved')}
}
function shouldOpen(){return location.hash.replace(/^#/,'').split('/')[0]==='scrapbook'}
function open(){if(document.querySelector('.ss2')||!shouldOpen())return;closing=false;state=load();history=[];future=[];selected=null;multiSelected.clear();editAll=false;frameAll=false;photoEditMode=false;render()}
async function close(){if(closing)return;closing=true;await persist({force:true});renderController?.abort();renderController=null;document.querySelector('.ss2')?.remove();document.body.classList.remove('ss2-open');if(location.hash.startsWith('#scrapbook'))location.hash='#home';closing=false}
window.addEventListener('resize',()=>{if(document.querySelector('.ss2'))fit()},{passive:true});
window.visualViewport?.addEventListener('resize',()=>{if(document.querySelector('.ss2'))fit()},{passive:true});
window.addEventListener('orientationchange',()=>requestAnimationFrame(fit),{passive:true});
window.addEventListener('hashchange',()=>{if(shouldOpen())open();else if(document.querySelector('.ss2'))close()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&state)persist({force:true})});
window.addEventListener('pagehide',()=>{if(state)persist({force:true})});
if(shouldOpen())setTimeout(open,50);
window.ScrapbookStudio2={open,version:V,save:()=>persist({force:true})};
})();
