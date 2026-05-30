/**
 * Orquestrador principal do setup FINDTAX.
 *
 * Roda toda a sequência idempotente:
 *   1. setup-store      (rename FINDTAX + currency BRL + region Brazil)
 *   2. setup-sellers    (29 sellers do CSV + logística por seller)
 *   3. setup-products   (39 produtos vinculados + inventory)
 *   4. setup-categories (árvore 6+9 categorias + vínculo dos produtos)
 *   5. setup-countries  (geo_zones BR + inventory_levels)
 *
 * Algolia re-sync é disparado manualmente após o script (via `make algolia-sync`).
 *
 * Como rodar:
 *   docker compose exec backend pnpm exec medusa exec ./src/scripts/seed-findtax.ts
 *   # ou via Makefile:
 *   make findtax-setup
 */

import type { ExecArgs } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

import { setupStore } from './findtax/setup-store'
import { setupSellers } from './findtax/setup-sellers'
import { setupProducts } from './findtax/setup-products'
import { setupCategories } from './findtax/setup-categories'
import { setupCountries } from './findtax/setup-countries'

export default async function seedFindtax({ container }: ExecArgs) {
  const logger = container.resolve('logger') as any
  const startedAt = Date.now()

  logger.info('')
  logger.info('═'.repeat(72))
  logger.info('  FINDTAX Marketplace — setup completo')
  logger.info('═'.repeat(72))

  // ---------- 1. Store + Region ----------
  const { storeId, regionId } = await setupStore(container)

  // Pega sales channel default (criado pelo seed.ts inicial)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const [salesChannel] = await salesChannelService.listSalesChannels({
    name: 'Default Sales Channel',
  })
  if (!salesChannel) {
    throw new Error(
      "Default Sales Channel não encontrado. Rode `make seed` antes."
    )
  }

  // ---------- 2. Sellers ----------
  const { byCsvUuid } = await setupSellers(container, {
    salesChannelId: salesChannel.id,
    brazilRegionId: regionId,
  })

  // ---------- 3. Produtos ----------
  const summary = await setupProducts(container, {
    salesChannelId: salesChannel.id,
    sellersByCsvUuid: byCsvUuid,
  })

  // ---------- 4. Categorias (árvore 6+9 + vínculo dos produtos) ----------
  // Cria a árvore de categorias e vincula todos os produtos a
  // "Tecnologias" (principal) + "Soluções Fiscais" (subcategoria).
  const categoriesReport = await setupCategories(container)

  // ---------- 5. Países (geo_zones BR + inventory_levels) ----------
  // Garante que a cadeia supported_countries no Algolia está completa.
  const countriesReport = await setupCountries(container)

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1)

  logger.info('')
  logger.info('═'.repeat(72))
  logger.info('  ✅ Setup FINDTAX concluído')
  logger.info('═'.repeat(72))
  logger.info(`  store:        FINDTAX (id=${storeId})`)
  logger.info(`  region:       Brazil (id=${regionId})`)
  logger.info(`  sellers:      ${byCsvUuid.size} importados do CSV`)
  logger.info(`  produtos:     ${summary.created} criados, ${summary.skipped} pulados, ${summary.orphans} órfãos`)
  logger.info(`  categorias:   ${categoriesReport.mainCreated} principais + ${categoriesReport.subCreated} sub criadas (${categoriesReport.mainSkipped + categoriesReport.subSkipped} já existiam)`)
  logger.info(`  vínculos cat: ${categoriesReport.totalProducts} produtos → Tecnologias + Soluções Fiscais (+${categoriesReport.linksCreated})`)
  logger.info(`  geo_zones BR: +${countriesReport.addedGeoZones} adicionadas`)
  logger.info(`  inv_levels:   +${countriesReport.createdLevels} criados (${countriesReport.skippedLevels} já existiam)`)
  logger.info(`  duração:      ${elapsed}s`)
  logger.info('')
  logger.info('  ▶ próximo passo: re-sincronizar Algolia')
  logger.info('     make algolia-sync')
  logger.info('')
  logger.info('  ▶ validar:')
  logger.info('     abra http://localhost:3000 (storefront)')
  logger.info('═'.repeat(72))
  logger.info('')
}
