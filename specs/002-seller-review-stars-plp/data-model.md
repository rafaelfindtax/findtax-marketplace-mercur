# Data Model — Seller Rating na Vitrine

Não há novas entidades persistidas. A feature deriva, em tempo de render, um valor de avaliação a partir de dados já carregados no card.

## Dados de entrada (já existentes)

- **Produto do card** (`api_product`): `HttpTypes.StoreProduct & { seller?: SellerProps }`.
- **Seller** (`SellerProps`, `src/types/seller.ts`): possui `reviews?: any[]` (cada item ≈ `SingleProductReview`).
- **Review** (`SingleProductReview`, `src/types/product.ts`): campo relevante `rating: number` (0–5).

## Entidade derivada (computada): SellerRating

Resultado puro de `getSellerRating(reviews)`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `rating` | number | Média das notas das reviews válidas (não-nulas). `0` quando não há reviews. Intervalo 0–5. |
| `reviewCount` | number | Quantidade de reviews válidas (não-nulas). `0` quando não há. |

**Regra de cálculo** (consistente com `SellerInfo`):
```
válidas = reviews.filter(r => r !== null)
reviewCount = válidas.length
rating = reviewCount > 0 ? soma(válidas.rating) / reviewCount : 0
```

## Estados de exibição no card (decisão de render)

| Condição de entrada | Estado | Render |
|---------------------|--------|--------|
| `seller` presente **e** `reviews` é array **não vazio** | Avaliado | `StarRating rate=rating` (estrelas preenchidas conforme média) |
| `seller` presente **e** `reviews` é array **vazio** | Sem avaliações | `StarRating rate=0` → 5 estrelas cinza |
| `seller` ausente **ou** `reviews` indisponível/inválido **ou** exceção | Erro/indisponível | Nada (sem estrelas); produto exibido normalmente |

> Observação (R3): confirmar em runtime se seller sem reviews retorna `reviews: []` (→ cinza). Caso retorne o campo omitido e o comportamento desejado seja "cinza", tratar `seller` presente como `rate=0`.

## Preenchimento das estrelas

- O `StarRating` preenche `Math.floor(rate)` estrelas; demais ficam cinza (cor "vazia"). Sem meia-estrela (Assumption da spec). Intervalo limitado a 0–5.
