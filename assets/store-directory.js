document.addEventListener('DOMContentLoaded', function() {
  const storesContainer = document.getElementById('stores-container');
  const zoneFilter = document.getElementById('zone-filter');
  const searchInput = document.getElementById('store-search');
  const featuredFilter = document.getElementById('featured-filter');
  
  function filterStores() {
    const selectedZone = zoneFilter.value;
    const searchTerm = searchInput.value.toLowerCase();
    const showOnlyFeatured = featuredFilter.checked;
    
    const storeCards = storesContainer.querySelectorAll('.store-card');
    
    storeCards.forEach(card => {
      let shouldShow = true;
      
      // Filtro por zona
      if (selectedZone && card.dataset.zone !== selectedZone) {
        shouldShow = false;
      }
      
      // Filtro por búsqueda
      if (searchTerm) {
        const storeName = card.querySelector('.store-card__name').textContent.toLowerCase();
        const storeAddress = card.querySelector('.store-card__address').textContent.toLowerCase();
        if (!storeName.includes(searchTerm) && !storeAddress.includes(searchTerm)) {
          shouldShow = false;
        }
      }
      
      // Filtro de destacadas
      if (showOnlyFeatured && !card.classList.contains('store-card--featured')) {
        shouldShow = false;
      }
      
      card.style.display = shouldShow ? 'block' : 'none';
    });
  }
  
  // Event listeners para los filtros
  zoneFilter.addEventListener('change', filterStores);
  searchInput.addEventListener('input', filterStores);
  featuredFilter.addEventListener('change', filterStores);
}); 