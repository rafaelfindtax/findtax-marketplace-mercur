#!/usr/bin/env bash
# =============================================================================
# FINDTAX — Aplica findtax-seed.sql em um Postgres remoto (Railway, RDS, etc.)
#
# Usa um container postgres efêmero (sem precisar de psql instalado no Mac).
#
# Uso:
#   make findtax-restore TARGET_URL="postgres://user:pass@host:port/db"
#   # ou direto:
#   bash backend/src/scripts/findtax/restore.sh "postgres://..."
# =============================================================================

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$PROJECT_ROOT"

TARGET_URL="${1:-${TARGET_URL:-}}"
DUMP_FILE="backend/src/sample/findtax-seed.sql"

if [ -z "$TARGET_URL" ]; then
  echo "❌ TARGET_URL não definido."
  echo ""
  echo "Uso:"
  echo "  make findtax-restore TARGET_URL=\"postgres://user:pass@host:port/db\""
  echo "  bash $0 \"postgres://user:pass@host:port/db\""
  exit 1
fi

if [ ! -f "$DUMP_FILE" ]; then
  echo "❌ Arquivo $DUMP_FILE não encontrado. Rode primeiro: make findtax-dump"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  FINDTAX — restore de $(du -h "$DUMP_FILE" | cut -f1) em destino remoto"
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  arquivo:  $DUMP_FILE"
echo "  destino:  $(echo "$TARGET_URL" | sed -E 's#://[^:]+:[^@]+@#://***:***@#')"
echo ""

# Roda psql via container efêmero (não precisa instalar pg-client no Mac)
docker run --rm \
  -i \
  -v "$(pwd)/$DUMP_FILE:/seed.sql:ro" \
  postgres:16-alpine \
  psql "$TARGET_URL" -v ON_ERROR_STOP=1 -f /seed.sql

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  ✅ Restore concluído"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "  Próximos passos no destino:"
echo "    1. Criar admin:  medusa user -e admin@... -p ..."
echo "    2. Reiniciar backend (carrega plugins + init-algolia)"
echo "    3. Disparar sync Algolia: POST /admin/algolia"
echo ""
