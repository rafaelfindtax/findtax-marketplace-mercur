---
description: "Task list for Estrelas de Avaliação por Padrão na Vitrine (Default Review Stars)"
---

# Tasks: Estrelas de Avaliação por Padrão na Vitrine (Default Review Stars)

**Input**: Design documents from `/specs/003-default-review-stars/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Não solicitados na spec (sem TDD). Nenhuma task de teste automatizado; validação manual via quickstart.md.

**Organization**: Tasks por user story. ⚠️ Escopo mínimo: a feature é um ajuste de ~3 linhas em um único arquivo (`storefront/src/components/organisms/ProductCard/ProductCard.tsx`), reutilizando `StarRating` e `getSellerRating` já criados na 002. US1 e US2 são atendidas pela **mesma** edição — US2 não requer código adicional, apenas validação.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivo diferente, sem dependências)
- **[Story]**: US1, US2 (mapeia para a spec)

## Path Conventions

- Storefront (Next.js): caminhos sob `storefront/src/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar o ponto exato da mudança.

- [X] T001 Reler a lógica atual das estrelas (pós-002) em `storefront/src/components/organisms/ProductCard/ProductCard.tsx` para confirmar o locus da mudança (variável `sellerRating: number | null` e o render condicional `sellerRating !== null && <StarRating .../>`).

**Checkpoint**: Locus confirmado.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pré-requisitos reutilizáveis.

**Status**: Nenhuma task nova — `getSellerRating` (`storefront/src/lib/helpers/seller-rating.ts`) e `StarRating` (`storefront/src/components/atoms/StarRating`) já existem (entregues na 002) e já tratam `null`/`undefined`/array vazio retornando `rating 0`. Nada a construir aqui.

**Checkpoint**: Base pronta (herdada da 002).

---

## Phase 3: User Story 1 - Estrelas sempre visíveis por padrão (Priority: P1) 🎯 MVP

**Goal**: Todo card de produto da vitrine (busca e categoria) exibe a linha de 5 estrelas por padrão; sem avaliação ⇒ cinza claro; inclusive quando o dado está ausente.

**Independent Test**: Abrir a vitrine por categoria e por busca; 100% dos cards mostram as 5 estrelas, com produtos sem avaliação em cinza claro; nenhum card sem estrelas.

### Implementation for User Story 1

- [X] T002 [US1] Em `storefront/src/components/organisms/ProductCard/ProductCard.tsx`, trocar a nota de `number | null` por uma nota **sempre numérica** com default `0`: dentro de `try/catch`, `rating = getSellerRating(seller?.reviews).rating` e, em qualquer falha, `rating = 0` (fallback robusto — FR-005). Remover os retornos `null`.
- [X] T003 [US1] Em `ProductCard.tsx`, renderizar `<StarRating starSize={16} rate={rating} />` **incondicionalmente** acima do título (remover a condição `sellerRating !== null && ...`), garantindo a linha de estrelas em todo card (FR-001/FR-002/FR-003).
- [X] T004 [US1] Validar manualmente (quickstart.md §2): na home/PLP por categoria e busca, todos os cards exibem 5 estrelas; sem avaliação ⇒ cinza claro; nenhum card sem estrelas (CA001/SC-001/SC-003). Inclui o caso de dado ausente recaindo no padrão cinza (SC-004).

**Checkpoint**: MVP — estrelas sempre presentes por padrão em ambas as PLPs.

---

## Phase 4: User Story 2 - Preenchimento automático conforme avaliações (Priority: P1)

**Goal**: Conforme um produto/seller recebe avaliações, as estrelas preenchem automaticamente para refletir a nota, sem ação manual.

**Independent Test**: Para um seller com avaliações, abrir a vitrine e confirmar estrelas preenchidas conforme a média; produto sem avaliação permanece cinza claro.

> Sem código adicional: o preenchimento já decorre de `getSellerRating(seller.reviews)` (edição da US1). Esta fase é apenas verificação.

### Implementation for User Story 2

- [X] T005 [US2] Validar manualmente (quickstart.md §3): garantir que um seller tenha ≥1 avaliação (criar review pelo fluxo existente ou inserir dado de teste) e confirmar, em novo carregamento da vitrine, que os produtos desse seller exibem estrelas **preenchidas** conforme a nota, enquanto produtos sem avaliação seguem cinza claro (CA002/SC-002).

**Checkpoint**: Preenchimento automático confirmado.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verificação final e fidelidade visual.

- [X] T006 Conferir fidelidade visual (posição acima do título, tamanho, cor cinza claro do estado vazio) consistente com a 002/design, em desktop e mobile (FR-007/SC-004), incluindo a vitrine de **busca** (Algolia, renderizada no cliente).
- [X] T007 Rodar `pnpm build`/lint do storefront e executar a checklist final do quickstart.md §5 (sem chamadas de rede adicionais / sem regressão perceptível — SC-005).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: nenhuma task (herdada da 002).
- **US1 (Phase 3)**: depende apenas do Setup.
- **US2 (Phase 4)**: depende da edição da US1 (T002/T003) já aplicada; é só validação.
- **Polish (Phase 5)**: depende das histórias concluídas.

### User Story Dependencies

- **US1 (P1)**: a edição central. Base de tudo.
- **US2 (P1)**: sem código próprio — atendida pela edição da US1; requer apenas validação (e dado de avaliação para observar o preenchimento).

### ⚠️ Same-file constraint

T002 e T003 editam o **mesmo** arquivo `ProductCard.tsx` → **não** marcadas [P]; executar em sequência (T002 → T003).

### Parallel Opportunities

- Praticamente nenhuma: a feature é uma edição única e sequencial em um arquivo. Validações (T004, T005, T006) podem ser agrupadas após a edição.

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 (T001) → Phase 3 (T002–T004).
2. **STOP & VALIDATE**: estrelas sempre visíveis (cinza por padrão) na vitrine.
3. Demo do MVP.

### Incremental Delivery

1. US1 (edição) → validar estado padrão cinza → demo (MVP / CA001).
2. US2 → validar preenchimento automático com dado de avaliação (CA002).
3. Polish → build/lint + fidelidade visual (inclui busca Algolia).

---

## Notes

- Sem testes automatizados (não solicitados); validação manual via quickstart.md.
- Reuso total da 002: `StarRating` e `getSellerRating` sem alteração.
- A mudança **supersede** a regra da 002 de ocultar estrelas quando o dado falta — agora o padrão é sempre cinza.
- US2 não tem task de código; o preenchimento é consequência direta da edição da US1.
