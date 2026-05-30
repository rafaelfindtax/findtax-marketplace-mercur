/**
 * Setup da camada "store" do FINDTAX:
 *   - Renomeia o store padrão para "FINDTAX"
 *   - Adiciona BRL em supported_currencies (mantém usd/eur por compatibilidade)
 *   - Cria a região "Brazil" (currency_code: brl, countries: ['br']) se ainda não existe
 *   - Garante que o country `br` está populado na tabela region_country
 *
 * Idempotente: pode rodar várias vezes sem efeitos colaterais.
 */

import type { MedusaContainer } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'
import {
  createRegionsWorkflow,
  updateStoresWorkflow,
} from '@medusajs/medusa/core-flows'

export const STORE_NAME = 'FINDTAX'
export const BR_REGION_NAME = 'Brazil'
export const BR_CURRENCY = 'brl'
export const BR_COUNTRY = 'br'

export async function setupStore(container: MedusaContainer): Promise<{
  storeId: string
  regionId: string
}> {
  const logger = container.resolve('logger') as any
  const storeService = container.resolve(Modules.STORE)
  const regionService = container.resolve(Modules.REGION)

  logger.info('[FINDTAX] setup-store: iniciando…')

  // ---------- 1. Renomear store + adicionar BRL ----------
  const [store] = await storeService.listStores({})
  if (!store) {
    throw new Error(
      '[FINDTAX] nenhum store encontrado. Rode `make seed` antes para criar o store padrão do Medusa.'
    )
  }

  const currentCurrencies = (store.supported_currencies || []).map(
    (c: any) => c.currency_code
  )
  const targetCurrencies = Array.from(
    new Set([...currentCurrencies, BR_CURRENCY])
  )

  const needsUpdate =
    store.name !== STORE_NAME ||
    targetCurrencies.length !== currentCurrencies.length

  if (needsUpdate) {
    logger.info(
      `[FINDTAX] atualizando store: name="${STORE_NAME}", currencies=[${targetCurrencies.join(', ')}]`
    )
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: {
          name: STORE_NAME,
          supported_currencies: targetCurrencies.map((cc) => ({
            currency_code: cc,
            is_default: cc === BR_CURRENCY,
          })),
        },
      },
    })
  } else {
    logger.info('[FINDTAX] store já está configurado corretamente. pulando.')
  }

  // ---------- 2. Criar região Brazil ----------
  const regions = await regionService.listRegions({})
  let brazilRegion = regions.find((r: any) => r.name === BR_REGION_NAME)

  if (!brazilRegion) {
    logger.info('[FINDTAX] criando região Brazil (BRL, br)…')
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: BR_REGION_NAME,
            currency_code: BR_CURRENCY,
            countries: [BR_COUNTRY],
            payment_providers: ['pp_system_default'],
          },
        ],
      },
    })
    brazilRegion = result[0]
    logger.info(`[FINDTAX] região Brazil criada: id=${brazilRegion.id}`)
  } else {
    logger.info(
      `[FINDTAX] região Brazil já existe: id=${brazilRegion.id}. pulando.`
    )
  }

  return {
    storeId: store.id,
    regionId: brazilRegion.id,
  }
}
