/* Our Family Adventures 6.5.3 — iPhone/Safari + shared family data corrective patch */
(function(){
  'use strict';
  const VERSION='6.5.3';
  const q=id=>document.getElementById(id);
  const qa=s=>Array.from(document.querySelectorAll(s));
  const E=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const toastMsg=m=>{try{ if(typeof toast==='function')toast(m); else alert(m);}catch{}};
  const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const me=()=>{try{return (data.profile&&data.profile.name)||firebase?.auth?.().currentUser?.displayName||firebase?.auth?.().currentUser?.email||localStorage.getItem('ofaUserName')||'Family member'}catch{return 'Family member'}};
  const ensure=()=>{ if(!window.data)return false; ['people','trips','memories','pages','links','meals','groceries','packing','pins','chat','activity','notifications'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]}); data.profile=data.profile||{}; data.settings=data.settings||{}; data.settings.familyId=data.settings.familyId||'our-family-adventures'; return true; };
  const saveLocal=()=>{try{ if(typeof normalizeData==='function')normalizeData(); localStorage.setItem('ofaDataFinalV4',JSON.stringify(data)); }catch(e){console.warn(e)}};
  const saveAll=()=>{saveLocal(); try{ if(typeof queueFirebaseSave==='function')queueFirebaseSave(); }catch(e){console.warn(e)} };

  // Use one shared Firebase family document instead of each phone having a blank private copy.
  function sharedFamilyRef(){
    if(!window.firebase || !firebase.firestore)return null;
    const familyId=(window.data&&data.settings&&data.settings.familyId)||'our-family-adventures';
    return firebase.firestore().collection('families').doc(familyId).collection('private').doc('appData');
  }
  async function migratePrivateToSharedIfNeeded(){
    try{
      if(!window.firebase||!firebase.auth().currentUser||!sharedFamilyRef())return;
      const shared=sharedFamilyRef();
      const sharedSnap=await shared.get();
      const hasShared=sharedSnap.exists && sharedSnap.data() && sharedSnap.data().data && Object.keys(sharedSnap.data().data).length;
      const localHasContent=(data.trips?.length||data.people?.length||data.memories?.length||data.pages?.length||data.links?.length||data.pins?.length||data.meals?.length||data.groceries?.length||data.packing?.length);
      if(!hasShared && localHasContent){
        await shared.set({data,version:VERSION,migratedFrom:'browser-or-private-user-copy',updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
        toastMsg('Family shared data is now ready for other phones.');
      }
    }catch(e){console.warn('shared migration skipped',e);}
  }
  try{
    window.appDataRef=sharedFamilyRef;
    if(typeof appDataRef!=='undefined') appDataRef=sharedFamilyRef;
    if(typeof pushFirebaseData!=='undefined') pushFirebaseData=async function(){
      try{ if(!window.firebase||!firebase.auth().currentUser||!sharedFamilyRef())return; ensure(); await sharedFamilyRef().set({data,version:VERSION,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}); }catch(e){console.error(e);toastMsg('Firebase save failed. Check Firestore rules.');}
    };
    if(typeof pullFirebaseData!=='undefined') pullFirebaseData=async function(){
      try{ if(!window.firebase||!firebase.auth().currentUser||!sharedFamilyRef())return; const snap=await sharedFamilyRef().get(); if(snap.exists&&snap.data().data){ Object.keys(data).forEach(k=>delete data[k]); Object.assign(data,snap.data().data); ensure(); saveLocal(); if(typeof render==='function')render(); toastMsg('Shared family data loaded.'); } else { await migratePrivateToSharedIfNeeded(); await pushFirebaseData(); } }catch(e){console.error(e);toastMsg('Firebase shared data could not load.');}
    };
  }catch(e){console.warn(e)}

  function isIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1)}
  function isStandalone(){return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true}
  function ensureIOSInstallHelp(){
    const settings=q('settings');
    if(settings&&!q('iosInstallCard653')){
      settings.insertAdjacentHTML('afterbegin',`<div id="iosInstallCard653" class="card iosInstallCard"><h3>iPhone Install Help</h3><p><b>iPhone cannot download this like an App Store app.</b> Open the link in Safari, tap the Share button, then tap <b>Add to Home Screen</b>.</p><p>If the link opens inside Messages, Facebook, Gmail, or another mini-browser, tap <b>Open in Safari</b> first. After it is added to the Home Screen, sign in with the family email/invite.</p><button id="copyInstallLink653" class="secondary">Copy App Link</button><button id="openSafariHelp653" class="secondary">Show Install Steps</button><p id="iosInstallStatus653" class="helperText"></p></div>`);
      q('copyInstallLink653').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);toastMsg('App link copied. Send it to the iPhone and open it in Safari.')}catch{prompt('Copy this app link:',location.href)}};
      q('openSafariHelp653').onclick=()=>alert('iPhone install steps:\n\n1. Open this app link in Safari.\n2. Tap the Share icon at the bottom.\n3. Scroll and tap Add to Home Screen.\n4. Tap Add.\n5. Open Our Family Adventures from the new Home Screen icon.\n6. Sign in with the family email/invite.');
    }
    const status=q('iosInstallStatus653');
    if(status)status.textContent=isIOS()?(isStandalone()?'This iPhone is running the installed Home Screen app.':'This iPhone is in browser mode. Use Safari Share → Add to Home Screen.'):'Share this link with iPhone users and have them open it in Safari.';
    ['installBtn','settingsInstallBtn'].forEach(b=>{const el=q(b); if(el){el.hidden=false; el.textContent=isIOS()?'iPhone Install Help':'Install App'; el.onclick=()=>{ if(isIOS()) {try{show('settings')}catch{} ensureIOSInstallHelp(); alert('On iPhone: open in Safari → Share → Add to Home Screen.');} else if(typeof installApp==='function')installApp();}; }});
  }

  function requestNotifications(){
    if(!('Notification' in window)){toastMsg('This browser does not support phone notifications.');return;}
    Notification.requestPermission().then(p=>{ if(p==='granted'){addNotify('Phone notifications are turned on for this app.','system',true); showPhoneNotification('Notifications are turned on.');} else toastMsg('Notifications were not allowed on this phone.'); });
  }
  function showPhoneNotification(text){
    try{
      if(!('Notification' in window)||Notification.permission!=='granted')return;
      navigator.serviceWorker?.ready?.then(reg=>reg.showNotification('Our Family Adventures',{body:text,icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:'ofa-'+Date.now(),data:{url:location.href}})).catch(()=>new Notification('Our Family Adventures',{body:text,icon:'icons/icon-192.png'}));
    }catch(e){console.warn(e)}
  }
  function addNotify(text,type='general',system=false){
    ensure(); const n={id:id(),text,type,read:false,at:new Date().toISOString(),user:me()}; data.notifications.unshift(n); data.notifications=data.notifications.slice(0,120); saveAll(); updateBadge653(); if(!document.hasFocus()||system)showPhoneNotification(text); try{renderNotifications653()}catch{};
  }
  window.addAppNotification=window.addNotification651=window.addNotification653=addNotify;
  function updateBadge653(){const unread=(data.notifications||[]).filter(n=>!n.read).length; const b=q('notifyCount652'); if(b){b.hidden=!unread;b.textContent=unread;} try{ if(navigator.setAppBadge)navigator.setAppBadge(unread); else if(!unread&&navigator.clearAppBadge)navigator.clearAppBadge(); }catch{} }
  function renderNotifications653(){const list=q('notificationList652'); if(!list)return; ensure(); list.innerHTML=(data.notifications||[]).map(n=>`<div class="item ${n.read?'':'unread'}"><b>${E(n.type||'Notice')}</b><p>${E(n.text)}</p><small>${new Date(n.at).toLocaleString()} • ${E(n.user||'Family')}</small><br><button class="secondary smallBtn" onclick="markNotificationRead653('${n.id}')">Mark read</button></div>`).join('')||'<p>No notifications yet.</p>'; updateBadge653();}
  window.markNotificationRead653=nid=>{const n=data.notifications.find(x=>x.id===nid); if(n)n.read=true; saveAll(); renderNotifications653();};

  function bindCriticalButtons(){
    ['enableNotifications','settingsNotifyBtn','testNotifyBtn'].forEach(idn=>{const el=q(idn); if(el&&!el.dataset.v653){el.dataset.v653='1'; el.onclick=()=> idn==='testNotifyBtn' ? addNotify('Test notification from Our Family Adventures.','system',true) : requestNotifications(); }});
    const saveLink=q('saveLink'); if(saveLink&&!saveLink.dataset.v653){saveLink.dataset.v653='1'; saveLink.onclick=()=>{ensure(); const tripName=q('linkTrip')?.value||'General'; const title=(q('linkTitle')?.value||'Travel link').trim(); let url=(q('linkUrl')?.value||'').trim(); if(!url)return toastMsg('Add the travel link first.'); if(!/^https?:\/\//i.test(url))url='https://'+url; const trip=data.trips.find(t=>t.name===tripName); const link={id:id(),trip:tripName,tripId:trip?.id||'',title,url,createdAt:new Date().toISOString(),addedBy:me()}; data.links.push(link); if(trip){trip.tripLinks=trip.tripLinks||[]; trip.tripLinks.push(link);} q('linkTitle').value=''; q('linkUrl').value=''; saveAll(); addNotify('Travel link saved: '+title,'trips'); try{render()}catch{};};}
    const savePin=q('savePin'); if(savePin&&!savePin.dataset.v653){savePin.dataset.v653='1'; savePin.onclick=()=>{ensure(); const name=(q('pinName')?.value||'Saved place').trim(); const address=(q('pinAddress')?.value||'').trim(); if(!address)return toastMsg('Add an address or place first.'); data.pins.push({id:id(),name,address,createdAt:new Date().toISOString(),addedBy:me()}); q('pinName').value=''; q('pinAddress').value=''; saveAll(); addNotify('Map pin added: '+name,'trips'); try{render()}catch{};};}
  }

  function directionsUrl(place){return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(place||'')}
  function staticMap(place){return `https://maps.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;}
  function renderExplore653(){
    const box=q('exploreMap')||q('pinList'); if(!box)return; ensure();
    const tripPins=(data.trips||[]).map(t=>{const a=t.address||t.tripAddress||t.destination||''; return a?{id:t.id,name:t.name||'Trip',address:a}:null}).filter(Boolean);
    const pins=[...tripPins,...(data.pins||[])];
    if(!pins.length){box.innerHTML='<p class="helperWarn">No pins yet. Add a trip destination or save a map pin.</p>'; return;}
    const first=pins[0].address;
    box.innerHTML=`<div class="mapEmbed"><iframe title="Explore map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${staticMap(first)}"></iframe></div><div class="explorePinList">${pins.map(p=>`<div class="explorePin"><b>${E(p.name)}</b><br><small>${E(p.address)}</small><br><a class="secondary" target="_blank" rel="noopener" href="${directionsUrl(p.address)}">Open Directions</a></div>`).join('')}</div>`;
  }

  async function profileEmailUpdate653(email){
    try{const user=firebase?.auth?.().currentUser; if(user&&email&&email!==user.email){ if(user.verifyBeforeUpdateEmail) await user.verifyBeforeUpdateEmail(email); else if(user.updateEmail) await user.updateEmail(email); toastMsg('Profile saved. Check the new email for the Firebase verification link.'); }}catch(e){toastMsg('Profile contact email saved. Firebase login email changes can require signing out and back in first.');}
  }
  async function saveProfile653(){ensure(); const email=(q('profileEmail652')?.value||q('personEmail')?.value||'').trim(); data.profile.name=(q('profileName652')?.value||data.profile.name||me()).trim(); data.profile.email=email; data.profile.phone=(q('profilePhone652')?.value||data.profile.phone||'').trim(); await profileEmailUpdate653(email); saveAll(); addNotify('Profile updated','profile'); try{render()}catch{};}

  function patchProfileButton(){const btn=q('saveProfile652'); if(btn&&!btn.dataset.v653){btn.dataset.v653='1'; btn.onclick=saveProfile653;}}

  const oldRender=window.render;
  window.render=function(){ensure(); try{oldRender&&oldRender();}catch(e){console.warn('older render error',e)} ensureIOSInstallHelp(); bindCriticalButtons(); patchProfileButton(); renderExplore653(); renderNotifications653();};

  document.addEventListener('DOMContentLoaded',()=>{ensure(); ensureIOSInstallHelp(); bindCriticalButtons(); patchProfileButton(); renderExplore653(); renderNotifications653(); setTimeout(()=>{migratePrivateToSharedIfNeeded(); try{ if(typeof pullFirebaseData==='function')pullFirebaseData(); }catch{} },1200);});
  setTimeout(()=>{ensure(); ensureIOSInstallHelp(); bindCriticalButtons(); patchProfileButton(); renderExplore653(); renderNotifications653(); migratePrivateToSharedIfNeeded();},1800);
})();
