# Homepage Structural Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize homepage carousel loading and hide incomplete merchandising sections across desktop and mobile.

**Architecture:** `CarouselProducts` becomes the sole owner of Slick, scrollbar events, resize handling, reduced-motion behavior, and teardown. Liquid sections render only complete storefront content while preserving editor-only guidance.

**Tech Stack:** Shopify Liquid, theme JSON templates, JavaScript custom elements, jQuery/Slick, Node test runner, Shopify Theme Check.

**Spec:** `docs/superpowers/specs/2026-11-11-homepage-structural-stability-design.md`

## Global Constraints

- Preserve the existing Supermú visual identity and product-card behavior.
- Do not replace merchant-managed campaign artwork in code.
- Do not use permanent polling for carousel state.
- Storefront configuration gaps must render zero height; editor guidance remains available.
- Use tests before each production change.

## Review Focus

- Multiple product carousels on one page must not remove each other's handlers.
- Sections connected before `jQueryTheme` exists must initialize after assets load without inline errors.
- Empty or missing collections must not leave headings, scrollbars, or vertical gaps.
- Theme Editor section unload/reload must clean up instance listeners safely.
- Mobile carousel cards must initialize and expose real lazy-loaded images when scrolled into range.

---

### Task 1: Centralize carousel scrollbar lifecycle

**Files:**
- Modify: `assets/section.carousel-products.js`
- Modify: `sections/carousel-products.liquid`
- Test: `tests/homepage-loading-stability.test.js`

**Interfaces:**
- Consumes: existing `CarouselProducts.initSlick()` and `disconnectedCallback()` lifecycle.
- Produces: instance methods `initScrollbar()`, `updateScrollbar(slick, currentSlide)`, and `destroyScrollbar()`.

- [ ] **Step 1: Write failing tests** asserting no inline `jQueryTheme` invocation remains and the asset owns namespaced Slick/scrollbar setup and cleanup.
- [ ] **Step 2: Run** `node --test tests/homepage-loading-stability.test.js`; expect the new assertions to fail.
- [ ] **Step 3: Implement** the three instance methods, call initialization after Slick is ready, and remove the repeated Liquid script.
- [ ] **Step 4: Run** focused tests and `node --check assets/section.carousel-products.js`; expect PASS.
- [ ] **Step 5: Commit** with message `fix: centralize carousel scrollbar lifecycle`.

### Task 2: Hide incomplete merchandising sections

**Files:**
- Modify: `sections/two-column-carousel-banner.liquid`
- Modify: `templates/index.json`
- Test: `tests/homepage-loading-stability.test.js`

**Interfaces:**
- Consumes: `request.design_mode`, selected collection, collection `products_count`, banner image.
- Produces: zero storefront markup for incomplete sections and editor-only guidance for configuration.

- [ ] **Step 1: Write failing tests** for storefront guards, editor guidance, and a title consolidated into the Pescados carousel.
- [ ] **Step 2: Run** the focused test; expect failures for missing guards and orphan title configuration.
- [ ] **Step 3: Implement** a `section_has_content` guard and update the homepage JSON so the carousel owns its title.
- [ ] **Step 4: Run** focused tests and parse `templates/index.json`; expect PASS and valid JSON.
- [ ] **Step 5: Commit** with message `fix: hide incomplete homepage merchandising`.

### Task 3: Stabilize responsive presentation and verify

**Files:**
- Modify: `sections/two-column-carousel-banner.liquid`
- Modify: `tests/homepage-loading-stability.test.js`

**Interfaces:**
- Consumes: existing section breakpoints and product-card markup.
- Produces: bounded responsive spacing with no empty fixed-height placeholders.

- [ ] **Step 1: Write failing tests** preventing storefront placeholder blocks and fixed empty-section heights.
- [ ] **Step 2: Run** focused tests; expect the new assertions to fail.
- [ ] **Step 3: Implement** minimal responsive CSS and design-mode-only placeholder styling.
- [ ] **Step 4: Run** full Node suite, JavaScript syntax check, `git diff --check`, and Shopify Theme Check.
- [ ] **Step 5: Audit** desktop/mobile staging after deployment; expect no carousel-owned console errors, orphan titles, or configuration placeholders.
- [ ] **Step 6: Commit** with message `fix: stabilize homepage responsive sections`.

