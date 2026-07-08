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
