import { articleFragment } from './richtext.js';
export { articleFragment } from './richtext.js';
import { storefront, safeImageURL } from './storefront-api.js?v=content-20260905';
import { localizedGalleryItem } from './gallery-data.js';

const language = () => document.documentElement.lang === 'en' ? 'en' : 'ja';
const tr = (ja, en) => language() === 'en' ? en : ja;
const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (className) node.className = className;
  return node;
};
function status(root, state, message, retry) {
  const box = root.querySelector('[data-content-status]');
  box.dataset.state = state;
  box.hidden = !message;
  box.replaceChildren();
  if (message) box.append(el('p', message));
  if (retry) {
    const button = el('button', tr('再読み込み', 'Try again'), 'content-outline');
    button.type = 'button'; button.addEventListener('click', retry, { once: true }); box.append(button);
  }
}
function dateLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '' : new Intl.DateTimeFormat(language() === 'en' ? 'en-GB' : 'ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Tokyo' }).format(date);
}
function dateNode(value) {
  const node = el('time', dateLabel(value), 'news-date');
  if (!Number.isNaN(new Date(value).valueOf())) node.dateTime = value;
  return node;
}
function newsRow(article) {
  const li = el('li'), a = el('a', null, 'news-row');
  a.href = `news-article.html?handle=${encodeURIComponent(article.handle)}`;
  a.append(dateNode(article.publishedAt), el('span', article.tags?.[0] || tr('お知らせ', 'News'), 'news-tag'), el('span', article.title, 'news-title'));
  const arrow = el('span', '→', 'news-arrow'); arrow.setAttribute('aria-hidden', 'true'); a.append(arrow); li.append(a); return li;
}
export function galleryItem(node) {
  return localizedGalleryItem(node, language());
}
function openPhoto(item, trigger) {
  const dialog = document.querySelector('#gallery-lightbox');
  if (!dialog) return;
  const image = dialog.querySelector('img'); image.src = safeImageURL(item.image.url); image.alt = item.image.altText || item.title;
  dialog.querySelector('h2').textContent = item.title;
  dialog.querySelector('p').textContent = item.caption;
  dialog.querySelector('button').setAttribute('aria-label', tr('写真を閉じる', 'Close photo'));
  dialog.addEventListener('close', () => trigger.focus(), { once: true });
  dialog.showModal();
}
function galleryCard(raw) {
  const item = galleryItem(raw), url = safeImageURL(item.image?.url);
  if (!url) return null;
  const card = el('figure', null, 'gallery-card'), button = el('button'); button.type = 'button';
  button.setAttribute('aria-label', tr(`${item.title}の写真を拡大`, `Enlarge ${item.title}`));
  const frame = el('span', null, 'gallery-frame'), image = el('img');
  image.src = url; image.alt = item.image.altText || item.title; image.loading = 'lazy'; image.decoding = 'async';
  if (item.image.width > 0 && item.image.height > 0) { image.width = item.image.width; image.height = item.image.height; }
  frame.append(image); button.append(frame); button.addEventListener('click', () => openPhoto(item, button));
  const caption = el('figcaption');
  if (item.category) caption.append(el('span', item.category, 'news-tag'));
  caption.append(el('h2', item.title)); if (item.caption) caption.append(el('p', item.caption));
  card.append(button, caption); return card;
}

export function initContentList(root, client = storefront) {
  const kind = root.dataset.content, gallery = kind === 'gallery', featured = kind === 'news-featured';
  const list = root.querySelector('[data-content-list]'), more = root.querySelector('[data-content-more]');
  let controller, generation = 0, cursor = null, entries = [], seen = new Set();
  async function load(append = false) {
    controller?.abort(); controller = new AbortController(); const current = ++generation;
    if (gallery) root.setAttribute('aria-label', tr('フォトギャラリー', 'Photo Gallery'));
    if (!append) {
      if (gallery) document.querySelector('#gallery-lightbox[open]')?.close();
      entries = []; cursor = null; seen = new Set(); list.replaceChildren();
    }
    list.setAttribute('aria-busy', 'true'); if (more) more.disabled = true;
    status(root, 'loading', tr('読み込んでいます…', 'Loading…'));
    try {
      const result = await client[gallery ? 'gallery' : 'news']({ first: featured ? 3 : gallery ? 24 : 12, after: append ? cursor : null, language: language().toUpperCase(), signal: controller.signal });
      if (current !== generation) return;
      for (const item of result.nodes) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        const card = gallery ? galleryCard(item) : newsRow(item);
        if (card) { list.append(card); entries.push(item); }
      }
      cursor = result.pageInfo.endCursor;
      if (more) more.hidden = !(result.pageInfo.hasNextPage && cursor);
      list.dataset.source = 'shopify';
      status(root, entries.length ? 'ready' : 'empty', entries.length ? '' : gallery ? tr('写真はただいま準備中です。公開まで、もうしばらくお待ちください。', 'Our photo gallery is being prepared. Please check back soon.') : tr('現在、公開されているお知らせはありません。', 'There are no published announcements at the moment.'));
    } catch (error) {
      if (current !== generation || error.name === 'AbortError') return;
      if (more) more.hidden = true;
      status(root, 'error', tr('読み込みができませんでした。時間をおいて、もう一度お試しください。', 'We could not load the content. Please try again.'), () => load(append));
    } finally {
      if (current === generation) { list.setAttribute('aria-busy', 'false'); if (more) more.disabled = false; }
    }
  }
  more?.addEventListener('click', () => load(true));
  document.addEventListener('kmn:languagechange', () => load());
  return load();
}

export function initArticle(root, client = storefront) {
  const container = root.querySelector('[data-article-body]'); let controller, generation = 0;
  async function load() {
    controller?.abort(); controller = new AbortController(); const current = ++generation;
    container.replaceChildren(); container.setAttribute('aria-busy', 'true');
    status(root, 'loading', tr('記事を読み込んでいます…', 'Loading article…'));
    try {
      const article = await client.article(new URLSearchParams(location.search).get('handle'), { language: language().toUpperCase(), signal: controller.signal });
      if (current !== generation) return;
      document.title = `${article.title}｜${tr('お知らせ｜KM名古屋ドール', 'News | KM Nagoya Doll')}`;
      const meta = el('div', null, 'article-meta'); meta.append(dateNode(article.publishedAt), el('span', article.tags?.[0] || tr('お知らせ', 'News'), 'news-tag'));
      container.append(meta, el('h1', article.title, 'article-title'));
      const url = safeImageURL(article.image?.url);
      if (url) { const img = el('img', null, 'article-cover'); img.src = url; img.alt = article.image.altText || ''; container.append(img); }
      const body = el('div', null, 'article-body'); body.append(articleFragment(article.contentHtml)); container.append(body);
      status(root, 'ready', '');
    } catch (error) {
      if (current !== generation || error.name === 'AbortError') return;
      if (error.code === 'NOT_FOUND') { container.append(el('h1', tr('記事が見つかりません', 'Article not found'), 'article-title')); status(root, 'not-found', tr('この記事は公開されていないか、掲載を終了しています。', 'This article is unavailable or no longer published.')); }
      else status(root, 'error', tr('記事を読み込めませんでした。もう一度お試しください。', 'We could not load this article. Please try again.'), load);
    } finally { if (current === generation) container.setAttribute('aria-busy', 'false'); }
  }
  document.addEventListener('kmn:languagechange', load); return load();
}
document.querySelectorAll('[data-content]').forEach(root => root.dataset.content === 'article' ? initArticle(root) : initContentList(root));
const lightbox = document.querySelector('#gallery-lightbox');
lightbox?.querySelector('button').addEventListener('click', () => lightbox.close());
lightbox?.addEventListener('click', event => { if (event.target === lightbox) { const r = lightbox.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) lightbox.close(); } });
