/**
 * Store Selector - Sistema de selección de tienda con geolocalización
 * Guarda la preferencia del usuario en localStorage
 */

class StoreSelector {
  constructor() {
    this.STORAGE_KEY = 'selected_store';
    this.overlay = document.getElementById('store-selector-overlay');
    this.searchInput = document.getElementById('store-search-input');
    this.storeList = document.getElementById('store-list');
    this.btnUseLocation = document.getElementById('btn-use-location');
    this.geolocationStatus = document.getElementById('geolocation-status');
    this.storeContainer = document.getElementById('store-items-container');
    this.selectedStore = null;
    this.stores = [];
    
    this.init();
  }

  async init() {
    // Cargar datos de tiendas
    await this.loadStores();

    // Verificar si ya hay una tienda seleccionada
    const savedStore = this.getSavedStore();
    
    if (savedStore) {
      this.selectedStore = savedStore;
      this.updateHeaderDisplay();
    } else {
      // Primera vez: mostrar el modal automáticamente después de 1 segundo
      setTimeout(() => {
        this.showModal();
      }, 1000);
    }

    this.attachEventListeners();
  }

  async loadStores() {
    try {
      const url = window.STORE_DIRECTORY_URL || '/pages/tiendas';
      const response = await fetch(url);
      const html = await response.text();
      
      // Parsear el HTML para extraer información de las tiendas
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const storeCards = doc.querySelectorAll('.store-card');
      
      this.stores = Array.from(storeCards).map((card, index) => ({
        id: index.toString(),
        name: card.querySelector('.store-card__name')?.textContent.trim() || '',
        zone: card.dataset.zone || '',
        address: card.querySelector('.store-card__address')?.textContent.trim().replace(/\s+/g, ' ') || '',
        phone: card.querySelector('.store-card__phone')?.textContent.trim() || '',
        latitude: card.dataset.lat || '',
        longitude: card.dataset.lng || '',
        logo: card.querySelector('.header-logo-card img')?.src || '',
        featured: card.classList.contains('store-card--featured')
      }));

      this.renderStores();
    } catch (error) {
      console.error('Error cargando tiendas:', error);
      this.stores = [];
      this.storeContainer.innerHTML = '<p class="error-loading">Error cargando tiendas. Por favor recarga la página.</p>';
    }
  }

  renderStores() {
    if (!this.storeContainer) return;

    if (this.stores.length === 0) {
      this.storeContainer.innerHTML = '<p>No hay tiendas disponibles</p>';
      return;
    }

    this.storeContainer.innerHTML = this.stores.map(store => `
      <div class="store-item" 
           data-store-id="${store.id}"
           data-store-name="${store.name}"
           data-store-zone="${store.zone}"
           data-store-address="${store.address}"
           data-store-lat="${store.latitude}"
           data-store-lng="${store.longitude}">
        <div class="store-item-logo">
          ${store.logo ? 
            `<img src="${store.logo}" alt="${store.name}">` :
            `<div class="store-item-logo-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#dd0a0a">
                <path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203.21-4.243 4.242a3 3 0 0 1-4.097.135l-.144-.135-4.244-4.243A9 9 0 0 1 18.364 4.636zM12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
              </svg>
            </div>`
          }
        </div>
        <div class="store-item-info">
          <h3 class="store-item-name">${store.name}</h3>
          <p class="store-item-address">${store.address}</p>
          <p class="store-item-zone">Zona ${this.capitalizeZone(store.zone)}</p>
        </div>
        <div class="store-item-action">
          <button class="btn-select-store" data-store-id="${store.id}">
            Seleccionar
          </button>
        </div>
      </div>
    `).join('');
  }

  capitalizeZone(zone) {
    const zones = {
      'norte': 'Norte',
      'sur': 'Sur',
      'este': 'Oriente',
      'oeste': 'Occidente',
      'centro': 'Centro'
    };
    return zones[zone] || zone;
  }

  attachEventListeners() {
    // Cerrar modal
    const closeBtn = document.querySelector('.store-selector-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    // Click fuera del modal para cerrar
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.closeModal();
        }
      });
    }

    // Búsqueda de tiendas
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.filterStores(e.target.value);
      });
    }

    // Botón de geolocalización
    if (this.btnUseLocation) {
      this.btnUseLocation.addEventListener('click', () => {
        this.requestGeolocation();
      });
    }

    // Botones de selección de tienda
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-select-store')) {
        const storeId = e.target.dataset.storeId;
        this.selectStore(storeId);
      }
    });

    // Botón en el header para cambiar tienda
    const changeStoreBtn = document.getElementById('change-store-btn');
    if (changeStoreBtn) {
      changeStoreBtn.addEventListener('click', () => {
        this.showModal();
      });
    }
  }

  showModal() {
    if (this.overlay) {
      this.overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  selectStore(storeId) {
    const storeElement = document.querySelector(`[data-store-id="${storeId}"]`);
    if (!storeElement) return;

    const store = {
      id: storeId,
      name: storeElement.dataset.storeName,
      zone: storeElement.dataset.storeZone,
      address: storeElement.dataset.storeAddress,
      latitude: storeElement.dataset.storeLat,
      longitude: storeElement.dataset.storeLng
    };

    this.selectedStore = store;
    this.saveStore(store);
    this.updateHeaderDisplay();
    this.closeModal();

    // Disparar evento personalizado para que otras partes de la app lo sepan
    window.dispatchEvent(new CustomEvent('storeSelected', { 
      detail: store 
    }));
  }

  saveStore(store) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.error('Error guardando tienda en localStorage:', e);
    }
  }

  getSavedStore() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Error leyendo tienda de localStorage:', e);
      return null;
    }
  }

  updateHeaderDisplay() {
    const headerStoreBtn = document.getElementById('change-store-btn');
    if (!headerStoreBtn || !this.selectedStore) return;

    const storeNameEl = headerStoreBtn.querySelector('.selected-store-name');
    const storeAddressEl = headerStoreBtn.querySelector('.selected-store-address');

    if (storeNameEl) {
      storeNameEl.textContent = this.selectedStore.name;
    }
    if (storeAddressEl) {
      storeAddressEl.textContent = this.selectedStore.address;
    }
  }

  filterStores(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const storeItems = document.querySelectorAll('.store-item');
    let visibleCount = 0;

    storeItems.forEach(item => {
      const name = item.dataset.storeName.toLowerCase();
      const address = item.dataset.storeAddress.toLowerCase();
      const zone = item.dataset.storeZone.toLowerCase();

      if (name.includes(term) || address.includes(term) || zone.includes(term)) {
        item.style.display = '';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    const noResults = document.getElementById('no-results');
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  requestGeolocation() {
    if (!navigator.geolocation) {
      this.showGeolocationStatus('Tu navegador no soporta geolocalización', 'error');
      return;
    }

    this.showGeolocationStatus('Obteniendo tu ubicación...', 'loading');
    this.btnUseLocation.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.findNearestStore(latitude, longitude);
      },
      (error) => {
        let message = 'No pudimos obtener tu ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permiso de ubicación denegado. Por favor, habilítalo en tu navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Ubicación no disponible. Intenta más tarde.';
            break;
          case error.TIMEOUT:
            message = 'Tiempo de espera agotado. Intenta nuevamente.';
            break;
        }
        
        this.showGeolocationStatus(message, 'error');
        this.btnUseLocation.disabled = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  }

  findNearestStore(userLat, userLng) {
    let nearestStore = null;
    let minDistance = Infinity;

    this.stores.forEach(store => {
      if (!store.latitude || !store.longitude) return;

      const storeLat = parseFloat(store.latitude);
      const storeLng = parseFloat(store.longitude);

      if (isNaN(storeLat) || isNaN(storeLng)) return;

      const distance = this.calculateDistance(userLat, userLng, storeLat, storeLng);

      if (distance < minDistance) {
        minDistance = distance;
        nearestStore = store;
      }
    });

    if (nearestStore) {
      this.showGeolocationStatus(
        `¡Encontramos ${nearestStore.name} cerca de ti! (${minDistance.toFixed(1)} km)`,
        'success'
      );
      
      // Resaltar la tienda más cercana
      this.highlightStore(nearestStore.id);
      
      // Auto-seleccionar si está muy cerca (< 2km)
      if (minDistance < 2) {
        setTimeout(() => {
          this.selectStore(nearestStore.id);
        }, 2000);
      }
    } else {
      this.showGeolocationStatus('No encontramos tiendas cercanas', 'error');
    }

    this.btnUseLocation.disabled = false;
  }

  highlightStore(storeId) {
    // Quitar resaltado previo
    document.querySelectorAll('.store-item').forEach(item => {
      item.classList.remove('nearest-store');
    });

    // Resaltar tienda más cercana
    const storeElement = document.querySelector(`[data-store-id="${storeId}"]`);
    if (storeElement) {
      storeElement.classList.add('nearest-store');
      storeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    // Fórmula de Haversine para calcular distancia entre dos puntos
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  showGeolocationStatus(message, type) {
    if (!this.geolocationStatus) return;

    this.geolocationStatus.textContent = message;
    this.geolocationStatus.className = `geolocation-status geolocation-status--${type}`;
    this.geolocationStatus.style.display = 'block';

    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        this.geolocationStatus.style.display = 'none';
      }, 5000);
    }
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.storeSelector = new StoreSelector();
  });
} else {
  window.storeSelector = new StoreSelector();
}
