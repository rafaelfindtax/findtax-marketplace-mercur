# Contract — UI: Estrelas de Avaliação do Seller no ProductCard

Esta feature não expõe API. O "contrato" é a interface de UI do `ProductCard` e do helper de cálculo.

## Helper: `getSellerRating`

Arquivo: `storefront/src/lib/helpers/seller-rating.ts`

```ts
import type { SingleProductReview } from "@/types/product"

export interface SellerRating {
  rating: number      // 0–5, média das reviews válidas (0 se nenhuma)
  reviewCount: number // nº de reviews válidas
}

export function getSellerRating(
  reviews: (SingleProductReview | null)[] | null | undefined
): SellerRating
```

- Entrada inválida (`null`/`undefined`/não-array) → o **chamador** decide não exibir estrelas (ver contrato do card). O helper, se chamado com lista válida vazia, retorna `{ rating: 0, reviewCount: 0 }`.
- Função **pura**, sem efeitos colaterais; mesma fórmula de média já usada em `SellerInfo`.

## Componente: `ProductCard` (entrada → estados)

Arquivo: `storefront/src/components/organisms/ProductCard/ProductCard.tsx` (sem mudança de assinatura de props).

Entrada relevante: `api_product` tipado como `HttpTypes.StoreProduct & { seller?: SellerProps }`.

Lógica de exibição das estrelas (acima do título):

```
seller = api_product.seller
try:
  if seller && Array.isArray(seller.reviews):
      { rating } = getSellerRating(seller.reviews)
      render <StarRating rate={rating} starSize={16} />   // vazio ⇒ rate 0 ⇒ 5 cinza
  else:
      render nada                                          // sem seller/reviews válido
catch:
  render nada                                              // erro isolado neste card (FR-005/FR-006)
```

### Estados visíveis (mapa para requisitos)

| Estado | Resultado | Requisito |
|--------|-----------|-----------|
| Seller avaliado | N estrelas preenchidas + restantes cinza | FR-001, FR-002, FR-003, CA001 |
| Seller sem avaliações | 5 estrelas cinza | FR-004 |
| Erro / dado ausente | Sem estrelas; produto íntegro | FR-005, FR-006, CA002 |

### Invariantes

- O bloco de estrelas **nunca** lança erro para fora do card (try/catch + checagem de tipo). (FR-006)
- A mudança não altera as props nem o comportamento de `ProductsList`/`AlgoliaProductsListing` — ambas continuam passando `api_product`. (FR-008)
- Posição/tamanho/cores conforme `specs/design/product-card-review.png`. (FR-007)
