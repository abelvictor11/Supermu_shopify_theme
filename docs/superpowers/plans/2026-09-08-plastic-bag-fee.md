# Plastic Bag Fee Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cobrar obligatoriamente 200 COP por cada bloque iniciado de 40.000 COP del subtotal original de productos en el canal online de Supermu.

**Architecture:** Una app pública de Shopify App Store será la autoridad que añade/protege la línea y valida checkout en Shopify Advanced. El tema identificará la variante configurada, presentará la bolsa como cargo no editable, excluirá sus unidades de los contadores y verificará —sin mutar el carrito— que la cantidad visible coincide con la fórmula antes de enviar los formularios de checkout.

**Tech Stack:** Shopify Advanced, app pública con Shopify Functions, Liquid, Shopify Ajax Cart API, JavaScript ES2017, CSS, Node.js `node:test` para lógica pura, Shopify CLI Theme Check.

**Spec:** `docs/superpowers/specs/2026-09-08-plastic-bag-fee-design.md`

## Global Constraints

- Aplicar únicamente al canal Online Store; POS y pedidos creados directamente en Admin/API quedan fuera.
- La fórmula exacta es `subtotal = 0 ? 0 : ceil(subtotal_original_sin_bolsa / 40000)`.
- El cálculo usa precios originales antes de descuentos y excluye bolsa, envío, impuestos y propinas.
- Cada bolsa cuesta exactamente 200 COP y no admite descuentos.
- La app pública es la autoridad; el tema nunca añade, elimina ni cambia cantidades de bolsa.
- El cargo debe estar protegido en checkout normal y acelerado.
- La regla solo se activa en COP.
- No activar una regla global en la tienda comercial hasta demostrar aislamiento seguro o completar las pruebas en una tienda de desarrollo/clon.
- No publicar en producción como parte de este plan.

---

### Task 1: Ejecutar la compuerta de selección de app

**Files:**
- Create: `docs/plastic-bag-fee/app-evaluation.md`
- Reference: `docs/superpowers/specs/2026-09-08-plastic-bag-fee-design.md`

**Interfaces:**
- Consumes: regla comercial y criterios de aceptación de la especificación.
- Produces: decisión `VOL`, `Magical` o `NO-GO`; nombre de la app; método usado por la app; evidencia de checkout validation; mecanismo estable para identificar la línea; y forma segura de probar sin afectar el tema publicado.

- [ ] **Step 1: Crear la matriz de evaluación antes de instalar**

Crear `docs/plastic-bag-fee/app-evaluation.md` con esta tabla, manteniendo `NOT_TESTED` hasta observar cada comportamiento:

```markdown
# Evaluación de app para bolsa plástica

| Criterio | VOL | Magical | Evidencia |
|---|---|---|---|
| Fórmula ilimitada ceil(subtotal / 40.000) | NOT_TESTED | NOT_TESTED | Sin evidencia todavía |
| Subtotal antes de descuentos | NOT_TESTED | NOT_TESTED | Sin evidencia todavía |
| Excluye la propia bolsa | NOT_TESTED | NOT_TESTED | Sin evidencia todavía |
| Cantidad dinámica en una sola línea | NOT_TESTED | NOT_TESTED | Sin evidencia todavía |
| Cargo obligatorio protegido por Shopify Function | NOT_TESTED | NOT_TESTED | Sin evidencia todavía |
| Checkout normal | NOT_TESTED | NOT_TESTED | Sin evidencia todavía |
| Shop Pay/pagos acelerados | NOT_TESTED | NOT_TESTED | Sin evidencia todavía |
| Identificador estable distinto del título | NOT_TESTED | NOT_TESTED | Sin evidencia todavía |
| Prueba aislada del tema publicado | NOT_TESTED | NOT_TESTED | Sin evidencia todavía |
| Línea visible en pedido y reembolso | NOT_TESTED | NOT_TESTED | Sin evidencia todavía |

## Decisión

- Estado: NO-GO
- App seleccionada: Ninguna hasta completar todos los criterios obligatorios.
- Método de identificación de línea: BLOCKED_UNTIL_OBSERVED.
- Entorno de prueba: BLOCKED_UNTIL_ISOLATION_CONFIRMED.
```

- [ ] **Step 2: Confirmar por escrito la capacidad con soporte de VOL**

Enviar al soporte de VOL este caso exacto, sin sustituirlo por una tarifa porcentual:

```text
Shopify plan: Advanced; channel: Online Store; currency: COP.
We must add a mandatory product line priced at COP 200 with quantity:
eligible subtotal 0 => 0;
1..40,000 => 1;
40,001..80,000 => 2;
80,001..120,000 => 3;
and continue indefinitely using ceil(original merchandise subtotal / 40,000).
The subtotal must be before discounts and must exclude the fee product itself.
Can your app enforce the exact quantity with Shopify checkout validation,
including Shop Pay and direct checkout, on Shopify Advanced?
How can we test without affecting the published theme?
Which product/variant ID, line attribute, or metafield identifies the fee line?
```

Registrar respuesta, URL/captura y fecha en la columna `Evidencia`.

- [ ] **Step 3: Probar VOL en un entorno aislado**

No activar la regla en la tienda comercial si la app no puede segmentarla fuera del tema publicado. En el entorno aislado, ejecutar `0`, `1`, `40000`, `40001`, `60000`, `80000` y `80001` COP; luego intentar eliminar/cambiar la línea y abrir checkout normal y Shop Pay. Marcar `Cumple` solo con evidencia observada.

- [ ] **Step 4: Evaluar VOL o repetir con Magical**

Si cualquier criterio obligatorio de VOL queda en `No cumple`, repetir Steps 2–3 con Magical. Actualizar `## Decisión` a una de estas formas exactas:

```markdown
- Estado: GO
- App seleccionada: VOL Product Fees & Surcharges
```

o:

```markdown
- Estado: GO
- App seleccionada: Magical Fees & Tariffs
```

Si ambas fallan, conservar `Estado: NO-GO`, detener el plan y presentar evidencia al usuario. No ejecutar Tasks 2–7.

- [ ] **Step 5: Revisar y commitear la evidencia**

Run: `rg -n "NOT_TESTED|BLOCKED_UNTIL" docs/plastic-bag-fee/app-evaluation.md`

Expected: sin resultados cuando el estado sea `GO`; con `NO-GO`, los únicos campos permitidos son explicaciones explícitas de lo que no pudo verificarse.

```bash
git add docs/plastic-bag-fee/app-evaluation.md
git commit -m "docs: evaluate mandatory plastic bag fee apps"
```

---

### Task 2: Crear y configurar el producto de bolsa y la regla

**Files:**
- Modify: `docs/plastic-bag-fee/app-evaluation.md`
- Create: `docs/plastic-bag-fee/merchant-configuration.md`

**Interfaces:**
- Consumes: app con estado `GO` y método de identificación confirmado por Task 1.
- Produces: producto `Bolsa plástica`, ID de producto, ID de variante, configuración activa en entorno aislado y procedimiento reproducible de operación.

- [ ] **Step 1: Crear el producto en Shopify Admin**

Configurar exactamente:

```text
Título: Bolsa plástica
Variante: Default Title (una sola variante)
Precio: 200 COP
Compare-at price: vacío
Costo: según contabilidad
Inventario: no rastrear (o continuar vendiendo si la app exige rastreo)
Producto físico: según definición contable/logística
Publicación Online Store: no publicar como producto navegable si la app lo permite
Tags: system-plastic-bag-fee
```

Confirmar con contabilidad si recauda impuesto. Registrar la decisión; no asumir `taxable`.

- [ ] **Step 2: Excluir el producto de descuentos y merchandising**

Verificar que descuentos automáticos/códigos no incluyan el producto, que no pertenezca a colecciones manuales, y que no aparezca en búsqueda/recomendaciones/venta rápida. Si la app necesita publicación en Online Store, usar una colección oculta y exclusión por tag/handle en vez de dejarlo comprable desde catálogo.

- [ ] **Step 3: Configurar la regla exacta en la app seleccionada**

Ingresar:

```text
Fee product/variant: ID creado en Step 1
Unit amount: 200 COP
Currency: COP only
Eligible channel: Online Store
Eligible subtotal: original merchandise subtotal before discounts
Excluded merchandise: fee product itself / tag system-plastic-bag-fee
Required quantity: ceil(eligible subtotal / 40000), zero for an empty merchandise cart
Validation: required/enabled
Optional opt-in: disabled
```

No usar `0.5%`: para 60.000 COP produciría 300 COP y violaría la regla de 2 bolsas/400 COP.

- [ ] **Step 4: Documentar valores reales y rollback**

Después de observar todos los valores en Shopify Admin, crear `docs/plastic-bag-fee/merchant-configuration.md` con las claves siguientes y los valores literales copiados. Si falta un valor, no crear/commitear el archivo y mantener Task 2 bloqueada:

```markdown
# Configuración comercial de bolsa plástica

- App seleccionada
- Product GID
- Variant GID
- Variant numeric ID
- Product handle
- Tag: system-plastic-bag-fee
- Precio: 200 COP
- Bloque: 40.000 COP
- Impuesto confirmado por contabilidad
- Entorno de validación observado

## Pausa segura

1. Deshabilitar los botones de checkout del tema si existe una incidencia activa.
2. Desactivar la regla en la app.
3. Confirmar que no queda una línea huérfana en un carrito de prueba.
4. Registrar hora, responsable y motivo.
```

Cada clave debe quedar en formato `- Clave: valor observado`. No commitear IDs inferidos ni valores vacíos.

- [ ] **Step 5: Verificar y commitear configuración**

Run: `awk -F': ' '/^- / && NF < 2 { exit 1 }' docs/plastic-bag-fee/merchant-configuration.md`

Expected: sin resultados.

```bash
git add docs/plastic-bag-fee/app-evaluation.md docs/plastic-bag-fee/merchant-configuration.md
git commit -m "docs: record plastic bag fee configuration"
```

---

### Task 3: Añadir configuración e identificación estable al tema

**Files:**
- Modify: `config/settings_schema.json`
- Modify: `snippets/js-assets-loader.liquid:199-217`
- Create: `snippets/cart-merchandise-count.liquid`
- Test: `tests/plastic-bag-cart.test.js`
- Create: `assets/plastic-bag-cart.js`

**Interfaces:**
- Consumes: producto seleccionado mediante `settings.plastic_bag_product`.
- Produces: `theme.plasticBag = {enabled, productId, variantId, unitPrice: 20000, blockSize: 4000000}` en centavos; `window.PlasticBagCart.isBagItem(item, config)`; `window.PlasticBagCart.getMerchandiseCount(items, config)`; `window.PlasticBagCart.getExpectedQuantity(items, config)`; snippet que imprime solo la cantidad de mercancía.

- [ ] **Step 1: Escribir pruebas fallidas para funciones puras**

Crear `tests/plastic-bag-cart.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const Bag = require('../assets/plastic-bag-cart.js');

const config = {enabled: true, productId: 99, variantId: 999, unitPrice: 20000, blockSize: 4000000};
const line = (productId, variantId, quantity, originalLinePrice) => ({
  product_id: productId,
  variant_id: variantId,
  quantity,
  original_line_price: originalLinePrice
});

test('identifies bag by numeric variant id', () => {
  assert.equal(Bag.isBagItem(line(99, 999, 2, 40000), config), true);
  assert.equal(Bag.isBagItem(line(1, 10, 1, 20000), config), false);
});

test('excludes bag from merchandise count', () => {
  assert.equal(Bag.getMerchandiseCount([
    line(1, 10, 3, 6000000), line(99, 999, 2, 40000)
  ], config), 3);
});

test('uses original prices and rounds each started 40000 COP block upward', () => {
  const cases = [[0, 0], [100, 1], [4000000, 1], [4000100, 2], [6000000, 2], [8000000, 2], [8000100, 3]];
  for (const [subtotalCents, expected] of cases) {
    const items = subtotalCents ? [line(1, 10, 1, subtotalCents), line(99, 999, 7, 140000)] : [];
    assert.equal(Bag.getExpectedQuantity(items, config), expected);
  }
});

test('reports exact bag quantity and detects duplicates', () => {
  assert.deepEqual(Bag.getBagState([
    line(1, 10, 1, 6000000),
    line(99, 999, 1, 20000),
    line(99, 999, 1, 20000)
  ], config), {expected: 2, actual: 2, lines: 2, valid: false});
});
```

- [ ] **Step 2: Ejecutar pruebas y confirmar fallo**

Run: `node --test tests/plastic-bag-cart.test.js`

Expected: FAIL porque `assets/plastic-bag-cart.js` todavía no existe.

- [ ] **Step 3: Implementar el módulo puro y exportable**

Crear `assets/plastic-bag-cart.js` como UMD sin mutaciones Ajax. Debe normalizar IDs con `String()`, sumar `original_line_price` solo de mercancía, y devolver `valid: false` cuando haya más de una línea de bolsa aunque la suma de cantidades coincida. Exponer exactamente las cinco funciones probadas: `isBagItem`, `getMerchandiseCount`, `getEligibleSubtotal`, `getExpectedQuantity`, `getBagState`.

- [ ] **Step 4: Añadir configuración al editor del tema**

Añadir a `config/settings_schema.json` un grupo `Bolsa plástica obligatoria` con:

```json
{
  "name": "Bolsa plástica obligatoria",
  "settings": [
    {"type":"checkbox","id":"plastic_bag_fee_enabled","label":"Activar presentación y verificación de bolsa","default":false},
    {"type":"product","id":"plastic_bag_product","label":"Producto usado para la bolsa"},
    {"type":"text","id":"plastic_bag_label","label":"Nombre visible","default":"Bolsa plástica obligatoria"},
    {"type":"text","id":"plastic_bag_help","label":"Texto explicativo","default":"1 bolsa por cada $40.000 o fracción"}
  ]
}
```

Mantener `default:false` para que desplegar código no active una configuración incompleta.

- [ ] **Step 5: Exponer IDs y constantes al JavaScript**

En `snippets/js-assets-loader.liquid`, dentro del objeto `theme`, añadir `plasticBag`. Obtener el primer variant de `settings.plastic_bag_product.selected_or_first_available_variant`; emitir IDs con `| json` y montos en centavos:

```liquid
plasticBag: {
  enabled: {{ settings.plastic_bag_fee_enabled | json }},
  productId: {{ settings.plastic_bag_product.id | default: 0 | json }},
  variantId: {{ settings.plastic_bag_product.selected_or_first_available_variant.id | default: 0 | json }},
  unitPrice: 20000,
  blockSize: 4000000
},
```

- [ ] **Step 6: Crear contador Liquid reutilizable**

Crear `snippets/cart-merchandise-count.liquid` para imprimir la suma de `item.quantity` únicamente cuando `item.product.id != bag_product.id`; si la función está desactivada o el producto está vacío, imprimir `cart.item_count`. El snippet no debe producir espacios ni HTML alrededor del número.

- [ ] **Step 7: Ejecutar verificaciones**

Run: `node --test tests/plastic-bag-cart.test.js`

Expected: 4 tests PASS.

Run: `shopify theme check --path .`

Expected: exit 0 o únicamente advertencias preexistentes registradas antes de esta tarea; ningún error nuevo en los cinco archivos de Task 3.

- [ ] **Step 8: Commit**

```bash
git add config/settings_schema.json snippets/js-assets-loader.liquid snippets/cart-merchandise-count.liquid assets/plastic-bag-cart.js tests/plastic-bag-cart.test.js
git commit -m "feat(cart): add plastic bag fee configuration"
```

---

### Task 4: Renderizar la bolsa como línea obligatoria no editable

**Files:**
- Modify: `snippets/cart.liquid:48-174`
- Modify: `snippets/popup-cart.liquid:3-12`
- Modify: `snippets/product-cart.liquid:45-124`
- Modify: `assets/custom.css`

**Interfaces:**
- Consumes: `settings.plastic_bag_product`, `plastic_bag_label`, `plastic_bag_help` y el parámetro Liquid `is_plastic_bag` pasado a `product-cart`.
- Produces: `data-plastic-bag-line`, `.plastic-bag-line`, `.plastic-bag-line__help`; línea sin enlaces de eliminación ni inputs editables en carrito principal y popup.

- [ ] **Step 1: Crear una prueba estática que falle**

Añadir a `tests/plastic-bag-cart.test.js` una prueba que lea los tres snippets y verifique la presencia de `data-plastic-bag-line`, `plastic_bag_help` y una rama `{% unless is_plastic_bag %}` alrededor de controles editables usando `node:fs`.

- [ ] **Step 2: Ejecutar la prueba y confirmar fallo**

Run: `node --test tests/plastic-bag-cart.test.js`

Expected: FAIL indicando que todavía no existe el marcador en los snippets.

- [ ] **Step 3: Adaptar el carrito principal**

En cada iteración de `snippets/cart.liquid`, asignar `is_plastic_bag` comparando `item.product.id` con `settings.plastic_bag_product.id` solo cuando `plastic_bag_fee_enabled` sea verdadero. Para la bolsa:

- añadir `data-plastic-bag-line` y `.plastic-bag-line` al contenedor;
- no renderizar el enlace `/cart/change?...quantity=0`;
- mostrar `settings.plastic_bag_label` en vez de un enlace al PDP;
- mostrar `settings.plastic_bag_help`;
- reemplazar el input `updates[]` por texto de cantidad con `aria-label`;
- conservar precio unitario y `item.final_line_price` visibles.

No incluir la bolsa en `updateCartSubtotal()` mediante `.quantity-input`; el subtotal mostrado debe provenir del HTML Ajax devuelto por Shopify después de una actualización, no de una suma parcial del DOM.

- [ ] **Step 4: Adaptar el carrito lateral**

En `snippets/popup-cart.liquid`, calcular `is_plastic_bag` antes de incluir `product-cart` y pasar `is_plastic_bag: is_plastic_bag`. Usar `cart-merchandise-count` para el número del título.

En `snippets/product-cart.liquid`, para `is_plastic_bag`:

- renderizar título y ayuda sin enlace;
- ocultar ambos controles desktop/mobile de cantidad;
- ocultar ambos enlaces de eliminación;
- mantener cantidad, precio unitario y total visibles.

- [ ] **Step 5: Añadir estilos accesibles**

En `assets/custom.css`, añadir borde/fondo sutil a `.plastic-bag-line`, texto secundario legible para `.plastic-bag-line__help`, y un indicador de candado mediante texto o SVG existente con `aria-hidden="true"`. No usar solo color para indicar obligatoriedad.

- [ ] **Step 6: Verificar pruebas y Liquid**

Run: `node --test tests/plastic-bag-cart.test.js`

Expected: todas PASS.

Run: `shopify theme check --path .`

Expected: ningún error nuevo en `cart.liquid`, `popup-cart.liquid` o `product-cart.liquid`.

- [ ] **Step 7: Commit**

```bash
git add snippets/cart.liquid snippets/popup-cart.liquid snippets/product-cart.liquid assets/custom.css tests/plastic-bag-cart.test.js
git commit -m "feat(cart): present plastic bag as required line"
```

---

### Task 5: Excluir la bolsa de todos los contadores del tema

**Files:**
- Modify: `sections/header.liquid:1175-1176`
- Modify: `snippets/popup-cart.liquid:3`
- Modify: `assets/theme.js:3295-3301`
- Modify: `assets/custom.js:218-234,287-303`
- Test: `tests/plastic-bag-cart.test.js`

**Interfaces:**
- Consumes: `cart-merchandise-count` en Liquid y `PlasticBagCart.getMerchandiseCount(items, theme.plasticBag)` en JavaScript.
- Produces: contador consistente que excluye unidades de bolsa en carga inicial y actualizaciones Ajax.

- [ ] **Step 1: Añadir prueba fallida del contador Ajax**

Añadir una prueba donde 3 productos + 2 bolsas devuelvan 3 y donde configuración deshabilitada devuelva el total Shopify de 5 unidades. Ajustar `getMerchandiseCount` para que, con `enabled:false`, sume todas las cantidades.

- [ ] **Step 2: Ejecutar y confirmar el fallo del caso deshabilitado**

Run: `node --test tests/plastic-bag-cart.test.js`

Expected: FAIL hasta implementar el fallback deshabilitado.

- [ ] **Step 3: Cambiar contadores Liquid**

En `sections/header.liquid` capturar una vez el resultado de `cart-merchandise-count`, convertirlo con `plus: 0` y usarlo tanto en `data-js-cart-count-desktop` como en móvil y en la traducción `layout.header.cart_count`.

En `snippets/popup-cart.liquid` usar el mismo snippet para `general.popups.cart.count`.

- [ ] **Step 4: Cambiar contadores JavaScript existentes**

En `CartViewer.updateCounter()` de `assets/theme.js`, reemplazar `this.currentData.item_count` por `PlasticBagCart.getMerchandiseCount(this.currentData.items || [], theme.plasticBag)` cuando el módulo exista; conservar `item_count` como fallback seguro.

En las dos ramas de `assets/custom.js` que actualizan mobile/desktop, calcular una sola variable `visibleCartCount` con la misma función y usarla en texto y atributos. No duplicar la fórmula.

- [ ] **Step 5: Cargar el módulo antes de los consumidores**

Registrar `plastic-bag-cart.js` en `snippets/js-assets-loader.liquid` y asegurar que cargue antes de `custom.js`; para `theme.js`, incluirlo como script `defer` previo al cargador si el loader no garantiza dependencia. Verificar en navegador que `window.PlasticBagCart` existe antes de la primera actualización del carrito.

- [ ] **Step 6: Ejecutar pruebas**

Run: `node --test tests/plastic-bag-cart.test.js`

Expected: todas PASS.

Run: `shopify theme check --path .`

Expected: ningún error nuevo.

- [ ] **Step 7: Commit**

```bash
git add sections/header.liquid snippets/popup-cart.liquid assets/theme.js assets/custom.js snippets/js-assets-loader.liquid assets/plastic-bag-cart.js tests/plastic-bag-cart.test.js
git commit -m "fix(cart): exclude mandatory bag from item counters"
```

---

### Task 6: Añadir guardia de sincronización antes del checkout

**Files:**
- Modify: `assets/plastic-bag-cart.js`
- Modify: `snippets/cart.liquid:206-221`
- Modify: `snippets/popup-cart.liquid:82-93`
- Modify: `assets/custom.css`
- Test: `tests/plastic-bag-cart.test.js`

**Interfaces:**
- Consumes: `getBagState(items, theme.plasticBag)` y endpoint locale-aware `${window.Shopify.routes.root}cart.js`.
- Produces: `verifyCart() -> Promise<{valid:boolean, expected:number, actual:number, lines:number}>`; eventos `plastic-bag:checking`, `plastic-bag:valid`, `plastic-bag:invalid`; checkout forms protected without changing cart contents.

- [ ] **Step 1: Añadir pruebas fallidas del estado de validación**

Cubrir: carrito vacío válido con cero bolsas; 60.000 COP + dos bolsas en una línea válido; 60.000 + una bolsa inválido; 60.000 + tres inválido; dos líneas de una bolsa inválido; `enabled:false` válido sin consultar fórmula.

- [ ] **Step 2: Ejecutar y confirmar fallos**

Run: `node --test tests/plastic-bag-cart.test.js`

Expected: FAIL en los casos aún no soportados.

- [ ] **Step 3: Implementar verificación de solo lectura**

Añadir a `plastic-bag-cart.js`:

- `verifyCart(fetchImpl = window.fetch)`, que GETea la ruta locale-aware y llama `getBagState`;
- timeout de 5 segundos con `AbortController`;
- un único request en vuelo reutilizado por llamadas concurrentes;
- sin llamadas a `add.js`, `change.js` o `update.js`;
- eventos de estado en `document` solo en navegador.

- [ ] **Step 4: Proteger formularios de checkout del carrito y popup**

Añadir `data-plastic-bag-checkout` a ambos inputs `name="checkout"`, un contenedor `role="status" aria-live="polite" data-plastic-bag-status`, y manejar `submit` en fase capture:

1. Si el submitter no es checkout, no intervenir.
2. Si la función está desactivada, permitir.
3. Prevenir temporalmente el submit, deshabilitar botón y mostrar `Actualizando…`.
4. Ejecutar `verifyCart()`.
5. Si es válido, marcar el formulario con una bandera de un solo uso y reenviar usando `requestSubmit(submitter)`.
6. Si es inválido/error, no enviar; mostrar `No pudimos actualizar el valor de las bolsas. Intenta nuevamente.` y un botón `Reintentar`.

La validación de la app seguirá protegiendo checkout acelerado; esta guardia protege los formularios que controla el tema.

- [ ] **Step 5: Revalidar después de actualizaciones conocidas**

Escuchar `cart:updated` y `theme:cart::added`; actualizar el estado visual sin mutar el carrito. Después de reemplazos Ajax de popup/página, usar delegación de eventos sobre `document` para no perder listeners.

- [ ] **Step 6: Añadir estilos de estado**

Estilizar `data-plastic-bag-status` para loading/error, incluir foco visible del botón de reintento y respetar `prefers-reduced-motion`.

- [ ] **Step 7: Ejecutar pruebas y checks**

Run: `node --test tests/plastic-bag-cart.test.js`

Expected: todas PASS.

Run: `shopify theme check --path .`

Expected: ningún error nuevo.

- [ ] **Step 8: Commit**

```bash
git add assets/plastic-bag-cart.js snippets/cart.liquid snippets/popup-cart.liquid assets/custom.css tests/plastic-bag-cart.test.js
git commit -m "feat(cart): guard checkout while bag fee is unsynced"
```

---

### Task 7: Ejecutar QA integral en staging y preparar entrega

**Files:**
- Create: `docs/plastic-bag-fee/qa-results.md`
- Modify: `docs/plastic-bag-fee/merchant-configuration.md`

**Interfaces:**
- Consumes: app configurada, variante real, tema adaptado y matriz de casos.
- Produces: evidencia de aceptación, rollback practicado y decisión final `READY_FOR_PRODUCTION_REVIEW` o `BLOCKED`.

- [ ] **Step 1: Verificar estáticamente la rama**

Run: `node --test tests/plastic-bag-cart.test.js`

Expected: todos los tests PASS, 0 failures.

Run: `shopify theme check --path .`

Expected: 0 errores nuevos.

Run: `git diff --check supermu/staging...HEAD`

Expected: sin salida.

- [ ] **Step 2: Publicar solo al tema de staging/desarrollo**

Usar Shopify CLI con el ID explícito del tema no publicado, nunca `--live`. Primero pedir/confirmar el dominio `myshopify.com` y asignarlo a una variable específica; después listar temas:

```bash
SHOPIFY_STAGING_STORE='dominio-myshopify-confirmado-por-el-usuario.myshopify.com'
shopify theme list --store "$SHOPIFY_STAGING_STORE"
```

Reemplazar el valor de ejemplo de `SHOPIFY_STAGING_STORE` con el dominio literal confirmado antes de ejecutar. Copiar el ID que `theme list` marque como tema staging no publicado, asignarlo como número literal a `SHOPIFY_STAGING_THEME_ID` y ejecutar:

```bash
SHOPIFY_STAGING_THEME_ID='ID-numérico-copiado-de-theme-list'
shopify theme push --theme "$SHOPIFY_STAGING_THEME_ID" --store "$SHOPIFY_STAGING_STORE"
```

No ejecutar si cualquiera de las dos variables conserva el texto de ejemplo. Confirmar que el destino indique `unpublished`.

- [ ] **Step 3: Configurar el producto en el editor del tema staging**

Seleccionar el producto documentado en `plastic_bag_product`, mantener `plastic_bag_fee_enabled=false`, guardar y verificar que no cambia el storefront publicado. Activar solo cuando la regla de app esté aislada y lista para la misma sesión de QA.

- [ ] **Step 4: Ejecutar la matriz funcional**

Crear `docs/plastic-bag-fee/qa-results.md` y registrar fecha, navegador, dispositivo, subtotal, bolsas esperadas, bolsas observadas, cobro observado, checkout normal, checkout acelerado y enlace/captura de evidencia para:

```text
0 -> 0
1 -> 1
40000 -> 1
40001 -> 2
60000 -> 2
80000 -> 2
80001 -> 3
50000 con descuento de 15000 -> 2
```

Además probar reducción/aumento entre fronteras, carrito vacío, eliminación/manipulación de bolsa, duplicados, recarga durante sincronización, móvil, popup, `/checkout` directo, Shop Pay, correo, pedido, reembolso e informes.

- [ ] **Step 5: Probar fallo y rollback**

En entorno aislado, desactivar temporalmente la regla de app y confirmar que la guardia del tema evita el checkout normal cuando falta la bolsa. Reactivar la regla, confirmar recuperación y ejecutar el procedimiento `Pausa segura`. No ejecutar esta prueba contra compradores reales.

- [ ] **Step 6: Cerrar resultado**

Al final de `qa-results.md`, escribir exactamente uno:

```markdown
## Resultado
READY_FOR_PRODUCTION_REVIEW
```

solo si todos los criterios pasan; de lo contrario:

```markdown
## Resultado
BLOCKED
```

y enumerar fallos reproducibles. `READY_FOR_PRODUCTION_REVIEW` no autoriza publicar producción.

- [ ] **Step 7: Commit final**

```bash
git add docs/plastic-bag-fee/qa-results.md docs/plastic-bag-fee/merchant-configuration.md
git commit -m "test(cart): document plastic bag fee staging QA"
```

- [ ] **Step 8: Abrir PR contra staging**

```bash
git push supermu HEAD:codex/plastic-bag-fee
gh pr create --repo abelvictor11/Supermu_shopify_theme --base staging --head codex/plastic-bag-fee --title "feat(cart): enforce mandatory plastic bag fee" --body-file docs/plastic-bag-fee/qa-results.md
```

El PR debe permanecer sin merge si `qa-results.md` indica `BLOCKED`.
