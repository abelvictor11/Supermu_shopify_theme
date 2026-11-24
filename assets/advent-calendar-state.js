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
  function missingFields(offer) {
    return [[filled(offer.title), 'marca'], [filled(offer.discount), 'descuento'],
      [!!safeUrl(offer.url), 'destino válido']]
      .filter(([valid]) => !valid).map(([, label]) => label);
  }
  // Repeat the approved poster composition; pack a partial final panel in date order.
  function mosaicLayout(count, requestedColumns) {
    const columns = Math.min(count, requestedColumns);
    const rows = [], decorations = [];
    if (!Number.isInteger(count) || count < 1 || count > 31 || ![3, 5].includes(requestedColumns)) return {rows, decorations};
    const poster = columns === 5 ? [
      '1 x 2 3 x', 'x 4 5 x 6', '7 7 8 8 9', '10 x 11 12 13', '10 14 11 12 x', 'x 14 15 x x'
    ] : ['1 x 2', '3 4 4', 'x 5 6', '7 7 x', '8 9 10', 'x 9 10', '11 12 13', '11 12 x', '14 14 15', 'x x x'];
    let offset = 0;
    while (count - offset >= 15) {
      rows.push(...poster.map(row => row.split(' ').map(cell => cell === 'x' ? '' : `day${Number(cell) + offset}`)));
      offset += 15;
    }
    const tail = [], occupied = (x, y) => tail[y]?.[x];
    let cursor = 0;
    for (let day = offset + 1; day <= count; day++) {
      const wide = count - offset > 3 && day % 6 === 2 ? Math.min(2, columns) : 1;
      const high = count - offset > 5 && day % 7 === 4 ? 2 : 1;
      let x, y;
      while (true) {
        x = cursor % columns; y = Math.floor(cursor / columns);
        if (x + wide <= columns && Array.from({length:high}, (_,dy) =>
          Array.from({length:wide}, (_,dx) => !occupied(x+dx,y+dy)).every(Boolean)).every(Boolean)) break;
        cursor++;
      }
      for (let dy=0;dy<high;dy++) for(let dx=0;dx<wide;dx++) {
        if (!tail[y+dy]) tail[y+dy] = Array(columns).fill('');
        tail[y+dy][x+dx] = `day${day}`;
      }
      cursor += wide;
    }
    rows.push(...tail);
    while (rows.length && rows[rows.length-1].every(cell => !cell)) rows.pop();
    // All unused cells become visible, non-interactive poster ornaments, never fake dates.
    rows.forEach(row => row.forEach((cell, x) => {
      if (!cell) { const name = `deco${decorations.length+1}`; row[x] = name; decorations.push(name); }
    }));
    return {rows, decorations};
  }
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
      const missing = missingFields(offer);
      if (offer.enabled === true && missing.length) {
        issues.push(`Falta${missing.length > 1 ? 'n' : ''} ${missing.join(', ')}: ${offer.title || offer.date}.`);
      }
    }
    const days = [];
    for (let day = first; day <= last; day++) {
      const date = new Date(day * DAY).toISOString().slice(0, 10);
      const matches = byDate.get(date) || [];
      const item = matches.length === 1 ? matches[0] : null;
      const ready = item && item.enabled === true && missingFields(item).length === 0;
      const state = day < current ? 'expired' : day > current ? 'future' : ready ? 'active' : 'pending';
      const presentation = {
        cover: safeUrl(typeof item?.cover === 'string' ? item.cover.replace(/^\/\//, 'https://') : ''),
        coverFit: item?.coverFit === 'contain' ? 'contain' : 'cover'
      };
      days.push({ date, number: day - first + 1, state, presentation, offer: state === 'active' ? { ...item, url: safeUrl(item.url) } : null });
    }
    return { valid: true, phase: current < first ? 'before' : current > last ? 'ended' : 'active', days, issues };
  }
  return { parseDay, colombiaDay, safeUrl, buildCalendar, mosaicLayout };
});
