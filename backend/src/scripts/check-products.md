cd /Users/rafaelalmeida/Desenv/marketplace

# 1. Deletar o produto órfão (sem seller) — vamos usar o admin API que cuida das relações
TOKEN=$(curl -sX POST http://localhost:9000/auth/user/emailpass \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"supersecret"}' | jq -r .token)

PROD_ID=$(docker compose exec -T postgres psql -U postgres -d mercurjs -tAc "
  SELECT id FROM product WHERE deleted_at IS NULL LIMIT 1
" | tr -d ' \r')
echo "Produto a deletar: $PROD_ID"

curl -sX DELETE "http://localhost:9000/admin/products/$PROD_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Confirma que sumiu
docker compose exec postgres psql -U postgres -d mercurjs -c "
  SELECT COUNT(*) AS produtos_ativos FROM product WHERE deleted_at IS NULL;
"
# Esperado: 0

# 2. AGORA cria seller + produtos vinculados
make seed-vendor
# Output esperado vai listar:
# ▶ criando seller seller@mercurjs.com / secret ...
# ✔ seller criado: id=sel_...
# ✔ stock location, service zone, shipping option
# ✔ N produtos criados e vinculados ao seller.

# 3. Re-sync Algolia (agora vai indexar produtos COM seller)
make algolia-sync

# 4. Aguarde e confirme
sleep 8
echo "=== Total no Algolia (sem filtro) ==="
curl -s -X POST 'https://FVJPQ111Y7-dsn.algolia.net/1/indexes/products/query' \
  -H 'X-Algolia-Application-Id: FVJPQ111Y7' \
  -H 'X-Algolia-API-Key: 234d9841752cf0404f6ade37746fc52b' \
  -H 'Content-Type: application/json' \
  -d '{"query":"","hitsPerPage":0}' | jq '{total: .nbHits}'

echo "=== Filtrando como o storefront (pl + seller) ==="
curl -s -X POST 'https://FVJPQ111Y7-dsn.algolia.net/1/indexes/products/query' \
  -H 'X-Algolia-Application-Id: FVJPQ111Y7' \
  -H 'X-Algolia-API-Key: 234d9841752cf0404f6ade37746fc52b' \
  -H 'Content-Type: application/json' \
  -d '{"query":"","filters":"NOT seller:null AND NOT seller.store_status:SUSPENDED AND supported_countries:pl","hitsPerPage":3}' \
  | jq '{nbHits, hits: [.hits[] | {title, seller_handle: .seller.handle, supported_countries}]}'