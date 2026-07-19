(()=>{'use strict';
const V='10.3.3';
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
 document.body.insertAdjacentHTML('beforeend',`<section class="ss2"><div class="ss2-top"><button id="ss2-close">← App</button><h2>Scrapbook Studio 2.0</h2><input id="ss2-title" value="${esc(state.title)}" aria-label="Page title"><span id="ss2-status">Saved</span><button class="desktop" id="ss2-undo">Undo</button><button class="desktop" id="ss2-redo">Redo</button><button class="primary" id="ss2-export">PDF/JPEG</button></div><div class="ss2-body"><aside class="ss2-panel ss2-left"><h3>Add</h3><div class="ss2-grid"><button id="ss2-photo">📷</button><button id="ss2-text">T</button><button id="ss2-emoji">😊</button></div><input hidden multiple type="file" accept="image/*" id="ss2-files"><h3>Frames</h3><p>Select a photo, then choose its frame.</p><div class="ss2-grid">${SHAPES.map(s=>`<button data-frame="${s}" title="${s}">${({none:'▢',heart:'❤️',star:'⭐',flower:'🌸',oval:'⭕',hexagon:'🔷',puzzle:'🧩',polaroid:'📷',shell:'🌊',beach:'🏖️',vintage:'📜'})[s]}</button>`).join('')}</div><h3>Themes</h3><select id="ss2-theme">${Object.keys(THEMES).map(t=>`<option ${t===state.theme?'selected':''}>${t}</option>`).join('')}</select><div id="ss2-stickers">${Object.entries(STICKERS).map(([g,a])=>`<h3>${g}</h3><div class="ss2-grid">${a.map(s=>`<button data-sticker="${s}">${s}</button>`).join('')}</div>`).join('')}</div></aside><main class="ss2-stage-wrap"><div class="ss2-stage-viewport"><div class="ss2-stage" id="ss2-stage"></div></div></main><aside class="ss2-panel ss2-right"><h3>Object</h3><div class="ss2-controls" id="ss2-controls"></div><h3>Layers</h3><div class="ss2-list" id="ss2-layers"></div></aside></div><nav class="ss2-mobilebar"><button data-panel=".ss2-left">＋ Add</button><button id="ss2-mundo">↶</button><button id="ss2-mredo">↷</button><button data-panel=".ss2-right">☷ Edit</button></nav></section>`);
 bind();renderStage();fit();updateUndoButtons();
}
function objectMarkup(o){
 const style=`width:${o.w}px;height:${o.h}px;transform:translate3d(${o.x}px,${o.y}px,0) rotate(${o.r}deg) scale(${o.flipX||1},${o.flipY||1});z-index:${o.z};opacity:${o.opacity??1}`;
 const inner=o.type==='photo'?`<img draggable="false" src="${o.src}" style="object-fit:${o.fit||'cover'};transform:translate3d(${o.photoX||0}px,${o.photoY||0}px,0) scale(${o.photoScale||1})">`:`<div class="ss2-text" style="font-size:${o.fontSize||50}px;color:${o.color||'#263238'};font-weight:${o.fontWeight||400}">${esc(o.text)}</div>`;
 const cls=`ss2-object ${o.type==='photo'?'ss2-frame':''} ${o.id===selected?'selected':''} ${o.locked?'locked':''}`;
 const decor=o.type==='photo'?`border-color:${o.border||'#fff'};border-width:${o.borderWidth||0}px;box-shadow:0 ${Math.max(2,o.shadow||0)/2}px ${o.shadow||0}px #0007,0 0 ${o.glow||0}px #fff;`:'';
 return `<div class="${cls}" data-id="${o.id}" data-shape="${o.shape||'none'}" style="${style};${decor}">${inner}</div>`;
}
function renderStage(){
 const st=document.querySelector('#ss2-stage');if(!st||!state)return;
 const th=THEMES[state.theme]||THEMES['Sea Glass'];st.style.background=th[0];st.dataset.corner=th[1];
 st.innerHTML=state.objects.length?state.objects.slice().sort((a,b)=>a.z-b.z).map(objectMarkup).join(''):'<div class="ss2-empty">Tap + to add photos, stickers, or text</div>';
 st.querySelectorAll('.ss2-object').forEach(el=>{el.onpointerdown=startGesture;el.ondblclick=editObject});
 renderControls();renderLayers();
}
function renderControls(){
 const c=document.querySelector('#ss2-controls'),o=obj();if(!c)return;if(!o){c.innerHTML='<p>Select an object.</p>';return}
 c.innerHTML=`<div class="ss2-grid"><button data-action="forward">Forward</button><button data-action="back">Back</button><button data-action="duplicate">Duplicate</button><button data-action="lock">${o.locked?'Unlock':'Lock'}</button><button data-action="group">${o.group?'Ungroup':'Group'}</button><button data-action="delete">Delete</button></div><label>Width <input data-prop="w" type="range" min="30" max="800" value="${o.w}"></label><label>Height <input data-prop="h" type="range" min="30" max="600" value="${o.h}"></label><label>Rotate <input data-prop="r" type="range" min="-180" max="180" value="${o.r}"></label><label>Opacity <input data-prop="opacity" type="range" min=".1" max="1" step=".05" value="${o.opacity??1}"></label>${o.type==='photo'?`<label>Border <input data-prop="border" type="color" value="${o.border||'#ffffff'}"></label><label>Border thickness <input data-prop="borderWidth" type="range" min="0" max="40" value="${o.borderWidth||0}"></label><label>Shadow <input data-prop="shadow" type="range" min="0" max="50" value="${o.shadow||0}"></label><label>Glow <input data-prop="glow" type="range" min="0" max="40" value="${o.glow||0}"></label><div class="ss2-grid"><button data-action="fit">Fit</button><button data-action="fill">Fill</button><button data-action="flipx">Flip ↔</button><button data-action="flipy">Flip ↕</button><button data-action="replace">Replace</button></div>`:''}`;
 c.querySelectorAll('[data-prop]').forEach(input=>{
  let captured=false;
  const capture=()=>{if(!captured){snapshot();captured=true}};
  input.onpointerdown=capture;input.onfocus=capture;
  input.oninput=()=>{capture();const current=obj();if(!current)return;current[input.dataset.prop]=input.type==='range'?Number(input.value):input.value;updateObjectElement(current);scheduleSave()};
  input.onchange=()=>{captured=false;renderControls()};
 });
 c.querySelectorAll('[data-action]').forEach(e=>e.onclick=()=>action(e.dataset.action));
}
function updateObjectElement(o){const el=document.querySelector(`.ss2-object[data-id="${CSS.escape(o.id)}"]`);if(!el){renderStage();return}const fresh=document.createRange().createContextualFragment(objectMarkup(o)).firstElementChild;el.replaceWith(fresh);fresh.onpointerdown=startGesture;fresh.ondblclick=editObject}
function renderLayers(){const l=document.querySelector('#ss2-layers');if(!l)return;const photos=state.objects.filter(o=>o.type==='photo');l.innerHTML=state.objects.slice().sort((a,b)=>b.z-a.z).map(o=>{const label=o.type==='photo'?`Photo ${photos.indexOf(o)+1}`:(o.text||o.type);return `<button data-layer="${o.id}">${o.locked?'🔒 ':''}${o.type==='photo'?'📷':o.type==='text'?'T':'😊'} ${esc(label)}</button>`}).join('');l.querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=b.dataset.layer;renderStage()})}
function action(a){
 const o=obj();if(!o)return;snapshot();
 if(a==='delete'){state.objects=state.objects.filter(x=>x.id!==o.id);selected=null}
 if(a==='duplicate'){const n=clone(o);n.id=id();n.x+=24;n.y+=24;n.z=Math.max(0,...state.objects.map(x=>x.z))+1;state.objects.push(n);selected=n.id}
 if(a==='lock')o.locked=!o.locked;
 if(a==='forward')o.z=Math.max(0,...state.objects.map(x=>x.z))+1;
 if(a==='back')o.z=Math.min(0,...state.objects.map(x=>x.z))-1;
 if(a==='group'){if(o.group){const g=o.group;state.objects.filter(x=>x.group===g).forEach(x=>x.group=null)}else{o.group=id()}}
 if(a==='fit')o.fit='contain';if(a==='fill')o.fit='cover';if(a==='flipx')o.flipX=(o.flipX||1)*-1;if(a==='flipy')o.flipY=(o.flipY||1)*-1;
 if(a==='replace'){pendingShape=o.shape||'none';document.querySelector('#ss2-files').dataset.replace=o.id;document.querySelector('#ss2-files').click();return}
 renderStage();scheduleSave();
}
function editObject(){selected=this.dataset.id;const o=obj();if(!o||o.locked)return;if(o.type!=='photo'){const text=prompt(o.type==='text'?'Edit text':'Edit sticker',o.text);if(text!==null){snapshot();o.text=text;renderStage();scheduleSave()}}}
function startGesture(e){
 selected=this.dataset.id;const o=obj();if(!o||o.locked||e.button>0)return;e.preventDefault();
 try{this.setPointerCapture(e.pointerId)}catch{}
 snapshot();gesture={pointerId:e.pointerId,x:e.clientX,y:e.clientY,ox:o.x,oy:o.y,o,el:this,lastX:e.clientX,lastY:e.clientY};
 this.onpointermove=moveGesture;this.onpointerup=endGesture;this.onpointercancel=endGesture;renderControls();renderLayers();
}
function moveGesture(e){if(!gesture||e.pointerId!==gesture.pointerId)return;gesture.lastX=e.clientX;gesture.lastY=e.clientY;if(moveFrame)return;moveFrame=requestAnimationFrame(()=>{moveFrame=0;if(!gesture)return;const s=scale();gesture.o.x=gesture.ox+(gesture.lastX-gesture.x)/s;gesture.o.y=gesture.oy+(gesture.lastY-gesture.y)/s;gesture.el.style.transform=`translate3d(${gesture.o.x}px,${gesture.o.y}px,0) rotate(${gesture.o.r}deg) scale(${gesture.o.flipX||1},${gesture.o.flipY||1})`})}
function endGesture(e){if(!gesture||e.pointerId!==gesture.pointerId)return;if(moveFrame){cancelAnimationFrame(moveFrame);moveFrame=0}const el=gesture.el;gesture=null;el.onpointermove=null;el.onpointerup=null;el.onpointercancel=null;scheduleSave()}
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
 const o=obj();if(!o||o.type!=='photo'){alert('Tap a photo on the scrapbook page first, then choose a frame.');return}
 snapshot();o.shape=shape;
 if(shape==='none'){o.borderWidth=0;o.shadow=0;o.glow=0}else if(!Number(o.borderWidth)){o.borderWidth=6}
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
 document.querySelectorAll('[data-frame]').forEach(b=>on(b,'click',()=>applyFrame(b.dataset.frame)));
 document.querySelectorAll('[data-sticker]').forEach(b=>on(b,'click',()=>addSticker(b.dataset.sticker)));
 on(document.querySelector('#ss2-theme'),'change',e=>{snapshot();state.theme=e.target.value;renderStage();scheduleSave();closePanels()});
 document.querySelectorAll('[data-panel]').forEach(b=>on(b,'click',()=>{const panel=document.querySelector(b.dataset.panel),wasOpen=panel?.classList.contains('open');closePanels();if(panel&&!wasOpen)panel.classList.add('open')}));
 on(document.querySelector('#ss2-export'),'click',exportPage);
}
async function handleFiles(e){
 const input=e.currentTarget;const files=[...input.files];const replaceId=input.dataset.replace||'';delete input.dataset.replace;input.value='';
 const shape=pendingShape||'none';pendingShape=null;if(!files.length)return;
 if(replaceId){const target=state.objects.find(x=>x.id===replaceId);if(target){snapshot();target.src=await compressImage(files[0]);target.name=files[0].name||target.name||'';target.shape=shape;selected=target.id;renderStage();scheduleSave()}return}
 for(const file of files)await addPhoto(file,shape);
}
async function exportPage(){
 selected=null;renderStage();setStatus('Exporting…');
 try{const canvas=await html2canvas(document.querySelector('#ss2-stage'),{scale:2,useCORS:true,backgroundColor:null});const jpeg=canvas.toDataURL('image/jpeg',.92);const a=document.createElement('a');a.href=jpeg;a.download=(state.title||'scrapbook')+'-10.3.3.jpg';a.click();const {jsPDF}=window.jspdf||{};if(jsPDF){const pdf=new jsPDF({orientation:'landscape',unit:'px',format:[900,675]});pdf.addImage(jpeg,'JPEG',0,0,900,675);pdf.save((state.title||'scrapbook')+'-10.3.3.pdf')}}finally{setStatus('Saved')}
}
function shouldOpen(){return location.hash.replace(/^#/,'').split('/')[0]==='scrapbook'}
function open(){if(document.querySelector('.ss2')||!shouldOpen())return;closing=false;state=load();history=[];future=[];selected=null;render()}
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
