import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const root = new URL('../site-build/', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('build-manifest.json', root)));
const base = new URL(manifest.site);
let refs = 0;
for (const page of manifest.pages) {
  const dom = new JSDOM(fs.readFileSync(new URL(page.route + 'index.html', root), 'utf8'), { url: new URL(page.route, base).href });
  const doc = dom.window.document;
  assert.equal(doc.documentElement.lang, page.language);
  assert.equal(doc.querySelector('meta[name=robots]').content, 'noindex', 'Preview must remain excluded');
  assert.ok(doc.querySelector('meta[name=description]').content);
  assert.equal(doc.querySelector('link[rel=canonical]').href, new URL(page.route, base).href);
  assert.equal(doc.querySelectorAll('link[rel=alternate][hreflang]').length, 3);
  assert.equal(doc.querySelectorAll('[data-language]').length, 2);
  for (const lang of ['ja', 'en']) {
    const target = doc.querySelector(`[data-language=${lang}]`);
    assert.equal(target.tagName, 'A');
    const targetPath = new URL(target.href).pathname.slice(base.pathname.length);
    const targetDoc = new JSDOM(fs.readFileSync(new URL(targetPath + 'index.html', root), 'utf8')).window.document;
    assert.equal(targetDoc.documentElement.lang, lang);
  }
  for (const el of doc.querySelectorAll('[href],[src],img[srcset]')) {
    const urls = ['href', 'src'].map(a => el.getAttribute(a)).filter(Boolean);
    if (el.hasAttribute('srcset')) urls.push(...el.getAttribute('srcset').split(',').map(part => part.trim().split(' ')[0]));
    for (const source of urls) {
      const url = new URL(source, new URL(page.route, base));
      if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) continue;
      let relative = decodeURIComponent(url.pathname.slice(base.pathname.length));
      if (!path.extname(relative)) relative = relative.replace(/\/?$/, '/') + 'index.html';
      // At the site root the relative name starts with '/'; normalize it.
      relative = relative.replace(/^\//, '');
      assert.ok(fs.existsSync(new URL(relative, root)), `${page.route}: missing ${source}`); refs++;
    }
  }
  if (page.kind === 'product') {
    assert.ok(doc.querySelector('.shop-description').textContent.trim(), 'Product description is in initial HTML');
    assert.ok(doc.querySelector('.shop-detail h1').textContent.trim());
    const schema = JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
    assert.ok(['Product', 'ProductGroup'].includes(schema['@type']));
    assert.ok(doc.querySelector('.shop-detail-photo img').srcset);
    assert.equal(doc.querySelector('.shop-purchase').disabled, true, 'Fresh stock required before checkout');
  }
  if (page.kind === 'article') {
    assert.ok(doc.querySelector('.article-body').textContent.trim(), 'Article body is in initial HTML');
    assert.equal(JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent)['@type'], 'BlogPosting');
  }
  for (const img of doc.querySelectorAll('img[srcset]')) assert.ok(img.getAttribute('sizes'));
  dom.window.close();
}
console.log(`Verified ${manifest.pages.length} initial-HTML pages, ${refs} local links/assets, language pairs and preview noindex.`);
