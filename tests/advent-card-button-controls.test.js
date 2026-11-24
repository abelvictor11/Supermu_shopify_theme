const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const {renderLanding,renderCalendar,root}=require('./helpers/advent-fixture');
const schema=type=>JSON.parse(fs.readFileSync(path.join(root,`sections/${type}.liquid`),'utf8').split('{% schema %}')[1].split('{% endschema %}')[0]);
const style=(d,e,key)=>d.window.getComputedStyle(e).getPropertyValue(key).trim();

test('title adjustment accepts negative spacing without offering an invalid negative CSS line-height',()=>{
  for(const name of ['advent-hero','advent-heading','advent-calendar','advent-closing']){
    const settings=schema(name).settings,find=id=>settings.find(s=>s.id===id);
    assert.equal(find('heading_line_height').min,80);
    for(const id of ['heading_leading_offset','heading_leading_offset_mobile']){
      assert.equal(find(id)?.min,-20);assert.equal(find(id)?.max,20);assert.equal(find(id)?.default,0);
    }
  }
});

test('negative leading adjustment is scoped, bounded and opt-in',async()=>{
  const dom=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{heading_line_height_enabled:true,heading_line_height:85,heading_leading_offset:-8,heading_leading_offset_mobile:-12}}}));
  try{
    const hero=dom.window.document.querySelector('[data-advent-style="calendar_hero"]');
    assert.equal(style(dom,hero,'--advent-heading-leading'),'0.85');
    assert.equal(style(dom,hero,'--advent-heading-leading-offset'),'-8px');
    assert.match(style(dom,hero,'--advent-heading-line-height'),/^max\(0\.65em, calc\(/);
    assert.match(hero.querySelector('style').textContent,/@media\s*\(max-width: 799px\)[\s\S]*--advent-heading-leading-offset:\s*-12px/);
    assert.equal(style(dom,dom.window.document.querySelector('[data-advent-style="calendar_heading"]'),'--advent-heading-line-height'),'');
  }finally{dom.window.close();}
});

test('CTA radius and border are independent between hero and calendar, including a square radius',async()=>{
  const dom=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{button_radius:36,button_border_width:2,button_border_color:'#112233'},calendar:{button_radius:0,button_border_width:0}}}));
  try{
    const d=dom.window.document,hero=d.querySelector('[data-advent-style="calendar_hero"]'),calendar=d.querySelector('advent-calendar');
    assert.equal(style(dom,hero,'--advent-button-radius'),'36px');
    assert.equal(style(dom,hero,'--advent-button-border-width'),'2px');
    assert.equal(style(dom,hero,'--advent-button-border-color'),'#112233');
    assert.equal(style(dom,calendar,'--advent-button-radius'),'0px');
    for(const name of ['advent-hero','advent-calendar'])assert.equal(schema(name).settings.find(s=>s.id==='button_radius')?.default,6);
    for(const name of ['advent-heading','advent-closing'])assert.equal(schema(name).settings.find(s=>s.id==='button_radius'),undefined);
  }finally{dom.window.close();}
});

test('card font metadata cannot overwrite the independently selected heading font',async()=>{
  const dom=new JSDOM(await renderCalendar({settings:{heading_font_source:'shopify',heading_font:{family:'Verdana',fallback_families:'sans-serif',weight:700,style:'normal',system:true},card_font_source:'shopify',card_font:{family:'Georgia',fallback_families:'serif',weight:700,style:'italic',system:true}}}));
  try{
    const calendar=dom.window.document.querySelector('advent-calendar');
    assert.equal(style(dom,calendar,'--advent-heading-font'),'"Verdana", sans-serif');
    assert.equal(style(dom,calendar,'--advent-card-font'),'"Georgia", serif');
    assert.equal(style(dom,calendar,'--advent-card-style'),'italic');
    assert.equal(style(dom,calendar,'--advent-card-weight'),'700');
  }finally{dom.window.close();}
});

test('custom heading and card fonts keep distinct families and safe fallback loading',async()=>{
  const dom=new JSDOM(await renderCalendar({settings:{heading_font_source:'custom',custom_heading_font_url:'https://cdn.example.com/title.woff2',card_font_source:'custom',custom_card_font_url:'https://cdn.example.com/cards.woff',custom_card_font_weight:'500'}}));
  try{
    const css=[...dom.window.document.querySelectorAll('style')].map(s=>s.textContent).join('\n');
    assert.match(css,/AdventHeading-calendar-fixture/);assert.match(css,/AdventCard-calendar-fixture/);
    assert.equal((css.match(/font-display: swap/g)||[]).length,2);
    assert.equal(style(dom,dom.window.document.querySelector('advent-calendar'),'--advent-card-weight'),'500');
  }finally{dom.window.close();}
});

test('custom card sizes include label roles and allow content to grow instead of clipping',async()=>{
  const dom=new JSDOM(await renderCalendar({settings:{card_custom_sizes:true,card_number_size:72,card_number_size_mobile:42,card_label_size:14,card_label_size_mobile:12}}));
  try{
    const el=dom.window.document.querySelector('advent-calendar');
    assert.equal(style(dom,el,'--advent-card-number-size'),'clamp(24px, 5vw, 72px)');
    assert.equal(style(dom,el,'--advent-card-label-size'),'14px');
    assert.match(style(dom,el,'--advent-card-row-size'),/^minmax\(/);
    assert.match(el.querySelector('style').textContent,/--advent-card-number-size:\s*clamp\(24px, 12vw, 42px\)/);
  }finally{dom.window.close();}
});

test('defaults preserve card sizes and safe card-font URLs never introduce markup',async()=>{
  for(const url of ['', 'http://example.com/a.woff','javascript:alert(1)','https://x.test/</style><script>alert(1)</script>.woff2']){
    const dom=new JSDOM(await renderCalendar({settings:{card_font_source:'custom',custom_card_font_url:url}}));
    try{
      const el=dom.window.document.querySelector('advent-calendar'),css=[...el.querySelectorAll('style')].map(s=>s.textContent).join('\n');
      assert.equal(style(dom,el,'--advent-card-number-size'),'');assert.equal(style(dom,el,'--advent-card-font'),'');
      assert.doesNotMatch(css,/@font-face/);assert.equal(dom.window.document.querySelectorAll('script:not([src])').length,0);
    }finally{dom.window.close();}
  }
});

test('presentation controls do not change dates, enabled flags, offers or purchase destinations',async()=>{
  const plain=new JSDOM(await renderCalendar()),styled=new JSDOM(await renderCalendar({settings:{button_radius:40,card_font_source:'shopify',card_font:{family:'Georgia',fallback_families:'serif',weight:700,style:'normal',system:true},card_custom_sizes:true,heading_line_height_enabled:true,heading_leading_offset:-10}}));
  try{
    const config=d=>JSON.parse(d.window.document.querySelector('[data-advent-config]').dataset.adventConfig);
    assert.deepEqual(config(styled),config(plain));
  }finally{plain.window.close();styled.window.close();}
});

test('out-of-range stored geometry is normalized and disabled leading ignores signed values',async()=>{
  const dom=new JSDOM(await renderLanding({sectionSettings:{calendar_hero:{heading_line_height_enabled:true,heading_line_height:1,heading_leading_offset:-999,button_radius:999,button_border_width:999},calendar_heading:{heading_line_height_enabled:false,heading_leading_offset:-20}}}));
  try{
    const hero=dom.window.document.querySelector('[data-advent-style="calendar_hero"]');
    assert.equal(style(dom,hero,'--advent-heading-leading'),'0.8');assert.equal(style(dom,hero,'--advent-heading-leading-offset'),'-20px');
    assert.equal(style(dom,hero,'--advent-button-radius'),'60px');assert.equal(style(dom,hero,'--advent-button-border-width'),'4px');
    assert.equal(style(dom,dom.window.document.querySelector('[data-advent-style="calendar_heading"]'),'--advent-heading-line-height'),'');
  }finally{dom.window.close();}
});
