// Local-only fixture. This server never deploys to Shopify or changes store data.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { renderCalendar, root } = require('./advent-fixture');
const types={'.css':'text/css','.js':'application/javascript','.jpg':'image/jpeg','.woff':'font/woff'};
http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    if(/^\/assets\/[a-zA-Z0-9._-]+$/.test(url.pathname)) {
      const file=path.join(root,url.pathname);if(!fs.existsSync(file)){res.writeHead(404).end();return;}
      res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);return;
    }
    const active=url.searchParams.get('scenario')==='active';
    const body=await renderCalendar(active?{designMode:true,previewDate:'2026-11-25',offers:[{enabled:true,date:'2026-11-25',title:'Ranchera',discount:'20%',url:'/collections/ranchera',terms:'DATOS DE PRUEBA LOCAL. Productos y condiciones pendientes de aprobación comercial.'}]}:{});
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vista previa local · Calendario Supermú</title><style>body{margin:0;font-family:Arial,sans-serif}body>p{margin:0;padding:12px 20px;background:#fff;color:#501526;font-size:13px}body>nav{display:flex;justify-content:space-between;padding:16px 28px;color:#ed080b;font-weight:bold;background:#fff}</style><body><p>VISTA PREVIA LOCAL · ${active?'Promoción y fecha simuladas para probar interacción.':'Configuración inicial: todas las promociones son borradores.'} No es la tienda Shopify.</p><nav><span>supermú</span><span>Navidad para compartir</span></nav>${body}</body></html>`);
  } catch(error) {console.error(error.message);res.writeHead(500).end('No se pudo renderizar la vista previa.');}
}).listen(4179,'127.0.0.1',()=>console.log('Advent fixture: http://127.0.0.1:4179 — synthetic active state: /?scenario=active'));
