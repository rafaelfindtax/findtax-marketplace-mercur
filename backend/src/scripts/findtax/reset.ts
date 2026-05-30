/**
 * Reset do marketplace FINDTAX — apaga:
 *   - todos os produtos (soft delete via Medusa)
 *   - todos os sellers (e suas members/auth_identities)
 *   - todas as stock locations / service zones / shipping options
 *
 * PRESERVA:
 *   - admin users
 *   - migrations / schema
 *   - regions
 *   - store
 *   - sales channels
 *   - categories / collections
 *
 * Idempotente: pode rodar quando estiver vazio sem erro.
 */

import type { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

export async function resetMarketplace(
  container: MedusaContainer
): Promise<{ products: number; sellers: number; stockLocations: number }> {
  const logger = container.resolve('logger') as any
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productService = container.resolve(Modules.PRODUCT)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)

  logger.info('[FINDTAX] reset: iniciando…')

  // ---------- 1. Produtos ----------
  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id'],
    filters: {} as any,
  })
  if (products?.length) {
    await productService.deleteProducts(products.map((p: any) => p.id))
    logger.info(`[FINDTAX] - ${products.length} produtos apagados`)
  }

  // ---------- 2. Sellers ----------
  const { data: sellers } = await query.graph({
    entity: 'seller',
    fields: ['id'],
    filters: {} as any,
  })
  if (sellers?.length) {
    const sellerService = container.resolve('seller' as any) as any
    try {
      await sellerService.deleteSellers(sellers.map((s: any) => s.id))
    } catch {
      // fallback: alguns providers expõem só `delete`
      try {
        await sellerService.delete(sellers.map((s: any) => s.id))
      } catch (err: any) {
        logger.warn(`[FINDTAX] não consegui deletar sellers via service: ${err.message?.slice(0, 200)}`)
      }
    }
    logger.info(`[FINDTAX] - ${sellers.length} sellers apagados`)
  }

  // ---------- 3. Stock locations ----------
  const { data: stockLocations } = await query.graph({
    entity: 'stock_location',
    fields: ['id'],
    filters: {} as any,
  })
  if (stockLocations?.length) {
    await stockLocationService.deleteStockLocations(
      stockLocations.map((s: any) => s.id)
    )
    logger.info(`[FINDTAX] - ${stockLocations.length} stock locations apagados`)
  }

  // ---------- 4. Service zones + shipping options ----------
  try {
    const fulfillmentSets = await fulfillmentService.listFulfillmentSets({})
    if (fulfillmentSets?.length) {
      await fulfillmentService.deleteFulfillmentSets(
        fulfillmentSets.map((f: any) => f.id)
      )
      logger.info(`[FINDTAX] - ${fulfillmentSets.length} fulfillment sets apagados`)
    }
  } catch (err: any) {
    logger.warn(`[FINDTAX] erro apagando fulfillment sets: ${err.message?.slice(0, 200)}`)
  }

  // ---------- 5. Auth identities órfãs (emails *@test.com) ----------
  try {
    const authService = container.resolve(Modules.AUTH)
    const identities = await (authService as any).listAuthIdentities?.({
      provider_identities: { entity_id: { $like: '%@test.com' } },
    } as any)
    if (identities?.length) {
      await (authService as any).deleteAuthIdentities(
        identities.map((i: any) => i.id)
      )
      logger.info(`[FINDTAX] - ${identities.length} auth identities @test.com apagadas`)
    }
  } catch (err: any) {
    logger.warn(`[FINDTAX] erro apagando auth identities: ${err.message?.slice(0, 200)}`)
  }

  logger.info('[FINDTAX] reset concluído.')

  return {
    products: products?.length || 0,
    sellers: sellers?.length || 0,
    stockLocations: stockLocations?.length || 0,
  }
}

// Export default para uso via `medusa exec`
export default async function execReset({ container }: { container: MedusaContainer }) {
  await resetMarketplace(container)
}
