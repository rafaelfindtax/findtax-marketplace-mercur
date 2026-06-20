"use client"

import { useEffect } from "react"

// Route-level error boundary for the main storefront group. Without this, a thrown
// Server Component (e.g. a /store request failing because the publishable key is
// missing) surfaces in the browser as the opaque RSC "An unknown error occurred."
export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface the real cause in the server/browser console for debugging.
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="max-w-md text-secondary">
        We couldn&apos;t load this page. This is often a backend connection or
        configuration issue. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-sm border border-primary px-4 py-2 hover:bg-primary hover:text-static"
      >
        Try again
      </button>
    </div>
  )
}
