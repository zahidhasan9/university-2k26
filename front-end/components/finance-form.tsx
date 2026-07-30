"use client"

import { apiResponseRequest } from "@/lib/http-client"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
type Student = { _id: string; studentId: string; user: { firstName: string; lastName: string } }
type Semester = { _id: string; name: string; academicYear: string }
type Invoice = {
  _id: string
  invoiceNumber: string
  currency: string
  dueMinor: number
  student: Student
}
const selectClass = "h-9 w-full rounded-lg border bg-background px-3 text-sm"
function Field({
  label,
  name,
  children,
}: {
  label: string
  name: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
    </div>
  )
}
function BaseForm({
  endpoint,
  payload,
  children,
  label,
}: {
  endpoint: string
  payload: (form: FormData) => object
  children: React.ReactNode
  label: string
}) {
  const router = useRouter(),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("")
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    setError("")
    const response = await apiResponseRequest(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(form)),
    })
    const body = await response.json()
    setLoading(false)
    if (!response.ok) return setError(body.message || `${label} could not be saved`)
    router.push("/dashboard/finance")
    router.refresh()
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      {children}
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? <LoaderCircle className="animate-spin" /> : <Save />}
        {label}
      </Button>
    </form>
  )
}
export function InvoiceForm({
  students,
  semesters,
}: {
  students: Student[]
  semesters: Semester[]
}) {
  return (
    <BaseForm
      endpoint="/finance/invoices"
      label="Issue invoice"
      payload={(form) => ({
        studentId: form.get("studentId"),
        semesterId: form.get("semesterId"),
        selectedOptionalItemCodes: String(form.get("optionalCodes") ?? "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        discountMinor: Math.round(Number(form.get("discount") || 0) * 100),
        dueDate: form.get("dueDate"),
      })}
    >
      <Field label="Student" name="studentId">
        <select id="studentId" name="studentId" className={selectClass} required defaultValue="">
          <option value="" disabled>
            Select student
          </option>
          {students.map((item) => (
            <option key={item._id} value={item._id}>
              {item.studentId} · {item.user.firstName} {item.user.lastName}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Semester" name="semesterId">
        <select id="semesterId" name="semesterId" className={selectClass} required defaultValue="">
          <option value="" disabled>
            Select semester
          </option>
          {semesters.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name} · {item.academicYear}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Optional fee codes (comma separated)" name="optionalCodes">
        <Input id="optionalCodes" name="optionalCodes" placeholder="LAB, TRANSPORT" />
      </Field>
      <Field label="Discount amount" name="discount">
        <Input id="discount" name="discount" type="number" min={0} step={0.01} defaultValue={0} />
      </Field>
      <Field label="Due date" name="dueDate">
        <Input id="dueDate" name="dueDate" type="date" required />
      </Field>
    </BaseForm>
  )
}
export function PaymentForm({ invoices }: { invoices: Invoice[] }) {
  return (
    <BaseForm
      endpoint="/finance/payments"
      label="Collect payment"
      payload={(form) => ({
        invoiceId: form.get("invoiceId"),
        amountMinor: Math.round(Number(form.get("amount")) * 100),
        method: form.get("method"),
        externalReference: String(form.get("reference") ?? "").trim() || undefined,
        paidAt: form.get("paidAt") || undefined,
      })}
    >
      <Field label="Outstanding invoice" name="invoiceId">
        <select id="invoiceId" name="invoiceId" className={selectClass} required defaultValue="">
          <option value="" disabled>
            Select invoice
          </option>
          {invoices.map((item) => (
            <option key={item._id} value={item._id}>
              {item.invoiceNumber} · {item.student.studentId} · Due{" "}
              {(item.dueMinor / 100).toFixed(2)} {item.currency}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Amount" name="amount">
        <Input id="amount" name="amount" type="number" min={0.01} step={0.01} required />
      </Field>
      <Field label="Payment method" name="method">
        <select id="method" name="method" className={selectClass}>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank transfer</option>
          <option value="card">Card</option>
          <option value="mobile_banking">Mobile banking</option>
          <option value="cheque">Cheque</option>
          <option value="online">Online</option>
        </select>
      </Field>
      <Field label="External reference" name="reference">
        <Input id="reference" name="reference" />
      </Field>
      <Field label="Paid at" name="paidAt">
        <Input id="paidAt" name="paidAt" type="datetime-local" />
      </Field>
    </BaseForm>
  )
}
export function ExpenseForm() {
  return (
    <BaseForm
      endpoint="/finance/expenses"
      label="Create expense"
      payload={(form) => ({
        category: form.get("category"),
        description: form.get("description"),
        vendor: String(form.get("vendor") ?? "").trim() || undefined,
        amountMinor: Math.round(Number(form.get("amount")) * 100),
        currency: form.get("currency"),
        expenseDate: form.get("expenseDate"),
        note: String(form.get("note") ?? "").trim() || undefined,
      })}
    >
      <Field label="Category" name="category">
        <Input id="category" name="category" minLength={2} required placeholder="Utilities" />
      </Field>
      <Field label="Description" name="description">
        <Input id="description" name="description" minLength={3} required />
      </Field>
      <Field label="Vendor" name="vendor">
        <Input id="vendor" name="vendor" />
      </Field>
      <div className="grid grid-cols-[1fr_100px] gap-4">
        <Field label="Amount" name="amount">
          <Input id="amount" name="amount" type="number" min={0.01} step={0.01} required />
        </Field>
        <Field label="Currency" name="currency">
          <Input
            id="currency"
            name="currency"
            defaultValue="BDT"
            minLength={3}
            maxLength={3}
            required
          />
        </Field>
      </div>
      <Field label="Expense date" name="expenseDate">
        <Input id="expenseDate" name="expenseDate" type="date" required />
      </Field>
      <Field label="Note" name="note">
        <Input id="note" name="note" />
      </Field>
    </BaseForm>
  )
}
