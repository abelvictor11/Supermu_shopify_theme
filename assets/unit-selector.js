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
    // Buscar el PUM en el PDP o colección
    const pumElement = document.querySelector('.custom-pum');
    if (!pumElement) {
      console.log('[Unit Selector] No PUM element found');
      return;
    }
    
    const mult = parseFloat(multiplier);
    
    // Precio en centavos, necesitamos en pesos
    const priceInPesos = price / 100;
    
    // PUM = precio actual / multiplicador
    // Esto nos da el precio por kilo
    const pricePerKg = priceInPesos / mult;
    
    console.log(`[Unit Selector] PUM: $${priceInPesos} / ${mult} = $${pricePerKg.toFixed(2)}/kg`);
    
    // Buscar el span del precio dentro del PUM
    const pumPriceSpan = pumElement.querySelector('span:last-child');
    if (pumPriceSpan) {
      pumPriceSpan.textContent = ` $${pricePerKg.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} /kg`;
      console.log(`[Unit Selector] Updated PUM to $${pricePerKg.toFixed(0)}/kg`);
    }
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
        console.log(`[Unit Selector] Converting ${quantity} → ${convertedQuantity} kg`);
        return originalUpdateCart.call(this, variantId, convertedQuantity, container);
      };
    }
    
    // Wrapper para changeCartQuantity (colecciones)
    if (typeof originalChangeCartQuantity === 'function') {
      window.changeCartQuantity = async function(variantId, quantity, container) {
        const convertedQuantity = convertToKilos(variantId, quantity);
        console.log(`[Unit Selector] Converting ${quantity} → ${convertedQuantity} kg`);
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
      
      const originalQuantity = parseInt(quantityInput.value) || 1;
      const convertedQuantity = originalQuantity * multiplier;
      
      console.log(`[Unit Selector] PDP Form - Converting ${originalQuantity} → ${convertedQuantity} kg`);
      
      // Modificar la cantidad en el form
      quantityInput.value = convertedQuantity;
    }, true); // useCapture = true para interceptar antes
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
