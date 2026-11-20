const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {Liquid}=require('liquidjs');
const {JSDOM}=require('jsdom');
const {renderCalendar,renderLanding,root}=require('./helpers/advent-fixture');
const initial=require('./fixtures/advent-calendar-initial.json');
const migrationPath=path.join(root,'scripts/split-advent-sections.js');
const moduleTypes=['advent-hero','advent-heading','advent-closing'];

async function renderModule(type,settings={}){
  const source=fs.readFileSync(path.join(root,`sections/${type}.liquid`),'utf8');
  const schema=JSON.parse(source.split('{% schema %}')[1].split('{% endschema %}')[0]);
  const defaults=Object.fromEntries(schema.settings.filter(s=>s.id).map(s=>[s.id,s.default??'']));
  const engine=new Liquid({strictFilters:true,root:path.join(root,'snippets'),extname:'.liquid'});
  engine.registerFilter('asset_url',name=>'/assets/'+name);
  engine.registerFilter('stylesheet_tag',url=>`<link rel="stylesheet" href="${url}">`);
  engine.registerFilter('image_url',image=>image);
  engine.registerFilter('image_tag',url=>`<img src="${url}" alt="">`);
  return engine.parseAndRender(source.split('{% schema %}')[0],{section:{id:type,settings:{...defaults,...settings}}});
}

test('calendar can render alone without either banner or its separate heading',async()=>{
  const dom=new JSDOM(await renderCalendar({settings:{separate_sections:true}}));
  try{
    assert.equal(dom.window.document.querySelector('.advent__hero'),null);
    assert.equal(dom.window.document.querySelector('.advent__closing'),null);
    assert.equal(dom.window.document.querySelector('.advent__calendar-head'),null);
    assert.ok(dom.window.document.querySelector('[data-advent-grid]'));
    assert.equal(dom.window.document.querySelector('.advent__calendar').getAttribute('aria-labelledby'),null);
    assert.ok(dom.window.document.querySelector('.advent__calendar').getAttribute('aria-label'));
  }finally{dom.window.close();}
});

test('each independent module has a page preset, isolated assets and unique schema settings',async()=>{
  for(const type of moduleTypes){
    assert.ok(fs.existsSync(path.join(root,`sections/${type}.liquid`)),type);
    const source=fs.readFileSync(path.join(root,`sections/${type}.liquid`),'utf8');
    const schema=JSON.parse(source.split('{% schema %}')[1].split('{% endschema %}')[0]);
    assert.ok(schema.presets.length);assert.deepEqual(schema.enabled_on.templates,['page']);
    const ids=schema.settings.filter(s=>s.id).map(s=>s.id);assert.equal(ids.length,new Set(ids).size);
    const dom=new JSDOM(await renderModule(type));
    assert.ok(dom.window.document.querySelector('link[href="/assets/advent-calendar.css"]'));
    assert.equal(dom.window.document.querySelector('advent-calendar'),null);
    dom.window.close();
  }
});

test('banner title, description, image and button can be turned off independently',async()=>{
  const dom=new JSDOM(await renderModule('advent-hero',{show_title:false,show_description:false,show_image:false,show_button:false}));
  try{assert.equal(dom.window.document.querySelector('h1,p,img,a'),null);}finally{dom.window.close();}
  const closing=new JSDOM(await renderModule('advent-closing',{show_title:false,show_description:false,show_image:true}));
  try{assert.ok(closing.window.document.querySelector('img'));assert.equal(closing.window.document.querySelector('h2,p'),null);}finally{closing.window.close();}
});

test('migration preserves every promotion, date, setting and existing section without mutating input',()=>{
  assert.ok(fs.existsSync(migrationPath));
  const {splitAdventSections}=require(migrationPath);
  const input=JSON.parse(JSON.stringify(initial));
  input.sections.calendar.settings={...input.sections.calendar.settings,start_date:'2026-11-19',preview_date:'2026-11-18',hero_image:'shopify://custom.jpg',heading:'Título propio',closing_text:'Cierre propio'};
  input.sections.calendar.blocks.constancia.settings={enabled:true,date:'2026-11-20',discount:'20%',collection:'aseo',cover_image:'shopify://cover.png',custom_property:'preserve'};
  input.sections.unrelated={type:'rich-text',settings:{title:'No tocar'}};input.order.push('unrelated');
  const before=JSON.parse(JSON.stringify(input)),result=splitAdventSections(input);
  assert.deepEqual(input,before);
  assert.deepEqual(result.sections.calendar.blocks,before.sections.calendar.blocks);
  assert.deepEqual(result.sections.calendar.block_order,before.sections.calendar.block_order);
  for(const [key,value] of Object.entries(before.sections.calendar.settings))assert.equal(result.sections.calendar.settings[key],value);
  assert.equal(result.sections.calendar.settings.separate_sections,true);
  assert.deepEqual(result.sections.unrelated,before.sections.unrelated);
  assert.deepEqual(result.order,['calendar_hero','calendar_heading','calendar','calendar_closing','unrelated']);
  assert.equal(result.sections.calendar_hero.settings.hero_image,'shopify://custom.jpg');
  assert.equal(result.sections.calendar_hero.settings.heading,'Título propio');
  assert.equal(result.sections.calendar_closing.settings.closing_text,'Cierre propio');
  assert.deepEqual(splitAdventSections(result),result);
});

test('removing calendar hides its banner CTA, and adding it back restores its real anchor',()=>{
  const asset=path.join(root,'assets/advent-sections.js');assert.ok(fs.existsSync(asset));
  const dom=new JSDOM('<a data-advent-calendar-link data-calendar-target="calendar-target" href="#calendar-target">Calendario</a><div id="section"><div id="calendar-target"></div></div>',{runScripts:'outside-only'});
  try{
    dom.window.eval(fs.readFileSync(asset,'utf8'));
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    const link=dom.window.document.querySelector('a'),section=dom.window.document.querySelector('#section');assert.equal(link.hidden,false);
    section.dispatchEvent(new dom.window.CustomEvent('shopify:section:unload',{bubbles:true}));section.remove();assert.equal(link.hidden,true);
    dom.window.document.body.append(section);section.dispatchEvent(new dom.window.CustomEvent('shopify:section:load',{bubbles:true}));assert.equal(link.hidden,false);
  }finally{dom.window.close();}
});

test('migration does not turn on a hidden campaign or overwrite a colliding section ID',()=>{
  const {splitAdventSections}=require(migrationPath);
  const input=JSON.parse(JSON.stringify(initial));input.sections.calendar.disabled=true;
  input.sections.calendar_hero={type:'rich-text',settings:{title:'Conservar'}};input.order.unshift('calendar_hero');
  const result=splitAdventSections(input);
  assert.deepEqual(result.sections.calendar_hero,input.sections.calendar_hero);
  assert.equal(result.sections.calendar_hero_1.disabled,true);
  assert.equal(result.sections.calendar_heading.disabled,true);
  assert.equal(result.sections.calendar_closing.disabled,true);
  assert.equal(result.sections.calendar.disabled,true);
});

test('migration refuses to exceed Shopify section limit without changing its input',()=>{
  const {splitAdventSections}=require(migrationPath);
  const input=JSON.parse(JSON.stringify(initial));
  for(let n=0;n<22;n++){input.sections['extra'+n]={type:'rich-text',settings:{}};input.order.push('extra'+n);}
  const before=JSON.stringify(input);assert.throws(()=>splitAdventSections(input),/25 secciones/);assert.equal(JSON.stringify(input),before);
});

test('all 16 independent section visibility combinations render without duplicated or orphaned calendar markup',async()=>{
  const ids=['calendar_hero','calendar_heading','calendar','calendar_closing'];
  for(let mask=0;mask<16;mask++){
    const disabled=ids.filter((id,index)=>mask&(1<<index));
    const dom=new JSDOM(await renderLanding({disabledSections:disabled}));
    try{
      assert.equal(dom.window.document.querySelectorAll('[data-preview-section]').length,4-disabled.length);
      assert.equal(dom.window.document.querySelectorAll('.advent__hero').length,disabled.includes('calendar_hero')?0:1);
      assert.equal(dom.window.document.querySelectorAll('.advent__closing').length,disabled.includes('calendar_closing')?0:1);
      assert.equal(dom.window.document.querySelectorAll('advent-calendar').length,disabled.includes('calendar')?0:1);
      assert.equal(dom.window.document.querySelectorAll('.advent__standalone-heading').length,disabled.includes('calendar_heading')?0:1);
    }finally{dom.window.close();}
  }
});

test('landing assets bootstrap even when all modules start hidden, but never load on homepage',async()=>{
  const file=path.join(root,'snippets/advent-assets.liquid');assert.ok(fs.existsSync(file));
  const engine=new Liquid({strictFilters:true});
  engine.registerFilter('asset_url',name=>'/assets/'+name);
  engine.registerFilter('stylesheet_tag',url=>`<link rel="stylesheet" href="${url}">`);
  const source=fs.readFileSync(file,'utf8');
  const absent=await engine.parseAndRender(source,{template:{name:'index'}});
  assert.equal(absent.trim(),'');
  const html=await engine.parseAndRender(source,{template:{name:'page',suffix:'advent-calendar'}});
  const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://supermu.test/pages/calendar'});
  try{
    const w=dom.window;
    w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
    w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
    for(const script of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(path.join(root,script.getAttribute('src')),'utf8'));
    assert.ok(w.customElements.get('advent-calendar'));
    const section=w.document.createElement('div');
    section.innerHTML=await renderCalendar({designMode:true,previewDate:'2026-11-25',settings:{separate_sections:true},offers:[{enabled:true,date:'2026-11-25',title:'Prueba local',discount:'20%',url:'/collections/test'}]});
    w.document.body.append(section);
    const door=section.querySelector('button[data-advent-day]');assert.ok(door);door.click();assert.equal(section.querySelector('dialog').open,true);
  }finally{dom.window.close();}
});
