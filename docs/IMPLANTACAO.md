# Execução e implantação

## Uso local somente com navegador

Abra `index.html`. Os arquivos `src/core.js` e `src/app.js` precisam permanecer na estrutura do repositório. O núcleo e a interface não exigem npm ou internet. A rede GUN requer um relay e a biblioteca correspondente.

## Servidor de laboratório

Requisitos: Node.js 18+ e npm. No diretório do projeto:

```bash
npm install
npm test
npm run check
npm start
```

O endereço padrão é `http://127.0.0.1:8765/`, com endpoint GUN em `/gun`. O servidor fornece apenas `index.html`, os scripts do projeto e `/gun.js` carregado da dependência npm.

### Windows PowerShell: teste na rede local

```powershell
$env:AYANODE_HOST="0.0.0.0"
$env:AYANODE_PORT="8765"
npm start
```

A partir de outro dispositivo em uma rede confiável, abra `http://IP-DO-SERVIDOR:8765/` e configure a sala e o relay `http://IP-DO-SERVIDOR:8765/gun`.

### Linux/macOS: teste na rede local

```bash
AYANODE_HOST=0.0.0.0 AYANODE_PORT=8765 npm start
```

**Não encaminhe a porta do roteador, não publique o endpoint na Internet e não trate as salas como privadas.** O protótipo não implementa autenticação, autorização, TLS, criptografia de ponta a ponta ou resistência a ataques Sybil.

## GitHub Pages

É possível hospedar a interface estática no GitHub Pages (fonte: raiz do branch), pois `index.html` usa caminhos relativos para `src/*.js`. Os experimentos locais continuarão disponíveis. A comunicação remota *não* é fornecida pelo Pages; exige um relay próprio e acessível. Páginas HTTPS só podem conectar a um relay HTTPS devido à política de conteúdo misto do navegador.

## Diagnóstico

- Abra o console do navegador (F12) e verifique erros de carregamento de `src/core.js` e `src/app.js`.
- Se `npm start` falhar, confirme que `npm install` terminou sem erros e que a porta 8765 está disponível.
- Se o status ficar em “aguardando”, isso **não** comprova uma conexão. Use duas instâncias independentes na mesma sala e verifique recebimento de estados válidos.
- A existência de peers simulados não indica atividade P2P real.
- O relay pode persistir dados em `ayanode_gun_data*`; a pasta é ignorada pelo Git. Não publique dados de execução no repositório.
