const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { renderCalendar } = require('./helpers/advent-fixture');
const { JSDOM } = require('jsdom');

test('Shopify template starts with ten truthful disabled drafts, editable dates and no fake destinations', () => {
  const template = JSON.parse(fs.readFileSync(path.join(root,'templates/page.advent-calendar.json'),'utf8'));
  const section = template.sections.calendar;
  assert.equal(section.settings.start_date,'2026-11-23');
  assert.equal(section.settings.end_date,'2026-12-07');
  assert.deepEqual(section.block_order.map(id=>section.blocks[id].settings.discount),['','','20%','30%','20%','20%','20%','','10%','']);
  assert.deepEqual(section.block_order.map(id=>section.blocks[id].settings.title),['Aromáticas Hindú','La Constancia','Ranchera','Aguardiente Antioqueño','Pietrán','Colcafé y Chocolates Corona','Zenú','Saltín Noel–Ducales','Galletas Navideñas Noel','Juan Valdez']);
  assert.equal(section.block_order.length,10);
  for(const block of Object.values(section.blocks)) {assert.equal(block.settings.enabled,false); assert.ok(!block.settings.url);assert.ok(!block.settings.terms);}
});

test('rendered Liquid escapes script-closing content and preview date never enters public config', async () => {
  const payload='</script><img src=x onerror=alert(1)>';
  const args={previewDate:'2026-11-25',offers:[{id:'x',title:payload,enabled:false,discount:'',date:'2026-11-25'}]};
  for(const designMode of [true,false]) {
    const dom=new JSDOM(await renderCalendar({...args,designMode}));
    const config=JSON.parse(dom.window.document.querySelector('[data-advent-config]').getAttribute('data-advent-config'));
    assert.equal(config.offers[0].title,payload);
    assert.equal(config.previewDate,designMode?'2026-11-25':'');
    assert.equal(dom.window.document.querySelector('[onerror]'),null);
    assert.equal(dom.window.document.querySelectorAll('[data-advent-editor]').length,designMode?1:0);
    assert.equal(dom.window.document.querySelector('[data-advent-grid]').hidden,true);
    dom.window.close();
  }
});
test('section schema has editable campaign dates, per-offer dates and unique setting IDs', () => {
  const liquid = fs.readFileSync(path.join(root,'sections/advent-calendar.liquid'),'utf8');
  const schema = JSON.parse(liquid.split('{% schema %}')[1].split('{% endschema %}')[0]);
  assert.equal(schema.max_blocks,31);
  for(const settings of [schema.settings,...schema.blocks.map(b=>b.settings)]) {
    const ids=settings.filter(s=>s.id).map(s=>s.id);assert.equal(ids.length,new Set(ids).size);
  }
  assert.ok(schema.settings.find(s=>s.id==='start_date'));
  assert.ok(schema.settings.find(s=>s.id==='end_date'));
  assert.ok(schema.blocks[0].settings.find(s=>s.id==='date'));
});
