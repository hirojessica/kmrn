import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { siteURL } from '../mockups/assets/site-url.js';

const pages = ['index', 'about', 'collection', 'product', 'news', 'news-article', 'gallery', 'contact', 'contact-thanks'];
const root = new URL('../mockups/', import.meta.url);
const redirect = readFileSync(new URL('assets/clean-url.js', root), 'utf8');
const pageFile = name => name === 'index' ? 'index.html' : `${name}/index.html`;

function redirectedURL(url) {
  let destination;
  const location = new URL(url);
  location.replace = value => { destination = new URL(value, url).href; };
  runInNewContext(redirect, { window: { location } });
  return destination;
}

test('legacy URLs preserve query parameters and fragments on root and project hosting', () => {
  for (const base of ['https://example.com/', 'https://hirojessica.github.io/kmrn/']) {
    for (const name of pages) {
      const tail = '?handle=lace%2Fdoll&category=works&page=2#main';
      const route = name === 'index' ? '' : `${name}/`;
      assert.equal(redirectedURL(`${base}${name}.html${tail}`), `${base}${route}${tail}`);
      assert.equal(redirectedURL(`${base}${route}index.html${tail}`), `${base}${route}${tail}`);
      assert.equal(redirectedURL(`${base}${route}${tail}`), undefined, 'no redirect loop');
    }
    assert.equal(redirectedURL(`${base}unrelated.html`), undefined);
  }
});

test('every page has a real directory index and all local references resolve', () => {
  let references = 0;
  for (const name of pages) {
    const file = new URL(pageFile(name), root);
    const html = readFileSync(file, 'utf8');
    assert.match(html, /<main\b/);
    assert.match(html, /<script src="(?:\.\.\/)?assets\/clean-url\.js"><\/script>/);
    for (const [, attribute, value] of html.matchAll(/\b(href|src|action)="([^"]+)"/g)) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) continue;
      const url = new URL(value, file);
      assert.ok(url.href.startsWith(root.href), `${name}: escapes site root: ${value}`);
      if (attribute === 'href' && !value.startsWith('#')) assert.ok(!url.pathname.endsWith('.html'), `${name}: old navigation: ${value}`);
      url.search = '';
      const fragment = url.hash.slice(1);
      url.hash = '';
      if (url.pathname.endsWith('/')) url.pathname += 'index.html';
      assert.ok(existsSync(url), `${name}: missing ${value}`);
      if (fragment && url.pathname.endsWith('.html')) {
        assert.ok(readFileSync(url, 'utf8').includes(`id="${fragment}"`), `${name}: missing anchor ${value}`);
      }
      references++;
    }
  }
  assert.ok(references > 200, `only ${references} links checked`);
});

test('legacy entry pages have only a redirect and a fallback link, no analytics or API scripts', () => {
  for (const name of pages.filter(name => name !== 'index')) {
    const html = readFileSync(new URL(`${name}.html`, root), 'utf8');
    assert.match(html, /<script src="assets\/clean-url\.js"><\/script>/);
    assert.ok(html.includes(`href="${name}/"`));
    assert.equal((html.match(/<script\b/g) || []).length, 1);
  }
});

test('dynamic product, article and contact URLs retain the deployment base path', () => {
  for (const base of ['https://example.com/', 'http://127.0.0.1:4180/', 'https://hirojessica.github.io/kmrn/']) {
    for (const path of ['product/?handle=panda', 'news-article/?handle=news%2Ftest', 'contact-thanks/']) {
      assert.equal(siteURL(path, `${base}assets/site-url.js`).href, `${base}${path}`);
    }
  }
});

test('contact submit handler computes the clean thank-you URL without sending a request', () => {
  const source = readFileSync(new URL('assets/contact.js', root), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace('export const', 'const');
  for (const base of ['http://127.0.0.1:4180/', 'https://hirojessica.github.io/kmrn/', 'https://km-nagoya-doll.com/']) {
    const fields = { '[type=submit]': {}, '[name=_next]': {} };
    let submit;
    const form = { querySelector: selector => fields[selector], checkValidity: () => true,
      addEventListener: (event, handler) => { if (event === 'submit') submit = handler; } };
    runInNewContext(source, {
      siteURL: path => siteURL(path, `${base}assets/site-url.js`),
      document: { querySelector: selector => selector === '[data-contact-form]' ? form : {} },
      window: { addEventListener() {} },
    });
    submit({ preventDefault() { assert.fail('valid form should remain enabled'); } });
    assert.equal(fields['[name=_next]'].value, `${base}contact-thanks/`);
  }
});
