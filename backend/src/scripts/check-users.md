
cd /Users/rafaelalmeida/Desenv/marketplace

# 1. Confirma que o login via API ainda funciona
curl -i -sX POST http://localhost:9000/auth/user/emailpass \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"supersecret"}' 2>&1 | head -20

# 2. Confirma que o user existe
docker compose exec postgres psql -U postgres -d mercurjs -c "
  SELECT id, email, deleted_at FROM \"user\";
"

# 3. Confirma provider_identity emailpass está cadastrado
docker compose exec postgres psql -U postgres -d mercurjs -c "
  SELECT id, provider, entity_id, auth_identity_id, deleted_at 
  FROM provider_identity 
  WHERE provider = 'emailpass';
"

# 4. Verifica a URL que o admin-panel está usando
docker compose exec admin-panel env | grep -i medusa


# Apaga o user atual
docker compose exec postgres psql -U postgres -d mercurjs -c "
  DELETE FROM provider_identity WHERE entity_id = 'admin@test.com';
  DELETE FROM \"user\" WHERE email = 'admin@test.com';
"

# Cria de novo
make admin
# OU com outra senha:
docker compose run --rm --no-deps backend pnpm exec medusa user -e admin@test.com -p novaSenha123