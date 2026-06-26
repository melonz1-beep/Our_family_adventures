const $ = id => document.getElementById(id);
const data = { people: [], trips: [], memories: [], pages: [], links: [], meals: [], pins: [], chat: [] };

function save() { localStorage.setItem('ofa_44', JSON.stringify(data)); }
function load() {
  const newer = localStorage.getItem('ofa_44');
  const older = localStorage.getItem('ofa_39');
  Object.assign(data, JSON.parse(newer || older || '{}'));
}
load();

function show(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === id));
  document.querySelectorAll('[data-go]').forEach(b => b.classList.toggle('active', b.dataset.go === id));
  $('drawer').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => show(b.dataset.go));
$('menuBtn').onclick = () => $('drawer').classList.add('open');
$('closeDrawer').onclick = () => $('drawer').classList.remove('open');
$('beginBtn').onclick = () => { $('splash').classList.remove('active'); $('app').classList.remove('hidden'); };

function daysUntil(d) { return Math.max(0, Math.ceil((new Date(d) - new Date()) / 86400000)); }
function updateHome() {
  const next = data.trips.filter(t => t.status !== 'Canceled').sort((a,b) => (a.start || '9999').localeCompare(b.start || '9999'))[0];
  $('nextAdventureText').textContent = next ? `Your next adventure is ${next.name}.` : 'Your next adventure is waiting.';
  $('countdown').textContent = next && next.start ? `${daysUntil(next.start)} days until ${next.name}` : 'Add an adventure to begin the countdown.';
  $('activityLine').textContent = `${data.people.length} people • ${data.trips.length} adventures • ${data.memories.length} memories • ${data.pages.length} scrapbook pages`;
  renderMealTrips();
}

$('saveTrip').onclick = () => {
  const trip = { id: Date.now(), name: $('tripName').value || 'New Adventure', destination: $('tripDestination').value, start: $('tripStart').value, end: $('tripEnd').value, visibility: $('tripVisibility').value, invitees: $('tripInvitees').value, status: 'Planning', rsvp: { accept: 0, maybe: 0, decline: 0 } };
  data.trips.push(trip);
  ['tripName','tripDestination','tripStart','tripEnd','tripInvitees'].forEach(i => $(i).value = '');
  save(); render(); notify(`New adventure saved: ${trip.name}`);
};
function renderTrips() {
  tripList.innerHTML = data.trips.map(t => `<div class='item'><b>${escapeHtml(t.name)}</b><p>${escapeHtml(t.destination || '')} ${t.start ? `• ${t.start} to ${t.end}` : ''}</p><p>Visibility: ${t.visibility === 'private' ? 'Private / invited only' : 'Whole family'} • Status: ${t.status}</p><button onclick='rsvp(${t.id},"accept")' class='secondary'>Accept</button><button onclick='rsvp(${t.id},"maybe")' class='secondary'>Maybe</button><button onclick='rsvp(${t.id},"decline")' class='secondary'>Decline</button><button onclick='cancelTrip(${t.id})' class='secondary'>Cancel trip</button></div>`).join('');
}
window.rsvp = (id,type) => { const t = data.trips.find(x => x.id === id); if(!t) return; t.rsvp[type]++; save(); render(); notify(`${type} RSVP saved for ${t.name}`); };
window.cancelTrip = id => { const t = data.trips.find(x => x.id === id); if(!t) return; t.status = 'Canceled'; save(); render(); notify(`${t.name} was marked canceled`); };

function renderMealTrips() {
  const options = data.trips.map(t => `<option>${escapeHtml(t.name)}</option>`).join('') || '<option>No adventure yet</option>';
  if ($('mealTrip')) $('mealTrip').innerHTML = options;
}
$('saveLink').onclick = () => { data.links.push({ id: Date.now(), title: linkTitle.value || 'Travel link', url: linkUrl.value }); linkTitle.value=''; linkUrl.value=''; save(); render(); };
$('saveMeal').onclick = () => { data.meals.push({ id: Date.now(), trip: mealTrip.value, title: mealTitle.value, item: mealItem.value, person: mealPerson.value }); mealTitle.value=''; mealItem.value=''; mealPerson.value=''; save(); render(); notify('Meal item added'); };
function renderTravel() {
  travelList.innerHTML = [
    ...data.links.map(l => `<div class='item'><b>${escapeHtml(l.title)}</b><p><a href='${safeUrl(l.url)}' target='_blank' rel='noopener'>Open link</a></p><button onclick='del("links",${l.id})' class='secondary'>Delete</button></div>`),
    ...data.meals.map(m => `<div class='item'><b>${escapeHtml(m.trip || 'Trip')}</b><p>${escapeHtml(m.title || 'Meal')}: ${escapeHtml(m.item || '')} — ${escapeHtml(m.person || 'Needs claimed')}</p><button onclick='del("meals",${m.id})' class='secondary'>Delete</button></div>`)
  ].join('');
}

$('savePerson').onclick = async () => {
  const photo = personPhoto.files[0] ? await imageData(personPhoto.files[0], 900, .72) : '';
  data.people.push({ id: Date.now(), name: personName.value || 'Family Member', birthday: personBirthday.value, email: personEmail.value, phone: personPhone.value, photo });
  ['personName','personBirthday','personEmail','personPhone'].forEach(i => $(i).value = '');
  personPhoto.value = '';
  save(); render(); notify('Person saved');
};
function renderPeople() {
  peopleList.innerHTML = data.people.map(p => `<div class='person'>${p.photo ? `<img src='${p.photo}' alt='${escapeHtml(p.name)}'>` : ''}<h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.birthday || '')}</p><button onclick='emailOne("${escapeAttr(p.email || '')}")' class='secondary'>Email</button><button onclick='textOne("${escapeAttr(p.phone || '')}")' class='secondary'>Text</button><button onclick='del("people",${p.id})' class='secondary'>Remove</button></div>`).join('');
  contactChecks.innerHTML = data.people.map(p => `<label><input type='checkbox' value='${p.id}'> ${escapeHtml(p.name)}</label>`).join('');
}
function selectedPeople() { return [...contactChecks.querySelectorAll('input:checked')].map(c => data.people.find(p => p.id == c.value)).filter(Boolean); }
groupEmail.onclick = () => { const emails = selectedPeople().map(p => p.email).filter(Boolean).join(','); if (emails) location.href = 'mailto:' + emails; };
groupText.onclick = () => { const phones = selectedPeople().map(p => p.phone).filter(Boolean).join(','); if (phones) location.href = 'sms:' + phones; };
window.emailOne = e => { if (e) location.href = 'mailto:' + e; };
window.textOne = p => { if (p) location.href = 'sms:' + p; };

$('saveMemories').onclick = async () => {
  const files = [...memoryFiles.files];
  for (const f of files) {
    const isVideo = f.type.startsWith('video');
    const src = isVideo ? '' : await imageData(f, 1200, .70);
    data.memories.push({ id: Date.now() + Math.random(), src, type: isVideo ? 'video' : 'image', caption: memoryCaption.value, uploader: memoryUploader.value || 'Family', trip: memoryTrip.value || 'General Memories', fileName: f.name });
  }
  memoryFiles.value = ''; memoryCaption.value = ''; memoryUploader.value = ''; memoryTrip.value = '';
  save(); render(); notify(`${files.length} memories added`);
};
function renderMemories() {
  const groups = groupBy(data.memories, m => m.trip || 'General Memories');
  memoryGrid.innerHTML = Object.keys(groups).map(trip => `<div class='card memoryJournalGroup'><h3>${escapeHtml(trip)}</h3>${groups[trip].map(memoryCard).join('')}</div>`).join('');
}
function memoryCard(m) {
  const media = m.type === 'video' ? `<div class='item'><b>🎥 Video:</b> ${escapeHtml(m.fileName || 'Video')}</div>` : `<img src='${m.src}' alt='${escapeHtml(m.caption || 'Memory photo')}'>`;
  const addButton = m.type === 'image' ? `<button onclick='addMemoryToBook("${m.id}")' class='secondary'>Add photo to scrapbook</button>` : `<button class='secondary' disabled title='Only photos can be added to scrapbook in this build'>Scrapbook uses photos only</button>`;
  return `<div class='memory journal' id='memory-${String(m.id).replace(/\W/g,'')}'><div class='journalMeta'>${escapeHtml(m.uploader)} • ${escapeHtml(m.trip || 'General Memories')}</div>${media}<p>${escapeHtml(m.caption || '')}</p><div class='memoryActions'>${addButton}${m.type === 'image' ? `<button onclick='printMemory("${m.id}")' class='secondary'>Print this photo</button>` : ''}<button onclick='del("memories","${m.id}")' class='secondary'>Delete</button></div></div>`;
}
addAllToBook.onclick = () => { data.memories.filter(m => m.type === 'image').forEach(m => data.pages.push({ id: Date.now() + Math.random(), title: m.caption || 'Memory Page', note: `Added from Memories by ${m.uploader}`, memory: m.src, type: m.type, theme: 'Beach Day', sticker: '🐚 Seashells' })); save(); render(); show('scrapbook'); };
window.addMemoryToBook = id => { const m = data.memories.find(x => String(x.id) === String(id)); if (!m || m.type !== 'image') return alert('Only photos can be added to scrapbook pages in this build.'); data.pages.push({ id: Date.now(), title: m.caption || 'Memory Page', note: `Added from Memories by ${m.uploader}`, memory: m.src, type: m.type, theme: 'Beach Day', sticker: '🐚 Seashells' }); save(); render(); show('scrapbook'); };
window.printMemory = id => { const m = data.memories.find(x => String(x.id) === String(id)); if (!m || m.type !== 'image') return; const w = window.open('', '_blank'); w.document.write(`<html><head><title>Print Memory</title><style>body{margin:0;display:grid;place-items:center;min-height:100vh}img{max-width:100%;max-height:100vh;object-fit:contain}</style></head><body><img src='${m.src}' onload='window.print()'></body></html>`); w.document.close(); };
printMemories.onclick = () => alert('Use “Print this photo” on the individual memory you want to print.');

$('savePage').onclick = () => { data.pages.push({ id: Date.now(), title: pageTitle.value || 'Scrapbook Page', note: pageNote.value, theme: pageTheme.value, sticker: pageSticker.value }); pageTitle.value = ''; pageNote.value = ''; save(); render(); };
printBook.onclick = () => window.print();
function renderPages() {
  scrapbookPages.innerHTML = data.pages.map(p => `<div class='scrapPage theme-${cssClass(p.theme || 'Beach Day')}'><span class='sticker'>${(p.sticker || '🐚').split(' ')[0]}</span><h3>${escapeHtml(p.title)}</h3>${p.memory ? `<img src='${p.memory}' style='width:100%;max-height:300px;object-fit:contain;border-radius:18px'>` : ''}<p>${escapeHtml(p.note || '')}</p><button onclick='window.print()' class='secondary'>Print / save PDF</button><button onclick='del("pages",${p.id})' class='secondary'>Delete</button></div>`).join('');
}

sendChat.onclick = () => { if(!chatInput.value.trim()) return; data.chat.push({ id: Date.now(), text: chatInput.value }); chatInput.value = ''; save(); render(); notify('New chat message'); };
function renderChat() { chatLog.innerHTML = data.chat.map(c => `<div class='bubble'>${escapeHtml(c.text).replace(/@\w+/g, m => `<b>${m}</b>`)}</div>`).join(''); }
savePin.onclick = () => { data.pins.push({ id: Date.now(), name: pinName.value, address: pinAddress.value }); pinName.value=''; pinAddress.value=''; save(); render(); };
function renderPins() { pinList.innerHTML = data.pins.map(p => `<div class='item'><b>${escapeHtml(p.name)}</b><p>${escapeHtml(p.address)}</p><a target='_blank' rel='noopener' href='https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}'>Open in Google Maps</a><br><button onclick='del("pins",${p.id})' class='secondary'>Remove pin</button></div>`).join(''); }

window.del = (key,id) => { data[key] = data[key].filter(x => String(x.id) !== String(id)); save(); render(); };
function groupBy(arr, fn) { return arr.reduce((a,x) => ((a[fn(x)] ||= []).push(x), a), {}); }
function cssClass(s) { return String(s).replace(/\s+/g,'-').replace(/[^\w-]/g,''); }
function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : '#'; }
function escapeHtml(s) { return String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function escapeAttr(s) { return escapeHtml(s).replace(/`/g,''); }
function imageData(file, max = 1200, quality = .72) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(reader.result);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function notify(msg) { if ('Notification' in window && Notification.permission === 'granted') new Notification('Our Family Adventures', { body: msg }); else console.log(msg); }
async function askNotifications() { if ('Notification' in window) { const result = await Notification.requestPermission(); if (result === 'granted') notify('Notifications are ready.'); } }
notifyBtn.onclick = askNotifications;
if ($('enableNotifications')) $('enableNotifications').onclick = askNotifications;

let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstallPrompt = event; if ($('installBtn')) $('installBtn').hidden = false; });
if ($('installBtn')) {
  $('installBtn').hidden = true;
  $('installBtn').onclick = async () => {
    if (deferredInstallPrompt) { deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; $('installBtn').hidden = true; }
    else alert('To install: on iPhone use Safari Share → Add to Home Screen. On Android use Chrome menu → Add to Home screen.');
  };
}
function render() { updateHome(); renderTrips(); renderTravel(); renderPeople(); renderMemories(); renderPages(); renderChat(); renderPins(); }
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(()=>{});
