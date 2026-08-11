"use client"

import { apiResponseRequest } from "@/lib/http-client"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
function FormBase({
  endpoint,
  method = "POST",
  payload,
  label,
  children,
}: {
  endpoint: string
  method?: string
  payload: (form: FormData) => object
  label: string
  children: React.ReactNode
}) {
  const router = useRouter(),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("")
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    const response = await apiResponseRequest(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(new FormData(event.currentTarget))),
    })
    const body = await response.json()
    setLoading(false)
    if (!response.ok) return setError(body.message || `${label} failed`)
    router.push("/dashboard/library")
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
export function BookForm() {
  return (
    <FormBase
      endpoint={API_ENDPOINTS.library.books}
      label="Create book"
      payload={(form) => ({
        isbn: String(form.get("isbn") ?? "").trim() || undefined,
        title: form.get("title"),
        authors: String(form.get("authors"))
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        publisher: String(form.get("publisher") ?? "").trim() || undefined,
        publicationYear: form.get("publicationYear")
          ? Number(form.get("publicationYear"))
          : undefined,
        edition: String(form.get("edition") ?? "").trim() || undefined,
        categories: String(form.get("categories") ?? "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        language: String(form.get("language") ?? "").trim() || undefined,
        digitalUrl: String(form.get("digitalUrl") ?? "").trim() || undefined,
        description: String(form.get("description") ?? "").trim() || undefined,
      })}
    >
      <Field label="Title" name="title">
        <Input id="title" name="title" required />
      </Field>
      <Field label="Authors (comma separated)" name="authors">
        <Input id="authors" name="authors" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ISBN" name="isbn">
          <Input id="isbn" name="isbn" />
        </Field>
        <Field label="Publisher" name="publisher">
          <Input id="publisher" name="publisher" />
        </Field>
        <Field label="Publication year" name="publicationYear">
          <Input id="publicationYear" name="publicationYear" type="number" min={1000} max={2200} />
        </Field>
        <Field label="Edition" name="edition">
          <Input id="edition" name="edition" />
        </Field>
        <Field label="Categories" name="categories">
          <Input id="categories" name="categories" placeholder="Technology, Computing" />
        </Field>
        <Field label="Language" name="language">
          <Input id="language" name="language" />
        </Field>
      </div>
      <Field label="Digital URL" name="digitalUrl">
        <Input id="digitalUrl" name="digitalUrl" type="url" />
      </Field>
      <Field label="Description" name="description">
        <textarea
          id="description"
          name="description"
          className="min-h-28 w-full rounded-lg border p-3 text-sm"
        />
      </Field>
    </FormBase>
  )
}
type Book = { _id: string; title: string; authors: string[]; isbn?: string }
export function CopyForm({ books }: { books: Book[] }) {
  return (
    <FormBase
      endpoint={API_ENDPOINTS.library.copies}
      label="Register copy"
      payload={(form) => ({
        bookId: form.get("bookId"),
        accessionNumber: form.get("accessionNumber"),
        barcode: String(form.get("barcode") ?? "").trim() || undefined,
        shelfLocation: String(form.get("shelfLocation") ?? "").trim() || undefined,
        condition: form.get("condition"),
      })}
    >
      <Field label="Book" name="bookId">
        <select id="bookId" name="bookId" required defaultValue="" className={selectClass}>
          <option value="" disabled>
            Select title
          </option>
          {books.map((book) => (
            <option key={book._id} value={book._id}>
              {book.title} · {book.authors[0]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Accession number" name="accessionNumber">
        <Input id="accessionNumber" name="accessionNumber" minLength={2} required />
      </Field>
      <Field label="Barcode" name="barcode">
        <Input id="barcode" name="barcode" />
      </Field>
      <Field label="Shelf location" name="shelfLocation">
        <Input id="shelfLocation" name="shelfLocation" />
      </Field>
      <Field label="Condition" name="condition">
        <select id="condition" name="condition" className={selectClass}>
          <option value="new">New</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="damaged">Damaged</option>
        </select>
      </Field>
    </FormBase>
  )
}
type Copy = { _id: string; accessionNumber: string; book: { title: string } }
type User = { _id: string; firstName: string; lastName: string; email: string }
export function IssueForm({ copies, users }: { copies: Copy[]; users: User[] }) {
  return (
    <FormBase
      endpoint={API_ENDPOINTS.library.issue}
      label="Issue book"
      payload={(form) => ({
        copyId: form.get("copyId"),
        borrowerUserId: form.get("borrowerUserId"),
        borrowerType: form.get("borrowerType"),
        note: String(form.get("note") ?? "").trim() || undefined,
      })}
    >
      <Field label="Available copy" name="copyId">
        <select id="copyId" name="copyId" required defaultValue="" className={selectClass}>
          <option value="" disabled>
            Select copy
          </option>
          {copies.map((copy) => (
            <option key={copy._id} value={copy._id}>
              {copy.accessionNumber} · {copy.book.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Borrower type" name="borrowerType">
        <select id="borrowerType" name="borrowerType" className={selectClass}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
      </Field>
      <Field label="Borrower account" name="borrowerUserId">
        <select
          id="borrowerUserId"
          name="borrowerUserId"
          required
          defaultValue=""
          className={selectClass}
        >
          <option value="" disabled>
            Select user
          </option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.firstName} {user.lastName} · {user.email}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Issue note" name="note">
        <Input id="note" name="note" />
      </Field>
    </FormBase>
  )
}
export function PolicyForm({
  borrowerType,
  defaults,
}: {
  borrowerType: "student" | "teacher"
  defaults?: { maxActiveLoans: number; loanDays: number; finePerDayMinor: number; currency: string }
}) {
  return (
    <FormBase
      endpoint={API_ENDPOINTS.library.policies}
      method="PUT"
      label={`Save ${borrowerType} policy`}
      payload={(form) => ({
        borrowerType,
        maxActiveLoans: Number(form.get("maxActiveLoans")),
        loanDays: Number(form.get("loanDays")),
        finePerDayMinor: Math.round(Number(form.get("finePerDay")) * 100),
        currency: form.get("currency"),
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Maximum active loans" name="maxActiveLoans">
          <Input
            id="maxActiveLoans"
            name="maxActiveLoans"
            type="number"
            min={1}
            max={100}
            required
            defaultValue={defaults?.maxActiveLoans ?? 5}
          />
        </Field>
        <Field label="Loan days" name="loanDays">
          <Input
            id="loanDays"
            name="loanDays"
            type="number"
            min={1}
            max={365}
            required
            defaultValue={defaults?.loanDays ?? 14}
          />
        </Field>
        <Field label="Fine per day" name="finePerDay">
          <Input
            id="finePerDay"
            name="finePerDay"
            type="number"
            min={0}
            step={0.01}
            required
            defaultValue={(defaults?.finePerDayMinor ?? 0) / 100}
          />
        </Field>
        <Field label="Currency" name="currency">
          <Input
            id="currency"
            name="currency"
            minLength={3}
            maxLength={3}
            required
            defaultValue={defaults?.currency ?? "BDT"}
          />
        </Field>
      </div>
    </FormBase>
  )
}
