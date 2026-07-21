(()=>{'use strict';
const RELEASE='10.3.15';
let scheduled=false;
function captureEffects(){
 document.querySelectorAll('.ss2-object').forEach(object=>{
  const frame=object.querySelector('.ss2-frame');if(!frame)return;
  const raw=frame.style.boxShadow||'';
  if(!raw||raw==='none')return;
  const values=[...raw.matchAll(/(-?\d+(?:\.\d+)?)px/g)].map(match=>Number(match[1]));
  if(values.length>=2)object.dataset.actualShadow=String(Math.max(0,values[1]||0));
  if(values.length>=3)object.dataset.actualGlow=String(Math.max(0,values[2]||0));
 });
}
function fixFrameAllLabel(){
 const input=document.querySelector('.ss2-editor-flow #ss2-frame-all');
 if(!input||input.closest('label'))return;
 const label=document.createElement('label');label.className='ss2-check ss2-frame-all-label';
 input.before(label);label.append(input,document.createTextNode(' Apply this frame to every photo'));
}
function applyEffects(){
 scheduled=false;fixFrameAllLabel();
 document.querySelectorAll('.ss2-object').forEach(object=>{
  const frame=object.querySelector('.ss2-frame');if(!frame)return;
  const shadow=Number(object.dataset.actualShadow||object.dataset.shadow)||0;
  const glow=Number(object.dataset.actualGlow||object.dataset.glow)||0;
  const filters=[];
  if(shadow)filters.push(`drop-shadow(0 ${Math.max(3,shadow*.42)}px ${Math.max(3,shadow*.55)}px rgba(25,18,14,.58))`);
  if(glow)filters.push(`drop-shadow(0 0 ${Math.max(4,glow*.8)}px rgba(255,246,205,.96))`,`drop-shadow(0 0 ${Math.max(7,glow*1.45)}px rgba(255,255,255,.68))`);
  const next=filters.join(' ');
  if(object.style.filter!==next)object.style.filter=next;
  if(frame.style.boxShadow&&frame.style.boxShadow!=='none')frame.style.boxShadow='none';
 });
}
function schedule(){captureEffects();if(scheduled)return;scheduled=true;requestAnimationFrame(applyEffects)}
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['style']});
document.addEventListener('input',event=>{if(event.target?.matches?.('[data-prop="shadow"],[data-prop="glow"]'))setTimeout(schedule,0)});
addEventListener('load',schedule);schedule();window.OFAScrapbookEffectsFixVersion=RELEASE;
})();