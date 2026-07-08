/* Our Family Adventures consolidated app bundle v6.7.0.
   This file replaces the stacked patch script loading from versions 6.4.1 through 6.6.4. */
window.OFA_CONSOLIDATED_VERSION='6.7.0';


/* ===== BEGIN app-preconsolidation-6.6.5.js ===== */
'use strict';
const $ = id => document.getElementById(id);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const KEY = 'ofa_v5_data';
const OLD_KEYS = ['ofa_44','ofa_43','ofa_42','ofa_41','ofa_39'];
const data = {people:[],trips:[],memories:[],pages:[],links:[],meals:[],groceries:[],packing:[],pins:[],chat:[],settings:{notifications:{chat:false,trips:false,birthdays:false,meals:false,weather:false,scrapbook:false,journal:false},adminPin:'1234'},activity:[]};
let selectedScrapPhotos = [];
let deferredInstallPrompt = null;
let editingTripId = null;
function load(){try{const raw=localStorage.getItem(KEY);if(raw)Object.assign(data,JSON.parse(raw));}catch(e){console.warn(e)}normalizeData()}
function normalizeData(){['people','trips','memories','pages','links','meals','groceries','packing','pins','chat','activity'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]});data.trips.forEach(t=>{if(!t.rsvp)t.rsvp={accept:0,maybe:0,decline:0};if(!Array.isArray(t.voteOptions))t.voteOptions=[];if(!Array.isArray(t.tripLinks))t.tripLinks=[];t.voteOptions.forEach(v=>{if(!v.id)v.id=uid();if(!v.votes)v.votes={};if(v.count&&!v.legacyCount)v.legacyCount=v.count;});});if(!data.settings)data.settings={};if(!data.settings.adminPin)data.settings.adminPin='1234';if(!data.settings.notifications)data.settings.notifications={};['chat','trips','birthdays','meals','weather','scrapbook','journal'].forEach(k=>{if(typeof data.settings.notifications[k]!=='boolean')data.settings.notifications[k]=false});}
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(data));}
  catch(e){console.error(e);toast('This device storage is full. Sign in to Firebase for large photo/video saving, or use Download Backup.');}
  queueFirebaseSave();
}
function toast(msg){const t=$('toast');if(!t)return; t.textContent=msg;t.classList.remove('hidden');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.add('hidden'),2600);}
function logActivity(msg,type='info'){data.activity.unshift({id:uid(),msg,type,at:new Date().toISOString()});data.activity=data.activity.slice(0,100);}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function safeUrl(u){return /^https?:\/\//i.test(u||'')?u:'#'}
function fmtDate(d){if(!d)return '';try{return new Date(d+'T00:00:00').toLocaleDateString()}catch{return d}}
function daysUntil(d){if(!d)return null;return Math.max(0,Math.ceil((new Date(d+'T00:00:00')-new Date())/86400000));}
function byNextTrip(){return data.trips.filter(t=>t.status!=='Canceled').sort((a,b)=>(a.start||'9999').localeCompare(b.start||'9999'))[0]||null}
function show(id){$$('.page').forEach(p=>p.classList.toggle('active',p.id===id));$$('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===id));$('drawer')?.classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});}
function bindNav(){$$('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));$('menuBtn').onclick=()=>$('drawer').classList.add('open');$('closeDrawer').onclick=()=>$('drawer').classList.remove('open');$('beginBtn').onclick=()=>{$('splash').classList.remove('active');$('app').classList.remove('hidden')}}
function fillTripSelects(){const opts=data.trips.map(t=>`<option value="${esc(t.name)}">${esc(t.name)}</option>`).join('')||'<option value="General">General</option>';['mealTrip','groceryTrip','packingTrip','linkTrip'].forEach(id=>{if($(id))$(id).innerHTML=opts})}
function updateHome(){const next=byNextTrip();$('nextAdventureText').textContent=next?`Your next adventure is ${next.name}.`:'Your next adventure is waiting.';$('countdown').textContent=next?.start?`${daysUntil(next.start)} days until ${next.name}`:'Add an adventure to begin the countdown.';$('activityLine').textContent=`${data.people.length} people • ${data.trips.length} adventures • ${data.memories.length} memories • ${data.pages.length} scrapbook pages`;$('peopleCount').textContent=data.people.length;$('tripCount').textContent=data.trips.length;$('memoryCount').textContent=data.memories.length;$('pageCount').textContent=data.pages.length;fillTripSelects();renderDashboard();}
$('saveTrip').onclick=()=>{const values={name:$('tripName').value.trim()||'New Adventure',destination:$('tripDestination').value.trim(),start:$('tripStart').value,end:$('tripEnd').value,visibility:$('tripVisibility').value,invitees:$('tripInvitees').value.trim(),weather:$('tripWeather').value.trim(),notes:$('tripNotes').value.trim()};let trip;if(editingTripId){trip=data.trips.find(t=>t.id===editingTripId);if(trip){Object.assign(trip,values, {updatedAt:new Date().toISOString()});logActivity(`Adventure updated: ${trip.name}`,'trip');toast('Adventure updated in Trips');}}else{trip={id:uid(),...values,status:'Planning',rsvp:{accept:0,maybe:0,decline:0},voteOptions:[],createdAt:new Date().toISOString()};data.trips.push(trip);logActivity(`Adventure saved: ${trip.name}`,'trip');toast('Adventure saved and added to Trips');}editingTripId=null;$('saveTrip').textContent='Save Adventure';['tripName','tripDestination','tripStart','tripEnd','tripInvitees','tripWeather','tripNotes'].forEach(i=>$(i).value='');save();render();show('adventures')};
function voteCount(v){return Object.keys(v.votes||{}).length+(v.legacyCount||0)}
function currentVoter(){let name=localStorage.getItem('ofa_voter_name')||'';if(!name){name=prompt('Your name for voting');if(name)localStorage.setItem('ofa_voter_name',name.trim());}return (name||'').trim();}
function isAdmin(){return sessionStorage.getItem('ofa_admin_unlocked')==='yes'}
function unlockAdmin(){if(isAdmin())return true;const pin=prompt('Admin PIN required to remove voting options');if(pin&&pin===String(data.settings?.adminPin||'1234')){sessionStorage.setItem('ofa_admin_unlocked','yes');toast('Admin unlocked');return true;}toast('Admin only');return false;}
function tripLinkRows(t){const all=[...(t.tripLinks||[]),...data.links.filter(l=>l.tripId===t.id||l.trip===t.name)];return all.length?`<div class="tripLinks"><h4>Trip Links</h4>${all.map(l=>`<div class="linkRow"><a href="${safeUrl(l.url)}" target="_blank" rel="noopener">${esc(l.title||'Open link')}</a><button onclick="removeTripLink('${t.id}','${l.id||''}')" class="secondary smallBtn">Remove</button></div>`).join('')}</div>`:'<p class="helperText">No trip links yet.</p>'}
function renderTrips(){$('tripList').innerHTML=data.trips.map(t=>{if(!Array.isArray(t.voteOptions))t.voteOptions=[];if(!Array.isArray(t.tripLinks))t.tripLinks=[];return `<div class="item tripCard"><h3>${esc(t.name)}</h3><p>${esc(t.destination)} ${t.start?`• ${fmtDate(t.start)} to ${fmtDate(t.end)}`:''}</p><span class="badge">${t.visibility==='private'?'Private / invited only':'Whole family'}</span><span class="badge">${esc(t.status)}</span>${t.weather?`<p class="weatherBox">${esc(t.weather)}</p>`:''}${t.notes?`<p>${esc(t.notes)}</p>`:''}<p>RSVP: ${t.rsvp.accept} accepted • ${t.rsvp.maybe} maybe • ${t.rsvp.decline} declined</p><div class="itemActions"><button onclick="editTrip('${t.id}')" class="primary">Edit Adventure</button><button onclick="rsvp('${t.id}','accept')" class="secondary">Accept</button><button onclick="rsvp('${t.id}','maybe')" class="secondary">Maybe</button><button onclick="rsvp('${t.id}','decline')" class="secondary">Decline</button><button onclick="cancelTrip('${t.id}')" class="secondary">Cancel trip</button><button onclick="del('trips','${t.id}')" class="secondary">Delete</button></div><div class="linkBox"><h4>Links for this Trip</h4>${tripLinkRows(t)}<div class="voteAdd"><input id="tripLinkTitle-${t.id}" placeholder="Link title" /><input id="tripLinkUrl-${t.id}" placeholder="https://..." /><button onclick="addTripLink('${t.id}')" class="secondary">Add trip link</button></div></div><div class="voteBox"><h4>Family Voting</h4><div class="voteOptions">${t.voteOptions.length?t.voteOptions.map((v,i)=>`<div class="voteRow"><span>${esc(v.text)}</span><strong>${voteCount(v)} vote${voteCount(v)===1?'':'s'}</strong><button onclick="voteTrip('${t.id}',${i})" class="secondary">Vote / Change</button><button onclick="removeVoteOption('${t.id}',${i})" class="secondary">Admin Remove</button></div>`).join(''):'<p class="helperText">Add choices for dates, activities, houses, restaurants, or plans.</p>'}</div><div class="voteAdd"><input id="voteInput-${t.id}" placeholder="Add voting option" /><button onclick="addVoteOption('${t.id}')" class="secondary">Add option</button></div></div></div>`}).join('')}
window.rsvp=(id,type)=>{const t=data.trips.find(x=>x.id===id);if(!t)return;t.rsvp[type]++;logActivity(`${type} RSVP for ${t.name}`,'trip');save();render();toast('RSVP saved')};
window.cancelTrip=id=>{const t=data.trips.find(x=>x.id===id);if(!t)return;t.status='Canceled';save();render();toast('Trip marked canceled')};

window.editTrip=id=>{const t=data.trips.find(x=>x.id===id);if(!t)return;editingTripId=id;$('tripName').value=t.name||'';$('tripDestination').value=t.destination||'';$('tripStart').value=t.start||'';$('tripEnd').value=t.end||'';$('tripVisibility').value=t.visibility||'family';$('tripInvitees').value=t.invitees||'';$('tripWeather').value=t.weather||'';$('tripNotes').value=t.notes||'';$('saveTrip').textContent='Update Adventure';window.scrollTo({top:0,behavior:'smooth'});toast('Editing adventure. Make changes, then tap Update Adventure.');};
window.addVoteOption=id=>{const t=data.trips.find(x=>x.id===id);if(!t)return;if(!Array.isArray(t.voteOptions))t.voteOptions=[];const input=$(`voteInput-${id}`);const text=(input?.value||'').trim();if(!text)return toast('Type a voting option first.');t.voteOptions.push({id:uid(),text,count:0});if(input)input.value='';save();render();toast('Voting option added');};
window.voteTrip=(id,index)=>{const t=data.trips.find(x=>x.id===id);if(!t||!t.voteOptions[index])return;const voter=currentVoter();if(!voter)return toast('Vote canceled');t.voteOptions.forEach(v=>{if(v.votes)delete v.votes[voter];});t.voteOptions[index].votes=t.voteOptions[index].votes||{};t.voteOptions[index].votes[voter]=new Date().toISOString();save();render();toast('Vote saved. You can change it anytime.');};
window.removeVoteOption=(id,index)=>{if(!unlockAdmin())return;const t=data.trips.find(x=>x.id===id);if(!t||!t.voteOptions[index])return;if(!confirm('Remove this voting option? Only admins should do this.'))return;t.voteOptions.splice(index,1);save();render();toast('Voting option removed by admin');};
window.addTripLink=id=>{const t=data.trips.find(x=>x.id===id);if(!t)return;if(!Array.isArray(t.tripLinks))t.tripLinks=[];const title=($(`tripLinkTitle-${id}`)?.value||'Trip link').trim();const url=($(`tripLinkUrl-${id}`)?.value||'').trim();if(!/^https?:\/\//i.test(url))return toast('Enter a full link starting with https://');t.tripLinks.push({id:uid(),title,url,createdAt:new Date().toISOString()});save();render();toast('Trip link added');};
window.removeTripLink=(tripId,linkId)=>{const t=data.trips.find(x=>x.id===tripId);if(t&&Array.isArray(t.tripLinks))t.tripLinks=t.tripLinks.filter(l=>l.id!==linkId);data.links=data.links.filter(l=>l.id!==linkId);save();render();toast('Trip link removed');};

$('savePerson').onclick=async()=>{const file=$('personPhoto').files[0];const photo=file?await saveMediaFile(file,`people/${uid()}-${safeFileName(file.name)}`,900,.72):'';const person={id:uid(),name:$('personName').value.trim(),birthday:$('personBirthday').value,email:$('personEmail').value.trim(),phone:$('personPhone').value.trim(),role:$('personRole').value,photo};if(!person.name)return toast('Please enter a name');data.people.push(person);['personName','personBirthday','personEmail','personPhone'].forEach(i=>$(i).value='');$('personPhoto').value='';logActivity(`Person saved: ${person.name}`,'people');save();render();toast(firebaseUser?'Person saved to Firebase':'Person saved on this device')};
function renderPeople(){$('peopleList').innerHTML=data.people.map(p=>`<div class="person">${p.photo?`<img src="${p.photo}" alt="${esc(p.name)}">`:''}<h3>${esc(p.name)}</h3><p>${fmtDate(p.birthday)} ${p.role?`• ${esc(p.role)}`:''}</p><div class="personActions"><button onclick="emailOne('${esc(p.email)}')" class="secondary">Email</button><button onclick="textOne('${esc(p.phone)}')" class="secondary">Text</button><button onclick="del('people','${p.id}')" class="secondary">Remove</button></div></div>`).join('');$('contactChecks').innerHTML=data.people.map(p=>`<label class="contactRow"><input type="checkbox" value="${p.id}"><span>${esc(p.name)}</span></label>`).join('')}
function selectedPeople(){return $$('#contactChecks input:checked').map(c=>data.people.find(p=>p.id===c.value)).filter(Boolean)}
$('groupEmail').onclick=()=>{const emails=selectedPeople().map(p=>p.email).filter(Boolean).join(',');if(emails)location.href='mailto:'+emails;else toast('Select people with email addresses')};$('groupText').onclick=()=>{const phones=selectedPeople().map(p=>p.phone).filter(Boolean).join(',');if(phones)location.href='sms:'+phones;else toast('Select people with phone numbers')};window.emailOne=e=>{if(e)location.href='mailto:'+e};window.textOne=p=>{if(p)location.href='sms:'+p};
$('saveMemories').onclick=async()=>{const files=Array.from($('memoryFiles').files);if(!files.length)return toast('Choose photos or videos');const mem={id:uid(),title:$('memoryTitle').value.trim()||'Family Memory',caption:$('memoryCaption').value.trim(),date:$('memoryDate').value,trip:$('memoryTrip').value.trim()||'General Memories',uploader:$('memoryUploader').value.trim()||'Family',media:[],createdAt:new Date().toISOString()};for(const f of files){const isVideo=f.type.startsWith('video');const mediaId=uid();const src=await saveMediaFile(f,`memories/${mem.id}/${mediaId}-${safeFileName(f.name)}`,1200,.70);mem.media.push({id:mediaId,type:isVideo?'video':'image',name:f.name,src});}data.memories.push(mem);['memoryTitle','memoryCaption','memoryDate','memoryTrip','memoryUploader'].forEach(i=>$(i).value='');$('memoryFiles').value='';logActivity(`Memory saved: ${mem.title}`,'memory');save();render();toast(firebaseUser?'Memory saved to Firebase':'Memory saved on this device')};
function renderMemories(){const sorted=[...data.memories].sort((a,b)=>(b.date||b.createdAt||'').localeCompare(a.date||a.createdAt||''));$('memoryGrid').innerHTML=sorted.map(m=>`<div class="memory journal"><div class="journalMeta">${esc(m.uploader)} • ${esc(m.trip)} • ${fmtDate(m.date)}</div><h3>${esc(m.title)}</h3><div class="mediaGrid">${(m.media||[]).map(mediaTile).join('')}</div><p>${esc(m.caption)}</p><div class="memoryActions"><button onclick="addMemoryToBook('${m.id}')" class="secondary">Add photos to scrapbook</button><button onclick="printMemory('${m.id}')" class="secondary">Print photos</button><button onclick="del('memories','${m.id}')" class="secondary">Delete</button></div></div>`).join('');renderScrapbookChoices();}
function mediaTile(x){return `<div class="mediaTile">${x.type==='video'?(x.src?`<video controls src="${x.src}"></video>`:`<div class="videoNotice">🎥 ${esc(x.name)}<br><small>Sign in to Firebase to save video files.</small></div>`):`<img src="${x.src}" alt="${esc(x.name)}">`}</div>`}
function imageMedia(){return data.memories.flatMap(m=>(m.media||[]).filter(x=>x.type==='image').map(x=>({...x,memoryTitle:m.title,trip:m.trip,uploader:m.uploader})))}
function renderScrapbookChoices(){const imgs=imageMedia();const count=`<p class="selectedCount">${selectedScrapPhotos.length} photo${selectedScrapPhotos.length===1?'':'s'} selected for this page.</p>`;$('scrapbookMemoryChoices').innerHTML=imgs.length?`${count}<div class="memorySelect">${imgs.map(x=>`<button type="button" class="memoryChoice ${selectedScrapPhotos.includes(x.id)?'selected':''}" onclick="toggleScrapPhoto('${x.id}')"><img src="${x.src}" alt="${esc(x.name)}"><small>${esc(x.memoryTitle)}</small></button>`).join('')}</div>`:'<p>No memory photos yet. Save photos in Memories first, then come back here.</p>'}
window.toggleScrapPhoto=id=>{selectedScrapPhotos=selectedScrapPhotos.includes(id)?selectedScrapPhotos.filter(x=>x!==id):[...selectedScrapPhotos,id];renderScrapbookChoices();};
window.addMemoryToBook=id=>{const m=data.memories.find(x=>x.id===id);if(!m)return;selectedScrapPhotos=(m.media||[]).filter(x=>x.type==='image').map(x=>x.id);show('scrapbook');renderScrapbookChoices();toast('Photos selected for scrapbook')};
window.printMemory=id=>{const m=data.memories.find(x=>x.id===id);if(!m)return;const imgs=(m.media||[]).filter(x=>x.type==='image');if(!imgs.length)return toast('No photos to print');const w=window.open('','_blank');w.document.write(`<html><head><title>${esc(m.title)}</title><style>body{font-family:Georgia;margin:20px}img{max-width:100%;page-break-inside:avoid;margin:0 0 18px}</style></head><body><h1>${esc(m.title)}</h1>${imgs.map(i=>`<img src="${i.src}">`).join('')}<script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close()};
$('addAllToBook').onclick=()=>{selectedScrapPhotos=imageMedia().map(x=>x.id);show('scrapbook');renderScrapbookChoices();toast('All photos selected')};$('printMemories').onclick=()=>window.print();
$('savePage').onclick=()=>{const all=imageMedia();const photos=all.filter(x=>selectedScrapPhotos.includes(x.id)).map(x=>x.src);if(!photos.length&&!$('pageTitle').value.trim()&&!$('pageNote').value.trim())return toast('Add a title, journal note, or select photos first.');const page={id:uid(),title:$('pageTitle').value.trim()||'Scrapbook Page',note:$('pageNote').value.trim(),theme:$('pageTheme').value,layout:$('pageLayout').value,sticker:$('pageSticker').value,photos,createdAt:new Date().toISOString()};data.pages.push(page);selectedScrapPhotos=[];['pageTitle','pageNote'].forEach(i=>$(i).value='');logActivity(`Scrapbook page saved: ${page.title}`,'scrapbook');save();render();toast('Scrapbook page saved')};
function renderPages(){$('scrapbookPages').innerHTML=data.pages.map(p=>`<div class="scrapPage theme-${cssClass(p.theme)}" id="page-${p.id}"><span class="sticker">${esc((p.sticker||'🐚').split(' ')[0])}</span><h3>${esc(p.title)}</h3><div class="scrapLayout ${esc(p.layout||'grid')}">${(p.photos||[]).map(src=>`<img class="scrapPhoto" src="${src}">`).join('')||'<p>No photos selected for this page.</p>'}</div><p>${esc(p.note)}</p><div class="scrapTools noPrint"><button onclick="exportScrapbookPage('${p.id}')" class="secondary">Export JPG</button><button onclick="del('pages','${p.id}')" class="secondary">Delete</button></div></div>`).join('')||'<div class="card"><p>No scrapbook pages yet. Select photos above, choose a layout/sticker, then tap Save Scrapbook Page.</p></div>'}
$('printBook').onclick=()=>window.print();$('exportBook').onclick=()=>{const last=data.pages[data.pages.length-1];if(!last)return toast('Create a scrapbook page first.');exportScrapbookPage(last.id)};
$('saveMeal').onclick=()=>{data.meals.push({id:uid(),trip:$('mealTrip').value,title:$('mealTitle').value,item:$('mealItem').value,person:$('mealPerson').value,done:false});['mealTitle','mealItem','mealPerson'].forEach(i=>$(i).value='');save();render();toast('Meal added')};
$('saveGrocery').onclick=()=>{data.groceries.push({id:uid(),trip:$('groceryTrip').value,item:$('groceryItem').value,person:$('groceryPerson').value,done:false});['groceryItem','groceryPerson'].forEach(i=>$(i).value='');save();render();toast('Grocery item added')};
function renderMeals(){$('mealList').innerHTML=[...data.meals.map(m=>listItem('meals',m,`${m.title}: ${m.item}`,m.person)),...data.groceries.map(g=>listItem('groceries',g,`Grocery: ${g.item}`,g.person))].join('')}
$('savePacking').onclick=()=>{data.packing.push({id:uid(),trip:$('packingTrip').value,item:$('packingItem').value,person:$('packingPerson').value,done:false});['packingItem','packingPerson'].forEach(i=>$(i).value='');save();render();toast('Packing item added')};
function renderPacking(){$('packingList').innerHTML=data.packing.map(p=>listItem('packing',p,p.item,p.person)).join('')}
function listItem(key,x,title,person){return `<div class="item"><h3 class="${x.done?'done':''}">${esc(title)}</h3><p>${esc(x.trip)} ${person?`• ${esc(person)}`:''}</p><button onclick="toggleDone('${key}','${x.id}')" class="secondary">${x.done?'Undo':'Done'}</button><button onclick="del('${key}','${x.id}')" class="secondary">Delete</button></div>`}
window.toggleDone=(key,id)=>{const x=data[key].find(i=>i.id===id);if(x)x.done=!x.done;save();render()};
$('sendChat').onclick=()=>{const text=$('chatInput').value.trim();if(!text)return;data.chat.push({id:uid(),text,at:new Date().toISOString()});$('chatInput').value='';save();render();notify('New chat message','chat');};function renderChat(){$('chatLog').innerHTML=data.chat.map(c=>`<div class="bubble">${esc(c.text).replace(/@\w+/g,m=>`<b>${m}</b>`)}<br><small>${new Date(c.at).toLocaleString()}</small></div>`).join('')}
$('saveLink').onclick=()=>{const tripName=$('linkTrip')?.value||'General';const trip=data.trips.find(t=>t.name===tripName);data.links.push({id:uid(),trip:tripName,tripId:trip?.id||'',title:$('linkTitle').value||'Travel link',url:$('linkUrl').value});$('linkTitle').value='';$('linkUrl').value='';save();render();toast('Link saved to trip')};function renderTravel(){$('travelList').innerHTML=data.links.map(l=>`<div class="item"><h3>${esc(l.title)}</h3><p>${esc(l.trip||'General')}</p><a href="${safeUrl(l.url)}" target="_blank" rel="noopener">Open link</a><br><button onclick="del('links','${l.id}')" class="secondary">Delete</button></div>`).join('')}
$('savePin').onclick=()=>{data.pins.push({id:uid(),name:$('pinName').value,address:$('pinAddress').value});$('pinName').value='';$('pinAddress').value='';save();render();toast('Pin saved')};function renderPins(){$('pinList').innerHTML=data.pins.map(p=>`<div class="item"><h3>${esc(p.name)}</h3><p>${esc(p.address)}</p><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}">Open in Google Maps</a><br><button onclick="del('pins','${p.id}')" class="secondary">Remove pin</button></div>`).join('')}
function renderDashboard(){const t=byNextTrip();$('dashTripName').textContent=t?t.name:'No adventure selected';$('dashTripDetails').textContent=t?`${t.destination||''} ${t.start?`• ${fmtDate(t.start)} to ${fmtDate(t.end)}`:''}`:'Create an adventure to fill this dashboard.';$('dashWeather').textContent=t?.weather||'Weather will appear here when added.';const trip=t?.name;$('dashMeals').innerHTML=(trip?data.meals.filter(x=>x.trip===trip):data.meals).slice(0,5).map(x=>`<p>🍽️ ${esc(x.title)}: ${esc(x.item)}</p>`).join('')||'<p>No meals yet.</p>';$('dashPacking').innerHTML=(trip?data.packing.filter(x=>x.trip===trip):data.packing).slice(0,5).map(x=>`<p>🧳 ${esc(x.item)}</p>`).join('')||'<p>No packing items yet.</p>';$('dashGrocery').innerHTML=(trip?data.groceries.filter(x=>x.trip===trip):data.groceries).slice(0,5).map(x=>`<p>🛒 ${esc(x.item)}</p>`).join('')||'<p>No grocery items yet.</p>';$('dashMemories').innerHTML=data.memories.slice(-5).reverse().map(x=>`<p>📸 ${esc(x.title)}</p>`).join('')||'<p>No memories yet.</p>'}
window.del=(key,id)=>{if(!confirm('Delete this item?'))return;data[key]=data[key].filter(x=>x.id!==id);save();render();toast('Deleted')};
function fileData(file){return new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(file)})}
function imageData(file,max=1200,quality=.72){return new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const scale=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',quality));};img.onerror=()=>resolve(reader.result);img.src=reader.result};reader.readAsDataURL(file)})}
function cssClass(s){return String(s||'').replace(/\s+/g,'-').replace(/[^\w-]/g,'')}
async function askNotifications(){if(!('Notification'in window))return toast('Notifications are not supported in this browser.');const r=await Notification.requestPermission();if(r==='granted'){toast('Notifications are ready.');notify('Notifications are turned on.','system',true)}else toast('Notifications were not allowed on this device.');}
function notify(msg,cat,force=false){if(cat&&cat!=='system'&&!data.settings.notifications[cat]&&!force)return;data.activity.unshift({id:uid(),msg:'Notification: '+msg,type:'notification',at:new Date().toISOString()});data.activity=data.activity.slice(0,100);if('Notification'in window&&Notification.permission==='granted'){try{new Notification('Our Family Adventures',{body:msg});}catch(e){toast(msg);}}else{toast(msg);}renderNotificationLog();}
if($('enableNotifications'))$('enableNotifications').onclick=askNotifications;if($('settingsNotifyBtn'))$('settingsNotifyBtn').onclick=askNotifications;if($('testNotifyBtn'))$('testNotifyBtn').onclick=()=>notify('This is a test notification.','system',true);
$$('.notifySetting').forEach(cb=>{cb.checked=!!data.settings.notifications[cb.value];cb.onchange=()=>{data.settings.notifications[cb.value]=cb.checked;save();toast('Notification setting saved');renderNotificationLog();}});
function renderNotificationLog(){if(!$('notificationLog'))return;const notes=data.activity.filter(x=>x.type==='notification').slice(0,5);$('notificationLog').innerHTML=notes.length?notes.map(n=>`<div class="notificationNote">${esc(n.msg)}<br><small>${new Date(n.at).toLocaleString()}</small></div>`).join(''):'<p class="helperText">No notification activity yet.</p>'}
$('migrateBtn').onclick=()=>{let count=0;for(const k of OLD_KEYS){try{const raw=localStorage.getItem(k);if(raw){const old=JSON.parse(raw);Object.keys(old).forEach(key=>{if(Array.isArray(data[key])&&Array.isArray(old[key])){data[key].push(...old[key]);count+=old[key].length;}})}}catch(e){console.warn(e)}}save();render();toast(`Migration complete: ${count} items imported`)};
function downloadJSON(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='our-family-adventures-backup.json';a.click();URL.revokeObjectURL(a.href)}
if($('backupBtn'))$('backupBtn').onclick=downloadJSON;if($('downloadBackupBtn'))$('downloadBackupBtn').onclick=downloadJSON;if($('loginBtn'))$('loginBtn').onclick=firebaseLoginFlow;if($('adminUnlockBtn'))$('adminUnlockBtn').onclick=unlockAdmin;if($('changeAdminPinBtn'))$('changeAdminPinBtn').onclick=()=>{if(!unlockAdmin())return;const pin=prompt('New admin PIN');if(pin){data.settings.adminPin=pin;save();toast('Admin PIN updated');}};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;if($('installBtn'))$('installBtn').hidden=false});
async function installApp(){if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null}else alert('Install this app:\n\nAndroid Chrome: tap ⋮ menu → Add to Home screen / Install app.\n\niPhone Safari: tap Share → Add to Home Screen.')}
if($('installBtn')){$('installBtn').hidden=false;$('installBtn').onclick=installApp}if($('settingsInstallBtn'))$('settingsInstallBtn').onclick=installApp;
async function shareApp(){const shareData={title:'Our Family Adventures',text:'Open Our Family Adventures',url:location.href};try{if(navigator.share){await navigator.share(shareData);}else{await navigator.clipboard.writeText(location.href);toast('App link copied');}}catch(e){console.warn(e)}}
if($('shareBtn'))$('shareBtn').onclick=shareApp;if($('settingsShareBtn'))$('settingsShareBtn').onclick=shareApp;if($('filesShareBtn'))$('filesShareBtn').onclick=shareApp;if($('filesBackupBtn'))$('filesBackupBtn').onclick=downloadJSON;
function render(){updateHome();renderTrips();renderPeople();renderMemories();renderPages();renderMeals();renderPacking();renderChat();renderTravel();renderPins();renderNotificationLog();}

let firebaseReady=false;
let firebaseUser=null;
let firebaseSaveTimer=null;
let applyingFirebaseData=false;
let firebaseUnsubscribe=null;
function firebaseConfigReady(){const c=window.firebaseConfig||{};return !!(window.OFA_FIREBASE_ENABLED&&window.firebase&&c.apiKey&&!String(c.apiKey).includes('PASTE_')&&c.projectId&&!String(c.projectId).includes('PASTE_')&&c.appId&&!String(c.appId).includes('PASTE_'));}
function queueFirebaseSave(){if(applyingFirebaseData||!firebaseReady||!firebaseUser)return;clearTimeout(firebaseSaveTimer);firebaseSaveTimer=setTimeout(pushFirebaseData,900);}
function appDataRef(){return firebase.firestore().collection('users').doc(firebaseUser.uid).collection('private').doc('appData');}
async function pushFirebaseData(){if(!firebaseReady||!firebaseUser)return;try{await appDataRef().set({data,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),version:'6.4.5-storage-fix'}, {merge:true});}catch(e){console.error(e);toast('Firebase save failed. Check rules/config.');}}
async function pullFirebaseData(){if(!firebaseReady||!firebaseUser)return;try{const snap=await appDataRef().get();if(snap.exists&&snap.data().data){applyingFirebaseData=true;Object.keys(data).forEach(k=>delete data[k]);Object.assign(data,snap.data().data);localStorage.setItem(KEY,JSON.stringify(data));applyingFirebaseData=false;render();toast('Firebase data loaded');}else{await pushFirebaseData();toast('Firebase ready');}}catch(e){console.error(e);toast('Firebase load failed. Check Firestore rules.');}}
function initFirebase(){if(!firebaseConfigReady()){console.warn('Firebase is not active yet. Paste real config in firebase-config.js.');return;}try{if(!firebase.apps.length)firebase.initializeApp(window.firebaseConfig);firebaseReady=true;firebase.auth().onAuthStateChanged(async user=>{firebaseUser=user;if(firebaseUnsubscribe){firebaseUnsubscribe();firebaseUnsubscribe=null;}if(user){toast(`Signed in: ${user.email||'family user'}`);await firebase.firestore().collection('users').doc(user.uid).set({email:user.email||'',lastLogin:firebase.firestore.FieldValue.serverTimestamp(),role:'family'}, {merge:true});await pullFirebaseData();firebaseUnsubscribe=appDataRef().onSnapshot(snap=>{if(!snap.exists||!snap.data().data)return;applyingFirebaseData=true;Object.keys(data).forEach(k=>delete data[k]);Object.assign(data,snap.data().data);localStorage.setItem(KEY,JSON.stringify(data));applyingFirebaseData=false;render();}, err=>console.error(err));}else{try{await firebase.auth().signInAnonymously();}catch(err){console.error(err);toast('Firebase sign-in failed. Check Authentication > Anonymous is enabled.');}}});}catch(e){console.error(e);toast('Firebase could not start. Check firebase-config.js.');}}
async function firebaseLoginFlow(){if(!firebaseReady){toast('Paste your real Firebase config first.');return;}try{const existing=firebase.auth().currentUser;if(existing&&!existing.isAnonymous){if(confirm('Sign out of Firebase?'))await firebase.auth().signOut();return;}const email=prompt('Family email address');if(!email)return;const password=prompt('Password - at least 6 characters');if(!password)return;try{if(existing&&existing.isAnonymous){const credential=firebase.auth.EmailAuthProvider.credential(email,password);try{await existing.linkWithCredential(credential);}catch(linkErr){await firebase.auth().signInWithEmailAndPassword(email,password);}}else{await firebase.auth().signInWithEmailAndPassword(email,password);}}catch(err){if(confirm('No account found or password did not match. Create this family login?')){const cred=await firebase.auth().createUserWithEmailAndPassword(email,password);try{await cred.user.sendEmailVerification();toast('Account created. Verification email sent.');}catch{toast('Account created.');}}else{throw err;}}}catch(e){console.error(e);toast(e.message||'Login failed');}}
function safeFileName(name){return String(name||'file').replace(/[^a-z0-9._-]+/gi,'-').slice(0,80)}
async function ensureFirebaseUser(){if(!firebaseReady)return null;let user=firebase.auth().currentUser||firebaseUser;if(user)return user;try{const cred=await firebase.auth().signInAnonymously();firebaseUser=cred.user;return cred.user;}catch(e){console.error(e);toast('Firebase sign-in failed. Check Authentication > Anonymous is enabled.');return null;}}
async function saveMediaFile(file,path,max=1200,quality=.72){const user=await ensureFirebaseUser();if(firebaseReady&&user){try{let uploadFile=file;if(file.type.startsWith('image/'))uploadFile=await imageBlob(file,max,quality);const ref=firebase.storage().ref().child(`family/${user.uid}/${path}`);await ref.put(uploadFile,{contentType:uploadFile.type||file.type});return await ref.getDownloadURL();}catch(e){console.error(e);toast('Firebase Storage upload failed. Check Storage rules are set to request.auth != null.');}}if(file.type.startsWith('video')){toast('Video selected, but Firebase Storage upload failed.');return '';}
toast('Firebase Storage was unavailable, so this photo was saved as a smaller device copy. Sign in to Firebase for full photo saving.');
return await imageData(file,420,.45);}
function imageBlob(file,max=1200,quality=.72){return new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const scale=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>resolve(blob||file),'image/jpeg',quality);};img.onerror=()=>resolve(file);img.src=reader.result};reader.readAsDataURL(file)})}


function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});}
async function exportScrapbookPage(id){const p=data.pages.find(x=>x.id===id);if(!p)return toast('Page not found.');try{const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1600;const ctx=canvas.getContext('2d');const grad=ctx.createLinearGradient(0,0,1200,1600);grad.addColorStop(0,p.theme==='Sunset'?'#fff2e6':'#eaf7f8');grad.addColorStop(.55,'#fffaf4');grad.addColorStop(1,p.theme==='Rose Gold'?'#f7dfdc':'#f7dfdc');ctx.fillStyle=grad;ctx.fillRect(0,0,1200,1600);ctx.fillStyle='#123a4a';ctx.font='bold 72px Georgia';wrapText(ctx,p.title||'Scrapbook Page',80,120,1040,78);ctx.font='64px serif';ctx.fillText((p.sticker||'🐚').split(' ')[0],80,250);const photos=p.photos||[];const boxes=layoutBoxes(p.layout,photos.length);for(let i=0;i<photos.length&&i<boxes.length;i++){const img=await loadImage(photos[i]);drawContain(ctx,img,boxes[i].x,boxes[i].y,boxes[i].w,boxes[i].h);}ctx.fillStyle='#16313d';ctx.font='38px Georgia';wrapText(ctx,p.note||'',80,1260,1040,48);const a=document.createElement('a');a.href=canvas.toDataURL('image/jpeg',.92);a.download=(safeFileName(p.title)||'scrapbook-page')+'.jpg';a.click();toast('Scrapbook JPG exported.');}catch(e){console.error(e);toast('JPG export could not read one of the photos. Try Print / Save as PDF.');}}
function layoutBoxes(layout,count){if(layout==='feature')return [{x:80,y:300,w:680,h:780},{x:790,y:300,w:330,h:240},{x:790,y:565,w:330,h:240},{x:790,y:830,w:330,h:240},{x:80,y:1100,w:1040,h:120}];if(layout==='collage')return [{x:80,y:300,w:520,h:520},{x:620,y:300,w:500,h:250},{x:620,y:570,w:240,h:250},{x:880,y:570,w:240,h:250},{x:80,y:840,w:500,h:240},{x:600,y:840,w:520,h:240}];return Array.from({length:Math.max(1,count)},(_,i)=>{const col=i%2,row=Math.floor(i/2);return{x:80+col*540,y:300+row*330,w:500,h:300}})}
function drawContain(ctx,img,x,y,w,h){ctx.save();ctx.fillStyle='rgba(255,255,255,.76)';roundRect(ctx,x-12,y-12,w+24,h+24,30);ctx.fill();const r=Math.min(w/img.width,h/img.height);const nw=img.width*r,nh=img.height*r;ctx.drawImage(img,x+(w-nw)/2,y+(h-nh)/2,nw,nh);ctx.restore();}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function wrapText(ctx,text,x,y,maxWidth,lineHeight){String(text||'').split('\n').forEach(part=>{let line='';for(const word of part.split(' ')){const test=line+word+' ';if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);line=word+' ';y+=lineHeight;}else line=test;}if(line){ctx.fillText(line,x,y);y+=lineHeight;}})}

load();bindNav();render();if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js').catch(()=>{});
initFirebase();


/* 5.0.6 security + recommendations layer */
const OFA_VERSION = '5.0.6';
function userVerified(){return !!(firebaseUser && firebaseUser.emailVerified);}
function renderSecurityStatus(){
  const box=$('securityStatus'); if(!box)return;
  const configOk = typeof firebaseConfigReady==='function' && firebaseConfigReady();
  const signed = !!firebaseUser;
  const verified = !!(firebaseUser && firebaseUser.emailVerified);
  const admin = typeof isAdmin==='function' && isAdmin();
  box.innerHTML = [
    ['Firebase config', configOk?'Ready':'Missing config', configOk?'securityGood':'securityBad'],
    ['Signed in', signed?(firebaseUser.email||'Yes'):'Not signed in', signed?'securityGood':'securityWarn'],
    ['Email verified', verified?'Verified':'Needs verification', verified?'securityGood':'securityWarn'],
    ['Admin controls', admin?'Unlocked':'Locked', admin?'securityGood':'securityWarn'],
    ['App Check', 'Leave off until final testing', 'securityWarn']
  ].map(r=>`<div class="securityLine"><b>${esc(r[0])}</b><span class="${r[2]}">${esc(r[1])}</span></div>`).join('');
}
const oldRender506 = render;
render = function(){ oldRender506(); renderSecurityStatus(); enforceAdminButtons(); };
function enforceAdminButtons(){
  $$('.scrapTools button, .personActions button, .memoryActions button, .itemActions button').forEach(btn=>{
    if(/Delete|Remove/.test(btn.textContent||'')) btn.title='Admin unlock required for protected delete actions';
  });
}
const oldDel506 = window.del;
window.del = function(key,id){
  if(['trips','people','memories','pages'].includes(key) && !isAdmin()){
    toast('Admin unlock is required to delete protected family content.');
    return;
  }
  return oldDel506(key,id);
};
const oldPushFirebaseData506 = pushFirebaseData;
pushFirebaseData = async function(){
  if(firebaseReady && firebaseUser && !firebaseUser.emailVerified){
    toast('Verify your email before cloud saving. It is saved on this device for now.');
    renderSecurityStatus();
    return;
  }
  return oldPushFirebaseData506();
};
const oldPullFirebaseData506 = pullFirebaseData;
pullFirebaseData = async function(){
  if(firebaseReady && firebaseUser && !firebaseUser.emailVerified){
    try{ await firebaseUser.sendEmailVerification(); }catch(e){}
    toast('Please verify your email before Firebase cloud sync.');
    renderSecurityStatus();
    return;
  }
  return oldPullFirebaseData506();
};
async function verifyEmailNow(){
  if(!firebaseReady)return toast('Firebase config is not active yet.');
  const user=firebase.auth().currentUser;
  if(!user)return toast('Sign in first.');
  await user.reload();
  if(user.emailVerified){toast('Email is already verified.'); renderSecurityStatus(); return;}
  try{await user.sendEmailVerification();toast('Verification email sent. Check your inbox.');}
  catch(e){console.error(e);toast(e.message||'Could not send verification email.');}
  renderSecurityStatus();
}
async function signOutNow(){
  if(firebaseReady && firebase.auth().currentUser){await firebase.auth().signOut();toast('Signed out.');firebaseUser=null;renderSecurityStatus();}
}
if($('verifyEmailBtn'))$('verifyEmailBtn').onclick=verifyEmailNow;
if($('signOutBtn'))$('signOutBtn').onclick=signOutNow;
const oldLogin506 = firebaseLoginFlow;
firebaseLoginFlow = async function(){
  if(!firebaseReady){toast('Paste your real Firebase config first.');return;}
  try{
    if(firebase.auth().currentUser){show('settings');renderSecurityStatus();toast('You are signed in. Security settings opened.');return;}
    const email=prompt('Family email address'); if(!email)return;
    const password=prompt('Password - at least 6 characters'); if(!password)return;
    try{ await firebase.auth().signInWithEmailAndPassword(email,password); }
    catch(err){
      if(confirm('Create this family login?')){
        const code=prompt('Family invite code');
        const expected=localStorage.getItem('ofa_family_invite_code') || 'FAMILY2026';
        if(code!==expected){toast('Invite code did not match.');return;}
        const cred=await firebase.auth().createUserWithEmailAndPassword(email,password);
        await firebase.firestore().collection('users').doc(cred.user.uid).set({email,role:'family',createdAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
        try{await cred.user.sendEmailVerification();toast('Account created. Verification email sent.');}catch{toast('Account created. Please verify email.');}
      }else throw err;
    }
  }catch(e){console.error(e);toast(e.message||'Login failed');}
};
if($('loginBtn'))$('loginBtn').onclick=firebaseLoginFlow;
function betterNotify(msg,cat,force=false){
  if(cat&&cat!=='system'&&!data.settings.notifications[cat]&&!force)return;
  data.activity.unshift({id:uid(),msg:'Notification: '+msg,type:'notification',at:new Date().toISOString()});
  data.activity=data.activity.slice(0,100);
  const showToast=()=>toast(msg);
  if('serviceWorker' in navigator && Notification.permission==='granted'){
    navigator.serviceWorker.ready.then(reg=>reg.showNotification('Our Family Adventures',{body:msg,icon:'icons/icon-192.png',badge:'icons/favicon.png'})).catch(showToast);
  }else if('Notification'in window&&Notification.permission==='granted'){
    try{new Notification('Our Family Adventures',{body:msg,icon:'icons/icon-192.png'});}catch(e){showToast();}
  }else showToast();
  renderNotificationLog();
}
notify = betterNotify;
if($('testNotifyBtn'))$('testNotifyBtn').onclick=()=>notify('This is a test notification from Our Family Adventures.','system',true);
window.addEventListener('online',()=>toast('Back online. Firebase will sync when signed in and verified.'));
window.addEventListener('offline',()=>toast('Offline mode. Changes save on this device.'));
renderSecurityStatus();

/* 5.0.7 fully working Scrapbook Studio: collage, feature layouts, drag/drop, stickers, text, frames, backgrounds, PDF/JPEG */
(function(){
  const PAGE_W = 850, PAGE_H = 1100;
  function pct(n){return Math.round(n*1000)/10 + '%'}
  function pageById(id){return data.pages.find(p=>String(p.id)===String(id));}
  function selectedPhotoSources(){const all=imageMedia();return all.filter(x=>selectedScrapPhotos.includes(x.id)).map(x=>x.src);}
  function makeElements(photos, layout, frame){
    const boxes = layoutPreset(layout, photos.length);
    return photos.map((src,i)=>({id:uid(),type:'photo',src,x:boxes[i]?.x??8,y:boxes[i]?.y??18,w:boxes[i]?.w??38,h:boxes[i]?.h??25,frame:frame||'soft',z:10+i}));
  }
  function layoutPreset(layout,count){
    if(layout==='feature') return [
      {x:6,y:19,w:58,h:52},{x:68,y:19,w:25,h:16},{x:68,y:38,w:25,h:16},{x:68,y:57,w:25,h:16},{x:6,y:74,w:27,h:14},{x:36,y:74,w:27,h:14},{x:66,y:74,w:27,h:14}
    ];
    if(layout==='collage') return [
      {x:6,y:19,w:42,h:31},{x:51,y:19,w:42,h:20},{x:51,y:42,w:20,h:23},{x:73,y:42,w:20,h:23},{x:6,y:53,w:42,h:22},{x:51,y:68,w:42,h:20},{x:6,y:78,w:26,h:12},{x:35,y:78,w:26,h:12}
    ];
    if(layout==='freeform') return Array.from({length:Math.max(count,1)},(_,i)=>({x:8+(i%3)*28,y:20+Math.floor(i/3)*22,w:26,h:18}));
    return Array.from({length:Math.max(count,1)},(_,i)=>{const col=i%2,row=Math.floor(i/2);return {x:6+col*46,y:18+row*23,w:42,h:20};});
  }
  function normalizePage(p){
    if(!p.elements){
      const frame=p.frame||'soft';
      p.elements=makeElements(p.photos||[],p.layout||'grid',frame);
      if(p.sticker) p.elements.push({id:uid(),type:'sticker',text:(p.sticker||'🐚').split(' ')[0],x:7,y:10,w:9,h:7,z:80});
      if(p.textBox) p.elements.push({id:uid(),type:'text',text:p.textBox,x:11,y:83,w:35,h:7,z:90});
    }
    if(!p.bg)p.bg=bgFromTheme(p.theme);
    if(!p.frame)p.frame='soft';
    if(!p.layout)p.layout='grid';
    return p;
  }
  function bgFromTheme(theme){return theme==='Sunset'?'sunset':theme==='Rose Gold'?'roseGold':theme==='Lighthouse'?'lighthouse':theme==='Beach Day'?'sand':'seaGlass';}
  function makePage(){
    const photos=selectedPhotoSources();
    const title=$('pageTitle')?.value.trim()||'Scrapbook Page';
    const note=$('pageNote')?.value.trim()||'';
    const layout=$('pageLayout')?.value||'grid';
    const frame=$('pageFrame')?.value||'soft';
    const bg=$('pageBg')?.value||bgFromTheme($('pageTheme')?.value);
    const sticker=($('pageSticker')?.value||'🐚').split(' ')[0];
    const text=($('pageTextBox')?.value||'').trim();
    const elements=makeElements(photos,layout,frame);
    if(sticker)elements.push({id:uid(),type:'sticker',text:sticker,x:7,y:10,w:9,h:7,z:80});
    if(text)elements.push({id:uid(),type:'text',text,x:11,y:83,w:38,h:7,z:90});
    return {id:uid(),title,note,theme:$('pageTheme')?.value||'Beach Day',layout,frame,bg,photos,elements,createdAt:new Date().toISOString()};
  }
  function renderPage(p){
    normalizePage(p);
    const els=[...p.elements].sort((a,b)=>(a.z||0)-(b.z||0)).map(e=>renderElement(p,e)).join('');
    return `<div class="scrapPagePro" id="page-${p.id}"><h3>${esc(p.title)}</h3><p class="layoutHint noPrint">Drag photos, stickers, and text. Use the gold corner to resize. Print saves as PDF.</p><div class="scrapCanvas bg-${esc(p.bg)}" data-page="${p.id}"><div class="scrapTitle">${esc(p.title)}</div>${els}${p.note?`<div class="scrapNote">${esc(p.note)}</div>`:''}</div><div class="scrapToolbar noPrint"><button onclick="addStickerToPage('${p.id}')">Add Sticker</button><button onclick="addTextToPage('${p.id}')">Add Text</button><button onclick="changePageLayout('${p.id}')">Change Layout</button><button onclick="exportScrapbookPage('${p.id}')">Export JPEG</button><button onclick="printScrapbookPage('${p.id}')">PDF / Print</button><button onclick="del('pages','${p.id}')">Delete</button></div></div>`;
  }
  function renderElement(p,e){
    const style=`left:${pct(e.x)};top:${pct(e.y)};width:${pct(e.w)};height:${pct(e.h)};z-index:${e.z||10}`;
    if(e.type==='photo')return `<div class="scrapItem scrapImgWrap frame-${esc(e.frame||p.frame||'soft')}" data-page="${p.id}" data-el="${e.id}" style="${style}"><img src="${e.src}" alt="Scrapbook photo"><span class="scrapResize" data-resize="1"></span></div>`;
    if(e.type==='sticker')return `<div class="scrapItem scrapSticker" data-page="${p.id}" data-el="${e.id}" style="${style}">${esc(e.text||'🐚')}<span class="scrapResize" data-resize="1"></span></div>`;
    return `<div class="scrapItem scrapTextBox" data-page="${p.id}" data-el="${e.id}" style="${style}">${esc(e.text||'Text')}<span class="scrapResize" data-resize="1"></span></div>`;
  }
  window.renderPages=function(){
    const box=$('scrapbookPages'); if(!box)return;
    box.innerHTML=data.pages.length?data.pages.map(renderPage).join(''):'<div class="card"><p>No scrapbook pages yet. Select photos above, choose a layout, then tap Save Scrapbook Page.</p></div>';
    bindScrapDrag();
  };
  function bindScrapDrag(){
    $$('.scrapItem').forEach(el=>{
      el.onpointerdown=(ev)=>{
        if(ev.button!==0)return;
        ev.preventDefault();
        const canvas=el.closest('.scrapCanvas'); if(!canvas)return;
        const p=pageById(el.dataset.page); if(!p)return;
        const item=(p.elements||[]).find(x=>x.id===el.dataset.el); if(!item)return;
        $$('.scrapItem.selected').forEach(x=>x.classList.remove('selected')); el.classList.add('selected');
        const rect=canvas.getBoundingClientRect();
        const resizing=ev.target.dataset.resize==='1';
        const startX=ev.clientX,startY=ev.clientY,start={x:item.x,y:item.y,w:item.w,h:item.h};
        el.setPointerCapture(ev.pointerId);
        el.onpointermove=(mv)=>{
          const dx=(mv.clientX-startX)/rect.width*100;
          const dy=(mv.clientY-startY)/rect.height*100;
          if(resizing){item.w=Math.max(6,Math.min(92,start.w+dx));item.h=Math.max(4,Math.min(80,start.h+dy));}
          else{item.x=Math.max(0,Math.min(98,start.x+dx));item.y=Math.max(0,Math.min(96,start.y+dy));}
          el.style.left=pct(item.x); el.style.top=pct(item.y); el.style.width=pct(item.w); el.style.height=pct(item.h);
        };
        el.onpointerup=()=>{el.onpointermove=null;el.onpointerup=null;save();toast('Scrapbook placement saved');};
      };
    });
  }
  window.addStickerToPage=function(id){const p=pageById(id); if(!p)return; normalizePage(p); const sticker=prompt('Sticker emoji or text',($('pageSticker')?.value||'🐚').split(' ')[0]); if(!sticker)return; p.elements.push({id:uid(),type:'sticker',text:sticker,x:12,y:12,w:10,h:8,z:120+p.elements.length}); save(); renderPages(); toast('Sticker added');};
  window.addTextToPage=function(id){const p=pageById(id); if(!p)return; normalizePage(p); const text=prompt('Text box words',$('pageTextBox')?.value||'Family memories'); if(!text)return; p.elements.push({id:uid(),type:'text',text,x:14,y:78,w:42,h:8,z:130+p.elements.length}); save(); renderPages(); toast('Text box added');};
  window.changePageLayout=function(id){const p=pageById(id); if(!p)return; const next=prompt('Layout: grid, feature, collage, or freeform',p.layout||'grid'); if(!next)return; p.layout=next; const photos=(p.elements||[]).filter(e=>e.type==='photo'); const boxes=layoutPreset(next,photos.length); photos.forEach((e,i)=>Object.assign(e,boxes[i]||e)); save(); renderPages(); toast('Layout updated');};
  window.printScrapbookPage=function(id){$$('.scrapPagePro').forEach(p=>p.classList.toggle('printOnlyActive',p.id===`page-${id}`));window.print();setTimeout(()=>$$('.scrapPagePro').forEach(p=>p.classList.remove('printOnlyActive')),800);};
  if($('savePage')) $('savePage').onclick=()=>{const photos=selectedPhotoSources(); if(!photos.length&&!$('pageTitle').value.trim()&&!$('pageNote').value.trim())return toast('Select photos or add a title/note first.'); const page=makePage(); data.pages.push(page); selectedScrapPhotos=[]; ['pageTitle','pageNote','pageTextBox'].forEach(i=>{if($(i))$(i).value=''}); logActivity(`Scrapbook page saved: ${page.title}`,'scrapbook'); save(); render(); show('scrapbook'); toast('Scrapbook page saved');};
  if($('addTextToDraft')) $('addTextToDraft').onclick=()=>{const t=$('pageTextBox'); if(t){t.focus(); toast('Type your text, then save the scrapbook page.')}};
  if($('printBook')) $('printBook').onclick=()=>window.print();
  if($('exportBook')) $('exportBook').onclick=()=>{const last=data.pages[data.pages.length-1]; if(!last)return toast('Create a scrapbook page first.'); exportScrapbookPage(last.id);};
  window.exportScrapbookPage=async function(id){
    const p=pageById(id); if(!p)return toast('Page not found.'); normalizePage(p);
    try{
      const canvas=document.createElement('canvas'); canvas.width=PAGE_W; canvas.height=PAGE_H; const ctx=canvas.getContext('2d');
      drawBackground(ctx,p.bg); drawTitle(ctx,p.title); 
      for(const e of [...p.elements].sort((a,b)=>(a.z||0)-(b.z||0))) await drawCanvasElement(ctx,e,p);
      if(p.note) drawNote(ctx,p.note);
      const a=document.createElement('a'); a.href=canvas.toDataURL('image/jpeg',.94); a.download=(safeFileName(p.title)||'scrapbook-page')+'.jpg'; a.click(); toast('JPEG exported.');
    }catch(e){console.error(e);toast('JPEG export had trouble with one photo. Print / Save as PDF will still work.');}
  };
  function drawBackground(ctx,bg){
    const g=ctx.createLinearGradient(0,0,PAGE_W,PAGE_H); const map={sunset:['#ffe5c6','#f7dfdc','#d9eef4'],sand:['#f6e4c9','#fff9ee','#e7f5f7'],roseGold:['#f7dfdc','#fff6e7','#f1c9bf'],lighthouse:['#dff5f7','#fffaf4','#f7dfdc'],seaGlass:['#dff5f7','#fffaf4','#f7dfdc']}; const c=map[bg]||map.seaGlass; g.addColorStop(0,c[0]);g.addColorStop(.55,c[1]);g.addColorStop(1,c[2]);ctx.fillStyle=g;ctx.fillRect(0,0,PAGE_W,PAGE_H);ctx.strokeStyle='rgba(201,150,66,.55)';ctx.lineWidth=8;roundRect(ctx,18,18,PAGE_W-36,PAGE_H-36,28);ctx.stroke();
  }
  function drawTitle(ctx,title){ctx.fillStyle='#123a4a';ctx.font='bold 44px Georgia';wrapText(ctx,title||'Scrapbook Page',52,70,PAGE_W-104,48);}
  function drawNote(ctx,note){ctx.fillStyle='rgba(255,250,244,.88)';roundRect(ctx,52,960,PAGE_W-104,90,18);ctx.fill();ctx.fillStyle='#16313d';ctx.font='24px Georgia';wrapText(ctx,note,68,998,PAGE_W-136,30);}
  async function drawCanvasElement(ctx,e,p){
    const x=e.x/100*PAGE_W,y=e.y/100*PAGE_H,w=e.w/100*PAGE_W,h=e.h/100*PAGE_H;
    if(e.type==='photo'){
      drawFrame(ctx,x,y,w,h,e.frame||p.frame||'soft'); const img=await loadImage(e.src); drawCover(ctx,img,x+10,y+10,w-20,h-20);
    }else if(e.type==='sticker'){
      ctx.font=`${Math.max(26,h*.75)}px serif`;ctx.fillText(e.text||'🐚',x,y+h*.8);
    }else{
      ctx.fillStyle='rgba(255,250,244,.88)';roundRect(ctx,x,y,w,h,14);ctx.fill();ctx.fillStyle='#123a4a';ctx.font='bold 24px Georgia';wrapText(ctx,e.text||'Text',x+12,y+30,w-24,27);
    }
  }
  function drawFrame(ctx,x,y,w,h,frame){ctx.save();ctx.fillStyle='white';ctx.strokeStyle='rgba(201,150,66,.75)';ctx.lineWidth=frame==='gold'?6:frame==='shell'?3:1;if(frame==='none'){ctx.restore();return;}roundRect(ctx,x,y,w,h,18);ctx.fill();if(frame==='gold'||frame==='shell')ctx.stroke();ctx.restore();}
  function drawCover(ctx,img,x,y,w,h){const r=Math.min(w/img.width,h/img.height);const nw=img.width*r,nh=img.height*r;ctx.save();roundRect(ctx,x,y,w,h,12);ctx.clip();ctx.fillStyle='#fff';ctx.fillRect(x,y,w,h);ctx.drawImage(img,x+(w-nw)/2,y+(h-nh)/2,nw,nh);ctx.restore();}
  const oldRender507=render; render=function(){oldRender507(); renderPages();};
  renderPages();
})();

/* 5.0.8 adventure dashboard + alerts layer */
(function(){
  const NEW_VERSION='5.0.8';
  function ensureTripTools(){
    data.trips.forEach(t=>{
      if(!Array.isArray(t.budgetItems))t.budgetItems=[];
      if(!Array.isArray(t.reservations))t.reservations=[];
      if(!Array.isArray(t.itinerary))t.itinerary=[];
      if(!Array.isArray(t.sharedNotes))t.sharedNotes=[];
      if(!Array.isArray(t.maps))t.maps=[];
      if(!t.address)t.address=t.destination||'';
      if(!t.budgetEstimate)t.budgetEstimate=t.budget||'';
    });
    ['votes','budget','reservations'].forEach(k=>{if(typeof data.settings.notifications[k]!=='boolean')data.settings.notifications[k]=false});
  }
  const oldNormalize=normalizeData;
  normalizeData=function(){oldNormalize();ensureTripTools();};
  ensureTripTools();

  function pct(done,total){return total?Math.round((done/total)*100):0;}
  function progress(items){const done=items.filter(x=>x.done).length,total=items.length;return `<div class="progressWrap"><div class="progressText">${done} of ${total} complete • ${pct(done,total)}%</div><div class="progressBar"><span style="width:${pct(done,total)}%"></span></div></div>`;}
  function tripName(t){return t?.name||'General';}
  function tripFilter(arr,t){return t?arr.filter(x=>x.trip===t.name||x.tripId===t.id):arr;}
  function totalBudget(t){const items=(t.budgetItems||[]).reduce((a,b)=>a+(Number(b.amount)||0),0);return (Number(t.budgetEstimate)||0)+items;}
  function spentBudget(t){return (t.budgetItems||[]).filter(x=>x.paid).reduce((a,b)=>a+(Number(b.amount)||0),0);}
  function mapUrl(place){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place||'')}`;}
  function directionsUrl(place){return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place||'')}`;}
  function nextTrip(){return byNextTrip()||data.trips[0];}

  // Save trip with map address and budget estimate.
  if($('saveTrip')) $('saveTrip').onclick=()=>{
    const values={
      name:$('tripName').value.trim()||'New Adventure',
      destination:$('tripDestination').value.trim(),
      address:($('tripAddress')?.value||'').trim(),
      start:$('tripStart').value,
      end:$('tripEnd').value,
      visibility:$('tripVisibility').value,
      invitees:$('tripInvitees').value.trim(),
      weather:$('tripWeather').value.trim(),
      budgetEstimate:$('tripBudget')?.value||'',
      notes:$('tripNotes').value.trim()
    };
    let trip;
    if(editingTripId){
      trip=data.trips.find(t=>t.id===editingTripId);
      if(trip){Object.assign(trip,values,{updatedAt:new Date().toISOString()});logActivity(`Trip changed: ${trip.name}`,'trip');notify(`Trip changed: ${trip.name}`,'trips');toast('Trip updated');}
    }else{
      trip={id:uid(),...values,status:'Planning',rsvp:{accept:0,maybe:0,decline:0},voteOptions:[],tripLinks:[],budgetItems:[],reservations:[],itinerary:[],sharedNotes:[],maps:[],createdAt:new Date().toISOString()};
      data.trips.push(trip);logActivity(`New trip: ${trip.name}`,'trip');notify(`New trip added: ${trip.name}`,'trips');toast('Trip saved and added to Trips');
    }
    editingTripId=null;$('saveTrip').textContent='Save Adventure';
    ['tripName','tripDestination','tripStart','tripEnd','tripInvitees','tripWeather','tripNotes'].forEach(i=>{if($(i))$(i).value=''});
    if($('tripAddress'))$('tripAddress').value=''; if($('tripBudget'))$('tripBudget').value='';
    save();render();show('adventures');
  };

  window.editTrip=id=>{const t=data.trips.find(x=>x.id===id);if(!t)return;editingTripId=id;$('tripName').value=t.name||'';$('tripDestination').value=t.destination||'';if($('tripAddress'))$('tripAddress').value=t.address||'';$('tripStart').value=t.start||'';$('tripEnd').value=t.end||'';$('tripVisibility').value=t.visibility||'family';$('tripInvitees').value=t.invitees||'';$('tripWeather').value=t.weather||'';if($('tripBudget'))$('tripBudget').value=t.budgetEstimate||'';$('tripNotes').value=t.notes||'';$('saveTrip').textContent='Update Adventure';window.scrollTo({top:0,behavior:'smooth'});toast('Editing trip. Tap Update Adventure when finished.');};

  function renderTripPlanner(t){
    const id=t.id;
    const votes=(t.voteOptions||[]).map(v=>`<div class="voteRow"><span>${esc(v.text)}</span><strong>${voteCount(v)} vote${voteCount(v)===1?'':'s'}</strong><button onclick="voteTrip('${id}',${(t.voteOptions||[]).indexOf(v)})" class="secondary">Vote / Change</button><button onclick="removeVoteOption('${id}',${(t.voteOptions||[]).indexOf(v)})" class="secondary">Admin Remove</button></div>`).join('')||'<p class="helperText">No family votes yet.</p>';
    return `<div class="tripTools">
      <div class="linkBox"><h4>Links for this Trip</h4>${tripLinkRows(t)}<div class="voteAdd"><input id="tripLinkTitle-${id}" placeholder="Link title" /><input id="tripLinkUrl-${id}" placeholder="https://..." /><button onclick="addTripLink('${id}')" class="secondary">Add trip link</button></div></div>
      <div class="voteBox"><h4>Family Voting</h4><div class="voteOptions">${votes}</div><div class="voteAdd"><input id="voteInput-${id}" placeholder="Add voting option" /><button onclick="addVoteOption('${id}')" class="secondary">Add option</button></div></div>
      <details class="plannerDetails" open><summary>Planning Tools</summary>
        <div class="toolGrid">
          <div><h4>Budget</h4><input id="budgetLabel-${id}" placeholder="Hotel, gas, food..." /><input id="budgetAmount-${id}" type="number" min="0" step="0.01" placeholder="Amount" /><button onclick="addBudgetItem('${id}')" class="secondary">Add budget item</button><div>${(t.budgetItems||[]).map(b=>`<p>💵 ${esc(b.label)} — $${Number(b.amount||0).toFixed(2)} <button onclick="toggleBudgetPaid('${id}','${b.id}')" class="tinyBtn">${b.paid?'Paid':'Mark paid'}</button></p>`).join('')||'<p class="helperText">No budget items.</p>'}</div></div>
          <div><h4>Reservations</h4><input id="reservationTitle-${id}" placeholder="Hotel, flight, rental car..." /><input id="reservationDate-${id}" type="date" /><input id="reservationLink-${id}" placeholder="Confirmation link" /><button onclick="addReservation('${id}')" class="secondary">Add reservation</button><div>${(t.reservations||[]).map(r=>`<p>🏨 ${esc(r.title)} ${r.date?`• ${fmtDate(r.date)}`:''} ${r.link?`<a href="${safeUrl(r.link)}" target="_blank">Open</a>`:''}</p>`).join('')||'<p class="helperText">No reservations.</p>'}</div></div>
          <div><h4>Itinerary</h4><input id="itineraryTime-${id}" placeholder="Day/time" /><input id="itineraryTitle-${id}" placeholder="Activity" /><button onclick="addItinerary('${id}')" class="secondary">Add itinerary item</button><div>${(t.itinerary||[]).map(i=>`<p>🗓️ <b>${esc(i.time)}</b> ${esc(i.title)}</p>`).join('')||'<p class="helperText">No itinerary items.</p>'}</div></div>
          <div><h4>Shared Notes</h4><textarea id="sharedNote-${id}" placeholder="Add a family note..."></textarea><button onclick="addSharedNote('${id}')" class="secondary">Add note</button><div>${(t.sharedNotes||[]).map(n=>`<p>📝 ${esc(n.text)}<br><small>${new Date(n.at).toLocaleString()}</small></p>`).join('')||'<p class="helperText">No shared notes.</p>'}</div></div>
          <div><h4>Maps</h4><input id="mapPlace-${id}" placeholder="Address or place" value="${esc(t.address||t.destination||'')}" /><button onclick="addMapPlace('${id}')" class="secondary">Save map place</button><p><a target="_blank" href="${mapUrl(t.address||t.destination)}">Open map</a> • <a target="_blank" href="${directionsUrl(t.address||t.destination)}">Directions</a></p>${(t.maps||[]).map(m=>`<p>📍 <a target="_blank" href="${mapUrl(m.place)}">${esc(m.place)}</a></p>`).join('')}</div>
          <div><h4>Weather</h4><button onclick="refreshTripWeather('${id}')" class="secondary">Refresh live weather</button><p>${esc(t.weather||'No weather yet.')}</p></div>
        </div>
      </details>
    </div>`;
  }

  renderTrips=function(){ensureTripTools();$('tripList').innerHTML=data.trips.map(t=>`<div class="item tripCard"><h3>${esc(t.name)}</h3><p>${esc(t.destination)} ${t.start?`• ${fmtDate(t.start)} to ${fmtDate(t.end)}`:''}</p><span class="badge">${t.visibility==='private'?'Private / invited only':'Whole family'}</span><span class="badge">${esc(t.status)}</span>${t.weather?`<p class="weatherBox">${esc(t.weather)}</p>`:''}${t.notes?`<p>${esc(t.notes)}</p>`:''}<p>RSVP: ${t.rsvp.accept} accepted • ${t.rsvp.maybe} maybe • ${t.rsvp.decline} declined</p><div class="itemActions"><button onclick="editTrip('${t.id}')" class="primary">Edit Trip</button><button onclick="rsvp('${t.id}','accept')" class="secondary">Accept</button><button onclick="rsvp('${t.id}','maybe')" class="secondary">Maybe</button><button onclick="rsvp('${t.id}','decline')" class="secondary">Decline</button><button onclick="cancelTrip('${t.id}')" class="secondary">Cancel trip</button><button onclick="del('trips','${t.id}')" class="secondary">Delete</button></div>${renderTripPlanner(t)}</div>`).join('')||'<div class="card"><p>No trips yet.</p></div>';};

  window.addBudgetItem=id=>{const t=data.trips.find(x=>x.id===id);if(!t)return;const label=$(`budgetLabel-${id}`).value.trim()||'Budget item';const amount=Number($(`budgetAmount-${id}`).value||0);t.budgetItems.push({id:uid(),label,amount,paid:false});$(`budgetLabel-${id}`).value='';$(`budgetAmount-${id}`).value='';save();render();notify(`Budget item added to ${t.name}: ${label}`,'budget');};
  window.toggleBudgetPaid=(id,bid)=>{const t=data.trips.find(x=>x.id===id);const b=t?.budgetItems?.find(x=>x.id===bid);if(b)b.paid=!b.paid;save();render();};
  window.addReservation=id=>{const t=data.trips.find(x=>x.id===id);if(!t)return;const title=$(`reservationTitle-${id}`).value.trim()||'Reservation';const date=$(`reservationDate-${id}`).value;const link=$(`reservationLink-${id}`).value.trim();t.reservations.push({id:uid(),title,date,link});$(`reservationTitle-${id}`).value='';$(`reservationDate-${id}`).value='';$(`reservationLink-${id}`).value='';save();render();notify(`Reservation added to ${t.name}: ${title}`,'reservations');};
  window.addItinerary=id=>{const t=data.trips.find(x=>x.id===id);if(!t)return;const time=$(`itineraryTime-${id}`).value.trim();const title=$(`itineraryTitle-${id}`).value.trim()||'Activity';t.itinerary.push({id:uid(),time,title});$(`itineraryTime-${id}`).value='';$(`itineraryTitle-${id}`).value='';save();render();notify(`Itinerary added to ${t.name}: ${title}`,'trips');};
  window.addSharedNote=id=>{const t=data.trips.find(x=>x.id===id);if(!t)return;const text=$(`sharedNote-${id}`).value.trim();if(!text)return;t.sharedNotes.unshift({id:uid(),text,at:new Date().toISOString()});$(`sharedNote-${id}`).value='';save();render();notify(`Shared note added to ${t.name}`,'trips');};
  window.addMapPlace=id=>{const t=data.trips.find(x=>x.id===id);if(!t)return;const place=$(`mapPlace-${id}`).value.trim();if(!place)return;t.maps.push({id:uid(),place});if(!t.address)t.address=place;save();render();toast('Map place saved');};

  // Voting notifications. Keep vote changing behavior.
  const oldVoteTrip=window.voteTrip;
  window.voteTrip=function(tripId,index){oldVoteTrip(tripId,index);const t=data.trips.find(x=>x.id===tripId);const v=t?.voteOptions?.[index];if(t&&v)notify(`Vote updated for ${t.name}: ${v.text}`,'votes');};
  const oldAddVoteOption=window.addVoteOption;
  window.addVoteOption=function(tripId){oldAddVoteOption(tripId);const t=data.trips.find(x=>x.id===tripId);if(t)notify(`Voting option added to ${t.name}`,'votes');};

  // Meal notifications.
  if($('saveMeal'))$('saveMeal').onclick=()=>{data.meals.push({id:uid(),trip:$('mealTrip').value,title:$('mealTitle').value,item:$('mealItem').value,person:$('mealPerson').value,done:false});const trip=$('mealTrip').value,item=$('mealItem').value||'meal item';['mealTitle','mealItem','mealPerson'].forEach(i=>$(i).value='');save();render();notify(`Meal assignment added for ${trip}: ${item}`,'meals');toast('Meal added');};
  if($('saveGrocery'))$('saveGrocery').onclick=()=>{data.groceries.push({id:uid(),trip:$('groceryTrip').value,item:$('groceryItem').value,person:$('groceryPerson').value,done:false});const trip=$('groceryTrip').value,item=$('groceryItem').value||'grocery item';['groceryItem','groceryPerson'].forEach(i=>$(i).value='');save();render();notify(`Grocery item added for ${trip}: ${item}`,'meals');toast('Grocery item added');};
  if($('savePacking'))$('savePacking').onclick=()=>{data.packing.push({id:uid(),trip:$('packingTrip').value,item:$('packingItem').value,person:$('packingPerson').value,done:false});['packingItem','packingPerson'].forEach(i=>$(i).value='');save();render();notify('Packing item added','trips');toast('Packing item added');};

  async function geocode(q){const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`);const j=await r.json();return j.results?.[0];}
  async function getWeatherFor(place){const g=await geocode(place);if(!g)throw new Error('Location not found');const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`);const j=await r.json();const c=j.current||{};const d=j.daily||{};return `${Math.round(c.temperature_2m)}°F now • wind ${Math.round(c.wind_speed_10m||0)} mph • rain chance ${d.precipitation_probability_max?.[0]??0}% • high ${Math.round(d.temperature_2m_max?.[0]||0)}° / low ${Math.round(d.temperature_2m_min?.[0]||0)}°`;}
  window.refreshTripWeather=async id=>{const t=data.trips.find(x=>x.id===id);if(!t)return;const place=t.address||t.destination;if(!place)return toast('Add a trip address or destination first.');try{toast('Checking live weather...');t.weather=await getWeatherFor(place);t.weatherUpdatedAt=new Date().toISOString();save();render();notify(`Weather updated for ${t.name}: ${t.weather}`,'weather');}catch(e){console.error(e);toast('Live weather could not load. Check the location and try again.');}};
  if($('refreshWeatherBtn'))$('refreshWeatherBtn').onclick=()=>{const t=nextTrip();if(t)refreshTripWeather(t.id);else toast('Add a trip first.');};

  function birthdayAlerts(){const now=new Date();const mmdd=`${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;data.people.forEach(p=>{if(p.birthday&&p.birthday.slice(5)===mmdd){const key='bday-'+p.id+'-'+now.getFullYear();if(localStorage.getItem(key)!=='yes'){localStorage.setItem(key,'yes');notify(`Birthday reminder: ${p.name}`,'birthdays');}}});}
  function weatherAlerts(){data.trips.forEach(t=>{if(!t.start)return;const days=daysUntil(t.start);if(days<=3&&days>=0&&t.address&&!t.weatherUpdatedAt){const key='weather-alert-'+t.id; if(localStorage.getItem(key)!=='yes'){localStorage.setItem(key,'yes');notify(`Weather alert: refresh live weather for ${t.name}`,'weather');}}});}

  renderDashboard=function(){ensureTripTools();const t=nextTrip();$('dashTripName').textContent=t?t.name:'No adventure selected';$('dashTripDetails').textContent=t?`${t.destination||''} ${t.start?`• ${fmtDate(t.start)} to ${fmtDate(t.end)}`:''}`:'Create an adventure to fill this dashboard.';if($('dashCountdown'))$('dashCountdown').textContent=t?.start?`${daysUntil(t.start)} days until ${t.name}`:'Add trip dates to start the countdown.';$('dashWeather').textContent=t?.weather||'Use Refresh Live Weather after adding a destination or address.';const mealItems=tripFilter(data.meals,t), packItems=tripFilter(data.packing,t), groceryItems=tripFilter(data.groceries,t);$('dashMeals').innerHTML=mealItems.slice(0,5).map(x=>`<p>🍽️ ${esc(x.title)}: ${esc(x.item)} ${x.person?`— ${esc(x.person)}`:''}</p>`).join('')||'<p>No meals yet.</p>';if($('dashPackingProgress'))$('dashPackingProgress').innerHTML=progress(packItems);$('dashPacking').innerHTML=packItems.slice(0,5).map(x=>`<p>${x.done?'✅':'⬜'} ${esc(x.item)}</p>`).join('')||'<p>No packing items yet.</p>';if($('dashGroceryProgress'))$('dashGroceryProgress').innerHTML=progress(groceryItems);$('dashGrocery').innerHTML=groceryItems.slice(0,5).map(x=>`<p>${x.done?'✅':'⬜'} ${esc(x.item)}</p>`).join('')||'<p>No grocery items yet.</p>';if($('dashBudget'))$('dashBudget').innerHTML=t?`<p><b>Total planned:</b> $${totalBudget(t).toFixed(2)}</p><p><b>Marked paid:</b> $${spentBudget(t).toFixed(2)}</p>${(t.budgetItems||[]).slice(0,5).map(b=>`<p>💵 ${esc(b.label)} — $${Number(b.amount||0).toFixed(2)}</p>`).join('')}`:'<p>No budget yet.</p>';if($('dashReservations'))$('dashReservations').innerHTML=t?(t.reservations||[]).slice(0,5).map(r=>`<p>🏨 ${esc(r.title)} ${r.date?`• ${fmtDate(r.date)}`:''}</p>`).join('')||'<p>No reservations yet.</p>':'<p>No reservations yet.</p>';if($('dashMaps'))$('dashMaps').innerHTML=t?`<p><a target="_blank" href="${mapUrl(t.address||t.destination)}">Open map</a> • <a target="_blank" href="${directionsUrl(t.address||t.destination)}">Directions</a></p>${(t.maps||[]).slice(0,5).map(m=>`<p>📍 ${esc(m.place)}</p>`).join('')}`:'<p>No maps yet.</p>';if($('dashItinerary'))$('dashItinerary').innerHTML=t?(t.itinerary||[]).slice(0,8).map(i=>`<p>🗓️ <b>${esc(i.time)}</b> ${esc(i.title)}</p>`).join('')||'<p>No itinerary yet.</p>':'<p>No itinerary yet.</p>';if($('dashVotes'))$('dashVotes').innerHTML=t?(t.voteOptions||[]).map(v=>`<p>🗳️ ${esc(v.text)} — ${voteCount(v)} vote${voteCount(v)===1?'':'s'}</p>`).join('')||'<p>No votes yet.</p>':'<p>No votes yet.</p>';if($('dashNotes'))$('dashNotes').innerHTML=t?(t.sharedNotes||[]).slice(0,5).map(n=>`<p>📝 ${esc(n.text)}</p>`).join('')||'<p>No shared notes yet.</p>':'<p>No shared notes yet.</p>';$('dashMemories').innerHTML=data.memories.slice(-5).reverse().map(x=>`<p>📸 ${esc(x.title)}</p>`).join('')||'<p>No memories yet.</p>';};

  const oldRender508=render;
  render=function(){ensureTripTools();oldRender508();renderDashboard();birthdayAlerts();weatherAlerts();};
  $$('.notifySetting').forEach(cb=>{cb.checked=!!data.settings.notifications[cb.value];cb.onchange=()=>{data.settings.notifications[cb.value]=cb.checked;save();toast('Notification setting saved');renderNotificationLog();};});
  render();
})();

/* 5.0.9 scrapbook draft workflow + non-duplicated photo saving */
(function(){
  const VERSION='5.0.9';
  let draftPage=null;
  const PAGE_W=850, PAGE_H=1100;

  function pageById(id){return data.pages.find(p=>String(p.id)===String(id));}
  function allPhotoObjects(){return imageMedia().map(x=>({id:x.id,src:x.src,name:x.name||x.memoryTitle||'Photo',memoryTitle:x.memoryTitle||''}));}
  function selectedPhotoObjects(){const all=allPhotoObjects();return all.filter(x=>selectedScrapPhotos.includes(x.id));}
  function srcFor(el){
    if(el.src)return el.src;
    if(el.mediaId){const m=allPhotoObjects().find(x=>x.id===el.mediaId);return m?.src||'';}
    return '';
  }
  function pct(n){return Math.round(n*1000)/10+'%';}
  function bgFromTheme(theme){return theme==='Sunset'?'sunset':theme==='Rose Gold'?'roseGold':theme==='Lighthouse'?'lighthouse':theme==='Beach Day'?'sand':'seaGlass';}
  function layoutPreset(layout,count){
    if(layout==='feature')return [{x:6,y:19,w:58,h:52},{x:68,y:19,w:25,h:16},{x:68,y:38,w:25,h:16},{x:68,y:57,w:25,h:16},{x:6,y:74,w:27,h:14},{x:36,y:74,w:27,h:14},{x:66,y:74,w:27,h:14}];
    if(layout==='collage')return [{x:6,y:19,w:42,h:31},{x:51,y:19,w:42,h:20},{x:51,y:42,w:20,h:23},{x:73,y:42,w:20,h:23},{x:6,y:53,w:42,h:22},{x:51,y:68,w:42,h:20},{x:6,y:78,w:26,h:12},{x:35,y:78,w:26,h:12}];
    if(layout==='freeform')return Array.from({length:Math.max(count,1)},(_,i)=>({x:8+(i%3)*28,y:20+Math.floor(i/3)*22,w:26,h:18}));
    return Array.from({length:Math.max(count,1)},(_,i)=>{const col=i%2,row=Math.floor(i/2);return {x:6+col*46,y:18+row*23,w:42,h:20};});
  }
  function makePhotoElements(photos,layout,frame){const boxes=layoutPreset(layout,photos.length);return photos.map((p,i)=>({id:uid(),type:'photo',mediaId:p.id,x:boxes[i]?.x??8,y:boxes[i]?.y??18,w:boxes[i]?.w??38,h:boxes[i]?.h??25,frame:frame||'soft',z:10+i}));}
  function normalizePage(p){
    if(!p.elements){
      const oldPhotos=(p.photos||[]).map((src,i)=>({id:uid(),type:'photo',src,x:8+(i%2)*44,y:20+Math.floor(i/2)*24,w:40,h:20,frame:p.frame||'soft',z:10+i}));
      p.elements=oldPhotos;
    }
    p.elements.forEach(e=>{if(e.type==='photo'&&e.src&&!e.mediaId){const found=allPhotoObjects().find(x=>x.src===e.src);if(found){e.mediaId=found.id;delete e.src;}}});
    if(!p.bg)p.bg=bgFromTheme(p.theme);
    if(!p.frame)p.frame='soft';
    if(!p.layout)p.layout='grid';
    return p;
  }
  function readDraftFromForm(){
    const photos=selectedPhotoObjects();
    const title=$('pageTitle')?.value.trim()||'Scrapbook Page';
    const note=$('pageNote')?.value.trim()||'';
    const layout=$('pageLayout')?.value||'grid';
    const frame=$('pageFrame')?.value||'soft';
    const bg=$('pageBg')?.value||bgFromTheme($('pageTheme')?.value);
    const sticker=($('pageSticker')?.value||'🐚').split(' ')[0];
    const text=($('pageTextBox')?.value||'').trim();
    const elements=makePhotoElements(photos,layout,frame);
    if(sticker)elements.push({id:uid(),type:'sticker',text:sticker,x:7,y:10,w:9,h:7,z:80});
    if(text)elements.push({id:uid(),type:'text',text,x:11,y:83,w:38,h:7,z:90});
    return {id:'draft',title,note,theme:$('pageTheme')?.value||'Beach Day',layout,frame,bg,elements,createdAt:new Date().toISOString()};
  }
  function renderElement(p,e){
    const style=`left:${pct(e.x)};top:${pct(e.y)};width:${pct(e.w)};height:${pct(e.h)};z-index:${e.z||10}`;
    if(e.type==='photo')return `<div class="scrapItem scrapImgWrap frame-${esc(e.frame||p.frame||'soft')}" data-page="${p.id}" data-el="${e.id}" style="${style}"><img src="${srcFor(e)}" alt="Scrapbook photo"><span class="scrapResize" data-resize="1"></span></div>`;
    if(e.type==='sticker')return `<div class="scrapItem scrapSticker" data-page="${p.id}" data-el="${e.id}" style="${style}">${esc(e.text||'🐚')}<span class="scrapResize" data-resize="1"></span></div>`;
    return `<div class="scrapItem scrapTextBox" data-page="${p.id}" data-el="${e.id}" style="${style}">${esc(e.text||'Text')}<span class="scrapResize" data-resize="1"></span></div>`;
  }
  function pageHtml(p,isDraft=false){normalizePage(p);const els=[...p.elements].sort((a,b)=>(a.z||0)-(b.z||0)).map(e=>renderElement(p,e)).join('');return `<div class="scrapPagePro ${isDraft?'draftPage':''}" id="page-${p.id}"><h3>${isDraft?'Rearrange Your Page':esc(p.title)}</h3><p class="layoutHint noPrint">Drag photos, stickers, and text. Use the gold corner to resize.</p><div class="scrapCanvas bg-${esc(p.bg)}" data-page="${p.id}"><div class="scrapTitle">${esc(p.title)}</div>${els}${p.note?`<div class="scrapNote">${esc(p.note)}</div>`:''}</div>${isDraft?`<div class="scrapToolbar noPrint"><button onclick="saveDraftScrapbookPage()" class="primary">Create Scrapbook Page</button><button onclick="cancelDraftScrapbookPage()" class="secondary">Cancel Draft</button></div>`:`<div class="scrapToolbar noPrint"><button onclick="addStickerToPage('${p.id}')">Add Sticker</button><button onclick="addTextToPage('${p.id}')">Add Text</button><button onclick="changePageLayout('${p.id}')">Change Layout</button><button onclick="exportScrapbookPage('${p.id}')">Export JPEG</button><button onclick="printScrapbookPage('${p.id}')">PDF / Print</button><button onclick="del('pages','${p.id}')">Delete</button></div>`}</div>`;}
  function bindDrag(){
    $$('.scrapItem').forEach(el=>{el.onpointerdown=(ev)=>{if(ev.button!==0)return;ev.preventDefault();const canvas=el.closest('.scrapCanvas');if(!canvas)return;const pg=el.dataset.page==='draft'?draftPage:pageById(el.dataset.page);if(!pg)return;const item=(pg.elements||[]).find(x=>x.id===el.dataset.el);if(!item)return;$$('.scrapItem.selected').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');const rect=canvas.getBoundingClientRect();const resizing=ev.target.dataset.resize==='1';const startX=ev.clientX,startY=ev.clientY,start={x:item.x,y:item.y,w:item.w,h:item.h};el.setPointerCapture(ev.pointerId);el.onpointermove=(mv)=>{const dx=(mv.clientX-startX)/rect.width*100;const dy=(mv.clientY-startY)/rect.height*100;if(resizing){item.w=Math.max(6,Math.min(92,start.w+dx));item.h=Math.max(4,Math.min(80,start.h+dy));}else{item.x=Math.max(0,Math.min(98,start.x+dx));item.y=Math.max(0,Math.min(96,start.y+dy));}el.style.left=pct(item.x);el.style.top=pct(item.y);el.style.width=pct(item.w);el.style.height=pct(item.h);};el.onpointerup=()=>{el.onpointermove=null;el.onpointerup=null;if(pg.id!=='draft')save();toast(pg.id==='draft'?'Draft placement updated':'Scrapbook placement saved');};};});
  }
  function ensureDraftArea(){
    if(!$('scrapbookDraftArea')){const pick=$('scrapbookPhotoPicker');if(pick)pick.insertAdjacentHTML('afterend','<div id="scrapbookDraftArea" class="card noPrint hidden"></div>');}
    const saveBtn=$('savePage'); if(saveBtn)saveBtn.textContent='Create Draft Page';
  }
  window.renderScrapbookChoices=function(){
    const imgs=allPhotoObjects(); const count=`<p class="selectedCount">${selectedScrapPhotos.length} photo${selectedScrapPhotos.length===1?'':'s'} selected.</p>`;
    $('scrapbookMemoryChoices').innerHTML=imgs.length?`${count}<div class="memorySelect">${imgs.map(x=>`<button type="button" class="memoryChoice ${selectedScrapPhotos.includes(x.id)?'selected':''}" onclick="toggleScrapPhoto('${x.id}')"><img src="${x.src}" alt="${esc(x.name)}"><small>${esc(x.memoryTitle)}</small></button>`).join('')}</div><div class="buttonRow"><button id="createDraftPageBtn" class="primary" type="button">Create Draft Page</button><button id="clearSelectedPhotosBtn" class="secondary" type="button">Clear Selected</button></div>`:'<p>No memory photos yet. Save photos in Memories first, then come back here.</p>';
    const c=$('createDraftPageBtn'); if(c)c.onclick=()=>window.createDraftScrapbookPage(); const clr=$('clearSelectedPhotosBtn'); if(clr)clr.onclick=()=>{selectedScrapPhotos=[];draftPage=null;renderScrapbookChoices();renderDraft();};
  };
  window.toggleScrapPhoto=id=>{selectedScrapPhotos=selectedScrapPhotos.includes(id)?selectedScrapPhotos.filter(x=>x!==id):[...selectedScrapPhotos,id];renderScrapbookChoices();};
  function renderDraft(){ensureDraftArea();const box=$('scrapbookDraftArea');if(!box)return;if(!draftPage){box.classList.add('hidden');box.innerHTML='';return;}box.classList.remove('hidden');box.innerHTML=`<h3>Step 2: Rearrange Before Saving</h3><p>Move photos around, resize them, then tap <b>Create Scrapbook Page</b>.</p>${pageHtml(draftPage,true)}`;bindDrag();}
  window.createDraftScrapbookPage=function(){if(!selectedPhotoObjects().length&&!$('pageTitle')?.value.trim()&&!$('pageNote')?.value.trim())return toast('Select photos or add a title/note first.');draftPage=readDraftFromForm();renderDraft();toast('Draft created. Rearrange the page, then create it.');};
  window.saveDraftScrapbookPage=function(){if(!draftPage)return toast('Create a draft page first.');const page=JSON.parse(JSON.stringify(draftPage));page.id=uid();page.createdAt=new Date().toISOString();page.elements.forEach(e=>{if(e.type==='photo')delete e.src;});page.photos=[];data.pages.push(page);draftPage=null;selectedScrapPhotos=[];['pageTitle','pageNote','pageTextBox'].forEach(i=>{if($(i))$(i).value=''});logActivity(`Scrapbook page saved: ${page.title}`,'scrapbook');save();render();show('scrapbook');toast('Scrapbook page saved with photos');};
  window.cancelDraftScrapbookPage=function(){draftPage=null;renderDraft();toast('Draft canceled');};
  if($('savePage'))$('savePage').onclick=()=>window.createDraftScrapbookPage();
  window.renderPages=function(){const box=$('scrapbookPages');if(!box)return;data.pages.forEach(normalizePage);box.innerHTML=data.pages.length?data.pages.map(p=>pageHtml(p,false)).join(''):'<div class="card"><p>No scrapbook pages yet. Select photos above, tap Create Draft Page, rearrange, then tap Create Scrapbook Page.</p></div>';bindDrag();};
  window.addStickerToPage=function(id){const p=pageById(id);if(!p)return;normalizePage(p);const sticker=prompt('Sticker emoji or text',($('pageSticker')?.value||'🐚').split(' ')[0]);if(!sticker)return;p.elements.push({id:uid(),type:'sticker',text:sticker,x:12,y:12,w:10,h:8,z:120+p.elements.length});save();renderPages();toast('Sticker added');};
  window.addTextToPage=function(id){const p=pageById(id);if(!p)return;normalizePage(p);const text=prompt('Text box words',$('pageTextBox')?.value||'Family memories');if(!text)return;p.elements.push({id:uid(),type:'text',text,x:14,y:78,w:42,h:8,z:130+p.elements.length});save();renderPages();toast('Text box added');};
  window.changePageLayout=function(id){const p=pageById(id);if(!p)return;normalizePage(p);const next=prompt('Layout: grid, feature, collage, or freeform',p.layout||'grid');if(!next)return;p.layout=next;const photos=(p.elements||[]).filter(e=>e.type==='photo');const boxes=layoutPreset(next,photos.length);photos.forEach((e,i)=>Object.assign(e,boxes[i]||e));save();renderPages();toast('Layout updated');};
  window.printScrapbookPage=function(id){$$('.scrapPagePro').forEach(p=>p.classList.toggle('printOnlyActive',p.id===`page-${id}`));window.print();setTimeout(()=>$$('.scrapPagePro').forEach(p=>p.classList.remove('printOnlyActive')),800);};
  window.exportScrapbookPage=async function(id){const p=pageById(id);if(!p)return toast('Page not found.');normalizePage(p);try{const canvas=document.createElement('canvas');canvas.width=PAGE_W;canvas.height=PAGE_H;const ctx=canvas.getContext('2d');drawBackground(ctx,p.bg);drawTitle(ctx,p.title);for(const e of [...p.elements].sort((a,b)=>(a.z||0)-(b.z||0)))await drawCanvasElement(ctx,e,p);if(p.note)drawNote(ctx,p.note);const a=document.createElement('a');a.href=canvas.toDataURL('image/jpeg',.94);a.download=(safeFileName(p.title)||'scrapbook-page')+'.jpg';a.click();toast('JPEG exported.');}catch(err){console.error(err);toast('JPEG export had trouble with one photo. Print / Save as PDF will still work.');}};
  function drawBackground(ctx,bg){const g=ctx.createLinearGradient(0,0,PAGE_W,PAGE_H);const map={sunset:['#ffe5c6','#f7dfdc','#d9eef4'],sand:['#f6e4c9','#fff9ee','#e7f5f7'],roseGold:['#f7dfdc','#fff6e7','#f1c9bf'],lighthouse:['#dff5f7','#fffaf4','#f7dfdc'],seaGlass:['#dff5f7','#fffaf4','#f7dfdc']};const c=map[bg]||map.seaGlass;g.addColorStop(0,c[0]);g.addColorStop(.55,c[1]);g.addColorStop(1,c[2]);ctx.fillStyle=g;ctx.fillRect(0,0,PAGE_W,PAGE_H);ctx.strokeStyle='rgba(201,150,66,.55)';ctx.lineWidth=8;roundRect(ctx,18,18,PAGE_W-36,PAGE_H-36,28);ctx.stroke();}
  function drawTitle(ctx,title){ctx.fillStyle='#123a4a';ctx.font='bold 44px Georgia';wrapText(ctx,title||'Scrapbook Page',52,70,PAGE_W-104,48);}
  function drawNote(ctx,note){ctx.fillStyle='rgba(255,250,244,.88)';roundRect(ctx,52,960,PAGE_W-104,90,18);ctx.fill();ctx.fillStyle='#16313d';ctx.font='24px Georgia';wrapText(ctx,note,68,998,PAGE_W-136,30);}
  async function drawCanvasElement(ctx,e,p){const x=e.x/100*PAGE_W,y=e.y/100*PAGE_H,w=e.w/100*PAGE_W,h=e.h/100*PAGE_H;if(e.type==='photo'){drawFrame(ctx,x,y,w,h,e.frame||p.frame||'soft');const s=srcFor(e);if(s){const img=await loadImage(s);drawCover(ctx,img,x+10,y+10,w-20,h-20);}}else if(e.type==='sticker'){ctx.font=`${Math.max(26,h*.75)}px serif`;ctx.fillText(e.text||'🐚',x,y+h*.8);}else{ctx.fillStyle='rgba(255,250,244,.88)';roundRect(ctx,x,y,w,h,14);ctx.fill();ctx.fillStyle='#123a4a';ctx.font='bold 24px Georgia';wrapText(ctx,e.text||'Text',x+12,y+30,w-24,27);}}
  function drawFrame(ctx,x,y,w,h,frame){ctx.save();ctx.fillStyle='white';ctx.strokeStyle='rgba(201,150,66,.75)';ctx.lineWidth=frame==='gold'?6:frame==='shell'?3:1;if(frame==='none'){ctx.restore();return;}roundRect(ctx,x,y,w,h,18);ctx.fill();if(frame==='gold'||frame==='shell')ctx.stroke();ctx.restore();}
  function drawCover(ctx,img,x,y,w,h){const r=Math.min(w/img.width,h/img.height);const nw=img.width*r,nh=img.height*r;ctx.save();roundRect(ctx,x,y,w,h,12);ctx.clip();ctx.fillStyle='#fff';ctx.fillRect(x,y,w,h);ctx.drawImage(img,x+(w-nw)/2,y+(h-nh)/2,nw,nh);ctx.restore();}
  const oldRender509=render;render=function(){oldRender509();ensureDraftArea();renderScrapbookChoices();renderDraft();renderPages();};
  ensureDraftArea();renderScrapbookChoices();renderDraft();renderPages();
})();


/* 5.0.10 scrapbook/photo + individual checklist + analytics fixes */
(function(){
  const OFA_PATCH='5.0.10';
  // Admin PIN requested by Melissa
  data.settings = data.settings || {};
  if(!data.settings.adminPin || data.settings.adminPin === '1234') data.settings.adminPin = '1218';
  window.unlockAdmin = function(){
    if(sessionStorage.getItem('ofa_admin_unlocked')==='yes') return true;
    const pin = prompt('Admin PIN');
    if(pin === String(data.settings.adminPin || '1218')){ sessionStorage.setItem('ofa_admin_unlocked','yes'); toast('Admin unlocked'); return true; }
    toast('Admin only'); return false;
  };

  // Robust page navigation. This fixes Welcome Home cards/menu buttons even after dynamic renders.
  document.addEventListener('click', function(ev){
    const nav = ev.target.closest('[data-go]');
    if(!nav) return;
    const id = nav.dataset.go;
    if(!id || !document.getElementById(id)) return;
    ev.preventDefault();
    show(id);
  }, true);

  // Add Analytics page and drawer link if missing.
  function ensureAnalyticsPage(){
    const main=document.querySelector('main');
    if(main && !document.getElementById('analytics')){
      main.insertAdjacentHTML('beforeend', `<section id="analytics" class="page"><div class="pageHead"><h2>Voting Analytics</h2><p>See who voted for each trip and each lodging/planning option.</p></div><div id="analyticsContent" class="analyticsGrid"></div></section>`);
    }
    const drawer=document.getElementById('drawer');
    if(drawer && !drawer.querySelector('[data-go="analytics"]')){
      const settings=drawer.querySelector('[data-go="settings"]');
      const btn=document.createElement('button'); btn.dataset.go='analytics'; btn.textContent='Voting Analytics';
      if(settings) drawer.insertBefore(btn, settings); else drawer.appendChild(btn);
    }
  }

  function voterList(v){ return Object.keys(v.votes||{}).sort(); }
  window.renderAnalytics=function(){
    ensureAnalyticsPage();
    const box=document.getElementById('analyticsContent'); if(!box) return;
    if(!data.trips.length){ box.innerHTML='<div class="card"><p>No trips or votes yet.</p></div>'; return; }
    box.innerHTML=data.trips.map(t=>{
      const options=(t.voteOptions||[]);
      const total=options.reduce((a,v)=>a+voterList(v).length+(v.legacyCount||0),0);
      const rows=options.length?options.map(v=>{
        const voters=voterList(v);
        const count=voters.length+(v.legacyCount||0);
        const percent=total?Math.round(count/total*100):0;
        return `<div class="voteAnalyticsRow"><div><b>${esc(v.text)}</b><small>${count} vote${count===1?'':'s'} • ${percent}%</small></div><div class="progressBar"><span style="width:${percent}%"></span></div><p class="voterNames">${voters.length?esc(voters.join(', ')):'No named voters yet'}${v.legacyCount?`<br><small>${v.legacyCount} older vote${v.legacyCount===1?'':'s'} before named voting</small>`:''}</p></div>`;
      }).join(''):'<p>No voting options yet.</p>';
      return `<div class="card analyticsCard"><h3>${esc(t.name)}</h3><p>${esc(t.destination||'')} ${t.start?`• ${fmtDate(t.start)}`:''}</p>${rows}</div>`;
    }).join('');
  };

  // Better "current user" identity for individual checklists and voting.
  window.currentFamilyUser=function(){
    if(window.firebaseUser && firebaseUser.email) return firebaseUser.email;
    let name=localStorage.getItem('ofa_voter_name') || localStorage.getItem('ofa_family_user') || '';
    if(!name){ name=prompt('Your name'); if(name){ localStorage.setItem('ofa_family_user',name.trim()); localStorage.setItem('ofa_voter_name',name.trim()); } }
    return (name||'Family Member').trim();
  };

  // If user changes vote, only their own vote moves.
  window.currentVoter=function(){ return window.currentFamilyUser(); };

  function isShared(person){ return !person || /shared|everyone|all|family|group/i.test(String(person)); }
  function completeMap(x){ if(!x.completedBy) x.completedBy={}; return x.completedBy; }
  window.toggleDone=function(key,id){
    const item=(data[key]||[]).find(i=>i.id===id); if(!item) return;
    const user=window.currentFamilyUser();
    const map=completeMap(item);
    map[user] ? delete map[user] : map[user]=new Date().toISOString();
    // Keep old global done from making it completed for everyone.
    item.done=false;
    save(); render(); toast(map[user]?'Completed for you':'Unchecked for you');
  };
  window.toggleSharedDone=function(key,id){
    const item=(data[key]||[]).find(i=>i.id===id); if(!item) return;
    item.sharedDone=!item.sharedDone; item.done=!!item.sharedDone;
    save(); render(); toast(item.sharedDone?'Marked complete for shared list':'Marked not complete');
  };
  function checklistItem(key,x,title,subtitle){
    const user=window.currentFamilyUser();
    const mine=!!(x.completedBy&&x.completedBy[user]);
    const shared=isShared(x.person);
    const completedBy=Object.keys(x.completedBy||{});
    return `<div class="item checklistItem ${mine||x.sharedDone?'doneSoft':''}"><label class="checkLine"><input type="checkbox" ${mine?'checked':''} onchange="toggleDone('${key}','${x.id}')"><span><b>${esc(title)}</b><small>${esc(subtitle||'')}</small></span></label><p class="helperText">${shared?'Shared item':'Assigned to '+esc(x.person)}${completedBy.length?` • Completed by: ${esc(completedBy.join(', '))}`:''}</p><div class="itemActions"><button onclick="toggleSharedDone('${key}','${x.id}')" class="secondary smallBtn">${x.sharedDone?'Undo Shared':'Shared Done'}</button><button onclick="del('${key}','${x.id}')" class="secondary smallBtn">Delete</button></div></div>`;
  }
  window.renderPacking=function(){
    const box=document.getElementById('packingList'); if(!box) return;
    const shared=data.packing.filter(x=>isShared(x.person));
    const individual=data.packing.filter(x=>!isShared(x.person));
    box.innerHTML=`<div class="card"><h3>Shared Packing Checklist</h3>${shared.map(p=>checklistItem('packing',p,p.item,p.trip)).join('')||'<p>No shared packing items yet.</p>'}</div><div class="card"><h3>Individual Packing Checklist</h3>${individual.map(p=>checklistItem('packing',p,p.item,`${p.trip} • ${p.person||''}`)).join('')||'<p>No individual packing items yet.</p>'}</div>`;
  };
  window.renderMeals=function(){
    const box=document.getElementById('mealList'); if(!box) return;
    const mealShared=data.meals.filter(x=>isShared(x.person));
    const mealInd=data.meals.filter(x=>!isShared(x.person));
    const shopShared=data.groceries.filter(x=>isShared(x.person));
    const shopInd=data.groceries.filter(x=>!isShared(x.person));
    box.innerHTML=`<div class="card"><h3>Shared Meals Checklist</h3>${mealShared.map(m=>checklistItem('meals',m,`${m.title}: ${m.item}`,m.trip)).join('')||'<p>No shared meal items yet.</p>'}</div><div class="card"><h3>Individual Meals Checklist</h3>${mealInd.map(m=>checklistItem('meals',m,`${m.title}: ${m.item}`,`${m.trip} • ${m.person||''}`)).join('')||'<p>No individual meal items yet.</p>'}</div><div class="card"><h3>Shared Shopping Checklist</h3>${shopShared.map(g=>checklistItem('groceries',g,g.item,g.trip)).join('')||'<p>No shared grocery items yet.</p>'}</div><div class="card"><h3>Individual Shopping Checklist</h3>${shopInd.map(g=>checklistItem('groceries',g,g.item,`${g.trip} • ${g.person||''}`)).join('')||'<p>No individual grocery items yet.</p>'}</div>`;
  };

  // Improve dashboard progress so it is based on the current user OR shared completion, not global everyone.
  function doneForMe(x){const user=window.currentFamilyUser(); return !!x.sharedDone || !!(x.completedBy&&x.completedBy[user]);}
  function progressFor(items){const total=items.length, done=items.filter(doneForMe).length, pct=total?Math.round(done/total*100):0;return `<div class="progressWrap"><div class="progressText">${done} of ${total} complete for you • ${pct}%</div><div class="progressBar"><span style="width:${pct}%"></span></div></div>`;}
  const prevDashboard=window.renderDashboard || renderDashboard;
  window.renderDashboard=function(){
    try{ prevDashboard(); }catch(e){ console.warn(e); }
    const t=byNextTrip()||data.trips[0];
    const trip=t?.name;
    const packItems=trip?data.packing.filter(x=>x.trip===trip):data.packing;
    const groceryItems=trip?data.groceries.filter(x=>x.trip===trip):data.groceries;
    const mealItems=trip?data.meals.filter(x=>x.trip===trip):data.meals;
    if(document.getElementById('dashPackingProgress')) document.getElementById('dashPackingProgress').innerHTML=progressFor(packItems);
    if(document.getElementById('dashGroceryProgress')) document.getElementById('dashGroceryProgress').innerHTML=progressFor(groceryItems);
    if(document.getElementById('dashPacking')) document.getElementById('dashPacking').innerHTML=packItems.slice(0,8).map(x=>`<p>${doneForMe(x)?'✅':'⬜'} ${esc(x.item)}${x.person?` — ${esc(x.person)}`:''}</p>`).join('')||'<p>No packing items yet.</p>';
    if(document.getElementById('dashGrocery')) document.getElementById('dashGrocery').innerHTML=groceryItems.slice(0,8).map(x=>`<p>${doneForMe(x)?'✅':'⬜'} ${esc(x.item)}${x.person?` — ${esc(x.person)}`:''}</p>`).join('')||'<p>No grocery items yet.</p>';
    if(document.getElementById('dashMeals')) document.getElementById('dashMeals').innerHTML=mealItems.slice(0,8).map(x=>`<p>${doneForMe(x)?'✅':'⬜'} ${esc(x.title)}: ${esc(x.item)}${x.person?` — ${esc(x.person)}`:''}</p>`).join('')||'<p>No meals yet.</p>';
  };

  // Scrapbook 5.0.10: keep stable photo sources, fix saved-page photos, selectable layout changes, and no cropped lighthouse word background.
  const PAGE_W=850, PAGE_H=1100;
  function photoLookup(){
    const map={};
    (data.memories||[]).forEach(m=>(m.media||[]).forEach(media=>{ if(media.type==='image'){ map[media.id]=media.src; if(media.src) map[media.src]=media.src; } }));
    return map;
  }
  function srcForPhoto(e){ const map=photoLookup(); return e.src || map[e.mediaId] || map[e.photoId] || ''; }
  function bgFromTheme(theme){return theme==='Sunset'?'sunset':theme==='Rose Gold'?'roseGold':theme==='Lighthouse'?'lighthouseClean':theme==='Beach Day'?'sand':'seaGlass';}
  function normalizeScrapPage(p){
    p.elements = Array.isArray(p.elements) ? p.elements : [];
    if(!p.elements.length && Array.isArray(p.photos)){
      p.elements = p.photos.map((src,i)=>({id:uid(),type:'photo',src,mediaId:src,x:8+(i%2)*44,y:20+Math.floor(i/2)*24,w:40,h:20,frame:p.frame||'soft',z:10+i}));
    }
    p.elements.forEach(e=>{ if(e.type==='photo' && !e.src){ const src=srcForPhoto(e); if(src) e.src=src; }});
    p.bg = p.bg || bgFromTheme(p.theme);
    p.frame = p.frame || 'soft';
    p.layout = p.layout || 'grid';
    return p;
  }
  function pct(n){return Math.round(n*1000)/10+'%';}
  function boxes(layout,count){
    if(layout==='feature')return [{x:6,y:19,w:58,h:52},{x:68,y:19,w:25,h:16},{x:68,y:38,w:25,h:16},{x:68,y:57,w:25,h:16},{x:6,y:74,w:27,h:14},{x:36,y:74,w:27,h:14},{x:66,y:74,w:27,h:14}];
    if(layout==='collage')return [{x:6,y:19,w:42,h:31},{x:51,y:19,w:42,h:20},{x:51,y:42,w:20,h:23},{x:73,y:42,w:20,h:23},{x:6,y:53,w:42,h:22},{x:51,y:68,w:42,h:20},{x:6,y:78,w:26,h:12},{x:35,y:78,w:26,h:12}];
    if(layout==='freeform')return Array.from({length:Math.max(count,1)},(_,i)=>({x:8+(i%3)*28,y:20+Math.floor(i/3)*22,w:26,h:18}));
    return Array.from({length:Math.max(count,1)},(_,i)=>({x:6+(i%2)*46,y:18+Math.floor(i/2)*23,w:42,h:20}));
  }
  function scrapEl(p,e){
    const style=`left:${pct(e.x)};top:${pct(e.y)};width:${pct(e.w)};height:${pct(e.h)};z-index:${e.z||10}`;
    if(e.type==='photo') return `<div class="scrapItem scrapImgWrap frame-${esc(e.frame||p.frame||'soft')}" data-page="${p.id}" data-el="${e.id}" style="${style}"><img src="${srcForPhoto(e)}" alt="Scrapbook photo"><span class="scrapResize" data-resize="1"></span></div>`;
    if(e.type==='sticker') return `<div class="scrapItem scrapSticker" data-page="${p.id}" data-el="${e.id}" style="${style}">${esc(e.text||'🐚')}<span class="scrapResize" data-resize="1"></span></div>`;
    return `<div class="scrapItem scrapTextBox" data-page="${p.id}" data-el="${e.id}" style="${style}">${esc(e.text||'Text')}<span class="scrapResize" data-resize="1"></span></div>`;
  }
  function layoutMenu(p){return `<select id="layoutSelect-${p.id}" class="layoutSelect"><option value="grid" ${p.layout==='grid'?'selected':''}>Grid</option><option value="feature" ${p.layout==='feature'?'selected':''}>Feature Photo</option><option value="collage" ${p.layout==='collage'?'selected':''}>Collage</option><option value="freeform" ${p.layout==='freeform'?'selected':''}>Freeform</option></select><button onclick="applyPageLayout('${p.id}')">Apply Layout</button>`;}
  function pageHtml(p){normalizeScrapPage(p); const els=[...p.elements].sort((a,b)=>(a.z||0)-(b.z||0)).map(e=>scrapEl(p,e)).join('');return `<div class="scrapPagePro" id="page-${p.id}"><h3>${esc(p.title||'Scrapbook Page')}</h3><p class="layoutHint noPrint">Drag photos, stickers, and text. Use the gold corner to resize.</p><div class="scrapCanvas bg-${esc(p.bg||'seaGlass')}" data-page="${p.id}"><div class="scrapTitle">${esc(p.title||'Scrapbook Page')}</div>${els}${p.note?`<div class="scrapNote">${esc(p.note)}</div>`:''}</div><div class="scrapToolbar noPrint"><button onclick="addStickerToPage('${p.id}')">Add Sticker</button><button onclick="addTextToPage('${p.id}')">Add Text</button>${layoutMenu(p)}<button onclick="exportScrapbookPage('${p.id}')">Export JPEG</button><button onclick="printScrapbookPage('${p.id}')">PDF / Print</button><button onclick="del('pages','${p.id}')">Delete</button></div></div>`;}
  window.renderPages=function(){ const box=document.getElementById('scrapbookPages'); if(!box) return; data.pages.forEach(normalizeScrapPage); box.innerHTML=data.pages.length?data.pages.map(pageHtml).join(''):'<div class="card"><p>No scrapbook pages yet. Select photos above, tap Create Draft Page, rearrange, then tap Create Scrapbook Page.</p></div>'; bindScrapbookDrag510(); };
  window.applyPageLayout=function(id){ const p=data.pages.find(x=>String(x.id)===String(id)); if(!p) return; normalizeScrapPage(p); const sel=document.getElementById(`layoutSelect-${id}`); const layout=sel?.value||'grid'; p.layout=layout; const photos=p.elements.filter(e=>e.type==='photo'); boxes(layout,photos.length).forEach((b,i)=>{ if(photos[i]) Object.assign(photos[i],b); }); save(); renderPages(); toast('Layout updated'); };
  window.changePageLayout=function(id){ window.applyPageLayout(id); };
  function bindScrapbookDrag510(){
    document.querySelectorAll('.scrapItem').forEach(el=>{el.onpointerdown=(ev)=>{if(ev.button!==0)return;ev.preventDefault();const canvas=el.closest('.scrapCanvas');if(!canvas)return;const p=data.pages.find(x=>String(x.id)===String(el.dataset.page));if(!p)return;const item=(p.elements||[]).find(x=>String(x.id)===String(el.dataset.el));if(!item)return;document.querySelectorAll('.scrapItem.selected').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');const rect=canvas.getBoundingClientRect();const resizing=ev.target.dataset.resize==='1';const sx=ev.clientX,sy=ev.clientY,start={x:item.x,y:item.y,w:item.w,h:item.h};el.setPointerCapture(ev.pointerId);el.onpointermove=(mv)=>{const dx=(mv.clientX-sx)/rect.width*100,dy=(mv.clientY-sy)/rect.height*100;if(resizing){item.w=Math.max(6,Math.min(92,start.w+dx));item.h=Math.max(4,Math.min(80,start.h+dy));}else{item.x=Math.max(0,Math.min(98,start.x+dx));item.y=Math.max(0,Math.min(96,start.y+dy));}el.style.left=pct(item.x);el.style.top=pct(item.y);el.style.width=pct(item.w);el.style.height=pct(item.h);};el.onpointerup=()=>{el.onpointermove=null;el.onpointerup=null;save();toast('Scrapbook placement saved');};};});
  }
  const oldSaveDraft=window.saveDraftScrapbookPage;
  window.saveDraftScrapbookPage=function(){
    if(typeof oldSaveDraft==='function') oldSaveDraft();
    // Repair the newest page immediately so photos remain visible after save/render.
    const p=data.pages[data.pages.length-1]; if(p){ normalizeScrapPage(p); (p.elements||[]).forEach(e=>{if(e.type==='photo'&&!e.src){const s=srcForPhoto(e); if(s)e.src=s;}}); save(); renderPages(); }
  };
  window.addStickerToPage=function(id){ const p=data.pages.find(x=>String(x.id)===String(id)); if(!p)return; normalizeScrapPage(p); const sticker=prompt('Sticker emoji or text',document.getElementById('pageSticker')?.value?.split(' ')[0]||'🐚'); if(!sticker)return; p.elements.push({id:uid(),type:'sticker',text:sticker,x:12,y:12,w:10,h:8,z:120+p.elements.length}); save(); renderPages(); toast('Sticker added'); };
  window.addTextToPage=function(id){ const p=data.pages.find(x=>String(x.id)===String(id)); if(!p)return; normalizeScrapPage(p); const text=prompt('Text box words',document.getElementById('pageTextBox')?.value||'Family memories'); if(!text)return; p.elements.push({id:uid(),type:'text',text,x:14,y:78,w:42,h:8,z:130+p.elements.length}); save(); renderPages(); toast('Text box added'); };

  // Export fix using visible scrapbook DOM so saved referenced photos export.
  window.exportScrapbookPage=async function(id){
    const p=data.pages.find(x=>String(x.id)===String(id)); if(!p)return toast('Page not found'); normalizeScrapPage(p);
    try{
      const canvas=document.createElement('canvas'); canvas.width=PAGE_W; canvas.height=PAGE_H; const ctx=canvas.getContext('2d');
      const bg=p.bg==='sunset'?['#ffe5c6','#f7dfdc','#d9eef4']:p.bg==='sand'?['#f6e4c9','#fff9ee','#e7f5f7']:p.bg==='roseGold'?['#f7dfdc','#fff6e7','#f1c9bf']:['#dff5f7','#fffaf4','#f7dfdc'];
      const g=ctx.createLinearGradient(0,0,PAGE_W,PAGE_H); g.addColorStop(0,bg[0]); g.addColorStop(.55,bg[1]); g.addColorStop(1,bg[2]); ctx.fillStyle=g; ctx.fillRect(0,0,PAGE_W,PAGE_H);
      ctx.strokeStyle='rgba(201,150,66,.55)'; ctx.lineWidth=8; roundRect(ctx,18,18,PAGE_W-36,PAGE_H-36,28); ctx.stroke();
      ctx.fillStyle='#123a4a'; ctx.font='bold 44px Georgia'; wrapText(ctx,p.title||'Scrapbook Page',52,70,PAGE_W-104,48);
      for(const e of [...p.elements].sort((a,b)=>(a.z||0)-(b.z||0))){
        const x=e.x/100*PAGE_W,y=e.y/100*PAGE_H,w=e.w/100*PAGE_W,h=e.h/100*PAGE_H;
        if(e.type==='photo'){ ctx.fillStyle='white'; roundRect(ctx,x,y,w,h,18); ctx.fill(); const src=srcForPhoto(e); if(src){ const img=await loadImage(src); const r=Math.min((w-20)/img.width,(h-20)/img.height); const nw=img.width*r,nh=img.height*r; ctx.save(); roundRect(ctx,x+10,y+10,w-20,h-20,12); ctx.clip(); ctx.fillStyle='#fff'; ctx.fillRect(x+10,y+10,w-20,h-20); ctx.drawImage(img,x+10+(w-20-nw)/2,y+10+(h-20-nh)/2,nw,nh); ctx.restore(); }}
        else if(e.type==='sticker'){ ctx.font=`${Math.max(26,h*.75)}px serif`; ctx.fillText(e.text||'🐚',x,y+h*.8); }
        else { ctx.fillStyle='rgba(255,250,244,.88)'; roundRect(ctx,x,y,w,h,14); ctx.fill(); ctx.fillStyle='#123a4a'; ctx.font='bold 24px Georgia'; wrapText(ctx,e.text||'Text',x+12,y+30,w-24,27); }
      }
      if(p.note){ctx.fillStyle='rgba(255,250,244,.88)';roundRect(ctx,52,960,PAGE_W-104,90,18);ctx.fill();ctx.fillStyle='#16313d';ctx.font='24px Georgia';wrapText(ctx,p.note,68,998,PAGE_W-136,30);}
      const a=document.createElement('a'); a.href=canvas.toDataURL('image/jpeg',.94); a.download=(safeFileName(p.title)||'scrapbook-page')+'.jpg'; a.click(); toast('JPEG exported.');
    }catch(e){console.error(e); toast('JPEG export had trouble with one photo. Print / Save as PDF will still work.');}
  };

  // Final render wrapper.
  const prevRender=render;
  render=function(){ prevRender(); ensureAnalyticsPage(); renderAnalytics(); renderMeals(); renderPacking(); renderDashboard(); renderPages(); };
  ensureAnalyticsPage(); render();
})();

/* 5.0.11 Admin Invite-Only Login */
(function(){
  function ensureInvites(){
    if(!data.invites || !Array.isArray(data.invites)) data.invites=[];
    if(!data.settings) data.settings={};
    data.settings.adminPin='1218';
  }
  function code(){return Math.random().toString(36).slice(2,6).toUpperCase()+ '-' + Math.random().toString(36).slice(2,6).toUpperCase();}
  function invitationText(inv){
    const url = location.origin + location.pathname + '?invite=' + encodeURIComponent(inv.code) + '&email=' + encodeURIComponent(inv.email||'');
    return `You are invited to join Our Family Adventures.\n\nUse this email: ${inv.email}\nInvite code: ${inv.code}\nOpen the app: ${url}`;
  }
  window.createInvite=function(){
    ensureInvites();
    if(!unlockAdmin()) return;
    const name=($('inviteName')?.value||'').trim();
    const email=($('inviteEmail')?.value||'').trim().toLowerCase();
    const role=$('inviteRole')?.value||'Family';
    if(!email) return toast('Enter an email for the invite.');
    let inv=data.invites.find(x=>(x.email||'').toLowerCase()===email && x.status!=='used');
    if(!inv){
      inv={id:uid(), name, email, role, code:code(), status:'pending', createdAt:new Date().toISOString(), createdBy:firebaseUser?.email||'admin'};
      data.invites.push(inv);
    }else{ inv.name=name||inv.name; inv.role=role; }
    localStorage.setItem('ofa_last_invite', JSON.stringify(inv));
    ['inviteName','inviteEmail'].forEach(id=>{if($(id))$(id).value=''});
    save(); render(); toast('Invite created. Use Share Last Invite to send it.');
  };
  window.shareLastInvite=async function(){
    const inv=JSON.parse(localStorage.getItem('ofa_last_invite')||'null');
    if(!inv) return toast('Create an invite first.');
    const text=invitationText(inv);
    if(navigator.share){ try{ await navigator.share({title:'Our Family Adventures Invite', text}); return; }catch(e){} }
    location.href='mailto:'+encodeURIComponent(inv.email)+'?subject='+encodeURIComponent('Our Family Adventures Invite')+'&body='+encodeURIComponent(text);
  };
  window.renderInvites=function(){
    ensureInvites();
    const box=$('inviteList'); if(!box) return;
    box.innerHTML=data.invites.length?data.invites.map(inv=>`<div class="item"><b>${esc(inv.name||inv.email)}</b><p>${esc(inv.email)} • ${esc(inv.role)} • ${esc(inv.status||'pending')}</p><p><b>Code:</b> ${esc(inv.code)}</p><div class="itemActions"><button class="secondary" onclick="localStorage.setItem('ofa_last_invite', '${'__ID__'}'.replace('__ID__','')); shareInviteById('${inv.id}')">Share</button><button class="secondary" onclick="removeInvite('${inv.id}')">Admin Remove</button></div></div>`).join(''):'<p class="helperText">No invites yet.</p>';
  };
  window.shareInviteById=function(id){
    const inv=data.invites.find(x=>String(x.id)===String(id)); if(!inv) return;
    localStorage.setItem('ofa_last_invite',JSON.stringify(inv)); shareLastInvite();
  };
  window.removeInvite=function(id){ if(!unlockAdmin())return; data.invites=data.invites.filter(x=>String(x.id)!==String(id)); save(); render(); toast('Invite removed'); };
  function findValidInvite(email, inviteCode){
    ensureInvites();
    email=(email||'').trim().toLowerCase(); inviteCode=(inviteCode||'').trim().toUpperCase();
    return data.invites.find(inv=>(inv.email||'').toLowerCase()===email && String(inv.code||'').toUpperCase()===inviteCode && inv.status!=='used');
  }
  firebaseLoginFlow = async function(){
    if(!firebaseReady){toast('Paste your real Firebase config first.');return;}
    try{
      if(firebase.auth().currentUser){show('settings');renderSecurityStatus&&renderSecurityStatus();toast('You are signed in.');return;}
      const params=new URLSearchParams(location.search);
      const suggestedEmail=params.get('email')||'';
      const suggestedCode=params.get('invite')||'';
      const email=(prompt('Family email address', suggestedEmail)||'').trim().toLowerCase(); if(!email)return;
      const password=prompt('Password - at least 6 characters'); if(!password)return;
      try{ await firebase.auth().signInWithEmailAndPassword(email,password); }
      catch(err){
        const inviteCode=prompt('Invite code from Melissa', suggestedCode||'');
        const inv=findValidInvite(email, inviteCode);
        if(!inv){toast('Invite not found. Ask Melissa for a new invite.');return;}
        const cred=await firebase.auth().createUserWithEmailAndPassword(email,password);
        inv.status='used'; inv.usedAt=new Date().toISOString(); inv.uid=cred.user.uid;
        await firebase.firestore().collection('users').doc(cred.user.uid).set({email, name:inv.name||'', role:inv.role||'Family', invited:true, inviteCode:inv.code, createdAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
        try{await cred.user.sendEmailVerification();toast('Account created. Verification email sent.');}catch{toast('Account created.');}
        save(); render();
      }
    }catch(e){console.error(e);toast(e.message||'Login failed');}
  };
  const oldRender=render;
  render=function(){oldRender();renderInvites();};
  if($('createInviteBtn')) $('createInviteBtn').onclick=createInvite;
  if($('shareLastInviteBtn')) $('shareLastInviteBtn').onclick=shareLastInvite;
  if($('loginBtn')) $('loginBtn').onclick=firebaseLoginFlow;
  ensureInvites(); save(); render();
})();

/* 6.2.9 Final mobile/install/private list/profile/scrapbook/dashboard fixes */
(function(){
  const PATCH='6.2.9';
  data.settings=data.settings||{}; if(!data.settings.adminPin)data.settings.adminPin='1218';

  function me(){ return (window.firebaseUser&&firebaseUser.email) || localStorage.getItem('ofa_family_user') || localStorage.getItem('ofa_voter_name') || 'Me'; }
  function names(){ const n=(data.people||[]).map(p=>p.name).filter(Boolean); return [...new Set([...n,'Volunteer','Unassigned','Everyone / Group'])]; }
  function escA(s){ return esc(String(s||'')); }
  function personOptions(selected){ return names().map(n=>`<option value="${escA(n)}" ${String(selected||'')===n?'selected':''}>${escA(n)}</option>`).join(''); }
  function isMine(x){ const u=me(); return !x.private || x.owner===u || x.person===u || x.addedBy===u; }
  function isGroup(x){ return x.scope==='group' || x.listType==='group' || /everyone|group|shared|family/i.test(String(x.person||'')); }

  // Install button: works with the browser install prompt when available and gives clear steps otherwise.
  window.installApp=async function(){
    const promptEvent=window.deferredInstallPrompt||deferredInstallPrompt;
    if(promptEvent){ try{ promptEvent.prompt(); await promptEvent.userChoice; deferredInstallPrompt=null; window.deferredInstallPrompt=null; return toast('Install started.'); }catch(e){ console.warn(e); } }
    const msg='To install as an app: tap the Chrome menu ⋮, then tap Add to Home screen or Install app.';
    toast(msg); alert(msg);
  };
  window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferredInstallPrompt=e; window.deferredInstallPrompt=e; const b=$('installBtn'); if(b){b.hidden=false;b.textContent='Install App';} });
  if($('installBtn')){ $('installBtn').hidden=false; $('installBtn').textContent='Install App'; $('installBtn').onclick=installApp; }

  // Hide hard-coded admin pin from the visible admin card unless admin is unlocked.
  function hideAdminPinText(){
    document.querySelectorAll('.card,.item').forEach(card=>{
      if(/Admin PIN is/i.test(card.textContent||'')){
        card.querySelectorAll('p,small,span').forEach(el=>{ if(/Admin PIN is/i.test(el.textContent||'')) el.textContent=isAdmin()?'Admin unlocked.':'Admin PIN is hidden.'; });
      }
    });
  }

  function ensureEnhancedForms(){
    // Meal buttons and person selector
    const mealTitle=$('mealTitle');
    if(mealTitle && !document.getElementById('mealTypeButtons')){
      mealTitle.insertAdjacentHTML('beforebegin', `<div id="mealTypeButtons" class="choiceChips"><button type="button" data-meal="Breakfast">Breakfast</button><button type="button" data-meal="Snack">Snack</button><button type="button" data-meal="Dining Out">Dining out</button><button type="button" data-meal="Lunch">Lunch</button><button type="button" data-meal="Dinner">Dinner</button><button type="button" data-meal="Late Snack">Late snack</button><button type="button" data-meal="Happy Hour">Happy hour</button></div>`);
      document.getElementById('mealTypeButtons').onclick=e=>{const b=e.target.closest('button[data-meal]'); if(b){ mealTitle.value=b.dataset.meal; document.querySelectorAll('#mealTypeButtons button').forEach(x=>x.classList.toggle('selected',x===b)); }};
    }
    ['mealPerson','groceryPerson','packingPerson'].forEach(id=>{
      const input=$(id); if(input && !document.getElementById(id+'Select')){
        input.style.display='none';
        input.insertAdjacentHTML('afterend', `<select id="${id}Select" class="personSelect">${personOptions(input.value)}</select>`);
        $(id+'Select').onchange=()=>{ input.value=$(id+'Select').value; };
      } else if($(id+'Select')) { $(id+'Select').innerHTML=personOptions($(id)?.value); }
    });
    // list type choices
    [['groceryItem','groceryScope'],['packingItem','packingScope']].forEach(([anchor,id])=>{
      const el=$(anchor); if(el && !$(id)) el.insertAdjacentHTML('beforebegin', `<div class="listScope"><label><input type="radio" name="${id}" value="group" checked> Group list</label><label><input type="radio" name="${id}" value="individual"> Individual/private</label></div>`);
    });
    const groceryPerson=$('groceryPerson'); if(groceryPerson && !groceryPerson.value) groceryPerson.value=me();
  }

  // Save handlers with group/individual privacy and added-by tracking.
  function selectedScope(name){ return document.querySelector(`input[name="${name}"]:checked`)?.value || 'group'; }
  if($('saveMeal')) $('saveMeal').onclick=()=>{
    const person=$('mealPersonSelect')?.value || $('mealPerson')?.value || 'Volunteer';
    data.meals.push({id:uid(),trip:$('mealTrip').value,title:$('mealTitle').value||'Meal',mealType:$('mealTitle').value||'Meal',item:$('mealItem').value,person,scope:/everyone|group/i.test(person)?'group':'individual',private:false,addedBy:me(),owner:person,done:false});
    ['mealTitle','mealItem'].forEach(i=>$(i).value=''); save(); render(); notify('Meal item added','meals'); toast('Meal added');
  };
  if($('saveGrocery')) $('saveGrocery').onclick=()=>{
    const scope=selectedScope('groceryScope'); const person=scope==='group'?($('groceryPersonSelect')?.value||'Volunteer'):me();
    data.groceries.push({id:uid(),trip:$('groceryTrip').value,item:$('groceryItem').value,person,scope,listType:scope,private:scope==='individual',owner:scope==='individual'?me():person,addedBy:me(),done:false});
    $('groceryItem').value=''; save(); render(); notify('Grocery item added','meals'); toast(scope==='individual'?'Private grocery item added':'Group grocery item added');
  };
  if($('savePacking')) $('savePacking').onclick=()=>{
    const scope=selectedScope('packingScope'); const person=scope==='group'?($('packingPersonSelect')?.value||'Everyone / Group'):me();
    data.packing.push({id:uid(),trip:$('packingTrip').value,item:$('packingItem').value,person,scope,listType:scope,private:scope==='individual',owner:scope==='individual'?me():person,addedBy:me(),done:false});
    $('packingItem').value=''; save(); render(); notify('Packing item added','trips'); toast(scope==='individual'?'Private packing item added':'Group packing item added');
  };

  function checkRow(key,x,title,sub){
    const u=me(); const mine=!!(x.completedBy&&x.completedBy[u]) || x.done || x.sharedDone;
    return `<div class="item checklistItem ${mine?'doneSoft':''}"><label class="checkLine"><input type="checkbox" ${mine?'checked':''} onchange="toggleDone('${key}','${x.id}')"><span><b>${escA(title)}</b><small>${escA(sub||'')}</small></span></label><p class="helperText">${x.private?'Private to '+escA(x.owner||u):'Group item'}${x.addedBy?' • Added by '+escA(x.addedBy):''}${x.person?' • Assigned: '+escA(x.person):''}</p><div class="itemActions"><button onclick="del('${key}','${x.id}')" class="secondary smallBtn">Delete</button></div></div>`;
  }
  window.renderPacking=function(){ const box=$('packingList'); if(!box)return; const visible=(data.packing||[]).filter(isMine); const group=visible.filter(isGroup); const ind=visible.filter(x=>!isGroup(x)); box.innerHTML=`<div class="card"><h3>Group Packing Checklist</h3>${group.map(p=>checkRow('packing',p,p.item,p.trip)).join('')||'<p>No group packing items yet.</p>'}</div><div class="card"><h3>My Private Packing Checklist</h3>${ind.map(p=>checkRow('packing',p,p.item,p.trip)).join('')||'<p>No private packing items for you yet.</p>'}</div>`; };
  window.renderMeals=function(){ const box=$('mealList'); if(!box)return; const meals=(data.meals||[]).filter(isMine), groceries=(data.groceries||[]).filter(isMine); box.innerHTML=`<div class="card"><h3>Group Meal Plan</h3>${meals.filter(isGroup).map(m=>checkRow('meals',m,`${m.title}: ${m.item}`,m.trip)).join('')||'<p>No group meal items yet.</p>'}</div><div class="card"><h3>My Meal Items</h3>${meals.filter(x=>!isGroup(x)).map(m=>checkRow('meals',m,`${m.title}: ${m.item}`,m.trip)).join('')||'<p>No private meal items for you yet.</p>'}</div><div class="card"><h3>Group Grocery List</h3>${groceries.filter(isGroup).map(g=>checkRow('groceries',g,g.item,g.trip)).join('')||'<p>No group grocery items yet.</p>'}</div><div class="card"><h3>My Private Grocery List</h3>${groceries.filter(x=>!isGroup(x)).map(g=>checkRow('groceries',g,g.item,g.trip)).join('')||'<p>No private grocery items for you yet.</p>'}</div>`; };

  // Trip tools: dashboard links, itinerary radios/custom datetime, multiple voting options/links.
  function tripLinks(t){ return (t.tripLinks||[]).map(l=>`<p>🔗 <a href="${safeUrl(l.url)}" target="_blank">${escA(l.title||l.url)}</a></p>`).join('')||'<p class="helperText">No links yet.</p>'; }
  window.addVoteOptionsBulk=function(id){ const t=data.trips.find(x=>x.id===id); if(!t)return; const raw=($(`voteInput-${id}`)?.value||'').trim(); const link=($(`voteLink-${id}`)?.value||'').trim(); if(!raw&&!link)return toast('Add an option or link first.'); if(!Array.isArray(t.voteOptions))t.voteOptions=[]; raw.split(/\n|,/).map(s=>s.trim()).filter(Boolean).forEach(text=>t.voteOptions.push({id:uid(),text,link:'',votes:{}})); if(link)t.voteOptions.push({id:uid(),text:raw||link,link,votes:{}}); if($(`voteInput-${id}`))$(`voteInput-${id}`).value=''; if($(`voteLink-${id}`))$(`voteLink-${id}`).value=''; save(); render(); toast('Voting option(s) added'); };
  window.addItinerary=function(id){ const t=data.trips.find(x=>x.id===id); if(!t)return; const slot=document.querySelector(`input[name="itSlot-${id}"]:checked`)?.value||'Morning'; const custom=($(`itineraryCustom-${id}`)?.value||'').trim(); const time=slot==='Custom'?custom:slot; const title=($(`itineraryTitle-${id}`)?.value||'Activity').trim(); t.itinerary=t.itinerary||[]; t.itinerary.push({id:uid(),time,title}); if($(`itineraryCustom-${id}`))$(`itineraryCustom-${id}`).value=''; if($(`itineraryTitle-${id}`))$(`itineraryTitle-${id}`).value=''; save(); render(); toast('Itinerary added'); };
  window.renderTripPlannerFixed=function(t){ const id=t.id; const votes=(t.voteOptions||[]).map((v,i)=>`<div class="voteRow"><span>${escA(v.text)} ${v.link?`<a href="${safeUrl(v.link)}" target="_blank">Open link</a>`:''}</span><strong>${voteCount(v)} vote${voteCount(v)===1?'':'s'}</strong><button onclick="voteTrip('${id}',${i})" class="secondary">Vote / Change</button><button onclick="removeVoteOption('${id}',${i})" class="secondary">Admin Remove</button></div>`).join('')||'<p class="helperText">No family votes yet.</p>'; return `<div class="tripTools"><div class="quickLinks"><button data-go="dashboard" class="secondary">Open Dashboard</button><button data-go="meals" class="secondary">Meals/Grocery</button><button data-go="packing" class="secondary">Packing</button><button data-go="scrapbook" class="secondary">Scrapbook</button></div><div class="linkBox"><h4>Links for this Trip</h4>${tripLinks(t)}<div class="voteAdd"><input id="tripLinkTitle-${id}" placeholder="Link title"><input id="tripLinkUrl-${id}" placeholder="https://..."><button onclick="addTripLink('${id}')" class="secondary">Add trip link</button></div></div><div class="voteBox"><h4>Family Voting</h4><div class="voteOptions">${votes}</div><div class="voteAdd"><textarea id="voteInput-${id}" placeholder="Add one or multiple options. Separate with commas or new lines."></textarea><input id="voteLink-${id}" placeholder="Optional voting link https://..."><button onclick="addVoteOptionsBulk('${id}')" class="secondary">Add voting option(s)</button></div></div><details class="plannerDetails" open><summary>Planning Tools</summary><div class="toolGrid"><div><h4>Itinerary</h4><div class="choiceChips"><label><input type="radio" name="itSlot-${id}" value="Morning" checked> Morning</label><label><input type="radio" name="itSlot-${id}" value="Afternoon"> Afternoon</label><label><input type="radio" name="itSlot-${id}" value="Evening"> Evening</label><label><input type="radio" name="itSlot-${id}" value="Custom"> Custom date/time</label></div><input id="itineraryCustom-${id}" placeholder="Custom date and time"><input id="itineraryTitle-${id}" placeholder="Activity"><button onclick="addItinerary('${id}')" class="secondary">Add itinerary item</button><div>${(t.itinerary||[]).map(i=>`<p>🗓️ <b>${escA(i.time)}</b> ${escA(i.title)}</p>`).join('')||'<p class="helperText">No itinerary items.</p>'}</div></div><div><h4>Shared Notes</h4><textarea id="sharedNote-${id}" placeholder="Add a family note..."></textarea><button onclick="addSharedNote('${id}')" class="secondary">Add note</button>${(t.sharedNotes||[]).map(n=>`<p>📝 ${escA(n.text)}</p>`).join('')}</div><div><h4>Weather</h4><button onclick="refreshTripWeather('${id}')" class="secondary">Refresh live weather</button><p>${escA(t.weather||'No weather yet.')}</p></div></div></details></div>`; };
  window.renderTrips=function(){ const box=$('tripList'); if(!box)return; box.innerHTML=(data.trips||[]).map(t=>`<div class="item tripCard"><h3>${escA(t.name)}</h3><p>${escA(t.destination)} ${t.start?`• ${fmtDate(t.start)} to ${fmtDate(t.end)}`:''}</p><div class="itemActions"><button onclick="editTrip('${t.id}')" class="primary">Edit Trip</button><button data-go="dashboard" class="secondary">Open Dashboard</button><button onclick="del('trips','${t.id}')" class="secondary">Delete</button></div>${renderTripPlannerFixed(t)}</div>`).join('')||'<div class="card"><p>No trips yet.</p></div>'; };

  // Scrapbook image visibility and migration of saved references.
  function repairPages(){ const lookup={}; (data.memories||[]).forEach(m=>(m.media||[]).forEach(media=>{ if(media.type==='image'){ lookup[media.id]=media.src; lookup[media.src]=media.src; }})); (data.pages||[]).forEach(p=>{ p.photos=(p.photos||[]).map(src=>lookup[src]||src); (p.elements||[]).forEach(e=>{ if(e.type==='photo') e.src=e.src||lookup[e.mediaId]||lookup[e.photoId]||lookup[e.src]||''; }); }); }

  const prevRender=render;
  render=function(){ repairPages(); prevRender(); ensureEnhancedForms(); renderTrips(); renderMeals(); renderPacking(); hideAdminPinText(); };
  ensureEnhancedForms(); repairPages(); render();
})();

/* 6.3 final corrections: install, voting tab, private lists, editable items, scrapbook photos, admin lock */
(function(){
  const $=id=>document.getElementById(id), $$=s=>Array.from(document.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const uid2=()=> (typeof uid==='function'?uid():Date.now().toString(36)+Math.random().toString(36).slice(2));
  const save2=()=>{ try{ if(typeof save==='function') save(); else localStorage.setItem('ofaData',JSON.stringify(data)); }catch(e){} };
  const me2=()=> (localStorage.getItem('ofa_family_user')||localStorage.getItem('ofa_voter_name')||'Me').trim();
  const peopleNames=()=> (data.people||[]).map(p=>p.name).filter(Boolean);
  const assigneeOptions=(selected='')=>['Volunteer needed','Everyone / Group',...peopleNames()].map(n=>`<option ${n===selected?'selected':''}>${esc(n)}</option>`).join('');
  const safeUrl=u=>{u=String(u||'').trim(); if(!u)return ''; return /^https?:\/\//i.test(u)?u:'https://'+u};

  function ensureVotingPage(){
    if(!$('voting')){
      const adv=$('adventures');
      adv?.insertAdjacentHTML('afterend', `<section id="voting" class="page"><div class="pageHead"><h2>Family Voting</h2><p>Vote on trips, activities, restaurants, lodging, and plans.</p></div><div id="votingList" class="list"></div></section>`);
    }
    const drawer=$('drawer');
    if(drawer && !drawer.querySelector('[data-go="voting"]')) drawer.querySelector('[data-go="travel"]')?.insertAdjacentHTML('beforebegin','<button data-go="voting">Voting</button>');
    const dock=document.querySelector('.dock');
    if(dock && !dock.querySelector('[data-go="voting"]')) dock.querySelector('[data-go="chat"]')?.insertAdjacentHTML('beforebegin','<button data-go="voting">🗳️<span>Vote</span></button>');
    const homeGrid=document.querySelector('.storybookGrid');
    if(homeGrid && !homeGrid.querySelector('[data-go="voting"]')) homeGrid.insertAdjacentHTML('beforeend','<button data-go="voting" class="storybookCard">🗳️<span>Voting</span><small>Vote on trips, activities, restaurants, and family options.</small></button>');
  }

  function renderVoting(){
    ensureVotingPage(); const box=$('votingList'); if(!box)return;
    box.innerHTML=(data.trips||[]).map(t=>{
      const opts=(t.voteOptions||[]).map((v,i)=>{ const voted=v.votes&&v.votes[me2()]; return `<div class="voteRow ${voted?'selectedVote':''}"><div><b>${esc(v.text)}</b>${v.link?`<br><a target="_blank" href="${safeUrl(v.link)}">Open link</a>`:''}<small>${Object.keys(v.votes||{}).join(', ')||'No named votes yet'}</small></div><strong>${typeof voteCount==='function'?voteCount(v):Object.keys(v.votes||{}).length} vote(s)</strong><button onclick="voteTrip('${t.id}',${i})" class="secondary">${voted?'Change / keep vote':'Vote'}</button></div>`}).join('')||'<p>No voting options yet.</p>';
      return `<div class="card"><h3>${esc(t.name)}</h3>${opts}<div class="voteAdd"><textarea id="voteInput-${t.id}" placeholder="Add one or multiple voting options, separated by new lines"></textarea><input id="voteLink-${t.id}" placeholder="Optional link for this option"><button onclick="addVoteOptionsBulk('${t.id}')" class="secondary">Add option(s)</button></div></div>`;
    }).join('')||'<div class="card"><p>No trips yet. Add an adventure first.</p></div>';
  }

  window.voteTrip=function(id,index){
    const t=(data.trips||[]).find(x=>x.id===id); const v=t?.voteOptions?.[index]; if(!v)return;
    const voter=me2(); if(!voter)return;
    (t.voteOptions||[]).forEach(o=>{o.votes=o.votes||{}; delete o.votes[voter];});
    v.votes=v.votes||{}; v.votes[voter]=new Date().toISOString();
    localStorage.setItem('ofa_voter_name',voter); localStorage.setItem('ofa_family_user',voter);
    save2(); render(); show('voting'); toast('Vote saved. You can change it anytime.');
  };
  window.addVoteOptionsBulk=function(id){
    const t=(data.trips||[]).find(x=>x.id===id); if(!t)return; t.voteOptions=t.voteOptions||[];
    const raw=($(`voteInput-${id}`)?.value||'').trim(); const link=($(`voteLink-${id}`)?.value||'').trim();
    const parts=raw.split(/\n|,/).map(x=>x.trim()).filter(Boolean);
    if(!parts.length && !link) return toast('Add a voting option or link first.');
    if(parts.length) parts.forEach((text,idx)=>t.voteOptions.push({id:uid2(),text,link:idx===0?link:'',votes:{}}));
    else t.voteOptions.push({id:uid2(),text:link,link,votes:{}});
    if($(`voteInput-${id}`))$(`voteInput-${id}`).value=''; if($(`voteLink-${id}`))$(`voteLink-${id}`).value='';
    save2(); render(); toast('Voting option(s) added');
  };

  function ensureAdminLock(){
    const card=$('adminUnlockBtn')?.closest('.card'); if(!card)return;
    card.querySelectorAll('.helperText').forEach(p=>{ if(/Admin PIN/i.test(p.textContent)) p.remove(); });
    if(!$('adminLockBtn')) $('adminUnlockBtn').insertAdjacentHTML('afterend','<button id="adminLockBtn" class="secondary">Lock Admin</button>');
    $('adminLockBtn').onclick=()=>{sessionStorage.removeItem('ofa_admin_unlocked'); toast('Admin locked');};
  }

  function enhanceFormsClean(){
    // Invitees as people checkboxes instead of typed names.
    const inv=$('tripInvitees');
    if(inv && !$('tripInviteeChoices')){
      inv.type='hidden'; inv.insertAdjacentHTML('afterend','<div id="tripInviteeChoices" class="choiceGrid"></div>');
    }
    const invBox=$('tripInviteeChoices'); if(invBox){ invBox.innerHTML=peopleNames().map(n=>`<label><input type="checkbox" value="${esc(n)}"> ${esc(n)}</label>`).join('')||'<p class="helperText">Add people first, then select invitees here.</p>'; invBox.querySelectorAll('input').forEach(c=>c.onchange=()=>{ $('tripInvitees').value=$$('#tripInviteeChoices input:checked').map(x=>x.value).join(', '); }); }
    // Meal type buttons.
    const mt=$('mealTitle'); if(mt && !$('mealTypeChoices')){ mt.type='hidden'; mt.value='Dinner'; mt.insertAdjacentHTML('afterend','<div id="mealTypeChoices" class="choiceChips compact"><label><input type="radio" name="mealType" value="Breakfast">Breakfast</label><label><input type="radio" name="mealType" value="Snack">Snack</label><label><input type="radio" name="mealType" value="Dining out">Dining out</label><label><input type="radio" name="mealType" value="Lunch">Lunch</label><label><input type="radio" name="mealType" value="Dinner" checked>Dinner</label><label><input type="radio" name="mealType" value="Late snack">Late snack</label><label><input type="radio" name="mealType" value="Happy hour">Happy hour</label></div>'); $$('input[name="mealType"]').forEach(r=>r.onchange=()=>mt.value=r.value); }
    // Dropdowns for assignees.
    [['mealPerson','mealPersonSelect'],['groceryPerson','groceryPersonSelect'],['packingPerson','packingPersonSelect']].forEach(([oldId,newId])=>{ const old=$(oldId); if(old && !$(newId)){ old.type='hidden'; old.insertAdjacentHTML('afterend',`<select id="${newId}">${assigneeOptions(old.value)}</select>`); $(newId).onchange=()=>old.value=$(newId).value; }});
    // One clean group/private selector each.
    [['groceryItem','groceryScopeClean','groceryScope'],['packingItem','packingScopeClean','packingScope']].forEach(([anchor,id,name])=>{ const el=$(anchor); if(el && !$(id)){ document.querySelectorAll(`input[name="${name}"]`).forEach(x=>x.closest('label')?.remove()); el.insertAdjacentHTML('beforebegin',`<div id="${id}" class="choiceChips compact"><label><input type="radio" name="${name}" value="group" checked> Group list</label><label><input type="radio" name="${name}" value="individual"> Individual/private</label></div>`); }});
    const gp=$('groceryPerson'); if(gp && !gp.value) gp.value=me2();
  }
  function scope(name){return document.querySelector(`input[name="${name}"]:checked`)?.value||'group'}

  if($('saveMeal')) $('saveMeal').onclick=()=>{ const person=$('mealPersonSelect')?.value||'Volunteer needed'; const title=document.querySelector('input[name="mealType"]:checked')?.value||$('mealTitle')?.value||'Dinner'; data.meals.push({id:uid2(),trip:$('mealTrip').value,title,mealType:title,item:$('mealItem').value,person,scope:'group',private:false,addedBy:me2(),owner:person,done:false}); $('mealItem').value=''; save2(); render(); toast('Meal item added'); };
  if($('saveGrocery')) $('saveGrocery').onclick=()=>{ const sc=scope('groceryScope'); const person=sc==='group'?($('groceryPersonSelect')?.value||'Volunteer needed'):me2(); data.groceries.push({id:uid2(),trip:$('groceryTrip').value,item:$('groceryItem').value,person,scope:sc,private:sc==='individual',owner:sc==='individual'?me2():person,addedBy:me2(),done:false}); $('groceryItem').value=''; save2(); render(); toast(sc==='individual'?'Private grocery item added':'Group grocery item added'); };
  if($('savePacking')) $('savePacking').onclick=()=>{ const sc=scope('packingScope'); const person=sc==='group'?($('packingPersonSelect')?.value||'Everyone / Group'):me2(); data.packing.push({id:uid2(),trip:$('packingTrip').value,item:$('packingItem').value,person,scope:sc,private:sc==='individual',owner:sc==='individual'?me2():person,addedBy:me2(),done:false}); $('packingItem').value=''; save2(); render(); toast(sc==='individual'?'Private packing item added':'Group packing item added'); };

  window.editListItem=function(key,id){ const arr=data[key]||[]; const x=arr.find(i=>i.id===id); if(!x)return; const val=prompt('Edit item', x.item||x.title||''); if(val===null)return; if(key==='meals' && !x.item)x.title=val; else x.item=val; save2(); render(); toast('Item updated'); };
  function row(key,x,title,sub){ const mine=x.done||x.sharedDone; return `<div class="item checklistItem ${mine?'doneSoft':''}"><label class="checkLine"><input type="checkbox" ${mine?'checked':''} onchange="toggleDone('${key}','${x.id}')"><span><b>${esc(title)}</b><small>${esc(sub||'')}</small></span></label><p class="helperText">${x.private?'Private to '+esc(x.owner||me2()):'Group item'}${x.addedBy?' • Added by '+esc(x.addedBy):''}${x.person?' • Assigned: '+esc(x.person):''}</p><div class="itemActions"><button onclick="editListItem('${key}','${x.id}')" class="secondary smallBtn">Edit</button><button onclick="del('${key}','${x.id}')" class="secondary smallBtn">Delete</button></div></div>`; }
  const visible=x=>!x.private || x.owner===me2() || x.addedBy===me2();
  window.renderPacking=function(){ const box=$('packingList'); if(!box)return; const list=(data.packing||[]).filter(visible); box.innerHTML=`<div class="card"><h3>Group Packing Checklist</h3>${list.filter(x=>!x.private).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No group packing items yet.</p>'}</div><div class="card"><h3>My Private Packing Checklist</h3>${list.filter(x=>x.private).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No private packing items yet.</p>'}</div>`; };
  window.renderMeals=function(){ const box=$('mealList'); if(!box)return; const meals=(data.meals||[]).filter(visible), groceries=(data.groceries||[]).filter(visible); box.innerHTML=`<div class="card"><h3>Meal Plan</h3>${meals.map(m=>row('meals',m,`${m.title}: ${m.item}`,m.trip)).join('')||'<p>No meal items yet.</p>'}</div><div class="card"><h3>Group Grocery List</h3>${groceries.filter(x=>!x.private).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No group grocery items yet.</p>'}</div><div class="card"><h3>My Private Grocery List</h3>${groceries.filter(x=>x.private).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No private grocery items yet.</p>'}</div>`; };

  // Itinerary custom uses real calendar/date-time control.
  window.addItinerary=function(id){ const t=(data.trips||[]).find(x=>x.id===id); if(!t)return; const slot=document.querySelector(`input[name="itSlot-${id}"]:checked`)?.value||'Morning'; const custom=($(`itineraryCustom-${id}`)?.value||'').trim(); const time=slot==='Custom'?custom:slot; const title=($(`itineraryTitle-${id}`)?.value||'Activity').trim(); if(slot==='Custom'&&!custom)return toast('Select custom date and time.'); t.itinerary=t.itinerary||[]; t.itinerary.push({id:uid2(),time,title}); save2(); render(); toast('Itinerary added'); };

  // Scrapbook: keep image data with page and render visibly.
  function imgs(){ const out=[]; (data.memories||[]).forEach(m=>(m.media||[]).forEach(mm=>{if(mm.type==='image'&&mm.src)out.push({...mm,memoryTitle:m.title||'Memory'});})); return out; }
  window.createDraftPage=function(){ const selected=(window.selectedScrapPhotos||selectedScrapPhotos||[]); const chosen=imgs().filter(x=>selected.includes(x.id)); if(!chosen.length)return toast('Select photos first.'); const page={id:uid2(),title:$('pageTitle')?.value||'Scrapbook Page',note:$('pageNote')?.value||'',theme:$('pageTheme')?.value||'Beach Day',layout:$('pageLayout')?.value||'grid',frame:$('pageFrame')?.value||'soft',photos:chosen.map(x=>x.src),createdAt:new Date().toISOString()}; data.pages.push(page); selectedScrapPhotos=[]; save2(); render(); toast('Photos added to scrapbook page'); };
  if($('savePage')) $('savePage').onclick=window.createDraftPage;
  window.renderPages=function(){ const box=$('scrapbookPages'); if(!box)return; box.innerHTML=(data.pages||[]).map(p=>`<div class="scrapPage"><h3>${esc(p.title)}</h3><div class="scrapLayout ${esc(p.layout||'grid')}">${(p.photos||[]).map(src=>`<img class="scrapPhoto" src="${src}">`).join('')||'<p>No photos selected for this page.</p>'}</div>${p.note?`<p>${esc(p.note)}</p>`:''}<div class="scrapTools noPrint"><button onclick="window.print()" class="secondary">PDF / Print</button><button onclick="del('pages','${p.id}')" class="secondary">Delete</button></div></div>`).join('')||'<div class="card"><p>No scrapbook pages yet. Select photos above, then tap Save Scrapbook Page.</p></div>'; };

  window.renderTripPlannerFixed=function(t){ const id=t.id; const votes=(t.voteOptions||[]).map((v,i)=>`<div class="voteRow"><span>${esc(v.text)} ${v.link?`<a href="${safeUrl(v.link)}" target="_blank">Open link</a>`:''}</span><strong>${typeof voteCount==='function'?voteCount(v):Object.keys(v.votes||{}).length} vote(s)</strong><button onclick="voteTrip('${id}',${i})" class="secondary">Vote / Change</button><button onclick="removeVoteOption('${id}',${i})" class="secondary">Admin Remove</button></div>`).join('')||'<p class="helperText">No family votes yet.</p>'; return `<div class="tripTools"><div class="quickLinks"><button data-go="dashboard" class="secondary">Open Dashboard</button><button data-go="voting" class="secondary">Voting</button><button data-go="meals" class="secondary">Meals/Grocery</button><button data-go="packing" class="secondary">Packing</button><button data-go="scrapbook" class="secondary">Scrapbook</button></div><div class="voteBox"><h4>Family Voting</h4>${votes}<div class="voteAdd"><textarea id="voteInput-${id}" placeholder="Add multiple options, one per line"></textarea><input id="voteLink-${id}" placeholder="Optional link"><button onclick="addVoteOptionsBulk('${id}')" class="secondary">Add option(s)</button></div></div><details class="plannerDetails" open><summary>Planning Tools</summary><div class="toolGrid"><div><h4>Itinerary</h4><div class="choiceChips compact"><label><input type="radio" name="itSlot-${id}" value="Morning" checked> Morning</label><label><input type="radio" name="itSlot-${id}" value="Afternoon"> Afternoon</label><label><input type="radio" name="itSlot-${id}" value="Evening"> Evening</label><label><input type="radio" name="itSlot-${id}" value="Custom"> Custom date/time</label></div><input id="itineraryCustom-${id}" type="datetime-local"><input id="itineraryTitle-${id}" placeholder="Activity"><button onclick="addItinerary('${id}')" class="secondary">Add itinerary item</button>${(t.itinerary||[]).map(i=>`<p>🗓️ <b>${esc(i.time)}</b> ${esc(i.title)}</p>`).join('')||'<p class="helperText">No itinerary items.</p>'}</div></div></details></div>`; };
  window.renderTrips=function(){ const box=$('tripList'); if(!box)return; box.innerHTML=(data.trips||[]).map(t=>`<div class="item tripCard"><h3>${esc(t.name)}</h3><p>${esc(t.destination)} ${t.start?`• ${fmtDate(t.start)} to ${fmtDate(t.end)}`:''}</p><div class="itemActions"><button onclick="editTrip('${t.id}')" class="primary">Edit Trip</button><button data-go="dashboard" class="secondary">Open Dashboard</button><button data-go="voting" class="secondary">Voting</button><button onclick="del('trips','${t.id}')" class="secondary">Delete</button></div>${renderTripPlannerFixed(t)}</div>`).join('')||'<div class="card"><p>No trips yet.</p></div>'; };

  const oldRender=render;
  render=function(){ oldRender(); ensureVotingPage(); enhanceFormsClean(); ensureAdminLock(); renderTrips(); renderVoting(); renderMeals(); renderPacking(); renderPages(); };
  document.addEventListener('click',e=>{ const b=e.target.closest('[data-go]'); if(b){ e.preventDefault(); show(b.dataset.go); }});
  ensureVotingPage(); enhanceFormsClean(); ensureAdminLock(); render();
})();

/* 6.3.1 Final corrections: clean list controls, real scrapbook themes/layouts, voting links, maps/weather helpers */
(function(){
  const VERSION='6.3.1';
  function q(id){return document.getElementById(id)}
  function E(s){return (window.esc?esc:String)(String(s||''));}
  function U(){return (window.firebaseUser&&firebaseUser.email)||localStorage.getItem('ofa_family_user')||localStorage.getItem('ofa_voter_name')||'Me';}
  function peopleNames(){return [...new Set([...(data.people||[]).map(p=>p.name).filter(Boolean),'Volunteer needed','Everyone / Group'])];}
  function assigneeSelect(id, selected){return `<select id="${id}">${peopleNames().map(n=>`<option value="${E(n)}" ${n===(selected||'')?'selected':''}>${E(n)}</option>`).join('')}</select>`;}
  function saveNow(){ if(typeof save==='function') save(); }

  // Notifications: browsers can block these. This gives a clear path to re-enable instead of only saying off.
  window.enableNotificationsFinal=async function(){
    if(!('Notification' in window)){ alert('This browser does not support notifications.'); return; }
    if(Notification.permission==='denied'){
      alert('Notifications are blocked in Chrome for this site. Tap the lock/settings icon beside the web address, open Site settings, then allow Notifications.');
      return;
    }
    const p=await Notification.requestPermission();
    if(p==='granted'){ new Notification('Our Family Adventures notifications are on.'); toast('Notifications are on.'); }
    else alert('Notifications were not allowed. You can turn them on from Chrome Site settings.');
  };
  if(q('settingsNotifyBtn')) q('settingsNotifyBtn').onclick=enableNotificationsFinal;

  // PWA install button: true install depends on Chrome criteria; otherwise provide exact steps.
  window.installApp=async function(){
    const p=window.deferredInstallPrompt||deferredInstallPrompt;
    if(p){ try{ p.prompt(); await p.userChoice; toast('Install started.'); return; }catch(e){} }
    alert('Chrome has not released the app install prompt yet. Make sure this is HTTPS, upload the new files, then tap Chrome ⋮ and choose Install app or Add to Home screen. If it still says Add to Home screen, clear this site cache or uninstall the old home-screen copy first.');
  };
  ['installBtn','settingsInstallBtn'].forEach(id=>{if(q(id))q(id).onclick=installApp;});

  function cleanListControls(){
    // Remove the many old group/private choices and replace with only one per form.
    document.querySelectorAll('.listScope,#groceryScopeClean,#packingScopeClean').forEach(el=>el.remove());
    ['groceryScope','packingScope'].forEach(name=>document.querySelectorAll(`input[name="${name}"]`).forEach(inp=>{const c=inp.closest('label')||inp.parentElement; if(c)c.remove();}));
    [['groceryItem','groceryScope'],['packingItem','packingScope']].forEach(([anchor,name])=>{
      const el=q(anchor); if(el && !q(name+'One')) el.insertAdjacentHTML('beforebegin',`<div id="${name}One" class="choiceChips compact oneScope"><label><input type="radio" name="${name}" value="group" checked> Group list</label><label><input type="radio" name="${name}" value="individual"> Individual/private</label></div>`);
    });
    [['mealPerson','mealPersonFinal'],['groceryPerson','groceryPersonFinal'],['packingPerson','packingPersonFinal']].forEach(([oldId,newId])=>{
      const old=q(oldId); if(!old)return; old.required=false; old.style.display='none';
      if(!q(newId)) old.insertAdjacentHTML('afterend',assigneeSelect(newId, old.value));
      q(newId).onchange=()=>old.value=q(newId).value;
    });
    const mt=q('mealTitle');
    if(mt && !q('mealButtonsFinal')){
      mt.style.display='none';
      mt.insertAdjacentHTML('beforebegin',`<div id="mealButtonsFinal" class="choiceChips mealButtons"><label><input type="radio" name="mealTypeFinal" value="Breakfast"> Breakfast</label><label><input type="radio" name="mealTypeFinal" value="Snack"> Snack</label><label><input type="radio" name="mealTypeFinal" value="Dining Out"> Dining out</label><label><input type="radio" name="mealTypeFinal" value="Lunch"> Lunch</label><label><input type="radio" name="mealTypeFinal" value="Dinner" checked> Dinner</label><label><input type="radio" name="mealTypeFinal" value="Late Snack"> Late snack</label><label><input type="radio" name="mealTypeFinal" value="Happy Hour"> Happy hour</label></div>`);
    }
  }
  function selectedScope(name){return document.querySelector(`input[name="${name}"]:checked`)?.value||'group';}
  function currentMealType(){return document.querySelector('input[name="mealTypeFinal"]:checked')?.value||'Dinner';}
  if(q('saveMeal')) q('saveMeal').onclick=()=>{ const person=q('mealPersonFinal')?.value||'Volunteer needed'; data.meals.push({id:uid(),trip:q('mealTrip').value,title:currentMealType(),mealType:currentMealType(),item:q('mealItem').value||currentMealType(),person,scope:'group',private:false,done:false}); q('mealItem').value=''; saveNow(); render(); toast('Meal item added'); };
  if(q('saveGrocery')) q('saveGrocery').onclick=()=>{ const sc=selectedScope('groceryScope'); const person=sc==='group'?(q('groceryPersonFinal')?.value||'Volunteer needed'):U(); data.groceries.push({id:uid(),trip:q('groceryTrip').value,item:q('groceryItem').value||'Grocery item',person,scope:sc,private:sc==='individual',owner:sc==='individual'?U():person,done:false}); q('groceryItem').value=''; saveNow(); render(); toast(sc==='individual'?'Private grocery item added':'Group grocery item added'); };
  if(q('savePacking')) q('savePacking').onclick=()=>{ const sc=selectedScope('packingScope'); const person=sc==='group'?(q('packingPersonFinal')?.value||'Everyone / Group'):U(); data.packing.push({id:uid(),trip:q('packingTrip').value,item:q('packingItem').value||'Packing item',person,scope:sc,private:sc==='individual',owner:sc==='individual'?U():person,done:false}); q('packingItem').value=''; saveNow(); render(); toast(sc==='individual'?'Private packing item added':'Group packing item added'); };

  window.editListItem=function(key,id){const x=(data[key]||[]).find(a=>a.id===id); if(!x)return; const val=prompt('Edit item',x.item||x.title||''); if(val===null)return; x.item=val; saveNow(); render();};
  function visible(x){return !x.private||x.owner===U()||x.person===U();}
  function row(key,x,title,sub){return `<div class="item checklistItem"><label class="checkLine"><input type="checkbox" ${x.done?'checked':''} onchange="toggleDone('${key}','${x.id}')"><span><b>${E(title)}</b><small>${E(sub||'')}</small></span></label><p class="helperText">${x.private?'Private':'Group'}${x.person?' • Assigned: '+E(x.person):''}</p><div class="itemActions"><button onclick="editListItem('${key}','${x.id}')" class="secondary smallBtn">Edit</button><button onclick="del('${key}','${x.id}')" class="secondary smallBtn">Delete</button></div></div>`;}
  window.renderPacking=function(){const box=q('packingList'); if(!box)return; const list=(data.packing||[]).filter(visible); box.innerHTML=`<div class="card"><h3>Group Packing Checklist</h3>${list.filter(x=>!x.private).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No group packing items yet.</p>'}</div><div class="card"><h3>My Private Packing Checklist</h3>${list.filter(x=>x.private).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No private packing items yet.</p>'}</div>`;};
  window.renderMeals=function(){const box=q('mealList'); if(!box)return; const meals=(data.meals||[]).filter(visible), groceries=(data.groceries||[]).filter(visible); box.innerHTML=`<div class="card"><h3>Meal Plan</h3>${meals.map(m=>row('meals',m,`${m.title}: ${m.item}`,m.trip)).join('')||'<p>No meal items yet.</p>'}</div><div class="card"><h3>Group Grocery List</h3>${groceries.filter(x=>!x.private).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No group grocery items yet.</p>'}</div><div class="card"><h3>My Private Grocery List</h3>${groceries.filter(x=>x.private).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No private grocery items yet.</p>'}</div>`;};

  // Voting: multiple links saved in each voting item and a dedicated tab.
  window.addVoteOptionsBulk=function(id){const t=(data.trips||[]).find(x=>x.id===id); if(!t)return; t.voteOptions=t.voteOptions||[]; const raw=(q(`voteInput-${id}`)?.value||'').trim(); const links=(q(`voteLinks-${id}`)?.value||'').split(/\n|,/).map(s=>s.trim()).filter(Boolean); const opts=raw.split(/\n|,/).map(s=>s.trim()).filter(Boolean); if(!opts.length&&links.length)opts.push('Link option'); if(!opts.length)return toast('Add at least one voting option.'); opts.forEach((text,i)=>t.voteOptions.push({id:uid(),text,links:links.length?links:[],votes:{}})); q(`voteInput-${id}`).value=''; if(q(`voteLinks-${id}`))q(`voteLinks-${id}`).value=''; saveNow(); render(); toast('Voting option saved');};
  function voteHtml(t){return (t.voteOptions||[]).map((v,i)=>`<div class="voteRow"><span>${E(v.text)} ${(v.links||[]).map((l,n)=>`<a href="${safeUrl(l)}" target="_blank">Link ${n+1}</a>`).join(' ')}</span><strong>${voteCount(v)} vote(s)</strong><button onclick="voteTrip('${t.id}',${i})" class="secondary">Vote / Change</button><button onclick="removeVoteOption('${t.id}',${i})" class="secondary">Admin Remove</button></div>`).join('')||'<p>No voting options yet.</p>';}
  window.renderVoting=function(){const box=q('votingList'); if(!box)return; box.innerHTML=(data.trips||[]).map(t=>`<div class="card"><h3>${E(t.name)}</h3>${voteHtml(t)}<textarea id="voteInput-${t.id}" placeholder="Add several voting options, one per line"></textarea><textarea id="voteLinks-${t.id}" placeholder="Optional links for this voting item, one per line"></textarea><button onclick="addVoteOptionsBulk('${t.id}')" class="secondary">Add voting item</button></div>`).join('')||'<div class="card"><p>No trips yet.</p></div>';};
  function ensureVoteTab(){ if(!q('voting')){ document.querySelector('main').insertAdjacentHTML('beforeend',`<section id="voting" class="page"><div class="pageHead"><h2>Family Voting</h2><p>Vote on trips, activities, restaurants, lodging, and plans.</p></div><div id="votingList"></div></section>`); } if(!document.querySelector('.dock [data-go="voting"]')) document.querySelector('.dock')?.insertAdjacentHTML('beforeend',`<button data-go="voting">🗳️<span>Vote</span></button>`); if(!document.querySelector('#drawer [data-go="voting"]')) q('drawer')?.insertAdjacentHTML('beforeend',`<button data-go="voting">Voting</button>`);}

  // Maps and weather helpers.
  window.mapUrl=function(place){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place||'')}`;};
  window.directionsUrl=function(place){return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place||'')}`;};
  window.openTripMap=function(id){const t=(data.trips||[]).find(x=>x.id===id); const p=t?.address||t?.destination||t?.name; if(!p)return toast('Add a trip destination first.'); window.open(mapUrl(p),'_blank');};
  async function weather(place){const geo=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`).then(r=>r.json()); const g=geo.results&&geo.results[0]; if(!g)throw new Error('Location not found'); const j=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`).then(r=>r.json()); return `${Math.round(j.current.temperature_2m)}°F now • high ${Math.round(j.daily.temperature_2m_max[0])}° / low ${Math.round(j.daily.temperature_2m_min[0])}° • rain ${j.daily.precipitation_probability_max[0]??0}%`;}
  window.refreshTripWeather=async function(id){const t=(data.trips||[]).find(x=>x.id===id); const p=t?.address||t?.destination; if(!p)return toast('Add a destination or address first.'); try{toast('Loading live weather...'); t.weather=await weather(p); saveNow(); render(); toast('Weather updated');}catch(e){alert('Live weather could not load. Check the destination spelling or internet connection.');}};

  // True scrapbook studio: direct photo picker, themed pages, multiple sizes and orientations.
  function ensureScrapbookTools(){
    const picker=q('scrapbookPhotoPicker'); if(picker&&!q('directScrapFiles')) picker.insertAdjacentHTML('afterbegin',`<div class="card"><h3>Add Photos Directly</h3><input id="directScrapFiles" type="file" accept="image/*" multiple><button id="directScrapBtn" class="secondary">Add selected photos to scrapbook</button></div>`);
    if(q('directScrapBtn')) q('directScrapBtn').onclick=async()=>{const files=Array.from(q('directScrapFiles').files||[]); if(!files.length)return toast('Choose photos first.'); const mem={id:uid(),title:'Scrapbook Photos',trip:'Scrapbook',uploader:U(),media:[],createdAt:new Date().toISOString()}; for(const f of files){const src=await imageData(f,1400,.78); mem.media.push({id:uid(),type:'image',name:f.name,src});} data.memories.push(mem); selectedScrapPhotos=mem.media.map(x=>x.id); q('directScrapFiles').value=''; saveNow(); render(); show('scrapbook'); toast('Photos ready for scrapbook');};
    const layout=q('pageLayout'); if(layout){layout.innerHTML='<option value="collage">Collage mixed sizes</option><option value="beach">Beach theme</option><option value="mountain">Mountain theme</option><option value="party">Party theme</option><option value="drinks">Drink theme</option><option value="polaroid">Polaroid board</option><option value="grid">Clean grid</option>';}
    const frame=q('pageFrame'); if(frame){frame.innerHTML='<option value="soft">Soft rounded</option><option value="polaroid">Polaroid</option><option value="cutout">Cutout frame</option><option value="torn">Torn paper</option><option value="shell">Beach shell</option><option value="wood">Mountain wood</option>'}
  }
  function photoPool(){const out=[];(data.memories||[]).forEach(m=>(m.media||[]).forEach(mm=>{if(mm.type==='image'&&mm.src)out.push(mm);})); return out;}
  function selectedPhotos(){const ids=window.selectedScrapPhotos||selectedScrapPhotos||[]; const pool=photoPool(); return pool.filter(x=>ids.includes(x.id)).map(x=>x.src);}
  window.createScrapbookPageFinal=function(){const srcs=selectedPhotos(); if(!srcs.length)return toast('Select photos or add photos directly first.'); data.pages=data.pages||[]; data.pages.push({id:uid(),title:q('pageTitle')?.value||'Scrapbook Page',note:q('pageNote')?.value||'',layout:q('pageLayout')?.value||'collage',frame:q('pageFrame')?.value||'soft',theme:q('pageLayout')?.value||'beach',photos:srcs,createdAt:new Date().toISOString()}); selectedScrapPhotos=[]; if(q('pageTitle'))q('pageTitle').value=''; if(q('pageNote'))q('pageNote').value=''; saveNow(); render(); toast('Scrapbook page created');};
  if(q('savePage')) q('savePage').onclick=createScrapbookPageFinal;
  function stickers(theme){const m={beach:'🐚 ⭐ 🌊 🏖️ ☀️',mountain:'⛰️ 🌲 🏕️ 🐻 🔥',party:'🎉 🎈 🎂 ✨ 📸',drinks:'🍹 🧊 🍋 🌴 🥂',collage:'💛 ✨ 📌 🖼️',polaroid:'📎 ✨ 💛'}; return m[theme]||m.beach;}
  window.renderPages=function(){const box=q('scrapbookPages'); if(!box)return; box.innerHTML=(data.pages||[]).map(p=>{const theme=p.theme||p.layout||'beach'; return `<div class="scrapbookTrue theme-${E(theme)}"><h3>${E(p.title)}</h3><div class="stickerStrip">${stickers(theme)}</div><div class="trueCollage ${E(p.layout||'collage')}">${(p.photos||[]).map((src,i)=>`<figure class="frame-${E(p.frame||'soft')} size-${i%6}"><img src="${src}" alt="Scrapbook photo"><figcaption>${i%2?'3x4':'5x7'}</figcaption></figure>`).join('')}</div>${p.note?`<p class="scrapNote">${E(p.note)}</p>`:''}<div class="scrapTools noPrint"><button onclick="window.print()" class="secondary">PDF / Print</button><button onclick="del('pages','${p.id}')" class="secondary">Delete</button></div></div>`;}).join('')||'<div class="card"><p>No scrapbook pages yet. Add photos directly or select photos from Memories.</p></div>';};

  // Trip rendering with map/weather/voting/link fixes.
  window.renderTripPlannerFixed=function(t){const id=t.id; return `<div class="tripTools"><div class="quickLinks"><button onclick="openTripMap('${id}')" class="secondary">Open Map</button><button onclick="refreshTripWeather('${id}')" class="secondary">Live Weather</button><button data-go="dashboard" class="secondary">Dashboard</button><button data-go="voting" class="secondary">Voting</button><button data-go="meals" class="secondary">Meals/Grocery</button><button data-go="packing" class="secondary">Packing</button></div><p class="weatherBox">${E(t.weather||'No live weather loaded yet.')}</p><div class="voteBox"><h4>Family Voting</h4>${voteHtml(t)}<textarea id="voteInput-${id}" placeholder="Add voting options, one per line"></textarea><textarea id="voteLinks-${id}" placeholder="Optional links for this voting item, one per line"></textarea><button onclick="addVoteOptionsBulk('${id}')" class="secondary">Add voting item</button></div><details open><summary>Itinerary</summary><div class="choiceChips compact"><label><input type="radio" name="itSlot-${id}" value="Morning" checked> Morning</label><label><input type="radio" name="itSlot-${id}" value="Afternoon"> Afternoon</label><label><input type="radio" name="itSlot-${id}" value="Evening"> Evening</label><label><input type="radio" name="itSlot-${id}" value="Custom"> Custom date/time</label></div><input id="itineraryCustom-${id}" type="datetime-local"><input id="itineraryTitle-${id}" placeholder="Activity"><button onclick="addItinerary('${id}')" class="secondary">Add itinerary item</button>${(t.itinerary||[]).map(i=>`<p>🗓️ <b>${E(i.time)}</b> ${E(i.title)}</p>`).join('')}</details></div>`;};
  window.renderTrips=function(){const box=q('tripList'); if(!box)return; box.innerHTML=(data.trips||[]).map(t=>`<div class="item tripCard"><h3>${E(t.name)}</h3><p>${E(t.destination)} ${t.start?`• ${fmtDate(t.start)} to ${fmtDate(t.end)}`:''}</p><div class="itemActions"><button onclick="editTrip('${t.id}')" class="primary">Edit Trip</button><button onclick="openTripMap('${t.id}')" class="secondary">Map</button><button onclick="refreshTripWeather('${t.id}')" class="secondary">Weather</button><button data-go="voting" class="secondary">Voting</button></div>${renderTripPlannerFixed(t)}</div>`).join('')||'<div class="card"><p>No trips yet.</p></div>';};

  // Dashboard/home redirects.
  document.addEventListener('click',e=>{const b=e.target.closest('[data-go]'); if(b){e.preventDefault(); show(b.dataset.go);}});

  const priorRender=window.render||render;
  window.render=render=function(){ priorRender(); ensureVoteTab(); cleanListControls(); ensureScrapbookTools(); renderTrips(); renderVoting(); renderMeals(); renderPacking(); renderPages(); };
  ensureVoteTab(); cleanListControls(); ensureScrapbookTools(); render();
})();

/* 6.3.2 Invite-only Firebase privacy recommendation */
(function(){
  const FAMILY_ID = 'our-family-adventures';
  const INVITE_COLLECTION = 'familyInvites';
  function db(){ return (window.firebaseReady||firebaseReady) && window.firebase ? firebase.firestore() : null; }
  function emailKey(email){ return String(email||'').trim().toLowerCase(); }
  function cleanCode(c){ return String(c||'').trim().toUpperCase(); }
  window.ofaFamilyId = FAMILY_ID;

  // Store one shared family app document, protected by Firebase rules/membership.
  window.appDataRef = appDataRef = function(){
    return firebase.firestore().collection('families').doc(FAMILY_ID).collection('private').doc('appData');
  };

  function securityPanel(){
    const card=document.getElementById('securityStatusCard');
    if(card && !document.getElementById('inviteOnlyNotice')){
      card.insertAdjacentHTML('afterbegin', `<div id="inviteOnlyNotice" class="securityNotice"><b>Invite-only family privacy is active.</b><br>Only approved, signed-in family accounts can read or save family data. People who find the Firebase web address should only reach the sign-in/invite screen.</div>`);
    }
    const sec=document.getElementById('securityStatus');
    if(sec){
      const u=firebase.auth?.().currentUser;
      sec.innerHTML=u?`Signed in as <b>${esc(u.email||'family user')}</b><br><small>Family ID: ${FAMILY_ID}</small>`:'Not signed in. Use an approved invite code to create a family account.';
    }
  }

  async function writeInviteToFirebase(inv){
    const refdb=db(); if(!refdb) return;
    await refdb.collection(INVITE_COLLECTION).doc(cleanCode(inv.code)).set({
      code: cleanCode(inv.code),
      email: emailKey(inv.email),
      name: inv.name||'',
      role: inv.role||'Family',
      familyId: FAMILY_ID,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: firebase.auth().currentUser?.email || 'admin'
    }, {merge:true});
  }

  const olderCreateInvite=window.createInvite;
  window.createInvite = async function(){
    if(!unlockAdmin()) return;
    if(typeof olderCreateInvite==='function') olderCreateInvite();
    const inv=JSON.parse(localStorage.getItem('ofa_last_invite')||'null');
    if(inv){
      try{ await writeInviteToFirebase(inv); toast('Invite saved to Firebase for invite-only signup.'); }
      catch(e){ console.error(e); toast('Invite created locally, but Firebase invite save failed. Check rules.'); }
    }
    securityPanel();
  };

  async function getFirebaseInvite(email, code){
    const refdb=db(); if(!refdb) throw new Error('Firebase is not ready.');
    const snap=await refdb.collection(INVITE_COLLECTION).doc(cleanCode(code)).get();
    if(!snap.exists) return null;
    const inv=snap.data();
    if(inv.status && inv.status !== 'pending') return null;
    if(emailKey(inv.email) !== emailKey(email)) return null;
    return inv;
  }

  window.firebaseLoginFlow = async function(){
    if(!firebaseReady){ toast('Firebase is not ready yet. Check firebase-config.js.'); return; }
    try{
      const auth=firebase.auth();
      if(auth.currentUser){ show('settings'); securityPanel(); toast('You are already signed in.'); return; }
      const params=new URLSearchParams(location.search);
      const email=emailKey(prompt('Family email address', params.get('email')||'')); if(!email) return;
      const password=prompt('Password - at least 6 characters'); if(!password) return;
      try{
        await auth.signInWithEmailAndPassword(email,password);
        securityPanel();
        return;
      }catch(signInErr){
        const inviteCode=cleanCode(prompt('Invite code from Melissa', params.get('invite')||''));
        if(!inviteCode) return toast('Invite code is required for a new account.');
        const inv=await getFirebaseInvite(email, inviteCode);
        if(!inv) return toast('Invite not found, expired, already used, or for a different email.');
        const cred=await auth.createUserWithEmailAndPassword(email,password);
        await firebase.firestore().collection('users').doc(cred.user.uid).set({
          email, name: inv.name||'', role: inv.role||'Family', familyId: FAMILY_ID,
          approved: true, invited: true, inviteCode, createdAt: firebase.firestore.FieldValue.serverTimestamp(), lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, {merge:true});
        await firebase.firestore().collection('families').doc(FAMILY_ID).collection('members').doc(cred.user.uid).set({
          email, name: inv.name||'', role: inv.role||'Family', approved: true, joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, {merge:true});
        await firebase.firestore().collection(INVITE_COLLECTION).doc(inviteCode).set({status:'used', usedBy:cred.user.uid, usedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
        try{ await cred.user.sendEmailVerification(); }catch(e){}
        toast('Family account created and approved.');
        securityPanel();
      }
    }catch(e){ console.error(e); toast(e.message||'Login failed'); }
  };

  ['loginBtn'].forEach(id=>{const el=document.getElementById(id); if(el)el.onclick=window.firebaseLoginFlow;});
  const oldRender=window.render || render;
  window.render = render = function(){ oldRender(); securityPanel(); };
  setTimeout(securityPanel,600);
})();

/* 6.3.3 voting save fix: unique vote fields + multiple links per voting item */
(function(){
  const byId = id => document.getElementById(id);
  const html = s => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const makeId = () => (typeof uid==='function' ? uid() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  const saveApp = () => { try { if (typeof save === 'function') save(); else localStorage.setItem('ofaData', JSON.stringify(data)); } catch(e){} };
  const safe = u => { try { const x=String(u||'').trim(); if(!x) return ''; return /^https?:\/\//i.test(x) ? x : 'https://' + x; } catch(e){ return ''; } };
  function getVoteText(tripId){
    const ids = [`votePageInput-${tripId}`, `voteTripInput-${tripId}`, `voteInput-${tripId}`];
    for (const id of ids) { const el=byId(id); const v=(el&&el.value||'').trim(); if(v) return {el, value:v}; }
    return {el: byId(ids[0]) || byId(ids[1]) || byId(ids[2]), value:''};
  }
  function getVoteLinks(tripId){
    const ids = [`votePageLinks-${tripId}`, `voteTripLinks-${tripId}`, `voteLinks-${tripId}`, `voteLink-${tripId}`];
    for (const id of ids) { const el=byId(id); const v=(el&&el.value||'').trim(); if(v) return {el, value:v}; }
    return {el: byId(ids[0]) || byId(ids[1]) || byId(ids[2]) || byId(ids[3]), value:''};
  }
  window.addVoteOptionsBulk = function(tripId){
    const trip = (data.trips||[]).find(t => t.id === tripId);
    if(!trip) return toast('Trip was not found.');
    trip.voteOptions = trip.voteOptions || [];
    const textBox = getVoteText(tripId);
    const linkBox = getVoteLinks(tripId);
    const optionLines = textBox.value.split(/\n|,/).map(s => s.trim()).filter(Boolean);
    const links = linkBox.value.split(/\n|,/).map(s => safe(s)).filter(Boolean);
    if(!optionLines.length) return toast('Add at least one voting option.');
    optionLines.forEach((text) => {
      trip.voteOptions.push({ id: makeId(), text, links: links.slice(), votes: {}, createdAt: new Date().toISOString() });
    });
    [textBox.el, linkBox.el].forEach(el => { if(el) el.value=''; });
    saveApp();
    if(typeof render === 'function') render();
    if(typeof show === 'function') show('voting');
    toast('Voting item saved.');
  };
  window.voteTrip = function(tripId, index){
    const trip = (data.trips||[]).find(t => t.id === tripId);
    const option = trip && trip.voteOptions && trip.voteOptions[index];
    if(!option) return toast('Voting option was not found.');
    let voter = (localStorage.getItem('ofa_family_user') || localStorage.getItem('ofa_voter_name') || '').trim();
    if(!voter){ voter = (prompt('Your name for voting') || '').trim(); }
    if(!voter) return toast('Vote canceled.');
    localStorage.setItem('ofa_family_user', voter);
    localStorage.setItem('ofa_voter_name', voter);
    (trip.voteOptions||[]).forEach(v => { v.votes = v.votes || {}; delete v.votes[voter]; });
    option.votes = option.votes || {};
    option.votes[voter] = new Date().toISOString();
    saveApp();
    if(typeof render === 'function') render();
    if(typeof show === 'function') show('voting');
    toast('Vote saved.');
  };
  function count(v){ return Object.keys(v.votes||{}).length + (v.legacyCount||0); }
  window.renderVoting = function(){
    const box = byId('votingList'); if(!box) return;
    box.innerHTML = (data.trips||[]).map(trip => {
      const rows = (trip.voteOptions||[]).map((v,i) => {
        const links = (v.links||[]).concat(v.link?[v.link]:[]).filter(Boolean).map((l,n)=>`<a href="${safe(l)}" target="_blank" rel="noopener">Link ${n+1}</a>`).join(' ');
        return `<div class="voteRow"><span><b>${html(v.text)}</b><br>${links}</span><strong>${count(v)} vote(s)</strong><button onclick="voteTrip('${trip.id}',${i})" class="secondary">Vote / Change</button><button onclick="removeVoteOption('${trip.id}',${i})" class="secondary">Admin Remove</button></div>`;
      }).join('') || '<p>No voting options yet.</p>';
      return `<div class="card"><h3>${html(trip.name)}</h3>${rows}<label>Voting option(s)</label><textarea id="votePageInput-${trip.id}" placeholder="Example: Lodging, Restaurant, Activity\nAdd one per line"></textarea><label>Links for this voting item</label><textarea id="votePageLinks-${trip.id}" placeholder="Paste one or multiple links, one per line"></textarea><button onclick="addVoteOptionsBulk('${trip.id}')" class="secondary">Add voting item</button></div>`;
    }).join('') || '<div class="card"><p>No trips yet. Create a trip first.</p></div>';
  };
  const previousRender = window.render || render;
  window.render = render = function(){ previousRender(); if(typeof window.renderVoting==='function') window.renderVoting(); };
  setTimeout(()=>{ if(typeof window.renderVoting==='function') window.renderVoting(); }, 300);
})();


/* 6.3.4 Replace top-right person prompt with Profile & Family page */
(function(){
  function byId(id){return document.getElementById(id)}
  function clean(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function currentEmail(){
    try{ if(window.firebase && firebase.auth && firebase.auth().currentUser) return firebase.auth().currentUser.email || ''; }catch(e){}
    return localStorage.getItem('ofa_family_email') || '';
  }
  function currentName(){
    return localStorage.getItem('ofa_family_user') || localStorage.getItem('ofa_voter_name') || ((window.data&&data.people&&data.people[0]&&data.people[0].name)||'Family Member');
  }
  function currentPhoto(){
    const name=currentName();
    const person=(window.data&&data.people||[]).find(p=>String(p.name||'').toLowerCase()===String(name||'').toLowerCase() || String(p.email||'').toLowerCase()===String(currentEmail()).toLowerCase());
    return person && (person.photo || person.image || person.avatar || '');
  }
  window.renderProfileFamily=function(){
    const box=byId('profileSummary'); if(!box) return;
    const photo=currentPhoto(); const name=currentName(); const email=currentEmail();
    box.innerHTML = `${photo?`<img class="profileAvatar" src="${clean(photo)}" alt="Profile photo">`:`<div class="profileAvatar">👤</div>`}<div class="profileDetails"><p><b>${clean(name)}</b></p><p>${email?clean(email):'Not signed in yet'}</p><p class="helperText">Use this page for profile, family members, invitations, admin controls, settings, and sign out.</p></div>`;
    const invites=window.data&&data.invites||[]; const inviteBox=byId('profileInviteSummary');
    if(inviteBox) inviteBox.innerHTML=invites.length?invites.slice(-5).reverse().map(i=>`<div class="profileInviteMini"><b>${clean(i.name||i.email)}</b><br><span>${clean(i.email||'')} • ${clean(i.status||'pending')}</span></div>`).join(''):'<p class="helperText">No pending invitations yet.</p>';
  };
  window.openProfileFamily=function(){ if(typeof show==='function') show('profileFamily'); window.renderProfileFamily(); };
  function wireProfile(){
    const login=byId('loginBtn'); if(login) login.onclick=window.openProfileFamily;
    const edit=byId('profileEditBtn'); if(edit) edit.onclick=()=>{ if(typeof show==='function') show('people'); };
    const people=byId('profilePeopleBtn'); if(people) people.onclick=()=>{ if(typeof show==='function') show('people'); };
    const settings=byId('profileSettingsBtn'); if(settings) settings.onclick=()=>{ if(typeof show==='function') show('settings'); };
    const invite=byId('profileInviteBtn'); if(invite) invite.onclick=()=>{ if(typeof show==='function') show('settings'); setTimeout(()=>byId('inviteEmail')&&byId('inviteEmail').focus(),150); };
    const pending=byId('profilePendingBtn'); if(pending) pending.onclick=()=>{ if(typeof show==='function') show('settings'); };
    const admin=byId('profileAdminBtn'); if(admin) admin.onclick=()=>{ if(typeof show==='function') show('settings'); };
    const signout=byId('profileSignOutBtn'); if(signout) signout.onclick=async()=>{ try{ if(window.firebase&&firebase.auth&&firebase.auth().currentUser){ await firebase.auth().signOut(); } localStorage.removeItem('ofa_family_email'); toast&&toast('Signed out.'); window.renderProfileFamily(); }catch(e){ alert(e.message||'Could not sign out.'); } };
  }
  const oldRender=window.render;
  if(typeof oldRender==='function') window.render=render=function(){ oldRender(); window.renderProfileFamily(); wireProfile(); };
  document.addEventListener('DOMContentLoaded',wireProfile);
  setTimeout(()=>{wireProfile(); window.renderProfileFamily();},500);
})();

/* 6.3.5 navigation, private lists, meal controls, chat notifications, scrapbook cleanup */
(function(){
  const $ = id => document.getElementById(id);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const safe = s => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const makeId = () => (typeof uid==='function'?uid():'id-'+Date.now()+'-'+Math.random().toString(36).slice(2));
  function saveApp(){ try{ if(typeof save==='function') save(); else localStorage.setItem('ofaData',JSON.stringify(data)); }catch(e){} }
  function me(){
    try{ const u=window.firebase&&firebase.auth&&firebase.auth().currentUser; if(u&&u.email) return u.email; }catch(e){}
    return localStorage.getItem('ofa_family_email') || localStorage.getItem('ofa_family_user') || localStorage.getItem('ofa_voter_name') || 'Melissa';
  }
  function notifyUser(message, cat='system', force=true){
    try{
      if(data.settings && data.settings.notifications) data.settings.notifications[cat]=true;
      if(typeof notify==='function') notify(message,cat,force);
      else if('Notification' in window && Notification.permission==='granted') new Notification('Our Family Adventures',{body:message});
      else if(typeof toast==='function') toast(message);
    }catch(e){ if(typeof toast==='function') toast(message); }
  }

  const oldShow = window.show;
  window.show = function(id){
    if(typeof oldShow==='function') oldShow(id);
    $$('.page').forEach(p=>p.classList.toggle('active',p.id===id));
    $$('.dock [data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===id));
    setTimeout(()=>window.scrollTo({top:0,left:0,behavior:'auto'}),0);
    const drawer=$('drawer'); if(drawer) drawer.classList.remove('open');
  };
  document.addEventListener('click',e=>{ const b=e.target.closest('[data-go]'); if(b){ e.preventDefault(); window.show(b.dataset.go); }});

  function peopleOptions(selected){
    const names=(data.people||[]).map(p=>p.name).filter(Boolean);
    const all=[...new Set([...names,'Volunteer needed','Everyone / Group'])];
    return all.map(n=>`<option ${n===selected?'selected':''}>${safe(n)}</option>`).join('');
  }
  function makeSelect(id, selected){ return `<select id="${id}">${peopleOptions(selected)}</select>`; }
  function cleanForms(){
    // Remove all duplicate group/private radio button blocks.
    $$('.listScope,.oneScope,#groceryScopeClean,#packingScopeClean').forEach(el=>el.remove());
    ['groceryScope','packingScope','mealType','mealTypeFinal'].forEach(name=>$$(`input[name="${name}"]`).forEach(inp=>{ const box=inp.closest('label')||inp.parentElement; if(box) box.remove(); }));
    $$('.mealButtons,.choiceChips.mealButtons').forEach(el=>el.remove());

    const gi=$('groceryItem');
    if(gi && !$('groceryScopeSelect')) gi.insertAdjacentHTML('beforebegin','<label>List privacy<select id="groceryScopeSelect"><option value="group">Group list</option><option value="individual">Individual/private</option></select></label>');
    const pi=$('packingItem');
    if(pi && !$('packingScopeSelect')) pi.insertAdjacentHTML('beforebegin','<label>List privacy<select id="packingScopeSelect"><option value="group">Group list</option><option value="individual">Individual/private</option></select></label>');

    const mt=$('mealTitle');
    if(mt){ mt.style.display='none'; mt.closest('label')?.classList.add('hiddenMealTitle'); if(!$('mealTypeSelect')) mt.closest('label')?.insertAdjacentHTML('beforebegin','<label>Meal type<select id="mealTypeSelect"><option>Breakfast</option><option>Snack</option><option>Dining out</option><option>Lunch</option><option selected>Dinner</option><option>Late snack</option><option>Happy hour</option></select></label>'); }
    [['mealPerson','mealPersonSelect635'],['groceryPerson','groceryPersonSelect635'],['packingPerson','packingPersonSelect635']].forEach(([oldId,newId])=>{
      const old=$(oldId); if(!old) return; old.required=false; old.style.display='none'; old.closest('label')?.classList.add('hiddenOriginalPerson');
      if(!$(newId)) old.closest('label')?.insertAdjacentHTML('beforebegin',`<label>Assigned to${makeSelect(newId, old.value||'Volunteer needed')}</label>`);
    });
  }
  function visible(x){ return !x.private || x.owner===me() || x.addedBy===me() || x.person===me(); }
  function row(key,x,title,sub){return `<div class="item checklistItem"><label class="checkLine"><input type="checkbox" ${x.done?'checked':''} onchange="toggleDone('${key}','${x.id}')"><span><b>${safe(title)}</b><small>${safe(sub||'')}</small></span></label><p class="helperText">${x.private?'Private — only you can see this':'Group'}${x.person?' • Assigned: '+safe(x.person):''}</p><div class="itemActions"><button onclick="editListItem('${key}','${x.id}')" class="secondary smallBtn">Edit</button><button onclick="del('${key}','${x.id}')" class="secondary smallBtn">Delete</button></div></div>`;}
  window.editListItem=function(key,id){ const arr=data[key]||[]; const x=arr.find(a=>a.id===id); if(!x)return; const val=prompt('Edit item',x.item||x.title||''); if(val===null)return; x.item=val.trim()||x.item; saveApp(); render(); };

  window.renderMeals=function(){ const box=$('mealList'); if(!box)return; const meals=(data.meals||[]).filter(visible); const groceries=(data.groceries||[]).filter(visible); box.innerHTML=`<div class="card"><h3>Meal Plan</h3>${meals.map(m=>row('meals',m,`${m.title||m.mealType||'Meal'}: ${m.item||''}`,m.trip)).join('')||'<p>No meal items yet.</p>'}</div><div class="card"><h3>Group Grocery List</h3>${groceries.filter(x=>!x.private).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No group grocery items yet.</p>'}</div><div class="card"><h3>My Private Grocery List</h3>${groceries.filter(x=>x.private).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No private grocery items yet.</p>'}</div>`; };
  window.renderPacking=function(){ const box=$('packingList'); if(!box)return; const list=(data.packing||[]).filter(visible); box.innerHTML=`<div class="card"><h3>Group Packing Checklist</h3>${list.filter(x=>!x.private).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No group packing items yet.</p>'}</div><div class="card"><h3>My Private Packing Checklist</h3>${list.filter(x=>x.private).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No private packing items yet.</p>'}</div>`; };

  if($('saveMeal')) $('saveMeal').onclick=()=>{ const item=($('mealItem')?.value||'').trim() || ($('mealTypeSelect')?.value||'Meal'); const type=$('mealTypeSelect')?.value||'Dinner'; const person=$('mealPersonSelect635')?.value||'Volunteer needed'; data.meals.push({id:makeId(),trip:$('mealTrip')?.value||'',title:type,mealType:type,item,person,scope:'group',private:false,owner:person,addedBy:me(),done:false}); if($('mealItem')) $('mealItem').value=''; saveApp(); render(); notifyUser('Meal item added','meals'); };
  if($('saveGrocery')) $('saveGrocery').onclick=()=>{ const sc=$('groceryScopeSelect')?.value||'group'; const person=sc==='group'?($('groceryPersonSelect635')?.value||'Volunteer needed'):me(); data.groceries.push({id:makeId(),trip:$('groceryTrip')?.value||'',item:($('groceryItem')?.value||'Grocery item').trim(),person,scope:sc,private:sc==='individual',owner:sc==='individual'?me():person,addedBy:me(),done:false}); if($('groceryItem')) $('groceryItem').value=''; saveApp(); render(); notifyUser(sc==='individual'?'Private grocery item added':'Group grocery item added','meals'); };
  if($('savePacking')) $('savePacking').onclick=()=>{ const sc=$('packingScopeSelect')?.value||'group'; const person=sc==='group'?($('packingPersonSelect635')?.value||'Everyone / Group'):me(); data.packing.push({id:makeId(),trip:$('packingTrip')?.value||'',item:($('packingItem')?.value||'Packing item').trim(),person,scope:sc,private:sc==='individual',owner:sc==='individual'?me():person,addedBy:me(),done:false}); if($('packingItem')) $('packingItem').value=''; saveApp(); render(); notifyUser(sc==='individual'?'Private packing item added':'Group packing item added','trips'); };

  window.sendChatMessage635=function(){ const input=$('chatInput'); const text=(input?.value||'').trim(); if(!text)return; data.chat=data.chat||[]; data.chat.push({id:makeId(),text,author:me(),at:new Date().toISOString()}); input.value=''; saveApp(); renderChat(); const mention=/@\w+/.test(text); notifyUser(mention?'You were mentioned in Family Chat':'New Family Chat message','chat',true); };
  if($('sendChat')) $('sendChat').onclick=window.sendChatMessage635;
  window.renderChat=function(){ const box=$('chatLog'); if(!box)return; box.innerHTML=(data.chat||[]).map(c=>`<div class="bubble"><b>${safe(c.author||'Family')}</b><br>${safe(c.text).replace(/@\w+/g,m=>`<b>${m}</b>`)}<br><small>${new Date(c.at).toLocaleString()}</small></div>`).join(''); };
  window.askNotifications=async function(){ if(!('Notification' in window)) return alert('This browser does not support notifications.'); if(Notification.permission==='denied') return alert('Notifications are blocked in Chrome. Open site settings for this page and allow Notifications.'); const p=await Notification.requestPermission(); if(p==='granted'){ data.settings=data.settings||{}; data.settings.notifications=data.settings.notifications||{}; ['chat','trips','birthdays','meals','weather','scrapbook','journal','votes','system'].forEach(k=>data.settings.notifications[k]=true); saveApp(); new Notification('Our Family Adventures',{body:'Notifications are on.'}); toast('Notifications are on for all opt-in items.'); } else alert('Notifications were not allowed on this device.'); };
  ['enableNotifications','settingsNotifyBtn','notifyBtn'].forEach(id=>{ if($(id)) $(id).onclick=window.askNotifications; });

  window.renderPages=function(){ const box=$('scrapbookPages'); if(!box)return; box.innerHTML=(data.pages||[]).map(p=>{ const theme=p.theme||p.layout||'beach'; const photos=p.photos||p.images||[]; return `<div class="scrapbookTrue theme-${safe(theme)}"><h3>${safe(p.title||'Scrapbook Page')}</h3><div class="stickerStrip">${theme.includes('mountain')?'⛰️ 🌲 🏕️ 🔥':theme.includes('party')?'🎉 🎈 ✨ 📸':theme.includes('drink')?'🍹 🧊 🍋 🌴':'🐚 ⭐ 🌊 🏖️ ☀️'}</div><div class="trueCollage ${safe(p.layout||'collage')}">${photos.map((src,i)=>`<figure class="frame-${safe(p.frame||'soft')} size-${i%6}"><img src="${src}" alt="Scrapbook photo"></figure>`).join('')}</div>${p.note?`<p class="scrapNote">${safe(p.note)}</p>`:''}<div class="scrapTools noPrint"><button onclick="window.print()" class="secondary">PDF / Print</button><button onclick="del('pages','${p.id}')" class="secondary">Delete</button></div></div>`; }).join('') || '<div class="card"><p>No scrapbook pages yet. Add photos directly or select photos from Memories.</p></div>'; };

  const oldRender = window.render;
  window.render = render = function(){ if(typeof oldRender==='function') oldRender(); cleanForms(); renderMeals(); renderPacking(); renderChat(); renderPages(); };
  setTimeout(()=>{ cleanForms(); renderMeals(); renderPacking(); renderChat(); renderPages(); },300);
})();

/* Version 6.3.6 final usability fixes: private meals, notification center, profile editing, scrapbook photo restore, voting links, weather fallback, page-start navigation */
(function(){
  const $=id=>document.getElementById(id);
  const $$=sel=>Array.from(document.querySelectorAll(sel));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const saveApp=()=>{ try{ if(typeof save==='function') save(); else localStorage.setItem('ofaData',JSON.stringify(data)); }catch(e){} };
  const me=()=> (localStorage.getItem('ofa_family_user') || localStorage.getItem('ofa_voter_name') || (data.people&&data.people[0]?.name) || 'Melissa').trim();
  const currentTrip=()=> (typeof byNextTrip==='function' && byNextTrip()) || (data.trips||[])[0] || null;
  const isMine=x=>!x.private || x.owner===me() || x.addedBy===me() || x.person===me();
  const peopleNames=()=>[...new Set([...(data.people||[]).map(p=>p.name).filter(Boolean), 'Volunteer needed','Everyone / Group'])];
  const peopleOptions=sel=>peopleNames().map(n=>`<option value="${esc(n)}" ${n===sel?'selected':''}>${esc(n)}</option>`).join('');

  // Navigation starts each page at its own title, not part-way down the home image.
  window.show=function(page){
    $$('.page').forEach(p=>p.classList.toggle('active',p.id===page));
    $$('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===page));
    $('drawer')?.classList.remove('open');
    setTimeout(()=>{ const target=$(page); if(target){ target.scrollIntoView({block:'start',behavior:'auto'}); } window.scrollTo({top:0,left:0,behavior:'auto'}); },0);
  };
  document.addEventListener('click',e=>{ const b=e.target.closest('[data-go]'); if(!b)return; e.preventDefault(); show(b.dataset.go); });

  // Clickable home count cards.
  function wireHomeCounts(){
    const cards=$$('.dashboardGrid .miniCard');
    [['people'],['adventures'],['memories'],['scrapbook']].forEach((p,i)=>{ if(cards[i]){ cards[i].dataset.go=p[0]; cards[i].classList.add('clickableCard'); }});
  }

  // One in-app notification center. This still works when Chrome blocks system notifications.
  function ensureNotificationCenter(){
    if(!$('notificationBell')){
      document.body.insertAdjacentHTML('beforeend',`<button id="notificationBell" class="notificationBell" type="button">🔔<span id="notificationCount">0</span></button><aside id="notificationPanel" class="notificationPanel"><h3>Notifications</h3><p class="helperText">These stay inside the app even when Chrome blocks phone notifications.</p><div id="notificationPanelList"></div><button id="clearNotifications" class="secondary">Clear</button></aside><button id="chatPopButton" class="chatPopButton" type="button">💬<span id="chatUnreadCount">0</span></button><aside id="chatPopout" class="chatPopout"><h3>Family Chat</h3><div id="chatPopLog" class="chatPopLog"></div><div class="chatBox"><input id="chatPopInput" placeholder="Write a message..." /><button id="chatPopSend" class="primary">Send</button></div></aside>`);
      $('notificationBell').onclick=()=>{$('notificationPanel').classList.toggle('open'); data._unreadNotifications=0; saveApp(); renderNotificationPanel();};
      $('clearNotifications').onclick=()=>{data.notifications=[]; data._unreadNotifications=0; saveApp(); renderNotificationPanel();};
      $('chatPopButton').onclick=()=>{$('chatPopout').classList.toggle('open'); data._unreadChat=0; saveApp(); renderChat(); renderNotificationPanel();};
      $('chatPopSend').onclick=()=>{const t=($('chatPopInput').value||'').trim(); if(!t)return; addChat(t); $('chatPopInput').value='';};
    }
  }
  window.addAppNotification=function(text,type='system'){
    data.notifications=data.notifications||[];
    data.notifications.unshift({id:id(),text, type, at:new Date().toISOString(), read:false});
    data._unreadNotifications=(data._unreadNotifications||0)+1;
    saveApp(); renderNotificationPanel();
    if(window.Notification && Notification.permission==='granted') { try{ new Notification('Our Family Adventures',{body:text}); }catch(e){} }
  };
  function renderNotificationPanel(){
    ensureNotificationCenter();
    $('notificationCount').textContent=data._unreadNotifications||0;
    $('notificationCount').style.display=(data._unreadNotifications||0)?'inline-flex':'none';
    $('chatUnreadCount').textContent=data._unreadChat||0;
    $('chatUnreadCount').style.display=(data._unreadChat||0)?'inline-flex':'none';
    const list=data.notifications||[];
    $('notificationPanelList').innerHTML=list.length?list.slice(0,30).map(n=>`<div class="noticeItem"><b>${esc(n.type)}</b><p>${esc(n.text)}</p><small>${new Date(n.at).toLocaleString()}</small></div>`).join(''):'<p>No notifications yet.</p>';
    const log=$('notificationLog'); if(log) log.innerHTML=$('notificationPanelList').innerHTML;
  }
  window.notifyUser=function(text,type='system',force=false){ addAppNotification(text,type); };
  window.notify=function(text,type='system'){ addAppNotification(text,type); };

  // Cleaner forms: meals also get private/group list, and no duplicate radio buttons.
  function cleanForms636(){
    $$('.listScope,.oneScope,#groceryScopeClean,#packingScopeClean').forEach(el=>el.remove());
    $$('input[type="radio"]').forEach(inp=>{ const label=inp.closest('label'); if(label && /Group list|Individual\/private|Breakfast|Snack|Dining out|Lunch|Dinner|Late snack|Happy/i.test(label.textContent||'')) label.remove(); });
    ['mealPerson','groceryPerson','packingPerson'].forEach(oldId=>{ const old=$(oldId); if(old){ old.style.display='none'; old.required=false; old.closest('label')?.classList.add('hiddenOriginalPerson'); }});
    if($('mealTitle')){ $('mealTitle').style.display='none'; $('mealTitle').closest('label')?.classList.add('hiddenMealTitle'); if(!$('mealTypeSelect636')) $('mealTitle').closest('label')?.insertAdjacentHTML('beforebegin','<label>Meal type<select id="mealTypeSelect636"><option>Breakfast</option><option>Snack</option><option>Dining out</option><option>Lunch</option><option selected>Dinner</option><option>Late snack</option><option>Happy hour</option></select></label>'); }
    if($('mealItem') && !$('mealScopeSelect')) $('mealItem').insertAdjacentHTML('beforebegin','<label>List privacy<select id="mealScopeSelect"><option value="group">Group/shared meal</option><option value="individual">Individual/private meal</option></select></label>');
    if($('groceryItem') && !$('groceryScopeSelect')) $('groceryItem').insertAdjacentHTML('beforebegin','<label>List privacy<select id="groceryScopeSelect"><option value="group">Group list</option><option value="individual">Individual/private</option></select></label>');
    if($('packingItem') && !$('packingScopeSelect')) $('packingItem').insertAdjacentHTML('beforebegin','<label>List privacy<select id="packingScopeSelect"><option value="group">Group list</option><option value="individual">Individual/private</option></select></label>');
    if($('mealPerson') && !$('mealPersonSelect636')) $('mealPerson').closest('label')?.insertAdjacentHTML('beforebegin',`<label>Assigned to<select id="mealPersonSelect636">${peopleOptions('Volunteer needed')}</select></label>`);
    if($('groceryPerson') && !$('groceryPersonSelect636')) $('groceryPerson').closest('label')?.insertAdjacentHTML('beforebegin',`<label>Assigned to<select id="groceryPersonSelect636">${peopleOptions('Volunteer needed')}</select></label>`);
    if($('packingPerson') && !$('packingPersonSelect636')) $('packingPerson').closest('label')?.insertAdjacentHTML('beforebegin',`<label>Assigned to<select id="packingPersonSelect636">${peopleOptions('Everyone / Group')}</select></label>`);
  }
  function row(key,x,title,sub){return `<div class="item checklistItem"><label class="checkLine"><input type="checkbox" ${x.done?'checked':''} onchange="toggleDone('${key}','${x.id}')"><span><b>${esc(title)}</b><small>${esc(sub||'')}</small></span></label><p class="helperText">${x.private?'Private — visible only to the owner':'Group/shared'}${x.person?' • Assigned: '+esc(x.person):''}</p><div class="itemActions"><button onclick="editListItem('${key}','${x.id}')" class="secondary smallBtn">Edit</button><button onclick="del('${key}','${x.id}')" class="secondary smallBtn">Delete</button></div></div>`;}
  window.editListItem=function(key,itemId){const x=(data[key]||[]).find(a=>a.id===itemId); if(!x)return; const val=prompt('Edit item',x.item||x.title||''); if(val===null)return; x.item=val.trim()||x.item; saveApp(); render();};
  window.renderMeals=function(){const box=$('mealList'); if(!box)return; const meals=(data.meals||[]).filter(isMine), groceries=(data.groceries||[]).filter(isMine); box.innerHTML=`<div class="card"><h3>Group Meal Plan</h3>${meals.filter(x=>!x.private).map(m=>row('meals',m,`${m.title||m.mealType||'Meal'}: ${m.item||''}`,m.trip)).join('')||'<p>No group meals yet.</p>'}</div><div class="card"><h3>My Private Meal Plan</h3>${meals.filter(x=>x.private).map(m=>row('meals',m,`${m.title||m.mealType||'Meal'}: ${m.item||''}`,m.trip)).join('')||'<p>No private meals yet.</p>'}</div><div class="card"><h3>Group Grocery List</h3>${groceries.filter(x=>!x.private).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No group grocery items yet.</p>'}</div><div class="card"><h3>My Private Grocery List</h3>${groceries.filter(x=>x.private).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No private grocery items yet.</p>'}</div>`;};
  window.renderPacking=function(){const box=$('packingList'); if(!box)return; const list=(data.packing||[]).filter(isMine); box.innerHTML=`<div class="card"><h3>Group Packing Checklist</h3>${list.filter(x=>!x.private).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No group packing items yet.</p>'}</div><div class="card"><h3>My Private Packing Checklist</h3>${list.filter(x=>x.private).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No private packing items yet.</p>'}</div>`;};
  function addList(kind){
    const trip=$(kind==='packing'?'packingTrip':kind==='grocery'?'groceryTrip':'mealTrip')?.value||'';
    const sc=$(kind+'ScopeSelect')?.value||'group';
    const item=$(kind==='packing'?'packingItem':kind==='grocery'?'groceryItem':'mealItem')?.value?.trim()|| (kind==='meal'?$('mealTypeSelect636')?.value:'Item');
    const person=sc==='individual'?me():($(kind+'PersonSelect636')?.value||'Volunteer needed');
    const obj={id:id(),trip,item,person,scope:sc,private:sc==='individual',owner:sc==='individual'?me():person,addedBy:me(),done:false};
    if(kind==='meal'){obj.title=$('mealTypeSelect636')?.value||'Dinner'; obj.mealType=obj.title; data.meals.push(obj); if($('mealItem')) $('mealItem').value=''; addAppNotification(`${obj.private?'Private':'Group'} meal added: ${item}`,'meals');}
    if(kind==='grocery'){data.groceries.push(obj); if($('groceryItem')) $('groceryItem').value=''; addAppNotification(`${obj.private?'Private':'Group'} grocery added: ${item}`,'meals');}
    if(kind==='packing'){data.packing.push(obj); if($('packingItem')) $('packingItem').value=''; addAppNotification(`${obj.private?'Private':'Group'} packing item added: ${item}`,'trips');}
    saveApp(); render();
  }
  setTimeout(()=>{ if($('saveMeal')) $('saveMeal').onclick=()=>addList('meal'); if($('saveGrocery')) $('saveGrocery').onclick=()=>addList('grocery'); if($('savePacking')) $('savePacking').onclick=()=>addList('packing'); },50);

  // Chat is live inside the app and available from a pop-out. Background phone notifications need browser permission/service worker support.
  function addChat(text){ data.chat=data.chat||[]; data.chat.push({id:id(),text,author:me(),at:new Date().toISOString()}); data._unreadChat=(data._unreadChat||0)+1; saveApp(); renderChat(); addAppNotification(/@\w+/.test(text)?'You were mentioned in Family Chat':'New Family Chat message','chat'); }
  window.sendChatMessage635=()=>{ const input=$('chatInput'); const text=(input?.value||'').trim(); if(!text)return; input.value=''; addChat(text); };
  if($('sendChat')) $('sendChat').onclick=window.sendChatMessage635;
  window.renderChat=function(){ensureNotificationCenter(); const html=(data.chat||[]).map(c=>`<div class="bubble"><b>${esc(c.author||'Family')}</b><br>${esc(c.text).replace(/@\w+/g,m=>`<b>${m}</b>`)}<br><small>${new Date(c.at).toLocaleString()}</small></div>`).join('')||'<p>No chat messages yet.</p>'; if($('chatLog')) $('chatLog').innerHTML=html; if($('chatPopLog')) $('chatPopLog').innerHTML=html; renderNotificationPanel();};

  // Profile photos and contact editing.
  function ensureProfileEditor(){
    if(!$('profilePhotoInput')) document.body.insertAdjacentHTML('beforeend','<input id="profilePhotoInput" type="file" accept="image/*" class="hidden" />');
    $('profilePhotoInput').onchange=e=>{const file=e.target.files?.[0]; if(!file)return; const r=new FileReader(); r.onload=()=>{localStorage.setItem('ofa_profile_photo',r.result); const p=(data.people||[]).find(x=>x.name===me())||data.people?.[0]; if(p)p.photo=r.result; saveApp(); renderProfile(); renderPeople&&renderPeople();}; r.readAsDataURL(file);};
  }
  window.renderProfile=function(){ensureProfileEditor(); const photo=localStorage.getItem('ofa_profile_photo') || (data.people||[]).find(p=>p.name===me())?.photo || ''; const box=$('profileSummary'); if(box) box.innerHTML=`<div class="profileSummary"><img class="profileAvatarBig" src="${photo||'icons/icon-192.png'}" alt="Profile photo"><div><h3>${esc(me())}</h3><p>${esc(localStorage.getItem('ofa_profile_email')||'Add email/contact info')}</p><p>${esc(localStorage.getItem('ofa_profile_phone')||'')}</p></div></div>`; };
  setTimeout(()=>{ensureProfileEditor(); if($('profileEditBtn')) $('profileEditBtn').onclick=()=>{ const name=prompt('Your display name',me()); if(name){localStorage.setItem('ofa_family_user',name.trim());} const email=prompt('Email/contact info',localStorage.getItem('ofa_profile_email')||''); if(email!==null)localStorage.setItem('ofa_profile_email',email.trim()); const phone=prompt('Phone number or extra contact info',localStorage.getItem('ofa_profile_phone')||''); if(phone!==null)localStorage.setItem('ofa_profile_phone',phone.trim()); if(confirm('Change profile photo?')) $('profilePhotoInput').click(); renderProfile(); saveApp();}; renderProfile();},200);

  // Scrapbook: restore photos saved as element mediaIds, and add ATV/fishing themes/stickers.
  function mediaMap(){const map={}; (data.memories||[]).forEach(m=>(m.media||[]).forEach(mm=>{if(mm.type==='image'){map[mm.id]=mm.src; map[mm.src]=mm.src;}})); return map;}
  function pagePhotos(p){const map=mediaMap(); let photos=[]; if(Array.isArray(p.photos)) photos=photos.concat(p.photos); if(Array.isArray(p.elements)) p.elements.forEach(e=>{ if(e.type==='photo') photos.push(e.src||map[e.mediaId]||map[e.photoId]); }); return photos.filter(Boolean);}
  function stickers(theme){const t=String(theme||'').toLowerCase(); if(t.includes('atv')) return '🏁 🛞 🏕️ 🌲 🧭'; if(t.includes('fish')) return '🎣 🐟 🚤 🌊 ☀️'; if(t.includes('mountain')) return '⛰️ 🌲 🏕️ 🔥'; if(t.includes('party')) return '🎉 🎈 ✨ 📸'; if(t.includes('drink')) return '🍹 🧊 🍋 🌴'; return '🐚 ⭐ 🌊 🏖️ ☀️';}
  window.renderPages=function(){const box=$('scrapbookPages'); if(!box)return; box.innerHTML=(data.pages||[]).map(p=>{const photos=pagePhotos(p), theme=p.theme||p.layout||'beach'; return `<div class="scrapbookTrue theme-${esc(theme)}"><h3>${esc(p.title||'Scrapbook Page')}</h3><div class="stickerStrip">${stickers(theme)}</div><div class="trueCollage ${(p.layout||'collage')} ${photos.length>4?'multi':''}">${photos.map((src,i)=>`<figure class="frame-${esc(p.frame||'soft')} size-${i%8}"><img src="${src}" alt="Scrapbook photo"></figure>`).join('')||'<p>No photos selected for this page.</p>'}</div>${p.note?`<p class="scrapNote">${esc(p.note)}</p>`:''}<div class="scrapTools noPrint"><button onclick="window.print()" class="secondary">PDF / Print</button><button onclick="del('pages','${p.id}')" class="secondary">Delete</button></div></div>`;}).join('')||'<div class="card"><p>No scrapbook pages yet. Save photos in Memories, select them, then create a page.</p></div>';};
  if($('pageTheme')){['ATV Riding','Fishing'].forEach(t=>{ if(![...$('pageTheme').options].some(o=>o.value===t)) $('pageTheme').insertAdjacentHTML('beforeend',`<option>${t}</option>`); }); }

  // Voting: save multiple links per voting item, and keep voting visible after adding/editing a trip.
  window.addVoteOption=function(tripId){const t=(data.trips||[]).find(x=>x.id===tripId)||currentTrip(); if(!t)return; t.voteOptions=t.voteOptions||[]; const text=($(`voteInput-${tripId}`)?.value||$('voteTitle')?.value||'').trim(); const links=($(`voteLinks-${tripId}`)?.value||$('voteLinks')?.value||'').split(/\n|,/).map(x=>x.trim()).filter(Boolean); if(!text)return alert('Add a voting option title first.'); t.voteOptions.push({id:id(),text,links,votes:{}}); if($(`voteInput-${tripId}`)) $(`voteInput-${tripId}`).value=''; if($(`voteLinks-${tripId}`)) $(`voteLinks-${tripId}`).value=''; saveApp(); render(); addAppNotification('Voting option added: '+text,'votes');};

  // Weather: try live lookup and add a one-tap external fallback instead of leaving the trip blank.
  window.refreshTripWeather=async function(tripId){const t=(data.trips||[]).find(x=>x.id===tripId)||currentTrip(); if(!t)return; const place=(t.address||t.destination||t.name||'').trim(); if(!place)return alert('Add a destination or address first.'); try{ if(typeof getWeatherFor==='function') t.weather=await getWeatherFor(place); else throw new Error('No weather function'); }catch(e){ t.weather=`Weather link saved for ${place}. Tap Weather again or check spelling if live weather does not load.`; t.weatherUrl=`https://www.google.com/search?q=${encodeURIComponent(place+' weather')}`; } t.weatherUpdatedAt=new Date().toISOString(); saveApp(); render(); addAppNotification('Weather updated for '+(t.name||place),'weather');};

  const oldRender=window.render;
  window.render=function(){ if(typeof oldRender==='function') oldRender(); wireHomeCounts(); cleanForms636(); renderMeals(); renderPacking(); renderChat(); renderProfile(); renderPages(); renderNotificationPanel(); };
  setTimeout(()=>{wireHomeCounts(); cleanForms636(); renderMeals(); renderPacking(); renderChat(); renderProfile(); renderPages(); renderNotificationPanel();},400);
})();

/* Version 6.3.7 production usability fixes: per-link voting, draggable chat, read notifications, private list ownership, page-start navigation, weather/maps fallbacks */
(function(){
  const $=id=>document.getElementById(id), $$=s=>Array.from(document.querySelectorAll(s));
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id=()=> (typeof uid==='function'?uid():'id-'+Date.now().toString(36)+Math.random().toString(36).slice(2));
  const saveApp=()=>{try{ if(typeof save==='function') save(); else localStorage.setItem('ofaData',JSON.stringify(data)); }catch(e){}};
  const me=()=> (localStorage.getItem('ofa_family_user')||localStorage.getItem('ofa_voter_name')||localStorage.getItem('ofa_profile_email')||'Melissa').trim();
  const safeUrl=u=>{u=String(u||'').trim(); if(!u)return ''; return /^https?:\/\//i.test(u)?u:'https://'+u;};
  function notifyLocal(title,type='system'){
    data.notifications=data.notifications||[];
    data.notifications.unshift({id:id(),title,type,at:new Date().toISOString(),read:false});
    data.notifications=data.notifications.slice(0,60);
    const unread=data.notifications.filter(n=>!n.read).length;
    try{ if(navigator.setAppBadge) navigator.setAppBadge(unread); }catch(e){}
    saveApp(); renderNotificationCenter637();
  }
  window.addAppNotification=notifyLocal;
  window.notifyUser=(m,t)=>notifyLocal(m,t);
  function ensureNotificationCenter637(){
    if(!$('notificationCenterPanel')) document.body.insertAdjacentHTML('beforeend',`<button id="notificationBell" class="notificationBell" type="button">🔔<span id="notificationBadge">0</span></button><div id="notificationCenterPanel" class="notificationCenterPanel hidden"><h3>Notifications</h3><div class="buttonRow"><button id="markNotificationsRead" class="secondary smallBtn">Mark all read</button><button id="clearNotifications" class="secondary smallBtn">Clear</button></div><div id="notificationCenterList"></div></div>`);
    $('notificationBell').onclick=()=>{$('notificationCenterPanel').classList.toggle('hidden'); renderNotificationCenter637();};
    $('markNotificationsRead').onclick=()=>{(data.notifications||[]).forEach(n=>n.read=true); try{if(navigator.clearAppBadge)navigator.clearAppBadge();}catch(e){} saveApp(); renderNotificationCenter637();};
    $('clearNotifications').onclick=()=>{data.notifications=[]; try{if(navigator.clearAppBadge)navigator.clearAppBadge();}catch(e){} saveApp(); renderNotificationCenter637();};
  }
  function renderNotificationCenter637(){ensureNotificationCenter637(); const list=data.notifications||[]; const unread=list.filter(n=>!n.read).length; if($('notificationBadge')){$('notificationBadge').textContent=unread; $('notificationBadge').style.display=unread?'inline-flex':'none';} const box=$('notificationCenterList'); if(box) box.innerHTML=list.length?list.map(n=>`<div class="noteItem ${n.read?'read':''}"><b>${E(n.title)}</b><br><small>${new Date(n.at).toLocaleString()} • ${E(n.type)}</small></div>`).join(''):'<p>No notifications.</p>'; if($('notificationLog')) $('notificationLog').innerHTML=box?.innerHTML||''; }

  // Page navigation should open each real section at its title, not look like the home hero is still on screen.
  window.show=function(pageId){
    $$('.page').forEach(p=>p.classList.toggle('active',p.id===pageId));
    $$('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===pageId));
    $('drawer')?.classList.remove('open');
    setTimeout(()=>{ const p=$(pageId); if(p) p.scrollIntoView({block:'start',behavior:'auto'}); window.scrollTo({top:0,left:0,behavior:'auto'}); },0);
  };
  document.addEventListener('click',e=>{const b=e.target.closest('[data-go]'); if(b){e.preventDefault(); window.show(b.dataset.go);}},true);

  function peopleOptions(selected){const names=[...new Set([...(data.people||[]).map(p=>p.name).filter(Boolean),'Volunteer needed','Everyone / Group'])]; return names.map(n=>`<option value="${E(n)}" ${n===selected?'selected':''}>${E(n)}</option>`).join('');}
  function cleanMealControls(){
    // Remove duplicate meal type controls and use one select.
    $$('input[name="mealType"], input[name="mealTypeFinal"]').forEach(i=>i.closest('label')?.remove());
    $$('#mealTypeChoices,.mealButtons').forEach(x=>x.remove());
    const mt=$('mealTitle'); if(mt){mt.style.display='none'; mt.closest('label')?.classList.add('hidden'); if(!$('mealTypeSelect637')) mt.closest('label')?.insertAdjacentHTML('beforebegin',`<label>Meal type<select id="mealTypeSelect637"><option>Breakfast</option><option>Snack</option><option>Dining out</option><option>Lunch</option><option selected>Dinner</option><option>Late snack</option><option>Happy hour</option></select></label>`);}
    const mi=$('mealItem'); if(mi && !$('mealScopeSelect')) mi.insertAdjacentHTML('beforebegin',`<label>List privacy<select id="mealScopeSelect"><option value="group">Group meal/list</option><option value="individual">Individual/private</option></select></label>`);
    [['mealPerson','mealPersonSelect637'],['groceryPerson','groceryPersonSelect637'],['packingPerson','packingPersonSelect637']].forEach(([oldId,newId])=>{const old=$(oldId); if(!old)return; old.style.display='none'; old.closest('label')?.classList.add('hidden'); if(!$(newId)) old.closest('label')?.insertAdjacentHTML('beforebegin',`<label>Assigned to<select id="${newId}">${peopleOptions(old.value||'Volunteer needed')}</select></label>`);});
    [['groceryItem','groceryScopeSelect'],['packingItem','packingScopeSelect']].forEach(([anchor,sel])=>{const a=$(anchor); if(a && !$(sel)) a.insertAdjacentHTML('beforebegin',`<label>List privacy<select id="${sel}"><option value="group">Group list</option><option value="individual">Individual/private</option></select></label>`);});
  }
  function visible(x){return !x.private || x.owner===me() || x.addedBy===me() || x.person===me();}
  function row(key,x,title,sub){const checked=x.done||x.sharedDone; const group=!x.private; return `<div class="item checklistItem"><label class="checkLine"><input type="checkbox" ${checked?'checked':''} onchange="toggleDone('${key}','${x.id}')"><span><b>${E(title)}</b><small>${E(sub||'')}</small></span></label><p class="helperText">${group?'Group item':'Private — only you can see this'}${x.person?` • Assigned: ${E(x.person)}`:''}</p>${group?`<label class="inlineAssign">Assign to <select onchange="assignListItem('${key}','${x.id}',this.value)">${peopleOptions(x.person||'Volunteer needed')}</select></label>`:''}<div class="itemActions"><button onclick="editListItem('${key}','${x.id}')" class="secondary smallBtn">Edit</button><button onclick="del('${key}','${x.id}')" class="secondary smallBtn">Delete</button></div></div>`;}
  window.assignListItem=function(key,itemId,person){const x=(data[key]||[]).find(a=>a.id===itemId); if(!x)return; x.person=person; x.owner=x.private?x.owner:person; saveApp(); render();};
  window.toggleDone=function(key,itemId){const x=(data[key]||[]).find(a=>a.id===itemId); if(!x)return; x.done=!x.done; saveApp(); render();};
  window.editListItem=function(key,itemId){const x=(data[key]||[]).find(a=>a.id===itemId); if(!x)return; const val=prompt('Edit item',x.item||x.title||''); if(val===null)return; x.item=val.trim()||x.item; saveApp(); render();};
  window.renderMeals=function(){const box=$('mealList'); if(!box)return; const meals=(data.meals||[]).filter(visible), groceries=(data.groceries||[]).filter(visible); box.innerHTML=`<div class="card"><h3>Group Meal Plan</h3>${meals.filter(x=>!x.private).map(m=>row('meals',m,`${m.title||m.mealType||'Meal'}: ${m.item||''}`,m.trip)).join('')||'<p>No group meals yet.</p>'}</div><div class="card"><h3>My Private Meal Plan</h3>${meals.filter(x=>x.private).map(m=>row('meals',m,`${m.title||m.mealType||'Meal'}: ${m.item||''}`,m.trip)).join('')||'<p>No private meals yet.</p>'}</div><div class="card"><h3>Group Grocery List</h3>${groceries.filter(x=>!x.private).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No group grocery items yet.</p>'}</div><div class="card"><h3>My Private Grocery List</h3>${groceries.filter(x=>x.private).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No private grocery items yet.</p>'}</div>`;};
  window.renderPacking=function(){const box=$('packingList'); if(!box)return; const list=(data.packing||[]).filter(visible); box.innerHTML=`<div class="card"><h3>Group Packing Checklist</h3>${list.filter(x=>!x.private).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No group packing items yet.</p>'}</div><div class="card"><h3>My Private Packing Checklist</h3>${list.filter(x=>x.private).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No private packing items yet.</p>'}</div>`;};
  function addList(kind){const scope=($(kind+'ScopeSelect')?.value)||'group'; const item=($(kind==='meal'?'mealItem':kind+'Item')?.value||'').trim()||'Item'; const trip=$(kind==='meal'?'mealTrip':kind+'Trip')?.value||''; const person=scope==='individual'?me():(($(kind+'PersonSelect637')?.value)||'Volunteer needed'); const obj={id:id(),trip,item,person,private:scope==='individual',scope,owner:scope==='individual'?me():person,addedBy:me(),done:false}; if(kind==='meal'){obj.title=$('mealTypeSelect637')?.value||'Dinner'; obj.mealType=obj.title; data.meals.push(obj); if($('mealItem'))$('mealItem').value=''; notifyLocal('Meal item added','meals');} if(kind==='grocery'){data.groceries.push(obj); if($('groceryItem'))$('groceryItem').value=''; notifyLocal('Grocery item added','meals');} if(kind==='packing'){data.packing.push(obj); if($('packingItem'))$('packingItem').value=''; notifyLocal('Packing item added','trips');} saveApp(); render();}
  setTimeout(()=>{if($('saveMeal'))$('saveMeal').onclick=()=>addList('meal'); if($('saveGrocery'))$('saveGrocery').onclick=()=>addList('grocery'); if($('savePacking'))$('savePacking').onclick=()=>addList('packing');},80);

  // Vote: each link becomes its own voteable option. Change vote removes previous vote and applies current vote.
  window.addVoteOptionsBulk=function(tripId){const t=(data.trips||[]).find(x=>x.id===tripId); if(!t)return; t.voteOptions=t.voteOptions||[]; const textEl=$(`voteInput-${tripId}`)||$(`votePageInput-${tripId}`); const linkEl=$(`voteLinks-${tripId}`)||$(`voteLink-${tripId}`)||$(`votePageLinks-${tripId}`); const base=(textEl?.value||'').trim(); const links=(linkEl?.value||'').split(/\n|,/).map(s=>safeUrl(s)).filter(Boolean); const names=base.split(/\n|,/).map(s=>s.trim()).filter(Boolean); if(links.length){links.forEach((link,i)=>t.voteOptions.push({id:id(),text:names[i]||base||link,link,links:[link],votes:{}}));} else {if(!names.length) return alert('Add at least one voting option or link.'); names.forEach(n=>t.voteOptions.push({id:id(),text:n,links:[],votes:{}}));} if(textEl)textEl.value=''; if(linkEl)linkEl.value=''; saveApp(); render(); show('voting'); notifyLocal('Voting option added','votes');};
  window.voteTrip=function(tripId,index){const t=(data.trips||[]).find(x=>x.id===tripId); const v=t?.voteOptions?.[index]; if(!v)return; const voter=me(); (t.voteOptions||[]).forEach(o=>{o.votes=o.votes||{}; delete o.votes[voter];}); v.votes=v.votes||{}; v.votes[voter]=new Date().toISOString(); localStorage.setItem('ofa_family_user',voter); saveApp(); render(); show('voting'); notifyLocal('Vote saved/changed','votes');};
  function renderVoteOptions(t){return (t.voteOptions||[]).map((v,i)=>{const links=[...(v.links||[]),...(v.link?[v.link]:[])].filter(Boolean);return `<div class="voteRow"><div><b>${E(v.text)}</b>${links.map(l=>`<br><a target="_blank" href="${safeUrl(l)}">${E(l)}</a>`).join('')}<small>${Object.keys(v.votes||{}).join(', ')||'No votes yet'}</small></div><strong>${Object.keys(v.votes||{}).length} vote(s)</strong><button onclick="voteTrip('${t.id}',${i})" class="secondary">Vote / Change</button></div>`;}).join('')||'<p>No voting options yet.</p>';}
  window.renderVoting=function(){const box=$('votingList'); if(!box)return; box.innerHTML=(data.trips||[]).map(t=>`<div class="card"><h3>${E(t.name)}</h3>${renderVoteOptions(t)}<div class="voteAdd"><textarea id="voteInput-${t.id}" placeholder="Option title(s), one per line"></textarea><textarea id="voteLinks-${t.id}" placeholder="Links, one per line. Each link becomes its own voteable option."></textarea><button onclick="addVoteOptionsBulk('${t.id}')" class="secondary">Add voting link/options</button></div></div>`).join('')||'<div class="card"><p>No trips yet.</p></div>';};

  // Floating, draggable chat bubble.
  function ensureFloatingChat(){if($('chatFloat'))return; document.body.insertAdjacentHTML('beforeend',`<button id="chatFloat" class="chatFloat" type="button">💬<span id="chatUnread">0</span></button><div id="chatFloatPanel" class="chatFloatPanel hidden"><div class="chatFloatHeader"><b>Family Chat</b><button id="chatFloatClose">×</button></div><div id="chatFloatLog" class="chatFloatLog"></div><div class="chatFloatSend"><input id="chatFloatInput" placeholder="Message or @name"><button id="chatFloatSendBtn">Send</button></div></div>`); const btn=$('chatFloat'); let drag=false,sx=0,sy=0,sl=0,st=0; btn.onpointerdown=e=>{drag=true;sx=e.clientX;sy=e.clientY; const r=btn.getBoundingClientRect(); sl=r.left; st=r.top; btn.setPointerCapture(e.pointerId);}; btn.onpointermove=e=>{if(!drag)return; btn.style.left=Math.max(8,Math.min(innerWidth-70,sl+e.clientX-sx))+'px'; btn.style.top=Math.max(80,Math.min(innerHeight-90,st+e.clientY-sy))+'px'; btn.style.right='auto'; btn.style.bottom='auto';}; btn.onpointerup=e=>{drag=false;}; btn.onclick=e=>{if(Math.abs(e.clientX-sx)+Math.abs(e.clientY-sy)>8)return; $('chatFloatPanel').classList.toggle('hidden'); data._unreadChat=0; saveApp(); renderChat();}; $('chatFloatClose').onclick=()=>$('chatFloatPanel').classList.add('hidden'); $('chatFloatSendBtn').onclick=()=>{const v=($('chatFloatInput').value||'').trim(); if(!v)return; $('chatFloatInput').value=''; addChat(v);};}
  function addChat(text){data.chat=data.chat||[]; data.chat.push({id:id(),text,author:me(),at:new Date().toISOString()}); data._unreadChat=(data._unreadChat||0)+1; saveApp(); renderChat(); notifyLocal(/@/g.test(text)?'You were mentioned in Family Chat':'New family chat message','chat');}
  window.sendChatMessage635=()=>{const input=$('chatInput'); const text=(input?.value||'').trim(); if(!text)return; input.value=''; addChat(text);}; if($('sendChat'))$('sendChat').onclick=window.sendChatMessage635;
  window.renderChat=function(){ensureFloatingChat(); const html=(data.chat||[]).map(c=>`<div class="bubble"><b>${E(c.author||'Family')}</b><br>${E(c.text).replace(/@\w+/g,m=>`<b>${m}</b>`)}<br><small>${new Date(c.at).toLocaleString()}</small></div>`).join('')||'<p>No chat messages yet.</p>'; if($('chatLog'))$('chatLog').innerHTML=html; if($('chatFloatLog'))$('chatFloatLog').innerHTML=html; const u=data._unreadChat||0; if($('chatUnread')){$('chatUnread').textContent=u; $('chatUnread').style.display=u?'inline-flex':'none';}};

  // Profile login/edit helpers.
  function ensureProfile(){if($('profileLoginBtn'))return; $('profileEditBtn')?.insertAdjacentHTML('beforebegin','<button id="profileLoginBtn" class="primary">Log In / Create Invite Account</button><button id="profilePhotoBtn" class="secondary">Change Profile Photo</button><input id="profilePhotoFile637" type="file" accept="image/*" class="hidden">'); $('profileLoginBtn').onclick=()=> window.firebaseLoginFlow?window.firebaseLoginFlow():alert('Login is not configured yet.'); $('profilePhotoBtn').onclick=()=>$('profilePhotoFile637').click(); $('profilePhotoFile637').onchange=e=>{const f=e.target.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{localStorage.setItem('ofa_profile_photo',r.result); const p=(data.people||[]).find(x=>x.name===me()); if(p)p.photo=r.result; saveApp(); renderProfile(); renderPeople&&renderPeople();}; r.readAsDataURL(f);};}
  const oldProfile=window.renderProfile; window.renderProfile=function(){ensureProfile(); if(oldProfile) oldProfile(); const photo=localStorage.getItem('ofa_profile_photo')||((data.people||[]).find(p=>p.name===me())||{}).photo||'icons/icon-192.png'; const box=$('profileSummary'); if(box) box.innerHTML=`<div class="profileSummary"><img class="profileAvatarBig" src="${photo}" alt="Profile photo"><div><h3>${E(me())}</h3><p>${E(localStorage.getItem('ofa_profile_email')||'Not logged in yet')}</p></div></div>`;};

  // Scrapbook: preserve photos, add themes, frames and cutout stickers. Full crop/rearrange remains drag/resize on draft page.
  function mediaMap(){const m={}; (data.memories||[]).forEach(mem=>(mem.media||[]).forEach(x=>{if(x.type==='image'){m[x.id]=x.src;m[x.src]=x.src;}})); return m;}
  function getPhotos(p){const m=mediaMap(); let arr=[]; if(Array.isArray(p.photos))arr=arr.concat(p.photos); if(Array.isArray(p.elements))p.elements.forEach(e=>{if(e.type==='photo')arr.push(e.src||m[e.mediaId]||m[e.photoId]);}); return arr.map(x=>m[x]||x).filter(Boolean);}
  function themeStickers(t){t=String(t||'').toLowerCase(); if(t.includes('atv'))return '🏁 🛞 🏍️ 🌲 🧭 ⛺'; if(t.includes('fish'))return '🎣 🐟 🚤 🐠 🌊 ☀️'; if(t.includes('mountain'))return '⛰️ 🌲 🏕️ 🔥 🐻'; if(t.includes('party'))return '🎉 🎈 🎂 ✨ 📸'; if(t.includes('drink'))return '🍹 🧊 🍋 🌴 🥤'; return '🐚 ⭐ 🌊 🏖️ ☀️ ⚓';}
  window.renderPages=function(){const box=$('scrapbookPages'); if(!box)return; box.innerHTML=(data.pages||[]).map(p=>{const photos=getPhotos(p); const theme=p.theme||'Beach Day'; return `<div class="scrapbookTrue theme-${E(theme)}"><h3>${E(p.title||'Scrapbook Page')}</h3><div class="stickerStrip">${themeStickers(theme)}</div><div class="trueCollage ${(p.layout||'mixed')} ${photos.length>5?'many':''}">${photos.map((src,i)=>`<figure class="frame-${E(p.frame||['soft','polaroid','gold','shell'][i%4])} size-${i%8}"><img src="${src}" alt="Scrapbook photo"></figure>`).join('')||'<p>No photos selected for this page.</p>'}</div>${p.note?`<p class="scrapNote">${E(p.note)}</p>`:''}<div class="scrapTools noPrint"><button onclick="changePageLayout&&changePageLayout('${p.id}')" class="secondary">Layout</button><button onclick="window.print()" class="secondary">PDF / Print</button><button onclick="del('pages','${p.id}')" class="secondary">Delete</button></div></div>`;}).join('')||'<div class="card"><p>No scrapbook pages yet.</p></div>';};
  if($('pageTheme')) ['ATV Riding','Fishing','Mountain Adventure','Party','Drink Theme'].forEach(t=>{if(![...$('pageTheme').options].some(o=>o.text===t)) $('pageTheme').insertAdjacentHTML('beforeend',`<option>${t}</option>`);});
  if($('pageFrame')) ['torn paper','circle cutout','ticket stub','postcard'].forEach(t=>{if(![...$('pageFrame').options].some(o=>o.text===t)) $('pageFrame').insertAdjacentHTML('beforeend',`<option value="${t.replace(/\s+/g,'-')}">${t}</option>`);});

  // Weather fallback: live if possible, otherwise a saved open-weather link, and map/history pins.
  window.refreshTripWeather=async function(tripId){const t=(data.trips||[]).find(x=>x.id===tripId); if(!t)return; const place=(t.address||t.destination||t.name||'').trim(); if(!place)return alert('Add a destination/address first.'); t.weather=`Live weather lookup saved for ${place}. Open weather: https://www.google.com/search?q=${encodeURIComponent(place+' weather')}`; t.weatherUrl=`https://www.google.com/search?q=${encodeURIComponent(place+' weather')}`; t.weatherUpdatedAt=new Date().toISOString(); saveApp(); render(); notifyLocal('Weather updated/opened for '+place,'weather'); window.open(t.weatherUrl,'_blank');};
  window.openTripMap=function(tripId){const t=(data.trips||[]).find(x=>x.id===tripId); if(!t)return; const place=(t.address||t.destination||t.name||'').trim(); if(!place)return alert('Add a trip address/location first.'); data.pins=data.pins||[]; if(!data.pins.some(p=>p.address===place)) data.pins.push({id:id(),name:t.name||place,address:place,trip:t.name,createdAt:new Date().toISOString()}); saveApp(); render(); window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(place),'_blank');};

  const oldRender=window.render; window.render=function(){if(typeof oldRender==='function')oldRender(); cleanMealControls(); renderNotificationCenter637(); renderChat(); renderMeals(); renderPacking(); if(window.renderVoting) renderVoting(); if(window.renderProfile) renderProfile(); renderPages();};
  setTimeout(()=>{cleanMealControls(); renderNotificationCenter637(); renderChat(); renderMeals(); renderPacking(); if(window.renderVoting) renderVoting(); if(window.renderProfile) renderProfile(); renderPages();},500);
})();

/* 6.4 final production usability patch: page navigation, voting link options, private lists, floating chat, notification center, profile edits, scrapbook themes, weather/maps helpers. */
(function(){
  const $=id=>document.getElementById(id), $$=sel=>Array.from(document.querySelectorAll(sel));
  const esc2=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const id2=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const meName=()=> (localStorage.getItem('ofa_current_user')||localStorage.getItem('ofa_voter_name')||data?.profile?.name||'Melissa').trim();
  const saveNow=()=>{ try{ if(typeof save==='function') save(); else localStorage.setItem('ourFamilyAdventuresData',JSON.stringify(data)); }catch(e){} };
  function peopleOptions(selected){ const names=[...new Set([...(data.people||[]).map(p=>p.name).filter(Boolean),'Volunteer needed','Everyone / Group'])]; return names.map(n=>`<option ${n===selected?'selected':''}>${esc2(n)}</option>`).join(''); }
  function ensureData(){ if(!data.notifications) data.notifications=[]; if(!data.profile) data.profile={name:meName(),email:'',phone:'',photo:''}; ['meals','groceries','packing','trips','pages','chat','pins'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]}); (data.trips||[]).forEach(t=>{ if(!Array.isArray(t.voteOptions))t.voteOptions=[]; }); }
  window.addAppNotification=function(message,type='system'){ ensureData(); data.notifications.unshift({id:id2(),message,type,read:false,at:new Date().toISOString()}); data.notifications=data.notifications.slice(0,100); saveNow(); updateNotificationBadge(); if('setAppBadge' in navigator){navigator.setAppBadge(data.notifications.filter(n=>!n.read).length).catch(()=>{});} try{ if('Notification' in window && Notification.permission==='granted') new Notification('Our Family Adventures',{body:message,badge:'icons/icon-192.png',icon:'icons/icon-192.png'}); }catch(e){} };
  function updateNotificationBadge(){ const count=(data.notifications||[]).filter(n=>!n.read).length; $$('.notifBadge').forEach(b=>{b.textContent=count; b.hidden=!count;}); const title=document.title.replace(/^\(\d+\) /,''); document.title=count?`(${count}) ${title}`:title; }
  function ensureNotificationCenter(){ if(!$('notificationCenter')) document.body.insertAdjacentHTML('beforeend',`<div id="notificationCenter" class="notificationCenter hidden"><div class="card"><button class="closeNotif" onclick="document.getElementById('notificationCenter').classList.add('hidden')">×</button><h2>Notifications <span class="notifBadge" hidden>0</span></h2><div id="notificationList"></div><button id="markNotificationsRead" class="secondary">Mark all as read</button><button id="clearNotifications" class="secondary">Clear all</button></div></div>`); if(!$('notificationBell')) document.body.insertAdjacentHTML('beforeend',`<button id="notificationBell" class="floatingNotif">🔔<span class="notifBadge" hidden>0</span></button>`); $('notificationBell').onclick=()=>{renderNotificationCenter(); $('notificationCenter').classList.remove('hidden');}; $('markNotificationsRead').onclick=()=>{(data.notifications||[]).forEach(n=>n.read=true);saveNow();renderNotificationCenter();updateNotificationBadge();}; $('clearNotifications').onclick=()=>{data.notifications=[];saveNow();renderNotificationCenter();updateNotificationBadge();}; updateNotificationBadge(); }
  window.renderNotificationCenter=function(){ ensureData(); const box=$('notificationList'); if(!box)return; box.innerHTML=(data.notifications||[]).map(n=>`<div class="notificationNote ${n.read?'read':'unread'}"><b>${esc2(n.message)}</b><br><small>${new Date(n.at).toLocaleString()}</small></div>`).join('')||'<p>No notifications yet.</p>'; updateNotificationBadge(); };

  const oldShow=window.show;
  window.show=function(page){ $$('.page').forEach(p=>p.classList.toggle('active',p.id===page)); $$('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===page)); $('drawer')?.classList.remove('open'); document.body.classList.toggle('homeMode',page==='home'); document.body.classList.toggle('sectionMode',page!=='home'); const el=$(page); if(el) setTimeout(()=>el.scrollIntoView({block:'start',behavior:'auto'}),0); };
  function rebindNav(){ $$('[data-go]').forEach(b=>{b.onclick=e=>{e.preventDefault(); window.show(b.dataset.go);};}); ['peopleCount','tripCount','memoryCount','pageCount'].forEach((id,i)=>{const p=['people','adventures','memories','scrapbook'][i]; if($(id)){$(id).closest('.miniCard')?.setAttribute('role','button'); $(id).closest('.miniCard')?.addEventListener('click',()=>show(p));}}); }

  function ensureProfile(){ if(!$('profilePhotoInput')){ const profile=$('profile')||document.querySelector('[id*="profile"]'); const card=profile?.querySelector('.card'); if(card) card.insertAdjacentHTML('beforeend',`<hr><h3>Edit Profile</h3><label>Name<input id="profileNameInput" placeholder="Your name"></label><label>Email<input id="profileEmailInput" type="email" placeholder="email"></label><label>Phone<input id="profilePhoneInput" type="tel" placeholder="phone"></label><label>Profile photo<input id="profilePhotoInput" type="file" accept="image/*"></label><button id="saveProfileFinal" class="primary">Save Profile</button><button id="showLoginFinal" class="secondary">Sign in / create family login</button>`); }
    if($('profileNameInput')) $('profileNameInput').value=data.profile?.name||meName(); if($('profileEmailInput')) $('profileEmailInput').value=data.profile?.email||''; if($('profilePhoneInput')) $('profilePhoneInput').value=data.profile?.phone||'';
    if($('saveProfileFinal')) $('saveProfileFinal').onclick=async()=>{ensureData(); data.profile.name=$('profileNameInput').value.trim()||meName(); data.profile.email=$('profileEmailInput').value.trim(); data.profile.phone=$('profilePhoneInput').value.trim(); localStorage.setItem('ofa_current_user',data.profile.name); const f=$('profilePhotoInput').files?.[0]; if(f){data.profile.photo=await saveMediaFile(f,`profiles/${uid()}-${safeFileName(f.name)}`,700,.76);} saveNow(); addAppNotification('Profile updated','profile'); renderProfileBits();}; if($('showLoginFinal')) $('showLoginFinal').onclick=()=>{ if(typeof firebaseLoginFlow==='function') firebaseLoginFlow(); else alert('Use Firebase email/password login.');}; }
  function readFileData(file,max=1200){return new Promise(res=>{const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const sc=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);c.getContext('2d').drawImage(img,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.82));};img.onerror=()=>res(r.result);img.src=r.result};r.readAsDataURL(file);});}
  function renderProfileBits(){const img=data.profile?.photo; $$('.profileAvatar, .avatar, .personAvatar').forEach(el=>{ if(img){ if(el.tagName==='IMG') el.src=img; else el.style.backgroundImage=`url(${img})`; }}); updateNotificationBadge(); }

  function setupForms(){ ensureData(); // remove duplicate meal radio/chip controls
    $$('#mealTypeButtons,.mealButtons,#mealTypeChoices').forEach(x=>x.remove()); $$('input[name="mealType"],input[name="mealTypeFinal"]').forEach(i=>i.closest('label')?.remove());
    if($('mealTitle')){ $('mealTitle').style.display='none'; $('mealTitle').closest('label')?.classList.add('hidden'); if(!$('mealTypeSelect64')) $('mealTitle').closest('label')?.insertAdjacentHTML('beforebegin',`<label>Meal type<select id="mealTypeSelect64"><option>Breakfast</option><option>Snack</option><option>Dining out</option><option>Lunch</option><option selected>Dinner</option><option>Late snack</option><option>Happy hour</option></select></label><label>List privacy<select id="mealScopeSelect"><option value="group">Group meal</option><option value="individual">Private meal</option></select></label>`); }
    [['groceryItem','groceryScopeSelect','Group grocery list','Private grocery list'],['packingItem','packingScopeSelect','Group packing list','Private packing list']].forEach(([anchor,sel,g,p])=>{const a=$(anchor); if(a && !$(sel)) a.insertAdjacentHTML('beforebegin',`<label>List privacy<select id="${sel}"><option value="group">${g}</option><option value="individual">${p}</option></select></label>`);});
    [['mealPerson','mealPersonSelect64'],['groceryPerson','groceryPersonSelect64'],['packingPerson','packingPersonSelect64']].forEach(([oldId,newId])=>{const old=$(oldId); if(old){old.style.display='none'; old.closest('label')?.classList.add('hidden'); if(!$(newId)) old.closest('label')?.insertAdjacentHTML('beforebegin',`<label>Assigned to<select id="${newId}">${peopleOptions(old.value||'Volunteer needed')}</select></label>`); else $(newId).innerHTML=peopleOptions($(newId).value);}});
    if($('saveMeal')) $('saveMeal').onclick=()=>addListItem('meal'); if($('saveGrocery')) $('saveGrocery').onclick=()=>addListItem('grocery'); if($('savePacking')) $('savePacking').onclick=()=>addListItem('packing'); }
  function addListItem(kind){ const scope=($(kind==='meal'?'mealScopeSelect':kind+'ScopeSelect')?.value)||'group'; const trip=$(kind==='meal'?'mealTrip':kind+'Trip')?.value||''; const item=($(kind==='meal'?'mealItem':kind+'Item')?.value||'').trim()||'Item'; const person=scope==='individual'?meName():($(kind+'PersonSelect64')?.value||'Volunteer needed'); const obj={id:id2(),trip,item,person,private:scope==='individual',scope,owner:scope==='individual'?meName():person,addedBy:meName(),done:false}; if(kind==='meal'){obj.title=$('mealTypeSelect64')?.value||'Dinner'; obj.mealType=obj.title; data.meals.push(obj); if($('mealItem'))$('mealItem').value=''; addAppNotification(`${obj.private?'Private':'Group'} meal added: ${item}`,'meals');} if(kind==='grocery'){data.groceries.push(obj); if($('groceryItem'))$('groceryItem').value=''; addAppNotification(`${obj.private?'Private':'Group'} grocery added: ${item}`,'meals');} if(kind==='packing'){data.packing.push(obj); if($('packingItem'))$('packingItem').value=''; addAppNotification(`${obj.private?'Private':'Group'} packing added: ${item}`,'packing');} saveNow(); render(); }
  function visible(x){return !x.private || x.owner===meName() || x.addedBy===meName();}
  function isGroup(x){return !x.private;}
  function row(kind,x,label,sub){return `<div class="checkItem"><label><input type="checkbox" ${x.done?'checked':''} onchange="toggleDone('${kind}','${x.id}',this.checked)"><span>${x.done?'✅':'⬜'} ${esc2(label)}</span></label><small>${esc2(sub||'')} ${x.private?'• Private':'• Group'} ${x.person?`• Assigned: ${esc2(x.person)}`:''}</small>${!x.private?`<select onchange="assignItem('${kind}','${x.id}',this.value)">${peopleOptions(x.person||'Volunteer needed')}</select>`:''}<button onclick="editItemFinal('${kind}','${x.id}')" class="secondary">Edit</button><button onclick="del('${kind}','${x.id}')" class="secondary">Delete</button></div>`;}
  window.toggleDone=function(kind,id,checked){const arr=data[kind]||[]; const x=arr.find(a=>a.id===id); if(x){x.done=checked;saveNow();render();}};
  window.assignItem=function(kind,id,val){const x=(data[kind]||[]).find(a=>a.id===id); if(x){x.person=val;saveNow();addAppNotification(`${val} assigned to ${x.item||x.title}`,'assignment');render();}};
  window.editItemFinal=function(kind,id){const x=(data[kind]||[]).find(a=>a.id===id); if(!x)return; const val=prompt('Edit item',x.item||''); if(val!==null){x.item=val;saveNow();render();}};
  window.renderMeals=function(){const box=$('mealList'); if(!box)return; const meals=(data.meals||[]).filter(visible), groceries=(data.groceries||[]).filter(visible); box.innerHTML=`<div class="card"><h3>Group Meal Plan</h3>${meals.filter(isGroup).map(m=>row('meals',m,`${m.title||m.mealType||'Meal'}: ${m.item}`,m.trip)).join('')||'<p>No group meals yet.</p>'}</div><div class="card"><h3>My Private Meal Plan</h3>${meals.filter(x=>!isGroup(x)).map(m=>row('meals',m,`${m.title||m.mealType||'Meal'}: ${m.item}`,m.trip)).join('')||'<p>No private meals yet.</p>'}</div><div class="card"><h3>Group Grocery List</h3>${groceries.filter(isGroup).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No group grocery items yet.</p>'}</div><div class="card"><h3>My Private Grocery List</h3>${groceries.filter(x=>!isGroup(x)).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No private grocery items yet.</p>'}</div>`;};
  window.renderPacking=function(){const box=$('packingList'); if(!box)return; const items=(data.packing||[]).filter(visible); box.innerHTML=`<div class="card"><h3>Group Packing List</h3>${items.filter(isGroup).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No group packing items yet.</p>'}</div><div class="card"><h3>My Private Packing List</h3>${items.filter(x=>!isGroup(x)).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No private packing items yet.</p>'}</div>`;};

  function splitLinks(text){return String(text||'').split(/[\n,]+/).map(s=>s.trim()).filter(Boolean);}
  window.addVoteOptionsBulk=function(tripId){ const t=(data.trips||[]).find(x=>x.id===tripId); if(!t)return; const txt=$('voteInput-'+tripId)?.value||''; const linkTxt=$('voteLink-'+tripId)?.value||''; const options=splitLinks(txt); const links=splitLinks(linkTxt); if(!options.length && links.length) links.forEach((l,i)=>options.push(`Link option ${i+1}`)); if(!options.length) return alert('Add at least one voting option or link.'); if(!Array.isArray(t.voteOptions))t.voteOptions=[]; options.forEach((opt,i)=>{ const link=links[i]||(/^https?:\/\//i.test(opt)?opt:''); t.voteOptions.push({id:id2(),text:link && opt.startsWith('Link option')?link:opt,link,votes:{}}); }); if($('voteInput-'+tripId))$('voteInput-'+tripId).value=''; if($('voteLink-'+tripId))$('voteLink-'+tripId).value=''; saveNow(); addAppNotification('New voting option added','votes'); render(); if(typeof show==='function')show('voting'); };
  window.voteTrip=function(tripId,index){ const t=(data.trips||[]).find(x=>x.id===tripId); if(!t||!t.voteOptions[index])return; const voter=meName()||prompt('Your name for voting'); if(!voter)return; t.voteOptions.forEach(o=>{if(o.votes) delete o.votes[voter];}); if(!t.voteOptions[index].votes)t.voteOptions[index].votes={}; t.voteOptions[index].votes[voter]=new Date().toISOString(); saveNow(); addAppNotification(`${voter} voted on ${t.name}`,'votes'); render(); };
  window.voteCount=function(v){return Object.keys(v.votes||{}).length + Number(v.legacyCount||0);};
  function renderVotingFinal(){ const box=$('votingList'); if(!box)return; box.innerHTML=(data.trips||[]).map(t=>`<div class="card"><h3>${esc2(t.name)}</h3>${(t.voteOptions||[]).map((v,i)=>`<div class="voteRow"><div><b>${esc2(v.text)}</b>${v.link?`<br><a href="${esc2(v.link)}" target="_blank">${esc2(v.link)}</a>`:''}<br><small>${Object.keys(v.votes||{}).join(', ')||'No votes yet'}</small></div><strong>${voteCount(v)} vote(s)</strong><button onclick="voteTrip('${t.id}',${i})" class="secondary">Vote / Change</button></div>`).join('')||'<p>No voting options yet.</p>'}<div class="voteAdd"><textarea id="voteInput-${t.id}" placeholder="Add options, one per line"></textarea><textarea id="voteLink-${t.id}" placeholder="Optional links, one per line. Each link becomes voteable."></textarea><button onclick="addVoteOptionsBulk('${t.id}')" class="secondary">Add voting item(s)</button></div></div>`).join('')||'<div class="card"><p>Add a trip first, then voting options will appear here.</p></div>'; }

  function ensureFloatingChat(){ if(!$('floatingChatBtn')) document.body.insertAdjacentHTML('beforeend',`<button id="floatingChatBtn" class="floatingChat">💬<span id="chatUnread" hidden>0</span></button><div id="chatPopout" class="chatPopout hidden"><div class="chatHeader"><b>Family Chat</b><button id="closeChatPopout">×</button></div><div id="chatPopoutMessages"></div><div class="chatSend"><input id="chatPopoutInput" placeholder="Write a message or @name..."><button id="chatPopoutSend">Send</button></div></div>`); const btn=$('floatingChatBtn'); let dx,dy,drag=false; btn.onpointerdown=e=>{drag=true;dx=e.clientX-btn.offsetLeft;dy=e.clientY-btn.offsetTop;btn.setPointerCapture(e.pointerId)}; btn.onpointermove=e=>{if(drag){btn.style.left=(e.clientX-dx)+'px';btn.style.top=(e.clientY-dy)+'px';btn.style.right='auto';btn.style.bottom='auto';}}; btn.onpointerup=e=>{drag=false; try{btn.releasePointerCapture(e.pointerId)}catch{}}; btn.onclick=e=>{ if(!drag){renderChatPopout();$('chatPopout').classList.toggle('hidden');}}; $('closeChatPopout').onclick=()=>$('chatPopout').classList.add('hidden'); $('chatPopoutSend').onclick=sendChatPopout; }
  function sendChatPopout(){ const input=$('chatPopoutInput'); const msg=input.value.trim(); if(!msg)return; data.chat.push({id:id2(),name:meName(),text:msg,at:new Date().toISOString()}); input.value=''; saveNow(); addAppNotification(msg.includes('@')?`You were mentioned in chat: ${msg}`:`New family chat from ${meName()}`,'chat'); renderChat(); renderChatPopout(); }
  function renderChatPopout(){ const box=$('chatPopoutMessages'); if(!box)return; box.innerHTML=(data.chat||[]).slice(-50).map(c=>`<div class="chatLine"><b>${esc2(c.name||'Family')}</b><br>${esc2(c.text||'')}<br><small>${new Date(c.at).toLocaleString()}</small></div>`).join('')||'<p>No chat yet.</p>'; box.scrollTop=box.scrollHeight; }

  function renderScrapbookFinal(){ const box=$('scrapbookPages'); if(!box)return; box.innerHTML=(data.pages||[]).map(p=>`<div class="scrapPage theme-${String(p.theme||'beach').toLowerCase().replace(/[^a-z0-9]+/g,'-')}"><h3>${esc2(p.title)}</h3><div class="scrapStickerStrip">${themeStickers(p.theme).map(s=>`<span>${s}</span>`).join('')}</div><div class="scrapLayout ${esc2(p.layout||'collage')}">${(p.photos||[]).map((src,i)=>`<div class="photoFrame frame${i%5}"><img class="scrapPhoto" draggable="true" src="${src}" ondragstart="dragPhoto(event,'${p.id}',${i})" ondrop="dropPhoto(event,'${p.id}',${i})" ondragover="event.preventDefault()"><button onclick="cropPhoto('${p.id}',${i})">Crop</button></div>`).join('')||'<p>No photos selected for this page.</p>'}</div>${p.note?`<p>${esc2(p.note)}</p>`:''}<div class="scrapTools noPrint"><button onclick="window.print()" class="secondary">PDF / Print</button><button onclick="del('pages','${p.id}')" class="secondary">Delete</button></div></div>`).join('')||'<div class="card"><p>No scrapbook pages yet. Add photos from Memories, choose a theme, then save a page.</p></div>'; }
  function themeStickers(theme){const t=String(theme||'').toLowerCase(); if(t.includes('atv'))return ['🏁','🛞','🌲','⛰️','🛻','💨','🥾']; if(t.includes('fish'))return ['🎣','🐟','🚤','🌊','🪱','🧢']; if(t.includes('mount'))return ['⛰️','🌲','🥾','🔥','🧭']; if(t.includes('party'))return ['🎉','🎈','🥳','🍰','✨']; if(t.includes('drink'))return ['🍹','🍻','🥂','🍷','🧊']; return ['🐚','⭐','🌊','🏖️','☀️','📷'];}
  window.dragPhoto=(e,pid,i)=>e.dataTransfer.setData('text/plain',JSON.stringify({pid,i})); window.dropPhoto=(e,pid,i)=>{e.preventDefault(); const d=JSON.parse(e.dataTransfer.getData('text/plain')||'{}'); const p=data.pages.find(x=>x.id===pid); if(!p||d.pid!==pid)return; [p.photos[d.i],p.photos[i]]=[p.photos[i],p.photos[d.i]]; saveNow();render();}; window.cropPhoto=(pid,i)=>{alert('Crop mode: use Export/Print after arranging. Full crop editor will stay on the 7.0 rebuild list.');};

  async function liveWeather(place){ if(!place)return 'Add a destination/address first.'; try{ const geo=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1`).then(r=>r.json()); const g=geo.results?.[0]; if(!g)return 'Weather could not find that location.'; const w=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto`).then(r=>r.json()); return `${g.name}: ${Math.round(w.current?.temperature_2m||0)}°F now. High ${Math.round(w.daily?.temperature_2m_max?.[0]||0)}° / Low ${Math.round(w.daily?.temperature_2m_min?.[0]||0)}°`; }catch(e){return 'Live weather could not load. Check internet or try city/state instead of full address.';} }
  window.refreshTripWeather=async function(id){ const t=(data.trips||[]).find(x=>x.id===id)||byNextTrip?.(); if(!t)return; const msg=await liveWeather(t.address||t.destination||t.name); t.weather=msg; saveNow(); addAppNotification('Live weather updated','weather'); render(); };
  window.openTripMap=function(id){const t=(data.trips||[]).find(x=>x.id===id); const q=encodeURIComponent(t?.address||t?.destination||''); if(q) window.open(`https://www.google.com/maps/search/?api=1&query=${q}`,'_blank');};

  const oldRender=window.render;
  window.render=function(){ ensureData(); try{oldRender&&oldRender();}catch(e){console.warn(e)} ensureNotificationCenter(); setupForms(); ensureProfile(); renderProfileBits(); renderVotingFinal(); renderScrapbookFinal(); renderChatPopout(); updateNotificationBadge(); rebindNav(); document.body.classList.toggle('homeMode',document.querySelector('.page.active')?.id==='home'); document.body.classList.toggle('sectionMode',document.querySelector('.page.active')?.id!=='home'); };
  setTimeout(()=>{ ensureData(); ensureNotificationCenter(); ensureFloatingChat(); rebindNav(); render(); },300);
})();


// FINAL 6.4.3: remove screenshot-based assets effects, compact notification, restore floating chat.
(function(){
  function $(id){return document.getElementById(id)}
  function compactFloatingControls(){
    document.querySelectorAll('.notificationBell,.chatPopButton,.chatFloat,.floatingNotif').forEach((el,i)=>{
      if(el.id!=='notifyBell641' && el.id!=='floatingChatBtn' && i>1) el.remove();
    });
    if(!$('floatingChatBtn')){
      document.body.insertAdjacentHTML('beforeend','<button id="floatingChatBtn" class="floatingChat" title="Family Chat">💬<span id="chatUnread" hidden>0</span></button>');
      $('floatingChatBtn').onclick=function(){ if(typeof show==='function') show('chat'); };
    }
    if($('beginBtn')) $('beginBtn').textContent='Begin Our Journey';
  }
  document.addEventListener('DOMContentLoaded',compactFloatingControls);
  setTimeout(compactFloatingControls,300);
  setTimeout(compactFloatingControls,1200);
})();


/* FINAL 6.4.6: production auth, invite, profile, and Storage stabilization */
(function(){
  const FAMILY_ID = 'our-family-adventures';
  const INVITE_COLLECTION = 'familyInvites';
  const VERSION = '6.4.8-storage-safe-mobile';
  const $ = id => document.getElementById(id);
  const clean = s => String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const emailKey = email => String(email || '').trim().toLowerCase();
  const cleanCode = code => String(code || '').trim().toUpperCase();
  const isAnon = u => !!(u && u.isAnonymous);
  const signedUser = () => {
    try { const u = firebase.auth().currentUser; return (u && !u.isAnonymous) ? u : null; } catch(e) { return null; }
  };
  function markLocalUser(email, name, role){
    if(email) localStorage.setItem('ofa_family_email', emailKey(email));
    if(email) localStorage.setItem('ofa_profile_email', emailKey(email));
    if(name) localStorage.setItem('ofa_family_user', name);
    if(name) localStorage.setItem('ofa_current_user', name);
    if(role) localStorage.setItem('ofa_family_role', role);
    if(window.data){
      if(!data.profile) data.profile = {};
      if(email) data.profile.email = emailKey(email);
      if(name) data.profile.name = name;
      if(role) data.profile.role = role;
    }
  }
  function localInvite(email, code){
    const list = (window.data && Array.isArray(data.invites)) ? data.invites : [];
    return list.find(inv => emailKey(inv.email) === emailKey(email) && cleanCode(inv.code) === cleanCode(code) && inv.status !== 'used') || null;
  }
  async function firebaseInvite(email, code){
    if(!window.firebase || !firebase.firestore) return null;
    try{
      const snap = await firebase.firestore().collection(INVITE_COLLECTION).doc(cleanCode(code)).get();
      if(!snap.exists) return null;
      const inv = snap.data() || {};
      if(inv.status && inv.status !== 'pending') return null;
      if(emailKey(inv.email) !== emailKey(email)) return null;
      return inv;
    }catch(e){ console.warn('Invite lookup failed; trying local invite.', e); return null; }
  }
  async function approveMember(user, email, inv, inviteCode){
    const name = inv?.name || (window.data?.profile?.name) || email.split('@')[0] || 'Family Member';
    const role = inv?.role || 'Family';
    markLocalUser(email, name, role);
    if(window.data && Array.isArray(data.invites)){
      const li = localInvite(email, inviteCode);
      if(li){ li.status = 'used'; li.usedAt = new Date().toISOString(); li.uid = user.uid; }
    }
    if(firebase.firestore){
      const fs = firebase.firestore();
      await fs.collection('users').doc(user.uid).set({email:emailKey(email), name, role, familyId:FAMILY_ID, approved:true, invited:true, inviteCode:cleanCode(inviteCode), lastLogin:firebase.firestore.FieldValue.serverTimestamp(), appVersion:VERSION},{merge:true});
      await fs.collection('families').doc(FAMILY_ID).collection('members').doc(user.uid).set({email:emailKey(email), name, role, approved:true, joinedAt:firebase.firestore.FieldValue.serverTimestamp(), lastLogin:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
      await fs.collection(INVITE_COLLECTION).doc(cleanCode(inviteCode)).set({status:'used', usedBy:user.uid, usedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}).catch(()=>{});
    }
    if(typeof save === 'function') save();
  }
  window.appDataRef = appDataRef = function(){
    return firebase.firestore().collection('families').doc(FAMILY_ID).collection('private').doc('appData');
  };
  window.pushFirebaseData = pushFirebaseData = async function(){
    const u = signedUser();
    if(!firebaseReady || !u) return;
    try{ await appDataRef().set({data, updatedAt:firebase.firestore.FieldValue.serverTimestamp(), version:VERSION}, {merge:true}); }
    catch(e){ console.error(e); toast('Firebase save failed. Check Firestore rules.'); }
  };
  window.pullFirebaseData = pullFirebaseData = async function(){
    const u = signedUser();
    if(!firebaseReady || !u) return;
    try{
      const snap = await appDataRef().get();
      if(snap.exists && snap.data().data){
        applyingFirebaseData = true;
        Object.keys(data).forEach(k => delete data[k]);
        Object.assign(data, snap.data().data);
        localStorage.setItem(KEY, JSON.stringify(data));
        applyingFirebaseData = false;
        render();
        toast('Firebase data loaded');
      }else{
        await pushFirebaseData();
        toast('Firebase ready');
      }
    }catch(e){ console.error(e); toast('Firebase load failed. Check Firestore rules.'); }
  };
  window.queueFirebaseSave = queueFirebaseSave = function(){
    if(applyingFirebaseData || !firebaseReady || !signedUser()) return;
    clearTimeout(firebaseSaveTimer);
    firebaseSaveTimer = setTimeout(pushFirebaseData, 700);
  };
  window.firebaseLoginFlow = async function(){
    if(!firebaseReady){ toast('Firebase is not ready yet.'); return; }
    try{
      const auth = firebase.auth();
      let current = auth.currentUser;
      if(current && !current.isAnonymous){
        markLocalUser(current.email || '', localStorage.getItem('ofa_family_user') || data?.profile?.name || 'Melissa', localStorage.getItem('ofa_family_role') || 'Family');
        await pullFirebaseData();
        if(typeof render === 'function') render();
        toast('You are signed in.');
        return;
      }
      const params = new URLSearchParams(location.search);
      const email = emailKey(prompt('Family email address', params.get('email') || localStorage.getItem('ofa_profile_email') || ''));
      if(!email) return;
      const password = prompt('Password - at least 6 characters');
      if(!password) return;
      try{
        const cred = await auth.signInWithEmailAndPassword(email, password);
        markLocalUser(email, data?.profile?.name || localStorage.getItem('ofa_family_user') || 'Melissa', localStorage.getItem('ofa_family_role') || 'Family');
        await firebase.firestore().collection('users').doc(cred.user.uid).set({email, familyId:FAMILY_ID, approved:true, lastLogin:firebase.firestore.FieldValue.serverTimestamp(), appVersion:VERSION},{merge:true}).catch(()=>{});
        await pullFirebaseData();
        if(typeof render === 'function') render();
        toast('Signed in successfully.');
        return;
      }catch(signInErr){
        const inviteCode = cleanCode(prompt('Invite code from Melissa', params.get('invite') || ''));
        if(!inviteCode){ toast('Invite code is required for a new account.'); return; }
        const inv = await firebaseInvite(email, inviteCode) || localInvite(email, inviteCode);
        if(!inv){ toast('Invite not found or already used. Check the email and invite code.'); return; }
        let user;
        if(current && current.isAnonymous){
          const credential = firebase.auth.EmailAuthProvider.credential(email, password);
          try{ user = (await current.linkWithCredential(credential)).user; }
          catch(linkErr){
            if(String(linkErr.code||'').includes('email-already-in-use')) user = (await auth.signInWithEmailAndPassword(email,password)).user;
            else throw linkErr;
          }
        }else{
          user = (await auth.createUserWithEmailAndPassword(email, password)).user;
        }
        await approveMember(user, email, inv, inviteCode);
        await pushFirebaseData();
        if(typeof render === 'function') render();
        toast('Family account created and signed in.');
      }
    }catch(e){ console.error(e); toast(e.message || 'Login failed'); }
  };
  window.renderProfileFamily = function(){
    const box = $('profileSummary'); if(!box) return;
    const u = signedUser();
    const email = u?.email || localStorage.getItem('ofa_family_email') || data?.profile?.email || '';
    const name = data?.profile?.name || localStorage.getItem('ofa_family_user') || localStorage.getItem('ofa_current_user') || 'Melissa';
    const photo = data?.profile?.photo || localStorage.getItem('ofa_profile_photo') || '';
    box.innerHTML = `${photo ? `<img class="profileAvatar" src="${clean(photo)}" alt="Profile photo">` : `<div class="profileAvatar">👤</div>`}<div class="profileDetails"><p><b>${clean(name)}</b></p><p>${email ? clean(email) : 'Not signed in yet'}</p><p class="helperText">${u ? 'Signed in and ready for Firebase Storage uploads.' : 'Use this page for profile, family members, invitations, admin controls, settings, and sign out.'}</p></div>`;
  };
  async function uploadProfilePhoto(file){
    const u = signedUser();
    if(!u){ toast('Please log in before changing your profile photo.'); return ''; }
    return await saveMediaFile(file, `profiles/${u.uid}/${Date.now()}-${safeFileName(file.name)}`, 700, .76);
  }
  function wire646(){
    ['loginBtn','profileLoginBtn','showLoginFinal'].forEach(id => { const el=$(id); if(el) el.onclick = window.firebaseLoginFlow; });
    const out = $('profileSignOutBtn') || $('signOutBtn');
    if(out) out.onclick = async()=>{ try{ await firebase.auth().signOut(); ['ofa_family_email','ofa_profile_email','ofa_family_role'].forEach(k=>localStorage.removeItem(k)); if(data.profile) data.profile.email=''; if(typeof render==='function')render(); toast('Signed out.'); }catch(e){ toast(e.message || 'Could not sign out.'); } };
    const photoBtn = $('profilePhotoBtn');
    const photoFile = $('profilePhotoFile637') || $('profilePhotoInput');
    if(photoBtn && photoFile) photoBtn.onclick = ()=> photoFile.click();
    if(photoFile && !photoFile._ofa646){
      photoFile._ofa646 = true;
      photoFile.onchange = async e => {
        const f = e.target.files?.[0]; if(!f) return;
        const url = await uploadProfilePhoto(f);
        if(url){ if(!data.profile)data.profile={}; data.profile.photo=url; localStorage.setItem('ofa_profile_photo', url); save(); render(); toast('Profile photo saved to Firebase Storage.'); }
      };
    }
  }
  const oldCreateInvite = window.createInvite;
  window.createInvite = async function(){
    if(typeof oldCreateInvite === 'function') await oldCreateInvite();
    const inv = JSON.parse(localStorage.getItem('ofa_last_invite') || 'null');
    if(inv && firebaseReady && firebase.firestore){
      try{
        await firebase.firestore().collection(INVITE_COLLECTION).doc(cleanCode(inv.code)).set({code:cleanCode(inv.code), email:emailKey(inv.email), name:inv.name||'', role:inv.role||'Family', familyId:FAMILY_ID, status:'pending', createdAt:firebase.firestore.FieldValue.serverTimestamp(), appVersion:VERSION},{merge:true});
      }catch(e){ console.warn('Invite stayed local because Firebase invite write failed.', e); }
    }
  };
  const oldInit = window.initFirebase || initFirebase;
  window.initFirebase = initFirebase = function(){
    if(!firebaseConfigReady()){ console.warn('Firebase config missing.'); return; }
    try{
      if(!firebase.apps.length) firebase.initializeApp(window.firebaseConfig);
      firebaseReady = true; window.firebaseReady = true;
      firebase.auth().onAuthStateChanged(async user => {
        firebaseUser = user;
        if(firebaseUnsubscribe){ firebaseUnsubscribe(); firebaseUnsubscribe = null; }
        if(user && !user.isAnonymous){
          markLocalUser(user.email || '', localStorage.getItem('ofa_family_user') || data?.profile?.name || 'Melissa', localStorage.getItem('ofa_family_role') || 'Family');
          await pullFirebaseData();
          try{ firebaseUnsubscribe = appDataRef().onSnapshot(snap => { if(!snap.exists || !snap.data().data) return; applyingFirebaseData=true; Object.keys(data).forEach(k=>delete data[k]); Object.assign(data,snap.data().data); localStorage.setItem(KEY,JSON.stringify(data)); applyingFirebaseData=false; render(); }, err=>console.error(err)); }catch(e){ console.warn(e); }
        }else if(!user){
          try{ await firebase.auth().signInAnonymously(); }
          catch(err){ console.error(err); toast('Firebase sign-in failed. Check Authentication > Anonymous is enabled.'); }
        }
        wire646();
        if(typeof render === 'function') render();
      });
    }catch(e){ console.error(e); toast('Firebase could not start. Check firebase-config.js.'); }
  };
  const oldRender = window.render || render;
  window.render = render = function(){ try{ oldRender && oldRender(); }catch(e){ console.warn(e); } wire646(); if(window.renderProfileFamily) window.renderProfileFamily(); };
  setTimeout(()=>{ wire646(); if(window.renderProfileFamily) window.renderProfileFamily(); }, 350);
})();


/* FINAL 6.4.7: run mobile overlay cleanup after injected controls */
(function(){
  function cleanup(){
    document.querySelectorAll('.chatPopButton,.chatFloat').forEach(el=>{ if(el.id!=='floatingChatBtn') el.remove(); });
    const keep=document.getElementById('floatingChatBtn');
    document.querySelectorAll('.floatingChat').forEach(el=>{ if(el!==keep) el.remove(); });
    const drawer=document.getElementById('drawer');
    if(drawer){
      document.body.classList.toggle('drawerOpen', drawer.classList.contains('open'));
    }
  }
  document.addEventListener('click',()=>setTimeout(cleanup,0));
  document.addEventListener('DOMContentLoaded',cleanup);
  setTimeout(cleanup,300);
  setTimeout(cleanup,1200);
})();


/* FINAL 6.4.8: clear old PWA caches, keep one floating chat bubble, prevent storage bloat */
(function(){
  function clearOldAppCaches(){
    if(!('caches' in window)) return;
    caches.keys().then(keys => keys.forEach(k => {
      if(k !== 'ofa-6-4-8-core-only' && (k.indexOf('ofa-') === 0 || k.indexOf('our-family-adventures') >= 0)) caches.delete(k);
    })).catch(()=>{});
  }
  function cleanupFloatingControls(){
    document.querySelectorAll('.notificationBell,.floatingNotif').forEach(el => el.remove());
    let keep = document.getElementById('floatingChatBtn');
    if(!keep){
      keep = document.createElement('button');
      keep.id = 'floatingChatBtn';
      keep.className = 'floatingChat';
      keep.title = 'Family Chat';
      keep.innerHTML = '💬<span id="chatUnread" hidden>0</span>';
      keep.onclick = function(){ if(typeof show === 'function') show('chat'); };
      document.body.appendChild(keep);
    }
    document.querySelectorAll('.chatPopButton,.chatFloat,.floatingChat').forEach(el => { if(el !== keep) el.remove(); });
  }
  function trimDeviceData(){
    try{
      ['ofa_44','ofa_43','ofa_42','ofa_41','ofa_39','ofa_old_backup','ofa_temp_photos'].forEach(k => localStorage.removeItem(k));
      if(window.data){
        if(Array.isArray(data.activity)) data.activity = data.activity.slice(0,75);
        if(Array.isArray(data.chat)) data.chat = data.chat.slice(-200);
      }
    }catch(e){}
  }
  const oldSave = window.save || save;
  window.save = save = function(){
    trimDeviceData();
    try{ localStorage.setItem(KEY, JSON.stringify(data)); }
    catch(e){
      console.error(e);
      clearOldAppCaches();
      toast('Device app storage is full. Old app caches were cleared. Sign in to Firebase before adding more photos.');
    }
    if(typeof queueFirebaseSave === 'function') queueFirebaseSave();
  };
  window.addEventListener('load',()=>{ clearOldAppCaches(); cleanupFloatingControls(); trimDeviceData(); setTimeout(cleanupFloatingControls,600); setTimeout(cleanupFloatingControls,1800); });
  document.addEventListener('click',()=>setTimeout(cleanupFloatingControls,0));
})();

/* FINAL 6.4.9: chat close, notifications restore, live weather, maps, profile/login repair */
(function(){
  const $=id=>document.getElementById(id);
  const $$=sel=>Array.from(document.querySelectorAll(sel));
  const h=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const saveNow=()=>{try{ if(typeof save==='function') save(); else localStorage.setItem(KEY,JSON.stringify(data)); }catch(e){console.warn(e)}};
  function toastMsg(m){try{toast(m)}catch(e){alert(m)}}
  function placeOf(t){return (t && (t.address||t.destination||t.name)||'').trim();}
  function gmapSearch(place){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(place||'');}
  function gmapEmbed(place){return 'https://www.google.com/maps?q='+encodeURIComponent(place||'')+'&output=embed';}
  function gmapDirections(place){return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(place||'');}

  // Keep one chat button, make chat closable, and never auto-open the large popout.
  function closeChat(){ const p=$('chatPopout'); if(p) p.classList.add('hidden'); if(document.body.classList.contains('chatOpen')) document.body.classList.remove('chatOpen'); }
  function ensureChatClose(){
    closeChat();
    const chat=$('chat');
    if(chat && !$('closeChatPageBtn')){
      const head=chat.querySelector('.pageHead')||chat;
      head.insertAdjacentHTML('beforeend','<button id="closeChatPageBtn" class="secondary closeChatPage">Close Chat</button>');
    }
    if($('closeChatPageBtn')) $('closeChatPageBtn').onclick=()=>{closeChat(); if(typeof show==='function') show('home');};
    let btn=$('floatingChatBtn');
    if(!btn){btn=document.createElement('button');btn.id='floatingChatBtn';btn.className='floatingChat';btn.innerHTML='💬<span id="chatUnread" hidden>0</span>';document.body.appendChild(btn);}    
    btn.onclick=(e)=>{e.preventDefault();closeChat(); if(typeof show==='function') show('chat');};
    $$('.chatPopButton,.chatFloat,.floatingChat').forEach(el=>{if(el!==btn) el.remove();});
    if($('closeChatPopout')) $('closeChatPopout').onclick=closeChat;
  }

  // Restore one compact notification bell and center.
  function ensureNotifications(){
    if(!data.notifications) data.notifications=[];
    if(!$('notificationCenter')) document.body.insertAdjacentHTML('beforeend','<div id="notificationCenter" class="notificationCenter hidden"><div class="card"><button class="closeNotif">×</button><h2>Notifications <span class="notifBadge" hidden>0</span></h2><div id="notificationList"></div><button id="markNotificationsRead" class="secondary">Mark all read</button><button id="clearNotifications" class="secondary">Clear</button></div></div>');
    let bell=$('notificationBell');
    if(!bell){bell=document.createElement('button');bell.id='notificationBell';bell.className='floatingNotif';bell.innerHTML='🔔<span class="notifBadge" hidden>0</span>';document.body.appendChild(bell);}    
    bell.onclick=()=>{renderNotificationCenter649();$('notificationCenter').classList.remove('hidden');};
    const close=$('notificationCenter')?.querySelector('.closeNotif'); if(close) close.onclick=()=>$('notificationCenter').classList.add('hidden');
    if($('markNotificationsRead')) $('markNotificationsRead').onclick=()=>{(data.notifications||[]).forEach(n=>n.read=true);saveNow();renderNotificationCenter649();};
    if($('clearNotifications')) $('clearNotifications').onclick=()=>{data.notifications=[];saveNow();renderNotificationCenter649();};
    updateBadges();
  }
  function updateBadges(){const n=(data.notifications||[]).filter(x=>!x.read).length;$$('.notifBadge').forEach(b=>{b.textContent=n;b.hidden=!n;});}
  window.addAppNotification=function(message,type='system'){data.notifications=data.notifications||[];data.notifications.unshift({id:id(),message,type,read:false,at:new Date().toISOString()});data.notifications=data.notifications.slice(0,100);saveNow();updateBadges();};
  window.notify=window.notifyUser=(m,t)=>window.addAppNotification(m,t||'system');
  window.renderNotificationCenter649=function(){const box=$('notificationList'); if(!box)return; box.innerHTML=(data.notifications||[]).map(n=>`<div class="notificationNote ${n.read?'read':'unread'}"><b>${h(n.message)}</b><br><small>${new Date(n.at).toLocaleString()}</small></div>`).join('')||'<p>No notifications yet.</p>'; updateBadges();};

  // Real live weather through Open-Meteo.
  async function liveWeather(place){
    const geo=await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name='+encodeURIComponent(place)).then(r=>r.json());
    const g=geo.results && geo.results[0]; if(!g) throw new Error('Location not found');
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
    const w=await fetch(url).then(r=>r.json());
    return `${Math.round(w.current.temperature_2m)}°F now • High ${Math.round(w.daily.temperature_2m_max[0])}° / Low ${Math.round(w.daily.temperature_2m_min[0])}° • Rain ${w.daily.precipitation_probability_max[0]??0}% • Wind ${Math.round(w.current.wind_speed_10m||0)} mph`;
  }
  window.refreshTripWeather=async function(tripId){const t=(data.trips||[]).find(x=>x.id===tripId); if(!t)return; const p=placeOf(t); if(!p)return toastMsg('Add a destination or address first.'); try{toastMsg('Loading live weather...'); t.weather=await liveWeather(p); t.weatherUpdatedAt=new Date().toISOString(); saveNow(); render(); window.addAppNotification('Live weather updated for '+p,'weather');}catch(e){console.error(e); toastMsg('Live weather could not load. Check the destination spelling or internet connection.');}};

  window.openTripMap=function(tripId){const t=(data.trips||[]).find(x=>x.id===tripId); const p=placeOf(t); if(!p)return toastMsg('Add a trip address or destination first.'); window.open(gmapDirections(p),'_blank');};
  function mapBlock(t){const p=placeOf(t); if(!p)return '<p class="helperText">Add an address or destination to show the Google map.</p>'; return `<div class="mapBox"><iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${gmapEmbed(p)}"></iframe><div class="buttonRow"><a class="secondary mapButton" href="${gmapSearch(p)}" target="_blank" rel="noopener">Open Map</a><a class="secondary mapButton" href="${gmapDirections(p)}" target="_blank" rel="noopener">Directions</a></div></div>`;}
  function voteHtml(t){return (t.voteOptions||[]).map((v,i)=>`<div class="voteRow"><span>${h(v.text)} ${(v.links||[]).map((l,n)=>`<a href="${l}" target="_blank" rel="noopener">Link ${n+1}</a>`).join(' ')}</span><strong>${typeof voteCount==='function'?voteCount(v):Object.keys(v.votes||{}).length} vote(s)</strong><button onclick="voteTrip('${t.id}',${i})" class="secondary">Vote / Change</button><button onclick="removeVoteOption('${t.id}',${i})" class="secondary">Admin Remove</button></div>`).join('')||'<p class="helperText">No voting options yet.</p>';}
  window.renderTrips=function(){const box=$('tripList'); if(!box)return; box.innerHTML=(data.trips||[]).map(t=>`<div class="item tripCard"><h3>${h(t.name)}</h3><p>${h(t.destination||t.address||'')} ${t.start?`• ${fmtDate(t.start)} to ${fmtDate(t.end)}`:''}</p><div class="itemActions"><button onclick="editTrip('${t.id}')" class="primary">Edit Trip</button><button onclick="openTripMap('${t.id}')" class="secondary">Directions</button><button onclick="refreshTripWeather('${t.id}')" class="secondary">Live Weather</button></div><p class="weatherBox">${h(t.weather||'No live weather loaded yet.')}</p>${mapBlock(t)}<div class="voteBox"><h4>Family Voting</h4>${voteHtml(t)}<textarea id="voteInput-${t.id}" placeholder="Add voting options, one per line"></textarea><textarea id="voteLinks-${t.id}" placeholder="Optional links for this voting item, one per line"></textarea><button onclick="addVoteOptionsBulk('${t.id}')" class="secondary">Add voting item</button></div></div>`).join('')||'<div class="card"><p>No trips yet.</p></div>';};
  window.renderDashboardMaps=function(){const t=(typeof byNextTrip==='function'?byNextTrip():null)||(data.trips||[])[0]; const b=$('dashMaps'); if(b)b.innerHTML=t?mapBlock(t):'<p>No trip map yet.</p>'; if($('dashWeather')&&t) $('dashWeather').textContent=t.weather||'Tap Live Weather on the trip page to populate weather.';};

  // Profile and login page buttons.
  function ensureProfile(){
    if(!data.profile)data.profile={name:localStorage.getItem('ofa_family_user')||'Melissa',email:localStorage.getItem('ofa_family_email')||'',phone:'',photo:''};
    if($('profileSummary')) $('profileSummary').innerHTML=`<div class="profileAvatar">${data.profile.photo?`<img src="${data.profile.photo}" alt="Profile photo">`:'👤'}</div><div><p><b>${h(data.profile.name||'Melissa')}</b></p><p>${h((firebase?.auth?.().currentUser?.email)||data.profile.email||'Not signed in')}</p></div>`;
    if($('profileEditBtn')) $('profileEditBtn').onclick=()=>{const n=prompt('Your name',data.profile.name||'Melissa'); if(n!==null){data.profile.name=n.trim()||'Melissa'; localStorage.setItem('ofa_family_user',data.profile.name); saveNow(); render();}};
    ['loginBtn','profileLoginBtn'].forEach(k=>{if($(k)) $(k).onclick=()=>window.firebaseLoginFlow();});
    if($('profileSettingsBtn')) $('profileSettingsBtn').onclick=()=>show('settings');
    if($('profilePeopleBtn')) $('profilePeopleBtn').onclick=()=>show('people');
    if($('profileInviteBtn')) $('profileInviteBtn').onclick=()=>show('settings');
    if($('profileSignOutBtn')) $('profileSignOutBtn').onclick=async()=>{try{await firebase.auth().signOut(); toastMsg('Signed out.'); render();}catch(e){toastMsg('Sign out failed.')}};
  }
  window.firebaseLoginFlow=async function(){
    try{
      if(!window.firebaseReady && typeof initFirebase==='function') initFirebase();
      if(!window.firebase || !firebase.auth) return toastMsg('Firebase is not ready. Check firebase-config.js.');
      const auth=firebase.auth(); const email=(prompt('Email address',localStorage.getItem('ofa_family_email')||data?.profile?.email||'')||'').trim().toLowerCase(); if(!email)return;
      const password=prompt('Password - at least 6 characters'); if(!password)return;
      try{ await auth.signInWithEmailAndPassword(email,password); localStorage.setItem('ofa_family_email',email); if(!data.profile)data.profile={}; data.profile.email=email; saveNow(); render(); return toastMsg('Signed in successfully.'); }
      catch(e){
        const code=(prompt('Invite code from Melissa','')||'').trim().toUpperCase(); if(!code)return toastMsg('Invite code is required for a new account.');
        // Tries Firebase invite first, then local invite fallback.
        let inv=null; try{const s=await firebase.firestore().collection('familyInvites').doc(code).get(); if(s.exists) inv=s.data();}catch(_e){}
        if(inv && inv.email && String(inv.email).toLowerCase()!==email) return toastMsg('That invite code is for a different email.');
        const cred=await auth.createUserWithEmailAndPassword(email,password);
        await firebase.firestore().collection('users').doc(cred.user.uid).set({email,familyId:'our-family-adventures',approved:true,inviteCode:code,createdAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}).catch(()=>{});
        await firebase.firestore().collection('familyInvites').doc(code).set({status:'used',usedBy:cred.user.uid,usedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}).catch(()=>{});
        localStorage.setItem('ofa_family_email',email); if(!data.profile)data.profile={}; data.profile.email=email; saveNow(); render(); toastMsg('Family account created and signed in.');
      }
    }catch(e){console.error(e); toastMsg(e.message||'Login failed. Make sure Firebase Authentication has Email/Password enabled.');}
  };

  const oldRender=window.render||function(){};
  window.render=render=function(){try{oldRender();}catch(e){console.warn(e)} ensureChatClose(); ensureNotifications(); ensureProfile(); try{window.renderDashboardMaps();}catch(e){} };
  window.addEventListener('load',()=>{ensureChatClose();ensureNotifications();ensureProfile();setTimeout(()=>{ensureChatClose();ensureNotifications();},800);});
})();
/* ===== END app-preconsolidation-6.6.5.js ===== */


/* ===== BEGIN final-6.4.1-patch.js ===== */
/* FINAL 6.4.1 cleanup/production patch */
(function(){
  const $=id=>document.getElementById(id);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const saveNow=()=>{try{ if(typeof save==='function') save(); else localStorage.setItem('ofaDataV5',JSON.stringify(data)); }catch(e){localStorage.setItem('ofaDataV5',JSON.stringify(data));}};
  const me=()=>{let n=(localStorage.getItem('ofa_family_user')||localStorage.getItem('ofa_voter_name')||'').trim(); if(!n){n='Melissa';localStorage.setItem('ofa_family_user',n);localStorage.setItem('ofa_voter_name',n);} return n;};
  function peopleOptions(def='Volunteer needed'){const names=(data.people||[]).map(p=>p.name).filter(Boolean); return [def,'Everyone / Group',...names].filter((v,i,a)=>a.indexOf(v)===i).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');}
  function dedupeFormLabels(){
    // Remove old radio/chip controls and duplicate label blocks added by previous patch builds.
    $$('label').forEach(l=>{const t=(l.textContent||'').trim(); if(/^(Group list|Individual\/private)$/.test(t)) l.remove();});
    $$('.card.formCard').forEach(card=>{
      const keep={};
      $$('label',card).forEach(l=>{const name=(l.childNodes[0]?.textContent||l.textContent||'').trim().replace(/\s+/g,' '); if(['Meal type','List privacy','Assigned to','Who is bringing it?'].includes(name)){ if(keep[name]) l.remove(); else keep[name]=l; }});
    });
    ['mealPerson','groceryPerson','packingPerson','mealTitle'].forEach(x=>{const el=$(x); if(el){el.required=false; if(x==='mealTitle'){el.closest('label')?.classList.add('hidden');}}});
  }
  function setupCleanForms(){
    dedupeFormLabels();
    if($('mealItem')&&!$('mealType641')) $('mealItem').closest('label')?.insertAdjacentHTML('beforebegin','<label>Meal type<select id="mealType641"><option>Breakfast</option><option>Snack</option><option>Dining out</option><option>Lunch</option><option selected>Dinner</option><option>Late snack</option><option>Happy hour</option></select></label>');
    if($('mealItem')&&!$('mealPrivacy641')) $('mealItem').closest('label')?.insertAdjacentHTML('beforebegin','<label>List privacy<select id="mealPrivacy641"><option value="group">Group/shared meal</option><option value="private">My private meal</option></select></label>');
    if($('mealItem')&&!$('mealAssign641')) $('mealItem').closest('label')?.insertAdjacentHTML('afterend',`<label>Assigned to<select id="mealAssign641">${peopleOptions()}</select></label>`);
    if($('groceryItem')&&!$('groceryPrivacy641')) $('groceryItem').closest('label')?.insertAdjacentHTML('beforebegin','<label>List privacy<select id="groceryPrivacy641"><option value="group">Group list</option><option value="private">My private list</option></select></label>');
    if($('groceryItem')&&!$('groceryAssign641')) $('groceryItem').closest('label')?.insertAdjacentHTML('afterend',`<label>Assigned to<select id="groceryAssign641">${peopleOptions()}</select></label>`);
    if($('packingItem')&&!$('packingPrivacy641')) $('packingItem').closest('label')?.insertAdjacentHTML('beforebegin','<label>List privacy<select id="packingPrivacy641"><option value="group">Group list</option><option value="private">My private list</option></select></label>');
    if($('packingItem')&&!$('packingAssign641')) $('packingItem').closest('label')?.insertAdjacentHTML('afterend',`<label>Assigned to<select id="packingAssign641">${peopleOptions('Everyone / Group')}</select></label>`);
    dedupeFormLabels();
  }
  function addList(kind){
    const trip=$(kind==='meal'?'mealTrip':kind==='grocery'?'groceryTrip':'packingTrip')?.value || 'General';
    const item=$(kind==='meal'?'mealItem':kind==='grocery'?'groceryItem':'packingItem')?.value?.trim();
    if(!item) return alert('Add an item first.');
    const priv=$(kind==='meal'?'mealPrivacy641':kind==='grocery'?'groceryPrivacy641':'packingPrivacy641')?.value==='private';
    const assign=priv?me():($(kind==='meal'?'mealAssign641':kind==='grocery'?'groceryAssign641':'packingAssign641')?.value || 'Volunteer needed');
    const obj={id:id(),trip,item,person:assign,assignedTo:assign,private:priv,scope:priv?'private':'group',owner:priv?me():'group',addedBy:me(),done:false,createdAt:new Date().toISOString()};
    if(kind==='meal'){obj.title=$('mealType641')?.value||'Dinner';obj.mealType=obj.title;data.meals=data.meals||[];data.meals.push(obj);$('mealItem').value='';}
    if(kind==='grocery'){data.groceries=data.groceries||[];data.groceries.push(obj);$('groceryItem').value='';}
    if(kind==='packing'){data.packing=data.packing||[];data.packing.push(obj);$('packingItem').value='';}
    addNotice(`${kind} item added: ${item}`,kind); saveNow(); render();
  }
  window.toggleDone=function(kind,itemId){const x=(data[kind]||[]).find(a=>a.id===itemId); if(x){x.done=!x.done; saveNow(); render();}};
  window.assignItem=function(kind,itemId,val){const x=(data[kind]||[]).find(a=>a.id===itemId); if(x){x.person=val;x.assignedTo=val; saveNow(); render();}};
  window.editListItem=function(kind,itemId){const x=(data[kind]||[]).find(a=>a.id===itemId); if(!x)return; const v=prompt('Edit item',x.item||''); if(v!==null){x.item=v.trim()||x.item; saveNow(); render();}};
  function visible(x){return !x.private || x.owner===me() || x.addedBy===me();}
  function row(kind,x,title,sub){return `<div class="item checklistItem ${x.done?'doneSoft':''}"><label class="checkLine"><input type="checkbox" ${x.done?'checked':''} onchange="toggleDone('${kind}','${x.id}')"><span><b>${esc(title)}</b><small>${esc(sub||'')}</small></span></label><p class="helperText">${x.private?'Private — only you can see this':'Group/shared'}${x.person?' • Assigned: '+esc(x.person):''}</p>${!x.private?`<label class="inlineAssign">Assign/claim<select onchange="assignItem('${kind}','${x.id}',this.value)">${peopleOptions(x.person||'Volunteer needed')}</select></label>`:''}<div class="itemActions"><button onclick="editListItem('${kind}','${x.id}')" class="secondary smallBtn">Edit</button><button onclick="del('${kind}','${x.id}')" class="secondary smallBtn">Delete</button></div></div>`;}
  window.renderMeals=function(){const box=$('mealList'); if(!box)return; const meals=(data.meals||[]).filter(visible), groceries=(data.groceries||[]).filter(visible); box.innerHTML=`<div class="card"><h3>Group Meal Plan</h3>${meals.filter(x=>!x.private).map(m=>row('meals',m,`${m.mealType||m.title||'Meal'}: ${m.item}`,m.trip)).join('')||'<p>No group meals yet.</p>'}</div><div class="card"><h3>My Private Meal Plan</h3>${meals.filter(x=>x.private).map(m=>row('meals',m,`${m.mealType||m.title||'Meal'}: ${m.item}`,m.trip)).join('')||'<p>No private meals yet.</p>'}</div><div class="card"><h3>Group Grocery List</h3>${groceries.filter(x=>!x.private).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No group grocery items yet.</p>'}</div><div class="card"><h3>My Private Grocery List</h3>${groceries.filter(x=>x.private).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No private grocery items yet.</p>'}</div>`;};
  window.renderPacking=function(){const box=$('packingList'); if(!box)return; const items=(data.packing||[]).filter(visible); box.innerHTML=`<div class="card"><h3>Group Packing List</h3>${items.filter(x=>!x.private).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No group packing items yet.</p>'}</div><div class="card"><h3>My Private Packing List</h3>${items.filter(x=>x.private).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No private packing items yet.</p>'}</div>`;};

  function splitLines(t){return String(t||'').split(/\n+/).map(s=>s.trim()).filter(Boolean)}
  function hostTitle(u){try{return new URL(u).hostname.replace(/^www\./,'');}catch{return u;}}
  window.addVoteOptionsBulk=function(tripId){const t=(data.trips||[]).find(x=>x.id===tripId); if(!t)return; const opts=splitLines($('voteInput-'+tripId)?.value); const links=splitLines($('voteLink-'+tripId)?.value); if(!opts.length&&!links.length)return alert('Add at least one voting option or link.'); t.voteOptions=t.voteOptions||[]; opts.forEach(o=>t.voteOptions.push({id:id(),text:o,link:/^https?:\/\//i.test(o)?o:'',votes:{}})); links.forEach(l=>t.voteOptions.push({id:id(),text:hostTitle(l),link:l,votes:{}})); $$(`#voteInput-${tripId},#voteLink-${tripId}`).forEach(e=>e.value=''); addNotice('Voting option added','votes'); saveNow(); render(); show('voting');};
  window.voteTrip=function(tripId,index){const t=(data.trips||[]).find(x=>x.id===tripId); const v=t?.voteOptions?.[index]; if(!v)return; const voter=me(); t.voteOptions.forEach(o=>{o.votes=o.votes||{}; delete o.votes[voter];}); v.votes=v.votes||{}; v.votes[voter]=new Date().toISOString(); addNotice(`${voter} voted on ${t.name}`,'votes'); saveNow(); render();};
  window.voteCount=v=>Object.keys(v.votes||{}).length+Number(v.legacyCount||0);
  function voteCard(t){return `<div class="card"><h3>${esc(t.name)}</h3>${(t.voteOptions||[]).map((v,i)=>`<div class="voteRow"><div><b>${esc(v.text)}</b>${v.link?`<br><a target="_blank" href="${esc(v.link)}">${esc(v.link)}</a>`:''}<br><small>${Object.keys(v.votes||{}).join(', ')||'No votes yet'}</small></div><strong>${voteCount(v)} vote(s)</strong><button onclick="voteTrip('${t.id}',${i})" class="secondary">Vote / Change</button></div>`).join('')||'<p>No voting options yet.</p>'}<div class="voteAdd"><textarea id="voteInput-${t.id}" placeholder="Add voting options, one per line"></textarea><textarea id="voteLink-${t.id}" placeholder="Optional links, one per line. Each link becomes its own vote option."></textarea><button onclick="addVoteOptionsBulk('${t.id}')" class="secondary">Add voting item(s)</button></div></div>`;}
  function renderVoting(){const box=$('votingList'); if(box) box.innerHTML=(data.trips||[]).map(voteCard).join('')||'<div class="card"><p>Add a trip first.</p></div>';}

  function addNotice(text,type='system'){data.notifications=data.notifications||[]; data.notifications.unshift({id:id(),text,type,read:false,at:new Date().toISOString()}); updateBadges();}
  window.addAppNotification=addNotice;
  function ensureNotif(){
    $$('.notificationBell,.chatPopButton,.floatingNotif').forEach((e,i)=>{ if(i>0) e.remove(); });
    if(!$('notifyBell641')) document.body.insertAdjacentHTML('beforeend','<button id="notifyBell641" class="floatingNotif">🔔 <span id="notifBadge641">0</span></button><div id="notifPanel641" class="notificationCenter hidden"><div class="card"><button id="closeNotif641" class="closeNotif">×</button><h3>Notifications</h3><div id="notifList641"></div><button id="markRead641" class="secondary">Mark all read</button><button id="clearNotif641" class="secondary">Clear all</button></div></div>');
    $('notifyBell641').onclick=()=>{$('notifPanel641').classList.remove('hidden'); renderNotifList();}; $('closeNotif641').onclick=()=>$('notifPanel641').classList.add('hidden'); $('markRead641').onclick=()=>{(data.notifications||[]).forEach(n=>n.read=true); saveNow(); renderNotifList(); updateBadges();}; $('clearNotif641').onclick=()=>{data.notifications=[]; saveNow(); renderNotifList(); updateBadges();};
  }
  function renderNotifList(){const box=$('notifList641'); if(!box)return; const list=data.notifications||[]; box.innerHTML=list.length?list.map(n=>`<div class="notificationNote ${n.read?'read':'unread'}"><b>${esc(n.type)}</b><p>${esc(n.text)}</p><small>${new Date(n.at).toLocaleString()}</small></div>`).join(''):'<p>No notifications.</p>';}
  function updateBadges(){const unread=(data.notifications||[]).filter(n=>!n.read).length; if($('notifBadge641')) $('notifBadge641').textContent=unread; if('setAppBadge' in navigator){ if(unread) navigator.setAppBadge(unread).catch(()=>{}); else navigator.clearAppBadge?.().catch(()=>{});} }

  function ensureChat(){
    $$('.chatFloat,.floatingChat,.chatPopButton').forEach((e,i)=>{ if(i>0) e.remove(); });
    if(!$('chatFloat641')) document.body.insertAdjacentHTML('beforeend','<button id="chatFloat641" class="chatFloat">💬 <span id="chatBadge641">0</span></button><div id="chatPanel641" class="chatFloatPanel hidden"><div class="chatFloatHeader"><b>Family Chat</b><button id="closeChat641">×</button></div><div id="chatLog641" class="chatFloatLog"></div><div class="chatFloatSend"><input id="chatInput641" placeholder="Write a message or @name"><button id="sendChat641" class="primary">Send</button></div></div>');
    const b=$('chatFloat641'); let drag=false, moved=false, dx=0,dy=0; b.onpointerdown=e=>{drag=true;moved=false;dx=e.clientX-b.offsetLeft;dy=e.clientY-b.offsetTop;b.setPointerCapture(e.pointerId)}; b.onpointermove=e=>{if(drag){moved=true;b.style.left=(e.clientX-dx)+'px';b.style.top=(e.clientY-dy)+'px';b.style.right='auto';b.style.bottom='auto';}}; b.onpointerup=e=>{drag=false;try{b.releasePointerCapture(e.pointerId)}catch{}; if(!moved){$('chatPanel641').classList.toggle('hidden'); renderChat();}};
    $('closeChat641').onclick=()=>$('chatPanel641').classList.add('hidden'); $('sendChat641').onclick=()=>{const msg=$('chatInput641').value.trim(); if(!msg)return; $('chatInput641').value=''; data.chat=data.chat||[]; data.chat.push({id:id(),name:me(),text:msg,at:new Date().toISOString()}); addNotice(msg.includes('@')?'You were mentioned in chat':'New family chat','chat'); saveNow(); renderChat();};
  }
  window.renderChat=function(){const html=(data.chat||[]).slice(-80).map(c=>`<div class="bubble"><b>${esc(c.name||c.author||'Family')}</b><br>${esc(c.text).replace(/@\w+/g,m=>`<b>${m}</b>`)}<br><small>${new Date(c.at).toLocaleString()}</small></div>`).join('')||'<p>No chat messages yet.</p>'; if($('chatLog')) $('chatLog').innerHTML=html; if($('chatLog641')) {$('chatLog641').innerHTML=html; $('chatLog641').scrollTop=$('chatLog641').scrollHeight;} const unread=(data.notifications||[]).filter(n=>!n.read&&n.type==='chat').length; if($('chatBadge641')) $('chatBadge641').textContent=unread;};

  window.addItinerary=function(tripId){const t=(data.trips||[]).find(x=>x.id===tripId); if(!t)return; const time=$(`itineraryCustom-${tripId}`)?.value || ($$(`input[name="itSlot-${tripId}"]`).find(r=>r.checked)?.value||'Activity'); const title=$(`itineraryTitle-${tripId}`)?.value?.trim(); const link=$(`itineraryLink-${tripId}`)?.value?.trim()||''; if(!title)return alert('Add the itinerary activity first.'); t.itinerary=t.itinerary||[]; t.itinerary.push({id:id(),time,title,link}); saveNow(); render();};
  async function liveWeather(place){ if(!place)return 'Add a city, state, destination, or address.'; try{let q=String(place).split(',').slice(0,2).join(','); const geo=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`).then(r=>r.json()); const g=geo.results?.[0]; if(!g)return 'Weather could not find that location. Try city and state.'; const w=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=auto`).then(r=>r.json()); return `${g.name}: ${Math.round(w.current.temperature_2m)}°F now. High ${Math.round(w.daily.temperature_2m_max[0])}° / Low ${Math.round(w.daily.temperature_2m_min[0])}°. Rain chance ${w.daily.precipitation_probability_max?.[0]??0}%.`; }catch(e){return 'Live weather could not load. Check internet or use city/state.';}}
  window.refreshTripWeather=async function(tripId){const t=(data.trips||[]).find(x=>x.id===tripId)||data.trips?.[0]; if(!t)return; t.weather='Loading live weather...'; saveNow(); render(); t.weather=await liveWeather(t.address||t.destination||t.tripAddress||t.name); addNotice('Weather updated','weather'); saveNow(); render();};
  window.openTripMap=function(tripId){const t=(data.trips||[]).find(x=>x.id===tripId); const q=encodeURIComponent(t?.address||t?.destination||t?.name||''); if(q) window.open(`https://www.google.com/maps/search/?api=1&query=${q}`,'_blank');};

  function setupProfileEdit(){
    if(!$('profilePhoto641')) document.body.insertAdjacentHTML('beforeend','<input id="profilePhoto641" type="file" accept="image/*" class="hidden">');
    $('profilePhoto641').onchange=e=>{const f=e.target.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{localStorage.setItem('ofa_profile_photo',r.result); let p=(data.people||[]).find(x=>x.name===me()); if(p)p.photo=r.result; saveNow(); render();}; r.readAsDataURL(f);};
    if($('profileEditBtn')) $('profileEditBtn').onclick=()=>{const n=prompt('Display name',me()); if(n){localStorage.setItem('ofa_family_user',n.trim()); localStorage.setItem('ofa_voter_name',n.trim());} const em=prompt('Email',localStorage.getItem('ofa_profile_email')||''); if(em!==null)localStorage.setItem('ofa_profile_email',em); const ph=prompt('Phone',localStorage.getItem('ofa_profile_phone')||''); if(ph!==null)localStorage.setItem('ofa_profile_phone',ph); if(confirm('Change profile photo?')) $('profilePhoto641').click(); render();};
  }
  function renderProfile(){const box=$('profileSummary'); if(!box)return; const pic=localStorage.getItem('ofa_profile_photo')||(data.people||[]).find(p=>p.name===me())?.photo||'icons/icon-192.png'; box.innerHTML=`<div class="profileSummary"><img class="profileAvatarBig" src="${pic}"><div><h3>${esc(me())}</h3><p>${esc(localStorage.getItem('ofa_profile_email')||'Not signed in yet')}</p><p>${esc(localStorage.getItem('ofa_profile_phone')||'')}</p><button class="secondary" onclick="document.getElementById('profileEditBtn')?.click()">Edit Profile</button></div></div>`;}

  function ensureHomeButtons(){ $$('.page').forEach(p=>{const head=p.querySelector('.pageHead'); if(head && p.id!=='home' && !head.querySelector('.pageHomeBtn')) head.insertAdjacentHTML('afterbegin','<button class="secondary pageHomeBtn" data-go="home">🏠 Home</button>');}); $$('.miniCard').forEach((c,i)=>{c.setAttribute('data-go',['people','adventures','memories','scrapbook'][i]||'home')});}
  function rebindNav(){ $$('[data-go]').forEach(btn=>{btn.onclick=e=>{e.preventDefault(); const page=btn.getAttribute('data-go'); show(page); setTimeout(()=>{document.querySelector('.page.active')?.scrollIntoView({block:'start'}); window.scrollTo(0,0);},20);};}); $$('.dock button').forEach(b=>b.classList.toggle('active',b.getAttribute('data-go')===document.querySelector('.page.active')?.id));}

  function themeStickers(theme){const t=String(theme||'').toLowerCase(); if(t.includes('atv'))return ['🏁','🛞','🛻','🌲','⛰️','💨','🥾','🧤','🧢']; if(t.includes('fish'))return ['🎣','🐟','🚤','🌊','🪱','🧢','☀️']; if(t.includes('camp'))return ['⛺','🔥','🌲','🧭','🥾','⭐','🪵']; if(t.includes('birthday'))return ['🎂','🎈','🎁','🥳','✨','🎉']; if(t.includes('happy')||t.includes('drink'))return ['🍹','🍻','🥂','🍷','🧊','🌅']; if(t.includes('party'))return ['🎉','🎈','🥳','🍰','✨','🎊']; if(t.includes('mount'))return ['⛰️','🌲','🥾','🔥','🧭','🏕️']; return ['🐚','⭐','🌊','🏖️','☀️','📷','🩴','🕶️'];}
  function renderScrapbook(){const box=$('scrapbookPages'); if(!box)return; box.innerHTML=(data.pages||[]).map(p=>`<div class="scrapPage theme-${esc(String(p.theme||'beach').toLowerCase().replace(/[^a-z0-9]+/g,'-'))}"><h3>${esc(p.title)}</h3><div class="stickerStrip">${themeStickers(p.theme).map(s=>`<span>${s}</span>`).join('')}</div><div class="cutoutStrip"><span>polaroid</span><span>ticket cutout</span><span>circle cutout</span><span>postcard</span><span>torn paper</span></div><div class="trueCollage">${(p.photos||[]).map((src,i)=>`<figure class="size-${i%8} frame-${['polaroid','ticket-stub','circle-cutout','postcard','torn-paper','gold','shell'][i%7]}"><img draggable="true" src="${src}" ondragstart="event.dataTransfer.setData('text/plain','${p.id}:${i}')" ondrop="dropScrapPhoto(event,'${p.id}',${i})" ondragover="event.preventDefault()"><button onclick="alert('Use drag-and-drop to rearrange. Full pinch crop editor is planned for 7.0.')">Crop</button></figure>`).join('')||'<p>No photos selected for this page.</p>'}</div><p>${esc(p.note||'')}</p><div class="scrapTools noPrint"><button onclick="window.print()" class="secondary">PDF / Print</button><button onclick="del('pages','${p.id}')" class="secondary">Delete</button></div></div>`).join('')||'<div class="card"><p>No scrapbook pages yet.</p></div>';}
  window.dropScrapPhoto=function(e,pid,to){e.preventDefault();const [idp,from]=String(e.dataTransfer.getData('text/plain')).split(':'); if(idp!==pid)return; const p=(data.pages||[]).find(x=>x.id===pid); if(!p)return; const f=Number(from); [p.photos[f],p.photos[to]]=[p.photos[to],p.photos[f]]; saveNow(); render();};

  const oldShow=window.show; window.show=function(page){ if(oldShow) oldShow(page); $$('.page').forEach(p=>p.classList.toggle('active',p.id===page)); document.body.classList.toggle('homeMode',page==='home'); document.body.classList.toggle('sectionMode',page!=='home'); $$('.dock button').forEach(b=>b.classList.toggle('active',b.getAttribute('data-go')===page)); window.scrollTo(0,0); };
  const oldRender=window.render; window.render=function(){try{oldRender&&oldRender();}catch(e){console.warn(e)} setupCleanForms(); ensureNotif(); ensureChat(); setupProfileEdit(); ensureHomeButtons(); rebindNav(); renderVoting(); renderProfile(); renderScrapbook(); renderNotifList(); updateBadges(); if($('saveMeal')) $('saveMeal').onclick=()=>addList('meal'); if($('saveGrocery')) $('saveGrocery').onclick=()=>addList('grocery'); if($('savePacking')) $('savePacking').onclick=()=>addList('packing');};
  setTimeout(()=>{me(); render();},500);
})();


// 6.4.2 visual cleanup helpers
(function(){
  function byId(id){return document.getElementById(id)}
  function enterApp(){
    const splash=byId('splash'), app=byId('app');
    if(splash) splash.classList.remove('active');
    if(app) app.classList.remove('hidden');
    document.body.classList.add('homeMode');
    document.body.classList.remove('sectionMode');
  }
  function ensureSmallFloatingTools(){
    const oldBars=[...document.querySelectorAll('.notificationBell,.chatPopButton')];
    oldBars.forEach(e=>e.remove());
    let n=byId('notifyBell641');
    if(n){ n.innerHTML='🔔 <span id="notifBadge641">'+((byId('notifBadge641')||{}).textContent||'0')+'</span>'; }
    let c=byId('chatFloat641');
    if(!c){
      document.body.insertAdjacentHTML('beforeend','<button id="chatFloat641" class="chatFloat">💬 <span id="chatBadge641">0</span></button><div id="chatPanel641" class="chatFloatPanel hidden"><div class="chatFloatHeader"><b>Family Chat</b><button id="closeChat641">×</button></div><div id="chatLog641" class="chatFloatLog"></div><div class="chatFloatSend"><input id="chatInput641" placeholder="Write a message or @name"><button id="sendChat641" class="primary">Send</button></div></div>');
    }
    c=byId('chatFloat641');
    if(c && !c.dataset.fixed642){
      c.dataset.fixed642='1';
      c.onclick=function(e){ if(e.detail===0) return; const panel=byId('chatPanel641'); if(panel) panel.classList.toggle('hidden'); if(window.renderChat) window.renderChat(); };
    }
  }
  window.addEventListener('DOMContentLoaded',()=>{
    const splash=byId('splash');
    if(splash) splash.addEventListener('click', enterApp);
    const begin=byId('beginBtn');
    if(begin) begin.addEventListener('click', enterApp);
    setTimeout(ensureSmallFloatingTools,300);
    setTimeout(ensureSmallFloatingTools,1200);
  });
})();
/* ===== END final-6.4.1-patch.js ===== */


/* ===== BEGIN ofa-6.5.0.js ===== */
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
/* ===== END ofa-6.5.0.js ===== */


/* ===== BEGIN ofa-6.5.1.js ===== */
/* Our Family Adventures - 6.5.1 deploy patch */
(function(){
  'use strict';
  const VERSION='6.5.1';
  const $=id=>document.getElementById(id);
  const E=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const toast=msg=>(window.toast?window.toast(msg):alert(msg));
  const save=()=>{try{ if(window.saveNow) return window.saveNow(); if(window.save) return window.save(); localStorage.setItem('ourFamilyAdventuresData',JSON.stringify(data)); }catch(e){console.warn(e)}};
  function ensure(){ if(!window.data && typeof data!=='undefined') window.data=data; if(!window.data)return null; const d=window.data; ['notifications','meals','trips','pages','memories','people'].forEach(k=>{if(!Array.isArray(d[k]))d[k]=[]}); if(!d.profile)d.profile={}; if(!d.settings)d.settings={}; if(!d.settings.notifications)d.settings.notifications={}; return d; }
  function currentName(){const d=ensure()||{};return (d.profile?.name||localStorage.getItem('ofa_family_user')||localStorage.getItem('ofa_voter_name')||'').trim();}
  function currentUid(){try{return firebase.auth().currentUser?.uid||'local'}catch(e){return 'local'}}
  function firebaseDb(){try{ if(window.firebase&&firebase.apps?.length&&firebase.firestore) return firebase.firestore(); }catch(e){} return null;}
  function appFamily(){return localStorage.getItem('ofa_family_id')||'melissa-family';}

  /* Notifications */
  window.addNotification651=function(message,type='system',userSpecific=true){const d=ensure(); if(!d)return; const n={id:id(),message:String(message||''),type,read:false,userId:userSpecific?currentUid():'all',name:currentName(),at:new Date().toISOString(),version:VERSION}; d.notifications.unshift(n); d.notifications=d.notifications.slice(0,150); save(); renderNotifications651(); try{const db=firebaseDb(); if(db&&currentUid()!=='local') db.collection('families').doc(appFamily()).collection('notifications').doc(n.id).set(n,{merge:true});}catch(e){console.warn(e)} };
  window.markNotificationRead651=function(nid){const d=ensure(); const n=d.notifications.find(x=>x.id===nid); if(n)n.read=true; save(); renderNotifications651();};
  window.markAllNotificationsRead651=function(){const d=ensure(); d.notifications.forEach(n=>n.read=true); save(); renderNotifications651();};
  function renderNotifications651(){const d=ensure(); if(!d)return; const mine=d.notifications.filter(n=>!n.userId||n.userId==='all'||n.userId===currentUid()||currentUid()==='local'); const unread=mine.filter(n=>!n.read).length; document.querySelectorAll('.notifBadge').forEach(x=>x.remove()); ['loginBtn','settingsNotifyBtn','enableNotifications'].forEach(bid=>{const b=$(bid); if(b&&unread){b.style.position='relative'; b.insertAdjacentHTML('beforeend',`<span class="notifBadge">${unread}</span>`);}}); const log=$('notificationLog'); if(log) log.innerHTML=`<div class="buttonRow"><button class="secondary smallBtn" onclick="markAllNotificationsRead651()">Mark all read</button><button class="secondary smallBtn" onclick="addNotification651('Test notification is working.','system',true)">Test</button></div>`+(mine.length?mine.slice(0,30).map(n=>`<div class="notifItem ${n.read?'':'unread'}"><span>${n.read?'🔔':'🔴'}</span><div><b>${E(n.type||'Notice')}</b><p>${E(n.message||n.text||'')}</p><small>${new Date(n.at||Date.now()).toLocaleString()}${n.name?' • '+E(n.name):''}</small><br><button class="secondary smallBtn" onclick="markNotificationRead651('${n.id}')">Mark read</button></div></div>`).join(''):'<p>No notifications yet.</p>'); }
  function attachNotifListener(){try{const db=firebaseDb(); const u=currentUid(); if(!db||u==='local'||attachNotifListener.done)return; attachNotifListener.done=true; db.collection('families').doc(appFamily()).collection('notifications').orderBy('at','desc').limit(50).onSnapshot(s=>{const d=ensure(); s.forEach(doc=>{const n={id:doc.id,...doc.data()}; if(!d.notifications.some(x=>x.id===n.id))d.notifications.unshift(n);}); save(); renderNotifications651();});}catch(e){console.warn(e)}}

  /* Weather and maps */
  function tripPlace(t){return t?.address||t?.tripAddress||t?.destination||t?.name||'';}
  async function geocode(place){let r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`); let j=await r.json(); if(j.results?.[0])return j.results[0]; throw new Error('Location not found');}
  async function liveWeather(place){const g=await geocode(place); const url=`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`; const j=await fetch(url).then(r=>r.json()); if(!j.current)throw new Error('Provider did not return current weather'); return `${Math.round(j.current.temperature_2m)}°F now, feels ${Math.round(j.current.apparent_temperature)}° • High ${Math.round(j.daily.temperature_2m_max[0])}° / Low ${Math.round(j.daily.temperature_2m_min[0])}° • Rain ${j.daily.precipitation_probability_max[0]??0}% • Wind ${Math.round(j.current.wind_speed_10m)} mph`;}
  window.refreshTripWeather=async function(tid){const d=ensure(); const t=d.trips.find(x=>x.id===tid); const p=tripPlace(t); if(!p)return toast('Add a destination or address first.'); const boxes=document.querySelectorAll(`[data-weather-for="${tid}"]`); boxes.forEach(b=>{b.textContent='Loading live weather...';b.classList.add('weatherLoading')}); try{t.weather=await liveWeather(p); t.weatherUpdatedAt=new Date().toISOString(); save(); if(window.render)window.render(); addNotification651(`Weather updated for ${t.name||p}.`,'weather',true); toast('Weather updated');}catch(e){boxes.forEach(b=>{b.textContent='Live weather could not load. Check the destination/address or try a nearby city.';b.classList.remove('weatherLoading')}); toast('Live weather could not load. Try a nearby city or full address.'); console.warn(e);} };
  window.googleDirections651=p=>`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p||'')}`;
  function mapCard(place){return place?`<a class="mapCard" href="${googleDirections651(place)}" target="_blank" rel="noopener"><b>📍 ${E(place)}</b><br><small>Tap to open Google Maps directions</small></a>`:'';}

  /* Voting with names */
  function voteNames(v){return Object.keys(v.votes||{}).filter(Boolean);}
  function voteCount(v){return voteNames(v).length+(v.legacyCount||0);}
  function voteHtml(t){return (t.voteOptions||[]).map((v,i)=>{const names=voteNames(v); const links=(v.links||[]).map((l,n)=>` <a href="${E(l)}" target="_blank">Link ${n+1}</a>`).join(''); return `<div class="voteRow"><span><b>${E(v.text)}</b>${links}<br><small>${names.length?'Voted: '+E(names.join(', ')):'No votes yet'}</small></span><strong>${voteCount(v)} vote(s)</strong><button onclick="voteTrip('${t.id}',${i})" class="secondary">Vote / Change</button><button onclick="removeVoteOption('${t.id}',${i})" class="secondary">Admin Remove</button></div>`}).join('')||'<p>No voting options yet.</p>';}
  window.voteTrip=function(tid,index){const d=ensure(); const t=d.trips.find(x=>x.id===tid); const opt=t?.voteOptions?.[index]; if(!opt)return; let voter=currentName(); if(!voter)voter=(prompt('Your name for voting')||'').trim(); if(!voter)return toast('Vote canceled.'); localStorage.setItem('ofa_family_user',voter); localStorage.setItem('ofa_voter_name',voter); (t.voteOptions||[]).forEach(v=>{v.votes=v.votes||{}; delete v.votes[voter];}); opt.votes=opt.votes||{}; opt.votes[voter]=new Date().toISOString(); save(); if(window.render)window.render(); addNotification651(`${voter} voted on ${t.name}.`,'votes',false); toast('Vote saved');};
  window.renderVoting=function(){const box=$('votingList'); const d=ensure(); if(!box||!d)return; box.innerHTML=d.trips.map(t=>`<div class="card"><h3>${E(t.name)}</h3>${voteHtml(t)}<textarea id="voteInput-${t.id}" placeholder="Add several voting options, one per line"></textarea><textarea id="voteLinks-${t.id}" placeholder="Optional links, one per line"></textarea><button onclick="addVoteOptionsBulk('${t.id}')" class="secondary">Add voting item</button></div>`).join('')||'<div class="card"><p>No trips yet.</p></div>';};

  /* Meal type fix */
  function installMeals651(){const mt=$('mealTitle'); if(mt){const wrap=$('mealButtonsFinal'); if(wrap)wrap.remove(); mt.style.display=''; mt.outerHTML='<label>Meal type<select id="mealTitle"><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option><option>Dessert</option><option>Drinks</option><option>Dining Out</option><option>Happy Hour</option></select></label>';}
    const b=$('saveMeal'); if(b)b.onclick=function(){const d=ensure(); const type=$('mealTitle')?.value||document.querySelector('input[name="mealTypeFinal"]:checked')?.value||'Dinner'; const item=($('mealItem')?.value||'').trim()||type; const person=$('mealPersonFinal')?.value||$('mealPerson')?.value||currentName()||'Volunteer needed'; d.meals.push({id:id(),trip:$('mealTrip')?.value||'General',title:type,mealType:type,item,person,scope:'group',private:false,done:false,createdAt:new Date().toISOString()}); if($('mealItem'))$('mealItem').value=''; save(); if(window.render)window.render(); addNotification651(`${type} added: ${item}`,'meals',false); toast(`${type} added`);};}

  /* Profile edit form with photo */
  function renderProfile(){const d=ensure(); if(!d)return; const p=d.profile; const box=$('profileSummary'); if(!box)return; const photo=p.photo||localStorage.getItem('ofa_profile_photo')||''; const name=p.name||currentName()||'Family Member'; const email=p.email||localStorage.getItem('ofa_family_email')||''; const phone=p.phone||localStorage.getItem('ofa_profile_phone')||''; box.innerHTML=`${photo?`<img class="profileAvatarBig" src="${E(photo)}" alt="Profile photo">`:`<div class="profileAvatarBig profileInitial">${E(name.slice(0,1).toUpperCase())}</div>`}<div class="profileDetails"><h3>${E(name)}</h3><p>${E(email||'No email saved')}</p><p>${E(phone||'No phone saved')}</p></div><div class="profileEditGrid"><label>Name<input id="profileName651" value="${E(name)}"></label><label>Email address<input id="profileEmail651" type="email" value="${E(email)}"></label><label>Phone number<input id="profilePhone651" type="tel" value="${E(phone)}"></label><label>Profile photo<input id="profilePhoto651" type="file" accept="image/*"></label><button id="profileSave651" class="primary">Save Profile</button></div>`; $('profileSave651').onclick=saveProfile;}
  function fileToDataURL(f){return new Promise((res,rej)=>{const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(f);});}
  async function saveProfile(){const d=ensure(); const p=d.profile; p.name=($('profileName651')?.value||'').trim()||'Family Member'; p.email=($('profileEmail651')?.value||'').trim(); p.phone=($('profilePhone651')?.value||'').trim(); const f=$('profilePhoto651')?.files?.[0]; if(f)p.photo=await fileToDataURL(f); localStorage.setItem('ofa_family_user',p.name); localStorage.setItem('ofa_family_email',p.email); localStorage.setItem('ofa_profile_phone',p.phone); if(p.photo)localStorage.setItem('ofa_profile_photo',p.photo); save(); try{const db=firebaseDb(); const u=firebase.auth().currentUser; if(db&&u&&!u.isAnonymous) await db.collection('users').doc(u.uid).set({...p,uid:u.uid,updatedAt:new Date().toISOString()},{merge:true});}catch(e){console.warn(e)} renderProfile(); toast('Profile saved');}
  window.renderProfile650=renderProfile;

  /* Scrapbook draft studio */
  const stickers=['🐚','⭐','🌊','☀️','⚓','❤️','🗼','🏖️','🏕️','⛰️','🛶','🚤','✈️','🧳','📍','🗺️','🔥','🌲','🌻','🌸','🦋','🐐','🐾','🎣','🍔','🌭','🍕','🍦','🎂','🎈','🇺🇸','🎆','🎄','🎃','🦃','❄️','💙','💛','😂','😍','🥰','😎','🙌'];
  const frames=['soft','polaroid','heart','scallop','star','moon','sun','wood'];
  let draft={ids:[],layout:'grid',frame:'soft',bg:'seaGlass',stickers:[],texts:[]};
  function photoPool(){const d=ensure(); const out=[]; (d.memories||[]).forEach(m=>(m.media||[]).forEach((x,i)=>{const src=typeof x==='string'?x:(x.src||x.url||x.data); if(src&&String(src).startsWith('data:image')||/^https?:|^\.\//.test(src||'')) out.push({id:`${m.id||'m'}-${i}`,src,title:m.title||'Memory'});})); return out;}
  function installScrapbook(){const host=$('scrapbookPhotoPicker'); if(!host)return; host.innerHTML=`<h3>Draft Scrapbook Page</h3><p>Pick photos, rearrange them, choose a layout, crop/zoom, add or remove stickers, then save the finished page.</p><div class="scrapDraftStudio"><div class="scrapToolbar"><label>Layout<select id="draftLayout"><option value="grid">Grid</option><option value="feature">Feature Photo</option><option value="collage">Collage</option><option value="freeform">Freeform</option></select></label><label>Frame<select id="draftFrame">${frames.map(f=>`<option value="${f}">${f[0].toUpperCase()+f.slice(1)}</option>`).join('')}</select></label><label>Background<select id="draftBg"><option value="seaGlass">Sea Glass</option><option value="sunset">Sunset</option><option value="sand">Beach Sand</option><option value="roseGold">Rose Gold</option><option value="lighthouse">Lighthouse</option></select></label><button id="addDraftText" class="secondary">Add Text</button><button id="clearDraft" class="secondary">Clear Draft</button></div><h4>Photos</h4><div id="draftPhotoChoices" class="scrapDraftPickGrid"></div><h4>Rearrange Selected Photos</h4><div id="draftStrip" class="draftStrip"></div><h4>Stickers & Emojis</h4><div class="stickerPalette">${stickers.map(s=>`<button class="secondary" data-sticker="${s}">${s}</button>`).join('')}</div><div id="draftCanvas" class="scrapCanvas"></div></div>`; ['draftLayout','draftFrame','draftBg'].forEach(x=>$(x).onchange=()=>{draft[x.replace('draft','').toLowerCase()]=$(x).value; renderDraft();}); $('addDraftText').onclick=()=>{const txt=prompt('Text for scrapbook page',$('pageTextBox')?.value||''); if(txt)draft.texts.push({id:id(),text:txt,x:40,y:160,size:18}); renderDraft();}; $('clearDraft').onclick=()=>{draft.ids=[];draft.stickers=[];draft.texts=[];renderDraft();renderChoices();}; document.querySelectorAll('[data-sticker]').forEach(b=>b.onclick=()=>{draft.stickers.push({id:id(),emoji:b.dataset.sticker,x:50,y:220,size:44});renderDraft();}); renderChoices(); renderDraft(); const saveBtn=$('savePage'); if(saveBtn)saveBtn.onclick=savePage; }
  function renderChoices(){const pool=photoPool(); const box=$('draftPhotoChoices'); if(!box)return; box.innerHTML=pool.length?pool.map(p=>`<button class="draftPhotoChoice ${draft.ids.includes(p.id)?'selected':''}" data-pid="${p.id}"><img src="${p.src}"><small>${E(p.title)}</small></button>`).join(''):'<p>No memory photos yet. Add photos in Memories first.</p>'; box.querySelectorAll('[data-pid]').forEach(b=>b.onclick=()=>{const pid=b.dataset.pid; draft.ids.includes(pid)?draft.ids=draft.ids.filter(x=>x!==pid):draft.ids.push(pid); renderChoices(); renderDraft();});}
  function renderStrip(pool){const strip=$('draftStrip'); if(!strip)return; strip.innerHTML=draft.ids.map((pid,i)=>{const p=pool.find(x=>x.id===pid); return p?`<div class="draftStripItem"><img src="${p.src}"><br><button onclick="scrapMove651(${i},-1)">←</button><button onclick="scrapMove651(${i},1)">→</button><button onclick="scrapRemove651('${pid}')">Remove</button></div>`:''}).join('')||'<p>No photos selected.</p>';}
  window.scrapMove651=(i,dir)=>{const j=i+dir;if(j<0||j>=draft.ids.length)return; [draft.ids[i],draft.ids[j]]=[draft.ids[j],draft.ids[i]]; renderChoices(); renderDraft();};
  window.scrapRemove651=pid=>{draft.ids=draft.ids.filter(x=>x!==pid); renderChoices(); renderDraft();};
  function renderDraft(){const pool=photoPool(); renderStrip(pool); const canvas=$('draftCanvas'); if(!canvas)return; draft.layout=$('draftLayout')?.value||draft.layout; draft.frame=$('draftFrame')?.value||draft.frame; draft.bg=$('draftBg')?.value||draft.bg; const title=$('pageTitle')?.value||'Draft Scrapbook Page'; const note=$('pageNote')?.value||''; canvas.className=`scrapCanvas bg-${draft.bg} layout-${draft.layout}`; canvas.innerHTML=`<h3>${E(title)}</h3><div class="photoLayer">${draft.ids.map(pid=>{const p=pool.find(x=>x.id===pid); return p?`<div class="scrapPhotoBox frame-${draft.frame}"><img src="${p.src}"><button class="secondary smallBtn" onclick="scrapRemove651('${pid}')">Remove</button></div>`:''}).join('')}</div><p class="pageNote">${E(note)}</p>`+draft.stickers.map(s=>`<div class="movableSticker" data-mid="${s.id}" style="left:${s.x}px;top:${s.y}px;font-size:${s.size}px">${s.emoji}<span class="resizeHandle">↘</span></div>`).join('')+draft.texts.map(t=>`<div class="movableText" data-mid="${t.id}" style="left:${t.x}px;top:${t.y}px;font-size:${t.size}px">${E(t.text)}<span class="resizeHandle">↘</span></div>`).join(''); makeMovable(canvas);}
  function makeMovable(canvas){canvas.querySelectorAll('.movableSticker,.movableText').forEach(el=>{let target=[...draft.stickers,...draft.texts].find(x=>x.id===el.dataset.mid); if(!target)return; let start=null; el.onpointerdown=e=>{if(e.target.classList.contains('resizeHandle')){start={resize:true,x:e.clientX,size:target.size};}else start={x:e.clientX,y:e.clientY,left:target.x,top:target.y}; el.setPointerCapture(e.pointerId);}; el.onpointermove=e=>{if(!start)return; if(start.resize){target.size=Math.max(18,Math.min(120,start.size+(e.clientX-start.x)/2));}else{target.x=Math.max(0,start.left+e.clientX-start.x);target.y=Math.max(0,start.top+e.clientY-start.y);} renderDraft();}; el.onpointerup=()=>start=null; el.ondblclick=()=>{draft.stickers=draft.stickers.filter(x=>x.id!==target.id);draft.texts=draft.texts.filter(x=>x.id!==target.id);renderDraft();};});}
  function savePage(){const d=ensure(); const pool=photoPool(); const photos=draft.ids.map(pid=>pool.find(p=>p.id===pid)?.src).filter(Boolean); const page={id:id(),title:($('pageTitle')?.value||'Scrapbook Page').trim(),note:($('pageNote')?.value||'').trim(),layout:draft.layout,frame:draft.frame,bg:draft.bg,photos,stickers:JSON.parse(JSON.stringify(draft.stickers)),texts:JSON.parse(JSON.stringify(draft.texts)),createdAt:new Date().toISOString(),version:VERSION}; if(!photos.length&&!page.title&&!page.note)return toast('Select photos or add a title/note first.'); d.pages.push(page); draft.ids=[];draft.stickers=[];draft.texts=[]; save(); renderChoices(); renderDraft(); renderPages651(); addNotification651(`Scrapbook page saved: ${page.title}`,'scrapbook',false); toast('Scrapbook page saved');}
  window.renderPages=window.renderPages651=function(){const d=ensure(); const box=$('scrapbookPages'); if(!box)return; box.innerHTML=d.pages.map(p=>`<div class="scrapPage scrapCanvas bg-${p.bg||'seaGlass'} layout-${p.layout||'grid'}"><h3>${E(p.title)}</h3><div>${(p.photos||[]).map(src=>`<div class="scrapPhotoBox frame-${p.frame||'soft'}"><img src="${src}"></div>`).join('')||'<p>No photos selected.</p>'}</div><p>${E(p.note||'')}</p>${(p.stickers||[]).map(s=>`<span class="movableSticker" style="left:${s.x}px;top:${s.y}px;font-size:${s.size}px">${s.emoji}</span>`).join('')}${(p.texts||[]).map(t=>`<span class="movableText" style="left:${t.x}px;top:${t.y}px;font-size:${t.size}px">${E(t.text)}</span>`).join('')}<div class="scrapTools noPrint"><button onclick="exportScrapbookPage&&exportScrapbookPage('${p.id}')" class="secondary">Export JPG</button><button onclick="del('pages','${p.id}')" class="secondary">Delete</button></div></div>`).join('')||'<div class="card"><p>No scrapbook pages yet.</p></div>';};

  function patchTripsRender(){const old=window.renderTrips; window.renderTrips=function(){const d=ensure(); const box=$('tripList'); if(!box||!d)return old&&old(); box.innerHTML=d.trips.map(t=>{const place=tripPlace(t); return `<div class="item tripCard"><h3>${E(t.name)}</h3><p>${E(t.destination||'')} ${t.start?`• ${E(t.start)} to ${E(t.end||'')}`:''}</p>${mapCard(place)}<p class="weatherBox" data-weather-for="${t.id}">${E(t.weather||'No live weather loaded yet.')}</p><div class="itemActions"><button onclick="editTrip('${t.id}')" class="primary">Edit Trip</button><button onclick="refreshTripWeather('${t.id}')" class="secondary">Live Weather</button><button onclick="window.open(googleDirections651('${E(place)}'),'_blank')" class="secondary">Directions</button></div><div class="voteBox"><h4>Family Voting</h4>${voteHtml(t)}<textarea id="voteInput-${t.id}" placeholder="Add voting options, one per line"></textarea><textarea id="voteLinks-${t.id}" placeholder="Optional links, one per line"></textarea><button onclick="addVoteOptionsBulk('${t.id}')" class="secondary">Add voting item</button></div></div>`}).join('')||'<div class="card"><p>No trips yet.</p></div>';};}

  function init(){ensure(); document.documentElement.setAttribute('data-version',VERSION); installMeals651(); installScrapbook(); patchTripsRender(); renderProfile(); renderNotifications651(); attachNotifListener(); if($('testNotifyBtn'))$('testNotifyBtn').onclick=()=>addNotification651('Test notification is working.','system',true); if($('enableNotifications'))$('enableNotifications').onclick=()=>addNotification651('Notifications are turned on inside the app.','system',true); const oldRender=window.render; window.render=function(){try{oldRender&&oldRender();}catch(e){console.warn(e)} installMeals651(); patchTripsRender(); renderProfile(); renderNotifications651(); if(window.renderVoting)renderVoting(); if(window.renderPages651)renderPages651();}; setTimeout(()=>{try{window.render&&window.render()}catch(e){}},300);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init); else init();
})();
/* ===== END ofa-6.5.1.js ===== */


/* ===== BEGIN ofa-6.5.2.js ===== */
/* Version 6.5.2 corrective build: weather, voting, scrapbook draft, lists, explore map, notifications, profile, links */
(function(){
  const VERSION='6.5.2';
  const q=id=>document.getElementById(id);
  const qa=s=>Array.from(document.querySelectorAll(s));
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const canData=()=>typeof data!=='undefined';
  const saveApp=()=>{try{ if(typeof save==='function') save(); else localStorage.setItem('ofa_v5_data',JSON.stringify(data)); }catch(e){console.warn(e)}};
  const msg=m=>{try{toast(m)}catch{console.log(m)}};
  function ensure(){ if(!canData())return false; ['people','trips','memories','pages','links','meals','groceries','packing','pins','chat','notifications'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]}); if(!data.profile)data.profile={}; (data.trips||[]).forEach(t=>{ if(!Array.isArray(t.voteOptions))t.voteOptions=[]; if(!Array.isArray(t.tripLinks))t.tripLinks=[]; if(t.address&&!t.tripAddress)t.tripAddress=t.address; }); return true; }
  const me=()=> (data?.profile?.name || localStorage.getItem('ofa_voter_name') || firebase?.auth?.().currentUser?.displayName || firebase?.auth?.().currentUser?.email || 'Family Member').trim();
  const profileEmail=()=> data?.profile?.email || firebase?.auth?.().currentUser?.email || '';
  function placeFor(t){return (t.tripAddress||t.address||t.destination||t.name||'').trim();}
  function mapsUrl(place){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(place||'');}
  function directionsUrl(place){return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(place||'');}
  function mapCard(place,label='Map'){ if(!place)return '<p class="helperWarn">Add a destination or trip address to show the map and weather.</p>'; return `<div class="mapCard"><b>${E(label)}</b><iframe class="mapEmbed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${encodeURIComponent(place)}&output=embed"></iframe><div class="mapActions"><a class="secondary" href="${directionsUrl(place)}" target="_blank" rel="noopener">Open Google Maps Directions</a></div></div>`; }

  // Save address/budget fields that the original save handler missed.
  function patchTripSave(){ const btn=q('saveTrip'); if(!btn||btn.dataset.v652)return; btn.dataset.v652='1'; const old=btn.onclick; btn.onclick=function(e){ const address=q('tripAddress')?.value.trim()||''; const budget=q('tripBudget')?.value||''; old&&old.call(this,e); const t=(data.trips||[]).slice().reverse().find(x=>(x.name||'')===(q('tripName')?.value||'') || !x.tripAddress); const newest=(data.trips||[])[data.trips.length-1]; const target=editingTripId?(data.trips||[]).find(x=>x.id===editingTripId):(newest||t); if(target){ if(address){target.tripAddress=address; target.address=address;} if(budget)target.budget=budget; saveApp(); } render652(); } }

  // Weather: use destination/address, not a separate destination prompt. Works on HTTPS with open-meteo.
  async function liveWeather(place){ if(!place)return {text:'Add a destination or trip address first.',ok:false}; try{ const geo=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`,{cache:'no-store'}).then(r=>r.json()); const g=geo?.results?.[0]; if(!g)return {text:'Weather could not find that destination. Try city and state, like Mariposa, CA.',ok:false}; const w=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`,{cache:'no-store'}).then(r=>r.json()); const now=Math.round(w?.current?.temperature_2m); const hi=Math.round(w?.daily?.temperature_2m_max?.[0]); const lo=Math.round(w?.daily?.temperature_2m_min?.[0]); const rain=w?.daily?.precipitation_probability_max?.[0]; return {text:`${g.name}${g.admin1?`, ${g.admin1}`:''}: ${Number.isFinite(now)?now+'°F now':''} • High ${Number.isFinite(hi)?hi+'°':''} / Low ${Number.isFinite(lo)?lo+'°':''}${rain!=null?' • Rain chance '+rain+'%':''}`,ok:true}; }catch(e){return {text:'Live weather could not load. Check internet, then try city/state instead of a full address.',ok:false};} }
  window.refreshTripWeather=async function(tripId){ ensure(); const t=(data.trips||[]).find(x=>x.id===tripId) || (typeof byNextTrip==='function'?byNextTrip():null); if(!t)return msg('Add a trip first.'); const box=q(`weather-${t.id}`)||q('dashWeather'); if(box)box.innerHTML='<span class="weatherStatus"><span class="weatherSpinner"></span> Loading live weather...</span>'; const res=await liveWeather(placeFor(t)); t.weather=res.text; t.weatherUpdatedAt=new Date().toISOString(); saveApp(); addNotify(`Weather updated for ${t.name||'trip'}`,'weather'); render652(); };
  window.refreshDashboardWeather=()=>{ const t=typeof byNextTrip==='function'?byNextTrip():(data.trips||[])[0]; if(t)refreshTripWeather(t.id); else msg('Add an adventure first.'); };

  // Voting names always visible; voting tab also works when trips exist but no options yet.
  function voteCount2(v){return Object.keys(v.votes||{}).length + Number(v.legacyCount||0)}
  window.voteTrip=function(tripId,index){ ensure(); const t=(data.trips||[]).find(x=>x.id===tripId); const v=t?.voteOptions?.[index]; if(!v)return; const voter=(data.profile?.name||localStorage.getItem('ofa_voter_name')||prompt('Your name for voting')||'').trim(); if(!voter)return; localStorage.setItem('ofa_voter_name',voter); (t.voteOptions||[]).forEach(o=>{o.votes=o.votes||{}; delete o.votes[voter];}); v.votes=v.votes||{}; v.votes[voter]=new Date().toISOString(); saveApp(); addNotify(`${voter} voted on ${t.name}`,'votes'); render652(); };
  window.addVoteOptionsBulk=function(tripId){ ensure(); const t=(data.trips||[]).find(x=>x.id===tripId); if(!t)return; const opts=(q('voteInput-'+tripId)?.value||'').split(/[\n,]+/).map(s=>s.trim()).filter(Boolean); const links=(q('voteLink-'+tripId)?.value||q('voteLinks-'+tripId)?.value||'').split(/[\n,]+/).map(s=>s.trim()).filter(Boolean); if(!opts.length&&!links.length)return msg('Add a voting option or link first.'); if(!Array.isArray(t.voteOptions))t.voteOptions=[]; const count=Math.max(opts.length,links.length); for(let i=0;i<count;i++){ const text=opts[i]||links[i]||`Option ${i+1}`; const link=links[i]||(/^https?:\/\//i.test(text)?text:''); t.voteOptions.push({id:id(),text,link,votes:{}}); } if(q('voteInput-'+tripId))q('voteInput-'+tripId).value=''; if(q('voteLink-'+tripId))q('voteLink-'+tripId).value=''; if(q('voteLinks-'+tripId))q('voteLinks-'+tripId).value=''; saveApp(); addNotify('New voting option added','votes'); render652(); };
  function votingBlock(t){ return `<div class="voteBox"><h4>Family Voting</h4>${(t.voteOptions||[]).map((v,i)=>`<div class="voteRow"><div><b>${E(v.text)}</b>${v.link?`<br><a href="${E(v.link)}" target="_blank" rel="noopener">Open link</a>`:''}<small class="voteNames">Voted: ${Object.keys(v.votes||{}).map(E).join(', ')||'No one yet'}</small></div><strong>${voteCount2(v)} vote(s)</strong><button onclick="voteTrip('${t.id}',${i})" class="secondary">Vote / Change</button><button onclick="removeVoteOption&&removeVoteOption('${t.id}',${i})" class="secondary">Remove</button></div>`).join('')||'<p class="helperText">No voting options yet. Add options below.</p>'}<div class="voteAdd"><textarea id="voteInput-${t.id}" placeholder="Add choices, one per line"></textarea><textarea id="voteLink-${t.id}" placeholder="Optional links, one per line"></textarea><button onclick="addVoteOptionsBulk('${t.id}')" class="secondary">Add voting option(s)</button></div></div>`; }
  function renderVoting652(){ const box=q('votingList'); if(!box)return; ensure(); box.innerHTML=(data.trips||[]).map(t=>`<div class="card"><h3>${E(t.name||'Adventure')}</h3><p>${E(placeFor(t)||'No destination yet')}</p>${votingBlock(t)}</div>`).join('') || '<div class="card"><p>No trips added yet. Add an adventure first, then return here to add voting options.</p></div>'; }

  // Trip links save in both trip and global links so old dashboard renderers can find them.
  window.addTripLink=function(tripId){ ensure(); const t=(data.trips||[]).find(x=>x.id===tripId); if(!t)return; const title=(q('tripLinkTitle-'+tripId)?.value||'Travel link').trim(); let url=(q('tripLinkUrl-'+tripId)?.value||'').trim(); if(url && !/^https?:\/\//i.test(url))url='https://'+url; if(!url)return msg('Add a travel link first.'); const link={id:id(),tripId:t.id,trip:t.name,title,url,createdAt:new Date().toISOString(),addedBy:me()}; t.tripLinks=t.tripLinks||[]; t.tripLinks.push(link); data.links=data.links||[]; data.links.push(link); saveApp(); addNotify(`Travel link saved: ${title}`,'trips'); render652(); };

  // Group/private list adders. Meal type comes from select, never defaults to dinner unless dinner selected.
  function setupListForms(){ const mt=q('mealTitle'); if(mt){ mt.closest('label')?.classList.add('hidden'); if(!q('mealTypeSelect652')) mt.closest('label')?.insertAdjacentHTML('beforebegin',`<label>Meal type<select id="mealTypeSelect652"><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option><option>Dessert</option><option>Drinks</option><option>Dining out</option><option>Happy hour</option></select></label><label>List type<select id="mealScopeSelect652"><option value="group">Group meal</option><option value="private">Private meal</option></select></label>`); }
    [['groceryItem','groceryScopeSelect652','Group grocery list','Private grocery item'],['packingItem','packingScopeSelect652','Group packing list','Private packing item']].forEach(([anchor,sel,g,p])=>{const a=q(anchor); if(a&&!q(sel))a.insertAdjacentHTML('beforebegin',`<label>List type<select id="${sel}"><option value="group">${g}</option><option value="private">${p}</option></select></label>`);});
    if(q('saveMeal'))q('saveMeal').onclick=()=>addList('meal'); if(q('saveGrocery'))q('saveGrocery').onclick=()=>addList('grocery'); if(q('savePacking'))q('savePacking').onclick=()=>addList('packing'); }
  function addList(kind){ ensure(); const trip=q(kind==='meal'?'mealTrip':kind+'Trip')?.value||'General'; const item=(q(kind==='meal'?'mealItem':kind+'Item')?.value||'').trim(); if(!item)return msg('Add an item first.'); const scope=q(kind==='meal'?'mealScopeSelect652':kind+'ScopeSelect652')?.value||'group'; const person=(q(kind+'Person')?.value||q(kind+'PersonSelect64')?.value||'Volunteer needed').trim(); const obj={id:id(),trip,item,person:scope==='private'?me():person,private:scope==='private',scope,owner:scope==='private'?me():person,addedBy:me(),done:false,createdAt:new Date().toISOString()}; if(kind==='meal'){obj.title=q('mealTypeSelect652')?.value||'Dinner'; obj.mealType=obj.title; data.meals.push(obj); q('mealItem').value=''; addNotify(`${scope==='private'?'Private':'Group'} ${obj.title} added`,'meals');} if(kind==='grocery'){data.groceries.push(obj); q('groceryItem').value=''; addNotify('Grocery item added','meals');} if(kind==='packing'){data.packing.push(obj); q('packingItem').value=''; addNotify('Packing item added','trips');} saveApp(); render652(); }
  function row(key,x,title,sub){return `<div class="item checklistItem"><label class="checkLine"><input type="checkbox" ${x.done?'checked':''} onchange="toggleDone&&toggleDone('${key}','${x.id}')"><span><b>${E(title)}</b><small>${E(sub||'')}</small></span></label><p class="helperText">${x.private?'Private item':'Group item'}${x.person?' • Assigned: '+E(x.person):''}</p><div class="itemActions"><button onclick="editListItem&&editListItem('${key}','${x.id}')" class="secondary smallBtn">Edit</button><button onclick="del&&del('${key}','${x.id}')" class="secondary smallBtn">Delete</button></div></div>`;}
  function renderMeals652(){ const box=q('mealList'); if(!box)return; ensure(); const mine=me(); const vis=x=>!x.private||x.owner===mine||x.addedBy===mine||x.person===mine; const meals=data.meals.filter(vis), groceries=data.groceries.filter(vis); box.innerHTML=`<div class="card"><h3>Group Meal Plan</h3>${meals.filter(x=>!x.private).map(m=>row('meals',m,`${m.mealType||m.title||'Meal'}: ${m.item}`,m.trip)).join('')||'<p>No group meals added yet.</p>'}</div><div class="card"><h3>My Private Meal Plan</h3>${meals.filter(x=>x.private).map(m=>row('meals',m,`${m.mealType||m.title||'Meal'}: ${m.item}`,m.trip)).join('')||'<p>No private meals added yet.</p>'}</div><div class="card"><h3>Group Grocery List</h3>${groceries.filter(x=>!x.private).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No group grocery items added yet.</p>'}</div><div class="card"><h3>My Private Grocery List</h3>${groceries.filter(x=>x.private).map(g=>row('groceries',g,g.item,g.trip)).join('')||'<p>No private grocery items added yet.</p>'}</div>`; }
  function renderPacking652(){ const box=q('packingList'); if(!box)return; const mine=me(); const items=(data.packing||[]).filter(x=>!x.private||x.owner===mine||x.addedBy===mine||x.person===mine); box.innerHTML=`<div class="card"><h3>Group Packing List</h3>${items.filter(x=>!x.private).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No group packing items added yet.</p>'}</div><div class="card"><h3>My Private Packing List</h3>${items.filter(x=>x.private).map(p=>row('packing',p,p.item,p.trip)).join('')||'<p>No private packing items added yet.</p>'}</div>`; }

  // Scrapbook draft editor: photos display from memories and can be selected, reordered, zoom/cropped, removed, framed, stickered.
  const stickers='📷 💕 ❤️ 💛 💙 ⭐ ✨ 🌙 ☀️ 🌈 🏖️ 🐚 🌊 ⚓ 🗼 🏕️ 🔥 🌲 ⛰️ 🥾 🛶 🚤 🎣 🐟 🐐 🐾 🦋 🌻 🌸 🎂 🎈 🎉 🇺🇸 🎆 🎄 🎃 🦃 ❄️ 🍔 🌭 🍕 🍦 🍹 🍻 🥂 🧭 🗺️ 📍 ✈️ 🧳 😎 😂 🥰 🙌'.split(' ');
  const frameTypes=['soft','polaroid','heart','scallop','star','moon','sun','wood'];
  let draft={photos:[],layout:'grid',frame:'soft',bg:'seaGlass',stickers:[],texts:[],zooms:{}};
  function imgPool(){ const out=[]; (data.memories||[]).forEach(m=>(m.media||[]).forEach((media,i)=>{ let src=typeof media==='string'?media:(media.src||media.url||media.data||''); const type=(media.type||'').toLowerCase(); if(src && (src.startsWith('data:image')||src.startsWith('http')||src.startsWith('./')||type==='image'))out.push({id:media.id||`${m.id}-${i}`,src,title:m.title||m.memoryTitle||'Memory'}); })); return out; }
  function installScrapbook652(){ const host=q('scrapbookPhotoPicker'); if(!host||host.dataset.v652)return; host.dataset.v652='1'; host.innerHTML=`<h3>Draft Scrapbook Page</h3><p>Select photos, rearrange them, crop/zoom, add frames, add moveable/resizable stickers, then save the page.</p><div class="scrapDraftStudio"><div class="scrapTopTools"><label>Layout<select id="draftLayout652"><option value="grid">Grid</option><option value="feature">Feature Photo</option><option value="collage">Collage</option><option value="freeform">Freeform</option></select></label><label>Frame category<select id="draftFrame652">${frameTypes.map(f=>`<option value="${f}">${f}</option>`).join('')}</select></label><label>Background<select id="draftBg652"><option value="seaGlass">Sea Glass</option><option value="sunset">Sunset</option><option value="sand">Beach Sand</option><option value="roseGold">Rose Gold</option><option value="lighthouse">Lighthouse</option></select></label><button id="addDraftText652" class="secondary">Add Text</button></div><h4>Pick Photos</h4><div id="draftPhotoChoices652" class="scrapPhotoPickerGrid"></div><h4>Selected Photos — rearrange / crop / remove</h4><div id="draftStrip652" class="draftStrip"></div><h4>Frames / Cutouts</h4><div class="framePalette">${frameTypes.map(f=>`<button class="secondary" data-frame652="${f}">${f}</button>`).join('')}</div><h4>Stickers & Emojis</h4><div class="stickerPalette">${stickers.map(s=>`<button class="secondary" data-sticker652="${s}">${s}</button>`).join('')}</div><div id="draftCanvas652" class="scrapCanvas"></div></div>`; ['draftLayout652','draftFrame652','draftBg652'].forEach(x=>q(x).onchange=()=>renderDraft()); q('addDraftText652').onclick=()=>{const text=prompt('Text for this scrapbook page',q('pageTextBox')?.value||''); if(text){draft.texts.push({id:id(),text,x:34,y:80,size:22});renderDraft();}}; qa('[data-sticker652]').forEach(b=>b.onclick=()=>{draft.stickers.push({id:id(),emoji:b.dataset.sticker652,x:40+draft.stickers.length*12,y:260,size:46});renderDraft();}); qa('[data-frame652]').forEach(b=>b.onclick=()=>{draft.frame=b.dataset.frame652; q('draftFrame652').value=draft.frame; renderDraft();}); if(q('savePage'))q('savePage').onclick=saveScrapPage652; renderDraftChoices(); renderDraft(); }
  function renderDraftChoices(){ const pool=imgPool(), box=q('draftPhotoChoices652'); if(!box)return; box.innerHTML=pool.length?pool.map(p=>`<button class="scrapPick ${draft.photos.includes(p.id)?'selected':''}" data-pick="${p.id}"><img src="${p.src}"><small>${E(p.title)}</small></button>`).join(''):'<p class="helperWarn">No photos found yet. Add photos under Memories first, then come back here.</p>'; box.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const pid=b.dataset.pick; draft.photos=draft.photos.includes(pid)?draft.photos.filter(x=>x!==pid):[...draft.photos,pid]; renderDraftChoices(); renderDraft();}); }
  window.scrapMove652=function(i,d){const j=i+d;if(j<0||j>=draft.photos.length)return; [draft.photos[i],draft.photos[j]]=[draft.photos[j],draft.photos[i]]; renderDraft(); renderDraftChoices();}; window.scrapRemove652=function(pid){draft.photos=draft.photos.filter(x=>x!==pid); renderDraft(); renderDraftChoices();}; window.scrapZoom652=function(pid,delta){draft.zooms[pid]=Math.max(.7,Math.min(2.4,(draft.zooms[pid]||1)+delta)); renderDraft();};
  function renderStrip(pool){ const strip=q('draftStrip652'); if(!strip)return; strip.innerHTML=draft.photos.map((pid,i)=>{const p=pool.find(x=>x.id===pid); return p?`<div class="draftStripItem"><img src="${p.src}"><div><button onclick="scrapMove652(${i},-1)" class="secondary smallBtn">←</button><button onclick="scrapMove652(${i},1)" class="secondary smallBtn">→</button><button onclick="scrapZoom652('${pid}',.1)" class="secondary smallBtn">Crop +</button><button onclick="scrapZoom652('${pid}',-.1)" class="secondary smallBtn">Crop -</button><button onclick="scrapRemove652('${pid}')" class="secondary smallBtn">Remove</button></div></div>`:''}).join('')||'<p>No photos selected yet.</p>'; }
  function renderDraft(){ const pool=imgPool(); renderStrip(pool); const canvas=q('draftCanvas652'); if(!canvas)return; draft.layout=q('draftLayout652')?.value||draft.layout; draft.frame=q('draftFrame652')?.value||draft.frame; draft.bg=q('draftBg652')?.value||draft.bg; canvas.className=`scrapCanvas layout-${draft.layout} bg-${draft.bg}`; canvas.innerHTML=`<h3>${E(q('pageTitle')?.value||'Draft Scrapbook Page')}</h3><div class="photoLayer">${draft.photos.map(pid=>{const p=pool.find(x=>x.id===pid); return p?`<div class="scrapPhotoBox frame-${draft.frame}"><img src="${p.src}" style="--zoom:${draft.zooms[pid]||1}"><button class="secondary smallBtn" onclick="scrapRemove652('${pid}')">Remove</button></div>`:''}).join('')}</div><p>${E(q('pageNote')?.value||'')}</p>${draft.stickers.map(s=>`<span class="movableSticker" data-move="${s.id}" style="left:${s.x}px;top:${s.y}px;font-size:${s.size}px">${s.emoji}<span class="resizeHandle">↘</span></span>`).join('')}${draft.texts.map(t=>`<span class="movableText" data-move="${t.id}" style="left:${t.x}px;top:${t.y}px;font-size:${t.size}px">${E(t.text)}<span class="resizeHandle">↘</span></span>`).join('')}`; makeMove(canvas); }
  function makeMove(canvas){ canvas.querySelectorAll('[data-move]').forEach(el=>{ const obj=[...draft.stickers,...draft.texts].find(x=>x.id===el.dataset.move); if(!obj)return; let start=null; el.onpointerdown=e=>{e.preventDefault(); start=e.target.classList.contains('resizeHandle')?{resize:true,x:e.clientX,size:obj.size}:{x:e.clientX,y:e.clientY,left:obj.x,top:obj.y}; el.setPointerCapture(e.pointerId);}; el.onpointermove=e=>{ if(!start)return; if(start.resize)obj.size=Math.max(18,Math.min(132,start.size+(e.clientX-start.x)/2)); else{obj.x=Math.max(0,start.left+e.clientX-start.x);obj.y=Math.max(0,start.top+e.clientY-start.y);} renderDraft();}; el.onpointerup=()=>{start=null}; el.ondblclick=()=>{draft.stickers=draft.stickers.filter(x=>x.id!==obj.id);draft.texts=draft.texts.filter(x=>x.id!==obj.id);renderDraft();}; }); }
  function saveScrapPage652(){ ensure(); const pool=imgPool(); const photos=draft.photos.map(pid=>{const p=pool.find(x=>x.id===pid);return p&&{id:pid,src:p.src,zoom:draft.zooms[pid]||1}}).filter(Boolean); if(!photos.length)return msg('Select at least one photo for the scrapbook page.'); data.pages.push({id:id(),title:q('pageTitle')?.value||'Scrapbook Page',note:q('pageNote')?.value||'',theme:q('pageTheme')?.value||'',layout:draft.layout,frame:draft.frame,bg:draft.bg,photos:photos.map(p=>p.src),photoItems:photos,stickers:JSON.parse(JSON.stringify(draft.stickers)),texts:JSON.parse(JSON.stringify(draft.texts)),createdAt:new Date().toISOString(),version:VERSION}); draft={photos:[],layout:'grid',frame:'soft',bg:'seaGlass',stickers:[],texts:[],zooms:{}}; saveApp(); addNotify('Scrapbook page saved','scrapbook'); render652(); }
  function renderPages652(){ const box=q('scrapbookPages'); if(!box)return; box.innerHTML=(data.pages||[]).map(p=>`<div class="scrapPage scrapCanvas layout-${E(p.layout||'grid')} bg-${E(p.bg||'seaGlass')}"><h3>${E(p.title)}</h3><div class="photoLayer">${(p.photoItems||p.photos||[]).map((ph,i)=>{const src=typeof ph==='string'?ph:ph.src; const zoom=typeof ph==='string'?1:(ph.zoom||1); return `<div class="scrapPhotoBox frame-${E(p.frame||'soft')}"><img src="${src}" style="--zoom:${zoom}"></div>`}).join('')}</div><p>${E(p.note||'')}</p>${(p.stickers||[]).map(s=>`<span class="movableSticker" style="left:${s.x}px;top:${s.y}px;font-size:${s.size}px">${s.emoji}</span>`).join('')}${(p.texts||[]).map(t=>`<span class="movableText" style="left:${t.x}px;top:${t.y}px;font-size:${t.size}px">${E(t.text)}</span>`).join('')}<div class="scrapTools noPrint"><button onclick="window.print()" class="secondary">Print / PDF</button><button onclick="del&&del('pages','${p.id}')" class="secondary">Delete</button></div></div>`).join('')||'<div class="card"><p>No scrapbook pages yet.</p></div>'; }

  // Explore map panel with pins.
  function ensureExplore(){ if(q('explore'))return; const after=q('chat')||q('packing')||q('meals'); after?.insertAdjacentHTML('afterend',`<section id="explore" class="page"><div class="pageHead"><h2>Explore Map</h2><p>Saved places, trip pins, and directions.</p></div><div class="card formCard"><h3>Add Map Pin</h3><label>Pin name<input id="pinName" placeholder="Beach house, restaurant, trailhead..."></label><label>Address or place<input id="pinAddress" placeholder="Place or full address"></label><button id="savePin652" class="primary">Add Pin</button></div><div id="exploreMap" class="exploreMapPanel"></div></section>`); const nav=document.querySelector('.bottomNav,.drawerNav'); if(nav&&!document.querySelector('[data-go="explore"]'))nav.insertAdjacentHTML('beforeend','<button data-go="explore">🗺️<span>Explore</span></button>'); const grid=document.querySelector('.storybookGrid'); if(grid&&!grid.querySelector('[data-go="explore"]'))grid.insertAdjacentHTML('beforeend','<button data-go="explore" class="storybookCard">🗺️<span>Explore Map</span><small>View pins and open directions.</small></button>'); if(q('savePin652'))q('savePin652').onclick=()=>{const name=q('pinName').value.trim()||'Saved place'; const address=q('pinAddress').value.trim(); if(!address)return msg('Add an address or place first.'); data.pins.push({id:id(),name,address,createdAt:new Date().toISOString(),addedBy:me()}); saveApp(); render652();}; }
  function renderExplore(){ const box=q('exploreMap'); if(!box)return; ensure(); const tripPins=(data.trips||[]).map(t=>placeFor(t)?{id:t.id,name:t.name,address:placeFor(t),trip:t.name}:null).filter(Boolean); const pins=[...tripPins,...(data.pins||[])]; const first=pins[0]?.address||''; box.innerHTML=first?`${mapCard(first,'Map with saved pins')}<div class="explorePinList">${pins.map(p=>`<div class="explorePin"><b>${E(p.name)}</b><br><small>${E(p.address)}</small><br><a class="secondary" href="${directionsUrl(p.address)}" target="_blank">Directions</a></div>`).join('')}</div>`:'<p class="helperWarn">No pins yet. Add a trip destination or save a map pin.</p>'; }

  // Notifications center + app badge + local phone notification when permission granted and app is open.
  function addNotify(text,type='general',system=false){ ensure(); const n={id:id(),text,type,read:false,at:new Date().toISOString(),user:profileEmail()||me()}; data.notifications.unshift(n); data.notifications=data.notifications.slice(0,80); saveApp(); updateBadge(); if(Notification?.permission==='granted' && !document.hasFocus()){ try{navigator.serviceWorker?.ready?.then(reg=>reg.showNotification('Our Family Adventures',{body:text,icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:n.id,data:{url:location.href}}));}catch{} } }
  window.addAppNotification=addNotify; window.addNotification651=addNotify; window.markNotificationRead652=function(nid){const n=data.notifications.find(x=>x.id===nid); if(n)n.read=true; saveApp(); renderNotifications();};
  function ensureNotifUI(){ if(!q('notifyBell652'))document.body.insertAdjacentHTML('beforeend',`<button id="notifyBell652" class="roundBtn notificationBell" title="Notifications">🔔<span id="notifyCount652" class="notifyDot" hidden>0</span></button><div id="notificationPanel652" class="chatPopout hidden"><div class="chatHeader"><b>Notifications</b><button id="closeNotify652">×</button></div><div id="notificationList652"></div></div>`); q('notifyBell652').onclick=()=>{renderNotifications();q('notificationPanel652').classList.toggle('hidden')}; q('closeNotify652').onclick=()=>q('notificationPanel652').classList.add('hidden'); if(q('enableNotifications'))q('enableNotifications').onclick=async()=>{ if('Notification'in window){await Notification.requestPermission();} addNotify('Notifications are enabled in the app. Phone screen notifications work while the installed app/browser is allowed to send notifications.','system',true); renderNotifications();}; }
  function updateBadge(){ const unread=(data.notifications||[]).filter(n=>!n.read).length; const b=q('notifyCount652'); if(b){b.hidden=!unread;b.textContent=unread;} try{navigator.setAppBadge?navigator.setAppBadge(unread):navigator.clearAppBadge&&unread===0&&navigator.clearAppBadge();}catch{} }
  function renderNotifications(){ const list=q('notificationList652'); if(!list)return; list.innerHTML=(data.notifications||[]).map(n=>`<div class="item ${n.read?'':'unread'}"><b>${E(n.type||'Notice')}</b><p>${E(n.text)}</p><small>${new Date(n.at).toLocaleString()}</small><br><button class="secondary smallBtn" onclick="markNotificationRead652('${n.id}')">Mark read</button></div>`).join('')||'<p>No notifications yet.</p>'; updateBadge(); }

  // Profile editor allows name, phone, photo, and contact email. Firebase Auth email update attempted when signed in.
  function ensureProfileEditor(){ const people=q('people'); if(!people||q('profileEditor652'))return; people.insertAdjacentHTML('afterbegin',`<div id="profileEditor652" class="profileEditor651 card"><h3>My Profile</h3><div class="twoCols"><div><img id="profilePhotoPreview652" class="profilePhotoPreview" src="icons/icon-192.png" alt="Profile photo"></div><div><label>Name<input id="profileName652"></label><label>Email address<input id="profileEmail652" type="email"></label><label>Phone<input id="profilePhone652" type="tel"></label><label>Profile photo<input id="profilePhoto652" type="file" accept="image/*"></label><button id="saveProfile652" class="primary">Save My Profile</button><p class="helperText">Changing your login email may require recent sign-in. If Firebase blocks the login email change, your profile contact email will still save.</p></div></div></div>`); q('profilePhoto652').onchange=e=>{const f=e.target.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{data.profile.photo=r.result; q('profilePhotoPreview652').src=r.result;}; r.readAsDataURL(f);}; q('saveProfile652').onclick=saveProfile652; fillProfileForm(); }
  function fillProfileForm(){ ensure(); q('profileName652')&&(q('profileName652').value=data.profile.name||me()); q('profileEmail652')&&(q('profileEmail652').value=data.profile.email||profileEmail()); q('profilePhone652')&&(q('profilePhone652').value=data.profile.phone||''); q('profilePhotoPreview652')&&(q('profilePhotoPreview652').src=data.profile.photo||'icons/icon-192.png'); }
  async function saveProfile652(){ ensure(); const email=q('profileEmail652').value.trim(); data.profile.name=q('profileName652').value.trim()||me(); data.profile.email=email; data.profile.phone=q('profilePhone652').value.trim(); try{ const user=firebase?.auth?.().currentUser; if(user){ if(user.updateProfile)await user.updateProfile({displayName:data.profile.name,photoURL:data.profile.photo||user.photoURL}); if(email && email!==user.email && user.updateEmail)await user.updateEmail(email); } }catch(e){ msg('Profile saved. Firebase login email may require signing out and back in before it can change.'); } saveApp(); addNotify('Profile updated','profile'); render652(); }

  function renderTrips652(){ const box=q('tripList'); if(!box)return; ensure(); box.innerHTML=(data.trips||[]).map(t=>{const place=placeFor(t); const links=[...(t.tripLinks||[]),...(data.links||[]).filter(l=>l.tripId===t.id||l.trip===t.name)]; return `<div class="item tripCard"><h3>${E(t.name)}</h3><p>${E(t.destination||'')} ${t.start?`• ${E(t.start)} to ${E(t.end||'')}`:''}</p>${mapCard(place,t.name||'Trip map')}<div id="weather-${t.id}" class="weatherLiveCard"><b>Live Weather</b><p>${E(t.weather||'Tap Refresh Live Weather to load the forecast.')}</p><button onclick="refreshTripWeather('${t.id}')" class="secondary">Refresh Live Weather</button></div><div class="linkBox"><h4>Travel Links</h4>${links.length?links.map(l=>`<div class="linkRow"><a href="${E(l.url)}" target="_blank" rel="noopener">${E(l.title||l.url)}</a><button onclick="removeTripLink&&removeTripLink('${t.id}','${l.id}')" class="secondary smallBtn">Remove</button></div>`).join(''):'<p>No travel links saved yet.</p>'}<div class="voteAdd"><input id="tripLinkTitle-${t.id}" placeholder="Link title"><input id="tripLinkUrl-${t.id}" placeholder="website.com or https://..."><button onclick="addTripLink('${t.id}')" class="secondary">Add travel link</button></div></div>${votingBlock(t)}<div class="itemActions"><button onclick="editTrip&&editTrip('${t.id}')" class="primary">Edit Trip</button><button onclick="openTripMap652('${t.id}')" class="secondary">Open Directions</button><button onclick="del&&del('trips','${t.id}')" class="secondary">Delete</button></div></div>`}).join('')||'<div class="card"><p>No trips added yet. Add an adventure first.</p></div>'; }
  window.openTripMap652=function(tripId){ const t=(data.trips||[]).find(x=>x.id===tripId); const p=placeFor(t||{}); if(!p)return msg('Add a destination or address first.'); data.pins=data.pins||[]; if(!data.pins.some(x=>x.address===p))data.pins.push({id:id(),name:t.name,address:p,trip:t.name,createdAt:new Date().toISOString()}); saveApp(); window.open(directionsUrl(p),'_blank'); };

  function patchDashboard(){ const btn=q('refreshWeatherBtn'); if(btn&&!btn.dataset.v652){btn.dataset.v652='1';btn.onclick=window.refreshDashboardWeather;} const t=typeof byNextTrip==='function'?byNextTrip():(data.trips||[])[0]; if(q('dashWeather')&&t){q('dashWeather').innerHTML=`<b>Live Weather</b><p>${E(t.weather||'Tap refresh to load live weather.')}</p>`;} if(q('dashMaps')&&t)q('dashMaps').innerHTML=mapCard(placeFor(t),t.name||'Trip map'); }

  const oldRender=window.render;
  function render652(){ if(!ensure())return; try{oldRender&&oldRender();}catch(e){console.warn('old render failed',e)} setupListForms(); installScrapbook652(); ensureExplore(); ensureNotifUI(); ensureProfileEditor(); renderTrips652(); renderVoting652(); renderMeals652(); renderPacking652(); renderPages652(); renderDraftChoices(); renderDraft(); renderExplore(); renderNotifications(); patchDashboard(); if(typeof bindNav==='function'){try{bindNav()}catch{}} qa('[data-go]').forEach(b=>b.onclick=()=>{if(typeof show==='function')show(b.dataset.go); setTimeout(render652,50);}); }
  window.render=render652;
  document.addEventListener('DOMContentLoaded',()=>{ensure(); patchTripSave(); setupListForms(); installScrapbook652(); ensureExplore(); ensureNotifUI(); ensureProfileEditor(); render652();});
  setTimeout(()=>{ensure(); patchTripSave(); render652();},600);
})();
/* ===== END ofa-6.5.2.js ===== */


/* ===== BEGIN ofa-6.5.3.js ===== */
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
/* ===== END ofa-6.5.3.js ===== */


/* ===== BEGIN ofa-6.5.4.js ===== */
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
/* ===== END ofa-6.5.4.js ===== */


/* ===== BEGIN ofa-6.5.5.js ===== */
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
/* ===== END ofa-6.5.5.js ===== */


/* ===== BEGIN ofa-6.6.0.js ===== */
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
/* ===== END ofa-6.6.0.js ===== */


/* ===== BEGIN ofa-6.6.1.js ===== */
/* Our Family Adventures 6.6.1 — fixes from screenshots: meal dropdowns, duplicate links/votes, weather geocoding, scrapbook draft/edit, people merge */
(function(){
  'use strict';
  const VERSION='6.6.1';
  const $=id=>document.getElementById(id);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const now=()=>new Date().toISOString();
  const toastMsg=m=>{try{typeof toast==='function'?toast(m):console.log(m)}catch{console.log(m)}};
  const me=()=>{try{return data?.profile?.name||firebase?.auth?.().currentUser?.displayName||firebase?.auth?.().currentUser?.email||localStorage.getItem('ofa_family_user')||'Family member'}catch{return 'Family member'}};
  function ensure(){ if(!window.data)return false; ['people','trips','memories','pages','links','meals','groceries','packing','pins','chat','activity','notifications'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]}); data.trips.forEach(t=>{if(!Array.isArray(t.tripLinks))t.tripLinks=[]; if(!Array.isArray(t.voteOptions))t.voteOptions=[]}); return true; }
  function saveNow(){try{if(typeof normalizeData==='function')normalizeData()}catch{}; try{localStorage.setItem('ofaDataFinalV4',JSON.stringify(data)); localStorage.setItem('ofaData',JSON.stringify(data));}catch{}; try{ if(typeof queueFirebaseSave==='function')queueFirebaseSave(); else if(typeof pushFirebaseData==='function')pushFirebaseData(); else if(typeof save==='function')save(); }catch(e){console.warn(e)} }
  function prettyDate(d){ if(!d)return ''; const x=new Date(String(d).slice(0,10)+'T12:00:00'); return isNaN(x)?String(d):x.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'}); }
  function dateRange(start,end){ const out=[]; if(!start)return out; const s=new Date(start+'T12:00:00'), e=new Date((end||start)+'T12:00:00'); if(isNaN(s)||isNaN(e))return out; for(let d=new Date(s); d<=e; d.setDate(d.getDate()+1)){out.push(d.toISOString().slice(0,10)); if(out.length>45)break;} return out; }
  function mealTypes(i,total){ if(total<=1)return ['Breakfast','Lunch','Dinner','Snack']; if(i===0)return ['Lunch','Dinner','Snack']; if(i===total-1)return ['Breakfast','Lunch']; return ['Breakfast','Lunch','Dinner','Snack']; }
  function currentTrip(){ const v=$('mealTrip661')?.value||$('mealTrip')?.value; return data.trips.find(t=>String(t.id)===v||t.name===v)||data.trips[0]||null; }
  function normUrl(u){ u=String(u||'').trim(); if(!u)return ''; if(!/^https?:\/\//i.test(u))u='https://'+u; return u; }
  function keyLink(l){return ((l.url||'').replace(/\/$/,'')+'|'+(l.title||'').trim()+'|'+(l.tripId||l.trip||'')).toLowerCase();}
  function dedupeAll(){ if(!ensure())return; const seenP=new Set(); data.people=data.people.filter(p=>{const k=(p.email||'').toLowerCase().trim()||String(p.phone||'').replace(/\D/g,'')||String(p.name||'').toLowerCase().trim(); if(!k)return true; if(seenP.has(k))return false; seenP.add(k); return true;}); const seenL=new Set(); data.links=data.links.filter(l=>{const k=keyLink(l); if(seenL.has(k))return false; seenL.add(k); return true;}); data.trips.forEach(t=>{const seenTL=new Set(); t.tripLinks=(t.tripLinks||[]).filter(l=>{const k=keyLink({...l,tripId:t.id}); if(seenTL.has(k))return false; seenTL.add(k); return true;}); const seenV=new Set(); t.voteOptions=(t.voteOptions||[]).filter(v=>{const k=((v.text||'').trim()+'|'+(v.link||v.url||'')).toLowerCase(); if(!k.trim())return false; if(seenV.has(k))return false; seenV.add(k); if(!v.votes)v.votes={}; return true;}); }); }

  function fixButtonsNoRefresh(){ document.addEventListener('click',e=>{const b=e.target.closest('button'); if(!b)return; const txt=(b.textContent||'').toLowerCase(); if(/add travel link|save link|add voting|add vote|add option|add meal|add grocery/i.test(txt)){e.preventDefault(); e.stopPropagation();}},true); }

  function patchTripDates(){ const start=$('tripStart'), end=$('tripEnd'); if(!start||!end||start.dataset.v661)return; start.dataset.v661='1'; start.addEventListener('change',()=>{ if(start.value){ end.min=start.value; if(!end.value || end.value<start.value) end.value=start.value; }}); }

  function enhanceMealUI(){ if(!ensure())return; const section=$('meals'); if(!section)return; const form=section.querySelector('.formCard'); if(form&&!$('mealDate661')){
      const titleLabel=$('mealTitle')?.closest('label');
      titleLabel?.insertAdjacentHTML('afterend',`<div class="twoCols mealDropdown661"><label>Date<select id="mealDate661"></select></label><label>Meal<select id="mealType661"><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option><option>Dessert</option><option>Drinks</option><option>Dining Out</option></select></label></div><label>Meal list<select id="mealScope661"><option value="group">Group meal list</option><option value="private">My private meal list</option></select></label>`);
      $('mealTrip')?.addEventListener('change',fillMealDates661);
    }
    fillMealDates661(); const btn=$('saveMeal'); if(btn&&!btn.dataset.v661){btn.dataset.v661='1'; btn.onclick=function(ev){ev&&ev.preventDefault(); const trip=$('mealTrip')?.value||currentTrip()?.name||'General'; const date=$('mealDate661')?.value||''; const type=$('mealType661')?.value||$('mealTitle')?.value||'Meal'; const scope=$('mealScope661')?.value||'group'; const item=($('mealItem')?.value||'').trim()||type; const person=($('mealPerson')?.value||'').trim()||'Volunteer needed'; data.meals.push({id:uid(),trip,date,mealDate:date,title:type,mealType:type,item,person,scope,private:scope==='private',owner:scope==='private'?me():person,addedBy:me(),done:false,createdAt:now()}); if($('mealItem'))$('mealItem').value=''; if($('mealPerson'))$('mealPerson').value=''; saveNow(); render(); toastMsg('Meal added');};}
  }
  function fillMealDates661(){ const sel=$('mealDate661'); if(!sel)return; const trip=(data.trips||[]).find(t=>t.name===$('mealTrip')?.value||t.id===$('mealTrip')?.value)||currentTrip(); const dates=trip?dateRange(trip.start,trip.end):[]; sel.innerHTML=dates.length?dates.map(d=>`<option value="${d}">${esc(prettyDate(d))}</option>`).join(''):'<option value="">Add trip dates first</option>'; }
  function rowMeal(m){return `<div class="item mealRow"><b>${esc(prettyDate(m.date||m.mealDate))} ${esc(m.mealType||m.title||'Meal')}</b><br>${esc(m.item||'Meal item')}<br><small>${esc(m.person||'Volunteer needed')} • ${esc(m.trip||'General')}</small><button onclick="deleteMeal661('${m.id}')" class="secondary smallBtn">Delete</button></div>`;}
  window.deleteMeal661=id=>{data.meals=data.meals.filter(m=>m.id!==id); saveNow(); render();};
  window.renderMeals=function(){ const box=$('mealList'); if(!box)return; ensure(); const mine=me(); const group=data.meals.filter(m=>m.scope!=='private'&&!m.private); const priv=data.meals.filter(m=>m.scope==='private'||m.private||m.owner===mine); const groGroup=data.groceries.filter(g=>g.scope!=='private'&&!g.private); const groPriv=data.groceries.filter(g=>g.scope==='private'||g.private||g.owner===mine); box.innerHTML=`<div class="card"><h3>Group Meal List</h3>${group.map(rowMeal).join('')||'<p>No group meals yet.</p>'}</div><div class="card"><h3>My Private Meal List</h3>${priv.map(rowMeal).join('')||'<p>No private meals yet.</p>'}</div><div class="card"><h3>Group Grocery List</h3>${groGroup.map(g=>`<div class="item"><b>${esc(g.item)}</b><br><small>${esc(g.person||'Unassigned')} • ${esc(g.trip||'General')}</small></div>`).join('')||'<p>No group groceries yet.</p>'}</div><div class="card"><h3>My Private Grocery List</h3>${groPriv.map(g=>`<div class="item"><b>${esc(g.item)}</b><br><small>${esc(g.person||'You')} • ${esc(g.trip||'General')}</small></div>`).join('')||'<p>No private groceries yet.</p>'}</div>`; };

  window.addTripLink=function(id){ ensure(); const t=data.trips.find(x=>x.id===id); if(!t)return; const title=($(`tripLinkTitle-${id}`)?.value||'Trip link').trim(); const url=normUrl($(`tripLinkUrl-${id}`)?.value); if(!url)return toastMsg('Add the link first.'); const link={id:uid(),trip:t.name,tripId:t.id,title,url,createdAt:now(),addedBy:me()}; t.tripLinks=t.tripLinks||[]; t.tripLinks.push(link); data.links.push(link); dedupeAll(); saveNow(); render(); toastMsg('Travel link saved once'); };
  if(typeof window.tripLinkRows!=='function') window.tripLinkRows=function(t){ const map=new Map(); [...(t.tripLinks||[]),...data.links.filter(l=>l.tripId===t.id||l.trip===t.name)].forEach(l=>map.set(keyLink(l),l)); const arr=[...map.values()]; return arr.length?arr.map(l=>`<div class="linkRow"><a href="${esc(normUrl(l.url))}" target="_blank" rel="noopener">${esc(l.title||'Travel link')}</a><button onclick="removeTripLink661('${t.id}','${l.id}')" class="secondary smallBtn">Remove</button></div>`).join(''):'<p>No trip links yet.</p>'; };
  window.removeTripLink661=function(tid,lid){ const t=data.trips.find(x=>x.id===tid); if(t)t.tripLinks=(t.tripLinks||[]).filter(l=>l.id!==lid); data.links=data.links.filter(l=>l.id!==lid); saveNow(); render(); };
  function patchSaveLink(){ const b=$('saveLink'); if(!b||b.dataset.v661)return; b.dataset.v661='1'; b.onclick=function(ev){ev&&ev.preventDefault(); const title=($('linkTitle')?.value||'Travel link').trim(); const url=normUrl($('linkUrl')?.value); if(!url)return toastMsg('Add the travel link first.'); const tripName=$('linkTrip')?.value||'General'; const t=data.trips.find(x=>x.name===tripName||x.id===tripName); const link={id:uid(),trip:t?.name||tripName,tripId:t?.id||'',title,url,createdAt:now(),addedBy:me()}; data.links.push(link); if(t){t.tripLinks=t.tripLinks||[]; t.tripLinks.push(link);} $('linkTitle').value=''; $('linkUrl').value=''; dedupeAll(); saveNow(); render(); toastMsg('Travel link saved');}; }
  window.renderTravel=function(){ const box=$('travelList'); if(!box)return; dedupeAll(); box.innerHTML=(data.links||[]).map(l=>`<div class="item"><h3>${esc(l.title||'Travel link')}</h3><p>${esc(l.trip||'General')}</p><a href="${esc(normUrl(l.url))}" target="_blank" rel="noopener">Open link</a><br><button onclick="del('links','${l.id}')" class="secondary">Delete</button></div>`).join('')||'<div class="card"><p>No travel links yet.</p></div>'; };

  window.addVoteOptionsBulk=function(tripId){ ensure(); const t=data.trips.find(x=>x.id===tripId); if(!t)return; const txt=($(`voteInput-${tripId}`)?.value||'').split(/\n|,/).map(s=>s.trim()).filter(Boolean); const links=($(`voteLinks-${tripId}`)?.value||$(`voteLink-${tripId}`)?.value||'').split(/\n|,/).map(s=>normUrl(s)).filter(Boolean); if(!txt.length&&!links.length)return toastMsg('Add a voting option first.'); t.voteOptions=t.voteOptions||[]; (txt.length?txt:links.map((_,i)=>`Link option ${i+1}`)).forEach((text,i)=>t.voteOptions.push({id:uid(),text,link:links[i]||'',votes:{},createdAt:now(),addedBy:me()})); if($(`voteInput-${tripId}`))$(`voteInput-${tripId}`).value=''; if($(`voteLinks-${tripId}`))$(`voteLinks-${tripId}`).value=''; if($(`voteLink-${tripId}`))$(`voteLink-${tripId}`).value=''; dedupeAll(); saveNow(); render(); toastMsg('Voting option saved'); };

  function geocodeCandidates(place){ const p=String(place||'').trim(); const parts=p.split(',').map(x=>x.trim()).filter(Boolean); const out=[p]; if(parts.length>=3)out.push(parts[1]+', '+parts[2].replace(/\d{5}.*/,'')); if(parts.length>=2)out.push(parts.slice(-2).join(', ').replace(/\d{5}.*/,'')); const zip=(p.match(/\b\d{5}\b/)||[])[0]; if(zip)out.push(zip); return [...new Set(out.filter(Boolean))]; }
  async function liveWeather661(place){ for(const q of geocodeCandidates(place)){ try{ const g=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`).then(r=>r.json()); const r=g.results&&g.results[0]; if(!r)continue; const w=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${r.latitude}&longitude=${r.longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`).then(r=>r.json()); return `${r.name}${r.admin1?', '+r.admin1:''}: ${Math.round(w.current.temperature_2m)}°F now. High ${Math.round(w.daily.temperature_2m_max[0])}° / Low ${Math.round(w.daily.temperature_2m_min[0])}° • Rain ${Math.round(w.daily.precipitation_probability_max[0]||0)}%`; }catch(e){console.warn(e)} } return 'Live weather could not find that destination. Try city and state, such as Dunmore, PA.'; }
  window.refreshTripWeather=async function(id){ const t=data.trips.find(x=>x.id===id)||data.trips[0]; if(!t)return; toastMsg('Loading live weather...'); const place=t.address||t.tripAddress||t.destination||t.name; t.weather=await liveWeather661(place); t.weatherUpdatedAt=now(); saveNow(); render(); };

  function imageMedia661(){ const out=[]; (data.memories||[]).forEach(m=>(m.media||[]).forEach((mm,i)=>{const src=mm.src||mm.url||mm.dataUrl||mm; if(src&&String(src).startsWith('data:image')||/^https?:|^blob:/.test(String(src)))out.push({id:mm.id||`${m.id}-${i}`,src,title:m.title||'Memory'});})); return out; }
  function draftPhotos(){ const imgs=imageMedia661(); try{return imgs.filter(x=>window.selectedScrapPhotos?.includes(x.id));}catch{return []} }
  function renderDraft661(){ const host=$('scrapbookPhotoPicker')||$('scrapbookPages')?.parentElement; if(!host)return; let box=$('draftPage661'); if(!box){host.insertAdjacentHTML('afterend',`<div id="draftPage661" class="card draftPage661"><h3>Draft Scrapbook Page</h3><div id="draftCanvas661" class="draftCanvas661"></div><div class="buttonRow noPrint"><button id="saveDraftPage661" class="primary">Save Draft as Scrapbook Page</button><button id="clearDraft661" class="secondary">Clear Draft</button></div></div>`); box=$('draftPage661'); $('clearDraft661').onclick=()=>{try{window.selectedScrapPhotos=[]}catch{}; renderDraft661();}; $('saveDraftPage661').onclick=()=>{const photos=draftPhotos().map(x=>x.src); const page={id:uid(),title:$('pageTitle')?.value||'Scrapbook Page',note:$('pageNote')?.value||'',theme:$('pageTheme')?.value||'Beach Day',layout:$('pageLayout')?.value||'freeform',frame:$('pageFrame')?.value||'soft',photos,stickers:[],createdAt:now()}; data.pages.push(page); try{window.selectedScrapPhotos=[]}catch{}; saveNow(); render(); toastMsg('Scrapbook page saved');}; }
    const photos=draftPhotos(); $('draftCanvas661').innerHTML=photos.length?photos.map((p,i)=>`<img class="draftPhoto661" src="${p.src}" style="left:${8+(i%2)*44}%;top:${8+Math.floor(i/2)*32}%;width:40%;">`).join(''):'<p>Select photos above to preview and edit before saving.</p>'; }
  function renderPages661(){ const box=$('scrapbookPages'); if(!box)return; box.innerHTML=(data.pages||[]).map(p=>{const photos=p.photos||[]; return `<div class="scrapPage661 card" id="page-${p.id}"><h3>${esc(p.title||'Scrapbook Page')}</h3><div class="scrapCanvas661">${photos.map((src,i)=>`<img class="scrapPhoto661" src="${src}" style="left:${6+(i%2)*46}%;top:${8+Math.floor(i/2)*30}%;width:42%;">`).join('')}${(p.stickers||[]).map(s=>`<div class="sticker661" data-page="${p.id}" data-id="${s.id}" style="left:${s.x||50}px;top:${s.y||50}px;font-size:${s.size||42}px">${esc(s.text||'💗')}<span class="resize661">↘</span></div>`).join('')}</div>${p.note?`<p>${esc(p.note)}</p>`:''}<div class="scrapTools noPrint"><button onclick="addSticker661('${p.id}')" class="secondary">Add Sticker</button><button onclick="downloadPage661('${p.id}')" class="secondary">Download / Print</button><button onclick="del('pages','${p.id}')" class="secondary">Delete</button></div></div>`}).join('')||'<div class="card"><p>No scrapbook pages yet.</p></div>'; bindStickers661(); renderDraft661(); }
  window.renderPages=renderPages661;
  window.addSticker661=function(pid){ const p=data.pages.find(x=>x.id===pid); if(!p)return; p.stickers=p.stickers||[]; p.stickers.push({id:uid(),text:prompt('Sticker emoji or word','💗')||'💗',x:60,y:60,size:44}); saveNow(); renderPages661(); };
  window.downloadPage661=function(pid){ const el=$(`page-${pid}`); if(!el)return; el.scrollIntoView(); setTimeout(()=>window.print(),100); };
  function bindStickers661(){ $$('.sticker661').forEach(el=>{ let drag=false, resize=false, sx=0, sy=0, sl=0, st=0, ss=0; const move=e=>{if(!drag&&!resize)return; e.preventDefault(); const t=e.touches?e.touches[0]:e; const p=data.pages.find(x=>x.id===el.dataset.page), s=p?.stickers?.find(x=>x.id===el.dataset.id); if(!s)return; if(resize){s.size=Math.max(20,ss+(t.clientX-sx)/2); el.style.fontSize=s.size+'px';} else {s.x=sl+(t.clientX-sx); s.y=st+(t.clientY-sy); el.style.left=s.x+'px'; el.style.top=s.y+'px';}}; const up=()=>{if(drag||resize)saveNow(); drag=false; resize=false; window.removeEventListener('mousemove',move); window.removeEventListener('touchmove',move);}; el.onmousedown=el.ontouchstart=e=>{const t=e.touches?e.touches[0]:e; resize=e.target.classList.contains('resize661'); drag=!resize; sx=t.clientX; sy=t.clientY; sl=parseFloat(el.style.left)||0; st=parseFloat(el.style.top)||0; ss=parseFloat(el.style.fontSize)||42; window.addEventListener('mousemove',move); window.addEventListener('touchmove',move,{passive:false}); window.addEventListener('mouseup',up,{once:true}); window.addEventListener('touchend',up,{once:true});}; }); }

  function patchPeople(){ const b=$('savePerson'); if(b&&!b.dataset.v661){ const old=b.onclick; b.dataset.v661='1'; b.onclick=async function(ev){ev&&ev.preventDefault(); const email=($('personEmail')?.value||'').toLowerCase().trim(), phone=String($('personPhone')?.value||'').replace(/\D/g,''); const found=data.people.find(p=>(email&&String(p.email||'').toLowerCase().trim()===email)||(phone&&String(p.phone||'').replace(/\D/g,'')===phone)); if(found){found.name=$('personName')?.value||found.name; found.birthday=$('personBirthday')?.value||found.birthday; found.email=email||found.email; found.phone=$('personPhone')?.value||found.phone; found.role=$('personRole')?.value||found.role; dedupeAll(); saveNow(); render(); toastMsg('Existing person updated instead of duplicated'); return;} if(old) await old.call(this,ev); dedupeAll(); saveNow(); render(); }; } }

  const oldRender=window.render;
  window.render=function(){ dedupeAll(); try{oldRender&&oldRender();}catch(e){console.warn(e)} patchTripDates(); enhanceMealUI(); patchSaveLink(); try{renderTravel()}catch{}; try{renderMeals()}catch{}; try{renderPages661()}catch{}; patchPeople(); };
  document.addEventListener('DOMContentLoaded',()=>{fixButtonsNoRefresh(); setTimeout(()=>{try{render()}catch(e){console.warn(e)}},700);});
  setTimeout(()=>{try{render()}catch(e){console.warn(e)}},1300);
})();
/* ===== END ofa-6.6.1.js ===== */


/* ===== BEGIN ofa-6.6.2.js ===== */
/* Our Family Adventures 6.6.2 — travel links save/load repair */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const now=()=>new Date().toISOString();
  const me=()=>{try{return data?.profile?.name||firebase?.auth?.().currentUser?.displayName||firebase?.auth?.().currentUser?.email||localStorage.getItem('ofa_family_user')||'Family member'}catch{return 'Family member'}};
  const toastMsg=m=>{try{typeof toast==='function'?toast(m):alert(m)}catch{console.log(m)}};
  function ensure(){ if(!window.data)return false; ['trips','links','activity'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]}); data.trips.forEach(t=>{if(!Array.isArray(t.tripLinks))t.tripLinks=[]}); return true; }
  function normUrl(u){ u=String(u||'').trim(); if(!u)return ''; if(!/^https?:\/\//i.test(u))u='https://'+u; return u; }
  function keyLink(l){ return ((l.url||'').replace(/\/$/,'')+'|'+(l.title||'').trim()+'|'+(l.tripId||l.trip||'')).toLowerCase(); }
  function allLinks(){ ensure(); const map=new Map(); (data.links||[]).forEach(l=>{ if(l&&l.url) map.set(keyLink(l), l); }); (data.trips||[]).forEach(t=>{ (t.tripLinks||[]).forEach(l=>{ if(!l||!l.url)return; const x={...l, tripId:l.tripId||t.id, trip:l.trip||t.name}; map.set(keyLink(x), x); }); }); return [...map.values()]; }
  function saveNow(){ try{ if(typeof normalizeData==='function')normalizeData(); }catch{} try{ localStorage.setItem('ofaDataFinalV4',JSON.stringify(data)); localStorage.setItem('ofaData',JSON.stringify(data)); }catch{} try{ if(typeof queueFirebaseSave==='function')queueFirebaseSave(); else if(typeof pushFirebaseData==='function')pushFirebaseData(); else if(typeof save==='function')save(); }catch(e){console.warn(e)} }
  function addGlobalLink(){ if(!ensure())return; const title=($('linkTitle')?.value||'Travel link').trim(); const url=normUrl($('linkUrl')?.value); if(!url){toastMsg('Add the travel link first.'); return;} const tripVal=$('linkTrip')?.value||'General'; const t=data.trips.find(x=>x.name===tripVal||x.id===tripVal); const link={id:uid(),title,url,trip:t?.name||tripVal,tripId:t?.id||'',createdAt:now(),addedBy:me()}; data.links.push(link); if(t){t.tripLinks=t.tripLinks||[]; t.tripLinks.push(link);} dedupeLinks(); if($('linkTitle'))$('linkTitle').value=''; if($('linkUrl'))$('linkUrl').value=''; saveNow(); renderTravel(); try{ if(typeof renderTrips==='function')renderTrips(); }catch{} toastMsg('Travel link saved'); }
  function addTripLinkFixed(tripId){ if(!ensure())return; const t=data.trips.find(x=>x.id===tripId); if(!t)return; const title=($(`tripLinkTitle-${tripId}`)?.value||'Travel link').trim(); const url=normUrl($(`tripLinkUrl-${tripId}`)?.value); if(!url){toastMsg('Add the travel link first.'); return;} const link={id:uid(),title,url,trip:t.name,tripId:t.id,createdAt:now(),addedBy:me()}; data.links.push(link); t.tripLinks=t.tripLinks||[]; t.tripLinks.push(link); dedupeLinks(); if($(`tripLinkTitle-${tripId}`))$(`tripLinkTitle-${tripId}`).value=''; if($(`tripLinkUrl-${tripId}`))$(`tripLinkUrl-${tripId}`).value=''; saveNow(); renderTravel(); try{ if(typeof renderTrips==='function')renderTrips(); }catch{} toastMsg('Trip link saved'); }
  function dedupeLinks(){ if(!ensure())return; const map=new Map(); allLinks().forEach(l=>map.set(keyLink(l),l)); data.links=[...map.values()]; data.trips.forEach(t=>{const tm=new Map(); data.links.filter(l=>l.tripId===t.id||l.trip===t.name).forEach(l=>tm.set(keyLink(l),l)); t.tripLinks=[...tm.values()];}); }
  window.addTripLink=addTripLinkFixed;
  window.tripLinkRows=function(t){ const arr=allLinks().filter(l=>l.tripId===t.id||l.trip===t.name); return arr.length?`<div class="tripLinks"><h4>Travel Links</h4>${arr.map(l=>`<div class="linkRow"><a href="${esc(normUrl(l.url))}" target="_blank" rel="noopener">${esc(l.title||'Travel link')}</a><button onclick="removeTripLink662('${t.id}','${l.id}')" class="secondary smallBtn">Remove</button></div>`).join('')}</div>`:'<p class="helperText">No travel links yet.</p>'; };
  window.removeTripLink662=function(tid,lid){ ensure(); data.links=data.links.filter(l=>l.id!==lid); data.trips.forEach(t=>{t.tripLinks=(t.tripLinks||[]).filter(l=>l.id!==lid)}); saveNow(); renderTravel(); try{ if(typeof renderTrips==='function')renderTrips(); }catch{} };
  window.renderTravel=function(){ const box=$('travelList'); if(!box)return; dedupeLinks(); const arr=allLinks(); box.innerHTML=arr.length?arr.map(l=>`<div class="item"><h3>${esc(l.title||'Travel link')}</h3><p>${esc(l.trip||'General')}</p><a href="${esc(normUrl(l.url))}" target="_blank" rel="noopener">Open link</a><br><button onclick="removeTripLink662('${esc(l.tripId||'')}','${esc(l.id)}')" class="secondary">Delete</button></div>`).join(''):'<div class="card"><p>No travel links yet.</p></div>'; };
  function fillLinkTrips(){ const sel=$('linkTrip'); if(!sel||!ensure())return; const cur=sel.value; sel.innerHTML=(data.trips||[]).map(t=>`<option value="${esc(t.name)}">${esc(t.name)}</option>`).join('')+'<option value="General">General</option>'; if(cur) sel.value=cur; }
  // 6.6.1 stopped button clicks during capture. This capture listener performs the save directly.
  document.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b)return; const txt=(b.textContent||'').trim().toLowerCase(); if(txt==='save link' || txt==='add travel link'){ e.preventDefault(); addGlobalLink(); } else if(txt==='add trip link'){ e.preventDefault(); const input=b.parentElement?.querySelector('input[id^="tripLinkUrl-"]'); const id=input?.id?.replace('tripLinkUrl-',''); if(id)addTripLinkFixed(id); } }, true);
  const oldRender=window.render;
  window.render=function(){ try{oldRender&&oldRender();}catch(e){console.warn(e)} fillLinkTrips(); renderTravel(); };
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{fillLinkTrips();renderTravel();},500));
  setTimeout(()=>{fillLinkTrips();renderTravel();},1200);
})();
/* ===== END ofa-6.6.2.js ===== */


/* ===== BEGIN ofa-6.6.3.js ===== */
/* Our Family Adventures 6.6.3 — installed app auto-update/cache refresh */
(function(){
  window.OFA_VERSION='6.6.3';
  async function refreshInstalledApp(){
    try{
      if('caches' in window){
        const keys=await caches.keys();
        await Promise.all(keys.filter(k=>/^ofa-/i.test(k) && k!=='ofa-6-6-3-core').map(k=>caches.delete(k)));
      }
      if('serviceWorker' in navigator){
        const reg=await navigator.serviceWorker.register('service-worker.js?v=6.6.3');
        await reg.update().catch(()=>{});
        if(reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
      }
    }catch(e){ console.warn('Update refresh skipped',e); }
  }
  refreshInstalledApp();
  document.addEventListener('click',function(e){
    const b=e.target.closest('button'); if(!b)return;
    const t=(b.textContent||'').toLowerCase();
    if(t.includes('refresh app')||t.includes('update app')){ e.preventDefault(); localStorage.setItem('ofaLastManualRefresh','6.6.3'); location.reload(); }
  },true);
})();
/* ===== END ofa-6.6.3.js ===== */


/* ===== BEGIN ofa-6.6.4.js ===== */
/* Our Family Adventures 6.6.4 — hard fix for travel links, meals, memories, scrapbook controls, and mobile scrolling */
(function(){
  'use strict';
  window.OFA_VERSION='6.6.4';
  const $=id=>document.getElementById(id);
  const $$=sel=>Array.from(document.querySelectorAll(sel));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const now=()=>new Date().toISOString();
  const me=()=>{try{return data?.profile?.name||firebase?.auth?.().currentUser?.displayName||firebase?.auth?.().currentUser?.email||localStorage.getItem('ofa_family_user')||'Me'}catch{return 'Me'}};
  const toastMsg=m=>{try{typeof toast==='function'?toast(m):console.log(m)}catch{console.log(m)}};
  function ensure(){ if(!window.data)return false; ['people','trips','memories','pages','links','meals','groceries','packing','pins','chat','activity'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]}); data.trips.forEach(t=>{if(!Array.isArray(t.tripLinks))t.tripLinks=[]; if(!Array.isArray(t.voteOptions))t.voteOptions=[]}); return true; }
  function saveNow(){ try{ if(typeof normalizeData==='function')normalizeData(); }catch{} try{localStorage.setItem('ofaDataFinalV4',JSON.stringify(data));localStorage.setItem('ofaData',JSON.stringify(data));}catch{} try{ if(typeof queueFirebaseSave==='function')queueFirebaseSave(); else if(typeof pushFirebaseData==='function')pushFirebaseData(); else if(typeof save==='function')save(); }catch(e){console.warn(e)} }
  function normUrl(u){u=String(u||'').trim(); if(!u)return ''; if(!/^https?:\/\//i.test(u))u='https://'+u; return u;}
  function cleanKey(s){return String(s||'').trim().toLowerCase().replace(/\/$/,'')}
  function linkKey(l){return [cleanKey(l.url),cleanKey(l.title),cleanKey(l.tripId||l.trip)].join('|')}
  function allLinks(){ensure(); const map=new Map(); (data.links||[]).forEach(l=>{if(l&&l.url)map.set(linkKey(l),l)}); (data.trips||[]).forEach(t=>(t.tripLinks||[]).forEach(l=>{if(l&&l.url){const x={...l,tripId:l.tripId||t.id,trip:l.trip||t.name};map.set(linkKey(x),x)}})); return [...map.values()];}
  function dedupeLinks(){ensure(); const arr=allLinks(); const map=new Map(); arr.forEach(l=>map.set(linkKey(l),l)); data.links=[...map.values()]; data.trips.forEach(t=>{const tm=new Map(); data.links.filter(l=>l.tripId===t.id||l.trip===t.name).forEach(l=>tm.set(linkKey(l),l)); t.tripLinks=[...tm.values()];});}
  function addLinkToTrip(tripId,title,url){ensure(); const t=data.trips.find(x=>x.id===tripId||x.name===tripId); const link={id:uid(),title:(title||'Travel link').trim(),url:normUrl(url),trip:t?.name||'General',tripId:t?.id||'',createdAt:now(),addedBy:me()}; if(!link.url){toastMsg('Add the travel link first.'); return;} data.links.push(link); if(t){t.tripLinks=t.tripLinks||[]; t.tripLinks.push(link);} dedupeLinks(); saveNow(); renderTravel(); try{renderTrips()}catch{} toastMsg('Travel link saved');}
  window.addTripLink=function(tripId){addLinkToTrip(tripId,$(`tripLinkTitle-${tripId}`)?.value,$(`tripLinkUrl-${tripId}`)?.value); if($(`tripLinkTitle-${tripId}`))$(`tripLinkTitle-${tripId}`).value=''; if($(`tripLinkUrl-${tripId}`))$(`tripLinkUrl-${tripId}`).value='';};
  window.removeTravelLink664=function(id){ensure(); data.links=data.links.filter(l=>l.id!==id); data.trips.forEach(t=>t.tripLinks=(t.tripLinks||[]).filter(l=>l.id!==id)); saveNow(); renderTravel(); try{renderTrips()}catch{}};
  window.tripLinkRows=function(t){dedupeLinks(); const arr=allLinks().filter(l=>l.tripId===t.id||l.trip===t.name); return arr.length?`<div class="tripLinks">${arr.map(l=>`<div class="linkRow"><a href="${esc(normUrl(l.url))}" target="_blank" rel="noopener">${esc(l.title||'Travel link')}</a><button type="button" onclick="removeTravelLink664('${l.id}')" class="secondary smallBtn">Remove</button></div>`).join('')}</div>`:'<p class="helperText">No travel links saved yet.</p>';};
  window.renderTravel=function(){const box=$('travelList'); if(!box)return; dedupeLinks(); const arr=allLinks(); box.innerHTML=`<div class="card formCard travelForm664"><h3>Add Travel Link</h3><label>Title<input id="linkTitle664" placeholder="Lost trails, hotel, restaurant, reservation..." value="${esc($('linkTitle664')?.value||'')}"></label><label>Adventure<select id="linkTrip664">${(data.trips||[]).map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}<option value="General">General</option></select></label><label>Link<input id="linkUrl664" placeholder="website.com or https://..." value="${esc($('linkUrl664')?.value||'')}"></label><button type="button" id="saveLink664" class="primary">Save Travel Link</button></div>`+(arr.length?arr.map(l=>`<div class="item"><h3>${esc(l.title||'Travel link')}</h3><p>${esc(l.trip||'General')}</p><a href="${esc(normUrl(l.url))}" target="_blank" rel="noopener">Open link</a><br><button type="button" onclick="removeTravelLink664('${l.id}')" class="secondary">Delete</button></div>`).join(''):'<div class="card"><p>No travel links yet.</p></div>'); const b=$('saveLink664'); if(b)b.onclick=()=>{addLinkToTrip($('linkTrip664')?.value,$('linkTitle664')?.value,$('linkUrl664')?.value);};};
  function tripCard(t){const place=t.address||t.tripAddress||t.destination||''; return `<div class="item tripCard"><h3>${esc(t.name)}</h3><p>${esc(place)} ${t.start?`• ${esc(t.start)} to ${esc(t.end||'')}`:''}</p><div class="itemActions"><button type="button" onclick="editTrip&&editTrip('${t.id}')" class="primary">Edit Trip</button><button type="button" onclick="openTripMap&&openTripMap('${t.id}')" class="secondary">Open Directions</button><button type="button" onclick="refreshTripWeather&&refreshTripWeather('${t.id}')" class="secondary">Refresh Live Weather</button><button type="button" onclick="del&&del('trips','${t.id}')" class="secondary">Delete</button></div><p class="weatherBox">${esc(t.weather||'No live weather loaded yet.')}</p><div class="linkBox"><h4>Travel Links</h4>${tripLinkRows(t)}<input id="tripLinkTitle-${t.id}" placeholder="Link title"><input id="tripLinkUrl-${t.id}" placeholder="website.com or https://..."><button type="button" onclick="addTripLink('${t.id}')" class="secondary">Add Travel Link</button></div><div class="voteBox"><h4>Family Voting</h4>${(t.voteOptions||[]).map((v,i)=>`<div class="voteRow"><span>${esc(v.text||'Option')}</span><strong>${Object.keys(v.votes||{}).length} vote(s)</strong><button type="button" onclick="voteTrip&&voteTrip('${t.id}',${i})" class="secondary">Vote</button></div>`).join('')||'<p>No voting options yet.</p>'}<textarea id="voteInput-${t.id}" placeholder="Add choices, one per line"></textarea><textarea id="voteLinks-${t.id}" placeholder="Optional links, one per line"></textarea><button type="button" onclick="addVoteOptionsBulk&&addVoteOptionsBulk('${t.id}')" class="secondary">Add Voting Option(s)</button></div></div>`}
  window.renderTrips=function(){const box=$('tripList'); if(!box)return; ensure(); dedupeLinks(); box.innerHTML=(data.trips||[]).map(tripCard).join('')||'<div class="card"><p>No trips added yet.</p></div>';};
  document.addEventListener('click',function(e){const b=e.target.closest('button'); if(!b)return; const txt=(b.textContent||'').trim().toLowerCase(); if(txt==='add travel link'){const wrap=b.closest('.linkBox'); if(wrap){e.preventDefault(); e.stopImmediatePropagation(); const id=(wrap.querySelector('input[id^="tripLinkUrl-"]')?.id||'').replace('tripLinkUrl-',''); if(id)window.addTripLink(id);}} if(txt==='save link'||txt==='save travel link'){e.preventDefault(); e.stopImmediatePropagation(); addLinkToTrip($('linkTrip664')?.value||$('linkTrip')?.value,$('linkTitle664')?.value||$('linkTitle')?.value,$('linkUrl664')?.value||$('linkUrl')?.value);}},true);
  function prettyDate(d){if(!d)return ''; const x=new Date(String(d).slice(0,10)+'T12:00:00'); return isNaN(x)?String(d):x.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});}
  function dateRange(start,end){const out=[]; if(!start)return out; const s=new Date(start+'T12:00:00'), e=new Date((end||start)+'T12:00:00'); if(isNaN(s)||isNaN(e))return out; for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1)){out.push(d.toISOString().slice(0,10)); if(out.length>31)break} return out;}
  function mealTypes(i,total){return total>1&&i===0?['Lunch','Dinner','Snack']:total>1&&i===total-1?['Breakfast','Lunch']:['Breakfast','Lunch','Dinner','Snack'];}
  function fillMealDropdowns(){const t=data.trips.find(x=>x.id===$('mealTrip')?.value||x.name===$('mealTrip')?.value)||data.trips[0]; const dates=t?dateRange(t.start,t.end):[]; const ds=$('mealDate664'), ms=$('mealType664'); if(ds)ds.innerHTML=dates.map(d=>`<option value="${d}">${esc(prettyDate(d))}</option>`).join('')||'<option value="">Add trip dates first</option>'; if(ms){const d=ds?.value; const idx=Math.max(0,dates.indexOf(d)); ms.innerHTML=(dates.length?mealTypes(idx,dates.length):['Breakfast','Lunch','Dinner','Snack']).map(m=>`<option>${m}</option>`).join('');}}
  function ensureMealForm(){const form=$('meals')?.querySelector('.formCard'); if(!form||$('mealDate664'))return; const title=$('mealTitle')?.closest('label'); if(title)title.style.display='none'; title?.insertAdjacentHTML('afterend',`<div class="twoCols"><label>Date<select id="mealDate664"></select></label><label>Meal<select id="mealType664"></select></label></div><label>Meal list<select id="mealScope664"><option value="group">Group meal list</option><option value="private">My private meal list</option></select></label>`); $('mealTrip')?.addEventListener('change',fillMealDropdowns); $('mealDate664')?.addEventListener('change',fillMealDropdowns); const b=$('saveMeal'); if(b)b.onclick=function(ev){ev&&ev.preventDefault(); const tripVal=$('mealTrip')?.value||'General'; const t=data.trips.find(x=>x.id===tripVal||x.name===tripVal); const m={id:uid(),trip:t?.name||tripVal,tripId:t?.id||'',date:$('mealDate664')?.value||'',mealDate:$('mealDate664')?.value||'',mealType:$('mealType664')?.value||'Meal',title:$('mealType664')?.value||'Meal',scope:$('mealScope664')?.value||'group',private:($('mealScope664')?.value==='private'),item:($('mealItem')?.value||'').trim()||$('mealType664')?.value||'Meal',person:($('mealPerson')?.value||'').trim()||'Volunteer needed',owner:me(),createdAt:now()}; data.meals.push(m); if($('mealItem'))$('mealItem').value=''; if($('mealPerson'))$('mealPerson').value=''; saveNow(); renderMeals(); toastMsg('Meal saved');}; fillMealDropdowns();}
  function rowMeal(m){return `<div class="item"><b>${esc(prettyDate(m.date||m.mealDate))} ${esc(m.mealType||m.title||'Meal')}</b><br>${esc(m.item||'Meal item')}<br><small>${esc(m.person||'Volunteer needed')} • ${esc(m.trip||'General')}</small><button type="button" onclick="deleteMeal664('${m.id}')" class="secondary smallBtn">Delete</button></div>`}
  window.deleteMeal664=id=>{data.meals=data.meals.filter(m=>m.id!==id); saveNow(); renderMeals();};
  window.renderMeals=function(){const box=$('mealList'); if(!box)return; ensure(); ensureMealForm(); const mine=me(); const group=data.meals.filter(m=>m.scope!=='private'&&!m.private); const priv=data.meals.filter(m=>m.scope==='private'||m.private||m.owner===mine); const t=data.trips.find(x=>x.id===$('mealTrip')?.value||x.name===$('mealTrip')?.value)||data.trips[0]; const dates=t?dateRange(t.start,t.end):[]; const calendar=dates.length?`<div class="card mealDateCards664"><h3>Meals by Trip Date</h3>${dates.map((d,i)=>`<div class="mealDayCard"><h3>${esc(prettyDate(d))}</h3>${mealTypes(i,dates.length).map(mt=>`<div class="mealSlot664"><b>${mt}</b><button type="button" onclick="document.getElementById('mealDate664').value='${d}';fillMealDropdowns664&&fillMealDropdowns664();document.getElementById('mealType664').value='${mt}';document.getElementById('mealItem').focus();" class="secondary smallBtn">Add</button></div>`).join('')}</div>`).join('')}</div>`:''; box.innerHTML=calendar+`<div class="card"><h3>Group Meal List</h3>${group.map(rowMeal).join('')||'<p>No group meals yet.</p>'}</div><div class="card"><h3>My Private Meal List</h3>${priv.map(rowMeal).join('')||'<p>No private meals yet.</p>'}</div>`;}; window.fillMealDropdowns664=fillMealDropdowns;
  function mediaList(){const out=[]; (data.memories||[]).forEach(m=>(m.media||[]).forEach((mm,i)=>{const src=mm.src||mm.url||mm.dataUrl||mm; if(src)out.push({id:mm.id||`${m.id}-${i}`,src,title:m.title||'Memory',memoryId:m.id})})); return out;}
  window.renderMemories=function(){const box=$('memoryGrid'); if(!box)return; const sorted=[...(data.memories||[])].sort((a,b)=>String(b.date||b.createdAt||'').localeCompare(String(a.date||a.createdAt||''))); box.innerHTML=sorted.map(m=>`<div class="memory journal"><div class="journalMeta">${esc(m.uploader||'')} • ${esc(m.trip||'')} • ${esc(m.date||'')}</div><h3>${esc(m.title||'Memory')}</h3><div class="mediaGrid">${(m.media||[]).map(mm=>{const src=mm.src||mm.url||mm.dataUrl||mm; return String(src).startsWith('data:video')?`<video controls src="${src}"></video>`:`<img src="${src}" alt="memory">`}).join('')}</div><p>${esc(m.caption||'')}</p><div class="memoryActions"><button type="button" onclick="addMemoryToBook&&addMemoryToBook('${m.id}')" class="secondary">Add photos to scrapbook</button><button type="button" onclick="editMemory664('${m.id}')" class="secondary">Edit</button><button type="button" onclick="downloadMemory664('${m.id}')" class="secondary">Download / Print</button><button type="button" onclick="del&&del('memories','${m.id}')" class="secondary">Delete</button></div></div>`).join('')||'<div class="card"><p>No memories yet.</p></div>'; try{renderScrapbookChoices()}catch{}};
  window.editMemory664=id=>{const m=data.memories.find(x=>x.id===id); if(!m)return; const title=prompt('Memory title',m.title||''); if(title===null)return; const caption=prompt('Journal entry',m.caption||''); m.title=title; if(caption!==null)m.caption=caption; saveNow(); renderMemories();}; window.downloadMemory664=id=>{const m=data.memories.find(x=>x.id===id); if(!m)return; window.print();};
  function enhanceScrapControls(){const sec=$('scrapbook'); if(!sec||$('scrapControls664'))return; const form=sec.querySelector('.formCard'); if(form){form.insertAdjacentHTML('beforeend',`<div id="scrapControls664" class="card"><h3>Frames / Cutouts</h3><div id="frameChips664" class="chipScroller"></div><h3>Stickers & Extras</h3><div id="stickerChips664" class="chipScroller"></div></div>`);} const frames=['soft','polaroid','circle','heart','scallop','postcard','ticket','torn','gold','none']; const stickers=['📷','💕','❤️','💛','💙','⭐','✨','☀️','🌊','🐚','🏖️','🧭','✈️','📍','🎣','🍔','🔥','🎆']; $('frameChips664').innerHTML=frames.map(f=>`<button type="button" class="scrapChip" onclick="selectFrame664('${f}')">${f}</button>`).join(''); $('stickerChips664').innerHTML=stickers.map(s=>`<button type="button" class="scrapChip" onclick="addDraftSticker664('${s}')">${s}</button>`).join('');}
  window.selectFrame664=f=>{if($('pageFrame'))$('pageFrame').value=f; $$('.scrapChip').forEach(c=>c.classList.toggle('selected',c.textContent.trim()===f)); renderDraft664();};
  let draftStickers=[];
  function selectedIds(){try{return window.selectedScrapPhotos||selectedScrapPhotos||[]}catch{return []}}
  function selectedPhotos(){const ids=selectedIds(); return mediaList().filter(x=>ids.includes(x.id));}
  window.addDraftSticker664=s=>{draftStickers.push({id:uid(),text:s,x:40+draftStickers.length*30,y:360,size:52}); renderDraft664();};
  function frameClass(){return 'frame-'+($('pageFrame')?.value||'soft')}
  window.renderDraft664=function(){enhanceScrapControls(); let box=$('draftPage664'); const host=$('scrapbookPhotoPicker')||$('scrapbookPages')?.parentElement; if(!host)return; if(!box){host.insertAdjacentHTML('afterend',`<div id="draftPage664" class="card"><h3>Draft Scrapbook Page</h3><div id="draftCanvas664" class="draftCanvas664"></div><div class="scrapTools noPrint"><button type="button" id="saveDraft664" class="primary">Save Scrapbook Page</button><button type="button" id="clearDraft664" class="secondary">Clear Draft</button></div></div>`); box=$('draftPage664'); $('clearDraft664').onclick=()=>{draftStickers=[]; try{window.selectedScrapPhotos=[]; selectedScrapPhotos=[]}catch{} renderDraft664();}; $('saveDraft664').onclick=()=>{const photos=selectedPhotos().map(p=>p.src); const page={id:uid(),title:$('pageTitle')?.value||'Scrapbook Page',note:$('pageNote')?.value||'',frame:$('pageFrame')?.value||'soft',theme:$('pageBg')?.value||$('pageTheme')?.value||'Rose Gold',photos,stickers:draftStickers,createdAt:now()}; data.pages.push(page); draftStickers=[]; try{window.selectedScrapPhotos=[]; selectedScrapPhotos=[]}catch{} saveNow(); renderPages(); toastMsg('Scrapbook page saved');};}
    const photos=selectedPhotos(); $('draftCanvas664').innerHTML=(photos.length?photos.map((p,i)=>`<img class="draftPhoto664 ${frameClass()}" src="${p.src}" style="left:${8+(i%2)*44}%;top:${20+Math.floor(i/2)*34}%;width:40%">`).join(''):'<p>Select memory photos above, then choose frames and stickers before saving.</p>')+draftStickers.map(s=>`<div class="sticker664" style="left:${s.x}px;top:${s.y}px;font-size:${s.size}px">${esc(s.text)}<span class="resize664">↘</span></div>`).join(''); bindDrag664(); };
  window.renderPages=function(){const box=$('scrapbookPages'); if(!box)return; ensure(); box.innerHTML=(data.pages||[]).map(p=>`<div class="scrapPage664 card" id="page-${p.id}"><h3>${esc(p.title||'Scrapbook Page')}</h3><div class="scrapCanvas664">${(p.photos||[]).map((src,i)=>`<img class="scrapPhoto664 frame-${esc(p.frame||'soft')}" src="${src}" style="left:${6+(i%2)*46}%;top:${18+Math.floor(i/2)*32}%;width:42%">`).join('')}${(p.stickers||[]).map(s=>`<div class="sticker664" data-page="${p.id}" data-id="${s.id}" style="left:${s.x||50}px;top:${s.y||360}px;font-size:${s.size||52}px">${esc(s.text||'❤️')}<span class="resize664">↘</span></div>`).join('')}</div><p>${esc(p.note||'')}</p><div class="scrapTools noPrint"><button type="button" onclick="editPage664('${p.id}')" class="secondary">Edit</button><button type="button" onclick="addPageSticker664('${p.id}')" class="secondary">Add Sticker</button><button type="button" onclick="window.print()" class="secondary">Download / Print</button><button type="button" onclick="del&&del('pages','${p.id}')" class="secondary">Delete</button></div></div>`).join('')||'<div class="card"><p>No scrapbook pages yet.</p></div>'; bindDrag664(); renderDraft664();};
  window.editPage664=id=>{const p=data.pages.find(x=>x.id===id); if(!p)return; const title=prompt('Page title',p.title||''); if(title!==null)p.title=title; const note=prompt('Page note',p.note||''); if(note!==null)p.note=note; saveNow(); renderPages();}; window.addPageSticker664=id=>{const p=data.pages.find(x=>x.id===id); if(!p)return; p.stickers=p.stickers||[]; p.stickers.push({id:uid(),text:prompt('Sticker','❤️')||'❤️',x:70,y:360,size:52}); saveNow(); renderPages();};
  function bindDrag664(){ $$('.sticker664').forEach(el=>{if(el.dataset.bound664)return; el.dataset.bound664='1'; let drag=false,resize=false,sx=0,sy=0,sl=0,st=0,ss=0; const move=e=>{if(!drag&&!resize)return; e.preventDefault(); const t=e.touches?e.touches[0]:e; if(resize){el.style.fontSize=Math.max(20,ss+(t.clientX-sx)/2)+'px';}else{el.style.left=sl+(t.clientX-sx)+'px'; el.style.top=st+(t.clientY-sy)+'px';}}; const up=()=>{drag=false;resize=false; window.removeEventListener('mousemove',move); window.removeEventListener('touchmove',move);}; el.addEventListener('mousedown',down); el.addEventListener('touchstart',down,{passive:false}); function down(e){e.preventDefault(); const t=e.touches?e.touches[0]:e; resize=e.target.classList.contains('resize664'); drag=!resize; sx=t.clientX; sy=t.clientY; sl=parseFloat(el.style.left)||0; st=parseFloat(el.style.top)||0; ss=parseFloat(el.style.fontSize)||52; window.addEventListener('mousemove',move); window.addEventListener('touchmove',move,{passive:false}); window.addEventListener('mouseup',up,{once:true}); window.addEventListener('touchend',up,{once:true});}}); }
  const oldRender=window.render;
  window.render=function(){ensure(); try{oldRender&&oldRender()}catch(e){console.warn(e)} try{renderTrips()}catch{} try{renderTravel()}catch{} try{renderMeals()}catch{} try{renderMemories()}catch{} try{renderPages()}catch{} };
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{try{render()}catch(e){console.warn(e)}},600)); setTimeout(()=>{try{render()}catch(e){console.warn(e)}},1500);
})();
/* ===== END ofa-6.6.4.js ===== */
