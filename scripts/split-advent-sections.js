// Local migration only. Never uploads or changes Shopify data.
const fs = require('node:fs');
function splitAdventSections(input) {
  const result = JSON.parse(JSON.stringify(input));
  for (const id of [...result.order]) {
    const calendar = result.sections[id];
    if (calendar.type !== 'advent-calendar' || calendar.settings?.separate_sections) continue;
    if (Object.keys(result.sections).length + 3 > 25) throw new Error('La plantilla supera el límite de 25 secciones. No se modificó.');
    const settings = calendar.settings || (calendar.settings = {});
    const copy = keys => Object.fromEntries(keys.filter(key => key in settings).map(key => [key, settings[key]]));
    const unique = suffix => { let key = `${id}_${suffix}`, n = 1; while (result.sections[key]) key = `${id}_${suffix}_${n++}`; return key; };
    const hero = unique('hero'), heading = unique('heading'), closing = unique('closing');
    const anchor = settings.anchor_id || `AdventCalendar-${id}`;
    result.sections[hero] = {type:'advent-hero', settings:{...copy(['heading','heading_accent','intro','hero_image']),calendar_anchor:anchor}};
    result.sections[heading] = {type:'advent-heading', settings:{...copy(['calendar_heading'])}};
    result.sections[closing] = {type:'advent-closing', settings:{...copy(['closing_image','closing_heading','closing_text'])}};
    if (calendar.disabled) for (const key of [hero, heading, closing]) result.sections[key].disabled = true;
    settings.separate_sections = true; settings.anchor_id = anchor;
    // Keep legacy values and the calendar's ID/blocks untouched for rollback and editor continuity.
    const index = result.order.indexOf(id);
    result.order.splice(index, 1, hero, heading, id, closing);
  }
  return result;
}
module.exports = {splitAdventSections};
if (require.main === module) {
  const source = fs.readFileSync(process.argv[2], 'utf8').replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '');
  process.stdout.write(JSON.stringify(splitAdventSections(JSON.parse(source)), null, 2) + '\n');
}
