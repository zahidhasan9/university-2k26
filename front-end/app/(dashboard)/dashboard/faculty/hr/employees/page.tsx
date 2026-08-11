import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import Link from "next/link"
import { ArrowLeft, UserCog } from "lucide-react"
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
type Employee = {
  _id: string
  employeeId: string
  user: { firstName: string; lastName: string; email: string }
  department?: { name: string; code: string }
  employeeType: string
  designation: string
  joiningDate: string
  status: string
}
export default async function EmployeesPage() {
  let employees: Employee[] = [],
    error = ""
  try {
    employees = (await authenticatedRequest<{ items: Employee[] }>(withQuery(API_ENDPOINTS.hr.employees, { limit: 100 }))).data
      .items
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Employees unavailable"
  }
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <Button variant="ghost" render={<Link href="/dashboard/faculty/hr" />}>
        <ArrowLeft /> HR workspace
      </Button>
      <div>
        <p className="text-sm font-medium text-primary">Employment</p>
        <h1 className="mt-1 text-3xl font-bold">Employees</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="size-5 text-primary" /> Employee directory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <p className="p-10 text-center text-destructive">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell>
                      <p className="font-medium">
                        {employee.user.firstName} {employee.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{employee.user.email}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold">
                      {employee.employeeId}
                    </TableCell>
                    <TableCell className="capitalize">{employee.employeeType}</TableCell>
                    <TableCell>
                      {employee.department
                        ? `${employee.department.code} · ${employee.department.name}`
                        : "—"}
                    </TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {employee.status.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
