import { sdk } from "@/lib/config"
import { HttpTypes } from "@medusajs/types"

interface CategoriesProps {
  query?: Record<string, any>
  headingCategories?: string[]
}

export const listCategories = async ({
  query,
  headingCategories = [],
}: Partial<CategoriesProps> = {}) => {
  const limit = query?.limit || 100

  const categories = await sdk.client
    .fetch<{
      product_categories: HttpTypes.StoreProductCategory[]
    }>("/store/product-categories", {
      query: {
        fields: "id, handle, name, rank, parent_category_id",
        limit,
        ...query,
      },
      cache: "force-cache",
      next: { revalidate: 3600 },
    })
    .then(({ product_categories }) => product_categories)

  // Categorias que realmente têm produtos — para não exibir categorias vazias no menu.
  const { products } = await sdk.client.fetch<{
    products: { categories?: { id: string }[] }[]
  }>("/store/products", {
    query: { fields: "categories.id", limit: 1000 },
    cache: "force-cache",
    next: { revalidate: 3600 },
  })
  const categoryIdsWithProducts = new Set(
    products.flatMap((p) => (p.categories || []).map((c) => c.id))
  )

  const parentCategories = categories.filter(
    ({ id, name }) =>
      headingCategories.includes(name.toLowerCase()) &&
      categoryIdsWithProducts.has(id)
  )

  const childrenCategories = categories.filter(
    ({ name }) => !headingCategories.includes(name.toLowerCase())
  )

  return {
    categories: childrenCategories.filter(
      ({ id, parent_category_id }) =>
        !parent_category_id && categoryIdsWithProducts.has(id)
    ),
    parentCategories: parentCategories,
  }
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle = `${categoryHandle.join("/")}`

  return sdk.client
    .fetch<HttpTypes.StoreProductCategoryListResponse>(
      `/store/product-categories`,
      {
        query: {
          fields: "*category_children",
          handle,
        },
        cache: "force-cache",
        next: { revalidate: 300 },
      }
    )
    .then(({ product_categories }) => product_categories[0])
}
