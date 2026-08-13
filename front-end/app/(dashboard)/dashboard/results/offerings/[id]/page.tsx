import { API_ENDPOINTS } from "@/lib/api-endpoints"
import Link from "next/link"
import { ArrowLeft, Award } from "lucide-react"
import { ResultActions } from "@/components/result-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authenticatedRequest } from "@/lib/auth"
type Result = {
  _id: string
  student: { studentId: string; user: { firstName: string; lastName: string; email: string } }
  totalMarks: number
  percentage: number
  letterGrade: string
  gradePoint: number
  status: string
}
export default async function OfferingResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = (
    await authenticatedRequest<{ results: Result[] }>(API_ENDPOINTS.results.offering(id))
  ).data
  const hasDraft = data.results.some((result) => result.status === "draft")
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button variant="ghost" render={<Link href="/dashboard/results" />}>
        <ArrowLeft /> Exams & results
      </Button>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Course results</p>
          <h1 className="mt-1 text-3xl font-bold">Result roster</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.results.length} calculated student results
          </p>
        </div>
        <ResultActions offeringId={id} hasDraft={hasDraft} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="size-5 text-primary" /> Grades
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Total marks</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Grade point</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.results.map((result) => (
                <TableRow key={result._id}>
                  <TableCell>
                    <p className="font-medium">
                      {result.student.user.firstName} {result.student.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{result.student.studentId}</p>
                  </TableCell>
                  <TableCell>{result.totalMarks}</TableCell>
                  <TableCell>{result.percentage}%</TableCell>
                  <TableCell className="font-bold">{result.letterGrade}</TableCell>
                  <TableCell>{result.gradePoint.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {result.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
