"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Teacher } from "@/lib/teacher-types"

type Option = { _id: string; name?: string; code?: string; firstName?: string; lastName?: string; email?: string }
const selectClass = "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-3 focus:ring-ring/20"

function Field({ label, name, children }: { label: string; name: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={name}>{label}</Label>{children}</div>
}

export function TeacherForm({ teacher, users = [], departments }: { teacher?: Teacher; users?: Option[]; departments: Option[] }) {
  const router = useRouter()
  const editing = Boolean(teacher)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const specialization = String(form.get("specialization") ?? "").split(",").map((item) => item.trim()).filter(Boolean)
    const qualifications = String(form.get("qualifications") ?? "").split("\n").map((line) => {
      const [degree, institution, year] = line.split("|").map((item) => item.trim())
      return degree && institution ? { degree, institution, ...(year ? { year: Number(year) } : {}) } : null
    }).filter((item): item is { degree: string; institution: string; year?: number } => Boolean(item))
    const common = {
      departmentId: String(form.get("departmentId")),
      designation: String(form.get("designation")),
      joiningDate: String(form.get("joiningDate")),
      phone: String(form.get("phone") ?? "").trim() || undefined,
      specialization,
      qualifications,
    }
    const payload = editing
      ? { ...common, status: String(form.get("status")) }
      : { ...common, userId: String(form.get("userId")), employeeId: String(form.get("employeeId")) }
    setSaving(true)
    setError("")
    try {
      const response = await fetch(`/api/backend/teachers${editing ? `/${teacher?._id}` : ""}`, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = (await response.json()) as { message: string }
      if (!response.ok) throw new Error(body.message || "Teacher could not be saved")
      router.push("/dashboard/faculty")
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Teacher could not be saved")
    } finally {
      setSaving(false)
    }
  }

  return <form onSubmit={submit} className="space-y-7">
    <div className="grid gap-5 md:grid-cols-2">
      {!editing && <><Field label="User account" name="userId"><select id="userId" name="userId" required defaultValue="" className={selectClass}><option value="" disabled>Select active user</option>{users.map((user) => <option key={user._id} value={user._id}>{user.firstName} {user.lastName} · {user.email}</option>)}</select></Field><Field label="Employee ID" name="employeeId"><Input id="employeeId" name="employeeId" minLength={3} required placeholder="FAC-2026-001" /></Field></>}
      <Field label="Department" name="departmentId"><select id="departmentId" name="departmentId" required defaultValue={teacher?.department._id ?? ""} className={selectClass}><option value="" disabled>Select department</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.code} · {department.name}</option>)}</select></Field>
      <Field label="Designation" name="designation"><select id="designation" name="designation" required defaultValue={teacher?.designation ?? "lecturer"} className={selectClass}>{["lecturer", "assistant_professor", "associate_professor", "professor", "adjunct"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></Field>
      <Field label="Joining date" name="joiningDate"><Input id="joiningDate" name="joiningDate" type="date" required defaultValue={teacher?.joiningDate.slice(0, 10)} /></Field>
      <Field label="Phone" name="phone"><Input id="phone" name="phone" defaultValue={teacher?.phone} /></Field>
      {editing && <Field label="Status" name="status"><select id="status" name="status" defaultValue={teacher?.status} className={selectClass}>{["active", "on_leave", "retired", "resigned", "archived"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></Field>}
    </div>
    <Field label="Specializations (comma separated)" name="specialization"><Input id="specialization" name="specialization" defaultValue={teacher?.specialization.join(", ")} placeholder="Artificial Intelligence, Data Science" /></Field>
    <Field label="Qualifications" name="qualifications"><textarea id="qualifications" name="qualifications" defaultValue={teacher?.qualifications.map((item) => `${item.degree} | ${item.institution}${item.year ? ` | ${item.year}` : ""}`).join("\n")} className="min-h-32 w-full rounded-lg border bg-background p-3 font-mono text-sm outline-none focus:ring-3 focus:ring-ring/20" placeholder={"PhD in Computer Science | University of Dhaka | 2020\nMSc in CSE | BUET | 2015"} /><p className="text-xs text-muted-foreground">One qualification per line: Degree | Institution | Year</p></Field>
    {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
    <div className="flex justify-end border-t pt-6"><Button type="submit" size="lg" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" /> : <Save />}{editing ? "Save changes" : "Create teacher"}</Button></div>
  </form>
}
