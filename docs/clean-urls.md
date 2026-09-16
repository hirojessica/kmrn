# 拡張子を表示しないURL（2026-09-16）

公開ページの編集先は `mockups/index.html` と `mockups/<ページ名>/index.html` です。
GitHub Pagesへのアップロード対象は従来どおり `mockups/` 全体です。ビルドは不要です。

| ページ | 新しいURL（サイトルートからの相対パス） |
| --- | --- |
| トップ | `./` |
| 会社案内 | `about/` |
| 商品一覧 | `collection/` |
| 商品詳細 | `product/?handle=商品ハンドル` |
| お知らせ一覧 | `news/` |
| お知らせ記事 | `news-article/?handle=記事ハンドル` |
| ギャラリー | `gallery/` |
| お問い合わせ | `contact/` |
| お問い合わせ完了 | `contact-thanks/` |

- 元の `about.html` などは互換用の移動ページです。内容を編集する場所ではありません。
- `assets/clean-url.js` が旧URLから新URLに移動し、商品ハンドル・カテゴリ・ページ番号・アンカーを引き継ぎます。`index.html` を直接開いた場合も末尾 `/` に統一します。
- GitHub Pagesにサーバー側のリダイレクト設定を追加できないため、互換用の移動にはJavaScriptを使用します。無効時は移動リンクを表示します。新URLは実ファイルで配信され、再読み込み・直接アクセスでも404になりません。
- JS生成リンクとフォームの完了URLは `assets/site-url.js` を使用。GitHub Pagesの `/kmrn/` と本番ドメイン直下、localhostに対応しています。
- `partials/` のリンクはサイトルートからの相対パスです。`python scripts/sync-chrome.py` は子ページ用に1階層分を調整します。
- `node --test tests/*.test.mjs` で旧URLの引き継ぎ、リンクと画像・CSS・JSの参照、購入制御、API処理、ギャラリー処理、GA4の対象ドメインを確認します。

変更前のGitコミットは `f720c7747e92849653b46a2bbaea314fb9901b60`。別途、変更対象の原本をローカルの `outputs/clean-urls-20260916/` に退避済みです。
