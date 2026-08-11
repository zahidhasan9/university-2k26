import Link from "next/link"
import {
  CircleDollarSign,
  CreditCard,
  FileText,
  Plus,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { ExpenseAction, RefundAction } from "@/components/finance-actions"
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
import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
type Student = { studentId: string; user: { firstName: string; lastName: string; email: string } }
type Invoice = {
  _id: string
  invoiceNumber: string
  student: Student
  semester: { name: string; academicYear: string }
  currency: string
  totalMinor: number
  paidMinor: number
  dueMinor: number
  dueDate: string
  status: string
}
type Payment = {
  _id: string
  receiptNumber: string
  student: Student
  invoice: { invoiceNumber: string }
  amountMinor: number
  currency: string
  method: string
  paidAt: string
  status: string
}
type Expense = {
  _id: string
  expenseNumber: string
  category: string
  description: string
  vendor?: string
  amountMinor: number
  currency: string
  expenseDate: string
  status: string
}
type Summary = {
  payments: { _id: string; amountMinor: number }[]
  expenses: { _id: string; amountMinor: number }[]
  invoices: { _id: string; billedMinor: number; paidMinor: number; dueMinor: number }[]
}
const money = (amount: number, currency = "BDT") =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency, notation: "compact" }).format(
    amount / 100,
  )
export default async function FinancePage() {
  let invoices: Invoice[] = [],
    payments: Payment[] = [],
    expenses: Expense[] = [],
    summary: Summary | null = null,
    error = ""
  try {
    const responses = await Promise.all([
      authenticatedRequest<{ items: Invoice[] }>(withQuery(API_ENDPOINTS.finance.invoices, { limit: 10 })),
      authenticatedRequest<{ items: Payment[] }>(withQuery(API_ENDPOINTS.finance.payments, { limit: 10 })),
      authenticatedRequest<{ items: Expense[] }>(withQuery(API_ENDPOINTS.finance.expenses, { limit: 10 })),
      authenticatedRequest<Summary>(API_ENDPOINTS.finance.summary),
    ])
    invoices = responses[0].data.items
    payments = responses[1].data.items
    expenses = responses[2].data.items
    summary = responses[3].data
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Finance data unavailable"
  }
  const invoiceSummary = summary?.invoices[0],
    revenue = summary?.payments[0],
    expenseTotal = summary?.expenses[0]
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Financial operations</p>
          <h1 className="mt-1 text-3xl font-bold">Finance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Billing, collections, refunds, expenses, and institutional reporting.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/dashboard/finance/fee-structures/new" />}>
            <Plus /> Fee structure
          </Button>
          <Button variant="outline" render={<Link href="/dashboard/finance/waivers/new" />}>
            <Plus /> Student waiver
          </Button>
          <Button variant="outline" render={<Link href="/dashboard/finance/expenses/new" />}>
            <Plus /> Expense
          </Button>
          <Button render={<Link href="/dashboard/finance/invoices/new" />}>
            <Plus /> Invoice
          </Button>
        </div>
      </div>
      {error && <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <FileText className="size-5 text-blue-600" />
            <p className="mt-4 text-2xl font-bold">
              {money(invoiceSummary?.billedMinor ?? 0, invoiceSummary?._id)}
            </p>
            <p className="text-sm text-muted-foreground">Total billed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <TrendingUp className="size-5 text-emerald-600" />
            <p className="mt-4 text-2xl font-bold">
              {money(revenue?.amountMinor ?? 0, revenue?._id)}
            </p>
            <p className="text-sm text-muted-foreground">Revenue collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <CircleDollarSign className="size-5 text-amber-600" />
            <p className="mt-4 text-2xl font-bold">
              {money(invoiceSummary?.dueMinor ?? 0, invoiceSummary?._id)}
            </p>
            <p className="text-sm text-muted-foreground">Outstanding dues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <TrendingDown className="size-5 text-rose-600" />
            <p className="mt-4 text-2xl font-bold">
              {money(expenseTotal?.amountMinor ?? 0, expenseTotal?._id)}
            </p>
            <p className="text-sm text-muted-foreground">Paid expenses</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="size-5 text-primary" /> Recent invoices
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            render={<Link href="/dashboard/finance/payments/new" />}
          >
            Collect payment
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice._id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {invoice.student.user.firstName} {invoice.student.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{invoice.student.studentId}</p>
                  </TableCell>
                  <TableCell>{money(invoice.totalMinor, invoice.currency)}</TableCell>
                  <TableCell>{money(invoice.paidMinor, invoice.currency)}</TableCell>
                  <TableCell className="font-semibold">
                    {money(invoice.dueMinor, invoice.currency)}
                  </TableCell>
                  <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {invoice.status.replaceAll("_", " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-primary" /> Recent payments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>
                      <p className="font-mono text-xs font-semibold">{payment.receiptNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.invoice.invoiceNumber}
                      </p>
                    </TableCell>
                    <TableCell>{money(payment.amountMinor, payment.currency)}</TableCell>
                    <TableCell className="capitalize">
                      {payment.method.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {payment.status === "completed" && <RefundAction id={payment._id} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent expenses</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell>
                      <p className="font-mono text-xs font-semibold">{expense.expenseNumber}</p>
                      <p className="max-w-40 truncate text-xs text-muted-foreground">
                        {expense.description}
                      </p>
                    </TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{money(expense.amountMinor, expense.currency)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <ExpenseAction id={expense._id} status={expense.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
