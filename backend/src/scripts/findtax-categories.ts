/**
 * Wrapper para rodar via `medusa exec` o setup de categorias do FINDTAX.
 *
 *   docker compose exec backend pnpm exec medusa exec ./src/scripts/findtax-categories.ts
 *   # ou: make findtax-categories
 *
 * Cria a árvore de categorias (6 principais + 9 subcategorias) e vincula
 * todos os produtos a "Tecnologias" (principal) + "Soluções Fiscais" (sub).
 */

import type { ExecArgs } from '@medusajs/framework/types'

import { setupCategories } from './findtax/setup-categories'

export default async function execSetupCategories({ container }: ExecArgs) {
  const logger = container.resolve('logger') as any
  const r = await setupCategories(container)
  logger.info('')
  logger.info(
    `Resumo: ${r.mainCreated} categorias principais + ${r.subCreated} subcategorias criadas ` +
      `(${r.mainSkipped + r.subSkipped} já existiam). ` +
      `${r.totalProducts} produtos vinculados a Tecnologias + Soluções Fiscais ` +
      `(${r.linksCreated} novos vínculos).`
  )
}
