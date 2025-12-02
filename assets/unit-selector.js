/**
 * Sistema de Selector de Unidades
 * Permite vender productos por kilo, libra o unidad con un solo SKU
 * Convierte automáticamente a kilos para integración con SIESA
 */

(function() {
  'use strict';
  
  // Configuración de conversión
  const CONVERSIONS = {
    kg: 1,
    lb: 0.45359,  // 1 libra = 0.45359 kg
    unidad: null  // Se obtiene del metafield unit_weight
  };
  
  /**
   * Inicializar selectores de unidades
   */
  function initUnitSelectors() {
    const selectors = document.querySelectorAll('.unit-selector');
    
    selectors.forEach(selector => {
      const options = selector.querySelectorAll('.unit-selector__option');
      const unitInput = selector.querySelector('.unit-selector__selected-unit');
      const multiplierInput = selector.querySelector('.unit-selector__selected-multiplier');
      const pricePerKilo = parseFloat(selector.dataset.pricePerKilo) || 0;
      const variantId = selector.dataset.variantId;
      
      if (!variantId) {
        console.warn('[Unit Selector] No variant ID found');
        return;
      }
      
      // Manejar clic en opciones
      options.forEach(option => {
        option.addEventListener('click', function() {
          // Remover active de todas las opciones
          options.forEach(opt => opt.classList.remove('active'));
          
          // Activar opción seleccionada
          this.classList.add('active');
          
          // Actualizar inputs ocultos
          const unit = this.dataset.unit;
          const multiplier = this.dataset.multiplier;
          
          if (unitInput) unitInput.value = unit;
          if (multiplierInput) multiplierInput.value = multiplier;
          
          // Actualizar precio mostrado del producto
          updateProductPrice(variantId, multiplier, pricePerKilo);
          
          console.log(`[Unit Selector] Selected: ${unit} (×${multiplier})`);
        });
      });
    });
  }
  
  /**
   * Actualizar precio mostrado del producto
   */
  function updateProductPrice(variantId, multiplier, pricePerKilo) {
    const mult = parseFloat(multiplier);
    const basePrice = parseFloat(pricePerKilo);
    
    if (isNaN(mult) || isNaN(basePrice)) return;
    
    // Calcular nuevo precio
    const newPrice = Math.round(basePrice * mult);
    
    console.log(`[Unit Selector] Updating price: ${basePrice} × ${mult} = ${newPrice}`);
    
    // Buscar el precio en el PDP (tiene data-js-product-price)
    const pdpPriceElement = document.querySelector('[data-js-product-price] span');
    if (pdpPriceElement) {
      const formattedPrice = formatMoney(newPrice);
      pdpPriceElement.textContent = formattedPrice;
      console.log(`[Unit Selector] Updated PDP price to ${formattedPrice}`);
    }
    
    // Buscar el precio en tarjetas de colección
    const productCard = document.querySelector(`[data-variant-id="${variantId}"]`);
    if (productCard) {
      const collectionPriceElement = productCard.querySelector('.product-collection__price .price');
      if (collectionPriceElement) {
        const formattedPrice = formatMoney(newPrice);
        collectionPriceElement.textContent = formattedPrice;
        console.log(`[Unit Selector] Updated collection card price to ${formattedPrice}`);
      }
    }
    
    // Actualizar PUM
    updatePUM(newPrice, mult);
  }
  
  /**
   * Actualizar PUM (Precio por Unidad de Medida)
   */
  function updatePUM(price, multiplier) {
    // Buscar todos los PUM en la página (puede haber varios)
    const pumElements = document.querySelectorAll('.custom-pum');
    if (pumElements.length === 0) {
      console.log('[Unit Selector] No PUM elements found');
      return;
    }
    
    const mult = parseFloat(multiplier);
    
    // Precio en centavos, necesitamos en pesos
    const priceInPesos = price / 100;
    
    // PUM siempre debe mostrar el precio por kilo (base)
    // Cuando seleccionamos libra, el precio mostrado es menor
    // pero el PUM debe seguir mostrando el precio por kilo
    const pricePerKg = priceInPesos / mult;
    
    console.log(`[Unit Selector] PUM: $${priceInPesos} / ${mult} = $${pricePerKg.toFixed(2)}/kg`);
    
    pumElements.forEach(pumElement => {
      // Buscar el span con clase pum-price
      const pumPriceSpan = pumElement.querySelector('.pum-price');
      if (pumPriceSpan) {
        pumPriceSpan.textContent = ` $${pricePerKg.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} /kg`;
        console.log(`[Unit Selector] Updated PUM to $${pricePerKg.toFixed(0)}/kg`);
      }
    });
  }
  
  /**
   * Formatear dinero (COP)
   */
  function formatMoney(cents) {
    const amount = cents / 100;
    return `$${amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  }
  
  /**
   * Interceptar add-to-cart para convertir cantidad a kilos
   */
  function interceptAddToCart() {
    const originalUpdateCart = window.updateCart;
    const originalChangeCartQuantity = window.changeCartQuantity;
    
    // Wrapper para updateCart (colecciones)
    if (typeof originalUpdateCart === 'function') {
      window.updateCart = async function(variantId, quantity, container) {
        const convertedQuantity = convertToKilos(variantId, quantity);
        console.log(`[Unit Selector] updateCart - Converting ${quantity} → ${convertedQuantity} kg`);
        return originalUpdateCart.call(this, variantId, convertedQuantity, container);
      };
    }
    
    // Wrapper para changeCartQuantity (colecciones)
    if (typeof originalChangeCartQuantity === 'function') {
      window.changeCartQuantity = async function(variantId, quantity, container) {
        const convertedQuantity = convertToKilos(variantId, quantity);
        console.log(`[Unit Selector] changeCartQuantity - Converting ${quantity} → ${convertedQuantity} kg`);
        return originalChangeCartQuantity.call(this, variantId, convertedQuantity, container);
      };
    }
    
    // Interceptar form submit del PDP
    document.addEventListener('submit', function(e) {
      const form = e.target;
      
      // Solo interceptar forms de add-to-cart
      if (form.getAttribute('data-type') !== 'add-to-cart-form') return;
      
      // Buscar selector de unidades en la página
      const unitSelector = document.querySelector('.unit-selector');
      if (!unitSelector) return;
      
      // Obtener multiplicador
      const multiplierInput = unitSelector.querySelector('.unit-selector__selected-multiplier');
      const multiplier = multiplierInput ? parseFloat(multiplierInput.value) : 1;
      
      // Si es kilo (multiplicador = 1), no hacer nada
      if (multiplier === 1) return;
      
      // Obtener input de cantidad
      const quantityInput = form.querySelector('input[name="quantity"]');
      if (!quantityInput) return;
      
      const originalQuantity = parseFloat(quantityInput.value) || 1;
      const convertedQuantity = originalQuantity * multiplier;
      
      console.log(`[Unit Selector] Form submit - Converting ${originalQuantity} → ${convertedQuantity} kg`);
      
      // Modificar la cantidad en el form
      quantityInput.value = convertedQuantity;
    }, true); // useCapture = true para interceptar antes
    
    // Interceptar fetch API para /cart/add.js
    const originalFetch = window.fetch;
    window.fetch = async function(url, options) {
      // Solo interceptar llamadas a /cart/add.js
      if (typeof url === 'string' && url.includes('/cart/add')) {
        const unitSelector = document.querySelector('.unit-selector');
        if (unitSelector) {
          const multiplierInput = unitSelector.querySelector('.unit-selector__selected-multiplier');
          const multiplier = multiplierInput ? parseFloat(multiplierInput.value) : 1;
          
          if (multiplier !== 1 && options && options.body) {
            try {
              let body;
              if (typeof options.body === 'string') {
                body = JSON.parse(options.body);
              } else if (options.body instanceof FormData) {
                // Convertir FormData a objeto
                body = {};
                for (let [key, value] of options.body.entries()) {
                  body[key] = value;
                }
              }
              
              if (body && body.quantity) {
                const originalQty = parseFloat(body.quantity);
                const convertedQty = originalQty * multiplier;
                body.quantity = convertedQty;
                
                console.log(`[Unit Selector] Fetch /cart/add - Converting ${originalQty} → ${convertedQty} kg`);
                
                if (typeof options.body === 'string') {
                  options.body = JSON.stringify(body);
                } else if (options.body instanceof FormData) {
                  const newFormData = new FormData();
                  for (let key in body) {
                    newFormData.append(key, body[key]);
                  }
                  options.body = newFormData;
                }
              }
            } catch (err) {
              console.warn('[Unit Selector] Error parsing fetch body:', err);
            }
          }
        }
      }
      
      return originalFetch.apply(this, arguments);
    };
    
    // Interceptar XMLHttpRequest para /cart/add.js
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._unitSelectorUrl = url;
      return originalXHROpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function(body) {
      if (this._unitSelectorUrl && this._unitSelectorUrl.includes('/cart/add')) {
        const unitSelector = document.querySelector('.unit-selector');
        if (unitSelector) {
          const multiplierInput = unitSelector.querySelector('.unit-selector__selected-multiplier');
          const multiplier = multiplierInput ? parseFloat(multiplierInput.value) : 1;
          
          if (multiplier !== 1 && body) {
            try {
              let parsed;
              if (typeof body === 'string') {
                // URL encoded o JSON
                if (body.includes('quantity=')) {
                  // URL encoded
                  const params = new URLSearchParams(body);
                  const originalQty = parseFloat(params.get('quantity')) || 1;
                  const convertedQty = originalQty * multiplier;
                  params.set('quantity', convertedQty);
                  body = params.toString();
                  console.log(`[Unit Selector] XHR /cart/add - Converting ${originalQty} → ${convertedQty} kg`);
                } else {
                  // JSON
                  parsed = JSON.parse(body);
                  if (parsed.quantity) {
                    const originalQty = parseFloat(parsed.quantity);
                    const convertedQty = originalQty * multiplier;
                    parsed.quantity = convertedQty;
                    body = JSON.stringify(parsed);
                    console.log(`[Unit Selector] XHR /cart/add - Converting ${originalQty} → ${convertedQty} kg`);
                  }
                }
              }
            } catch (err) {
              console.warn('[Unit Selector] Error parsing XHR body:', err);
            }
          }
        }
      }
      
      return originalXHRSend.call(this, body);
    };
  }
  
  /**
   * Convertir cantidad a kilos según unidad seleccionada
   */
  function convertToKilos(variantId, quantity) {
    const selector = document.querySelector(`[data-variant-id="${variantId}"] .unit-selector`);
    
    if (!selector) {
      // Si no hay selector, retornar cantidad original
      return quantity;
    }
    
    const multiplierInput = selector.querySelector('.unit-selector__selected-multiplier');
    const multiplier = multiplierInput ? parseFloat(multiplierInput.value) : 1;
    
    // Convertir: cantidad × multiplicador = kilos
    const kilos = quantity * multiplier;
    
    return kilos;
  }
  
  /**
   * Inicializar sistema
   */
  function init() {
    console.log('[Unit Selector] Initializing...');
    
    // Inicializar selectores
    initUnitSelectors();
    
    // Interceptar funciones de carrito
    interceptAddToCart();
    
    console.log('[Unit Selector] Ready');
  }
  
  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Re-inicializar cuando se agreguen productos dinámicamente
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        const hasUnitSelector = Array.from(mutation.addedNodes).some(node => 
          node.querySelector && node.querySelector('.unit-selector')
        );
        
        if (hasUnitSelector) {
          console.log('[Unit Selector] New products detected, re-initializing...');
          initUnitSelectors();
        }
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
})();
