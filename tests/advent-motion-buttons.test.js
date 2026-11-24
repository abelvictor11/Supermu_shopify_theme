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
  for (const type of ['advent-heading','advent-closing']) assert.equal(setting(type,'button_style'),undefined);
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
