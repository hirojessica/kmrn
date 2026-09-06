(() => {
 const languageButtons = document.querySelectorAll('[data-language]');
 const setLanguage = lang => {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-ja][data-en]').forEach(el => el.textContent = el.dataset[lang]);
  document.querySelectorAll('[data-aria-ja][data-aria-en]').forEach(el => el.setAttribute('aria-label', lang === 'en' ? el.dataset.ariaEn : el.dataset.ariaJa));
  languageButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.language === lang)));
  const titles = document.querySelector('title').dataset;
  document.title = lang === 'ja' ? (titles.titleJa || '陶に咲く、レース。｜KM名古屋ドール株式会社') : (titles.titleEn || 'Lace blooms in porcelain | KM Nagoya Doll');
  try { localStorage.setItem('kmn-language',lang); } catch {}
  document.dispatchEvent(new CustomEvent('kmn:languagechange', { detail: { language: lang } }));
 };
 let initial = 'ja';
 try { const saved=localStorage.getItem('kmn-language'); if (saved==='ja'||saved==='en') initial=saved; } catch {}
 setLanguage(initial);
 languageButtons.forEach(b => b.addEventListener('click',()=>setLanguage(b.dataset.language)));
 const dialog=document.querySelector('.lr-menu'), open=document.querySelector('.lr-menu-open'), close=document.querySelector('.lr-menu-close');
 if (!dialog || !open || !close) return;
 open.addEventListener('click',()=>{dialog.showModal();open.setAttribute('aria-expanded','true');});
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right)dialog.close();}});
 dialog.addEventListener('close',()=>{open.setAttribute('aria-expanded','false');open.focus();});
})();
