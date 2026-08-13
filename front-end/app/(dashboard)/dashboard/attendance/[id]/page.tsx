import Link from "next/link"
import { ArrowLeft, Users } from "lucide-react"
import { ManualAttendance } from "@/components/manual-attendance"
import { QrAttendance } from "@/components/qr-attendance"
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
type Student = {
  _id: string
  studentId: string
  user: { firstName: string; lastName: string; email: string }
}
type RecordItem = { _id: string; student: Student; status: string; source: string; note?: string }
type Enrollment = { student: Student }
export default async function AttendanceRecordsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = (
    await authenticatedRequest<{
      session: { date: string; endsAt?: string; sessionNumber?: number; classType?: string; room?: string; topic?: string; status: string; offering: { _id: string } }
      records: RecordItem[]
    }>(`/attendance/${id}/records`)
  ).data
  const enrollments = (
    await authenticatedRequest<{ items: Enrollment[] }>(
      `/enrollments?offeringId=${data.session.offering._id}&status=enrolled&limit=100`,
    )
  ).data.items
  const students = enrollments.map((item) => item.student)
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="ghost" render={<Link href="/dashboard/attendance" />}>
        <ArrowLeft /> Attendance
      </Button>
      <div>
        <h1 className="text-3xl font-bold">Session records</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(data.session.date).toLocaleDateString()} · {data.session.topic ?? "No topic"} ·{" "}
          {data.session.status}
        </p>
      </div>
      <QrAttendance sessionId={id} open={data.session.status === "open"} />
      <ManualAttendance
        sessionId={id}
        students={students}
        existing={data.records}
        open={data.session.status === "open"}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" /> Saved records ({data.records.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.records.map((record) => (
                <TableRow key={record._id}>
                  <TableCell>
                    <p className="font-medium">
                      {record.student.user.firstName} {record.student.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{record.student.user.email}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{record.student.studentId}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{record.source}</TableCell>
                  <TableCell>{record.note ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
