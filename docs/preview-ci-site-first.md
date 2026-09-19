# GitHub Pages: Shopify契約待ち期間のビルド

2026-09-20、毎時実行の「Build Shopify content and deploy preview」が失敗していたため、プレビューも本番サイトと同じ先行公開方式に変更しました。

## 原因

- 失敗した実行: https://github.com/hirojessica/kmrn/actions/runs/35459742664
- 依存関係のインストール・テストは成功。Shopifyから公開商品・記事を取得するビルド工程で失敗。
- Storefront APIでHTTP 402、`PAYMENT_REQUIRED / Unavailable Shop` を再現。クライアントによるプラン契約待ちのストアを毎時参照していました。
- Heteml本番は保存済みの原稿・画像を使う方式で公開済みでしたが、GitHub ActionsはShopify取得のまま残っていました。

## 修正

- `.github/workflows/pages.yml` で `SITE_MODE=site-first` を指定。保存済みの日英原稿とローカル画像を使用します。
- オンラインショップは準備中、ギャラリーは18件、お知らせは0件。既存のページ送り・カテゴリ・言語切り替えを維持します。
- 毎時実行を停止。mainへのpushと手動実行は継続します。
- PagesのURLは `https://hirojessica.github.io/kmrn/`、検索設定は `noindex` のままです。
- GitHub ActionsからHeteml本番へのアップロードは行いません。

## 検証・再開条件

通常のテストに加え、保存済みギャラリーの画像・翻訳と、外部通信なしで動作する配信用APIを検証します。生成後の `check:site` は18ページ、ローカル参照、日英リンク、検索・OGP設定、準備中表示を検査します。

Shopify契約・移管が完了したらAPI取得、商品情報、在庫、決済、配送・税・販売ポリシー、購入計測を確認してからShopifyモードへ戻します。更新の運用に応じて定期実行も再開します。API障害時に黙って商品を削除するフォールバックは使用しません。
