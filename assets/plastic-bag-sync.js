/**
 * Plastic Bag Sync — capa Ajax del cobro obligatorio de bolsa (modo solo-tema).
 *
 * Reutiliza la instancia de carrito del tema (`theme.cart`, un CartController)
 * para leer, mutar y re-renderizar el carrito, de modo que drawer, página de
 * carrito y contadores queden consistentes sin lógica de render propia.
 *
 * En cada cambio del carrito recalcula la cantidad esperada de bolsa con
 * `window.PlasticBagCart.getSyncAction()` y aplica add/change según haga falta.
 * Un lock (`busy`) evita reentradas; las mutaciones que hace aquí NO disparan
 * los eventos que escuchamos, así que no hay bucle.
 *
 * Depende de: `assets/plastic-bag-cart.js` (window.PlasticBagCart) y de la
 * config emitida en `snippets/js-assets-loader.liquid` como `theme.plasticBag`.
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  // El carrito del tema se inicializa vía un module-loader asíncrono; esperamos
  // a que `theme.cart` y el módulo puro existan antes de sincronizar.
  function whenCartReady(cb, triesLeft) {
    triesLeft = triesLeft == null ? 120 : triesLeft;
    var cartReady = window.theme && theme.Cart &&
      typeof theme.Cart.updateData === 'function' &&
      typeof theme.Cart.updateCart === 'function';
    if (cartReady && window.PlasticBagCart) {
      cb();
    } else if (triesLeft > 0) {
      setTimeout(function () { whenCartReady(cb, triesLeft - 1); }, 100);
    }
  }

  ready(function () {
    var cfg = (window.theme && theme.plasticBag) || null;
    if (!cfg || !cfg.enabled || !cfg.variantId) {
      return; // función desactivada o sin producto configurado
    }

    var Bag = window.PlasticBagCart;
    var busy = false;
    var queued = false;

    // IMPORTANTE: /cart/change.js exige el id como STRING de dígitos (o line key);
    // un id numérico devuelve 400 y el cambio falla en silencio. add.js sí acepta número.
    var variantIdStr = String(cfg.variantId);

    function request(path, payload) {
      return fetch(theme.Cart.rootURL + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (response) {
        if (!response.ok) return response.text().then(function (message) {
          throw new Error('Shopify HTTP ' + response.status + ': ' + message);
        });
        return response.json();
      });
    }

    function readCart() {
      return fetch(theme.Cart.rootURL + '.js', { cache: 'no-store' })
        .then(function (response) {
          if (!response.ok) throw new Error('Cart HTTP ' + response.status);
          return response.json();
        }).then(function (data) {
          theme.Cart.setCurrentData(data);
          return data;
        });
    }

    function applyAction(action, items) {
      if (action.op === 'add') {
        return request('/add.js', { items: [{ id: variantIdStr, quantity: action.quantity }] });
      }
      var lines = items.filter(function (item) { return Bag.isBagItem(item, cfg); });
      if (action.op === 'update' || action.op === 'remove') {
        return request('/change.js', { id: lines[0].key || variantIdStr, quantity: action.quantity });
      }
      if (action.op === 'reset') {
        return lines.reduce(function (previous, line) {
          return previous.then(function () {
            return request('/change.js', { id: line.key || variantIdStr, quantity: 0 });
          });
        }, Promise.resolve()).then(function () {
          return action.quantity > 0
            ? request('/add.js', { items: [{ id: variantIdStr, quantity: action.quantity }] })
            : null;
        });
      }
      return Promise.resolve();
    }

    function cartReady() {
      return window.theme && theme.Cart &&
        typeof theme.Cart.updateData === 'function' &&
        typeof theme.Cart.updateCart === 'function';
    }

    function reconcile() {
      if (busy) { queued = true; return Promise.resolve(); }
      if (!cartReady()) return Promise.resolve();
      busy = true;
      var changed = false;
      function ensureCorrect(retries) {
        return readCart().then(function (cart) {
          var items = cart.items || [];
          var action = Bag.getSyncAction(items, cfg);
          if (action.op === 'none') return;
          if (retries === 0) throw new Error('Bolsa desajustada después de tres intentos');
          changed = true;
          return applyAction(action, items).then(function () {
            return ensureCorrect(retries - 1);
          });
        });
      }
      return ensureCorrect(3)
        .then(function () {
          if (!changed) return;
          return theme.Cart.updateCart().then(function () {
            if (typeof window.updateCartSubtotal === 'function') {
              try { window.updateCartSubtotal(); } catch (error) {}
            }
          });
        })
        .catch(function (error) {
          if (window.console) console.error('[PlasticBag] error de sincronización:', error);
        })
        .then(function () {
          busy = false;
          updateCounters();
          if (queued) { queued = false; return reconcile(); }
        });
    }

    // El contador del header no debe incluir la bolsa. El tema lo pone en
    // item_count (con bolsa) en cada update Ajax; aquí lo corregimos.
    function updateCounters() {
      if (!theme.Cart || !theme.Cart.currentData) return;
      var items = theme.Cart.currentData.items || [];
      var count = Bag.getMerchandiseCount(items, cfg);
      var deskText = (window.theme && theme.strings && theme.strings.header &&
        theme.strings.header.cart_count_desktop)
        ? theme.strings.header.cart_count_desktop.replace('{{ count }}', count)
        : String(count);
      document.querySelectorAll('[data-js-cart-count-desktop]').forEach(function (el) {
        el.setAttribute('data-js-cart-count-desktop', count);
        el.innerHTML = deskText;
      });
      document.querySelectorAll('[data-js-cart-count-mobile]').forEach(function (el) {
        el.setAttribute('data-js-cart-count-mobile', count);
        el.textContent = String(count);
      });
    }

    var schedule = (window.theme && typeof theme.debounce === 'function')
      ? theme.debounce(reconcile, 200)
      : function () { setTimeout(reconcile, 200); };

    // Corregir el contador también justo después de los eventos del tema
    // (su handler lo pone con bolsa antes de que corra reconcile).
    var scheduleCounter = function () { setTimeout(updateCounters, 250); };

    // Cambios de carrito hechos por el tema:
    document.addEventListener('cart:updated', function () { schedule(); scheduleCounter(); });
    document.addEventListener('theme:cart::added', function () { schedule(); scheduleCounter(); });
    document.addEventListener('theme:cart::removed', function () { schedule(); scheduleCounter(); });
    document.addEventListener('theme:cart::quantity-changed', function () { schedule(); scheduleCounter(); });

    // Sincronización inicial: carrito que ya tenía productos sin bolsa, o cuya
    // cantidad quedó desfasada respecto a la fórmula.
    whenCartReady(reconcile);

    // Expuesto para pruebas manuales desde la consola.
    window.PlasticBagSync = { reconcile: reconcile };
  });
})();
