const fs = require('node:fs');
const path = require('node:path');
const { Liquid } = require('liquidjs');
const root = path.resolve(__dirname, '../..');
async function renderCalendar({ designMode = false, previewDate = '', settings = {}, offers } = {}) {
  const source = fs.readFileSync(path.join(root,'sections/advent-calendar.liquid'),'utf8');
  const schema = JSON.parse(source.split('{% schema %}')[1].split('{% endschema %}')[0]);
  const template = JSON.parse(fs.readFileSync(path.join(root,'templates/page.advent-calendar.json'),'utf8')).sections.calendar;
  const defaults = Object.fromEntries(schema.settings.filter(s=>s.id).map(s=>[s.id,s.default ?? '']));
  const blocks = offers ? offers.map((s,i)=>({id:'fixture-'+i,settings:s,shopify_attributes:''})) : template.block_order.map(id=>({id,...template.blocks[id],shopify_attributes:''}));
  const engine = new Liquid({strictFilters:true});
  engine.registerFilter('asset_url', name=>'/assets/'+name);
  engine.registerFilter('stylesheet_tag', url=>`<link rel="stylesheet" href="${url}">`);
  engine.registerFilter('image_url', image=>typeof image==='string'?image:image.url);
  engine.registerFilter('image_tag', (url,...options)=>{
    const o=Object.assign({},...options.map(x=>Array.isArray(x)?{[x[0]]:x[1]}:{}));
    return `<img src="${url}" width="900" height="600" loading="${o.loading||'lazy'}" alt="">`;
  });
  engine.registerFilter('json', value=>JSON.stringify(value===undefined?null:value));
  return engine.parseAndRender(source.split('{% schema %}')[0],{
    section:{id:'calendar-fixture',settings:{...defaults,...template.settings,...settings,preview_date:previewDate},blocks},request:{design_mode:designMode}
  });
}
module.exports={renderCalendar,root};
