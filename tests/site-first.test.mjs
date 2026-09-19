import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { siteFirstContent, offlineAPI } from '../scripts/site-first.mjs';
import { localizedGalleryItem } from '../mockups/assets/gallery-data.js';

test('saved gallery has local images and both languages on preview and production paths', async () => {
  for (const url of ['https://hirojessica.github.io/kmrn/', 'https://km-nagoya-doll.com/']) {
    const site = new URL(url);
    const content = await siteFirstContent(site);
    assert.equal(content.ja.products.length, 0);
    assert.equal(content.ja.articles.length, 0);
    assert.equal(content.ja.gallery.length, 18);
    assert.deepEqual(content.en.gallery, content.ja.gallery);
    assert.equal(new Set(content.ja.gallery.map(node => node.handle)).size, 18);
    for (const node of content.ja.gallery) {
      const ja = localizedGalleryItem(node, 'ja');
      const en = localizedGalleryItem(node, 'en');
      for (const key of ['title', 'category']) {
        assert.ok(ja[key]); assert.ok(en[key]); assert.notEqual(en[key], ja[key]);
      }
      assert.equal(Boolean(en.caption), Boolean(ja.caption));
      if (ja.caption) assert.notEqual(en.caption, ja.caption);
      assert.ok(ja.image.url.startsWith(`${site}assets/`));
      const asset = ja.image.url.slice(site.href.length);
      await fs.access(new URL(`../mockups/${asset}`, import.meta.url));
    }
  }
});

test('generated gallery API works without network and resolves images next to the deployed module', async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'kmn-offline-api-'));
  const file = path.join(temporary, 'storefront-api.mjs');
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests++; throw new Error('Unexpected network request'); };
  try {
    const site = new URL('https://hirojessica.github.io/kmrn/');
    const content = await siteFirstContent(site);
    await fs.writeFile(file, offlineAPI(content.ja.gallery, site));
    const { storefront } = await import(pathToFileURL(file).href);
    const gallery = await storefront.gallery();
    assert.equal(gallery.nodes.length, 18);
    assert.equal(gallery.pageInfo.hasNextPage, false);
    const handles = gallery.nodes.slice(10).map(node => node.handle);
    assert.equal((await storefront.galleryByHandles(handles)).length, 8);
    assert.deepEqual((await storefront.news()).nodes, []);
    for (const node of gallery.nodes) {
      const image = node.fields.find(field => field.key === 'image').reference.image;
      const original = content.ja.gallery.find(item => item.handle === node.handle);
      const sourceURL = original.fields.find(field => field.key === 'image').reference.image.url;
      const relative = sourceURL.slice(`${site}assets/`.length);
      assert.equal(image.url, new URL(relative, pathToFileURL(file)).href);
    }
    assert.equal(requests, 0);
  } finally {
    globalThis.fetch = originalFetch;
    await fs.unlink(file).catch(error => { if (error.code !== 'ENOENT') throw error; });
    await fs.rmdir(temporary);
  }
});
