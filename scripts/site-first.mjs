import fs from 'node:fs/promises';
import { jsonScript } from './seo.mjs';

export async function siteFirstContent(site) {
  const records = JSON.parse(await fs.readFile(new URL('../content/site-first-gallery.json', import.meta.url), 'utf8'));
  // These two gallery replacements were saved in Shopify on September 15.
  const replacements = {
    'kmn-gallery-01': ['assets/kmn-process-01-20260915.jpg', 1339, 1071],
    'kmn-gallery-02': ['assets/kmn-process-02-20260915.jpg', 2500, 2000]
  };
  const nodes = records.map(item => {
    const [image, width, height] = replacements[item.handle] || [item.image, item.width, item.height];
    return { id: item.handle, handle: item.handle, fields: [
      ...['title', 'caption', 'category', 'title_en', 'caption_en', 'category_en'].map(key => ({ key, value: item[key] })),
      { key: 'image', reference: { image: { url: new URL(image, site).href, width, height, altText: item.title } } }
    ] };
  });
  // Last saved replacements first, then the previously uploaded gallery sequence.
  nodes.sort((a, b) => (['kmn-gallery-02','kmn-gallery-01'].indexOf(a.handle) + 1 || 100 - Number(a.handle.slice(-2))) - (['kmn-gallery-02','kmn-gallery-01'].indexOf(b.handle) + 1 || 100 - Number(b.handle.slice(-2))));
  const value = { products: [], articles: [], photos: nodes, gallery: nodes };
  return { ja: structuredClone(value), en: structuredClone(value) };
}

export function offlineAPI(nodes, site) {
  const serialized = structuredClone(nodes);
  for (const node of serialized) {
    const img = node.fields.find(field => field.key === 'image').reference.image;
    img.url = new URL(img.url).pathname.slice(site.pathname.length).replace(/^assets\//, '');
  }
  return `// Frozen published gallery for the corporate-site launch. No Shopify requests.
const nodes = ${jsonScript(serialized)};
for (const n of nodes) { const image=n.fields.find(f=>f.key==='image').reference.image; image.url=new URL(image.url,import.meta.url).href; }
export function safeImageURL(source) { try { const u=new URL(source); return u.protocol==='https:' || u.origin===new URL(import.meta.url).origin ? u.href : null; } catch { return null; } }
export const storefront={
 gallery:async()=>({nodes,pageInfo:{hasNextPage:false,endCursor:null}}),
 galleryByHandles:async handles=>nodes.filter(n=>handles.includes(n.handle)),
 news:async()=>({nodes:[],pageInfo:{hasNextPage:false,endCursor:null}})
};
`;
}

export function comingSoon(doc, lang, { compact = false } = {}) {
  const box = doc.createElement('section'); box.className = 'site-coming-soon';
  const label = doc.createElement('p'); label.className = 'lr-label'; label.textContent = 'ONLINE SHOP';
  const heading = doc.createElement(compact ? 'h3' : 'h1');
  heading.textContent = lang === 'en' ? 'Our online shop is coming soon.' : 'オンラインショップは準備中です。';
  const body = doc.createElement('p'); body.textContent = lang === 'en'
    ? 'We are preparing our online shop. Please explore our photo gallery while we get ready to welcome you.'
    : 'ただいまオンライン販売の準備を進めております。公開まで、ぜひギャラリーで私たちの作品をご覧ください。';
  const links = doc.createElement('div'); links.className = 'site-coming-links';
  for (const [route, ja, en] of [['gallery/','ギャラリーを見る','Explore the gallery'], ['contact/','お問い合わせ','Contact us']]) {
    const a = doc.createElement('a'); a.href = new URL((lang === 'en' ? 'en/' : '') + route, new URL(doc.documentElement.dataset.siteRoot, doc.URL)).href;
    a.className = route === 'gallery/' ? 'lr-button' : 'content-outline'; a.textContent = lang === 'en' ? en : ja; links.append(a);
  }
  box.append(label, heading, body, links); return box;
}
