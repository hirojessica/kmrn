// Shopify's image CDN resizes the original without changing its crop or aspect ratio.
export function imageURL(source, width) {
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:') return null;
    if (url.hostname === 'cdn.shopify.com' && width) url.searchParams.set('width', String(Math.round(width)));
    return url.href;
  } catch { return null; }
}

export function responsiveImage(img, image, { maxWidth = 1440, sizes = '(max-width: 880px) 100vw, 50vw', eager = false } = {}) {
  const source = image?.url || img.getAttribute('src');
  const width = Number(image?.width || img.getAttribute('width'));
  const height = Number(image?.height || img.getAttribute('height'));
  const src = imageURL(source, Math.min(width || maxWidth, maxWidth));
  if (!src) return;
  img.src = src;
  if (new URL(src).hostname === 'cdn.shopify.com') {
    const ceiling = Math.min(width || maxWidth, maxWidth);
    const widths = [...new Set([320, 480, 768, 1024, 1440, 1920].filter(w => w < ceiling).concat(ceiling))];
    img.srcset = widths.map(w => `${imageURL(source, w)} ${w}w`).join(', ');
    img.sizes = sizes;
  }
  if (width > 0 && height > 0) { img.width = width; img.height = height; }
  img.loading = eager ? 'eager' : 'lazy';
  img.decoding = 'async';
  if (eager) img.setAttribute('fetchpriority', 'high');
  else img.removeAttribute('fetchpriority');
}
