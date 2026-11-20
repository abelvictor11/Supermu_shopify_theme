(function () {
  'use strict';
  if (window.SupermuAdventSectionsReady) return;
  window.SupermuAdventSectionsReady = true;
  function syncLinks(excludedSection) {
    document.querySelectorAll('[data-advent-calendar-link]').forEach(link => {
      const target = document.getElementById(link.dataset.calendarTarget);
      link.hidden = !target || !!excludedSection?.contains(target);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => syncLinks(), {once:true});
  else syncLinks();
  document.addEventListener('shopify:section:load', () => syncLinks());
  document.addEventListener('shopify:section:unload', event => syncLinks(event.target));
})();
