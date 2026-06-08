import { StarIcon } from "@/icons"
import tailwindConfig from "../../../../tailwind.config"

export const StarRating = ({
  rate,
  starSize = 20,
  disabled,
}: {
  rate: number
  starSize?: number
  disabled?: boolean
}) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => {
        const starColor =
          i < Math.floor(rate)
            ? disabled
              ? tailwindConfig.theme.extend.colors.disabled
              : tailwindConfig.theme.extend.colors.primary
            : // Empty stars: light grey ("cinza claro") so the default/unrated
              // state is visible on light backgrounds. Previously this used the
              // near-white `action.on.primary` (--brand-25 = #fff), invisible on
              // white cards. Uses --bg-disabled (neutral-200, light grey).
              "rgba(var(--bg-disabled))"
        return <StarIcon size={starSize} key={i} color={starColor} />
      })}
    </div>
  )
}
