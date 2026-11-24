(function () {
  'use strict';
  if (customElements.get('advent-calendar')) return;
  const api = window.SupermuAdvent;
  if (!api) return; // Keep the informative Liquid fallback when an asset fails.
  const dateFormat = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const formatDay = date => dateFormat.format(new Date(date + 'T12:00:00Z'));
  const shortDateFormat = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  function festiveArt(url, number) {
    const art = document.createElement('span');
    art.className = 'advent__door-art'; art.setAttribute('aria-hidden', 'true');
    art.style.backgroundImage = `url("${url}")`;
    const index = (number - 1) % 15;
    art.style.backgroundPosition = `${index % 5 * 25}% ${Math.floor(index / 5) * 50}%`;
    return art;
  }
  function icon(kind) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', '20'); svg.setAttribute('height', '20');
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.5');
    svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round'); svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const paths = {
      arrow: 'M6 18 18 6M6 6h12v12', ended: 'M5 12h14',
      star: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
      snow: 'M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M8 4l4 4 4-4M8 20l4-4 4 4M3 11l5-1-1-5M21 13l-5 1 1 5M7 19l1-5-5-1M17 5l-1 5 5 1',
      locked: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3'
    };
    path.setAttribute('d', paths[kind] || paths.locked);
    svg.append(path); return svg;
  }
  class AdventCalendar extends HTMLElement {
    connectedCallback() {
      if (this.running) return;
      const configNode = this.querySelector('[data-advent-config]');
      if (!configNode) return;
      try { this.config = JSON.parse(configNode.getAttribute('data-advent-config')); } catch (_) { return; }
      this.grid = this.querySelector('[data-advent-grid]');
      this.status = this.querySelector('[data-advent-status]');
      this.dialog = this.querySelector('[data-advent-dialog]');
      this.link = this.querySelector('[data-advent-offer-link]');
      if (!this.grid || !this.status || !this.dialog || !this.link) return;
      this.running = true;
      this.onClick = event => this.handleClick(event);
      this.onVisibility = () => this.refresh();
      this.onAuxClick = event => {
        if (event.button === 1 && event.target.closest('[data-advent-offer-link]')) this.handleClick(event);
      };
      this.onClose = () => {
        if (this.dialog.open) return; // Ignore an older native close event after a rapid reopen.
        this.cancelCloseAnimation();
        this.openDate = null;
        this.link.removeAttribute('href');
        this.opener?.setAttribute('aria-expanded', 'false');
        if (this.opener && this.opener.isConnected) this.opener.focus({ preventScroll: true });
      };
      this.onCancel = event => { event.preventDefault(); this.closeOffer({ animate: true }); };
      this.addEventListener('click', this.onClick);
      this.addEventListener('auxclick', this.onAuxClick);
      this.dialog.addEventListener('close', this.onClose);
      this.dialog.addEventListener('cancel', this.onCancel);
      document.addEventListener('visibilitychange', this.onVisibility);
      this.lastSignature = null;
      this.refresh();
      this.interval = window.setInterval(() => this.refresh(), 30000);
      this.scheduleMidnight();
    }
    today() {
      return this.config.designMode === true && api.parseDay(this.config.previewDate) !== null
        ? this.config.previewDate : api.colombiaDay(new Date());
    }
    scheduleMidnight() {
      window.clearTimeout(this.midnight);
      const next = (api.parseDay(api.colombiaDay(new Date())) + 1) * 86400000 + 5 * 3600000;
      this.midnight = window.setTimeout(() => {
        this.refresh();
        this.scheduleMidnight();
      }, Math.max(1, next - Date.now()));
    }
    cancelCloseAnimation() {
      const animation = this.closingAnimation;
      this.closingAnimation = null;
      this.closingDate = null;
      if (animation) animation.cancel();
    }
    closeOffer({ animate = false } = {}) {
      const date = this.openDate;
      this.link.removeAttribute('href');
      this.openDate = null;
      if (!this.dialog.open) { this.cancelCloseAnimation(); return; }
      if (!animate || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || typeof this.dialog.animate !== 'function') {
        this.cancelCloseAnimation();
        this.dialog.close();
        return;
      }
      if (this.closingAnimation) return;
      let animation;
      try {
        animation = this.dialog.animate([
          { opacity: 1, transform: 'perspective(900px) rotateY(0deg) scale(1)' },
          { opacity: 0, transform: 'perspective(900px) rotateY(-5deg) scale(.985)' }
        ], { duration: 140, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' });
      } catch (_) { this.dialog.close(); return; }
      this.closingAnimation = animation;
      this.closingDate = date;
      const finish = () => {
        if (this.closingAnimation !== animation) return;
        this.closingAnimation = null;
        this.closingDate = null;
        if (this.dialog.open) this.dialog.close();
        animation.cancel();
      };
      animation.finished.then(finish, finish);
    }
    refresh() {
      this.model = api.buildCalendar({ ...this.config, today: this.today() });
      const active = this.model.days.find(d => d.state === 'active');
      const displayedDate = this.openDate || this.closingDate;
      if (displayedDate && (!active || active.date !== displayedDate)) this.closeOffer();
      const signature = JSON.stringify([this.today(), this.config]);
      if (signature === this.lastSignature) return;
      this.lastSignature = signature;
      const focusedDate = this.grid.contains(document.activeElement) ? document.activeElement.dataset.adventDay : null;
      const messages = {
        invalid: 'Estamos preparando este calendario. Vuelve pronto.',
        before: 'La cuenta regresiva ya empezó. Vuelve el ' + (this.model.valid ? formatDay(this.config.start) : '') + ' para descubrir la primera puerta.',
        ended: 'Este calendario ha finalizado. Gracias por compartir esta Navidad con nosotros.',
        active: active ? 'La puerta de hoy está lista. Ábrela y descubre tu oferta.' : 'Hoy no hay una oferta publicada. Vuelve a consultar el calendario en la próxima fecha.'
      };
      this.status.textContent = messages[this.model.phase];
      const range = this.querySelector('[data-advent-range]');
      if (this.model.valid && range) {
        range.textContent = `${formatDay(this.config.start)} - ${formatDay(this.config.end)} de ${this.config.end.slice(0, 4)}`;
      }
      const issues = this.querySelector('[data-advent-issues]');
      if (issues && this.config.designMode === true) {
        const preview = api.parseDay(this.config.previewDate) !== null ? `Vista previa: ${formatDay(this.config.previewDate)}. ` : '';
        const invalidPreview = this.config.previewDate && api.parseDay(this.config.previewDate) === null ? 'Fecha de prueba inválida; se usa la fecha real. ' : '';
        issues.textContent = preview + invalidPreview + (this.model.issues.join(' ') || 'Sin errores de fechas. Los borradores no se publican hasta completar y habilitar su promoción.');
      }
      const fragment = document.createDocumentFragment();
      const mosaic = this.model.valid;
      this.grid.classList.toggle('advent__grid--mosaic', mosaic);
      const wide = api.mosaicLayout(this.model.days.length, 5), small = api.mosaicLayout(this.model.days.length, 3);
      const areas = layout => layout.rows.map(row => `"${row.join(' ')}"`).join(' ');
      this.grid.style.setProperty('--advent-layout-wide', areas(wide));
      this.grid.style.setProperty('--advent-layout-small', areas(small));
      this.grid.style.setProperty('--advent-columns-wide', Math.min(5, this.model.days.length));
      this.grid.style.setProperty('--advent-columns-small', Math.min(3, this.model.days.length));
      const artUrl = api.safeUrl((this.getAttribute('data-advent-art') || '').replace(/^\/\//, 'https://'));
      for (const day of this.model.days) {
        const actionable = day.state === 'active' && typeof this.dialog.showModal === 'function';
        const door = document.createElement(actionable ? 'button' : 'div');
        door.className = `advent__door advent__door--${day.state}`;
        door.dataset.adventDay = day.date;
        if (mosaic) door.style.gridArea = `day${day.number}`;
        if (actionable) {
          door.type = 'button';
          door.setAttribute('aria-haspopup', 'dialog');
          door.setAttribute('aria-expanded', 'false');
          if (this.dialog.id) door.setAttribute('aria-controls', this.dialog.id);
        }
        else door.tabIndex = -1;
        const label = { future: 'Por descubrir', active: actionable ? 'Abrir oferta de hoy' : 'Consulta esta oferta desde un navegador actualizado', expired: 'Oferta finalizada', pending: 'Sin oferta publicada' }[day.state];
        door.setAttribute('aria-label', `${formatDay(day.date)}. ${label}`);
        if (day.date === this.today()) door.setAttribute('aria-current', 'date');
        const date = document.createElement('time'); date.dateTime = day.date; date.className = 'advent__door-date'; date.textContent = shortDateFormat.format(new Date(day.date + 'T12:00:00Z'));
        const number = document.createElement('span'); number.className = 'advent__door-number'; number.textContent = String(day.number); number.setAttribute('aria-hidden', 'true');
        const state = document.createElement('span'); state.className = 'advent__door-state'; state.textContent = actionable ? 'Abrir' : label;
        const mark = document.createElement('span'); mark.className = 'advent__door-mark'; mark.append(icon(actionable ? 'arrow' : day.state === 'expired' ? 'ended' : 'locked')); mark.setAttribute('aria-hidden', 'true');
        if (artUrl) door.append(festiveArt(artUrl, day.number));
        if (day.presentation.cover) {
          const cover = document.createElement('img');
          cover.className = 'advent__door-cover'; cover.src = day.presentation.cover; cover.alt = '';
          cover.width = 600; cover.height = 600; cover.loading = 'lazy'; cover.decoding = 'async';
          cover.style.objectFit = day.presentation.coverFit;
          cover.dataset.fit = day.presentation.coverFit;
          cover.addEventListener('error', () => { cover.remove(); door.classList.remove('advent__door--covered'); }, { once: true });
          door.classList.add('advent__door--covered'); door.append(cover);
        }
        door.append(date, number, state, mark); fragment.append(door);
      }
      if (mosaic) {
        for (let index = 0; index < Math.max(wide.decorations.length, small.decorations.length); index++) {
          const kind = index % 3 === 0 ? 'gift' : index % 3 === 1 ? 'star' : 'snow';
          const piece = document.createElement('div');
          piece.className = `advent__decoration advent__decoration--${kind}`;
          piece.style.gridArea = `deco${index + 1}`;
          piece.style.setProperty('--advent-display-wide', index < wide.decorations.length ? 'grid' : 'none');
          piece.style.setProperty('--advent-display-small', index < small.decorations.length ? 'grid' : 'none');
          piece.setAttribute('aria-hidden', 'true');
          if (kind !== 'gift') piece.append(icon(kind));
          fragment.append(piece);
        }
      }
      this.grid.replaceChildren(fragment);
      this.grid.hidden = !this.model.valid;
      if (focusedDate) this.grid.querySelector(`[data-advent-day="${focusedDate}"]`)?.focus({ preventScroll: true });
    }
    handleClick(event) {
      const target = event.target.closest('button[data-advent-day], [data-advent-close], [data-advent-offer-link]');
      if (!target || !this.contains(target)) return;
      if (target.matches('[data-advent-close]')) { this.closeOffer({ animate: true }); return; }
      if (target.matches('[data-advent-offer-link]')) {
        const date = this.openDate;
        this.refresh();
        if (!date || !this.model.days.some(d => d.date === date && d.state === 'active')) event.preventDefault();
        return;
      }
      const date = target.dataset.adventDay;
      this.refresh(); // Recheck validity even if a background tab delayed its timer.
      const day = this.model.days.find(d => d.date === date && d.state === 'active');
      if (!day || typeof this.dialog.showModal !== 'function') return;
      this.cancelCloseAnimation();
      this.opener = target;
      target.setAttribute('aria-expanded', 'true');
      this.openDate = date;
      this.querySelector('[data-advent-offer-date]').textContent = `${formatDay(date)} · Solo por hoy`;
      this.querySelector('[data-advent-offer-title]').textContent = day.offer.title;
      this.querySelector('[data-advent-offer-discount]').textContent = day.offer.discount;
      const termsNode = this.querySelector('[data-advent-offer-terms]');
      const terms = typeof day.offer.terms === 'string' ? day.offer.terms.trim() : '';
      termsNode.textContent = terms; termsNode.hidden = !terms;
      if (terms) this.dialog.setAttribute('aria-describedby', termsNode.id);
      else this.dialog.removeAttribute('aria-describedby');
      const image = this.querySelector('[data-advent-offer-image]');
      const src = api.safeUrl((day.offer.image || '').replace(/^\/\//, 'https://'));
      image.hidden = !src;
      image.replaceChildren();
      if (src) {
        const photo = document.createElement('img');
        photo.src = src; photo.alt = day.offer.title; photo.width = 600; photo.height = 400;
        image.append(photo);
      }
      this.link.setAttribute('href', day.offer.url);
      if (!this.dialog.open) this.dialog.showModal();
    }
    disconnectedCallback() {
      if (!this.running) return;
      this.closeOffer();
      window.clearInterval(this.interval);
      window.clearTimeout(this.midnight);
      this.removeEventListener('click', this.onClick);
      this.removeEventListener('auxclick', this.onAuxClick);
      this.dialog.removeEventListener('close', this.onClose);
      this.dialog.removeEventListener('cancel', this.onCancel);
      document.removeEventListener('visibilitychange', this.onVisibility);
      this.running = false;
    }
  }
  customElements.define('advent-calendar', AdventCalendar);
})();
