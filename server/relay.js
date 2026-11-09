/** Relay GUN e servidor local de teste AYANODE TGU v1.1.
 * ATENÇÃO: sem autenticação e sem TLS. Destinado somente a laboratório confiável.
 * npm install && npm start
 */
'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const Gun=require('gun');
const PORT=Number(process.env.AYANODE_PORT || 8765);
const HOST=process.env.AYANODE_HOST || '127.0.0.1';
const root=path.resolve(__dirname,'..');
const html=path.join(root,'index.html');
const coreJs=path.join(root,'src','core.js');
const appJs=path.join(root,'src','app.js');
const gunJs=require.resolve('gun/gun.js');
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`).pathname;
  // O GUN registra listeners para /gun; não interferimos nesses pedidos.
  if(url==='/gun' || url.startsWith('/gun/'))return;
  if(req.method!=='GET' && req.method!=='HEAD'){
    res.writeHead(405,{'Content-Type':'text/plain'});res.end('Method Not Allowed');return;
  }
  let pathToServe=null, type='text/plain; charset=utf-8';
  if(url==='/'||url==='/index.html'){
    pathToServe=html;type='text/html; charset=utf-8';
  } else if(url==='/src/core.js'){
    pathToServe=coreJs;type='application/javascript; charset=utf-8';
  } else if(url==='/src/app.js'){
    pathToServe=appJs;type='application/javascript; charset=utf-8';
  } else if(url==='/gun.js'){
    pathToServe=gunJs;type='application/javascript; charset=utf-8';
  } else {
    res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not Found');return;
  }
  try{
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD')res.end();else fs.createReadStream(pathToServe).pipe(res);
  }catch(err){res.writeHead(500);res.end('Erro interno');}
});
Gun({web:server,file:path.join(root,'ayanode_gun_data')});
server.listen(PORT,HOST,()=>{
  console.log(`AYANODE TGU v1.1: http://${HOST}:${PORT}/`);
  console.log(`Relay GUN: http://${HOST}:${PORT}/gun`);
  console.log('AVISO: dados públicos para participantes da sala, sem autenticação ou TLS.');
});
