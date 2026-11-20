const fs = require('node:fs');
const path = require('node:path');
const { Liquid } = require('liquidjs');
const root = path.resolve(__dirname, '../..');
function createEngine() {
  const engine = new Liquid({strictFilters:true,root:path.join(root,'snippets'),extname:'.liquid'});
  engine.registerFilter('asset_url', name=>'/assets/'+name);
  engine.registerFilter('stylesheet_tag', url=>`<link rel="stylesheet" href="${url}">`);
  engine.registerFilter('image_url', image=>typeof image==='string'?image:image.url);
  engine.registerFilter('image_tag', (url,...options)=>{
    const o=Object.assign({},...options.map(x=>Array.isArray(x)?{[x[0]]:x[1]}:{}));
    return `<img src="${url}" width="900" height="600" loading="${o.loading||'lazy'}" alt="">`;
  });
  engine.registerFilter('json', value=>JSON.stringify(value===undefined?null:value));
  return engine;
}
function readSection(type) {
  const source=fs.readFileSync(path.join(root,`sections/${type}.liquid`),'utf8');
  const schema=JSON.parse(source.split('{% schema %}')[1].split('{% endschema %}')[0]);
  return {source,defaults:Object.fromEntries(schema.settings.filter(s=>s.id).map(s=>[s.id,s.default??'']))};
}
async function renderCalendar({ designMode = false, previewDate = '', settings = {}, offers, templateContext } = {}) {
  const {source,defaults}=readSection('advent-calendar');
  // Frozen initial campaign, not the merchant's editable live configuration.
  const template = JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/advent-calendar-initial.json'),'utf8')).sections.calendar;
  const blocks = offers ? offers.map((s,i)=>({id:'fixture-'+i,settings:{...s,collection:typeof s.collection==='string'&&s.collection?{url:'/collections/'+encodeURIComponent(s.collection)}:s.collection},shopify_attributes:''})) : template.block_order.map(id=>({id,...template.blocks[id],shopify_attributes:''}));
  const engine=createEngine();
  return engine.parseAndRender(source.split('{% schema %}')[0],{
    section:{id:'calendar-fixture',settings:{...defaults,...template.settings,...settings,preview_date:previewDate},blocks},request:{design_mode:designMode},template:templateContext
  });
}
async function renderLanding({disabledSections=[],sectionSettings={},...calendarOptions}={}) {
  const template=JSON.parse(fs.readFileSync(path.join(root,'templates/page.advent-calendar.json'),'utf8'));
  const templateContext={name:'page',suffix:'advent-calendar'};
  const bootstrap=fs.readFileSync(path.join(root,'snippets/advent-assets.liquid'),'utf8');
  const result=[await createEngine().parseAndRender(bootstrap,{template:templateContext})];
  for(const id of template.order) {
    const section=template.sections[id];
    if(section.disabled||disabledSections.includes(id))continue;
    const settings={...section.settings,...sectionSettings[id]};
    let html;
    if(section.type==='advent-calendar') {
      html=await renderCalendar({...calendarOptions,templateContext,settings:{...settings,...calendarOptions.settings},offers:calendarOptions.offers||section.block_order.map(key=>section.blocks[key].settings)});
    } else {
      const {source,defaults}=readSection(section.type);
      html=await createEngine().parseAndRender(source.split('{% schema %}')[0],{section:{id,settings:{...defaults,...settings}},template:templateContext});
    }
    result.push(`<div id="shopify-section-${id}" data-preview-section="${id}">${html}</div>`);
  }
  return result.join('');
}
module.exports={renderCalendar,renderLanding,root};
