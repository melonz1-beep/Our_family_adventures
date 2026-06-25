const screens = [...document.querySelectorAll('.screen')];
function show(id){
  screens.forEach(s=>s.classList.toggle('active', s.id===id));
  window.scrollTo({top:0,behavior:'smooth'});
}
document.addEventListener('click', e=>{
  const btn=e.target.closest('[data-go]');
  if(btn) show(btn.dataset.go);
});

const targetDate = new Date('2027-06-19T12:00:00');
function updateCountdown(){
  const el=document.getElementById('countdown');
  if(!el) return;
  const diff=targetDate-new Date();
  if(diff<=0){ el.textContent='This chapter is happening now'; return; }
  const days=Math.ceil(diff/86400000);
  el.textContent=`${days.toLocaleString()} days until Nags Head`;
}
updateCountdown(); setInterval(updateCountdown,3600000);

const defaultPeople=['Melissa & Family','Grandma & Grandpa','Aunt, Uncle & Cousins','Friends Who Are Family'];
const list=document.getElementById('peopleList');
function renderPeople(){
  const saved=JSON.parse(localStorage.getItem('ofa_people')||'null') || defaultPeople;
  list.innerHTML=saved.map(p=>`<div class="person-pill">${escapeHtml(p)}</div>`).join('');
}
function escapeHtml(str){return str.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
const form=document.getElementById('peopleForm');
if(form){
  renderPeople();
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const input=document.getElementById('personName');
    const name=input.value.trim();
    if(!name) return;
    const people=JSON.parse(localStorage.getItem('ofa_people')||'null') || defaultPeople;
    people.push(name);
    localStorage.setItem('ofa_people',JSON.stringify(people));
    input.value=''; renderPeople();
  });
}

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
}
