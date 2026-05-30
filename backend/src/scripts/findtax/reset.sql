-- =============================================================================
-- FINDTAX Marketplace — RESET (hard delete via SQL)
--
-- Apaga DEFINITIVAMENTE produtos, sellers, members e toda a logística por seller.
-- Usa TRUNCATE ... CASCADE: limpa também as link tables que referenciam.
--
-- PRESERVA: regions, store, sales_channels, currencies, categories, collections,
--           tax_regions, payment/fulfillment providers, e o usuário ADMIN.
--
-- Rodado por: make findtax-reset
--   docker compose exec -T postgres psql -U postgres -d mercurjs < .../reset.sql
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Produtos e tudo que depende deles
--    CASCADE limpa: product_variant, product_option(_value), product_image,
--    product_category_product, product_sales_channel, product_tag, etc.
-- ---------------------------------------------------------------------------
TRUNCATE TABLE product CASCADE;

-- ---------------------------------------------------------------------------
-- 2. Inventory (itens + níveis de estoque)
-- ---------------------------------------------------------------------------
TRUNCATE TABLE inventory_item CASCADE;

-- ---------------------------------------------------------------------------
-- 3. Sellers, members, onboarding e TODAS as link tables seller_seller_*
--    CASCADE cuida das 17+ tabelas de link do Mercur.
-- ---------------------------------------------------------------------------
TRUNCATE TABLE seller CASCADE;
TRUNCATE TABLE member CASCADE;

-- ---------------------------------------------------------------------------
-- 4. Logística criada por seller (stock locations, fulfillment, shipping)
-- ---------------------------------------------------------------------------
TRUNCATE TABLE stock_location CASCADE;
TRUNCATE TABLE fulfillment_set CASCADE;
TRUNCATE TABLE service_zone CASCADE;
TRUNCATE TABLE shipping_option CASCADE;

-- ---------------------------------------------------------------------------
-- 5. Auth identities dos sellers, preservando o ADMIN.
--    Sellers usam @findtax.com; também limpamos @test.com de execuções antigas.
--    Só auth emailpass usa o e-mail como entity_id, então o LIKE é seguro.
--    ⚠️  Se o seu admin NÃO for admin@test.com, ajuste a linha abaixo.
-- ---------------------------------------------------------------------------
DELETE FROM provider_identity
WHERE (entity_id LIKE '%@findtax.com' OR entity_id LIKE '%@test.com')
  AND entity_id <> 'admin@test.com';

-- Remove auth_identities que ficaram sem nenhum provider_identity
DELETE FROM auth_identity a
WHERE NOT EXISTS (
  SELECT 1 FROM provider_identity p WHERE p.auth_identity_id = a.id
);

COMMIT;

-- ---------------------------------------------------------------------------
-- Relatório pós-reset
-- ---------------------------------------------------------------------------
SELECT 'produtos restantes'  AS item, COUNT(*)::text AS valor FROM product
UNION ALL
SELECT 'sellers restantes',   COUNT(*)::text FROM seller
UNION ALL
SELECT 'members restantes',   COUNT(*)::text FROM member
UNION ALL
SELECT 'stock_locations',     COUNT(*)::text FROM stock_location
UNION ALL
SELECT 'auth_identities',     COUNT(*)::text FROM auth_identity;
