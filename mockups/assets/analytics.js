// GA4: enabled on the production site only. Keep this file when switching sites.
// GitHub Pages, localhost and Shopify previews must not send production analytics.
(() => {
  'use strict';
  const productionHosts = ['km-nagoya-doll.com', 'www.km-nagoya-doll.com'];
  if (window.location.protocol !== 'https:' || !productionHosts.includes(window.location.hostname.toLowerCase())) return;
  if (window.__kmnGa4Loaded) return;
  window.__kmnGa4Loaded = true;

  const measurementId = 'G-2VPT10TFBK';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(tag);
})();
