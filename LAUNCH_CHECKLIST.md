# Focus Habitat App Store launch handoff

**Status:** PREPARED ONLY — not published.
**Prepared:** 2026-10-15
**Branch:** `codex/app-store-launch-2026-10-15`
**Production:** `main` root on GitHub Pages; baseline `e88c292`.
**App Store ID:** `6820682982`

Do not merge this branch into `main` until Focus Habitat is actually available
to download and the owner approves publication. Apple approval and public download
availability are separate. Preparation is not permission to deploy automatically.

## Prepared changes

- EN/TR availability copy, hero download link and closing download badge.
- Neutral storefront link: `https://apps.apple.com/app/id6820682982`.
- Safari Smart App Banner with the correct app ID; no tracking/affiliate data.
- One official localized black badge per page, 48px high with 12px clear space.
  Artwork is unchanged, aspect ratio preserved and its container is not animated.
- Existing room/demo, app screenshots, privacy/support and legal links are preserved.

## Badge provenance

Source: [Apple Marketing Resources and Identity Guidelines](https://developer.apple.com/app-store/marketing/guidelines/).
The generic Apple ZIPs below were retrieved on 2026-10-15; each `black.svg`
was extracted without changing its artwork and saved with a locale-specific name.

| Local asset | Official source | Original dimensions |
| --- | --- | --- |
| `assets/badges/app-store-en.svg` | [EN archive](https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/en-us/download) | 119.66407 × 40 |
| `assets/badges/app-store-tr.svg` | [TR archive](https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/tr-tr/download) | 151.29018 × 40 |

[Safari Smart App Banner documentation](https://developer.apple.com/documentation/webkit/promoting-apps-with-smart-app-banners).

## Before publication

Preparation checks on 2026-10-15: all 9 static launch checks passed. A 320px
local browser preview showed no horizontal overflow, a 44px hero action and a
loaded 48px Turkish badge with 12px clear space. English links were also checked.
This is not a physical iPhone/Safari or mailbox-delivery acceptance.

- [ ] Open the App Store page on a real iPhone and confirm Get/Download is available
  in the intended launch storefronts. Lookup absence or HTTP throttling is not an
  App Review status diagnosis. TR lookup returned zero results during preparation.
- [ ] Confirm the support mailbox receives mail and is monitored; no delivery test
  or message was sent by this preparation.
- [ ] Check the launch branch on mobile: hero action, closing badge and EN/TR legal links.
- [ ] Run `node --test scripts/check-app-store-launch.mjs` and `git diff --check`.
- [ ] Review `main...codex/app-store-launch-2026-10-15`; obtain publication approval.
- [ ] Merge only the reviewed launch branch into `main`, push and confirm Pages deployment.
- [ ] Verify the live EN/TR download links; compare the rendered site with the approved
  preparation. Check the banner on real Safari, not the iOS simulator.

The 2026-10-15 preparation leaves production `main` untouched. It does not verify
mail delivery, physical Safari, App Store approval, DSA or the app's device checklist.
