// Resolve from this module, not the current page, so /kmrn/ and / both work.
export function siteURL(path = '', moduleURL = import.meta.url) {
  if (typeof document !== 'undefined' && document.documentElement.dataset.staticSite === 'true') {
    const root = new URL(document.documentElement.dataset.siteRoot, document.baseURI);
    return new URL(`${document.documentElement.lang === 'en' ? 'en/' : ''}${path}`, root);
  }
  return new URL(`../${path}`, moduleURL);
}

export function contentURL(kind, handle) {
  const encoded = encodeURIComponent(handle);
  const root = typeof document === 'undefined' ? null : document.documentElement;
  const known = root?.dataset[kind === 'product' ? 'products' : 'articles']?.split('|') || [];
  return root?.dataset.staticSite === 'true' && known.includes(handle)
    ? siteURL(`${kind === 'product' ? 'product' : 'news'}/${encoded}/`)
    : siteURL(`${kind === 'product' ? 'product' : 'news-article'}/?handle=${encoded}`);
}

// Preserve the selected language for links authored in the Shopify rich-text editor.
export function localizedLinkURL(input) {
  const url = new URL(input);
  if (typeof document === 'undefined' || document.documentElement.dataset.staticSite !== 'true') return url;
  const root = new URL(document.documentElement.dataset.siteRoot, document.baseURI);
  if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return url;
  let route = url.pathname.slice(root.pathname.length).replace(/^en\//, '').replace(/index\.html$/, '').replace(/\.html$/, '/');
  const handle = url.searchParams.get('handle');
  const known = document.documentElement.dataset[route === 'product/' ? 'products' : 'articles']?.split('|') || [];
  if (handle && ['product/', 'news-article/'].includes(route) && known.includes(handle)) {
    route = `${route === 'product/' ? 'product' : 'news'}/${encodeURIComponent(handle)}/`;
    url.searchParams.delete('handle');
  }
  if (!/^(?:$|about\/|collection\/|product\/|news\/|news-article\/|gallery\/|contact\/|contact-thanks\/)/.test(route)) return url;
  const target = siteURL(route); target.search = url.search; target.hash = url.hash;
  return target;
}
