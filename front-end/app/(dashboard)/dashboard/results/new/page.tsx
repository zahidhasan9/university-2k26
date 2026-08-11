import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ExamForm } from "@/components/exam-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticatedRequest } from "@/lib/auth"
type Offering = {
  _id: string
  section: string
  course: { code: string; title: string }
  semester: { name: string; academicYear: string }
}
export default async function NewExamPage() {
  const offerings = (
    await authenticatedRequest<{ items: Offering[] }>(withQuery(API_ENDPOINTS.academics.offerings, { limit: 100 }))
  ).data.items
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" render={<Link href="/dashboard/results" />}>
        <ArrowLeft /> Exams & results
      </Button>
      <div>
        <h1 className="text-3xl font-bold">Create examination</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Schedule an assessment and define its grade weight.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Exam information</CardTitle>
        </CardHeader>
        <CardContent>
          <ExamForm offerings={offerings} />
        </CardContent>
      </Card>
    </div>
  )
}
