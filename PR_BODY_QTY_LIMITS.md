feat(cart-limits): align all quantity inputs with metafield JSON

Summary
- Aligns all quantity inputs across the theme (collection cards, product pages, cart popup/drawer, cart page) to be controlled by the JSON metafield `shop.metafields.custom.cart_item_max_quantity`.
- Default state: limits disabled (no `max` attribute and no clamp-to-max).
- When `enabled: true`: apply `max_per_line` to the `max` attribute and clamp to that max.
- Fallback `max = 3` only if `enabled: true` but `max_per_line` is invalid (`< 1`).

Key Changes
- Updated `snippets/quantity-limiter.liquid` (collection product cards).
- Updated `snippets/product-get-quantity.liquid` (PDP / footbar variants).
- Updated `snippets/product-cart.liquid` (cart popup/drawer).
- Updated `snippets/cart.liquid` (cart page).

Behavior
- Collection cards / PDP inputs (`name="quantity"`):
  - `min=1`.
  - If limits enabled: `max="{{ cart_item_max }}"` and clamp `Math.min(cart_item_max, Math.max(1, value))`.
  - If disabled: no `max` attribute; clamp only to `min`.
- Cart popup/drawer inputs (`name="updates[]"`):
  - `min=0` (allow removing from popup).
  - Same dynamic `max` and clamp rules as above.
- Cart page inputs (`name="updates[]"`):
  - `min=1` (removal is handled by separate control/link).
  - Uses dynamic `max` and clamp; server render clamps `display_quantity` if it exceeded `max`.

Static QA/Search Verification
- No hardcoded numeric `max="N"` remains in quantity inputs.
- All clamping uses dynamic `cart_item_max` only when the metafield explicitly enables limits.
- Verified occurrences of `name="quantity"` and `name="updates[]"` map to the updated snippets above.

QA Checklist
- Metafield disabled `{ "enabled": false, "max_per_line": 0 }`:
  - No `max` attribute on any quantity input; clamp only respects `min`.
- Metafield enabled valid `{ "enabled": true, "max_per_line": 5 }`:
  - All relevant inputs include `max="5"`; clamp to 5.
- Metafield enabled invalid `{ "enabled": true, "max_per_line": 0 }`:
  - Fallback applies: `max="3"` and clamp to 3.

Notes
- Consistent behavior across all contexts; no UI changes besides respecting configured limits.
- This PR removes reliance on any default hardcoded max and centralizes control in the metafield JSON.
