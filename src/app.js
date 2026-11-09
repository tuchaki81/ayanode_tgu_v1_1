'use strict';
(() => {
  const C = window.AYANODE, $ = id => document.getElementById(id);
  const MAX_LOCAL = 64, MAX_REMOTE = 64, PEER_TTL = 30000;
  const ROOT = 'ayanode-tgu-v1-1';
  let cfg = C.configOf(), rng = C.prng(20261109), localNodes=[], simulated=[], remoteBySender=new Map(), peerMeta=new Map();
  let step=0, localCounter=0, history=[], running=null, networkEnabled=false, gun=null, gunRelay=null;
  let listener=null, broadcastTimer=null, cleanupTimer=null, liveId='n-'+makeId(), seq=0, room='', netStatus='off';
  let last=0, lastFrame=0;
  const MAX_RECORDS=5000;
  const ctx=$('world').getContext('2d'), chartCtx=$('chart').getContext('2d');
  const nowISO=()=>new Date().toISOString();
  const num=x=> x===null||!Number.isFinite(x)?'—':x.toFixed(4);
  function makeId(){
    if(window.crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g,'').slice(0,18);
    return Math.random().toString(36).slice(2)+Date.now().toString(36);
  }
  function log(message){
    const line=document.createElement('div');line.textContent=`${new Date().toLocaleTimeString('pt-BR')} · ${message}`;
    $('logs').prepend(line); while($('logs').children.length>40) $('logs').lastElementChild.remove();
  }
  function setNet(status,text){
    netStatus=status;$('net-dot').className='dot'+(status==='confirmed'?' active':status==='waiting'?' wait':'');
    $('net-status').textContent=text;
  }
  function allNodes(){return localNodes.concat([...remoteBySender.values()].flat(),simulated);}
  function trueRemoteCount(){return [...remoteBySender.values()].reduce((s,ns)=>s+ns.length,0);}
  function setConfig(){
    cfg = C.configOf({...cfg,mode:$('mode').value,lrSpin:Number($('lr').value),noise:Number($('noise').value)});
    $('lr-value').textContent=cfg.lrSpin.toFixed(2).replace('.',',');
    $('noise-value').textContent=cfg.noise.toFixed(3).replace('.',',');
  }
  function snapshot(){return C.metrics(allNodes(),cfg);}
  function record(data,kind='step',rate=null){
    history.push({timestamp:nowISO(),step,kind,local:localNodes.length,remote:trueRemoteCount(),simulated:simulated.length,
      icoer:data.icoer,U:data.U,V:data.V,T:data.T,Vn:data.Vn,Tn:data.Tn,order:data.order,sumNorm:data.sumNorm,
      rate,mode:cfg.mode,noise:cfg.noise,spatial:$('spatial').checked});
    if(history.length>MAX_RECORDS)history.shift();
  }
  function updateUI(recordInitial=false){
    const m=snapshot();
    $('m-icoer').textContent=num(m.icoer);$('m-U').textContent=num(m.U);
    $('m-order').textContent=num(m.order);$('m-V').textContent=num(m.V);
    $('m-T').textContent=num(m.T);$('m-nodes').textContent=`${localNodes.length} / ${trueRemoteCount()+simulated.length}`;
    $('peer-count').textContent=`${remoteBySender.size} peers reais`;
    if(recordInitial)record(m,'inicial');
    drawChart();
    if(!m.fieldValid && m.n>0) log('Campo médio nulo: gradiente suspenso.');
  }
  function reset(){
    stop();setConfig();step=0;localCounter=0;history=[];simulated=[];
    remoteBySender.clear();peerMeta.clear();
    const seed=Number.parseInt($('seed').value,10);
    rng=C.prng(Number.isFinite(seed)?seed:20261109);
    localNodes=Array.from({length:6},()=>C.createVortex('local_'+(++localCounter),rng));
    updateUI(true);log('Estado reiniciado: 6 vórtices; semente '+$('seed').value+'.');
    if(networkEnabled)log('Rede permanece habilitada; peers removidos localmente até nova recepção.');
  }
  function addNode(){
    if(localNodes.length>=MAX_LOCAL){log('Máximo de 64 nós locais atingido.');return;}
    localNodes.push(C.createVortex('local_'+(++localCounter),rng));
    updateUI();log('Nó local criado.');
  }
  function evolve(silent=false){
    setConfig();const remotes=[...remoteBySender.values()].flat().concat(simulated);
    const r=C.stepSpin(localNodes,remotes,cfg,rng);
    if(!r.changed){ if(!silent)log('Sem avanço: '+r.reason);return; }
    if($('spatial').checked){
      const position=C.stepPosition(localNodes,remotes,cfg);
      if(!position.changed && !silent)log('Espaço: '+position.reason);
    }
    step++;const m=snapshot();record(m,'passo',r.rate);updateUI();
    if(!silent || step%50===0)log(`Passo ${step} · ICOER=${num(m.icoer)} · U=${num(m.U)} · η=${r.rate.toPrecision(3)}`);
  }
  function stop(){if(running!==null){clearInterval(running);running=null;$('run').textContent='▶ Evolução contínua';}}
  function toggleRun(){
    if(running!==null){stop();log('Evolução pausada.');return;}
    running=setInterval(()=>evolve(true),140);$('run').textContent='⏸ Pausar evolução';
    log('Evolução iniciada.');
  }
  function addSimulation(){
    simulated=[];let index=0;
    for(let p=1;p<=2;p++)for(let i=0;i<3;i++){
      const v=C.createVortex(`sim${p}-v${i}`,rng);
      const basis=localNodes[i%localNodes.length];
      v.spin=C.normalize(basis.spin.map(x=>x+(rng()-.5)*0.36));
      v.pos=basis.pos.map(x=>x+(rng()-.5)*3.5);v.owner=`sim${p}`;
      simulated.push(v);index++;
    }
    updateUI();log('Simulação local: 2 grupos, 6 vórtices remotos (sem rede).');
  }
  function runComparison(){
    const seed=Number.parseInt($('seed').value,10)||20261109, results=[];
    for(const mode of ['fixed','complete']){
      const random=C.prng(seed+97), vs=Array.from({length:30},(_,i)=>C.createVortex('c'+i,random));
      const cc=C.configOf({...cfg,mode,noise:0});const before=C.metrics(vs,cc);
      for(let k=0;k<200;k++)C.stepSpin(vs,[],cc,random);
      const after=C.metrics(vs,cc);
      results.push({mode,before:before.icoer,after:after.icoer,order:after.order});
    }
    log(`Comparação controlada (30 nós, 200 passos, ruído 0): fixo ICOER ${num(results[0].after)}; completo ${num(results[1].after)}. Não confundir com superioridade comprovada.`);
  }
  function exportCsv(){
    const columns=['timestamp','step','kind','local','remote','simulated','icoer','U','V','T','Vn','Tn','order','sumNorm','rate','mode','noise','spatial'];
    const values=history.map(row=>columns.map(k=>{const x=row[k];return typeof x==='string'?'"'+x.replace(/"/g,'""')+'"':x===null?'':String(x??'');}).join(','));
    const blob=new Blob(['\ufeff'+columns.join(',')+'\r\n'+values.join('\r\n')],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download='ayanode_tgu_v1_1_'+Date.now()+'.csv';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);log(`${history.length} registros exportados para CSV.`);
  }
  async function loadGun(){
    if(window.Gun||window.GUN) return window.Gun||window.GUN;
    // O relay opcional serve /gun.js localmente, permitindo testes LAN sem CDN.
    const urls=location.protocol==='file:'?[]:[new URL('/gun.js',location.href).href];
    urls.push('https://cdn.jsdelivr.net/npm/gun@0.2020.1241/gun.js');
    for(const url of urls){
      try{
        const loaded=await new Promise((resolve,reject)=>{
          const script=document.createElement('script');script.async=true;script.src=url;
          script.onload=()=>window.Gun||window.GUN ? resolve(window.Gun||window.GUN):reject(Error('Biblioteca não inicializada'));
          script.onerror=()=>{script.remove();reject(Error('Script GUN inacessível'));};
          document.head.appendChild(script);
        });
        return loaded;
      }catch(e){ /* Tenta a segunda fonte. */ }
    }
    throw Error('GUN indisponível. Execute o relay local ou habilite o acesso à CDN.');
  }
  function handleRaw(raw,from){
    if(!networkEnabled)return;
    try{
      if(typeof raw!=='string'||raw.length>75000)return;
      const p=C.parsePacket(raw,{room,ttl:PEER_TTL});
      if(p.sender===liveId)return;
      if(from && p.sender!==from)return;
      if(!peerMeta.has(p.sender)&&peerMeta.size>=10)return;
      const lastSeq=peerMeta.get(p.sender)?.seq??-1;
      if(p.seq<=lastSeq)return;
      let total=trueRemoteCount()-(remoteBySender.get(p.sender)?.length??0)+p.nodes.length;
      if(total>MAX_REMOTE)return;
      peerMeta.set(p.sender,{seq:p.seq,lastSeen:Date.now()});
      remoteBySender.set(p.sender,p.nodes);
      if(netStatus!=='confirmed')log('Troca de dados entre instâncias confirmada: '+p.sender);
      setNet('confirmed','Rede ativa: estados de outra instância recebidos.');
      updateUI();
    }catch(err){ /* Descarta pacotes inválidos, legados, falsos ou fora da sala. */ }
  }
  function cleanupPeers(){
    if(!networkEnabled)return;
    const n=Date.now();let changed=false;
    for(const [id,p] of peerMeta)if(n-p.lastSeen>PEER_TTL){peerMeta.delete(id);remoteBySender.delete(id);changed=true;}
    if(changed){updateUI();log('Peers expirados removidos após 30 segundos sem dados válidos.');}
    if(peerMeta.size===0 && netStatus==='confirmed')setNet('waiting','Sem peers recentes: relay não confirmado.');
  }
  function broadcast(){
    if(!networkEnabled||!gun)return;
    try{
      const p=C.packet({sender:liveId,room,seq:++seq,nodes:localNodes.slice(0,MAX_LOCAL)});
      // Um único atributo string: o GUN não recebe arrays/objetos aninhados diretamente.
      gun.get(ROOT).get(room).get(liveId).put({payload:JSON.stringify(p)}, ack=>{
        if(ack&&ack.err)log('Falha de escrita no relay: '+String(ack.err).slice(0,120));
      });
    }catch(err){log('Falha ao publicar: '+err.message);}
  }
  async function toggleNetwork(){
    if(networkEnabled){disconnectNetwork();return;}
    const proposedRoom=$('room').value.trim();const relay=$('relay').value.trim();
    if(!/^[\w-]{1,48}$/.test(proposedRoom)){log('Sala inválida: use letras, números, hífen e sublinhado.');return;}
    if(!/^https?:\/\//.test(relay)){log('Relay inválido: informe URL http(s) completa.');return;}
    if(location.protocol==='https:' && relay.startsWith('http:')){log('Página HTTPS exige relay HTTPS para evitar conteúdo misto.');return;}
    if(gun && gunRelay!==relay){log('Para alterar o relay, recarregue a página (evita instâncias GUN acumuladas).');return;}
    $('network').disabled=true;setNet('waiting','Carregando biblioteca GUN...');
    try{
      const Gun=await loadGun();
      if(!gun){gun=Gun({peers:[relay],localStorage:false});gunRelay=relay;}
      room=proposedRoom;networkEnabled=true;seq=0;
      $('room').disabled=true;$('relay').disabled=true;$('network').textContent='Desconectar rede';$('send').disabled=false;
      // A sala contém chaves por remetente, cada uma com payload string plano.
      setNet('waiting','Publicando. Aguardando dados de outro participante.');
      listener=gun.get(ROOT).get(room).map();
      listener.on((data,key)=>{if(data&&typeof data.payload==='string')handleRaw(data.payload,key);});
      broadcast();broadcastTimer=setInterval(broadcast,4000);cleanupTimer=setInterval(cleanupPeers,2000);
      log('Inscrição iniciada em sala '+room+'. Isto não garante que o relay esteja acessível.');
    }catch(err){setNet('off','Rede indisponível: '+err.message);log(err.message);networkEnabled=false;}
    finally{$('network').disabled=false;}
  }
  function disconnectNetwork(){
    networkEnabled=false;
    if(broadcastTimer!==null){clearInterval(broadcastTimer);broadcastTimer=null;}
    if(cleanupTimer!==null){clearInterval(cleanupTimer);cleanupTimer=null;}
    if(listener){try{listener.off();}catch(e){ /* ignora */ }listener=null;}
    remoteBySender.clear();peerMeta.clear();
    $('room').disabled=false;$('relay').disabled=false;$('network').textContent='Conectar rede';$('send').disabled=true;
    setNet('off','Inscrição e publicações locais desativadas.');
    updateUI();log('Rede desativada no aplicativo; reconectar reutiliza a instância GUN.');
  }
  function fit(canvas){
    const dpr=Math.min(window.devicePixelRatio||1,2), w=canvas.clientWidth,h=canvas.clientHeight;
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    }
    const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);return {c,w,h};
  }
  function drawChart(){
    const {c,w,h}=fit($('chart'));c.clearRect(0,0,w,h);if(w<10)return;
    c.font='10px ui-monospace,monospace';c.strokeStyle='#32475b';c.lineWidth=1;
    for(let k=0;k<=4;k++){let y=16+(h-32)*k/4;c.beginPath();c.moveTo(28,y);c.lineTo(w-10,y);c.stroke();}
    const data=history.slice(-220), min=0,max=1;
    const plot=(key,color)=>{
      c.beginPath();c.strokeStyle=color;c.lineWidth=2;let started=false;
      data.forEach((row,i)=>{
        const v=row[key];if(!Number.isFinite(v))return;
        const x=28+(w-39)*(data.length<=1?0:i/(data.length-1));
        const y=16+(h-32)*(1-(v-min)/(max-min));
        if(!started){c.moveTo(x,y);started=true;}else c.lineTo(x,y);
      }); c.stroke();
    };
    plot('icoer','#4ce5ba');plot('U','#74b8ff');
    c.fillStyle='#9fb1c0';c.fillText('1',6,20);c.fillText('0',6,h-13);
    c.fillStyle='#4ce5ba';c.fillText('ICOER',w-114,12);
    c.fillStyle='#74b8ff';c.fillText('U',w-59,12);
  }
  function drawWorld(time){
    requestAnimationFrame(drawWorld);
    if(time-lastFrame<45)return;lastFrame=time;
    const {c,w,h}=fit($('world'));c.clearRect(0,0,w,h);
    const ns=allNodes();if(!ns.length)return;
    const margin=w>850?Math.min(420,w*.33):20;
    const centerX=w>850?margin+(w-margin)/2:w/2,centerY=h/2;
    const maxCoord=Math.max(12,...ns.flatMap(v=>v.pos.map(Math.abs)));
    const scale=Math.min(w>850?(w-margin)*.35:w*.36,h*.32)/(maxCoord*1.25);
    function point(pos){return {x:centerX+(pos[0]-pos[1])*.81*scale,y:centerY+(pos[0]+pos[1])*.31*scale-pos[2]*.47*scale};}
    const ee=C.edges(ns,cfg);
    c.strokeStyle='#47657970';c.lineWidth=1;
    for(const e of ee){const a=point(ns[e.i].pos),b=point(ns[e.j].pos);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
    ns.forEach((v,i)=>{
      const p=point(v.pos),sim=i>=localNodes.length+trueRemoteCount(),local=i<localNodes.length;
      const col=local?'#4ce5ba':sim?'#e7b16b':'#e58ed9';
      c.beginPath();c.fillStyle=col;c.shadowColor=col;c.shadowBlur=12;
      c.arc(p.x,p.y,Math.min(9,3+v.densidade*1.2),0,Math.PI*2);c.fill();c.shadowBlur=0;
      c.fillStyle='#d7e4e9';c.font='10px ui-monospace,monospace';
      c.fillText(v.id.length>20?v.id.slice(0,16)+'…':v.id,p.x+11,p.y-8);
    });
  }
  $('step').addEventListener('click',()=>evolve());$('run').addEventListener('click',toggleRun);
  $('fifty').addEventListener('click',()=>{for(let i=0;i<50;i++)evolve(true);log('Lote de 50 passos concluído.');});
  $('add').addEventListener('click',addNode);$('reset').addEventListener('click',reset);
  $('sim').addEventListener('click',addSimulation);$('clear-sim').addEventListener('click',()=>{simulated=[];updateUI();log('Nós simulados removidos.');});
  $('export').addEventListener('click',exportCsv);$('compare').addEventListener('click',runComparison);
  $('network').addEventListener('click',toggleNetwork);$('send').addEventListener('click',broadcast);
  ['lr','noise','mode'].forEach(id=>$(id).addEventListener('change',()=>{setConfig();updateUI();}));
  window.addEventListener('beforeunload',()=>{stop();if(networkEnabled)disconnectNetwork();});
  reset();requestAnimationFrame(drawWorld);
})();
