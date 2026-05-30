/**
 * Script complementar ao seed.ts: cria um seller (vendor) e produtos vinculados.
 *
 * O seed.ts default só popula store/regions/categories/sales-channels e produtos
 * SEM seller. O storefront filtra com `NOT seller:null`, então a busca via Algolia
 * fica vazia. Este script preenche esse gap usando as helper functions já existentes
 * em ./seed/seed-functions.ts.
 *
 * Idempotente: se o seller seller@mercurjs.com já existir, pula a criação.
 *
 * Como rodar:
 *   docker compose exec backend pnpm exec medusa exec ./src/scripts/seed-vendor.ts
 *   # ou via Makefile:
 *   make seed-vendor
 */

import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import {
  createSeller,
  createSellerStockLocation,
  createServiceZoneForFulfillmentSet,
  createSellerShippingOption,
  createSellerProducts,
  createInventoryItemStockLevels
} from './seed/seed-functions'

export default async function seedVendorData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const regionService = container.resolve(Modules.REGION)

  logger.info('▶ seed-vendor: iniciando...')

  // ---------------------------------------------------------------------------
  // 1. Pré-requisitos: sales channel default e região (Europe) precisam existir.
  //    Esses já são criados pelo `seed.ts` padrão.
  // ---------------------------------------------------------------------------
  const [salesChannel] = await salesChannelService.listSalesChannels({
    name: 'Default Sales Channel'
  })
  if (!salesChannel) {
    throw new Error(
      "Default Sales Channel não encontrado. Rode `make seed` primeiro."
    )
  }

  const regions = await regionService.listRegions({})
  const europe = regions.find((r) => r.name === 'Europe')
  if (!europe) {
    throw new Error("Região 'Europe' não encontrada. Rode `make seed` primeiro.")
  }

  // ---------------------------------------------------------------------------
  // 2. Idempotência: se já há um seller "MercurJS Store", pula a criação.
  // ---------------------------------------------------------------------------
  let sellerId: string
  let sellerName: string

  try {
    const { data: existingSellers } = await query.graph({
      entity: 'seller',
      fields: ['id', 'name'],
      filters: { name: 'MercurJS Store' } as any
    })

    if (existingSellers?.length) {
      sellerId = existingSellers[0].id
      sellerName = existingSellers[0].name as string
      logger.info(`✔ seller já existe (id=${sellerId}). pulando criação.`)
    } else {
      throw new Error('not found, will create')
    }
  } catch {
    logger.info('▶ criando seller seller@mercurjs.com / secret ...')
    const seller = await createSeller(container)
    sellerId = seller.id
    sellerName = seller.name
    logger.info(`✔ seller criado: id=${sellerId}, name=${sellerName}`)
  }

  // ---------------------------------------------------------------------------
  // 3. Stock location + fulfillment set vinculados ao seller.
  //    Idempotência simples: tenta criar; se falhar por já existir, segue.
  // ---------------------------------------------------------------------------
  let stockLocationId: string | undefined
  let fulfillmentSetId: string | undefined

  try {
    logger.info('▶ criando stock location + fulfillment set...')
    const stockLocation = await createSellerStockLocation(
      container,
      sellerId,
      salesChannel.id
    )
    stockLocationId = stockLocation.id
    fulfillmentSetId = (stockLocation as any).fulfillment_sets?.[0]?.id
    logger.info(`✔ stock location: ${stockLocationId}`)
  } catch (err: any) {
    logger.warn(`⚠ stock location já existia ou falhou: ${err.message}`)
    // Buscar pelo já existente
    const { data: stocks } = await query.graph({
      entity: 'stock_location',
      fields: ['id', 'fulfillment_sets.id'],
      filters: { name: `Stock Location for seller ${sellerId}` } as any
    })
    if (stocks?.length) {
      stockLocationId = stocks[0].id
      fulfillmentSetId = (stocks[0] as any).fulfillment_sets?.[0]?.id
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Service zone (cobre os países da Europe)
  // ---------------------------------------------------------------------------
  let serviceZoneId: string | undefined
  if (fulfillmentSetId) {
    try {
      logger.info('▶ criando service zone...')
      const zone = await createServiceZoneForFulfillmentSet(
        container,
        sellerId,
        fulfillmentSetId
      )
      serviceZoneId = zone.id
      logger.info(`✔ service zone: ${serviceZoneId}`)
    } catch (err: any) {
      logger.warn(`⚠ service zone já existia ou falhou: ${err.message}`)
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Shipping option (preço em EUR + por região)
  // ---------------------------------------------------------------------------
  if (serviceZoneId) {
    try {
      logger.info('▶ criando shipping option...')
      await createSellerShippingOption(
        container,
        sellerId,
        sellerName,
        europe.id,
        serviceZoneId
      )
      logger.info('✔ shipping option criada')
    } catch (err: any) {
      logger.warn(`⚠ shipping option já existia ou falhou: ${err.message}`)
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Produtos vinculados ao seller (a partir de seed-products.ts)
  //    Idempotência: tenta criar; se algum handle já existe (re-execução),
  //    apenas loga warning e prossegue.
  // ---------------------------------------------------------------------------
  try {
    logger.info('▶ criando produtos vinculados ao seller...')
    const products = await createSellerProducts(
      container,
      sellerId,
      salesChannel.id
    )
    logger.info(`✔ ${products.length} produtos criados e vinculados ao seller.`)
  } catch (err: any) {
    logger.warn(
      `⚠ alguns produtos podem já existir (handle único): ${err.message?.slice(0, 200)}`
    )
  }

  // ---------------------------------------------------------------------------
  // 7. Inventory levels (estoque inicial nos itens dos produtos)
  // ---------------------------------------------------------------------------
  if (stockLocationId) {
    try {
      logger.info('▶ criando inventory levels...')
      await createInventoryItemStockLevels(container, stockLocationId)
      logger.info('✔ inventory levels criados.')
    } catch (err: any) {
      logger.warn(`⚠ inventory levels já existiam ou falharam: ${err.message}`)
    }
  }

  logger.info('')
  logger.info('🎉 seed-vendor concluído!')
  logger.info(`    seller email:    seller@mercurjs.com`)
  logger.info(`    seller senha:    secret`)
  logger.info(`    seller name:     ${sellerName}`)
  logger.info(`    seller id:       ${sellerId}`)
  logger.info('')
  logger.info('▶ Agora rode: make algolia-sync (re-indexa produtos com seller no Algolia)')
}
