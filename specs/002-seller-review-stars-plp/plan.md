# Implementation Plan: Exibir Avaliação (Estrelas) do Seller na Vitrine de Produtos

**Branch**: `002-seller-review-stars-plp` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-seller-review-stars-plp/spec.md`

## Summary

Exibir, em cada card de produto da vitrine (PLP — busca e categoria), uma linha de 5 estrelas com a **avaliação média do seller** do produto, conforme `specs/design/product-card-review.png`. Sem avaliações → 5 estrelas cinza; em erro/dado inválido → não exibir estrelas e manter o produto.

Abordagem técnica: mudança **somente no storefront** e **apenas de apresentação**. Os dados já chegam ao card — `listProducts`/`listProductsWithSort` e a busca Algolia já solicitam `*seller.reviews`, e o `ProductCard` já recebe o produto completo via `api_product`. Plano: (1) extrair um helper puro `getSellerRating(reviews)` (reaproveitando a lógica hoje duplicada em `SellerInfo`), (2) renderizar o componente existente `StarRating` no `ProductCard` com um guard de erro que isola falhas por card. Nenhuma mudança de backend, API, banco ou tipos de dados de rede.

## Technical Context

**Language/Version**: TypeScript / React 19 (Next.js 15.1.6 App Router), storefront.

**Primary Dependencies**: Componentes existentes — `StarRating` (`src/components/atoms/StarRating`), `ProductCard` (`src/components/organisms/ProductCard`); dados via `src/lib/data/products.ts`; tipos `SellerProps`/`SingleProductReview` (`src/types/seller.ts`, `src/types/product.ts`).

**Storage**: N/A (sem persistência nova; avaliação derivada em tempo de render das reviews já carregadas).

**Testing**: Verificação manual via quickstart (PLP por categoria e por busca) + lint/build existentes (`pnpm build`). Sem framework de testes configurado no repo — não introduzir nesta feature.

**Target Platform**: Storefront web (container `storefront`, porta 3000).

**Project Type**: Web — alteração isolada no frontend (storefront).

**Performance Goals**: Sem chamadas adicionais de rede; cálculo O(n) sobre as reviews já presentes. Não deve aumentar perceptivelmente o tempo de carregamento da vitrine (SC-005).

**Constraints**: Falha de avaliação por card deve ser isolada (FR-006) — um erro num card não pode quebrar a listagem nem afetar outros cards. Distinguir "sem avaliações" (cinza) de "erro" (nada). Visual fiel à referência de design (FR-007).

**Scale/Scope**: ~1 helper novo + edição do `ProductCard` (e refactor opcional de `SellerInfo` para usar o helper). Aplica-se às duas origens de PLP sem alterá-las (ambas já passam `api_product`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

A constituição (`.specify/memory/constitution.md`) é um **template não ratificado** (placeholders) — sem princípios verificáveis, nenhum gate específico.

Princípios pragmáticos (alinhados ao código existente):
- **Reuso**: usar o `StarRating` existente e o mesmo cálculo de média já aplicado em `SellerInfo`/detalhe do produto — sem reinventar.
- **DRY**: extrair a média para um helper único, eliminando a duplicação atual.
- **Mínima superfície de mudança**: nenhuma alteração de API/dados; somente apresentação no card.

✅ Sem violações. Complexity Tracking não necessária.

## Project Structure

### Documentation (this feature)

```text
specs/002-seller-review-stars-plp/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões
├── data-model.md        # Fase 1 — entidade derivada (rating do seller)
├── quickstart.md        # Fase 1 — como validar
├── contracts/
│   └── product-card-rating.md   # contrato de UI do card (entrada/estados)
└── checklists/
    └── requirements.md  # (criado no /speckit-specify)
```

### Source Code (repository root)

```text
storefront/src/
├── lib/helpers/
│   └── seller-rating.ts                 # [NEW] getSellerRating(reviews) -> { rating, reviewCount }
├── components/
│   ├── atoms/StarRating/StarRating.tsx  # [REUSE] sem alteração (rate=0 => 5 estrelas cinza)
│   ├── organisms/ProductCard/
│   │   └── ProductCard.tsx              # [MOD] renderiza estrelas do seller acima do título, com guard de erro
│   └── molecules/SellerInfo/SellerInfo.tsx  # [MOD opcional] passar a usar getSellerRating (remove duplicação)
└── types/
    └── product.ts | seller.ts           # [MOD se necessário] garantir tipo do seller no produto do card
```

**Structure Decision**: Alteração contida no storefront. O `ProductCard` é o único ponto de render compartilhado pelas duas PLPs (`ProductsList` para categoria/listagem padrão e `AlgoliaProductsListing` para busca), ambos já passando o produto completo em `api_product`. Portanto, exibir as estrelas no `ProductCard` cobre automaticamente busca e categoria (FR-001/FR-008) sem tocar nos componentes de listagem.

## Complexity Tracking

> Não aplicável — Constitution Check sem violações.
