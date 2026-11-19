(function () {
  'use strict';
  if (customElements.get('advent-calendar')) return;
  const api = window.SupermuAdvent;
  if (!api) return; // Keep the informative Liquid fallback when an asset fails.
  const dateFormat = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const formatDay = date => dateFormat.format(new Date(date + 'T12:00:00Z'));
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
      this.onClose = () => {
        this.openDate = null;
        this.link.removeAttribute('href');
        if (this.opener && this.opener.isConnected) this.opener.focus({ preventScroll: true });
      };
      this.addEventListener('click', this.onClick);
      this.dialog.addEventListener('close', this.onClose);
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
    closeOffer() {
      this.link.removeAttribute('href');
      this.openDate = null;
      if (this.dialog.open) this.dialog.close();
    }
    refresh() {
      this.model = api.buildCalendar({ ...this.config, today: this.today() });
      const active = this.model.days.find(d => d.state === 'active');
      if (this.openDate && (!active || active.date !== this.openDate)) this.closeOffer();
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
      if (this.model.valid) {
        this.querySelector('[data-advent-range]').textContent = `${formatDay(this.config.start)} — ${formatDay(this.config.end)} de ${this.config.end.slice(0, 4)}`;
      }
      const issues = this.querySelector('[data-advent-issues]');
      if (issues && this.config.designMode === true) {
        const preview = api.parseDay(this.config.previewDate) !== null ? `Vista previa: ${formatDay(this.config.previewDate)}. ` : '';
        const invalidPreview = this.config.previewDate && api.parseDay(this.config.previewDate) === null ? 'Fecha de prueba inválida; se usa la fecha real. ' : '';
        issues.textContent = preview + invalidPreview + (this.model.issues.join(' ') || 'Sin errores de fechas. Los borradores no se publican hasta completar y habilitar su promoción.');
      }
      const fragment = document.createDocumentFragment();
      for (const day of this.model.days) {
        const actionable = day.state === 'active' && typeof this.dialog.showModal === 'function';
        const door = document.createElement(actionable ? 'button' : 'div');
        door.className = `advent__door advent__door--${day.state}`;
        door.dataset.adventDay = day.date;
        if (actionable) door.type = 'button';
        else door.tabIndex = -1;
        const label = { future: 'Por descubrir', active: actionable ? 'Abrir oferta de hoy' : 'Consulta esta oferta desde un navegador actualizado', expired: 'Oferta finalizada', pending: 'Sin oferta publicada' }[day.state];
        door.setAttribute('aria-label', `${formatDay(day.date)}. ${label}`);
        if (day.date === this.today()) door.setAttribute('aria-current', 'date');
        const date = document.createElement('time'); date.dateTime = day.date; date.className = 'advent__door-date'; date.textContent = formatDay(day.date);
        const number = document.createElement('span'); number.className = 'advent__door-number'; number.textContent = String(day.number).padStart(2, '0'); number.setAttribute('aria-hidden', 'true');
        const state = document.createElement('span'); state.className = 'advent__door-state'; state.textContent = label;
        const mark = document.createElement('span'); mark.className = 'advent__door-mark'; mark.textContent = actionable ? '↗' : day.state === 'expired' ? '—' : '+'; mark.setAttribute('aria-hidden', 'true');
        door.append(date, number, state, mark); fragment.append(door);
      }
      this.grid.replaceChildren(fragment);
      this.grid.hidden = !this.model.valid;
      if (focusedDate) this.grid.querySelector(`[data-advent-day="${focusedDate}"]`)?.focus({ preventScroll: true });
    }
    handleClick(event) {
      const target = event.target.closest('button[data-advent-day], [data-advent-close], [data-advent-offer-link]');
      if (!target || !this.contains(target)) return;
      if (target.matches('[data-advent-close]')) { this.closeOffer(); return; }
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
      this.opener = target;
      this.openDate = date;
      this.querySelector('[data-advent-offer-date]').textContent = `${formatDay(date)} · Solo por hoy`;
      this.querySelector('[data-advent-offer-title]').textContent = day.offer.title;
      this.querySelector('[data-advent-offer-discount]').textContent = day.offer.discount;
      this.querySelector('[data-advent-offer-terms]').textContent = day.offer.terms;
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
      this.dialog.showModal();
    }
    disconnectedCallback() {
      if (!this.running) return;
      this.closeOffer();
      window.clearInterval(this.interval);
      window.clearTimeout(this.midnight);
      this.removeEventListener('click', this.onClick);
      this.dialog.removeEventListener('close', this.onClose);
      document.removeEventListener('visibilitychange', this.onVisibility);
      this.running = false;
    }
  }
  customElements.define('advent-calendar', AdventCalendar);
})();
