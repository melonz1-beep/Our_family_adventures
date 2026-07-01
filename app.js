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
async function pushFirebaseData(){if(!firebaseReady||!firebaseUser)return;try{await appDataRef().set({data,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),version:'5.0'}, {merge:true});}catch(e){console.error(e);toast('Firebase save failed. Check rules/config.');}}
async function pullFirebaseData(){if(!firebaseReady||!firebaseUser)return;try{const snap=await appDataRef().get();if(snap.exists&&snap.data().data){applyingFirebaseData=true;Object.keys(data).forEach(k=>delete data[k]);Object.assign(data,snap.data().data);localStorage.setItem(KEY,JSON.stringify(data));applyingFirebaseData=false;render();toast('Firebase data loaded');}else{await pushFirebaseData();toast('Firebase ready');}}catch(e){console.error(e);toast('Firebase load failed. Check Firestore rules.');}}
function initFirebase(){if(!firebaseConfigReady()){console.warn('Firebase is not active yet. Paste real config in firebase-config.js.');return;}try{if(!firebase.apps.length)firebase.initializeApp(window.firebaseConfig);firebaseReady=true;firebase.auth().onAuthStateChanged(async user=>{firebaseUser=user;if(firebaseUnsubscribe){firebaseUnsubscribe();firebaseUnsubscribe=null;}if(user){toast(`Signed in: ${user.email||'family user'}`);await firebase.firestore().collection('users').doc(user.uid).set({email:user.email||'',lastLogin:firebase.firestore.FieldValue.serverTimestamp(),role:'family'}, {merge:true});await pullFirebaseData();firebaseUnsubscribe=appDataRef().onSnapshot(snap=>{if(!snap.exists||!snap.data().data)return;applyingFirebaseData=true;Object.keys(data).forEach(k=>delete data[k]);Object.assign(data,snap.data().data);localStorage.setItem(KEY,JSON.stringify(data));applyingFirebaseData=false;render();}, err=>console.error(err));}else{toast('Firebase ready. Tap 👤 to sign in.');}});}catch(e){console.error(e);toast('Firebase could not start. Check firebase-config.js.');}}
async function firebaseLoginFlow(){if(!firebaseReady){toast('Paste your real Firebase config first.');return;}try{if(firebase.auth().currentUser){if(confirm('Sign out of Firebase?'))await firebase.auth().signOut();return;}const email=prompt('Family email address');if(!email)return;const password=prompt('Password - at least 6 characters');if(!password)return;try{await firebase.auth().signInWithEmailAndPassword(email,password);}catch(err){if(confirm('No account found or password did not match. Create this family login?')){const cred=await firebase.auth().createUserWithEmailAndPassword(email,password);try{await cred.user.sendEmailVerification();toast('Account created. Verification email sent.');}catch{toast('Account created.');}}else{throw err;}}}catch(e){console.error(e);toast(e.message||'Login failed');}}
function safeFileName(name){return String(name||'file').replace(/[^a-z0-9._-]+/gi,'-').slice(0,80)}
async function saveMediaFile(file,path,max=1200,quality=.72){if(firebaseReady&&firebaseUser){try{let uploadFile=file;if(file.type.startsWith('image/'))uploadFile=await imageBlob(file,max,quality);const ref=firebase.storage().ref().child(`family/${firebaseUser.uid}/${path}`);await ref.put(uploadFile,{contentType:uploadFile.type||file.type});return await ref.getDownloadURL();}catch(e){console.error(e);toast('Firebase upload failed; saved inside browser instead.');}}if(file.type.startsWith('video')){toast('Video selected. Sign in to Firebase to save/play videos in the app.');return '';}
return await imageData(file,900,.58);}
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
