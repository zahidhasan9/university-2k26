import { CalendarDays } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticatedRequest } from "@/lib/auth"
type Slot = {
  _id: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string
  status: string
  offering: { section: string; course: { code: string; title: string } }
  teacher: { employeeId: string; user: { firstName: string; lastName: string } }
}
type Data = { items: Slot[]; pagination: { total: number } }
const days = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"]
export default async function RoutinePage() {
  let slots: Slot[] = [],
    error = ""
  try {
    slots = (await authenticatedRequest<Data>("/routine?status=active&limit=100")).data.items
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Routine unavailable"
  }
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Academic schedule</p>
        <h1 className="mt-1 text-3xl font-bold">Class routine</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Weekly rooms, courses, and faculty schedule.
        </p>
      </div>
      {error ? (
        <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {days.map((day) => {
            const items = slots.filter((slot) => slot.dayOfWeek === day)
            return (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between capitalize">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="size-5 text-primary" />
                      {day}
                    </span>
                    <Badge variant="secondary">{items.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.length ? (
                    items.map((slot) => (
                      <div key={slot._id} className="rounded-xl border p-4">
                        <div className="flex justify-between gap-3">
                          <p className="font-semibold">
                            {slot.offering.course.code} · {slot.offering.section}
                          </p>
                          <Badge variant="outline">{slot.room}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {slot.offering.course.title}
                        </p>
                        <p className="mt-3 text-xs font-medium">
                          {slot.startTime} – {slot.endTime} · {slot.teacher.user.firstName}{" "}
                          {slot.teacher.user.lastName}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="py-6 text-center text-sm text-muted-foreground">No classes</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
