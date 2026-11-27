(function(){
  const cfg=window.FIREBASE_CONFIG||{};
  const unsafeOriginal=cfg.projectId==="maxtroit-download-hub"||cfg.apiKey==="AIzaSyD3Cpzu1tWUw7xqUKsC9COPwQDloNRKJKA"||cfg.authDomain==="maxtroit-download-hub.firebaseapp.com"||String(cfg.storageBucket||"").startsWith("maxtroit-download-hub.")||cfg.messagingSenderId==="957047554501"||cfg.appId==="1:957047554501:web:4ff8204465ba338ec94bac"||window.ADMIN_UID==="5607ISIL0PMq6HLmzhTxyFa2elY2";
  const ready=!!(cfg.apiKey&&cfg.apiKey!=="PASTE_API_KEY"&&cfg.apiKey!=="YOUR_FIREBASE_WEB_API_KEY"&&cfg.authDomain&&cfg.authDomain!=="YOUR_FIREBASE_PROJECT_ID.firebaseapp.com"&&cfg.projectId&&cfg.projectId!=="YOUR_PROJECT_ID"&&cfg.projectId!=="YOUR_FIREBASE_PROJECT_ID"&&cfg.storageBucket&&cfg.storageBucket!=="YOUR_FIREBASE_PROJECT_ID.firebasestorage.app"&&cfg.messagingSenderId&&cfg.messagingSenderId!=="YOUR_FIREBASE_MESSAGING_SENDER_ID"&&cfg.appId&&cfg.appId!=="YOUR_FIREBASE_WEB_APP_ID");
  window.hubCloud={ready:false,db:null,auth:null};
  if(!ready||!window.firebase){console.warn("MAXTROIT: Firebase config or SDK is not ready.");return;}
  try{if(!firebase.apps.length)firebase.initializeApp(cfg);window.hubCloud={ready:true,db:firebase.firestore(),auth:firebase.auth()};}
  catch(e){window.hubCloud={ready:false,db:null,auth:null,error:e};console.error("Firebase setup:",e);}
})();
