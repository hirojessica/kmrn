// Only the Storefront PUBLIC token belongs here. Never add an Admin API or private token.
export const storefrontConfig = Object.freeze({
  domain: 'km-nagoya-doll-r1yeax0z.myshopify.com',
  apiVersion: '2026-04',
  publicAccessToken: "40f033869664529caa21b1ba07287ac8",
  country: 'JP',
  // Live sales stay disabled until the store transfer and production setup are ready.
  checkoutEnabled: false,
  // Test products were removed when the real catalogue was registered.
  testCheckoutEnabled: false,
  testProductIds: Object.freeze([]),
  showLayoutSamples: false,
});
