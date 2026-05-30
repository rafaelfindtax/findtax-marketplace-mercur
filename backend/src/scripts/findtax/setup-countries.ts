/**
 * Setup dos países do marketplace FINDTAX (default: BR).
 *
 * Conserta a cadeia que o plugin Mercur Algolia usa para preencher
 * `supported_countries` no índice:
 *
 *     product → variant → inventory_item → inventory_level → stock_location
 *            → fulfillment_set → service_zone → geo_zone → country_code
 *
 * O script:
 *   1. Garante que TODA service_zone tem um geo_zone country='br'
 *   2. Garante que TODO variant tem inventory_level no stock_location do seu seller
 *
 * Idempotente: pode rodar várias vezes sem efeitos colaterais.
 *
 * Uso:
 *   docker compose exec backend pnpm exec medusa exec ./src/scripts/findtax-countries.ts
 *   # ou: make findtax-countries
 */

import type { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

export const DEFAULT_COUNTRY = 'br'

export async function setupCountries(container: MedusaContainer): Promise<{
  addedGeoZones: number
  createdLevels: number
  skippedLevels: number
  productsWithoutSeller: number
  productsWithoutStockLocation: number
}> {
  const logger = container.resolve('logger') as any
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)
  const inventoryService = container.resolve(Modules.INVENTORY)

  logger.info('═'.repeat(72))
  logger.info(`[FINDTAX] setup-countries — default country: ${DEFAULT_COUNTRY.toUpperCase()}`)
  logger.info('═'.repeat(72))

  // =========================================================================
  // 1a. SERVICE ZONES — para cada fulfillment_set sem service_zone, cria uma
  // Estratégia em 3 níveis de fallback:
  //   A) fulfillmentService.createServiceZones (input ARRAY)
  //   B) fulfillmentService.createServiceZones (input OBJETO único)
  //   C) SQL puro (último recurso, gera IDs no formato ULID estilo Medusa)
  // =========================================================================
  const fulfillmentSets = await fulfillmentService.listFulfillmentSets({} as any)
  let createdServiceZones = 0
  let failedServiceZones = 0

  // Helper para gerar ID estilo Medusa: prefix + 26 chars base32 lower
  const newId = (prefix: string) => {
    const t = Date.now().toString(36).toUpperCase().padStart(10, '0')
    const r = Array.from({ length: 16 }, () =>
      'ABCDEFGHJKMNPQRSTVWXYZ0123456789'[Math.floor(Math.random() * 32)]
    ).join('')
    return `${prefix}_${(t + r).slice(0, 26)}`
  }

  for (const fset of fulfillmentSets as any[]) {
    const existing = await pg.raw(
      `SELECT id FROM service_zone
       WHERE fulfillment_set_id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [fset.id]
    )
    if (existing?.rows?.length) continue

    // Nome único derivado do fulfillment_set: evita colisão se houver constraint.
    const zoneName = `BR - ${(fset.name || fset.id).replace(/ fulfillment set$/i, '').slice(0, 40)}`
    const payload = {
      fulfillment_set_id: fset.id,
      name: zoneName,
      geo_zones: [{ type: 'country' as any, country_code: DEFAULT_COUNTRY }],
    }

    // -------- A) input ARRAY --------
    let ok = false
    let lastErr: any
    try {
      await fulfillmentService.createServiceZones([payload] as any)
      ok = true
      logger.info(`  + service_zone "${zoneName}" criada (array)`)
    } catch (err: any) {
      lastErr = err
    }

    // -------- B) input OBJETO --------
    if (!ok) {
      try {
        await fulfillmentService.createServiceZones(payload as any)
        ok = true
        logger.info(`  + service_zone "${zoneName}" criada (objeto)`)
      } catch (err: any) {
        lastErr = err
      }
    }

    // -------- C) SQL puro --------
    if (!ok) {
      try {
        const szId = newId('serzo')
        const gzId = newId('geozn')
        await pg.raw(
          `INSERT INTO service_zone (id, fulfillment_set_id, name, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [szId, fset.id, zoneName]
        )
        await pg.raw(
          `INSERT INTO geo_zone (id, type, country_code, service_zone_id, created_at, updated_at)
           VALUES (?, 'country', ?, ?, NOW(), NOW())`,
          [gzId, DEFAULT_COUNTRY, szId]
        )
        ok = true
        logger.info(`  + service_zone "${zoneName}" criada (SQL fallback)`)
      } catch (err: any) {
        lastErr = err
      }
    }

    if (ok) {
      createdServiceZones++
    } else {
      failedServiceZones++
      logger.error(
        `  ✗ FALHA criando service_zone em fset=${fset.id}: ${lastErr?.message?.slice(0, 300)}`
      )
    }
  }

  logger.info(
    `✔ fulfillment_sets: ${fulfillmentSets.length} total | +${createdServiceZones} service_zones criadas | ${failedServiceZones} falharam`
  )

  // =========================================================================
  // 1b. GEO ZONES — todas as service_zones devem cobrir 'br'
  // =========================================================================
  const serviceZones = await fulfillmentService.listServiceZones({} as any)
  let addedGeoZones = 0
  let alreadyHadBr = 0

  for (const sz of serviceZones as any[]) {
    const existing = await pg.raw(
      `SELECT id FROM geo_zone
       WHERE service_zone_id = ? AND country_code = ? AND deleted_at IS NULL
       LIMIT 1`,
      [sz.id, DEFAULT_COUNTRY]
    )
    if (existing?.rows?.length) {
      alreadyHadBr++
      continue
    }

    try {
      await fulfillmentService.createGeoZones({
        type: 'country' as any,
        country_code: DEFAULT_COUNTRY,
        service_zone_id: sz.id,
      } as any)
      addedGeoZones++
      logger.info(`  + geo_zone '${DEFAULT_COUNTRY}' adicionado em service_zone ${sz.id}`)
    } catch (err: any) {
      logger.warn(
        `  ⚠ erro adicionando geo_zone em sz=${sz.id}: ${err.message?.slice(0, 200)}`
      )
    }
  }

  logger.info(
    `✔ service_zones: ${serviceZones.length} total | +${addedGeoZones} br adicionado | ${alreadyHadBr} já tinha`
  )

  // =========================================================================
  // 2. INVENTORY LEVELS — todo variant precisa ter nível no stock do seller
  // =========================================================================
  // Usamos query.graph com o mesmo caminho que o plugin Algolia espera:
  //   product.variants.inventory_items.inventory.id
  //   product.seller.stock_locations.id
  // =========================================================================
  let products: any[] = []
  try {
    const res = await query.graph({
      entity: 'product',
      fields: [
        'id',
        'title',
        'seller.id',
        'seller.stock_locations.id',
        'variants.id',
        'variants.inventory_items.inventory.id',
      ],
      filters: {} as any,
    })
    products = (res as any).data || []
  } catch (err: any) {
    logger.error(`falha ao listar produtos: ${err.message?.slice(0, 200)}`)
    products = []
  }

  let createdLevels = 0
  let skippedLevels = 0
  let productsWithoutSeller = 0
  let productsWithoutStockLocation = 0
  let variantsWithoutInventoryItem = 0

  for (const p of products) {
    if (!p.seller) {
      productsWithoutSeller++
      continue
    }

    const stockLocationId = p.seller.stock_locations?.[0]?.id
    if (!stockLocationId) {
      productsWithoutStockLocation++
      logger.warn(`  ⚠ produto "${p.title}" — seller sem stock_location`)
      continue
    }

    for (const v of p.variants || []) {
      // Cada variant pode ter 0..N inventory_items linkados.
      // O plugin Algolia pega via `variants.inventory_items.inventory.id`
      const inventoryItems = (v.inventory_items || [])
        .map((ii: any) => ii.inventory?.id)
        .filter(Boolean)

      if (inventoryItems.length === 0) {
        variantsWithoutInventoryItem++
        continue
      }

      for (const inventoryItemId of inventoryItems) {
        // Já existe inventory_level naquele location?
        const lvl = await pg.raw(
          `SELECT id FROM inventory_level
           WHERE inventory_item_id = ? AND location_id = ? AND deleted_at IS NULL
           LIMIT 1`,
          [inventoryItemId, stockLocationId]
        )
        if (lvl?.rows?.length) {
          skippedLevels++
          continue
        }

        try {
          await inventoryService.createInventoryLevels([
            {
              inventory_item_id: inventoryItemId,
              location_id: stockLocationId,
              stocked_quantity: 100,
            },
          ] as any)
          createdLevels++
        } catch (err: any) {
          logger.warn(
            `  ⚠ erro criando inventory_level inv=${inventoryItemId} loc=${stockLocationId}: ${err.message?.slice(0, 200)}`
          )
        }
      }
    }
  }

  logger.info(
    `✔ inventory_levels: +${createdLevels} criados | ${skippedLevels} já existiam`
  )

  if (productsWithoutSeller > 0)
    logger.warn(`⚠ ${productsWithoutSeller} produtos sem seller (não cobrem ${DEFAULT_COUNTRY})`)
  if (productsWithoutStockLocation > 0)
    logger.warn(`⚠ ${productsWithoutStockLocation} produtos com seller mas sem stock_location`)
  if (variantsWithoutInventoryItem > 0)
    logger.warn(
      `⚠ ${variantsWithoutInventoryItem} variants sem inventory_item — o plugin não vai conseguir mapear para supported_countries`
    )

  // =========================================================================
  // 3. VALIDAÇÃO FINAL — estado real do banco depois das mudanças
  // =========================================================================
  const stateRes = await pg.raw(`
    SELECT
      (SELECT COUNT(*) FROM fulfillment_set WHERE deleted_at IS NULL)::int AS fsets,
      (SELECT COUNT(*) FROM service_zone WHERE deleted_at IS NULL)::int AS szs,
      (SELECT COUNT(*) FROM geo_zone WHERE country_code = '${DEFAULT_COUNTRY}' AND deleted_at IS NULL)::int AS gz_br,
      (SELECT COUNT(*) FROM inventory_level WHERE deleted_at IS NULL)::int AS inv_levels,
      (SELECT COUNT(*) FROM product WHERE deleted_at IS NULL)::int AS products
  `)
  const state = stateRes?.rows?.[0] || {}

  logger.info('')
  logger.info('━'.repeat(72))
  logger.info('  ESTADO FINAL DO BANCO')
  logger.info('━'.repeat(72))
  logger.info(`  fulfillment_sets:       ${state.fsets}`)
  logger.info(`  service_zones:          ${state.szs}  ${state.szs === state.fsets ? '✓' : '✗ (deveria igualar fulfillment_sets)'}`)
  logger.info(`  geo_zones (${DEFAULT_COUNTRY}):         ${state.gz_br}  ${state.gz_br === state.szs ? '✓' : '✗ (deveria igualar service_zones)'}`)
  logger.info(`  inventory_levels:       ${state.inv_levels}`)
  logger.info(`  produtos:               ${state.products}`)
  logger.info('━'.repeat(72))

  if (state.szs < state.fsets) {
    logger.error(
      `✗ Faltam ${state.fsets - state.szs} service_zones. Verifique os erros acima e tente novamente.`
    )
  } else {
    logger.info(`✔ Cadeia completa: todos os fulfillment_sets têm service_zone com geo_zone='${DEFAULT_COUNTRY}'.`)
  }

  logger.info('')
  logger.info(`▶ próximo passo: re-sincronizar Algolia para recalcular supported_countries:`)
  logger.info(`     make algolia-sync`)
  logger.info('═'.repeat(72))

  return {
    addedGeoZones,
    createdLevels,
    skippedLevels,
    productsWithoutSeller,
    productsWithoutStockLocation,
  }
}
