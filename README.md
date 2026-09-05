## 2026-09-05 現行写真の登録

現行ギャラリーの18枚をShopifyへ登録し、公開ギャラリーへ連携しました。会社案内の制作工程7枚とトップの工房写真も同じ管理項目から取得します。画像全体を枠内に収め、元ファイルは変更していません。写真の差し替え方法とバックアップは [docs/09-content-management.md](docs/09-content-management.md) を参照してください。

## 2026-09-05 コンテンツ管理の追加

お知らせと記事詳細を新デザインへ統一。会社案内も共通ヘッダー・フッターに更新し、ギャラリー・お問い合わせ・送信後ページを追加しました。Shopifyのブログとメタオブジェクトから公開内容を取得します。

操作方法・API権限・お問い合わせの開通状況は [docs/09-content-management.md](docs/09-content-management.md) を参照してください。FormSubmitの初回確認メールを送信し、受信者による有効化完了の回答を受けて、送信ボタンを開通しています。
# 最新デモをGitHub Pagesへ反映 2026-09-05

ユーザーの「Githubページにも反映してほしい」という依頼に基づき、確認中のローカルデモ `work/kmn-layout-review` を公開対象の `mockups/` に反映しました。公開URLは https://hirojessica.github.io/kmrn/ 、デプロイ元は `hirojessica/kmrn` の `main` です。

- ヒーロー・レース接写の生成素材、画像の境界ぼかし、画像枠の比率をそのまま反映。
- 本文・ナビゲーション・JP/ENはNoto Sans JP、大見出しはShippori Mincho。
- トップ・商品一覧・商品詳細のヘッダー／フッター／モバイルメニューを共通化。
- Shopify Headlessの公開用Storefront APIで商品を取得。商品閲覧権限のみ。商品0件は販売準備中、購入操作は無効。
- 会社案内・お知らせ本文は従来のプレビュー。工房写真・商品情報・本文の正式確認は今後の作業です。
- 旧公開版は `backup/pages-before-demo-20260905-180843`（891a63e）とローカルZIP・Git bundleで保存。

最新の仕様・復元方法は [docs/08-approved-demo-pages.md](docs/08-approved-demo-pages.md)、作業状況は [HANDOFF.md](HANDOFF.md) を参照してください。共通ヘッダーは `partials/` を編集し、`python scripts/sync-chrome.py` で3ページへ反映します。

以下は初期企画と以前の実装記録です。旧版復元時の公開停止方針は今回の明示的な反映依頼で更新されました。下記の動画・フォント・Shopifyテーマ実装方針より、上記の最新仕様と `mockups/` が優先です。

最新仕様は [docs/06-gallery-preview.md](docs/06-gallery-preview.md)。静的プレビューは `mockups/`、Shopify用テーマは `theme/` です。

# KM名古屋ドール株式会社 コーポレート×EC サイトリニューアル

Shopify を基盤とした「コーポレートサイト + ECサイト」統合リニューアルプロジェクト。

- 現行サイト: https://km-nagoya-doll.com/
- 構築基盤: Shopify (Online Store 2.0 / JSON テンプレート / Dawn ベースのカスタムテーマ)
- デザイン・企画・設計: Claude (Fable 5)
- コーディング: Fable 5 → **Codex / Composer 2.5 に引き継ぎ可能な構成**

---

## ⚠️ AI引き継ぎ時の必読ルール（Codex / Composer 2.5 向け）

このプロジェクトは複数の AI コーディングエージェントを跨いで開発される。
**デザインの一貫性が最優先事項**。以下を必ず守ること。

1. **色・フォント・余白・角丸・影は必ず `mockups/assets/tokens.css` の CSS変数を使う。**
   ハードコードした色コード・px値の直書きは禁止。新しい値が必要な場合はまず tokens.css に変数を追加する。
2. **デザインの正解は `mockups/` 内の HTML モックアップ。**
   実装で迷ったらモックアップの見た目・構造・CSSに合わせる。ドキュメントとモックが食い違う場合はモックが正。
3. **現在の進捗・確定済みの設計判断・TODO は [HANDOFF.md](HANDOFF.md) を参照。**
4. **ドキュメントの読み順:**
   1. `docs/01-project-brief.md` — 企画・要件
   2. `docs/02-site-structure.md` — サイトマップ・導線設計
   3. `docs/03-design-system.md` — デザインシステム（トークンの意味と使い方）
   4. `docs/04-page-specs.md` — ページ別レイアウト仕様
   5. `docs/05-shopify-implementation.md` — Shopify テーマ実装ガイド（セクション設計・schema）
5. **勝手にデザインを「改善」しない。** 変更が必要な場合は tokens.css とモックアップと該当ドキュメントを同時に更新し、整合を保つ。
6. コーディング規約: セクション単位のコンポーネント設計、BEM 風クラス命名（`.c-`, `.s-` プレフィックス。tokens.css 冒頭のコメント参照）。

---

## ディレクトリ構成

```
E:\KMNAGOYAEC\
├── README.md                      ← このファイル（引き継ぎの起点）
├── HANDOFF.md                     進捗・確定済み設計判断・TODO（引き継ぎ時は必読）
├── docs\
│   ├── 01-project-brief.md        企画書（目的・ターゲット・要件）
│   ├── 02-site-structure.md       サイトマップ・IA・導線設計
│   ├── 03-design-system.md        デザインシステム定義
│   ├── 04-page-specs.md           ページ別仕様
│   └── 05-shopify-implementation.md  Shopify 実装ガイド
├── mockups\                       ← デザインの正（ブラウザで直接開ける静的HTML）
│   ├── assets\
│   │   ├── tokens.css             デザイントークン（唯一の色・タイポ・余白定義）
│   │   ├── style.css              共通コンポーネント + ページスタイル
│   │   ├── drawer.js              モバイルドロワーメニュー開閉
│   │   ├── language.js            JP/EN切替・ブラウザ言語判定・英訳辞書
│   │   └── logo.webp              会社ロゴ（白・透過。CSSマスクで着色）
│   ├── index.html                 トップページ（コーポレート + EC導線）
│   ├── about.html                 会社案内（沿革・製造工程・会社概要）
│   ├── collection.html            オンラインショップ（商品一覧）
│   ├── product.html               商品詳細
│   ├── news.html                  お知らせ一覧（Shopifyブログ機能で実装）
│   └── news-article.html          お知らせ記事
└── theme\                         （実装フェーズで作成する Shopify テーマ）
```

## モックアップの確認方法

`mockups/index.html` をブラウザで開くだけ（ビルド不要・依存なし）。
Google Fonts（Shippori Mincho / Zen Kaku Gothic New）のみ CDN 読み込み。

## 実装フェーズの進め方（概要）

1. Shopify ストア開設、Dawn をベースにテーマ複製
2. `docs/05-shopify-implementation.md` のセクション一覧に従い、モックアップの HTML/CSS を Liquid セクション化
3. tokens.css の変数は `snippets/design-tokens.liquid` または `assets/tokens.css` としてそのまま移植
4. ヒーローは「動画 / 画像」を管理画面から切替可能な schema で実装（05 に schema 定義済み）

詳細は各ドキュメント参照。
