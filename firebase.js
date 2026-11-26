(function(){
  const cfg=window.FIREBASE_CONFIG||{};
  const unsafeOriginal=cfg.projectId==="maxtroit-download-hub"||window.ADMIN_UID==="5607ISIL0PMq6HLmzhTxyFa2elY2";
  const ready=!!(cfg.apiKey&&cfg.apiKey!=="PASTE_API_KEY"&&cfg.projectId&&cfg.projectId!=="YOUR_PROJECT_ID");
  window.hubCloud={ready:false,db:null,auth:null};
  if(window.MAXTROIT_FORK_SETUP_REQUIRED||unsafeOriginal){console.warn("MAXTROIT fork: Firebase initialization blocked until an independent project and admin UID are configured.");return;}
  if(!ready||!window.firebase){console.warn("MAXTROIT: Firebase config or SDK is not ready.");return;}
  try{if(!firebase.apps.length)firebase.initializeApp(cfg);window.hubCloud={ready:true,db:firebase.firestore(),auth:firebase.auth()};}
  catch(e){window.hubCloud={ready:false,db:null,auth:null,error:e};console.error("Firebase setup:",e);}
})();
