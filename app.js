const screens = [...document.querySelectorAll('.screen')];

function show(id){
  screens.forEach(screen => screen.classList.toggle('active', screen.id === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-go]');
  if(button) show(button.dataset.go);
});

const targetDate = new Date('2027-06-19T12:00:00');
function updateCountdown(){
  const el = document.getElementById('countdown');
  if(!el) return;
  const diff = targetDate - new Date();
  if(diff <= 0){
    el.textContent = 'This chapter is happening now';
    return;
  }
  const days = Math.ceil(diff / 86400000);
  el.textContent = `${days.toLocaleString()} days until Nags Head`;
}
updateCountdown();
setInterval(updateCountdown, 3600000);

const defaultPeople = [
  'Melissa',
  'Mike',
  'Karen',
  'Bob',
  'Emily',
  'Jake',
  'Chris',
  'Ashley'
];

const peopleList = document.getElementById('peopleList');
const peopleForm = document.getElementById('peopleForm');

function getPeople(){
  try { return JSON.parse(localStorage.getItem('ofa_people')) || defaultPeople; }
  catch { return defaultPeople; }
}

function savePeople(people){
  localStorage.setItem('ofa_people', JSON.stringify(people));
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
  }[char]));
}

function renderPeople(){
  if(!peopleList) return;
  const people = getPeople();
  peopleList.innerHTML = people.map((name, index) => `
    <div class="person-pill">
      <span>${escapeHtml(name)}</span>
      <button class="remove-person" data-remove-person="${index}" aria-label="Remove ${escapeHtml(name)}">×</button>
    </div>
  `).join('');
}

if(peopleList){
  peopleList.addEventListener('click', event => {
    const remove = event.target.closest('[data-remove-person]');
    if(!remove) return;
    const index = Number(remove.dataset.removePerson);
    const people = getPeople();
    people.splice(index, 1);
    savePeople(people);
    renderPeople();
  });
}

if(peopleForm){
  renderPeople();
  peopleForm.addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById('personName');
    const name = input.value.trim();
    if(!name) return;
    const people = getPeople();
    people.push(name);
    savePeople(people);
    input.value = '';
    renderPeople();
  });
}

if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
