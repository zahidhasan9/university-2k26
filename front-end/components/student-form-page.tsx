import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StudentFormPage({
  title,
  description,
  backHref,
  children,
}: {
  title: string
  description: string
  backHref: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="ghost" render={<Link href={backHref} />}>
        <ArrowLeft /> Back
      </Button>
      <div>
        <p className="text-sm font-medium text-primary">Student management</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Student profile</CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-7">{children}</CardContent>
      </Card>
    </div>
  )
}
