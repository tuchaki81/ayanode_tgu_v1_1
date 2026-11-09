/* AYANODE TGU v1.1 — núcleo analítico independente, 2026.
 * Modelo experimental de otimização de coerência, não uma simulação quântica validada.
 * Compatível com navegadores (window.AYANODE) e Node.js (module.exports).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AYANODE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULTS = Object.freeze({
    dimension: 16, D: 12, k: 4, Rc: 10, R0: 1, kappa: 1,
    alpha: 0.5, beta: 0.1, gamma: 0.1,
    lrSpin: 0.45, noise: 0, lrPos: 0.04,
    excludeIAIA: true, mode: 'complete', epsilon: 1e-9
  });

  function configOf(custom = {}) {
    const c = { ...DEFAULTS, ...custom };
    if (!(Number.isInteger(c.dimension) && c.dimension >= 2 && c.dimension <= 256)) throw Error('dimension inválida');
    if (!(Number.isFinite(c.D) && c.D >= 1)) throw Error('D inválido');
    if (!(Number.isInteger(c.k) && c.k >= 1)) throw Error('k inválido');
    if (!(c.Rc > 0 && c.R0 > 0 && c.kappa >= 0)) throw Error('Parâmetros espaciais inválidos');
    if (!(c.lrSpin >= 0 && c.lrPos >= 0 && c.noise >= 0)) throw Error('Taxas inválidas');
    if (c.mode !== 'complete' && c.mode !== 'fixed') throw Error('Modo inválido');
    return c;
  }
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const norm = v => Math.hypot(...v);
  function normalize(v, eps = 1e-12) {
    const n = norm(v);
    if (!(n > eps)) throw Error('Vetor nulo não pode ser normalizado');
    return v.map(x => x / n);
  }
  function prng(seed) {
    let state = (seed >>> 0) || 1;
    return function () {
      state += 0x6D2B79F5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function createVortex(id, random = Math.random, opts = {}) {
    const dim = opts.dimension || DEFAULTS.dimension;
    const spin = normalize(Array.from({length: dim}, () => 2 * random() - 1));
    return {
      id: String(id), spin, densidade: 1 + 2 * random(),
      pos: Array.from({length: 3}, () => 20 * random() - 10),
      dominio: opts.dominio || 'misto', ts: Date.now()
    };
  }
  function overlap(a, b) {
    return 0.5 * (1 - Math.max(-1, Math.min(1, dot(a, b) / (norm(a) * norm(b) + 1e-15))));
  }
  function reference(vortices, cfg = DEFAULTS) {
    const c = configOf(cfg), S = Array(c.dimension).fill(0);
    for (const v of vortices) for (let d = 0; d < c.dimension; d++) S[d] += v.spin[d];
    const magnitude = norm(S);
    return { R: magnitude > c.epsilon ? S.map(x => x / magnitude) : null,
      magnitude, order: vortices.length ? magnitude / vortices.length : 0 };
  }
  function icoer(vortices, cfg = DEFAULTS) {
    const c = configOf(cfg), f = reference(vortices, c);
    if (!vortices.length || !f.R) return {value: null, ...f};
    const value = vortices.reduce((sum, v) =>
      sum + Math.pow(Math.max(0, (1 + dot(v.spin, f.R)) / 2), c.D), 0) / vortices.length;
    return { value, ...f };
  }
  function distance3(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
  function edges(vortices, cfg = DEFAULTS) {
    const c = configOf(cfg), out = [], visited = new Set();
    for (let i = 0; i < vortices.length; i++) {
      const near = [];
      for (let j = 0; j < vortices.length; j++) if (j !== i) {
        near.push({j, r: distance3(vortices[i].pos, vortices[j].pos)});
      }
      near.sort((a, b) => a.r - b.r || a.j - b.j);
      for (const {j} of near.slice(0, c.k)) {
        const a = Math.min(i,j), b = Math.max(i,j), key = `${a}-${b}`;
        if (visited.has(key)) continue;
        visited.add(key);
        if (c.excludeIAIA && vortices[a].dominio === 'ia' && vortices[b].dominio === 'ia') continue;
        out.push({i:a, j:b, r:distance3(vortices[a].pos, vortices[b].pos)});
      }
    }
    return out;
  }
  function spatialTerms(vortices, cfg = DEFAULTS, givenEdges = null) {
    const c = configOf(cfg), ee = givenEdges || edges(vortices, c);
    let V = 0, T = 0;
    for (const {i,j,r} of ee) {
      const a = vortices[i], b = vortices[j];
      V -= a.densidade * b.densidade / Math.pow(1 + (r / c.Rc) ** 2, c.D);
      const f = r / (r + c.R0);
      T += Math.log1p(c.kappa * Math.pow(f, c.D));
    }
    const absV = Math.abs(V), lnT = Math.log1p(T);
    return { V, T, Vn: absV / (1 + absV), Tn: lnT / (1 + lnT), edgeCount: ee.length };
  }
  function metrics(vortices, cfg = DEFAULTS) {
    const c = configOf(cfg), I = icoer(vortices, c), st = spatialTerms(vortices, c);
    const U = I.value === null ? null : c.alpha * I.value + c.beta * st.Vn - c.gamma * st.Tn;
    return {icoer:I.value, U, ...st, order:I.order, sumNorm:I.magnitude,
      fieldValid:!!I.R, n:vortices.length};
  }

  /* Derivada EXATA do termo de coerência com R = S/||S||,
   * com nós remotos fixos durante o passo, mas incluídos em S.
   * g_i = alpha * D/(2N) [ b_i^(D-1) R + Q/||S|| ],
   * Q=sum_j b_j^(D-1) (s_j - (s_j·R)R).
   * O gradiente de posição/tensão não depende dos spins nesta implementação.
   */
  function spinGradients(vortices, localCount, cfg = DEFAULTS) {
    const c = configOf(cfg), f = reference(vortices, c), N = vortices.length;
    if (!f.R || !N) return {valid:false, grads:[], reason:'Campo coletivo nulo: direção indefinida'};
    const cs = vortices.map(v => dot(v.spin, f.R));
    const weights = cs.map(x => Math.pow(Math.max(0, (1 + x) / 2), c.D - 1));
    const Q = Array(c.dimension).fill(0);
    if (c.mode === 'complete') for (let j = 0; j < N; j++) {
      for (let d = 0; d < c.dimension; d++) Q[d] += weights[j] * (vortices[j].spin[d] - cs[j] * f.R[d]);
    }
    const coeff = c.alpha * c.D / (2 * N);
    const grads = [];
    for (let i = 0; i < Math.min(localCount, N); i++) {
      const s = vortices[i].spin;
      const euclidean = Array.from({length:c.dimension}, (_,d) =>
        coeff * (weights[i] * f.R[d] + (c.mode === 'complete' ? Q[d] / f.magnitude : 0)));
      const radial = dot(s, euclidean);
      grads.push(euclidean.map((x,d) => x - radial * s[d]));
    }
    return {valid:true, grads, magnitude:f.magnitude};
  }
  function proposedSpins(vortices, localCount, grads, rate, noise, random, cfg) {
    const out = vortices.map((v, i) => i < localCount ? {...v,spin:v.spin.slice()} : v);
    for (let i = 0; i < Math.min(localCount, grads.length); i++) {
      const s = vortices[i].spin;
      const next = s.map((x,d) => x + rate * grads[i][d] + noise * (random() - 0.5));
      out[i].spin = normalize(next);
      out[i].ts = Date.now();
    }
    return out;
  }
  function stepSpin(locals, remotes = [], cfg = DEFAULTS, random = Math.random) {
    const c = configOf(cfg), all = locals.concat(remotes);
    if (!locals.length || all.length < 2) return {changed:false, reason:'Ao menos dois nós e um nó local são necessários'};
    const before = metrics(all, c), grad = spinGradients(all, locals.length, c);
    if (!grad.valid) return {changed:false, reason:grad.reason};
    let rate = c.lrSpin, candidate = all, after = before, accepted = false;
    for (let iteration = 0; iteration < 14; iteration++) {
      candidate = proposedSpins(all, locals.length, grad.grads, rate, c.noise, random, c);
      after = metrics(candidate, c);
      if (c.noise !== 0 || (after.icoer !== null && after.icoer + 1e-13 >= before.icoer)) {
        accepted = true; break;
      }
      rate *= 0.5;
    }
    if (!accepted) return {changed:false, reason:'Passo rejeitado pela busca linear', before, after};
    for (let i = 0; i < locals.length; i++) {
      locals[i].spin = candidate[i].spin;
      locals[i].ts = candidate[i].ts;
    }
    return {changed:true, before, after, rate, gradNorm:Math.sqrt(grad.grads.reduce((s,g) => s + dot(g,g), 0))};
  }

  /* Gradiente espacial de U para conjunto FIXO de arestas KNN (válido por trechos).
   * Não representa força gravitacional/integração da dinâmica de Newton.
   */
  function spatialGradients(vortices, localCount, cfg = DEFAULTS) {
    const c = configOf(cfg), ee = edges(vortices,c), st = spatialTerms(vortices,c,ee);
    const grads = Array.from({length:Math.min(localCount,vortices.length)},()=>[0,0,0]);
    const vFactor = c.beta / (1 + Math.abs(st.V)) ** 2;
    const tFactor = c.gamma / ((1 + st.T) * (1 + Math.log1p(st.T)) ** 2);
    for (const {i,j,r} of ee) {
      if (r < c.epsilon) continue;
      const a=vortices[i], b=vortices[j], q=1+(r/c.Rc)**2;
      const dVdr = (a.densidade*b.densidade) * (2*c.D*r/(c.Rc*c.Rc)) / Math.pow(q,c.D+1);
      const f=r/(r+c.R0), df=c.R0/(r+c.R0)**2;
      const dTdr = (c.kappa*c.D*Math.pow(f,c.D-1)*df) / (1+c.kappa*Math.pow(f,c.D));
      const derivative = -vFactor*dVdr - tFactor*dTdr;
      for (let d=0;d<3;d++) {
        const delta = derivative*(a.pos[d]-b.pos[d])/r;
        if (i < grads.length) grads[i][d] += delta;
        if (j < grads.length) grads[j][d] -= delta;
      }
    }
    return {grads, edges:ee, terms:st};
  }
  function stepPosition(locals, remotes = [], cfg = DEFAULTS) {
    const c = configOf(cfg), all = locals.concat(remotes);
    if (!locals.length || all.length < 2) return {changed:false,reason:'Nós insuficientes'};
    const before = metrics(all,c), grad = spatialGradients(all,locals.length,c);
    let rate=c.lrPos, accepted=false, after=before, candidates=[];
    for (let k=0;k<14;k++) {
      candidates=locals.map((v,i)=>({ ...v, pos:v.pos.map((x,d) => x + rate * grad.grads[i][d]) }));
      after=metrics(candidates.concat(remotes),c);
      if (after.U !== null && before.U !== null && after.U+1e-13>=before.U) { accepted=true; break; }
      rate*=0.5;
    }
    if (!accepted) return {changed:false,reason:'Passo espacial rejeitado',before,after};
    locals.forEach((v,i)=>{v.pos=candidates[i].pos;v.ts=Date.now();});
    return {changed:true,before,after,rate};
  }

  const PROTOCOL='ayanode-tgu/1.1';
  function packet({sender, room, seq, nodes, now=Date.now()}) {
    return {protocol:PROTOCOL,sender:String(sender),room:String(room),seq,
      ts:now,nodes:nodes.map(n=>({id:n.id,spin:n.spin.slice(),densidade:n.densidade,
        pos:n.pos.slice(),dominio:n.dominio}))};
  }
  function parsePacket(raw, opts={}) {
    let p;
    try { p=typeof raw === 'string' ? JSON.parse(raw) : raw; } catch(e) {throw Error('JSON inválido');}
    if (!p || p.protocol !== PROTOCOL || !/^[\w-]{4,64}$/.test(p.sender || '')) throw Error('Protocolo/remetente inválido');
    if (!/^[\w-]{1,48}$/.test(p.room || '') || (opts.room && p.room !== opts.room)) throw Error('Sala inválida');
    if (!Number.isSafeInteger(p.seq) || p.seq < 0) throw Error('Sequência inválida');
    const now = opts.now || Date.now(), ttl = opts.ttl || 30000;
    if (!Number.isFinite(p.ts) || Math.abs(now-p.ts)>ttl) throw Error('Pacote fora da janela temporal');
    if (!Array.isArray(p.nodes) || p.nodes.length>64) throw Error('Quantidade de nós inválida');
    const ids=new Set(), dim=opts.dimension || DEFAULTS.dimension;
    const nodes=p.nodes.map((n)=>{
      if (!n || typeof n.id !== 'string' || !/^[\w-]{1,64}$/.test(n.id) || ids.has(n.id)) throw Error('ID de nó inválido');
      ids.add(n.id);
      if (!Array.isArray(n.spin) || n.spin.length!==dim || !n.spin.every(x=>Number.isFinite(x)&&Math.abs(x)<=1.001)) throw Error('Spin inválido');
      const len=norm(n.spin);
      if (Math.abs(len-1)>0.025) throw Error('Spin não unitário');
      if (!Array.isArray(n.pos) || n.pos.length!==3 || !n.pos.every(x=>Number.isFinite(x)&&Math.abs(x)<=1e6)) throw Error('Posição inválida');
      if (!Number.isFinite(n.densidade) || n.densidade<=0 || n.densidade>1e3) throw Error('Densidade inválida');
      if (!['ia','cosmico','misto'].includes(n.dominio)) throw Error('Domínio inválido');
      return {id:`${p.sender}/${n.id}`,owner:p.sender,spin:normalize(n.spin),
        pos:n.pos.slice(),densidade:n.densidade,dominio:n.dominio,ts:now};
    });
    return {sender:p.sender,room:p.room,seq:p.seq,ts:p.ts,nodes};
  }

  return {DEFAULTS,PROTOCOL,configOf,dot,norm,normalize,prng,createVortex,overlap,
    reference,icoer,edges,spatialTerms,metrics,spinGradients,stepSpin,
    spatialGradients,stepPosition,packet,parsePacket};
});
