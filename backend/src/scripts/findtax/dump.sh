#!/usr/bin/env bash
# =============================================================================
# FINDTAX — Gera dump SQL do banco local pronto para deploy em outro Postgres.
#
# Estratégia:
#   - pg_dump --data-only --column-inserts (1 INSERT por linha — filtrável)
#   - Exclui tabelas internas/transacionais (migrations, workflows, orders…)
#   - Remove o usuário admin do dump (será recriado manualmente no destino)
#
# Saída:
#   backend/src/sample/findtax-seed.sql
#
# Uso (a partir da raiz do projeto):
#   make findtax-dump
#   # ou direto:
#   bash backend/src/scripts/findtax/dump.sh
# =============================================================================

set -euo pipefail

# Diretório do projeto (raiz onde está o docker-compose.yml)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$PROJECT_ROOT"

DUMP_DIR="backend/src/sample"
DUMP_FILE="$DUMP_DIR/findtax-seed.sql"
TMP_FILE="$DUMP_DIR/.findtax-seed.tmp.sql"
mkdir -p "$DUMP_DIR"

DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-mercurjs}"

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  FINDTAX — gerando dump SQL"
echo "═══════════════════════════════════════════════════════════════════════════"

# ----------------------------------------------------------------------------
# 1. Descobre o auth_identity_id do admin para remover do dump
# ----------------------------------------------------------------------------
echo "→ descobrindo IDs do admin (para remover do dump)..."

ADMIN_AUTH_ID=$(docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -tAc \
  "SELECT auth_identity_id FROM provider_identity WHERE entity_id = 'admin@test.com' LIMIT 1" \
  2>/dev/null | tr -d ' \r\n' || echo "")

ADMIN_USER_ID=$(docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -tAc \
  "SELECT id FROM \"user\" WHERE email = 'admin@test.com' LIMIT 1" \
  2>/dev/null | tr -d ' \r\n' || echo "")

echo "   admin auth_identity_id: ${ADMIN_AUTH_ID:-(não encontrado)}"
echo "   admin user_id:          ${ADMIN_USER_ID:-(não encontrado)}"

# ----------------------------------------------------------------------------
# 2. pg_dump --data-only --column-inserts com exclusões de tabelas internas
# ----------------------------------------------------------------------------
echo ""
echo "→ executando pg_dump..."

docker compose exec -T postgres pg_dump \
  --data-only \
  --column-inserts \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  --exclude-table=mikro_orm_migrations \
  --exclude-table=script_migrations \
  --exclude-table=workflow_execution \
  --exclude-table='event_log*' \
  --exclude-table='event_emitter*' \
  --exclude-table=currency \
  --exclude-table=country \
  --exclude-table=language \
  --exclude-table=order \
  --exclude-table='order_*' \
  --exclude-table='order_change*' \
  --exclude-table='order_claim*' \
  --exclude-table='order_exchange*' \
  --exclude-table=cart \
  --exclude-table='cart_*' \
  --exclude-table=customer \
  --exclude-table='customer_*' \
  --exclude-table=payment \
  --exclude-table='payment_*' \
  --exclude-table='payout*' \
  --exclude-table=draft_order \
  --exclude-table='draft_order_*' \
  --exclude-table='wishlist*' \
  --exclude-table='application*' \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  > "$TMP_FILE"

LINES_RAW=$(wc -l < "$TMP_FILE" | tr -d ' ')
echo "   dump bruto: $LINES_RAW linhas"

# ----------------------------------------------------------------------------
# 3. Remove o admin (linhas com admin@test.com + IDs relacionados)
# ----------------------------------------------------------------------------
echo ""
echo "→ filtrando linhas do admin..."

# Cria um header informativo no início do arquivo final
cat > "$DUMP_FILE" <<HEADER
-- =============================================================================
-- FINDTAX Marketplace — Seed SQL (data-only)
--
-- Gerado em: $(date -u +'%Y-%m-%d %H:%M:%S UTC')
-- Conteúdo: 29 sellers + 39 produtos + cadeia logística completa para BR
--
-- USO NO RAILWAY (ou qualquer Postgres limpo):
--   1. Backend roda migrations (schema vazio criado)
--   2. psql \$DATABASE_URL < findtax-seed.sql
--   3. Backend reinicia → init-algolia → POST /admin/algolia (sync)
--
-- NÃO INCLUI:
--   - Usuário admin (rode: medusa user -e admin@... -p ...)
--   - Pedidos / carrinhos / clientes
--   - Tabelas de runtime (workflows, events, migrations)
-- =============================================================================

HEADER

# Filtragem com sed: remove linhas que mencionem admin@test.com OU os IDs do admin
FILTER_PATTERNS="admin@test\\.com"
[ -n "$ADMIN_AUTH_ID" ] && FILTER_PATTERNS="$FILTER_PATTERNS|$ADMIN_AUTH_ID"
[ -n "$ADMIN_USER_ID" ] && FILTER_PATTERNS="$FILTER_PATTERNS|$ADMIN_USER_ID"

grep -Ev "$FILTER_PATTERNS" "$TMP_FILE" >> "$DUMP_FILE"

# ----------------------------------------------------------------------------
# 3b. Adiciona ON CONFLICT DO NOTHING em cada INSERT
#     → torna o restore IDEMPOTENTE: pode rodar várias vezes, ou continuar
#       de onde parou, sem dar duplicate key violation.
# ----------------------------------------------------------------------------
echo "→ adicionando ON CONFLICT DO NOTHING em cada INSERT (restore idempotente)..."

# Cria backup e substitui inline: linhas que começam com INSERT e terminam com );
# ganham " ON CONFLICT DO NOTHING;" antes do ponto-e-vírgula final.
sed -i.bak -E '/^INSERT INTO /s/\);$/) ON CONFLICT DO NOTHING;/' "$DUMP_FILE"
rm -f "${DUMP_FILE}.bak"

LINES_FINAL=$(wc -l < "$DUMP_FILE" | tr -d ' ')
echo "   linhas removidas (admin): $((LINES_RAW + 13 - LINES_FINAL))"
echo "   dump final: $LINES_FINAL linhas"

# Conta INSERTs por tabela (top 10)
INSERTS=$(grep -c '^INSERT INTO' "$DUMP_FILE" || echo "0")

# Cleanup
rm -f "$TMP_FILE"

# ----------------------------------------------------------------------------
# 4. Resumo
# ----------------------------------------------------------------------------
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  ✅ Dump gerado com sucesso"
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  arquivo:  $DUMP_FILE"
echo "  tamanho:  $(du -h "$DUMP_FILE" | cut -f1)"
echo "  INSERTs:  $INSERTS"
echo ""
echo "  Top 10 tabelas por quantidade de INSERTs:"
grep '^INSERT INTO' "$DUMP_FILE" \
  | sed -E 's/^INSERT INTO ([^ ]+).*/\1/' \
  | sort | uniq -c | sort -rn | head -10 \
  | awk '{printf "    %4d  %s\n", $1, $2}'
echo ""
echo "  Para aplicar em outro Postgres:"
echo "    make findtax-restore TARGET_URL=\"postgres://user:pass@host:port/db\""
echo "═══════════════════════════════════════════════════════════════════════════"
