const screens = [...document.querySelectorAll('.screen')];
function show(id){screens.forEach(screen => screen.classList.toggle('active', screen.id === id)); closeMenu(); window.scrollTo({top:0, behavior:'smooth'});}
document.addEventListener('click', e=>{const b=e.target.closest('[data-go]'); if(b) show(b.dataset.go);});

const drawer=document.getElementById('menuDrawer');
const shade=document.getElementById('drawerShade');
function openMenu(){drawer?.classList.add('open'); shade?.classList.add('open'); drawer?.setAttribute('aria-hidden','false');}
function closeMenu(){drawer?.classList.remove('open'); shade?.classList.remove('open'); drawer?.setAttribute('aria-hidden','true');}
document.addEventListener('click', e=>{if(e.target.closest('[data-open-menu]')) openMenu(); if(e.target.closest('[data-close-menu]')) closeMenu();});

const targetDate = new Date('2027-06-19T12:00:00');
function daysUntil(){const diff=targetDate-new Date(); return diff<=0 ? 0 : Math.ceil(diff/86400000);}
function updateCountdown(){
  const days=daysUntil().toLocaleString();
  const num=document.getElementById('countdownNumber'); const home=document.getElementById('homeCountdownNumber'); const label=document.getElementById('countdownLabel');
  if(num) num.textContent=days; if(home) home.textContent=days; if(label) label.innerHTML=days==='0'?'this chapter<br/>is happening':'days until<br/>Nags Head';
}
updateCountdown(); setInterval(updateCountdown,3600000);

const defaultPeople=['Melissa Lehr','Bob','Emily','Jake','Karen','Chris'];
const peopleList=document.getElementById('peopleList'); const peopleForm=document.getElementById('peopleForm');
function getPeople(){try{return JSON.parse(localStorage.getItem('ofa_people_v7'))||defaultPeople}catch{return defaultPeople}}
function savePeople(p){localStorage.setItem('ofa_people_v7',JSON.stringify(p))}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function initials(name){return name.split(/\s+/).filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();}
function renderPeople(){
  if(!peopleList)return; const p=getPeople();
  peopleList.innerHTML=p.map((name,i)=>`<div class="person-pill"><span class="avatar">${escapeHtml(initials(name))}</span><span class="person-name">${escapeHtml(name)}</span><button class="profile-upload" data-profile="${i}">Photo</button><button class="remove-person" data-remove-person="${i}" aria-label="Remove ${escapeHtml(name)}">×</button></div>`).join('');
}
peopleList?.addEventListener('click',e=>{
  const r=e.target.closest('[data-remove-person]'); if(r){const p=getPeople(); p.splice(Number(r.dataset.removePerson),1); savePeople(p); renderPeople(); return;}
  const upload=e.target.closest('[data-profile]'); if(upload){alert('Profile photo upload will connect here. For now this keeps the layout ready for family profile pictures.');}
});
if(peopleForm){renderPeople(); peopleForm.addEventListener('submit',e=>{e.preventDefault(); const input=document.getElementById('personName'); const name=input.value.trim(); if(!name)return; const p=getPeople(); p.push(name); savePeople(p); input.value=''; renderPeople();});}

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));}
