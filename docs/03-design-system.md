# 03. デザインシステム

> **正となる実装は `mockups/assets/tokens.css`。** 本書はその意味と使い方の解説。
> 値を変えるときは tokens.css と本書を必ず同時に更新すること。

## 1. デザインコンセプト

**「白磁とレースの静けさ、窯の温もり」**

- 瀬戸焼の白磁・レース人形の繊細さ → **磁器のような白を基調**にした余白の多い上品なレイアウト
- 千年の瀬戸焼・1951年創業の重み → **明朝体の見出し**と落ち着いた文字組
- 窯・職人の手仕事 → **真鍮色（ゴールドブラウン）のアクセント**で温もりと高級感
- 陶磁器の伝統色 → **青磁色（セラドングリーン）**を購入導線・補助色に使用
- 装飾は最小限。写真（商品・工房）が主役。角丸はほぼ使わない（磁器のシャープさ）

トーン&マナー: 上品 / 静謐 / 誠実 / 温かい。「かわいい」寄りにしない（レース人形は繊細だが、会社は70年の窯元）。

## 2. カラーパレット

| トークン | 値 | 名前 | 用途 |
|---|---|---|---|
| `--c-porcelain` | `#FAF8F4` | 磁器白 | ページ背景 |
| `--c-white` | `#FFFFFF` | 白 | カード・ヘッダー背景 |
| `--c-ink` | `#33302B` | 墨 | 見出し・本文 |
| `--c-ink-soft` | `#6E6759` | 薄墨 | 補足テキスト・キャプション |
| `--c-line` | `#E5DFD4` | 生成りグレー | 罫線・カード枠 |
| `--c-gold` | `#A8875A` | 真鍮 | アクセント（英字ラベル・リンク・バッジ枠・hover） |
| `--c-gold-dark` | `#8A6D43` | 真鍮（濃） | gold の hover |
| `--c-celadon` | `#3E5C52` | 青磁（濃） | **主要CTA（購入ボタン・ショップ導線）** |
| `--c-celadon-dark` | `#2E463E` | 青磁（最濃） | celadon の hover |
| `--c-celadon-light` | `#EAF0ED` | 青磁（淡） | 淡色背景セクション・バッジ地 |
| `--c-danger` | `#A44A3F` | 弁柄 | 「残りわずか」バッジ・エラー |

### 使い分けルール
- **購入・ショップ系のボタンは必ず celadon（塗り）**。全ページで統一し「緑のボタン=買い物」と学習させる
- **gold は面で使わない**（小さなラベル・線・テキストのみ）。多用すると安っぽくなる
- セクション背景は porcelain ⇄ white ⇄ celadon-light の3種を交互に。それ以外の背景色は禁止
- 文字色は ink / ink-soft / white(暗背景上) の3種のみ

### コントラスト（WCAG AA 確認済み）
- ink on porcelain: 12.2:1 / white on celadon: 8.0:1 / ink-soft on white: 4.9:1 — 全て AA 以上
- gold は 18px 未満の本文色に使わない（3.2:1 のため大きい文字・装飾のみ）

## 3. タイポグラフィ

| トークン | フォント | 用途 |
|---|---|---|
| `--font-serif` | "Shippori Mincho", "Yu Mincho", serif | 見出し（h1-h3）・ブランドコピー |
| `--font-sans` | "Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", sans-serif | 本文・UI・ボタン・価格 |
| `--font-en` | "Cormorant Garamond", serif | 英字装飾ラベル（"OUR CRAFT" 等）のみ |

Google Fonts 読込（3書体・ウェイト限定）:
```html
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=Cormorant+Garamond:ital,wght@0,500;1,500&display=swap" rel="stylesheet">
```

### タイプスケール（tokens.css の `--fs-*`）

| トークン | サイズ(PC/SP) | 用途 |
|---|---|---|
| `--fs-hero` | clamp(32px→52px) | ヒーローコピー（serif） |
| `--fs-h2` | clamp(26px→36px) | セクション見出し（serif） |
| `--fs-h3` | clamp(19px→22px) | カード見出し・小見出し（serif） |
| `--fs-lg` | 17px | リード文 |
| `--fs-md` | 15px | 本文（基準） |
| `--fs-sm` | 13px | キャプション・バッジ |
| `--fs-label` | 12px | 英字装飾ラベル（letter-spacing 0.22em） |

- 本文 line-height: 1.9（`--lh-body`）/ 見出し: 1.4（`--lh-heading`）
- 見出しの letter-spacing: 0.06em。**セクション見出しは「英字ラベル(gold) + 明朝見出し」の2段構成**が本サイトの型:

```html
<p class="c-label">OUR CRAFT</p>
<h2 class="c-heading">手仕事の工程</h2>
```

## 4. 余白・レイアウト

| トークン | 値 | 用途 |
|---|---|---|
| `--sp-1〜-10` | 4/8/12/16/24/32/48/64/96/128px | 余白スケール（これ以外の余白px禁止） |
| `--container` | 1160px | コンテンツ最大幅 |
| `--container-narrow` | 800px | 読みもの系の最大幅 |
| `--section-pad` | clamp(64px→112px) | セクション上下パディング |

- グリッド: 商品カード PC 4列 / タブレット 3列 / SP 2列（gap: `--sp-5`）
- カテゴリカード: PC 3列 / SP 2列
- ブレークポイント: `900px`（PC⇄タブレット）, `600px`（⇄SP）の2つのみ

## 5. 形状・エフェクト

| トークン | 値 | 用途 |
|---|---|---|
| `--radius-sm` | 2px | ボタン・入力欄・バッジ |
| `--radius-md` | 4px | カード画像 |
| `--shadow-card` | 0 2px 16px rgba(51,48,43,.07) | カード hover |
| `--transition` | .25s ease | 全インタラクション共通 |

- 角丸は上記2種のみ。**円形・大きい角丸は使わない**
- hover: カードは影+画像を scale(1.04)、ボタンは背景色を dark 系に。派手なアニメーション禁止

## 6. コンポーネント（クラス命名: `c-` = 共通部品, `s-` = セクション固有）

| クラス | 見た目 |
|---|---|
| `.c-btn` | 基本ボタン: padding 14px 36px, radius-sm, font-sans 500, letter-spacing .08em |
| `.c-btn--primary` | celadon 塗り・白文字。**購入/ショップ導線専用** |
| `.c-btn--ghost` | 透明地 + ink 1px 枠。コーポレート導線用（暗背景上は白枠白文字 `.c-btn--ghost-inv`） |
| `.c-label` | 英字装飾ラベル: font-en, fs-label, gold, letter-spacing .22em, uppercase |
| `.c-heading` | セクション見出し: serif, fs-h2 |
| `.c-card` | 商品カード: 白地, line 1px 枠, 画像+名前+価格。価格は sans 500 |
| `.c-badge` | バッジ: fs-sm。`--pickup`(gold枠), `--new`(celadon-light地), `--low`(danger地白字) |
| `.c-textlink` | 文中導線: gold, 下線, hover で gold-dark。「〜を見る →」形式 |
| `.c-icon` | アイコン: Feather風ラインSVG（fill:none, stroke:currentColor, stroke-width:1.5, 21×21px, viewBox 24）。**絵文字・アイコンフォント禁止**。マークアップはモックのヘッダーを正とする |
| `.c-logo` | 会社ロゴ（`mockups/assets/logo.webp` = 王冠マーク+社名、白・透過WebP、609×164）。白ロゴのため `<img>` で直接使わず **CSSマスク**（`mask: url(logo.webp)` + `background: 色トークン`）で着色する。王冠含め形状はそのまま型抜きされる。白背景上=`--c-ink`（デフォルト）、暗背景上=`.c-logo--light`（`--c-porcelain`）。**白ロゴを明るい背景に直接置くこと・ロゴをテキストで組むことは禁止** |

詳細な寸法は `mockups/assets/style.css` を正とする。
