const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const {renderHeader}=require('./helpers/header-fixture');

test('type-6 mobile actions render the configured account link and original purple SVG before search',async()=>{
  const dom=new JSDOM(await renderHeader({user:{user_url:'/pages/mi-cuenta',user_tooltip:'Mi perfil'}}));
  try{
    const d=dom.window.document,actions=d.querySelector('.header__mobile-actions');
    assert.ok(actions,'mobile actions must exist in the real type-6 branch');
    const link=actions.querySelector('.header__btn-user');
    assert.equal(link.getAttribute('href'),'/pages/mi-cuenta');
    assert.equal(link.getAttribute('title'),'Mi perfil');
    assert.equal(link.querySelector('svg').getAttribute('viewBox'),'0 0 409.6 409.6');
    assert.ok([...link.querySelectorAll('path')].every(p=>p.getAttribute('style').includes('#8F09CE')));
    assert.equal(actions.querySelectorAll('.header__btn-cart').length,1);
    assert.ok(actions.compareDocumentPosition(d.querySelector('form[role="search"]'))&dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
    assert.equal(d.querySelectorAll('form[role="search"]').length,1);
  }finally{dom.window.close();}
});

test('mobile account and cart respect their existing visibility and URL defaults',async()=>{
  for(const enabled of [true,false]){
    const dom=new JSDOM(await renderHeader({user:{show_user_link:enabled,user_url:''},cartVisible:false}));
    try{
      const actions=dom.window.document.querySelector('.header__mobile-actions');assert.ok(actions);
      assert.equal(actions.querySelectorAll('.header__btn-user').length,enabled?1:0);
      if(enabled)assert.equal(actions.querySelector('a').getAttribute('href'),'/account');
      assert.equal(actions.querySelector('.header__btn-cart'),null);
    }finally{dom.window.close();}
  }
});

test('one native search keeps its action, query, prefix and predictive mode in either configuration',async()=>{
  for(const predictive of [true,false]){
    const dom=new JSDOM(await renderHeader({predictive}));
    try{
      const d=dom.window.document,form=d.querySelector('form[role="search"]');
      assert.equal(form.getAttribute('action'),'/search');assert.equal(form.getAttribute('method'),'get');
      assert.ok(form.querySelector('input[type="search"][name="q"]'));
      assert.equal(form.querySelector('input[name="options[prefix]"]').value,'last');
      assert.equal(d.querySelectorAll('predictive-search').length,predictive?1:0);
      assert.equal(d.querySelectorAll('search-form').length,predictive?0:1);
    }finally{dom.window.close();}
  }
});
