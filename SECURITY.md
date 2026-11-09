# Política de segurança

**AYANODE TGU v1.1 é um protótipo acadêmico e experimental, não um serviço de rede endurecido.**

- O relay GUN fornecido escuta em `127.0.0.1` por padrão.
- Não há autenticação, autorização, isolamento de salas confiável, TLS, criptografia de ponta a ponta ou defesa contra participantes maliciosos.
- Identificadores de salas **não são segredos**. Não compartilhe dados pessoais, sensíveis ou confidenciais pela rede.
- Não configure `AYANODE_HOST=0.0.0.0` fora de LAN controlada e não exponha o relay à Internet pública.
- `parsePacket` realiza validações estruturais básicas; elas não substituem um modelo de confiança, autenticação ou limites no nível de transporte.
- A comunicação P2P não foi auditada nem verificada em testes de integração reais nesta entrega.

Para relatar uma vulnerabilidade, **não publique exploração ou informações sensíveis em uma issue pública**. Contate o mantenedor por um canal privado que ele indicar no GitHub.
