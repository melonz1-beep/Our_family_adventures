const defaultState = {
  settings: {
    tripName: 'Beach Vacation 2027',
    tripSubtitle: 'Family Beach Trip 2027',
    tripDate: '2027-07-10',
    coverPhoto: '',
    userName: 'Melissa',
    syncMode: 'local'
  },
  trips: [{ name:'Beach Vacation 2027', dates:'Summer 2027', status:'Planning', cover:'' }],
  families: [
    { family:'Lehr Family', members:'Melissa', arrival:'', departure:'', phone:'', notes:'' }
  ],
  travel: [], lodging: [], chat: [
    { name:'Our Family Adventures', channel:'Announcement', text:'Welcome to the family trip hub!', time:Date.now() }
  ],
  meals: [], shopping: [], packing: [], schedule: [], budget: [], memories: [], guide: [], documents: []
};

let db = null, dbRef = null, state = loadLocal();
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const save = () => { localStorage.setItem('ofaState', JSON.stringify(state)); if(dbRef) dbRef.set(state); renderAll(); };
function loadLocal(){ try{return JSON.parse(localStorage.getItem('ofaState')) || structuredClone(defaultState)}catch{return structuredClone(defaultState)} }
function esc(v=''){ return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function uid(){ return Math.random().toString(36).slice(2,9); }
function toast(msg){ const el=document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),2200); }

window.addEventListener('load',()=>{ setTimeout(()=>$('#splash')?.classList.add('hide'),900); initNav(); initPWA(); renderAll(); });
if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js').catch(()=>{}); }

function initNav(){
  $('#menuBtn').onclick = () => $('#sideNav').classList.toggle('open');
  $$('.side-nav button').forEach(btn=>btn.onclick=()=>{
    $$('.side-nav button').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    $$('.tab').forEach(t=>t.classList.remove('active')); $('#' + btn.dataset.tab).classList.add('active');
    $('#sideNav').classList.remove('open'); window.scrollTo({top:260,behavior:'smooth'});
  });
}
function initPWA(){
  let deferred; window.addEventListener('beforeinstallprompt', e=>{e.preventDefault(); deferred=e; $('#installBtn').classList.remove('hidden')});
  $('#installBtn').onclick=async()=>{ if(deferred){deferred.prompt(); deferred=null; $('#installBtn').classList.add('hidden')} };
}
function applySettings(){
  $('#tripName').textContent = state.settings.tripName || 'Our Family Adventures';
  $('#tripSubtitle').textContent = state.settings.tripSubtitle || '';
  if(state.settings.coverPhoto){ document.querySelector('.hero').style.backgroundImage = `linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.48)),url('${state.settings.coverPhoto}')`; }
  const d = new Date((state.settings.tripDate||'')+'T00:00:00');
  if(!isNaN(d)){
    const days = Math.ceil((d - new Date()) / 86400000);
    $('#countdown').textContent = days > 0 ? `${days} days until vacation!` : days === 0 ? 'Vacation starts today!' : 'This trip is in the memories now';
  }
}
function renderAll(){ applySettings(); renderHome(); renderTrips(); renderFamilies(); renderTravel(); renderLodging(); renderChat(); renderMeals(); renderShopping(); renderPacking(); renderSchedule(); renderBudget(); renderMemories(); renderGuide(); renderDocuments(); renderSettings(); }
function banner(title,img){return `<div class="banner" style="background-image:url('${img}')"><h2>${title}</h2></div>`}
function card(title,body){return `<article class="card"><h2>${title}</h2>${body}</article>`}
function imgFor(key){const imgs={home:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',travel:'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',lodging:'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80',meals:'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',packing:'https://images.unsplash.com/photo-1553531384-397c80973a0b?auto=format&fit=crop&w=1200&q=80',memories:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80'}; return imgs[key];}
function renderHome(){
  $('#home').innerHTML = `
    <div class="grid">
      <div class="photo-card" style="background-image:url('${state.settings.coverPhoto||imgFor('home')}')"><div><h2>${esc(state.settings.tripName)}</h2><p>Real photos, shared plans, family memories.</p></div></div>
      ${card('Quick overview', `<div class="row"><span class="pill">👨‍👩‍👧‍👦 ${state.families.length} families</span><span class="pill">🏡 ${state.lodging.length} rentals</span><span class="pill">💬 ${state.chat.length} chat messages</span><span class="pill">🍽️ ${state.meals.length} meals</span></div>`)}
    </div>
    ${card('Beach house whiteboard', `<form class="form" onsubmit="addChat(event,'Announcement')"><textarea name="text" placeholder="Example: Dinner at 6:00, need ice, family photo at sunset..."></textarea><button class="primary">Post announcement</button></form>`)}
    <div class="grid">
      ${miniList('Upcoming itinerary',state.schedule,'title','date')}
      ${miniList('Shared shopping',state.shopping,'item','assigned')}
      ${miniList('Travel status',state.travel,'family','status')}
    </div>`;
}
function miniList(title, arr, a, b){return `<article class="card"><h3>${title}</h3><div class="list">${arr.slice(0,5).map(x=>`<div class="item"><strong>${esc(x[a]||'Untitled')}</strong><br><span class="muted">${esc(x[b]||'')}</span></div>`).join('')||'<p>No items yet.</p>'}</div></article>`}
function renderTrips(){ $('#trips').innerHTML = banner('Trip history',imgFor('memories')) + genericSection('trips','Trip','name',['name','dates','status','cover']); }
function renderFamilies(){ $('#families').innerHTML = genericSection('families','Family','family',['family','members','arrival','departure','phone','notes']); }
function renderTravel(){ $('#travel').innerHTML = banner('Driving, flights, rental cars and arrivals',imgFor('travel')) + genericSection('travel','Travel plan','family',['family','mode','airline','flight','airports','departure','arrival','rentalCar','status','notes']); }
function renderLodging(){ $('#lodging').innerHTML = banner('Airbnb and vacation rental options',imgFor('lodging')) + genericSection('lodging','Lodging option','name',['name','link','price','bedrooms','bathrooms','distance','votes','pros','cons','notes']); }
function renderMeals(){ $('#meals').innerHTML = banner('Meals, recipes and cooking assignments',imgFor('meals')) + genericSection('meals','Meal','meal',['date','meal','menu','family','groceries','notes']); }
function renderShopping(){ $('#shopping').innerHTML = genericSection('shopping','Shopping item','item',['item','quantity','assigned','category','purchased','packed']); }
function renderPacking(){ $('#packing').innerHTML = banner('Packing lists by family',imgFor('packing')) + genericSection('packing','Packing item','item',['family','category','item','packed','notes']); }
function renderSchedule(){ $('#schedule').innerHTML = genericSection('schedule','Itinerary item','title',['date','time','title','location','assigned','notes']); }
function renderBudget(){
  const total = state.budget.reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
  $('#budget').innerHTML = card('Budget summary',`<div class="countdown">$${total.toFixed(2)}</div><p class="muted">Total entered shared expenses.</p>`) + genericSection('budget','Expense','item',['item','amount','paidBy','splitWith','paid','notes']);
}
function renderMemories(){ $('#memories').innerHTML = banner('Photos, stories and memory book notes',imgFor('memories')) + genericSection('memories','Memory','title',['date','title','photo','story','favoriteQuote']); }
function renderGuide(){ $('#guide').innerHTML = genericSection('guide','Local place','name',['name','type','address','link','notes']); }
function renderDocuments(){ $('#documents').innerHTML = genericSection('documents','Document','title',['title','type','link','notes']); }
function genericSection(key,label,titleField,fields){
  return `${card(`Add ${label.toLowerCase()}`, formHtml(key, fields))}<div class="grid">${state[key].map((item,i)=>itemCard(key,item,i,titleField)).join('') || card(label + 's','<p>No items yet.</p>')}</div>`;
}
function formHtml(key, fields){ return `<form class="form" onsubmit="addItem(event,'${key}')">${fields.map(f=> inputFor(f)).join('')}<button class="primary">Add</button></form>`; }
function inputFor(f){ const labels={tripDate:'Trip date'}; const textarea=['notes','pros','cons','groceries','story'].includes(f); const placeholder=labels[f]||f.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase()); if(textarea) return `<textarea name="${f}" placeholder="${placeholder}"></textarea>`; if(['date','arrival','departure'].includes(f)) return `<input name="${f}" type="date" placeholder="${placeholder}">`; if(['amount','price','votes','bedrooms','bathrooms','quantity'].includes(f)) return `<input name="${f}" type="text" placeholder="${placeholder}">`; return `<input name="${f}" placeholder="${placeholder}">`; }
function itemCard(key,item,i,titleField){
  const title=esc(item[titleField] || item.title || item.name || item.item || 'Item');
  const rows=Object.entries(item).map(([k,v])=> v ? `<div><strong>${esc(k.replace(/([A-Z])/g,' $1'))}:</strong> ${linkify(esc(v))}</div>` : '').join('');
  return `<article class="card"><h3>${title}</h3><div class="item">${rows}</div><div class="row" style="margin-top:12px"><button class="secondary danger" onclick="removeItem('${key}',${i})">Delete</button></div></article>`;
}
function linkify(text){ return text.replace(/(https?:\/\/[^\s]+)/g,'<a href="$1" target="_blank" rel="noopener">Open link</a>'); }
function addItem(e,key){ e.preventDefault(); const data=Object.fromEntries(new FormData(e.target).entries()); state[key].push(data); e.target.reset(); save(); toast('Added'); }
function removeItem(key,i){ state[key].splice(i,1); save(); }
function renderChat(){
  const channels=['General','Announcement','Meals','Lodging','Travel','Activities','Emergency'];
  $('#chat').innerHTML = `${card('Family chat', `<div class="notice">Use channels for general chat, rental discussion, travel updates, meal planning, and announcements.</div><br><div class="chat-box">${state.chat.map(m=>`<div class="msg ${m.name===state.settings.userName?'me':''}"><strong>${esc(m.channel||'General')} · ${esc(m.name)}</strong><div>${esc(m.text)}</div><small>${new Date(m.time).toLocaleString()}</small></div>`).join('')}</div><form class="form" onsubmit="addChat(event)"><div class="row"><select name="channel">${channels.map(c=>`<option>${c}</option>`).join('')}</select><input name="name" value="${esc(state.settings.userName)}" placeholder="Your name"></div><textarea name="text" placeholder="Write a message..."></textarea><button class="primary">Send</button></form>`)}`;
}
function addChat(e, forcedChannel){ e.preventDefault(); const fd=new FormData(e.target); const text=fd.get('text'); if(!text) return; state.chat.push({name:fd.get('name')||state.settings.userName||'Family',channel:forcedChannel||fd.get('channel')||'General',text,time:Date.now()}); e.target.reset(); save(); }
function renderSettings(){
  $('#settings').innerHTML = card('Trip settings', `<form class="form" onsubmit="saveSettings(event)"><input name="tripName" value="${esc(state.settings.tripName)}" placeholder="Trip name"><input name="tripSubtitle" value="${esc(state.settings.tripSubtitle)}" placeholder="Subtitle"><input name="tripDate" type="date" value="${esc(state.settings.tripDate)}"><input name="coverPhoto" value="${esc(state.settings.coverPhoto)}" placeholder="Real photo URL for banner"><input name="userName" value="${esc(state.settings.userName)}" placeholder="Your chat name"><button class="primary">Save settings</button></form>`)
  + card('Live family sharing with Firebase', `<p>Right now this app saves to this device. To let every family member see the same live data, paste your Firebase config inside <strong>app.js</strong> where marked, then publish to GitHub Pages.</p><p class="muted">I left the app Firebase-ready so it can match the way your Mom's Help List syncs.</p>`)
  + card('Export / backup', `<div class="row"><button class="secondary" onclick="downloadBackup()">Download backup</button><button class="secondary danger" onclick="resetApp()">Reset sample data</button></div>`);
}
function saveSettings(e){ e.preventDefault(); Object.assign(state.settings,Object.fromEntries(new FormData(e.target).entries())); save(); toast('Settings saved'); }
function downloadBackup(){ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='our-family-adventures-backup.json'; a.click(); }
function resetApp(){ if(confirm('Reset the app data on this device?')){ state=structuredClone(defaultState); save(); } }

// Optional Firebase live sync: paste your Firebase config below and set enableFirebase = true.
const enableFirebase = false;
const firebaseConfig = {
  // apiKey: '', authDomain: '', databaseURL: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: ''
};
if(enableFirebase && firebaseConfig.databaseURL){
  firebase.initializeApp(firebaseConfig); db = firebase.database(); dbRef = db.ref('ourFamilyAdventures/main');
  dbRef.on('value', snap => { if(snap.exists()){ state = snap.val(); localStorage.setItem('ofaState', JSON.stringify(state)); renderAll(); } else { dbRef.set(state); } });
}
