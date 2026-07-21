(()=>{
  'use strict';
  const RELEASE='10.3.11';
  const OLD='10.3.10';

  function replaceVisibleVersion(root=document){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(node.nodeValue&&node.nodeValue.includes(OLD)) node.nodeValue=node.nodeValue.replaceAll(OLD,RELEASE);
    }
    if(document.title.includes(OLD)) document.title=document.title.replaceAll(OLD,RELEASE);
  }

  function refreshStoredVersion(){
    try{
      const key='ofa-9-data';
      const value=localStorage.getItem(key);
      if(!value)return;
      const parsed=JSON.parse(value);
      if(parsed&&parsed.version===OLD){
        parsed.version=RELEASE;
        localStorage.setItem(key,JSON.stringify(parsed));
      }
    }catch(error){console.warn('Version cache refresh skipped',error)}
  }

  function requestLatestWorker(){
    if(!('serviceWorker' in navigator))return;
    navigator.serviceWorker.getRegistrations().then(registrations=>{
      registrations.forEach(registration=>{
        registration.update().catch(()=>{});
        registration.waiting?.postMessage({type:'SKIP_WAITING'});
        registration.active?.postMessage({type:'CLEAR_OLD_CACHES'});
      });
    }).catch(()=>{});
  }

  replaceVisibleVersion();
  refreshStoredVersion();
  requestLatestWorker();
  const observer=new MutationObserver(()=>replaceVisibleVersion());
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  window.setTimeout(()=>observer.disconnect(),30000);
  window.OFAVersion=RELEASE;
})();
