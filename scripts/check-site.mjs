import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';
import { commonSocialImage, routes } from './seo.mjs';
const root = new URL('../site-build/', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('build-manifest.json', root)));
const base = new URL(manifest.site);
const commonImageMetadata = await sharp(fs.readFileSync(new URL(commonSocialImage, root))).metadata();
assert.equal(commonImageMetadata.width, 1200); assert.equal(commonImageMetadata.height, 630);
function checkSocial(doc, label) {
  assert.equal(doc.querySelectorAll('meta[property="og:image"]').length, 1, `${label}: exactly one sharing image`);
  const image = new URL(doc.querySelector('meta[property="og:image"]').content);
  assert.ok(['https:', 'http:'].includes(image.protocol));
  assert.equal(doc.querySelector('meta[name="twitter:image"]').content, image.href);
  assert.equal(doc.querySelector('meta[name="twitter:card"]').content, 'summary_large_image');
  assert.equal(doc.querySelector('meta[property="og:title"]').content, doc.title);
  assert.equal(doc.querySelector('meta[name="twitter:title"]').content, doc.title);
  assert.ok(doc.querySelector('meta[property="og:image:alt"]').content);
  if (image.origin === base.origin && image.pathname.startsWith(base.pathname)) {
    assert.ok(fs.existsSync(new URL(image.pathname.slice(base.pathname.length), root)), `${label}: sharing image exists`);
  }
}
let refs = 0;
for (const page of manifest.pages) {
  const dom = new JSDOM(fs.readFileSync(new URL(page.route + 'index.html', root), 'utf8'), { url: new URL(page.route, base).href });
  const doc = dom.window.document;
  assert.equal(doc.documentElement.lang, page.language);
  const indexable = manifest.indexing === 'production' && ['', 'about/', 'gallery/', 'news/', 'contact/'].includes(page.route.replace(/^en\//, ''));
  assert.equal(doc.querySelector('meta[name=robots]').content, indexable ? 'index, follow' : 'noindex');
  assert.ok(doc.querySelector('meta[name=description]').content);
  checkSocial(doc, page.route);
  if (page.route === 'en/') assert.equal(doc.title, 'Lace blooms in porcelain | KM Nagoya Doll');
  assert.equal(doc.querySelector('link[rel=canonical]').href, new URL(page.route, base).href);
  assert.equal(doc.querySelectorAll('link[rel=alternate][hreflang]').length, 3);
  assert.equal(doc.querySelectorAll('[data-language]').length, 2);
  const contactNext = doc.querySelector('[data-contact-form] input[name="_next"]');
  if (contactNext) assert.equal(contactNext.value, new URL(`${page.language === 'en' ? 'en/' : ''}contact-thanks/`, base).href, 'Contact return URL must match the build host and language');
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
for (const route of routes.filter(Boolean)) {
  const name = `${route.slice(0, -1)}.html`;
  const dom = new JSDOM(fs.readFileSync(new URL(name, root), 'utf8'));
  checkSocial(dom.window.document, name);
  assert.equal(dom.window.document.querySelector('meta[name="robots"]').content, 'noindex');
  assert.equal(dom.window.document.querySelector('link[rel="canonical"]').href, new URL(route, base).href);
  assert.equal(dom.window.document.querySelectorAll('script').length, 1, 'Legacy redirects stay lightweight');
  dom.window.close();
}
if (manifest.mode === 'site-first') {
  for (const page of manifest.pages) {
    const html = fs.readFileSync(new URL(page.route + 'index.html', root), 'utf8');
    const doc = new JSDOM(html).window.document;
    assert.equal(doc.querySelectorAll('[data-storefront],.shop-purchase').length, 0, 'No purchase UI in site-first release');
    assert.equal(doc.querySelectorAll('script[src*="shop.js"],script[src*="managed-photos.js"]').length, 0);
    assert.equal(doc.querySelectorAll('img[src*="cdn.shopify.com"]').length, 0, 'Photos must be independent of Shopify');
    if (page.route.endsWith('gallery/')) assert.equal(doc.querySelectorAll('.gallery-card').length, 10);
    if (/^(en\/)?(collection|product)\/$/.test(page.route)) assert.ok(doc.querySelector('.site-coming-soon h1'));
  }
  assert.ok(!fs.readFileSync(new URL('assets/storefront-api.js', root), 'utf8').includes('fetch('));
}
console.log(`Verified ${manifest.pages.length} initial-HTML pages, ${refs} local links/assets, language pairs, ${manifest.indexing} indexing and sharing metadata (including legacy URLs).`);
