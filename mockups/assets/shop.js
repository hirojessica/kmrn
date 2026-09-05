import { storefront, formatMoney, safeImageURL } from './storefront-api.js';
import { storefrontConfig } from './storefront-config.js';
import { isTestProduct, checkoutMode, checkoutURL } from './checkout.js';

const language = () => document.documentElement.lang === 'en' ? 'en' : 'ja';
const t = (ja, en) => language() === 'en' ? en : ja;
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
const samples = [
  { handle: 'lace-doll', ja: '陶製レース人形', en: 'Porcelain Lace Doll' },
  { handle: 'porcelain-object', ja: '陶磁器のオブジェ', en: 'Porcelain Object' },
  { handle: 'tableware', ja: '暮らしの器', en: 'Porcelain Tableware' },
];
function placeholder(container, sample = false) {
  const label = element('span', 'shop-placeholder', t('商品画像', 'Product image'));
  label.append(element('small', '', sample ? 'LAYOUT SAMPLE / 1 : 1' : t('準備中', 'Coming soon')));
  container.replaceChildren(label);
}
function productImage(image, container, title, sample = false) {
  const src = safeImageURL(image?.url);
  if (!src) return placeholder(container, sample);
  const img = element('img');
  img.src = src;
  img.alt = image.altText || title;
  img.width = image.width || 1200;
  img.height = image.height || 1200;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.addEventListener('error', () => placeholder(container), { once: true });
  container.replaceChildren(img);
}
function priceRange(product) {
  const { minVariantPrice: min, maxVariantPrice: max } = product.priceRange || {};
  const value = formatMoney(min, language());
  return value && max && Number(max.amount) > Number(min.amount) ? `${value}${t('〜', '+')}` : value;
}
export function descriptionText(product) {
  if (!product.descriptionHtml) return product.description || '';
  const doc = new DOMParser().parseFromString(product.descriptionHtml, 'text/html');
  const blocked = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED']);
  const block = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE']);
  function text(node) {
    if (node.nodeType === 3) return node.textContent;
    if (blocked.has(node.nodeName)) return '';
    if (node.nodeName === 'BR') return '\n';
    return Array.from(node.childNodes).map(text).join('') + (block.has(node.nodeName) ? '\n\n' : '');
  }
  return text(doc.body).replace(/\n{3,}/g, '\n\n').trim();
}
function card(product, sample = false) {
  const link = element('a', 'shop-card');
  const title = sample ? product[language()] : product.title;
  link.href = sample ? `product.html?preview=${encodeURIComponent(product.handle)}` : `product.html?handle=${encodeURIComponent(product.handle)}`;
  const photo = element('div', 'shop-card-image');
  productImage(product.featuredImage, photo, title, sample);
  link.append(photo, element('h3', '', title));
  if (sample) link.append(element('p', '', t('レイアウトサンプル', 'Layout sample')));
  else {
    const price = priceRange(product);
    if (price) link.append(element('p', 'shop-price', isTestProduct(product) ? t(`テスト価格 ${price}`, `Test price ${price}`) : price));
    if (isTestProduct(product)) link.append(element('p', 'shop-test-label', t('テスト商品・実際の発送はありません', 'Test product · No actual shipment')));
    if (!product.availableForSale) link.append(element('span', 'shop-sold-out', t('品切れ', 'Sold out')));
  }
  return link;
}
function showStatus(container, state, heading, message, retry) {
  container.replaceChildren();
  container.dataset.state = state;
  if (heading) container.append(element('strong', '', heading));
  if (message) container.append(element('p', '', message));
  if (retry) {
    const button = element('button', 'shop-retry', t('再読み込み', 'Try again'));
    button.type = 'button';
    button.addEventListener('click', retry);
    container.append(button);
  }
}
function errorMessage(error) {
  if (error.code === 'LOCKED') return t('ストアの保護設定により商品を取得できません。現在は配置確認用のサンプルです。商品名・画像・価格はShopify連携後に表示します。', 'The protected store is not yet available. These are layout samples; product names, images and prices will come from Shopify.');
  if (error.code === 'ACCESS') return t('商品連携の設定を確認中です。現在は配置確認用のサンプルを表示しています。', 'Product access is being prepared. Layout samples are shown below.');
  return t('商品を読み込めませんでした。通信状態を確認して再読み込みしてください。下の枠は配置確認用のサンプルです。', 'Products could not be loaded. Please check your connection and try again. The cards below are layout samples.');
}

export function initCatalog(root, client = storefront) {
  const grid = root.querySelector('[data-product-grid]');
  const status = root.querySelector('[data-shop-status]');
  const sort = root.querySelector('#product-sort');
  const more = root.querySelector('[data-load-more]');
  const featured = root.dataset.storefront === 'featured';
  let pageInfo = null;
  let controller;
  let generation = 0;
  let products = [];
  let renderedLanguage = language();
  async function load(append = false) {
    controller?.abort();
    controller = new AbortController();
    const currentGeneration = ++generation;
    const requestLanguage = language();
    if (!append) { products = []; grid.replaceChildren(); pageInfo = null; }
    grid.setAttribute('aria-busy', 'true');
    if (more) { more.disabled = true; more.hidden = true; }
    if (sort) sort.disabled = true;
    showStatus(status, 'loading', '', t('作品を読み込んでいます…', 'Loading pieces…'));
    try {
      const result = await client.products({ first: featured ? 3 : 12, after: append ? pageInfo?.endCursor : null, sort: sort?.value || 'newest', language: requestLanguage.toUpperCase(), signal: controller.signal });
      if (currentGeneration !== generation) return;
      products = append ? [...products, ...result.nodes] : result.nodes;
      pageInfo = result.pageInfo;
      grid.dataset.source = 'shopify';
      const unique = [...new Map(products.map(product => [product.id, product])).values()];
      grid.replaceChildren(...unique.map(product => card(product)));
      renderedLanguage = requestLanguage;
      if (!products.length) {
        showStatus(status, 'empty', t('オンライン販売の準備をしています。', 'Our online shop is coming soon.'), t('販売する作品が公開されるまで、どうぞお待ちください。', 'Please check back when our pieces are ready.'));
      } else if (unique.some(isTestProduct)) showStatus(status, 'preview', t('テスト商品を公開しています', 'Test products on display'), t('掲載価格・在庫は動作確認用です。テスト決済のみご利用いただけます。実際の販売・発送は行いません。', 'Prices and stock are for testing. Only test payments are available; no actual sale or shipment will take place.'));
      else showStatus(status, 'ready', '', featured ? '' : t(`${unique.length}点を表示`, `${unique.length} pieces shown`));
      if (sort) sort.disabled = !products.length;
      if (more) { more.hidden = !pageInfo.hasNextPage; more.disabled = false; }
    } catch (error) {
      if (currentGeneration !== generation || error.name === 'AbortError') return;
      if (append && products.length) {
        showStatus(status, 'error', t('続きの商品を読み込めませんでした。', 'More pieces could not be loaded.'), '', () => load(true));
        if (sort) sort.disabled = false;
      } else {
        grid.dataset.source = storefrontConfig.showLayoutSamples ? 'layout-sample' : 'unavailable';
        grid.replaceChildren(...(storefrontConfig.showLayoutSamples ? samples.map(product => card(product, true)) : []));
        showStatus(status, 'preview', t('レイアウトサンプル / 商品連携準備中', 'Layout samples / Shop setup in progress'), errorMessage(error), () => load());
      }
    } finally {
      if (currentGeneration === generation) grid.setAttribute('aria-busy', 'false');
    }
  }
  sort?.addEventListener('change', () => load());
  more?.addEventListener('click', () => load(true));
  document.addEventListener('kmn:languagechange', () => {
    if (renderedLanguage !== language() || grid.dataset.source !== 'shopify') load();
  });
  load();
}

export function detailView(product, sample) {
  const title = sample ? product[language()] : product.title;
  const mode = sample ? null : checkoutMode(product, storefrontConfig);
  const layout = element('div', 'shop-detail');
  const gallery = element('div', 'shop-gallery');
  const photo = element('div', 'shop-detail-photo');
  productImage(product.featuredImage, photo, title, sample);
  gallery.append(photo);
  const images = product.images?.nodes || [];
  const thumbButtons = [];
  if (images.length > 1) {
    const thumbnails = element('div', 'shop-thumbnails');
    images.forEach((image, index) => {
      const button = element('button');
      button.type = 'button';
      button.setAttribute('aria-label', t(`商品写真 ${index + 1} を表示`, `View product photo ${index + 1}`));
      button.setAttribute('aria-pressed', String(index === 0));
      productImage(image, button, '', false);
      button.addEventListener('click', () => {
        productImage(image, photo, title);
        thumbButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      });
      thumbButtons.push(button);
      thumbnails.append(button);
    });
    gallery.append(thumbnails);
  }
  const copy = element('div', 'shop-detail-copy');
  copy.append(element('p', 'lr-label', sample ? 'LAYOUT SAMPLE' : isTestProduct(product) ? 'TEST PRODUCT' : 'FROM OUR SETO ATELIER'), element('h1', '', title));
  const price = element('p', 'shop-detail-price', sample ? t('価格は商品登録後に表示', 'Price shown after product setup') : priceRange(product));
  copy.append(price);
  copy.append(element('p', 'shop-description', sample ? t('こちらは商品詳細ページのレイアウトサンプルです。\n\n実際の商品名、写真、説明、価格をShopifyに登録すると、この位置に表示されます。写真は同じ比率の枠に収め、作品全体が見えるように表示します。', 'This is a layout sample for a product detail page.\n\nProduct names, photos, descriptions and prices will be loaded from Shopify. Images fit within a consistent frame so the entire piece remains visible.') : descriptionText(product)));
  const variants = product.variants?.nodes || [];
  let selected = variants.find(variant => variant.availableForSale) || variants[0];
  const purchase = element('button', 'lr-button shop-purchase');
  purchase.type = 'button';
  const updateVariant = () => {
    if (selected) { const amount = formatMoney(selected.price, language()); price.textContent = isTestProduct(product) ? t(`テスト価格 ${amount}`, `Test price ${amount}`) : amount; }
    purchase.disabled = sample || !checkoutURL(product, selected, storefrontConfig);
    purchase.textContent = !mode ? t('オンライン販売準備中', 'Online sales coming soon') : !selected?.availableForSale ? t('品切れ', 'Sold out') : mode === 'test' ? t('テスト購入へ進む', 'Try test checkout') : t('購入手続きへ', 'Proceed to checkout');
  };
  if (variants.length > 1) {
    const label = element('label', 'shop-variant', t('種類', 'Variant'));
    const select = element('select');
    variants.forEach(variant => {
      const option = element('option', '', `${variant.title}${variant.availableForSale ? '' : t('（品切れ）', ' (Sold out)')}`);
      option.value = variant.id;
      option.selected = variant.id === selected?.id;
      select.append(option);
    });
    select.addEventListener('change', () => {
      selected = variants.find(variant => variant.id === select.value);
      if (selected?.image) { productImage(selected.image, photo, title); thumbButtons.forEach(button => button.setAttribute('aria-pressed', 'false')); }
      updateVariant();
    });
    label.append(select); copy.append(label);
  }
  updateVariant();
  purchase.addEventListener('click', () => {
    if (purchase.disabled) return;
    const url = checkoutURL(product, selected, storefrontConfig);
    if (url) location.assign(url);
  });
  copy.append(purchase, element('p', 'shop-detail-note', !mode ? t('デモページでは購入できません。', 'Purchases are unavailable in this demo.') : mode === 'test' ? t('Shopifyのテスト決済画面へ進みます。実際の請求・発送はありません。', 'Continue to Shopify test checkout. No actual charge or shipment will occur.') : t('お支払いはShopifyの決済画面へ進みます。', 'Payment continues at Shopify checkout.')));
  if (mode === 'test') {
    const instructions = element('details', 'shop-test-guide');
    instructions.append(element('summary', '', t('テスト購入の入力方法', 'How to place a test order')));
    instructions.append(element('p', '', t('決済画面にテストモードの表示があることを確認してください。ご自身が受信できるメールアドレスを入力すると、テスト注文の確認メールも確認できます。', 'Check that checkout displays test mode. Use an email address you can access to receive the test order confirmation.')));
    const list = element('ul');
    [t('カード番号：1（成功）／2（決済拒否）／3（エラー）', 'Card number: 1 (success), 2 (decline), or 3 (gateway error)'), t('カード名義：Test payment gateway', 'Name on card: Test payment gateway'), t('有効期限：未来の年月、セキュリティコード：111', 'Expiry: any future date. Security code: 111.')].forEach(text => list.append(element('li', '', text)));
    instructions.append(list, element('p', '', t('実際のカード番号は入力しないでください。ストアパスワードを求められた場合は、Shopifyのオンラインストア設定で確認できます。', 'Use only the test card details. If a store password is requested, find it in Shopify online store preferences.')));
    copy.append(instructions);
  }
  layout.append(gallery, copy);
  document.title = `${title}｜KM${language() === 'ja' ? '名古屋ドール株式会社' : ' Nagoya Doll'}`;
  return layout;
}

function initDetail(root) {
  const detail = root.querySelector('[data-product-detail]');
  const status = root.querySelector('[data-shop-status]');
  const params = new URLSearchParams(location.search);
  const handle = params.get('handle');
  const sample = storefrontConfig.showLayoutSamples && !handle ? samples.find(item => item.handle === params.get('preview')) : null;
  let generation = 0;
  let controller;
  async function load() {
    controller?.abort(); controller = new AbortController();
    const currentGeneration = ++generation;
    detail.setAttribute('aria-busy', 'true');
    detail.replaceChildren();
    if (sample) {
      showStatus(status, 'preview', t('商品詳細のレイアウトサンプル', 'Product detail layout sample'), t('掲載内容は実際の販売商品ではありません。', 'This sample is not a product offered for sale.'));
      detail.replaceChildren(detailView(sample, true));
      detail.dataset.source = 'layout-sample';
      detail.setAttribute('aria-busy', 'false'); return;
    }
    showStatus(status, 'loading', '', t('作品を読み込んでいます…', 'Loading piece…'));
    try {
      const product = await storefront.product(handle, { language: language().toUpperCase(), signal: controller.signal });
      if (currentGeneration !== generation) return;
      detail.dataset.source = 'shopify';
      detail.replaceChildren(detailView(product, false));
      showStatus(status, 'ready', '', '');
    } catch (error) {
      if (currentGeneration !== generation || error.name === 'AbortError') return;
      detail.dataset.source = 'unavailable';
      if (error.code === 'NOT_FOUND') showStatus(status, 'error', t('商品が見つかりませんでした。', 'This piece could not be found.'), t('作品一覧から商品をお選びください。', 'Please choose a piece from the collection.'));
      else showStatus(status, 'error', t('商品を読み込めませんでした。', 'This piece could not be loaded.'), t('しばらくしてから、もう一度お試しください。', 'Please try again shortly.'), load);
    } finally { if (currentGeneration === generation) detail.setAttribute('aria-busy', 'false'); }
  }
  document.addEventListener('kmn:languagechange', load);
  load();
}

document.querySelectorAll('[data-storefront]').forEach(root => root.dataset.storefront === 'product' ? initDetail(root) : initCatalog(root));
