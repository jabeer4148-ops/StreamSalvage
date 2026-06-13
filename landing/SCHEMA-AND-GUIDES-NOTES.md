# Schema & guide pages — what changed and how to ship it

Date: June 13, 2026

## 1. JSON-LD schema

### Homepage (`landing/index.html`) — already had schema, now corrected
The page already shipped with `SoftwareApplication` and `FAQPage` JSON-LD (my earlier audit said "no schema" — that was a false negative, because JSON-LD doesn't appear in a text-only crawl). One fix was applied:

- **Removed the `aggregateRating` block (4.8 / 12 ratings).** Google's structured-data policy requires that rating markup reflect *genuine reviews that are visible on the same page*. A self-assigned rating with no on-page reviews is a common trigger for a "spammy structured markup" manual action and can get all your rich results suppressed. Put it back only once you have real reviews displayed on the page — then mark them up with individual `Review` items plus an `aggregateRating` computed from them.

Everything else on the homepage schema (offer, price, OS, author) is fine and was kept.

### New guide pages — each carries three schema types
Every guide includes, inline in `<head>`:

- `TechArticle` — headline, author, publisher, published/modified dates, `mainEntityOfPage`
- `BreadcrumbList` — Home › Guides › {page}
- `FAQPage` — 4 Q&As matching the visible FAQ on the page (required: the questions must stay visible in the page body, which they are)

The `/guides/` hub uses `CollectionPage` listing the three articles.

## 2. New pages created

```
landing/guides/index.html                         → /guides/
landing/guides/fix-corrupted-obs-recording.html   → pillar guide
landing/guides/untrunc-alternative.html           → comparison page
landing/guides/repair-mp4-without-uploading.html  → privacy/no-upload page
```

All match the homepage design system (same color tokens, type scale, table/FAQ styling) and each links to the homepage `/#download`, the `/guides/` hub, and the other two guides for internal-link equity.

## 3. Other edits
- `landing/index.html`: added `id="download"` to the hero CTA (so `/#download` resolves), added a **Guides** link to the footer nav.
- `landing/sitemap.xml`: added all four new URLs; bumped homepage `lastmod` to 2026-06-13.

## 4. Deployment detail — make clean URLs resolve (important)
The canonical tags and internal links use trailing-slash directory URLs (e.g. `/guides/fix-corrupted-obs-recording/`), but the files are named `*.html`. Make the served URL match the canonical, or the canonical points at a 404.

This site appears to deploy on Vercel (`landing/.vercel` exists). Add a `vercel.json` at the deploy root:

```json
{
  "cleanUrls": true,
  "trailingSlash": true
}
```

`cleanUrls` strips `.html`; `trailingSlash` makes `/guides/foo` serve as `/guides/foo/`, matching the canonicals. Verify after deploy that `https://streamsalvage.com/guides/fix-corrupted-obs-recording/` returns 200.

(Alternative if you don't want config: rename each file to its own folder `index.html`, e.g. `guides/fix-corrupted-obs-recording/index.html`.)

## 5. After deploy
- Submit the updated sitemap in Google Search Console and request indexing for the three guides.
- Validate each page in the Rich Results Test (search.google.com/test/rich-results) — expect FAQ and Breadcrumb to be eligible.
