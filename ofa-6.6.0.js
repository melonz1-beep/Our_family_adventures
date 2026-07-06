/* Our Family Adventures 6.6.0 — all-feature Firebase family sync */
(function(){
  'use strict';
  const VERSION = '6.6.0';
  const FAMILY_ID = window.ofaFamilyId || 'our-family-adventures';
  const CLIENT_ID_KEY = 'ofa_sync_client_id';
  const clientId = localStorage.getItem(CLIENT_ID_KEY) || (Date.now().toString(36)+Math.random().toString(36).slice(2,10));
  localStorage.setItem(CLIENT_ID_KEY, clientId);
  const COLLECTION_KEYS = ['people','trips','memories','pages','links','meals','groceries','packing','pins','chat','activity','notifications'];
  let saveTimer = null;
  let unsubscribe = null;
  let applyingRemote = false;
  let started = false;
  let lastLocalWrite = 0;

  function el(id){ return document.getElementById(id); }
  function msg(text){ try{ if(typeof toast === 'function') toast(text); else console.log(text); }catch(e){ console.log(text); } }
  function dbReady(){ return !!(window.firebase && firebase.apps && firebase.apps.length && firebase.auth && firebase.firestore); }
  function user(){ try{ return firebase.auth().currentUser || null; }catch(e){ return null; } }
  function ref(){ return firebase.firestore().collection('families').doc(FAMILY_ID).collection('private').doc('appData'); }
  function now(){ return new Date().toISOString(); }
  function actor(){
    try{
      const u = user();
      return { uid: u?.uid || clientId, email: u?.email || localStorage.getItem('ofa_family_email') || '', name: localStorage.getItem('ofa_family_user') || u?.displayName || u?.email || 'Family member' };
    }catch(e){ return {uid:clientId,email:'',name:'Family member'}; }
  }
  function normalizeAll(){
    if(typeof data !== 'object') return;
    COLLECTION_KEYS.forEach(k=>{ if(!Array.isArray(data[k])) data[k] = []; });
    if(!data.settings) data.settings = {};
    if(!data.settings.notifications) data.settings.notifications = {};
    if(!data.settings.adminPin) data.settings.adminPin = '1218';
    (data.trips||[]).forEach(t=>{
      if(!t.id) t.id = Date.now().toString(36)+Math.random().toString(36).slice(2,8);
      if(!Array.isArray(t.tripLinks)) t.tripLinks = [];
      if(!Array.isArray(t.voteOptions)) t.voteOptions = [];
      if(!t.rsvp) t.rsvp = {accept:0,maybe:0,decline:0};
    });
    (data.pages||[]).forEach(p=>{ if(!Array.isArray(p.stickers)) p.stickers = []; });
    (data.chat||[]).forEach(c=>{ if(!c.readBy) c.readBy = {}; });
  }
  function saveDevice(){
    try{ if(typeof KEY !== 'undefined') localStorage.setItem(KEY, JSON.stringify(data)); }catch(e){}
    try{ localStorage.setItem('ofa_v5_data', JSON.stringify(data)); }catch(e){}
  }
  function stampChange(type, title){
    try{
      const a = actor();
      data.activity = Array.isArray(data.activity) ? data.activity : [];
      data.activity.unshift({id: Date.now().toString(36)+Math.random().toString(36).slice(2,8), type:type||'sync', msg:title||('Updated by '+a.name), by:a.name, byEmail:a.email, at:now()});
      data.activity = data.activity.slice(0,150);
    }catch(e){}
  }
  async function pushShared(){
    if(applyingRemote || !dbReady() || !user()) return;
    normalizeAll();
    const a = actor();
    lastLocalWrite = Date.now();
    try{
      await ref().set({
        data: JSON.parse(JSON.stringify(data)),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAtClient: now(),
        updatedBy: a,
        familyId: FAMILY_ID,
        version: VERSION
      }, {merge:true});
      updateStatus('Synced with family Firebase');
    }catch(e){ console.error(e); updateStatus('Firebase sync failed — check Firestore rules and sign-in'); }
  }
  function queueShared(){
    if(applyingRemote) return;
    saveDevice();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(pushShared, 350);
  }
  function applyRemote(incoming, meta){
    if(!incoming || typeof data !== 'object') return;
    applyingRemote = true;
    try{
      Object.keys(data).forEach(k=>delete data[k]);
      Object.assign(data, incoming);
      normalizeAll();
      saveDevice();
    }finally{ applyingRemote = false; }
    try{ if(typeof render === 'function') render(); }catch(e){ console.warn(e); }
    const who = meta?.updatedBy?.name || meta?.updatedBy?.email || 'family';
    updateStatus('Live family updates connected' + (who ? ' • last update by '+who : ''));
  }
  async function seedOrLoad(){
    if(!dbReady() || !user()) return;
    const snap = await ref().get();
    if(snap.exists && snap.data() && snap.data().data){
      applyRemote(snap.data().data, snap.data());
    }else{
      normalizeAll();
      stampChange('sync','Family app data created in Firebase');
      await pushShared();
    }
  }
  function listen(){
    if(!dbReady() || !user()) return;
    if(unsubscribe) unsubscribe();
    unsubscribe = ref().onSnapshot(snap=>{
      if(!snap.exists || !snap.data() || !snap.data().data) return;
      // Ignore the immediate echo of our own write, but still keep status fresh.
      const meta = snap.data();
      if(meta.updatedBy && meta.updatedBy.uid === actor().uid && Date.now() - lastLocalWrite < 1200){ updateStatus('Synced with family Firebase'); return; }
      applyRemote(meta.data, meta);
    }, err=>{ console.error(err); updateStatus('Family live listener failed — check rules'); });
  }
  function updateStatus(text){
    let box = el('familySync660');
    const host = el('home')?.querySelector('.activity.card') || el('dashboard')?.querySelector('.pageHead') || document.querySelector('main');
    if(host && !box){
      host.insertAdjacentHTML('beforeend','<div id="familySync660" class="familySync660">Connecting family sync...</div>');
      box = el('familySync660');
    }
    if(box) box.textContent = text;
  }

  // Replace the old per-user/private save route with the shared family document for every feature.
  try{ window.appDataRef = ref; if(typeof appDataRef !== 'undefined') appDataRef = ref; }catch(e){}
  try{ window.pushFirebaseData = pushShared; }catch(e){}
  try{
    const oldSave = (typeof save === 'function') ? save : null;
    save = function(){
      normalizeAll();
      saveDevice();
      queueShared();
    };
    window.save = save;
    window.ofaSaveLocalOnly660 = oldSave;
  }catch(e){ console.warn(e); }
  try{ window.queueFirebaseSave = queueShared; }catch(e){}

  function hookButtonsForActivity(){
    document.addEventListener('click', e=>{
      const b = e.target.closest('button'); if(!b) return;
      const label = (b.textContent||'').trim();
      if(/save|add|update|delete|remove|vote|rsvp|mark|send/i.test(label||'')){
        setTimeout(()=>{ try{ normalizeAll(); queueShared(); }catch(_){} }, 250);
      }
    }, true);
    document.addEventListener('change', e=>{
      if(e.target && (e.target.matches('input, textarea, select'))){ setTimeout(()=>{ try{ normalizeAll(); queueShared(); }catch(_){} }, 350); }
    }, true);
  }
  function start(){
    if(started) return; started = true;
    normalizeAll(); updateStatus('Connecting all features to family Firebase...');
    hookButtonsForActivity();
    if(dbReady()){
      firebase.auth().onAuthStateChanged(async u=>{
        if(!u){ updateStatus('Sign in to Firebase to share updates with family'); return; }
        try{ await seedOrLoad(); listen(); }catch(e){ console.error(e); updateStatus('Could not load shared family data'); }
      });
      if(user()){ seedOrLoad().then(listen).catch(e=>console.error(e)); }
    }else{
      updateStatus('Firebase is not ready — check firebase-config.js');
    }
  }
  window.ofaStartFamilySync660 = start;
  window.ofaPushFamilySync660 = pushShared;
  document.addEventListener('DOMContentLoaded',()=>setTimeout(start,600));
  setTimeout(start,1200);
})();
