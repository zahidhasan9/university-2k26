import { CalendarDays, Clock3, MapPin, Users } from "lucide-react"

import { PaginationLinks } from "@/components/pagination-links"
import { RoutineFilters } from "@/components/routine-filters"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AcademicItem, AcademicList } from "@/lib/academic-types"
import { authenticatedRequest } from "@/lib/auth"

type Slot = {
  _id: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string
  status: string
  semester: { _id: string; name: string; code: string }
  offering: {
    batch: string
    section: string
    course: {
      code: string
      title: string
      program?: { code: string; name: string; department?: { code: string; name: string } }
    }
  }
  teacher: { employeeId: string; user: { firstName: string; lastName: string } }
}

type Data = {
  items: Slot[]
  filters?: { batches: string[]; sections: string[]; rooms: string[] }
  pagination: { total: number; page: number; totalPages: number }
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>
const days = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"]
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

export default async function RoutinePage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams
  const selected = {
    semesterId: first(raw.semesterId) ?? "",
    departmentId: first(raw.departmentId) ?? "",
    programId: first(raw.programId) ?? "",
    batch: first(raw.batch) ?? "",
    section: first(raw.section) ?? "",
    dayOfWeek: first(raw.dayOfWeek) ?? "",
    room: first(raw.room) ?? "",
    view: first(raw.view) === "list" ? "list" : "week",
  }
  const page = Math.max(1, Number(first(raw.page)) || 1)
  const query = new URLSearchParams({ status: "active", limit: "100", page: String(page) })
  Object.entries(selected).forEach(([key, value]) => {
    if (value && key !== "view") query.set(key, value)
  })
  if (selected.view === "list") query.set("view", "list")

  let data: Data | null = null
  let semesters: AcademicItem[] = []
  let departments: AcademicItem[] = []
  let programs: AcademicItem[] = []
  let error = ""
  const [routineResult, semesterResult, departmentResult, programResult] = await Promise.allSettled([
    authenticatedRequest<Data>(`/routine?${query}`),
    authenticatedRequest<AcademicList>("/semesters?limit=100"),
    authenticatedRequest<AcademicList>("/departments?status=active&limit=100"),
    authenticatedRequest<AcademicList>("/programs?status=active&limit=100"),
  ])
  if (routineResult.status === "fulfilled") data = routineResult.value.data
  else error = routineResult.reason instanceof Error ? routineResult.reason.message : "Routine unavailable"
  if (semesterResult.status === "fulfilled") semesters = semesterResult.value.data.items
  if (departmentResult.status === "fulfilled") departments = departmentResult.value.data.items
  if (programResult.status === "fulfilled") programs = programResult.value.data.items
  const slots = data?.items ?? []

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Academic schedule</p>
          <h1 className="mt-1 text-3xl font-bold">Class routine</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filter weekly classes by semester, department, program, batch, section, day, or room.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit text-sm">
          {data?.pagination.total.toLocaleString() ?? 0} classes
        </Badge>
      </div>

      <RoutineFilters
        key={JSON.stringify(selected)}
        semesters={semesters}
        departments={departments}
        programs={programs}
        batches={data?.filters?.batches ?? []}
        sections={data?.filters?.sections ?? []}
        rooms={data?.filters?.rooms ?? []}
        selected={selected}
      />

      {error ? (
        <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>
      ) : selected.view === "list" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day & time</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Batch / section</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Room</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((slot) => (
                  <TableRow key={slot._id}>
                    <TableCell className="capitalize">
                      <p className="font-medium">{slot.dayOfWeek}</p>
                      <p className="text-xs text-muted-foreground">{slot.startTime} - {slot.endTime}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{slot.offering.course.code}</p>
                      <p className="max-w-56 truncate text-xs text-muted-foreground">{slot.offering.course.title}</p>
                    </TableCell>
                    <TableCell>{slot.offering.course.program?.code ?? "Unassigned"}</TableCell>
                    <TableCell>{slot.offering.batch ?? "Unassigned"} / {slot.offering.section}</TableCell>
                    <TableCell>{slot.teacher.user.firstName} {slot.teacher.user.lastName}</TableCell>
                    <TableCell>{slot.room}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!slots.length && <p className="p-10 text-center text-sm text-muted-foreground">No matching classes</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {days.filter((day) => !selected.dayOfWeek || day === selected.dayOfWeek).map((day) => {
            const items = slots.filter((slot) => slot.dayOfWeek === day)
            return (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between capitalize">
                    <span className="flex items-center gap-2"><CalendarDays className="size-5 text-primary" />{day}</span>
                    <Badge variant="secondary">{items.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.length ? items.map((slot) => (
                    <div key={slot._id} className="rounded-xl border p-4">
                      <div className="flex justify-between gap-3">
                        <p className="font-semibold">{slot.offering.course.code} - {slot.offering.section}</p>
                        <Badge variant="outline">{slot.room}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{slot.offering.course.title}</p>
                      <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock3 className="size-3" />{slot.startTime} - {slot.endTime}</span>
                        <span className="flex items-center gap-1"><Users className="size-3" />Batch {slot.offering.batch ?? "Unassigned"}, Section {slot.offering.section}</span>
                        <span>{slot.teacher.user.firstName} {slot.teacher.user.lastName}</span>
                        <span className="flex items-center gap-1"><MapPin className="size-3" />{slot.room}</span>
                      </div>
                    </div>
                  )) : <p className="py-6 text-center text-sm text-muted-foreground">No classes</p>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {data && (
        <PaginationLinks
          pathname="/dashboard/calendar"
          params={query}
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
        />
      )}
    </div>
  )
}
