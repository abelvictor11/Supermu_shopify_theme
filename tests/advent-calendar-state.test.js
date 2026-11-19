const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseDay, colombiaDay, buildCalendar, safeUrl } = require('../assets/advent-calendar-state.js');
const offer = { id: 'ranchera', date: '2026-11-23', enabled: true, title: 'Ranchera', discount: '20%', url: '/collections/ranchera', terms: 'Productos seleccionados.' };
const calendar = (extra = {}) => buildCalendar({ start: '2026-11-23', end: '2026-12-07', today: '2026-11-23', offers: [offer], ...extra });

test('strict dates reject impossible days, malformed input and non-leap February', () => {
  for (const v of ['2026-02-30', '2026-02-29', '2026-2-03', '', null, '2026-11-23extra']) assert.equal(parseDay(v), null);
  assert.equal(typeof parseDay('2028-02-29'), 'number');
});
test('15 inclusive days cross November into December without shifting offers', () => {
  const result = calendar();
  assert.equal(result.valid, true);
  assert.equal(result.days.length, 15);
  assert.equal(result.days[0].date, '2026-11-23');
  assert.equal(result.days[14].date, '2026-12-07');
  assert.equal(result.days[0].state, 'active');
  assert.equal(result.days[0].offer.title, 'Ranchera');
  assert.equal(result.days[14].state, 'future');
  assert.equal(calendar({ start: '2026-11-24', today: '2026-11-24' }).days[0].state, 'pending');
});
test('campaign rejects reversed, impossible, oversized intervals or invalid current day', () => {
  for (const args of [{ end: '2026-11-22' }, { start: '2026-02-30' }, { end: '2026-12-24' }, { today: 'broken' }]) {
    const result = calendar(args); assert.equal(result.valid, false); assert.deepEqual(result.days, []);
  }
  assert.equal(calendar({end:'2026-11-23'}).days.length, 1);
});
test('Colombia midnight is 05:00 UTC, independent of machine timezone', () => {
  assert.equal(colombiaDay(new Date('2026-11-23T04:59:59Z')), '2026-11-22');
  assert.equal(colombiaDay(new Date('2026-11-23T05:00:00Z')), '2026-11-23');
});
test('expired offers lose their destination and do not accumulate', () => {
  const result = calendar({ today: '2026-11-24' });
  assert.equal(result.days[0].state, 'expired'); assert.equal(result.days[0].offer, null);
  assert.equal(result.days[1].state, 'pending');
  assert.equal(calendar({ today: '2026-11-22' }).phase, 'before');
  assert.equal(calendar({ today: '2026-12-08' }).phase, 'ended');
});
test('incomplete and disabled promotions never become purchasable', () => {
  for (const args of [{enabled:false},{enabled:'true'},{title:''},{discount:''},{url:''},{terms:''},{url:'javascript:alert(1)'}]) {
    const result = calendar({ offers: [{ ...offer, ...args }] });
    assert.equal(result.days[0].state, 'pending'); assert.equal(result.days[0].offer, null);
  }
});
test('duplicates block ambiguous dates while invalid and outside dates are reported', () => {
  const result = calendar({offers:[offer,{...offer,id:'duplicate'},{...offer,date:'2026-12-20'},{...offer,date:'2026-02-30'}]});
  assert.equal(result.days[0].state,'pending');
  assert.ok(result.issues.some(x=>x.includes('duplicada')));
  assert.ok(result.issues.some(x=>x.includes('fuera')));
  assert.ok(result.issues.some(x=>x.includes('inválida')));
});
test('safe navigation permits local and HTTPS destinations, rejects executable and protocol-relative URLs', () => {
  for (const url of ['//evil.test','/\\evil.test','javascript:alert(1)','data:text/html,x','http://shop.test','/foo\nbar']) assert.equal(safeUrl(url),'');
  assert.equal(safeUrl('/collections/ranchera'),'/collections/ranchera');
  assert.equal(safeUrl('https://supermu.com/collections/ranchera'),'https://supermu.com/collections/ranchera');
});
