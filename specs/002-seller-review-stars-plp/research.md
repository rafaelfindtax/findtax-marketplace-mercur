# Research — Exibir Avaliação (Estrelas) do Seller na Vitrine

Fase 0. Decisões técnicas baseadas no código real do storefront.

## R1. Os dados de avaliação já estão disponíveis no card?

- **Decision**: Sim — reutilizar `api_product.seller.reviews` já presente no card; **nenhuma** nova chamada/campo de API.
- **Rationale**:
  - `src/lib/data/products.ts` (`listProducts`/`listProductsWithSort`) inclui nos `fields`: `*seller`, `*seller.reviews`, `*seller.reviews.customer`, `*seller.reviews.seller`.
  - `src/components/sections/ProductListing/AlgoliaProductsListing.tsx` (busca) busca o produto completo com `*seller.reviews` e o passa como `api_product`.
  - `src/components/organisms/ProductsList/ProductsList.tsx` passa `<ProductCard product={p} api_product={p} />`.
  - Logo, busca **e** categoria entregam `seller.reviews` ao `ProductCard` (FR-001/FR-008).
- **Alternatives considered**: Novo endpoint/campo de "rating agregado" no backend — rejeitado: dados já presentes; adicionaria complexidade sem ganho.

## R2. Como calcular a avaliação média do seller?

- **Decision**: Criar helper puro `getSellerRating(reviews)` em `src/lib/helpers/seller-rating.ts`, retornando `{ rating: number, reviewCount: number }`, replicando o critério já usado em `SellerInfo`: filtra reviews nulas, soma `rating`, divide pela contagem. Refatorar `SellerInfo` para consumir o helper (remove duplicação).
- **Rationale**: Mantém consistência com a média já exibida na página do seller e no detalhe do produto (Assumption da spec). Helper puro é trivial de reusar e isolar.
- **Alternatives considered**: Usar um campo `seller.rating` pré-computado — existe em `SingleProductSeller.rating` (tipo do detalhe), mas **não** é o que vem em `seller.reviews` do card; recomputar a partir das reviews é o caminho consistente e já comprovado.

## R3. Estado "sem avaliações" (cinza) vs. "erro" (nada)

- **Decision**: Regra de exibição no `ProductCard`:
  - `seller` presente **e** `seller.reviews` é um **array** (mesmo vazio) → renderizar `StarRating` com `rate = média` (vazio ⇒ `rate = 0` ⇒ 5 estrelas cinza). (FR-004)
  - `seller` ausente, ou `reviews` indisponível/não-array, ou qualquer exceção no cálculo → **não renderizar** as estrelas. (FR-005)
- **Rationale**: O `StarRating` já pinta como cinza (cor `action.on.primary`) toda estrela não preenchida; com `rate=0` as 5 ficam cinza — exatamente o estado "sem avaliações" da referência de design (onde os cards aparecem todos cinza). A distinção array-vazio vs ausente separa claramente "sem avaliações" de "erro/dado inválido", conforme os edge cases da spec.
- **Alternatives considered**: Tratar `undefined` como "sem avaliações" (cinza) — rejeitado: a spec classifica "reviews indisponíveis" como caso de não exibir nada.
- **⚠️ A confirmar na implementação/quickstart**: qual o formato retornado para um seller **sem nenhuma** review — `reviews: []` (→ cinza, desejado) ou campo omitido (→ nada). Se vier omitido e o produto desejado for "cinza", ajustar a regra para tratar `seller` presente com reviews ausentes como `rate=0`. Verificar via `GET /store/products` no quickstart.

## R4. Isolamento de falha por card (FR-006)

- **Decision**: Encapsular o cálculo + render das estrelas num bloco protegido dentro do `ProductCard` (try/catch em torno do cálculo; em erro, renderiza `null` no lugar das estrelas). Como cada `ProductCard` é independente, um erro num card não afeta os demais nem a listagem.
- **Rationale**: Atende FR-005/FR-006 com robustez local, sem depender de error boundary global. Simples e previsível.
- **Alternatives considered**: React Error Boundary por card — mais cerimônia para um cálculo trivial; o guard try/catch + checagens de tipo é suficiente.

## R5. Componente e posicionamento visual (FR-007)

- **Decision**: Reutilizar `StarRating` (atoms) dentro do `ProductCard`, posicionando a linha de estrelas **acima do título** do produto, em tamanho compatível com a referência (`starSize` pequeno, ~16). Sem alterar o `StarRating`.
- **Rationale**: A referência `product-card-review.png` mostra a linha de 5 estrelas logo acima do nome. O `StarRating` já entrega o visual (preenchidas vs cinza) usado no resto do app.
- **Alternatives considered**: Novo componente de estrelas — desnecessário; o atom existente cobre o caso.

## R6. Tipagem do seller no produto do card

- **Decision**: Tipar o acesso ao seller no `ProductCard` reutilizando `SellerProps` (`src/types/seller.ts`, que já tem `reviews?: any[]`), via um tipo local `api_product as HttpTypes.StoreProduct & { seller?: SellerProps }` (mesmo padrão já usado no retorno de `listProducts`).
- **Rationale**: `HttpTypes.StoreProduct` não declara `seller`; o projeto já estende esse tipo no data-layer. Mantém consistência sem inventar tipos novos.
- **Alternatives considered**: Estender globalmente `HttpTypes` — fora do escopo; acesso tipado localmente basta.

## Itens NEEDS CLARIFICATION

Nenhum pendente. Único ponto a **verificar em runtime** (não bloqueante para o plano): formato de `reviews` para sellers sem avaliações (R3) — coberto no quickstart.
