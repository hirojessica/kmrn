// Only the Storefront PUBLIC token belongs here. Never add an Admin API or private token.
export const storefrontConfig = Object.freeze({
  domain: 'km-nagoya-doll-r1yeax0z.myshopify.com',
  apiVersion: '2026-04',
  publicAccessToken: "40f033869664529caa21b1ba07287ac8",
  country: 'JP',
  // Live sales stay disabled until the store transfer and production setup are ready.
  checkoutEnabled: false,
  // Shopify Test payment gateway is active. Turn this off before switching gateways.
  testCheckoutEnabled: true,
  testProductIds: Object.freeze([
    'gid://shopify/Product/10387436699930',
    'gid://shopify/Product/10387437814042',
    'gid://shopify/Product/10387438338330',
  ]),
  showLayoutSamples: true,
});
