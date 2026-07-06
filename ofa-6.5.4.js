/* Our Family Adventures 6.5.4 — missing trip history map + trip-date meal planner */
(function(){
  'use strict';
  const VERSION='6.5.4';
  const q=id=>document.getElementById(id);
  const qa=s=>Array.from(document.querySelectorAll(s));
  const E=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const toastMsg=m=>{try{typeof toast==='function'?toast(m):console.log(m)}catch{}};
  const me=()=>{try{return (data.profile&&data.profile.name)||firebase?.auth?.().currentUser?.displayName||firebase?.auth?.().currentUser?.email||localStorage.getItem('ofa_family_user')||'Family member'}catch{return 'Family member'}};
  function ensure(){ if(!window.data)return false; ['people','trips','memories','pages','links','meals','groceries','packing','pins','chat','activity','notifications'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]}); return true; }
  function saveNow(){ try{if(typeof normalizeData==='function')normalizeData()}catch{}; try{localStorage.setItem('ofaDataFinalV4',JSON.stringify(data))}catch{}; try{if(typeof queueFirebaseSave==='function')queueFirebaseSave(); else if(typeof pushFirebaseData==='function')pushFirebaseData();}catch(e){console.warn(e)} }
  function addNotice(text,type='trips'){ try{ if(typeof addAppNotification==='function')addAppNotification(text,type); else if(typeof addNotification653==='function')addNotification653(text,type); }catch{} }
  function placeOfTrip(t){return (t.address||t.tripAddress||t.location||t.destination||t.notes||'').trim();}
  function mapsSearchUrl(place){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(place||'');}
  function directionsUrl(place){return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(place||'');}
  function embedMapUrl(place){return 'https://maps.google.com/maps?q='+encodeURIComponent(place||'')+'&output=embed';}
  function prettyDate(d){ if(!d)return ''; const x=new Date(d+'T12:00:00'); return isNaN(x)?d:x.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'}); }
  function dateRange(start,end){ const out=[]; if(!start)return out; const s=new Date(start+'T12:00:00'); const e=end?new Date(end+'T12:00:00'):new Date(start+'T12:00:00'); if(isNaN(s)||isNaN(e))return out; for(let d=new Date(s); d<=e; d.setDate(d.getDate()+1)){ out.push(d.toISOString().slice(0,10)); if(out.length>45)break; } return out; }
  function mealTypesForDate(idx,total){ if(total<=1)return ['Breakfast','Lunch','Dinner','Snack']; if(idx===0)return ['Lunch','Dinner','Snack']; if(idx===total-1)return ['Breakfast','Lunch']; return ['Breakfast','Lunch','Dinner','Snack']; }
  function currentTripByName(name){ return (data.trips||[]).find(t=>t.name===name)||(data.trips||[])[0]||null; }

  function patchTripForm(){
    const saveBtn=q('saveTrip'); if(!saveBtn||saveBtn.dataset.v654)return; saveBtn.dataset.v654='1';
    const oldClick=saveBtn.onclick;
    saveBtn.onclick=function(ev){
      try{ if(oldClick) oldClick.call(this,ev); }catch(e){console.warn(e)}
      setTimeout(()=>{ensure(); const recent=(data.trips||[]).slice().sort((a,b)=>(b.createdAt||b.updatedAt||'').localeCompare(a.createdAt||a.updatedAt||''))[0]; if(recent){ const addr=q('tripAddress')?.value?.trim(); const budget=q('tripBudget')?.value?.trim(); if(addr&&!recent.address)recent.address=addr; if(addr&&!recent.tripAddress)recent.tripAddress=addr; if(budget&&!recent.budget)recent.budget=budget; saveNow(); renderTripHistoryMap(); renderMealDayPlanner(); }},200);
    };
  }

  function ensureTripHistoryUI(){
    const explore=q('explore'); if(explore&&!q('tripHistoryMap654')){
      const head=explore.querySelector('.pageHead');
      head?.insertAdjacentHTML('afterend',`<div id="tripHistoryMap654" class="card tripHistoryMapCard"><h3>Family Trip History Map</h3><p class="historyMapNote">Every saved adventure destination and every pin appears here. Add places your family visited, then tap directions to open Google Maps.</p><div class="mapEmbed"><iframe title="Family trip history map" loading="lazy"></iframe></div><div id="tripHistoryPins654" class="tripHistoryGrid"></div></div>`);
    }
    const dashMaps=q('dashMaps'); if(dashMaps&&!q('dashTripMap654')){
      dashMaps.insertAdjacentHTML('beforebegin',`<div id="dashTripMap654" class="card tripHistoryMapCard"><h3>Trip History Map</h3><div class="mapEmbed"><iframe title="Trip map" loading="lazy"></iframe></div><div id="dashTripPins654" class="pinGrid"></div></div>`);
    }
  }
  function allPins(){
    ensure();
    const tripPins=(data.trips||[]).map(t=>{const a=placeOfTrip(t); return a?{id:t.id,name:t.name||'Adventure',address:a,kind:'Adventure',start:t.start,end:t.end}:null}).filter(Boolean);
    const manual=(data.pins||[]).map(p=>({id:p.id,name:p.name||'Saved Pin',address:p.address||p.place||p.destination||'',kind:'Pin',start:p.createdAt||''})).filter(p=>p.address);
    const seen=new Set(); return [...tripPins,...manual].filter(p=>{const key=(p.name+'|'+p.address).toLowerCase(); if(seen.has(key))return false; seen.add(key); return true;});
  }
  function renderTripHistoryMap(){
    ensureTripHistoryUI(); const pins=allPins(); const first=pins[0]?.address||'United States';
    [['tripHistoryMap654','tripHistoryPins654'],['dashTripMap654','dashTripPins654']].forEach(([cardId,listId])=>{
      const card=q(cardId), list=q(listId); if(!card||!list)return; const iframe=card.querySelector('iframe'); if(iframe)iframe.src=embedMapUrl(first);
      list.innerHTML=pins.length?pins.map(p=>`<div class="pinCard"><b>${E(p.name)}</b><small>${E(p.kind)}${p.start?` • ${E(prettyDate(String(p.start).slice(0,10)))}`:''}</small><div>${E(p.address)}</div><div class="mealSlotActions"><a class="secondary smallBtn" target="_blank" rel="noopener" href="${mapsSearchUrl(p.address)}">View Map</a><a class="secondary smallBtn" target="_blank" rel="noopener" href="${directionsUrl(p.address)}">Directions</a></div></div>`).join(''):'<p class="helperWarn">No trip history pins yet. Add an adventure destination or save a pin below.</p>';
    });
  }
  function patchSavePin(){ const btn=q('savePin'); if(!btn||btn.dataset.v654)return; btn.dataset.v654='1'; btn.onclick=()=>{ensure(); const name=(q('pinName')?.value||'Visited place').trim(); const address=(q('pinAddress')?.value||'').trim(); if(!address)return toastMsg('Add an address or place first.'); data.pins.push({id:id(),name,address,createdAt:new Date().toISOString(),addedBy:me()}); q('pinName').value=''; q('pinAddress').value=''; saveNow(); addNotice('Trip history pin added: '+name,'trips'); renderTripHistoryMap(); try{render()}catch{};}; }

  function ensureMealPlannerUI(){
    const mealSection=q('meals'); if(!mealSection||q('mealDayPlanner654'))return;
    const firstForm=mealSection.querySelector('.formCard');
    firstForm?.insertAdjacentHTML('beforebegin',`<div id="mealDayPlanner654" class="card mealDayPlanner"><h3>Trip Date Meal Planner</h3><p class="historyMapNote">Choose a trip and add meals by each travel day, such as Friday breakfast, Friday lunch, Saturday breakfast, and Sunday lunch.</p><div class="mealDateTools"><label>Adventure<select id="mealTripDay654"></select></label><label>Day<select id="mealDate654"></select></label><label>Meal<select id="mealTypeSelect654"><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option><option>Dessert</option><option>Drinks</option><option>Dining Out</option><option>Late Snack</option><option>Happy Hour</option></select></label></div><label>Meal / item<input id="mealItem654" placeholder="Pancakes, sandwiches, snacks, restaurant..." /></label><label>Assigned to<input id="mealPerson654" placeholder="Name or volunteer needed" /></label><button id="addMealSlot654" class="primary">Add Meal to This Day</button><div id="mealSlots654" class="mealDayGrid"></div></div>`);
    q('mealTripDay654').onchange=()=>{fillMealDates(); renderMealSlots();};
    q('mealDate654').onchange=renderMealSlots;
    q('addMealSlot654').onclick=addMealByDate;
  }
  function fillMealTripSelect(){ const sel=q('mealTripDay654'); if(!sel)return; const prev=sel.value; sel.innerHTML=(data.trips||[]).map(t=>`<option value="${E(t.name)}">${E(t.name)}</option>`).join('')||'<option value="General">General</option>'; if(prev)sel.value=prev; fillMealDates(); }
  function fillMealDates(){ const sel=q('mealDate654'), trip=currentTripByName(q('mealTripDay654')?.value); if(!sel)return; const prev=sel.value; const dates=trip?dateRange(trip.start,trip.end):[]; sel.innerHTML=dates.length?dates.map(d=>`<option value="${d}">${E(prettyDate(d))}</option>`).join(''):'<option value="">Add trip dates first</option>'; if(prev&&dates.includes(prev))sel.value=prev; }
  function addMealByDate(){ ensure(); const tripName=q('mealTripDay654')?.value||q('mealTrip')?.value||'General'; const date=q('mealDate654')?.value||''; const type=q('mealTypeSelect654')?.value||'Meal'; const item=(q('mealItem654')?.value||'').trim()||type; const person=(q('mealPerson654')?.value||'Volunteer needed').trim(); if(!date)return toastMsg('Add arrival/departure dates to the trip first.'); data.meals.push({id:id(),trip:tripName,date,mealDate:date,title:type,mealType:type,item,person,scope:'group',private:false,owner:person,addedBy:me(),done:false,createdAt:new Date().toISOString()}); q('mealItem654').value=''; q('mealPerson654').value=''; saveNow(); addNotice(`${prettyDate(date)} ${type} added`,'meals'); renderMealSlots(); try{renderMeals&&renderMeals()}catch{}; }
  window.addMealForSlot654=function(tripName,date,type){ q('mealTripDay654').value=tripName; fillMealDates(); q('mealDate654').value=date; q('mealTypeSelect654').value=type; q('mealItem654').focus(); toastMsg(`Add item for ${prettyDate(date)} ${type}`); };
  window.removeMeal654=function(mid){ ensure(); data.meals=data.meals.filter(m=>m.id!==mid); saveNow(); renderMealSlots(); try{renderMeals&&renderMeals()}catch{}; };
  function renderMealSlots(){
    const box=q('mealSlots654'); if(!box)return; const tripName=q('mealTripDay654')?.value||''; const trip=currentTripByName(tripName); const dates=trip?dateRange(trip.start,trip.end):[];
    if(!trip){box.innerHTML='<p class="helperWarn">Add an adventure first.</p>';return;} if(!dates.length){box.innerHTML='<p class="helperWarn">Add arrival and departure dates to this adventure to create Friday/Saturday/Sunday meal slots.</p>';return;}
    const cards=[]; dates.forEach((d,idx)=>mealTypesForDate(idx,dates.length).forEach(type=>{ const existing=(data.meals||[]).filter(m=>(m.trip===trip.name||m.trip===tripName)&&((m.date||m.mealDate||'')===d)&&((m.mealType||m.title||'').toLowerCase()===type.toLowerCase())); cards.push(`<div class="mealSlotCard ${existing.length?'filled':''}"><div class="mealSlotHeader"><div><b>${E(prettyDate(d))}</b><small>${E(type)}</small></div><button class="secondary smallBtn" onclick="addMealForSlot654('${E(trip.name)}','${d}','${E(type)}')">Add</button></div>${existing.length?existing.map(m=>`<p><b>${E(m.item)}</b><br><small>${E(m.person||'Volunteer needed')}</small><br><button class="secondary smallBtn" onclick="removeMeal654('${m.id}')">Remove</button></p>`).join(''):'<small>Open slot</small>'}</div>`); }));
    box.innerHTML=cards.join('');
  }
  const oldRenderMeals=window.renderMeals;
  window.renderMeals=function(){ try{oldRenderMeals&&oldRenderMeals();}catch(e){console.warn(e)} ensureMealPlannerUI(); fillMealTripSelect(); renderMealSlots(); };
  function patchSaveMeal(){ const btn=q('saveMeal'); if(!btn||btn.dataset.v654)return; btn.dataset.v654='1'; btn.onclick=()=>{ensure(); const trip=q('mealTrip')?.value||q('mealTripDay654')?.value||'General'; const type=q('mealTypeSelect654')?.value||q('mealTypeSelect64')?.value||q('mealTypeSelect637')?.value||q('mealTypeSelect636')?.value||q('mealTitle')?.value||'Meal'; const date=q('mealDate654')?.value||''; const item=(q('mealItem')?.value||'').trim()||type; const person=(q('mealPerson')?.value||q('mealPerson654')?.value||'Volunteer needed').trim(); data.meals.push({id:id(),trip,date,mealDate:date,title:type,mealType:type,item,person,scope:'group',private:false,owner:person,addedBy:me(),done:false,createdAt:new Date().toISOString()}); if(q('mealItem'))q('mealItem').value=''; saveNow(); addNotice('Meal added: '+(date?prettyDate(date)+' ':'')+type,'meals'); renderMealSlots(); try{renderMeals()}catch{}; }; }

  const oldRender=window.render;
  window.render=function(){ ensure(); try{oldRender&&oldRender();}catch(e){console.warn(e)} patchTripForm(); patchSavePin(); ensureTripHistoryUI(); renderTripHistoryMap(); ensureMealPlannerUI(); fillMealTripSelect(); patchSaveMeal(); renderMealSlots(); };
  document.addEventListener('DOMContentLoaded',()=>{ensure(); patchTripForm(); patchSavePin(); ensureTripHistoryUI(); renderTripHistoryMap(); ensureMealPlannerUI(); fillMealTripSelect(); patchSaveMeal(); renderMealSlots();});
  setTimeout(()=>{try{window.render()}catch{}},900);
})();
