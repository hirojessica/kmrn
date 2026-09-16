# 商品・記事HTMLと英語URL（2026-09-16）

## 対象と公開範囲

`mockups/` が編集用テンプレート、`site-build/` が公開用の生成物です。
GitHub Pagesは生成物を配信します。旧本番サイトの `E:\project-folder` は変更しません。
日本語は `/`、英語は `/en/`。商品は `/product/<handle>/`、記事は `/news/<handle>/` です。
GitHub Pagesでは先頭に `/kmrn/` が付きます。古い `.html` と `?handle=` のリンクも維持します。

## Shopifyからの反映

- Storefront APIが返す公開済みの商品・お知らせだけを使用。管理用API・注文情報は使用しません。
- GitHubへのpush、Actionsの手動実行、および毎時17分（UTC）の定期実行で全文HTMLを再生成。
- 定期実行はGitHub側の混雑などで遅れる場合があります。すぐ反映する場合はActionsの「Build Shopify content and deploy preview」から「Run workflow」。
- 閲覧時にもAPIで商品・記事を更新。価格・在庫を再確認できるまで購入ボタンは無効。
- API通信失敗時はHTML本文を残し再試行を案内。APIが非公開を確認した場合は本文を非表示にします。
- JavaScriptなしのHTML、検索情報、削除したページの完全撤去は次のビルド成功時に更新されます。
- API障害・言語間の公開商品不一致ではビルドを失敗させ、直前の公開サイトを維持します。
- 新規商品・記事は次回生成まで従来のクエリURL経由で表示できます。
- 下書きの商品は公開されません。Shopify側の公開状態や在庫はこのビルドでは変更しません。
- 英語本文はShopifyの登録済み翻訳を使用。今後の商品・記事にも英語翻訳を登録してください。未翻訳の場合はShopifyの日本語フォールバックが表示されます。

## 検索用データ

言語別のtitle、description、OGP、canonical、相互hreflangをHTMLに含めます。
ShopifyのSEOタイトル・説明が登録済みなら優先し、空欄なら商品名・本文から生成します。
商品はProduct/ProductGroup、記事はBlogPostingのJSON-LDを出力します。
実際の品番・バリエーション・写真を使用し、架空のレビューは追加しません。
販売準備中はOfferを出しません。`storefrontConfig.checkoutEnabled` がtrueになった場合に価格・通貨・在庫のOfferを出力する実装です。
デモは全ページ **noindexのまま**。この状態で検索結果への掲載やリッチリザルトは期待しないでください。

## 本番反映時に別途対応する項目

ユーザー指定により、検索公開は今回実施していません。
本番用SITE_URL、index許可、robots.txt、sitemap、Search Console送信、必要なサーバー301転送は切り替え時に設定します。
本番サーバーにはソースのmockupsではなく、生成したsite-buildの内容を配信します。
GA4、本番チェックアウトの開通も各引き渡し手順に従います。

## 写真・表示速度

写真の構図・工程の順番は維持します。元画像を保管したまま、ローカル写真を幅480〜1920pxのWebPに変換。
Shopifyの写真はCDNのwidth指定とsrcsetで画面に合う解像度を配信します。
ヒーローと商品メイン画像は優先取得、下部写真は遅延読み込み。寸法が判明している写真にはwidth/heightを指定します。
生成時のファイルサイズは `site-build/build-manifest.json` に記録。元写真はmockups/assets内に残っています。

## 開発・確認

Node.js 24、pnpm 11.19.0を使用。

```text
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm check:site
python -m http.server 4181 --bind 127.0.0.1 --directory site-build
```

ビルドはネットワーク接続が必要です。公開用URLは既定で `https://hirojessica.github.io/kmrn/`。
SITE_URLを変えてもnoindexは解除されません。

今回の変更前のソースバックアップ：`C:\Users\Janne\Documents\KMN\outputs\seo-before-20260916\renewal-source.zip`。
以前のGit HEADは同フォルダのHEAD.txtに記録しています。
