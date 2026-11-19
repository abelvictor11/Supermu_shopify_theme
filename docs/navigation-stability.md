# Navigation stability — staging gate

## Scope

This change addresses confirmed component defects found while investigating the reported Safari iPhone page failure. It does not establish that those defects caused the browser process failure, nor guarantee a fix for that crash without a device trace.

- `carousel-manager.js` is the single owner of dual-banner Swipers; controls are scoped to each container. One-slide banners have no loop/autoplay. Repeated init is idempotent; section unload and pagehide destroy owned instances; pageshow restores them. Hidden documents and reduced motion stop autoplay. Swiper 8's unconditional mouseleave resume path is disabled.
- `custom.js` loses only the duplicate small-banner initializer. The clean main promotion preserves main's cart limits and daily-discount correction.
- Banner images are supplied by Liquid CSS variables before JavaScript; viewport media queries select mobile artwork. A valid second/later slide is revealed even when image_1 is empty. No global MutationObserver or resize polling is added.
- Homepage product carousels render at most 12 products, disable infinite clones, and link to the full collection if truncated. Other page templates retain their configured count and infinite setting. No full homepage settings JSON is copied between stores.
- Product scrollbars use Slick events, a cancellable/coalesced animation frame, and the actual current slide. The main promotion includes the related event-based scrollbar implementation already present on staging, replacing its 100ms polling and removing the redundant outer product image.

## Verification

`npm ci --ignore-scripts` then `npm test`.

New regression suite: `node --test tests/navigation-stability.test.js` (16 tests). Covers combined initializers, single-slide config, idempotence, 50 simulated pagehide/pageshow cycles, section reload/unload, independently scoped controls, reduced motion, later-slide visibility, first-paint image data, categories, scrollbar position/frame teardown and actual Liquid rendering of 50 products (12 on home; unchanged 50 on product pages).

The suite deliberately uses jsdom and a Swiper boundary fake for deterministic lifecycle/config assertions, plus actual bundled jQuery for scrollbar events and Liquidjs for section rendering. It does not measure real browser memory. Separate reviewer checks with real Swiper 8 caught the mouseleave and later-slide cases, which were then added as failing regression checks before correction.

No production dependency is added. Main needs Liquidjs/jsdom as development-only dependencies to run this test; staging already has them. No calendar files, cart business rules, discounts or Shopify app configuration are included.

Theme Check on the changed sections: no errors; existing carousel include/shared-Liquid warnings remain. Legacy theme-wide findings are not claimed fixed. Do not replace the product-card include with render: nested legacy includes require shared Liquid scope.

## Release order

1. Review and integrate the isolated staging PR; verify Shopify GitHub sync.
2. On the actual staging theme, test mobile/desktop artwork, banner arrows/swiping, single/later-image banners, product links, collection destination, scrollbar and home/cart/back navigation. Check repeated visits and page visibility changes.
3. Repeat the reported flow with a populated test cart on the affected iPhone/iOS; record Safari CPU/memory if the failure recurs. Simulated lifecycle tests are not an iPhone stress test.
4. Only then approve the clean main PR. Keep it draft while the real-store/device gate is incomplete. Do not merge the whole staging branch into main.

Main and staging have different source baselines, so their PR diffs are intentionally different. The main branch starts at main and contains only this adjustment and its tests/documentation/tooling. Comparing runtime files does not justify copying unrelated `custom.js` behavior from staging.
