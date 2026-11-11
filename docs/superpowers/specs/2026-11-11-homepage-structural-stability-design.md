# Homepage Structural Stability Design

## Intent

Make the Shopify homepage load consistently on desktop and mobile without blank product areas, orphan headings, configuration placeholders, or race-condition errors. Preserve the existing Supermú visual identity and merchandising content; this is a structural UX correction, not a visual rebrand.

## Evidence from staging

- Mobile reloads emit `ReferenceError: jQueryTheme is not defined` from the inline scrollbar script repeated by product-carousel sections.
- Product carousels can remain uninitialized, leaving transparent lazy-image placeholders and only their headings/scrollbars visible.
- Empty two-column sections render 638–773 px grey configuration placeholders on the storefront.
- A custom title remains visible when its following product collection has no products.
- The configured mobile hero assets named `1080x810...png` and `800x600...` are placeholder content selected in Shopify; code must preserve editor control but cannot manufacture replacement campaign art.

## Goals

- Initialize every product carousel through one lifecycle owner after Slick and the theme jQuery adapter are available.
- Keep custom scrollbar behavior event-driven and scoped to the carousel instance.
- Render empty collection/banner guidance only in Shopify design mode.
- Keep titles and their product content in the same conditional rendering boundary.
- Reserve responsive geometry and avoid large layout gaps on mobile.
- Add regression tests for all observed failure modes.

## Non-goals

- Replacing campaign artwork or changing merchandising data.
- Refactoring every legacy `include` in the product-card stack.
- Rebuilding unrelated homepage sections or changing brand typography/colors.

## Chosen approach

Move the product-carousel scrollbar logic from repeated section-level scripts into `assets/section.carousel-products.js`, where the component already owns Slick initialization and teardown. Add storefront guards to empty two-column sections and make the Pescados title part of its carousel configuration so the whole unit disappears when empty. Tighten responsive section sizing without overriding the existing brand system.

## Alternatives considered

- Revert PR #295: avoids the new race but restores polling, duplicate images, and unsafe teardown.
- CSS-only hiding: masks empty blocks but leaves JavaScript errors and inaccessible uninitialized content.
- Full carousel rewrite: cleaner long-term, but unnecessarily risky for a staging stabilization pass.

## UX contract

- Storefront visitors never see configuration instructions.
- Empty merchandising sections consume no vertical space.
- Theme editors retain clear configuration guidance.
- Product content remains usable without autoplay and respects reduced-motion preferences.
- Desktop and mobile use the same content hierarchy and lifecycle.

## Validation

- Node regression suite and JavaScript syntax check.
- Shopify Theme Check on modified Liquid.
- Rendered staging audit at desktop and mobile breakpoints.
- Console must contain no carousel-owned `jQueryTheme is not defined` errors.
