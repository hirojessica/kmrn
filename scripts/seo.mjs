export const routes = ['', 'about/', 'collection/', 'product/', 'news/', 'news-article/', 'gallery/', 'contact/', 'contact-thanks/'];
export const commonSocialImage = 'assets/ogp-common-20260917-v2.jpg';
export function socialImage(image, site, language) {
  if (image?.url) {
    return { ...image, url: new URL(image.url, site).href };
  }
  return {
    url: new URL(commonSocialImage, site).href, width: 1200, height: 630,
    altText: language === 'en' ? 'KM Nagoya Doll — pink porcelain lace doll' : 'KM名古屋ドール — 陶に咲く、レース。ピンクの陶製レース人形'
  };
}
export const jsonScript = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
export const summary = (value, max = 170) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('. '));
  if (sentence > max / 2) return cut.slice(0, sentence + 1);
  const space = cut.lastIndexOf(' ');
  return (space > max / 2 ? cut.slice(0, space) : cut) + '…';
};
export function productSchema(product, url, language, allowOffers) {
  const variants = product.variants?.nodes || [];
  const base = {
    '@context': 'https://schema.org', '@type': variants.length > 1 ? 'ProductGroup' : 'Product',
    '@id': `${url}#product`, name: product.title, description: summary(product.description, 1000),
    url, image: product.images?.nodes?.map(image => image.url) || [],
    brand: { '@type': 'Brand', name: 'KM Nagoya Doll' },
    ...(product.productType ? { category: product.productType } : {})
  };
  const variantURL = variant => variant.id ? `${url}?variant=${encodeURIComponent(variant.id.split('/').pop())}` : url;
  const data = variant => ({
    '@type': 'Product', name: variants.length > 1 ? `${product.title} — ${variant.title}` : product.title,
    sku: variant.sku || undefined, image: variant.image?.url || product.featuredImage?.url,
    url: variantURL(variant),
    ...(allowOffers ? { offers: {
      '@type': 'Offer', url: variantURL(variant), price: variant.price.amount, priceCurrency: variant.price.currencyCode,
      availability: `https://schema.org/${variant.availableForSale ? 'InStock' : 'OutOfStock'}`,
      itemCondition: 'https://schema.org/NewCondition'
    } } : {})
  });
  if (variants.length > 1) {
    base.productGroupID = product.id.split('/').pop();
    base.hasVariant = variants.map(data);
    base.variesBy = [...new Set(variants.flatMap(v => (v.selectedOptions || []).map(o => o.name)))];
  } else if (variants[0]) Object.assign(base, data(variants[0]));
  return base;
}

export async function allPages(fetchPage) {
  const nodes = [], cursors = new Set(); let after = null;
  for (let page = 0; page < 100; page++) {
    const result = await fetchPage(after);
    if (!Array.isArray(result.nodes) || !result.pageInfo) throw new Error('Invalid content page');
    nodes.push(...result.nodes);
    if (!result.pageInfo.hasNextPage) return [...new Map(nodes.map(node => [node.id, node])).values()];
    after = result.pageInfo.endCursor;
    if (!after || cursors.has(after)) throw new Error('Invalid/repeating content cursor');
    cursors.add(after);
  }
  throw new Error('Content pagination exceeded safety limit');
}
