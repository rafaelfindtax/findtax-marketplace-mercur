-- =============================================================================
-- FINDTAX — Setup de Categorias de Produto
--
-- Equivalente SQL ao `make findtax-categories`. Roda direto em qualquer
-- Postgres (Railway, RDS, Neon, local) sem precisar do backend rodando.
--
-- Faz, em 3 etapas idempotentes (pode rodar várias vezes sem efeito):
--   1. Cria as 6 categorias PRINCIPAIS (nível 1)   — de app_categories.csv
--   2. Cria as 9 SUBCATEGORIAS (nível 2, com pai)  — de app_sub_categories.csv
--   3. Vincula TODOS os produtos à categoria principal "Tecnologias"
--      E à subcategoria "Soluções Fiscais".
--
-- Modelo de dados (Medusa v2 — módulo Product):
--   product_category(id, name, description, handle, mpath, is_active,
--                    is_internal, rank, parent_category_id, ...)
--   product_category_product(product_id, product_category_id)  -- pivot m2m
--
--   mpath = caminho materializado da árvore. Raiz: o próprio id.
--           Filho: <mpath_do_pai> || '.' || <id_do_filho>.
--
-- IDs determinísticos: 'pcat_' || md5('findtax-cat-' || handle). Como o handle
-- é único, rodar de novo gera o MESMO id — restore idempotente e estável.
-- O guard `WHERE NOT EXISTS (... handle ...)` também evita conflito caso as
-- categorias já tenham sido criadas pelo script TypeScript (ids aleatórios).
--
-- USO
--
--   Local (Docker):
--     docker compose exec -T postgres psql -U postgres -d mercurjs \
--       < backend/src/scripts/findtax/setup-categories.sql
--
--   Railway (ou outro Postgres remoto):
--     make findtax-categories-sql TARGET_URL="postgresql://..."
--
--   Manual via psql:
--     psql "$DATABASE_URL" -f setup-categories.sql
--
-- DEPOIS de rodar este SQL: dispare o re-sync no Algolia para o plugin
-- reindexar os produtos com suas categorias:
--     curl -X POST <BACKEND_URL>/admin/algolia -H "Authorization: Bearer <TOKEN>"
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. CATEGORIAS PRINCIPAIS (nível 1 — sem pai, mpath = próprio id)
-- ---------------------------------------------------------------------------
INSERT INTO product_category (
  id, name, description, handle, mpath,
  is_active, is_internal, rank, parent_category_id,
  created_at, updated_at
)
SELECT
  'pcat_' || upper(substring(md5('findtax-cat-' || v.handle) FROM 1 FOR 26)),
  v.name,
  v.description,
  v.handle,
  'pcat_' || upper(substring(md5('findtax-cat-' || v.handle) FROM 1 FOR 26)),
  true,
  false,
  v.rank,
  NULL,
  NOW(),
  NOW()
FROM (VALUES
  ('Softwares',   'Categoria de softwares para diferentes finalidades',   'softwares',   0),
  ('Serviços',    'Serviços especializados para empresas e profissionais','servicos',    1),
  ('Educação',    'Cursos, treinamentos e certificações',                 'educacao',    2),
  ('Tecnologias', 'Soluções de diferente tipos fiscais',                  'tecnologias', 3),
  ('Conteúdo',    'Blog, e outros conteudos',                             'conteudo',    4),
  ('Projetos',    'Projetos de leis de incentivo',                        'projetos',    5)
) AS v(name, description, handle, rank)
WHERE NOT EXISTS (
  SELECT 1 FROM product_category pc
  WHERE pc.handle = v.handle AND pc.deleted_at IS NULL
);

-- ---------------------------------------------------------------------------
-- 2. SUBCATEGORIAS (nível 2)
-- O pai é resolvido por handle (JOIN) — robusto mesmo se o pai tiver sido
-- criado por outra via (script TS, restore de dump etc.).
-- mpath = mpath_do_pai || '.' || id_da_subcategoria.
-- ---------------------------------------------------------------------------
INSERT INTO product_category (
  id, name, description, handle, mpath,
  is_active, is_internal, rank, parent_category_id,
  created_at, updated_at
)
SELECT
  'pcat_' || upper(substring(md5('findtax-cat-' || v.handle) FROM 1 FOR 26)),
  v.name,
  v.description,
  v.handle,
  parent.mpath || '.' || 'pcat_' || upper(substring(md5('findtax-cat-' || v.handle) FROM 1 FOR 26)),
  true,
  false,
  v.rank,
  parent.id,
  NOW(),
  NOW()
FROM (VALUES
  ('Software de Gestão',         'Soluções para gestão empresarial',               'software-de-gestao',         'softwares',   0),
  ('Software Contábil e Fiscal', 'Ferramentas para contabilidade e gestão fiscal', 'software-contabil-e-fiscal', 'softwares',   1),
  ('Consultorias',               'Serviços de consultoria empresarial e contábil', 'consultorias',               'servicos',    0),
  ('Cursos Contábeis',           'Formações especializadas em contabilidade',      'cursos-contabeis',           'educacao',    0),
  ('Leis de Incentivo',          'Leis de incentivo para distinação de impostos',  'leis-de-incentivo',          'projetos',    0),
  ('Licitações',                 'Licitações do governo',                          'licitacoes',                 'projetos',    1),
  ('RFPs',                       'RFPs abertas para empresas',                     'rfps',                       'projetos',    2),
  ('ERPs',                       'Empresas de ERPs de Gestão',                     'erps',                       'tecnologias', 0),
  ('Soluções Fiscais',           'Tecnologia Fiscal e Tributaria',                 'solucoes-fiscais',           'tecnologias', 1)
) AS v(name, description, handle, parent_handle, rank)
JOIN product_category parent
  ON parent.handle = v.parent_handle AND parent.deleted_at IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM product_category pc
  WHERE pc.handle = v.handle AND pc.deleted_at IS NULL
);

-- ---------------------------------------------------------------------------
-- 3. VÍNCULO PRODUTOS → "Tecnologias" + "Soluções Fiscais"
-- Todos os produtos (não deletados) recebem AS DUAS categorias.
-- Pivot m2m: PK composta (product_id, product_category_id) → ON CONFLICT seguro.
-- As categorias são resolvidas por handle — funciona qualquer que tenha sido
-- a origem delas (este SQL, o script TS, ou um restore de dump).
-- ---------------------------------------------------------------------------
INSERT INTO product_category_product (product_id, product_category_id)
SELECT p.id, c.id
FROM product p
CROSS JOIN product_category c
WHERE p.deleted_at IS NULL
  AND c.deleted_at IS NULL
  AND c.handle IN ('tecnologias', 'solucoes-fiscais')
ON CONFLICT DO NOTHING;

COMMIT;

-- ---------------------------------------------------------------------------
-- Validação — estado final
-- ---------------------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM product_category
     WHERE deleted_at IS NULL)::int                                  AS categorias_total,
  (SELECT COUNT(*) FROM product_category
     WHERE deleted_at IS NULL AND parent_category_id IS NULL)::int    AS principais,
  (SELECT COUNT(*) FROM product_category
     WHERE deleted_at IS NULL AND parent_category_id IS NOT NULL)::int AS subcategorias,
  (SELECT COUNT(DISTINCT pcp.product_id)
     FROM product_category_product pcp
     JOIN product_category c ON c.id = pcp.product_category_id
     WHERE c.handle = 'tecnologias')::int                            AS produtos_em_tecnologias,
  (SELECT COUNT(DISTINCT pcp.product_id)
     FROM product_category_product pcp
     JOIN product_category c ON c.id = pcp.product_category_id
     WHERE c.handle = 'solucoes-fiscais')::int                       AS produtos_em_solucoes_fiscais,
  (SELECT COUNT(*) FROM product WHERE deleted_at IS NULL)::int        AS produtos_total;

-- Árvore de categorias (conferência visual)
SELECT
  COALESCE(p.name, '— (raiz)') AS categoria_pai,
  c.name                       AS categoria,
  c.handle,
  c.rank,
  c.is_active
FROM product_category c
LEFT JOIN product_category p ON p.id = c.parent_category_id
WHERE c.deleted_at IS NULL
ORDER BY COALESCE(p.rank, c.rank), p.name NULLS FIRST, c.rank;
