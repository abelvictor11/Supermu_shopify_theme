feat: unify discount labels via orchestrator (collections + PDP)

Summary
- Unifies discount label rendering across collection product cards and product detail pages (PDP) using a single orchestrator snippet.
- Ensures only one discount label is shown per product, with deterministic winner rules.

Key Changes
- Updated `snippets/product-collection.liquid` to render the orchestrator under the price block:
  `{% render 'both-discount-labels', product: product %}`
- Updated `snippets/product-page-get-info.liquid` (price block) to render the same orchestrator.
- Resolved merge conflict in `snippets/product-collection.liquid` keeping the orchestrator path.

Behavior
- Orchestrator snippet `snippets/both-discount-labels.liquid` captures percent values from:
  - Green (collection) label: `snippets/discount-label.liquid`
  - Red (daily) label: `snippets/daily-discount-label.liquid`
- Renders exactly one label per product:
  - Higher percent wins.
  - Tie favors the red (daily) label.
- Debug output appears only in design mode.

Data sources
- Green label rules via metafield: `shop.metafields.custom.collection_discounts` (JSON).
- Red label rules remain hardcoded in `daily-discount-label.liquid` (weekday + product tags), by design.

QA Checklist
- Collection cards: exactly one label; correct percent; tie → red.
- PDP: label appears under price; matches collection card result.
- Test with a product tagged for daily discount (e.g., Monday) and an active collection discount via metafields.
- Verify Quick View and mobile layouts show only one label.

Notes
- Removed any ad-hoc direct renders of green/red labels in favor of the orchestrator to avoid duplicates.
