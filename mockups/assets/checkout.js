// A test button is limited to the explicitly prepared Shopify sample products.
// The payment gateway must also be in test mode in Shopify; this flag cannot set it.
export const isTestProduct = product => product?.tags?.includes('kmn-test') === true;

export function checkoutMode(product, config) {
  const listed = config.testProductIds?.includes(product?.id) === true;
  if (listed || isTestProduct(product)) {
    return listed && isTestProduct(product) && config.testCheckoutEnabled === true ? 'test' : null;
  }
  return config.checkoutEnabled === true ? 'live' : null;
}

export function checkoutURL(product, variant, config) {
  if (!checkoutMode(product, config) || !variant?.availableForSale || product.variants?.pageInfo?.hasNextPage) return null;
  if (!product.variants?.nodes?.some(item => item.id === variant.id)) return null;
  const id = /^gid:\/\/shopify\/ProductVariant\/(\d+)$/.exec(variant.id || '')?.[1];
  if (!id || !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(config.domain)) return null;
  return `https://${config.domain}/cart/${id}:1`;
}
