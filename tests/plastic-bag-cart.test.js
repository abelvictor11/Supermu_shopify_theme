const test = require('node:test');
const assert = require('node:assert/strict');
const Bag = require('../assets/plastic-bag-cart.js');

// Montos en centavos (COP × 100): bolsa 200 COP = 20000; bloque 40.000 COP = 4000000.
const config = { enabled: true, productId: 99, variantId: 999, unitPrice: 20000, blockSize: 4000000 };
const line = (productId, variantId, quantity, originalLinePrice) => ({
  product_id: productId,
  variant_id: variantId,
  quantity,
  original_line_price: originalLinePrice
});

test('identifica la bolsa por variant id numérico (no por título)', () => {
  assert.equal(Bag.isBagItem(line(99, 999, 2, 40000), config), true);
  assert.equal(Bag.isBagItem(line(1, 10, 1, 20000), config), false);
});

test('identifica la bolsa aunque product_id y variant_id lleguen como string', () => {
  assert.equal(Bag.isBagItem(line('1', '999', 1, 20000), config), true);
});

test('excluye la bolsa del contador de mercancía', () => {
  assert.equal(
    Bag.getMerchandiseCount([line(1, 10, 3, 6000000), line(99, 999, 2, 40000)], config),
    3
  );
});

test('con la función desactivada, el contador suma todas las unidades', () => {
  const disabled = Object.assign({}, config, { enabled: false });
  assert.equal(
    Bag.getMerchandiseCount([line(1, 10, 3, 6000000), line(99, 999, 2, 40000)], disabled),
    5
  );
});

test('usa precios originales y redondea hacia arriba cada bloque iniciado de 40.000 COP', () => {
  const cases = [[0, 0], [100, 1], [4000000, 1], [4000100, 2], [6000000, 2], [8000000, 2], [8000100, 3]];
  for (const [subtotalCents, expected] of cases) {
    const items = subtotalCents ? [line(1, 10, 1, subtotalCents), line(99, 999, 7, 140000)] : [];
    assert.equal(Bag.getExpectedQuantity(items, config), expected, `subtotal ${subtotalCents}`);
  }
});

test('los descuentos no cambian la cantidad: 50.000 original con 15.000 de descuento => 2 bolsas', () => {
  // original_line_price refleja el precio ANTES de descuentos (50.000 COP).
  const items = [line(1, 10, 1, 5000000)];
  assert.equal(Bag.getExpectedQuantity(items, config), 2);
});

test('reporta la cantidad exacta de bolsa y detecta duplicados', () => {
  assert.deepEqual(
    Bag.getBagState([
      line(1, 10, 1, 6000000),
      line(99, 999, 1, 20000),
      line(99, 999, 1, 20000)
    ], config),
    { expected: 2, actual: 2, lines: 2, valid: false }
  );
});

test('getBagState válido con una sola línea y cantidad correcta', () => {
  assert.deepEqual(
    Bag.getBagState([line(1, 10, 1, 6000000), line(99, 999, 2, 40000)], config),
    { expected: 2, actual: 2, lines: 1, valid: true }
  );
});

// ---- getSyncAction: decisiones de mutación del modo solo-tema ----

test('sync: carrito vacío => none', () => {
  assert.deepEqual(Bag.getSyncAction([], config), { op: 'none', quantity: 0 });
});

test('sync: mercancía sin bolsa => add con la cantidad esperada', () => {
  assert.deepEqual(
    Bag.getSyncAction([line(1, 10, 1, 6000000)], config),
    { op: 'add', quantity: 2 }
  );
});

test('sync: bolsa con cantidad incorrecta => update', () => {
  assert.deepEqual(
    Bag.getSyncAction([line(1, 10, 1, 6000000), line(99, 999, 1, 20000)], config),
    { op: 'update', quantity: 2 }
  );
});

test('sync: solo quedaba la bolsa (mercancía en 0) => remove', () => {
  assert.deepEqual(
    Bag.getSyncAction([line(99, 999, 3, 60000)], config),
    { op: 'remove', quantity: 0 }
  );
});

test('sync: cantidad ya correcta => none', () => {
  assert.deepEqual(
    Bag.getSyncAction([line(1, 10, 1, 6000000), line(99, 999, 2, 40000)], config),
    { op: 'none', quantity: 2 }
  );
});

test('sync: líneas de bolsa duplicadas => reset', () => {
  assert.deepEqual(
    Bag.getSyncAction([
      line(1, 10, 1, 6000000),
      line(99, 999, 1, 20000),
      line(99, 999, 1, 20000)
    ], config),
    { op: 'reset', quantity: 2 }
  );
});

test('sync: función desactivada => none (nunca muta)', () => {
  const disabled = Object.assign({}, config, { enabled: false });
  assert.deepEqual(
    Bag.getSyncAction([line(1, 10, 1, 6000000)], disabled),
    { op: 'none', quantity: 0 }
  );
});
