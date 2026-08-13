import { SemesterRegistrationForm } from "@/components/semester-registration-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticatedRequest } from "@/lib/auth"
import { API_ENDPOINTS } from "@/lib/api-endpoints"

type Offering = {
  _id: string
  section: string
  course: {
    code: string
    title: string
    credits: number
    courseType: string
    theoryHoursPerWeek: number
    labHoursPerWeek: number
  }
  semester: { name: string; academicYear: string }
}
type RegistrationData = {
  student: { studentId: string; batch: string; currentSemesterNumber: number }
  offerings: Offering[]
}

export default async function RegistrationPage() {
  let data: RegistrationData | null = null,
    error = ""
  try {
    data = (
      await authenticatedRequest<RegistrationData>(API_ENDPOINTS.enrollments.registrationOptions)
    ).data
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Registration data unavailable"
  }
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Student registration</p>
        <h1 className="mt-1 text-3xl font-bold">Semester course registration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register curriculum courses; tuition and waiver are calculated automatically.
        </p>
      </div>
      {error && <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>
              {data.student.studentId} · {data.student.batch} · Semester{" "}
              {data.student.currentSemesterNumber}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SemesterRegistrationForm offerings={data.offerings} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
