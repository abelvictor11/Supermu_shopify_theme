/**
 * Walmart Store Selector
 * Sistema de selección de tienda estilo Walmart
 */

class WalmartStoreSelector {
  constructor() {
    this.STORAGE_KEY = 'walmart_selected_store';
    this.DELIVERY_MODE_KEY = 'walmart_delivery_mode';
    this.DROPDOWN_CLOSED_KEY = 'walmart_dropdown_closed';
    this.COOKIE_EXPIRY_DAYS = 30; // Cookie expira en 30 días
    
    // Elementos del DOM
    this.headerBtn = document.getElementById('walmart-store-trigger');
    this.dropdown = document.getElementById('store-selector-dropdown');
    this.modal = document.getElementById('store-selector-modal');
    this.modalOverlay = document.querySelector('.walmart-modal-overlay');
    
    // Datos
    this.stores = [];
    this.selectedStore = null;
    this.deliveryMode = 'retiro'; // envio, retiro, entrega
    this.userLocation = null;
    
    this.init();
  }

  async init() {
    // Cargar tiendas
    await this.loadStores();
    
    // Cargar datos guardados
    this.loadSavedData();
    
    // Actualizar UI
    this.updateHeaderButton();
    
    // Eventos
    this.attachEventListeners();
    
    // Si no hay tienda seleccionada Y el usuario no ha cerrado el dropdown manualmente, mostrar después de 1.5 seg
    const dropdownClosedByUser = this.getCookie(this.DROPDOWN_CLOSED_KEY);
    if (!this.selectedStore && !dropdownClosedByUser) {
      setTimeout(() => {
        this.showDropdown();
      }, 1500);
    }
  }

  async loadStores() {
    try {
      const url = window.STORE_DIRECTORY_URL || '/pages/store-directory';
      console.log('Cargando tiendas desde:', url);
      
      const response = await fetch(url);
      const html = await response.text();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const storeCards = doc.querySelectorAll('.store-card');
      
      console.log('Tiendas encontradas:', storeCards.length);
      
      this.stores = Array.from(storeCards).map((card, index) => {
        const logo = card.querySelector('.header-logo-card img');
        return {
          id: index.toString(),
          name: card.querySelector('.store-card__name')?.textContent.trim() || '',
          zone: card.dataset.zone || '',
          address: card.querySelector('.store-card__address')?.textContent.trim().replace(/^\s*\n\s*/g, '').replace(/\s+/g, ' ') || '',
          phone: card.querySelector('.store-card__phone')?.textContent.trim() || '',
          latitude: parseFloat(card.dataset.lat) || 0,
          longitude: parseFloat(card.dataset.lng) || 0,
          logo: logo ? logo.src : '',
          featured: card.classList.contains('store-card--featured')
        };
      }).filter(store => store.name && store.latitude && store.longitude);
      
      console.log('Tiendas procesadas:', this.stores.length);
      
      if (this.stores.length > 0) {
        this.renderStoresInModal();
      }
    } catch (error) {
      console.error('Error cargando tiendas:', error);
      this.stores = [];
    }
  }

  loadSavedData() {
    try {
      const savedStore = localStorage.getItem(this.STORAGE_KEY);
      const savedMode = localStorage.getItem(this.DELIVERY_MODE_KEY);
      
      if (savedStore) {
        this.selectedStore = JSON.parse(savedStore);
      }
      
      if (savedMode) {
        this.deliveryMode = savedMode;
      }
    } catch (e) {
      console.error('Error cargando datos guardados:', e);
    }
  }

  saveData() {
    try {
      if (this.selectedStore) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.selectedStore));
      }
      localStorage.setItem(this.DELIVERY_MODE_KEY, this.deliveryMode);
    } catch (e) {
      console.error('Error guardando datos:', e);
    }
  }

  attachEventListeners() {
    // Botón del header
    if (this.headerBtn) {
      this.headerBtn.addEventListener('click', () => this.toggleDropdown());
    }

    // Cerrar dropdown
    const dropdownClose = document.querySelector('.walmart-dropdown-close');
    if (dropdownClose) {
      dropdownClose.addEventListener('click', () => this.hideDropdown(true));
    }

    // Click fuera del dropdown
    document.addEventListener('click', (e) => {
      if (this.dropdown && this.dropdown.style.display !== 'none') {
        if (!this.dropdown.contains(e.target) && !this.headerBtn.contains(e.target)) {
          this.hideDropdown(true);
        }
      }
    });

    // Opciones de entrega
    const options = document.querySelectorAll('.walmart-option');
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        const mode = option.dataset.option;
        this.selectDeliveryMode(mode);
      });
    });

    // Geolocalización (dropdown)
    const btnUseLocation = document.getElementById('walmart-use-location');
    if (btnUseLocation) {
      btnUseLocation.addEventListener('click', () => this.requestGeolocation());
    }

    // Geolocalización (modal)
    const btnUseLocationModal = document.getElementById('walmart-use-location-modal');
    if (btnUseLocationModal) {
      btnUseLocationModal.addEventListener('click', () => this.requestGeolocationModal());
    }

    // Búsqueda en modal
    const modalSearchInput = document.getElementById('walmart-modal-search-input');
    if (modalSearchInput) {
      modalSearchInput.addEventListener('input', (e) => this.filterStores(e.target.value));
    }

    // Cerrar modal
    const modalClose = document.querySelector('.walmart-modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeStoreModal());
    }

    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', () => this.closeStoreModal());
    }

    // Guardar tienda seleccionada
    const btnSave = document.getElementById('walmart-save-store');
    if (btnSave) {
      btnSave.addEventListener('click', () => this.saveSelectedStore());
    }
  }

  showDropdown() {
    if (this.dropdown) {
      this.dropdown.style.display = 'block';
      
      // Limpiar cookie de cierre cuando el usuario abre manualmente
      this.deleteCookie(this.DROPDOWN_CLOSED_KEY);
      
      // Si hay tienda seleccionada, mostrarla
      if (this.selectedStore) {
        this.showSuggestedStore(this.selectedStore);
      }
    }
  }

  hideDropdown(closedByUser = false) {
    if (this.dropdown) {
      this.dropdown.style.display = 'none';
      
      // Si fue cerrado por el usuario (click en X o fuera del dropdown), guardar en cookie
      if (closedByUser) {
        this.setCookie(this.DROPDOWN_CLOSED_KEY, 'true', this.COOKIE_EXPIRY_DAYS);
      }
    }
  }

  toggleDropdown() {
    if (this.dropdown.style.display === 'none' || !this.dropdown.style.display) {
      this.showDropdown();
    } else {
      this.hideDropdown();
    }
  }

  selectDeliveryMode(mode) {
    this.deliveryMode = mode;
    
    // Actualizar UI
    const options = document.querySelectorAll('.walmart-option');
    options.forEach(opt => {
      if (opt.dataset.option === mode) {
        opt.classList.add('walmart-option-selected');
      } else {
        opt.classList.remove('walmart-option-selected');
      }
    });
    
    this.saveData();
  }

  openStoreModal() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      this.hideDropdown();
    }
  }

  closeStoreModal() {
    if (this.modal) {
      this.modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  renderStoresInModal() {
    const container = document.getElementById('walmart-modal-stores');
    if (!container || this.stores.length === 0) return;

    const html = this.stores.map(store => `
      <div class="walmart-store-item" data-store-id="${store.id}" onclick="window.storeSelector.selectStoreFromModal('${store.id}')">
        <div class="walmart-store-item-icon">
          ${store.logo ? 
            `<img src="${store.logo}" alt="${store.name}">` :
            `<svg width="40" height="40" viewBox="0 0 24 24" fill="var(--walmart-blue)">
              <path d="M12 2l9 4v6c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V6l9-4z"/>
            </svg>`
          }
        </div>
        <div class="walmart-store-item-info">
          <h3 class="walmart-store-item-name">${store.name}</h3>
          <p class="walmart-store-item-address">${store.address}</p>
          ${store.zone ? `<p class="walmart-store-item-zone">Zona ${this.capitalizeZone(store.zone)}</p>` : ''}
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  selectStoreFromModal(storeId) {
    const store = this.stores.find(s => s.id === storeId);
    if (!store) return;

    // Marcar como seleccionada en la UI
    const items = document.querySelectorAll('.walmart-store-item');
    items.forEach(item => {
      if (item.dataset.storeId === storeId) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    // Habilitar botón de guardar
    const btnSave = document.getElementById('walmart-save-store');
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.dataset.storeId = storeId;
    }
  }

  saveSelectedStore() {
    const btnSave = document.getElementById('walmart-save-store');
    const storeId = btnSave?.dataset.storeId;
    
    if (!storeId) return;

    const store = this.stores.find(s => s.id === storeId);
    if (!store) return;

    this.selectedStore = store;
    this.saveData();
    this.updateHeaderButton();
    this.showSuggestedStore(store);
    this.closeStoreModal();

    // Disparar evento
    window.dispatchEvent(new CustomEvent('storeSelected', { detail: store }));
  }

  updateHeaderButton() {
    const textEl = document.getElementById('walmart-header-store-text');
    if (!textEl) return;

    if (this.selectedStore) {
      textEl.textContent = `${this.selectedStore.name} • ${this.selectedStore.zone || ''}`;
    } else {
      textEl.textContent = 'Selecciona una tienda';
    }
  }

  showSuggestedStore(store) {
    const container = document.getElementById('walmart-suggested-store');
    const nameEl = document.getElementById('walmart-store-name');
    const addressEl = document.getElementById('walmart-store-address');

    if (container && nameEl && addressEl) {
      nameEl.textContent = store.name;
      addressEl.textContent = store.address;
      container.style.display = 'flex';
    }
  }

  requestGeolocation() {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    const btn = document.getElementById('walmart-use-location');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Obteniendo ubicación...';
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        
        const nearest = this.findNearestStore(this.userLocation);
        if (nearest) {
          this.showSuggestedStore(nearest.store);
        }

        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Usar mi ubicación actual
          `;
        }
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        alert('No pudimos obtener tu ubicación');
        
        if (btn) {
          btn.disabled = false;
        }
      }
    );
  }

  requestGeolocationModal() {
    if (!navigator.geolocation) {
      this.showGeoStatus('Tu navegador no soporta geolocalización', 'error');
      return;
    }

    this.showGeoStatus('Obteniendo tu ubicación...', 'loading');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        
        const nearest = this.findNearestStore(this.userLocation);
        if (nearest) {
          this.showGeoStatus(`Tienda más cercana: ${nearest.store.name} (${nearest.distance.toFixed(1)} km)`, 'success');
          this.sortStoresByDistance();
        } else {
          this.showGeoStatus('No encontramos tiendas cercanas', 'error');
        }
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        this.showGeoStatus('No pudimos obtener tu ubicación', 'error');
      }
    );
  }

  showGeoStatus(message, type) {
    const status = document.getElementById('walmart-geo-status');
    if (!status) return;

    status.textContent = message;
    status.className = `walmart-geolocation-status ${type}`;
    status.style.display = 'block';

    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        status.style.display = 'none';
      }, 5000);
    }
  }

  findNearestStore(location) {
    if (!location || this.stores.length === 0) return null;

    let nearest = null;
    let minDistance = Infinity;

    this.stores.forEach(store => {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        store.latitude,
        store.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = store;
      }
    });

    return nearest ? { store: nearest, distance: minDistance } : null;
  }

  sortStoresByDistance() {
    if (!this.userLocation) return;

    const storesWithDistance = this.stores.map(store => ({
      ...store,
      distance: this.calculateDistance(
        this.userLocation.latitude,
        this.userLocation.longitude,
        store.latitude,
        store.longitude
      )
    })).sort((a, b) => a.distance - b.distance);

    this.stores = storesWithDistance;
    this.renderStoresInModal();
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
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

  filterStores(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const items = document.querySelectorAll('.walmart-store-item');
    let visibleCount = 0;

    items.forEach(item => {
      const name = item.querySelector('.walmart-store-item-name')?.textContent.toLowerCase() || '';
      const address = item.querySelector('.walmart-store-item-address')?.textContent.toLowerCase() || '';
      
      if (name.includes(term) || address.includes(term) || !term) {
        item.style.display = '';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    // Mostrar mensaje si no hay resultados
    const container = document.getElementById('walmart-modal-stores');
    const noResults = container.querySelector('.walmart-no-results');
    
    if (visibleCount === 0 && term) {
      if (!noResults) {
        const div = document.createElement('div');
        div.className = 'walmart-no-results';
        div.innerHTML = '<p>No se encontraron tiendas con ese criterio</p>';
        container.appendChild(div);
      }
    } else if (noResults) {
      noResults.remove();
    }
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

  // ========== FUNCIONES DE COOKIES ==========
  
  setCookie(name, value, days) {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
  }

  getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  deleteCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999; path=/';
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.storeSelector = new WalmartStoreSelector();
  });
} else {
  window.storeSelector = new WalmartStoreSelector();
}
