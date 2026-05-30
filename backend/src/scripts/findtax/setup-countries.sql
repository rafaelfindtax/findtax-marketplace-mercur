-- =============================================================================
-- FINDTAX — Setup de Countries (default: BR)
--
-- Equivalente SQL ao `make findtax-countries`. Roda direto em qualquer
-- Postgres (Railway, RDS, Neon, local) sem precisar do backend rodando.
--
-- Faz, em 3 etapas idempotentes (pode rodar várias vezes sem efeito):
--   1. Cria UMA service_zone para cada fulfillment_set que ainda não tem
--   2. Cria UMA geo_zone country='br' para cada service_zone que ainda não tem
--   3. Cria inventory_level para cada (variant, stock_location-do-seller)
--      que ainda não tem
--
-- Esta é a CADEIA que o plugin Mercur Algolia usa para preencher
-- `supported_countries` nos produtos indexados:
--   product → variant → inventory_item → inventory_level → stock_location
--          → fulfillment_set → service_zone → geo_zone → country_code('br')
--
-- USO
--
--   Local (Docker):
--     docker compose exec -T postgres psql -U postgres -d mercurjs \
--       < backend/src/scripts/findtax/setup-countries.sql
--
--   Railway (ou outro Postgres remoto):
--     make findtax-countries-sql TARGET_URL="postgresql://..."
--
--   Manual via psql:
--     psql "$DATABASE_URL" -f setup-countries.sql
--
-- DEPOIS de rodar este SQL: dispare o re-sync no Algolia para o plugin
-- recalcular supported_countries:
--     curl -X POST <BACKEND_URL>/admin/algolia -H "Authorization: Bearer <TOKEN>"
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. SERVICE ZONES
-- Cria UMA service_zone para cada fulfillment_set que ainda não tem.
-- Nome único por seller para evitar conflitos.
-- ---------------------------------------------------------------------------
INSERT INTO service_zone (id, fulfillment_set_id, name, created_at, updated_at)
SELECT
  'serzo_' || upper(substring(md5(random()::text || clock_timestamp()::text || fs.id) FROM 1 FOR 26)),
  fs.id,
  'BR - ' || COALESCE(NULLIF(replace(fs.name, ' fulfillment set', ''), ''), 'Zone'),
  NOW(),
  NOW()
FROM fulfillment_set fs
WHERE fs.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM service_zone sz
    WHERE sz.fulfillment_set_id = fs.id
      AND sz.deleted_at IS NULL
  );

-- ---------------------------------------------------------------------------
-- 2. GEO ZONES
-- Cria geo_zone country='br' para cada service_zone que ainda não tem.
-- ---------------------------------------------------------------------------
INSERT INTO geo_zone (id, type, country_code, service_zone_id, created_at, updated_at)
SELECT
  'geozn_' || upper(substring(md5(random()::text || clock_timestamp()::text || sz.id) FROM 1 FOR 26)),
  'country',
  'br',
  sz.id,
  NOW(),
  NOW()
FROM service_zone sz
WHERE sz.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM geo_zone gz
    WHERE gz.service_zone_id = sz.id
      AND gz.country_code = 'br'
      AND gz.deleted_at IS NULL
  );

-- ---------------------------------------------------------------------------
-- 3. INVENTORY LEVELS
-- Para cada (variant × stock_location-do-seller-do-produto) sem level: cria.
--
-- Caminho de joins:
--   product_variant ─ product_variant_inventory_item ─ inventory_item_id
--   product         ─ seller_seller_product_product   ─ seller_id
--   seller          ─ seller_seller_stock_location_stock_location ─ stock_location_id
-- ---------------------------------------------------------------------------
INSERT INTO inventory_level (
  id,
  inventory_item_id,
  location_id,
  stocked_quantity,
  raw_stocked_quantity,
  reserved_quantity,
  raw_reserved_quantity,
  incoming_quantity,
  raw_incoming_quantity,
  created_at,
  updated_at
)
SELECT
  'ilevl_' || upper(substring(md5(random()::text || clock_timestamp()::text || pvii.inventory_item_id || ssl.stock_location_id) FROM 1 FOR 26)),
  pvii.inventory_item_id,
  ssl.stock_location_id,
  100,
  '{"value": "100"}'::jsonb,
  0,
  '{"value": "0"}'::jsonb,
  0,
  '{"value": "0"}'::jsonb,
  NOW(),
  NOW()
FROM product_variant pv
JOIN product p
  ON p.id = pv.product_id AND p.deleted_at IS NULL
JOIN product_variant_inventory_item pvii
  ON pvii.variant_id = pv.id
JOIN seller_seller_product_product spp
  ON spp.product_id = p.id AND spp.deleted_at IS NULL
JOIN seller_seller_stock_location_stock_location ssl
  ON ssl.seller_id = spp.seller_id AND ssl.deleted_at IS NULL
WHERE pv.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM inventory_level il
    WHERE il.inventory_item_id = pvii.inventory_item_id
      AND il.location_id = ssl.stock_location_id
      AND il.deleted_at IS NULL
  );

COMMIT;

-- ---------------------------------------------------------------------------
-- Validação — estado final da cadeia
-- ---------------------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM fulfillment_set  WHERE deleted_at IS NULL)::int   AS fulfillment_sets,
  (SELECT COUNT(*) FROM service_zone     WHERE deleted_at IS NULL)::int   AS service_zones,
  (SELECT COUNT(*) FROM geo_zone         WHERE country_code='br' AND deleted_at IS NULL)::int AS geo_zones_br,
  (SELECT COUNT(*) FROM inventory_level  WHERE deleted_at IS NULL)::int   AS inventory_levels,
  (SELECT COUNT(*) FROM product          WHERE deleted_at IS NULL)::int   AS produtos,
  (SELECT COUNT(*) FROM seller           WHERE deleted_at IS NULL)::int   AS sellers;
