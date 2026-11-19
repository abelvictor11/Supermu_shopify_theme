// One owner per carousel, including Theme Editor and back/forward-cache restores.
(function() {
    'use strict';
    if (window.CarouselManager) return;

    class CarouselManager {
        constructor() {
            this.swiperInstances = new Map();
            this.retryTimer = null;
            this.initAttempts = 0;
            this.suspended = false;
            this.motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
        }

        init(root = document) {
            if (this.suspended) return;
            if (typeof Swiper === 'undefined') {
                if (!this.retryTimer && this.initAttempts++ < 10) {
                    this.retryTimer = setTimeout(() => {
                        this.retryTimer = null;
                        this.init();
                    }, 500);
                }
                return; // CSS keeps banner images visible even if the library fails.
            }
            if (this.retryTimer) clearTimeout(this.retryTimer);
            this.retryTimer = null;
            this.initAttempts = 0;
            this.prune();
            this.initializeCategoryCarousels(root);
            this.initializeDualBanners(root);
        }

        elements(root, selector) {
            return [...(root.matches && root.matches(selector) ? [root] : []), ...root.querySelectorAll(selector)];
        }

        mount(element, options, moving) {
            if (this.swiperInstances.has(element)) return;
            // Adopt a previously initialized element; never overwrite a live owner.
            const swiper = element.swiper && !element.swiper.destroyed ? element.swiper : new Swiper(element, options);
            this.swiperInstances.set(element, { swiper, moving });
            this.updateMotion();
        }

        initializeDualBanners(root = document) {
            this.elements(root, '.custom-grid-banners').forEach(section => {
                section.querySelectorAll('.large-banner-swiper, .small-banner-swiper').forEach(element => {
                    const count = element.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)').length;
                    if (!count) return;
                    element.style.display = 'block'; // A configured slide need not be image_1.
                    const moving = count > 1 && section.dataset.bannerAutoplay === 'true';
                    this.mount(element, {
                        slidesPerView: 1,
                        effect: 'fade',
                        fadeEffect: { crossFade: true },
                        speed: 800,
                        loop: count > 1,
                        watchOverflow: true,
                        autoplay: moving ? {
                            enabled: !this.motionQuery?.matches,
                            delay: Number(section.dataset.bannerSpeed) || 5000,
                            disableOnInteraction: false,
                            // Swiper 8 mouseleave resumes even after autoplay.stop().
                            // Keep reduced-motion/visibility as the only resume authority.
                            pauseOnMouseEnter: false
                        } : false,
                        navigation: section.dataset.bannerArrows === 'true' ? {
                            nextEl: element.querySelector('.swiper-button-next'),
                            prevEl: element.querySelector('.swiper-button-prev')
                        } : false,
                        pagination: section.dataset.bannerBullets === 'true' ? {
                            el: element.querySelector('.swiper-pagination'),
                            clickable: true
                        } : false
                    }, moving);
                    section.querySelectorAll('.skeleton-loader').forEach(node => { node.style.display = 'none'; });
                });
            });
        }

        initializeCategoryCarousels(root = document) {
            this.elements(root, '.category-carousel-section').forEach(section => {
                const element = section.querySelector('[id^="category-swiper-"]');
                if (!element) return;
                const count = element.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)').length;
                if (!count) return;
                const perView = width => Math.min(count, width < 480 ? 3 : width < 768 ? 4 : width < 1024 ? 8 : 12);
                const moving = count > perView(window.innerWidth);
                this.mount(element, {
                    slidesPerView: perView(window.innerWidth),
                    spaceBetween: 20,
                    loop: moving,
                    autoplay: moving ? { enabled: !this.motionQuery?.matches, delay: 3000, disableOnInteraction: false } : false,
                    navigation: {
                        nextEl: section.querySelector('[id^="category-swiper-next-"]'),
                        prevEl: section.querySelector('[id^="category-swiper-prev-"]')
                    },
                    breakpoints: {
                        320: { slidesPerView: Math.min(3, count), spaceBetween: 10 },
                        480: { slidesPerView: Math.min(4, count), spaceBetween: 15 },
                        768: { slidesPerView: Math.min(8, count), spaceBetween: 15 },
                        1024: { slidesPerView: Math.min(12, count), spaceBetween: 20 }
                    }
                }, moving);
                element.style.visibility = 'visible';
                section.querySelectorAll('.category-skeleton').forEach(node => { node.style.display = 'none'; });
            });
        }

        updateMotion() {
            this.swiperInstances.forEach(({ swiper, moving }) => {
                if (!swiper.autoplay || swiper.destroyed) return;
                if (this.suspended || document.hidden || this.motionQuery?.matches || !moving) swiper.autoplay.stop();
                else swiper.autoplay.start();
            });
        }

        prune() {
            this.swiperInstances.forEach((entry, element) => {
                if (!element.isConnected) this.destroyInstance(element);
            });
        }

        destroyInstance(element) {
            const entry = this.swiperInstances.get(element);
            if (entry && !entry.swiper.destroyed) entry.swiper.destroy(true, true);
            this.swiperInstances.delete(element);
        }

        destroy(root) {
            if (this.retryTimer) clearTimeout(this.retryTimer);
            this.retryTimer = null;
            this.swiperInstances.forEach((entry, element) => {
                if (!root || root === element || root.contains(element)) this.destroyInstance(element);
            });
        }
    }

    window.CarouselManager = CarouselManager;
    const manager = window.carouselManager = new CarouselManager();
    const onMotion = () => manager.updateMotion();
    if (manager.motionQuery?.addEventListener) manager.motionQuery.addEventListener('change', onMotion);
    else if (manager.motionQuery?.addListener) manager.motionQuery.addListener(onMotion);
    document.addEventListener('visibilitychange', onMotion);
    document.addEventListener('shopify:section:load', event => manager.init(event.target));
    document.addEventListener('shopify:section:unload', event => manager.destroy(event.target));
    window.addEventListener('pagehide', () => { manager.suspended = true; manager.destroy(); });
    window.addEventListener('pageshow', () => { manager.suspended = false; manager.init(); });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => manager.init(), { once: true });
    else manager.init();
})();
  
