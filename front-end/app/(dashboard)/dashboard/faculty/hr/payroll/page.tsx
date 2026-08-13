import { API_ENDPOINTS } from "@/lib/api-endpoints"
import Link from "next/link"
import { ArrowLeft, Banknote } from "lucide-react"
import { PayrollAction, PayrollCreate } from "@/components/payroll-actions"
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

type Run = {
  _id: string
  year: number
  month: number
  currency: string
  employeeCount: number
  grossMinor: number
  deductionMinor: number
  netMinor: number
  status: string
}
const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency }).format(amount / 100)

export default async function PayrollPage() {
  let runs: Run[] = [],
    error = ""
  try {
    runs = (await authenticatedRequest<{ payrollRuns: Run[] }>(API_ENDPOINTS.hr.payroll)).data
      .payrollRuns
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Payroll unavailable"
  }
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <Button variant="ghost" render={<Link href="/dashboard/faculty/hr" />}>
        <ArrowLeft /> HR workspace
      </Button>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Compensation</p>
          <h1 className="mt-1 text-3xl font-bold">Payroll runs</h1>
        </div>
        <PayrollCreate />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="size-5 text-primary" /> Payroll history
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <p className="p-10 text-center text-destructive">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run._id}>
                    <TableCell className="font-medium">
                      {new Date(run.year, run.month - 1).toLocaleString("en", {
                        month: "long",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{run.employeeCount}</TableCell>
                    <TableCell>{money(run.grossMinor, run.currency)}</TableCell>
                    <TableCell>{money(run.deductionMinor, run.currency)}</TableCell>
                    <TableCell className="font-semibold">
                      {money(run.netMinor, run.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <PayrollAction id={run._id} status={run.status} />
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
