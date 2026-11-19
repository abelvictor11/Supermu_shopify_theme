const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { Liquid } = require('liquidjs');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function bannerFixture(options = {}) {
  const section = read('sections/dual-custom-banner.liquid').replace(/\{% schema %\}[\s\S]*?\{% endschema %\}/g, '');
  const engine = new Liquid();
  engine.registerFilter('image_url', image => image);
  const html = engine.parseAndRenderSync(section, {section:{id:'fixture',settings:{autoplay:true,speed:5,arrows:true,bullets:true},blocks:[
    {type:'banner_large',settings:{slide_1_enabled:true,image_1:'/large.jpg',slide_2_enabled:true,image_2:'/second.jpg'}},
    {type:'banner_small',settings:options.laterSlideOnly ? {slide_2_enabled:true,image_2:'/later.jpg'} : {slide_1_enabled:true,image_1:'/small.jpg',image_mobile_1:'/small-mobile.jpg'}}
  ]}});
  const dom = new JSDOM(html, {url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window, instances=[], ready=[];
  w.console={log(){},warn(){},error(){}};
  const originalDocumentListener=w.document.addEventListener.bind(w.document);
  const originalWindowListener=w.addEventListener.bind(w);
  w.document.addEventListener=(type,fn,...args)=>type==='DOMContentLoaded'?ready.push(fn):originalDocumentListener(type,fn,...args);
  w.addEventListener=(type,fn,...args)=>type==='DOMContentLoaded'?ready.push(fn):originalWindowListener(type,fn,...args);
  w.Swiper=class {
    constructor(el,params) {
      this.el=typeof el==='string'?w.document.querySelector(el):el;this.params=params;this.destroyed=false;
      this.autoplay={running:!!params.autoplay,start(){this.running=true;},stop(){this.running=false;}};
      this.slides=this.el.querySelectorAll('.swiper-slide');this.activeIndex=0;this.el.swiper=this;instances.push(this);
    }
    init(){} update(){} updateSlides(){}
    destroy(){this.destroyed=true;this.autoplay.stop();if(this.el.swiper===this)delete this.el.swiper;}
  };
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.eval(read('assets/carousel-manager.js'));
  const custom=read('assets/custom.js');
  const start=custom.indexOf("window.addEventListener('DOMContentLoaded'");
  if(start>=0) w.eval(custom.slice(start,custom.indexOf('// Funcionalidad para el botón',start)));
  for(const script of w.document.scripts) if(!script.src) w.eval(script.textContent);
  ready.forEach(fn=>fn());
  return {dom,w,instances};
}

test('all banner initializers together create exactly one owner per element', () => {
  const {dom,w,instances}=bannerFixture();
  try {for(const el of w.document.querySelectorAll('.swiper-container')) assert.equal(instances.filter(i=>i.el===el&&!i.destroyed).length,1);}
  finally {dom.window.close();}
});
test('single-slide banners never clone or autoplay; repeated init is idempotent', () => {
  const {dom,w,instances}=bannerFixture();
  try {
    const small=w.document.querySelector('.small-banner-swiper');
    assert.equal(small.swiper.params.loop,false);assert.equal(small.swiper.params.autoplay,false);
    const count=instances.length;w.carouselManager.init();assert.equal(instances.length,count);
  } finally {dom.window.close();}
});
test('pagehide destroys banners; pageshow restores exactly one owner', () => {
  const {dom,w,instances}=bannerFixture();
  try {
    w.dispatchEvent(new w.Event('pagehide'));assert.ok(instances.every(i=>i.destroyed));
    w.dispatchEvent(new w.Event('pageshow'));assert.equal(instances.filter(i=>!i.destroyed).length,2);
  } finally {dom.window.close();}
});
test('section unload releases its banners without waiting for another page', () => {
  const {dom,w,instances}=bannerFixture();
  try {w.document.querySelector('.custom-grid-banners').dispatchEvent(new w.Event('shopify:section:unload',{bubbles:true}));assert.ok(instances.every(i=>i.destroyed));}
  finally {dom.window.close();}
});
test('configured banner image is available before JavaScript runs', () => {
  const {dom,w}=bannerFixture();
  try {assert.match(w.document.querySelector('.slide-content').getAttribute('style'),/--banner-desktop/);assert.match(w.document.querySelector('.small-banner-swiper .slide-content').getAttribute('style'),/--banner-mobile: url\('\/small-mobile.jpg'\)/);}
  finally {dom.window.close();}
});
test('fifty back/forward restores keep exactly one live instance per banner', () => {
  const {dom,w,instances}=bannerFixture();
  try {for(let i=0;i<50;i++){w.dispatchEvent(new w.Event('pagehide'));assert.equal(instances.filter(s=>!s.destroyed).length,0);w.dispatchEvent(new w.Event('pageshow'));assert.equal(instances.filter(s=>!s.destroyed).length,2);}}
  finally {dom.window.close();}
});
test('section reload scopes controls to its own banner elements', () => {
  const {dom,w,instances}=bannerFixture();
  try {
    const second=w.document.querySelector('.custom-grid-banners').cloneNode(true);second.id='section-second';w.document.body.append(second);
    second.dispatchEvent(new w.Event('shopify:section:load',{bubbles:true}));
    assert.equal(instances.filter(s=>!s.destroyed).length,4);
    for(const s of instances) assert.equal(s.params.navigation.nextEl.closest('.swiper-container'),s.el);
    second.dispatchEvent(new w.Event('shopify:section:unload',{bubbles:true}));assert.equal(instances.filter(s=>!s.destroyed).length,2);
  } finally {dom.window.close();}
});
test('reduced motion stops and restores only multi-slide autoplay', () => {
  const {dom,w,instances}=bannerFixture();
  try {
    w.carouselManager.motionQuery={matches:true};w.carouselManager.updateMotion();assert.ok(instances.every(s=>!s.autoplay.running));
    w.carouselManager.motionQuery.matches=false;w.carouselManager.updateMotion();
    assert.equal(w.document.querySelector('.large-banner-swiper').swiper.autoplay.running,true);
    assert.equal(w.document.querySelector('.small-banner-swiper').swiper.autoplay.running,false);
  } finally {dom.window.close();}
});
test('autoplay cannot attach Swiper 8 unconditional mouseleave resume handler', () => {
  const {dom,w}=bannerFixture();
  try {assert.notEqual(w.document.querySelector('.large-banner-swiper').swiper.params.autoplay.pauseOnMouseEnter,true);}
  finally {dom.window.close();}
});
test('a valid later slide is visible even when image_1 is empty', () => {
  const {dom,w}=bannerFixture({laterSlideOnly:true});
  try {const el=w.document.querySelector('.small-banner-swiper');assert.ok(el.swiper);assert.notEqual(el.style.display,'none');}
  finally {dom.window.close();}
});
test('single-slide category initializes without referencing undefined config', () => {
  const {dom,w,instances}=bannerFixture();
  try {
    const category=w.document.createElement('section');category.className='category-carousel-section';category.dataset.sectionId='single';
    category.innerHTML='<div id="category-swiper-single"><div class="swiper-slide"></div></div>';
    w.document.body.append(category);w.carouselManager.init(category);
    const instance=instances.find(i=>i.el.id==='category-swiper-single');assert.ok(instance);assert.equal(instance.params.loop,false);assert.equal(instance.params.autoplay,false);
  } finally {dom.window.close();}
});

function productFixture() {
  const dom=new JSDOM('<carousel-products data-section-id="fixture"><div data-carousel-scrollbar><div data-carousel-scrollbar-drag></div></div><div data-js-carousel-slick></div></carousel-products>',{runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  // Use the actual bundled jQuery, without booting unrelated theme modules.
  const jquery=read('assets/theme.js').split('(function($){')[0];w.eval(jquery);w.jQueryTheme=w.jQuery;
  const $=w.jQueryTheme;w.$window=$(w);
  w.theme={AssetsLoader:{onPageLoaded(fn){fn();},loadManually(){}}};
  w.eval(read('assets/section.carousel-products.js'));
  const element=w.document.querySelector('carousel-products');element.$container=$(element);element.$slick=$(element).find('[data-js-carousel-slick]');
  const frames=new Map();let frame=0;w.requestAnimationFrame=fn=>{frames.set(++frame,fn);return frame;};w.cancelAnimationFrame=id=>frames.delete(id);
  return {dom,w,$,element,frames};
}
test('scrollbar setPosition uses actual current slide, not zero', () => {
  const {dom,element,frames}=productFixture();
  try {element.initScrollbar();element.$slick.trigger('setPosition',[{slideCount:12,currentSlide:6,options:{slidesToShow:3}}]);for(const fn of frames.values())fn();assert.equal(element.$scrollbarDrag[0].style.left,'50%');}
  finally {dom.window.close();}
});
test('scrollbar event bursts queue one frame and teardown cancels it', () => {
  const {dom,element,frames}=productFixture();
  try {element.initScrollbar();for(let i=0;i<20;i++)element.$slick.trigger('setPosition',[{slideCount:12,currentSlide:i%9,options:{slidesToShow:3}}]);assert.equal(frames.size,1);element.destroyScrollbar();assert.equal(frames.size,0);}
  finally {dom.window.close();}
});
test('homepage product payload is capped and does not create an infinite loop', () => {
  const source=read('sections/carousel-products.liquid');
  assert.match(source,/template\.name\s*==\s*'index'[\s\S]*?at_most:\s*12/);
  assert.match(source,/data-infinite="\{%[^%]*template\.name\s*==\s*'index'[^%]*%\}false/);
  assert.match(source,/primary_collection\.products_count\s*>\s*max_count/);
  assert.doesNotMatch(source,/setInterval\s*\(/);
});

function renderProducts(templateName) {
  const includes={'global-variables':'','icon-theme-006':'','icon-theme-007':'','product-collection':'<article data-product-id="{{ product.id }}"></article>'};
  const engine=new Liquid({fs:{resolve:(_root,file)=>file,existsSync:file=>file in includes,readFileSync:file=>includes[file]}});
  const section=read('sections/carousel-products.liquid').replace(/\{% schema %\}[\s\S]*?\{% endschema %\}/g,'');
  return engine.parseAndRenderSync(section,{template:{name:templateName},request:{design_mode:false},section:{id:'products',blocks:[{settings:{collection:'test'}}],settings:{max_count:50,size_of_columns:4,infinite:true,bullets:true,arrows:false,container:'boxed'}},collections:{test:{title:'Productos',url:'/collections/test',products_count:50,products:Array.from({length:50},(_,id)=>({id}))}}});
}
test('Liquid rendering of fifty products emits twelve on home with a collection destination', () => {
  const dom=new JSDOM(renderProducts('index'));
  assert.equal(dom.window.document.querySelectorAll('[data-product-id]').length,12);
  assert.equal(dom.window.document.querySelector('[data-js-carousel]').dataset.infinite,'false');
  assert.equal(dom.window.document.querySelector('a.btn[href="/collections/test"]').textContent.trim(),'Ver todos los productos');
  dom.window.close();
});
test('homepage cap does not silently change product-page carousels', () => {
  const dom=new JSDOM(renderProducts('product'));
  assert.equal(dom.window.document.querySelectorAll('[data-product-id]').length,50);
  assert.equal(dom.window.document.querySelector('[data-js-carousel]').dataset.infinite,'true');
  dom.window.close();
});
