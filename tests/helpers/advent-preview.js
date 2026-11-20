// Local-only fixture. This server never deploys to Shopify or changes store data.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { renderLanding, root } = require('./advent-fixture');
const types={'.css':'text/css','.js':'application/javascript','.jpg':'image/jpeg','.webp':'image/webp','.woff':'font/woff'};
const port=Number(process.env.ADVENT_PREVIEW_PORT)||4179;
http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    if(/^\/assets\/[a-zA-Z0-9._-]+$/.test(url.pathname)) {
      const file=path.join(root,url.pathname);if(!fs.existsSync(file)){res.writeHead(404).end();return;}
      res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);return;
    }
    const scenario=url.searchParams.get('scenario');
    const active=scenario==='active'||scenario==='active-19';
    const staging=scenario==='staging';
    const options=staging?{designMode:true,previewDate:'2026-11-20',settings:{start_date:'2026-11-19'},offers:[
      {enabled:true,date:'2026-11-20',title:'La Constancia',discount:'20%',url:'/collections/aseo',terms:''}
    ]}:active?{designMode:true,previewDate:'2026-11-25',settings:scenario==='active-19'?{start_date:'2026-11-19'}:{},offers:[
      {enabled:true,date:'2026-11-25',title:'Ranchera',discount:'20%',url:'/collections/ranchera',cover_image:'/assets/advent-christmas-tree.jpg',cover_fit:'contain',terms:'DATOS DE PRUEBA LOCAL. Productos y condiciones pendientes de aprobación comercial.'},
      {enabled:false,date:'2026-11-26',title:'Portada de prueba',cover_image:'/assets/advent-bunuelos.jpg'},
      {enabled:false,date:'2026-11-27',title:'Portada de prueba',cover_image:'/assets/advent-christmas-tree.jpg',cover_fit:'contain'}
    ]}:{};
    const body=await renderLanding({...options,disabledSections:(url.searchParams.get('hide')||'').split(',')});
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vista previa local · Calendario Supermú</title><style>body{margin:0;font-family:Arial,sans-serif}body>p{margin:0;padding:12px 20px;background:#fff;color:#501526;font-size:13px}body>nav{display:flex;justify-content:space-between;padding:16px 28px;color:#ed080b;font-weight:bold;background:#fff}</style><body><p>VISTA PREVIA LOCAL · ${staging?'Escenario de prueba con condiciones vacías y fecha simulada.':active?'Promoción y fecha simuladas para probar interacción.':'Módulos independientes en una vista local de prueba.'} No es la tienda Shopify.</p><nav><span>supermú</span><span>Navidad para compartir</span></nav>${body}</body></html>`);
  } catch(error) {console.error(error.message);res.writeHead(500).end('No se pudo renderizar la vista previa.');}
}).listen(port,'127.0.0.1',()=>console.log(`Advent fixture: http://127.0.0.1:${port} — synthetic active state: /?scenario=active`));
