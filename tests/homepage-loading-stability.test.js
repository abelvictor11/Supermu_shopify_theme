const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const carouselSection = fs.readFileSync(path.join(root, 'sections/carousel-products.liquid'), 'utf8');
const carouselScript = fs.readFileSync(path.join(root, 'assets/section.carousel-products.js'), 'utf8');

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

test('product carousel initializes before entering the viewport and only loads once', () => {
  assert.match(carouselScript, /new\s+IntersectionObserver/);
  assert.match(carouselScript, /rootMargin:\s*['"]600px\s+0px['"]/);
  assert.match(carouselScript, /if\s*\(this\.isLoaded\)\s*return/);
  assert.match(carouselScript, /this\.intersectionObserver\.disconnect\(\)/);
  assert.match(carouselScript, /else\s*\{\s*this\.load\(\)/s);
});

test('product carousel keeps a stable height across slides', () => {
  assert.match(carouselScript, /adaptiveHeight:\s*false/);
  assert.doesNotMatch(carouselScript, /adaptiveHeight:\s*true/);
});

test('carousel scrollbar updates from Slick events without permanent polling', () => {
  assert.doesNotMatch(carouselSection, /setInterval\s*\(/);
  assert.match(carouselSection, /\.homepageScrollbar/);
  assert.match(carouselSection, /init\.homepageScrollbar/);
  assert.match(carouselSection, /setPosition\.homepageScrollbar/);
  assert.match(carouselSection, /beforeChange\.homepageScrollbar/);
  assert.match(carouselSection, /afterChange\.homepageScrollbar/);
  assert.match(carouselSection, /shopify:section:unload/);
});

test('empty storefront carousel emits no onboarding placeholder', () => {
  assert.doesNotMatch(carouselSection, /\{%-?\s*else\s*-?%\}\s*\{%\s*render\s+'no-blocks'\s*%\}\s*\{%-?\s*endif/s);
});

test('carousel motion respects reduced-motion preferences', () => {
  assert.match(carouselSection, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(carouselSection, /transition:\s*none\s*!important/);
});
