"use client"

import { Accordion, FilterCheckboxOption } from "@/components/molecules"
import useFilters from "@/hooks/useFilters"
import { useRefinementList } from "react-instantsearch"

/**
 * Generic faceted filter section for the category pages.
 *
 * Renders one section (title + dividers handled by the parent) from a single
 * Algolia facet `attribute`, with a checkbox + count per option. The section is
 * ALWAYS rendered, even when the facet has no values (FR-011): in that case an
 * empty-state message is shown instead of the option list.
 */
export const AlgoliaRefinementFilter = ({
  label,
  attribute,
  paramKey,
  defaultOpen = true,
}: {
  label: string
  attribute: string
  paramKey: string
  defaultOpen?: boolean
}) => {
  const { items } = useRefinementList({
    attribute,
    limit: 8,
    showMore: true,
    showMoreLimit: 100,
    operator: "or",
  })
  const { updateFilters, isFilterActive } = useFilters(paramKey)

  return (
    <Accordion heading={label} defaultOpen={defaultOpen}>
      {items.length === 0 ? (
        <p className="px-4 pb-2 label-sm text-secondary !font-light">
          Nenhuma opção disponível
        </p>
      ) : (
        <ul className="px-4">
          {items.map(({ label: value, count }) => (
            <li key={value} className="mb-4">
              <FilterCheckboxOption
                checked={isFilterActive(value)}
                disabled={Boolean(!count)}
                onCheck={updateFilters}
                label={value}
                amount={count}
              />
            </li>
          ))}
        </ul>
      )}
    </Accordion>
  )
}
