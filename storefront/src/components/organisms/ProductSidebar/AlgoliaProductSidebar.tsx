"use client"

import { Button } from "@/components/atoms"
import { Modal } from "@/components/molecules"
import { AlgoliaRefinementFilter } from "@/components/cells/AlgoliaRefinementFilter/AlgoliaRefinementFilter"
import { CATEGORY_FILTER_SECTIONS } from "@/const/category-filters"
import { useEffect, useState } from "react"
import { ProductListingActiveFilters } from "../ProductListingActiveFilters/ProductListingActiveFilters"
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"

/**
 * Faceted filter sidebar for the category pages.
 *
 * Renders the configured filter sections (feature 004-category-filters) in a
 * fixed order, each separated by a divider. All sections are always rendered —
 * even when their facet has no values — via the generic AlgoliaRefinementFilter.
 */
export const AlgoliaProductSidebar = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const { allSearchParams } = useGetAllSearchParams()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const sections = (
    <div>
      {CATEGORY_FILTER_SECTIONS.map((section) => (
        <div
          key={section.key}
          className="border-b border-primary last:border-b-0"
        >
          <AlgoliaRefinementFilter
            label={section.label}
            attribute={section.attribute}
            paramKey={section.paramKey}
            defaultOpen={Boolean(allSearchParams[section.paramKey])}
          />
        </div>
      ))}
    </div>
  )

  return isMobile ? (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full uppercase mb-4">
        Filtros
      </Button>
      {isOpen && (
        <Modal heading="Filtros" onClose={() => setIsOpen(false)}>
          <div className="px-4">
            <ProductListingActiveFilters />
            {sections}
          </div>
        </Modal>
      )}
    </>
  ) : (
    sections
  )
}
