import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../mockups/assets/analytics.js', import.meta.url), 'utf8');
function browser(url, existing = {}) {
  const scripts = [];
  const window = { location: new URL(url), ...existing };
  const context = { window, document: {
    createElement: () => ({}),
    head: { appendChild: script => scripts.push(script) },
  } };
  return { window, scripts, run: () => runInNewContext(source, context) };
}

test('both HTTPS production hosts initialize the supplied GA4 tag once', () => {
  for (const host of ['km-nagoya-doll.com', 'www.km-nagoya-doll.com']) {
    const page = browser(`https://${host}/product.html?handle=luminous-doughnut-panda-teapot`);
    page.run();
    page.run();
    assert.equal(page.scripts.length, 1);
    assert.equal(page.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-2VPT10TFBK');
    assert.equal(page.scripts[0].async, true);
    assert.equal(page.window.dataLayer.length, 2);
    assert.equal(page.window.dataLayer[0][0], 'js');
    assert.deepEqual(Array.from(page.window.dataLayer[1]), ['config', 'G-2VPT10TFBK']);
  }
});

test('previews and non-production hosts create no Google script or analytics queue', () => {
  for (const url of [
    'https://hirojessica.github.io/kmrn/',
    'http://localhost:4180/',
    'http://127.0.0.1:4180/',
    'file:///C:/demo/index.html',
    'https://km-nagoya-doll-r1yeax0z.myshopify.com/',
    'https://preview.km-nagoya-doll.com/',
    'https://km-nagoya-doll.com.example.org/',
    'http://km-nagoya-doll.com/',
  ]) {
    const page = browser(url);
    page.run();
    assert.equal(page.scripts.length, 0, url);
    assert.equal(page.window.dataLayer, undefined, url);
    assert.equal(page.window.gtag, undefined, url);
  }
});

test('initialization preserves an existing data layer and tag function', () => {
  const events = [];
  const dataLayer = [{ existing: true }];
  const gtag = (...args) => events.push(args);
  const page = browser('https://km-nagoya-doll.com/', { dataLayer, gtag });
  page.run();
  assert.equal(page.window.dataLayer, dataLayer);
  assert.equal(page.window.gtag, gtag);
  assert.equal(dataLayer.length, 1);
  assert.deepEqual(events[1], ['config', 'G-2VPT10TFBK']);
});

test('every public renewal page loads the shared tag exactly once in its head', () => {
  const names = ['index', 'about', 'collection', 'product', 'news', 'news-article', 'gallery', 'contact', 'contact-thanks'];
  for (const name of names) {
    const html = readFileSync(new URL(`../mockups/${name}.html`, import.meta.url), 'utf8');
    assert.equal((html.match(/src="assets\/analytics\.js\?v=ga4-20260906"/g) || []).length, 1, name);
    assert.match(html.split('</head>')[0], /<script src="assets\/analytics\.js\?v=ga4-20260906" defer><\/script>/, name);
    assert.equal((html.match(/googletagmanager\.com\/gtag\/js/g) || []).length, 0, name);
  }
});
