import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { allPages, jsonScript, productSchema } from '../scripts/seo.mjs';
import { imageURL, responsiveImage } from '../mockups/assets/responsive-image.js';
import { siteURL, contentURL } from '../mockups/assets/site-url.js';
import { articleFragment } from '../mockups/assets/richtext.js';

test('static content pagination includes all public nodes and rejects partial/repeated pages', async () => {
  const result = await allPages(async after => after ? { nodes: [{ id: '2' }], pageInfo: { hasNextPage: false } } : { nodes: [{ id: '1' }], pageInfo: { hasNextPage: true, endCursor: 'next' } });
  assert.deepEqual(result.map(x => x.id), ['1', '2']);
  await assert.rejects(allPages(async () => ({ nodes: [], pageInfo: { hasNextPage: true, endCursor: 'same' } })), /cursor/);
});
test('structured products use actual SKUs and offers are gated by live sales', () => {
  const product = { id: 'gid://shopify/Product/1', title: '</script><img onerror=x>', description: 'Handcrafted', variants: { nodes: [
    { title: 'Pink', sku: 'A', price: { amount: '16500', currencyCode: 'JPY' }, availableForSale: true, selectedOptions: [{ name: 'Style', value: 'Pink' }] },
    { title: 'Green', sku: 'B', price: { amount: '16500', currencyCode: 'JPY' }, availableForSale: false }
  ] } };
  const preview = productSchema(product, 'https://example.com/product/panda/', 'en', false);
  assert.equal(preview.hasVariant[0].sku, 'A'); assert.equal(preview.hasVariant[0].offers, undefined);
  const live = productSchema(product, 'https://example.com/product/panda/', 'en', true);
  assert.equal(live.hasVariant[0].offers.price, '16500');
  assert.match(live.hasVariant[1].offers.availability, /OutOfStock$/);
  assert.doesNotMatch(jsonScript(live), /<\/script>/);
  assert.equal(JSON.parse(jsonScript(live)).name, product.title);
});
test('language URLs preserve project prefix, query/hash and new-content fallback', () => {
  for (const prefix of ['/', '/kmrn/']) {
    const dom = new JSDOM('<html lang="en" data-static-site="true" data-site-root="../../../" data-products="panda" data-articles="story"><head></head></html>', { url: `https://example.com${prefix}en/product/panda/` });
    globalThis.document = dom.window.document;
    assert.equal(siteURL('contact-thanks/').href, `https://example.com${prefix}en/contact-thanks/`);
    assert.equal(contentURL('product', 'panda').href, `https://example.com${prefix}en/product/panda/`);
    assert.equal(contentURL('article', 'story').href, `https://example.com${prefix}en/news/story/`);
    assert.equal(contentURL('product', 'new').href, `https://example.com${prefix}en/product/?handle=new`);
    const location = new URL(`https://example.com${prefix}en/product/?handle=panda&utm_source=test#main`);
    let redirect; location.replace = url => { redirect = url; };
    docForRedirect(dom.window.document, prefix);
    vm.runInNewContext(fs.readFileSync(new URL('../mockups/assets/clean-url.js', import.meta.url), 'utf8'), { document: dom.window.document, location, window: { location }, URL, URLSearchParams });
    assert.equal(redirect, `https://example.com${prefix}en/product/panda/?utm_source=test#main`);
    dom.window.close();
  }
  delete globalThis.document;
});
function docForRedirect(doc) { doc.documentElement.dataset.siteRoot = '../../'; doc.documentElement.dataset.knownHandles = 'panda'; }
test('responsive CDN images retain originals and version while limiting thumbnail width', () => {
  const dom = new JSDOM('<img>'), img = dom.window.document.querySelector('img');
  const original = 'https://cdn.shopify.com/s/files/1/image.jpg?v=123';
  responsiveImage(img, { url: original, width: 1280, height: 1280 }, { maxWidth: 240, sizes: '80px' });
  assert.equal(img.width, 1280); assert.match(img.src, /v=123&width=240/); assert.match(img.srcset, /240w/);
  assert.equal(img.loading, 'lazy'); assert.equal(imageURL('javascript:alert(1)', 100), null);
  assert.equal(imageURL('https://example.org/image.jpg', 100), 'https://example.org/image.jpg');
});
test('static rich text preserves product information and images without executable content', () => {
  const dom = new JSDOM('<body></body>', { url: 'https://example.com/product/' });
  globalThis.DOMParser = dom.window.DOMParser; globalThis.location = dom.window.location;
  const html = '<p>Benefits <strong>one tea</strong></p><script>alert(1)</script><img src="https://cdn.shopify.com/image.jpg" onerror="alert(1)"><a href="javascript:alert(1)">unsafe</a><table><tr><td>500cc</td></tr></table>';
  dom.window.document.body.append(articleFragment(html, dom.window.document));
  assert.match(dom.window.document.body.textContent, /one tea/);
  assert.match(dom.window.document.body.textContent, /500cc/);
  assert.equal(dom.window.document.querySelector('script,[onerror],a[href]'), null);
  assert.match(dom.window.document.querySelector('img').src, /width=/);
  assert.ok(dom.window.document.querySelector('.article-table-wrap'));
  delete globalThis.DOMParser; delete globalThis.location; dom.window.close();
});

test('offline revalidation retains initial body and blocks purchase; unpublished content is removed', async () => {
  globalThis.__KMN_BUILD__ = true;
  const { initDetail } = await import('../mockups/assets/shop.js');
  const { initArticle } = await import('../mockups/assets/content.js');
  for (const code of ['NETWORK', 'NOT_FOUND']) {
    const dom = new JSDOM('<html lang="ja"><section data-storefront="product" data-handle="panda"><div data-shop-status></div><div data-product-detail><h1>Initial product</h1><p>Original description</p><button class="shop-purchase">Buy</button></div></section><article data-content="article" data-handle="story"><div data-content-status></div><div data-article-body><h1>Initial article</h1><p>Original article</p></div></article></html>', { url: 'https://example.com/product/panda/' });
    globalThis.document = dom.window.document; globalThis.location = dom.window.location;
    const fail = async () => { throw Object.assign(new Error(code), { code }); };
    await initDetail(document.querySelector('section'), { product: fail });
    await initArticle(document.querySelector('article'), { article: fail });
    if (code === 'NETWORK') {
      assert.match(document.querySelector('[data-product-detail]').textContent, /Original description/);
      assert.match(document.querySelector('[data-article-body]').textContent, /Original article/);
      assert.equal(document.querySelector('.shop-purchase').disabled, true);
    } else {
      assert.doesNotMatch(document.querySelector('[data-product-detail]').textContent, /Original description/);
      assert.doesNotMatch(document.querySelector('[data-article-body]').textContent, /Original article/);
    }
    dom.window.close();
  }
  delete globalThis.document; delete globalThis.location; delete globalThis.__KMN_BUILD__;
});

test('variant deep links select the matching variant and photo without enabling checkout', async () => {
  globalThis.__KMN_BUILD__ = true;
  const { detailView } = await import('../mockups/assets/shop.js');
  const dom = new JSDOM('<html lang="en"><body></body></html>', { url: 'https://example.com/en/product/panda/?variant=2' });
  globalThis.document = dom.window.document; globalThis.location = dom.window.location;
  const product = { id: 'gid://shopify/Product/1', title: 'Panda', description: 'Body', variants: { nodes: [
    { id: 'gid://shopify/ProductVariant/1', title: 'Strawberry', availableForSale: true, price: { amount: '16500', currencyCode: 'JPY' } },
    { id: 'gid://shopify/ProductVariant/2', title: 'Matcha', availableForSale: true, price: { amount: '16500', currencyCode: 'JPY' }, image: { url: 'https://cdn.shopify.com/matcha.jpg', width: 1200, height: 1200 } }
  ] } };
  document.body.append(detailView(product, false));
  assert.equal(document.querySelector('select').selectedOptions[0].textContent, 'Matcha');
  assert.match(document.querySelector('.shop-detail-photo img').src, /matcha/);
  assert.equal(document.querySelector('.shop-purchase').disabled, true);
  delete globalThis.document; delete globalThis.location; delete globalThis.__KMN_BUILD__; dom.window.close();
});
