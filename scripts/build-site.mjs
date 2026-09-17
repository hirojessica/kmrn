import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';
import { storefront } from '../mockups/assets/storefront-api.js';
import { storefrontConfig } from '../mockups/assets/storefront-config.js';
import { responsiveImage } from '../mockups/assets/responsive-image.js';
import { localizedGalleryItem } from '../mockups/assets/gallery-data.js';
import { localizedLinkURL } from '../mockups/assets/site-url.js';
import { allPages, routes, productSchema, jsonScript, summary, socialImage } from './seo.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(repo, 'mockups');
const output = path.join(repo, 'site-build');
const site = new URL(process.env.SITE_URL || 'https://hirojessica.github.io/kmrn/');
if (!site.pathname.endsWith('/') || !['https:', 'http:'].includes(site.protocol)) throw new Error('SITE_URL must be an HTTP(S) directory URL');
// Preview indexing is intentionally fixed. Production launch is a separate change.
const languages = ['ja', 'en'];
globalThis.__KMN_BUILD__ = true;
const { card, detailView } = await import('../mockups/assets/shop.js');
const { newsRow, articleView } = await import('../mockups/assets/content.js');
const aboutScript = await fs.readFile(path.join(source, 'assets/about-language.js'), 'utf8');
const dictionary = vm.runInNewContext(`(${aboutScript.match(/var translations = (\{[\s\S]*?\n  \});/)[1]})`);
Object.assign(dictionary, {
  '本文へ進む': 'Skip to content',
  '言語選択': 'Language', 'メニュー': 'Menu', 'メニューを閉じる': 'Close menu',
  'モバイルメニュー': 'Mobile navigation', 'フッター': 'Footer', 'パンくず': 'Breadcrumb',
  '商品詳細': 'Product details', 'お知らせ': 'News', 'お問い合わせ': 'Contact',
  '商品一覧': 'Products', '仕上げ作業': 'Finishing', '上絵作業': 'Overglaze painting',
  '読み込んでいます…': 'Loading…', '記事を読み込んでいます…': 'Loading article…',
  '商品を表示するにはJavaScriptを有効にしてください。': 'Enable JavaScript to check current availability and purchase.',
  '記事を表示するにはJavaScriptを有効にしてください。': 'Enable JavaScript to refresh this article.'
});
const templates = new Map(await Promise.all(routes.map(async route => [route, await fs.readFile(path.join(source, route, 'index.html'), 'utf8')])));
const photoHandles = [...new Set([...templates.values()].flatMap(html => [...html.matchAll(/data-gallery-handle="([^"]+)"/g)].map(m => m[1])))];
const content = {};
for (const lang of languages) {
  const language = lang.toUpperCase();
  const [products, articles, photos] = await Promise.all([
    allPages(after => storefront.products({ first: 100, after, language })),
    allPages(after => storefront.news({ first: 100, after, language })),
    storefront.galleryByHandles(photoHandles, { language })
  ]);
  content[lang] = { products: [], articles: [], photos };
  // Limit concurrent requests; fail the entire deploy if any published body cannot be fetched.
  for (const product of products) content[lang].products.push(await storefront.product(product.handle, { language }));
  for (const article of articles) content[lang].articles.push(await storefront.article(article.handle, { language }));
  console.log(`${lang}: ${products.length} published products, ${articles.length} articles`);
}
// Paired language URLs must refer to the same Shopify objects.
for (const kind of ['products', 'articles']) {
  const a = content.ja[kind].map(item => item.id).sort().join('|');
  const b = content.en[kind].map(item => item.id).sort().join('|');
  if (a !== b) throw new Error(`Published ${kind} changed during build; run again`);
}

await fs.mkdir(output, { recursive: true });
// This is the dedicated generated directory; never clean source or unrelated output.
if (path.dirname(output) !== path.resolve(repo) || path.basename(output) !== 'site-build') throw new Error('Unsafe output path');
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(path.join(output, 'assets'), { recursive: true });
await fs.cp(path.join(source, 'assets'), path.join(output, 'assets'), { recursive: true });
const assetFiles = (await fs.readdir(path.join(source, 'assets'))).filter(name => /\.(js|css)$/.test(name)).sort();
const assetHash = createHash('sha256');
for (const name of assetFiles) assetHash.update(await fs.readFile(path.join(source, 'assets', name)));
const assetVersion = assetHash.digest('hex').slice(0, 12);
for (const name of assetFiles.filter(name => name.endsWith('.js'))) {
  const script = await fs.readFile(path.join(source, 'assets', name), 'utf8');
  await fs.writeFile(path.join(output, 'assets', name), script.replace(/(from\s*['"])(\.\/[^'"?]+\.js)(?:\?[^'"]*)?/g, `$1$2?v=${assetVersion}`));
}
await fs.copyFile(path.join(source, 'favicon.ico'), path.join(output, 'favicon.ico'));
await fs.writeFile(path.join(output, '.nojekyll'), '');
for (const route of routes.filter(Boolean)) {
  const name = `${route.slice(0, -1)}.html`;
  await fs.copyFile(path.join(source, name), path.join(output, name));
}

const localImages = new Map();
const imageReport = [];
const relative = (route, target) => {
  const value = path.posix.relative(route || '.', target);
  return value ? value + (!target || target.endsWith('/') ? '/' : '') : './';
};
async function optimizeLocalImage(relativeSource) {
  if (localImages.has(relativeSource)) return localImages.get(relativeSource);
  const file = path.join(source, relativeSource);
  const input = sharp(file).rotate();
  const meta = await input.metadata();
  const rotated = [5, 6, 7, 8].includes(meta.orientation);
  const width = rotated ? meta.height : meta.width, height = rotated ? meta.width : meta.height;
  const sizes = [...new Set([480, 768, 1024, 1440, 1920].filter(w => w < width).concat(Math.min(width, 1920)))];
  const stem = path.posix.basename(relativeSource).replace(/\.[^.]+$/, '');
  const variants = [];
  for (const size of sizes) {
    const name = `assets/optimized/${stem}-${size}.webp`;
    await fs.mkdir(path.dirname(path.join(output, name)), { recursive: true });
    const result = await sharp(file).rotate().resize({ width: size, withoutEnlargement: true }).webp({ quality: 86, effort: 4 }).toFile(path.join(output, name));
    variants.push({ name, width: result.width, bytes: result.size });
  }
  const result = { width, height, variants };
  imageReport.push({ source: relativeSource, originalBytes: (await fs.stat(file)).size, variants });
  localImages.set(relativeSource, result);
  return result;
}
function textContent(html) {
  const doc = new JSDOM(html || '').window.document;
  doc.querySelectorAll('script,style').forEach(node => node.remove());
  doc.querySelectorAll('p,h1,h2,h3,h4,li,br').forEach(node => node.append(doc.createTextNode(' ')));
  return doc.body.textContent;
}
function translate(doc, lang) {
  doc.documentElement.lang = lang;
  doc.querySelectorAll('[data-ja][data-en]').forEach(node => { node.textContent = node.dataset[lang]; });
  doc.querySelectorAll('[data-aria-ja][data-aria-en]').forEach(node => {
    const text = lang === 'en' ? node.dataset.ariaEn : node.dataset.ariaJa;
    node.setAttribute(node.tagName === 'IMG' ? 'alt' : 'aria-label', text);
  });
  if (lang === 'en') {
    const walker = doc.createTreeWalker(doc.body, 4); let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest('script,style')) continue;
      const key = node.nodeValue.trim();
      if (dictionary[key]) node.nodeValue = node.nodeValue.replace(key, dictionary[key]);
    }
    doc.querySelectorAll('[alt],[aria-label],[title],[placeholder]').forEach(node => {
      for (const attr of ['alt', 'aria-label', 'title', 'placeholder']) {
        const text = node.getAttribute(attr);
        if (dictionary[text]) node.setAttribute(attr, dictionary[text]);
      }
    });
  }
  const title = doc.querySelector('title');
  title.textContent = (lang === 'en' ? title.dataset.titleEn : title.dataset.titleJa) || title.textContent;
}
function metadata(doc, { title, description, url, image, lang, schema, route }) {
  doc.title = title;
  doc.querySelector('title').removeAttribute('data-title-ja');
  doc.querySelector('title').removeAttribute('data-title-en');
  const meta = (name, value, property = false) => {
    if (!value) return;
    const el = doc.createElement('meta'); el.setAttribute(property ? 'property' : 'name', name); el.content = value; doc.head.append(el);
  };
  meta('description', description);
  meta('og:title', title, true); meta('og:description', description, true); meta('og:url', url, true);
  meta('og:type', schema?.['@type'] === 'BlogPosting' ? 'article' : 'website', true);
  meta('og:locale', lang === 'en' ? 'en_US' : 'ja_JP', true); meta('og:site_name', 'KM Nagoya Doll', true);
  const social = socialImage(image, site, lang);
  meta('og:image', social.url, true);
  meta('og:image:width', social.width, true); meta('og:image:height', social.height, true);
  meta('og:image:alt', social.altText || title, true);
  meta('twitter:card', 'summary_large_image'); meta('twitter:image', social.url);
  meta('twitter:image:alt', social.altText || title); meta('twitter:title', title); meta('twitter:description', description);
  for (const [hreflang, prefix] of [['ja', ''], ['en', 'en/'], ['x-default', '']]) {
    const link = doc.createElement('link'); link.rel = 'alternate'; link.hreflang = hreflang; link.href = new URL(prefix + route, site).href; doc.head.append(link);
  }
  const canonical = doc.createElement('link'); canonical.rel = 'canonical'; canonical.href = url; doc.head.append(canonical);
  if (schema) {
    const script = doc.createElement('script'); script.type = 'application/ld+json'; script.textContent = jsonScript(schema); doc.head.append(script);
  }
}

const pageReport = [];
async function render(templateRoute, route, lang, item, kind) {
  if (item && (item.handle === '.' || item.handle === '..' || /[\\/\u0000]/.test(item.handle))) throw new Error('Invalid content handle');
  const current = (lang === 'en' ? 'en/' : '') + route;
  const dom = new JSDOM(templates.get(templateRoute), { url: new URL(current, site).href });
  const doc = dom.window.document;
  globalThis.document = doc; globalThis.DOMParser = dom.window.DOMParser; globalThis.location = dom.window.location;
  translate(doc, lang);
  const data = content[lang];
  const root = doc.documentElement;
  root.dataset.staticSite = 'true'; root.dataset.siteRoot = relative(current, './');
  if (!root.dataset.siteRoot.endsWith('/')) root.dataset.siteRoot += '/';
  root.dataset.products = data.products.map(item => item.handle).join('|');
  root.dataset.articles = data.articles.map(item => item.handle).join('|');
  if (templateRoute === 'product/' || templateRoute === 'news-article/') root.dataset.knownHandles = (templateRoute === 'product/' ? data.products : data.articles).map(item => item.handle).join('|');
  // Resolve source-relative assets and links before moving the template into /en/ or a detail directory.
  const originalURL = new URL(templateRoute, site);
  for (const node of doc.querySelectorAll('[href],[src]')) {
    for (const attr of ['href', 'src']) {
      const value = node.getAttribute(attr);
      if (!value || /^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(value)) continue;
      const resolved = new URL(value, originalURL);
      if (!resolved.pathname.startsWith(site.pathname)) throw new Error('Source link escapes site base');
      let target = resolved.pathname.slice(site.pathname.length);
      if (attr === 'href' && node.tagName === 'A' && (routes.includes(target) || target === '')) target = (lang === 'en' ? 'en/' : '') + target;
      node.setAttribute(attr, relative(current, target) + resolved.search + resolved.hash);
    }
  }
  // About translations are now delivered in HTML; no client-side text replacement is necessary.
  doc.querySelectorAll('script[src*="about-language.js"]').forEach(node => node.remove());
  for (const button of doc.querySelectorAll('[data-language]')) {
    const link = doc.createElement('a'), targetLang = button.dataset.language;
    link.textContent = button.textContent; link.dataset.language = targetLang;
    link.hreflang = targetLang; link.lang = targetLang;
    link.setAttribute('aria-label', targetLang === 'en' ? 'English' : '日本語');
    link.setAttribute('aria-current', String(targetLang === lang));
    link.setAttribute('href', relative(current, (targetLang === 'en' ? 'en/' : '') + route));
    button.replaceWith(link);
  }
  const css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = relative(current, 'assets/static-site.css'); doc.head.append(css);

  const photoMap = new Map(data.photos.map(node => [node.handle, localizedGalleryItem(node, lang)]));
  for (const slot of doc.querySelectorAll('[data-gallery-handle]')) {
    const photo = photoMap.get(slot.dataset.galleryHandle), img = slot.querySelector('img');
    if (photo?.image?.url) {
      img.src = photo.image.url; img.width = photo.image.width; img.height = photo.image.height;
      img.alt = slot.getAttribute('aria-hidden') === 'true' ? '' : photo.title;
      img.hidden = false; slot.dataset.photoState = 'ready';
    } else { img.hidden = true; img.removeAttribute('src'); }
  }
  for (const box of doc.querySelectorAll('[data-product-grid]')) {
    const featured = box.closest('[data-storefront]').dataset.storefront === 'featured';
    box.replaceChildren(...data.products.slice(0, featured ? 3 : 12).map(product => card(product)));
    box.dataset.source = 'prerender'; box.setAttribute('aria-busy', 'false');
    const status = box.closest('[data-storefront]').querySelector('[data-shop-status]');
    status.replaceChildren(); status.dataset.state = 'ready';
  }
  for (const section of doc.querySelectorAll('[data-content="news"],[data-content="news-featured"]')) {
    const list = section.querySelector('[data-content-list]');
    list.replaceChildren(...data.articles.slice(0, section.dataset.content === 'news-featured' ? 3 : 12).map(newsRow));
    list.setAttribute('aria-busy', 'false');
    const status = section.querySelector('[data-content-status]'); status.replaceChildren(); status.hidden = true;
  }
  let title = doc.title, description, schema, image;
  if (kind === 'product') {
    const section = doc.querySelector('[data-storefront="product"]'); section.dataset.handle = item.handle;
    const detail = section.querySelector('[data-product-detail]'); detail.replaceChildren(detailView(item, false));
    detail.dataset.source = 'prerender'; detail.setAttribute('aria-busy', 'false');
    detail.querySelectorAll('.shop-purchase').forEach(button => { button.disabled = true; });
    section.querySelector('[data-shop-status]').replaceChildren();
    section.querySelector('noscript').textContent = lang === 'en' ? 'Enable JavaScript to check current availability and purchase.' : '最新の在庫確認・購入手続きにはJavaScriptを有効にしてください。';
    title = item.seo?.title || `${item.title}｜${lang === 'en' ? 'KM Nagoya Doll' : 'KM名古屋ドール'}`;
    description = summary(item.seo?.description || textContent(item.descriptionHtml));
    image = item.featuredImage && { ...item.featuredImage, altText: item.title };
    schema = productSchema(item, new URL(current, site).href, lang, storefrontConfig.checkoutEnabled === true && !item.tags?.includes('kmn-test'));
  } else if (kind === 'article') {
    const section = doc.querySelector('[data-content="article"]'); section.dataset.handle = item.handle;
    const body = section.querySelector('[data-article-body]'); body.replaceChildren(articleView(item)); body.setAttribute('aria-busy', 'false');
    section.querySelector('[data-content-status]').replaceChildren(); section.querySelector('noscript')?.remove();
    title = `${item.title}｜${lang === 'en' ? 'News | KM Nagoya Doll' : 'お知らせ｜KM名古屋ドール'}`;
    description = summary(textContent(item.contentHtml)); image = item.image && { ...item.image, altText: item.title };
    schema = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: item.title, datePublished: item.publishedAt, inLanguage: lang, mainEntityOfPage: new URL(current, site).href, publisher: { '@type': 'Organization', name: 'KM Nagoya Doll' }, ...(image?.url ? { image: image.url } : {}) };
  }
  description ||= summary(doc.querySelector('main h1')?.parentElement.textContent || doc.querySelector('main')?.textContent);
  metadata(doc, { title, description, url: new URL(current, site).href, image, lang, schema, route });
  for (const link of doc.querySelectorAll('a[href]:not([data-language])')) {
    if (!link.getAttribute('href').startsWith('#')) {
      const localized = localizedLinkURL(new URL(link.getAttribute('href'), new URL(current, site)));
      if (localized.origin === site.origin && localized.pathname.startsWith(site.pathname)) link.setAttribute('href', relative(current, localized.pathname.slice(site.pathname.length)) + localized.search + localized.hash);
    }
  }
  for (const img of doc.querySelectorAll('img[src]')) {
    const url = new URL(img.getAttribute('src'), new URL(current, site));
    const eager = img.getAttribute('fetchpriority') === 'high';
    if (url.hostname === 'cdn.shopify.com') {
      // Thumbnail and main image sizes were already chosen by the shared renderer.
      if (!img.srcset) responsiveImage(img, null, { eager });
      continue;
    }
    if (url.origin !== site.origin || !url.pathname.startsWith(site.pathname) || !/\.(png|jpe?g|webp)$/i.test(url.pathname)) continue;
    const sourcePath = decodeURIComponent(url.pathname.slice(site.pathname.length));
    const result = await optimizeLocalImage(sourcePath);
    img.width = result.width; img.height = result.height;
    img.src = relative(current, result.variants.at(-1).name);
    img.srcset = result.variants.map(v => `${relative(current, v.name)} ${v.width}w`).join(', ');
    img.sizes = img.closest('.lr-detail-photo--original') ? '(max-width: 880px) 190vw, 100vw' : '(max-width: 880px) 100vw, 55vw';
    img.loading = eager ? 'eager' : 'lazy'; img.decoding = 'async';
  }
  // Prevent modules/CSS from being reused from an earlier preview deployment.
  for (const node of doc.querySelectorAll('script[src],link[rel="stylesheet"]')) {
    const attr = node.tagName === 'SCRIPT' ? 'src' : 'href';
    const value = node.getAttribute(attr);
    if (!/^https?:/.test(value)) node.setAttribute(attr, value.split('?')[0] + `?v=${assetVersion}`);
  }
  await fs.mkdir(path.join(output, decodeURIComponent(current)), { recursive: true });
  await fs.writeFile(path.join(output, decodeURIComponent(current), 'index.html'), dom.serialize());
  pageReport.push({ route: current, language: lang, kind: kind || 'page' });
  dom.window.close();
}
for (const lang of languages) {
  for (const route of routes) await render(route, route, lang);
  for (const product of content[lang].products) await render('product/', `product/${encodeURIComponent(product.handle)}/`, lang, product, 'product');
  for (const article of content[lang].articles) await render('news-article/', `news/${encodeURIComponent(article.handle)}/`, lang, article, 'article');
}
// Social crawlers may not execute the redirects on previously shared .html URLs.
// Reuse the canonical page metadata while preserving the lightweight redirect shell.
for (const route of routes.filter(Boolean)) {
  const name = `${route.slice(0, -1)}.html`;
  const legacy = new JSDOM(await fs.readFile(path.join(output, name), 'utf8'));
  const canonical = new JSDOM(await fs.readFile(path.join(output, route, 'index.html'), 'utf8'));
  legacy.window.document.title = canonical.window.document.title;
  for (const node of canonical.window.document.querySelectorAll('meta[property^="og:"],meta[name^="twitter:"],meta[name="description"],link[rel="canonical"],link[rel="alternate"][hreflang]')) {
    legacy.window.document.head.append(legacy.window.document.importNode(node, true));
  }
  await fs.writeFile(path.join(output, name), legacy.serialize());
  legacy.window.close(); canonical.window.close();
}
await fs.writeFile(path.join(output, 'build-manifest.json'), JSON.stringify({ builtAt: new Date().toISOString(), site: site.href, indexing: 'noindex', pages: pageReport, images: imageReport }, null, 2));
console.log(`Built ${pageReport.length} pages; optimized ${imageReport.length} local photos. Preview remains noindex.`);
