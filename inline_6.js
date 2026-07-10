
(function(){
  function wire(){
    var enter=document.getElementById('enterButton');
    if(enter) enter.onclick=function(){ if(window.app&&app.enter) app.enter(); };
    var notify=document.getElementById('notificationButton');
    if(notify) notify.onclick=function(){ if(window.app&&app.notify) app.notify(); };
    var install=document.getElementById('installButton');
    if(install) install.onclick=function(){ if(window.app&&app.install) app.install(); };
    var status=document.getElementById('sync');
    if(window.app){
      if(status && /Starting|Loading problem|Loading app/.test(status.textContent)) status.textContent='App ready';
    } else if(status) {
      status.textContent='App could not start. Please redeploy all Version 9.1.2 files.';
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wire); else wire();
})();
