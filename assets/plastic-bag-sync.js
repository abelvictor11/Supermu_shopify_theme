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

    function applyAction(action) {
      if (action.op === 'add') {
        return theme.Cart.addItems([{ id: cfg.variantId, quantity: action.quantity }]);
      }
      if (action.op === 'update' || action.op === 'remove') {
        return theme.Cart.changeItemById(variantIdStr, action.quantity);
      }
      if (action.op === 'reset') {
        // Caso raro (líneas duplicadas): limpiar y volver a fijar.
        return theme.Cart.changeItemById(variantIdStr, 0).then(function () {
          if (action.quantity > 0) {
            return theme.Cart.addItems([{ id: cfg.variantId, quantity: action.quantity }]);
          }
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
      // theme.Cart se instancia tarde (module loader async); si aún no está,
      // salir sin marcar busy para no quedar bloqueados.
      if (!cartReady()) { return Promise.resolve(); }
      busy = true;

      // Envolver updateData() en la cadena para que un throw síncrono se
      // convierta en promesa rechazada y busy siempre se libere.
      return Promise.resolve()
        .then(function () { return theme.Cart.updateData(); })
        .then(function () {
          var items = (theme.Cart.currentData && theme.Cart.currentData.items) || [];
          var action = Bag.getSyncAction(items, cfg);
          if (action.op === 'none') return null;
          return applyAction(action).then(function () {
            return theme.Cart.updateCart();
          }).then(function () {
            // La página de carrito corrige su subtotal con este helper propio;
            // tras un re-render Ajax hay que re-aplicarlo (no se re-ejecuta solo).
            if (typeof window.updateCartSubtotal === 'function') {
              try { window.updateCartSubtotal(); } catch (e) {}
            }
          });
        })
        .catch(function (error) {
          if (window.console) console.error('[PlasticBag] error de sincronización:', error);
        })
        .then(function () {
          busy = false;
          updateCounters();
          if (queued) { queued = false; reconcile(); }
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

    // Sincronización inicial: carrito que ya tenía productos sin bolsa, o cuya
    // cantidad quedó desfasada respecto a la fórmula.
    whenCartReady(reconcile);

    // Expuesto para pruebas manuales desde la consola.
    window.PlasticBagSync = { reconcile: reconcile };
  });
})();
