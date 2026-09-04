(() => {
 'use strict';
 const drawer=document.getElementById('kmn-menu'), opener=document.querySelector('[data-menu-open]');
 let lastFocus;
 const setMenu=(open)=>{if(!drawer)return;drawer.hidden=!open;document.querySelectorAll('main,.kmn-header,.kmn-footer').forEach(el=>el.inert=open);opener?.setAttribute('aria-expanded',String(open));document.body.style.overflow=open?'hidden':'';if(open){lastFocus=document.activeElement;drawer.querySelector('[data-menu-close]').focus();}else{lastFocus?.focus();}};
 opener?.addEventListener('click',()=>setMenu(true));
 drawer?.addEventListener('click',e=>{if(e.target===drawer||e.target.closest('[data-menu-close]')||e.target.closest('a'))setMenu(false);});
 drawer?.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const items=[...drawer.querySelectorAll('a,button')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
 const dialog=document.getElementById('gallery-dialog');
 document.addEventListener('click',e=>{
  const photo=e.target.closest('[data-gallery-image]');
  if(photo&&dialog){const original=photo.querySelector('img'),img=dialog.querySelector('#gallery-dialog-image');img.src=photo.dataset.galleryImage;img.alt=original.alt;dialog.querySelector('#gallery-dialog-caption').textContent=photo.closest('figure').querySelector('figcaption').textContent;dialog.showModal();}
  if(e.target.closest('[data-gallery-close]'))dialog?.close();
  const filter=e.target.closest('[data-gallery-filter]');
  if(filter){document.querySelectorAll('[data-gallery-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===filter)));document.querySelectorAll('[data-category]').forEach(f=>f.hidden=filter.dataset.galleryFilter!=='all'&&f.dataset.category!==filter.dataset.galleryFilter);}
 });
 dialog?.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawer&&!drawer.hidden)setMenu(false);});
})();