// Legacy bookmarks keep their product handle, gallery filters and fragment.
// Real directory index pages make the clean URLs work on any static host.
(() => {
  const { pathname, search, hash } = window.location;
  const clean = pathname
    .replace(/\/index\.html$/, '/')
    .replace(/\/(about|collection|product|news|news-article|gallery|contact|contact-thanks)\.html$/, '/$1/');
  if (clean !== pathname) window.location.replace(clean + search + hash);
})();
