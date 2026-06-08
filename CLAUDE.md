<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/003-default-review-stars/plan.md`

Active feature: **Estrelas de Avaliação por Padrão na Vitrine** (`003-default-review-stars`)
- Spec: `specs/003-default-review-stars/spec.md`
- Plan + design artifacts: `specs/003-default-review-stars/` (research.md, data-model.md, contracts/, quickstart.md)
- Escopo: storefront-only, apenas apresentação. Refina a 002: `ProductCard` passa a SEMPRE exibir
  as 5 estrelas (default `rating=0` => cinza claro), inclusive sem dado, preenchendo conforme reviews.
  Mudança mínima em `ProductCard.tsx` (default 0 + render incondicional); reusa `StarRating` e
  `getSellerRating`. Supersede a regra da 002 de ocultar estrelas quando o dado falta.

Related/previous features: `002-seller-review-stars-plp` (implementada), `001-home-plans-update` (pausada).
<!-- SPECKIT END -->
