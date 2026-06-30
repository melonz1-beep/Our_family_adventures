(() => {
  'use strict';
  const VERSION = window.OFA_VERSION || '6.2.9';
  const ADMIN_PIN = window.OFA_ADMIN_PIN || '1218';
  const ROOT_KEY = 'ourFamilyAdventuresV629';
  const LOCAL_KEY = 'ofa-v6-2-9-data';
  const OLD_LOCAL_KEYS = ['ofa-v6-2-8-data','ofa-v6-2-7-data'];
  const $ = id => document.getElementById(id);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const now = () => new Date().toLocaleString();
  const money = n => Number(n || 0).toLocaleString(undefined, { style:'currency', currency:'USD' });
  let deferredInstall = null, dbRef = null, storageRef = null, firebaseOnline = false, saving = false, dragIndex = null;
  let photos = [];
  const data = {
    trip: { name:'Lake Anna 2027', destination:'Lake Anna, VA', startDate:'2027-05-07', weatherLocation:'Lake Anna, VA' },
    people: [{ id:'family', name:'Family', role:'Family', note:'Shared family profile' }],
    itinerary: [], reservations: [], maps: [], budget: [], packing: [], meals: [], votes: [], notes: '', chat: [], scrapbook: [], activity: []
  };
  const personName = p => typeof p === 'string' ? p : (p && p.name) || 'Family';
  const personRole = p => typeof p === 'string' ? 'Family' : (p && p.role) || 'Family';
  function normalize(){
    if(!Array.isArray(data.people) || !data.people.length) data.people = [{ id:'family', name:'Family', role:'Family', note:'Shared family profile' }];
    data.people = data.people.map(p => typeof p === 'string' ? { id:uid(), name:p, role:'Family', note:'' } : p);
    ['itinerary','reservations','maps','budget','packing','meals','votes','chat','scrapbook','activity'].forEach(k => { if(!Array.isArray(data[k])) data[k] = []; });
    if(!data.trip) data.trip = { name:'Lake Anna 2027', destination:'Lake Anna, VA', startDate:'2027-05-07', weatherLocation:'Lake Anna, VA' };
  }
  function mergeData(next){ if(!next) return; Object.keys(data).forEach(k => { if(next[k] !== undefined) data[k] = next[k]; }); normalize(); }
  function saveLocal(){ localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); }
  function loadLocal(){
    try { mergeData(JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null')); } catch {}
    if(!localStorage.getItem(LOCAL_KEY)) for(const k of OLD_LOCAL_KEYS){ try{ const old=localStorage.getItem(k); if(old){ mergeData(JSON.parse(old)); break; } }catch{} }
    normalize();
  }
  function setStatus(text){ ['syncStatus','drawerStatus'].forEach(id => { if($(id)) $(id).textContent = text; }); }
  async function persist(doRender=true){
    saveLocal();
    if(firebaseOnline && dbRef && !saving){
      saving=true;
      try{ await dbRef.set(data); }
      catch(e){ setStatus('Firebase save blocked. Check Realtime Database rules.'); console.warn(e); }
      finally{ saving=false; }
    }
    if(doRender) render();
  }
  function log(msg){ data.activity.unshift({id:uid(), msg, ts:now()}); data.activity=data.activity.slice(0,80); persist(false); render(); }
  function bind(id,event,fn){ const el=$(id); if(el) el.addEventListener(event,fn); }
  function nav(id){ $$('.screen').forEach(s=>s.classList.toggle('active', s.id===id)); $$('[data-goto]').forEach(b=>b.classList.toggle('active', b.dataset.goto===id)); closeDrawer(); window.scrollTo({top:0,behavior:'smooth'}); }
  function openDrawer(){ $('drawer')?.classList.add('open'); $('drawerShade')?.classList.add('show'); }
  function closeDrawer(){ $('drawer')?.classList.remove('open'); $('drawerShade')?.classList.remove('show'); }
  function calcCountdown(){ const d=data.trip.startDate; if(!d) return 'Set a trip date below.'; const days=Math.ceil((new Date(d+'T00:00:00')-new Date())/86400000); if(days>1) return `${days} days until ${data.trip.name||'our trip'}`; if(days===1) return `Tomorrow is ${data.trip.name||'trip day'}!`; if(days===0) return `${data.trip.name||'The trip'} starts today!`; return `${data.trip.name||'The trip'} started ${Math.abs(days)} days ago`; }
  function fillTripInputs(){ [['tripName','name'],['destination','destination'],['startDate','startDate'],['tripName2','name'],['destination2','destination'],['startDate2','startDate'],['weatherLocation','weatherLocation']].forEach(([id,k])=>{ if($(id) && document.activeElement!==$(id)) $(id).value=data.trip[k]||''; }); if($('adminPin') && !$('adminPin').value) $('adminPin').value=ADMIN_PIN; }
  function readTrip(from2=false){ data.trip.name=$(from2?'tripName2':'tripName')?.value||data.trip.name; data.trip.destination=$(from2?'destination2':'destination')?.value||data.trip.destination; data.trip.startDate=$(from2?'startDate2':'startDate')?.value||data.trip.startDate; data.trip.weatherLocation=$('weatherLocation')?.value||data.trip.weatherLocation||data.trip.destination; log('Saved trip settings'); }
  function renderItems(arr, boxId, formatter){ const box=$(boxId); if(!box) return; box.innerHTML=''; arr.forEach((x,i)=>{ const div=document.createElement('div'); div.className='item'; div.innerHTML=`<span>${formatter(x)}<small>${x.ts||''}</small></span><button type="button">Delete</button>`; div.querySelector('button').onclick=()=>{ arr.splice(i,1); log('Deleted item'); }; box.appendChild(div); }); }
  function renderPeople(){
    const list=$('peopleList'); if(list){ list.innerHTML=''; data.people.forEach((p,i)=>{ const div=document.createElement('div'); div.className='profile-card'; div.innerHTML=`<div class="avatar">${personName(p).charAt(0).toUpperCase()}</div><div><b>${personName(p)}</b><small>${personRole(p)}${p.note?' • '+p.note:''}</small></div><button type="button">Delete</button>`; div.querySelector('button').onclick=()=>{ if(data.people.length<=1) return alert('Keep at least one profile.'); data.people.splice(i,1); log('Deleted profile'); }; list.appendChild(div); }); }
    const chat=$('chatName'); if(chat && document.activeElement!==chat){ const cur=chat.value; chat.innerHTML=data.people.map(p=>`<option>${personName(p)}</option>`).join(''); if(cur) chat.value=cur; }
  }
  function renderVotes(){ const box=$('voteList'); if(!box) return; box.innerHTML=''; data.votes.forEach((v,vi)=>{ const div=document.createElement('div'); div.className='item vote-item'; const total=(v.options||[]).reduce((a,o)=>a+(o.count||0),0); div.innerHTML=`<span><b>${v.question}</b><small>${total} votes</small>${(v.options||[]).map((o,oi)=>`<button type="button" data-oi="${oi}">${o.text} (${o.count||0})</button>`).join(' ')}</span><button type="button" class="del">Delete</button>`; div.querySelectorAll('[data-oi]').forEach(btn=>btn.onclick=()=>{ v.options[+btn.dataset.oi].count=(v.options[+btn.dataset.oi].count||0)+1; log('Added vote'); }); div.querySelector('.del').onclick=()=>{ data.votes.splice(vi,1); log('Deleted vote'); }; box.appendChild(div); }); }
  function photoCard(p,i){ const card=document.createElement('div'); card.className='photo-card'; card.draggable=true; card.innerHTML=`<span class="grab">☰</span><img src="${p.src||p.url}" alt="${p.name||'memory photo'}"><small>${p.name||''}</small>`; card.ondragstart=()=>dragIndex=i; card.ondragover=e=>e.preventDefault(); card.ondrop=()=>{ if(dragIndex===null||dragIndex===i) return; const [m]=photos.splice(dragIndex,1); photos.splice(i,0,m); dragIndex=null; renderScrapbook(); }; return card; }
  function renderScrapbook(){ const tray=$('photoTray'), canvas=$('scrapCanvas'); if(!tray||!canvas) return; tray.innerHTML=''; canvas.innerHTML=''; canvas.className=`scrap-canvas ${$('layoutSelect')?.value||'grid'} ${$('frameSelect')?.value||'none'}`; photos.forEach((p,i)=>{ tray.appendChild(photoCard(p,i)); canvas.appendChild(photoCard(p,i)); }); const txt=(($('captionText')?.value||'') + ($('stickerSelect')?.value ? ' '+$('stickerSelect').value : '')).trim(); if(txt){ const note=document.createElement('div'); note.className='scrap-note'; note.textContent=txt; canvas.appendChild(note); } }
  function renderMemories(){ const box=$('memoryList'); if(!box) return; box.innerHTML=''; if(!data.scrapbook.length){ box.innerHTML='<p class="hint">No saved memories yet. Add photos on this page, then tap Save Page.</p>'; return; } data.scrapbook.forEach((m,mi)=>{ const div=document.createElement('div'); div.className='memory-page'; div.innerHTML=`<div><b>${m.caption||'Family memory'}</b><small>${m.ts||''} • ${(m.photos||[]).length||m.count||0} photos</small></div><button type="button">Delete</button><div class="memory-grid"></div>`; const grid=div.querySelector('.memory-grid'); (m.photos||[]).forEach(p=>{ const img=document.createElement('img'); img.src=p.url||p.src; img.alt=p.name||'memory'; grid.appendChild(img); }); div.querySelector('button').onclick=()=>{ data.scrapbook.splice(mi,1); log('Deleted memory page'); }; box.appendChild(div); }); }
  function renderAnalytics(){ const totalBudget=data.budget.reduce((a,b)=>a+Number(b.amount||0),0); const votes=data.votes.reduce((a,v)=>a+(v.options||[]).reduce((s,o)=>s+(o.count||0),0),0); const box=$('analyticsBox'); if(box) box.innerHTML=`<p><b>${data.people.length}</b> people/profiles</p><p><b>${data.itinerary.length}</b> itinerary items</p><p><b>${data.reservations.length}</b> reservations</p><p><b>${money(totalBudget)}</b> planned budget</p><p><b>${data.packing.length}</b> checklist items</p><p><b>${votes}</b> votes cast</p><p><b>${data.scrapbook.length}</b> memory pages saved</p>`; }
  function renderChat(){ const box=$('chatList'); if(!box) return; box.innerHTML=''; if(!data.chat.length){ box.innerHTML='<p class="hint">No family messages yet.</p>'; return; } data.chat.forEach((x,i)=>{ const div=document.createElement('div'); div.className='chat-bubble'; div.innerHTML=`<b>${x.name||'Family'}</b><p>${x.message||''}</p><small>${x.ts||''}</small><button type="button">Delete</button>`; div.querySelector('button').onclick=()=>{ data.chat.splice(i,1); log('Deleted chat message'); }; box.appendChild(div); }); }
  function render(){ normalize(); fillTripInputs(); if($('countdown')) $('countdown').textContent=calcCountdown(); if($('nextAdventure')) $('nextAdventure').textContent=`Your next adventure is ${data.trip.name||'waiting'}.`; const memories=data.scrapbook.reduce((n,p)=>n+((p.photos||[]).length||p.count||0),0); const stats=`${data.people.length} people • ${data.trip.name?1:0} trip • ${memories} memories • ${data.scrapbook.length} scrapbook pages`; if($('storyStats')) $('storyStats').textContent=stats; [['peopleCount',data.people.length],['tripCount',data.trip.name?1:0],['memoryCount',memories],['pageCount',data.scrapbook.length]].forEach(([id,v])=>{ if($(id)) $(id).textContent=v; }); renderPeople(); renderItems(data.itinerary,'itineraryList',x=>`<b>${x.title}</b> ${x.date||''} ${x.time||''}<small>${x.location||''}</small>`); renderItems(data.reservations,'reservationList',x=>`<b>${x.type}</b> ${x.name||''}<small>${x.conf||''} ${x.date||''}</small>`); renderItems(data.maps,'mapList',x=>`<a href="${x.url}" target="_blank" rel="noreferrer">${x.label}</a>`); renderItems(data.budget,'budgetList',x=>`<b>${x.cat}</b> ${x.desc||''}<small>${money(x.amount)}</small>`); const total=data.budget.reduce((a,b)=>a+Number(b.amount||0),0); if($('budgetTotal')) $('budgetTotal').textContent=money(total); renderItems(data.packing,'packingList',x=>`<label><input type="checkbox" ${x.done?'checked':''}> ${x.item}</label><small>${x.type} • ${x.person||'Shared'}</small>`); $$('#packingList input[type=checkbox]').forEach((cb,i)=>cb.onchange=()=>{ data.packing[i].done=cb.checked; persist(); }); renderItems(data.meals,'mealList',x=>`<b>${x.meal}</b><small>${x.date||''} • ${x.person||''}</small>`); renderChat(); renderItems(data.activity,'activityLog',x=>x.msg); if($('sharedNotes') && document.activeElement!==$('sharedNotes')) $('sharedNotes').value=data.notes||''; renderVotes(); renderAnalytics(); renderScrapbook(); renderMemories(); }
  async function initFirebase(){
    if(!window.OFA_FIREBASE_ENABLED || !window.firebaseConfig || !window.firebase){ setStatus('Local mode - Firebase config not loaded'); return; }
    try{
      if(!firebase.apps.length) firebase.initializeApp(window.firebaseConfig);
      setStatus('Signing in…'); await firebase.auth().signInAnonymously();
      dbRef=firebase.database().ref(`${ROOT_KEY}/shared`);
      if(firebase.storage) storageRef=firebase.storage().ref(`${ROOT_KEY}/memories`);
      dbRef.on('value', snap=>{ if(saving) return; const val=snap.val(); if(val){ mergeData(val); saveLocal(); render(); } });
      firebaseOnline=true; setStatus('Connected to Firebase');
    } catch(e){ firebaseOnline=false; setStatus('Firebase sign-in blocked. Enable Anonymous Auth and Realtime Database rules.'); console.warn(e); }
  }
  function readFileAsDataURL(file){ return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file); }); }
  async function uploadPhoto(file){ const localSrc=await readFileAsDataURL(file); const p={id:uid(), name:file.name, src:localSrc, ts:now()}; photos.push(p); renderScrapbook(); if(storageRef){ try{ setStatus('Uploading photo…'); const safe=file.name.replace(/[^a-z0-9_.-]/gi,'_'); const snap=await storageRef.child(`${p.id}-${safe}`).put(file); p.url=await snap.ref.getDownloadURL(); p.src=p.url; setStatus('Connected to Firebase'); renderScrapbook(); } catch(e){ setStatus('Photo saved locally. Storage upload blocked - check Storage rules.'); console.warn(e); } } return p; }
  async function saveScrapbookPage(){ if(!photos.length && !$('captionText')?.value) return alert('Add at least one photo or caption first.'); const page={id:uid(), photos:photos.map(p=>({id:p.id,name:p.name,url:p.url||p.src,src:p.url||p.src})), count:photos.length, caption:$('captionText')?.value||'Memory page', layout:$('layoutSelect')?.value||'grid', frame:$('frameSelect')?.value||'none', ts:now()}; data.scrapbook.unshift(page); photos=[]; if($('photoInput')) $('photoInput').value=''; if($('captionText')) $('captionText').value=''; log('Saved memory page'); nav('memories'); }
  async function loadWeather(){ const loc=($('weatherLocation')?.value||data.trip.weatherLocation||data.trip.destination||'Lake Anna, VA').trim(); const box=$('weatherBox'); if(!box) return; box.textContent='Loading weather…'; try{ const geo=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=en&format=json`).then(r=>r.json()); const g=geo.results?.[0]; if(!g) throw new Error('Location not found'); const w=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`).then(r=>r.json()); box.innerHTML=`<b>${g.name}, ${g.admin1||''}</b><br>Now: ${Math.round(w.current.temperature_2m)}°F • wind ${Math.round(w.current.wind_speed_10m)} mph<br>Today: high ${Math.round(w.daily.temperature_2m_max[0])}° / low ${Math.round(w.daily.temperature_2m_min[0])}° • rain ${w.daily.precipitation_probability_max[0]||0}%`; }catch(e){ box.textContent='Weather could not load. Check location or connection.'; } }
  function addSimple(type){ const ts=now(); if(type==='itinerary') data.itinerary.push({id:uid(),date:$('itDate').value,time:$('itTime').value,title:$('itTitle').value||'Activity',location:$('itLocation').value,ts}); if(type==='reservations') data.reservations.push({id:uid(),type:$('resType').value||'Reservation',name:$('resName').value,conf:$('resConf').value,date:$('resDate').value,ts}); if(type==='maps') data.maps.push({id:uid(),label:$('mapLabel').value||'Map',url:$('mapUrl').value||'#',ts}); if(type==='budget') data.budget.push({id:uid(),cat:$('budCat').value||'Trip',desc:$('budDesc').value,amount:$('budAmt').value,ts}); if(type==='packing') data.packing.push({id:uid(),person:$('packPerson').value,type:$('packType').value,item:$('packItem').value||'Item',done:false,ts}); if(type==='meals') data.meals.push({id:uid(),date:$('mealDate').value,meal:$('mealName').value||'Meal',person:$('mealPerson').value,ts}); if(type==='chat'){ const msg=($('chatMessage').value||'').trim(); if(!msg) return alert('Type a message first.'); data.chat.unshift({id:uid(),name:$('chatName').value||'Family',message:msg,ts}); $('chatMessage').value=''; } log(`Added ${type==='chat'?'chat message':type}`); }
  async function exportCanvas(kind){ const canvasEl=$('scrapCanvas'); if(!canvasEl || !window.html2canvas) return alert('Export library still loading. Try again.'); const canvas=await html2canvas(canvasEl,{backgroundColor:'#fffaf0',scale:2,useCORS:true}); if(kind==='jpg'){ const a=document.createElement('a'); a.download=`scrapbook-${Date.now()}.jpg`; a.href=canvas.toDataURL('image/jpeg',.92); a.click(); } else { const img=canvas.toDataURL('image/jpeg',.92); const pdf=new jspdf.jsPDF({orientation:'portrait',unit:'pt',format:'letter'}); const w=pdf.internal.pageSize.getWidth()-40; const h=canvas.height*w/canvas.width; pdf.addImage(img,'JPEG',20,20,w,Math.min(h,752)); pdf.save(`scrapbook-${Date.now()}.pdf`); } }
  async function installApp(){ if(deferredInstall){ deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall=null; } else alert('Install is available from Chrome menu ⋮ → Add to Home screen / Install app. If already installed, Android may hide the install prompt.'); }
  function setup(){
    loadLocal();
    bind('beginBtn','click',()=>$('splash')?.classList.add('hide')); setTimeout(()=>$('splash')?.classList.add('hide'),900);
    bind('menuBtn','click',openDrawer); bind('closeDrawer','click',closeDrawer); bind('drawerShade','click',closeDrawer);
    $$('[data-goto]').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.goto)));
    bind('saveTrip','click',()=>readTrip(false)); bind('saveTrip2','click',()=>readTrip(true)); bind('loadWeather','click',loadWeather);
    bind('addPerson','click',()=>{ const name=($('personName').value||'').trim(); if(!name) return alert('Enter a name first.'); data.people.push({id:uid(), name, role:$('personRole').value||'Family', note:$('personColor').value||'', ts:now()}); $('personName').value=''; $('personColor').value=''; log('Added profile'); });
    bind('addItinerary','click',()=>addSimple('itinerary')); bind('addReservation','click',()=>addSimple('reservations')); bind('addMap','click',()=>addSimple('maps')); bind('addBudget','click',()=>addSimple('budget')); bind('addPacking','click',()=>addSimple('packing')); bind('addMeal','click',()=>addSimple('meals')); bind('addChat','click',()=>addSimple('chat'));
    bind('saveNotes','click',()=>{ data.notes=$('sharedNotes').value; log('Saved notes'); });
    bind('addVoteOption','click',()=>{ const q=$('voteQuestion').value||'Family vote', opt=$('voteOption').value||'Option'; let vote=data.votes.find(v=>v.question===q); if(!vote){ vote={id:uid(),question:q,options:[],ts:now()}; data.votes.push(vote); } vote.options.push({text:opt,count:0}); log('Added voting option'); });
    bind('photoInput','change', async e=>{ const files=[...e.target.files]; for(const file of files) await uploadPhoto(file); });
    ['layoutSelect','frameSelect','captionText','stickerSelect'].forEach(id=>{ const el=$(id); if(el) el.addEventListener(id==='captionText'?'input':'change', renderScrapbook); });
    bind('addTextSticker','click',renderScrapbook); bind('saveScrapbook','click',saveScrapbookPage); bind('exportJpeg','click',()=>exportCanvas('jpg')); bind('exportPdf','click',()=>exportCanvas('pdf'));
    bind('unlockAdmin','click',()=>{ if(($('adminPin').value||'').trim()===ADMIN_PIN) $('adminPanel').classList.remove('hidden'); else alert('Incorrect PIN'); });
    bind('exportData','click',()=>{ const a=document.createElement('a'); a.download='our-family-adventures-data.json'; a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})); a.click(); });
    bind('clearLocal','click',()=>{ if(confirm('Clear local saved data on this device?')){ localStorage.removeItem(LOCAL_KEY); location.reload(); } });
    bind('forceRefresh','click',async()=>{ if('serviceWorker' in navigator){ const regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r=>r.unregister())); } location.href='./index.html?fresh='+Date.now(); });
    bind('notifyBtn','click',async()=>{ if(!('Notification' in window)) return alert('Notifications are not supported on this device.'); const perm=await Notification.requestPermission(); alert(perm==='granted'?'Notifications enabled.':'Notifications not enabled.'); });
    bind('shareBtn','click',async()=>{ const share={title:'Our Family Adventures',text:'Open our family trip planner',url:location.href}; if(navigator.share) await navigator.share(share); else { await navigator.clipboard.writeText(location.href); alert('Link copied'); } });
    window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredInstall=e; });
    bind('installBtn','click',installApp); $$('.installAction').forEach(b=>b.addEventListener('click',installApp));
    if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js?v=6.2.9').then(r=>r.update()).catch(console.warn);
    render(); initFirebase(); setInterval(render,60000);
  }
  document.addEventListener('DOMContentLoaded', setup);
})();
