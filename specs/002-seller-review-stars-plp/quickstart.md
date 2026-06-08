# Quickstart — Validação das Estrelas do Seller na Vitrine

Pré-requisito: stack rodando (`backend` 9000, `storefront` 3000) via docker-compose. Abrir o site em janela anônima (evita ruído de extensões do navegador).

## 1. Confirmar o formato dos dados (R3)

Verificar como vêm as reviews do seller no endpoint que alimenta a PLP:

```bash
KEY=$(docker exec mercur-postgres psql -U postgres -d mercurjs -t -A \
  -c "SELECT token FROM api_key WHERE type='publishable' AND revoked_at IS NULL LIMIT 1;")

curl -s -H "x-publishable-api-key: $KEY" \
  "http://localhost:9000/store/products?limit=3&fields=*seller,*seller.reviews,*seller.reviews.customer" \
  | head -c 1500
```

Conferir: cada `product.seller.reviews` é um **array** (vazio quando sem avaliações). Se um seller sem reviews retornar `reviews: []`, o estado "cinza" funciona direto; se o campo vier **omitido**, ajustar a regra (ver R3 no research).

## 2. Implementar

1. Criar `storefront/src/lib/helpers/seller-rating.ts` com `getSellerRating(reviews)`.
2. (Opcional) Refatorar `storefront/src/components/molecules/SellerInfo/SellerInfo.tsx` para usar o helper.
3. Editar `storefront/src/components/organisms/ProductCard/ProductCard.tsx`: renderizar `<StarRating>` acima do título, com o guard de erro (contrato `product-card-rating.md`).
4. Build/recarregar:
   ```bash
   docker compose up -d --force-recreate storefront
   ```

## 3. Validar na vitrine

### Por categoria (US1, CA001)
1. Abrir uma página de categoria com produtos (`http://localhost:3000/br/categories/<handle>`).
2. Conferir: cada card mostra a linha de 5 estrelas acima do título, refletindo a média do seller.
3. Dois produtos do mesmo seller → mesma avaliação. (FR-002)

### Por busca (US1, FR-008)
1. Usar a busca e abrir os resultados.
2. Conferir: estrelas aparecem com o mesmo comportamento da categoria.

### Sem avaliações (US2, FR-004)
1. Localizar um produto cujo seller não tem reviews.
2. Conferir: 5 estrelas **cinza**, card íntegro. (estado coincide com a referência de design)

### Erro / dado ausente (US3, FR-005/FR-006, CA002)
1. Forçar cenário sem seller/reviews válido (ex.: produto sem seller, ou simular reviews inválidas em dev).
2. Conferir: o card **não** mostra estrelas e o produto aparece normalmente; os demais cards seguem com suas estrelas.

## 4. Conferir contra o design (FR-007, SC-004)

- Comparar posição (acima do título), tamanho e cores (preenchida vs cinza) com `specs/design/product-card-review.png`, em desktop e mobile.

## 5. Critérios de aceite rápidos

- [ ] Cards na busca e na categoria exibem as estrelas do seller. (FR-001/008, SC-001/CA001)
- [ ] Mesmo seller ⇒ mesma avaliação em produtos diferentes. (FR-002)
- [ ] Sem reviews ⇒ 5 estrelas cinza. (FR-004, SC-003)
- [ ] Erro/dado ausente ⇒ sem estrelas, produto exibido; falha isolada por card. (FR-005/006, SC-002/CA002)
- [ ] Visual conforme a referência de design. (FR-007, SC-004)
- [ ] Sem chamadas de rede adicionais / sem regressão perceptível de performance. (SC-005)
