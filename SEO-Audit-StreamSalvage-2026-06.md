# SEO Audit — StreamSalvage (streamsalvage.com)

**Audit type:** Full site audit
**Date:** June 13, 2026
**Prepared for:** jabeer

---

## A note on data sources

Ahrefs is connected but the account's plan only permits the **free Domain Rating endpoint**. Site Explorer (organic keywords, backlinks, top pages, competitors) and Keywords Explorer (search volumes, difficulty) both returned `Insufficient plan` and could not be queried. The one verified Ahrefs metric is **Domain Rating = 0**.

Everything else below is built from a live crawl of the site (homepage, robots.txt, sitemap.xml) and web research into the MP4-repair / OBS-recovery search landscape. Search volumes and difficulty scores are therefore **directional estimates**, not tool-precise figures. To replace them with exact numbers, upgrade the Ahrefs plan to one that includes Keywords Explorer and Site Explorer, and re-run this audit.

---

## Executive summary

StreamSalvage is a **brand-new, single-page site** (Domain Rating 0, no backlink authority, one indexable URL) with a genuinely strong product story and clean on-page basics. The page targets a sharp, high-intent niche — streamers whose OBS recording crashed into an unplayable MP4 — and it does the fundamentals right: keyword-rich title, social tags, a valid robots.txt and sitemap, HTTPS, and a mobile viewport.

The problem is reach, not polish. The three biggest constraints are: (1) **a single page can't rank for the dozens of long-tail queries that streamers actually type** — there's no blog, no guide content, no internal linking; (2) **the FAQ section isn't marked up with schema**, leaving free rich-result real estate on the table; and (3) **zero backlinks**, so even well-optimized content has no authority behind it. The dominant SERP players (Wondershare, Stellar, EaseUS, Tenorshare, plus the OBS forums) have DR in the 70–90 range and own the broad terms.

**Overall assessment: strong foundation, needs work.** The opportunity is real because incumbents write *generic* "fix corrupted MP4" content and don't speak to OBS streamers specifically. The top three priorities: **add FAQ + SoftwareApplication schema** (quick win), **build a small cluster of OBS-specific repair guides** (the growth engine), and **start earning links** from the exact communities already discussing this problem.

---

## Keyword opportunity table

Volumes/difficulty are directional estimates (US) from web research; confirm with Keywords Explorer once the plan allows. Opportunity score weighs intent and relevance to a $29 OBS-repair tool against the difficulty of generalist incumbents.

| Keyword | Est. difficulty | Opportunity | Current ranking | Intent | Recommended content type |
|---|---|---|---|---|---|
| obs recording corrupted | Moderate | High | Not ranking | Informational/commercial | Pillar guide |
| how to fix corrupted obs recording | Moderate | High | Not ranking | Informational | Step-by-step guide |
| obs crashed mp4 wont play | Low–Moderate | High | Not ranking | Informational | Guide + tool CTA |
| repair mp4 without uploading | Low–Moderate | High | Not ranking | Commercial | Comparison/landing page |
| fix mp4 no moov atom | Moderate | High | Not ranking | Informational | Technical explainer |
| moov atom not found | Hard | Medium | Not ranking | Informational | Deep explainer |
| untrunc alternative gui | Low | High | Not ranking | Commercial | Comparison page |
| untrunc how to use | Low | Medium | Not ranking | Informational | Tutorial |
| recover unfinished obs recording | Low | High | Not ranking | Informational | Guide |
| obs mp4 vs mkv recording | Moderate | Medium | Not ranking | Informational | Explainer (prevention) |
| how to remux mkv to mp4 obs | Moderate | Medium | Not ranking | Informational | Tutorial |
| repair corrupted mp4 free | Hard | Medium | Not ranking | Commercial | Comparison page |
| video repair software no upload | Low–Moderate | High | Not ranking | Commercial | Landing page |
| fix corrupted screen recording | Moderate | Medium | Not ranking | Informational | Guide |
| obs recording 0kb / 0 bytes | Low | Medium | Not ranking | Informational | Troubleshooting guide |
| repair large mp4 file | Moderate | Medium | Not ranking | Commercial | Feature page |
| how to fix unplayable mp4 | Moderate | Medium | Not ranking | Informational | Guide |
| wondershare repairit alternative | Moderate | High | Not ranking | Commercial | Comparison page |
| stellar repair for video alternative | Moderate | Medium | Not ranking | Commercial | Comparison page |
| corrupted gameplay recording fix | Low–Moderate | Medium | Not ranking | Informational | Guide |
| repair mp4 after pc crash | Low–Moderate | High | Not ranking | Informational/commercial | Guide |
| obs replay buffer corrupted | Low | Medium | Not ranking | Informational | Troubleshooting guide |

**Pattern:** the realistic wins are OBS-specific, "no-upload/private," and "untrunc alternative" long-tails — terms the big generalist tools under-serve. Broad heads like "repair corrupted mp4" and "moov atom not found" are owned by DR 70–90 sites and should be treated as long-term, not near-term, targets.

---

## On-page SEO audit

Findings from the live homepage crawl.

| Page | Issue | Severity | Recommended fix |
|---|---|---|---|
| Homepage | FAQ content present but **no FAQPage schema** | High | Add FAQPage JSON-LD covering the 5 existing Q&As to compete for rich results |
| Homepage | **No SoftwareApplication/Product schema** (price, OS, offer) | High | Add SoftwareApplication JSON-LD with `offers` ($29), `operatingSystem` Windows, ratings if available |
| Site-wide | **Only one indexable page** — no content to rank for long-tail | High | Build a blog/guides section (see content gaps) |
| Site-wide | **No internal linking structure** (single page, only external + anchor links) | High | Created guide pages should interlink and link back to the homepage with descriptive anchors |
| Homepage | Meta description ~175 chars — **exceeds ~160 and will truncate** in SERPs | Medium | Trim to ≤160 chars, keep "OBS," "repair," "local/private," and "$29" |
| Homepage | **www and non-www both return 200**; canonical points to non-www but no 301 redirect observed | Medium | Add a 301 from www → non-www (or pick one host) to consolidate signals |
| Homepage | H1 "Recovered your OBS crash recording in minutes" is benefit-led but **omits the core term "corrupted MP4"** | Medium | Consider "Recover your corrupted OBS MP4 recording in minutes" |
| Homepage | H2s ("The moment nobody wants…", "What makes it different") are creative but **carry no keywords** | Medium | Add at least one keyword-bearing H2 (e.g. "How to fix a corrupted OBS MP4 recording") |
| Homepage | Image alt text **could not be verified** from the crawl | Medium | Confirm every screenshot/UI image has descriptive alt text (e.g. "StreamSalvage repairing a corrupted OBS MP4") |
| Homepage | Obsolete `meta keywords` tag present | Low | Harmless but ignored by Google; can remove |
| Homepage | Thin content (~400–500 words) for any informational query | Low (for a landing page) / High (for ranking) | Expand via supporting guide pages rather than bloating the landing page |

**What's already good:** title tag (~58 chars, keyword-forward), Open Graph + Twitter card tags, `google-site-verification` (Search Console is set up), HTTPS, mobile viewport, valid robots.txt, and a working sitemap.xml. The fundamentals are clean — this is an unusually well-built v1 landing page.

---

## Content gap analysis

The site has **no content beyond the landing page**, while the entire competitor set (Wondershare, EaseUS, Tenorshare, Magic Leopard) and the OBS forums rank by publishing problem-specific articles. This is the single largest growth lever.

**1. "Fix corrupted OBS recording" pillar guide** — *High priority, substantial effort.*
Why it matters: this is the core high-intent query and StreamSalvage is purpose-built for exactly it, yet there's no rankable page. Format: a comprehensive guide (1,500+ words) covering symptoms, the moov-atom cause, the reference-clip method, and StreamSalvage as the productized solution. This becomes the hub the rest of the cluster links to.

**2. "untrunc alternative / GUI" comparison page** — *High priority, moderate effort.*
Why it matters: untrunc is the free, CLI-based tool that does the same reference-based repair StreamSalvage productizes. People actively search for an easier version. StreamSalvage's "no command line" positioning is tailor-made to win this term, and almost no one is targeting it.

**3. "Repair MP4 without uploading / private video repair" landing page** — *High priority, moderate effort.*
Why it matters: privacy/local-only is StreamSalvage's sharpest differentiator versus upload-based incumbents. A dedicated page captures privacy-motivated searchers the big tools can't credibly serve.

**4. Competitor comparison pages** ("StreamSalvage vs Wondershare Repairit," "…vs Stellar Repair for Video") — *Medium priority, moderate effort.*
Why it matters: bottom-funnel, high-commercial-intent. Buyers comparing $29 one-time against $50–$100 tools are close to converting; price and privacy are strong angles.

**5. Prevention guides** ("OBS: record to MKV and remux," "fragmented MP4 settings to survive crashes") — *Medium priority, moderate effort.*
Why it matters: high-volume informational queries that build topical authority and trust, even though they're not directly transactional. Aligns with what the OBS forums already rank for.

**6. Troubleshooting long-tails** ("OBS 0KB recording," "replay buffer corrupted," "repair MP4 after PC crash") — *Medium priority, quick wins each.*
Why it matters: low-competition, low-effort posts that each capture a slice of frustrated, ready-to-act searchers and funnel them to the tool.

**Funnel coverage today:** decision stage only (the landing page). Awareness and consideration stages are entirely empty — that's where the cluster above pays off.

---

## Technical SEO checklist

| Check | Status | Details |
|---|---|---|
| HTTPS | Pass | Served securely over HTTPS |
| Mobile viewport | Pass | `width=device-width, initial-scale=1` present |
| robots.txt | Pass | Exists, `Allow: /`, references sitemap |
| XML sitemap | Pass | Present at /sitemap.xml and declared in robots.txt |
| Title tag | Pass | Unique, ~58 chars, includes primary keyword |
| Canonical tag | Warning | Points to non-www, but www also returns 200 with no 301 — add redirect |
| Meta description | Warning | Present but ~175 chars (will truncate); trim to ≤160 |
| Structured data (FAQ) | Fail | FAQ content exists but no FAQPage schema |
| Structured data (Product/SoftwareApplication) | Fail | No schema for the app, price, or OS |
| Search Console verification | Pass | `google-site-verification` meta tag present |
| Open Graph / Twitter cards | Pass | Complete OG + summary Twitter card |
| Internal linking | Fail | No internal pages to link (single-page site) |
| Image alt text | Warning | Could not verify from crawl — confirm manually |
| Indexable content depth | Warning | One thin page; insufficient for informational ranking |
| Core Web Vitals | Not assessed | Static landing page is likely fast; verify in Search Console / PageSpeed Insights |

---

## Competitor SEO comparison

Direct functional competitor: **untrunc / untrunc-gui** (free, open-source, CLI, reference-based — the exact method StreamSalvage productizes). Commercial competitors: **Wondershare Repairit** ($27.99/mo–$69.99 perpetual), **Stellar Repair for Video** ($49.99–$99.99), plus **EaseUS** and **Tenorshare 4DDiG**. Content competitor for OBS-specific terms: the **OBS Project forums** (very high authority on the niche).

| Dimension | StreamSalvage | Wondershare Repairit | Stellar Repair for Video | untrunc (OSS) |
|---|---|---|---|---|
| Domain authority | DR 0 (new) | Very high (DR ~80–90 est.) | Very high (DR ~70–85 est.) | Low (GitHub-hosted) |
| Content depth | 1 page | Large blog + tool pages | Large blog + tool pages | README only |
| Publishing frequency | None yet | High | High | Minimal |
| Backlink signals | None | Strong | Strong | Moderate (dev links) |
| Technical SEO | Clean basics, no schema | Mature, full schema | Mature, full schema | Minimal |
| SERP features owned | None | Snippets, FAQ, AI overviews | Snippets, FAQ | None |
| Pricing model | **$29 one-time** | $28/mo or $70 once | $50–$100 once | Free |
| Privacy / local-only | **Yes — 100% local** | Upload/cloud options | Desktop, varies | Yes (local) |
| OBS-specific focus | **Yes** | Generic | Generic | Incidental |

**Where StreamSalvage can win:** the incumbents are generalist and expensive; untrunc is free but command-line and intimidating. StreamSalvage sits in the gap — **OBS-specific, private/local, dollar-cheap, and friendly**. SEO can't beat DR 80 sites on head terms, but it can own the OBS-streamer long-tail and "untrunc alternative" / "no-upload repair" angles those players ignore.

**Where they win:** authority, content volume, and SERP-feature ownership — all a function of time and links, which is exactly the gap to start closing now.

---

## Prioritized action plan

### Quick wins (do this week)

**1. Add FAQPage schema** — *Impact: high · Effort: ~1 hr · No dependencies.*
Mark up the five existing FAQ answers in FAQPage JSON-LD. Competitors already win FAQ rich results; the content is already written.

**2. Add SoftwareApplication/Product schema** — *Impact: medium–high · Effort: ~1 hr.*
JSON-LD with `name`, `operatingSystem: Windows`, `applicationCategory`, and an `offers` block at $29. Eligibility for richer product results and AI-overview citations.

**3. Trim the meta description to ≤160 characters** — *Impact: medium · Effort: 10 min.*
Keep "OBS," "repair corrupted MP4," "100% local/private," and "$29."

**4. Add a 301 redirect www → non-www** — *Impact: medium · Effort: ~15 min.*
Consolidate to the canonical host so signals aren't split across two 200-status versions.

**5. Verify and fix image alt text** — *Impact: low–medium · Effort: ~20 min.*
Descriptive, keyword-aware alt on every screenshot.

**6. Sharpen the H1 and add one keyword-bearing H2** — *Impact: medium · Effort: ~20 min.*
e.g. H1 "Recover your corrupted OBS MP4 recording in minutes"; add H2 "How to fix a corrupted OBS MP4 recording."

### Strategic investments (plan for this quarter)

**7. Build the OBS-repair content cluster** — *Impact: high · Effort: multi-day, ongoing · Depends on a /blog or /guides section existing.*
Start with the pillar guide (#1 in content gaps), then the untrunc-alternative and no-upload pages, then prevention and troubleshooting posts. Interlink them and link each back to the homepage. This is the primary engine for non-branded traffic.

**8. Launch a link-building / community push** — *Impact: high · Effort: ongoing.*
The audience is already gathered: OBS forums, r/obs, r/Twitch, r/letsplay, and the untrunc GitHub discussions are full of people with exactly this problem. Provide genuinely helpful answers that link to the relevant guide (not spam). A few links from these high-relevance sources will move DR off zero faster than anything else. Dependency: the guide pages from #7 must exist first.

**9. Stand up a comparison-page set** — *Impact: medium–high · Effort: moderate.*
"vs Wondershare," "vs Stellar," "untrunc alternative." Bottom-funnel, high-intent, and aligned with the price/privacy differentiators.

**10. Confirm Core Web Vitals and indexation in Search Console** — *Impact: medium · Effort: low, recurring.*
Verification is already in place — use it to monitor indexation as new pages ship and to catch any CWV regressions.

---

## Suggested next steps

I can take any of these further:

- Draft the FAQPage + SoftwareApplication JSON-LD ready to paste into the page
- Write content briefs (or full drafts) for the top 3 guide pages
- Rewrite the meta description and heading set with options
- Build a content calendar from the gap analysis
- Re-run this audit with full Ahrefs data once the plan is upgraded

---

## Sources

- [How to: Fix MP4/MOV files corrupting when OBS Studio crashes — OBS Forums](https://obsproject.com/forum/resources/how-to-fix-mp4-mov-files-corrupting-when-obs-studio-crashes.1293/)
- [Corrupted .Mp4 file, OBS crashed before finishing file — OBS Forums](https://obsproject.com/forum/threads/corrupted-mp4-file-obs-crashed-before-finishing-file.2325/)
- [How to Fix Video 'Moov Atom Not Found' Error — Wondershare Repairit](https://repairit.wondershare.com/video-repair/moov-atom-not-found.html)
- [Moov Atom Not Found? Fix It in 6 Ways — EaseUS](https://www.easeus.com/data-recovery-solution/moov-atom-not-found.html)
- [How to Fix Corrupted MP4 Files in 2026: 7 Proven Methods — Tenorshare 4DDiG](https://4ddig.tenorshare.com/video-error/repair-corrupted-mp4-files.html)
- [8 Best Video Repair Software & Tools 2026 — Tenorshare 4DDiG](https://4ddig.tenorshare.com/video-recovery/video-repair-tool.html)
- [Moov Atom Not Found? Fix Corrupted MP4 or MOV Fast — Magic Leopard](https://www.magicleopard.com/video-repair/moov-atom-not-found-fix)
- [mp4-recovery with no moov tag (untrunc-style) — GitHub](https://github.com/haiyanglx/mp4-recovery-untrack-with-no-moov)
- [Wondershare Repairit pricing & discounts — ColorMango](https://www.colormango.com/product/wondershare-repairit_151521.html)
- [Stellar Repair for Video — Test & Review 2026](https://recoverit.wondershare.com/video-repair/stellar-repair-for-video.html)
- Live crawl: streamsalvage.com homepage, /robots.txt, /sitemap.xml (June 13, 2026)
- Ahrefs API v3 — public Domain Rating endpoint (DR = 0)
