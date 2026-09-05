# ローカルデモのGitHub Pages反映（2026-09-05）

ユーザーが確認中のデモをGitHub Pagesにも反映するよう依頼したため、旧公開版を保存したうえで、デモと同じHTML・CSS・JavaScript・画像を公開対象へコピーしました。

## 反映先

- リポジトリ: https://github.com/hirojessica/kmrn
- ブランチ: main
- 公開URL: https://hirojessica.github.io/kmrn/
- 公開対象: mockups/
- ワークフロー: .github/workflows/pages.yml
- ローカルのデモ: work/kmn-layout-review（HTTP 4180）

## 今回の内容

トップのヒーローとレース接写に生成済み素材を使用し、写真と背景の境界を透過でなじませています。画像のバイナリとCSSはローカルデモのままです。フォントは本文とナビをNoto Sans JP、主要見出しをShippori Minchoに統一しました。トップ・商品一覧・商品詳細は共通のヘッダーとフッターです。

トップの新商品欄と商品一覧・詳細はShopify Storefront API 2026-04を読み込みます。Headlessストアフロント369620の公開用トークンを使用し、権限は商品・バリエーション・コレクションの読み取りだけです。非公開トークンやAdmin APIトークンは公開ファイルに含めません。

商品は未登録です。APIが正常に0件を返した場合は販売準備中、通信・権限エラーの場合は再試行と明示した配置サンプルを表示します。デモでは購入を無効にしています。商品登録後はHeadlessと対象マーケットで公開する必要があります。

会社案内・お知らせの本文は従来のプレビューを維持しています。工房写真は差し替え枠、製法などの本文は仮原稿です。noindexを維持しています。Shopifyテーマの公開や本番ドメインの切り替えは、このPages更新に含みません。

## バックアップと復元

- 直前の公開コミット: `891a63e29d9e243a76f87a8908f3d07664d899d6`
- Gitタグ: `backup/pages-before-demo-20260905-180843`
- 旧デザイン基準: `2237613a6dd93270c0977649177bd94a6fe7571f`
- ZIP: `work/backups/20260905-180843-pages-before-demo.zip`
- Git bundle: `work/backups/20260905-180843-pages-before-demo.bundle`

旧版へ戻す場合は、作業ツリーを確認してから以下を実行し、新しい復元コミットとしてmainへ反映します。履歴の強制書き換えは不要です。

```shell
git restore --source=backup/pages-before-demo-20260905-180843 --staged --worktree -- mockups
git commit -m "Restore Pages preview before demo update"
git push origin main
```

## 検証と保守

公開ファイルはローカルデモとのSHA256一致で確認しています。NodeのAPIテスト8件、ローカルブラウザーのUIテスト12件が通過済みです。実APIの日本語・英語問い合わせはHTTP200・商品0件を確認済みです。商品がないため、実商品を使った詳細表示・注文・決済の検証は未実施です。

公開後は、このコミットに対応するPagesワークフロー成功と、公開URLのホーム・商品一覧・モバイル表示・商品API応答を確認します。ローカルの詳細検証記録はGit管理外の `qa/` に保存します。

共通部分は `partials/` を編集して `python scripts/sync-chrome.py` で反映します。APIテストは `node --test tests/storefront-api.test.mjs` です。比較画像、作業用スクリプト、バックアップ、ブラウザー検証用HTMLは公開対象にコピーしていません。
