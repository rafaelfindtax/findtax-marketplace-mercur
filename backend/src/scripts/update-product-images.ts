/**
 * Atualiza o thumbnail/images dos produtos existentes para usar a logo real
 * do seller dono, no lugar do placeholder genérico (placehold.co).
 *
 * Fonte da imagem: campo `photo` do seller (logo importada do CSV de providers,
 * ex: https://api.findtax.com.br/api/v1/asset/img/image_HXb4EX...png).
 *
 * Idempotente: só toca produtos cujo thumbnail aponta para placehold.co (ou vazio).
 * Após o update o thumbnail passa a ser a URL real, então re-execuções pulam.
 * Sellers sem logo real (photo vazio ou placehold.co) deixam seus produtos como estão.
 *
 * Como rodar:
 *   docker compose exec backend pnpm exec medusa exec ./src/scripts/update-product-images.ts
 */

import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { updateProductsWorkflow } from '@medusajs/medusa/core-flows'

function isRealPhoto(photo?: string | null): photo is string {
  return (
    !!photo && photo.startsWith('http') && !photo.includes('placehold.co')
  )
}

function isPlaceholderThumbnail(thumbnail?: string | null): boolean {
  return !thumbnail || thumbnail.includes('placehold.co')
}

export default async function updateProductImages({ container }: ExecArgs) {
  const logger = container.resolve('logger') as any
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info('[FINDTAX] update-product-images: iniciando…')

  const { data: sellers } = await query.graph({
    entity: 'seller',
    fields: ['id', 'name', 'photo', 'products.id', 'products.thumbnail'],
  })

  const updates: { id: string; thumbnail: string; images: { url: string }[] }[] =
    []
  let skippedNoLogo = 0
  let skippedAlreadyReal = 0

  for (const seller of sellers as any[]) {
    const photo = seller.photo as string | undefined
    const products = (seller.products || []) as { id: string; thumbnail?: string }[]

    if (!isRealPhoto(photo)) {
      skippedNoLogo += products.length
      continue
    }

    for (const product of products) {
      if (isPlaceholderThumbnail(product.thumbnail)) {
        updates.push({
          id: product.id,
          thumbnail: photo,
          images: [{ url: photo }],
        })
      } else {
        skippedAlreadyReal++
      }
    }
  }

  if (updates.length) {
    // Atualiza em lotes para não estourar payload em catálogos grandes.
    const BATCH = 50
    for (let i = 0; i < updates.length; i += BATCH) {
      const batch = updates.slice(i, i + BATCH)
      await updateProductsWorkflow(container).run({
        input: { products: batch as any },
      })
      logger.info(
        `[FINDTAX] atualizados ${Math.min(i + BATCH, updates.length)}/${updates.length}`
      )
    }
  }

  logger.info(
    `[FINDTAX] update-product-images concluído: ${updates.length} atualizados, ` +
      `${skippedAlreadyReal} já com imagem real, ${skippedNoLogo} sem logo de seller.`
  )
}
