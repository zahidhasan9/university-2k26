import Link from "next/link"
import { ArrowLeft, CalendarCheck } from "lucide-react"
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
type Attendance = {
  _id: string
  employee: { employeeId: string; user: { firstName: string; lastName: string } }
  date: string
  checkInAt?: string
  checkOutAt?: string
  status: string
  note?: string
}
export default async function AttendancePage() {
  let records: Attendance[] = [],
    error = ""
  try {
    records = (await authenticatedRequest<{ attendance: Attendance[] }>("/hr/attendance")).data
      .attendance
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Attendance unavailable"
  }
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <Button variant="ghost" render={<Link href="/dashboard/faculty/hr" />}>
        <ArrowLeft /> HR workspace
      </Button>
      <div>
        <p className="text-sm font-medium text-primary">Workforce attendance</p>
        <h1 className="mt-1 text-3xl font-bold">Staff attendance</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="size-5 text-primary" /> Attendance records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <p className="p-10 text-center text-destructive">{error}</p>
          ) : records.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check in</TableHead>
                  <TableHead>Check out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      <p className="font-medium">
                        {record.employee.user.firstName} {record.employee.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{record.employee.employeeId}</p>
                    </TableCell>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {record.checkInAt
                        ? new Date(record.checkInAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {record.checkOutAt
                        ? new Date(record.checkOutAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {record.status.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.note ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <CalendarCheck className="mx-auto size-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No attendance records</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
