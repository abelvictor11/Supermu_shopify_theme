const test = require('node:test');
const assert = require('node:assert/strict');
const Bag = require('../assets/plastic-bag-cart.js');

// Montos en centavos (COP × 100): bolsa 200 COP = 20000; bloque 40.000 COP = 4000000.
// unitsPerBag por defecto = 4 (1 bolsa por cada 4 unidades de mercancía).
const config = { enabled: true, productId: 99, variantId: 999, unitPrice: 20000, blockSize: 4000000 };
const line = (productId, variantId, quantity, originalLinePrice) => ({
  product_id: productId, variant_id: variantId, quantity, original_line_price: originalLinePrice
});
const merch = (qty, olpCents) => line(1, 10, qty, olpCents);   // mercancía
const bag = (qty) => line(99, 999, qty, qty * 20000);          // bolsa

// ---- identificación / conteos ----
test('identifica la bolsa por variant id numérico (no por título)', () => {
  assert.equal(Bag.isBagItem(bag(2), config), true);
  assert.equal(Bag.isBagItem(merch(1, 20000), config), false);
});
test('identifica la bolsa aunque los ids lleguen como string', () => {
  assert.equal(Bag.isBagItem(line('1', '999', 1, 20000), config), true);
});
test('excluye la bolsa del contador de mercancía', () => {
  assert.equal(Bag.getMerchandiseCount([merch(3, 6000000), bag(2)], config), 3);
});
test('con la función desactivada, el contador suma todas las unidades', () => {
  const off = Object.assign({}, config, { enabled: false });
  assert.equal(Bag.getMerchandiseCount([merch(3, 6000000), bag(2)], off), 5);
});
test('subtotal elegible usa precios originales y excluye la bolsa', () => {
  assert.equal(Bag.getEligibleSubtotal([merch(1, 5000000), bag(7)], config), 5000000);
});

// ---- fórmula: min(ceil(valor/40k), ceil(uds/4)) — TABLA DEL CLIENTE ----
test('cantidad = min(por valor, por unidades) — tabla de casos', () => {
  const cases = [
    [merch(1, 16000000), 1],   // 1u  $160k -> valor 4, uds 1 => 1
    [merch(4, 16000000), 1],   // 4u  $160k -> valor 4, uds 1 => 1
    [merch(5, 16000000), 2],   // 5u  $160k -> valor 4, uds 2 => 2
    [merch(8, 16000000), 2],   // 8u  $160k -> valor 4, uds 2 => 2
    [merch(20, 8000000), 2],   // 20u $80k  -> valor 2, uds 5 => 2
    [merch(2, 2000000), 1],    // 2u  $20k  -> valor 1, uds 1 => 1
  ];
  for (const [item, exp] of cases) {
    assert.equal(Bag.getExpectedQuantity([item], config), exp, `caso ${item.quantity}u/${item.original_line_price}`);
  }
});
test('el tope por unidades evita que 1 producto caro pida muchas bolsas', () => {
  assert.equal(Bag.getExpectedQuantity([merch(1, 20000000)], config), 1); // 1u $200k => 1
});
test('carrito vacío => 0 bolsas', () => {
  assert.equal(Bag.getExpectedQuantity([], config), 0);
});
test('cualquier carrito no vacío lleva al menos 1 bolsa (incluso < $40k)', () => {
  assert.equal(Bag.getExpectedQuantity([merch(1, 100)], config), 1);      // $1
  assert.equal(Bag.getExpectedQuantity([merch(2, 2000000)], config), 1);  // $20k
});
test('la bolsa se excluye del cálculo (valor y unidades)', () => {
  assert.equal(Bag.getExpectedQuantity([merch(8, 16000000), bag(7)], config), 2);
});
test('unitsPerBag configurable', () => {
  const cfg2 = Object.assign({}, config, { unitsPerBag: 2 });
  // 5u $160k con 1 bolsa por cada 2 uds: valor 4, uds ceil(5/2)=3 => 3
  assert.equal(Bag.getExpectedQuantity([merch(5, 16000000)], cfg2), 3);
});

// ---- getBagState ----
test('getBagState válido: 8u $60k con 2 bolsas en 1 línea', () => {
  assert.deepEqual(Bag.getBagState([merch(8, 6000000), bag(2)], config),
    { expected: 2, actual: 2, lines: 1, valid: true });
});
test('getBagState detecta líneas de bolsa duplicadas', () => {
  assert.deepEqual(Bag.getBagState([merch(8, 6000000), bag(1), bag(1)], config),
    { expected: 2, actual: 2, lines: 2, valid: false });
});

// ---- getSyncAction ----
test('sync: carrito vacío => none', () => {
  assert.deepEqual(Bag.getSyncAction([], config), { op: 'none', quantity: 0 });
});
test('sync: mercancía sin bolsa => add', () => {
  assert.deepEqual(Bag.getSyncAction([merch(8, 6000000)], config), { op: 'add', quantity: 2 });
});
test('sync: bolsa con cantidad incorrecta => update', () => {
  assert.deepEqual(Bag.getSyncAction([merch(8, 6000000), bag(1)], config), { op: 'update', quantity: 2 });
});
test('sync: solo quedaba la bolsa => remove', () => {
  assert.deepEqual(Bag.getSyncAction([bag(3)], config), { op: 'remove', quantity: 0 });
});
test('sync: cantidad ya correcta => none', () => {
  assert.deepEqual(Bag.getSyncAction([merch(8, 6000000), bag(2)], config), { op: 'none', quantity: 2 });
});
test('sync: líneas duplicadas => reset', () => {
  assert.deepEqual(Bag.getSyncAction([merch(8, 6000000), bag(1), bag(1)], config), { op: 'reset', quantity: 2 });
});
test('sync: función desactivada => none', () => {
  const off = Object.assign({}, config, { enabled: false });
  assert.deepEqual(Bag.getSyncAction([merch(8, 6000000)], off), { op: 'none', quantity: 0 });
});
