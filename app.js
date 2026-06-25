const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const storeKey = 'projectLighthouseBuild9';
const defaultState = {
  people:[{name:'Melissa',photo:''},{name:'Bob',photo:''},{name:'Emily',photo:''}],
  trips:[{name:'Nags Head 2027',privacy:'Everyone',people:'Everyone',created:new Date().toISOString()}],
  memories:[{title:'First light from the lighthouse',story:'The beginning of Chapter One.',type:'image',src:'assets/lighthouse-home.png',tags:['Melissa'],reactions:{love:1,laugh:0,tears:0,favorite:1},created:new Date().toISOString()}],
  chats:[{text:'Welcome home. Build 0009 is ready for the family story.',created:new Date().toISOString()}]
};
let state = load();
function load(){try{return {...defaultState,...JSON.parse(localStorage.getItem(storeKey)||'{}')}}catch(e){return defaultState}}
function save(){localStorage.setItem(storeKey,JSON.stringify(state))}
function show(id){$$('.screen').forEach(s=>s.classList.remove('active')); $('#'+id)?.classList.add('active'); closeMenu(); window.scrollTo({top:0,behavior:'smooth'});}
function closeMenu(){ $('#sideMenu')?.classList.remove('open'); $('#sideMenu')?.setAttribute('aria-hidden','true'); }
function openMenu(){ $('#sideMenu')?.classList.add('open'); $('#sideMenu')?.setAttribute('aria-hidden','false'); }
function fileToDataURL(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});}
function daysUntil(dateStr){const today=new Date(); const target=new Date(dateStr+'T00:00:00'); return Math.max(0,Math.ceil((target-today)/(1000*60*60*24)));}
function renderCountdown(){const d=daysUntil('2027-06-12'); $('#countdown').textContent = d ? `${d} days until Nags Head` : `The chapter begins today`;}
function renderToday(){const el=$('#todayStory'); if(!el) return; el.innerHTML = `<p><strong>${state.memories.length}</strong> memories saved • <strong>${state.people.length}</strong> people added • <strong>${state.trips.length}</strong> chapters begun.</p>`;}
function renderPeople(){const wrap=$('#peopleList'); if(!wrap) return; wrap.innerHTML=state.people.map((p,i)=>`<article class="person-card"><div class="avatar">${p.photo?`<img src="${p.photo}" alt="${p.name}"/>`:p.name.slice(0,1).toUpperCase()}</div><div><h3>${p.name}</h3><small>${memoriesFor(p.name)} memories tagged</small></div><button class="tag" onclick="removePerson(${i})">Remove</button></article>`).join('');}
function memoriesFor(name){return state.memories.filter(m=>(m.tags||[]).includes(name)).length}
function removePerson(i){state.people.splice(i,1); save(); renderAll();}
function renderTrips(){const wrap=$('#tripList'); if(!wrap) return; wrap.innerHTML=state.trips.map((t,i)=>`<article class="card"><p class="eyebrow dark">${t.privacy}</p><h3>${t.name}</h3><small>${t.people||'Everyone'} • ${new Date(t.created).toLocaleDateString()}</small><div class="reactions"><button class="reaction" onclick="removeTrip(${i})">Remove</button></div></article>`).join('');}
function removeTrip(i){state.trips.splice(i,1); save(); renderAll();}
function renderMemories(){const wrap=$('#memoryList'); if(!wrap) return; wrap.innerHTML=state.memories.map((m,i)=>{const media=m.type==='video'?`<video class="memory-media" controls src="${m.src}"></video>`:`<img class="memory-media" src="${m.src}" alt="${m.title}"/>`;return `<article class="memory-card">${media}<h3>${m.title}</h3><p>${m.story||''}</p><div class="tag-row">${(m.tags||[]).map((tag,ti)=>`<span class="tag">@${tag}<button onclick="removeMemoryTag(${i},${ti})">×</button></span>`).join('')}</div><div class="reactions"><button class="reaction" onclick="react(${i},'love')">❤️ ${m.reactions?.love||0}</button><button class="reaction" onclick="react(${i},'laugh')">😂 ${m.reactions?.laugh||0}</button><button class="reaction" onclick="react(${i},'tears')">🥹 ${m.reactions?.tears||0}</button><button class="reaction" onclick="react(${i},'favorite')">⭐ ${m.reactions?.favorite||0}</button><button class="reaction" onclick="removeMemory(${i})">Delete</button></div></article>`}).join('');}
function removeMemoryTag(mi,ti){state.memories[mi].tags.splice(ti,1); save(); renderAll();}
function react(i,k){state.memories[i].reactions ||= {}; state.memories[i].reactions[k]=(state.memories[i].reactions[k]||0)+1; save(); renderAll();}
function removeMemory(i){state.memories.splice(i,1); save(); renderAll();}
function renderChat(){const wrap=$('#chatList'); if(!wrap) return; wrap.innerHTML=state.chats.map(c=>`<div class="chat-bubble">${formatMentions(c.text)}<br><small>${new Date(c.created).toLocaleString()}</small></div>`).join(''); wrap.scrollTop=wrap.scrollHeight;}
function formatMentions(text){return text.replace(/@([A-Za-z0-9_ -]+)/g,(m,n)=>`<span class="mention">@${n.trim()}</span>`)}
function renderTimeline(){const wrap=$('#timeline'); if(!wrap) return; const items=[...state.trips].sort((a,b)=>new Date(a.created)-new Date(b.created)); wrap.innerHTML=items.map((t,idx)=>`<div class="timeline-item"><p class="eyebrow dark">Chapter ${idx+1}</p><h3>${t.name}</h3><p>${t.privacy} • ${t.people||'Everyone'}</p></div>`).join('');}
function renderAll(){renderCountdown();renderToday();renderPeople();renderTrips();renderMemories();renderChat();renderTimeline();}
$$('[data-screen]').forEach(btn=>btn.addEventListener('click',()=>show(btn.dataset.screen)));
$('#menuBtn')?.addEventListener('click',openMenu); $('#closeMenu')?.addEventListener('click',closeMenu); $('#sideMenu')?.addEventListener('click',e=>{if(e.target.id==='sideMenu')closeMenu()});
$('#personForm')?.addEventListener('submit',async e=>{e.preventDefault();const name=$('#personName').value.trim(); if(!name)return; const file=$('#personPhoto').files[0]; state.people.push({name,photo:file?await fileToDataURL(file):''}); e.target.reset(); save(); renderAll();});
$('#tripForm')?.addEventListener('submit',e=>{e.preventDefault();const name=$('#tripName').value.trim(); if(!name)return; state.trips.push({name,privacy:$('#tripPrivacy').value,people:$('#tripPeople').value.trim()||'Everyone',created:new Date().toISOString()}); e.target.reset(); save(); renderAll();});
$('#memoryForm')?.addEventListener('submit',async e=>{e.preventDefault();const title=$('#memoryTitle').value.trim(); const file=$('#memoryFile').files[0]; if(!title||!file)return; const src=await fileToDataURL(file); const type=file.type.startsWith('video')?'video':'image'; const tags=$('#memoryTags').value.split(',').map(s=>s.trim()).filter(Boolean); state.memories.unshift({title,story:$('#memoryStory').value.trim(),type,src,tags,reactions:{love:0,laugh:0,tears:0,favorite:0},created:new Date().toISOString()}); e.target.reset(); save(); renderAll();});
$('#chatForm')?.addEventListener('submit',e=>{e.preventDefault();const input=$('#chatInput'); const text=input.value.trim(); if(!text)return; state.chats.push({text,created:new Date().toISOString()}); input.value=''; save(); renderAll();});
if('serviceWorker' in navigator){navigator.serviceWorker.register('service-worker.js').catch(()=>{});} 
renderAll();
setTimeout(()=>{ if($('#splash')?.classList.contains('active')){} },1000);
