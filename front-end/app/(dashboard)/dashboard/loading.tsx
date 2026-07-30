import { Card, CardContent } from "@/components/ui/card"
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1600px] animate-pulse space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-9 w-72 rounded bg-muted" />
        <div className="h-4 w-96 max-w-full rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <CardContent className="space-y-4 p-5">
              <div className="size-10 rounded-lg bg-muted" />
              <div className="h-7 w-20 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="h-80 rounded-xl border bg-muted/30" />
    </div>
  )
}
