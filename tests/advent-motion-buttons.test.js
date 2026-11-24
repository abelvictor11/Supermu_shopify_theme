const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const {renderLanding,root}=require('./helpers/advent-fixture');
const schema=type=>JSON.parse(fs.readFileSync(path.join(root,`sections/${type}.liquid`),'utf8').split('{% schema %}')[1].split('{% endschema %}')[0]);
const setting=(type,id)=>schema(type).settings.find(s=>s.id===id);
const css=()=>fs.readFileSync(path.join(root,'assets/advent-calendar.css'),'utf8');

test('hero and calendar offer the three button styles, defaulting to the store pill', () => {
  for (const type of ['advent-hero','advent-calendar']) {
    const style=setting(type,'button_style');
    assert.equal(style?.default,'store_shape');
    assert.deepEqual(style.options.map(o=>o.value),['store_shape','store','classic']);
  }
  assert.equal(setting('advent-closing','button_style')?.default,'store');
  assert.equal(setting('advent-heading','button_style'),undefined);
});

test('button style reaches the markup and keeps the existing radius variable intact', async () => {
  const dom=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{button_style:'store',button_radius:12},calendar:{button_style:'classic'}}}));
  const doc=dom.window.document;
  const hero=doc.querySelector('[data-advent-style="calendar_hero"]');
  assert.equal(hero.dataset.adventButton,'store');
  assert.equal(dom.window.getComputedStyle(hero).getPropertyValue('--advent-button-radius').trim(),'12px');
  assert.equal(doc.querySelector('advent-calendar').dataset.adventButton,'classic');
  const plain=new JSDOM(await renderLanding()).window.document;
  assert.equal(plain.querySelector('[data-advent-style="calendar_hero"]').dataset.adventButton,'store_shape');
});

test('every section can switch motion off, and it is on by default', async () => {
  for (const type of ['advent-hero','advent-heading','advent-calendar','advent-closing']) assert.equal(setting(type,'motion_enabled')?.default,true);
  const on=new JSDOM(await renderLanding()).window.document;
  assert.equal(on.querySelectorAll('.advent--motion').length,4);
  const off=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{motion_enabled:false},calendar_heading:{motion_enabled:false},calendar:{motion_enabled:false},calendar_closing:{motion_enabled:false}}})).window.document;
  assert.equal(off.querySelectorAll('.advent--motion').length,0);
});

test('hero title keeps its text while splitting words, with eyebrow and swash', async () => {
  const doc=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{heading:'El sabor de la',heading_accent:'Navidad'}}})).window.document;
  const h1=doc.querySelector('.advent__hero h1');
  assert.equal(h1.textContent.replace(/\s+/g,' ').trim(),'El sabor de la Navidad');
  assert.deepEqual([...h1.querySelectorAll('.advent__word')].map(w=>w.getAttribute('style')),['--w: 0','--w: 1','--w: 2','--w: 3']);
  assert.equal(h1.querySelector('.advent__title-accent').getAttribute('style'),'--w: 4');
  assert.equal(h1.querySelector('.advent__swash').getAttribute('aria-hidden'),'true');
  assert.equal(doc.querySelector('.advent__eyebrow').textContent.trim(),'Calendario de Adviento');
  assert.equal(doc.querySelector('.advent__sparkles').getAttribute('aria-hidden'),'true');
});

test('gradient titles are not split, so background-clip text keeps painting the whole line', async () => {
  const doc=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{heading_gradient_enabled:true,heading_gradient:'linear-gradient(90deg, #ffffff 0%, #fff0b5 100%)'}}})).window.document;
  assert.equal(doc.querySelectorAll('.advent__hero .advent__word').length,0);
  assert.match(doc.querySelector('.advent__hero h1').textContent,/El sabor de la/);
});

test('decorative extras can be hidden and an empty eyebrow renders nothing', async () => {
  const doc=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{eyebrow:'',show_swash:false,show_sparkles:false}}})).window.document;
  assert.equal(doc.querySelector('.advent__eyebrow'),null);
  assert.equal(doc.querySelector('.advent__swash'),null);
  assert.equal(doc.querySelector('.advent__sparkles'),null);
});

test('motion is opt-in per section, respects reduced motion and degrades without scroll timelines', () => {
  const source=css();
  const block=source.slice(source.indexOf('@media (prefers-reduced-motion: no-preference)'));
  assert.ok(block.length>0);
  for (const name of ['advent-word-in','advent-rise','advent-parallax','advent-door-call']) {
    const uses=[...source.matchAll(new RegExp(`animation:[^;]*${name}`,'g'))];
    assert.ok(uses.length>0,name);
    for (const use of uses) assert.ok(use.index>source.indexOf('@media (prefers-reduced-motion: no-preference)'),`${name} must be gated by reduced motion`);
  }
  assert.match(block,/@supports \(animation-timeline: view\(\)\)[\s\S]*animation-timeline: view\(\)/);
  assert.match(block,/\.advent--motion/);
  assert.doesNotMatch(source,/@keyframes advent-rise[^}]*transform/);
});

test('hero defaults to the stage card and closing to the light card, both reversible', async () => {
  assert.equal(setting('advent-hero','layout')?.default,'stage');
  assert.equal(setting('advent-closing','layout')?.default,'card');
  const doc=new JSDOM(await renderLanding()).window.document;
  assert.ok(doc.querySelector('.advent--stage .advent__hero.advent__hero--stage'));
  assert.ok(doc.querySelector('.advent--panel .advent__closing.advent__closing--card'));
  assert.equal(doc.querySelectorAll('.advent__pines').length,2);
  const ids=[...doc.querySelectorAll('.advent__pines path[id]')].map(p=>p.id);
  assert.equal(new Set(ids).size,ids.length);
  const split=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{layout:'split'},calendar_closing:{layout:'split'}}})).window.document;
  assert.equal(split.querySelector('.advent__hero--stage, .advent__closing--card, .advent__pines, .advent--stage, .advent--panel'),null);
  assert.ok(split.querySelector('.advent__hero') && split.querySelector('.advent__closing'));
});

test('closing button points at the calendar anchor and can be removed', async () => {
  const doc=new JSDOM(await renderLanding()).window.document;
  const cta=doc.querySelector('.advent__closing .advent__cta');
  assert.equal(cta.getAttribute('href'),'#AdventCalendar-calendar');
  assert.equal(cta.dataset.calendarTarget,'AdventCalendar-calendar');
  assert.equal(doc.querySelector('[data-advent-style="calendar_closing"]').dataset.adventButton,'store');
  const none=new JSDOM(await renderLanding({sectionSettings:{calendar_closing:{button_label:''}}})).window.document;
  assert.equal(none.querySelector('.advent__closing .advent__cta'),null);
});

test('page colors are scoped to the section and image breakout is opt-in', async () => {
  const dom=new JSDOM(await renderLanding({sectionSettings:{calendar_closing:{page_background:'#ffffff',page_heading_color:'#112233',image_breakout:true}}}));
  const closing=dom.window.document.querySelector('[data-advent-style="calendar_closing"]');
  const css=(el,key)=>dom.window.getComputedStyle(el).getPropertyValue(key).trim();
  assert.equal(css(closing,'--advent-page-bg'),'#ffffff');
  assert.equal(css(closing,'--advent-page-heading'),'#112233');
  assert.ok(closing.querySelector('.advent__closing--breakout'));
  assert.equal(new JSDOM(await renderLanding()).window.document.querySelector('.advent__closing--breakout'),null);
});

test('every select option label fits Shopify\'s 50-character limit', () => {
  for (const file of fs.readdirSync(path.join(root,'sections')).filter(f=>/^advent-.*\.liquid$/.test(f))) {
    const json=schema(file.replace('.liquid',''));
    const all=[...json.settings,...(json.blocks||[]).flatMap(b=>b.settings||[])];
    for (const s of all) for (const o of s.options||[]) assert.ok(o.label.length<=50,`${file} ${s.id}: "${o.label}" (${o.label.length})`);
  }
});

test('accent word loads only the chosen script font, subset to its letters, and wins over the heading font', async () => {
  assert.equal(setting('advent-hero','accent_font')?.default,'kaushan');
  const doc=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{heading_accent:'Navidad',heading_font_source:'shopify',heading_font:{family:'Georgia',fallback_families:'serif',weight:700,style:'normal'}}}})).window.document;
  const hero=doc.querySelector('[data-advent-style="calendar_hero"]');
  const link=hero.querySelector('link[rel="stylesheet"][href*="fonts.googleapis.com"]');
  assert.match(link.getAttribute('href'),/family=Kaushan\+Script&display=swap&text=Navidad$/);
  const styles=[...hero.querySelectorAll('style')].map(s=>s.textContent);
  const headingIndex=styles.findIndex(t=>/--advent-accent-font: var\(--advent-heading-font\)/.test(t));
  const scriptIndex=styles.findIndex(t=>/--advent-accent-font: "Kaushan Script"/.test(t));
  assert.ok(headingIndex>=0 && scriptIndex>headingIndex,'script font must be declared after the heading font');
  for (const choice of ['dry','heading']) {
    const other=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{accent_font:choice}}})).window.document;
    assert.equal(other.querySelector('link[href*="fonts.googleapis.com"]'),null);
  }
});

test('title and calendar sit in a card by default and can return to the full red band', async () => {
  for (const type of ['advent-heading','advent-calendar']) assert.equal(setting(type,'container_style')?.default,'card');
  const doc=new JSDOM(await renderLanding()).window.document;
  assert.ok(doc.querySelector('[data-advent-style="calendar_heading"].advent--boxed > .advent__standalone-heading'));
  assert.ok(doc.querySelector('advent-calendar.advent--boxed > .advent__box > .advent__calendar'));
  const band=new JSDOM(await renderLanding({sectionSettings:{calendar_heading:{container_style:'band'},calendar:{container_style:'band'}}})).window.document;
  assert.equal(band.querySelector('.advent--boxed'),null);
});

test('container width, top spacing and door gap become scoped CSS variables', async () => {
  const dom=new JSDOM(await renderLanding({sectionSettings:{
    calendar_hero:{container_width:'full'},
    calendar_heading:{container_width:'custom',container_custom_width:960,section_space:40},
    calendar:{grid_gap:16,container_width:'page'},
    calendar_closing:{container_width:'custom',container_custom_width:99999}
  }}));
  const v=(id,key)=>dom.window.getComputedStyle(dom.window.document.querySelector(id==='calendar'?'advent-calendar':`[data-advent-style="${id}"]`)).getPropertyValue(key).trim();
  assert.equal(v('calendar_hero','--advent-container-max'),'100%');
  assert.equal(v('calendar_heading','--advent-container-max'),'960px');
  assert.equal(v('calendar_heading','--advent-section-space'),'40px');
  assert.equal(v('calendar','--advent-container-max'),'1320px');
  assert.equal(v('calendar','--advent-grid-gap'),'16px');
  assert.equal(v('calendar_closing','--advent-container-max'),'1920px');
  assert.equal(setting('advent-calendar','grid_gap')?.default,8);
});
