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
    const custom=url.searchParams.get('style')==='custom';
    const broken=url.searchParams.get('style')==='broken';
    const typography=url.searchParams.get('style')==='typography';
    const controls=url.searchParams.get('style')==='controls';
    const sectionSettings=controls?{
      calendar_hero:{heading_line_height_enabled:true,heading_line_height:95,heading_line_height_mobile:105,heading_leading_offset:-6,heading_leading_offset_mobile:-2,heading_accent_gap:-6,heading_accent_gap_mobile:-4,button_radius:32,button_border_width:2,button_border_color:'#451021'},
      calendar:{card_font_source:'shopify',card_font:{family:'Georgia',fallback_families:'serif',weight:700,style:'normal',system:true},card_custom_sizes:true,card_number_size:72,card_number_size_mobile:42,card_label_size:13,card_label_size_mobile:11,button_radius:0,button_border_width:2,button_border_color:'#451021'}
    }:typography?{
      calendar_hero:{heading_line_height_enabled:true,heading_line_height:115,heading_line_height_mobile:140,heading_gradient_enabled:true,heading_gradient:'linear-gradient(90deg, #ffffff 0%, #fff0b5 100%)',heading_font_source:'shopify',heading_font:{family:'Georgia',fallback_families:'serif',system:true,weight:700,style:'normal'}},
      calendar_heading:{heading_line_height_enabled:true,heading_line_height:125,heading_line_height_mobile:150,heading_gradient_enabled:true,heading_gradient:'linear-gradient(90deg, #ffffff 0%, #fff0b5 100%)'},
      calendar:{heading_line_height_enabled:true,heading_line_height:130,heading_line_height_mobile:150,heading_gradient_enabled:true,heading_gradient:'linear-gradient(90deg, #451021 0%, #7c233b 100%)'},
      calendar_closing:{heading_line_height_enabled:true,heading_line_height:130,heading_line_height_mobile:150,heading_gradient_enabled:true,heading_gradient:'linear-gradient(90deg, #ffffff 0%, #fff0b5 100%)'}
    }:custom?{
      calendar_hero:{heading_font_source:'custom',custom_heading_font_url:'https://lavaquita33.myshopify.com/cdn/shop/t/4/assets/Dry.woff',custom_heading_font_weight:'400'},
      calendar_heading:{background_color:'#007b44',heading_color:'#fff5ef',text_color:'#fff5ef',heading_font_source:'shopify',heading_font:{family:'Georgia',fallback_families:'serif',system:true,weight:700,style:'italic'}},
      calendar_closing:{background_color:'#007b44',heading_color:'#fff5ef',text_color:'#fff5ef'}
    }:broken?{calendar_hero:{heading_font_source:'custom',custom_heading_font_url:'https://lavaquita33.myshopify.com/cdn/shop/t/4/assets/missing-preview-font.woff2'}}:{};
    if(controls&&url.searchParams.get('stress')==='max')Object.assign(sectionSettings.calendar,{card_number_size:96,card_number_size_mobile:72,card_label_size:16,card_label_size_mobile:14});
    const body=await renderLanding({...options,sectionSettings,disabledSections:(url.searchParams.get('hide')||'').split(',')});
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vista previa local · Calendario Supermú</title><style>body{margin:0;font-family:"Work Sans",sans-serif}body>p{margin:0;padding:12px 20px;background:#fff;color:#501526;font-size:13px}body>nav{display:flex;justify-content:space-between;padding:16px 28px;color:#ed080b;font-weight:bold;background:#fff}</style><body><p>VISTA PREVIA LOCAL · ${staging?'Escenario de prueba con condiciones vacías y fecha simulada.':active?'Promoción y fecha simuladas para probar interacción.':'Módulos independientes en una vista local de prueba.'} No es la tienda Shopify.</p><nav><span>supermú</span><span>Navidad para compartir</span></nav>${body}</body></html>`);
  } catch(error) {console.error(error.message);res.writeHead(500).end('No se pudo renderizar la vista previa.');}
}).listen(port,'127.0.0.1',()=>console.log(`Advent fixture: http://127.0.0.1:${port} — synthetic active state: /?scenario=active`));
