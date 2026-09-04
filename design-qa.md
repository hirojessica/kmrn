# Design QA — 2026-09-05

Scope: redesigned static home, gallery, shop entrance and shared navigation; Shopify theme source validation and uploaded draft-theme smoke checks.

## Visual truth and evidence

- Source: C:/Users/Janne/.codex/generated_images/01a06df8-53b9-7f10-be45-60524888908f/exec-b3446c43-e2f0-4e36-98bc-ab2e94bd5b65.png (941 × 1672).
- Approved changes to the concept: real company photographs instead of the generated doll, shop/new-arrival CTAs, shorter hero and new arrivals immediately below it.
- Browser implementation: http://127.0.0.1:4178/.
- Comparison: qa/comparison.png and qa/desktop-941-final-full.png. The latter uses a 941 × 852 CSS-pixel iframe. A normal Windows scrollbar leaves 926 CSS pixels for content. Reference cropped to the visible hero region; no claim of pixel-identical photography.
- Desktop: qa/home-desktop-final.png (1440 × 1000 CSS viewport; browser capture 1425 × 990 pixels due to browser capture scaling/scrollbars).
- Mobile: qa/mobile-harness-final.png and qa/responsive-320-full.png. Authored iframe viewports 393 × 852 and 320 × 852; HTML client/scroll widths both 378 and 305 respectively. Browser viewport capability did not reliably resize the intended tab, so the iframe viewport was independently verified.
- Detail: rendered lace detail section reviewed directly in Chrome; qa/new-arrivals-final.png records product cards.
- State: Japanese, menus closed, initial landing and selected section scroll positions. English and modal states separately exercised.

## Findings and iterations

1. P2 mobile heading broke midway through “レース”. Preserved the explicit two-line break. Rechecked at 393 and 320 pixels: words remain intact.
2. P2 body copy ended with an orphan at the intermediate desktop width. Shortened it to “繊細な陶のレースを、暮らしへ。” and captured the 941-pixel view again.
3. P2 landscape group photographs lost the outer figurines inside portrait cards. Changed product cards to contain the entire photograph. The new-arrival capture confirms all pieces are visible.
4. Reduced mobile CTA gaps and preserved a 44-pixel minimum target. Menu opens, traps keyboard focus, makes background inert, closes with Escape and restores focus.

## Required fidelity surfaces

- Typography: existing Shippori Mincho / Zen Kaku Gothic New / Cormorant Garamond; restrained weights and large two-line serif headline. Source proportions adapted to a shorter commerce-oriented hero.
- Spacing/layout: balanced copy/photo columns, early shopping CTAs, four product columns on desktop and two on mobile, two-column mobile footer links. No measured horizontal overflow at 320, 393, 941 or 1440 widths.
- Colors/tokens: porcelain, ink, celadon and brass use shared tokens. Small labels use the darker brass for contrast. No generated icon or logo approximation.
- Images: byte-identical photographs from the client's current-site assets; native company logo mask; official Dawn SVG assets. Actual workshop background is an intentional source-photo difference from the generated studio backdrop.
- Copy: removed invented prices and sales status from the new preview flow; the illustrated products are clearly described as works while the store has no products.

## Functional checks

- Home → new arrivals anchor and home → gallery links verified in the rendered browser.
- Mobile drawer open / close / Escape / focus return verified.
- Gallery filter: all six works, lace one work, craft two works.
- Photo opens in native dialog; Escape and close control work.
- JP → EN has no Japanese text remaining in the home’s visible body. Gallery headings and controls translate, and the selected language persists across navigation.
- Browser console: no errors captured for the local home tab.
- Static parser: seven pages; zero missing local targets / anchors / noindex declarations.
- Shopify official Theme Check: zero errors, 14 warnings (Dawn/source warnings and remote-font advisories). Product/cart remain Dawn’s maintained flows.

## Limits / follow-up

- Shopify theme 190615552282 is installed as a draft. Its gallery block fields were inspected; the temporary empty block was undone. Selecting a new image, uploading it, and saving a gallery entry end to end remain untested.
- No real product data exists yet, so product purchase, inventory and checkout were not transaction-tested.
- Existing lower corporate/news content retains earlier preview material. This pass changes shared navigation, home, gallery and shop entrance.
- P3: dedicated studio photographs and uniform product-photo framing will bring the hero closer to the original generated concept.

final result: passed

This result applies to the static preview and the specific draft-theme checks below; it does not certify production commerce.

## Uploaded theme and Pages verification

- GitHub Pages deployment for cafcf9f succeeded (Actions run 33923506136); the public homepage displays the new hero and works gallery.
- Shopify theme ID 190615552282 appears under draft themes; Rise remains the current theme.
- After explicit user approval, Japanese was saved as the store default and verified in the rendered storefront.
- Desktop Japanese: qa/shopify-desktop-ja.png; Shopify editor mobile preview: qa/shopify-mobile-ja.png. The mobile menu opens and closes.
- Shopify gallery photo dialog opens and closes with Escape. All 24 custom-section image elements on the homepage loaded; no broken artwork was found.
- Home shop CTA opens the native Shopify collection with zero products; cart opens the native empty-cart page. No console errors were captured for that preview tab.
- English headline wrapped into four lines under the original Japanese tracking. Added a locale-specific rule using the existing English font and type tokens; saved it to the uploaded theme and verified the rule is present in the Shopify CDN CSS.
- English correction verified in the matching static CSS at desktop and 320px: exactly two heading lines, no horizontal overflow. Evidence: qa/home-desktop-en-final.png and qa/home-mobile-en-final.png. Shopify currently publishes Japanese only; additional language activation remains separate work.
