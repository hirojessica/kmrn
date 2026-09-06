import test from 'node:test';
import assert from 'node:assert/strict';
import { galleryPage, galleryPageNumbers, loadGalleryEntries } from '../mockups/assets/gallery-pagination.js';

const photo = (id, category = '作品', english = 'Pieces') => ({ id: String(id), fields: [
  { key: 'title', value: `写真${id}` }, { key: 'category', value: category }, { key: 'category_en', value: english },
  { key: 'image', reference: { image: { url: `https://example.com/${id}.jpg` } } },
] });

test('18 photos are split into ten and eight without omissions or duplicates', () => {
  const entries = Array.from({ length: 18 }, (_, i) => photo(i));
  const first = galleryPage(entries), last = galleryPage(entries, { page: 2 });
  assert.equal(first.entries.length, 10); assert.equal(last.entries.length, 8);
  assert.deepEqual([...first.entries, ...last.entries], entries);
  assert.deepEqual([last.start, last.end, last.total, last.pages], [11, 18, 18, 2]);
});

test('global category filtering precedes pagination and stays stable between languages', () => {
  const entries = Array.from({ length: 23 }, (_, i) => photo(i, i % 2 ? '制作工程' : '作品', i % 2 ? 'Making process' : 'Pieces'));
  const first = galleryPage(entries, { category: 'category:作品' });
  const next = galleryPage(entries, { category: first.category, page: 2, language: 'en' });
  assert.equal(first.total, 12); assert.equal(next.entries.length, 2);
  assert.deepEqual(next.entries.map(n => n.id), ['20', '22']);
  assert.equal(next.categories.find(c => c.key === first.category).label, 'Pieces');
});

test('empty, exact-ten, deleted category, invalid page and missing category are handled', () => {
  assert.equal(galleryPage([]).total, 0); assert.equal(galleryPage([]).start, 0);
  const ten = Array.from({ length: 10 }, (_, i) => photo(i));
  assert.equal(galleryPage(ten, { page: 200 }).page, 1);
  for (const page of ['NaN', -1, 0, 1.2, Infinity]) assert.equal(galleryPage(ten, { page }).page, 1);
  assert.equal(galleryPage(ten, { category: 'deleted' }).category, null);
  assert.equal(galleryPage([photo(1, '', '')], { language: 'en' }).categories[0].label, 'Uncategorized');
  assert.deepEqual(galleryPageNumbers(50, 100), [1, null, 49, 50, 51, null, 100]);
});

test('categories beyond the first hundred, duplicate IDs and invalid images do not corrupt totals', async () => {
  const first = Array.from({ length: 100 }, (_, i) => photo(i));
  const invalid = photo(200); invalid.fields.at(-1).reference.image.url = 'javascript:alert(1)';
  const calls = [];
  const entries = await loadGalleryEntries({ gallery: async args => {
    calls.push(args);
    return args.after ? { nodes: [first[99], photo(100, '歴史資料', 'History'), invalid], pageInfo: { hasNextPage: false } }
      : { nodes: first, pageInfo: { hasNextPage: true, endCursor: 'second' } };
  } });
  assert.equal(entries.length, 101); assert.equal(calls[1].after, 'second');
  assert.equal(galleryPage(entries, { category: 'category:歴史資料' }).total, 1);
});

test('an incomplete API result or repeated cursor fails instead of showing a partial gallery', async () => {
  await assert.rejects(loadGalleryEntries({ gallery: async ({ after }) => {
    if (after) throw new Error('offline');
    return { nodes: [photo(1)], pageInfo: { hasNextPage: true, endCursor: 'next' } };
  } }), /offline/);
  await assert.rejects(loadGalleryEntries({ gallery: async () => ({ nodes: [], pageInfo: { hasNextPage: true, endCursor: 'same' } }) }), /did not advance/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(loadGalleryEntries({ gallery: () => { throw new Error('should not run'); } }, controller.signal), { name: 'AbortError' });
});
