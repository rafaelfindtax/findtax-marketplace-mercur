# Quickstart — Validação das Estrelas por Padrão na Vitrine

Pré-requisito: stack rodando (`storefront` 3000, `backend` 9000). Abrir o site em janela anônima.

## 1. Implementar

Editar `storefront/src/components/organisms/ProductCard/ProductCard.tsx` (ver contracts/product-card-default-stars.md):
- Trocar `sellerRating: number | null` por uma nota **sempre numérica** com default `0` (usar `getSellerRating(seller?.reviews).rating` dentro de `try/catch`, fallback `0`).
- Renderizar `<StarRating starSize={16} rate={rating} />` **incondicionalmente** acima do título (remover o `rating !== null && ...`).

Recarregar:
```bash
docker compose up -d --force-recreate storefront   # se necessário
```

## 2. Validar — estrelas sempre por padrão (US1 / CA001)

1. Abrir a home (`http://localhost:3000/br`) e/ou uma categoria/busca.
2. Confirmar: **todos** os cards exibem 5 estrelas; produtos sem avaliação mostram tudo em **cinza claro**.
3. Conferir que **nenhum** card aparece sem a linha de estrelas (mesmo sem dado de seller/review). (SC-003)

Verificação rápida via HTML server-rendered (home):
```bash
curl -s "http://localhost:3000/br" -o /tmp/h.html
plinks=$(grep -o 'href="/br/products/' /tmp/h.html | wc -l)   # ~3 por card
stars=$(grep -o "M12 1.25C12.2855" /tmp/h.html | wc -l)        # 5 por card
echo "cards≈$((plinks/3)) | estrelas=$stars (esperado 5 × nº de cards)"
```

## 3. Validar — preenchimento automático (US2 / CA002)

1. Garantir que um seller tenha ao menos uma avaliação (criar review via fluxo existente, ou inserir dado de teste).
2. Recarregar a vitrine; confirmar que os produtos desse seller mostram estrelas **preenchidas** conforme a média, enquanto produtos sem avaliação seguem cinza claro.

## 4. Validar — robustez (FR-005 / SC-004)

1. Simular dado de seller/review ausente ou inválido (ex.: produto sem seller).
2. Confirmar: o card ainda exibe as 5 estrelas cinza claro (estado padrão) e a vitrine não quebra.

## 4b. Validar — cor das estrelas vazias (cinza claro visível, FR-002a/SC-006)

As estrelas vazias devem ser **cinza claro visível** (não branco/invisível). Verificação no HTML server-rendered (path de bot):

```bash
curl -s -A "Googlebot/2.1" "http://localhost:3000/br/categories" -o /tmp/cat.html
echo "estrelas: $(grep -o "M12 1.25C12.2855" /tmp/cat.html | wc -l)"
# fills das estrelas vazias devem ser o cinza claro --bg-disabled, NÃO --brand-25 (branco):
grep -oE 'fill="rgba\(var\(--bg-disabled\)\)"' /tmp/cat.html | wc -l   # esperado > 0
grep -oE 'fill="rgba\(var\(--brand-25\)\)"' /tmp/cat.html | wc -l      # esperado 0
```

> ⚠️ Mudança de cliente (Algolia) exige rebuild limpo no Docker/macOS (file-watching não confiável): `docker exec mercur-storefront sh -c 'rm -rf /app/.next/*'` + `docker compose restart storefront`, depois hard-refresh no navegador.

## 5. Critérios de aceite rápidos

- [ ] 100% dos cards exibem a linha de estrelas (busca e categoria). (CA001/SC-001)
- [ ] Produtos sem avaliação ⇒ 5 estrelas **cinza claro visível** por padrão. (FR-002/FR-002a/FR-003)
- [ ] Estrelas vazias são distinguíveis das preenchidas e nunca invisíveis/brancas. (FR-002b/SC-006)
- [ ] Produtos avaliados ⇒ estrelas preenchidas (tom escuro) conforme a nota. (CA002/SC-002)
- [ ] Nenhum card sem estrelas por falta/indisponibilidade de dado. (SC-003)
- [ ] Falha do recurso não quebra a vitrine; recai no padrão cinza. (SC-004)
- [ ] Sem chamadas de rede adicionais / sem regressão perceptível. (SC-005)
