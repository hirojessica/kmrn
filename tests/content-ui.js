import { initContentList, articleFragment } from '../mockups/assets/content.js';
import { detailView, descriptionText } from '../mockups/assets/shop.js';
import { storefrontConfig } from '../mockups/assets/storefront-config.js';
const results = [], output = document.querySelector('#results');
function assert(value, name) { if (!value) throw new Error(name); results.push('PASS '+name); output.textContent = results.join('\n'); }
function root(kind) {
  const node = document.createElement('section'); node.dataset.content = kind;
  node.innerHTML = '<div data-content-status></div><div data-content-list></div><button data-content-more hidden>More</button>';
  document.querySelector('#fixture').append(node); return node;
}
const tick = async node => { for (let i=0; i<100 && node.querySelector('[data-content-list]').getAttribute('aria-busy') === 'true'; i++) await new Promise(resolve=>setTimeout(resolve,10)); };
const pageInfo = { hasNextPage: false, endCursor: null };
try {
  assert(descriptionText({descriptionHtml:'<p>日本語<br>説明</p><p>English description</p><script>ignored</script>'}) === '日本語\n説明\n\nEnglish description', 'Product descriptions retain paragraphs and omit executable content');
  const testVariant = { id:'gid://shopify/ProductVariant/123', availableForSale:true, price:{amount:'1000',currencyCode:'JPY'} };
  const testProduct = { id:storefrontConfig.testProductIds[0], title:'Test piece', tags:['kmn-test'], variants:{nodes:[testVariant],pageInfo:{hasNextPage:false}}, featuredImage:{url:'https://cdn.shopify.com/s/files/1/1012/2290/8186/files/kmn-gallery-15.webp?v=1788604493',width:1080,height:1350} };
  const testDetail = detailView(testProduct,false); document.querySelector('#fixture').append(testDetail);
  assert(!testDetail.querySelector('.shop-purchase').disabled && testDetail.querySelector('.shop-purchase').textContent==='テスト購入へ進む', 'Prepared test products display an enabled test-only purchase button');
  assert(testDetail.querySelector('.shop-test-guide').textContent.includes('カード番号：1') && testDetail.querySelector('.shop-detail-note').textContent.includes('実際の請求・発送はありません'), 'Test checkout exposes test instructions and no-charge notice');
  const image = testDetail.querySelector('.shop-detail-photo img'), frame = image.parentElement;
  assert(Math.abs(image.getBoundingClientRect().height-frame.getBoundingClientRect().height)<1 && getComputedStyle(image).objectFit==='contain', 'Portrait product photos fit their frame without overflowing');
  const realDetail=detailView({...testProduct,id:'gid://shopify/Product/999',tags:[]},false);
  assert(realDetail.querySelector('.shop-purchase').disabled && !realDetail.querySelector('.shop-test-guide'), 'Unrelated products keep purchasing disabled');
  const soldDetail=detailView({...testProduct,variants:{nodes:[{...testVariant,availableForSale:false}],pageInfo:{hasNextPage:false}}},false);
  assert(soldDetail.querySelector('.shop-purchase').disabled && soldDetail.querySelector('.shop-purchase').textContent==='品切れ', 'Sold-out test items cannot proceed to checkout');
  testDetail.remove();
  const rich = document.createElement('div');
  rich.append(articleFragment('<h2>見出し</h2><p><strong>太字</strong><a href="javascript:alert(1)" onclick="alert(1)">リンク</a></p><scr'+'ipt>alert(1)</scr'+'ipt><iframe src="about:blank"></iframe><img src="data:image/svg+xml,x" onerror="alert(1)"><table><tr><td colspan="2">セル</td></tr></table>'));
  assert(rich.querySelector('strong')?.textContent === '太字' && rich.querySelector('.article-table-wrap td')?.colSpan === 2, 'Article rich text and tables are preserved');
  assert(!rich.querySelector('script,iframe,img,[onclick],a[href]'), 'Article scripts, event handlers, active links and unsafe images are removed');
  const news = root('news'); let calls = 0, failAppend = true;
  const article = { id:'one', handle:'春のお知らせ', title:'<img onerror=alert(1)>', tags:['<b>催事</b>'], publishedAt:'2026-09-01T00:00:00Z' };
  const client = { news: async ({after}) => { calls++; if (after && failAppend) { failAppend=false; throw new Error('offline'); } return after ? { nodes:[article,{...article,id:'two',handle:'second',title:'二つ目'}], pageInfo } : { nodes:[article], pageInfo:{hasNextPage:true,endCursor:'older'} }; } };
  await initContentList(news, client);
  assert(news.querySelector('.news-title').textContent === article.title && !news.querySelector('.news-title img'), 'News titles and tags are plain text');
  assert(new URL(news.querySelector('a').href).searchParams.get('handle') === article.handle, 'Unicode article links retain their handle');
  news.querySelector('[data-content-more]').click(); await tick(news);
  assert(news.querySelector('[data-content-status]').dataset.state === 'error' && news.querySelectorAll('.news-row').length === 1, 'Pagination failure retains previously loaded news');
  news.querySelector('[data-content-status] button').click(); await tick(news);
  assert(news.querySelectorAll('.news-row').length === 2 && news.querySelector('[data-content-more]').hidden, 'Retry appends without duplicates and ends pagination');
  const empty = root('gallery'); await initContentList(empty,{gallery:async()=>({nodes:[],pageInfo})});
  assert(empty.querySelector('[data-content-status]').dataset.state === 'empty', 'An empty published gallery is distinct from an error');
  const gallery=root('gallery');
  const good={id:'photo',fields:[{key:'title',value:'写真のテスト'},{key:'caption',value:'拡大表示の説明'},{key:'image',reference:{image:{url:new URL('../assets/recreated-hero-v2.png',location.href).href.replace('http:','https:'),width:917,height:1715}}}]};
  // Use a public HTTPS image for behavior tests; no uploads or real content publication.
  good.fields[2].reference.image.url='https://hirojessica.github.io/kmrn/assets/recreated-hero-v2.png';
  await initContentList(gallery,{gallery:async()=>({nodes:[good,{id:'missing',fields:[]}],pageInfo})});
  assert(gallery.querySelectorAll('.gallery-card').length===1, 'Gallery omits entries without a usable image');
  gallery.querySelector('button').click();
  assert(document.querySelector('#gallery-lightbox').open && document.querySelector('#lightbox-title').textContent==='写真のテスト', 'Photo opens in an accessible lightbox');
  document.querySelector('#gallery-lightbox button').click();
  assert(!document.querySelector('#gallery-lightbox').open, 'Photo lightbox closes');
  good.fields.push({key:'title_en',value:'English photo title'},{key:'caption_en',value:'English photo description'},{key:'category',value:'制作工程'},{key:'category_en',value:'Our Craft'});
  document.documentElement.lang='en'; document.dispatchEvent(new CustomEvent('kmn:languagechange',{detail:{language:'en'}})); await tick(gallery);
  assert(gallery.querySelector('h2').textContent==='English photo title' && gallery.querySelector('p').textContent==='English photo description' && gallery.querySelector('.news-tag').textContent==='Our Craft', 'English gallery uses CMS translations for titles, captions and categories');
  assert(gallery.querySelector('img').alt==='English photo title' && gallery.querySelector('button').getAttribute('aria-label')==='Enlarge English photo title', 'English photo alternative text and controls are translated');
  gallery.querySelector('button').click();
  assert(document.querySelector('#lightbox-title').textContent==='English photo title' && document.querySelector('#gallery-lightbox p').textContent==='English photo description', 'English lightbox retains the translated title and caption');
  document.documentElement.lang='ja'; document.dispatchEvent(new CustomEvent('kmn:languagechange',{detail:{language:'ja'}})); await tick(gallery);
  assert(!document.querySelector('#gallery-lightbox').open && gallery.querySelector('h2').textContent==='写真のテスト' && gallery.querySelector('.news-tag').textContent==='制作工程', 'Changing language closes a stale lightbox and restores Japanese gallery copy');
  const stale=root('news'); let firstResolve, request=0;
  const staleClient={news:()=> ++request === 1 ? new Promise(resolve=>firstResolve=resolve) : Promise.resolve({nodes:[{...article,id:'new',title:'Latest language'}],pageInfo})};
  const first=initContentList(stale,staleClient);
  document.documentElement.lang='en'; document.dispatchEvent(new CustomEvent('kmn:languagechange',{detail:{language:'en'}})); await tick(stale);
  firstResolve({nodes:[{...article,title:'Stale'}],pageInfo}); await first;
  assert(stale.querySelector('.news-title').textContent==='Latest language','A stale language request cannot replace newer content');
  output.dataset.result='pass'; output.textContent=results.join('\n')+'\n'+results.length+' checks passed.';
} catch(error) { output.dataset.result='fail'; output.textContent=results.join('\n')+'\nFAIL '+error.message; }
