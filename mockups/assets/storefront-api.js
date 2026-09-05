import { storefrontConfig } from './storefront-config.js';

export class StorefrontError extends Error {
  constructor(code, message) { super(message); this.name = 'StorefrontError'; this.code = code; }
}
const cardFields = `id handle title availableForSale productType
  featuredImage { url altText width height }
  priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }`;
const sortOptions = {
  newest: { sortKey: 'CREATED_AT', reverse: true },
  'price-asc': { sortKey: 'PRICE', reverse: false },
  'price-desc': { sortKey: 'PRICE', reverse: true },
  title: { sortKey: 'TITLE', reverse: false },
};

export function createStorefrontClient(config = storefrontConfig, fetchImpl = (...args) => fetch(...args)) {
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(config.domain)) throw new StorefrontError('CONFIG', 'Invalid store domain');
  if (!/^\d{4}-(01|04|07|10)$/.test(config.apiVersion)) throw new StorefrontError('CONFIG', 'Invalid API version');
  if (/^(shpat_|shpca_|shppa_|shpss_)/.test(config.publicAccessToken || '')) throw new StorefrontError('CONFIG', 'Private credentials are not supported');
  async function request(query, variables, signal) {
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) controller.abort();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (config.publicAccessToken) headers['X-Shopify-Storefront-Access-Token'] = config.publicAccessToken;
      const response = await fetchImpl(`https://${config.domain}/api/${config.apiVersion}/graphql.json`, {
        method: 'POST', headers, body: JSON.stringify({ query, variables }), signal: controller.signal,
        credentials: 'omit',
      });
      let result;
      try { result = await response.json(); } catch { throw new StorefrontError('RESPONSE', 'Invalid JSON response'); }
      if (result.errors?.some(error => /channel is locked/i.test(error.message || ''))) throw new StorefrontError('LOCKED', 'Store channel is locked');
      if (response.status === 401 || response.status === 403) throw new StorefrontError('ACCESS', 'Storefront access unavailable');
      if (!response.ok || result.errors?.length || !result.data) throw new StorefrontError('API', 'Storefront request failed');
      return result.data;
    } catch (error) {
      if (error instanceof StorefrontError) throw error;
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      throw new StorefrontError(controller.signal.aborted ? 'TIMEOUT' : 'NETWORK', 'Storefront request unavailable');
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
    }
  }
  return {
    async products({ first = 12, after = null, sort = 'newest', language = 'JA', signal } = {}) {
      const data = await request(`query Products($first: Int!, $after: String, $sortKey: ProductSortKeys!, $reverse: Boolean!, $country: CountryCode!, $language: LanguageCode!) @inContext(country: $country, language: $language) {
        products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
          nodes { ${cardFields} } pageInfo { hasNextPage endCursor }
        }
      }`, { first, after, ...(sortOptions[sort] || sortOptions.newest), country: config.country, language }, signal);
      if (!Array.isArray(data.products?.nodes) || !data.products.pageInfo) throw new StorefrontError('RESPONSE', 'Invalid products response');
      return data.products;
    },
    async product(handle, { language = 'JA', signal } = {}) {
      if (!handle || handle.length > 255) throw new StorefrontError('NOT_FOUND', 'Missing product handle');
      const data = await request(`query Product($handle: String!, $country: CountryCode!, $language: LanguageCode!) @inContext(country: $country, language: $language) {
        product(handle: $handle) { ${cardFields} description
          images(first: 12) { nodes { url altText width height } }
          variants(first: 100) { nodes { id title availableForSale price { amount currencyCode } image { url altText width height } } pageInfo { hasNextPage } }
        }
      }`, { handle, country: config.country, language }, signal);
      if (!data.product) throw new StorefrontError('NOT_FOUND', 'Product not found');
      return data.product;
    },
  };
}
export const storefront = createStorefrontClient();

export function formatMoney(price, language = 'ja') {
  if (!price || !Number.isFinite(Number(price.amount)) || !/^[A-Z]{3}$/.test(price.currencyCode || '')) return '';
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'ja-JP', { style: 'currency', currency: price.currencyCode }).format(Number(price.amount));
}
export function safeImageURL(source) {
  try { const url = new URL(source); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
}
