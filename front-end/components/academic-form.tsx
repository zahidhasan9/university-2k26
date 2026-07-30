"use client"

import { apiResponseRequest } from "@/lib/http-client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AcademicEntity, AcademicItem } from "@/lib/academic-types"

type Option = { _id: string; name?: string; title?: string; code: string }
type Options = Partial<Record<"universities" | "faculties" | "departments" | "programs", Option[]>>
const selectClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"

function optional(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim()
  return value || undefined
}

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

function ParentSelect({
  name,
  label,
  items,
  defaultValue,
}: {
  name: string
  label: string
  items: Option[]
  defaultValue?: string
}) {
  return (
    <Field label={label} name={name}>
      <select
        id={name}
        name={name}
        className={selectClass}
        required
        defaultValue={defaultValue ?? ""}
      >
        <option value="" disabled>
          Select {label.toLowerCase()}
        </option>
        {items.map((item) => (
          <option key={item._id} value={item._id}>
            {item.code} · {item.name ?? item.title}
          </option>
        ))}
      </select>
    </Field>
  )
}

function dateValue(value?: string) {
  return value?.slice(0, 10)
}

export function AcademicForm({
  entity,
  item,
  options,
}: {
  entity: AcademicEntity
  item?: AcademicItem
  options: Options
}) {
  const router = useRouter()
  const editing = Boolean(item)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const base = {
      name: optional(form, "name"),
      code: optional(form, "code"),
      description: optional(form, "description"),
    }
    let payload: Record<string, unknown> = base
    if (entity === "universities") {
      payload = {
        ...base,
        shortName: optional(form, "shortName"),
        email: optional(form, "email"),
        phone: optional(form, "phone"),
        website: optional(form, "website"),
        address: {
          line1: optional(form, "line1"),
          city: optional(form, "city"),
          state: optional(form, "state"),
          country: optional(form, "country"),
          postalCode: optional(form, "postalCode"),
        },
      }
    } else if (entity === "faculties")
      payload = { ...base, universityId: String(form.get("universityId")) }
    else if (entity === "departments")
      payload = { ...base, facultyId: String(form.get("facultyId")) }
    else if (entity === "programs")
      payload = {
        ...base,
        departmentId: String(form.get("departmentId")),
        degreeType: String(form.get("degreeType")),
        durationYears: Number(form.get("durationYears")),
        totalCredits: Number(form.get("totalCredits")),
      }
    else if (entity === "courses")
      payload = {
        code: base.code,
        title: optional(form, "title"),
        description: base.description,
        programId: String(form.get("programId")),
        credits: Number(form.get("credits")),
        courseType: String(form.get("courseType")),
        ...(!editing ? { prerequisiteIds: [] } : {}),
      }
    else
      payload = {
        name: base.name,
        ...(!editing ? { code: base.code, universityId: String(form.get("universityId")) } : {}),
        academicYear: String(form.get("academicYear")),
        term: String(form.get("term")),
        startsAt: String(form.get("startsAt")),
        endsAt: String(form.get("endsAt")),
        registrationStartsAt: String(form.get("registrationStartsAt")),
        registrationEndsAt: String(form.get("registrationEndsAt")),
        ...(editing ? { status: String(form.get("status")) } : {}),
      }
    if (editing && entity !== "semesters") payload.status = String(form.get("status"))

    setSaving(true)
    setError("")
    try {
      const response = await apiResponseRequest(`/${entity}${editing ? `/${item?._id}` : ""}`, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = (await response.json()) as { message: string }
      if (!response.ok) throw new Error(body.message || "Record could not be saved")
      router.push(`/dashboard/academics/${entity}`)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Record could not be saved")
    } finally {
      setSaving(false)
    }
  }

  const parentId =
    item?.program?._id ?? item?.department?._id ?? item?.faculty?._id ?? item?.university?._id

  return (
    <form onSubmit={submit} className="space-y-7">
      <div className="grid gap-5 md:grid-cols-2">
        {entity === "faculties" && (
          <ParentSelect
            name="universityId"
            label="University"
            items={options.universities ?? []}
            defaultValue={parentId}
          />
        )}
        {entity === "departments" && (
          <ParentSelect
            name="facultyId"
            label="Faculty"
            items={options.faculties ?? []}
            defaultValue={parentId}
          />
        )}
        {entity === "programs" && (
          <ParentSelect
            name="departmentId"
            label="Department"
            items={options.departments ?? []}
            defaultValue={parentId}
          />
        )}
        {entity === "courses" && (
          <ParentSelect
            name="programId"
            label="Program"
            items={options.programs ?? []}
            defaultValue={parentId}
          />
        )}
        {entity === "semesters" && !editing && (
          <ParentSelect
            name="universityId"
            label="University"
            items={options.universities ?? []}
            defaultValue={parentId}
          />
        )}
        <Field
          label={
            entity === "courses"
              ? "Course title"
              : `${entity === "semesters" ? "Semester" : "Record"} name`
          }
          name={entity === "courses" ? "title" : "name"}
        >
          <Input
            id={entity === "courses" ? "title" : "name"}
            name={entity === "courses" ? "title" : "name"}
            minLength={2}
            required
            defaultValue={entity === "courses" ? item?.title : item?.name}
          />
        </Field>
        <Field label="Code" name="code">
          <Input
            id="code"
            name="code"
            minLength={2}
            required={!editing || entity !== "semesters"}
            disabled={editing && entity === "semesters"}
            defaultValue={item?.code}
          />
        </Field>
        {entity === "universities" && (
          <>
            <Field label="Short name" name="shortName">
              <Input id="shortName" name="shortName" defaultValue={item?.shortName} />
            </Field>
            <Field label="Email" name="email">
              <Input id="email" name="email" type="email" defaultValue={item?.email} />
            </Field>
            <Field label="Phone" name="phone">
              <Input id="phone" name="phone" defaultValue={item?.phone} />
            </Field>
            <Field label="Website" name="website">
              <Input id="website" name="website" type="url" defaultValue={item?.website} />
            </Field>
            <Field label="Address" name="line1">
              <Input id="line1" name="line1" defaultValue={item?.address?.line1} />
            </Field>
            <Field label="City" name="city">
              <Input id="city" name="city" defaultValue={item?.address?.city} />
            </Field>
            <Field label="State / division" name="state">
              <Input id="state" name="state" defaultValue={item?.address?.state} />
            </Field>
            <Field label="Country" name="country">
              <Input id="country" name="country" defaultValue={item?.address?.country} />
            </Field>
            <Field label="Postal code" name="postalCode">
              <Input id="postalCode" name="postalCode" defaultValue={item?.address?.postalCode} />
            </Field>
          </>
        )}
        {entity === "programs" && (
          <>
            <Field label="Degree type" name="degreeType">
              <select
                id="degreeType"
                name="degreeType"
                className={selectClass}
                required
                defaultValue={item?.degreeType ?? "bachelor"}
              >
                {["certificate", "diploma", "bachelor", "master", "doctorate"].map((value) => (
                  <option key={value} value={value} className="capitalize">
                    {value}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Duration (years)" name="durationYears">
              <Input
                id="durationYears"
                name="durationYears"
                type="number"
                min={0.5}
                max={10}
                step={0.5}
                required
                defaultValue={item?.durationYears ?? 4}
              />
            </Field>
            <Field label="Total credits" name="totalCredits">
              <Input
                id="totalCredits"
                name="totalCredits"
                type="number"
                min={1}
                max={400}
                required
                defaultValue={item?.totalCredits}
              />
            </Field>
          </>
        )}
        {entity === "courses" && (
          <>
            <Field label="Credits" name="credits">
              <Input
                id="credits"
                name="credits"
                type="number"
                min={0}
                max={20}
                step={0.5}
                required
                defaultValue={item?.credits}
              />
            </Field>
            <Field label="Course type" name="courseType">
              <select
                id="courseType"
                name="courseType"
                className={selectClass}
                required
                defaultValue={item?.courseType ?? "core"}
              >
                {["core", "elective", "general", "lab", "thesis"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
        {entity === "semesters" && (
          <>
            <Field label="Academic year" name="academicYear">
              <Input
                id="academicYear"
                name="academicYear"
                minLength={4}
                required
                defaultValue={item?.academicYear}
                placeholder="2026-2027"
              />
            </Field>
            <Field label="Term" name="term">
              <select
                id="term"
                name="term"
                className={selectClass}
                required
                defaultValue={item?.term ?? "spring"}
              >
                {["spring", "summer", "fall", "winter", "annual"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Semester starts" name="startsAt">
              <Input
                id="startsAt"
                name="startsAt"
                type="date"
                required
                defaultValue={dateValue(item?.startsAt)}
              />
            </Field>
            <Field label="Semester ends" name="endsAt">
              <Input
                id="endsAt"
                name="endsAt"
                type="date"
                required
                defaultValue={dateValue(item?.endsAt)}
              />
            </Field>
            <Field label="Registration starts" name="registrationStartsAt">
              <Input
                id="registrationStartsAt"
                name="registrationStartsAt"
                type="date"
                required
                defaultValue={dateValue(item?.registrationStartsAt)}
              />
            </Field>
            <Field label="Registration ends" name="registrationEndsAt">
              <Input
                id="registrationEndsAt"
                name="registrationEndsAt"
                type="date"
                required
                defaultValue={dateValue(item?.registrationEndsAt)}
              />
            </Field>
          </>
        )}
        {editing && (
          <Field label="Status" name="status">
            <select id="status" name="status" className={selectClass} defaultValue={item?.status}>
              {entity === "semesters" ? (
                ["planned", "registration", "ongoing", "completed", "archived"].map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </option>
                ))
              ) : (
                <>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </>
              )}
            </select>
          </Field>
        )}
      </div>
      {!["universities", "semesters"].includes(entity) && (
        <Field label="Description" name="description">
          <textarea
            id="description"
            name="description"
            maxLength={2000}
            defaultValue={item?.description}
            className="min-h-28 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:ring-3 focus:ring-ring/20"
          />
        </Field>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end border-t pt-6">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
          {editing ? "Save changes" : `Create ${entity.slice(0, -1)}`}
        </Button>
      </div>
    </form>
  )
}
