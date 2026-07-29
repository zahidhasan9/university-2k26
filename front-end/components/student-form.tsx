"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Student } from "@/lib/student-types"

type Option = { _id: string; name?: string; code?: string; email?: string; firstName?: string; lastName?: string; academicYear?: string }

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"

function optional(form: FormData, name: string) {
  const item = String(form.get(name) ?? "").trim()
  return item || undefined
}

function GroupTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b pb-3">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function Field({ label, name, children }: { label: string; name: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
    </div>
  )
}

export function StudentForm({
  student,
  users = [],
  programs,
  semesters = [],
}: {
  student?: Student
  users?: Option[]
  programs: Option[]
  semesters?: Option[]
}) {
  const router = useRouter()
  const editing = Boolean(student)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const guardian = {
      name: optional(form, "guardianName"),
      relationship: optional(form, "guardianRelationship"),
      phone: optional(form, "guardianPhone"),
      email: optional(form, "guardianEmail"),
    }
    const address = {
      line1: optional(form, "line1"),
      line2: optional(form, "line2"),
      city: optional(form, "city"),
      state: optional(form, "state"),
      country: optional(form, "country"),
      postalCode: optional(form, "postalCode"),
    }
    const payload = editing
      ? {
          programId: String(form.get("programId")),
          currentSemesterNumber: Number(form.get("currentSemesterNumber")),
          dateOfBirth: optional(form, "dateOfBirth"),
          gender: optional(form, "gender"),
          phone: optional(form, "phone"),
          status: String(form.get("status")),
          guardian,
          address,
        }
      : {
          userId: String(form.get("userId")),
          studentId: String(form.get("studentId")),
          programId: String(form.get("programId")),
          admissionSemesterId: String(form.get("admissionSemesterId")),
          dateOfBirth: optional(form, "dateOfBirth"),
          gender: optional(form, "gender"),
          phone: optional(form, "phone"),
          guardian,
          address,
        }

    setSaving(true)
    setError("")
    try {
      const response = await fetch(
        editing ? `/api/backend/students/${student?._id}` : "/api/backend/students",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )
      const body = (await response.json()) as {
        message: string
        data?: { student?: { _id: string } }
      }
      if (!response.ok) throw new Error(body.message || "Student could not be saved")
      const id = student?._id ?? body.data?.student?._id
      router.push(id ? `/dashboard/students/${id}` : "/dashboard/students")
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Student could not be saved")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {!editing && (
        <section className="space-y-5">
          <GroupTitle title="Account & identity" description="Connect an existing active user account to a student profile." />
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="User account" name="userId">
              <select id="userId" name="userId" className={selectClass} required defaultValue="">
                <option value="" disabled>Select a user</option>
                {users.map((user) => <option key={user._id} value={user._id}>{user.firstName} {user.lastName} · {user.email}</option>)}
              </select>
            </Field>
            <Field label="Student ID" name="studentId">
              <Input id="studentId" name="studentId" placeholder="e.g. CSE-2026-001" minLength={3} required />
            </Field>
          </div>
        </section>
      )}

      <section className="space-y-5">
        <GroupTitle title="Academic information" description="Set the program, admission term, and current academic standing." />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Program" name="programId">
            <select id="programId" name="programId" className={selectClass} required defaultValue={student?.program._id ?? ""}>
              <option value="" disabled>Select a program</option>
              {programs.map((program) => <option key={program._id} value={program._id}>{program.code} · {program.name}</option>)}
            </select>
          </Field>
          {editing ? (
            <Field label="Current semester" name="currentSemesterNumber">
              <Input id="currentSemesterNumber" name="currentSemesterNumber" type="number" min={1} max={30} required defaultValue={student?.currentSemesterNumber ?? 1} />
            </Field>
          ) : (
            <Field label="Admission semester" name="admissionSemesterId">
              <select id="admissionSemesterId" name="admissionSemesterId" className={selectClass} required defaultValue="">
                <option value="" disabled>Select a semester</option>
                {semesters.map((semester) => <option key={semester._id} value={semester._id}>{semester.name} · {semester.academicYear}</option>)}
              </select>
            </Field>
          )}
          {editing && (
            <Field label="Student status" name="status">
              <select id="status" name="status" className={selectClass} required defaultValue={student?.status}>
                <option value="active">Active</option>
                <option value="graduated">Graduated</option>
                <option value="suspended">Suspended</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
          )}
        </div>
      </section>

      <section className="space-y-5">
        <GroupTitle title="Personal information" description="Add optional contact and demographic details." />
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Date of birth" name="dateOfBirth">
            <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={student?.dateOfBirth?.slice(0, 10)} />
          </Field>
          <Field label="Gender" name="gender">
            <select id="gender" name="gender" className={selectClass} defaultValue={student?.gender ?? ""}>
              <option value="">Not specified</option>
              <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </Field>
          <Field label="Phone" name="phone"><Input id="phone" name="phone" defaultValue={student?.phone} placeholder="+880..." /></Field>
        </div>
      </section>

      <section className="space-y-5">
        <GroupTitle title="Guardian" description="Emergency contact and guardian information." />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Guardian name" name="guardianName"><Input id="guardianName" name="guardianName" defaultValue={student?.guardian?.name} /></Field>
          <Field label="Relationship" name="guardianRelationship"><Input id="guardianRelationship" name="guardianRelationship" defaultValue={student?.guardian?.relationship} /></Field>
          <Field label="Guardian phone" name="guardianPhone"><Input id="guardianPhone" name="guardianPhone" defaultValue={student?.guardian?.phone} /></Field>
          <Field label="Guardian email" name="guardianEmail"><Input id="guardianEmail" name="guardianEmail" type="email" defaultValue={student?.guardian?.email} /></Field>
        </div>
      </section>

      <section className="space-y-5">
        <GroupTitle title="Address" description="Current residential or mailing address." />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Address line 1" name="line1"><Input id="line1" name="line1" defaultValue={student?.address?.line1} /></Field>
          <Field label="Address line 2" name="line2"><Input id="line2" name="line2" defaultValue={student?.address?.line2} /></Field>
          <Field label="City" name="city"><Input id="city" name="city" defaultValue={student?.address?.city} /></Field>
          <Field label="State / division" name="state"><Input id="state" name="state" defaultValue={student?.address?.state} /></Field>
          <Field label="Country" name="country"><Input id="country" name="country" defaultValue={student?.address?.country} /></Field>
          <Field label="Postal code" name="postalCode"><Input id="postalCode" name="postalCode" defaultValue={student?.address?.postalCode} /></Field>
        </div>
      </section>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      <div className="flex justify-end border-t pt-6">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
          {editing ? "Save changes" : "Create student"}
        </Button>
      </div>
    </form>
  )
}
