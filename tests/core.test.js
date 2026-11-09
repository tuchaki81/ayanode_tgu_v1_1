'use strict';
const assert=require('node:assert/strict');
const C=require('../src/core.js');
const approx=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<tol, `esperado ${a} ~= ${b} (tolerância ${tol})`);
let passed=0;
function test(name, fn){try{fn();console.log('OK',name);passed++;}catch(e){console.error('FALHOU',name,e);process.exitCode=1;}}
const random=C.prng(11387);
const make=(N=9)=>Array.from({length:N},(_,i)=>C.createVortex('v'+i,random));

test('vetores criados sempre unitários',()=>{for(const v of make(12))approx(C.norm(v.spin),1,1e-13);});
test('sobreposição: alinhamento / ortogonalidade / oposição',()=>{
  approx(C.overlap([1,0],[1,0]),0,1e-12);
  approx(C.overlap([1,0],[0,1]),0.5,1e-12);
  approx(C.overlap([1,0],[-1,0]),1,1e-12);
});
test('ICOER ~ 1 quando todos os spins são iguais',()=>{
  const vs=make(6), same=vs[0].spin.slice();vs.forEach(v=>{v.spin=same.slice();});
  approx(C.metrics(vs).icoer,1,1e-12);
});
test('campos anti-alinhados: degenerescência explícita, sem NaN',()=>{
  const v=make(2);v[1].spin=v[0].spin.map(x=>-x);
  const m=C.metrics(v);assert.equal(m.icoer,null);assert.equal(m.U,null);
  const s=C.stepSpin([v[0]],[v[1]]);assert.equal(s.changed,false);assert.match(s.reason,/nulo/);
});
test('gradiente COMPLETO coincide com derivada tangencial por diferenças finitas',()=>{
  const vs=make(8);const cfg=C.configOf({noise:0,mode:'complete'});
  const g=C.spinGradients(vs,5,cfg);assert.equal(g.valid,true);
  for(let i=0;i<5;i++){
    const v=vs[i],s=v.spin.slice(),direction=C.normalize(g.grads[i]);
    const tang=direction.map((x,d)=>x-C.dot(direction,s)*s[d]);
    const e=1e-6;
    const pert=(sign)=>vs.map((q,j)=>j===i?{...q,spin:C.normalize(s.map((x,d)=>x+sign*e*tang[d]))}:q);
    const fplus=C.metrics(pert(+1),cfg).U, fminus=C.metrics(pert(-1),cfg).U;
    const numeric=(fplus-fminus)/(2*e), analytic=C.dot(g.grads[i],tang);
    approx(numeric,analytic,1e-7);
  }
});
test('gradiente campo fixo difere do completo em condição genérica',()=>{
  const vs=make(6), full=C.spinGradients(vs,6,{mode:'complete'}),old=C.spinGradients(vs,6,{mode:'fixed'});
  assert.ok(full.grads.some((g,i)=>C.norm(g.map((v,d)=>v-old.grads[i][d]))>1e-5));
});
test('passo com ruído zero nunca reduz ICOER em 80 iterações',()=>{
  const vs=make(20);let last=C.metrics(vs).icoer;
  for(let i=0;i<80;i++){
    const r=C.stepSpin(vs,[],{noise:0,mode:'complete'});assert.equal(r.changed,true);
    const next=C.metrics(vs).icoer;assert.ok(next+1e-12>=last);last=next;
    vs.forEach(v=>approx(C.norm(v.spin),1,1e-12));
  }
});
test('gradiente espacial corresponde a diferenças finitas para arestas estáveis',()=>{
  const vs=make(7), cfg=C.configOf();
  const g=C.spatialGradients(vs,7,cfg);
  for(let i=0;i<3;i++)for(let d=0;d<3;d++){
    const e=1e-5, origin=vs[i].pos[d];
    vs[i].pos[d]=origin+e;const fplus=C.metrics(vs,cfg).U;
    vs[i].pos[d]=origin-e;const fminus=C.metrics(vs,cfg).U;
    vs[i].pos[d]=origin;
    approx(g.grads[i][d],(fplus-fminus)/(2*e),1e-7);
  }
});
test('passo espacial não reduz U com campo válido',()=>{
  const vs=make(10), original=C.metrics(vs).U;
  const r=C.stepPosition(vs,[],{});
  assert.equal(r.changed,true);assert.ok(C.metrics(vs).U>=original-1e-12);
});
test('serialização preserva posições, spin e densidade',()=>{
  const vs=make(4), t=Date.now();const p=C.packet({sender:'node-alfa',room:'aya-lab-11',seq:1,nodes:vs,now:t});
  const decoded=C.parsePacket(JSON.stringify(p),{room:'aya-lab-11',now:t});
  assert.equal(decoded.nodes.length,4);
  approx(decoded.nodes[0].pos[0],vs[0].pos[0],1e-12);
  approx(C.dot(decoded.nodes[0].spin,vs[0].spin),1,1e-12);
  approx(decoded.nodes[0].densidade,vs[0].densidade,1e-12);
});
test('descarta payload inválido, id duplicado, sala errada e timestamp obsoleto',()=>{
  const vs=make(3),now=Date.now(),p=C.packet({sender:'node-b',room:'room-a',seq:1,nodes:vs,now});
  assert.throws(()=>C.parsePacket(JSON.stringify(p),{room:'room-b',now}));
  assert.throws(()=>C.parsePacket(JSON.stringify(p),{room:'room-a',now:now+40000}));
  p.nodes[1].id=p.nodes[0].id;
  assert.throws(()=>C.parsePacket(JSON.stringify(p),{room:'room-a',now}));
  assert.throws(()=>C.parsePacket('não é JSON'));
});
console.log(`\n${passed}/11 testes passaram.`);
