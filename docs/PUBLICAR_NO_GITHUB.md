# Publicar no GitHub

## Pelo navegador (sem Git)

1. Acesse [github.com/new](https://github.com/new).
2. Sugestão de nome: **AYANODE-TGU**; descrição: **Laboratório experimental de coerência informacional distribuída — TGU, ICOER e Projeto AYA**.
3. Escolha visibilidade **Public** ou **Private** conforme sua intenção. Não inicialize o repositório com README, .gitignore ou LICENSE, porque esses arquivos já estão incluídos no pacote.
4. Crie o repositório, abra **Add file → Upload files** e envie **o conteúdo da pasta extraída** do ZIP, mantendo a estrutura de subpastas e o arquivo `.github/workflows/ci.yml`. Não envie o ZIP como único arquivo.
5. Confirme a presença de `index.html`, `README.md`, `src/`, `server/`, `tests/` e `.github/`. Faça o commit.
6. Abra a aba **Actions** para acompanhar os testes do núcleo. Uma execução verde significa que os testes do código passaram — **não** que o transporte P2P foi validado.

## Via Git (terminal na pasta extraída)

```bash
git init -b main
git add .
git commit -m "Release AYANODE TGU v1.1 experimental"
git remote add origin https://github.com/SEU-USUARIO/AYANODE-TGU.git
git push -u origin main
```

Crie antes o repositório vazio na sua conta e substitua `SEU-USUARIO` na URL. Esses comandos não foram executados neste pacote; você faz a publicação na sua própria conta.

## GitHub Pages (opcional)

Em **Settings → Pages**, selecione **Deploy from a branch**, branch `main` e pasta `/ (root)`. A interface estática estará disponível após a publicação do Pages. O Pages **não** hospeda o relay GUN nem torna pública uma rede funcional automaticamente. A versão atual não é adequada para expor um relay ao público.

## Antes do anúncio público

- [ ] Verifique titularidade, autoria e eventuais dependências de terceiros.
- [ ] Decida se manterá `LICENSE` com direitos reservados ou se adotará uma licença aberta.
- [ ] Confirme que não está enviando `node_modules`, arquivos de persistência GUN ou informações confidenciais.
- [ ] Confirme que o README diferencia implementação de hipóteses ainda não validadas.
- [ ] Faça um teste local de `npm test` e, se usar relay, valide duas instâncias em uma rede confiável.
