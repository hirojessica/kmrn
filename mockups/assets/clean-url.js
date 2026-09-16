// Legacy bookmarks keep their product handle, gallery filters and fragment.
// Real directory index pages make the clean URLs work on any static host.
(() => {
  const { pathname, search, hash } = window.location;
  const page = typeof document === 'undefined' ? { dataset: {} } : document.documentElement;
  const handle = page.dataset.staticSite === 'true' ? new URLSearchParams(search).get('handle') : null;
  if (page.dataset.staticSite === 'true' && handle && /\/(product|news-article)\/$/.test(pathname)) {
    const base = new URL(page.dataset.siteRoot, location.href);
    const languageBase = new URL(page.lang === 'en' ? 'en/' : './', base);
    const url = new URL(`${/\/product\/$/.test(pathname) ? 'product' : 'news'}/${encodeURIComponent(handle)}/`, languageBase);
    url.search = search; url.searchParams.delete('handle'); url.hash = hash;
    // Only redirect known routes; newly published content still works through the API fallback.
    const handles = (page.dataset.knownHandles || '').split('|');
    if (handles.includes(handle)) { window.location.replace(url.href); return; }
  }
  const clean = pathname
    .replace(/\/index\.html$/, '/')
    .replace(/\/(about|collection|product|news|news-article|gallery|contact|contact-thanks)\.html$/, '/$1/');
  if (clean !== pathname) window.location.replace(clean + search + hash);
})();
