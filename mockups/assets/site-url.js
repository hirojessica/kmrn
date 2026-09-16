// Resolve from this module, not the current page, so /kmrn/ and / both work.
export function siteURL(path = '', moduleURL = import.meta.url) {
  return new URL(`../${path}`, moduleURL);
}
