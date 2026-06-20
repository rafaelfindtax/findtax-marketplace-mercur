# Contract — UI: Estrelas por Padrão no ProductCard

Sem API. Contrato de UI do `ProductCard` (continuidade da 002, mudando o estado padrão).

## Componente: `ProductCard`

Arquivo: `storefront/src/components/organisms/ProductCard/ProductCard.tsx` (sem mudança de props).

### Lógica de exibição (003 — sempre exibir)

```
let rating = 0                       // default: estado cinza claro
try {
  const seller = (api_product as HttpTypes.StoreProduct & { seller?: SellerProps }).seller
  rating = getSellerRating(seller?.reviews).rating   // 0 p/ null/undefined/vazio
} catch {
  rating = 0                         // fallback robusto (FR-005)
}

// sempre renderiza:
<StarRating starSize={16} rate={rating} />
```

Diferença vs. 002: a variável deixa de ser `number | null`; **não há** mais o ramo que renderiza nada. O `StarRating` é **sempre** incluído acima do título.

### Estados visíveis (mapa para requisitos)

| Estado | Resultado | Requisito |
|--------|-----------|-----------|
| Sem avaliação / dado ausente | 5 estrelas cinza claro (default) | FR-001, FR-002, FR-003, CA001, SC-001/SC-003 |
| Com avaliações | N estrelas preenchidas + cinza claro | FR-004, CA002, SC-002 |
| Falha no cálculo | 5 estrelas cinza claro (fallback) | FR-005, SC-004 |

### Regra de cor das estrelas (estabelecida)

No componente compartilhado `storefront/src/components/atoms/StarRating/StarRating.tsx`:
- Estrela **preenchida** → `--content-primary` (tom escuro).
- Estrela **vazia/default** → `--bg-disabled` (cinza claro, neutral-200) — **visível** sobre o card.
- ❌ Não usar `action.on.primary` / `--brand-25` (branco) para estrela vazia — torna-se invisível sobre o card branco. (FR-002/FR-002a/FR-002b)

> A correção é no `StarRating` (compartilhado), não no `ProductCard`, pois a cor branca era um defeito latente em todos os usos do componente.

### Invariantes

- O `StarRating` é **sempre** renderizado em todo card (nunca oculto). (FR-001/FR-003)
- As estrelas vazias são **cinza claro visível** (nunca brancas/invisíveis). (FR-002a)
- O bloco nunca lança erro para fora do card; fallback = `rating 0`. (FR-005)
- Sem mudança em `ProductsList`/`AlgoliaProductsListing` — cobre busca e categoria pelo mesmo componente. (FR-006)
- Posição/tamanho conforme 002; cor de estrela vazia ajustada para cinza claro visível. (FR-007)
