const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const {renderLanding,renderCalendar,root}=require('./helpers/advent-fixture');
const types=['advent-hero','advent-heading','advent-calendar','advent-closing'];

test('every calendar module exposes independent colors and native/custom heading font controls',()=>{
  for(const type of types){
    const text=fs.readFileSync(path.join(root,`sections/${type}.liquid`),'utf8');
    const schema=JSON.parse(text.split('{% schema %}')[1].split('{% endschema %}')[0]);
    const find=id=>schema.settings.find(s=>s.id===id);
    assert.equal(find('background_color')?.default,'#ff0303',type);
    for(const id of ['heading_color','text_color'])assert.equal(find(id)?.type,'color');
    assert.equal(find('heading_font')?.type,'font_picker');
    assert.equal(find('custom_heading_font_url')?.type,'url');
    assert.deepEqual(find('heading_font_source')?.options.map(o=>o.value),['inherit','shopify','custom']);
    const ids=schema.settings.filter(s=>s.id).map(s=>s.id);assert.equal(new Set(ids).size,ids.length);
  }
});

test('style values remain scoped to their own module and never become global typography',async()=>{
  const dom=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{background_color:'#001122',heading_color:'#abcdef'},calendar_heading:{background_color:'#112233',text_color:'#fedcba'}}}));
  try{
    const roots=dom.window.document.querySelectorAll('[data-advent-style]');assert.equal(roots.length,4);
    const style=e=>dom.window.getComputedStyle(e);
    assert.equal(style(roots[0]).getPropertyValue('--advent-red').trim(),'#001122');
    assert.equal(style(roots[1]).getPropertyValue('--advent-red').trim(),'#112233');
    assert.equal(style(roots[0]).getPropertyValue('--advent-heading-color').trim(),'#abcdef');
    assert.equal(style(roots[1]).getPropertyValue('--advent-text-color').trim(),'#fedcba');
    assert.equal(style(dom.window.document.body).getPropertyValue('--advent-heading-color'),'');
  }finally{dom.window.close();}
});

test('custom WOFF/WOFF2 fonts have isolated family names and visible fallback text during loading',async()=>{
  const dom=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{heading_font_source:'custom',custom_heading_font_url:'https://cdn.example.com/brand.woff2?v=1'},calendar_heading:{heading_font_source:'custom',custom_heading_font_url:'https://cdn.example.com/other.woff'}}}));
  try{
    const styles=[...dom.window.document.querySelectorAll('style')].map(e=>e.textContent).join('\n');
    assert.match(styles,/@font-face/);assert.match(styles,/font-display:\s*swap/);
    assert.match(styles,/brand\.woff2\?v=1/);assert.match(styles,/other\.woff/);
    assert.match(styles,/AdventHeading-calendar_hero/);assert.match(styles,/AdventHeading-calendar_heading/);
  }finally{dom.window.close();}
});

test('unsafe or unsupported custom font URLs fall back without creating executable markup',async()=>{
  for(const value of ['javascript:alert(1)','data:text/html,hello','http://example.com/font.woff2','https://x.test/</style><script>alert(1)</script>.woff2','https://x.test/font.otf','']){
    const dom=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{heading_font_source:'custom',custom_heading_font_url:value}}}));
    try{
      const styles=[...dom.window.document.querySelectorAll('style')].map(e=>e.textContent).join('\n');
      assert.doesNotMatch(styles,/@font-face/);
      assert.equal(dom.window.document.querySelectorAll('script:not([src])').length,0);
      assert.ok(dom.window.document.querySelector('h1').textContent.includes('Navidad'));
    }finally{dom.window.close();}
  }
});

test('visual controls never alter the calendar business configuration',async()=>{
  const plain=new JSDOM(await renderCalendar());
  const styled=new JSDOM(await renderCalendar({settings:{heading_font_source:'custom',custom_heading_font_url:'https://cdn.example.com/font.woff2',background_color:'#ff0303',heading_color:'#ffdd00'}}));
  try{
    assert.deepEqual(JSON.parse(styled.window.document.querySelector('[data-advent-config]').dataset.adventConfig),JSON.parse(plain.window.document.querySelector('[data-advent-config]').dataset.adventConfig));
  }finally{plain.window.close();styled.window.close();}
});

test('a Shopify system font uses its real family, weight and style without downloading a font',async()=>{
  const dom=new JSDOM(await renderLanding({sectionSettings:{calendar_heading:{heading_font_source:'shopify',heading_font:{family:'Georgia',fallback_families:'serif',system:true,weight:700,style:'italic'}}}}));
  try{
    const section=dom.window.document.querySelector('[data-advent-style="calendar_heading"]');
    const styles=dom.window.getComputedStyle(section);
    assert.equal(styles.getPropertyValue('--advent-heading-font').trim(),'"Georgia", serif');
    assert.equal(styles.getPropertyValue('--advent-heading-weight').trim(),'700');
    assert.equal(styles.getPropertyValue('--advent-heading-style').trim(),'italic');
    assert.doesNotMatch(section.querySelector('style').textContent,/@font-face/);
    assert.equal(dom.window.getComputedStyle(dom.window.document.querySelector('[data-advent-style="calendar_hero"]')).getPropertyValue('--advent-heading-font'),'');
  }finally{dom.window.close();}
});
