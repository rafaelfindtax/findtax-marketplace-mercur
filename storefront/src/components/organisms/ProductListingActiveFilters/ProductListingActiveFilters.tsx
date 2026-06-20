"use client"

import { ActiveFilterElement } from "@/components/cells"
import useFilters from "@/hooks/useFilters"
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"

export const ProductListingActiveFilters = () => {
  const { allSearchParams } = useGetAllSearchParams()
  // key is irrelevant for clearAllFilters (it resets the whole pathname)
  const { clearAllFilters } = useFilters("")

  const filters = Object.entries(allSearchParams).filter(
    (element) =>
      element[0] !== "sortBy" &&
      element[0] !== "page" &&
      element[0] !== "sold" &&
      element[0] !== "products[page]"
  )

  if (!filters.length) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      <div className="gap-4 overflow-x-scroll no-scrollbar flex">
        {filters.map((filter) => (
          <ActiveFilterElement key={filter[0]} filter={filter} />
        ))}
      </div>
      <button
        type="button"
        onClick={clearAllFilters}
        className="label-md text-action whitespace-nowrap mb-4 hover:underline"
      >
        Limpar filtros
      </button>
    </div>
  )
}
