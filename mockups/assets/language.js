// 日本語 / 英語の表示切替（静的モックアップ用）
// 初回はブラウザ言語を使用し、手動選択後は localStorage の設定を優先する。
(function () {
  'use strict';

  var STORAGE_KEY = 'kmn-language';
  var translations = {
    'KM名古屋ドール株式会社': 'KM Nagoya Doll Co., Ltd.',
    'KM名古屋ドール株式会社｜瀬戸焼の陶製レース人形': 'KM Nagoya Doll Co., Ltd. | Seto Porcelain Lace Dolls',
    '会社案内｜KM名古屋ドール株式会社': 'About Us | KM Nagoya Doll Co., Ltd.',
    'オンラインショップ｜KM名古屋ドール株式会社': 'Online Shop | KM Nagoya Doll Co., Ltd.',
    'レースドール「白鳥の湖」｜KM名古屋ドール株式会社': 'Swan Lake Lace Doll | KM Nagoya Doll Co., Ltd.',
    'お知らせ｜KM名古屋ドール株式会社': 'News | KM Nagoya Doll Co., Ltd.',
    'オンラインショップをオープンしました｜お知らせ｜KM名古屋ドール株式会社': 'Our Online Shop Is Now Open | News | KM Nagoya Doll Co., Ltd.',
    'メイン': 'Main navigation',
    '検索': 'Search',
    'アカウント': 'Account',
    'カート': 'Cart',
    'メニュー': 'Menu',
    'メニューを閉じる': 'Close menu',
    'モバイルメニュー': 'Mobile menu',
    '閉じる': 'Close',
    'ページ送り': 'Pagination',
    '次のページ': 'Next page',
    '並び替え': 'Sort by',
    '数量': 'Quantity',
    '減らす': 'Decrease quantity',
    '増やす': 'Increase quantity',
    '写真1': 'Image 1',
    '写真2': 'Image 2',
    '写真3': 'Image 3',
    '写真4': 'Image 4',
    '写真5': 'Image 5',
    '私たちについて': 'About Us',
    '商品カテゴリ': 'Product Categories',
    'お知らせ': 'News',
    'お問い合わせ': 'Contact',
    'オンラインショップ': 'Online Shop',
    '会社案内': 'About Us',
    '製造工程': 'Craft Process',
    'すべての商品': 'All Products',
    '陶製レース人形': 'Porcelain Lace Dolls',
    'カントリー雑貨': 'Country Decor',
    'アロマポット': 'Aroma Pots',
    '招福アイテム': 'Lucky Charms',
    'モールド・型': 'Molds',
    'モールド・資材': 'Molds & Materials',
    '資材': 'Materials',
    '配送・返品について': 'Shipping & Returns',
    '特定商取引法に基づく表記': 'Legal Notice',
    'プライバシーポリシー': 'Privacy Policy',
    '昭和26年創業・瀬戸焼の窯元': 'A Seto pottery studio established in 1951',
    '〒489-0911 愛知県瀬戸市北松山町1-10': '1-10 Kitamatsuyama-cho, Seto, Aichi 489-0911, Japan',
    '決済アイコン（Shopify標準を表示）': 'Payment methods (provided by Shopify)',
    '(税込)': '(tax included)',
    'ホーム': 'Home',
    '千年の陶土に、': 'From a thousand years of clay,',
    'レースを咲かせる。': 'lace blooms in porcelain.',
    '瀬戸焼の技で生まれる陶製レース人形。KM名古屋ドールの手仕事を、あなたの暮らしへお届けします。': 'Porcelain lace dolls shaped by the traditions of Seto ware. Discover the handcraft of KM Nagoya Doll, made to bring quiet beauty into your home.',
    'ヒーローメディア（管理画面で動画/画像を設定）': 'Hero media (video or image selected in the admin)',
    '動画例: 窯の炎、レースを泥漿に浸す手元、上絵付けの筆先': 'Video examples: kiln flames, lace dipped in porcelain slip, and hand-painted details',
    '画像例: 白磁のレース人形と自然光のスタジオカット（1920×1080）': 'Image example: a white porcelain lace doll in natural studio light (1920 x 1080)',
    'おすすめの商品': 'Featured Products',
    'すべての商品を見る →': 'View All Products →',
    '商品写真（正方形）': 'Product image (square)',
    'レース人形・バレリーナ': 'Lace doll / ballerina',
    'レースドール「白鳥の湖」': 'Swan Lake Lace Doll',
    '白磁アロマポット 花透かし': 'White Porcelain Floral Aroma Pot',
    '招福アイテム・干支': 'Lucky charm / zodiac',
    '干支の置物 午（うま）': 'Zodiac Horse Figurine',
    '残りわずか': 'LOW STOCK',
    'カントリードール ガーデン': 'Garden Country Doll',
    '工房写真（縦4:5）': 'Workshop image (vertical 4:5)',
    '職人がレースを泥漿に浸す手元': 'An artisan dipping lace into porcelain slip',
    '瀬戸の土と、七十年。': 'Seventy Years Shaped by Seto Clay.',
    '昭和26年、私たちは輸出向け陶磁器人形の製作から歩みを始めました。千年の歴史を持つ瀬戸焼の技術と、瀬戸の豊富な陶土。その恵みを受け継ぎながら、布のレースを一枚ずつ泥漿にくぐらせ、1300度の窯で焼き上げる「陶製レース人形」を作り続けています。': 'We began in 1951 by producing porcelain dolls for export. Drawing on Seto\'s thousand-year ceramic tradition and its rich clay, we continue to create porcelain lace dolls by dipping real fabric lace into porcelain slip and firing each piece at 1,300°C.',
    'ひとつとして同じものはできない、手仕事のやきもの。快適な空間を演出する商品づくりを目指して、今日も瀬戸の窯に火を入れています。': 'No two handmade pieces are ever exactly alike. Every day, we fire our Seto kilns to make objects that bring warmth and comfort to the spaces people live in.',
    '会社案内を見る': 'Learn About Us',
    'オンラインショップへ →': 'Visit the Online Shop →',
    '手仕事の工程': 'Our Craft Process',
    '工程写真（4:3）': 'Process image (4:3)',
    '原型制作・石膏型': 'Original sculpting and plaster molds',
    '原型・型づくり': 'Sculpting & Mold Making',
    '職人がスケッチから粘土で原型を起こし、石膏型を製作します。': 'An artisan sculpts the original form in clay from a sketch, then creates a plaster mold.',
    '鋳込み成形': 'Slip Casting',
    '液状の粘土を型に流し込み、素地を成形。バリを丁寧に除きます。': 'Liquid clay is poured into the mold to form the body, then every seam is carefully finished.',
    '窯・焼成': 'Kiln Firing',
    '施釉・本焼成': 'Glazing & Firing',
    '釉薬を施し、ガス窯で約24時間・1300℃で焼き上げます。': 'The piece is glazed and fired in a gas kiln at 1,300°C for approximately 24 hours.',
    '上絵付けの筆先': 'Hand-painted details',
    '上絵付け・上絵焼成': 'Painting & Final Firing',
    '筆で絵を施し、電気窯で約8時間・800℃。彩りが生まれます。': 'Details are painted by hand, then fired in an electric kiln at 800°C for approximately eight hours.',
    'この手仕事から生まれた商品を見る': 'Shop Pieces Made by Hand',
    'カテゴリから探す': 'Shop by Category',
    'カテゴリ写真（16:10）レース人形': 'Category image (16:10): lace dolls',
    'カテゴリ写真（16:10）カントリー雑貨': 'Category image (16:10): country decor',
    'カテゴリ写真（16:10）アロマポット': 'Category image (16:10): aroma pots',
    'カテゴリ写真（16:10）招福アイテム': 'Category image (16:10): lucky charms',
    'カテゴリ写真（16:10）モールド・型': 'Category image (16:10): molds',
    'カテゴリ写真（16:10）資材': 'Category image (16:10): materials',
    'Country Zakka': 'Country Decor',
    'Aroma Pot': 'Aroma Pots',
    'Shofuku': 'Lucky Charms',
    'Mold': 'Molds',
    'Material': 'Materials',
    '一覧へ →': 'View All →',
    'オンラインショップをオープンしました': 'Our Online Shop Is Now Open',
    '商品情報': 'Product News',
    '干支の置物「午」の予約受付を開始しました': 'Pre-orders Open for the Zodiac Horse Figurine',
    '夏季休業のご案内': 'Summer Holiday Notice',
    '背景写真（工房・窯）': 'Background image (workshop / kiln)',
    '暮らしに、窯の温もりを。': 'Bring the Warmth of the Kiln into Your Home.',
    '商品のご購入はオンラインショップから。卸・法人のご相談もお気軽にどうぞ。': 'Shop our collection online. Wholesale and corporate enquiries are also welcome.',
    'アクセス': 'Access',
    '千年の陶土のまち、瀬戸。': 'Seto, a city shaped by a thousand years of clay.',
    '私たちはこの地で七十年あまり、': 'For more than seventy years, we have worked here,',
    'やきものの人形を作り続けてきました。': 'creating dolls in porcelain.',
    '布のレースが、炎をくぐって白磁になる。': 'Fabric lace passes through flame and becomes white porcelain.',
    'その一瞬の奇跡を、あなたの暮らしへ。': 'We bring that fleeting miracle into your home.',
    '沿革': 'History',
    '1951（昭和26年）': '1951',
    '輸出向け陶磁器人形の製作を開始（テーケー名古屋人形製陶株式会社）': 'Began producing porcelain dolls for export as TK Nagoya Ningyo Seitoh Co., Ltd.',
    '陶製レース人形をはじめ、カントリー雑貨・アロマポット・招福製品へと製品を拡大 ※年表の詳細はクライアント確認のうえ追記': 'Expanded the range to include porcelain lace dolls, country decor, aroma pots, and lucky charms. (Further historical details to be confirmed.)',
    '2023（令和5年）9月': 'September 2023',
    'KM名古屋ドール株式会社として新たに設立、事業を継承': 'KM Nagoya Doll Co., Ltd. was established to carry the business forward.',
    'オンラインショップを開設': 'Opened the online shop.',
    '製造工程 — 七つの手仕事': 'Seven Steps of Handcraft',
    '工程写真（4:3）原型制作': 'Process image (4:3): original sculpting',
    '原型制作': 'Original Sculpting',
    '職人がスケッチをもとに粘土で形を起こし、製品の元となる石膏型を作ります。人形の表情はこの最初のひと手で決まります。': 'Working from a sketch, an artisan shapes the original in clay and creates the plaster mold. The character of each doll begins with this first touch.',
    '工程写真（4:3）鋳込み成形': 'Process image (4:3): slip casting',
    '液状にした粘土（泥漿）を石膏型に流し込み、素地を成形します。': 'Liquid porcelain clay is poured into the plaster mold to form the body.',
    '工程写真（4:3）仕上げ作業': 'Process image (4:3): finishing',
    '仕上げ作業': 'Finishing',
    '型から取り出した素地のバリをひとつずつ手作業で取り除き、肌を整えます。': 'After removal from the mold, every seam is trimmed by hand and the surface is carefully smoothed.',
    '工程写真（4:3）施釉': 'Process image (4:3): glazing',
    '施釉': 'Glazing',
    '乾燥させた素地に釉薬を施します。焼き上がりの艶と白さを生む工程です。': 'The dried body is glazed to create its lustre and luminous white finish.',
    '工程写真（4:3）ガス窯': 'Process image (4:3): gas kiln',
    '本焼成': 'High Firing',
    'ガス窯で約24時間、1300℃。土が磁器へと生まれ変わる、最も緊張する時間です。': 'The piece spends approximately 24 hours in a gas kiln at 1,300°C—the most exacting stage, when clay becomes porcelain.',
    '工程写真（4:3）上絵作業': 'Process image (4:3): overglaze painting',
    '上絵作業': 'Overglaze Painting',
    '筆やスプレーで素地の表面に絵を施します。頬の紅、花びらの一枚まで、すべて手仕事です。': 'Brushes and sprays add every detail by hand, from the blush of a cheek to each individual petal.',
    '工程写真（4:3）電気窯': 'Process image (4:3): electric kiln',
    '上絵焼成': 'Final Firing',
    '電気窯で約8時間、800℃。絵付けが焼き付き、色が永く定着します。': 'An eight-hour firing at 800°C in an electric kiln permanently sets the painted colours.',
    '会社概要': 'Company Profile',
    '社名': 'Company Name',
    'KM名古屋ドール株式会社（旧テーケー名古屋人形製陶株式会社）': 'KM Nagoya Doll Co., Ltd. (formerly TK Nagoya Ningyo Seitoh Co., Ltd.)',
    '所在地': 'Address',
    '電話': 'Telephone',
    '代表者': 'Representative',
    '代表取締役 本村 久美子': 'Kumiko Motomura, Representative Director',
    '設立': 'Established',
    '2023年9月1日（創業 昭和26年）': 'September 1, 2023 (business founded in 1951)',
    '事業内容': 'Business',
    '陶磁器製品（陶製レース人形・カントリー雑貨・アロマポット・招福製品・モールド・資材）の製造販売': 'Manufacture and sale of porcelain products, including lace dolls, country decor, aroma pots, lucky charms, molds, and craft materials.',
    '経営方針': 'Our Aim',
    '快適な空間を演出する商品作りを目指す': 'To create products that bring comfort and beauty to everyday spaces.',
    'Googleマップ埋め込み（愛知県瀬戸市北松山町1-10）': 'Embedded Google Map (1-10 Kitamatsuyama-cho, Seto, Aichi)',
    'KM名古屋ドール株式会社へのアクセス': 'Directions to KM Nagoya Doll Co., Ltd.',
    '全24件': '24 products',
    'ピックアップ商品写真': 'Featured product image',
    '（横長・季節商品を想定）': '(wide format for a seasonal feature)',
    '熟練の職人がレースを一枚ずつ泥漿にくぐらせて焼き上げた、当窯を代表する一体。贈り物にも選ばれています。': 'A signature piece from our studio, made by skilled artisans who dip every piece of lace in porcelain slip before firing. A thoughtful and distinctive gift.',
    '商品を見る': 'View Product',
    'すべて': 'All',
    'おすすめ順': 'Featured',
    '新着順': 'Newest',
    '価格が安い順': 'Price: Low to High',
    '価格が高い順': 'Price: High to Low',
    '商品写真': 'Product image',
    'レースドール「春の音楽会」': 'Spring Concert Lace Doll',
    '手作り用モールド 小鳥': 'Bird Craft Mold',
    '上絵用絵具セット 12色': '12-Colour Overglaze Paint Set',
    '招き猫 白磁 小': 'Small White Porcelain Lucky Cat',
    '商品メイン写真（正方形・白背景推奨）': 'Main product image (square, white background recommended)',
    'レースドール「白鳥の湖」全体': 'Full view of the Swan Lake Lace Doll',
    '全体': 'Full view',
    'レース部分の寄り': 'Lace detail',
    'お顔の寄り': 'Face detail',
    '背面': 'Back view',
    'サイズ比較': 'Size comparison',
    '送料は全国一律 ¥880（¥15,000以上のご購入で無料）': 'Flat-rate shipping within Japan: ¥880 (free on orders of ¥15,000 or more)',
    '本物の布レースを一枚ずつ泥漿（液状の粘土）にくぐらせ、ドレスに仕立てて1300℃で焼き上げました。炎の中で布は燃え尽き、レースの繊細な編み目だけが白磁となって残ります。': 'Each piece of real fabric lace is dipped in porcelain slip, shaped into a dress, and fired at 1,300°C. The fabric burns away in the kiln, leaving its delicate weave captured in white porcelain.',
    '職人の手仕事による一点ずつの制作のため、レースの表情はすべて異なります。世界にひとつの一体をお届けします。': 'Because every piece is made individually by hand, each lace pattern has its own character. Your doll will be truly one of a kind.',
    'サイズ': 'Size',
    '大（高さ 約24cm）— ¥38,500': 'Large (approx. 24 cm high) — ¥38,500',
    '中（高さ 約18cm）— ¥27,500': 'Medium (approx. 18 cm high) — ¥27,500',
    'カートに入れる': 'Add to Cart',
    'すぐに購入（Shopify動的チェックアウト）': 'Buy Now (Shopify dynamic checkout)',
    '素材・サイズ詳細': 'Materials & Dimensions',
    '磁器（瀬戸焼）／高さ約24cm×幅約18cm／重さ約650g。ひとつずつ手作りのため、寸法・絵付けに個体差があります。': 'Seto porcelain / Approx. 24 cm high x 18 cm wide / Approx. 650 g. As each piece is handmade, dimensions and painted details may vary slightly.',
    '配送について': 'Shipping',
    'ご注文から3営業日以内に発送します。割れ物のため、緩衝材で厳重に梱包してお届けします。': 'Orders ship within three business days. Each fragile piece is carefully protected with cushioning materials.',
    '返品・交換': 'Returns & Exchanges',
    '輸送中の破損は到着後7日以内にご連絡ください。良品と交換いたします。お客様都合による返品は未開封に限り承ります。': 'Please contact us within seven days if your item was damaged in transit. We will arrange a replacement. Returns for other reasons are accepted only if the item is unopened.',
    '工房写真（正方形）': 'Workshop image (square)',
    '職人の手元': 'An artisan at work',
    '瀬戸の窯元が、一点ずつ手仕事で。': 'Handcrafted One by One in Our Seto Studio.',
    'この商品は、昭和26年創業のKM名古屋ドールの職人が、原型づくりから上絵付けまで七つの工程を経て仕上げています。': 'KM Nagoya Doll artisans have made this piece through seven careful stages, from the original sculpting to the final hand-painted details.',
    '私たちのものづくりを見る →': 'Discover Our Craft →',
    '同じカテゴリの商品': 'More from This Collection',
    '陶製レース人形をすべて見る →': 'View All Porcelain Lace Dolls →',
    'レースドール「読書する少女」': 'Reading Girl Lace Doll',
    'レースドール「アフタヌーンティー」': 'Afternoon Tea Lace Doll',
    'ミニレースドール 天使': 'Mini Angel Lace Doll',
    '催事': 'Events',
    '「せと陶祖まつり」に出展します': 'We Will Exhibit at the Seto Toso Festival',
    'アロマポット「花透かし」シリーズに新色を追加しました': 'New Colours Added to the Floral Cutwork Aroma Pot Series',
    'ウェブサイトをリニューアルしました': 'Our Website Has Been Renewed',
    'いつもKM名古屋ドールをご愛顧いただき、誠にありがとうございます。': 'Thank you for your continued support of KM Nagoya Doll.',
    'このたび、当社ウェブサイト内にオンラインショップをオープンいたしました。陶製レース人形をはじめ、カントリー雑貨、アロマポット、招福アイテム、手作り用のモールド・資材まで、瀬戸の窯元から直接お届けいたします。': 'We are pleased to announce the opening of our online shop. From porcelain lace dolls and country decor to aroma pots, lucky charms, molds, and craft materials, our pieces are now available directly from our Seto studio.',
    '記事内画像（16:9）': 'Article image (16:9)',
    '実装ではリッチテキストエディタから挿入': 'To be inserted through the rich-text editor',
    '職人がひとつずつ手仕事で仕上げるやきものを、ぜひこの機会にご覧ください。今後も新商品や催事のご案内など、こちらのお知らせでお伝えしてまいります。': 'We invite you to explore porcelain pieces finished one by one by our artisans. We will continue to share new products, events, and other updates here.',
    '引き続きKM名古屋ドールをよろしくお願いいたします。': 'We look forward to welcoming you to KM Nagoya Doll.',
    'お知らせ一覧へ戻る': 'Back to News'
  };

  var textOriginals = new WeakMap();
  var attributeOriginals = new WeakMap();

  function readPreference() {
    try {
      var value = window.localStorage.getItem(STORAGE_KEY);
      return value === 'ja' || value === 'en' ? value : null;
    } catch (error) {
      return null;
    }
  }

  function savePreference(language) {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      // file:// やプライベートモード等で保存不可でも、その場の切替は継続する。
    }
  }

  function browserLanguage() {
    return String(window.navigator.language || 'ja').toLowerCase().indexOf('ja') === 0 ? 'ja' : 'en';
  }

  function translatedText(original, language) {
    if (language === 'ja') return original;
    var trimmed = original.trim();
    if (!trimmed || !translations[trimmed]) return original;
    return original.replace(trimmed, translations[trimmed]);
  }

  function translatePage(language) {
    document.documentElement.lang = language;
    document.documentElement.setAttribute('data-language', language);

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        if (!parent || parent.matches('script, style, noscript')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var node;
    while ((node = walker.nextNode())) {
      if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue);
      node.nodeValue = translatedText(textOriginals.get(node), language);
    }

    document.querySelectorAll('[aria-label], [title]').forEach(function (element) {
      if (!attributeOriginals.has(element)) {
        attributeOriginals.set(element, {
          ariaLabel: element.getAttribute('aria-label'),
          title: element.getAttribute('title')
        });
      }
      var originals = attributeOriginals.get(element);
      if (originals.ariaLabel !== null) {
        element.setAttribute('aria-label', language === 'en' && translations[originals.ariaLabel] ? translations[originals.ariaLabel] : originals.ariaLabel);
      }
      if (originals.title !== null) {
        element.setAttribute('title', language === 'en' && translations[originals.title] ? translations[originals.title] : originals.title);
      }
    });

    if (!document.documentElement.dataset.originalTitle) {
      document.documentElement.dataset.originalTitle = document.title;
    }
    var originalTitle = document.documentElement.dataset.originalTitle;
    document.title = language === 'en' && translations[originalTitle] ? translations[originalTitle] : originalTitle;

    var switcher = document.querySelector('.c-language-switch');
    if (switcher) {
      switcher.setAttribute('aria-label', language === 'ja' ? '言語選択' : 'Language selection');
      switcher.querySelectorAll('[data-language]').forEach(function (button) {
        var active = button.getAttribute('data-language') === language;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        if (button.getAttribute('data-language') === 'ja') {
          button.setAttribute('aria-label', language === 'ja' ? '日本語（選択中）' : 'Switch to Japanese');
        } else {
          button.setAttribute('aria-label', language === 'en' ? 'English (selected)' : '英語に切り替える');
        }
      });
    }
  }

  function createSwitcher() {
    var icons = document.querySelector('.c-header__icons');
    if (!icons || icons.querySelector('.c-language-switch')) return;

    var switcher = document.createElement('div');
    switcher.className = 'c-language-switch';
    switcher.setAttribute('role', 'group');
    switcher.innerHTML = '<button type="button" data-language="ja">JP</button><span aria-hidden="true">/</span><button type="button" data-language="en">EN</button>';
    icons.insertBefore(switcher, icons.firstChild);

    switcher.querySelectorAll('[data-language]').forEach(function (button) {
      button.addEventListener('click', function () {
        var language = button.getAttribute('data-language');
        savePreference(language);
        translatePage(language);
      });
    });
  }

  function initialize() {
    createSwitcher();
    translatePage(readPreference() || browserLanguage());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
