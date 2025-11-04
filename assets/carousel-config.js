// Configuración común para todos los carruseles
const carouselConfig = {
    // Configuración base para todos los carruseles
    base: {
        loop: true,
        spaceBetween: 20,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        }
    },

    // Configuración específica para el carrusel de banners duales
    dualBanner: {
        slidesPerView: 1,
        effect: 'fade',
        fadeEffect: {
            crossFade: true
        }
    },

    // Configuración específica para el carrusel de categorías
    category: {
        slidesPerView: 'auto',
        breakpoints: {
            320: {
                slidesPerView: 3,
                spaceBetween: 10
            },
            480: {
                slidesPerView: 4,
                spaceBetween: 15
            },
            768: {
                slidesPerView: 6,
                spaceBetween: 20
            },
            1024: {
                slidesPerView: 8,
                spaceBetween: 20
            },
            1280: {
                slidesPerView: 10,
                spaceBetween: 20
            }
        }
    },

    // Configuración específica para el carrusel de productos
    products: {
        slidesPerView: 1,
        spaceBetween: 15,
        breakpoints: {
            480: {
                slidesPerView: 2,
                spaceBetween: 15
            },
            640: {
                slidesPerView: 3,
                spaceBetween: 15
            },
            768: {
                slidesPerView: 4,
                spaceBetween: 20
            },
            1024: {
                slidesPerView: 6,
                spaceBetween: 20
            },
            1280: {
                slidesPerView: 8,
                spaceBetween: 20
            },
            1536: {
                slidesPerView: 10,
                spaceBetween: 20
            }
        }
    }
};

// Función para inicializar cualquier carrusel
function initCarousel(containerId, type = 'base') {
    if (typeof Swiper === 'undefined') {
        console.warn('Swiper no está cargado');
        return null;
    }

    const container = document.getElementById(containerId);
    if (!container) return null;

    const config = {
        ...carouselConfig.base,
        ...carouselConfig[type]
    };

    return new Swiper(container, config);
}

// Función para manejar el skeleton loader
function handleSkeletonLoader(container) {
    const skeleton = container.previousElementSibling;
    if (skeleton && skeleton.classList.contains('skeleton-loader')) {
        skeleton.style.opacity = '0';
        skeleton.style.visibility = 'hidden';
    }
} 