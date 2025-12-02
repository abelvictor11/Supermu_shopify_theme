/**
 * Sistema de Selector de Unidades v3.0
 * Usa VARIANTS para cada presentación (Kilo, Libra, Unidad)
 * 
 * Flujo:
 * 1. Usuario selecciona presentación (Kilo/Libra/Unidad)
 * 2. Se cambia el variant seleccionado
 * 3. El precio se actualiza automáticamente
 * 4. Al agregar al carrito se usa el variant correcto con su precio
 * 
 * Configuración en Shopify:
 * - Crear opción "Presentación" con valores: Kilo, Libra, Unidad
 * - Cada variant tiene su precio correspondiente
 */

(function() {
  'use strict';
  
  console.log('[Unit Selector v3] Loading...');
  
  /**
   * Inicializar todos los selectores de unidades
   */
  function initUnitSelectors() {
    const selectors = document.querySelectorAll('.unit-selector:not([data-initialized])');
    
    if (selectors.length === 0) return;
    
    console.log(`[Unit Selector v3] Initializing ${selectors.length} selector(s)`);
    
    selectors.forEach(selector => {
      selector.setAttribute('data-initialized', 'true');
      
      const options = selector.querySelectorAll('.unit-selector__option');
      const unitInput = selector.querySelector('.unit-selector__selected-unit');
      const context = selector.dataset.context || 'pdp';
      const useVariants = selector.dataset.useVariants === 'true';
      const productId = selector.dataset.productId;
      
      console.log(`[Unit Selector v3] Context: ${context}, UseVariants: ${useVariants}, Product: ${productId}`);
      
      // Manejar clic en opciones
      options.forEach(option => {
        option.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // No hacer nada si está deshabilitado
          if (this.disabled) return;
          
          // Remover active de todas las opciones
          options.forEach(opt => opt.classList.remove('active'));
          
          // Activar opción seleccionada
          this.classList.add('active');
          
          // Obtener datos de la opción
          const unit = this.dataset.unit;
          const newVariantId = this.dataset.variantId;
          const price = parseFloat(this.dataset.price);
          
          // Capitalizar nombre de unidad
          const unitName = unit.charAt(0).toUpperCase() + unit.slice(1);
          
          // Actualizar input oculto de presentación
          if (unitInput) unitInput.value = unitName;
          
          console.log(`[Unit Selector v3] Selected: ${unitName}, Variant: ${newVariantId}, Price: $${price/100}`);
          
          if (useVariants && newVariantId) {
            // Cambiar el variant
            changeVariant(selector, newVariantId, price, context);
          }
        });
      });
      
      // Si es PDP, asegurar que el input de presentación esté en el form
      if (context === 'pdp') {
        const initialUnit = unitInput ? unitInput.value : 'Kilo';
        copyPropertyToForm(initialUnit);
      }
    });
  }
  
  /**
   * Cambiar el variant seleccionado
   */
  function changeVariant(selector, variantId, price, context) {
    console.log(`[Unit Selector v3] Changing variant to: ${variantId}`);
    
    // Actualizar el data-variant-id del selector
    selector.dataset.variantId = variantId;
    
    if (context === 'pdp') {
      // En PDP: actualizar el input hidden del form y disparar evento
      const form = document.querySelector('form[data-type="add-to-cart-form"]');
      if (form) {
        // Actualizar input de variant ID
        const variantInput = form.querySelector('input[name="id"]');
        if (variantInput) {
          variantInput.value = variantId;
          console.log(`[Unit Selector v3] Updated form variant input to: ${variantId}`);
        }
        
        // Actualizar precio mostrado
        updateDisplayedPrice(price, context, selector);
        
        // Disparar evento de cambio de variant para que el tema actualice
        const event = new CustomEvent('variant:change', {
          detail: { variant: { id: variantId, price: price } }
        });
        document.dispatchEvent(event);
        
        // También intentar actualizar via el sistema del tema
        if (window.theme && window.theme.Product) {
          // Buscar el select de variants y cambiarlo
          const variantSelect = form.querySelector('select[name="id"]');
          if (variantSelect) {
            variantSelect.value = variantId;
            variantSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }
    } else {
      // En colección: actualizar el data-variant-id del contenedor .acciones
      const productCard = selector.closest('product-item') || selector.closest('.product-collection');
      if (productCard) {
        const acciones = productCard.querySelector('.acciones');
        if (acciones) {
          acciones.setAttribute('data-variant-id', variantId);
          console.log(`[Unit Selector v3] Updated .acciones variant to: ${variantId}`);
        }
        
        // Actualizar precio mostrado en la card
        updateDisplayedPrice(price, context, selector);
      }
    }
  }
  
  /**
   * Copiar la propiedad de presentación al formulario del PDP
   */
  function copyPropertyToForm(unitName) {
    const form = document.querySelector('form[data-type="add-to-cart-form"]');
    if (!form) return;
    
    let propInput = form.querySelector('input[name="properties[Presentación]"]');
    
    if (!propInput) {
      propInput = document.createElement('input');
      propInput.type = 'hidden';
      propInput.name = 'properties[Presentación]';
      form.appendChild(propInput);
      console.log('[Unit Selector v3] Created property input in form');
    }
    
    propInput.value = unitName;
    console.log(`[Unit Selector v3] Set form property: Presentación = ${unitName}`);
  }
  
  /**
   * Actualizar precio mostrado
   */
  function updateDisplayedPrice(price, context, selector) {
    const formattedPrice = formatMoney(price);
    
    if (context === 'pdp') {
      // Buscar precio en PDP
      const pdpPrice = document.querySelector('[data-js-product-price] span');
      if (pdpPrice) {
        pdpPrice.textContent = formattedPrice;
        console.log(`[Unit Selector v3] Updated PDP price: ${formattedPrice}`);
      }
    } else {
      // Buscar precio en la card de colección
      const card = selector.closest('product-item') || selector.closest('.product-collection');
      if (card) {
        const cardPrice = card.querySelector('.product-collection__price .price');
        if (cardPrice) {
          cardPrice.textContent = formattedPrice;
          console.log(`[Unit Selector v3] Updated card price: ${formattedPrice}`);
        }
      }
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
   * Obtener el variant seleccionado del selector para un producto
   */
  function getSelectedVariantData(productId) {
    let selector = null;
    
    if (productId) {
      selector = document.querySelector(`.unit-selector[data-product-id="${productId}"]`);
    }
    
    if (!selector) {
      selector = document.querySelector('.unit-selector');
    }
    
    if (!selector) {
      return null;
    }
    
    const activeOption = selector.querySelector('.unit-selector__option.active');
    if (!activeOption) return null;
    
    return {
      variantId: activeOption.dataset.variantId,
      unit: activeOption.dataset.unit,
      price: parseFloat(activeOption.dataset.price)
    };
  }
  
  /**
   * Interceptar fetch para asegurar que se use el variant correcto
   */
  function interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async function(url, options) {
      if (typeof url === 'string' && url.includes('/cart/add')) {
        
        if (options && options.body) {
          try {
            let body;
            let isJSON = false;
            
            if (typeof options.body === 'string') {
              body = JSON.parse(options.body);
              isJSON = true;
            }
            
            if (body) {
              let modified = false;
              
              // Procesar items array
              if (body.items && Array.isArray(body.items)) {
                body.items.forEach(item => {
                  // Buscar si hay un selector para este producto
                  const selector = findSelectorForVariant(item.id);
                  if (selector) {
                    const activeOption = selector.querySelector('.unit-selector__option.active');
                    if (activeOption) {
                      const correctVariantId = activeOption.dataset.variantId;
                      const unitName = activeOption.dataset.unit;
                      
                      // Cambiar al variant correcto si es diferente
                      if (correctVariantId && correctVariantId !== String(item.id)) {
                        console.log(`[Unit Selector v3] Fetch: Changing variant ${item.id} → ${correctVariantId}`);
                        item.id = parseInt(correctVariantId);
                        modified = true;
                      }
                      
                      // Agregar propiedad de presentación
                      item.properties = item.properties || {};
                      item.properties['Presentación'] = unitName.charAt(0).toUpperCase() + unitName.slice(1);
                      modified = true;
                    }
                  }
                });
              }
              
              if (modified && isJSON) {
                options.body = JSON.stringify(body);
                console.log('[Unit Selector v3] Modified fetch body:', body);
              }
            }
          } catch (err) {
            console.warn('[Unit Selector v3] Error parsing fetch body:', err);
          }
        }
      }
      
      return originalFetch.apply(this, arguments);
    };
    
    console.log('[Unit Selector v3] Intercepted fetch API');
  }
  
  /**
   * Buscar el selector que contiene un variant específico
   */
  function findSelectorForVariant(variantId) {
    const vid = String(variantId);
    
    // Buscar en todos los selectores
    const selectors = document.querySelectorAll('.unit-selector');
    for (const selector of selectors) {
      // Verificar si alguna opción tiene este variant
      const options = selector.querySelectorAll('.unit-selector__option');
      for (const opt of options) {
        if (opt.dataset.variantId === vid) {
          return selector;
        }
      }
      
      // También verificar el data-variant-id del selector
      if (selector.dataset.variantId === vid) {
        return selector;
      }
    }
    
    // Buscar por product-item
    const acciones = document.querySelector(`.acciones[data-variant-id="${vid}"]`);
    if (acciones) {
      const productCard = acciones.closest('product-item') || acciones.closest('.product-collection');
      if (productCard) {
        return productCard.querySelector('.unit-selector');
      }
    }
    
    return null;
  }
  
  /**
   * Inicializar sistema
   */
  function init() {
    console.log('[Unit Selector v3] Initializing...');
    
    // Inicializar selectores existentes
    initUnitSelectors();
    
    // Interceptar fetch
    interceptFetch();
    
    // Observar DOM para nuevos selectores
    const observer = new MutationObserver(function(mutations) {
      let shouldInit = false;
      
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              if (node.classList && node.classList.contains('unit-selector')) {
                shouldInit = true;
              } else if (node.querySelector && node.querySelector('.unit-selector:not([data-initialized])')) {
                shouldInit = true;
              }
            }
          });
        }
      });
      
      if (shouldInit) {
        console.log('[Unit Selector v3] New selectors detected');
        initUnitSelectors();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[Unit Selector v3] Ready!');
  }
  
  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
