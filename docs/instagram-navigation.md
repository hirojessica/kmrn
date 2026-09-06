# Instagramへの導線

更新: 2026-09-06

リンク先: https://www.instagram.com/t.k_nagoya_doll/

リニューアルの全9ページにInstagramへのリンクを追加。幅1100px以上では共通ヘッダーにアイコンを表示し、全画面幅でフッターにアイコンとInstagramの表記を置く。スマートフォンではメニュー内にも配置する。

既存のラインアイコンに合わせたSVGを使用し、操作領域は44px以上。新しいタブで開くことを読み上げラベルで伝え、JP/EN切り替えに合わせてラベルを翻訳する。外部の埋め込みウィジェットは使用していない。

編集元は `partials/header.html`、`partials/footer.html`、`partials/menu.html`。変更後は `scripts/sync-chrome.py` で全ページに同期する。スタイルは `mockups/assets/layout-review.css`、読み上げラベルの言語切り替えは `mockups/assets/layout-review.js` に追加した。既存の色・余白・アイコン寸法トークンを利用する。

変更前の公開用原稿とローカルデモは、作業フォルダー隣接の `work/backups/20260906-134106-before-instagram.zip` と `work/backups/20260906-134106-demo-before-instagram.zip` に保存。既存の本番サイト原稿やShopifyテーマは変更していない。

確認: 共通部分の一致・9ページ241参照の検査に合格。デスクトップと393pxの英語メニューを目視確認し、320pxでも横にはみ出さず、Instagramリンクが44px以上の高さを保つことを確認した。
