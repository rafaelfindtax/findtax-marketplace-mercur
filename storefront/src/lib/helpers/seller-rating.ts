import { SingleProductReview } from "@/types/product"

export interface SellerRating {
  /** Average rating (0–5) across valid reviews. 0 when there are none. */
  rating: number
  /** Number of valid (non-null) reviews. */
  reviewCount: number
}

/**
 * Computes a seller's average review rating from its reviews list.
 *
 * Pure function: filters out null entries, averages the `rating` field, and
 * clamps the result to the 0–5 range. Returns `{ rating: 0, reviewCount: 0 }`
 * for an empty list. Mirrors the criterion used in SellerInfo so the rating is
 * consistent across the seller page, product detail, and product cards.
 */
export function getSellerRating(
  reviews: (SingleProductReview | null)[] | null | undefined
): SellerRating {
  const valid = Array.isArray(reviews)
    ? reviews.filter((rev): rev is SingleProductReview => rev !== null)
    : []

  const reviewCount = valid.length

  if (reviewCount === 0) {
    return { rating: 0, reviewCount: 0 }
  }

  const sum = valid.reduce((acc, rev) => acc + (Number(rev.rating) || 0), 0)
  const average = sum / reviewCount

  // Clamp to the 0–5 range to guard against unexpected values.
  const rating = Math.min(5, Math.max(0, average))

  return { rating, reviewCount }
}
