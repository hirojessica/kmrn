import { safeImageURL } from './storefront-api.js';

// Rebuild the CMS rich text from an allowlist; never insert untrusted HTML directly.
export function articleFragment(html, doc = document) {
  const parsed = new DOMParser().parseFromString(html || '', 'text/html');
  const allowed = new Set(['P','BR','STRONG','B','EM','I','U','S','H2','H3','H4','UL','OL','LI','BLOCKQUOTE','A','IMG','FIGURE','FIGCAPTION','HR','TABLE','THEAD','TBODY','TR','TH','TD','SPAN']);
  const blocked = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','FORM','INPUT','BUTTON','SVG','MATH','LINK','META']);
  function copy(source, target) {
    for (const child of source.childNodes) {
      if (child.nodeType === 3) { target.append(doc.createTextNode(child.textContent)); continue; }
      if (child.nodeType !== 1 || blocked.has(child.tagName)) continue;
      if (!allowed.has(child.tagName)) { copy(child, target); continue; }
      const node = doc.createElement(child.tagName.toLowerCase());
      if (child.tagName === 'IMG') {
        const src = safeImageURL(child.getAttribute('src')); if (!src) continue;
        node.src = src; node.alt = child.getAttribute('alt') || ''; node.loading = 'lazy'; node.decoding = 'async';
      }
      if (child.tagName === 'A') {
        try {
          const url = new URL(child.getAttribute('href') || '', location.href);
          if (['https:', 'mailto:', 'tel:'].includes(url.protocol) || (url.protocol === 'http:' && url.origin === location.origin)) { node.href = url.href; node.rel = 'noopener noreferrer'; }
        } catch {}
      }
      if (['TD','TH'].includes(child.tagName)) for (const attr of ['colspan','rowspan']) {
        const value = Number(child.getAttribute(attr)); if (value > 0 && value <= 20) node.setAttribute(attr, String(value));
      }
      copy(child, node);
      if (child.tagName === 'TABLE') { const wrapper = doc.createElement('div'); wrapper.className = 'article-table-wrap'; wrapper.append(node); target.append(wrapper); }
      else target.append(node);
    }
  }
  const fragment = doc.createDocumentFragment(); copy(parsed.body, fragment); return fragment;
}
