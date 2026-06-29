/* Our Family Adventures v6.1 - clean GitHub/Firebase PWA */
(() => {
  const VERSION = '6.1';
  const ADMIN_PIN = window.OFA_ADMIN_PIN || '1218';
  const $ = (id) => document.getElementById(id);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
  const money = (n) => Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const localKey = 'ofa-v6-1-data';
  const state = {
    trip: { name: '', destination: '', startDate: '', weatherLocation: '' },
    notes: '', itinerary: [], reservations: [], maps: [], budget: [], packing: [], meals: [], photos: [], scrapbookItems: [], votes: [], activity: []
  };
  let db = null, storage = null, cloudReady = false, unsub = null, deferredInstall = null;

  function setStatus(text) { $('syncStatus').textContent = text; }
  function log(action) { state.activity.unshift({ id: uid(), action, at: new Date().toLocaleString() }); state.activity = state.activity.slice(0, 100); save(); }
  function loadLocal() { try { Object.assign(state, JSON.parse(localStorage.getItem(localKey) || '{}')); } catch {} }
  function saveLocal() { localStorage.setItem(localKey, JSON.stringify(state)); }
  async function save() {
    saveLocal(); renderAll();
    if (cloudReady) {
      try { await db.collection('ofa').doc('main').set({ ...state, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), version: VERSION }, { merge: true }); setStatus('Saved to Firebase'); }
      catch (e) { console.warn(e); setStatus('Saved locally. Firebase write failed.'); }
    } else setStatus('Saved locally');
  }
  async function initFirebase() {
    if (!window.OFA_FIREBASE_ENABLED || !window.firebaseConfig || !window.firebase) { setStatus('Local mode'); return; }
    try {
      if (!firebase.apps.length) firebase.initializeApp(window.firebaseConfig);
      db = firebase.firestore(); storage = firebase.storage();
      await firebase.auth().signInAnonymously(); cloudReady = true; setStatus('Connected to Firebase');
      unsub = db.collection('ofa').doc('main').onSnapshot(snap => {
        if (snap.exists) { Object.assign(state, snap.data()); saveLocal(); renderAll(); }
      }, err => { console.warn(err); setStatus('Firebase read issue. Local mode available.'); });
    } catch (e) { console.warn(e); setStatus('Firebase sign-in blocked. Check Anonymous Auth and rules.'); }
  }
  function bindTabs() { qsa('.tabs button').forEach(btn => btn.addEventListener('click', () => { qsa('.tabs button').forEach(b => b.classList.remove('active')); qsa('.tab-panel').forEach(p => p.classList.remove('active')); btn.classList.add('active'); $(btn.dataset.tab).classList.add('active'); if (btn.dataset.tab === 'analytics') renderAnalytics(); })); }
  function bindInputs() {
    $('saveTrip').onclick = () => { state.trip = { name: $('tripName').value.trim(), destination: $('destination').value.trim(), startDate: $('startDate').value, weatherLocation: $('weatherLocation').value.trim() }; log('Saved trip settings'); };
    $('saveNotes').onclick = () => { state.notes = $('sharedNotes').value; log('Saved shared notes'); };
    $('addItinerary').onclick = () => addTo('itinerary', { date: $('itDate').value, time: $('itTime').value, title: $('itTitle').value, location: $('itLocation').value });
    $('addReservation').onclick = () => addTo('reservations', { type: $('resType').value, name: $('resName').value, conf: $('resConf').value, date: $('resDate').value });
    $('addMap').onclick = () => addTo('maps', { label: $('mapLabel').value, url: $('mapUrl').value });
    $('addBudget').onclick = () => addTo('budget', { cat: $('budCat').value, desc: $('budDesc').value, amount: Number($('budAmt').value || 0) });
    $('addPacking').onclick = () => addTo('packing', { person: $('packPerson').value || 'Shared', item: $('packItem').value, type: $('packType').value, doneBy: {} });
    $('addMeal').onclick = () => addTo('meals', { date: $('mealDate').value, name: $('mealName').value, person: $('mealPerson').value });
    $('addVoteOption').onclick = () => { const question = $('voteQuestion').value.trim() || 'Trip Vote'; const option = $('voteOption').value.trim(); if (!option) return; state.votes.push({ id: uid(), question, option, voters: [] }); clearFields('voteQuestion','voteOption'); log(`Added vote option: ${option}`); };
    $('loadWeather').onclick = loadWeather;
    $('unlockAdmin').onclick = () => { if ($('adminPin').value === ADMIN_PIN) { $('adminPanel').classList.remove('hidden'); log('Admin unlocked'); } else alert('Incorrect PIN'); };
    $('exportData').onclick = exportJson;
    $('clearLocal').onclick = () => { if (confirm('Clear local saved data on this device?')) { localStorage.removeItem(localKey); location.reload(); } };
    $('photoInput').onchange = handlePhotos;
    $('layoutSelect').onchange = renderScrapbook;
    $('frameSelect').onchange = renderScrapbook;
    $('addTextSticker').onclick = addTextSticker;
    $('exportJpeg').onclick = exportJpeg;
    $('exportPdf').onclick = exportPdf;
    $('saveScrapbook').onclick = () => log('Saved scrapbook layout');
  }
  function addTo(key, obj) { if (Object.values(obj).every(v => v === '' || v === 0 || v == null)) return; state[key].push({ id: uid(), ...obj }); clearRowInputs(); log(`Added ${key} item`); }
  function clearFields(...ids) { ids.forEach(id => $(id).value = ''); }
  function clearRowInputs() { qsa('.tab-panel.active input').forEach(i => i.value = ''); }
  function remove(key, id) { state[key] = state[key].filter(x => x.id !== id); log(`Removed ${key} item`); }
  function itemHtml(main, sub, actions = '') { return `<div><b>${escapeHtml(main || 'Untitled')}</b>${sub ? `<br><small>${escapeHtml(sub)}</small>` : ''}</div><div class="actions">${actions}</div>`; }
  function renderList(id, arr, key, format) { $(id).innerHTML = arr.map(x => `<div class="item">${format(x)}<button onclick="OFA.remove('${key}','${x.id}')">Delete</button></div>`).join('') || '<p class="hint">Nothing added yet.</p>'; }
  function renderAll() {
    $('tripName').value = state.trip?.name || ''; $('destination').value = state.trip?.destination || ''; $('startDate').value = state.trip?.startDate || ''; $('weatherLocation').value = state.trip?.weatherLocation || state.trip?.destination || ''; $('sharedNotes').value = state.notes || '';
    renderCountdown();
    renderList('itineraryList', [...(state.itinerary||[])].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)), 'itinerary', x => itemHtml(x.title, `${x.date || ''} ${x.time || ''} ${x.location || ''}`));
    renderList('reservationList', state.reservations||[], 'reservations', x => itemHtml(`${x.type || 'Reservation'}: ${x.name || ''}`, `${x.date || ''} Confirmation: ${x.conf || ''}`));
    renderList('mapList', state.maps||[], 'maps', x => itemHtml(x.label, x.url, x.url ? `<a class="button" target="_blank" rel="noopener" href="${safeUrl(x.url)}">Open</a>` : ''));
    $('budgetTotal').textContent = money((state.budget||[]).reduce((s,x)=>s+Number(x.amount||0),0));
    renderList('budgetList', state.budget||[], 'budget', x => itemHtml(`${x.cat || 'Budget'} - ${money(x.amount)}`, x.desc));
    renderPacking(); renderList('mealList', state.meals||[], 'meals', x => itemHtml(x.name, `${x.date || ''} Assigned to: ${x.person || ''}`));
    renderVotes(); renderPhotoTray(); renderScrapbook(); renderAnalytics(); renderActivity();
  }
  function renderPacking() { $('packingList').innerHTML = (state.packing||[]).map(x => { const person = x.person || 'Shared'; const done = !!x.doneBy?.[person]; return `<div class="item ${done?'done':''}"><div><b>${escapeHtml(x.item)}</b><br><small>${escapeHtml(x.type)} • ${escapeHtml(person)}</small></div><div class="actions"><button onclick="OFA.togglePack('${x.id}')">${done?'Undo':'Check'}</button><button onclick="OFA.remove('packing','${x.id}')">Delete</button></div></div>`; }).join('') || '<p class="hint">Nothing packed yet.</p>'; }
  function togglePack(id) { const x = state.packing.find(p=>p.id===id); if (!x) return; const person = x.person || 'Shared'; x.doneBy = x.doneBy || {}; x.doneBy[person] = !x.doneBy[person]; log(`Updated packing item for ${person}`); }
  function renderVotes() { $('voteList').innerHTML = (state.votes||[]).map(v => `<div class="item"><div><b>${escapeHtml(v.question)}</b><br><small>${escapeHtml(v.option)} • ${v.voters.length} vote(s)</small></div><div class="actions"><input aria-label="Voter name" placeholder="Name" id="voter-${v.id}"><button onclick="OFA.vote('${v.id}')">Vote</button><button onclick="OFA.remove('votes','${v.id}')">Delete</button></div></div>`).join('') || '<p class="hint">No voting options yet.</p>'; }
  function vote(id) { const input = $(`voter-${id}`); const name = input.value.trim(); const v = state.votes.find(x=>x.id===id); if (!name || !v) return; if (!v.voters.includes(name)) v.voters.push(name); log(`${name} voted for ${v.option}`); }
  function renderAnalytics() { const votes = state.votes || []; $('analyticsBox').innerHTML = [metric('Itinerary', state.itinerary?.length||0), metric('Reservations', state.reservations?.length||0), metric('Budget Total', money((state.budget||[]).reduce((s,x)=>s+Number(x.amount||0),0))), metric('Packing Items', state.packing?.length||0), metric('Photos', state.photos?.length||0), metric('Votes Cast', votes.reduce((s,v)=>s+v.voters.length,0))].join('') + '<div class="card"><h4>Vote Details</h4>' + (votes.map(v=>`<p><b>${escapeHtml(v.option)}</b>: ${v.voters.map(escapeHtml).join(', ') || 'No votes'}</p>`).join('') || 'No votes yet.') + '</div>'; }
  function metric(label, value) { return `<div class="metric"><b>${value}</b><br><span>${label}</span></div>`; }
  function renderActivity() { $('activityLog').innerHTML = (state.activity||[]).map(a=>`<div class="item"><div><b>${escapeHtml(a.action)}</b><br><small>${escapeHtml(a.at)}</small></div></div>`).join('') || '<p class="hint">No activity yet.</p>'; }
  function renderCountdown() { const box = $('countdown'); const d = state.trip?.startDate ? new Date(`${state.trip.startDate}T00:00:00`) : null; if (!d || Number.isNaN(+d)) { box.textContent = 'Set a trip date below.'; return; } const days = Math.ceil((d - new Date()) / 86400000); box.textContent = days > 0 ? `${days} day(s) until ${state.trip.name || 'your adventure'}!` : days === 0 ? 'Trip starts today!' : `Trip started ${Math.abs(days)} day(s) ago.`; }
  async function loadWeather() { const loc = $('weatherLocation').value.trim() || state.trip.destination; if (!loc) return alert('Enter a weather location.'); $('weatherBox').textContent = 'Loading weather…'; state.trip.weatherLocation = loc; try { const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=en&format=json`).then(r=>r.json()); const place = geo.results?.[0]; if (!place) throw new Error('Location not found'); const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`).then(r=>r.json()); $('weatherBox').innerHTML = `<b>${escapeHtml(place.name)}, ${escapeHtml(place.admin1 || place.country || '')}</b><br>Now: ${w.current.temperature_2m}°F, wind ${w.current.wind_speed_10m} mph<br>Today: High ${w.daily.temperature_2m_max[0]}°F / Low ${w.daily.temperature_2m_min[0]}°F • Rain ${w.daily.precipitation_probability_max[0] || 0}%`; log(`Loaded weather for ${loc}`); } catch(e) { $('weatherBox').textContent = 'Weather could not load. Check spelling or internet connection.'; } }
  function handlePhotos(e) { [...e.target.files].forEach(file => { const reader = new FileReader(); reader.onload = () => { state.photos.push({ id: uid(), name: file.name, data: reader.result }); state.scrapbookItems.push({ id: uid(), type:'photo', photoId: state.photos.at(-1).id }); log(`Added photo: ${file.name}`); }; reader.readAsDataURL(file); }); e.target.value = ''; }
  function renderPhotoTray() { const tray = $('photoTray'); tray.innerHTML = (state.photos||[]).map((p,i)=>`<div class="photo-card" draggable="true" data-id="${p.id}"><img src="${p.data}" alt="${escapeHtml(p.name)}"><button onclick="OFA.deletePhoto('${p.id}')">×</button><small>${i+1}. ${escapeHtml(p.name)}</small></div>`).join('') || '<p class="hint">Choose photos to start.</p>'; enablePhotoDrag(); }
  function deletePhoto(id) { state.photos = state.photos.filter(p=>p.id!==id); state.scrapbookItems = state.scrapbookItems.filter(i=>i.photoId!==id); log('Deleted scrapbook photo'); }
  function enablePhotoDrag() { let dragId = null; qsa('.photo-card').forEach(card => { card.ondragstart = () => { dragId = card.dataset.id; card.classList.add('dragging'); }; card.ondragend = () => card.classList.remove('dragging'); card.ondragover = e => e.preventDefault(); card.ondrop = e => { e.preventDefault(); const targetId = card.dataset.id; if (!dragId || dragId === targetId) return; const arr = state.photos; const from = arr.findIndex(p=>p.id===dragId), to = arr.findIndex(p=>p.id===targetId); arr.splice(to,0,arr.splice(from,1)[0]); state.scrapbookItems = arr.map(p => state.scrapbookItems.find(i=>i.photoId===p.id) || {id:uid(), type:'photo', photoId:p.id}); log('Rearranged photos'); }; }); }
  function renderScrapbook() { const canvas = $('scrapCanvas'); canvas.className = `scrap-canvas ${$('layoutSelect').value} frame-${$('frameSelect').value}`; const html = (state.scrapbookItems||[]).map((it, idx) => { if (it.type === 'note') return `<div class="scrap-note">${escapeHtml(it.text)}</div>`; const p = state.photos.find(x=>x.id===it.photoId); return p ? `<div class="scrap-photo" style="--rot:${idx%2?2:-2}deg"><img src="${p.data}" alt="${escapeHtml(p.name)}"></div>` : ''; }).join(''); canvas.innerHTML = html || '<p class="hint">Your scrapbook page will appear here.</p>'; }
  function addTextSticker() { const text = [$('stickerSelect').value, $('captionText').value.trim()].filter(Boolean).join(' '); if (!text) return; state.scrapbookItems.push({ id: uid(), type: 'note', text }); clearFields('captionText'); $('stickerSelect').value=''; log('Added scrapbook text/sticker'); }
  async function exportJpeg() { if (!window.html2canvas) return alert('Export library is still loading.'); const canvas = await html2canvas($('scrapCanvas'), { backgroundColor: '#fffaf0', scale: 2 }); download(canvas.toDataURL('image/jpeg', .92), `our-family-adventures-scrapbook-v${VERSION}.jpg`); log('Exported scrapbook JPEG'); }
  async function exportPdf() { if (!window.html2canvas || !window.jspdf) return alert('PDF library is still loading.'); const c = await html2canvas($('scrapCanvas'), { backgroundColor: '#fffaf0', scale: 2 }); const pdf = new jspdf.jsPDF('landscape','pt','letter'); const w = pdf.internal.pageSize.getWidth(), h = c.height * w / c.width; pdf.addImage(c.toDataURL('image/jpeg', .92), 'JPEG', 0, 30, w, Math.min(h, pdf.internal.pageSize.getHeight()-60)); pdf.save(`our-family-adventures-scrapbook-v${VERSION}.pdf`); log('Exported scrapbook PDF'); }
  function exportJson() { download('data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state,null,2)), `our-family-adventures-v${VERSION}-backup.json`); }
  function download(href, filename) { const a = document.createElement('a'); a.href = href; a.download = filename; a.click(); }
  function safeUrl(url) { try { const u = new URL(url); return ['http:','https:'].includes(u.protocol) ? u.href : '#'; } catch { return '#'; } }
  function escapeHtml(v='') { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function pwa() { if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(console.warn); window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; $('installBtn').classList.remove('hidden'); }); $('installBtn').onclick = async () => { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; $('installBtn').classList.add('hidden'); } }; }
  window.OFA = { remove, togglePack, vote, deletePhoto };
  window.addEventListener('load', () => setTimeout(() => $('splash')?.classList.add('hide'), 900));
  document.addEventListener('DOMContentLoaded', async () => { loadLocal(); bindTabs(); bindInputs(); renderAll(); pwa(); await initFirebase(); });
})();
