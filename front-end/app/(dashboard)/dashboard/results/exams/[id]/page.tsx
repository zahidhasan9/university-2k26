import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MarksEntry } from "@/components/marks-entry"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticatedRequest } from "@/lib/auth"
type Student = { _id: string; studentId: string; user: { firstName: string; lastName: string } }
type Mark = { student: Student; marksObtained: number; absent: boolean; note?: string }
type Exam = { _id: string; title: string; totalMarks: number; status: string; offering: { _id: string; section: string; course: { code: string; title: string } } }
export default async function ExamMarksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [examResponse, marksResponse] = await Promise.all([
    authenticatedRequest<{ exam: Exam }>(`/exams/${id}`),
    authenticatedRequest<{ marks: Mark[] }>(`/exams/${id}/marks`),
  ])
  const exam = examResponse.data.exam
  const enrollments = (await authenticatedRequest<{ items: { student: Student }[] }>(`/enrollments?offeringId=${exam.offering._id}&status=enrolled&limit=100`)).data.items
  return <div className="mx-auto max-w-5xl space-y-6"><Button variant="ghost" render={<Link href="/dashboard/results" />}><ArrowLeft /> Exams & results</Button><div><h1 className="text-3xl font-bold">{exam.title}</h1><p className="mt-1 text-sm text-muted-foreground">{exam.offering.course.code} · Section {exam.offering.section} · {exam.totalMarks} marks</p></div><Card><CardHeader><CardTitle>Assessment marks</CardTitle></CardHeader><CardContent><MarksEntry examId={id} totalMarks={exam.totalMarks} students={enrollments.map((item) => item.student)} existing={marksResponse.data.marks} /></CardContent></Card></div>
}
