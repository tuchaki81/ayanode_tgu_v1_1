# Formulação matemática implementada

O AYANODE v1.1 implementa um **modelo computacional de coerência**, não uma simulação quântica validada nem uma descrição verificada de fenômenos gravitacionais.

## Estados e referência coletiva

Cada nó tem `s_i ∈ R^16`, `||s_i||=1`, posição `p_i ∈ R^3`, densidade positiva e domínio. Com `N` nós locais e remotos, sejam:

```text
S = Σ_j s_j
R = S / ||S||, se ||S|| > ε
c_j = s_j · R
b_j = (1 + c_j) / 2
ICOER = Σ_j b_j^D / N
```

Para `||S|| <= ε`, o campo é degenerado: `R`, `ICOER` e `U` são marcados como indefinidos, e não se aplica passo de spin.

## Ação U

```text
U = α ICOER + β Vn − γ Tn
V = −Σ_(i,j)∈E ρ_i ρ_j / [1+(r_ij/Rc)^2]^D
T = Σ_(i,j)∈E log(1+κ[r_ij/(r_ij+R0)]^D)
Vn = |V|/(1+|V|)
Tn = log(1+T)/(1+log(1+T))
```

`E` é o conjunto de arestas únicas dos k vizinhos mais próximos, com exclusão configurável de pares IA–IA. A seleção dos vizinhos exige examinar distâncias entre nós; não é um solver espacial O(N) completo.

## Gradiente analítico do termo de coerência

Mantendo posições e densidades independentes dos spins, o gradiente de `U` quanto ao spin local `i` é:

```text
Q = Σ_j b_j^(D−1) (s_j − c_j R)
∂U/∂s_i = (α D / 2N) [ b_i^(D−1) R + Q/||S|| ]
```

O segundo termo contabiliza a dependência de `R` nos estados. A projeção tangente é:

```text
g_tan = g − (g·s_i) s_i
```

Atualizações são simultâneas para os nós locais, seguidas de normalização. Quando ruído é zero, uma busca linear reduz o passo se necessário para evitar perda de ICOER por arredondamento; com ruído não há garantia.

## Modo de campo fixo e otimização espacial

O modo `fixed` ignora `Q/||S||` para comparar com a aproximação da v1.0. A otimização espacial opcional ascende `U` em relação às coordenadas locais mantendo as arestas KNN fixas para calcular a derivada por trechos, mas recalculando-as ao aceitar o passo.

**Importante:** posições não são aceleradas por leis físicas, e o tempo de simulação não representa tempo astronômico. Não há integração de equações da gravitação nem força física inferida.

## Validação

Os 11 testes em `tests/core.test.js` verificam derivadas de spin e espaço por diferenças finitas, degenerescência, convergência sem ruído, normalização e estrutura de pacotes. Esses testes verificam consistência do algoritmo sob as condições exercitadas; não constituem validação de TGU contra observações físicas.
