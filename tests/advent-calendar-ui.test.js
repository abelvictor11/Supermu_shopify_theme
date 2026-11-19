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

async function mounted(options={}) {
  const dom=new JSDOM(await renderCalendar(options),{url:'https://supermu.test/pages/navidad',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window; let clock='2026-11-25T17:00:00Z'; const RealDate=w.Date;
  w.Date=class extends RealDate {constructor(...args){super(...(args.length?args:[clock]));} static now(){return new RealDate(clock).getTime();}};
  const intervals=new Map(),timeouts=new Map();let id=0;
  w.setInterval=fn=>{intervals.set(++id,fn);return id;};w.clearInterval=n=>intervals.delete(n);
  w.setTimeout=(fn,delay)=>{timeouts.set(++id,{fn,delay});return id;};w.clearTimeout=n=>timeouts.delete(n);
  // jsdom lacks native dialog; only stub browser-owned showModal/close behavior.
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;this.querySelector('button').focus();};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  for(const asset of ['advent-calendar-state.js','advent-calendar.js']) w.eval(fs.readFileSync(path.join(root,'assets',asset),'utf8'));
  return {dom,w,el:w.document.querySelector('advent-calendar'),intervals,timeouts,setTime:value=>{clock=value;}};
}
const readyOffer={date:'2026-11-25',title:'Ranchera',discount:'20%',enabled:true,url:'/collections/ranchera',terms:'Condiciones de prueba, no publicables.'};

test('real component renders 15 doors, opens only today, and restores focus on close',async()=>{
  const {dom,el}=await mounted({offers:[readyOffer]});
  try {
    assert.equal(el.querySelectorAll('[data-advent-day]').length,15);
    assert.equal(el.querySelectorAll('button[data-advent-day]').length,1);
    const button=el.querySelector('button[data-advent-day]'); button.focus();button.click();
    assert.equal([...el.querySelectorAll('img')].filter(img=>!img.getAttribute('src')).length,0);
    assert.equal(el.querySelector('dialog').open,true);
    assert.equal(el.querySelector('[data-advent-offer-title]').textContent,'Ranchera');
    assert.equal(el.querySelector('[data-advent-offer-link]').getAttribute('href'),'/collections/ranchera');
    el.querySelector('[data-advent-close]').click();
    assert.equal(el.querySelector('dialog').open,false);assert.equal(dom.window.document.activeElement,button);
  } finally {dom.window.close();}
});
test('midnight timer revokes open offer and purchase destination',async()=>{
  const {dom,el,timeouts,setTime}=await mounted({offers:[readyOffer]});
  try {
    el.querySelector('button[data-advent-day]').click();
    setTime('2026-11-26T05:00:00Z');
    const timeout=[...timeouts.values()][0]; assert.ok(timeout.delay>0);timeout.fn();
    assert.equal(el.querySelector('dialog').open,false);
    assert.equal(el.querySelector('[data-advent-offer-link]').hasAttribute('href'),false);
    assert.equal(el.querySelectorAll('button[data-advent-day]').length,0);
  }finally{dom.window.close();}
});
test('click after expiration cannot navigate even before the next timer tick',async()=>{
  const {dom,w,el,setTime}=await mounted({offers:[readyOffer]});
  try {
    el.querySelector('button[data-advent-day]').click();setTime('2026-11-26T05:00:00Z');
    const click=new w.MouseEvent('click',{bubbles:true,cancelable:true});
    el.querySelector('[data-advent-offer-link]').dispatchEvent(click);
    assert.equal(click.defaultPrevented,true);
    assert.equal(el.querySelector('dialog').open,false);
  } finally {dom.window.close();}
});
test('middle-click after expiration is cancelled and removes the expired destination',async()=>{
  const {dom,w,el,setTime}=await mounted({offers:[readyOffer]});
  try {
    el.querySelector('button[data-advent-day]').click();setTime('2026-11-26T05:00:00Z');
    const event=new w.MouseEvent('auxclick',{button:1,bubbles:true,cancelable:true});
    el.querySelector('[data-advent-offer-link]').dispatchEvent(event);
    assert.equal(event.defaultPrevented,true);
    assert.equal(el.querySelector('[data-advent-offer-link]').hasAttribute('href'),false);
    assert.equal(el.querySelector('dialog').open,false);
  }finally{dom.window.close();}
});
test('public preview cannot unlock future dates; editor preview can and reports incomplete entries',async()=>{
  for(const designMode of [false,true]) {
    const {dom,el}=await mounted({designMode,previewDate:'2026-11-23',offers:[{...readyOffer,date:'2026-11-23'},{...readyOffer,date:'broken'}]});
    try {
      assert.equal(el.querySelectorAll('button[data-advent-day]').length,designMode?1:0);
      if(designMode) assert.match(el.querySelector('[data-advent-issues]').textContent,/inválida/);
    }finally{dom.window.close();}
  }
});
test('disconnect cleans clock and reconnect creates one clock and one set of doors',async()=>{
  const {dom,w,el,intervals,timeouts}=await mounted({offers:[readyOffer]});
  try {
    assert.equal(intervals.size,1);assert.equal(timeouts.size,1);
    el.remove(); assert.equal(intervals.size,0);assert.equal(timeouts.size,0);
    w.document.body.append(el);assert.equal(intervals.size,1);assert.equal(timeouts.size,1);
    assert.equal(el.querySelectorAll('[data-advent-day]').length,15);
  } finally {dom.window.close();}
});
test('unsupported dialogs and malformed campaign keep informative content, no broken purchase controls',async()=>{
  const {dom,el}=await mounted({settings:{start_date:'2026-02-30'},offers:[readyOffer]});
  try{assert.equal(el.querySelectorAll('button[data-advent-day]').length,0);assert.match(el.querySelector('[data-advent-status]').textContent,/preparando/);}finally{dom.window.close();}
});
