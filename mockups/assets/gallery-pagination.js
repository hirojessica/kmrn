import { localizedGalleryItem } from './gallery-data.js';
import { safeImageURL } from './storefront-api.js?v=content-20260905';

export const GALLERY_PAGE_SIZE = 10;

// Read every metadata page so filters include photos beyond the first API batch.
// Image files are only requested when their ten visible cards are rendered.
export async function loadGalleryEntries(client, signal) {
  const entries = new Map(), cursors = new Set();
  let after = null;
  do {
    signal?.throwIfAborted();
    const result = await client.gallery({ first: 100, after, language: 'JA', signal });
    for (const node of result.nodes) {
      if (!entries.has(node.id) && safeImageURL(localizedGalleryItem(node).image?.url)) entries.set(node.id, node);
    }
    if (!result.pageInfo.hasNextPage) return [...entries.values()];
    after = result.pageInfo.endCursor;
    if (!after || cursors.has(after)) throw new Error('Gallery pagination did not advance');
    cursors.add(after);
  } while (true);
}

function categoryOf(node, language) {
  const fields = Object.fromEntries((node.fields || []).map(field => [field.key, field.value]));
  const normalize = value => (value || '').trim().replace(/\s+/g, ' ');
  const original = normalize(fields.category) || normalize(fields.category_en);
  return {
    key: original ? `category:${original}` : 'uncategorized',
    label: normalize(language === 'en' ? fields.category_en : fields.category) || original || (language === 'en' ? 'Uncategorized' : '未分類'),
  };
}

export function galleryPage(entries, { category = null, page = 1, language = 'ja' } = {}) {
  const categories = new Map();
  for (const node of entries) {
    const item = categoryOf(node, language);
    if (!categories.has(item.key)) categories.set(item.key, { ...item, count: 0 });
    categories.get(item.key).count++;
  }
  const selected = categories.has(category) ? category : null;
  const filtered = selected ? entries.filter(node => categoryOf(node, language).key === selected) : entries;
  const pages = Math.max(1, Math.ceil(filtered.length / GALLERY_PAGE_SIZE));
  const requested = Number(page);
  const current = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, pages) : 1;
  const start = (current - 1) * GALLERY_PAGE_SIZE;
  return { category: selected, page: current, pages, total: filtered.length, start: filtered.length ? start + 1 : 0,
    end: Math.min(start + GALLERY_PAGE_SIZE, filtered.length), entries: filtered.slice(start, start + GALLERY_PAGE_SIZE), categories: [...categories.values()] };
}

export function galleryPageNumbers(page, pages) {
  const selected = [...new Set([1, page - 1, page, page + 1, pages])].filter(n => n >= 1 && n <= pages).sort((a, b) => a - b);
  return selected.flatMap((n, index) => index && n - selected[index - 1] > 1 ? [null, n] : [n]);
}
