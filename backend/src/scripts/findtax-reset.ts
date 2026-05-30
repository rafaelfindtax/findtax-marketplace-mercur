/**
 * Wrapper para rodar via `medusa exec` o reset do marketplace FINDTAX.
 *
 *   docker compose exec backend pnpm exec medusa exec ./src/scripts/findtax-reset.ts
 *   # ou via Makefile:
 *   make findtax-reset
 */

import type { ExecArgs } from '@medusajs/framework/types'

import { resetMarketplace } from './findtax/reset'

export default async function execReset({ container }: ExecArgs) {
  const logger = container.resolve('logger') as any

  logger.info('')
  logger.info('═'.repeat(72))
  logger.info('  FINDTAX Marketplace — RESET (apaga produtos + sellers + logística)')
  logger.info('═'.repeat(72))

  const result = await resetMarketplace(container)

  logger.info('')
  logger.info(`  ✅ Reset concluído`)
  logger.info(`     produtos:        ${result.products}`)
  logger.info(`     sellers:         ${result.sellers}`)
  logger.info(`     stock locations: ${result.stockLocations}`)
  logger.info('')
  logger.info('  ▶ próximo passo: make findtax-setup')
  logger.info('═'.repeat(72))
  logger.info('')
}
