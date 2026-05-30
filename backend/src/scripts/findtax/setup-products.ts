/**
 * Importa produtos do CSV `apps_*.csv` para o Mercur.
 *
 * Para cada produto:
 *   - resolve seller via app_provider_uuid → mapa do setupSellers
 *   - cria produto com status=published, 1 variant Default, preço seeded (R$2k-R$10k)
 *   - vincula ao seller via additional_data.seller_id
 *   - thumbnail: placeholder genérico
 *
 * Idempotente: skip se handle já existe.
 */

import type { MedusaContainer } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from '@medusajs/framework/utils'
import {
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
} from '@medusajs/medusa/core-flows'

import {
  CSV_PATHS,
  generatePriceCents,
  productPlaceholderImage,
  readCsv,
  slugHandle,
} from './parse-csv'
import type { SellerImportResult } from './setup-sellers'

export type ProductImportSummary = {
  created: number
  skipped: number
  orphans: number
}

export async function setupProducts(
  container: MedusaContainer,
  options: {
    salesChannelId: string
    sellersByCsvUuid: Map<string, SellerImportResult>
  }
): Promise<ProductImportSummary> {
  const logger = container.resolve('logger') as any
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any

  const rows = readCsv(CSV_PATHS.apps)
  logger.info(`[FINDTAX] setup-products: ${rows.length} linhas no CSV`)

  let created = 0
  let skipped = 0
  let orphans = 0

  // Para criar inventory levels depois, vamos coletar (variant_id, seller_id)
  const newVariantsBySellerId = new Map<string, string[]>()

  for (const row of rows) {
    const name = row['name']
    const description = row['description'] || name
    const csvProviderUuid = row['app_provider_uuid']

    const seller = options.sellersByCsvUuid.get(csvProviderUuid)
    if (!seller) {
      orphans++
      logger.warn(
        `[FINDTAX] produto "${name}" sem seller (csv_provider=${csvProviderUuid}). pulando.`
      )
      continue
    }

    const handle = slugHandle(name)
    if (!handle) {
      logger.warn(`[FINDTAX] produto sem handle válido: "${name}". pulando.`)
      continue
    }

    // -------- idempotência: handle já usado? (SQL raw — exato) --------
    const existingRes = await pg.raw(
      'SELECT id FROM product WHERE handle = ? AND deleted_at IS NULL LIMIT 1',
      [handle]
    )
    if (existingRes?.rows?.length) {
      skipped++
      continue
    }

    const priceCents = generatePriceCents(handle)
    // Prefere a logo real do seller; placeholder só quando não há logo real.
    const sellerPhoto = seller.photo
    const isRealPhoto =
      !!sellerPhoto &&
      sellerPhoto.startsWith('http') &&
      !sellerPhoto.includes('placehold.co')
    const thumbnail = isRealPhoto ? sellerPhoto : productPlaceholderImage(name)

    try {
      const { result: products } = await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: name,
              handle,
              description,
              status: ProductStatus.PUBLISHED,
              thumbnail,
              images: [{ url: thumbnail }],
              options: [{ title: 'Plano', values: ['Default'] }],
              variants: [
                {
                  title: 'Default',
                  sku: `${handle}-default`,
                  manage_inventory: true,
                  prices: [
                    {
                      amount: priceCents,
                      currency_code: 'brl',
                    },
                  ],
                  options: { Plano: 'Default' },
                },
              ],
              sales_channels: [{ id: options.salesChannelId }],
              discountable: true,
            },
          ],
          additional_data: {
            seller_id: seller.sellerId,
          } as any,
        },
      })

      const product = products[0] as any
      created++

      // Coleta variants para inventory levels
      const variantIds = (product.variants || []).map((v: any) => v.id)
      if (variantIds.length) {
        const list = newVariantsBySellerId.get(seller.sellerId) || []
        newVariantsBySellerId.set(seller.sellerId, [...list, ...variantIds])
      }

      logger.info(
        `[FINDTAX] + "${name}" criado (handle=${handle}, seller=${seller.name}, preço=R$ ${(priceCents / 100).toFixed(2)})`
      )
    } catch (err: any) {
      logger.error(
        `[FINDTAX] erro criando produto "${name}": ${err.message?.slice(0, 200)}`
      )
    }
  }

  // ============================================================================
  // Inventory levels — para cada seller, pega seu stock location e cria níveis
  // ============================================================================
  logger.info('[FINDTAX] criando inventory levels iniciais (100 unidades)…')
  const inventoryService = container.resolve(Modules.INVENTORY)

  for (const [sellerId, variantIds] of newVariantsBySellerId.entries()) {
    if (!variantIds.length) continue

    // Pega o stock location vinculado a este seller
    const { data: locations } = await query.graph({
      entity: 'stock_location',
      fields: ['id'],
      filters: { name: { $like: `Stock Location%` } } as any,
    })

    // Filtra pelo link seller_stock_location — alternativa: pegar via name pattern
    const { data: sellerStockLinks } = await query.graph({
      entity: 'seller',
      fields: ['stock_locations.id'],
      filters: { id: sellerId } as any,
    })
    const stockLocationId = (sellerStockLinks?.[0] as any)?.stock_locations?.[0]?.id

    if (!stockLocationId) {
      logger.warn(`[FINDTAX] seller ${sellerId}: stock_location não encontrado, pulando inventory`)
      continue
    }

    try {
      // Para cada variant, pega o inventory_item associado
      const { data: variantsWithItems } = await query.graph({
        entity: 'product_variant',
        fields: ['id', 'inventory_items.inventory_item_id'],
        filters: { id: variantIds } as any,
      })

      const inventoryLevels = (variantsWithItems || [])
        .flatMap((v: any) =>
          (v.inventory_items || []).map((ii: any) => ({
            inventory_item_id: ii.inventory_item_id,
            location_id: stockLocationId,
            stocked_quantity: 100,
          }))
        )
        .filter((x: any) => x.inventory_item_id && x.location_id)

      if (inventoryLevels.length) {
        await createInventoryLevelsWorkflow(container).run({
          input: { inventory_levels: inventoryLevels },
        })
      }
    } catch (err: any) {
      logger.warn(
        `[FINDTAX] erro criando inventory levels do seller ${sellerId}: ${err.message?.slice(0, 200)}`
      )
    }
  }

  logger.info(
    `[FINDTAX] setup-products concluído: ${created} criados, ${skipped} pulados, ${orphans} órfãos.`
  )

  return { created, skipped, orphans }
}
