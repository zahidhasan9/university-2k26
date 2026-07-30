"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
          <div className="max-w-md text-center">
            <p className="text-sm font-medium text-destructive">Application error</p>
            <h1 className="mt-2 text-2xl font-bold">UniSphere could not continue</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              The error has been recorded. Retry the request, or sign in again if your session has
              expired.
            </p>
            <button
              type="button"
              className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={unstable_retry}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
