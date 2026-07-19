
(()=>{'use strict';
const V='10.3', KEY='ofa-scrapbook-studio-2', THEMES={
'Sea Glass':['linear-gradient(135deg,#dff7f4,#a8d8d2 55%,#f6e6c8)','🐚'],
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
const SHAPES=['heart','star','flower','oval','hexagon','puzzle','polaroid','shell','beach','vintage'];
let state=null,history=[],future=[],selected=null,saveTimer=null,gesture=null;
const uid=()=>localStorage.getItem('ofa-uid')||'local-user';
const clone=x=>JSON.parse(JSON.stringify(x));
const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function blank(){return {id:id(),title:'Untitled Scrapbook Page',theme:'Sea Glass',objects:[],updatedAt:Date.now(),owner:uid(),version:V}}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return x&&x.objects?x:blank()}catch{return blank()}}
function persist(){state.updatedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(state));syncFirebase();setStatus('Saved')}
function debounce(){setStatus('Saving…');clearTimeout(saveTimer);saveTimer=setTimeout(persist,450)}
async function syncFirebase(){try{const u=window.firebase?.auth?.().currentUser;if(!u||!firebase.database)return;await firebase.database().ref(`families/default-family/scrapbookStudioV2/${u.uid}/${state.id}`).set(state)}catch(e){console.warn('Scrapbook 2 sync',e)}}
function snapshot(){history.push(clone(state));if(history.length>100)history.shift();future=[]}
function undo(){if(!history.length)return;future.push(clone(state));state=history.pop();selected=null;renderStage()}
function redo(){if(!future.length)return;history.push(clone(state));state=future.pop();selected=null;renderStage()}
function obj(){return state.objects.find(x=>x.id===selected)}
function add(type,extra={}){snapshot();const base={id:id(),type,x:110,y:90,w:220,h:170,r:0,z:state.objects.length+1,locked:false,opacity:1,group:null};state.objects.push(Object.assign(base,extra));selected=base.id;renderStage();debounce()}
function addPhoto(file,shape='polaroid'){const r=new FileReader();r.onload=()=>add('photo',{src:r.result,shape,border:'#fff',borderWidth:8,shadow:12,glow:0,fit:'cover',flipX:1,flipY:1,photoScale:1,photoX:0,photoY:0});r.readAsDataURL(file)}
function addText(){add('text',{text:'Double-tap to edit',fontSize:34,color:'#263238',fontWeight:700,w:330,h:90})}
function addSticker(s){add('sticker',{text:s,fontSize:70,w:100,h:100})}
function setStatus(t){const e=document.querySelector('#ss2-status');if(e)e.textContent=t}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function render(){
 document.body.classList.add('ss2-open');
 const old=document.querySelector('.ss2');if(old)old.remove();
 document.body.insertAdjacentHTML('beforeend',`<section class="ss2">
 <div class="ss2-top"><button id="ss2-close">← App</button><h2>Scrapbook Studio 2.0</h2><input id="ss2-title" value="${esc(state.title)}" aria-label="Page title"><span id="ss2-status">Saved</span><button class="desktop" id="ss2-undo">Undo</button><button class="desktop" id="ss2-redo">Redo</button><button class="primary" id="ss2-export">PDF/JPEG</button></div>
 <div class="ss2-body"><aside class="ss2-panel ss2-left"><h3>Add</h3><div class="ss2-grid"><button id="ss2-photo">📷</button><button id="ss2-text">T</button><button id="ss2-emoji">😊</button></div><input hidden multiple type="file" accept="image/*" id="ss2-files">
 <h3>Frames</h3><div class="ss2-grid">${SHAPES.map(s=>`<button data-frame="${s}" title="${s}">${({heart:'❤️',star:'⭐',flower:'🌸',oval:'⭕',hexagon:'🔷',puzzle:'🧩',polaroid:'📷',shell:'🌊',beach:'🏖️',vintage:'📜'})[s]}</button>`).join('')}</div>
 <h3>Themes</h3><select id="ss2-theme">${Object.keys(THEMES).map(t=>`<option ${t===state.theme?'selected':''}>${t}</option>`).join('')}</select>
 <div id="ss2-stickers">${Object.entries(STICKERS).map(([g,a])=>`<h3>${g}</h3><div class="ss2-grid">${a.map(s=>`<button data-sticker="${s}">${s}</button>`).join('')}</div>`).join('')}</div></aside>
 <main class="ss2-stage-wrap"><div class="ss2-stage" id="ss2-stage"></div></main>
 <aside class="ss2-panel ss2-right"><h3>Object</h3><div class="ss2-controls" id="ss2-controls"></div><h3>Layers</h3><div class="ss2-list" id="ss2-layers"></div></aside></div>
 <nav class="ss2-mobilebar"><button data-panel=".ss2-left">＋ Add</button><button id="ss2-mundo">↶</button><button id="ss2-mredo">↷</button><button data-panel=".ss2-right">☷ Edit</button></nav></section>`);
 bind();renderStage();fit();
}
function renderStage(){
 const st=document.querySelector('#ss2-stage');if(!st)return;
 const th=THEMES[state.theme]||THEMES['Sea Glass'];st.style.background=th[0];st.dataset.corner=th[1];
 st.innerHTML=state.objects.slice().sort((a,b)=>a.z-b.z).map(o=>{
 const style=`width:${o.w}px;height:${o.h}px;transform:translate(${o.x}px,${o.y}px) rotate(${o.r}deg) scale(${o.flipX||1},${o.flipY||1});z-index:${o.z};opacity:${o.opacity??1}`;
 let inner=o.type==='photo'?`<img src="${o.src}" style="object-fit:${o.fit||'cover'};transform:translate(${o.photoX||0}px,${o.photoY||0}px) scale(${o.photoScale||1})">`:`<div class="ss2-text" style="font-size:${o.fontSize||50}px;color:${o.color||'#263238'};font-weight:${o.fontWeight||400}">${esc(o.text)}</div>`;
 const cls=`ss2-object ${o.type==='photo'?'ss2-frame':''} ${o.id===selected?'selected':''} ${o.locked?'locked':''}`;
 const decor=o.type==='photo'?`border-color:${o.border||'#fff'};border-width:${o.borderWidth||0}px;box-shadow:0 ${Math.max(2,o.shadow||0)/2}px ${o.shadow||0}px #0007,0 0 ${o.glow||0}px #fff;`:'';
 return `<div class="${cls}" data-id="${o.id}" data-shape="${o.shape||''}" style="${style};${decor}">${inner}</div>`}).join('');
 st.querySelectorAll('.ss2-object').forEach(el=>{el.onpointerdown=startGesture;el.ondblclick=editObject});
 renderControls();renderLayers();debounce();
}
function renderControls(){const c=document.querySelector('#ss2-controls'),o=obj();if(!c)return;if(!o){c.innerHTML='<p>Select an object.</p>';return}
 c.innerHTML=`<div class="ss2-grid"><button data-action="forward">Forward</button><button data-action="back">Back</button><button data-action="duplicate">Duplicate</button><button data-action="lock">${o.locked?'Unlock':'Lock'}</button><button data-action="group">Group</button><button data-action="delete">Delete</button></div>
 <label>Width <input data-prop="w" type="range" min="30" max="800" value="${o.w}"></label><label>Height <input data-prop="h" type="range" min="30" max="600" value="${o.h}"></label><label>Rotate <input data-prop="r" type="range" min="-180" max="180" value="${o.r}"></label><label>Opacity <input data-prop="opacity" type="range" min=".1" max="1" step=".05" value="${o.opacity??1}"></label>
 ${o.type==='photo'?`<label>Border <input data-prop="border" type="color" value="${o.border||'#ffffff'}"></label><label>Border thickness <input data-prop="borderWidth" type="range" min="0" max="40" value="${o.borderWidth||0}"></label><label>Shadow <input data-prop="shadow" type="range" min="0" max="50" value="${o.shadow||0}"></label><label>Glow <input data-prop="glow" type="range" min="0" max="40" value="${o.glow||0}"></label><div class="ss2-grid"><button data-action="fit">Fit</button><button data-action="fill">Fill</button><button data-action="flipx">Flip ↔</button><button data-action="flipy">Flip ↕</button><button data-action="replace">Replace</button></div>`:''}`;
 c.querySelectorAll('[data-prop]').forEach(e=>e.oninput=()=>{snapshot();let v=e.type==='range'?Number(e.value):e.value;o[e.dataset.prop]=v;renderStage()});
 c.querySelectorAll('[data-action]').forEach(e=>e.onclick=()=>action(e.dataset.action));
}
function renderLayers(){const l=document.querySelector('#ss2-layers');if(l)l.innerHTML=state.objects.slice().sort((a,b)=>b.z-a.z).map(o=>`<button data-layer="${o.id}">${o.locked?'🔒 ':''}${o.type==='photo'?'📷':o.type==='text'?'T':'😊'} ${esc(o.text||o.shape||'Photo')}</button>`).join('');l?.querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=b.dataset.layer;renderStage()})}
function action(a){const o=obj();if(!o)return;snapshot();if(a==='delete')state.objects=state.objects.filter(x=>x.id!==o.id);if(a==='duplicate'){const n=clone(o);n.id=id();n.x+=24;n.y+=24;n.z=state.objects.length+1;state.objects.push(n);selected=n.id}if(a==='lock')o.locked=!o.locked;if(a==='forward')o.z=Math.max(...state.objects.map(x=>x.z))+1;if(a==='back')o.z=Math.min(...state.objects.map(x=>x.z))-1;if(a==='group'){const g=o.group||id();o.group=o.group?null:g;state.objects.filter(x=>x.id!==o.id&&x.id===selected).forEach(x=>x.group=g)}if(a==='fit')o.fit='contain';if(a==='fill')o.fit='cover';if(a==='flipx')o.flipX=(o.flipX||1)*-1;if(a==='flipy')o.flipY=(o.flipY||1)*-1;if(a==='replace')document.querySelector('#ss2-files').click();renderStage()}
function editObject(){selected=this.dataset.id;const o=obj();if(!o||o.locked)return;if(o.type!=='photo'){const t=prompt(o.type==='text'?'Edit text':'Edit sticker',o.text);if(t!==null){snapshot();o.text=t;renderStage()}}}
function startGesture(e){selected=this.dataset.id;const o=obj();if(!o||o.locked)return;e.preventDefault();this.setPointerCapture(e.pointerId);snapshot();gesture={x:e.clientX,y:e.clientY,ox:o.x,oy:o.y,o};this.onpointermove=moveGesture;this.onpointerup=endGesture;renderControls();renderLayers()}
function moveGesture(e){if(!gesture)return;gesture.o.x=gesture.ox+(e.clientX-gesture.x)/scale();gesture.o.y=gesture.oy+(e.clientY-gesture.y)/scale();this.style.transform=`translate(${gesture.o.x}px,${gesture.o.y}px) rotate(${gesture.o.r}deg) scale(${gesture.o.flipX||1},${gesture.o.flipY||1})`}
function endGesture(){gesture=null;this.onpointermove=null;this.onpointerup=null;debounce()}
function scale(){const st=document.querySelector('#ss2-stage');return Number(st?.dataset.scale||1)}
function fit(){const wrap=document.querySelector('.ss2-stage-wrap'),st=document.querySelector('#ss2-stage');if(!wrap||!st)return;const s=Math.min(1,(wrap.clientWidth-24)/900,(wrap.clientHeight-30)/675);st.style.transform=`scale(${s})`;st.dataset.scale=s;st.style.marginBottom=`${675*(s-1)}px`}
function bind(){
 document.querySelector('#ss2-close').onclick=()=>{persist();document.querySelector('.ss2')?.remove();document.body.classList.remove('ss2-open');if(location.hash.startsWith('#scrapbook'))location.hash='#home'};
 document.querySelector('#ss2-title').oninput=e=>{state.title=e.target.value;debounce()};document.querySelector('#ss2-undo').onclick=undo;document.querySelector('#ss2-redo').onclick=redo;document.querySelector('#ss2-mundo').onclick=undo;document.querySelector('#ss2-mredo').onclick=redo;
 document.querySelector('#ss2-photo').onclick=()=>document.querySelector('#ss2-files').click();document.querySelector('#ss2-files').onchange=e=>[...e.target.files].forEach(f=>addPhoto(f));
 document.querySelector('#ss2-text').onclick=addText;document.querySelector('#ss2-emoji').onclick=()=>{const t=prompt('Enter emoji','😊');if(t)addSticker(t)};
 document.querySelectorAll('[data-frame]').forEach(b=>b.onclick=()=>{document.querySelector('#ss2-files').dataset.shape=b.dataset.frame;document.querySelector('#ss2-files').click()});
 document.querySelector('#ss2-files').addEventListener('change',e=>{const sh=e.currentTarget.dataset.shape;if(sh){[...e.target.files].forEach(f=>addPhoto(f,sh));delete e.currentTarget.dataset.shape;e.target.value=''}});
 document.querySelectorAll('[data-sticker]').forEach(b=>b.onclick=()=>addSticker(b.dataset.sticker));document.querySelector('#ss2-theme').onchange=e=>{snapshot();state.theme=e.target.value;renderStage()};
 document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>document.querySelector(b.dataset.panel).classList.toggle('open'));
 document.querySelector('#ss2-export').onclick=async()=>{selected=null;renderStage();const canvas=await html2canvas(document.querySelector('#ss2-stage'),{scale:3,useCORS:true,backgroundColor:null});const a=document.createElement('a');a.href=canvas.toDataURL('image/jpeg',.95);a.download=(state.title||'scrapbook')+'-10.3.jpg';a.click();const {jsPDF}=window.jspdf||{};if(jsPDF){const pdf=new jsPDF({orientation:'landscape',unit:'px',format:[900,675]});pdf.addImage(canvas.toDataURL('image/jpeg',.95),'JPEG',0,0,900,675);pdf.save((state.title||'scrapbook')+'-10.3.pdf')}};
 window.addEventListener('resize',fit,{passive:true});
}
function shouldOpen(){return location.hash.replace(/^#/,'').split('/')[0]==='scrapbook'}
function open(){if(document.querySelector('.ss2'))return;state=load();history=[];future=[];selected=null;render()}
const obs=new MutationObserver(()=>{if(shouldOpen())open()});obs.observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('hashchange',()=>{if(shouldOpen())setTimeout(open,20)});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&state)persist()});window.addEventListener('pagehide',()=>state&&persist());
if(shouldOpen())setTimeout(open,100);
window.ScrapbookStudio2={open,version:V};
})();
