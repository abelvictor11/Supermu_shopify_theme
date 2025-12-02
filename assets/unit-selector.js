/**
 * Sistema de Selector de Unidades v2.0
 * Permite vender productos por kilo, libra o unidad con un solo SKU
 * Envía la presentación seleccionada al carrito y a la orden
 * 
 * Flujo:
 * 1. Usuario selecciona presentación (Kilo/Libra/Unidad)
 * 2. Precio se actualiza dinámicamente
 * 3. PUM se recalcula (siempre muestra precio/kg)
 * 4. Al agregar al carrito:
 *    - Cantidad se convierte a kilos
 *    - Propiedad "Presentación" se envía al carrito
 * 5. En el carrito y orden se ve: "Presentación: Libra"
 */

(function() {
  'use strict';
  
  console.log('[Unit Selector v2] Loading...');
  
  // Nombres de presentación para mostrar en carrito
  const UNIT_NAMES = {
    kg: 'Kilo',
    lb: 'Libra',
    unidad: 'Unidad'
  };
  
  /**
   * Inicializar todos los selectores de unidades
   */
  function initUnitSelectors() {
    const selectors = document.querySelectorAll('.unit-selector:not([data-initialized])');
    
    if (selectors.length === 0) return;
    
    console.log(`[Unit Selector v2] Initializing ${selectors.length} selector(s)`);
    
    selectors.forEach(selector => {
      selector.setAttribute('data-initialized', 'true');
      
      const options = selector.querySelectorAll('.unit-selector__option');
      const unitInput = selector.querySelector('.unit-selector__selected-unit');
      const multiplierInput = selector.querySelector('.unit-selector__selected-multiplier');
      const priceInput = selector.querySelector('.unit-selector__selected-price');
      const pricePerKilo = parseFloat(selector.dataset.pricePerKilo) || 0;
      const variantId = selector.dataset.variantId;
      const context = selector.dataset.context || 'pdp';
      
      console.log(`[Unit Selector v2] Context: ${context}, Variant: ${variantId}, Price/kg: ${pricePerKilo}`);
      
      // Manejar clic en opciones
      options.forEach(option => {
        option.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // Remover active de todas las opciones
          options.forEach(opt => opt.classList.remove('active'));
          
          // Activar opción seleccionada
          this.classList.add('active');
          
          // Obtener datos de la opción
          const unit = this.dataset.unit;
          const multiplier = parseFloat(this.dataset.multiplier);
          const price = parseFloat(this.dataset.price);
          const unitName = UNIT_NAMES[unit] || unit;
          
          // Actualizar inputs ocultos
          if (unitInput) unitInput.value = unitName;
          if (multiplierInput) multiplierInput.value = multiplier;
          if (priceInput) priceInput.value = price;
          
          console.log(`[Unit Selector v2] Selected: ${unitName} (×${multiplier}) = $${price/100}`);
          
          // Actualizar precio mostrado
          updateDisplayedPrice(selector, price, context);
          
          // Actualizar PUM
          updatePUM(selector, pricePerKilo);
          
          // Si es PDP, copiar el input de presentación al formulario
          if (context === 'pdp') {
            copyPropertyToForm(unitName);
          }
        });
      });
      
      // Si es PDP, copiar el valor inicial al formulario
      if (context === 'pdp') {
        const initialUnit = unitInput ? unitInput.value : 'Kilo';
        copyPropertyToForm(initialUnit);
      }
    });
  }
  
  /**
   * Copiar la propiedad de presentación al formulario del PDP
   */
  function copyPropertyToForm(unitName) {
    const form = document.querySelector('form[data-type="add-to-cart-form"]');
    if (!form) return;
    
    // Buscar o crear el input de presentación dentro del form
    let propInput = form.querySelector('input[name="properties[Presentación]"]');
    
    if (!propInput) {
      propInput = document.createElement('input');
      propInput.type = 'hidden';
      propInput.name = 'properties[Presentación]';
      form.appendChild(propInput);
      console.log('[Unit Selector v2] Created property input in form');
    }
    
    propInput.value = unitName;
    console.log(`[Unit Selector v2] Set form property: Presentación = ${unitName}`);
  }
  
  /**
   * Actualizar precio mostrado
   */
  function updateDisplayedPrice(selector, price, context) {
    const formattedPrice = formatMoney(price);
    
    if (context === 'pdp') {
      // Buscar precio en PDP
      const pdpPrice = document.querySelector('[data-js-product-price] span');
      if (pdpPrice) {
        pdpPrice.textContent = formattedPrice;
        console.log(`[Unit Selector v2] Updated PDP price: ${formattedPrice}`);
      }
    } else {
      // Buscar precio en la card de colección
      const card = selector.closest('[data-variant-id]') || selector.closest('.product-collection');
      if (card) {
        const cardPrice = card.querySelector('.product-collection__price .price');
        if (cardPrice) {
          cardPrice.textContent = formattedPrice;
          console.log(`[Unit Selector v2] Updated card price: ${formattedPrice}`);
        }
      }
    }
  }
  
  /**
   * Actualizar PUM (siempre muestra precio por kilo)
   */
  function updatePUM(selector, pricePerKilo) {
    // Buscar PUM cercano al selector o en toda la página
    const container = selector.closest('[data-js-product]') || document;
    const pumElement = container.querySelector('.custom-pum');
    
    if (!pumElement) {
      console.log('[Unit Selector v2] No PUM element found');
      return;
    }
    
    const pricePerKg = pricePerKilo / 100;
    const formattedPUM = `$${pricePerKg.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    
    // Buscar span.pum-price o actualizar texto directamente
    const pumPriceSpan = pumElement.querySelector('.pum-price');
    if (pumPriceSpan) {
      pumPriceSpan.textContent = ` ${formattedPUM} /kg`;
      console.log(`[Unit Selector v2] Updated PUM: ${formattedPUM}/kg`);
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
   * Obtener datos del selector activo para un variant específico
   */
  function getActiveUnitData(variantId) {
    let selector = null;
    const vid = String(variantId);
    
    console.log(`[Unit Selector v2] Looking for selector with variant: ${vid}`);
    
    // 1. Buscar selector por variant ID en el data attribute del selector mismo
    if (vid) {
      selector = document.querySelector(`.unit-selector[data-variant-id="${vid}"]`);
      if (selector) console.log('[Unit Selector v2] Found by direct data-variant-id');
    }
    
    // 2. Buscar en product-item que contenga el variant ID
    if (!selector && vid) {
      // Buscar el product-item que tiene este variant en su data-js-product-variants
      const productItems = document.querySelectorAll('product-item.product-collection');
      for (const item of productItems) {
        const variantsData = item.getAttribute('data-js-product-variants');
        if (variantsData && variantsData.includes(vid)) {
          selector = item.querySelector('.unit-selector');
          if (selector) {
            console.log('[Unit Selector v2] Found in product-item by variants data');
            break;
          }
        }
      }
    }
    
    // 3. Buscar en .acciones con data-variant-id y subir al contenedor
    if (!selector && vid) {
      const acciones = document.querySelector(`.acciones[data-variant-id="${vid}"]`);
      if (acciones) {
        const productCard = acciones.closest('product-item') || acciones.closest('.product-collection');
        if (productCard) {
          selector = productCard.querySelector('.unit-selector');
          if (selector) console.log('[Unit Selector v2] Found via .acciones container');
        }
      }
    }
    
    // 4. Buscar por data-product-id en el selector (usando el product ID del variant)
    if (!selector && vid) {
      // Buscar todos los selectores y ver si alguno tiene el variant correcto
      const allSelectors = document.querySelectorAll('.unit-selector');
      for (const sel of allSelectors) {
        if (sel.dataset.variantId === vid) {
          selector = sel;
          console.log('[Unit Selector v2] Found by iterating all selectors');
          break;
        }
      }
    }
    
    // 5. Fallback: buscar el primero (para PDP donde solo hay uno)
    if (!selector) {
      selector = document.querySelector('.unit-selector');
      if (selector) console.log('[Unit Selector v2] Using fallback (first selector)');
    }
    
    if (!selector) {
      console.log('[Unit Selector v2] No selector found');
      return { multiplier: 1, unitName: 'Kilo', price: 0, found: false };
    }
    
    const multiplierInput = selector.querySelector('.unit-selector__selected-multiplier');
    const unitInput = selector.querySelector('.unit-selector__selected-unit');
    const priceInput = selector.querySelector('.unit-selector__selected-price');
    
    const data = {
      multiplier: multiplierInput ? parseFloat(multiplierInput.value) : 1,
      unitName: unitInput ? unitInput.value : 'Kilo',
      price: priceInput ? parseFloat(priceInput.value) : 0,
      found: true
    };
    
    console.log(`[Unit Selector v2] getActiveUnitData result:`, data);
    
    return data;
  }
  
  /**
   * Interceptar el tema para modificar datos antes de enviar al carrito
   */
  function interceptThemeCart() {
    // Esperar a que el tema cargue
    const checkTheme = setInterval(() => {
      if (window.theme && window.theme.Cart) {
        clearInterval(checkTheme);
        
        // Guardar referencia al método original serializeForm
        const originalSerializeForm = window.theme.Cart.serializeForm;
        
        if (typeof originalSerializeForm === 'function') {
          window.theme.Cart.serializeForm = function($form, serialize_obj = {}) {
            // Llamar al método original
            const result = originalSerializeForm.call(this, $form, serialize_obj);
            
            // Obtener datos del selector de unidades
            const unitData = getActiveUnitData();
            
            // Modificar cantidad si hay multiplicador diferente de 1
            if (unitData.multiplier !== 1 && result.quantity) {
              const originalQty = parseFloat(result.quantity);
              const convertedQty = originalQty * unitData.multiplier;
              result.quantity = convertedQty;
              console.log(`[Unit Selector v2] Theme serializeForm: ${originalQty} → ${convertedQty} kg`);
            }
            
            // Agregar propiedad de presentación
            if (unitData.unitName) {
              result.properties = result.properties || {};
              result.properties['Presentación'] = unitData.unitName;
              console.log(`[Unit Selector v2] Added property: Presentación = ${unitData.unitName}`);
            }
            
            return result;
          };
          
          console.log('[Unit Selector v2] Intercepted theme.Cart.serializeForm');
        }
      }
    }, 100);
    
    // Timeout después de 5 segundos
    setTimeout(() => clearInterval(checkTheme), 5000);
  }
  
  /**
   * Interceptar fetch para /cart/add.js (para cards de colección con custom.js)
   */
  function interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async function(url, options) {
      // Solo interceptar llamadas a /cart/add
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
              // Procesar items array (formato usado por custom.js)
              if (body.items && Array.isArray(body.items)) {
                body.items.forEach(item => {
                  // Obtener datos del selector para este variant específico
                  const variantId = item.id;
                  const unitData = getActiveUnitData(variantId);
                  
                  console.log(`[Unit Selector v2] Fetch intercepted for variant ${variantId}:`, unitData);
                  
                  if (unitData.found) {
                    // Modificar cantidad
                    if (unitData.multiplier !== 1 && item.quantity) {
                      const originalQty = parseFloat(item.quantity);
                      item.quantity = originalQty * unitData.multiplier;
                      console.log(`[Unit Selector v2] Fetch: ${originalQty} → ${item.quantity} kg`);
                    }
                    // Agregar propiedad
                    item.properties = item.properties || {};
                    item.properties['Presentación'] = unitData.unitName;
                  }
                });
              } 
              // Procesar formato simple (id, quantity)
              else if (body.id) {
                const variantId = body.id;
                const unitData = getActiveUnitData(variantId);
                
                console.log(`[Unit Selector v2] Fetch intercepted for variant ${variantId}:`, unitData);
                
                if (unitData.found) {
                  if (unitData.multiplier !== 1 && body.quantity) {
                    const originalQty = parseFloat(body.quantity);
                    body.quantity = originalQty * unitData.multiplier;
                    console.log(`[Unit Selector v2] Fetch: ${originalQty} → ${body.quantity} kg`);
                  }
                  body.properties = body.properties || {};
                  body.properties['Presentación'] = unitData.unitName;
                }
              }
              
              if (isJSON) {
                options.body = JSON.stringify(body);
                console.log('[Unit Selector v2] Modified fetch body:', body);
              }
            }
          } catch (err) {
            console.warn('[Unit Selector v2] Error parsing fetch body:', err);
          }
        }
      }
      
      return originalFetch.apply(this, arguments);
    };
    
    console.log('[Unit Selector v2] Intercepted fetch API');
  }
  
  /**
   * Inicializar sistema
   */
  function init() {
    console.log('[Unit Selector v2] Initializing...');
    
    // Inicializar selectores existentes
    initUnitSelectors();
    
    // Interceptar tema
    interceptThemeCart();
    
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
        console.log('[Unit Selector v2] New selectors detected');
        initUnitSelectors();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[Unit Selector v2] Ready!');
  }
  
  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
