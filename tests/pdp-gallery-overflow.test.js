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
const arrows = custom.match(/(?:\.template-product carousel-products )?\.carousel__(?:prev|next)\s*\{[^}]*\}/g);
const styles = [fs.readFileSync(path.join(root, 'assets/plugin.slick.css'), 'utf8'), [...overrides, ...arrows].join('\n')];

function fixture() {
  return new JSDOM(`${styles.map(css => `<style>${css}</style>`).join('')}
    <div class="product-gallery">
      <div class="product-gallery__main_slider slick-slider"><div class="slick-list"><div class="slick-track" style="width:1170px"><div class="slick-slide"></div></div></div></div>
      <div class="product-gallery__thumbnail_slider slick-slider"><div class="slick-list"><div class="slick-track" style="width:1170px"><div class="slick-slide"></div></div></div></div>
    </div>
    <carousel-products><div class="carousel__prev"></div><div class="carousel__next"></div><div class="carousel__slick slick-slider"><div class="slick-list"><div class="slick-track"><div class="slick-slide"></div></div></div></div></carousel-products>`);
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

test('PDP related-product arrows stay inside the slider instead of extending thirty pixels', () => {
  const dom = fixture(), w = dom.window;
  try {
    w.document.body.className = 'template-product';
    assert.equal(w.getComputedStyle(w.document.querySelector('.carousel__prev')).left, '0px');
    assert.equal(w.getComputedStyle(w.document.querySelector('.carousel__next')).right, '0px');
  } finally { w.close(); }
});

test('PDP arrow inset does not change homepage arrow positions', () => {
  const dom = fixture(), w = dom.window;
  try {
    w.document.body.className = 'template-index';
    assert.equal(w.getComputedStyle(w.document.querySelector('.carousel__prev')).left, '-30px');
    assert.equal(w.getComputedStyle(w.document.querySelector('.carousel__next')).right, '-30px');
  } finally { w.close(); }
});

test('mobile PDP benefit tiles use a shrinkable single column instead of three min-content columns', () => {
  const rule = custom.match(/@media\s*\(max-width:\s*767px\)\s*\{\s*\.template-product \.product-page-info__icon-with-text--style-tile\s*\{([^}]*)\}/);
  assert.ok(rule, 'mobile tile override must be scoped to the PDP');
  assert.match(rule[1], /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});

test('PDP related title wraps within its flex row on narrow screens', () => {
  const rule = custom.match(/\.template-product carousel-products \.carousel__title\s*\{([^}]*)\}/);
  assert.ok(rule, 'related title must have a scoped width constraint');
  assert.match(rule[1], /max-width:\s*100%/);
  assert.match(rule[1], /min-width:\s*0/);
});
