/**
 * Importa as categorias de produto do FINDTAX a partir de 2 CSVs:
 *
 *   - app_categories_202605022139.csv      → 6 categorias PRINCIPAIS (nível 1)
 *   - app_sub_categories_202605022139.csv  → 9 SUBCATEGORIAS (nível 2, com pai)
 *
 * Em seguida vincula cada produto à SUA categoria principal real, resolvida pelo
 * `app_category_uuid` do CSV de apps (não mais um vínculo fixo).
 *
 * Cada categoria é criada via createProductCategoriesWorkflow — que cuida
 * automaticamente do `mpath` (caminho materializado da árvore).
 *
 * O vínculo produto↔categoria é feito por SQL direto na pivot
 * `product_category_product` (product_id, product_category_id) — mesma
 * estratégia de pg.raw já usada em setup-sellers/setup-products.
 *
 * Idempotente:
 *   - categoria: skip se o handle já existe
 *   - vínculo:  limpa vínculos antigos das categorias FINDTAX e re-insere
 *               (ON CONFLICT DO NOTHING na pivot)
 */

import type { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createProductCategoriesWorkflow } from '@medusajs/medusa/core-flows'

import { CSV_PATHS, readCsv, slugHandle } from './parse-csv'

export type CategoryImportSummary = {
  mainCreated: number
  mainSkipped: number
  subCreated: number
  subSkipped: number
  totalProducts: number
  linksCreated: number
}

export async function setupCategories(
  container: MedusaContainer
): Promise<CategoryImportSummary> {
  const logger = container.resolve('logger') as any
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any

  logger.info('[FINDTAX] setup-categories: iniciando…')

  const mainRows = readCsv(CSV_PATHS.categories)
  const subRows = readCsv(CSV_PATHS.subCategories)
  logger.info(
    `[FINDTAX] setup-categories: ${mainRows.length} principais + ${subRows.length} subcategorias no CSV`
  )

  // csv_uuid → category_id  (preenchido ao criar/encontrar cada principal)
  const mainByCsvUuid = new Map<string, string>()
  // todos os category ids FINDTAX (mains + subs) — usado para limpar vínculos antigos
  const allCategoryIds: string[] = []

  let mainCreated = 0
  let mainSkipped = 0
  let subCreated = 0
  let subSkipped = 0

  /**
   * Cria a categoria se o handle ainda não existir; senão devolve o id existente.
   * Retorna { id, created }.
   */
  async function ensureCategory(input: {
    name: string
    description: string
    handle: string
    rank: number
    parentCategoryId: string | null
  }): Promise<{ id: string; created: boolean }> {
    const existingRes = await pg.raw(
      'SELECT id FROM product_category WHERE handle = ? AND deleted_at IS NULL LIMIT 1',
      [input.handle]
    )
    const existing = existingRes?.rows || []
    if (existing.length) {
      return { id: existing[0].id, created: false }
    }

    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: input.name,
            description: input.description,
            handle: input.handle,
            is_active: true,
            is_internal: false,
            rank: input.rank,
            parent_category_id: input.parentCategoryId ?? undefined,
          },
        ],
      },
    })

    return { id: (result as any[])[0].id, created: true }
  }

  // ---------------------------------------------------------------------------
  // 1. CATEGORIAS PRINCIPAIS (nível 1, sem pai)
  // ---------------------------------------------------------------------------
  for (let i = 0; i < mainRows.length; i++) {
    const row = mainRows[i]
    const csvUuid = row['app_categories_uuid']
    const name = row['name']
    const description = row['description'] || ''
    const handle = slugHandle(name)

    if (!handle) {
      logger.warn(`[FINDTAX] categoria ignorada (handle vazio): name="${name}"`)
      continue
    }

    const { id, created } = await ensureCategory({
      name,
      description,
      handle,
      rank: i,
      parentCategoryId: null,
    })

    mainByCsvUuid.set(csvUuid, id)
    allCategoryIds.push(id)

    if (created) {
      mainCreated++
      logger.info(`[FINDTAX] + categoria principal "${name}" (id=${id})`)
    } else {
      mainSkipped++
      logger.info(`[FINDTAX] ✔ categoria principal "${name}" já existe (id=${id})`)
    }
  }

  // ---------------------------------------------------------------------------
  // 2. SUBCATEGORIAS (nível 2 — parent_category_id resolvido pelo CSV)
  //    rank reinicia em 0 dentro de cada categoria-pai.
  // ---------------------------------------------------------------------------
  const rankByParent = new Map<string, number>()

  for (const row of subRows) {
    const name = row['name']
    const description = row['description'] || ''
    const parentCsvUuid = row['app_category_uuid']
    const handle = slugHandle(name)

    if (!handle) {
      logger.warn(`[FINDTAX] subcategoria ignorada (handle vazio): name="${name}"`)
      continue
    }

    const parentCategoryId = mainByCsvUuid.get(parentCsvUuid)
    if (!parentCategoryId) {
      logger.warn(
        `[FINDTAX] subcategoria "${name}" sem categoria-pai (csv=${parentCsvUuid}). pulando.`
      )
      continue
    }

    const rank = rankByParent.get(parentCategoryId) ?? 0
    rankByParent.set(parentCategoryId, rank + 1)

    const { id, created } = await ensureCategory({
      name,
      description,
      handle,
      rank,
      parentCategoryId,
    })
    allCategoryIds.push(id)

    if (created) {
      subCreated++
      logger.info(`[FINDTAX] + subcategoria "${name}" (id=${id})`)
    } else {
      subSkipped++
      logger.info(`[FINDTAX] ✔ subcategoria "${name}" já existe (id=${id})`)
    }
  }

  // ---------------------------------------------------------------------------
  // 3. VÍNCULO PRODUTOS → categoria principal REAL (via app_category_uuid)
  //    Cada produto recebe a categoria correspondente ao seu app_category_uuid.
  // ---------------------------------------------------------------------------
  const totalRes = await pg.raw(
    'SELECT COUNT(*)::int AS n FROM product WHERE deleted_at IS NULL'
  )
  const totalProducts = totalRes?.rows?.[0]?.n ?? 0

  // 3a. Limpa vínculos antigos das categorias FINDTAX (corrige estado anterior
  //     em que todos os produtos iam para Tecnologias + Soluções Fiscais).
  if (allCategoryIds.length) {
    await pg.raw(
      'DELETE FROM product_category_product WHERE product_category_id = ANY(?)',
      [allCategoryIds]
    )
  }

  // 3b. Re-insere o vínculo correto por produto (handle ↔ categoria principal).
  const appRows = readCsv(CSV_PATHS.apps)
  let linksCreated = 0
  let orphanCategory = 0

  for (const row of appRows) {
    const name = row['name']
    const csvCategoryUuid = row['app_category_uuid']
    const handle = slugHandle(name)

    if (!handle || !csvCategoryUuid) {
      orphanCategory++
      continue
    }

    const categoryId = mainByCsvUuid.get(csvCategoryUuid)
    if (!categoryId) {
      orphanCategory++
      logger.warn(
        `[FINDTAX] produto "${name}": categoria csv=${csvCategoryUuid} não encontrada. pulando vínculo.`
      )
      continue
    }

    const res = await pg.raw(
      `INSERT INTO product_category_product (product_id, product_category_id)
       SELECT p.id, ?
       FROM product p
       WHERE p.handle = ? AND p.deleted_at IS NULL
       ON CONFLICT DO NOTHING
       RETURNING product_id`,
      [categoryId, handle]
    )
    linksCreated += (res?.rows || []).length
  }

  logger.info(
    `[FINDTAX] vínculo de categorias: ${linksCreated} produtos vinculados à sua categoria real ` +
      `(${orphanCategory} sem categoria no CSV).`
  )

  logger.info(
    `[FINDTAX] setup-categories concluído: ` +
      `principais ${mainCreated} criadas / ${mainSkipped} já existiam, ` +
      `subcategorias ${subCreated} criadas / ${subSkipped} já existiam.`
  )

  return {
    mainCreated,
    mainSkipped,
    subCreated,
    subSkipped,
    totalProducts,
    linksCreated,
  }
}
