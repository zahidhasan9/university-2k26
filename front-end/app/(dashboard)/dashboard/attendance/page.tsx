import { API_ENDPOINTS } from "@/lib/api-endpoints"
import Link from "next/link"
import { CalendarCheck2, Plus } from "lucide-react"
import { AttendanceActions } from "@/components/attendance-actions"
import { PaginationLinks } from "@/components/pagination-links"
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
type Session = {
  _id: string
  offering: { section: string; course: { code: string; title: string } }
  date: string
  topic?: string
  status: string
}
type Data = {
  items: Session[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const raw = await searchParams,
    page = Math.max(1, Number(raw.page) || 1),
    status = raw.status ?? ""
  const query = new URLSearchParams({ page: String(page), limit: "12" })
  if (status) query.set("status", status)
  let data: Data | null = null,
    error = ""
  try {
    data = (await authenticatedRequest<Data>(`${API_ENDPOINTS.attendance.sessions}?${query}`)).data
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Attendance unavailable"
  }
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Academic operations</p>
          <h1 className="mt-1 text-3xl font-bold">Student attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage class sessions, records, and QR check-ins.
          </p>
        </div>
        <Button render={<Link href="/dashboard/attendance/new" />}>
          <Plus /> New session
        </Button>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between border-b">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck2 className="size-5 text-primary" /> Sessions
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {data?.pagination.total ?? 0} sessions
            </p>
          </div>
          <form>
            <select
              name="status"
              defaultValue={status}
              className="h-9 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button type="submit" variant="secondary" className="ml-2">
              Apply
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <p className="p-10 text-center text-destructive">{error}</p>
          ) : data?.items.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((session) => (
                    <TableRow key={session._id}>
                      <TableCell>
                        <p className="font-medium">{session.offering.course.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.offering.course.title}
                        </p>
                      </TableCell>
                      <TableCell>{session.offering.section}</TableCell>
                      <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                      <TableCell>{session.topic ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <AttendanceActions id={session._id} status={session.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationLinks
                pathname="/dashboard/attendance"
                params={query}
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
              />
            </>
          ) : (
            <div className="p-12 text-center">
              <CalendarCheck2 className="mx-auto size-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No attendance sessions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
