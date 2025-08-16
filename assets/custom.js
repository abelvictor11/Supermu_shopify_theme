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


