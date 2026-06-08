---
description: "Task list for Exibir Avaliação (Estrelas) do Seller na Vitrine de Produtos"
---

# Tasks: Exibir Avaliação (Estrelas) do Seller na Vitrine de Produtos

**Input**: Design documents from `/specs/002-seller-review-stars-plp/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Não solicitados na spec (sem TDD). Nenhuma task de teste automatizado é gerada; a validação é manual via quickstart.md.

**Organization**: Tasks agrupadas por user story. ⚠️ Observação importante de escopo: as três histórias alteram o **mesmo arquivo** `storefront/src/components/organisms/ProductCard/ProductCard.tsx`, portanto suas tasks de implementação são **sequenciais** (não paralelizáveis entre si). O ganho de paralelismo está no helper e no refactor.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivo diferente, sem dependências pendentes)
- **[Story]**: US1, US2, US3 (mapeia para a spec)

## Path Conventions

- Storefront (Next.js): caminhos sob `storefront/src/` (alteração isolada no frontend, conforme plan.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar premissa de dados antes de implementar.

- [X] T001 Verificar o formato de `seller.reviews` no endpoint da PLP (quickstart.md §1): rodar o `curl` para `GET /store/products?fields=*seller,*seller.reviews` com a publishable key e confirmar se seller sem avaliações retorna `reviews: []` (estado "cinza") ou campo omitido. Registrar o resultado para ajustar a regra do card se necessário (research.md R3).

**Checkpoint**: Formato dos dados conhecido — implementação pode começar.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Helper puro de cálculo, reutilizável por todas as histórias.

**⚠️ CRITICAL**: Nenhuma história pode renderizar as estrelas antes de T002.

- [X] T002 [P] Criar helper puro `getSellerRating(reviews)` e a interface `SellerRating { rating, reviewCount }` em `storefront/src/lib/helpers/seller-rating.ts`, replicando o critério de média de `SellerInfo` (filtrar reviews nulas; `rating = soma/contagem`, `0` quando vazio; limitar 0–5). Importar o tipo `SingleProductReview` de `storefront/src/types/product.ts` (contrato em contracts/product-card-rating.md).

**Checkpoint**: Helper disponível e importável — histórias podem prosseguir.

---

## Phase 3: User Story 1 - Visitante vê a reputação do seller na listagem (Priority: P1) 🎯 MVP

**Goal**: Cada card de produto da PLP (busca e categoria) exibe a linha de 5 estrelas com a avaliação média do seller.

**Independent Test**: Abrir a PLP por categoria e por busca; cada card mostra a linha de estrelas refletindo a média do seller; dois produtos do mesmo seller mostram a mesma avaliação.

### Implementation for User Story 1

- [X] T003 [US1] Em `storefront/src/components/organisms/ProductCard/ProductCard.tsx`, importar `StarRating` (de `@/components/atoms`) e `getSellerRating` (de `@/lib/helpers/seller-rating`), e tipar o acesso ao seller como `const seller = (api_product as HttpTypes.StoreProduct & { seller?: SellerProps }).seller` (importar `SellerProps` de `@/types/seller`).
- [X] T004 [US1] Em `ProductCard.tsx`, renderizar `<StarRating starSize={16} rate={rating} />` **acima do título** do produto (no bloco de texto do card), calculando `rating` via `getSellerRating(seller.reviews)` quando `seller` existe e `seller.reviews` é array não vazio (estrelas preenchidas conforme a média) — posição/tamanho conforme `specs/design/product-card-review.png` (FR-001/002/003/007/008).
- [X] T005 [US1] Validar manualmente (quickstart.md §3): estrelas aparecem na PLP por **categoria** e por **busca**; mesmo seller ⇒ mesma avaliação em produtos diferentes (CA001/SC-001).

**Checkpoint**: MVP funcional — estrelas de seller avaliado aparecem em ambas as PLPs.

---

## Phase 4: User Story 3 - Falha ao obter avaliação não quebra a vitrine (Priority: P1)

**Goal**: Em erro ou dado ausente/inválido, o card não exibe estrelas e continua mostrando o produto; falha isolada por card.

**Independent Test**: Forçar produto sem seller/reviews válido (ou simular reviews inválidas) e confirmar que o card aparece sem estrelas, íntegro, sem afetar os demais cards.

> Ordem: P1 junto da US1 por compartilhar o mesmo arquivo; implementar o guard logo após o render base reduz retrabalho.

### Implementation for User Story 3

- [X] T006 [US3] Em `ProductCard.tsx`, envolver o cálculo+render das estrelas em um guard de erro: `Array.isArray(seller?.reviews)` como pré-condição e `try/catch` em volta de `getSellerRating`/render; em ausência de `seller`/`reviews` válido ou em exceção, renderizar `null` no lugar das estrelas (sem placeholder), mantendo o restante do card (FR-005/FR-006).
- [X] T007 [US3] Validar manualmente (quickstart.md §"Erro / dado ausente"): produto sem seller/reviews válido não mostra estrelas e é exibido normalmente; demais cards seguem com suas estrelas (CA002/SC-002).

**Checkpoint**: Robustez garantida — falhas de avaliação não quebram a vitrine.

---

## Phase 5: User Story 2 - Produto sem avaliações ainda (Priority: P2)

**Goal**: Seller sem nenhuma avaliação exibe as 5 estrelas em cinza (estado vazio), distinto de erro.

**Independent Test**: Produto de seller sem reviews mostra 5 estrelas cinza, card íntegro.

### Implementation for User Story 2

- [X] T008 [US2] Em `ProductCard.tsx`, garantir que `seller` presente com `reviews` array **vazio** renderize `<StarRating rate={0} />` (5 estrelas cinza) — distinguindo de "erro" (T006). Se T001 indicar que sellers sem reviews vêm com o campo **omitido** e o comportamento desejado for "cinza", ajustar a pré-condição para tratar `seller` presente como `rate=0` (research.md R3 / data-model.md).
- [X] T009 [US2] Validar manualmente (quickstart.md §"Sem avaliações"): produto de seller sem reviews exibe 5 estrelas cinza, card íntegro (FR-004/SC-003).

**Checkpoint**: Estados "sem avaliações" e "erro" claramente distintos e corretos.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: DRY, fidelidade ao design e verificação final.

- [X] T010 [P] Refatorar `storefront/src/components/molecules/SellerInfo/SellerInfo.tsx` para consumir `getSellerRating` (remove a duplicação do cálculo de média), sem mudar seu comportamento visível.
- [X] T011 Conferir fidelidade ao design `specs/design/product-card-review.png` (posição acima do título, tamanho das estrelas, cores preenchida/cinza) em desktop e mobile (FR-007/SC-004).
- [X] T012 Rodar `pnpm build`/lint do storefront e executar a checklist final do quickstart.md §5 (sem chamadas de rede adicionais / sem regressão perceptível — SC-005).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — começa imediatamente.
- **Foundational (Phase 2 / T002)**: depende do Setup; **bloqueia** todas as histórias.
- **User Stories (Phases 3–5)**: dependem de T002.
- **Polish (Phase 6)**: depende das histórias desejadas concluídas.

### User Story Dependencies

- **US1 (P1)**: após T002. Base do render no `ProductCard`.
- **US3 (P1)**: após T002; na prática implementada logo após US1 por compartilhar `ProductCard.tsx`.
- **US2 (P2)**: após T002; ajusta o ramo "array vazio" do mesmo render. Conceitualmente independente, mas **sequencial** por arquivo compartilhado.

### ⚠️ Same-file constraint

T003, T004, T006, T008 editam todos `ProductCard.tsx` → **não** marcadas [P] entre si; executar em sequência (ordem sugerida: T003 → T004 → T006 → T008).

### Parallel Opportunities

- T002 (helper) é [P] em relação a tudo que não seja sua dependência direta.
- T010 (refactor de `SellerInfo.tsx`) é [P]: arquivo diferente, depende apenas de T002.
- Tasks de validação (T005, T007, T009, T011, T012) podem agrupar verificações, mas dependem da implementação correspondente.

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 (T001) → Phase 2 (T002) → Phase 3 (T003–T005).
2. **STOP & VALIDATE**: estrelas aparecem corretamente na PLP (busca e categoria).
3. Demo do MVP.

### Incremental Delivery

1. Foundational pronto (T002).
2. US1 (estrelas avaliadas) → validar → demo (MVP).
3. US3 (guard de erro) → validar → garante robustez (CA002).
4. US2 (estado cinza) → validar → cobre o estado vazio.
5. Polish (DRY + design + build).

---

## Notes

- Sem testes automatizados (não solicitados); validação manual via quickstart.md.
- A maior parte da lógica vive num único arquivo (`ProductCard.tsx`) — preferir commits pequenos por task.
- Reuso máximo: `StarRating` (atom) sem alteração; cálculo de média centralizado no novo helper.
- Único ponto a confirmar em runtime: formato de `reviews` para sellers sem avaliações (T001 → afeta T008).
