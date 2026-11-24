const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const {renderLanding,renderCalendar,root}=require('./helpers/advent-fixture');
const modules=['advent-hero','advent-heading','advent-calendar','advent-closing'];
const schema=type=>JSON.parse(fs.readFileSync(path.join(root,`sections/${type}.liquid`),'utf8').split('{% schema %}')[1].split('{% endschema %}')[0]);

test('all four sections expose optional leading and gradient controls without changing existing defaults',()=>{
  for(const type of modules){
    const settings=schema(type).settings,find=id=>settings.find(s=>s.id===id);
    assert.equal(find('heading_line_height_enabled')?.default,false,type);
    for(const id of ['heading_line_height','heading_line_height_mobile']){
      assert.equal(find(id)?.type,'range');assert.equal(find(id)?.min,80);assert.equal(find(id)?.max,180);
    }
    assert.equal(find('heading_gradient_enabled')?.default,false);
    assert.equal(find('heading_gradient')?.type,'color_background');
    assert.equal(find('heading_font')?.type,'font_picker');assert.equal(find('custom_heading_font_url')?.type,'url');
    const ids=settings.filter(s=>s.id).map(s=>s.id);assert.equal(ids.length,new Set(ids).size);
  }
});

test('leading is isolated to the opted-in section and bounded independently for mobile',async()=>{
  const dom=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{heading_line_height_enabled:true,heading_line_height:130,heading_line_height_mobile:155},calendar_heading:{heading_line_height_enabled:false,heading_line_height:180}}}));
  try{
    const hero=dom.window.document.querySelector('[data-advent-style="calendar_hero"]');
    assert.equal(dom.window.getComputedStyle(hero).getPropertyValue('--advent-heading-leading').trim(),'1.3');
    assert.match(hero.querySelector('style').textContent,/@media\s*\(max-width:\s*799px\)[\s\S]*--advent-heading-leading:\s*1\.55/);
    const heading=dom.window.document.querySelector('[data-advent-style="calendar_heading"]');
    assert.equal(dom.window.getComputedStyle(heading).getPropertyValue('--advent-heading-leading'),'');
    assert.equal(dom.window.getComputedStyle(dom.window.document.body).getPropertyValue('--advent-heading-leading'),'');
  }finally{dom.window.close();}
});

test('gradient opt-in colors only title ink, preserving semantic headings and plain-text defaults',async()=>{
  const dom=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{heading_gradient_enabled:true,heading_gradient:'linear-gradient(90deg, #ffffff, #ffe099)'}}}));
  try{
    const hero=dom.window.document.querySelector('[data-advent-style="calendar_hero"]');
    assert.equal(hero.querySelectorAll('h1 .advent__title-ink').length,2);
    assert.ok(hero.querySelector('h1').textContent.includes('Navidad'));
    assert.equal(hero.querySelectorAll('p .advent__title-ink,a .advent__title-ink').length,0);
    const css=hero.querySelector('style').textContent;
    assert.match(css,/@supports[\s\S]*background-image:\s*linear-gradient/);
    assert.match(css,/-webkit-text-fill-color:\s*transparent/);
    assert.match(css,/@media\s*\(forced-colors:\s*active\)/);assert.match(css,/@media print/);
    const heading=dom.window.document.querySelector('[data-advent-style="calendar_heading"]');
    assert.doesNotMatch(heading.querySelector('style').textContent,/-webkit-text-fill-color/);
  }finally{dom.window.close();}
});

test('empty or unsafe gradients never make titles transparent or inject markup',async()=>{
  for(const gradient of ['', '#fff','url(https://example.com/image.png)','linear-gradient(red, blue),URL(https://example.com/image.png)','linear-gradient(red, blue);color:red','linear-gradient(red, blue)</style><script>alert(1)</script>']){
    const dom=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{heading_gradient_enabled:true,heading_gradient:gradient}}}));
    try{
      const hero=dom.window.document.querySelector('[data-advent-style="calendar_hero"]');
      assert.doesNotMatch(hero.querySelector('style').textContent,/-webkit-text-fill-color/);
      assert.ok(hero.querySelector('h1').textContent.includes('Navidad'));
      assert.equal(dom.window.document.querySelectorAll('script:not([src])').length,0);
    }finally{dom.window.close();}
  }
});

test('each section retains its own native font selection alongside typography options',async()=>{
  const sectionSettings=Object.fromEntries(['calendar_hero','calendar_heading','calendar','calendar_closing'].map((id,i)=>[id,{heading_font_source:'shopify',heading_font:{family:['Georgia','Verdana','Times New Roman','Trebuchet MS'][i],fallback_families:'serif',system:true,weight:700,style:'normal'},heading_line_height_enabled:true,heading_line_height:125}]));
  const dom=new JSDOM(await renderLanding({sectionSettings}));
  try{
    const roots=[...dom.window.document.querySelectorAll('[data-advent-style]')];
    assert.deepEqual(roots.map(e=>dom.window.getComputedStyle(e).getPropertyValue('--advent-heading-font').trim()),['"Georgia", serif','"Verdana", serif','"Times New Roman", serif','"Trebuchet MS", serif']);
  }finally{dom.window.close();}
});

test('heading typography never changes offers, dates, eligibility or destinations',async()=>{
  const plain=new JSDOM(await renderCalendar()),styled=new JSDOM(await renderCalendar({settings:{heading_line_height_enabled:true,heading_line_height:150,heading_gradient_enabled:true,heading_gradient:'linear-gradient(90deg,#451021,#7c233b)'}}));
  try{
    const config=d=>JSON.parse(d.window.document.querySelector('[data-advent-config]').dataset.adventConfig);
    assert.deepEqual(config(styled),config(plain));
  }finally{plain.window.close();styled.window.close();}
});
