(() => {
  'use strict';
  const VERSION = '7.0.0';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
  const today = () => new Date().toISOString().slice(0,10);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const storeKey = 'ofa-v7-data';
  const defaultData = {trips:[], reservations:[], budgets:[], itineraries:[], links:[], meals:[], memories:[], pages:[], messages:[], profiles:[], invites:[], places:[], notifications:[], activities:[], activeTripId:null, readAt:0};
  let data = load(); let user = null; let db = null; let auth = null; let storage = null; let unsub = []; let installPrompt = null; let selectedScrap = null;

  function load(){ try{return {...defaultData, ...(JSON.parse(localStorage.getItem(storeKey)||'{}'))};}catch{return {...defaultData};}}
  function save(){ localStorage.setItem(storeKey, JSON.stringify(data)); renderAll(); }
  function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.remove('show'),2400); }
  function addActivity(text){ data.activities.unshift({id:uid(), text, at:Date.now()}); data.activities=data.activities.slice(0,100); addNotification(text); }
  function addNotification(text){ data.notifications.unshift({id:uid(), text, at:Date.now(), read:false}); data.notifications=data.notifications.slice(0,100); }
  async function cloudSet(col, obj){ if(!db||!user) return; await db.collection('families').doc('main').collection(col).doc(obj.id).set({...obj, updatedAt: firebase.firestore.FieldValue.serverTimestamp()}, {merge:true}); }
  async function cloudDelete(col, id){ if(!db||!user) return; await db.collection('families').doc('main').collection(col).doc(id).delete(); }
  function add(col, obj, msg){ obj={id:uid(), createdAt:Date.now(), ...obj}; data[col].unshift(obj); addActivity(msg); save(); cloudSet(col,obj).catch(console.warn); return obj; }
  function update(col,id,patch){ const o=data[col].find(x=>x.id===id); if(!o) return; Object.assign(o,patch,{updatedAt:Date.now()}); save(); cloudSet(col,o).catch(console.warn); }
  function remove(col,id){ data[col]=data[col].filter(x=>x.id!==id); addActivity(`Deleted ${col.slice(0,-1)}`); save(); cloudDelete(col,id).catch(console.warn); }

  function initFirebase(){
    try{
      if(window.firebase && window.firebaseConfig){ firebase.initializeApp(window.firebaseConfig); auth=firebase.auth(); db=firebase.firestore(); storage=firebase.storage(); db.enablePersistence({synchronizeTabs:true}).catch(()=>{}); auth.onAuthStateChanged(onAuth); $('#syncStatus').textContent='Firebase ready'; }
      else $('#syncStatus').textContent='Local mode';
    }catch(e){ console.warn(e); $('#syncStatus').textContent='Local mode'; }
  }
  function onAuth(u){ user=u; $('#syncStatus').textContent = u ? `Signed in: ${u.email||'family'}` : 'Offline ready'; unsub.forEach(f=>f()); unsub=[]; if(u) listenCloud(); renderAll(); }
  function listenCloud(){
    ['trips','reservations','budgets','itineraries','links','meals','memories','pages','messages','profiles','invites','places','notifications','activities'].forEach(col=>{
      const ref=db.collection('families').doc('main').collection(col).orderBy('createdAt','desc');
      unsub.push(ref.onSnapshot(snap=>{ data[col]=snap.docs.map(d=>({id:d.id,...d.data()})); localStorage.setItem(storeKey,JSON.stringify(data)); renderAll(); }, console.warn));
    });
  }

  function showPage(id){ $$('.page').forEach(p=>p.classList.toggle('active',p.id===id)); $$('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===id)); $('#drawer').classList.remove('open'); renderAll(); }
  function options(sel, includeBlank=false){ const html=(includeBlank?'<option value="">Select trip</option>':'')+data.trips.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join(''); $$(sel).forEach(s=>{ const v=s.value; s.innerHTML=html||'<option value="">No trips yet</option>'; if([...s.options].some(o=>o.value===v)) s.value=v; }); }
  function activeTrip(){ return data.trips.find(t=>t.id===data.activeTripId) || data.trips[0]; }
  function tripName(id){ return data.trips.find(t=>t.id===id)?.name || 'No trip'; }
  function dateRange(t){ if(!t?.arrival||!t?.departure) return []; const a=new Date(t.arrival+'T00:00'), b=new Date(t.departure+'T00:00'), out=[]; for(let d=new Date(a); d<=b; d.setDate(d.getDate()+1)) out.push(d.toISOString().slice(0,10)); return out; }
  function daysUntil(date){ if(!date) return null; const ms=new Date(date+'T00:00')-new Date(new Date().toDateString()); return Math.ceil(ms/86400000); }
  function googleUrl(q, near=''){ return `https://www.google.com/maps/search/${encodeURIComponent((near?near+' near ':'')+q)}`; }

  function renderAll(){ options('select[id$="Trip"],#activeTripSelect', true); renderHome(); renderTrips(); renderDashboard(); renderLinks(); renderMeals(); renderMemories(); renderPages(); renderChat(); renderFamily(); renderExplore(); renderNotifications(); fillMealDates(); }
  function renderHome(){
    const t=activeTrip(); const d=daysUntil(t?.arrival); $('#statTrips').textContent=data.trips.length; $('#statMemories').textContent=data.memories.length; $('#statMeals').textContent=data.meals.length; const unread=data.notifications.filter(n=>!n.read).length; $('#statUnread').textContent=unread; $('#badge').textContent=unread;
    $('#nextTripLine').textContent=t?`${t.name} • ${t.destination||''}`:'Create an adventure to start your countdown.'; $('#countdown').textContent=t?(d>0?`${d} days until ${t.name}`:d===0?`${t.name} starts today!`:`${t.name} is in progress or complete`):'No trip selected';
  }
  function renderTrips(){
    $('#tripList').innerHTML=data.trips.map(t=>`<div class="listItem"><h3>${esc(t.name)}</h3><p>${esc(t.destination)}<br>${esc(t.arrival)} to ${esc(t.departure)}</p><p>${esc(t.notes)}</p><div class="actions"><button onclick="OFA.setActive('${t.id}')">Select</button><button onclick="OFA.editTrip('${t.id}')">Edit</button><button onclick="OFA.del('trips','${t.id}')">Delete</button></div></div>`).join('');
    $('#reservationList').innerHTML=data.reservations.map(x=>`<div class="listItem"><b>${esc(x.title)}</b><p>${tripName(x.tripId)} ${x.url?`<br><a href="${esc(x.url)}" target="_blank">Open reservation</a>`:''}</p><button onclick="OFA.del('reservations','${x.id}')">Delete</button></div>`).join('')||'<p class="muted">No reservations yet.</p>';
    $('#budgetList').innerHTML=data.budgets.map(x=>`<div class="listItem"><b>${esc(x.title)}</b><p>${tripName(x.tripId)} • $${Number(x.amount||0).toFixed(2)}</p><button onclick="OFA.del('budgets','${x.id}')">Delete</button></div>`).join('')||'<p class="muted">No budget items yet.</p>';
    $('#itineraryList').innerHTML=data.itineraries.map(x=>`<div class="listItem"><b>${esc(x.title)}</b><p>${tripName(x.tripId)} • ${esc(x.date)} ${esc(x.time)}</p><button onclick="OFA.del('itineraries','${x.id}')">Delete</button></div>`).join('')||'<p class="muted">No itinerary yet.</p>';
  }
  function renderDashboard(){ const t=activeTrip(); if(t) $('#activeTripSelect').value=t.id; const total=data.budgets.filter(b=>b.tripId===t?.id).reduce((s,b)=>s+Number(b.amount||0),0); $('#dashSummary').innerHTML=t?`<h3>${esc(t.name)}</h3><p>${esc(t.destination)} • ${esc(t.arrival)} to ${esc(t.departure)}</p><p>${esc(t.notes)}</p><p><b>Budget total:</b> $${total.toFixed(2)}</p>`:'<p>No trip selected.</p>'; const q=t?.destination||''; $('#weatherBox').innerHTML=q?`<a target="_blank" href="https://www.google.com/search?q=${encodeURIComponent('weather '+q)}">Open live weather for ${esc(q)}</a>`:'Add a destination.'; $('#nearbyLinks').innerHTML=q?['restaurants','grocery stores','gas stations','hospitals','hotels'].map(n=>`<a target="_blank" href="${googleUrl(q,n)}">Nearby ${n}</a>`).join('<br>'):''; }
  function renderLinks(){ const seen=new Set(); $('#linkList').innerHTML=data.links.filter(l=>{ const k=(l.tripId+'|'+l.url).toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true; }).map(l=>`<div class="listItem"><h3>${esc(l.title)}</h3><p>${tripName(l.tripId)}<br><a target="_blank" href="${esc(l.url)}">${esc(l.url)}</a></p><button onclick="OFA.del('links','${l.id}')">Delete</button></div>`).join('')||'<p class="muted">No travel links yet.</p>'; }
  function fillMealDates(){ const t=data.trips.find(x=>x.id===$('#mealTrip')?.value)||activeTrip(); const dates=dateRange(t); if($('#mealDate')) $('#mealDate').innerHTML=dates.map(d=>`<option>${d}</option>`).join('') || `<option>${today()}</option>`; }
  function renderMeals(){ $('#mealList').innerHTML=data.meals.map(m=>`<div class="listItem"><h3>${esc(m.type)}: ${esc(m.title)}</h3><p>${tripName(m.tripId)} • ${esc(m.date)} • ${esc(m.privacy)}<br>Volunteer: ${esc(m.volunteer||'unassigned')}<br>Groceries: ${esc(m.grocery||'')}</p><button onclick="OFA.del('meals','${m.id}')">Delete</button></div>`).join('')||'<p class="muted">No meals yet.</p>'; }
  function renderMemories(){ $('#memoryTimeline').innerHTML=data.memories.map(m=>`<div class="memoryCard">${m.files?.[0]?.type?.startsWith('video')?`<video src="${m.files[0].url}" controls></video>`:`<img src="${m.files?.[0]?.url||'assets/lighthouse-clean.png'}">`}<div><b>${esc(m.title)}</b><p>${esc(m.album)} • ${esc(m.date)}</p><p>${esc(m.text)}</p><button onclick="OFA.printMemory('${m.id}')">Print</button><button onclick="OFA.del('memories','${m.id}')">Delete</button></div></div>`).join('')||'<p class="muted">No memories yet.</p>'; }
  function renderPages(){ $('#pageList').innerHTML=data.pages.map(p=>`<div class="listItem"><b>${esc(p.title||'Scrapbook page')}</b><p>${new Date(p.createdAt||Date.now()).toLocaleString()}</p><button onclick="OFA.loadPage('${p.id}')">Edit</button><button onclick="OFA.del('pages','${p.id}')">Delete</button></div>`).join(''); }
  function renderChat(){ const log=$('#chatLog'); log.innerHTML=data.messages.slice().reverse().map(m=>`<div class="msg ${m.email===user?.email?'mine':''}"><b>${esc(m.name||m.email||'Family')}</b><p>${esc(m.text)}</p><small>${new Date(m.createdAt||Date.now()).toLocaleString()} • ${m.reactions||''}</small><button onclick="OFA.react('${m.id}','❤️')">❤️</button><button onclick="OFA.react('${m.id}','😂')">😂</button></div>`).join(''); log.scrollTop=log.scrollHeight; }
  function renderFamily(){ $('#familyList').innerHTML=data.profiles.map(p=>`<div class="listItem"><h3>${esc(p.name||p.email)}</h3><p>${esc(p.email)} • ${esc(p.role)}</p><button onclick="OFA.del('profiles','${p.id}')">Delete</button></div>`).join('') + data.invites.map(i=>`<div class="listItem"><h3>Invite: ${esc(i.email)}</h3><p>Code: ${esc(i.code)} • Role: ${esc(i.role)}</p><button onclick="OFA.del('invites','${i.id}')">Delete</button></div>`).join(''); $('#activityList').innerHTML=data.activities.map(a=>`<div class="listItem"><p>${esc(a.text)}</p><small>${new Date(a.at||a.createdAt||Date.now()).toLocaleString()}</small></div>`).join(''); }
  function renderExplore(){ $('#placeList').innerHTML=data.places.map(p=>`<div class="listItem"><h3>${esc(p.name)}</h3><p>${esc(p.address)}</p><a target="_blank" href="${googleUrl(p.address||p.name)}">Navigate</a> <button onclick="OFA.del('places','${p.id}')">Delete</button></div>`).join('')||'<p class="muted">No saved places yet.</p>'; }
  function renderNotifications(){ $('#notificationList').innerHTML=data.notifications.map(n=>`<div class="listItem"><p>${n.read?'✓':'🔔'} ${esc(n.text)}</p><small>${new Date(n.at||n.createdAt||Date.now()).toLocaleString()}</small></div>`).join('')||'<p class="muted">No notifications.</p>'; }

  async function filesToData(files){ return Promise.all([...files].map(f=>new Promise(res=>{ const r=new FileReader(); r.onload=()=>res({name:f.name,type:f.type,url:r.result}); r.readAsDataURL(f); }))); }
  function makeScrap(type, content){ const el=document.createElement('div'); el.className='scrapItem selected '+(type==='frame'?'scrapFrame':''); el.dataset.id=uid(); el.dataset.type=type; Object.assign(el.style,{left:'40px',top:'40px',width:type==='text'?'180px':'180px',height:type==='text'?'70px':'140px',transform:'rotate(0deg)',fontSize:'26px'}); if(type==='image') el.innerHTML=`<img src="${content}">`; else if(type==='text') el.innerHTML=`<div class="scrapText" contenteditable="true">${esc(content)}</div>`; else if(type==='frame') el.innerHTML=''; else el.textContent=content; $('#scrapCanvas').appendChild(el); selectScrap(el); }
  function selectScrap(el){ $$('.scrapItem').forEach(x=>x.classList.remove('selected')); selectedScrap=el; if(el) el.classList.add('selected'); }
  function dragScrap(el){ let sx,sy,l,t; el.addEventListener('pointerdown',e=>{ if(e.target.isContentEditable) return; selectScrap(el); sx=e.clientX; sy=e.clientY; l=parseFloat(el.style.left); t=parseFloat(el.style.top); el.setPointerCapture(e.pointerId); }); el.addEventListener('pointermove',e=>{ if(sx==null) return; el.style.left=(l+e.clientX-sx)+'px'; el.style.top=(t+e.clientY-sy)+'px'; }); el.addEventListener('pointerup',()=>{sx=null;}); el.addEventListener('dblclick',()=>{ const w=parseFloat(el.style.width), h=parseFloat(el.style.height); el.style.width=(w+35)+'px'; el.style.height=(h+35)+'px'; }); }
  const mo=new MutationObserver(()=>$$('.scrapItem').forEach(el=>{ if(!el.dataset.drag){el.dataset.drag=1; dragScrap(el);}}));

  window.OFA={
    del:remove, setActive(id){data.activeTripId=id; save(); toast('Trip selected');},
    editTrip(id){ const t=data.trips.find(x=>x.id===id); if(!t) return; $('#tripName').value=t.name; $('#tripDestination').value=t.destination; $('#tripArrival').value=t.arrival; $('#tripDeparture').value=t.departure; $('#tripNotes').value=t.notes; remove('trips',id); showPage('trips'); },
    react(id, emoji){ const m=data.messages.find(x=>x.id===id); if(m){m.reactions=(m.reactions||'')+emoji; save(); cloudSet('messages',m).catch(console.warn);} },
    loadPage(id){ const p=data.pages.find(x=>x.id===id); if(!p) return; $('#scrapCanvas').innerHTML=p.html; showPage('scrapbook'); },
    printMemory(){ window.print(); }
  };

  function bind(){
    $('#beginBtn').onclick=()=>{$('#splash').classList.add('hidden');$('#app').classList.remove('hidden');};
    $('#menuBtn').onclick=()=>$('#drawer').classList.add('open'); $('#closeDrawer').onclick=()=>$('#drawer').classList.remove('open');
    $$('[data-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
    $('#loginBtn').onclick=()=>$('#authModal').classList.remove('hidden'); $('[data-close-auth]').onclick=()=>$('#authModal').classList.add('hidden');
    $('#signInBtn').onclick=()=>auth?auth.signInWithEmailAndPassword($('#authEmail').value,$('#authPassword').value).then(()=>$('#authModal').classList.add('hidden')).catch(e=>toast(e.message)):toast('Firebase is not available');
    $('#createAccountBtn').onclick=()=>auth?auth.createUserWithEmailAndPassword($('#authEmail').value,$('#authPassword').value).then(()=>$('#authModal').classList.add('hidden')).catch(e=>toast(e.message)):toast('Firebase is not available');
    $('#resetPasswordBtn').onclick=()=>auth&&$('#authEmail').value?auth.sendPasswordResetEmail($('#authEmail').value).then(()=>toast('Reset email sent')).catch(e=>toast(e.message)):toast('Enter your email first');
    $('#signOut').onclick=()=>auth?.signOut();
    window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); installPrompt=e; }); $('#installBtn').onclick=()=>installPrompt?installPrompt.prompt():toast('Use your browser menu to add to home screen.');
    $('#notifyBtn').onclick=$('#enablePush').onclick=async()=>{ if(Notification?.requestPermission){ const p=await Notification.requestPermission(); toast('Notification permission: '+p); if(p==='granted') new Notification('Our Family Adventures',{body:'Notifications are turned on.'}); }};
    $('#saveTrip').onclick=()=>{ const name=$('#tripName').value.trim(); if(!name) return toast('Trip name required'); add('trips',{name,destination:$('#tripDestination').value,arrival:$('#tripArrival').value,departure:$('#tripDeparture').value,notes:$('#tripNotes').value},`Trip added: ${name}`) };
    $('#saveReservation').onclick=()=>add('reservations',{tripId:$('#reservationTrip').value,title:$('#reservationTitle').value,url:$('#reservationUrl').value,notes:$('#reservationNotes').value},'Reservation added');
    $('#saveBudget').onclick=()=>add('budgets',{tripId:$('#budgetTrip').value,title:$('#budgetTitle').value,amount:$('#budgetAmount').value},'Budget item added');
    $('#saveItinerary').onclick=()=>add('itineraries',{tripId:$('#itineraryTrip').value,date:$('#itineraryDate').value,time:$('#itineraryTime').value,title:$('#itineraryTitle').value},'Itinerary item added');
    $('#openMap').onclick=()=>window.open(googleUrl($('#mapAddress').value||activeTrip()?.destination||''),'_blank'); $('#openWeather').onclick=()=>window.open('https://www.google.com/search?q='+encodeURIComponent('weather '+($('#mapAddress').value||activeTrip()?.destination||'')),'_blank');
    $('#saveLink').onclick=()=>{ const url=$('#linkUrl').value.trim(), tripId=$('#linkTrip').value; if(data.links.some(l=>l.tripId===tripId&&l.url.toLowerCase()===url.toLowerCase())) return toast('That travel link is already saved.'); add('links',{tripId,title:$('#linkTitle').value,url},'Travel link saved'); };
    $('#mealTrip').onchange=fillMealDates; $('#saveMeal').onclick=()=>add('meals',{tripId:$('#mealTrip').value,date:$('#mealDate').value,type:$('#mealType').value,privacy:$('#mealPrivacy').value,title:$('#mealTitle').value,volunteer:$('#mealVolunteer').value,grocery:$('#groceryItems').value},'Meal saved');
    $('#saveMemory').onclick=async()=>{ const files=await filesToData($('#memoryFiles').files); add('memories',{files,album:$('#memoryAlbum').value,title:$('#memoryTitle').value,date:$('#memoryDate').value,text:$('#memoryText').value},'Memory saved'); };
    $('#scrapPhoto').onchange=async e=>(await filesToData(e.target.files)).forEach(f=>makeScrap('image',f.url)); $$('[data-add-sticker]').forEach(b=>b.onclick=()=>makeScrap('sticker',b.dataset.addSticker)); $('#addText').onclick=()=>makeScrap('text','Double tap to edit text'); $('#addFrame').onclick=()=>makeScrap('frame',''); $('#addBackground').onclick=()=>$('#scrapCanvas').style.background='linear-gradient(135deg,#fff7f3,#d7ecff)'; $('#clearPage').onclick=()=>{ if(confirm('Clear scrapbook canvas?')) $('#scrapCanvas').innerHTML='';};
    document.addEventListener('keydown',e=>{ if(!selectedScrap) return; if(e.key==='Delete') selectedScrap.remove(); if(e.key==='r') selectedScrap.style.transform=`rotate(${(parseInt(selectedScrap.dataset.rot||0)+15)%360}deg)`; if(e.key==='+'||e.key==='='){selectedScrap.style.width=parseFloat(selectedScrap.style.width)+20+'px'; selectedScrap.style.height=parseFloat(selectedScrap.style.height)+20+'px';} if(e.key==='-'){selectedScrap.style.width=Math.max(40,parseFloat(selectedScrap.style.width)-20)+'px'; selectedScrap.style.height=Math.max(40,parseFloat(selectedScrap.style.height)-20)+'px';} });
    $('#savePage').onclick=()=>add('pages',{title:'Scrapbook page',html:$('#scrapCanvas').innerHTML},'Scrapbook page saved'); $('#printPage').onclick=()=>window.print(); $('#downloadJpeg').onclick=()=>{ const blob=new Blob([$('#scrapCanvas').outerHTML],{type:'text/html'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='scrapbook-page.html'; a.click(); toast('Downloaded editable scrapbook page. Use Print/PDF for PDF.'); };
    $('#sendChat').onclick=()=>{ const text=$('#chatInput').value.trim(); if(!text) return; add('messages',{text,email:user?.email||'local',name:user?.email?.split('@')[0]||'Family'},'New chat message'); $('#chatInput').value=''; };
    $('#markRead').onclick=()=>{data.readAt=Date.now(); data.notifications.forEach(n=>n.read=true); save();}; $('#chatInput').oninput=()=>{$('#typingLine').textContent=$('#chatInput').value?'Typing...':'';};
    $('#saveProfile').onclick=()=>add('profiles',{name:$('#profileName').value,email:$('#profileEmail').value,role:$('#profileRole').value},'Profile saved'); $('#saveInvite').onclick=()=>add('invites',{email:$('#inviteEmail').value,code:$('#inviteCode').value,role:$('#inviteRole').value},'Invite saved');
    $('#savePlace').onclick=()=>add('places',{name:$('#placeName').value,address:$('#placeAddress').value},'Place saved'); $$('[data-nearby]').forEach(b=>b.onclick=()=>window.open(googleUrl(activeTrip()?.destination||$('#placeAddress').value,b.dataset.nearby),'_blank'));
    $('#markAllNotifications').onclick=()=>{data.notifications.forEach(n=>n.read=true); save();}; $('#exportData').onclick=()=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})); a.download='our-family-adventures-7-backup.json'; a.click(); };
    $('#importDataBtn').onclick=()=>$('#importData').click(); $('#importData').onchange=e=>{ const r=new FileReader(); r.onload=()=>{data={...defaultData,...JSON.parse(r.result)}; save();}; r.readAsText(e.target.files[0]);};
    $('#activeTripSelect').onchange=e=>{data.activeTripId=e.target.value; save();};
    mo.observe($('#scrapCanvas'),{childList:true,subtree:true});
  }
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js?v=7.0.0').catch(console.warn));
  document.addEventListener('DOMContentLoaded',()=>{ initFirebase(); bind(); renderAll(); });
})();
