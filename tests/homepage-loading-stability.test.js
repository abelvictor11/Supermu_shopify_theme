const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const carouselSection = fs.readFileSync(path.join(root, 'sections/carousel-products.liquid'), 'utf8');

test('product carousel renders only for a populated collection outside the theme editor', () => {
  assert.match(carouselSection, /assign\s+primary_collection\s*=\s*collections\[primary_block\.settings\.collection\]/);
  assert.match(carouselSection, /primary_collection\s*!=\s*blank/);
  assert.match(carouselSection, /primary_collection\.products_count\s*>\s*0/);
  assert.match(carouselSection, /request\.design_mode/);
  assert.match(carouselSection, /if\s+carousel_has_content/);
});

test('product carousel images reserve intrinsic responsive geometry', () => {
  assert.match(carouselSection, /src="\{\{\s*product\.featured_image\s*\|\s*image_url:\s*width:\s*480\s*\}\}"/);
  assert.match(carouselSection, /srcset="/);
  assert.match(carouselSection, /width="\{\{\s*product\.featured_image\.width\s*\}\}"/);
  assert.match(carouselSection, /height="\{\{\s*product\.featured_image\.height\s*\}\}"/);
  assert.match(carouselSection, /sizes="/);
});
