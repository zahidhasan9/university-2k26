import { API_ENDPOINTS } from "@/lib/api-endpoints"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AttendanceSessionForm } from "@/components/attendance-session-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticatedRequest } from "@/lib/auth"
type Offering = {
  _id: string
  section: string
  batch: string
  course: { code: string; title: string }
  teacher: { user: { firstName: string; lastName: string } }
  semester: { name: string; academicYear: string }
}
type Routine = {
  _id: string
  offering: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string
}
export default async function NewAttendancePage() {
  const data = (
    await authenticatedRequest<{ offerings: Offering[]; routines: Routine[] }>(
      API_ENDPOINTS.attendance.options,
    )
  ).data
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" render={<Link href="/dashboard/attendance" />}>
        <ArrowLeft /> Attendance
      </Button>
      <div>
        <h1 className="text-3xl font-bold">New attendance session</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a daily session for an active course offering.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Session information</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceSessionForm offerings={data.offerings} routines={data.routines} />
        </CardContent>
      </Card>
    </div>
  )
}
