# Implementation Plan: Estrelas de Avaliação por Padrão na Vitrine (Default Review Stars)

**Branch**: `003-default-review-stars` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-default-review-stars/spec.md`

## Summary

Refinar a `002-seller-review-stars-plp` para que **todo** card de produto da vitrine exiba a linha de 5 estrelas **por padrão** (cinza claro quando sem avaliação), inclusive quando o dado de avaliação está ausente/indisponível — e preencha automaticamente conforme avaliações surgem.

Abordagem técnica: ajuste mínimo, **somente no storefront** e **apenas de apresentação**, em um único componente. Hoje (pós-002) o `ProductCard` calcula `sellerRating: number | null` e **oculta** as estrelas quando o dado falta (`null`). A mudança: tornar a nota **sempre um número** com **default `0`** (estado cinza) e **sempre renderizar** o `StarRating`. O helper `getSellerRating` já retorna `{ rating: 0 }` para lista vazia/`null`/`undefined`, então o estado padrão cinza é natural. Robustez mantida via `try/catch` que recai em `0`. Nenhuma mudança de backend, API, banco, dados de rede ou de outros componentes.

## Technical Context

**Language/Version**: TypeScript / React 19 (Next.js 15.1.6 App Router), storefront.

**Primary Dependencies**: Componentes/funções já existentes — `StarRating` (`src/components/atoms/StarRating`), `getSellerRating` (`src/lib/helpers/seller-rating.ts`, criado na 002), `ProductCard` (`src/components/organisms/ProductCard`).

**Storage**: N/A (sem persistência; nota derivada em tempo de render das reviews já carregadas).

**Testing**: Verificação manual via quickstart (vitrine por categoria e busca; estados sem avaliação e avaliado) + lint/build existentes. Sem framework de testes no repo — não introduzir.

**Target Platform**: Storefront web (container `storefront`, porta 3000).

**Project Type**: Web — alteração isolada no frontend (storefront).

**Performance Goals**: Sem chamadas de rede adicionais; cálculo O(n) sobre reviews já presentes. Sem regressão perceptível (SC-005).

**Constraints**: As estrelas devem aparecer SEMPRE por padrão (cinza), inclusive sem dado (FR-003) — supersede a regra da 002 de ocultar. O bloco de estrelas nunca pode quebrar o card (FR-005). Visual consistente com a 002 (FR-007).

**Scale/Scope**: Edição de ~3 linhas em `ProductCard.tsx` (default 0 + render incondicional). Sem novos arquivos.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constituição (`.specify/memory/constitution.md`) é template não ratificado — sem gates específicos.

Princípios pragmáticos:
- **Reuso**: usa `StarRating` e `getSellerRating` já existentes (da 002), sem novo código de cálculo.
- **Mínima superfície de mudança**: um único componente, apenas apresentação.
- **Consistência**: continuidade direta da 002 (mesma fonte de nota e mesmo visual), mudando só o estado padrão.

✅ Sem violações. Complexity Tracking não necessária.

## Project Structure

### Documentation (this feature)

```text
specs/003-default-review-stars/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões
├── data-model.md        # Fase 1 — nota derivada (estado padrão)
├── quickstart.md        # Fase 1 — como validar
├── contracts/
│   └── product-card-default-stars.md   # contrato de UI do card (estados)
└── checklists/
    └── requirements.md  # (criado no /speckit-specify)
```

### Source Code (repository root)

```text
storefront/src/
├── components/organisms/ProductCard/
│   └── ProductCard.tsx                  # [MOD] nota default 0 (cinza) + render incondicional das estrelas
├── components/atoms/StarRating/StarRating.tsx  # [REUSE] sem alteração (rate=0 => 5 cinza claro)
└── lib/helpers/seller-rating.ts         # [REUSE] já trata null/undefined/vazio => rating 0
```

**Structure Decision**: Alteração contida em `ProductCard.tsx`, o único ponto de render compartilhado pelas duas PLPs (categoria via `ProductsList`; busca via `AlgoliaProductsListing`). Mudar o default para "sempre cinza" cobre busca e categoria (FR-006) sem tocar nos componentes de listagem. Como a fonte da nota e o componente visual já existem (002), não há novos arquivos de código.

## Complexity Tracking

> Não aplicável — Constitution Check sem violações.
