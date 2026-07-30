import Link from "next/link"
import { Award, ClipboardPenLine, Plus } from "lucide-react"
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
type Exam = {
  _id: string
  title: string
  type: string
  examDate: string
  startTime: string
  endTime: string
  room?: string
  totalMarks: number
  weightPercentage: number
  status: string
  offering: { _id: string; section: string; course: { code: string; title: string } }
}
type Policy = { _id: string; name: string; code: string }
export default async function ResultsPage() {
  let exams: Exam[] = [],
    policies: Policy[] = [],
    error = ""
  try {
    const responses = await Promise.all([
      authenticatedRequest<{ items: Exam[] }>("/exams?limit=100"),
      authenticatedRequest<{ policies: Policy[] }>("/results/grade-policies"),
    ])
    exams = responses[0].data.items
    policies = responses[1].data.policies
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Results workspace unavailable"
  }
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Assessment & outcomes</p>
          <h1 className="mt-1 text-3xl font-bold">Exams & results</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Marks entry, grading, and controlled publication.
          </p>
        </div>
        <Button render={<Link href="/dashboard/results/new" />}>
          <Plus /> New exam
        </Button>
      </div>
      {error && <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <ClipboardPenLine className="size-5 text-blue-600" />
            <p className="mt-4 text-2xl font-bold">{exams.length}</p>
            <p className="text-sm text-muted-foreground">Examinations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Award className="size-5 text-violet-600" />
            <p className="mt-4 text-2xl font-bold">{policies.length}</p>
            <p className="text-sm text-muted-foreground">Grade policies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Award className="size-5 text-emerald-600" />
            <p className="mt-4 text-2xl font-bold">
              {exams.filter((exam) => exam.status === "completed").length}
            </p>
            <p className="text-sm text-muted-foreground">Completed exams</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Examination schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Date & time</TableHead>
                <TableHead>Marks / weight</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam._id}>
                  <TableCell>
                    <p className="font-medium">{exam.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {exam.type.replaceAll("_", " ")}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {exam.offering.course.code} · {exam.offering.section}
                    </p>
                    <p className="text-xs text-muted-foreground">{exam.offering.course.title}</p>
                  </TableCell>
                  <TableCell>
                    <p>{new Date(exam.examDate).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {exam.startTime} – {exam.endTime}
                    </p>
                  </TableCell>
                  <TableCell>
                    {exam.totalMarks} · {exam.weightPercentage}%
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {exam.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        render={<Link href={`/dashboard/results/exams/${exam._id}`} />}
                      >
                        Marks
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        render={<Link href={`/dashboard/results/offerings/${exam.offering._id}`} />}
                      >
                        Results
                      </Button>
                    </div>
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
