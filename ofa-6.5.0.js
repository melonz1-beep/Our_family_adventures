/* Our Family Adventures — Version 6.5.0 production stability layer */
(function(){
  'use strict';
  const VERSION='6.5.0';
  const FAMILY_ID='our-family-adventures';
  const DATA_COLLECTION='families';
  const INVITE_COLLECTION='familyInvites';
  const USER_COLLECTION='users';
  const NOTIFICATION_COLLECTION='notifications';
  const $=id=>document.getElementById(id);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const clean=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const emailKey=e=>String(e||'').trim().toLowerCase();
  const codeKey=c=>String(c||'').trim().toUpperCase().replace(/[^A-Z0-9-]/g,'');
  const user=()=>window.firebase?.auth?.().currentUser || null;
  const authed=()=>!!(user() && !user().isAnonymous);
  const verified=()=>!!(authed() && user().emailVerified);
  let firebaseDataUnsub=null, profileUnsub=null, notifUnsub=null, weatherTimer=null;

  window.OFA_VERSION=VERSION;

  function localSave(){
    try{
      if(Array.isArray(window.data?.activity)) data.activity=data.activity.slice(0,75);
      if(Array.isArray(window.data?.chat)) data.chat=data.chat.slice(-200);
      if(window.KEY) localStorage.setItem(KEY,JSON.stringify(data));
      else localStorage.setItem('ofa_v5_data',JSON.stringify(data));
    }catch(e){console.warn('Local save skipped:',e)}
  }
  function save650(){
    localSave();
    if(authed()) queueFirebaseSave650();
  }
  const oldSave=window.save;
  window.save=function(){ try{ save650(); }catch(e){ console.warn(e); try{oldSave&&oldSave();}catch(_e){} } };

  function toast650(m){ if(typeof window.toast==='function') window.toast(m); else alert(m); }
  function normalize(){
    if(!window.data) window.data={};
    ['people','trips','memories','pages','links','meals','groceries','packing','pins','chat','activity','notifications'].forEach(k=>{if(!Array.isArray(data[k])) data[k]=[];});
    if(!data.profile) data.profile={};
    if(!data.settings) data.settings={};
    if(!data.settings.notifications) data.settings.notifications={};
    ['chat','trips','birthdays','meals','weather','scrapbook','journal','votes','budget','reservations','system'].forEach(k=>{if(typeof data.settings.notifications[k]!=='boolean') data.settings.notifications[k]=true;});
    data.appVersion=VERSION;
  }

  function appDoc(){return firebase.firestore().collection(DATA_COLLECTION).doc(FAMILY_ID);}
  function userDoc(uid=user()?.uid){return uid?firebase.firestore().collection(USER_COLLECTION).doc(uid):null;}
  function notifsCol(){return firebase.firestore().collection(NOTIFICATION_COLLECTION).doc(FAMILY_ID).collection('items');}
  let saveTimer=null;
  function queueFirebaseSave650(){
    if(!window.firebaseReady || !authed()) return;
    clearTimeout(saveTimer);
    saveTimer=setTimeout(pushFirebaseData650,500);
  }
  async function pushFirebaseData650(){
    if(!window.firebaseReady || !authed()) return;
    normalize();
    const u=user();
    const safeData=JSON.parse(JSON.stringify(data));
    delete safeData._ui;
    await appDoc().set({familyId:FAMILY_ID,appVersion:VERSION,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),updatedBy:u.uid,data:safeData},{merge:true}).catch(e=>console.warn('Family data sync failed',e));
    await syncProfileToFirebase(false);
  }
  async function pullFirebaseData650(){
    if(!window.firebaseReady || !authed()) return;
    const snap=await appDoc().get().catch(()=>null);
    if(snap?.exists && snap.data()?.data){
      Object.assign(data,snap.data().data);
      normalize();
      localSave();
    }
  }

  async function syncProfileToFirebase(renderAfter=true){
    if(!authed()) return;
    normalize();
    const u=user();
    const p=data.profile || {};
    const payload={
      uid:u.uid,
      email:u.email || p.email || '',
      emailVerified:!!u.emailVerified,
      name:p.name || localStorage.getItem('ofa_family_user') || (u.email?u.email.split('@')[0]:'Family Member'),
      phone:p.phone || localStorage.getItem('ofa_profile_phone') || '',
      photo:p.photo || localStorage.getItem('ofa_profile_photo') || '',
      role:p.role || localStorage.getItem('ofa_family_role') || 'Family',
      familyId:FAMILY_ID,
      appVersion:VERSION,
      lastSeen:firebase.firestore.FieldValue.serverTimestamp()
    };
    await userDoc(u.uid).set(payload,{merge:true}).catch(e=>console.warn('Profile sync failed',e));
    Object.assign(data.profile,payload,{lastSeen:new Date().toISOString()});
    localStorage.setItem('ofa_family_email',payload.email);
    localStorage.setItem('ofa_family_user',payload.name);
    if(payload.photo) localStorage.setItem('ofa_profile_photo',payload.photo);
    localSave();
    if(renderAfter && typeof window.render==='function') window.render();
  }
  function attachProfileListener(){
    if(profileUnsub) profileUnsub(); profileUnsub=null;
    if(!authed()) return;
    profileUnsub=userDoc().onSnapshot(s=>{
      if(!s.exists) return;
      normalize(); Object.assign(data.profile,s.data()); localSave(); renderProfile650();
    },e=>console.warn('Profile listener failed',e));
  }

  async function acceptInvite(email, code){
    const ck=codeKey(code); if(!ck) return null;
    let snap=await firebase.firestore().collection(INVITE_COLLECTION).doc(ck).get().catch(()=>null);
    if(snap?.exists){
      const inv=snap.data()||{};
      if(inv.status==='used' && inv.usedBy) throw new Error('That invite code was already used.');
      if(inv.email && emailKey(inv.email)!==emailKey(email)) throw new Error('That invite code is for a different email.');
      return {code:ck,...inv};
    }
    const local=JSON.parse(localStorage.getItem('ofa_last_invite')||'null');
    if(local && codeKey(local.code)===ck && (!local.email || emailKey(local.email)===emailKey(email))) return {code:ck,...local,local:true};
    return null;
  }
  async function markInviteUsed(inv, u){
    if(!inv?.code || inv.local) return;
    await firebase.firestore().collection(INVITE_COLLECTION).doc(codeKey(inv.code)).set({status:'used',usedBy:u.uid,usedEmail:u.email,usedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}).catch(()=>{});
  }

  window.firebaseLoginFlow=async function(){
    try{
      ensureFirebase650();
      if(!window.firebaseReady) return toast650('Firebase is not ready. Check firebase-config.js.');
      const auth=firebase.auth();
      const existing=user();
      if(existing && !existing.isAnonymous){ showProfilePage(); toast650('You are already signed in.'); return; }
      const email=emailKey(prompt('Family email address',localStorage.getItem('ofa_family_email')||data?.profile?.email||'')); if(!email) return;
      const password=prompt('Password - at least 6 characters'); if(!password) return;
      try{
        await auth.signInWithEmailAndPassword(email,password);
        await pullFirebaseData650(); await syncProfileToFirebase(false); addNotification650('Signed in successfully.','system',true);
        showProfilePage(); if(typeof render==='function') render(); return toast650('Signed in successfully.');
      }catch(signInErr){
        const code=prompt('Invite code from Melissa',''); if(!code) return toast650('Invite code is required to create a new family account.');
        const inv=await acceptInvite(email,code); if(!inv) return toast650('Invite not found. Check the email and invite code.');
        let cred;
        const anon=user();
        if(anon?.isAnonymous){
          const credential=firebase.auth.EmailAuthProvider.credential(email,password);
          try{ cred=await anon.linkWithCredential(credential); }
          catch(e){ if(String(e.code||'').includes('email-already-in-use')) cred=await auth.signInWithEmailAndPassword(email,password); else throw e; }
        }else cred=await auth.createUserWithEmailAndPassword(email,password);
        if(!data.profile) data.profile={};
        Object.assign(data.profile,{email,name:inv.name||email.split('@')[0],role:inv.role||'Family'});
        await syncProfileToFirebase(false); await markInviteUsed(inv,cred.user); await pushFirebaseData650(); addNotification650('Family account created and signed in.','system',true);
        showProfilePage(); if(typeof render==='function') render(); toast650('Family account created and signed in.');
      }
    }catch(e){ console.error(e); toast650(e.message || 'Login failed. Make sure Email/Password Authentication is enabled in Firebase.'); }
  };
  window.signOutNow=async function(){try{await firebase.auth().signOut(); localStorage.removeItem('ofa_family_email'); toast650('Signed out.'); if(typeof render==='function') render();}catch(e){toast650(e.message||'Sign out failed.')}};

  function ensureFirebase650(){
    if(!window.firebase || !firebase.auth) return;
    try{ if(!firebase.apps.length && window.firebaseConfig) firebase.initializeApp(window.firebaseConfig); }catch(e){}
    window.firebaseReady=!!firebase.apps.length;
  }
  function initAuth650(){
    ensureFirebase650(); if(!window.firebaseReady || initAuth650.done) return; initAuth650.done=true;
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(()=>{});
    firebase.auth().onAuthStateChanged(async u=>{
      window.firebaseUser=u||null;
      if(firebaseDataUnsub){firebaseDataUnsub(); firebaseDataUnsub=null;} if(notifUnsub){notifUnsub(); notifUnsub=null;}
      if(u && !u.isAnonymous){
        await pullFirebaseData650(); await syncProfileToFirebase(false); attachProfileListener(); attachNotificationListener650();
        firebaseDataUnsub=appDoc().onSnapshot(s=>{ if(s.exists&&s.data()?.data){Object.assign(data,s.data().data); normalize(); localSave(); if(typeof render==='function') render();}},e=>console.warn('Family listener failed',e));
      }else if(!u){ try{ await firebase.auth().signInAnonymously(); }catch(e){ console.warn('Anonymous auth is optional but disabled:',e); } }
      renderAuth650(); renderProfile650(); updateBadges650(); ensureSingleChat650();
    });
  }

  function renderAuth650(){
    const signed=authed(), u=user();
    const login=$('loginBtn'); if(login){login.textContent=signed?'✅':'👤'; login.title=signed?'Signed in — Profile':'Family Login'; login.onclick=signed?showProfilePage:window.firebaseLoginFlow;}
    ['signOutBtn','profileSignOutBtn'].forEach(k=>{const b=$(k); if(b) b.onclick=window.signOutNow;});
    const verify=$('verifyEmailBtn'); if(verify) verify.onclick=async()=>{const u=user(); if(!u||u.isAnonymous)return toast650('Sign in first.'); await u.reload(); if(u.emailVerified){toast650('Email is already verified.'); renderAuth650(); return;} await u.sendEmailVerification(); toast650('Verification email sent.');};
    const box=$('securityStatus'); if(box) box.innerHTML=[
      ['Firebase',window.firebaseReady?'Connected':'Not connected',window.firebaseReady?'securityGood':'securityBad'],
      ['Signed in',signed?(u.email||'Yes'):'Not signed in',signed?'securityGood':'securityWarn'],
      ['Email verified',verified()?'Verified':(signed?'Not verified yet':'Sign in first'),verified()?'securityGood':'securityWarn'],
      ['Profile sync',signed?'Active':'Waiting for login',signed?'securityGood':'securityWarn'],
      ['Version',VERSION,'securityGood']
    ].map(r=>`<div class="securityLine"><b>${clean(r[0])}</b><span class="${r[2]}">${clean(r[1])}</span></div>`).join('');
  }
  function showProfilePage(){ if(typeof show==='function') show('profileFamily'); }
  function renderProfile650(){
    normalize();
    const p=data.profile||{}, u=user();
    const name=p.name || localStorage.getItem('ofa_family_user') || 'Melissa';
    const email=u?.email || p.email || localStorage.getItem('ofa_family_email') || 'Not signed in';
    const photo=p.photo || localStorage.getItem('ofa_profile_photo') || '';
    const box=$('profileSummary');
    if(box) box.innerHTML=`${photo?`<img class="profileAvatarBig" src="${clean(photo)}" alt="Profile photo">`:`<div class="profileAvatarBig profileInitial">${clean((name||'F').slice(0,1).toUpperCase())}</div>`}<div class="profileDetails"><h3>${clean(name)}</h3><p>${clean(email)}</p><p class="helperText">${authed()?'Profile is synced with Firebase.':'Sign in to sync your profile, photos, notifications, and app data.'}</p></div>`;
    const edit=$('profileEditBtn'); if(edit) edit.onclick=editProfile650;
    const people=$('profilePeopleBtn'); if(people) people.onclick=()=>show('people');
    const settings=$('profileSettingsBtn'); if(settings) settings.onclick=()=>show('settings');
    const invite=$('profileInviteBtn'); if(invite) invite.onclick=()=>show('settings');
  }
  async function editProfile650(){
    normalize(); const p=data.profile;
    const name=prompt('Display name',p.name||localStorage.getItem('ofa_family_user')||'Melissa'); if(name===null) return;
    const phone=prompt('Phone',p.phone||localStorage.getItem('ofa_profile_phone')||''); if(phone===null) return;
    p.name=name.trim()||'Melissa'; p.phone=phone.trim(); p.email=user()?.email || p.email || localStorage.getItem('ofa_family_email') || '';
    localStorage.setItem('ofa_family_user',p.name); localStorage.setItem('ofa_profile_phone',p.phone);
    save650(); await syncProfileToFirebase(true); toast650('Profile saved.');
  }

  function addNotification650(message,type='system',force=false){
    normalize();
    if(!force && data.settings?.notifications && data.settings.notifications[type]===false) return;
    const n={id:id(),message:String(message||''),text:String(message||''),type,read:false,userId:user()?.uid||'local',email:user()?.email||'',at:new Date().toISOString(),appVersion:VERSION};
    data.notifications.unshift(n); data.notifications=data.notifications.slice(0,100); localSave(); updateBadges650(); renderNotificationCenter650();
    if(authed()) notifsCol().doc(n.id).set({...n,createdAt:firebase.firestore.FieldValue.serverTimestamp()}).catch(()=>{});
    if('Notification' in window && Notification.permission==='granted' && document.hidden){ try{ new Notification('Our Family Adventures',{body:n.message,icon:'icons/icon-192.png'}); }catch(e){} }
  }
  window.addAppNotification=addNotification650; window.notify=addNotification650; window.notifyUser=addNotification650;
  function attachNotificationListener650(){
    if(notifUnsub) notifUnsub(); notifUnsub=null; if(!authed()) return;
    notifUnsub=notifsCol().orderBy('createdAt','desc').limit(100).onSnapshot(s=>{
      const mine=s.docs.map(d=>({id:d.id,...d.data()})).filter(n=>!n.email || !user()?.email || emailKey(n.email)===emailKey(user().email) || n.userId===user().uid || n.type==='system');
      const byId=new Map((data.notifications||[]).map(n=>[n.id,n])); mine.forEach(n=>byId.set(n.id,{...byId.get(n.id),...n})); data.notifications=Array.from(byId.values()).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||''))).slice(0,100); localSave(); updateBadges650(); renderNotificationCenter650();
    },e=>console.warn('Notification listener failed',e));
  }
  function ensureNotifications650(){
    if(!$('notificationCenter')) document.body.insertAdjacentHTML('beforeend','<div id="notificationCenter" class="notificationCenter hidden"><div class="card"><button class="closeNotif" aria-label="Close notifications">×</button><h2>Notifications <span class="notifBadge" hidden>0</span></h2><div id="notificationList"></div><div class="buttonRow"><button id="markNotificationsRead" class="secondary">Mark all read</button><button id="clearNotifications" class="secondary">Clear</button></div></div></div>');
    let bell=$('notificationBell'); if(!bell){ bell=document.createElement('button'); bell.id='notificationBell'; bell.className='floatingNotif'; bell.innerHTML='🔔<span class="notifBadge" hidden>0</span>'; document.body.appendChild(bell); }
    bell.onclick=()=>{$('notificationCenter')?.classList.remove('hidden'); renderNotificationCenter650();};
    $('notificationCenter')?.querySelector('.closeNotif')?.addEventListener('click',()=>$('notificationCenter')?.classList.add('hidden'));
    const mark=$('markNotificationsRead'); if(mark) mark.onclick=()=>{(data.notifications||[]).forEach(n=>n.read=true); save650(); renderNotificationCenter650();};
    const clear=$('clearNotifications'); if(clear) clear.onclick=()=>{data.notifications=[]; save650(); renderNotificationCenter650();};
    const en=$('enableNotifications')||$('settingsNotifyBtn'); if(en) en.onclick=async()=>{ if(!('Notification' in window)) return toast650('This browser does not support notifications.'); const p=await Notification.requestPermission(); toast650(p==='granted'?'Notifications turned on.':'Notifications were not allowed.'); };
    const test=$('testNotifyBtn'); if(test) test.onclick=()=>addNotification650('This is a test notification from Our Family Adventures.','system',true);
  }
  function updateBadges650(){
    const n=(data.notifications||[]).filter(x=>!x.read).length;
    $$('.notifBadge').forEach(b=>{b.textContent=n; b.hidden=!n;});
    const chatN=(data.chat||[]).filter(m=>!m.read && m.user!==displayName650()).length;
    $$('#chatUnread,#chatBadge650').forEach(b=>{b.textContent=chatN; b.hidden=!chatN;});
  }
  function renderNotificationCenter650(){
    const box=$('notificationList'); if(!box) return;
    box.innerHTML=(data.notifications||[]).map(n=>`<div class="notificationNote ${n.read?'read':'unread'}"><b>${clean(n.message||n.text)}</b><br><small>${clean(new Date(n.at||Date.now()).toLocaleString())}</small></div>`).join('') || '<p>No notifications yet.</p>';
    updateBadges650();
  }

  function displayName650(){ return data?.profile?.name || localStorage.getItem('ofa_family_user') || user()?.email?.split('@')[0] || 'Family'; }
  function ensureSingleChat650(){
    $$('.chatPopButton,.chatFloat,.floatingChat,.chatFloatPanel,.chatPopout').forEach(el=>{ if(!['floatingChatBtn','chatPanel650'].includes(el.id)) el.remove(); });
    let btn=$('floatingChatBtn'); if(!btn){ btn=document.createElement('button'); btn.id='floatingChatBtn'; btn.className='floatingChat'; btn.innerHTML='💬<span id="chatBadge650" hidden>0</span>'; document.body.appendChild(btn); }
    btn.onclick=e=>{ e.preventDefault(); e.stopPropagation(); toggleChat650(); };
    if(!$('chatPanel650')) document.body.insertAdjacentHTML('beforeend','<div id="chatPanel650" class="chatPanel650 hidden"><div class="chatPanelHead"><b>Family Chat</b><button id="closeChat650" aria-label="Close chat">×</button></div><div id="chatPanelLog650" class="chatPanelLog650"></div><div class="chatPanelSend"><input id="chatPanelInput650" placeholder="Write a message..."><button id="chatPanelSend650" class="primary">Send</button></div></div>');
    $('closeChat650').onclick=()=>$('chatPanel650').classList.add('hidden');
    $('chatPanelSend650').onclick=sendChat650;
    $('chatPanelInput650').onkeydown=e=>{if(e.key==='Enter') sendChat650();};
    const send=$('sendChat'); if(send) send.onclick=sendMainChat650;
    renderChat650(); updateBadges650();
  }
  function toggleChat650(){ const p=$('chatPanel650'); if(!p) return; p.classList.toggle('hidden'); if(!p.classList.contains('hidden')){ renderChat650(); $('chatPanelInput650')?.focus(); } }
  function chatMessage(text){ const msg={id:id(),user:displayName650(),email:user()?.email||'',text,at:new Date().toISOString(),read:false}; data.chat.push(msg); data.chat=data.chat.slice(-200); save650(); addNotification650(`${msg.user}: ${text}`,'chat'); renderChat650(); }
  function sendChat650(){ const input=$('chatPanelInput650'); const text=input?.value?.trim(); if(!text) return; input.value=''; chatMessage(text); }
  function sendMainChat650(){ const input=$('chatInput'); const text=input?.value?.trim(); if(!text) return; input.value=''; chatMessage(text); }
  function renderChat650(){
    const html=(data.chat||[]).slice(-80).map(m=>`<div class="chatMsg ${m.user===displayName650()?'mine':''}"><b>${clean(m.user||'Family')}</b><p>${clean(m.text||'')}</p><small>${clean(new Date(m.at||Date.now()).toLocaleString())}</small></div>`).join('') || '<p class="helperText">No chat messages yet.</p>';
    const log=$('chatLog'); if(log) log.innerHTML=html;
    const pop=$('chatPanelLog650'); if(pop){ pop.innerHTML=html; pop.scrollTop=pop.scrollHeight; }
  }
  window.renderChat=renderChat650;

  function tripPlace(t){ return (t?.address || t?.tripAddress || t?.destination || '').trim(); }
  function mapsUrl(q,dir=false){ const enc=encodeURIComponent(q||''); return dir?`https://www.google.com/maps/dir/?api=1&destination=${enc}`:`https://www.google.com/maps/search/?api=1&query=${enc}`; }
  function embedUrl(q){return `https://maps.google.com/maps?q=${encodeURIComponent(q||'')}&output=embed`;}
  function mapCard650(t){ const q=tripPlace(t); if(!q) return '<p class="helperText">Enter a trip address or destination to show a Google Maps card.</p>'; return `<div class="mapBox"><iframe title="Map for ${clean(q)}" loading="lazy" src="${embedUrl(q)}"></iframe><div class="buttonRow"><a class="secondary mapButton" href="${mapsUrl(q,false)}" target="_blank" rel="noopener">Open Map</a><a class="secondary mapButton" href="${mapsUrl(q,true)}" target="_blank" rel="noopener">Directions</a></div></div>`; }
  window.openTripMap=function(tripId){ const t=(data.trips||[]).find(x=>x.id===tripId); const q=tripPlace(t); if(!q) return toast650('Add a trip address or destination first.'); window.open(mapsUrl(q,true),'_blank','noopener'); };

  async function weatherProvider650(place){
    if(window.OFA_WEATHER_PROVIDER && typeof window.OFA_WEATHER_PROVIDER==='function') return await window.OFA_WEATHER_PROVIDER(place);
    const geo=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`).then(r=>{if(!r.ok)throw new Error('Weather location lookup failed');return r.json();});
    const g=geo.results?.[0]; if(!g) throw new Error('Weather could not find that location. Try city and state.');
    const w=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`).then(r=>{if(!r.ok)throw new Error('Weather forecast failed');return r.json();});
    return `${g.name}: ${Math.round(w.current.temperature_2m)}°F now • High ${Math.round(w.daily.temperature_2m_max[0])}° / Low ${Math.round(w.daily.temperature_2m_min[0])}° • Rain ${w.daily.precipitation_probability_max?.[0]??0}% • Wind ${Math.round(w.current.wind_speed_10m||0)} mph`;
  }
  window.refreshTripWeather=async function(tripId){
    const t=(data.trips||[]).find(x=>x.id===tripId) || (typeof byNextTrip==='function'?byNextTrip():null) || data.trips?.[0]; if(!t) return toast650('Create a trip first.');
    const q=tripPlace(t); if(!q) return toast650('Add a destination or address first.');
    t.weather='Loading live weather...'; t.weatherLoading=true; save650(); if(typeof render==='function') render();
    try{ t.weather=await weatherProvider650(q); t.weatherUpdatedAt=new Date().toISOString(); addNotification650('Live weather updated for '+q,'weather'); }
    catch(e){ console.error(e); t.weather='Live weather could not load. Check the location spelling or internet connection.'; addNotification650(t.weather,'weather',true); }
    finally{ t.weatherLoading=false; save650(); if(typeof render==='function') render(); }
  };
  function setupWeatherAutoRefresh(){ clearInterval(weatherTimer); weatherTimer=setInterval(()=>{ const t=(typeof byNextTrip==='function'?byNextTrip():null) || data.trips?.[0]; if(t && tripPlace(t) && (!t.weatherUpdatedAt || Date.now()-new Date(t.weatherUpdatedAt).getTime()>30*60*1000)) window.refreshTripWeather(t.id); },30*60*1000); }

  function renderTrips650(){
    const box=$('tripList'); if(!box) return;
    box.innerHTML=(data.trips||[]).map(t=>`<div class="item tripCard"><h3>${clean(t.name)}</h3><p>${clean(tripPlace(t)||'No location entered')} ${t.start?`• ${typeof fmtDate==='function'?fmtDate(t.start):t.start} to ${typeof fmtDate==='function'?fmtDate(t.end):t.end}`:''}</p><span class="badge">${clean(t.visibility==='private'?'Private / invited only':'Whole family')}</span><div class="itemActions"><button onclick="editTrip('${t.id}')" class="primary">Edit Adventure</button><button onclick="openTripMap('${t.id}')" class="secondary">Directions</button><button onclick="refreshTripWeather('${t.id}')" class="secondary">Live Weather</button><button onclick="del('trips','${t.id}')" class="secondary">Delete</button></div><div class="weatherBox">${t.weatherLoading?'Loading live weather…':clean(t.weather||'Tap Live Weather to load the forecast.')}${t.weatherUpdatedAt?`<br><small>Updated ${clean(new Date(t.weatherUpdatedAt).toLocaleString())}</small>`:''}</div>${mapCard650(t)}</div>`).join('')||'<div class="card"><p>No adventures yet.</p></div>';
  }
  function renderDashboard650(){
    const t=(typeof byNextTrip==='function'?byNextTrip():null) || data.trips?.[0];
    const maps=$('dashMaps'); if(maps) maps.innerHTML=t?mapCard650(t):'<p>No trip map yet.</p>';
    const weather=$('dashWeather'); if(weather) weather.innerHTML=t?clean(t.weather||'Tap Refresh Live Weather to load the forecast.'):'Weather will appear after you add a trip.';
    const refresh=$('refreshWeatherBtn'); if(refresh) refresh.onclick=()=> t ? window.refreshTripWeather(t.id) : toast650('Create an adventure first.');
  }

  function cleanupCaches650(){ if(!('caches' in window)) return; caches.keys().then(keys=>keys.forEach(k=>{ if(/^ofa-|our-family-adventures/.test(k) && k!=='ofa-6-5-0-core') caches.delete(k); })).catch(()=>{}); }

  const oldRender=window.render;
  window.render=function(){ normalize(); try{oldRender&&oldRender();}catch(e){console.warn('Previous render layer skipped:',e)} ensureNotifications650(); ensureSingleChat650(); renderAuth650(); renderProfile650(); renderTrips650(); renderDashboard650(); renderChat650(); updateBadges650(); };

  window.addEventListener('load',()=>{ normalize(); cleanupCaches650(); initAuth650(); ensureNotifications650(); ensureSingleChat650(); renderAuth650(); renderProfile650(); setupWeatherAutoRefresh(); setTimeout(()=>{if(typeof render==='function')render();},250); setTimeout(ensureSingleChat650,1200); });
  document.addEventListener('DOMContentLoaded',()=>{ normalize(); ensureNotifications650(); ensureSingleChat650(); });
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) updateBadges650(); });
})();

/* 6.5.0 trip form field preservation: address, budget, notes, weather, map cards */
(function(){
  const $=id=>document.getElementById(id);
  function wireTripForm650(){
    const saveBtn=$('saveTrip'); if(!saveBtn || saveBtn.dataset.ofa650Trip==='1') return; saveBtn.dataset.ofa650Trip='1';
    saveBtn.onclick=()=>{
      const values={
        name:$('tripName')?.value.trim()||'New Adventure',
        destination:$('tripDestination')?.value.trim()||'',
        address:$('tripAddress')?.value.trim()||'',
        tripAddress:$('tripAddress')?.value.trim()||'',
        start:$('tripStart')?.value||'',
        end:$('tripEnd')?.value||'',
        visibility:$('tripVisibility')?.value||'family',
        invitees:$('tripInvitees')?.value.trim()||'',
        weather:$('tripWeather')?.value.trim()||'',
        budget:$('tripBudget')?.value||'',
        notes:$('tripNotes')?.value.trim()||''
      };
      let trip;
      if(window.editingTripId){
        trip=(data.trips||[]).find(t=>t.id===window.editingTripId || t.id===editingTripId);
        if(trip) Object.assign(trip,values,{updatedAt:new Date().toISOString()});
        window.editingTripId=null; try{editingTripId=null;}catch(e){}
      }else{
        trip={id:(typeof uid==='function'?uid():Date.now().toString(36)),...values,status:'Planning',rsvp:{accept:0,maybe:0,decline:0},voteOptions:[],tripLinks:[],createdAt:new Date().toISOString()};
        data.trips=data.trips||[]; data.trips.push(trip);
      }
      ['tripName','tripDestination','tripAddress','tripStart','tripEnd','tripInvitees','tripWeather','tripBudget','tripNotes'].forEach(i=>{const el=$(i); if(el) el.value='';});
      saveBtn.textContent='Save Adventure';
      if(typeof logActivity==='function') logActivity('Adventure saved: '+values.name,'trip');
      if(typeof save==='function') save(); if(typeof render==='function') render(); if(typeof show==='function') show('adventures');
    };
  }
  const oldEdit=window.editTrip;
  window.editTrip=function(id){
    const t=(data.trips||[]).find(x=>x.id===id); if(!t){ if(oldEdit) oldEdit(id); return; }
    window.editingTripId=id; try{editingTripId=id;}catch(e){}
    const set=(k,v)=>{const el=$(k); if(el) el.value=v||'';};
    set('tripName',t.name); set('tripDestination',t.destination); set('tripAddress',t.address||t.tripAddress); set('tripStart',t.start); set('tripEnd',t.end); set('tripInvitees',t.invitees); set('tripWeather',t.weather); set('tripBudget',t.budget); set('tripNotes',t.notes);
    const vis=$('tripVisibility'); if(vis) vis.value=t.visibility||'family';
    const btn=$('saveTrip'); if(btn) btn.textContent='Update Adventure';
    if(typeof show==='function') show('adventures'); window.scrollTo({top:0,behavior:'smooth'});
  };
  const prevRender=window.render;
  window.render=function(){try{prevRender&&prevRender();}catch(e){console.warn(e)} wireTripForm650();};
  window.addEventListener('load',wireTripForm650);
  document.addEventListener('DOMContentLoaded',wireTripForm650);
})();
