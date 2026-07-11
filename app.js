(()=>{
'use strict';
const VERSION='9.4.4';
const FCM_PUBLIC_VAPID_KEY='BDCdG1CygJGFfQ3SBnzgxPIWHqBQqH0fcZbHpZH4nXwM0Lc4H-b9ql1W4tiyFKXcTIaaD8nCacG6yxgdwN7PSS8';
const SECURITY_RULES_VERSION='9.4.4-queue-write-verified';
const FAMILY='default-family';
const LS='ofa-9-data';
const ADMIN_EMAIL='mlehr1211@gmail.com';
let deferredInstall=null,fb=false,uid=localStorage.getItem('ofa-uid')||'local-user',role=localStorage.getItem('ofa-role')||'Family',route='home',selectedTrip=null,unsub=null;
let splitState={publicData:null,familyTrips:{},privateTrips:{},notifications:[]},splitUnsubs=[];
let identityLinkBusy=false,lastIdentityLinkKey='',activeInvite=null,messaging=null,messagingToken='',messagingError='';
const TRIP_COLLECTIONS=['memories','media','scrapbooks','meals','grocery','packing','links','reservations','budgets','itinerary','attendees','rsvps','chats','votes'];
let adminUnlocked=false,adminLockTimer=null;
const ADMIN_TIMEOUT_MS=15*60*1000;
const $=s=>document.querySelector(s);
const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const COLS=['people','trips','memories','media','scrapbooks','meals','grocery','packing','links','reservations','budgets','itinerary','attendees','rsvps','invites','notifications','activity','chats','votes','profiles','settings','locks'];
const blank=()=>({version:VERSION,people:[],trips:[],memories:[],media:[],scrapbooks:[],meals:[],grocery:[],packing:[],links:[],reservations:[],budgets:[],itinerary:[],attendees:[],rsvps:[],invites:[],notifications:[],activity:[],chats:[],votes:[],profiles:[],settings:{theme:'light',adminCode:'1218',notifications:{chat:true,votes:true,trips:true,lists:true,memories:true,media:true,admin:true}},locks:{},migrated:false});
let data=load();
function arr(k){ if(!Array.isArray(data[k])) data[k]=[]; return data[k]; }
function st(){data.settings=data.settings||blank().settings;data.settings.adminCode=data.settings.adminCode||'1218';data.settings.notifications=data.settings.notifications||blank().settings.notifications;return data.settings}
function locks(){data.locks=data.locks||{};return data.locks}
function isLocked(area){return !!locks()[area]&&!canAdmin()}
function currentPersonName(){let p=arr('people').find(p=>p.owner===uid||p.email===localStorage.getItem('ofa-email'));return (p&&p.name)|| (canAdmin()?'Melissa':'Family Member')}
function notifyEnabled(kind){return st().notifications[kind]!==false}
function validFirebaseUid(value){const v=String(value||'').trim();return !!v&&v!=='local-user'&&!v.includes('@')&&v.length>=20}
function linkedPersonUid(person){return [person?.owner,person?.firebaseUid,person?.authUid,person?.uid].find(validFirebaseUid)||''}
function allLinkedUserUids(){const out=new Set(arr('people').map(linkedPersonUid).filter(Boolean));if(validFirebaseUid(uid))out.add(uid);return [...out]}
function notificationTargetUids(){const t=selectedTrip&&arr('trips').find(x=>String(x.id)===String(selectedTrip));if(t&&tripIsRestricted(t))return resolveMemberUids(t);return allLinkedUserUids()}
function notificationUrl(kind='notifications',tripId=''){
  const base=location.origin+location.pathname.replace(/[^/]*$/,'');
  const route=kind==='chat'?'chat':kind==='trips'&&tripId?'trip':'notifications';
  const params=tripId?`?trip=${encodeURIComponent(tripId)}`:'';
  return `${base}index.html?v=${VERSION}${params}#${route}`;
}
async function queuePushNotification(targetUids,text,kind='trips',options={}){
  try{
    const user=window.firebase?.auth?.().currentUser;
    if(!fb||!user||!validFirebaseUid(user.uid))return false;
    const targets=[...new Set((targetUids||[]).filter(validFirebaseUid))];
    if(!targets.length)return false;
    const queueId=options.notificationId||id();
    const targetMap=Object.fromEntries(targets.map(v=>[v,true]));
    const payload={
      id:queueId,
      actorUid:user.uid,
      actorName:currentPersonName(),
      targets:targetMap,
      title:options.title||'Our Family Adventures',
      text:String(text||'You have a new family update.').slice(0,500),
      kind,
      tripId:options.tripId||selectedTrip||'',
      url:options.url||notificationUrl(kind,options.tripId||selectedTrip||''),
      createdAt:firebase.database.ServerValue.TIMESTAMP,
      skipInAppFor:options.skipInAppFor||''
    };
    const queueRef=firebase.database().ref(`${basePath()}/notificationQueue/${queueId}`);
    await queueRef.set(payload);
    const saved=await queueRef.once('value');
    if(!saved.exists())throw new Error('Queue record was not found after saving');
    localStorage.setItem('ofa-last-queue-id',queueId);
    localStorage.setItem('ofa-last-queue-status','queued');
    messagingError='';
    localStorage.removeItem('ofa-fcm-error');
    return {ok:true,queueId};
  }catch(error){
    console.error('Push queue failed',error);
    const code=error?.code?` (${error.code})`:'';
    messagingError='Notification queue failed'+code+': '+String(error?.message||error);
    localStorage.setItem('ofa-fcm-error',messagingError);
    localStorage.setItem('ofa-last-queue-status','failed');
    return {ok:false,error:messagingError};
  }
}
function load(){try{return Object.assign(blank(),JSON.parse(localStorage.getItem(LS)||'{}'))}catch{return blank()}}
function objById(rows){const out={};(rows||[]).forEach(x=>{if(x&&x.id)out[x.id]=x});return out}
function rowsFromObj(v){return v&&typeof v==='object'?Object.values(v):[]}
function basePath(){return `families/${FAMILY}`}
function resolveMemberUids(t){const ids=new Set([t.ownerUid,t.owner,t.createdBy].filter(Boolean));const invitees=Array.isArray(t.invitees)?t.invitees:[];invitees.forEach(v=>{const vals=v&&typeof v==='object'?[v.uid,v.owner,v.id,v.email,v.name]:[v];arr('people').forEach(person=>{if(vals.some(x=>normIdentity(x)&&[person.owner,person.id,person.email,person.name].some(y=>normIdentity(y)===normIdentity(x)))&&person.owner)ids.add(person.owner)});if(v&&typeof v==='object'&&v.uid)ids.add(v.uid)});if(canAdmin()||normIdentity(t.owner)===normIdentity(uid)||normIdentity(t.createdBy)===normIdentity(uid))ids.add(uid);return [...ids].filter(x=>x&&x!=='local-user'&&String(x).indexOf('@')<0)}
function tripBundle(t){const trip=Object.assign({},t,{ownerUid:t.ownerUid||t.owner||t.createdBy||uid});const bundle={trip,collections:{}};TRIP_COLLECTIONS.forEach(k=>bundle.collections[k]=objById(arr(k).filter(x=>String(x.tripId||'')===String(t.id))));return bundle}
function publicPayload(){const out={version:VERSION,people:objById(arr('people')),profiles:objById(arr('profiles')),invites:objById(arr('invites')),settings:st(),locks:locks(),shared:{}};TRIP_COLLECTIONS.forEach(k=>out.shared[k]=objById(arr(k).filter(x=>!x.tripId)));return out}
function composeSplitData(){const next=blank(),pub=splitState.publicData||{};next.people=rowsFromObj(pub.people);next.profiles=rowsFromObj(pub.profiles);next.invites=rowsFromObj(pub.invites);next.settings=pub.settings||blank().settings;next.locks=pub.locks||{};TRIP_COLLECTIONS.forEach(k=>next[k]=rowsFromObj(pub.shared?.[k]));[...Object.values(splitState.familyTrips||{}),...Object.values(splitState.privateTrips||{})].filter(Boolean).forEach(b=>{if(b.trip)next.trips.push(b.trip);TRIP_COLLECTIONS.forEach(k=>next[k].push(...rowsFromObj(b.collections?.[k])))});next.notifications=rowsFromObj(splitState.notifications);next.activity=data.activity||[];next.version=VERSION;next.migrated=true;data=next;localStorage.setItem(LS,JSON.stringify(data));migrate(false)}
async function saveSplit(){if(!fb||!firebase.auth().currentUser)return;const root=firebase.database().ref(basePath()),writes=[root.child('publicData').set(publicPayload()),root.child('pendingInvites').set(objById(arr('invites'))),root.child('setup/version').set(VERSION)];const liveIds=new Set(arr('trips').map(t=>String(t.id)));for(const remoteId of Object.keys(splitState.familyTrips||{})){if(!liveIds.has(String(remoteId)))writes.push(root.child(`familyTrips/${remoteId}`).remove().catch(()=>{}))}for(const remoteId of Object.keys(splitState.privateTrips||{})){if(!liveIds.has(String(remoteId))){writes.push(root.child(`privateTrips/${remoteId}`).remove().catch(()=>{}));writes.push(root.child(`tripMembers/${remoteId}`).remove().catch(()=>{}))}}for(const t of arr('trips')){const restricted=tripIsRestricted(t),bucket=restricted?'privateTrips':'familyTrips',other=restricted?'familyTrips':'privateTrips',bundle=tripBundle(t);writes.push(root.child(`${bucket}/${t.id}`).set(bundle));writes.push(root.child(`${other}/${t.id}`).remove().catch(()=>{}));if(restricted){const members=resolveMemberUids(t);writes.push(root.child(`tripMembers/${t.id}`).set(Object.fromEntries(members.map(v=>[v,true]))).catch(()=>{}));for(const memberUid of members)writes.push(root.child(`tripAccess/${memberUid}/${t.id}`).set(true).catch(()=>{}))}else writes.push(root.child(`tripMembers/${t.id}`).remove().catch(()=>{}))}const mine=arr('notifications').filter(n=>!n.user||normIdentity(n.user)===normIdentity(uid));writes.push(root.child(`userNotifications/${uid}`).set(objById(mine)));await Promise.allSettled(writes)}
function save(){migrate(false);data.version=VERSION;localStorage.setItem(LS,JSON.stringify(data));const hasApp=window.firebase&&firebase.apps&&firebase.apps.length;const u=hasApp&&firebase.auth?firebase.auth().currentUser:null;if(fb&&u)saveSplit().catch(e=>{console.error(e);sync('Saved on this device only');});}
function toast(t){let x=$('#toast'); if(!x) return; x.textContent=t;x.style.display='block';clearTimeout(x._t);x._t=setTimeout(()=>x.style.display='none',3500)}
function sync(t){let x=$('#sync'); if(x)x.textContent=t}
function updateAppBadge(count){try{if('setAppBadge' in navigator){count?navigator.setAppBadge(count):navigator.clearAppBadge()}if(navigator.serviceWorker?.controller)navigator.serviceWorker.controller.postMessage({type:'BADGE_COUNT',count})}catch(e){console.warn('App icon badge unavailable',e)}}
function escape(s=''){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function canAdmin(){return role==='Admin'}
function adminIsUnlocked(){return canAdmin()&&adminUnlocked}
function resetAdminTimer(){clearTimeout(adminLockTimer);if(adminUnlocked)adminLockTimer=setTimeout(()=>lockAdmin(true),ADMIN_TIMEOUT_MS)}
function unlockAdmin(){if(!canAdmin()){toast('Admin access is not available for this account');return}let pin=$('#adminPin')?.value||prompt('Enter admin PIN');if(pin===st().adminCode){adminUnlocked=true;resetAdminTimer();toast('Admin controls unlocked');render()}else toast('Incorrect PIN')}
function lockAdmin(auto=false){adminUnlocked=false;clearTimeout(adminLockTimer);adminLockTimer=null;toast(auto?'Admin locked after inactivity':'Admin controls locked');render()}
function setIdentity(u){const who=$('#who');if(u){uid=u.uid;const email=(u.email||'').trim().toLowerCase();localStorage.setItem('ofa-uid',uid);localStorage.setItem('ofa-email',email);let profile=arr('people').find(p=>normIdentity(p.email)===normIdentity(email)||p.firebaseUid===u.uid||p.authUid===u.uid||p.owner===u.uid);role=email===ADMIN_EMAIL?'Admin':(['Family','Guest','Child','Admin'].includes(profile?.role)?profile.role:'Family');localStorage.setItem('ofa-role',role);if(who)who.textContent=(u.email||'Signed in')+' · '+role;}else{uid='local-user';role='Family';localStorage.setItem('ofa-role','Family');if(who)who.textContent='Signed out';}}
async function linkAuthenticatedProfile(u){
  if(identityLinkBusy||!u||!u.uid||!u.email||!splitState.publicData)return false;
  const email=normIdentity(u.email),now=Date.now();
  const key=[u.uid,email,rowsFromObj(splitState.publicData.people).length,rowsFromObj(splitState.publicData.invites).length].join('|');
  if(lastIdentityLinkKey===key)return false;
  identityLinkBusy=true;
  try{
    let changed=false;
    let person=arr('people').find(p=>normIdentity(p.email)===email||p.firebaseUid===u.uid||p.authUid===u.uid||p.owner===u.uid);
    if(!person){
      const invite=arr('invites').find(i=>normIdentity(i.email)===email);
      const fallbackName=(u.displayName||invite?.name||u.email.split('@')[0]).trim();
      person={id:id(),name:fallbackName,email:u.email,role:u.email===ADMIN_EMAIL?'Admin':(invite?.role||'Family'),createdAt:now};
      arr('people').unshift(person);changed=true;
    }
    const desired={email:u.email,owner:u.uid,uid:u.uid,firebaseUid:u.uid,authUid:u.uid,accountStatus:u.emailVerified?'Active':'Account created',emailVerified:!!u.emailVerified,linkedAt:person.linkedAt||now,updatedAt:now};
    if(u.email===ADMIN_EMAIL&&!person.name)desired.name='Melissa Lehr';
    if(u.email===ADMIN_EMAIL&&person.role!=='Admin')desired.role='Admin';
    for(const [k,v] of Object.entries(desired)){if(person[k]!==v){person[k]=v;changed=true}}
    arr('profiles').forEach(profile=>{if(normIdentity(profile.email)===email||profile.firebaseUid===u.uid||profile.owner===u.uid){for(const [k,v] of Object.entries({email:u.email,owner:u.uid,uid:u.uid,firebaseUid:u.uid,authUid:u.uid,emailVerified:!!u.emailVerified,updatedAt:now})){if(profile[k]!==v){profile[k]=v;changed=true}}}});
    arr('invites').forEach(invite=>{if(normIdentity(invite.email)===email){for(const [k,v] of Object.entries({uid:u.uid,firebaseUid:u.uid,status:'Accepted',acceptedAt:invite.acceptedAt||now})){if(invite[k]!==v){invite[k]=v;changed=true}}}});
    arr('trips').forEach(t=>{
      if(normIdentity(t.ownerEmail)===email||normIdentity(t.owner)===email||normIdentity(t.createdBy)===email){if(t.ownerUid!==u.uid){t.ownerUid=u.uid;changed=true}}
      if(!Array.isArray(t.invitees))return;
      t.invitees=t.invitees.map(v=>{
        const match=typeof v==='string'?normIdentity(v)===email:!!v&&[v.email,v.uid,v.owner].some(x=>normIdentity(x)===email||x===u.uid);
        if(!match)return v;
        const linked=typeof v==='object'&&v?{...v}:{email:u.email,name:person.name||u.displayName||u.email};
        if(linked.uid!==u.uid||linked.firebaseUid!==u.uid||linked.email!==u.email){changed=true;linked.uid=u.uid;linked.firebaseUid=u.uid;linked.email=u.email}
        if(!linked.name)linked.name=person.name||u.displayName||u.email;
        return linked;
      });
    });
    if(changed){
      localStorage.setItem(LS,JSON.stringify(data));
      await saveSplit();
      localStorage.setItem('ofa-profile-linked','yes');
      localStorage.setItem('ofa-linked-uid',u.uid);
    }
    lastIdentityLinkKey=key;
    return changed;
  }catch(e){console.error('Firebase UID profile link failed',e);return false}finally{identityLinkBusy=false}
}
function canEdit(item={}){return canAdmin()||!item.private||item.owner===uid||item.createdBy===uid}
function migrate(doSave=true){COLS.forEach(k=>{if(['settings','locks'].includes(k)){data[k]=data[k]||blank()[k]}else if(!Array.isArray(data[k]))data[k]=[]});st();locks();arr('trips').forEach(t=>{t.id=t.id||id();t.visibility=t.visibility||'family';t.invitees=t.invitees||[];t.ownerUid=t.ownerUid||t.owner||t.createdBy||uid});['memories','media','scrapbooks','meals','grocery','packing','links','chats','votes'].forEach(k=>arr(k).forEach(x=>{x.id=x.id||id();x.createdAt=x.createdAt||Date.now();x.owner=x.owner||uid}));data.migrated=true;if(doSave)save()}
function showDeviceNotification(text,tag='ofa-update'){if(!('Notification'in window)||Notification.permission!=='granted')return;try{navigator.serviceWorker?.ready.then(reg=>reg.showNotification('Our Family Adventures',{body:text,icon:'./icons/icon-192.png',badge:'./icons/badge-96.png',tag,renotify:true})).catch(()=>{})}catch(e){console.warn('Notification display skipped',e)}}
function notify(text,push=true,targetUser=uid){const target=validFirebaseUid(targetUser)?targetUser:uid;const n={id:id(),text,at:Date.now(),read:false,user:target,kind:'admin',url:notificationUrl('notifications')};arr('notifications').unshift(n);data.notifications=data.notifications.slice(0,240);let mine=!target||target===uid;if(mine){updateAppBadge(arr('notifications').filter(x=>(!x.user||x.user===uid)&&!x.read).length);if(push)showDeviceNotification(text,'ofa-'+Date.now())}save();if(push&&validFirebaseUid(target))queuePushNotification([target],text,'admin',{notificationId:n.id,skipInAppFor:mine?uid:'',url:n.url})}
function notifyFamily(text,kind='trips'){if(!notifyEnabled(kind))return;const targets=notificationTargetUids();const n={id:id(),text,at:Date.now(),read:false,user:uid,kind,tripId:selectedTrip||'',url:notificationUrl(kind,selectedTrip||'')};arr('notifications').unshift(n);data.notifications=data.notifications.slice(0,240);updateAppBadge(arr('notifications').filter(x=>(!x.user||x.user===uid)&&!x.read).length);showDeviceNotification(text,'ofa-'+Date.now());save();queuePushNotification(targets.filter(v=>v!==uid),text,kind,{notificationId:n.id,tripId:selectedTrip||'',url:n.url})}
function activity(text,kind='trips'){arr('activity').unshift({id:id(),text,at:Date.now(),user:uid});data.activity=data.activity.slice(0,120);notifyFamily(text,kind)}
function normIdentity(v){return String(v??'').trim().toLowerCase()}
function identitySet(){
  const email=localStorage.getItem('ofa-email')||'';
  const me=arr('people').find(p=>p.owner===uid||normIdentity(p.email)===normIdentity(email));
  return new Set([uid,email,me?.id,me?.owner,me?.email,me?.name,currentPersonName()].filter(Boolean).map(normIdentity));
}
function tripIsRestricted(t){return !!t&&(t.visibility==='private'||t.private===true||t.locked===true)}
function invitedToTrip(t){
  if(!t)return false;
  if(canAdmin()||normIdentity(t.owner)===normIdentity(uid)||normIdentity(t.createdBy)===normIdentity(uid))return true;
  if(!tripIsRestricted(t))return true;
  const ids=identitySet();
  const invitees=Array.isArray(t.invitees)?t.invitees:[];
  return invitees.some(v=>{
    if(v&&typeof v==='object')return [v.id,v.uid,v.owner,v.email,v.name].some(x=>ids.has(normIdentity(x)));
    return ids.has(normIdentity(v));
  });
}
function tripsVisible(){return arr('trips').filter(invitedToTrip)}
function getTripById(tripId){return arr('trips').find(t=>String(t.id)===String(tripId))}
function itemTripVisible(x){if(!x?.tripId)return !x?.private||canAdmin()||normIdentity(x.owner)===normIdentity(uid)||normIdentity(x.createdBy)===normIdentity(uid);let parent=getTripById(x.tripId);return !!parent&&invitedToTrip(parent)}
function canAccessItem(x){return !!x&&itemTripVisible(x)&&(!x.private||canAdmin()||normIdentity(x.owner)===normIdentity(uid)||normIdentity(x.createdBy)===normIdentity(uid))}
function byTrip(k){return arr(k).filter(canAccessItem).filter(x=>!selectedTrip||String(x.tripId)===String(selectedTrip))}
function blockUnauthorizedTrip(tripId,quiet=false){
  if(!tripId)return false;
  const t=getTripById(tripId);
  if(t&&invitedToTrip(t))return false;
  selectedTrip=null;route='home';
  if(!quiet)toast('Access denied: this private trip is available only to invited users.');
  return true;
}
function mediaForCurrentContext(){return arr('media').filter(canAccessItem).filter(m=>!m.tripId||!selectedTrip||String(m.tripId)===String(selectedTrip))}
function trip(){return tripsVisible().find(t=>t.id===selectedTrip)||tripsVisible()[0]}
function peopleOptions(){let p=arr('people');return p.length?p.map(x=>x.name||x.email||'Family member'):['Melissa','Everyone']}
function assignmentEditor(entity,item){let assigned=Array.isArray(item.assignedTo)?item.assignedTo:(item.assignedTo?[item.assignedTo]:[]);return `<div class="assignmentEditor"><b>Who is bringing / responsible?</b>${peopleOptions().map(name=>`<label><input type="checkbox" ${assigned.includes(name)?'checked':''} onchange="app.toggleAssignment('${entity}','${item.id}',${JSON.stringify(name)})"> ${escape(name)}</label>`).join('')}</div>`}
function tripPreview(kind){let rows=byTrip(kind);if(!rows.length)return '<p class="muted">Nothing added yet.</p>';if(kind==='media'){return `<div class="tripMediaThumbs">${rows.slice(0,8).map(x=>x.url?`<button class="tripMediaThumb" onclick="app.go('media','${escape(x.tripId||selectedTrip||'')}')" aria-label="Open media"><img src="${escape(x.url)}" alt="${escape(x.name||'Trip photo')}"></button>`:'').join('')}${rows.length>8?`<small>+ ${rows.length-8} more</small>`:''}</div>`}if(kind==='scrapbooks'){return `<div class="tripPreview">${rows.slice(0,6).map(x=>`<div><button class="textLink" onclick="app.openSavedScrap('${escape(x.id)}')"><b>${escape(x.title||'Scrapbook page')}</b></button><small>${escape(x.description||new Date(x.createdAt||Date.now()).toLocaleDateString())}</small></div>`).join('')}${rows.length>6?`<small>+ ${rows.length-6} more</small>`:''}</div>`}return `<div class="tripPreview">${rows.slice(0,4).map(x=>{let title=x.name||x.type||x.title||x.category||x.description||'Item';let extra=x.day||x.date||x.amount||x.time||x.status||'';return `<div><b>${escape(title)}</b>${extra?`<small>${escape(extra)}</small>`:''}</div>`}).join('')}${rows.length>4?`<small>+ ${rows.length-4} more</small>`:''}</div>`}
function weatherMarkup(){return `<div id="tripWeather" class="weatherPanel"><p class="muted">Loading live weather for ${escape(trip()?.location||trip()?.name||'trip destination')}…</p></div>`}
function setRoute(r,arg){if(route==='scrapbook'&&r!=='scrapbook')saveScrapDraft(true);if(arg&&blockUnauthorizedTrip(arg)){location.hash='home';render();return}route=r;if(arg)selectedTrip=arg;location.hash=arg?`${r}/${arg}`:r;render()}
function parseHash(){let h=(location.hash||'#home').slice(1).split('/');route=h[0]||'home';if(h[1]){selectedTrip=h[1];if(blockUnauthorizedTrip(selectedTrip,true)){location.hash='home';setTimeout(()=>toast('Access denied: you are not invited to that private trip.'),50)}}}
function enter(){localStorage.setItem('ofa-entered','yes');$('#splash')?.classList.add('hidden');$('#shell')?.classList.remove('hidden');render()}
function clearSplitListeners(){splitUnsubs.forEach(x=>{try{x.ref.off('value',x.cb)}catch(_){}});splitUnsubs=[]}
function listenValue(ref,cb,privateTripId=''){ref.on('value',cb);splitUnsubs.push({ref,cb,privateTripId})}
async function migrateLegacyIfNeeded(root){const marker=await root.child('migration/version').once('value');if(marker.exists())return;const legacy=await root.child('appData').once('value');if(!legacy.exists()||!canAdmin())return;data=Object.assign(blank(),legacy.val());migrate(false);await saveSplit();await root.child('migration').set({version:VERSION,at:firebase.database.ServerValue.TIMESTAMP,by:uid})}
function startSplitSync(){clearSplitListeners();const root=firebase.database().ref(basePath());const refresh=()=>{composeSplitData();sync('Connected · split-path privacy active');const u=firebase.auth().currentUser;if(u)linkAuthenticatedProfile(u).then(changed=>{if(changed){setIdentity(u);sync('Connected · profile linked to Firebase UID');render()}});render()};listenValue(root.child('publicData'),s=>{splitState.publicData=s.val()||{};refresh()});listenValue(root.child('familyTrips'),s=>{splitState.familyTrips=s.val()||{};refresh()});listenValue(root.child(`userNotifications/${uid}`),s=>{splitState.notifications=s.val()||{};refresh()});listenValue(root.child(`tripAccess/${uid}`),s=>{const access=s.val()||{},allowed=new Set(Object.keys(access).filter(k=>access[k]));Object.keys(splitState.privateTrips).forEach(k=>{if(!allowed.has(k))delete splitState.privateTrips[k]});allowed.forEach(tripId=>{if(splitUnsubs.some(x=>x.privateTripId===tripId))return;const ref=root.child(`privateTrips/${tripId}`),cb=snap=>{if(snap.exists())splitState.privateTrips[tripId]=snap.val();else delete splitState.privateTrips[tripId];refresh()};listenValue(ref,cb,tripId)});refresh()})}
function initFirebase(){try{setIdentity(null);if(!window.firebase||!window.firebaseConfig||!firebaseConfig.apiKey){sync('Local admin saving ready');return}if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);sync('Firebase ready · sign in for family sync');firebase.auth().onAuthStateChanged(async u=>{clearSplitListeners();if(!u){fb=false;setIdentity(null);sync('Admin on this device · sign in for family sync');render();return}uid=u.uid;fb=true;setIdentity(u);sync('Connecting protected Firebase paths…');const root=firebase.database().ref(basePath());try{await migrateLegacyIfNeeded(root)}catch(e){console.error('Migration check failed',e)}startSplitSync();setTimeout(()=>restorePushRegistration(),800);setTimeout(()=>restorePushRegistration(),5000)});}catch(e){console.error(e);setIdentity(null);sync('Local admin saving ready')}}
function setup(){window.__ofaBooted=true;window.addEventListener('error',e=>{try{const m=String(e.message||'');const src=String(e.filename||'');const generic=!m||m==='Script error.'||m==='Script error';const external=src&&new URL(src,location.href).origin!==location.origin;if(generic||external||m.includes('Illegal constructor')||(m.includes('Unexpected end of input')&&!src.includes('app.js'))){console.warn('Non-app script error ignored',{message:m,source:src});return}console.error('Application error',e.error||e);sync('Startup issue: '+m)}catch(err){console.warn('Error handler skipped',err)}});window.addEventListener('unhandledrejection',e=>{const reason=e.reason;const m=String(reason?.message||reason||'');if(!m||/network|failed to fetch|permission|popup|notification/i.test(m)){console.warn('Background request issue',reason);return}console.error('Unhandled application promise',reason);sync('Startup issue: '+m)});sync('Admin on this device · local saving ready');parseHash();if(localStorage.getItem('ofa-entered'))enter();window.addEventListener('hashchange',()=>{if(route==='scrapbook')saveScrapDraft(true);parseHash();render()});window.addEventListener('beforeunload',()=>saveScrapDraft(true));window.addEventListener('resize',()=>{if(document.body.classList.contains('scrapEditing'))requestAnimationFrame(fitScrapCanvas)});document.addEventListener('pointerdown',()=>{if(adminUnlocked)resetAdminTimer()},{passive:true});window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e});navigator.serviceWorker?.addEventListener('message',e=>{if(e.data?.type==='FCM_TOKEN_REFRESH_REQUIRED')restorePushRegistration()});window.addEventListener('online',()=>restorePushRegistration());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')restorePushRegistration()});if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').then(()=>restorePushRegistration()).catch(()=>{});let mb=$('#menuBtn'); if(mb)mb.onclick=()=>$('#drawer')?.classList.toggle('open');migrate(false);initFirebase();setTimeout(loadInviteFromUrl,500);setTimeout(()=>{if($('#sync')?.textContent?.includes('Starting'))sync('Admin on this device · local saving ready')},1200)}
function nav(){let dock=$('#dock'),drawer=$('#drawer');if(!dock||!drawer)return;let n=[['🏠','Home','home'],['🔐','Login','login'],['🧳','Trips','trips'],['🖼️','Media','media'],['📖','Scrapbook','scrapbook'],['✅','Lists','lists'],['💬','Chat','chat'],['⚙️','Settings','settings']];if(canAdmin())n.push(['🛡️','Admin','admin']);dock.innerHTML=n.map(x=>`<button onclick="app.go('${x[2]}')"><span>${x[0]}</span>${x[1]}</button>`).join('');let pages=['home','login','trips','people','media','memories','scrapbook','meals','grocery','packing','links','voting','analytics','chat','messages','settings','history','notifications','assignments'];if(canAdmin())pages.push('admin');drawer.innerHTML='<h2>Menu</h2>'+pages.map(r=>`<button onclick="app.go('${r}');document.querySelector('#drawer').classList.remove('open')">${r[0].toUpperCase()+r.slice(1)}</button>`).join('')+'<button onclick="app.exportData()">Download Backup</button><button onclick="app.importClick()">Import/Migrate Backup</button><input id="importFile" type="file" accept="application/json" class="hidden">'}
function render(){migrate(false);if(selectedTrip&&blockUnauthorizedTrip(selectedTrip,true)){location.hash='home';setTimeout(()=>toast('Access denied: private trip'),30)}document.body.classList.toggle('dark',st().theme==='dark');nav();let unread=arr('notifications').filter(n=>(!n.user||n.user===uid)&&!n.read).length;let badge=$('#badge'); if(badge)badge.textContent=unread;updateAppBadge(unread);let view=$('#view'); if(!view)return;view.innerHTML=(views[route]||views.home)()+floatingChat(); if(route==='scrapbook') setTimeout(drawScrap,50); if(route==='trip'||route==='weather') setTimeout(loadTripWeather,80); setTimeout(makeFloatingChatMoveable,50)}
function card(title,body,cls=''){return `<section class="card ${cls}"><h2>${title}</h2>${body}</section>`}
function form(entity,fields,tripScoped=false){let inputs=fields.map(f=>{if(f.type==='area')return `<textarea id="f_${f.k}" placeholder="${f.l}"></textarea>`; if(f.type==='select')return `<select id="f_${f.k}">${(f.options||[]).map(o=>`<option value="${escape(o.v||o)}">${escape(o.l||o)}</option>`).join('')}</select>`; if(f.type==='people')return `<div class="checks"><b>${escape(f.l)}</b>${peopleOptions().map(p=>`<label><input type="checkbox" name="f_${f.k}" value="${escape(p)}"> ${escape(p)}</label>`).join('')}</div>`; return `<input id="f_${f.k}" type="${f.type||'text'}" placeholder="${f.l}">`}).join('');return `<div class="formgrid">${inputs}</div><button class="primary" onclick='app.add("${entity}",${JSON.stringify(fields.map(f=>f.k))},${tripScoped})'>Add / Save</button>`}
function list(entity,items,fmt,allowDelete=true){items=Array.isArray(items)?items:[];return `<div class="list">${items.length?items.map(x=>`<div class="item"><div class="between row"><div>${fmt(x)}</div><div class="row">${allowDelete&&canEdit(x)?`<button onclick="app.del('${entity}','${x.id}')">Delete</button>`:''}</div></div></div>`).join(''):'<p class="muted">Nothing added yet.</p>'}</div>`}
function tripPicker(){let ts=tripsVisible();if(!selectedTrip&&ts[0])selectedTrip=ts[0].id;return `<select onchange="app.pickTrip(this.value)">${ts.map(t=>`<option ${t.id===selectedTrip?'selected':''} value="${t.id}">${escape(t.name||'Trip')}</option>`).join('')}</select>`}
function selectedTripDates(){let t=trip(); if(!t||!t.start||!t.end)return ['']; let out=[],d=new Date(t.start+'T00:00:00'),end=new Date(t.end+'T00:00:00'); for(let i=0; d<=end && i<45; i++,d.setDate(d.getDate()+1)){out.push(d.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric',year:'numeric'}));} return out;}
function featureTabs(){let t=trip();if(!t)return '';return `<div class="navtabs">${['trip','meals','grocery','packing','links','rsvp','reservations','budget','weather','maps','itinerary','attendees','chat','memories','media','scrapbook'].map(r=>`<button onclick="app.go('${r}','${t.id}')">${r}</button>`).join('')}</div>`}
function recent(){return card('Recent Activity',list('activity',arr('activity').slice(0,8),a=>`<b>${escape(a.text)}</b><p class="muted">${new Date(a.at).toLocaleString()}</p>`,false))}
function floatingChat(){if(route==='chat')return '';let msgs=byTrip('chats').concat(arr('chats').filter(c=>!c.tripId)).slice(0,20);return `<div id="quickChat" class="quickChat hidden"><div class="quickChatHead"><b>Family Chat</b><button onclick="app.toggleQuickChat()">×</button></div><div class="quickChatFeed">${msgs.map(c=>`<div class="quickMsg"><b>${escape(c.userName||'Family')}</b><span>${escape(c.text)}</span><small>${new Date(c.createdAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</small></div>`).join('')||'<p class="muted">No messages yet.</p>'}</div><div class="quickChatSend"><input id="quickChatText" placeholder="Message the family"><button class="primary" onclick="app.sendQuickChat()">Send</button></div><div class="row quickChatActions"><button class="openFullChat" onclick="app.go('chat')">Open full chat here</button><button onclick="app.openChatWindow()">Open separate page</button></div></div><button id="floatChat" class="chat floatChat" aria-label="Open family chat window">💬</button>`}
function makeFloatingChatMoveable(){let b=$('#floatChat');if(!b)return;let pos={};try{pos=JSON.parse(localStorage.getItem('ofa-chat-pos')||'{}')}catch{}if(Number.isFinite(pos.x)&&Number.isFinite(pos.y)){b.style.left=pos.x+'px';b.style.top=pos.y+'px';b.style.right='auto';b.style.bottom='auto'}let start=null;b.onpointerdown=e=>{start={x:e.clientX,y:e.clientY,l:b.offsetLeft,t:b.offsetTop,moved:false};b.setPointerCapture(e.pointerId);e.preventDefault()};b.onpointermove=e=>{if(!start)return;let dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)+Math.abs(dy)>8)start.moved=true;if(start.moved){b.style.left=Math.max(8,Math.min(innerWidth-b.offsetWidth-8,start.l+dx))+'px';b.style.top=Math.max(72,Math.min(innerHeight-b.offsetHeight-90,start.t+dy))+'px';b.style.right='auto';b.style.bottom='auto'}};b.onpointerup=e=>{let moved=start?.moved;if(moved)localStorage.setItem('ofa-chat-pos',JSON.stringify({x:b.offsetLeft,y:b.offsetTop}));start=null;if(!moved)toggleQuickChat()};}
function openChatWindow(){let w=window.open('./index.html#chat','ofaFamilyChat','popup=yes,width=430,height=720,resizable=yes,scrollbars=yes');if(!w){location.hash='#chat';toast('Your browser blocked the chat window, so chat opened here instead.')}else{try{w.focus()}catch{}}}
function toggleQuickChat(){let q=$('#quickChat');if(!q)return;q.classList.toggle('hidden');if(!q.classList.contains('hidden'))setTimeout(()=>$('#quickChatText')?.focus(),50)}
function sendQuickChat(){if(selectedTrip&&blockUnauthorizedTrip(selectedTrip))return;let text=$('#quickChatText')?.value?.trim();if(!text)return;arr('chats').unshift({id:id(),tripId:selectedTrip||'',text,user:uid,userName:currentPersonName(),createdAt:Date.now()});save();notifyFamily('New group chat message','chat');render();setTimeout(()=>$('#quickChat')?.classList.remove('hidden'),30)}
const views={
login(){const invited=activeInvite||readStoredInvite();const email=invited?.email||localStorage.getItem('ofa-email')||'mlehr1211@gmail.com';return card(invited?'Accept Family Invitation':'Sign In / Family Sync',`${invited?`<div class="inviteWelcome"><h3>You're invited to Our Family Adventures</h3><p><b>${escape(invited.name||email)}</b></p><p class="muted">Create an account using <b>${escape(invited.email||'the invited email')}</b>. Firebase will assign your private UID automatically.</p></div>`:'<p>Sign in to connect this device to the shared family app.</p>'}<div class="formgrid"><input id="loginName" placeholder="Your name" value="${escape(invited?.name||'')}"><input id="loginEmail" type="email" placeholder="Email" value="${escape(email)}"><input id="loginPass" type="password" placeholder="Password (6+ characters)"></div><div class="row"><button class="primary" onclick="app.signIn()">Sign In</button><button onclick="app.createInvitedAccount()">Create Account</button><button onclick="app.signOut()">Sign Out</button></div><p class="muted">Use the same email address that received the invitation.</p>`)},
home(){let next=tripsVisible()[0];return `<section class="welcomeHero"><img src="./assets/lighthouse-home.png" alt="Lighthouse"><div><h1>Making Memories Together</h1><p>Plan every family adventure in one beautiful, shared place.</p>${next?`<button class="primary" onclick="app.go('trip','${next.id}')">Open ${escape(next.name)}</button>`:`<button class="primary" onclick="app.go('trips')">Plan an Adventure</button>`}</div></section><div class="grid homeTiles">${['trips','people','chat','media','scrapbook','notifications'].map(x=>`<div class="card tile" onclick="app.go('${x}')"><h3>${x[0].toUpperCase()+x.slice(1)}</h3><p>Open ${x}</p></div>`).join('')}</div>`},
people(){const roleOptions=['Family','Guest','Child','Admin'];return card('People / Profiles',`<p class="muted">Family members can update contact information and profile photos. Only an unlocked Admin can change or lock account roles.</p><div class="formgrid"><input id="f_name" placeholder="Name"><input id="f_email" type="email" placeholder="Email"><input id="f_phone" placeholder="Phone"><input id="profilePhoto" type="file" accept="image/*"></div><button class="primary" onclick="app.addProfile()">Add / Save Profile</button>`+list('people',arr('people'),p=>`${p.photo?`<img src="${escape(p.photo)}" class="avatar">`:''}<b>${escape(p.name||p.email||'Family member')}</b><p class="muted">${escape(p.email||'')} ${escape(p.phone||'')}</p><p class="muted">Role: <b>${escape(p.role||'Family')}</b>${p.roleLocked?' · 🔒 Locked':''}${p.accountStatus?' · '+escape(p.accountStatus):''}</p>${adminIsUnlocked()?`<div class="formgrid roleManager"><select aria-label="Role for ${escape(p.name||p.email||'person')}" ${locks().roles||p.roleLocked?'disabled':''} onchange="app.updatePersonRole('${p.id}',this.value)">${roleOptions.map(r=>`<option ${r===(p.role||'Family')?'selected':''}>${r}</option>`).join('')}</select><label><input type="checkbox" ${p.roleLocked?'checked':''} onchange="app.togglePersonRoleLock('${p.id}')"> Lock this role</label></div>`:''}<div class="row"><button onclick="app.editProfile('${p.id}')">Edit Info</button><label class="buttonLike">Change Photo<input class="hidden" type="file" accept="image/*" onchange="app.changeProfilePhoto('${p.id}',this.files[0])"></label></div>`))},
trips(){return card('Trips',form('trips',[{k:'name',l:'Trip name'},{k:'location',l:'Destination / address'},{k:'start',l:'Arrival date',type:'date'},{k:'end',l:'Departure date',type:'date'},{k:'visibility',l:'Visibility',type:'select',options:[{v:'family',l:'Family — visible to everyone'},{v:'private',l:'Private — invited users only'}]},{k:'invitees',l:'Invite people to this private trip',type:'people'}])+list('trips',tripsVisible(),t=>`<div class="tripTitleRow"><b>${escape(t.name)}</b>${t.visibility==='private'?'<span class="privateBadge">🔒 Private</span>':'<span class="familyBadge">Family</span>'}</div><p class="muted">${escape(t.location||'No location')} · ${escape(t.start||'')} ${t.end?'to '+escape(t.end):''}</p>${t.visibility==='private'?`<p class="privacyNote">Only the creator, admins, and invited users can see this trip and every item connected to it.</p>`:''}<div class="row"><button class="primary" onclick="app.go('trip','${t.id}')">Open dedicated trip page</button>${canEdit(t)?`<button onclick="app.editTrip('${t.id}')">Edit trip details</button>`:''}</div>`))},
trip(){let t=trip();if(!t)return views.trips();let q=encodeURIComponent(t.location||t.name||'');let modules=[['meals','meals'],['grocery','grocery'],['packing','packing'],['links','links'],['rsvp','rsvps'],['reservations','reservations'],['budget','budgets'],['itinerary','itinerary'],['attendees','attendees'],['memories','memories'],['media','media'],['scrapbook','scrapbooks']];return featureTabs()+card(`<div class="row between tripPdfHeader"><span>${escape(t.name||'Trip')}${t.visibility==='private'?' · 🔒 Private':''}</span><div class="row"><button onclick="app.editTrip('${t.id}')">Edit trip details</button><button class="primary" onclick="app.exportTripPDF()">Export Trip PDF</button></div></div>`,`<p class="muted">${escape(t.location||'Add a trip destination')}</p>${t.visibility==='private'?'<p class="privacyNote">This private trip and all connected meals, lists, media, memories, votes, chat, reservations, and scrapbook pages are limited to invited users.</p>':''}<div class="tripHeroGrid"><iframe class="map" loading="lazy" src="https://www.google.com/maps?q=${q}&output=embed"></iframe>${weatherMarkup()}</div><div class="grid tripModuleGrid">${modules.map(([r,k])=>`<div class="card tripModule"><div class="between row"><h3>${r[0].toUpperCase()+r.slice(1)}</h3><button onclick="app.go('${r}','${t.id}')">Open</button></div>${tripPreview(k)}</div>`).join('')}<div class="card tripModule"><div class="between row"><h3>Weather</h3><button onclick="app.go('weather','${t.id}')">Open</button></div>${weatherMarkup()}</div><div class="card tripModule"><div class="between row"><h3>Maps</h3><button onclick="app.go('maps','${t.id}')">Open</button></div><p class="muted">${escape(t.location||'Destination not added')}</p></div></div>`)},
meals(){let dates=selectedTripDates();return featureTabs()+card('Meal Planning',tripPicker()+`<h3>Meal list</h3>`+list('meals',byTrip('meals'),m=>`<b>${escape(m.day)} · ${escape(m.type)}</b><p>${escape(m.name||'')}</p><p class="muted">${escape(m.address||'')} ${m.time?' · '+escape(m.time):''} ${m.url?` · <a href="${escape(m.url)}" target="_blank" rel="noopener">Open link</a>`:''}</p><p class="muted">Bringing / attending: ${escape(Array.isArray(m.assignedTo)?(m.assignedTo.join(', ')||'Open'):m.assignedTo||'Open')}</p>${assignmentEditor('meals',m)}`)+`<h3 class="addHead">Add another meal</h3>`+form('meals',[{k:'day',l:'Trip date',type:'select',options:dates},{k:'type',l:'Meal type',type:'select',options:['Breakfast','Lunch','Dinner','Snacks','Happy Hour','Dining Out']},{k:'name',l:'Meal / restaurant name'},{k:'address',l:'Restaurant address'},{k:'url',l:'Restaurant link / reservation URL'},{k:'time',l:'Meeting time',type:'time'},{k:'assignedTo',l:'Assigned to',type:'people'}],true))},
grocery(){return featureTabs()+card('Grocery Lists',tripPicker()+`<h3>Grocery list</h3>`+list('grocery',byTrip('grocery'),g=>`<label class="bigcheck"><input type="checkbox" ${g.done?'checked':''} onchange="app.toggleDone('grocery','${g.id}')"> <b>${escape(g.name)}</b></label><p class="muted">${escape(g.qty||'')} · Assigned: ${escape(Array.isArray(g.assignedTo)?(g.assignedTo.join(', ')||'Open'):g.assignedTo||'Open')} ${g.private?'· Private':''}</p>${assignmentEditor('grocery',g)}`)+`<h3 class="addHead">Add another grocery item</h3>`+form('grocery',[{k:'name',l:'Item'},{k:'qty',l:'Quantity'},{k:'assignedTo',l:'Assigned to',type:'people'},{k:'private',l:'Private?',type:'select',options:[{v:'',l:'Shared'},{v:'yes',l:'Private'}]}],true))},
packing(){return featureTabs()+card('Packing Lists',tripPicker()+`<h3>Packing list</h3>`+list('packing',byTrip('packing'),p=>`<label class="bigcheck"><input type="checkbox" ${p.done?'checked':''} onchange="app.toggleDone('packing','${p.id}')"> <b>${escape(p.name)}</b></label><p class="muted">Assigned: ${escape(Array.isArray(p.assignedTo)?(p.assignedTo.join(', ')||'Open'):p.assignedTo||'Open')} ${p.private?'· Private':''}</p>${assignmentEditor('packing',p)}`)+`<h3 class="addHead">Add another packing item</h3>`+form('packing',[{k:'name',l:'Packing item'},{k:'assignedTo',l:'Assigned to',type:'people'},{k:'private',l:'Private?',type:'select',options:[{v:'',l:'Shared'},{v:'yes',l:'Private'}]}],true))},
links(){return featureTabs()+card('Travel Links',tripPicker()+form('links',[{k:'name',l:'Travel link name'},{k:'url',l:'URL'},{k:'address',l:'Address'},{k:'type',l:'Type',type:'select',options:['Lodging','Restaurant','Activity','Reservation','Map','Other']}],true)+list('links',byTrip('links'),l=>`<b>${escape(l.name)}</b><p class="muted">${escape(l.type||'Link')} ${escape(l.address||'')}</p>${l.url?`<a href="${escape(l.url)}" target="_blank" rel="noopener">Open link</a>`:''}`))},
	rsvp(){let rows=byTrip('rsvps'),opts=["Attending","Maybe","Can't Attend"];return featureTabs()+card('RSVP',tripPicker()+`<p class="muted">Choose one response. Changing your RSVP updates your existing response.</p><div class="grid">${opts.map(o=>{let names=rows.filter(r=>r.status===o).map(r=>r.name);return `<div class="card"><h3>${o}</h3><strong>${names.length}</strong><p>${names.map(escape).join(', ')||'No responses yet'}</p><button class="primary" data-status="${escape(o)}" onclick="app.setRsvp(this.dataset.status)">Choose ${o}</button></div>`}).join('')}</div>`)},
	reservations(){return featureTabs()+card('Reservations',tripPicker()+form('reservations',[{k:'name',l:'Reservation name'},{k:'date',l:'Date',type:'date'},{k:'time',l:'Time',type:'time'},{k:'confirmation',l:'Confirmation number'},{k:'url',l:'Reservation link'}],true)+list('reservations',byTrip('reservations'),x=>`<b>${escape(x.name)}</b><p>${escape(x.date||'')} ${escape(x.time||'')}</p><p class="muted">${escape(x.confirmation||'')}</p>${x.url?`<a href="${escape(x.url)}" target="_blank">Open</a>`:''}`))},
	budget(){let rows=byTrip('budgets'),total=rows.reduce((a,x)=>a+Number(x.amount||0),0);return featureTabs()+card('Budget',tripPicker()+`<h3>Total: $${total.toFixed(2)}</h3>`+form('budgets',[{k:'name',l:'Expense'},{k:'amount',l:'Amount',type:'number'},{k:'paidBy',l:'Paid by',type:'people'},{k:'notes',l:'Notes'}],true)+list('budgets',rows,x=>`<b>${escape(x.name)}</b><p>$${Number(x.amount||0).toFixed(2)}</p><p class="muted">Paid by ${escape(Array.isArray(x.paidBy)?x.paidBy.join(', '):x.paidBy||'')}</p>`))},
	weather(){let t=trip();return featureTabs()+card('Live Weather',weatherMarkup()+`<p class="muted">Automatically using ${escape(t?.location||t?.name||'trip destination')}.</p>`)},
	maps(){let t=trip(),q=encodeURIComponent(t?.location||t?.name||'');return featureTabs()+card('Maps',`<iframe class="map mapFull" src="https://www.google.com/maps?q=${q}&output=embed"></iframe><p><a class="buttonLike" target="_blank" href="https://www.google.com/maps/search/?api=1&query=${q}">Open directions</a></p>`)},
	itinerary(){return featureTabs()+card('Itinerary',tripPicker()+form('itinerary',[{k:'date',l:'Date',type:'date'},{k:'time',l:'Time',type:'time'},{k:'name',l:'Activity'},{k:'location',l:'Location'},{k:'notes',l:'Notes'}],true)+list('itinerary',byTrip('itinerary'),x=>`<b>${escape(x.date)} ${escape(x.time||'')} · ${escape(x.name)}</b><p>${escape(x.location||'')}</p><p class="muted">${escape(x.notes||'')}</p>`))},
	attendees(){return featureTabs()+card('Attendees',tripPicker()+form('attendees',[{k:'people',l:'Select attendees',type:'people'}],true)+list('attendees',byTrip('attendees'),x=>`<b>${escape(Array.isArray(x.people)?x.people.join(', '):x.people||'')}</b>`))},
memories(){return featureTabs()+card('Memories',tripPicker()+`<div class="formgrid"><input id="memTitle" placeholder="Memory title"><input id="memDate" type="date"><textarea id="memText" placeholder="Journal entry"></textarea><input id="memFiles" type="file" multiple accept="image/*,video/*"></div><button class="primary" onclick="app.addMemory()">Save Memory with Photos</button>`+list('memories',byTrip('memories'),m=>`${(m.photos||[]).map(u=>`<img src="${escape(u)}" style="max-width:100px;border-radius:12px;margin:4px">`).join('')}<b>${escape(m.title)}</b><p>${escape(m.text||'')}</p><p class="muted">${escape(m.date||'')}</p>`))},
media(){let visible=mediaForCurrentContext();let tripOpts=tripsVisible().map(t=>`<option value="${escape(t.id)}" ${t.id===selectedTrip?'selected':''}>Tag to ${escape(t.name)}</option>`).join('');return featureTabs()+card('Media Library',`<p class="muted">Upload random family photos without choosing a trip, or tag them to a specific adventure.</p><select id="mediaTripTag"><option value="">Share with the whole family — no trip</option>${tripOpts}</select><input id="mediaFile" type="file" multiple accept="image/*,video/*"><button class="primary" onclick="app.uploadMedia()">Add Media</button>`+list('media',visible,m=>`${m.url?`<img src="${escape(m.url)}" style="max-width:120px;border-radius:12px">`:''}<b>${escape(m.name||'Media')}</b><p class="muted">${escape(m.type||'')} · ${m.tripId?'Trip photo':'Shared family media — no trip'}</p>${m.url?`<a download="${escape(m.name||'family-photo')}" href="${escape(m.url)}">Download</a>`:''}`))},
scrapbook(){let photos=mediaForCurrentContext().filter(m=>m.url&&String(m.type||'').startsWith('image'));return featureTabs()+card('Scrapbook Studio',tripPicker()+`<p class="muted">Create a named portrait or landscape scrapbook page in the full-screen editor. Photos, frames, cutouts, text, stickers and emojis remain exactly where you save them.</p><button class="primary" onclick="app.openScrapEditor()">Open Full-Screen Scrapbook Editor</button><div id="scrapEditorPanel" class="scrapEditorPanel" aria-hidden="true"><div class="scrapEditorShell"><div class="scrapEditorHeader"><div><h2>Scrapbook Studio</h2><small>Tap a photo to edit its frame, cutout, size, crop and position.</small></div><button onclick="app.closeScrapEditor()">Close Editor</button></div><div class="scrapEditorBody"><aside class="scrapSidebar"><input id="scrapTitle" placeholder="Page name (required)"><textarea id="scrapDescription" placeholder="Page description"></textarea><select id="scrapOrientation" onchange="app.setScrapOrientation(this.value)"><option value="portrait">Portrait page</option><option value="landscape">Landscape page</option></select><select id="scrapBg" onchange="app.setScrapBg(this.value)"><option value="seaglass">Sea glass</option><option value="dustyrose">Dusty rose</option><option value="greenery">Greenery</option><option value="rosegold">Rose gold</option><option value="sunset">Sunset</option><option value="sand">Sand</option><option value="plaid">Plaid</option><option value="scrolls">Vintage scrolls</option><option value="paisley">Paisley</option><option value="birthday">Birthday theme</option><option value="pet">Pet theme</option><option value="baby">Baby theme</option><option value="lighthouse">Lighthouse</option><option value="beach">Beach</option><option value="mountains">Mountains</option><option value="camping">Camping</option><option value="party">Party</option><option value="happy">Happy Hour</option><option value="city">City Life</option></select><div class="frameApplyMode"><label><input id="applyFrameAll" type="checkbox"> Apply frame and cutout changes to every photo on this page</label><small>Leave unchecked to give each selected photo a different frame.</small></div><select id="scrapFrame" onchange="app.applyFrame(this.value)"><option value="nofill">No frame</option><option value="soft">Simple outline</option><option value="polaroid">Polaroid</option><option value="gold">Classic border</option><option value="shell">Dotted outline</option><option value="vintage">Vintage frame</option><option value="film">Film strip</option><option value="comic">Fun comic frame</option><option value="speech">Expression bubble frame</option></select><select id="scrapCutout" onchange="app.applyCutout(this.value)"><option value="none">No cutout</option><option value="heart">Heart cutout</option><option value="scallop">Scalloped cutout</option><option value="flower">Flower cutout</option><option value="star">Star cutout</option><option value="circle">Circle cutout</option><option value="oval">Oval cutout</option><option value="hexagon">Hexagon cutout</option><option value="puzzle">Puzzle piece cutout</option><option value="torn">Torn paper cutout</option></select><label class="colorPick">Frame color <input id="scrapFrameColor" type="color" value="#b97878" onchange="app.applyFrameColor(this.value)"></label><label class="rangePick">Frame thickness <input id="scrapFrameThickness" type="range" min="0" max="24" value="6" oninput="app.applyFrameThickness(this.value)"><span id="frameThicknessValue">6px</span></label><div class="frameEffects"><label><input type="checkbox" onchange="app.applyFrameShadow(this.checked)"> Shadow</label><label><input type="checkbox" onchange="app.applyFrameGlow(this.checked)"> Glow</label><label><input type="checkbox" onchange="app.applyFrameRounded(this.checked)"> Rounded</label></div><select id="scrapLayout" onchange="app.applyLayout(this.value)"><option value="freeform">Freeform</option><option value="grid2">2-photo grid</option><option value="grid4">4-photo grid</option><option value="collage">Layered collage</option><option value="feature">Feature photo</option><option value="strip">Photo strip</option><option value="mosaic">Mosaic</option></select><div class="toolGrid"><button onclick="app.applyLayout(document.querySelector('#scrapLayout').value)">Apply Layout</button><button onclick="app.addScrapText()">Add Text</button><button onclick="app.addCollage()">Quick Collage</button><button onclick="app.toggleImageAdjust()" id="imageAdjustBtn">Adjust Photo Inside Frame</button><button onclick="app.zoomPhoto(1.12)">Photo Zoom +</button><button onclick="app.zoomPhoto(.88)">Photo Zoom −</button><button onclick="app.cropPhoto()">Cover / Fit</button><button onclick="app.centerPhoto()">Center Photo</button><button onclick="app.setPhotoShape('portrait')">Portrait Photo</button><button onclick="app.setPhotoShape('landscape')">Landscape Photo</button><button onclick="app.setPhotoShape('square')">Square Photo</button><button onclick="app.rotatePhoto()">Rotate Object</button><button onclick="app.bringForward()">Bring Forward</button><button onclick="app.sendBackward()">Send Backward</button><button onclick="app.duplicateScrapObject()">Duplicate</button><button class="danger" onclick="app.deleteScrapObject()">Remove Selected Photo/Object</button></div><div id="selectedPhotoHelp" class="selectedPhotoHelp">Tap a photo, then use Portrait, Landscape, Square, Zoom, Center, or Remove.</div><h3>Select photos</h3><button class="primary addCheckedPhotos" onclick="app.addSelectedPhoto()">Add Checked Photos to Page</button><div class="photoPicker">${photos.length?photos.map(m=>`<label><input type="checkbox" name="scrapPhoto" value="${escape(m.id)}"><img src="${escape(m.url)}" alt="${escape(m.name||'Photo')}"><span>${escape(m.name||'Photo')}</span></label>`).join(''):'<p class="muted">Add photos in Media first.</p>'}</div><button class="primary addCheckedPhotos" onclick="app.addSelectedPhoto()">Add Checked Photos to Page</button><h3>Stickers & emojis</h3><div class="scrapTools stickers">${['⭐','😀','😂','😍','❤️','🎉','🎂','🎈','👶','🍼','🐾','🐶','🐱','🏖️','🌊','⛰️','🏕️','🍹','🍻','🍽️','🚗','🏙️','🧭','🧳','🏍️','🛶','🐟','🔥','🌸','☀️','🌙'].map(e=>`<button onclick="app.addSticker('${e}')">${e}</button>`).join('')}</div><div class="saveRow"><button onclick="app.saveScrapbook()" class="primary">Finalize / Publish Page</button><button onclick="app.exportScrapPDF()">Export PDF</button></div></aside><section class="scrapStage"><div class="canvasWrap fixedCanvasWrap"><div id="scrapCanvas" class="scrapCanvas seaglass trueLayout portrait"></div></div><p class="muted canvasTip">Normal mode moves the whole object. Turn on “Adjust Photo Inside Frame” to drag the image within its cutout without moving the frame.</p></section></div></div></div><h3>Finalized scrapbook pages</h3>`+list('scrapbooks',byTrip('scrapbooks').filter(s=>s.status!=='draft'),s=>`<div id="scrap-${escape(s.id)}"><button class="textLink" onclick="app.openSavedScrap('${escape(s.id)}')"><b>${escape(s.title||'Scrapbook page')}</b></button>${s.description?`<p>${escape(s.description)}</p>`:''}<p class="muted">${new Date(s.createdAt).toLocaleString()} · finalized/locked</p>${savedScrapMarkup(s)}</div>`))},
voting(){let rows=byTrip('votes');return featureTabs()+card('Family Voting',tripPicker()+`<h3>Current voting options</h3>`+list('votes',rows,v=>{let mine=isMyVote(v);return `<b>${escape(v.category)}: ${escape(v.name)}</b><p class="muted">${escape(v.address||'')} ${v.url?` · <a href="${escape(v.url)}" target="_blank">Open link</a>`:''}</p><button class="${mine?'primary':''}" onclick="app.castVote('${v.id}')">${mine?'Your Current Vote':'Change My Vote to This Option'}</button>${mine?`<button class="danger" onclick="app.removeMyVote('${v.tripId}','${escape(v.category)}')">Remove My Vote</button>`:''}<p class="muted">Voted: ${(v.voters||[]).join(', ')||'No one yet'}</p>`})+`<h3>Add another voting option</h3>`+form('votes',[{k:'category',l:'Vote type',type:'select',options:['Dates','Location','Lodging','Activity','Restaurant']},{k:'name',l:'Voting option'},{k:'url',l:'Link for this option'},{k:'address',l:'Address / notes'}],true)+`<p><button onclick="app.go('analytics')">Open Voting Analytics</button></p>`)},
chat(){return featureTabs()+card('Family Chat',`<div class="chatWindowBar"><button class="primary" onclick="app.openChatWindow()">Open Chat in Its Own Window</button><button onclick="app.go('home')">Return to App</button></div><p class="muted">The separate chat window can remain open when you close this app page. Your browser must remain open for the window to stay active.</p><div class="chatBox">${byTrip('chats').concat(arr('chats').filter(c=>!c.tripId)).slice(0,80).map(c=>`<div class="chatMsg"><b>${escape(c.userName||'Family')}</b><p>${escape(c.text)}</p><small>${new Date(c.createdAt).toLocaleString()}</small>${canAdmin()?`<button class="chatDelete" title="Delete message" aria-label="Delete message" onclick="app.del('chats','${c.id}')">🗑️</button>`:''}</div>`).join('')}</div><div class="row"><input id="chatText" placeholder="Message the family"><button class="primary" onclick="app.sendChat()">Send</button></div>` )},
lists(){return `<div class="grid">${['meals','grocery','packing','assignments','links','voting','chat'].map(x=>`<div class="card tile" onclick="app.go('${x}')"><h2>${x}</h2><p>Open ${x} page.</p></div>`).join('')}</div>`},
history(){return card('Trip History Map',`<p class="muted">Completed trips with locations become family adventure pins.</p><iframe class="map" src="https://www.google.com/maps?q=${encodeURIComponent(tripsVisible().map(t=>t.location).filter(Boolean).join('|')||'United States')}&output=embed"></iframe>`+list('trips',tripsVisible().filter(t=>t.location),t=>`📍 <b>${escape(t.name)}</b><p class="muted">${escape(t.location)}</p>`,false))},
notifications(){let mine=arr('notifications').filter(n=>!n.user||n.user===uid);return card('My Notifications',`<div class="row"><button onclick="app.markRead()">Mark my notifications read</button><button class="danger" onclick="app.clearMyNotifications()">Clear my notifications</button></div><p class="muted">Only your notification history is shown and changed here.</p>`+list('notifications',mine,n=>`<b>${escape(n.text)}</b><p class="muted">${new Date(n.at).toLocaleString()} ${n.read?'· read':'· unread'}</p>`,false))},

assignments(){let name=currentPersonName();let rows=[...byTrip('meals').map(x=>({...x,_kind:'Meal'})),...byTrip('grocery').map(x=>({...x,_kind:'Grocery'})),...byTrip('packing').map(x=>({...x,_kind:'Packing'}))].filter(x=>{let a=Array.isArray(x.assignedTo)?x.assignedTo:(x.assignedTo?[x.assignedTo]:[]);return canAdmin()||a.includes(name)});return featureTabs()+card('Assignments',tripPicker()+`<p class="muted">A combined responsibility view. Grocery and packing remain separate in their own lists.</p>`+list('assignments',rows,x=>`<b>${escape(x._kind)} · ${escape(x.name||x.type||'Item')}</b><p class="muted">${escape(x.day||'')} ${escape(x.time||'')} · ${escape((Array.isArray(x.assignedTo)?x.assignedTo.join(', '):x.assignedTo)||'Open')}</p>`,false))},
settings(){let n=st().notifications;let perm=('Notification'in window)?Notification.permission:'unsupported';return card('Settings',`<p>Notification choices and device permission are retained locally and synchronized when signed in.</p><div class="notificationPermission"><b>Phone notifications: ${escape(perm)}</b><p class="muted">Tap Enable once on each device. After permission is granted, the app automatically creates, refreshes, verifies, and saves that device's FCM token after sign-in.</p><button class="primary" onclick="app.requestPush()">Enable Notifications</button><button onclick="app.testNotification()">Send Test Notification</button></div><div class="settingsGrid"><label><input type="checkbox" ${st().theme==='dark'?'checked':''} onchange="app.setTheme(this.checked?'dark':'light')"> Use dark theme</label>${['chat','votes','trips','lists','memories','media','admin'].map(k=>`<label><input type="checkbox" ${n[k]!==false?'checked':''} onchange="app.setNotify('${k}',this.checked)"> ${k[0].toUpperCase()+k.slice(1)} notifications</label>`).join('')}</div>${canAdmin()?`<div class="card adminUnlockCard"><h3>Admin Security</h3>${adminUnlocked?'<p>Admin controls are unlocked on this device.</p><button class="danger" onclick="app.lockAdmin()">Lock Admin</button>':'<input id="adminPin" type="password" inputmode="numeric" autocomplete="off" placeholder="Admin PIN"><button class="primary" onclick="app.unlockAdmin()">Unlock Admin</button>'}</div>`:''}`)},
analytics(){let rows=byTrip('votes');let cats=[...new Set(rows.map(v=>v.category||'General'))];return featureTabs()+card('Voting Analytics',tripPicker()+cats.map(cat=>`<h3>${escape(cat)}</h3>`+list('votes',rows.filter(v=>v.category===cat),v=>`<b>${escape(v.name)}</b><p class="muted">${(v.voters||[]).length} vote(s): ${(v.voters||[]).map(escape).join(', ')||'No votes yet'}</p>`,false)).join(''))},
messages(){return card('Group Text / Email',`<p>Select family members to send a private group text or email. This opens your phone's text/email app with the selected contacts.</p><div class="checks"><b>Recipients</b>${arr('people').map(p=>`<label><input type="checkbox" name="msgPeople" value="${escape(p.id)}"> ${p.photo?`<img src="${escape(p.photo)}" class="miniAvatar">`:''}${escape(p.name||p.email||'Family')}</label>`).join('')||'<p class="muted">Add profiles first.</p>'}</div><textarea id="msgBody" placeholder="Message"></textarea><div class="row"><button class="primary" onclick="app.sendGroupText()">Open Group Text</button><button onclick="app.sendGroupEmail()">Open Group Email</button></div>`)},
admin(){return adminIsUnlocked()?card('Admin Dashboard',`<div class="row between"><div><b>Version ${VERSION}</b><p class="muted">Security rules: ${SECURITY_RULES_VERSION}</p><p class="muted">Private-trip access blocker is active.</p><p class="muted">Account link: ${localStorage.getItem('ofa-profile-linked')==='yes'?'Profile linked to Firebase UID':'Linking after sign-in'}.</p></div><button class="danger" onclick="app.lockAdmin()">Lock Admin</button></div><div class="grid"><div><div class="formgrid"><input id="inviteEmail" type="email" placeholder="Invite email"><input id="inviteName" placeholder="Name"><select id="inviteRole"><option>Family</option><option>Guest</option><option>Child</option><option>Admin</option></select></div><button class="primary" onclick="app.createAndSendInvite()">Create & Send Invitation</button><p class="muted">This opens your phone's email app with the secure invitation link ready to send.</p></div><div class="card"><h3>Tools</h3><button onclick="app.dedupe()">Remove Duplicates</button><button onclick="app.clearActivity()">Clear Activity Log</button><button onclick="app.clearChat()">Clear Chat</button><button onclick="app.requestPush()">Enable Push Notifications</button><p class="muted">${notificationStatusText()}</p><p class="muted"><b>Sender queue:</b> ${escape(localStorage.getItem('ofa-last-queue-status')||'not tested')}${localStorage.getItem('ofa-last-queue-id')?' · '+escape(localStorage.getItem('ofa-last-queue-id')):''}</p><div class="vapidConfigured"><b>Firebase Web Push key</b><p class="muted">Configured and protected in Version ${VERSION}. Family members cannot edit or delete it.</p><code>${FCM_PUBLIC_VAPID_KEY.slice(0,18)}…${FCM_PUBLIC_VAPID_KEY.slice(-10)}</code></div><button onclick="app.saveVapidKey()">Retry device registration</button><p class="muted">Registration runs automatically after every sign-in when notification permission is granted. Each user and device receives its own token.</p><button onclick="app.testNotification()">Send on-device test notification</button><button onclick="app.exportData()">Download Backup</button><button onclick="app.migrateNow()">Run Migration</button></div><div class="card"><h3>Security</h3><p class="muted">Admin automatically locks after 15 minutes of inactivity.</p><input id="newAdminCode" type="password" inputmode="numeric" placeholder="New admin PIN"><button onclick="app.changeAdminCode()">Change Admin PIN</button></div><div class="card adminLocksCard"><h3>Admin Locks</h3>${['trips','meals','grocery','packing','links','voting','chat','media','memories','scrapbook','roles'].map(a=>`<label class="adminLockRow"><span>${a==='roles'?'Lock role editing':'Lock '+a}</span><input type="checkbox" ${locks()[a]?'checked':''} onchange="app.toggleLock('${a}')"></label>`).join('')}</div></div>`+list('invites',arr('invites'),i=>`<b>${escape(i.name||i.email)}</b><p class="muted">${escape(i.email)} · ${escape(i.role)} · ${escape(i.status||'Pending')}</p><div class="row"><button onclick="app.sendInvite('${i.id}')">Send / Resend</button><button onclick="app.copyInvite('${i.id}')">Copy Link</button></div>`)+recent()):card('Admin Locked',`<p>Enter the administrator PIN to open protected controls.</p><input id="adminPin" type="password" inputmode="numeric" autocomplete="off" placeholder="Admin PIN"><button class="primary" onclick="app.unlockAdmin()">Unlock Admin</button><p class="muted">Running version ${VERSION} · Security ${SECURITY_RULES_VERSION}</p><p class="muted">The PIN is never displayed on a user-visible page.</p>`)}
};
function readPeopleChecks(k){return [...document.querySelectorAll(`input[name="f_${k}"]:checked`)].map(x=>x.value)}

function inviteBaseUrl(){return location.origin+location.pathname.replace(/[^/]*$/,'')+'index.html?v='+VERSION}
function inviteUrl(inv){return inviteBaseUrl()+'&invite='+encodeURIComponent(inv.code)+'#login'}
function readStoredInvite(){try{return JSON.parse(localStorage.getItem('ofa-active-invite')||'null')}catch{return null}}
async function loadInviteFromUrl(){
  const code=new URLSearchParams(location.search).get('invite');if(!code)return;
  try{if(!window.firebase||!firebase.apps.length)initFirebase();const snap=await firebase.database().ref(`${basePath()}/pendingInvites`).orderByChild('code').equalTo(code).once('value');const found=Object.values(snap.val()||{})[0];if(found){activeInvite=found;localStorage.setItem('ofa-active-invite',JSON.stringify(found));location.hash='login';render();toast('Invitation found — create your account')}}catch(e){console.error(e);toast('Invitation could not be verified. Ask the sender for a new link.')}
}
async function createAndSendInvite(){
  if(!adminIsUnlocked()){toast('Unlock Admin first');return}
  const email=($('#inviteEmail')?.value||'').trim().toLowerCase(),name=($('#inviteName')?.value||'').trim(),inviteRole=$('#inviteRole')?.value||'Family';
  if(!/^\S+@\S+\.\S+$/.test(email)){toast('Enter a valid email address');return}
  let inv=arr('invites').find(i=>normIdentity(i.email)===normIdentity(email)&&i.status!=='Accepted');
  if(!inv){inv={id:id(),email,name:name||email.split('@')[0],role:inviteRole,code:(crypto.randomUUID?crypto.randomUUID():id()+id()).replace(/-/g,'').slice(0,24),status:'Pending',createdAt:Date.now(),createdBy:uid};arr('invites').unshift(inv)}else Object.assign(inv,{name:name||inv.name,role:inviteRole,status:'Pending',updatedAt:Date.now()});
  let person=arr('people').find(p=>normIdentity(p.email)===normIdentity(email));if(!person)arr('people').unshift({id:id(),name:inv.name,email,role:inviteRole,accountStatus:'Invitation sent',createdAt:Date.now()});
  save();await saveInviteDirect(inv);sendInvite(inv.id);render();
}
async function saveInviteDirect(inv){try{if(fb&&firebase.auth().currentUser)await firebase.database().ref(`${basePath()}/pendingInvites/${inv.id}`).set(inv)}catch(e){console.error(e);toast('Invitation saved locally, but Firebase write was blocked')}
}
function invitationText(inv){return `Hi ${inv.name||''},\n\nYou are invited to join Our Family Adventures. Tap this secure link and create your account using ${inv.email}:\n\n${inviteUrl(inv)}\n\nThe app will show your name; your Firebase UID stays hidden.`}
function sendInvite(inviteId){const inv=arr('invites').find(i=>i.id===inviteId);if(!inv)return;const subject=encodeURIComponent("You're invited to Our Family Adventures"),body=encodeURIComponent(invitationText(inv));inv.lastSentAt=Date.now();inv.status=inv.status==='Accepted'?'Accepted':'Invitation ready';save();location.href=`mailto:${encodeURIComponent(inv.email)}?subject=${subject}&body=${body}`;toast('Email invitation opened — tap Send in your email app')}
async function copyInvite(inviteId){const inv=arr('invites').find(i=>i.id===inviteId);if(!inv)return;try{await navigator.clipboard.writeText(inviteUrl(inv));toast('Invitation link copied')}catch{prompt('Copy this invitation link',inviteUrl(inv))}}
async function createInvitedAccount(){
 try{if(!window.firebase||!firebase.apps.length)initFirebase();const inv=activeInvite||readStoredInvite();const email=($('#loginEmail')?.value||'').trim().toLowerCase(),pass=$('#loginPass')?.value||'',name=($('#loginName')?.value||'').trim();if(!email||pass.length<6){toast('Enter your email and a password of at least 6 characters');return}if(inv&&normIdentity(inv.email)!==normIdentity(email)){toast('Use the email address that received the invitation');return}const cred=await firebase.auth().createUserWithEmailAndPassword(email,pass);if(name)await cred.user.updateProfile({displayName:name});if(inv){inv.status='Accepted';inv.uid=cred.user.uid;inv.acceptedAt=Date.now();await firebase.database().ref(`${basePath()}/pendingInvites/${inv.id}`).update({status:'Accepted',uid:cred.user.uid,acceptedAt:firebase.database.ServerValue.TIMESTAMP});localStorage.removeItem('ofa-active-invite');activeInvite=null}toast('Account created and linked to your invitation');location.hash='home'}catch(e){console.error(e);toast(e.code==='auth/email-already-in-use'?'That email already has an account. Tap Sign In instead.':(e.message||'Account could not be created'))}
}
function add(entity,keys,tripScoped){if(tripScoped&&selectedTrip&&blockUnauthorizedTrip(selectedTrip)){return}if(isLocked(entity)){toast('This area is locked by Admin');return}let obj={id:id(),createdAt:Date.now(),owner:uid};keys.forEach(k=>{let checks=document.querySelectorAll(`input[name="f_${k}"]`);obj[k]=checks.length?readPeopleChecks(k):($(`#f_${k}`)||{}).value||''});if(tripScoped)obj.tripId=selectedTrip||((tripsVisible()[0]||{}).id);if(entity==='trips'){obj.visibility=obj.visibility||'family';obj.invitees=Array.isArray(obj.invitees)?obj.invitees:[];}if(entity==='invites')obj.code=(Math.random().toString(36).slice(2,8)).toUpperCase();if(obj.private==='yes')obj.private=true;else delete obj.private;if(Array.isArray(obj.assignedTo)&&!obj.assignedTo.length)obj.assignedTo=[];let dupe=arr(entity).some(x=>keys.every(k=>(x[k]||'')===(obj[k]||''))&&(x.tripId||'')===(obj.tripId||''));if(dupe){toast('Duplicate prevented');return}arr(entity).unshift(obj);save();activity(`Added ${entity.replace(/s$/,'')}`,entity==='media'?'media':entity==='memories'?'memories':entity==='votes'?'votes':['meals','grocery','packing','links'].includes(entity)?'lists':'trips');keys.forEach(k=>{let el=$(`#f_${k}`);if(el)el.value='';document.querySelectorAll(`input[name="f_${k}"]`).forEach(c=>c.checked=false)});render()}
async function del(entity,itemId){
  const target=arr(entity).find(x=>x.id===itemId);
  if(target&&!canAccessItem(target)){toast('Access denied');return}
  if(!canAdmin()&&entity==='activity'){toast('Only Admin can delete activity');return}
  if(!confirm('Delete this item?'))return;
  if(entity==='trips'){
    const tripId=String(target?.id||itemId||'');
    if(!tripId){toast('Trip could not be identified');return}
    const user=window.firebase&&firebase.auth?firebase.auth().currentUser:null;
    if(!fb||!user){toast('Connect to Firebase and sign in before deleting a trip');return}
    const root=firebase.database().ref(basePath());
    try{
      const memberUids=new Set(resolveMemberUids(target||{}));
      if(target?.ownerUid)memberUids.add(String(target.ownerUid));
      // Read the trip's member index first. This works for the owner/admin and
      // avoids needing a broad read of every user's access index.
      try{
        const memberSnap=await root.child(`tripMembers/${tripId}`).once('value');
        Object.keys(memberSnap.val()||{}).forEach(memberUid=>memberUids.add(memberUid));
      }catch(memberErr){console.warn('Could not read trip member index before delete',memberErr)}
      // Admins can additionally find stale access entries left by older builds.
      if(canAdmin()){
        try{
          const accessSnap=await root.child('tripAccess').once('value');
          const access=accessSnap.val()||{};
          Object.keys(access).forEach(memberUid=>{
            if(access[memberUid]&&access[memberUid][tripId])memberUids.add(memberUid);
          });
        }catch(accessErr){console.warn('Could not scan stale trip access entries',accessErr)}
      }
      const updates={
        [`familyTrips/${tripId}`]:null,
        [`privateTrips/${tripId}`]:null,
        [`tripMembers/${tripId}`]:null
      };
      memberUids.forEach(memberUid=>{if(memberUid)updates[`tripAccess/${memberUid}/${tripId}`]=null});
      await root.update(updates);
      // Verify the primary trip records are truly gone before changing the UI.
      const [familyCheck,privateCheck]=await Promise.all([
        root.child(`familyTrips/${tripId}`).once('value'),
        root.child(`privateTrips/${tripId}`).once('value')
      ]);
      if(familyCheck.exists()||privateCheck.exists())throw new Error('Firebase still contains the trip after cleanup');
      TRIP_COLLECTIONS.forEach(k=>data[k]=arr(k).filter(x=>String(x.tripId||'')!==tripId));
      data.trips=arr('trips').filter(x=>String(x.id)!==tripId);
      selectedTrip=String(selectedTrip||'')===tripId?null:selectedTrip;
      delete splitState.familyTrips[tripId];
      delete splitState.privateTrips[tripId];
      localStorage.setItem(LS,JSON.stringify(data));
      activity(`Deleted trip: ${target?.name||'Trip'}`);
      render();
      toast('Trip and connected Firebase data deleted');
    }catch(e){
      console.error('Remote trip delete failed',e);
      const code=e?.code?` (${e.code})`:'';
      toast(`Trip was not deleted from Firebase${code}: ${e?.message||'Please try again'}`);
    }
    return;
  }
  data[entity]=arr(entity).filter(x=>x.id!==itemId);save();activity(`Deleted ${entity} item`);render()
}
function dedupe(){let count=0;COLS.forEach(k=>{let seen=new Set();data[k]=arr(k).filter(x=>{let sig=JSON.stringify([x.tripId,x.name,x.title,x.url,x.email,x.day,x.type,x.text]);if(seen.has(sig)){count++;return false}seen.add(sig);return true})});save();toast(`Removed ${count} duplicates`);render()}
function fileToDataURL(f){return new Promise(res=>{let r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(f)})}
async function uploadOne(f,prefix='media',tripId=selectedTrip){if(tripId&&blockUnauthorizedTrip(tripId))throw new Error('Access denied');let obj={id:id(),tripId:tripId||'',owner:uid,name:f.name,type:f.type,createdAt:Date.now()};if(fb&&window.firebase&&firebase.storage){let path=`families/${FAMILY}/${prefix}/${obj.id}-${f.name}`;let snap=await firebase.storage().ref(path).put(f);obj.url=await snap.ref.getDownloadURL()}else obj.url=await fileToDataURL(f);return obj}
async function uploadMedia(){let files=[...($('#mediaFile')?.files||[])],tripId=$('#mediaTripTag')?.value||'';if(!files.length){toast('Choose at least one photo or video');return}for(const f of files){arr('media').unshift(await uploadOne(f,'media',tripId))}save();activity(`Added ${files.length} media file(s)${tripId?' to a trip':' to shared family media'}`,'media');render()}
async function addMemory(){if(selectedTrip&&blockUnauthorizedTrip(selectedTrip))return;let files=[...($('#memFiles')?.files||[])],photos=[];let results=await Promise.allSettled(files.map(f=>uploadOne(f,'memories')));results.forEach(r=>{if(r.status==='fulfilled'){arr('media').unshift(r.value);photos.push(r.value.url)}});if(files.length&&!photos.length){toast('Photos could not be uploaded. Please try again.');return}arr('memories').unshift({id:id(),tripId:selectedTrip,owner:uid,title:$('#memTitle')?.value||'Memory',date:$('#memDate')?.value||'',text:$('#memText')?.value||'',photos,createdAt:Date.now()});save();activity(`Added memory with ${photos.length} photo${photos.length===1?'':'s'}`);if(photos.length<files.length)toast(`${photos.length} of ${files.length} photos saved. Try the missing photos again.`);render()}
async function signIn(){try{if(!window.firebase||!firebase.apps.length)initFirebase();if(!window.firebase||!firebase.apps.length){toast('Firebase is not loaded yet; local Admin saving is active');return}let e=$('#loginEmail').value.trim(),p=$('#loginPass').value;if(!e||!p){toast('Enter email and password');return}await firebase.auth().signInWithEmailAndPassword(e,p);toast('Signed in as '+role)}catch(err){console.error(err);toast(err.message||'Login failed')}}
async function signUpAdmin(){try{if(!window.firebase||!firebase.apps.length)initFirebase();if(!window.firebase||!firebase.apps.length){toast('Firebase is not loaded yet; local Admin saving is active');return}let e=$('#loginEmail').value.trim(),p=$('#loginPass').value;if(!e||!p){toast('Enter email and password');return}await firebase.auth().createUserWithEmailAndPassword(e,p);role='Admin';localStorage.setItem('ofa-role','Admin');toast('Admin login created')}catch(err){console.error(err);toast(err.message||'Could not create login')}}
async function signOut(){try{if(window.firebase&&firebase.auth)await firebase.auth().signOut();fb=false;setIdentity(null);toast('Signed out');render()}catch(e){toast('Signed out locally')}}

function editTrip(tripId){const t=arr('trips').find(x=>x.id===tripId);if(!t)return;if(!canEdit(t)){toast('You do not have permission to edit this trip');return}if(isLocked('trips')){toast('Trips are locked by Admin');return}document.querySelector('#tripEditDialog')?.remove();const dlg=document.createElement('dialog');dlg.id='tripEditDialog';dlg.className='tripEditDialog';dlg.innerHTML=`<form method="dialog" onsubmit="return false"><div class="between row"><h2>Edit trip details</h2><button type="button" onclick="document.querySelector('#tripEditDialog')?.close()">×</button></div><label>Trip name<input id="editTripName" value="${escape(t.name||'')}"></label><label>Destination / address<input id="editTripLocation" value="${escape(t.location||'')}"></label><div class="formgrid"><label>Arrival date<input id="editTripStart" type="date" value="${escape(t.start||'')}"></label><label>Departure date<input id="editTripEnd" type="date" min="${escape(t.start||'')}" value="${escape(t.end||'')}"></label></div><label>Visibility<select id="editTripVisibility"><option value="family" ${t.visibility!=='private'?'selected':''}>Family — visible to everyone</option><option value="private" ${t.visibility==='private'?'selected':''}>Private — invited users only</option></select></label><div id="editTripInvitees" class="checks"><b>Invite people to this private trip</b>${arr('people').map(person=>{const value=person.email||person.owner||person.id;const checked=(t.invitees||[]).some(v=>normIdentity(typeof v==='object'?(v.email||v.uid||v.name):v)===normIdentity(value));return `<label><input type="checkbox" value="${escape(value)}" ${checked?'checked':''}> ${escape(person.name||person.email||'Family member')}</label>`}).join('')}</div><div class="row"><button type="button" class="primary" onclick="app.saveTripEdits('${t.id}')">Save changes</button><button type="button" onclick="document.querySelector('#tripEditDialog')?.close()">Cancel</button></div></form>`;document.body.appendChild(dlg);const startInput=dlg.querySelector('#editTripStart'),endInput=dlg.querySelector('#editTripEnd');startInput?.addEventListener('change',()=>{if(endInput){endInput.min=startInput.value;if(!endInput.value||endInput.value<startInput.value)endInput.value=startInput.value;try{endInput.showPicker()}catch{}}});dlg.addEventListener('close',()=>dlg.remove(),{once:true});dlg.showModal()}
async function clearTripAccessRemote(tripId){if(!fb||!firebase.auth().currentUser)return;const root=firebase.database().ref(basePath());const snap=await root.child('tripAccess').once('value');const access=snap.val()||{};const writes=[root.child(`tripMembers/${tripId}`).remove()];Object.keys(access).forEach(memberUid=>{if(access[memberUid]&&access[memberUid][tripId])writes.push(root.child(`tripAccess/${memberUid}/${tripId}`).remove())});await Promise.allSettled(writes)}
async function saveTripEdits(tripId){const t=arr('trips').find(x=>x.id===tripId);if(!t)return;const name=$('#editTripName')?.value?.trim(),locationValue=$('#editTripLocation')?.value?.trim()||'',start=$('#editTripStart')?.value||'',end=$('#editTripEnd')?.value||'',visibility=$('#editTripVisibility')?.value||'family';if(!name){toast('Trip name is required');return}if(start&&end&&end<start){toast('Departure date cannot be before arrival date');return}const invitees=[...document.querySelectorAll('#editTripInvitees input:checked')].map(x=>x.value);Object.assign(t,{name,location:locationValue,start,end,visibility,private:visibility==='private',invitees:visibility==='private'?invitees:[],updatedAt:Date.now(),updatedBy:uid});if(visibility==='family')await clearTripAccessRemote(tripId).catch(e=>console.warn('Trip access cleanup delayed',e));save();activity(`Updated trip details: ${t.name}`);document.querySelector('#tripEditDialog')?.close();toast('Trip details updated');render()}
function pushDeviceId(){let v=localStorage.getItem('ofa-push-device-id');if(!v){v='device-'+Math.random().toString(36).slice(2,10)+Date.now().toString(36);localStorage.setItem('ofa-push-device-id',v)}return v}
function notificationStatusText(){const perm=('Notification'in window)?Notification.permission:'unsupported';const token=messagingToken||localStorage.getItem('ofa-fcm-token')||'';const preview=token?token.slice(0,10)+'…'+token.slice(-6):'none';const err=messagingError||localStorage.getItem('ofa-fcm-error')||'';const saved=localStorage.getItem('ofa-fcm-saved-at');return `Permission: ${perm} · FCM token: ${token?'saved ('+preview+')':'not saved'}${saved?' · Registered '+new Date(Number(saved)).toLocaleString():''}${err?' · Last error: '+escape(err):''}`}
async function ensureMessagingServiceWorker(){
  if(!('serviceWorker' in navigator))throw new Error('Service workers are not supported on this device');
  // Use a dedicated FCM worker so PWA caching updates cannot interrupt token registration.
  const swUrl=`./firebase-messaging-sw.js?v=${encodeURIComponent(VERSION)}`;
  let reg=await navigator.serviceWorker.getRegistration('./fcm-push/');
  if(!reg||!String(reg.active?.scriptURL||reg.installing?.scriptURL||'').includes('firebase-messaging-sw.js')){
    reg=await navigator.serviceWorker.register(swUrl,{scope:'./fcm-push/',updateViaCache:'none'});
  }
  await reg.update().catch(()=>{});
  if(reg.installing){
    await new Promise((resolve,reject)=>{
      const w=reg.installing,t=setTimeout(()=>reject(new Error('FCM service worker installation timed out')),20000);
      const done=()=>{if(w.state==='activated'){clearTimeout(t);resolve()}else if(w.state==='redundant'){clearTimeout(t);reject(new Error('FCM service worker became redundant'))}};
      w.addEventListener('statechange',done);done();
    });
  }
  if(reg.waiting){reg.waiting.postMessage({type:'SKIP_WAITING'});await new Promise(r=>setTimeout(r,750))}
  if(!reg.active){await new Promise(r=>setTimeout(r,750));reg=await navigator.serviceWorker.getRegistration('./fcm-push/')}
  if(!reg?.active)throw new Error('No active Firebase Messaging service worker is available');
  localStorage.setItem('ofa-fcm-worker',reg.active.scriptURL||swUrl);
  return reg;
}
async function registerPushToken(showMessages=true){
  try{
    messagingError='';localStorage.removeItem('ofa-fcm-error');
    const user=window.firebase?.auth?.().currentUser;
    if(!user||!user.uid)throw new Error('Sign in before registering this device');
    uid=user.uid;
    if(!window.firebase||!firebase.messaging)throw new Error('Firebase Messaging did not load');
    if(typeof firebase.messaging.isSupported==='function'&&!(await firebase.messaging.isSupported()))throw new Error('Firebase Messaging is not supported by this browser');
    if(!('Notification'in window))throw new Error('Notifications are not supported');
    if(Notification.permission!=='granted')throw new Error('Enable notification permission first');
    const reg=await ensureMessagingServiceWorker();
    messaging=messaging||firebase.messaging();
    if(typeof messaging.useServiceWorker==='function')messaging.useServiceWorker(reg);
    let token='';
    try{token=await messaging.getToken({vapidKey:FCM_PUBLIC_VAPID_KEY,serviceWorkerRegistration:reg})}
    catch(firstError){
      console.warn('Initial FCM getToken failed; retrying with a fresh push subscription',firstError);
      const existing=await reg.pushManager.getSubscription().catch(()=>null);
      if(existing)await existing.unsubscribe().catch(()=>{});
      await new Promise(r=>setTimeout(r,500));
      token=await messaging.getToken({vapidKey:FCM_PUBLIC_VAPID_KEY,serviceWorkerRegistration:reg});
    }
    if(!token)throw new Error('Firebase returned no FCM registration token');
    messagingToken=token;localStorage.setItem('ofa-fcm-token',token);
    const deviceId=pushDeviceId();
    const record={token,uid:user.uid,email:(user.email||localStorage.getItem('ofa-email')||'').toLowerCase(),deviceId,platform:navigator.userAgent,permission:Notification.permission,serviceWorkerScope:reg.scope,serviceWorkerState:reg.active?.state||'active',updatedAt:firebase.database.ServerValue.TIMESTAMP,version:VERSION,active:true,autoRegistered:true,lastSeenAt:firebase.database.ServerValue.TIMESTAMP};
    const tokenRef=firebase.database().ref(`${basePath()}/pushTokens/${user.uid}/${deviceId}`);
    await tokenRef.set(record);
    const verify=(await tokenRef.once('value')).val();
    if(!verify||verify.token!==token)throw new Error('FCM token was generated but could not be verified in Realtime Database');
    localStorage.setItem('ofa-fcm-saved-at',String(Date.now()));localStorage.removeItem('ofa-fcm-error');messagingError='';
    if(!window.__ofaForegroundMessaging){messaging.onMessage(payload=>{const n=payload.notification||{},body=n.body||payload.data?.body||'You have a new family update.';notify(body,false,uid);showDeviceNotification(body,payload.data?.tag||'ofa-foreground')});window.__ofaForegroundMessaging=true}
    if(showMessages)toast('FCM token generated and saved for this device');render();return true;
  }catch(e){
    console.error('Push registration failed',e);const code=e?.code?` [${e.code}]`:'';
    messagingError=String(e?.message||e||'Unknown registration error')+code;localStorage.setItem('ofa-fcm-error',messagingError);
    if(showMessages)toast('FCM registration failed: '+messagingError);render();return false;
  }
}
async function restorePushRegistration(){
  const user=window.firebase?.auth?.().currentUser;
  if(!user)return false;
  if(Notification.permission==='default'){
    localStorage.setItem('ofa-push-needs-permission','yes');
    return false;
  }
  if(Notification.permission!=='granted')return false;
  localStorage.removeItem('ofa-push-needs-permission');
  for(const delay of [0,1200,3500]){
    if(delay)await new Promise(r=>setTimeout(r,delay));
    if(await registerPushToken(false))return true;
  }
  return false;
}
function saveVapidKey(){if(!adminIsUnlocked()){toast('Unlock Admin first');return}localStorage.removeItem('ofa-vapid-key');if(st().vapidKey){delete st().vapidKey;save()}registerPushToken(true)}
function requestPush(){try{if(!('Notification'in window)||typeof Notification.requestPermission!=='function'){toast('Notifications are not supported in this browser');return}if(localStorage.getItem('ofa-notification-requested')==='yes'&&Notification.permission==='denied'){toast('Notifications are blocked in browser settings');return}Notification.requestPermission().then(async p=>{localStorage.setItem('ofa-notification-requested','yes');localStorage.setItem('ofa-notification-permission',p);st().deviceNotificationPermission=p;st().deviceNotificationUpdatedAt=Date.now();save();if(p==='granted'){try{let reg=await navigator.serviceWorker.ready;await reg.showNotification('Our Family Adventures notifications enabled',{body:'Notification dots or badges depend on your Android launcher settings.',icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',tag:'ofa-enabled'});}catch(_){}updateAppBadge(arr('notifications').filter(n=>(!n.user||n.user===uid)&&!n.read).length);const ok=await registerPushToken(true);toast(ok?'Notifications enabled and this device is registered':'Notifications allowed, but device registration needs attention. See the error below.')}else toast('Notifications were not enabled')}).catch(()=>toast('Notifications were not enabled'))}catch(e){toast('Notifications are not supported on this browser')}}
async function testNotification(){
  if(Notification.permission!=='granted'){toast('Enable browser notifications first');return}
  const user=window.firebase?.auth?.().currentUser;
  if(!user||!validFirebaseUid(user.uid)){toast('Sign in before sending a push test');return}
  const text='Real push test from Our Family Adventures';
  const n={id:id(),text,at:Date.now(),read:false,user:user.uid,kind:'admin',url:notificationUrl('notifications')};
  arr('notifications').unshift(n);
  data.notifications=data.notifications.slice(0,240);
  save();
  toast('Creating notification queue…');
  const result=await queuePushNotification([user.uid],text,'admin',{notificationId:n.id,skipInAppFor:user.uid,url:n.url,title:'Our Family Adventures test'});
  if(result?.ok){
    toast('Push queued successfully. Minimize the app for the phone banner.');
  }else{
    toast(result?.error||'Push could not be queued');
  }
  render();
}
function markRead(){arr('notifications').filter(n=>!n.user||n.user===uid).forEach(n=>n.read=true);updateAppBadge(0);save();render()}
function clearMyNotifications(){data.notifications=arr('notifications').filter(n=>n.user&&n.user!==uid);updateAppBadge(0);save();render()}
function changeAdminCode(){if(!canAdmin())return;let c=$('#newAdminCode')?.value?.trim();if(!/^\d{4,12}$/.test(c||'')){toast('Use a 4–12 digit code');return}st().adminCode=c;save();toast('Admin code changed')}
function setRsvp(status){if(selectedTrip&&blockUnauthorizedTrip(selectedTrip))return;let name=currentPersonName(),rows=arr('rsvps');let existing=rows.find(r=>r.tripId===selectedTrip&&r.user===uid);if(existing)Object.assign(existing,{status,name,updatedAt:Date.now()});else rows.unshift({id:id(),tripId:selectedTrip,user:uid,owner:uid,name,status,createdAt:Date.now()});save();activity('Updated RSVP');render()}
function install(){if(deferredInstall){deferredInstall.prompt();deferredInstall=null}else toast('Use browser menu: Add to Home screen')}
function exportTripPDF(){
  const t=trip();
  if(!t){toast('Open a trip before exporting');return}
  if(blockUnauthorizedTrip(t.id))return;
  const safe=v=>String(v??'').replace(/\s+/g,' ').trim();
  const names=v=>Array.isArray(v)?v.join(', '):safe(v);
  const money=v=>`$${Number(v||0).toFixed(2)}`;
  const sections=[];
  const addSection=(title,rows)=>{rows=(rows||[]).filter(Boolean);if(rows.length)sections.push({title,rows})};
  const dateRange=[safe(t.start),safe(t.end)].filter(Boolean).join(' to ')||'Dates not added';
  addSection('Trip Overview',[
    `Destination: ${safe(t.location)||'Not added'}`,
    `Dates: ${dateRange}`,
    `Visibility: ${t.visibility==='private'?'Private - invited users only':'Family'}`,
    t.notes?`Notes: ${safe(t.notes)}`:''
  ]);
  addSection('Attendees',byTrip('attendees').map(x=>names(x.people)||names(x.assignedTo)||safe(x.name)));
  addSection('RSVP',byTrip('rsvps').map(x=>`${safe(x.name)||'Family member'}: ${safe(x.status)||'No response'}`));
  addSection('Itinerary',byTrip('itinerary').map(x=>`${safe(x.date)} ${safe(x.time)} - ${safe(x.name)}${x.location?' | '+safe(x.location):''}${x.notes?' | '+safe(x.notes):''}`));
  addSection('Reservations',byTrip('reservations').map(x=>`${safe(x.name)}${x.date?' | '+safe(x.date):''}${x.time?' '+safe(x.time):''}${x.confirmation?' | Confirmation: '+safe(x.confirmation):''}${x.url?' | '+safe(x.url):''}`));
  addSection('Meals',byTrip('meals').map(x=>`${safe(x.day)} ${safe(x.type)} - ${safe(x.name)}${x.time?' | '+safe(x.time):''}${x.address?' | '+safe(x.address):''}${x.assignedTo?' | Assigned: '+names(x.assignedTo):''}`));
  addSection('Grocery List',byTrip('grocery').map(x=>`${x.done?'[x]':'[ ]'} ${safe(x.name)}${x.qty?' - '+safe(x.qty):''}${x.assignedTo?' | Assigned: '+names(x.assignedTo):''}`));
  addSection('Packing List',byTrip('packing').map(x=>`${x.done?'[x]':'[ ]'} ${safe(x.name)}${x.assignedTo?' | Assigned: '+names(x.assignedTo):''}`));
  const budget=byTrip('budgets');
  addSection('Budget',[
    ...budget.map(x=>`${safe(x.name)} - ${money(x.amount)}${x.paidBy?' | Paid by: '+names(x.paidBy):''}${x.notes?' | '+safe(x.notes):''}`),
    budget.length?`Total: ${money(budget.reduce((sum,x)=>sum+Number(x.amount||0),0))}`:''
  ]);
  addSection('Travel Links',byTrip('links').map(x=>`${safe(x.type)||'Link'}: ${safe(x.name)}${x.address?' | '+safe(x.address):''}${x.url?' | '+safe(x.url):''}`));
  addSection('Memories',byTrip('memories').map(x=>`${safe(x.date)} - ${safe(x.title)}${x.text?' | '+safe(x.text):''}`));

  const filename=(safe(t.name)||'trip').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()+ '-details.pdf';
  try{
    if(window.jspdf?.jsPDF){
      const {jsPDF}=window.jspdf;
      const doc=new jsPDF({unit:'pt',format:'letter'});
      const margin=48,pageW=doc.internal.pageSize.getWidth(),pageH=doc.internal.pageSize.getHeight(),maxW=pageW-margin*2;
      let y=54;
      const newPage=needed=>{if(y+needed>pageH-48){doc.addPage();y=54}};
      doc.setFont('helvetica','bold');doc.setFontSize(20);doc.text(safe(t.name)||'Trip Details',margin,y);y+=24;
      doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(`Our Family Adventures - Version ${VERSION}`,margin,y);y+=24;
      sections.forEach(sec=>{
        newPage(40);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text(sec.title,margin,y);y+=18;
        doc.setFont('helvetica','normal');doc.setFontSize(10);
        sec.rows.forEach(row=>{
          const lines=doc.splitTextToSize(`• ${safe(row)}`,maxW);
          newPage(lines.length*14+6);doc.text(lines,margin,y);y+=lines.length*14+5;
        });
        y+=8;
      });
      doc.save(filename);toast('Trip PDF downloaded');activity(`Exported ${safe(t.name)} trip PDF`);return;
    }
  }catch(err){console.error('PDF export failed',err)}
  const escHtml=v=>safe(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(t.name)} Trip Details</title><style>body{font-family:Arial,sans-serif;margin:36px;color:#222}h1{margin-bottom:4px}h2{margin-top:24px;border-bottom:1px solid #bbb;padding-bottom:5px}li{margin:7px 0;line-height:1.35}.meta{color:#666;font-size:12px}@media print{button{display:none}}</style></head><body><h1>${escHtml(t.name||'Trip Details')}</h1><div class="meta">Our Family Adventures - Version ${VERSION}</div>${sections.map(sec=>`<h2>${escHtml(sec.title)}</h2><ul>${sec.rows.map(r=>`<li>${escHtml(r)}</li>`).join('')}</ul>`).join('')}<button onclick="window.print()">Save as PDF / Print</button><script>setTimeout(()=>window.print(),300)<\/script></body></html>`;
  const w=window.open('','_blank');
  if(!w){toast('Allow pop-ups, then try Export Trip PDF again');return}
  w.document.open();w.document.write(html);w.document.close();
}
function exportData(){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='our-family-adventures-backup-9.0.2.json';a.click()}
function importClick(){$('#importFile').click();$('#importFile').onchange=e=>{let f=e.target.files[0];let r=new FileReader();r.onload=()=>{data=Object.assign(blank(),JSON.parse(r.result));migrate(false);save();toast('Backup imported')};r.readAsText(f)}}
async function loadTripWeather(){let box=document.querySelectorAll('#tripWeather');if(!box.length)return;let t=trip(),place=t?.location||t?.name||'York PA';try{let r=await fetch(`https://wttr.in/${encodeURIComponent(place)}?format=j1`);if(!r.ok)throw new Error('weather');let j=await r.json(),c=j.current_condition?.[0]||{},days=(j.weather||[]).slice(0,4);let html=`<div class="weatherNow"><b>${escape(place)}</b><strong>${escape(c.temp_F||'--')}°F</strong><span>${escape(c.weatherDesc?.[0]?.value||'')}</span><small>Feels like ${escape(c.FeelsLikeF||'--')}° · Humidity ${escape(c.humidity||'--')}%</small></div><div class="forecastDays">${days.map(d=>`<div><b>${new Date(d.date+'T12:00:00').toLocaleDateString(undefined,{weekday:'short'})}</b><span>${escape(d.maxtempF||'--')}° / ${escape(d.mintempF||'--')}°</span><small>${escape(d.hourly?.[4]?.weatherDesc?.[0]?.value||'Forecast')}</small></div>`).join('')}</div>`;box.forEach(x=>x.innerHTML=html)}catch(e){box.forEach(x=>x.innerHTML=`<p class="muted">Live weather could not load. Confirm the trip destination and internet connection.</p><a class="buttonLike" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(place+' weather')}">Open weather forecast</a>`)}}
function savedScrapMarkup(s){let objs=s.objects||[],bg=escape(s.background||'seaglass'),orientation=escape(s.orientation||'portrait');return `<div class="savedScrapViewport"><div class="savedScrapCanvas ${bg} ${orientation}">${objs.map(o=>`<div class="savedScrapObj ${o.sticker?'stickerObj':''}" style="left:${Number(o.x)||0}px;top:${Number(o.y)||0}px;width:${Number(o.w)||100}px;height:${Number(o.h)||100}px;z-index:${Number(o.z)||1};transform:rotate(${Number(o.rot)||0}deg)"><div class="scrapContent frame-${escape(o.frame||'nofill')} cutout-${escape(o.cutout||'none')}" style="--frame-color:${escape(o.frameColor||'#b97878')};--frame-thickness:${Number(o.frameThickness??6)}px">${o.img?`<img src="${escape(o.img)}" style="object-fit:${escape(o.fit||'cover')};transform:translate(${Number(o.imgX)||0}px,${Number(o.imgY)||0}px) scale(${Number(o.zoom)||1})">`:`<span style="font-size:${Math.max(24,Math.min(Number(o.w)||72,Number(o.h)||72)*.68)}px">${escape(o.text||'')}</span>`}</div></div>`).join('')}</div></div>`}
function setScrapBg(v){let c=$('#scrapCanvas');if(c){let orientation=c.classList.contains('landscape')?'landscape':'portrait';c.className='scrapCanvas trueLayout '+orientation+' '+v}}
function setScrapOrientation(v){let c=$('#scrapCanvas');if(!c)return;c.classList.remove('portrait','landscape');c.classList.add(v==='landscape'?'landscape':'portrait');window.scrapOrientation=v==='landscape'?'landscape':'portrait';drawScrap()}
function fitScrapCanvas(){
  const c=$('#scrapCanvas'),wrap=c?.closest('.fixedCanvasWrap');
  if(!c||!wrap)return;
  const landscape=c.classList.contains('landscape');
  const baseW=landscape?880:680,baseH=landscape?680:880;
  let scale=1;
  if(matchMedia('(max-width:820px)').matches){
    const availableW=Math.max(240,wrap.clientWidth-20);
    const availableH=Math.max(240,wrap.clientHeight-20);
    scale=Math.min(1,availableW/baseW,availableH/baseH);
  }
  c.dataset.fitScale=String(scale);
  c.style.zoom=String(scale);
}
function openScrapEditor(){document.querySelector('#drawer')?.classList.remove('open');let p=$('#scrapEditorPanel');if(!p)return;p.classList.add('open');p.setAttribute('aria-hidden','false');document.body.classList.add('scrapEditing');if(!scrapObjs().length)loadScrapDraft();setTimeout(()=>{drawScrap();fitScrapCanvas();document.querySelector('.scrapSidebar')?.scrollTo({top:0})},40)}
function closeScrapEditor(){saveScrapDraft(true);let p=$('#scrapEditorPanel');if(!p)return;p.classList.remove('open');p.setAttribute('aria-hidden','true');document.body.classList.remove('scrapEditing')}
function openSavedScrap(scrapId){setRoute('scrapbook',selectedTrip);setTimeout(()=>{let el=$('#scrap-'+CSS.escape(scrapId));if(el)el.scrollIntoView({behavior:'smooth',block:'start'})},100)}
function scrapObjs(){window.scrapObjs=window.scrapObjs||[];return window.scrapObjs}
function currentDraft(){
  return arr('scrapbooks').find(x=>x.status==='draft'&&x.tripId===(selectedTrip||'')&&(x.owner===uid||x.createdBy===uid));
}
function loadScrapDraft(){
  const d=currentDraft();
  if(!d){window.scrapObjs=[];window.selectedScrapObj=null;return null}
  window.scrapObjs=JSON.parse(JSON.stringify(Array.isArray(d.objects)?d.objects:[]));
  window.selectedScrapObj=null;
  window.scrapOrientation=d.orientation||'portrait';
  setTimeout(()=>{
    const title=$('#scrapTitle'),desc=$('#scrapDescription'),bg=$('#scrapBg'),ori=$('#scrapOrientation');
    if(title)title.value=d.title||'';
    if(desc)desc.value=d.description||'';
    if(bg)bg.value=d.background||'seaglass';
    if(ori)ori.value=d.orientation||'portrait';
    setScrapOrientation(d.orientation||'portrait',true);
    setScrapBg(d.background||'seaglass',true);
  },0);
  return d;
}
function saveScrapDraft(silent=false){
  if(route!=='scrapbook'&&!document.body.classList.contains('scrapEditing'))return null;
  const objects=JSON.parse(JSON.stringify(scrapObjs()));
  const title=$('#scrapTitle')?.value?.trim()||'Untitled scrapbook draft';
  const description=$('#scrapDescription')?.value?.trim()||'';
  const background=$('#scrapBg')?.value||'seaglass';
  const orientation=window.scrapOrientation||$('#scrapOrientation')?.value||'portrait';
  let d=currentDraft();
  if(!d){
    d={id:id(),tripId:selectedTrip||'',owner:uid,createdBy:uid,status:'draft',createdAt:Date.now()};
    arr('scrapbooks').unshift(d);
  }
  Object.assign(d,{title,description,background,orientation,objects,updatedAt:Date.now(),status:'draft'});
  save();
  if(!silent)toast('Draft saved');
  return d;
}
function drawScrap(){let c=$('#scrapCanvas');if(!c)return;c.innerHTML='';let cw=c.classList.contains('landscape')?880:680,ch=c.classList.contains('landscape')?680:880;scrapObjs().forEach(o=>{o.imgX=Number(o.imgX)||0;o.imgY=Number(o.imgY)||0;o.frameThickness=Number(o.frameThickness??6);o.w=Math.max(48,Math.min(Number(o.w)||180,cw));o.h=Math.max(48,Math.min(Number(o.h)||160,ch));o.x=Math.max(0,Math.min(Number(o.x)||0,cw-o.w));o.y=Math.max(0,Math.min(Number(o.y)||0,ch-o.h));let d=document.createElement('div');d.className='scrapObj'+(o.sticker?' stickerObj':'')+(o.shadow?' frameShadow':'')+(o.glow?' frameGlow':'')+(o.rounded?' frameRounded':'');Object.assign(d.style,{left:o.x+'px',top:o.y+'px',width:o.w+'px',height:o.h+'px',zIndex:o.z||1,transform:`rotate(${o.rot||0}deg)`});let inner=document.createElement('div');inner.className='scrapContent frame-'+(o.frame||'nofill')+' cutout-'+(o.cutout||'none')+(o.shadow?' frameShadow':'')+(o.glow?' frameGlow':'')+(o.rounded?' frameRounded':'');inner.style.setProperty('--frame-color',o.frameColor||'#b97878');inner.style.setProperty('--frame-thickness',(o.frameThickness??6)+'px');if(o.img)inner.innerHTML=`<img src="${o.img}" alt="photo" draggable="false" style="object-fit:${o.fit||'cover'};transform:translate(${o.imgX||0}px,${o.imgY||0}px) scale(${o.zoom||1})">`;else inner.innerHTML=`<span contenteditable="${o.sticker?'false':'true'}" style="font-size:${Math.max(24,Math.min(o.w,o.h)*.68)}px">${escape(o.text||'Text')}</span>`;d.appendChild(inner);d.insertAdjacentHTML('beforeend',['nw','n','ne','e','se','s','sw','w'].map(h=>`<i class="resizeHandle ${h}" data-h="${h}"></i>`).join('')+`<i class="rotateHandle" data-rotate="1">↻</i>`);d.onclick=(ev)=>{ev.stopPropagation();window.selectedScrapObj=o;document.querySelectorAll('.scrapObj').forEach(x=>x.classList.remove('selected'));d.classList.add('selected');let help=$('#selectedPhotoHelp');if(help)help.textContent=o.img?'Photo selected — choose Portrait, Landscape, Square, Zoom, Center, Adjust Inside Frame, or Remove.':'Sticker/text selected — resize, rotate, layer, or remove.'};c.appendChild(d);makeDrag(d,o)});c.onclick=()=>{window.selectedScrapObj=null;document.querySelectorAll('.scrapObj').forEach(x=>x.classList.remove('selected'));let help=$('#selectedPhotoHelp');if(help)help.textContent='Tap a photo, then use Portrait, Landscape, Square, Zoom, Center, or Remove.'};requestAnimationFrame(fitScrapCanvas)}
function makeDrag(el,o){let start,mode='move',handle='';el.onpointerdown=e=>{handle=e.target.dataset.h||'';mode=e.target.dataset.rotate?'rotate':handle?'resize':(window.scrapImageAdjust&&o.img?'panimage':'move');let r=el.getBoundingClientRect();start={x:e.clientX,y:e.clientY,ox:o.x,oy:o.y,ow:o.w,oh:o.h,imgX:o.imgX||0,imgY:o.imgY||0,cx:r.left+r.width/2,cy:r.top+r.height/2};o.z=Date.now();window.selectedScrapObj=o;document.querySelectorAll('.scrapObj').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');el.setPointerCapture(e.pointerId);e.preventDefault()};el.onpointermove=e=>{if(!start)return;let scale=Number($('#scrapCanvas')?.dataset.fitScale||1)||1,dx=(e.clientX-start.x)/scale,dy=(e.clientY-start.y)/scale;if(mode==='rotate'){o.rot=Math.atan2(e.clientY-start.cy,e.clientX-start.cx)*180/Math.PI+90;el.style.transform=`rotate(${o.rot}deg)`;return}if(mode==='panimage'){o.imgX=start.imgX+dx;o.imgY=start.imgY+dy;let img=el.querySelector('img');if(img)img.style.transform=`translate(${o.imgX}px,${o.imgY}px) scale(${o.zoom||1})`;return}let canvas=$('#scrapCanvas'),cw=canvas?.clientWidth||680,ch=canvas?.clientHeight||760;if(mode==='move'){o.x=Math.min(Math.max(0,start.ox+dx),Math.max(0,cw-o.w));o.y=Math.min(Math.max(0,start.oy+dy),Math.max(0,ch-o.h))}else{if(handle.includes('e'))o.w=Math.min(Math.max(40,start.ow+dx),cw-o.x);if(handle.includes('s'))o.h=Math.min(Math.max(40,start.oh+dy),ch-o.y);if(handle.includes('w')){let nw=Math.max(40,start.ow-dx);o.x=Math.max(0,Math.min(start.ox+dx,start.ox+start.ow-40));o.w=Math.min(nw,start.ox+start.ow)}if(handle.includes('n')){let nh=Math.max(40,start.oh-dy);o.y=Math.max(0,Math.min(start.oy+dy,start.oy+start.oh-40));o.h=Math.min(nh,start.oy+start.oh)}}Object.assign(el.style,{left:o.x+'px',top:o.y+'px',width:o.w+'px',height:o.h+'px'})};el.onpointerup=()=>{start=null;saveScrapDraft(true)}}
function addScrapText(){let c=$('#scrapCanvas'),cw=c?.clientWidth||680,ch=c?.clientHeight||880,w=190,h=90;scrapObjs().push({text:'Family memory',x:(cw-w)/2,y:(ch-h)/2,w,h,z:Date.now()});drawScrap();saveScrapDraft(true)}
function addSticker(s){let c=$('#scrapCanvas'),cw=c?.clientWidth||680,ch=c?.clientHeight||880,w=72,h=72;scrapObjs().push({text:s,x:(cw-w)/2,y:(ch-h)/2,w,h,z:Date.now(),sticker:true,frame:'nofill'});drawScrap();saveScrapDraft(true)}
function addSelectedPhoto(){let sel=[...document.querySelectorAll('input[name="scrapPhoto"]:checked')].map(o=>o.value);let added=0;sel.forEach((mid,i)=>{let m=arr('media').find(x=>x.id===mid);if(m&&m.url){scrapObjs().push({img:m.url,frame:$('#scrapFrame')?.value||'nofill',cutout:$('#scrapCutout')?.value||'none',frameColor:$('#scrapFrameColor')?.value||'#b97878',frameThickness:Number($('#scrapFrameThickness')?.value||6),imgX:0,imgY:0,x:(($('#scrapCanvas')?.clientWidth||680)-210)/2+(i*12),y:(($('#scrapCanvas')?.clientHeight||880)-165)/2+(i*12),w:210,h:165,z:Date.now()+i,fit:'cover',zoom:1,rot:0});added++}});if(!added){toast('Select at least one photo');return}drawScrap();saveScrapDraft(true)}
function toggleAssignment(entity,itemId,name){let x=arr(entity).find(y=>y.id===itemId);if(!x)return;let a=Array.isArray(x.assignedTo)?[...x.assignedTo]:(x.assignedTo?[x.assignedTo]:[]);x.assignedTo=a.includes(name)?a.filter(n=>n!==name):[...a,name];save();activity(`Updated ${entity} responsibility`);render()}

function frameTargets(){let all=$('#applyFrameAll')?.checked;return all?scrapObjs().filter(o=>o.img):(window.selectedScrapObj?.img?[window.selectedScrapObj]:[])}
function requireFrameTargets(){let targets=frameTargets();if(!targets.length)toast('Tap a photo first, or choose Apply to every photo');return targets}
function applyFrame(v){let targets=requireFrameTargets();if(!targets.length)return;targets.forEach(o=>o.frame=v);drawScrap();saveScrapDraft(true)}
function applyFrameColor(v){let targets=requireFrameTargets();if(!targets.length)return;targets.forEach(o=>o.frameColor=v);drawScrap();saveScrapDraft(true)}
function applyFrameThickness(v){let out=$('#frameThicknessValue');if(out)out.textContent=v+'px';let targets=frameTargets();if(!targets.length)return;targets.forEach(o=>o.frameThickness=Number(v));drawScrap();saveScrapDraft(true)}
function duplicateScrapObject(){let o=window.selectedScrapObj;if(!o){toast('Tap an object first');return}let c=JSON.parse(JSON.stringify(o));c.x=Math.min((o.x||0)+24,Math.max(0,($('#scrapCanvas')?.clientWidth||680)-(o.w||180)));c.y=Math.min((o.y||0)+24,Math.max(0,($('#scrapCanvas')?.clientHeight||880)-(o.h||160)));c.z=Date.now();scrapObjs().push(c);window.selectedScrapObj=c;drawScrap();saveScrapDraft(true)}
function applyFrameShadow(v=true){let targets=requireFrameTargets();if(!targets.length)return;targets.forEach(o=>o.shadow=typeof v==='boolean'?v:!o.shadow);drawScrap();saveScrapDraft(true)}
function applyFrameGlow(v=true){let targets=requireFrameTargets();if(!targets.length)return;targets.forEach(o=>o.glow=typeof v==='boolean'?v:!o.glow);drawScrap();saveScrapDraft(true)}
function applyFrameRounded(v=true){let targets=requireFrameTargets();if(!targets.length)return;targets.forEach(o=>o.rounded=typeof v==='boolean'?v:!o.rounded);drawScrap();saveScrapDraft(true)}
function toggleImageAdjust(){window.scrapImageAdjust=!window.scrapImageAdjust;let b=$('#imageAdjustBtn');if(b){b.classList.toggle('active',!!window.scrapImageAdjust);b.textContent=window.scrapImageAdjust?'Adjusting Photo — Drag Image':'Adjust Photo Inside Frame'}toast(window.scrapImageAdjust?'Drag the photo inside its frame':'Object move mode restored')}
function centerPhoto(){let o=window.selectedScrapObj;if(!o||!o.img){toast('Tap a photo first');return}o.imgX=0;o.imgY=0;drawScrap()}
function applyCutout(v){let targets=requireFrameTargets();if(!targets.length)return;targets.forEach(o=>o.cutout=v);drawScrap();saveScrapDraft(true)}
function volunteer(entity,itemId){let x=arr(entity).find(y=>y.id===itemId);if(!x)return;let name=currentPersonName();let names=Array.isArray(x.assignedTo)?x.assignedTo:(x.assignedTo?[x.assignedTo]:[]);if(names.includes(name))names=names.filter(n=>n!==name);else names.push(name);x.assignedTo=names;save();activity(`${name} updated responsibility for ${entity}`);render()}
function addCollage(){let imgs=byTrip('media').filter(m=>m.url&&String(m.type||'').startsWith('image')).slice(0,4);if(!imgs.length){toast('Add photos in Media first');return}let spots=[[40,40],[270,40],[40,250],[270,250]];imgs.forEach((m,i)=>scrapObjs().push({img:m.url,frame:'soft',x:spots[i][0],y:spots[i][1],w:210,h:190,z:Date.now()+i,fit:'cover',zoom:1,rot:0}));drawScrap()}
function applyLayout(kind){let photos=scrapObjs().filter(o=>o.img);if(!photos.length){toast('Add photos first');return}let spots=[];if(kind==='grid2')spots=[[35,85,285,260],[360,85,285,260]];else if(kind==='grid4')spots=[[30,55,290,300],[360,55,290,300],[30,390,290,300],[360,390,290,300]];else if(kind==='feature')spots=[[55,55,570,440],[55,525,175,170],[252,525,175,170],[450,525,175,170]];else if(kind==='collage')spots=[[45,60,330,260],[330,120,300,240],[80,350,280,230],[345,410,285,230]];else if(kind==='strip')spots=[[25,80,200,560],[240,80,200,560],[455,80,200,560]];else if(kind==='mosaic')spots=[[25,40,390,300],[430,40,220,300],[25,355,220,360],[260,355,390,360]];else return;photos.slice(0,spots.length).forEach((o,i)=>{let [x,y,w,h]=spots[i];Object.assign(o,{x,y,w,h,rot:kind==='collage'?[-5,4,3,-4][i]||0:0,z:Date.now()+i})});drawScrap()}
function sendBackward(){let o=window.selectedScrapObj;if(!o){toast('Tap an object first');return}o.z=Math.max(1,(o.z||1)-100000);drawScrap()}
function deleteScrapObject(){let o=window.selectedScrapObj;if(!o){toast('Tap an object first');return}window.scrapObjs=scrapObjs().filter(x=>x!==o);window.selectedScrapObj=null;drawScrap()}
function canvasZoom(f){let c=$('#scrapCanvas');if(!c)return;let z=Number(c.dataset.zoom||1)*f;z=Math.min(2.5,Math.max(.35,z));c.dataset.zoom=z;c.style.transform=`scale(${z})`;c.style.transformOrigin='top left'}
function exportScrapPDF(){let c=$('#scrapCanvas');if(!c)return;let w=window.open('','_blank');if(!w){toast('Allow popups to export PDF');return}let clone=c.cloneNode(true);clone.querySelectorAll('.resizeHandle,.rotateHandle').forEach(h=>h.remove());clone.querySelectorAll('[contenteditable]').forEach(x=>x.removeAttribute('contenteditable'));w.document.write(`<!doctype html><html><head><title>Scrapbook PDF</title><link rel="stylesheet" href="${location.origin+location.pathname.replace(/[^/]+$/,'')}style.css"><style>body{margin:0;background:white}.scrapCanvas{margin:0;box-shadow:none;transform:none!important}@page{size:letter ${window.scrapOrientation==='landscape'?'landscape':'portrait'};margin:.25in}.handle{display:none}</style></head><body>${clone.outerHTML}<script>onload=()=>setTimeout(()=>print(),400)<\/script></body></html>`);w.document.close()}
function saveScrapbook(){let title=$('#scrapTitle')?.value?.trim();if(!title){toast('Add a page name before finalizing');$('#scrapTitle')?.focus();return}let d=currentDraft();let page={id:d?.id||id(),tripId:selectedTrip,owner:uid,title,description:$('#scrapDescription')?.value?.trim()||'',background:$('#scrapBg')?.value||'seaglass',orientation:window.scrapOrientation||$('#scrapOrientation')?.value||'portrait',objects:JSON.parse(JSON.stringify(scrapObjs())),status:'published',locked:true,createdAt:d?.createdAt||Date.now(),publishedAt:Date.now()};if(d)Object.assign(d,page);else arr('scrapbooks').unshift(page);window.scrapObjs=[];window.selectedScrapObj=null;closeScrapEditor();save();activity('Published scrapbook page: '+title);render()}
function sendChat(){if(selectedTrip&&blockUnauthorizedTrip(selectedTrip))return;let text=$('#chatText')?.value?.trim(); if(!text)return;arr('chats').unshift({id:id(),tripId:selectedTrip||'',text,user:uid,userName:canAdmin()?'Melissa/Admin':'Family',createdAt:Date.now()});save();notifyFamily('New group chat message','chat');render()}
function voteAliases(){
  let name=currentPersonName(),email=(localStorage.getItem('ofa-email')||'').trim();
  let aliases=[uid,email,name,role==='Admin'?'Melissa/Admin':'',canAdmin()?'Melissa':'']
    .filter(Boolean).map(v=>String(v).trim().toLowerCase());
  return [...new Set(aliases)];
}
function isMyVote(v){
  let aliases=voteAliases();
  let ids=(v.voterIds||[]).map(x=>String(x).trim().toLowerCase());
  let names=(v.voters||[]).map(x=>String(x).trim().toLowerCase());
  return aliases.some(a=>ids.includes(a)||names.includes(a));
}
function clearMyVoteFromCategory(tripId,category){
  let aliases=voteAliases();
  arr('votes').filter(x=>x.tripId===tripId&&String(x.category||'')===String(category||'')).forEach(x=>{
    x.voterIds=(x.voterIds||[]).filter(i=>!aliases.includes(String(i).trim().toLowerCase()));
    x.voters=(x.voters||[]).filter(n=>!aliases.includes(String(n).trim().toLowerCase()));
  });
}
function removeMyVote(tripId,category){
  clearMyVoteFromCategory(tripId,category);save();activity('Removed vote from '+category);toast('Your vote was removed');render();
}
function castVote(voteId){
  let v=arr('votes').find(x=>x.id===voteId);if(!v)return;
  clearMyVoteFromCategory(v.tripId,v.category);
  let name=currentPersonName(),email=(localStorage.getItem('ofa-email')||'').trim(),identity=email||uid||name;
  v.voterIds=Array.isArray(v.voterIds)?v.voterIds:[];v.voters=Array.isArray(v.voters)?v.voters:[];
  v.voterIds.push(identity);v.voters.push(name);
  v.voterIds=[...new Set(v.voterIds)];v.voters=[...new Set(v.voters)];
  save();activity('Changed vote to '+(v.name||'selected option'));toast('Your previous vote was removed and your new vote was saved');render();
}

async function addProfile(){let obj={id:id(),name:$('#f_name')?.value||'',email:$('#f_email')?.value||'',phone:$('#f_phone')?.value||'',owner:uid,createdAt:Date.now()};let f=$('#profilePhoto')?.files?.[0];if(f)obj.photo=await fileToDataURL(f);let existing=arr('people').find(p=>(obj.email&&p.email===obj.email)||p.owner===uid&&p.name===obj.name);if(existing)Object.assign(existing,obj,{id:existing.id});else arr('people').unshift(obj);save();activity('Updated profile');render()}
function editProfile(pid){let p=arr('people').find(x=>x.id===pid);if(!p)return;let name=prompt('Name',p.name||'');if(name===null)return;let email=prompt('Email',p.email||'');if(email===null)return;let phone=prompt('Phone',p.phone||'');if(phone===null)return;Object.assign(p,{name,email,phone,updatedAt:Date.now()});save();activity('Updated profile');render()}
function zoomPhoto(factor){let o=window.selectedScrapObj;if(!o||!o.img){toast('Tap a photo first');return}o.zoom=(o.zoom||1)*factor;drawScrap()}
function cropPhoto(){let o=window.selectedScrapObj;if(!o||!o.img){toast('Tap a photo first');return}o.fit=o.fit==='cover'?'contain':'cover';drawScrap()}
function setPhotoShape(shape){let o=window.selectedScrapObj;if(!o||!o.img){toast('Tap a photo first');return}if(shape==='portrait'){o.w=Math.max(150,Math.min(o.w||220,300));o.h=Math.max(230,Math.round(o.w*1.35))}else if(shape==='landscape'){o.h=Math.max(140,Math.min(o.h||190,260));o.w=Math.max(240,Math.round(o.h*1.5))}else{o.w=o.h=Math.max(170,Math.min(Math.max(o.w||180,o.h||180),300))}o.fit='cover';drawScrap();toast(shape[0].toUpperCase()+shape.slice(1)+' photo layout applied')}


async function changeProfilePhoto(pid,file){let p=arr('people').find(x=>x.id===pid);if(!p||!file)return;p.photo=await fileToDataURL(file);p.updatedAt=Date.now();save();activity('Changed profile photo');render()}
function setTheme(v){st().theme=v;save();render()}
function setNotify(k,v){st().notifications[k]=v;save();toast('Settings saved')}
function rotatePhoto(){let o=window.selectedScrapObj;if(!o){toast('Tap an object first');return}o.rot=((o.rot||0)+15)%360;drawScrap()}
function bringForward(){let o=window.selectedScrapObj;if(!o){toast('Tap an object first');return}o.z=Date.now();drawScrap()}
function selectedMsgPeople(){return [...document.querySelectorAll('input[name="msgPeople"]:checked')].map(i=>arr('people').find(p=>p.id===i.value)).filter(Boolean)}
function sendGroupText(){let ps=selectedMsgPeople(),body=encodeURIComponent($('#msgBody')?.value||'');let nums=ps.map(p=>(p.phone||'').replace(/[^0-9+]/g,'')).filter(Boolean);if(!nums.length){toast('Select people with phone numbers');return}location.href=`sms:${nums.join(',')}?&body=${body}`}
function sendGroupEmail(){let ps=selectedMsgPeople(),body=encodeURIComponent($('#msgBody')?.value||''),emails=ps.map(p=>p.email).filter(Boolean);if(!emails.length){toast('Select people with email addresses');return}location.href=`mailto:${emails.join(',')}?subject=Our Family Adventures&body=${body}`}
function updatePersonRole(personId,newRole){if(!adminIsUnlocked()){toast('Unlock Admin to change roles');return}if(locks().roles){toast('Role editing is locked by Admin');return}const allowed=['Family','Guest','Child','Admin'];if(!allowed.includes(newRole)){toast('Invalid role');return}const person=arr('people').find(p=>p.id===personId);if(!person)return;if(normIdentity(person.email)===ADMIN_EMAIL&&newRole!=='Admin'){toast('The primary administrator account cannot be demoted');render();return}if(person.roleLocked){toast('Unlock this person’s role first');render();return}person.role=newRole;person.roleUpdatedAt=Date.now();person.roleUpdatedBy=uid;arr('invites').forEach(i=>{if(normIdentity(i.email)===normIdentity(person.email))i.role=newRole});save();activity(`Changed ${person.name||person.email} role to ${newRole}`,'admin');toast(`Role updated to ${newRole}`);render()}
function togglePersonRoleLock(personId){if(!adminIsUnlocked()){toast('Unlock Admin to manage role locks');return}const person=arr('people').find(p=>p.id===personId);if(!person)return;if(normIdentity(person.email)===ADMIN_EMAIL&&person.roleLocked){person.roleLocked=false}else person.roleLocked=!person.roleLocked;person.roleLockUpdatedAt=Date.now();person.roleLockUpdatedBy=uid;save();activity(`${person.roleLocked?'Locked':'Unlocked'} ${person.name||person.email} role`,'admin');toast(person.roleLocked?'Role locked':'Role unlocked');render()}
function toggleLock(area){if(!canAdmin())return;locks()[area]=!locks()[area];save();render()}

window.app={enter,signIn,signUpAdmin,createInvitedAccount,createAndSendInvite,sendInvite,copyInvite,signOut,go:setRoute,pickTrip:v=>{if(blockUnauthorizedTrip(v))return;selectedTrip=v;render()},add,del,dedupe,uploadMedia,addMemory,requestPush,testNotification,markRead,clearMyNotifications,changeAdminCode,setRsvp,install,exportData,exportTripPDF,importClick,migrateNow:()=>{migrate(false);save();toast('Migration complete')},notify:()=>setRoute('notifications'),toggleDone:(e,i)=>{let x=arr(e).find(y=>y.id===i);if(x){x.done=!x.done;save();render()}},addScrapText,addSticker,addSelectedPhoto,saveScrapbook,setScrapBg,sendChat,castVote,removeMyVote,clearActivity:()=>{if(confirm('Clear activity log?')){data.activity=[];save();render()}},clearChat:()=>{if(confirm('Clear chat messages?')){data.chats=[];save();render()}},addProfile,editProfile,zoomPhoto,cropPhoto,setPhotoShape,changeProfilePhoto,setTheme,setNotify,requestPush,toggleQuickChat,openChatWindow,sendQuickChat,applyLayout,rotatePhoto,bringForward,sendBackward,deleteScrapObject,canvasZoom,addCollage,exportScrapPDF,volunteer,toggleAssignment,applyFrame,applyFrameColor,applyFrameThickness,applyCutout,toggleImageAdjust,centerPhoto,setScrapOrientation,openScrapEditor,closeScrapEditor,openSavedScrap,sendGroupText,sendGroupEmail,updatePersonRole,togglePersonRoleLock,toggleLock,editTrip,saveTripEdits,saveVapidKey,unlockAdmin,lockAdmin,saveScrapDraft,duplicateScrapObject,applyFrameShadow,applyFrameGlow,applyFrameRounded};
setup();
})();
