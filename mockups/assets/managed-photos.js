import { storefront, safeImageURL } from './storefront-api.js?v=gallery-20260905';
import { localizedGalleryItem } from './gallery-data.js';

// Stable handles keep process photos connected even after the gallery grows.
const slots = [...document.querySelectorAll('[data-gallery-handle]')];
let controller, generation = 0;
async function loadPhotos() {
  if (!slots.length) return;
  controller?.abort(); controller = new AbortController(); const current = ++generation;
  const language = document.documentElement.lang === 'en' ? 'en' : 'ja';
  try {
    const nodes = await storefront.galleryByHandles(slots.map(slot => slot.dataset.galleryHandle), { language: language.toUpperCase(), signal: controller.signal });
    if (current !== generation) return;
    const entries = new Map(nodes.map(node => [node.handle, localizedGalleryItem(node, language)]));
    await Promise.all(slots.map(async slot => {
      const img = slot.querySelector('img');
      const entry = entries.get(slot.dataset.galleryHandle);
      const photo = entry?.image;
      const url = safeImageURL(photo?.url);
      if (!url) {
        img.hidden = true;
        img.removeAttribute('src');
        slot.dataset.photoState = 'unpublished';
        return;
      }
      try {
        if (img.src !== url) {
          const loaded = new Image();
          loaded.src = url;
          await loaded.decode();
          if (current !== generation) return;
          img.src = url;
        }
        img.alt = slot.getAttribute('aria-hidden') === 'true' ? '' : photo.altText || entry.title;
        img.width = photo.width;
        img.height = photo.height;
        img.hidden = false;
        slot.dataset.photoState = 'ready';
      } catch {
        if (current === generation) slot.dataset.photoState = 'error';
      }
    }));
  } catch {
    // Retain the last published photo if Shopify is temporarily unavailable.
    if (current === generation) slots.forEach(slot => { slot.dataset.photoState = 'error'; });
  }
}
document.addEventListener('kmn:languagechange', loadPhotos);
loadPhotos();
