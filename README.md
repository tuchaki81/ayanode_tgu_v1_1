# AYANODE TGU v1.1

**Laboratório experimental de coerência informacional e acoplamento de nós**  
**Projeto AYA · TGU · ICOER**  
**ⵔ◯ᘛ9ᘚ◯ⵔ**

> **Estado:** protótipo de pesquisa. O funcionamento local e os testes matemáticos foram verificados; a troca efetiva entre navegadores por GUN ainda precisa de testes de integração em rede real. O projeto não demonstra inteligência emergente, consciência ou gravitação física.

## O que é?

AYANODE TGU v1.1 é um laboratório computacional para investigar como estados informacionais representados por vetores podem evoluir a partir de uma medida coletiva de coerência. Seus componentes matemáticos são inspirados em hipóteses da **Teoria da Gravitação Unificada (TGU)** e do **Índice de Coerência e Ressonância (ICOER)**, no âmbito do projeto AYA.

Cada vórtice contém um vetor de *spin informacional* normalizado (16 dimensões por padrão), posição tridimensional, densidade e domínio. Uma referência coletiva é obtida pela soma normalizada dos spins. O sistema avalia **ICOER** e uma função objetivo **U** que agrega coerência, potencial de interação e tensão estrutural.

A interface permite executar passos, comparar dois gradientes, introduzir peers simulados, acompanhar métricas e exportá-las para CSV. A integração opcional com **GUN** disponibiliza um mecanismo experimental para compartilhar estados entre instâncias.

## Por que experimentar?

- **Pesquisa:** hipóteses e equações explícitas, passíveis de teste e comparação com algoritmos convencionais.
- **Educação:** visualização de vetores, campo médio, gradiente tangencial e comportamento de convergência.
- **Prototipagem:** separação entre núcleo matemático, interface e relay para construir experimentos multi-instância.
- **Reprodutibilidade:** sementes controladas, testes de derivadas por diferenças finitas e exportação de métricas.

> Aumentar ICOER pode significar apenas maior alinhamento dos vetores; isso **não prova** melhor desempenho em tarefas coletivas. Essa relação permanece hipótese experimental.

## Comece em 1 minuto — sem instalar dependências

1. Baixe ou clone este repositório.
2. Abra [`index.html`](./index.html) no Chrome, Edge ou outro navegador moderno.
3. Clique em **Executar 1 passo**, **+ 50 passos**, **Simular 2 peers** ou **Comparar 2 gradientes**.
4. Use **Exportar CSV** para salvar as métricas.

A simulação local usa apenas arquivos deste repositório e funciona sem internet. O modo P2P **não** funciona sem um relay GUN disponível.

## Executar testes e relay P2P local

**Requisitos:** Node.js 18+ e npm. O teste do núcleo não precisa instalar o GUN:

```bash
npm test
npm run check
```

Para utilizar o servidor de desenvolvimento e o relay local:

```bash
npm install
npm start
```

Acesse **http://127.0.0.1:8765/**. Em duas abas, informe a mesma sala (por exemplo, `aya-lab-11`) e o relay `http://127.0.0.1:8765/gun`, depois clique em **Conectar rede**. O indicador de recepção só confirma troca quando chegam estados válidos de outro participante; publicar localmente não é prova de conexão.

> **Segurança:** o relay não possui autenticação nem TLS. Por padrão, escuta apenas em `127.0.0.1`. Não exponha na internet pública nem publique dados confidenciais. Consulte [SECURITY.md](./SECURITY.md).

### Testar em dois computadores da mesma LAN

No computador que hospeda o relay, defina `AYANODE_HOST=0.0.0.0`, inicie com `npm start`, autorize no firewall apenas os dispositivos necessários e abra `http://IP-LOCAL-DO-SERVIDOR:8765/` no outro computador. Use `http://IP-LOCAL-DO-SERVIDOR:8765/gun` como endereço do relay. Isso deve ser feito **somente em rede confiável**. Consulte [docs/IMPLANTACAO.md](./docs/IMPLANTACAO.md).

## Conceitos matemáticos

Para N spins unitários `s_i` e referência `R`, quando `||Σ s_i|| > ε`:

```text
S     = Σ_i s_i
R     = S / ||S||
b_i   = (1 + s_i · R)/2
ICOER = (1/N) Σ_i b_i^D
U     = α·ICOER + β·Vn − γ·Tn
```

**Configuração padrão:** `D=12`, 16 dimensões, `KNN=4`, `α=0,5`, `β=0,1`, `γ=0,1`. O gradiente completo inclui a dependência de `R` em relação aos spins e é projetado no espaço tangente da esfera unitária. Há modo de referência fixa para comparação, além de uma otimização espacial opcional, **não equivalente** a uma simulação física da gravidade.

Para derivação, hipóteses e limitações, veja [docs/MATEMATICA.md](./docs/MATEMATICA.md).

## Estrutura do repositório

```text
AYANODE-TGU-v1.1-GitHub/
├── index.html               # Interface web (ponto de entrada)
├── src/
│   ├── core.js              # Núcleo TGU/ICOER reutilizável
│   └── app.js               # Interface e cliente GUN
├── server/
│   └── relay.js             # Servidor local + relay GUN
├── tests/
│   └── core.test.js         # 11 testes unitários
├── docs/
│   ├── MATEMATICA.md
│   ├── IMPLANTACAO.md
│   ├── ROADMAP.md
│   ├── PUBLICAR_NO_GITHUB.md
│   └── LICENCIAMENTO.md
├── .github/workflows/ci.yml
├── .github/ISSUE_TEMPLATE/
├── .gitignore
├── .editorconfig
├── .env.example
├── LICENSE
├── SECURITY.md
├── CONTRIBUTING.md
├── CHANGELOG.md
└── package.json
```

## Validação e limitações

- **Confirmado:** 11 testes automáticos do núcleo em Node.js, incluindo gradientes por diferenças finitas, preservação da norma, monotonicidade sem ruído e validação de pacotes.
- **Confirmado na versão original:** teste de interação da interface no Chromium para inicialização, passos, peers simulados e comparação.
- **A validar:** troca de mensagens por GUN em rede real, latência, perda de pacotes, persistência e resistência a dados adversariais.
- **Não demonstrado:** consenso distribuído formal, superioridade sobre algoritmos tradicionais, inteligência coletiva, consciência ou validação física da TGU.

## Publicar no GitHub

O passo a passo para criar o repositório, enviar os arquivos e opcionalmente ativar GitHub Pages está em [docs/PUBLICAR_NO_GITHUB.md](./docs/PUBLICAR_NO_GITHUB.md). **Extraia o ZIP antes de enviar**; não publique apenas o arquivo compactado.

## Colaboração e licenciamento

Sugestões de experimentos, testes, revisão matemática e relatórios de bugs são bem-vindos. Consulte [CONTRIBUTING.md](./CONTRIBUTING.md).

**Licença ainda não escolhida pelo titular.** O repositório contém uma declaração de reserva de direitos em [`LICENSE`](./LICENSE). Tornar um repositório público no GitHub não implica conceder automaticamente permissão para redistribuição ou alteração. Antes de convidar contribuições de código ou anunciar uso livre, o autor deve decidir e aplicar uma licença apropriada (por exemplo, MIT ou Apache-2.0). Consulte [docs/LICENCIAMENTO.md](./docs/LICENCIAMENTO.md).

## Autoria e referências do projeto

Projeto AYA / AYANODE TGU — **Henry Matuchaki** (2026).  
Referências relacionadas fornecidas no contexto do projeto: [TGU (Preprints.org)](https://doi.org/10.20944/preprints202502.0514.v3) e [ICOER v7 (Preprints.org)](https://doi.org/10.20944/preprints202507.0290.v2). Essas publicações são referências teóricas relacionadas, e não validações independentes desta implementação.

---

**AYANODE — A inteligência não está apenas nos nós; investigamos também as relações que eles conseguem construir.**
