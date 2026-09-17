# OGP / social sharing

- The static build adds sharing metadata to every Japanese and English page, including legacy `.html` redirect pages. Crawlers receive the image URL in the initial HTML.
- Product pages use the Shopify featured image. Article pages use their Shopify cover image when set. All other pages and content without an image use `mockups/assets/ogp-common-20260917.jpg` (1200 × 630 JPEG).
- The common image combines the approved pink porcelain lace doll hero and company logo. Created with built-in ImageGen, then resized and JPEG-encoded for delivery. The on-page hero and original photographs are unchanged.
- Set or update an article cover image in Shopify to override the common image on the next successful build. Images inside the article body are not treated as covers.
- `og:image`, image dimensions where available, alt text and explicit Twitter card tags are included. Language-specific titles and descriptions follow each page; the English home title is `Lace blooms in porcelain | KM Nagoya Doll`.
- Legacy product/article query URLs receive the generic detail-page image. Share the clean individual `/product/<handle>/` or `/news/<handle>/` URL for content-specific metadata.
- GitHub Pages remains `noindex`. Production indexing and switching `SITE_URL` are separate launch work.

## Checks

Run `pnpm test`, `pnpm build`, then `pnpm check:site`. The site check validates every page's sharing image and title, legacy metadata, common image dimensions, language pairs and preview indexing. After deployment, verify the delivered HTML and image URLs. Social platforms may retain older previews in their own caches; HTML/image checks alone do not confirm a refreshed platform preview.
