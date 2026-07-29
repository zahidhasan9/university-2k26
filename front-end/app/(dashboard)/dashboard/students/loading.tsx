import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function StudentsLoading() {
  return (
    <div className="mx-auto max-w-[1600px] animate-pulse space-y-6">
      <div className="h-20 rounded-xl bg-muted" />
      <Card>
        <CardHeader><div className="h-10 rounded-lg bg-muted" /></CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-14 rounded-lg bg-muted" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
