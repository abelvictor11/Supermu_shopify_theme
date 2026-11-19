/* Calendar presentation only. Shopify remains responsible for discount validity. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SupermuAdvent = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DAY = 86400000;
  function parseDay(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(value + 'T00:00:00Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
    return date.getTime() / DAY;
  }
  function colombiaDay(now) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const part = type => parts.find(p => p.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function safeUrl(value) {
    if (typeof value !== 'string' || /[\u0000-\u0020\\]/.test(value)) return '';
    if (/^\/(?!\/)/.test(value)) return value;
    try { return new URL(value).protocol === 'https:' ? value : ''; } catch (_) { return ''; }
  }
  const filled = value => typeof value === 'string' && value.trim().length > 0;
  function buildCalendar({ start, end, today, offers = [] }) {
    const first = parseDay(start), last = parseDay(end), current = parseDay(today);
    const issues = [];
    if (first === null || last === null || current === null || last < first || last - first > 30) {
      return { valid: false, phase: 'invalid', days: [], issues: ['Revisa las fechas: usa AAAA-MM-DD y un intervalo de 1 a 31 días.'] };
    }
    const byDate = new Map();
    for (const offer of Array.isArray(offers) ? offers : []) {
      const day = parseDay(offer.date);
      if (day === null) { issues.push(`Fecha inválida: ${offer.title || offer.id || 'promoción'}.`); continue; }
      if (day < first || day > last) { issues.push(`Promoción fuera de campaña: ${offer.title || offer.date}.`); continue; }
      const matches = byDate.get(offer.date) || [];
      matches.push(offer); byDate.set(offer.date, matches);
      if (matches.length === 2) issues.push(`Fecha duplicada: ${offer.date}. Deja solo una promoción por día.`);
      if (offer.enabled === true && (!filled(offer.title) || !filled(offer.discount) || !safeUrl(offer.url) || !filled(offer.terms))) {
        issues.push(`Completa marca, descuento, destino y condiciones: ${offer.title || offer.date}.`);
      }
    }
    const days = [];
    for (let day = first; day <= last; day++) {
      const date = new Date(day * DAY).toISOString().slice(0, 10);
      const matches = byDate.get(date) || [];
      const item = matches.length === 1 ? matches[0] : null;
      const ready = item && item.enabled === true && filled(item.title) && filled(item.discount) && filled(item.terms) && safeUrl(item.url);
      const state = day < current ? 'expired' : day > current ? 'future' : ready ? 'active' : 'pending';
      days.push({ date, number: day - first + 1, state, offer: state === 'active' ? { ...item, url: safeUrl(item.url) } : null });
    }
    return { valid: true, phase: current < first ? 'before' : current > last ? 'ended' : 'active', days, issues };
  }
  return { parseDay, colombiaDay, safeUrl, buildCalendar };
});
