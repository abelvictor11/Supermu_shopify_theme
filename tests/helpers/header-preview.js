// Local verification only. No Shopify credentials, deployment, or store mutations.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {renderHeader}=require('./header-fixture');
const root=path.resolve(__dirname,'../..');
const types={'.css':'text/css','.woff':'font/woff','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/base.css'){
    res.writeHead(200,{'Content-Type':'text/css'}).end(['css-inline-style-start-type','css-inline-style-start-type-pt2'].map(name=>fs.readFileSync(path.join(root,'snippets',name+'.liquid'),'utf8')).join('\n'));return;
  }
  if(/^\/assets\/[a-zA-Z0-9._-]+$/.test(url.pathname)){
    const file=path.join(root,url.pathname);
    if(!fs.existsSync(file)){res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);return;
  }
  try{
    const header=await renderHeader({user:{show_user_link:url.searchParams.get('account')!=='off'},predictive:url.searchParams.get('predictive')!=='off'});
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(`<!doctype html><html lang="es" class="js css-theme-loaded font-base-loaded css-full-loaded"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prueba local · Header móvil Supermú</title><link rel="stylesheet" href="/base.css"><link rel="stylesheet" href="/assets/theme-m.css" media="(max-width:1024px)"><link rel="stylesheet" href="/assets/theme-d.css" media="(min-width:1025px)"><link rel="stylesheet" href="/assets/theme-skin-7.css"><link rel="stylesheet" href="/assets/custom.css"><style>body{margin:0}.fixture-note{padding:12px 16px;background:#fff;color:#451021;font:14px/1.4 sans-serif}.fixture-content{padding:28px 16px;background:#fff0f0;color:#451021} .fixture-content h1{font-size:26px;line-height:1.3}</style><body><div class="fixture-note">VISTA LOCAL DE PRUEBA. Capturas y buscador reales del header tipo 6. Sin datos de cuenta ni carrito real.</div><header class="header content-loaded">${header}</header><main class="fixture-content"><h1>Mi cuenta visible, buscador completo.</h1><p>Sin cambios en el icono, destino ni controles existentes. Los popups y resultados requieren el JavaScript de la tienda.</p></main></body></html>`);
  }catch(error){console.error(error.message);res.writeHead(500).end('No se pudo renderizar el header.');}
}).listen(4183,'127.0.0.1',()=>console.log('Header fixture: http://127.0.0.1:4183'));
