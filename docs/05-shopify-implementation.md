# 05. Shopify 実装ガイド

## 1. 基本方針

- **Dawn（最新版）をベースにカスタムテーマを作成**（Online Store 2.0 / JSON テンプレート）
- モックアップ（`mockups/`）の HTML/CSS を Liquid セクションへ移植する
- `tokens.css` はそのまま `assets/tokens.css` として追加し、`theme.liquid` で最初に読み込む
- Dawn 既存の CSS 変数（`--color-*` 等）は settings_data.json のカラー設定を本デザインの値に合わせつつ、**独自コンポーネントは tokens.css の `--c-*` を参照**する
- 開発: Shopify CLI（`shopify theme dev`）+ GitHub 連携

## 2. テンプレート ⇄ セクション対応表

| テンプレート | セクション（新規作成分は★） |
|---|---|
| `templates/index.json` | ★hero-media / ★featured-products / ★about-digest / ★craft-process / ★category-grid / ★news-list / ★fullwidth-cta |
| `templates/page.about.json` | ★page-header / ★brand-statement / ★history-timeline / ★craft-process-full / ★company-table / ★access-map / ★fullwidth-cta |
| `templates/collection.json` | ★page-header / ★collection-banner / main-collection-product-grid（Dawn改修） |
| `templates/product.json` | main-product（Dawn改修）/ ★maker-block / related-products（Dawn） |
| `templates/page.contact.json` | ★page-header / ★contact-cards / contact-form（Dawn改修） |
| `templates/blog.json` | ★page-header / main-blog（Dawn改修: 行リスト形式・タグバッジ） |
| `templates/article.json` | main-article（Dawn改修: container-narrow・戻るボタン） |
| 共通 | header / footer（Dawn を改修し docs/02 の構成に） |

商品カードは `snippets/card-product.liquid` を1つ作り全セクションで共用（デザイン一貫性のため必須）。

### 会社ロゴの実装
支給ロゴ（王冠マーク+社名、白・透過WebP、609×164）はテーマの `assets/logo.webp` に配置し、CSSマスクで着色する（docs/03 §6 の `.c-logo`）。
テーマ設定の image_picker を使う場合は inline style でマスクURLを差し込む:
`style="mask-image: url('{{ settings.logo | image_url: width: 609 }}');"`
ヘッダー=墨、フッター=磁器白。白背景に白ロゴを直接出さないこと。

### 日本語 / 英語対応

- Shopify Marketsで日本語と英語を公開し、テーマ文言は `locales/ja.default.json` と `locales/en.default.json` で管理する
- 商品・コレクション・ページ・ブログ本文はShopify Translate & Adapt等で英訳を登録する
- ヘッダーへDawnのローカリゼーションフォームを利用した `JP / EN` セレクターを配置する
- 手動選択したロケールをShopify標準の仕組みで保持し、未選択の初回のみブラウザ言語を参照する。手動選択後に自動判定で上書きしない
- 静的モックの挙動・英訳は `mockups/assets/language.js` を参照するが、このJavaScript辞書を本番テーマへそのまま持ち込まない

## 3. ヒーローセクション schema（動画/画像 切替）★最重要要件

`sections/hero-media.liquid` の設計:

```liquid
{% comment %} メディア部分のロジック {% endcomment %}
{%- if section.settings.media_type == 'video' and section.settings.video != blank -%}
  {{ section.settings.video | video_tag:
      autoplay: true, loop: true, muted: true, controls: false,
      playsinline: true,
      image_size: '1920x',
      poster: section.settings.fallback_image }}
{%- elsif section.settings.media_type == 'video_url' and section.settings.video_url != blank -%}
  {%- comment -%} 外部URL(YouTube/Vimeo)は使わずMP4直リンク想定。external_video不使用 {%- endcomment -%}
  <video autoplay muted loop playsinline
         poster="{{ section.settings.fallback_image | image_url: width: 1920 }}">
    <source src="{{ section.settings.video_url }}" type="video/mp4">
  </video>
{%- else -%}
  {{ section.settings.image | image_url: width: 2400 | image_tag: loading: 'eager', fetchpriority: 'high' }}
{%- endif -%}
```

```json
{
  "name": "ヒーロー（動画/画像）",
  "settings": [
    { "type": "select", "id": "media_type", "label": "メディアの種類",
      "options": [
        { "value": "image", "label": "画像" },
        { "value": "video", "label": "動画（アップロード）" },
        { "value": "video_url", "label": "動画（MP4のURL）" }
      ], "default": "image" },
    { "type": "video", "id": "video", "label": "動画ファイル" },
    { "type": "url", "id": "video_url", "label": "動画URL（.mp4）" },
    { "type": "image_picker", "id": "image", "label": "画像（画像モード用）" },
    { "type": "image_picker", "id": "fallback_image", "label": "動画ポスター/フォールバック画像（動画時必須）" },
    { "type": "range", "id": "overlay_opacity", "label": "オーバーレイの濃さ",
      "min": 0, "max": 60, "step": 5, "unit": "%", "default": 35 },
    { "type": "inline_richtext", "id": "label", "label": "英字ラベル", "default": "SINCE 1951 — SETO, AICHI" },
    { "type": "inline_richtext", "id": "heading", "label": "見出し", "default": "千年の陶土に、レースを咲かせる。" },
    { "type": "inline_richtext", "id": "subheading", "label": "サブコピー" },
    { "type": "text", "id": "cta1_text", "label": "主ボタン テキスト", "default": "オンラインショップ" },
    { "type": "url",  "id": "cta1_url",  "label": "主ボタン リンク" },
    { "type": "text", "id": "cta2_text", "label": "副ボタン テキスト", "default": "私たちについて" },
    { "type": "url",  "id": "cta2_url",  "label": "副ボタン リンク" }
  ],
  "presets": [{ "name": "ヒーロー（動画/画像）" }]
}
```

実装上の注意:
- `prefers-reduced-motion: reduce` で `video` を `display:none` にし poster 画像側を表示する CSS を必ず入れる
- モバイルでは動画を読み込まない設定（`matchMedia('(max-width:600px)')` で source 差し込み）も検討可。フェーズ1では poster 優先表示のみで可
- オーバーレイは `background: rgb(51 48 43 / {{ overlay_opacity }}%)` の絶対配置レイヤー

## 4. ピックアップ商品セクション schema（要点）

`sections/featured-products.liquid`:

```json
{
  "name": "ピックアップ商品",
  "settings": [
    { "type": "collection", "id": "collection", "label": "表示するコレクション" },
    { "type": "range", "id": "count", "label": "表示数", "min": 2, "max": 8, "step": 1, "default": 4 },
    { "type": "inline_richtext", "id": "heading", "label": "見出し", "default": "おすすめの商品" }
  ]
}
```

- 運用: 管理画面で手動選定コレクション `featured` を作り、売り出したい商品を入れ替えるだけ
- コレクション一覧の最上部バナー `collection-banner` は `{ "type": "product", "id": "product" }` 設定で1点指定

## 5. バッジのタグ駆動ルール

`snippets/card-product.liquid` 内:

| 商品タグ | バッジ表示 | クラス |
|---|---|---|
| `pickup` | PICK UP | `c-badge--pickup` |
| （公開後14日以内、または `new` タグ） | NEW | `c-badge--new` |
| 在庫 ≤ 3（`product.selected_or_first_available_variant.inventory_quantity`） | 残りわずか | `c-badge--low` |

## 6. 初期データ設定チェックリスト

- [ ] コレクション作成: `featured`（手動）+ 6カテゴリ（lace-doll / country-zakka / aroma-pot / shofuku / mold / material）
- [ ] メニュー: メインメニュー（docs/02 §2）とフッターメニュー
- [ ] ページ: about / contact / 特定商取引法 / プライバシーポリシー / 配送・返品
- [ ] ブログ: news
- [ ] 決済・配送・税設定（日本、税込表示: 管理画面「税を商品価格に含める」ON）
- [ ] `settings_data.json`: フォント設定は使わず theme.liquid で Google Fonts 読込（tokens.css 前提のため）

## 7. 品質基準

- Lighthouse: Performance 80+ / Accessibility 95+（ヒーロー動画は poster + 遅延で対策）
- 全ボタン・リンクにフォーカスリング（tokens.css の `--focus-ring` 使用）
- 画像は `image_url` + `srcset`（Dawn の `image_tag` ヘルパー準拠）、商品画像 alt 必須
- 日本語コンテンツの `lang="ja"`、価格は `{{ price | money_with_currency }}` ではなく `money` + 「税込」表記
