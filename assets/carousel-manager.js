// carousel-manager.js

if (typeof window.CarouselManager === 'undefined') {
    class CarouselManager {
      constructor() {
        this.swiperInstances = new Map();
        this.initAttempts = 0;
        this.maxAttempts = 10;
        this.retryInterval = 500;
        this.initialized = false;
      }
  
      init() {
        if (typeof Swiper === 'undefined') {
          this.initAttempts++;
          if (this.initAttempts < this.maxAttempts) {
            console.log(`Waiting for Swiper to load... Attempt ${this.initAttempts}`);
            setTimeout(() => this.init(), this.retryInterval);
          } else {
            console.error('Failed to load Swiper after multiple attempts');
          }
          return;
        }
  
        this.initializeCategoryCarousels();
        this.initializeDualBanners();
      }
  
      destroyInstance(instanceId) {
        const instance = this.swiperInstances.get(instanceId);
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
          this.swiperInstances.delete(instanceId);
        }
      }
  
      initializeCategoryCarousels() {
        document.querySelectorAll('.category-carousel-section').forEach(section => {
          const sectionId = section.getAttribute('data-section-id');
          const swiperEl = document.getElementById(`category-swiper-${sectionId}`);
          if (!swiperEl) return;
  
          const totalSlides = swiperEl.querySelectorAll('.swiper-slide').length;
  
          const calculateSlidesPerView = (windowWidth) => {
            if (windowWidth < 480) return Math.min(3, totalSlides);
            if (windowWidth < 768) return Math.min(4, totalSlides);
            if (windowWidth < 1024) return Math.min(8, totalSlides);
            return Math.min(12, totalSlides);
          };
  
          const slidesPerView = calculateSlidesPerView(window.innerWidth);
          const shouldLoop = totalSlides > slidesPerView;
  
          // Validación para asegurar que haya suficientes slides para el loop
          if (totalSlides < 2) {
            config.loop = false;
            config.autoplay = false;
          }
  
          const swiper = new Swiper(`#category-swiper-${sectionId}`, {
            slidesPerView: slidesPerView,
            spaceBetween: 20,
            loop: shouldLoop,
            initialSlide: 0,
            autoplay: shouldLoop ? {
              delay: 3000,
              disableOnInteraction: false
            } : false,
            navigation: {
              nextEl: `#category-swiper-next-${sectionId}`,
              prevEl: `#category-swiper-prev-${sectionId}`
            },
            observer: true,
            observeParents: true,
            breakpoints: {
              320: {
                slidesPerView: Math.min(3, totalSlides),
                spaceBetween: 10
              },
              480: {
                slidesPerView: Math.min(4, totalSlides),
                spaceBetween: 15
              },
              768: {
                slidesPerView: Math.min(8, totalSlides),
                spaceBetween: 15
              },
              1024: {
                slidesPerView: Math.min(12, totalSlides),
                spaceBetween: 20
              }
            },
            on: {
              init: function () {
                const skeleton = section.querySelector('.category-skeleton');
                if (skeleton) {
                  skeleton.style.display = 'none';
                }
                swiperEl.style.visibility = 'visible';
                console.log('Swiper initialized with realIndex:', this.realIndex);
              }
            }
          });
  
          this.swiperInstances.set(`category-${sectionId}`, swiper);
        });
      }
  
      initializeDualBanners() {
        document.querySelectorAll('.custom-grid-banners').forEach(section => {
          const sectionId = section.id.replace('section-', '');
          
          // Destruir instancias existentes antes de crear nuevas
          const largeBannerEl = document.getElementById(`large-banner-swiper-${sectionId}`);
          const smallBannerEl = document.getElementById(`small-banner-swiper-${sectionId}`);

          // Destruir instancias existentes antes de crear nuevas
          this.destroyInstance(`large-banner-${sectionId}`);
          this.destroyInstance(`small-banner-${sectionId}`);

          if (largeBannerEl) {
            const totalSlides = largeBannerEl.querySelectorAll('.swiper-slide').length;
            console.log(`Large Banner [${section.id}] slide count: ${totalSlides}`);

            const largeBannerSwiper = new Swiper(largeBannerEl, {
              init: true,
              initialSlide: 0,
              effect: 'fade',
              fadeEffect: {
                crossFade: true
              },
              speed: 1000,
              loop: totalSlides > 1,
              loopAdditionalSlides: 1,
              slidesPerView: 1,
              observer: true,
              observeParents: true,
              watchSlidesProgress: true,
              autoplay: totalSlides > 1 ? {
                delay: 5000,
                disableOnInteraction: false,
                waitForTransition: true
              } : false,
              navigation: {
                nextEl: `#large-banner-next-${sectionId}`,
                prevEl: `#large-banner-prev-${sectionId}`
              },
              pagination: {
                el: `#large-banner-pagination-${sectionId}`,
                clickable: true,
                type: 'bullets'
              },
              on: {
                init: function() {
                  const skeleton = this.el.previousElementSibling;
                  if (skeleton && skeleton.classList.contains('skeleton-loader')) {
                    skeleton.style.display = 'none';
                  }
                  this.el.classList.add('swiper-initialized');
                  this.update();
                },
                slideChange: function() {
                  const currentSlide = this.slides[this.activeIndex];
                  if (currentSlide) {
                    currentSlide.classList.add('loaded');
                    const nextSlide = this.slides[this.activeIndex + 1];
                    if (nextSlide) nextSlide.classList.add('loaded');
                  }
                }
              }
            });

            // Inicializar manualmente después de la configuración
            largeBannerSwiper.init();
            this.swiperInstances.set(`large-banner-${sectionId}`, largeBannerSwiper);
          }

          if (smallBannerEl) {
            const totalSlides = smallBannerEl.querySelectorAll('.swiper-slide').length;
            console.log(`Small Banner [${section.id}] slide count: ${totalSlides}`);

            const smallBannerSwiper = new Swiper(smallBannerEl, {
              init: true,
              initialSlide: 0,
              effect: 'fade',
              fadeEffect: {
                crossFade: true
              },
              speed: 1000,
              loop: totalSlides > 1,
              loopAdditionalSlides: 1,
              slidesPerView: 1,
              observer: true,
              observeParents: true,
              watchSlidesProgress: true,
              autoplay: totalSlides > 1 ? {
                delay: 5000,
                disableOnInteraction: false,
                waitForTransition: true
              } : false,
              navigation: {
                nextEl: `#small-banner-next-${sectionId}`,
                prevEl: `#small-banner-prev-${sectionId}`
              },
              pagination: {
                el: `#small-banner-pagination-${sectionId}`,
                clickable: true,
                type: 'bullets'
              },
              on: {
                init: function() {
                  const skeleton = this.el.previousElementSibling;
                  if (skeleton && skeleton.classList.contains('skeleton-loader')) {
                    skeleton.style.display = 'none';
                  }
                  this.el.classList.add('swiper-initialized');
                  this.update();
                },
                slideChange: function() {
                  const currentSlide = this.slides[this.activeIndex];
                  if (currentSlide) {
                    currentSlide.classList.add('loaded');
                    const nextSlide = this.slides[this.activeIndex + 1];
                    if (nextSlide) nextSlide.classList.add('loaded');
                  }
                }
              }
            });

            // Inicializar manualmente después de la configuración
            smallBannerSwiper.init();
            this.swiperInstances.set(`small-banner-${sectionId}`, smallBannerSwiper);
          }


        });
      }
  
      destroy() {
        this.swiperInstances.forEach(swiper => {
          if (swiper && typeof swiper.destroy === 'function') {
            swiper.destroy();
          }
        });
        this.swiperInstances.clear();
      }
    }
  
    window.CarouselManager = CarouselManager;
  
    document.addEventListener('DOMContentLoaded', () => {
      window.carouselManager = new CarouselManager();
      window.carouselManager.init();
    });
  }
  