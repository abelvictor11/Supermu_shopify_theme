const fs=require('node:fs');
const path=require('node:path');
const {Liquid}=require('liquidjs');
const root=path.resolve(__dirname,'../..');

// Exercise the production type-6 branch and its actual captures, not a copied header.
async function renderHeader({user={},predictive=true,cartVisible=true,wishlist='default'}={}){
  const source=fs.readFileSync(path.join(root,'sections/header.liquid'),'utf8');
  const capture=name=>{
    const start=source.indexOf('{%- capture '+name+' -%}');
    const tokens=source.slice(start).matchAll(/\{%-?\s*(capture|endcapture)\b[^%]*%\}/g);
    let depth=0;
    for(const token of tokens){
      depth+=token[1]==='capture'?1:-1;
      if(depth===0)return source.slice(start,start+token.index+token[0].length);
    }
    throw new Error('Unclosed capture '+name);
  };
  const branch=source.split("{%- when '6' -%}").pop().split("{%- when '7' -%}")[0];
  const engine=new Liquid({root:path.join(root,'snippets'),extname:'.liquid'});
  engine.registerFilter('t',value=>({'general.search.placeholder':'Buscar productos...','general.search.submit':'Ir','general.search.reset':'Limpiar búsqueda'}[value]||value));
  const settings={search_show:true,cart_show_header_button:cartVisible,cart_icon:'icon-theme-109',logo_width:172,logo_mobile_width:52,logo_types:'text',search_predictive_enabled:predictive,app_language:'none',wishlist_type:wishlist};
  return engine.parseAndRender(['btn_menu_html','logo_html','btn_cart_html','btn_registro_html','btn_wishlist_html','btn_user_html'].map(capture).join('')+branch,{
    section:{id:'header-fixture',settings:{type:'6',menu:'principal',show_user_link:true,user_url:'/account',user_tooltip:'Mi Cuenta',show_registro_link:true,registro_url:'/pages/clientes',...user}},settings,
    routes:{search_url:'/search',root_url:'/'},shop:{name:'supermú',metafields:{}},cart:{item_count:3,items:[]},search:{terms:''},template:{name:'index'},need_mobile_logo:true
  });
}
module.exports={renderHeader};
