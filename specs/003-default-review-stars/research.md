# Research — Estrelas de Avaliação por Padrão na Vitrine

Fase 0. Decisões baseadas no estado atual do código (pós-002).

## R1. O que muda em relação à 002?

- **Decision**: Alterar o `ProductCard` para que a nota seja **sempre um número** (default `0`) em vez de `number | null`, e **sempre renderizar** o `StarRating`. Remover a condição que oculta as estrelas quando o dado falta.
- **Rationale**: A 002 hoje retorna `null` (e oculta as estrelas) quando `seller`/`reviews` está ausente. A 003 exige que as estrelas apareçam por padrão (cinza claro) em **todos** os cards, inclusive sem dado (FR-001/FR-003). Defaultar para `0` aproveita o `StarRating` (rate 0 ⇒ 5 estrelas vazias/cinza claro).
- **Alternatives considered**: Manter `null` e renderizar um placeholder separado — desnecessário; `rate=0` já é exatamente o estado cinza desejado.

## R2. Cálculo da nota (fonte)

- **Decision**: Reutilizar `getSellerRating(seller?.reviews).rating` (helper criado na 002), que já retorna `0` para `null`/`undefined`/array vazio. A fonte da nota permanece a **avaliação agregada do seller** (continuidade da 002 / título "Show Review Seller Default").
- **Rationale**: Sem novo código de cálculo; comportamento de preenchimento automático (FR-004) já é intrínseco — conforme reviews surgem no dado do card, a média recalcula a cada carregamento.
- **Alternatives considered**: Nota por produto (reviews específicas do produto) — fora do escopo desta versão (ver Assumption da spec); exigiria dado de review por produto que não alimenta o card hoje.

## R3. Robustez (FR-005)

- **Decision**: Envolver o cálculo num `try/catch` que, em qualquer falha, recai em `rating = 0` (estado padrão cinza), garantindo que o card sempre renderize com a linha de estrelas e nunca quebre.
- **Rationale**: A 003 prioriza "sempre exibir o padrão". Em vez de ocultar em erro (como a 002 fazia), o fallback agora é o estado cinza, mantendo consistência visual e segurança.
- **Alternatives considered**: Re-lançar/ocultar em erro — contraria FR-003/FR-005 desta feature.

## R4. Preenchimento automático (FR-004 / CA002)

- **Decision**: Nenhum mecanismo novo. O preenchimento "automático" ocorre porque a nota é derivada das reviews presentes no dado do card a cada carregamento da listagem; quando o seller passa a ter avaliações, o próximo carregamento reflete a média — respeitando o cache existente da vitrine.
- **Rationale**: Atende CA002 sem tempo-real; alinhado ao caching atual (sem custo extra).
- **Alternatives considered**: Atualização em tempo real (websocket/revalidação por evento) — fora de escopo; não requerido.

## R5. Posição e visual (FR-007)

- **Decision**: Manter exatamente o que a 002 já entrega: `StarRating starSize={16}` acima do título, cor vazia = token existente (cinza claro). Sem alteração no `StarRating`.
- **Rationale**: Consistência total com a vitrine atual; a única diferença é "sempre exibir".

## R6. Abrangência (FR-006)

- **Decision**: A mudança no `ProductCard` cobre automaticamente categoria (`ProductsList`) e busca (`AlgoliaProductsListing`), pois ambos renderizam o mesmo `ProductCard`.
- **Rationale**: Ponto único de render; nenhum componente de listagem precisa mudar.

## R7. Cor das estrelas vazias — "cinza claro" visível (regra estabelecida)

- **Decision**: As estrelas **vazias** devem ser pintadas com **cinza claro visível** — token `--bg-disabled` (neutral-200, ≈`rgb(198,204,212)`) — em vez da cor anterior `action.on.primary` (`--brand-25` = `#ffffff`, branco).
- **Rationale / contexto**: Em validação, constatou-se que as estrelas vazias estavam sendo renderizadas em **branco** sobre o card branco — presentes no DOM, porém **invisíveis**. Isso afetava todo uso do componente de estrelas (não só a vitrine). O design de referência (002) mostra estrelas vazias em cinza claro. A correção define explicitamente a cor da estrela vazia como cinza claro visível.
- **Escopo da mudança**: ajustada a cor de estrela vazia no componente de estrelas compartilhado (`storefront/src/components/atoms/StarRating/StarRating.tsx`), o que corrige a vitrine e, consistentemente, as demais telas que exibem estrelas (página do seller, detalhe do produto), onde as estrelas vazias também estavam invisíveis.
- **Distinção de tons**: preenchida = tom escuro (`--content-primary`); vazia = cinza claro (`--bg-disabled`). Garante FR-002a/FR-002b.
- **Alternatives considered**:
  - `--content-disabled` (neutral-400, ≈`#737373`) — visível, porém **cinza médio**, mais escuro que o "cinza claro" do design; rejeitado em favor do neutral-200.
  - `emptyColor` como prop só no card (mudança local) — rejeitado: a cor branca era um defeito latente em todos os usos; corrigir no componente é mais correto e consistente (não há uso em fundo escuro).

## Itens NEEDS CLARIFICATION

Nenhum bloqueante. Premissa de fonte da nota (seller vs produto) documentada na spec; default = seller (continuidade da 002).
