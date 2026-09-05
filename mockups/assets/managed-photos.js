import { storefront, safeImageURL } from './storefront-api.js?v=gallery-20260905';

// Stable handles keep process photos connected even after the gallery grows.
const slots = [...document.querySelectorAll('[data-gallery-handle]')];
if (slots.length) {
  try {
    const nodes = await storefront.galleryByHandles(slots.map(slot => slot.dataset.galleryHandle));
    const entries = new Map(nodes.map(node => [node.handle, Object.fromEntries(node.fields.map(field => [field.key, field]))]));
    await Promise.all(slots.map(async slot => {
      const img = slot.querySelector('img');
      const entry = entries.get(slot.dataset.galleryHandle);
      const photo = entry?.image?.reference?.image;
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
          img.src = url;
        }
        img.alt = photo.altText || entry.title?.value || img.alt;
        img.width = photo.width;
        img.height = photo.height;
        img.hidden = false;
        slot.dataset.photoState = 'ready';
      } catch {
        slot.dataset.photoState = 'error';
      }
    }));
  } catch {
    // Retain the last published photo if Shopify is temporarily unavailable.
    slots.forEach(slot => { slot.dataset.photoState = 'error'; });
  }
}
