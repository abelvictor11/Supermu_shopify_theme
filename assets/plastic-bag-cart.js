/**
 * Plastic Bag Cart — lógica pura de la bolsa plástica obligatoria.
 *
 * Regla: por cada bloque iniciado de `blockSize` del subtotal ORIGINAL de
 * mercancía (antes de descuentos, sin la bolsa) se cobra una bolsa a
 * `unitPrice`. `cantidad = subtotal == 0 ? 0 : ceil(subtotal / blockSize)`.
 *
 * Todos los montos se manejan en centavos (COP × 100), igual que el Ajax
 * Cart API de Shopify (`original_line_price`). Config por defecto:
 *   { enabled, productId, variantId, unitPrice: 20000, blockSize: 4000000 }
 *
 * Este módulo NO toca el DOM ni hace peticiones Ajax: es lógica pura y
 * testeable con `node --test`. La capa de sincronización (Ajax) vive aparte
 * y consume `getSyncAction()`.
 *
 * UMD: exporta en CommonJS (tests) y en `window.PlasticBagCart` (tema).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PlasticBagCart = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function normId(value) {
    return String(value == null ? '' : value);
  }

  function isRealId(value) {
    var id = normId(value);
    return id !== '' && id !== '0';
  }

  // La bolsa se identifica por variant_id (preferido) y, como respaldo, por
  // product_id. Nunca por el título (el título es traducible/editable).
  function isBagItem(item, config) {
    if (!item || !config) return false;
    var variantId = config.variantId;
    var productId = config.productId;
    if (isRealId(variantId) && normId(item.variant_id) === normId(variantId)) {
      return true;
    }
    if (isRealId(productId) && normId(item.product_id) === normId(productId)) {
      return true;
    }
    return false;
  }

  // Suma de unidades de MERCANCÍA (excluye la bolsa) para el contador del
  // header. Con la función desactivada, cuenta todo (no hay concepto de bolsa).
  function getMerchandiseCount(items, config) {
    items = items || [];
    return items.reduce(function (sum, item) {
      if (config && config.enabled && isBagItem(item, config)) {
        return sum;
      }
      return sum + (Number(item.quantity) || 0);
    }, 0);
  }

  // Subtotal elegible: precios ORIGINALES de línea, excluyendo la bolsa.
  function getEligibleSubtotal(items, config) {
    items = items || [];
    return items.reduce(function (sum, item) {
      if (isBagItem(item, config)) {
        return sum;
      }
      return sum + (Number(item.original_line_price) || 0);
    }, 0);
  }

  function getExpectedQuantity(items, config) {
    if (!config || !config.enabled) return 0;
    var subtotal = getEligibleSubtotal(items, config);
    if (subtotal <= 0) return 0;
    var block = Number(config.blockSize) || 0;
    if (block <= 0) return 0;
    // Bolsas por valor: un bloque iniciado de `block`.
    var byValue = Math.ceil(subtotal / block);
    // Tope por capacidad real: ~1 bolsa por cada `unitsPerBag` unidades de
    // mercancía. Evita que 1 producto caro pida muchas bolsas.
    var unitsPerBag = Number(config.unitsPerBag) || 4;
    var units = getMerchandiseCount(items, config);
    var byUnits = Math.ceil(units / unitsPerBag);
    // La cantidad final es la MENOR de ambas (deben cumplirse a la vez).
    return Math.min(byValue, byUnits);
  }

  // Estado observado de la(s) línea(s) de bolsa vs. lo esperado.
  function getBagState(items, config) {
    items = items || [];
    var bagLines = items.filter(function (item) {
      return isBagItem(item, config);
    });
    var actual = bagLines.reduce(function (sum, item) {
      return sum + (Number(item.quantity) || 0);
    }, 0);
    var expected = getExpectedQuantity(items, config);
    var lines = bagLines.length;
    // Válido solo con exactamente una línea (o cero) y cantidad exacta.
    var valid = lines <= 1 && actual === expected;
    return { expected: expected, actual: actual, lines: lines, valid: valid };
  }

  // Decide qué mutación Ajax debe hacer el tema para dejar el carrito correcto.
  //   op: 'none'  -> ya está bien
  //       'add'   -> no hay bolsa y falta (quantity = esperado)
  //       'update'-> hay una bolsa con cantidad distinta (quantity = esperado)
  //       'remove'-> hay bolsa pero el esperado es 0
  //       'reset' -> hay líneas de bolsa duplicadas; limpiar y volver a fijar
  function getSyncAction(items, config) {
    if (!config || !config.enabled) return { op: 'none', quantity: 0 };
    var state = getBagState(items, config);
    if (state.lines > 1) {
      return { op: 'reset', quantity: state.expected };
    }
    if (state.expected === 0) {
      return state.actual === 0
        ? { op: 'none', quantity: 0 }
        : { op: 'remove', quantity: 0 };
    }
    if (state.actual === 0) {
      return { op: 'add', quantity: state.expected };
    }
    if (state.actual !== state.expected) {
      return { op: 'update', quantity: state.expected };
    }
    return { op: 'none', quantity: state.expected };
  }

  return {
    isBagItem: isBagItem,
    getMerchandiseCount: getMerchandiseCount,
    getEligibleSubtotal: getEligibleSubtotal,
    getExpectedQuantity: getExpectedQuantity,
    getBagState: getBagState,
    getSyncAction: getSyncAction
  };
});
