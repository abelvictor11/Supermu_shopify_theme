class SkeletonLoader {
  constructor() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    try {
      this.setupLazyLoading();
      this.handleBannerLoad();
      this.handleCarouselLoad();
      this.handleProductGridLoad();
    } catch (error) {
      console.error('Error initializing SkeletonLoader:', error);
    }
  }

  setupLazyLoading() {
    document.addEventListener('lazyloaded', (e) => {
      this.handleImageLoad(e.target);
    });
  }

  handleImageLoad(img) {
    try {
      const container = img.closest('.product-image-container, .carousel__item, .product-collection__item, .banner-item');
      if (container) {
        img.classList.add('loaded');
        img.style.opacity = '1';
        container.classList.add('image-loaded');
        
        // Ocultar skeleton después de que la imagen cargue
        const skeleton = container.querySelector('.skeleton-loader, .product-collection-skeleton');
        if (skeleton) {
          skeleton.style.display = 'none';
          skeleton.style.opacity = '0';
          skeleton.style.visibility = 'hidden';
        }

        // Si es una imagen de producto, asegurarse de que sea visible
        if (img.classList.contains('product-image')) {
          img.style.opacity = '1';
        }
        container.style.opacity = '1';
      }
    } catch (error) {
      console.error('Error handling image load:', error);
    }
  }

  hideSkeletonsInElement(element) {
    try {
      if (!element) return;
      
      const skeletons = element.querySelectorAll('.skeleton-loader, .product-collection-skeleton');
      skeletons.forEach(skeleton => {
        skeleton.style.display = 'none';
        skeleton.style.opacity = '0';
        skeleton.style.visibility = 'hidden';
      });
      element.classList.add('content-loaded');
      element.style.opacity = '1';
    } catch (error) {
      console.error('Error hiding skeletons:', error);
    }
  }

  // Removed header skeleton handling (unused)

  handleBannerLoad() {
    const banners = document.querySelectorAll('.banner-item, .grid-item');
    banners.forEach(banner => {
      const images = banner.querySelectorAll('img');
      let loadedImages = 0;

      const checkAllImagesLoaded = () => {
        loadedImages++;
        if (loadedImages >= images.length) {
          banner.classList.add('loaded');
          const skeleton = banner.querySelector('.skeleton-loader');
          if (skeleton) {
            skeleton.style.opacity = '0';
            skeleton.style.visibility = 'hidden';
          }
        }
      };

      images.forEach(img => {
        if (img.complete) {
          checkAllImagesLoaded();
        } else {
          img.addEventListener('load', checkAllImagesLoaded);
          img.addEventListener('error', checkAllImagesLoaded);
        }
      });

      // Timeout de seguridad
      setTimeout(() => {
        if (!banner.classList.contains('loaded')) {
          banner.classList.add('loaded');
          const skeleton = banner.querySelector('.skeleton-loader');
          if (skeleton) {
            skeleton.style.opacity = '0';
            skeleton.style.visibility = 'hidden';
          }
        }
      }, 2000);
    });
  }

  handleCarouselLoad() {
    const carousels = document.querySelectorAll('.carousel__slider');
    carousels.forEach(carousel => {
      const items = carousel.querySelectorAll('.carousel__item');
      let loadedItems = 0;

      items.forEach(item => {
        const img = item.querySelector('img');
        if (img) {
          if (img.complete) {
            this.handleImageLoad(img);
            loadedItems++;
          } else {
            img.addEventListener('load', () => {
              this.handleImageLoad(img);
              loadedItems++;
              if (loadedItems >= items.length) {
                carousel.style.opacity = '1';
                const skeleton = carousel.querySelector('.skeleton-loader');
                if (skeleton) {
                  skeleton.style.opacity = '0';
                  skeleton.style.visibility = 'hidden';
                }
              }
            });
          }
        }
      });

      // Timeout de seguridad
      setTimeout(() => {
        carousel.style.opacity = '1';
        const skeleton = carousel.querySelector('.skeleton-loader');
        if (skeleton) {
          skeleton.style.opacity = '0';
          skeleton.style.visibility = 'hidden';
        }
      }, 2000);
    });
  }

  handleProductGridLoad() {
    // Función para ocultar todos los tipos de skeletons en un elemento
    const hideSkeletons = (element) => {
      const selectors = [
        '.product-collection-skeleton',
        '.product-skeleton-image',
        '.skeleton-loader'
      ];
      
      selectors.forEach(selector => {
        const skeletons = element.querySelectorAll(selector);
        skeletons.forEach(skeleton => {
          skeleton.style.display = 'none';
          skeleton.style.opacity = '0';
          skeleton.style.visibility = 'hidden';
        });
      });
    };

    // Función para mostrar el contenido real
    const showContent = (element) => {
      const products = element.querySelectorAll('.product-collection__item');
      products.forEach(product => {
        const img = product.querySelector('img');
        const imageContainer = product.querySelector('.product-collection__image');
        
        if (imageContainer) {
          imageContainer.classList.add('loaded');
        }
        if (img) {
          img.style.opacity = '1';
        }
        product.style.opacity = '1';
      });
    };

    // Función principal para manejar la carga de productos
    const handleProductLoad = (grid) => {
      const products = grid.querySelectorAll('.product-collection__item');
      let loadedProducts = 0;
      const totalProducts = products.length;

      products.forEach(product => {
        const img = product.querySelector('img');
        
        if (img) {
          if (img.complete && img.naturalWidth > 0) {
            loadedProducts++;
            if (loadedProducts === totalProducts) {
              hideSkeletons(grid);
              showContent(grid);
            }
          } else {
            img.style.opacity = '0';
            product.style.opacity = '0';
            
            img.addEventListener('load', () => {
              loadedProducts++;
              if (loadedProducts === totalProducts) {
                hideSkeletons(grid);
                showContent(grid);
              }
            });
            
            img.addEventListener('error', () => {
              loadedProducts++;
              if (loadedProducts === totalProducts) {
                hideSkeletons(grid);
                showContent(grid);
              }
            });
          }
        } else {
          loadedProducts++;
          if (loadedProducts === totalProducts) {
            hideSkeletons(grid);
            showContent(grid);
          }
        }
      });

      // Timeout de seguridad - ocultar skeletons después de 1 segundo
      setTimeout(() => {
        hideSkeletons(grid);
        showContent(grid);
      }, 1000);
    };

    // Procesar todas las grids de productos
    const productGrids = document.querySelectorAll('.product-collection__grid');
    productGrids.forEach(grid => {
      // Manejar la carga inicial
      handleProductLoad(grid);

      // Observar cambios en la grid (para filtros dinámicos o paginación)
      const observer = new MutationObserver(() => {
        handleProductLoad(grid);
      });

      observer.observe(grid, {
        childList: true,
        subtree: true
      });
    });

    // Manejar la página de colección específicamente
    if (window.location.pathname.includes('/collections/')) {
      const collectionPage = document.querySelector('.collection-products');
      if (collectionPage) {
        hideSkeletons(collectionPage);
        showContent(collectionPage);
      }
    }
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SkeletonLoader());
} else {
  new SkeletonLoader();
}