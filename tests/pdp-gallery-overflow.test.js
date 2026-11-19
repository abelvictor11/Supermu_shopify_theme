const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const custom = fs.readFileSync(path.join(root, 'assets/custom.css'), 'utf8');
// Isolate the actual overrides: jsdom rejects unrelated legacy CSS later in the file.
const overrides = custom.match(/(?:\.carousel__slick|\.slick-slider)\s+\.slick-(?:list|slide)(?::not\([^)]*\))?\s*\{[^}]*\}/g);
assert.equal(overrides.length, 4, 'all list/slide overrides must be exercised');
const styles = [fs.readFileSync(path.join(root, 'assets/plugin.slick.css'), 'utf8'), overrides.join('\n')];

function fixture() {
  return new JSDOM(`${styles.map(css => `<style>${css}</style>`).join('')}
    <div class="product-gallery">
      <div class="product-gallery__main_slider slick-slider"><div class="slick-list"><div class="slick-track" style="width:1170px"><div class="slick-slide"></div></div></div></div>
      <div class="product-gallery__thumbnail_slider slick-slider"><div class="slick-list"><div class="slick-track" style="width:1170px"><div class="slick-slide"></div></div></div></div>
    </div>
    <carousel-products><div class="carousel__slick slick-slider"><div class="slick-list"><div class="slick-track"><div class="slick-slide"></div></div></div></div></carousel-products>`);
}

for (const gallery of ['main', 'thumbnail']) {
  test(`PDP ${gallery} gallery clips the offscreen track and keeps native Slick geometry`, () => {
    const dom = fixture(), w = dom.window;
    try {
      const list = w.document.querySelector(`.product-gallery__${gallery}_slider .slick-list`);
      const css = w.getComputedStyle(list);
      assert.equal(css.overflow, 'hidden');
      assert.equal(css.marginLeft, '0px');
      assert.equal(css.marginRight, '0px');
      const slide = w.getComputedStyle(list.querySelector('.slick-slide'));
      assert.notEqual(slide.paddingLeft, '10px');
    } finally { w.close(); }
  });
}

test('product carousels retain their intentional peek and gutters', () => {
  const dom = fixture(), w = dom.window;
  try {
    const list = w.document.querySelector('.carousel__slick .slick-list');
    assert.equal(w.getComputedStyle(list).overflow, 'visible');
    assert.equal(w.getComputedStyle(list).marginLeft, '-10px');
    assert.equal(w.getComputedStyle(list.querySelector('.slick-slide')).paddingLeft, '10px');
  } finally { w.close(); }
});
