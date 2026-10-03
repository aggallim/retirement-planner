// Cloudflare Web Analytics (intent/059). Cookieless, anonymous page-view
// counts only; it never sees anything typed into the app. Shared by
// index.html and feedback.html. Paste the site token here (Cloudflare
// dashboard -> Analytics & Logs -> Web Analytics -> Add a site, manual
// setup). The token is a public identifier, safe to commit. Empty = off.
window.ANALYTICS_TOKEN = '';

// The loader lives here so both pages only need one script tag. It does
// nothing unless a token is set, the page is on the live site (so local
// testing and forks aren't counted), and the browser hasn't sent Do Not
// Track or Global Privacy Control.
(function () {
  var token = window.ANALYTICS_TOKEN;
  if (!token || location.hostname !== 'aggallim.github.io') return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl) return;
  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: token }));
  document.head.appendChild(s);
})();
