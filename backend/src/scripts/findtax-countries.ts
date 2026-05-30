/**
 * Wrapper para rodar via `medusa exec` o setup de países do marketplace FINDTAX.
 *
 *   docker compose exec backend pnpm exec medusa exec ./src/scripts/findtax-countries.ts
 *   # ou: make findtax-countries
 *
 * Garante que toda a cadeia para `supported_countries:br` no Algolia está OK:
 *   - geo_zones cobrindo 'br' em todas as service_zones
 *   - inventory_levels para todos os variants no stock_location do seller
 */

import type { ExecArgs } from '@medusajs/framework/types'

import { setupCountries } from './findtax/setup-countries'

export default async function execSetupCountries({ container }: ExecArgs) {
  const logger = container.resolve('logger') as any
  const r = await setupCountries(container)
  logger.info('')
  logger.info(
    `Resumo: +${r.addedGeoZones} geo_zones, +${r.createdLevels} inventory_levels (${r.skippedLevels} já existiam).`
  )
}
