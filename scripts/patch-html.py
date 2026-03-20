"""
Patche dist/index.html pour ajouter :
  - Les balises PWA (manifest, theme-color, apple-touch-icon...)
  - Un splash screen CSS "Images Manager" affiché pendant le chargement JS
  - L'enregistrement du service worker
"""
import sys

PWA_HEAD = """
  <link rel="manifest" href="/ImagesManager_Mobile/manifest.json">
  <meta name="theme-color" content="#2563eb">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Images Manager">
  <link rel="apple-touch-icon" href="/ImagesManager_Mobile/icon-512.png">
  <link rel="icon" type="image/png" href="/ImagesManager_Mobile/favicon.png">
  <style>
    #im-splash {
      position:fixed;inset:0;background:#2563eb;
      display:flex;flex-direction:column;
      align-items:center;justify-content:center;z-index:99999;
      font-family:Arial,Helvetica,sans-serif;
    }
    #im-splash svg{margin-bottom:18px;}
    #im-splash .t1{color:#fff;font-size:26px;font-weight:700;margin:0;}
    #im-splash .t2{color:rgba(255,255,255,.6);font-size:13px;margin:6px 0 0;}
  </style>
"""

SPLASH_BODY = """
<div id="im-splash">
  <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
    <rect width="88" height="88" rx="14" fill="rgba(255,255,255,.18)"/>
    <rect x="10" y="26" width="68" height="42" rx="7" fill="white"/>
    <circle cx="44" cy="47" r="13" fill="#2563eb"/>
    <circle cx="44" cy="47" r="9" fill="white"/>
    <circle cx="44" cy="47" r="5" fill="#2563eb"/>
    <rect x="27" y="16" width="20" height="12" rx="4" fill="white"/>
  </svg>
  <p class="t1">Images Manager</p>
  <p class="t2">Bijoux &amp; WooCommerce</p>
</div>
<script>
  document.addEventListener('DOMContentLoaded',function(){
    var s=document.getElementById('im-splash');
    if(s){setTimeout(function(){
      s.style.transition='opacity .4s';
      s.style.opacity='0';
      setTimeout(function(){s.remove();},450);
    },1800);}
  });
  if('serviceWorker' in navigator){
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('/ImagesManager_Mobile/sw.js');
    });
  }
</script>
"""

with open("dist/index.html", "r", encoding="utf-8") as f:
    html = f.read()

html = html.replace("</head>", PWA_HEAD + "\n</head>")
html = html.replace('<div id="root"></div>', '<div id="root">' + SPLASH_BODY + '</div>')

with open("dist/index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("index.html patché avec succès")
