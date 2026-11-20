const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { renderCalendar } = require('./helpers/advent-fixture');
const { JSDOM } = require('jsdom');

test('initial campaign fixture preserves the ten supplied drafts without invented destinations', () => {
  const template = JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/advent-calendar-initial.json'),'utf8'));
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

test('standalone calendar still opens offers with range and timezone note switched off',async()=>{
  const {dom,el}=await mounted({settings:{separate_sections:true,show_range:false,show_timezone:false},offers:[readyOffer]});
  try{
    assert.equal(el.querySelector('[data-advent-range]'),null);
    assert.equal(el.querySelector('.advent__hero,.advent__closing,.advent__calendar-head,.advent__timezone'),null);
    el.querySelector('button[data-advent-day]').click();assert.equal(el.querySelector('dialog').open,true);
  }finally{dom.window.close();}
});

function captureClosingAnimation(dialog) {
  const calls=[];
  dialog.animate=(frames,options)=>{
    let finish,reject;
    const animation={finished:new Promise((resolve,fail)=>{finish=resolve;reject=fail;}),cancelled:false,cancel(){this.cancelled=true;}};
    calls.push({animation,frames,options,finish,reject});return animation;
  };
  return calls;
}

test('closing revokes the link immediately and plays one bounded exit before restoring focus',async()=>{
  const {dom,el}=await mounted({offers:[readyOffer]});
  try {
    const door=el.querySelector('button[data-advent-day]');door.click();
    const dialog=el.querySelector('dialog'),calls=captureClosingAnimation(dialog);
    assert.equal(door.getAttribute('aria-expanded'),'true');
    el.querySelector('[data-advent-close]').click();el.querySelector('[data-advent-close]').click();
    assert.equal(calls.length,1);assert.ok(calls[0].options.duration<=180);assert.equal(dialog.open,true);
    assert.equal(el.querySelector('[data-advent-offer-link]').hasAttribute('href'),false);
    calls[0].finish();await Promise.resolve();
    assert.equal(dialog.open,false);assert.equal(door.getAttribute('aria-expanded'),'false');
    assert.equal(dom.window.document.activeElement,door);assert.equal(calls[0].animation.cancelled,true);
  } finally {dom.window.close();}
});
test('Escape uses the same close transition without losing native dialog focus protection',async()=>{
  const {dom,w,el}=await mounted({offers:[readyOffer]});
  try {
    el.querySelector('button[data-advent-day]').click();const dialog=el.querySelector('dialog'),calls=captureClosingAnimation(dialog);
    const cancel=new w.Event('cancel',{cancelable:true});dialog.dispatchEvent(cancel);
    assert.equal(cancel.defaultPrevented,true);assert.equal(calls.length,1);assert.equal(dialog.open,true);
    calls[0].finish();await Promise.resolve();assert.equal(dialog.open,false);
  } finally {dom.window.close();}
});
test('reopen cancels an old exit; stale animation and close events cannot revoke the new offer',async()=>{
  const {dom,w,el}=await mounted({offers:[readyOffer]});
  try {
    const door=el.querySelector('button[data-advent-day]');door.click();
    const dialog=el.querySelector('dialog'),calls=captureClosingAnimation(dialog);
    el.querySelector('[data-advent-close]').click();door.click();
    assert.equal(calls[0].animation.cancelled,true);calls[0].finish();await Promise.resolve();
    dialog.dispatchEvent(new w.Event('close'));
    assert.equal(dialog.open,true);assert.equal(door.getAttribute('aria-expanded'),'true');
    assert.equal(el.querySelector('[data-advent-offer-link]').getAttribute('href'),readyOffer.url);
  } finally {dom.window.close();}
});
test('a rejected exit animation closes safely and leaves no purchasable link',async()=>{
  const {dom,el}=await mounted({offers:[readyOffer]});
  try {
    el.querySelector('button[data-advent-day]').click();const dialog=el.querySelector('dialog'),calls=captureClosingAnimation(dialog);
    el.querySelector('[data-advent-close]').click();calls[0].reject(new Error('cancelled'));await Promise.resolve();
    assert.equal(dialog.open,false);assert.equal(el.querySelector('[data-advent-offer-link]').hasAttribute('href'),false);
  } finally {dom.window.close();}
});
test('midnight and disconnect bypass any pending exit animation immediately',async()=>{
  for(const reason of ['midnight','disconnect']) {
    const {dom,el,setTime}=await mounted({offers:[readyOffer]});
    try {
      el.querySelector('button[data-advent-day]').click();const dialog=el.querySelector('dialog'),calls=captureClosingAnimation(dialog);
      el.querySelector('[data-advent-close]').click();
      if(reason==='midnight'){setTime('2026-11-26T05:00:00Z');el.refresh();}else el.remove();
      assert.equal(dialog.open,false);assert.equal(calls[0].animation.cancelled,true);
      calls[0].finish();await Promise.resolve();assert.equal(dialog.open,false);
    } finally {dom.window.close();}
  }
});
test('reduced motion skips spatial exit and retains immediate close feedback',async()=>{
  const {dom,w,el}=await mounted({offers:[readyOffer]});
  try {
    w.matchMedia=()=>({matches:true});el.querySelector('button[data-advent-day]').click();
    const dialog=el.querySelector('dialog'),calls=captureClosingAnimation(dialog);
    el.querySelector('[data-advent-close]').click();assert.equal(calls.length,0);assert.equal(dialog.open,false);
  } finally {dom.window.close();}
});
test('a failed animation API never leaves a dialog stuck open',async()=>{
  const {dom,el}=await mounted({offers:[readyOffer]});
  try {
    el.querySelector('button[data-advent-day]').click();el.querySelector('dialog').animate=()=>{throw new Error('unsupported');};
    el.querySelector('[data-advent-close]').click();assert.equal(el.querySelector('dialog').open,false);
  } finally {dom.window.close();}
});
test('failed card covers fall back without unlocking the day',async()=>{
  const {dom,w,el}=await mounted({offers:[{...readyOffer,date:'2026-11-26',enabled:false,cover_image:'/broken.jpg'}]});
  try {
    const card=el.querySelector('[data-advent-day="2026-11-26"]');card.querySelector('img').dispatchEvent(new w.Event('error'));
    assert.equal(card.querySelector('img'),null);assert.equal(card.classList.contains('advent__door--covered'),false);
    assert.equal(card.tagName,'DIV');assert.equal(el.querySelectorAll('button[data-advent-day]').length,0);
  } finally {dom.window.close();}
});

test('motion stays scoped to actionable doors and has a non-spatial reduced-motion path',()=>{
  const css=fs.readFileSync(path.join(root,'assets/advent-calendar.css'),'utf8');
  assert.match(css,/@keyframes advent-unseal/);
  assert.match(css,/@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/);
  assert.match(css,/button\.advent__door--active:hover[^}]*\}/);
  assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*advent-feedback/);
  assert.doesNotMatch(css,/animation:[^;]*infinite/);
});

test('calendar small text retains AA contrast against the campaign red',()=>{
  const css=fs.readFileSync(path.join(root,'assets/advent-calendar.css'),'utf8');
  const color=name=>css.match(new RegExp(`--advent-${name}: #([0-9a-f]{6})`))[1];
  const luminance=hex=>hex.match(/../g).map(v=>parseInt(v,16)/255)
    .map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4)
    .reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  assert.ok((luminance(color('paper'))+.05)/(luminance(color('red'))+.05)>=4.5);
  assert.match(css,/\.advent \.advent__status\s*\{[^}]*color: var\(--advent-paper\)/);
});

test('real component renders 15 doors, opens only today, and restores focus on close',async()=>{
  const {dom,el}=await mounted({offers:[readyOffer]});
  try {
    assert.equal(el.querySelectorAll('[data-advent-day]').length,15);
    assert.equal(el.querySelectorAll('button[data-advent-day]').length,1);
    const button=el.querySelector('button[data-advent-day]'); button.focus();button.click();
    assert.equal([...el.querySelectorAll('img')].filter(img=>!img.getAttribute('src')).length,0);
    assert.equal(el.querySelector('dialog').open,true);
    assert.equal(el.querySelector('[data-advent-offer-title]').textContent,'Ranchera');
    assert.equal(el.querySelector('[data-advent-offer-terms]').hidden,false);
    assert.equal(el.querySelector('dialog').getAttribute('aria-describedby'),el.querySelector('[data-advent-offer-terms]').id);
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
test('Liquid sends card cover independently from surprise photo, including disabled drafts', async()=>{
  const dom=new JSDOM(await renderCalendar({offers:[{...readyOffer,enabled:false,cover_image:'/assets/cover.jpg',image:'/assets/surprise.jpg',cover_fit:'contain'}]}));
  try{
    const config=JSON.parse(dom.window.document.querySelector('[data-advent-config]').getAttribute('data-advent-config'));
    assert.equal(config.offers[0].cover,'/assets/cover.jpg');assert.equal(config.offers[0].image,'/assets/surprise.jpg');
    assert.equal(config.offers[0].coverFit,'contain');
  }finally{dom.window.close();}
});
test('mosaic has decorative non-actions and keeps future card covers non-interactive',async()=>{
  const {dom,el}=await mounted({offers:[readyOffer,{...readyOffer,date:'2026-11-26',cover_image:'/assets/advent-bunuelos.jpg'}]});
  try{
    assert.equal(el.querySelectorAll('[data-advent-day]').length,15);
    assert.equal(el.querySelectorAll('button[data-advent-day]').length,1);
    const locked=el.querySelector('[data-advent-day="2026-11-26"]');
    assert.equal(locked.tagName,'DIV');assert.equal(locked.querySelector('img').getAttribute('src'),'/assets/advent-bunuelos.jpg');
    assert.ok(el.querySelectorAll('.advent__decoration').length>0);
    for(const tile of el.querySelectorAll('.advent__decoration')){assert.equal(tile.tagName,'DIV');assert.equal(tile.getAttribute('aria-hidden'),'true');}
    locked.click();assert.equal(el.querySelector('dialog').open,false);
    el.querySelector('button[data-advent-day]').click();assert.equal(el.querySelector('dialog').open,true);
  }finally{dom.window.close();}
});
test('changing campaign length retains all dates without decorative placement holes',async()=>{
  const {dom,el}=await mounted({settings:{end_date:'2026-11-29'},offers:[readyOffer]});
  try{assert.equal(el.querySelectorAll('[data-advent-day]').length,7);assert.ok(el.querySelector('[data-advent-grid]').classList.contains('advent__grid--mosaic'));}
  finally{dom.window.close();}
});

test('19-day campaign receives responsive mosaic placement and public default illustrations',async()=>{
  const {dom,el}=await mounted({settings:{start_date:'2026-11-19',end_date:'2026-12-07'},offers:[readyOffer]});
  try{
    const grid=el.querySelector('[data-advent-grid]');
    assert.ok(grid.classList.contains('advent__grid--mosaic'));
    assert.ok(grid.style.getPropertyValue('--advent-layout-wide').includes('day19'));
    assert.ok(grid.style.getPropertyValue('--advent-layout-small').includes('day19'));
    assert.equal(el.querySelectorAll('.advent__door-art').length,19);
    assert.equal(el.querySelectorAll('button[data-advent-day]').length,1);
  }finally{dom.window.close();}
});

test('editor explains exactly why an enabled offer for today remains blocked',async()=>{
  const {dom,el}=await mounted({designMode:true,offers:[{...readyOffer,url:'',terms:''}]});
  try{
    assert.match(el.querySelector('[data-advent-issues]').textContent,/Falta destino válido: Ranchera/);
    assert.doesNotMatch(el.querySelector('[data-advent-issues]').textContent,/Faltan[^.]*condiciones/);
    assert.equal(el.querySelectorAll('button[data-advent-day]').length,0);
    assert.equal(el.querySelector('dialog').open,false);
  }finally{dom.window.close();}
});

test('today opens with optional terms empty and never exposes an empty description',async()=>{
  const {dom,el}=await mounted({offers:[{...readyOffer,terms:''}]});
  try{
    el.querySelector('button[data-advent-day]')?.click();
    assert.equal(el.querySelector('dialog').open,true);
    assert.equal(el.querySelector('[data-advent-offer-terms]').hidden,true);
    assert.equal(el.querySelector('dialog').hasAttribute('aria-describedby'),false);
    assert.equal(el.querySelector('[data-advent-offer-link]').getAttribute('href'),'/collections/ranchera');
  }finally{dom.window.close();}
});
