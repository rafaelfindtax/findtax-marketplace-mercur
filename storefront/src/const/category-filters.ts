export interface CategoryFilterSection {
  /** internal identifier */
  key: string
  /** label shown in the sidebar (pt-BR) */
  label: string
  /** Algolia facet attribute backing this section */
  attribute: string
  /** URL search-param key (also used by the active-filter tags) */
  paramKey: string
  /** always render the section, even when the facet has no values (FR-011) */
  alwaysVisible?: boolean
}

/**
 * Ordered configuration of the category-page filter sections.
 *
 * The order here defines the display order in the sidebar (FR-002).
 * `erp` and `delivery` point to facets that may not exist in the Algolia index
 * yet (backend Phase 2). Until those facets are populated, the sections render
 * empty (FR-011) without breaking the layout.
 */
export const CATEGORY_FILTER_SECTIONS: CategoryFilterSection[] = [
  {
    key: "category",
    label: "Categorias do Produto",
    attribute: "categories.name",
    paramKey: "category",
    alwaysVisible: true,
  },
  {
    key: "seller",
    label: "Nome do Fornecedor",
    attribute: "seller.handle",
    paramKey: "seller",
    alwaysVisible: true,
  },
  {
    key: "name",
    label: "Nome do Produto",
    attribute: "title",
    paramKey: "name",
    alwaysVisible: true,
  },
  {
    key: "erp",
    label: "Integrações com ERP",
    attribute: "erp_integrations",
    paramKey: "erp",
    alwaysVisible: true,
  },
  {
    key: "delivery",
    label: "Modelo de Entrega",
    attribute: "delivery_models",
    paramKey: "delivery",
    alwaysVisible: true,
  },
  {
    key: "reviewed",
    label: "Produtos Avaliados",
    attribute: "average_rating",
    paramKey: "reviewed",
    alwaysVisible: true,
  },
]
