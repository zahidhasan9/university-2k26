import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

function pageHref(pathname: string, params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params)
  next.set("page", String(page))
  return `${pathname}?${next.toString()}`
}

export function PaginationLinks({
  pathname,
  params,
  page,
  totalPages,
}: {
  pathname: string
  params: URLSearchParams
  page: number
  totalPages: number
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-4">
      <p className="text-sm text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          render={page > 1 ? <Link href={pageHref(pathname, params, page - 1)} /> : undefined}
        >
          <ChevronLeft /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          render={
            page < totalPages ? <Link href={pageHref(pathname, params, page + 1)} /> : undefined
          }
        >
          Next <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
