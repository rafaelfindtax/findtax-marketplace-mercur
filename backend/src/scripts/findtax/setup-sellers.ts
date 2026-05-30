/**
 * Importa sellers do CSV `app_provider_*.csv` para o Mercur.
 *
 * Para cada seller:
 *   - cria auth_identity (provider emailpass)
 *   - cria seller + member via createSellerWorkflow
 *   - cria stock-location (São Paulo, SP, BR)
 *   - cria service-zone (cobrindo country `br`)
 *   - cria shipping-option (R$ 30 fixo)
 *   - define store_status = ACTIVE/SUSPENDED conforme provider_status do CSV
 *
 * Idempotente: skip se email já existe.
 */

import type { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import {
  createServiceZonesWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
} from '@medusajs/medusa/core-flows'
import { SELLER_MODULE } from '@mercurjs/b2c-core/modules/seller'
import {
  createLocationFulfillmentSetAndAssociateWithSellerWorkflow,
  createSellerWorkflow,
} from '@mercurjs/b2c-core/workflows'
import { SELLER_SHIPPING_PROFILE_LINK } from '@mercurjs/framework'

import { readCsv, slugCompact, sellerFallbackImage, CSV_PATHS } from './parse-csv'

export type SellerImportResult = {
  /** uuid do app_provider no CSV original */
  csvUuid: string
  /** id do seller criado/encontrado no Mercur */
  sellerId: string
  /** name do seller */
  name: string
  /** store_status aplicado */
  storeStatus: 'ACTIVE' | 'SUSPENDED'
  /** logo do seller (URL real do CSV ou fallback placeholder) */
  photo: string
}

/**
 * Importa sellers do CSV. Retorna mapa `csv_uuid → seller_id` para uso no setup-products.
 */
export async function setupSellers(
  container: MedusaContainer,
  options: { salesChannelId: string; brazilRegionId: string }
): Promise<{
  byCsvUuid: Map<string, SellerImportResult>
  bySellerId: Map<string, SellerImportResult>
}> {
  const logger = container.resolve('logger') as any
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const authService = container.resolve(Modules.AUTH)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const rows = readCsv(CSV_PATHS.providers)
  logger.info(`[FINDTAX] setup-sellers: ${rows.length} linhas no CSV`)

  const byCsvUuid = new Map<string, SellerImportResult>()
  const bySellerId = new Map<string, SellerImportResult>()

  let created = 0
  let skipped = 0
  let suspended = 0

  for (const row of rows) {
    const csvUuid = row['uuid']
    const name = row['name']
    const description = row['description'] || ''
    const photo = row['photo'] && row['photo'].startsWith('http') ? row['photo'] : sellerFallbackImage(name)
    const isActive = row['provider_status'] === 'ATIVO'
    const handle = slugCompact(name)
    const email = `${handle}@findtax.com`
    // Senha = slug do nome do seller (mesmo identificador da parte local do email).
    // Padding automático: o auth emailpass do Medusa exige mín. 8 caracteres,
    // então slugs curtos (roit, camu, v360, lopti, taxly) recebem sufixo @findtax.
    const password = handle.length >= 8 ? handle : `${handle}@findtax`

    if (!handle) {
      logger.warn(`[FINDTAX] seller ignorado (handle vazio): name="${name}"`)
      continue
    }

    // -------- idempotência: já existe? (SQL raw — exato e confiável) --------
    const existingRes = await pg.raw(
      'SELECT id, store_status FROM seller WHERE handle = ? AND deleted_at IS NULL LIMIT 1',
      [handle]
    )
    const existing = existingRes?.rows || []

    let sellerId: string
    let storeStatus: 'ACTIVE' | 'SUSPENDED'

    if (existing.length) {
      sellerId = existing[0].id
      storeStatus = existing[0].store_status
      skipped++
      logger.info(`[FINDTAX] ✔ seller "${name}" já existe (id=${sellerId})`)
    } else {
      // -------- 1. auth identity --------
      const authResult = await authService.register('emailpass', {
        body: { email, password },
      } as any)

      const authIdentity = (authResult as any).authIdentity
      if (!authIdentity?.id) {
        logger.error(`[FINDTAX] falha criando auth_identity para ${email}: ${JSON.stringify(authResult)}`)
        continue
      }

      // -------- 2. seller + member --------
      const { result: seller } = await createSellerWorkflow.run({
        container,
        input: {
          auth_identity_id: authIdentity.id,
          member: {
            name,
            email,
          },
          seller: {
            name,
            handle,
            description,
            photo,
            store_status: isActive ? 'ACTIVE' : 'SUSPENDED',
          } as any,
        },
      })

      sellerId = seller.id
      storeStatus = isActive ? 'ACTIVE' : 'SUSPENDED'
      created++
      if (!isActive) suspended++

      logger.info(`[FINDTAX] + seller "${name}" criado (id=${sellerId}, status=${storeStatus}, login: ${email} / senha: "${password}")`)

      // -------- 3. stock location + fulfillment set --------
      try {
        const {
          result: [stock],
        } = await createStockLocationsWorkflow(container).run({
          input: {
            locations: [
              {
                name: `Stock Location ${name}`,
                address: {
                  address_1: 'Av. Paulista, 1000',
                  city: 'São Paulo',
                  country_code: 'br',
                  postal_code: '01310-100',
                },
              },
            ],
          },
        })

        await link.create([
          {
            [SELLER_MODULE]: { seller_id: sellerId },
            [Modules.STOCK_LOCATION]: { stock_location_id: stock.id },
          },
          {
            [Modules.STOCK_LOCATION]: { stock_location_id: stock.id },
            [Modules.FULFILLMENT]: { fulfillment_provider_id: 'manual_manual' },
          },
          {
            [Modules.SALES_CHANNEL]: { sales_channel_id: options.salesChannelId },
            [Modules.STOCK_LOCATION]: { stock_location_id: stock.id },
          },
        ])

        const { result: fset } =
          await createLocationFulfillmentSetAndAssociateWithSellerWorkflow.run({
            container,
            input: {
              fulfillment_set_data: {
                name: `${name} fulfillment set`,
                type: 'shipping',
              },
              location_id: stock.id,
              seller_id: sellerId,
            },
          })

        // -------- 4. service zone para BR --------
        await createServiceZonesWorkflow.run({
          container,
          input: {
            data: [
              {
                fulfillment_set_id: (fset as any).id,
                name: 'Brazil',
                geo_zones: [{ type: 'country', country_code: 'br' }],
              },
            ],
          },
        })

        const fulfillmentService = container.resolve(Modules.FULFILLMENT)
        const [zone] = await fulfillmentService.listServiceZones({
          fulfillment_set: { id: (fset as any).id },
        } as any)

        await link.create({
          [SELLER_MODULE]: { seller_id: sellerId },
          [Modules.FULFILLMENT]: { service_zone_id: (zone as any).id },
        })

        // -------- 5. shipping option BRL --------
        const { data: shippingProfileLink } = await query.graph({
          entity: SELLER_SHIPPING_PROFILE_LINK,
          fields: ['shipping_profile_id'],
          filters: { seller_id: sellerId } as any,
        })

        if (shippingProfileLink?.length) {
          const {
            result: [shippingOption],
          } = await createShippingOptionsWorkflow(container).run({
            input: [
              {
                name: `${name} shipping`,
                shipping_profile_id: (shippingProfileLink[0] as any)
                  .shipping_profile_id,
                service_zone_id: (zone as any).id,
                provider_id: 'manual_manual',
                type: {
                  label: 'Padrão',
                  code: handle,
                  description: 'Entrega padrão BR',
                },
                rules: [
                  { value: 'true', attribute: 'enabled_in_store', operator: 'eq' },
                  { value: 'false', attribute: 'is_return', operator: 'eq' },
                ],
                prices: [
                  { currency_code: 'brl', amount: 30 },
                  { amount: 30, region_id: options.brazilRegionId },
                ],
                price_type: 'flat',
                data: { id: 'manual-fulfillment' },
              },
            ],
          })

          await link.create({
            [SELLER_MODULE]: { seller_id: sellerId },
            [Modules.FULFILLMENT]: { shipping_option_id: shippingOption.id },
          })
        }
      } catch (err: any) {
        logger.warn(
          `[FINDTAX] ⚠ erro montando logística do seller "${name}": ${err.message?.slice(0, 200)}`
        )
      }
    }

    const result: SellerImportResult = {
      csvUuid,
      sellerId,
      name,
      storeStatus,
      photo,
    }
    byCsvUuid.set(csvUuid, result)
    bySellerId.set(sellerId, result)
  }

  logger.info(
    `[FINDTAX] setup-sellers concluído: ${created} criados (${suspended} suspended), ${skipped} pulados.`
  )

  return { byCsvUuid, bySellerId }
}
