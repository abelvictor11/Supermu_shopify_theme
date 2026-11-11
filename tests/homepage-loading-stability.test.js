const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const carouselSection = fs.readFileSync(path.join(root, 'sections/carousel-products.liquid'), 'utf8');
const carouselScript = fs.readFileSync(path.join(root, 'assets/section.carousel-products.js'), 'utf8');
const responsiveImage = fs.readFileSync(path.join(root, 'snippets/rimage.liquid'), 'utf8');
const productCollection = fs.readFileSync(path.join(root, 'snippets/product-collection.liquid'), 'utf8');
const twoColumnSection = fs.readFileSync(path.join(root, 'sections/two-column-carousel-banner.liquid'), 'utf8');
const dualBannerSection = fs.readFileSync(path.join(root, 'sections/dual-custom-banner.liquid'), 'utf8');
const homepageTemplate = JSON.parse(fs.readFileSync(path.join(root, 'templates/index.json'), 'utf8'));

test('product carousel renders only for a populated collection outside the theme editor', () => {
  assert.match(carouselSection, /assign\s+primary_collection\s*=\s*collections\[primary_block\.settings\.collection\]/);
  assert.match(carouselSection, /primary_collection\s*!=\s*blank/);
  assert.match(carouselSection, /primary_collection\.products_count\s*>\s*0/);
  assert.match(carouselSection, /request\.design_mode/);
  assert.match(carouselSection, /if\s+carousel_has_content/);
});

test('product carousel images reserve intrinsic responsive geometry', () => {
  assert.doesNotMatch(carouselSection, /<img\s+class="product-image"/);
  assert.match(productCollection, /\{%\s*include\s+/);
  assert.match(carouselSection, /include\s+'product-collection'\s*,\s*url_without_collection:\s*true/);
  assert.doesNotMatch(carouselSection, /include\s+'product-collection'\s+with\s+url_without_collection/);
  assert.doesNotMatch(carouselSection, /render\s+'product-collection'/);
  assert.match(responsiveImage, /padding-top:\{\{\s*1\s*\|\s*divided_by:\s*aspect_ratio/);
  assert.match(responsiveImage, /if\s+image\s*==\s*blank/);
  assert.match(responsiveImage, /assign\s+custom_src\s*=\s*'data:image\/png;base64/);
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
  assert.doesNotMatch(carouselSection, /\}\)\(jQueryTheme\)/);
  assert.doesNotMatch(carouselSection, /\.homepageScrollbar/);
  assert.match(carouselScript, /initScrollbar\(\)/);
  assert.match(carouselScript, /updateScrollbar\(slick,\s*currentSlide\)/);
  assert.match(carouselScript, /destroyScrollbar\(\)/);
  assert.match(carouselScript, /init\.homepageScrollbar/);
  assert.match(carouselScript, /setPosition\.homepageScrollbar/);
  assert.match(carouselScript, /beforeChange\.homepageScrollbar/);
  assert.match(carouselScript, /afterChange\.homepageScrollbar/);
  assert.match(carouselScript, /\.off\('\.homepageScrollbar'\)/);
});

test('empty storefront carousel emits no onboarding placeholder', () => {
  assert.doesNotMatch(carouselSection, /\{%-?\s*else\s*-?%\}\s*\{%\s*render\s+'no-blocks'\s*%\}\s*\{%-?\s*endif/s);
});

test('carousel motion respects reduced-motion preferences', () => {
  assert.match(carouselSection, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(carouselSection, /transition:\s*none\s*!important/);
});

test('carousel container markup is statically parseable by Theme Check', () => {
  assert.doesNotMatch(carouselSection, /<div\{%\s*render\s+'layout-get-container-class'/);
  assert.match(carouselSection, /section\.settings\.container\s*==\s*'boxed'/);
  assert.match(carouselSection, /container-fluid/);
  assert.match(carouselSection, /"value":\s*"6"[\s\S]*?"label":\s*"6 items in the row"/);
});

test('carousel teardown is safe before loading and only removes instance handlers', () => {
  assert.match(carouselScript, /if\s*\(this\.\$control\)\s*\{\s*this\.\$control\.off\(\)/s);
  assert.match(carouselScript, /if\s*\(this\.xhr\)\s*\{\s*this\.xhr\.abort\(\)/s);
  assert.match(carouselScript, /this\.resizeNamespace\s*=/);
  assert.match(carouselScript, /\$window\.off\('theme\.resize'\s*\+\s*this\.resizeNamespace\)/);
  assert.doesNotMatch(carouselScript, /unbind\('theme\.resize\.carousel-products'\)/);
});

test('carousel autoplay follows reduced-motion preference', () => {
  assert.match(carouselScript, /matchMedia\('\(prefers-reduced-motion:\s*reduce\)'\)/);
  assert.match(carouselScript, /autoplay:\s*this\.settings\.autoplay\s*&&\s*!prefersReducedMotion/);
  assert.match(carouselScript, /slickPause/);
  assert.match(carouselScript, /removeEventListener\('change'/);
});

test('two-column merchandising renders only when collection and banner are complete', () => {
  assert.match(twoColumnSection, /assign\s+selected_collection\s*=\s*collections\[section\.settings\.collection\]/);
  assert.match(twoColumnSection, /selected_collection\.products_count\s*>\s*0/);
  assert.match(twoColumnSection, /section\.settings\.banner_image\s*!=\s*blank/);
  assert.match(twoColumnSection, /if\s+section_has_content\s+or\s+request\.design_mode/);
  assert.match(twoColumnSection, /if\s+request\.design_mode[\s\S]*no-collection-message/);
  assert.match(twoColumnSection, /include\s+'product-collection'\s*,\s*url_without_collection:\s*true/);
  assert.doesNotMatch(twoColumnSection, /include\s+'product-collection'\s+with\s+url_without_collection/);
});

test('Pescados title is owned by its carousel and disappears with an empty collection', () => {
  const titleSection = homepageTemplate.sections.custom_title_section_6TYHnr;
  const productsSection = homepageTemplate.sections.carousel_products_dxQTg3;
  const collectionBlock = productsSection.blocks[productsSection.block_order[0]];

  assert.equal(titleSection.disabled, true);
  assert.equal(productsSection.settings.show_title, true);
  assert.equal(collectionBlock.settings.title, 'Ofertas Pescados y mariscos');
});

test('two-column carousel delegates sizing and navigation to Slick', () => {
  assert.doesNotMatch(twoColumnSection, /fixSlideWidths/);
  assert.doesNotMatch(twoColumnSection, /jQueryTheme\(section\)/);
  assert.doesNotMatch(twoColumnSection, /\.carousel-half-width\s+\.slick-slide\s*\{[^}]*width:/s);
});

test('two-column merchandising expands to full width on mobile without stretching banners', () => {
  assert.match(twoColumnSection, /@media\s+screen\s+and\s+\(max-width:\s*767px\)[\s\S]*\.carousel-column[^{]*\{[^}]*max-width:\s*100%\s*!important/s);
  assert.match(twoColumnSection, /@media\s+screen\s+and\s+\(max-width:\s*767px\)[\s\S]*\.banner-column[^{]*\{[^}]*flex:\s*0\s+0\s+100%/s);
  assert.match(twoColumnSection, /\.banner-image\s*\{[^}]*height:\s*auto/s);
});

test('dual banner resolves configured slides through direct Shopify setting access', () => {
  assert.doesNotMatch(dualBannerSection, /block\.settings\[(?:slide_enabled|image_key|mobile_image_key|title_key|subtitle_key|cta_key|link_key)\]/);
  assert.match(dualBannerSection, /when\s+1[\s\S]*block\.settings\.slide_1_enabled/);
  assert.match(dualBannerSection, /when\s+10[\s\S]*block\.settings\.image_10/);
  assert.match(dualBannerSection, /if\s+slide_enabled\s+and\s+slide_image\s*!=\s*blank/);
});
