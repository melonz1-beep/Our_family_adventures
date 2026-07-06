/* Our Family Adventures 6.5.5 — shared family chat, dated meal slots, movable/resizable scrapbook stickers, weather/place search fixes */
(function(){
  'use strict';
  const VERSION='6.5.5';
  const FAMILY_ID='our-family-adventures';
  const $=id=>document.getElementById(id);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const now=()=>new Date().toISOString();
  const currentUser=()=>{try{return localStorage.getItem('ofa_family_user') || data?.profile?.name || firebase?.auth?.().currentUser?.displayName || firebase?.auth?.().currentUser?.email || 'Family member'}catch{return 'Family member'}};
  const currentKey=()=>{try{return (firebase?.auth?.().currentUser?.uid)||localStorage.getItem('ofa_family_email')||currentUser()}catch{return currentUser()}};
  function ensure(){ if(!window.data) window.data={}; ['trips','meals','groceries','chat','pages','notifications','activity'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]}); return data; }
  function toastMsg(m){try{typeof toast==='function'?toast(m):console.log(m)}catch{}}
  function saveLocal(){try{localStorage.setItem('ofaDataFinalV4',JSON.stringify(data))}catch{}; try{localStorage.setItem('ofaData',JSON.stringify(data))}catch{}}
  async function saveShared(skipQueue=false){
    ensure(); saveLocal();
    if(!skipQueue){ try{ if(typeof queueFirebaseSave==='function') queueFirebaseSave(); }catch{} }
    try{
      const u=firebase?.auth?.().currentUser;
      if(!u || !firebase.firestore) return;
      await firebase.firestore().collection('families').doc(FAMILY_ID).collection('private').doc('appData').set({data,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),version:VERSION},{merge:true});
    }catch(e){console.warn('Shared save failed',e)}
  }
  function prettyDate(d){ if(!d)return ''; const x=new Date(String(d).slice(0,10)+'T12:00:00'); return isNaN(x)?String(d):x.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'}); }
  function dateRange(start,end){ const out=[]; if(!start)return out; const s=new Date(start+'T12:00:00'), e=new Date((end||start)+'T12:00:00'); if(isNaN(s)||isNaN(e))return out; for(let d=new Date(s); d<=e; d.setDate(d.getDate()+1)){out.push(d.toISOString().slice(0,10)); if(out.length>45)break;} return out; }
  function mealTypes(i,total){ if(total<=1)return ['Breakfast','Lunch','Dinner','Snack']; if(i===0)return ['Lunch','Dinner','Snack']; if(i===total-1)return ['Breakfast','Lunch']; return ['Breakfast','Lunch','Dinner','Snack']; }
  function placeOf(t){return (t?.address||t?.tripAddress||t?.destination||t?.location||t?.name||'').trim();}
  function mapSearch(q,near){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q+(near?' near '+near:''));}

  // Keep all invited family members on one shared family document instead of only their private user document.
  let sharedListening=false;
  function attachSharedFamilyListener(){
    if(sharedListening) return;
    try{
      const u=firebase?.auth?.().currentUser;
      if(!u || !firebase.firestore) return;
      sharedListening=true;
      firebase.firestore().collection('families').doc(FAMILY_ID).collection('private').doc('appData').onSnapshot(snap=>{
        const incoming=snap.exists ? snap.data()?.data : null;
        if(!incoming) return;
        ensure();
        const before=JSON.stringify(data.chat||[]);
        Object.keys(data).forEach(k=>delete data[k]);
        Object.assign(data,incoming); ensure(); saveLocal();
        if(typeof render==='function') render();
        if(before!==JSON.stringify(data.chat||[])) updateUnreadBadge();
      },err=>console.warn('Shared listener failed',err));
    }catch(e){console.warn(e)}
  }
  const oldPush=window.pushFirebaseData;
  window.pushFirebaseData=async function(){ try{ if(oldPush) await oldPush(); }catch(e){console.warn(e)}; try{await saveShared(true);}catch{} };

  // Meal planning by actual trip dates.
  function ensureMealPlanner(){
    ensure(); const section=$('meals'); if(!section) return;
    if(!$('mealDatePlanner655')){
      section.querySelector('.pageHead')?.insertAdjacentHTML('afterend',`<div id="mealDatePlanner655" class="card mealDatePlanner655"><h3>Meals by Trip Date</h3><p class="helperText">Pick the trip, then add meals under each travel day. The first day starts with lunch/dinner and the last day ends with breakfast/lunch.</p><label>Adventure<select id="mealTrip655"></select></label><div id="mealDaySlots655" class="mealDaySlots655"></div></div>`);
      $('mealTrip655').addEventListener('change',renderMealDaySlots);
    }
    const sel=$('mealTrip655'); const prev=sel.value;
    sel.innerHTML=(data.trips||[]).map(t=>`<option value="${esc(t.name||t.id)}">${esc(t.name||'Adventure')}</option>`).join('')||'<option value="General">General</option>';
    if(prev) sel.value=prev;
    renderMealDaySlots();
  }
  window.addMealSlot655=function(tripName,date,type){
    ensure(); const item=prompt(`${prettyDate(date)} ${type}: what meal or item?`, type==='Dining Out'?'Restaurant / dining out':'');
    if(!item) return;
    const person=prompt('Who is bringing it or responsible?', 'Volunteer needed') || 'Volunteer needed';
    data.meals.push({id:uid(),trip:tripName,date,mealDate:date,title:type,mealType:type,item,person,scope:'group',private:false,addedBy:currentUser(),createdAt:now(),done:false});
    saveShared(); renderMealDaySlots(); try{if(typeof renderMeals==='function')renderMeals()}catch{}; toastMsg('Meal added');
  };
  window.toggleMealDone655=function(id){ const m=(data.meals||[]).find(x=>x.id===id); if(m){m.done=!m.done; saveShared(); renderMealDaySlots();}};
  window.deleteMeal655=function(id){ data.meals=(data.meals||[]).filter(x=>x.id!==id); saveShared(); renderMealDaySlots(); try{if(typeof renderMeals==='function')renderMeals()}catch{}; };
  function renderMealDaySlots(){
    const box=$('mealDaySlots655'), sel=$('mealTrip655'); if(!box||!sel)return;
    const trip=(data.trips||[]).find(t=>(t.name||t.id)===sel.value) || (data.trips||[])[0];
    const tripName=trip?.name || sel.value || 'General'; const dates=dateRange(trip?.start,trip?.end);
    if(!dates.length){ box.innerHTML='<p class="helperWarn">Add arrival and departure dates to this trip first.</p>'; return; }
    box.innerHTML=dates.map((d,i)=>`<div class="mealDateCard655"><h4>${esc(prettyDate(d))}</h4>${mealTypes(i,dates.length).map(type=>{ const meals=(data.meals||[]).filter(m=>(m.trip===tripName||m.trip===trip?.id)&&String(m.date||m.mealDate||'').slice(0,10)===d&&(m.mealType||m.title)===type); return `<div class="mealSlot655"><b>${esc(type)}</b><button class="smallBtn secondary" onclick="addMealSlot655('${esc(tripName)}','${d}','${type}')">Add</button>${meals.map(m=>`<div class="mealPill655 ${m.done?'done':''}"><label><input type="checkbox" ${m.done?'checked':''} onchange="toggleMealDone655('${m.id}')"> ${esc(m.item||type)}</label><small>${esc(m.person||'Volunteer needed')}</small><button onclick="deleteMeal655('${m.id}')">×</button></div>`).join('')}</div>`; }).join('')}</div>`).join('');
  }

  // Chat history, unread badge, mark read, read receipts.
  function ensureChatTools(){
    const chat=$('chat'); if(!chat) return;
    if(!$('chatReadTools655')) chat.querySelector('.pageHead')?.insertAdjacentHTML('beforeend',`<div id="chatReadTools655" class="chatReadTools655"><button id="markAllChatRead655" class="secondary">Mark Chat as Read</button><span id="chatReadStatus655"></span></div>`);
    $('markAllChatRead655').onclick=markAllChatRead;
    const btn=$('sendChat'); if(btn && !btn.dataset.v655){ btn.dataset.v655='1'; btn.onclick=sendChat; }
    const input=$('chatInput'); if(input && !input.dataset.v655){ input.dataset.v655='1'; input.addEventListener('keydown',e=>{if(e.key==='Enter')sendChat();}); }
  }
  function sendChat(){
    ensure(); const input=$('chatInput'); const text=(input?.value||'').trim(); if(!text) return;
    const c={id:uid(),text,author:currentUser(),name:currentUser(),at:now(),readBy:{}}; c.readBy[currentKey()]={name:currentUser(),at:now()};
    data.chat.push(c); if(input)input.value=''; saveShared(); renderChat655(); updateUnreadBadge(); try{if(typeof addAppNotification==='function')addAppNotification('New family chat from '+currentUser(),'chat');}catch{};
  }
  function markAllChatRead(){ ensure(); const key=currentKey(), name=currentUser(); (data.chat||[]).forEach(c=>{c.readBy=c.readBy||{}; c.readBy[key]={name,at:now()}; c.read=true;}); saveShared(); renderChat655(); updateUnreadBadge(); }
  function unreadCount(){ ensure(); const key=currentKey(); return (data.chat||[]).filter(c=>!c.readBy || !c.readBy[key]).length; }
  function updateUnreadBadge(){
    const n=unreadCount(); ['chatUnread','chatUnread655'].forEach(id=>{const b=$(id); if(b){b.textContent=n; b.hidden=!n; b.style.display=n?'inline-flex':'none';}});
    const s=$('chatReadStatus655'); if(s) s.textContent=n?`${n} unread message${n===1?'':'s'}`:'All chat read';
  }
  function readReceiptText(c){ const vals=Object.values(c.readBy||{}); if(!vals.length) return 'Unread'; return 'Read by '+vals.map(r=>`${r.name||'Family'} ${r.at?new Date(r.at).toLocaleString():''}`).join(' • '); }
  function renderChat655(){
    ensureChatTools(); const box=$('chatLog'); if(!box)return;
    box.innerHTML=(data.chat||[]).map(c=>`<div class="bubble chatBubble655"><b>${esc(c.author||c.name||'Family')}</b><br>${esc(c.text).replace(/@([\w.-]+)/g,'<b>@$1</b>')}<br><small>${new Date(c.at||Date.now()).toLocaleString()}</small><details><summary>Read receipts</summary><small>${esc(readReceiptText(c))}</small></details></div>`).join('')||'<p>No chat yet.</p>';
    box.scrollTop=box.scrollHeight; updateUnreadBadge();
  }
  window.renderChat=renderChat655;

  // Movable and resizable scrapbook stickers.
  const stickerChoices=['🐚','⭐','🌊','☀️','⚓','💗','🗼','🏖️','📷','🎉','🍹','🌲','⛰️'];
  function ensureScrapbookStickers(){
    ensure(); $$('.scrapPage').forEach((pageEl,idx)=>{
      const page=data.pages?.[idx]; if(!page) return; page.stickers=page.stickers||[];
      pageEl.classList.add('scrapInteractive655'); pageEl.dataset.pageId=page.id;
      if(!pageEl.querySelector('.addSticker655')) pageEl.insertAdjacentHTML('beforeend',`<div class="scrapStickerTools655 noPrint"><select class="stickerSelect655">${stickerChoices.map(s=>`<option>${s}</option>`).join('')}</select><button class="secondary addSticker655">Add Sticker</button></div>`);
      pageEl.querySelector('.addSticker655').onclick=()=>{ const val=pageEl.querySelector('.stickerSelect655').value; page.stickers.push({id:uid(),text:val,x:24,y:70,size:42}); saveShared(); if(typeof render==='function')render(); };
      pageEl.querySelectorAll('.stickerLayer655').forEach(x=>x.remove());
      const layer=document.createElement('div'); layer.className='stickerLayer655'; pageEl.appendChild(layer);
      page.stickers.forEach(st=>{
        const el=document.createElement('div'); el.className='dragSticker655'; el.textContent=st.text; el.style.left=(st.x||20)+'px'; el.style.top=(st.y||70)+'px'; el.style.fontSize=(st.size||42)+'px'; el.dataset.sid=st.id;
        el.insertAdjacentHTML('beforeend','<button class="stickerDelete655 noPrint">×</button><span class="resizeSticker655 noPrint">↘</span>');
        layer.appendChild(el); bindSticker(el,page,st,pageEl);
      });
    });
  }
  function bindSticker(el,page,st,pageEl){
    let mode='',sx=0,sy=0,ox=0,oy=0,os=0;
    el.querySelector('.stickerDelete655').onclick=e=>{e.stopPropagation(); page.stickers=page.stickers.filter(x=>x.id!==st.id); saveShared(); if(typeof render==='function')render();};
    el.querySelector('.resizeSticker655').onpointerdown=e=>{e.stopPropagation(); mode='resize'; sx=e.clientX; sy=e.clientY; os=st.size||42; el.setPointerCapture(e.pointerId);};
    el.onpointerdown=e=>{ if(e.target.closest('button,.resizeSticker655'))return; mode='drag'; sx=e.clientX; sy=e.clientY; ox=st.x||20; oy=st.y||70; el.setPointerCapture(e.pointerId); };
    el.onpointermove=e=>{ if(!mode)return; if(mode==='drag'){st.x=Math.max(0,ox+e.clientX-sx); st.y=Math.max(0,oy+e.clientY-sy); el.style.left=st.x+'px'; el.style.top=st.y+'px';} else {st.size=Math.max(18,Math.min(140,os+(e.clientX-sx+e.clientY-sy)/2)); el.style.fontSize=st.size+'px';} };
    el.onpointerup=e=>{ if(mode){mode=''; try{el.releasePointerCapture(e.pointerId)}catch{}; saveShared();} };
  }

  // Weather fallback plus trip place searches.
  async function weatherFor(place){
    if(!place) return 'Add a destination, city/state, or trip address first.';
    const tries=[place, place.replace(/\d+\s+[^,]+,?\s*/,'')];
    for(const term of tries){
      try{
        const geo=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=1&language=en&format=json`).then(r=>r.json());
        const g=geo.results?.[0]; if(!g) continue;
        const w=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=auto`).then(r=>r.json());
        return `${g.name}${g.admin1?', '+g.admin1:''}: ${Math.round(w.current?.temperature_2m)}°F now. Today ${Math.round(w.daily?.temperature_2m_max?.[0])}° / ${Math.round(w.daily?.temperature_2m_min?.[0])}°. Rain chance ${Math.round(w.daily?.precipitation_probability_max?.[0]||0)}%.`;
      }catch(e){console.warn(e)}
    }
    return 'Live weather could not find that destination. Try city and state, such as Mariposa, CA.';
  }
  window.refreshTripWeather=async function(id){ ensure(); const t=(data.trips||[]).find(x=>x.id===id)||(data.trips||[])[0]; if(!t)return; const msg=await weatherFor(placeOf(t)); t.weather=msg; saveShared(); try{if(typeof render==='function')render()}catch{}; toastMsg('Weather updated'); };
  function ensurePlaceSearch(){
    ensure(); const section=$('adventures'); if(!section||$('tripPlaceSearch655')) return;
    section.querySelector('.pageHead')?.insertAdjacentHTML('afterend',`<div id="tripPlaceSearch655" class="card tripPlaceSearch655"><h3>Search Near This Trip</h3><p class="helperText">Find restaurants, grocery stores, gas stations, hospitals, or hotels near the selected adventure.</p><label>Adventure<select id="placeTrip655"></select></label><div class="placeButtons655"><button data-kind="restaurants">Restaurants</button><button data-kind="grocery stores">Grocery Stores</button><button data-kind="gas stations">Gas Stations</button><button data-kind="hospitals">Hospitals</button><button data-kind="hotels">Hotels</button></div></div>`);
    $('tripPlaceSearch655').addEventListener('click',e=>{ const b=e.target.closest('button[data-kind]'); if(!b)return; const trip=(data.trips||[]).find(t=>(t.id||t.name)===$('placeTrip655').value)||(data.trips||[])[0]; const near=placeOf(trip); if(!near)return toastMsg('Add a trip destination first.'); window.open(mapSearch(b.dataset.kind,near),'_blank'); });
  }
  function fillPlaceTrips(){ const sel=$('placeTrip655'); if(!sel)return; const prev=sel.value; sel.innerHTML=(data.trips||[]).map(t=>`<option value="${esc(t.id||t.name)}">${esc(t.name||'Adventure')}</option>`).join('')||'<option>No trips added</option>'; if(prev)sel.value=prev; }

  const oldRender=window.render;
  window.render=function(){ ensure(); try{oldRender&&oldRender();}catch(e){console.warn(e)} attachSharedFamilyListener(); ensureMealPlanner(); ensureChatTools(); renderChat655(); ensureScrapbookStickers(); ensurePlaceSearch(); fillPlaceTrips(); updateUnreadBadge(); };
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{ensure(); attachSharedFamilyListener(); if(typeof render==='function')render();},400));
})();
