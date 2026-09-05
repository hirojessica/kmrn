import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorefrontClient, formatMoney, safeImageURL } from '../mockups/assets/storefront-api.js';
const config = { domain: 'example.myshopify.com', apiVersion: '2026-04', country: 'JP', publicAccessToken: '' };
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });

test('reads products with pagination, price sorting, language and no browser credentials', async () => {
  let captured;
  const client = createStorefrontClient(config, async (url, options) => {
    captured = { url, ...options, body: JSON.parse(options.body) };
    return response({ data: { products: { nodes: [{ id: '1', title: '<img onerror=alert(1)>' }], pageInfo: { hasNextPage: true, endCursor: 'next' } } } });
  });
  const result = await client.products({ first: 12, after: 'cursor', sort: 'price-desc', language: 'EN' });
  assert.equal(result.nodes.length, 1);
  assert.equal(result.pageInfo.endCursor, 'next');
  assert.equal(captured.url, 'https://example.myshopify.com/api/2026-04/graphql.json');
  assert.deepEqual(captured.body.variables, { first: 12, after: 'cursor', sortKey: 'PRICE', reverse: true, country: 'JP', language: 'EN' });
  assert.equal(captured.credentials, 'omit');
  assert.equal(captured.headers['X-Shopify-Storefront-Access-Token'], undefined);
});
test('empty catalog remains an empty successful response', async () => {
  const client = createStorefrontClient(config, async () => response({ data: { products: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } } }));
  assert.deepEqual((await client.products()).nodes, []);
});
test('locked store, authorization, GraphQL and malformed responses remain distinct failures', async () => {
  for (const [body, status, code] of [
    [{ errors: [{ message: 'Online Store channel is locked.' }] }, 400, 'LOCKED'],
    [{ errors: [] }, 401, 'ACCESS'],
    [{ data: {}, errors: [{ message: 'Unavailable' }] }, 200, 'API'],
    [{ data: { products: {} } }, 200, 'RESPONSE'],
  ]) {
    const client = createStorefrontClient(config, async () => response(body, status));
    await assert.rejects(client.products(), error => error.code === code);
  }
});
test('invalid JSON and network errors do not masquerade as an empty collection', async () => {
  const malformed = createStorefrontClient(config, async () => ({ ok: true, status: 200, json: async () => { throw new Error('Invalid'); } }));
  await assert.rejects(malformed.products(), error => error.code === 'RESPONSE');
  const offline = createStorefrontClient(config, async () => { throw new TypeError('offline'); });
  await assert.rejects(offline.products(), error => error.code === 'NETWORK');
});
test('aborted requests do not become user-visible network errors', async () => {
  const controller = new AbortController();
  controller.abort();
  const client = createStorefrontClient(config, async () => { throw new DOMException('Aborted', 'AbortError'); });
  await assert.rejects(client.products({ signal: controller.signal }), error => error.name === 'AbortError');
});
test('product handles are variables, and missing/unpublished products stay unavailable', async () => {
  let vars;
  const client = createStorefrontClient(config, async (_, options) => {
    vars = JSON.parse(options.body).variables;
    return response({ data: { product: null } });
  });
  await assert.rejects(client.product('a"} mutation {'), error => error.code === 'NOT_FOUND');
  assert.equal(vars.handle, 'a"} mutation {');
  await assert.rejects(client.product(''), error => error.code === 'NOT_FOUND');
});
test('private token formats and arbitrary endpoints are rejected', () => {
  assert.throws(() => createStorefrontClient({ ...config, domain: 'evil.example' }), error => error.code === 'CONFIG');
  assert.throws(() => createStorefrontClient({ ...config, publicAccessToken: 'shpat_test-only' }), error => error.code === 'CONFIG');
});
test('prices retain currency precision and image URLs reject active/mixed content', () => {
  assert.match(formatMoney({ amount: '38500.0', currencyCode: 'JPY' }), /38,500/);
  assert.equal(formatMoney({ amount: '12.5', currencyCode: 'USD' }, 'en'), '$12.50');
  assert.equal(formatMoney(null), '');
  assert.equal(safeImageURL('javascript:alert(1)'), null);
  assert.equal(safeImageURL('data:image/svg+xml,test'), null);
  assert.equal(safeImageURL('http://cdn.example.com/x.jpg'), null);
  assert.equal(safeImageURL('https://cdn.shopify.com/x.jpg'), 'https://cdn.shopify.com/x.jpg');
});
