import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutMode, checkoutURL } from '../mockups/assets/checkout.js';

const variant = { id: 'gid://shopify/ProductVariant/123', availableForSale: true };
const product = { id: 'gid://shopify/Product/456', tags: ['kmn-test'], variants: { nodes: [variant], pageInfo: { hasNextPage: false } } };
const config = { domain: 'example.myshopify.com', checkoutEnabled: false, testCheckoutEnabled: true, testProductIds: [product.id] };

test('only explicitly prepared, tagged products can use test checkout', () => {
  assert.equal(checkoutMode(product, config), 'test');
  assert.equal(checkoutURL(product, variant, config), 'https://example.myshopify.com/cart/123:1');
  assert.equal(checkoutMode({ ...product, id: 'gid://shopify/Product/789' }, config), null);
  assert.equal(checkoutMode({ ...product, tags: [] }, config), null);
  assert.equal(checkoutMode(product, { ...config, testCheckoutEnabled: false }), null);
});

test('test samples do not become live purchases when live sales are enabled', () => {
  const liveConfig = { ...config, checkoutEnabled: true, testCheckoutEnabled: false };
  assert.equal(checkoutMode(product, liveConfig), null);
  assert.equal(checkoutMode({ ...product, tags: [] }, liveConfig), null);
  assert.equal(checkoutMode({ ...product, id: 'gid://shopify/Product/789' }, liveConfig), null);
  assert.equal(checkoutMode({ ...product, id: 'gid://shopify/Product/789', tags: [] }, liveConfig), 'live');
});

test('sold out, incomplete and unrelated variants cannot create a checkout link', () => {
  assert.equal(checkoutURL(product, { ...variant, availableForSale: false }, config), null);
  assert.equal(checkoutURL(product, { ...variant, id: 'gid://shopify/ProductVariant/789' }, config), null);
  assert.equal(checkoutURL({ ...product, variants: { ...product.variants, pageInfo: { hasNextPage: true } } }, variant, config), null);
  assert.equal(checkoutURL(product, null, config), null);
});

test('checkout destinations reject arbitrary hosts and invalid variant identifiers', () => {
  assert.equal(checkoutURL(product, variant, { ...config, domain: 'evil.example' }), null);
  const invalid = { ...variant, id: '123?redirect=elsewhere' };
  assert.equal(checkoutURL({ ...product, variants: { nodes: [invalid] } }, invalid, config), null);
});
