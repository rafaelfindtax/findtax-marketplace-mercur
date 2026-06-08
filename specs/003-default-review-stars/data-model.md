# Data Model — Default Review Stars

Sem novas entidades persistidas. A feature apenas muda o **estado padrão** de exibição de um valor já derivado na 002.

## Dados de entrada (já existentes)

- **Produto do card** (`api_product`): `HttpTypes.StoreProduct & { seller?: SellerProps }`.
- **Seller** (`SellerProps`): `reviews?: any[]` (cada item ≈ `SingleProductReview` com `rating: number`).

## Valor derivado: nota exibida

`rating = getSellerRating(seller?.reviews).rating` (helper da 002).

| Situação de entrada | `rating` resultante | Exibição |
|---------------------|---------------------|----------|
| Reviews (array não vazio) | média 0–5 | estrelas preenchidas conforme a média |
| Reviews array vazio | `0` | 5 estrelas cinza claro (padrão) |
| `seller`/`reviews` ausente/indisponível | `0` (via helper/guard) | 5 estrelas cinza claro (padrão) |
| Falha no cálculo | `0` (fallback do `try/catch`) | 5 estrelas cinza claro (padrão) |

> Diferença-chave vs. 002: **não existe mais o estado "nada"**. Todo caminho recai num número (`0` por padrão) e o `StarRating` é **sempre** renderizado.

## Estado padrão

- **Default**: `rating = 0` ⇒ 5 estrelas cinza claro. É o estado-base de todo card.
- **Preenchido**: `rating > 0` ⇒ `Math.floor(rating)` estrelas preenchidas; demais cinza claro. Intervalo 0–5 (clamp já no helper). Sem meia-estrela.

## Cor das estrelas (regra estabelecida)

| Estado da estrela | Cor | Token |
|-------------------|-----|-------|
| Preenchida (avaliação) | tom escuro | `--content-primary` (neutral-1000) |
| Vazia / default | **cinza claro visível** | `--bg-disabled` (neutral-200, ≈`rgb(198,204,212)`) |

> A estrela vazia **não** pode ser branca/quase branca (antes usava `--brand-25` = `#fff`, invisível sobre o card). Deve ser cinza claro perceptível e distinta da preenchida (FR-002/FR-002a/FR-002b).
