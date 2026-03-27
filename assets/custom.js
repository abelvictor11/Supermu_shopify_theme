document.addEventListener("DOMContentLoaded", function () {
    const menuItems = document.querySelectorAll(".menu__item--has-children");
    const overlay = document.querySelector(".menu-overlay");
    let timeoutId;
    let activeDropdown = null;

    if (!menuItems.length) {
        console.warn("No se encontraron elementos con la clase .menu__item--has-children");
        return;
    }

    // Función para ocultar todos los dropdowns
    function hideAllDropdowns() {
        menuItems.forEach((menuItem) => {
            const dropdown = menuItem.querySelector(".menu__dropdown");
            const submenu = menuItem.querySelector(".menu__list--styled .menu__list");
            
            if (dropdown) {
                dropdown.style.display = "none";
                dropdown.style.opacity = "0";
                dropdown.classList.remove("show");
            }
            if (submenu) {
                submenu.style.display = "none";
                submenu.style.opacity = "0";
            }
        });
        if (overlay) overlay.classList.remove("active");
        activeDropdown = null;
    }

    menuItems.forEach((menuItem) => {
        const dropdown = menuItem.querySelector(".menu__dropdown");
        const submenu = menuItem.querySelector(".menu__list--styled .menu__list");
        
        if (!dropdown && !submenu) {
            console.warn("No se encontró dropdown o submenu dentro de:", menuItem);
            return;
        }

        menuItem.addEventListener("mouseenter", () => {
            clearTimeout(timeoutId);
            
            // Si hay un dropdown activo, lo ocultamos
            if (activeDropdown && activeDropdown !== menuItem) {
                hideAllDropdowns();
            }

            if (dropdown) {
                dropdown.style.display = "block";
                dropdown.style.opacity = "1";
                dropdown.classList.add("show");
            }
            if (submenu) {
                submenu.style.display = "block";
                submenu.style.opacity = "1";
            }
            if (overlay) overlay.classList.add("active");
            activeDropdown = menuItem;
        });

        menuItem.addEventListener("mouseleave", (e) => {
            // Verificamos si el mouse se movió a un elemento hijo
            const toElement = e.relatedTarget;
            if (menuItem.contains(toElement)) {
                return;
            }

            timeoutId = setTimeout(() => {
                if (dropdown) {
                    dropdown.style.display = "none";
                    dropdown.style.opacity = "0";
                    dropdown.classList.remove("show");
                }
                if (submenu) {
                    submenu.style.display = "none";
                    submenu.style.opacity = "0";
                }
                if (overlay) overlay.classList.remove("active");
                activeDropdown = null;
            }, 300);
        });
    });

    // Manejo del overlay
    if (overlay) {
        overlay.addEventListener("click", hideAllDropdowns);
    }

    // Manejo de eventos para submenús
    const submenuItems = document.querySelectorAll(".menu__list--styled .menu__item--has-children");
    submenuItems.forEach((submenuItem) => {
        const submenu = submenuItem.querySelector(".menu__list");
        
        if (submenu) {
            submenuItem.addEventListener("mouseenter", () => {
                clearTimeout(timeoutId);
                submenu.style.display = "block";
                submenu.style.opacity = "1";
            });

            submenuItem.addEventListener("mouseleave", (e) => {
                if (submenuItem.contains(e.relatedTarget)) {
                    return;
                }
                
                timeoutId = setTimeout(() => {
                    submenu.style.display = "none";
                    submenu.style.opacity = "0";
                }, 300);
            });
        }
    });
});



document.addEventListener('DOMContentLoaded', function() {
    // Selector más específico para items que realmente pueden tener dropdown
    const menuItems = document.querySelectorAll('.menu__item--has-children');
    const overlay = document.querySelector('.menu-overlay');
    let timeoutId;

    if (menuItems && menuItems.length > 0) {
        menuItems.forEach((menuItem) => {
            // Busca dropdown con selector más específico
            const dropdown = menuItem.querySelector('.menu__dropdown, .dropdown-menu, .submenu');
            
            if (!dropdown) {
                console.debug('Item sin dropdown:', menuItem); // Cambiado a debug para menos ruido
                return;
            }

            // Configura eventos
            menuItem.addEventListener('mouseenter', () => {
                clearTimeout(timeoutId);
                dropdown.style.display = "block";
                dropdown.style.opacity = "1";
                if (overlay) overlay.classList.add("active");
            });

            menuItem.addEventListener('mouseleave', () => {
                timeoutId = setTimeout(() => {
                    dropdown.style.display = "none";
                    dropdown.style.opacity = "0";
                    if (overlay) overlay.classList.remove("active");
                }, 300);
            });
        });
    } else {
        console.warn('No se encontraron elementos de menú con hijos');
    }
});




window.addEventListener('DOMContentLoaded', function() {
    const swiperElements = document.querySelectorAll('.small-banner-swiper');
    swiperElements.forEach(function(element) {
        new Swiper(element, {
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            },
            observer: true,
            observeParents: true
        });
    });
});

// Funcionalidad para el botón "Agregar" en las cards de productos
(function() {
    'use strict';
    
    console.log('[Instant Cart] Script loaded');
    
    // Función para agregar/actualizar producto en el carrito
    async function updateCart(variantId, quantity, accionesContainer) {
        console.log('[Instant Cart] Adding to cart:', variantId, 'qty:', quantity);
        try {
            const formData = {
                items: [{
                    id: variantId,
                    quantity: quantity
                }]
            };
            
            const response = await fetch('/cart/add.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('[Instant Cart] Added successfully:', data);
                
                // Actualizar contador del carrito
                const cartResponse = await fetch('/cart.js');
                const cart = await cartResponse.json();
                
                // Actualizar contador mobile
                const cartCountMobile = document.querySelector('[data-js-cart-count-mobile]');
                if (cartCountMobile) {
                    cartCountMobile.textContent = cart.item_count;
                    cartCountMobile.setAttribute('data-js-cart-count-mobile', cart.item_count);
                }
                
                // Actualizar contador desktop
                const cartCountDesktop = document.querySelector('[data-js-cart-count-desktop]');
                if (cartCountDesktop) {
                    const countText = cartCountDesktop.textContent.replace(/\d+/, cart.item_count);
                    cartCountDesktop.textContent = countText;
                    cartCountDesktop.setAttribute('data-js-cart-count-desktop', cart.item_count);
                }
                
                // Disparar evento de actualización del carrito para otros scripts del tema
                document.dispatchEvent(new CustomEvent('cart:updated', { 
                    detail: { cart: cart } 
                }));
                
                // Actualizar el data attribute de cantidad
                const quantityWrapper = accionesContainer.querySelector('.product-collection__quantity-wrapper');
                if (quantityWrapper) {
                    quantityWrapper.setAttribute('data-cart-quantity', quantity);
                }
                
                console.log('[Instant Cart] Cart counter updated:', cart.item_count);
                return true;
            } else {
                const errorData = await response.json();
                console.error('[Instant Cart] Error adding to cart:', errorData);
                
                // Mostrar mensaje de error al usuario
                if (errorData.description) {
                    alert(errorData.description);
                } else if (errorData.message) {
                    alert(errorData.message);
                }
                
                return false;
            }
        } catch (error) {
            console.error('[Instant Cart] Exception:', error);
            return false;
        }
    }
    
    // Función para cambiar cantidad en el carrito
    async function changeCartQuantity(variantId, newQuantity, accionesContainer) {
        console.log('[Instant Cart] Changing quantity:', variantId, 'new qty:', newQuantity);
        try {
            const response = await fetch('/cart/change.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: variantId,
                    quantity: newQuantity
                })
            });
            
            if (response.ok) {
                console.log('[Instant Cart] Quantity changed successfully');
                
                // Actualizar contador del carrito
                const cartResponse = await fetch('/cart.js');
                const cart = await cartResponse.json();
                
                // Actualizar contador mobile
                const cartCountMobile = document.querySelector('[data-js-cart-count-mobile]');
                if (cartCountMobile) {
                    cartCountMobile.textContent = cart.item_count;
                    cartCountMobile.setAttribute('data-js-cart-count-mobile', cart.item_count);
                }
                
                // Actualizar contador desktop
                const cartCountDesktop = document.querySelector('[data-js-cart-count-desktop]');
                if (cartCountDesktop) {
                    const countText = cartCountDesktop.textContent.replace(/\d+/, cart.item_count);
                    cartCountDesktop.textContent = countText;
                    cartCountDesktop.setAttribute('data-js-cart-count-desktop', cart.item_count);
                }
                
                // Disparar evento de actualización del carrito
                document.dispatchEvent(new CustomEvent('cart:updated', { 
                    detail: { cart: cart } 
                }));
                
                // Actualizar el data attribute de cantidad
                const quantityWrapper = accionesContainer.querySelector('.product-collection__quantity-wrapper');
                if (quantityWrapper) {
                    quantityWrapper.setAttribute('data-cart-quantity', newQuantity);
                }
                
                console.log('[Instant Cart] Cart counter updated:', cart.item_count);
                return true;
            }
        } catch (error) {
            console.error('[Instant Cart] Exception changing quantity:', error);
            return false;
        }
    }
    
    // Click en botón "Agregar" - Agrega 1 al carrito y muestra controles
    document.addEventListener('click', async function(e) {
        const btnAgregar = e.target.closest('[data-action="add-to-cart-instant"]');
        
        if (btnAgregar) {
            console.log('[Instant Cart] Agregar button clicked');
            e.preventDefault();
            e.stopPropagation();
            
            const accionesContainer = btnAgregar.closest('.acciones');
            if (!accionesContainer) {
                console.error('[Instant Cart] No acciones container found');
                return;
            }
            
            // Verificar si el producto requiere selección de corte
            if (accionesContainer.hasAttribute('data-requires-corte')) {
                const productUrl = accionesContainer.getAttribute('data-product-url');
                console.log('[Instant Cart] Product requires corte selection, redirecting to PDP:', productUrl);
                if (productUrl) {
                    window.location.href = productUrl;
                }
                return;
            }
            
            const variantId = accionesContainer.getAttribute('data-variant-id');
            const quantityWrapper = accionesContainer.querySelector('.product-collection__quantity-wrapper');
            const quantityInput = quantityWrapper?.querySelector('input[type="number"]');
            
            console.log('[Instant Cart] Variant ID:', variantId);
            console.log('[Instant Cart] Quantity wrapper:', quantityWrapper);
            console.log('[Instant Cart] Quantity input:', quantityInput);
            
            if (!variantId || !quantityWrapper || !quantityInput) {
                console.error('[Instant Cart] Missing required elements');
                return;
            }
            
            // Agregar 1 al carrito
            const success = await updateCart(variantId, 1, accionesContainer);
            
            if (success) {
                console.log('[Instant Cart] Showing quantity controls');
                // Actualizar el input a 1
                quantityInput.value = 1;
                
                // Mostrar los controles de cantidad
                quantityWrapper.style.display = 'flex';
                quantityWrapper.classList.add('active');
                btnAgregar.style.display = 'none';
            }
        }
    }, true); // Use capture phase
    
    // Detectar cambios en los botones +/- del input de cantidad
    document.addEventListener('click', async function(e) {
        const control = e.target.closest('[data-control]');
        
        if (control && control.closest('.acciones')) {
            const accionesContainer = control.closest('.acciones');
            
            const variantId = accionesContainer.getAttribute('data-variant-id');
            const quantityWrapper = accionesContainer.querySelector('.product-collection__quantity-wrapper');
            const quantityInput = quantityWrapper?.querySelector('input[type="number"]');
            
            if (!variantId || !quantityInput) return;
            
            // Esperar un momento para que el input se actualice
            setTimeout(async () => {
                let newQuantity = parseInt(quantityInput.value) || 0;
                const maxAttr = parseInt(quantityInput.getAttribute('max'));
                if (!isNaN(maxAttr) && newQuantity > maxAttr) {
                    newQuantity = maxAttr;
                    quantityInput.value = maxAttr;
                }

                if (newQuantity === 0) {
                    // Si la cantidad es 0, remover del carrito y ocultar controles
                    await changeCartQuantity(variantId, 0, accionesContainer);
                    quantityWrapper.style.display = 'none';
                    quantityWrapper.classList.remove('active');

                    const btnAgregar = accionesContainer.querySelector('[data-action="add-to-cart-instant"]');
                    if (btnAgregar) {
                        btnAgregar.style.display = 'flex';
                    }
                } else {
                    // Actualizar cantidad en el carrito
                    await changeCartQuantity(variantId, newQuantity, accionesContainer);
                }
            }, 100);
        }
    }, true);
    
    // Detectar cambios directos en el input de cantidad
    document.addEventListener('change', async function(e) {
        if (e.target.type === 'number' && e.target.closest('.product-collection__quantity-wrapper')) {
            const accionesContainer = e.target.closest('.acciones');
            if (!accionesContainer) return;
            
            const variantId = accionesContainer.getAttribute('data-variant-id');
            let newQuantity = parseInt(e.target.value) || 0;
            const maxAttr = parseInt(e.target.getAttribute('max'));
            if (!isNaN(maxAttr) && newQuantity > maxAttr) {
                newQuantity = maxAttr;
                e.target.value = maxAttr;
            }

            if (!variantId) return;

            if (newQuantity === 0) {
                // Si la cantidad es 0, remover del carrito y ocultar controles
                await changeCartQuantity(variantId, 0, accionesContainer);
                
                const quantityWrapper = accionesContainer.querySelector('.product-collection__quantity-wrapper');
                if (quantityWrapper) {
                    quantityWrapper.style.display = 'none';
                    quantityWrapper.classList.remove('active');
                }
                
                const btnAgregar = accionesContainer.querySelector('[data-action="add-to-cart-instant"]');
                if (btnAgregar) {
                    btnAgregar.style.display = 'flex';
                }
            } else {
                // Actualizar cantidad en el carrito
                await changeCartQuantity(variantId, newQuantity, accionesContainer);
            }
        }
    }, true);
})();

// Ocultar precio original cuando hay label de descuento (fallback para navegadores sin :has())
(function() {
    'use strict';
    
    function hideOriginalPrices() {
        // Buscar todos los labels de descuento compactos
        const discountLabels = document.querySelectorAll('.compact-discount-label');
        
        discountLabels.forEach(label => {
            // Buscar el contenedor padre de información del producto
            const productInfo = label.closest('.product-collection__info');
            
            if (productInfo) {
                // Buscar el precio original del producto
                const originalPrice = productInfo.querySelector('.product-collection__price');
                
                if (originalPrice) {
                    originalPrice.classList.add('hide-original-price');
                }
            }
        });
    }
    
    // Ejecutar al cargar la página
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideOriginalPrices);
    } else {
        hideOriginalPrices();
    }
    
    // También ejecutar cuando se carguen productos dinámicamente
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                hideOriginalPrices();
            }
        });
    });
    
    // Observar cambios en el DOM
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
