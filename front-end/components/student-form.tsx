"use client"

import { apiRequest, apiResponseRequest } from "@/lib/http-client"
import { API_ENDPOINTS } from "@/lib/api-endpoints"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import {
  FileCheck2,
  GraduationCap,
  LoaderCircle,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageCropDialog } from "@/components/image-crop-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Student } from "@/lib/student-types"

type Option = {
  _id: string
  name?: string
  code?: string
  email?: string
  firstName?: string
  lastName?: string
  academicYear?: string
}

type BatchOption = {
  _id: string
  code: string
  name: string
  curriculumVersion: string
  program: { _id: string } | string
}
type SectionOption = {
  _id: string
  code: string
  name: string
  capacity: number
  enrolledCount: number
  academicBatch: { _id: string } | string
}

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"

const requiredStudentDocuments = [
  "Student photo",
  "Birth certificate / NID",
  "SSC certificate",
  "HSC certificate",
  "Academic transcripts",
  "Admission form",
  "Guardian identification",
  "Migration / transfer certificate",
] as const

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
    <div className="min-w-0 space-y-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
    </div>
  )
}

export function StudentForm({
  student,
  programs,
  batches,
  sections,
  waivers = [],
  semesters = [],
}: {
  student?: Student
  programs: Option[]
  batches: BatchOption[]
  sections: SectionOption[]
  waivers?: Array<{ _id: string; name: string; type: "percentage" | "fixed"; value: number; currency: string; appliesTo: "tuition" | "all"; validFrom: string; validUntil: string; status: string }>
  semesters?: Option[]
}) {
  const router = useRouter()
  const editing = Boolean(student)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [programId, setProgramId] = useState(student?.program._id ?? "")
  const [batchId, setBatchId] = useState(student?.academicBatch?._id ?? "")
  const [sectionId, setSectionId] = useState(student?.academicSection?._id ?? "")
  const [activeTab, setActiveTab] = useState("academic")
  const [education, setEducation] = useState(student?.previousEducation ?? [])
  const [documents, setDocuments] = useState(() => {
    const existing = student?.documents ?? []
    return [
      ...requiredStudentDocuments.map(
        (type) =>
          existing.find((document) => document.type === type) ?? {
            type,
            url: "",
            status: "pending" as const,
          },
      ),
      ...existing.filter(
        (document) =>
          !requiredStudentDocuments.includes(
            document.type as (typeof requiredStudentDocuments)[number],
          ),
      ),
    ]
  })
  const [uploadingDocument, setUploadingDocument] = useState<number | null>(null)
  const [uploadMessage, setUploadMessage] = useState("")
  const [avatarPreview, setAvatarPreview] = useState(student?.user.avatarUrl ?? "")
  const [cropSource, setCropSource] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const availableBatches = batches.filter(
    (batch) =>
      (typeof batch.program === "string" ? batch.program : batch.program._id) === programId,
  )
  const availableSections = sections.filter(
    (section) =>
      (typeof section.academicBatch === "string"
        ? section.academicBatch
        : section.academicBatch._id) === batchId,
  )

  async function uploadStudentDocument(file: File, index: number) {
    setUploadingDocument(index)
    setUploadMessage("")
    setError("")
    try {
      const data = new FormData()
      data.append("file", file)
      const response = await apiRequest<{
        document: { url: string; storage: "local" | "cloudinary" }
      }>(API_ENDPOINTS.uploads.studentDocument, { method: "POST", data })
      setDocuments((current) =>
        current.map((document, position) =>
          position === index
            ? { ...document, url: response.data.document.url, status: "pending" }
            : document,
        ),
      )
      setUploadMessage(
        `${documents[index]?.type || "Document"} uploaded to ${response.data.document.storage} storage.`,
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Document upload failed")
    } finally {
      setUploadingDocument(null)
    }
  }

  function closeCropper() {
    if (cropSource) URL.revokeObjectURL(cropSource)
    setCropSource(null)
  }

  async function uploadStudentAvatar(blob: Blob) {
    setUploadingAvatar(true)
    setError("")
    try {
      const data = new FormData()
      data.append("image", new File([blob], "student-profile.webp", { type: "image/webp" }))
      const response = await apiRequest<{
        image: { url: string; storage: "local" | "cloudinary" }
      }>(API_ENDPOINTS.uploads.studentProfileImage, { method: "POST", data })
      setAvatarPreview(response.data.image.url)
      setUploadMessage(
        `Profile picture uploaded to ${response.data.image.storage} storage. Save changes to assign it to the student.`,
      )
    } finally {
      setUploadingAvatar(false)
    }
  }

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
    const permanentAddress = {
      line1: optional(form, "permanentLine1"),
      line2: optional(form, "permanentLine2"),
      city: optional(form, "permanentCity"),
      state: optional(form, "permanentState"),
      country: optional(form, "permanentCountry"),
      postalCode: optional(form, "permanentPostalCode"),
    }
    const professionalProfile = {
      registrationNumber: optional(form, "registrationNumber"),
      admissionDate: optional(form, "admissionDate"),
      admissionType: optional(form, "admissionType"),
      academicSession: optional(form, "academicSession"),
      campus: optional(form, "campus"),
      studentCategory: optional(form, "studentCategory"),
      banglaName: optional(form, "banglaName"),
      nationality: optional(form, "nationality"),
      religion: optional(form, "religion"),
      bloodGroup: optional(form, "bloodGroup"),
      maritalStatus: optional(form, "maritalStatus"),
      nidNumber: optional(form, "nidNumber"),
      birthCertificateNumber: optional(form, "birthCertificateNumber"),
      passportNumber: optional(form, "passportNumber"),
      alternatePhone: optional(form, "alternatePhone"),
      universityEmail: optional(form, "universityEmail"),
      avatarUrl: optional(form, "avatarUrl"),
      permanentAddress,
      parents: {
        father: {
          name: optional(form, "fatherName"),
          profession: optional(form, "fatherProfession"),
          phone: optional(form, "fatherPhone"),
        },
        mother: {
          name: optional(form, "motherName"),
          profession: optional(form, "motherProfession"),
          phone: optional(form, "motherPhone"),
        },
      },
      previousEducation: education,
      documents: documents.filter((document) => document.type.trim() && document.url.trim()),
      residentialStatus: optional(form, "residentialStatus"),
      hostelRequired: form.get("hostelRequired") === "on",
      transportRequired: form.get("transportRequired") === "on",
      administrativeNotes: optional(form, "administrativeNotes"),
    }
    const payload = editing
      ? {
          firstName: String(form.get("firstName")),
          lastName: String(form.get("lastName")),
          email: optional(form, "email"),
          academicBatchId: String(form.get("academicBatchId")),
          academicSectionId: String(form.get("academicSectionId")),
          programId: String(form.get("programId")),
          currentSemesterNumber: Number(form.get("currentSemesterNumber")),
          dateOfBirth: optional(form, "dateOfBirth"),
          gender: optional(form, "gender"),
          phone: optional(form, "phone"),
          status: String(form.get("status")),
          guardian,
          address,
          ...professionalProfile,
        }
      : {
          firstName: String(form.get("firstName")),
          lastName: String(form.get("lastName")),
          temporaryPassword: String(form.get("temporaryPassword")),
          studentId: String(form.get("studentId")),
          academicBatchId: String(form.get("academicBatchId")),
          academicSectionId: String(form.get("academicSectionId")),
          programId: String(form.get("programId")),
          admissionSemesterId: String(form.get("admissionSemesterId")),
          dateOfBirth: optional(form, "dateOfBirth"),
          gender: optional(form, "gender"),
          phone: optional(form, "phone"),
          guardian,
          address,
          ...professionalProfile,
        }

    setSaving(true)
    setError("")
    try {
      const response = await apiResponseRequest(
        editing ? `/students/${student?._id}` : "/students",
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
    <form onSubmit={submit} className="min-w-0 space-y-8 overflow-hidden">
      <ImageCropDialog
        source={cropSource}
        onCancel={closeCropper}
        onConfirm={async (blob) => {
          await uploadStudentAvatar(blob)
          closeCropper()
        }}
      />
      <nav className="flex max-w-full gap-1 overflow-x-auto rounded-xl border bg-muted/30 p-1 [scrollbar-width:thin]">
        {[
          { key: "academic", label: "Academic", icon: GraduationCap },
          { key: "personal", label: "Personal", icon: UserRound },
          { key: "family", label: "Family", icon: ShieldCheck },
          { key: "education", label: "Education", icon: GraduationCap },
          { key: "documents", label: "Documents", icon: FileCheck2 },
          { key: "administrative", label: "Administrative", icon: ShieldCheck },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium sm:px-4 ${activeTab === key ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>
      <section className={activeTab === "academic" ? "space-y-5" : "hidden"}>
        <GroupTitle
          title="Account & identity"
          description={
            editing
              ? "Only an administrator can change identity details or a claimed email."
              : "The student will sign in with this Student ID and temporary password."
          }
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="First name" name="firstName">
            <Input
              id="firstName"
              name="firstName"
              defaultValue={student?.user.firstName}
              required
            />
          </Field>
          <Field label="Last name" name="lastName">
            <Input id="lastName" name="lastName" defaultValue={student?.user.lastName} required />
          </Field>
          {!editing && (
            <Field label="Student ID" name="studentId">
              <Input
                id="studentId"
                name="studentId"
                placeholder="e.g. CSE-2026-001"
                minLength={3}
                required
              />
            </Field>
          )}
          {editing ? (
            <Field label="Student email" name="email">
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={
                  student?.user.email.endsWith("@pending.unisphere.local")
                    ? ""
                    : student?.user.email
                }
              />
            </Field>
          ) : (
            <Field label="Temporary password" name="temporaryPassword">
              <Input
                id="temporaryPassword"
                name="temporaryPassword"
                type="password"
                minLength={12}
                autoComplete="new-password"
                placeholder="Minimum 12 characters"
                required
              />
            </Field>
          )}
        </div>
      </section>

      <section className={activeTab === "academic" ? "space-y-5" : "hidden"}>
        <GroupTitle
          title="Academic information"
          description="Set the program, admission term, and current academic standing."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Program" name="programId">
            <select
              id="programId"
              name="programId"
              className={selectClass}
              required
              value={programId}
              onChange={(event) => {
                setProgramId(event.target.value)
                setBatchId("")
                setSectionId("")
              }}
            >
              <option value="" disabled>
                Select a program
              </option>
              {programs.map((program) => (
                <option key={program._id} value={program._id}>
                  {program.code} · {program.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Academic batch" name="academicBatchId">
            <select
              key={programId}
              id="academicBatchId"
              name="academicBatchId"
              className={selectClass}
              required
              value={batchId}
              onChange={(event) => {
                setBatchId(event.target.value)
                setSectionId("")
              }}
            >
              <option value="" disabled>
                {programId ? "Select an active batch" : "Select a program first"}
              </option>
              {availableBatches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.code} · {batch.name} ({batch.curriculumVersion})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Section" name="academicSectionId">
            <select
              id="academicSectionId"
              name="academicSectionId"
              className={selectClass}
              required
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
            >
              <option value="" disabled>
                {batchId ? "Select an available section" : "Select a batch first"}
              </option>
              {availableSections.map((section) => (
                <option
                  key={section._id}
                  value={section._id}
                  disabled={
                    section.enrolledCount >= section.capacity &&
                    section._id !== student?.academicSection?._id
                  }
                >
                  {section.code} · {section.name} ({section.capacity - section.enrolledCount} seats
                  left)
                </option>
              ))}
            </select>
          </Field>
          {editing ? (
            <Field label="Current curriculum semester" name="currentSemesterNumber">
              <Input
                id="currentSemesterNumber"
                name="currentSemesterNumber"
                type="number"
                min={1}
                required
                defaultValue={student?.currentSemesterNumber ?? 1}
              />
            </Field>
          ) : (
            <Field label="Admission academic term" name="admissionSemesterId">
              <select
                id="admissionSemesterId"
                name="admissionSemesterId"
                className={selectClass}
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Select a semester
                </option>
                {semesters.map((semester) => (
                  <option key={semester._id} value={semester._id}>
                    {semester.name} · {semester.academicYear}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {editing && (
            <Field label="Student status" name="status">
              <select
                id="status"
                name="status"
                className={selectClass}
                required
                defaultValue={student?.status}
              >
                <option value="active">Active</option>
                <option value="graduated">Graduated</option>
                <option value="suspended">Suspended</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
          )}
          <Field label="Registration number" name="registrationNumber">
            <Input
              id="registrationNumber"
              name="registrationNumber"
              defaultValue={student?.registrationNumber}
            />
          </Field>
          <Field label="Admission date" name="admissionDate">
            <Input
              id="admissionDate"
              name="admissionDate"
              type="date"
              defaultValue={student?.admissionDate?.slice(0, 10)}
            />
          </Field>
          <Field label="Admission type" name="admissionType">
            <select
              id="admissionType"
              name="admissionType"
              className={selectClass}
              defaultValue={student?.admissionType ?? "regular"}
            >
              <option value="regular">Regular</option>
              <option value="transfer">Transfer</option>
              <option value="credit_transfer">Credit transfer</option>
            </select>
          </Field>
          <Field label="Academic session" name="academicSession">
            <Input
              id="academicSession"
              name="academicSession"
              placeholder="2026-27"
              defaultValue={student?.academicSession}
            />
          </Field>
          <Field label="Campus" name="campus">
            <Input id="campus" name="campus" defaultValue={student?.campus} />
          </Field>
          <Field label="Student category" name="studentCategory">
            <select
              id="studentCategory"
              name="studentCategory"
              className={selectClass}
              defaultValue={student?.studentCategory ?? "regular"}
            >
              <option value="regular">Regular</option>
              <option value="improvement">Improvement</option>
              <option value="retake">Retake</option>
            </select>
          </Field>
        </div>
      </section>

      <section className={activeTab === "personal" ? "space-y-5" : "hidden"}>
        <GroupTitle
          title="Personal information"
          description="Add optional contact and demographic details."
        />
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_15.5rem] xl:items-start">
          <div className="grid min-w-0 gap-5 sm:grid-cols-2">
            <Field label="Date of birth" name="dateOfBirth">
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                defaultValue={student?.dateOfBirth?.slice(0, 10)}
              />
            </Field>
            <Field label="Gender" name="gender">
              <select
                id="gender"
                name="gender"
                className={selectClass}
                defaultValue={student?.gender ?? ""}
              >
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </Field>
            <Field label="Phone" name="phone">
              <Input id="phone" name="phone" defaultValue={student?.phone} placeholder="+880..." />
            </Field>
            <Field label="Bangla name" name="banglaName">
              <Input id="banglaName" name="banglaName" defaultValue={student?.banglaName} />
            </Field>
            <Field label="Nationality" name="nationality">
              <Input id="nationality" name="nationality" defaultValue={student?.nationality} />
            </Field>
            <Field label="Religion (optional)" name="religion">
              <Input id="religion" name="religion" defaultValue={student?.religion} />
            </Field>
            <Field label="Blood group" name="bloodGroup">
              <select
                id="bloodGroup"
                name="bloodGroup"
                className={selectClass}
                defaultValue={student?.bloodGroup ?? ""}
              >
                <option value="">Not specified</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Marital status" name="maritalStatus">
              <select
                id="maritalStatus"
                name="maritalStatus"
                className={selectClass}
                defaultValue={student?.maritalStatus ?? ""}
              >
                <option value="">Not specified</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="NID number" name="nidNumber">
              <Input id="nidNumber" name="nidNumber" defaultValue={student?.nidNumber} />
            </Field>
            <Field label="Birth certificate" name="birthCertificateNumber">
              <Input
                id="birthCertificateNumber"
                name="birthCertificateNumber"
                defaultValue={student?.birthCertificateNumber}
              />
            </Field>
            <Field label="Passport number" name="passportNumber">
              <Input
                id="passportNumber"
                name="passportNumber"
                defaultValue={student?.passportNumber}
              />
            </Field>
            <Field label="Alternative phone" name="alternatePhone">
              <Input
                id="alternatePhone"
                name="alternatePhone"
                defaultValue={student?.alternatePhone}
              />
            </Field>
            <Field label="University email" name="universityEmail">
              <Input
                id="universityEmail"
                name="universityEmail"
                type="email"
                defaultValue={student?.universityEmail}
              />
            </Field>
          </div>
          <aside className="min-w-0 xl:w-[15.5rem] ">
            <div className="rounded-xl border bg-background p-2">
              <div className="border-b px-3.5 py-2.5">
                <h3 className="text-sm font-semibold">Student photograph</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Official profile image</p>
              </div>
              <div className="space-y-3 p-3.5 pt-3">
                <div className="text-center">
                  <div className="rounded-lg border border-dashed bg-muted/20 p-3">
                    <Avatar className="mx-auto size-24 border bg-background">
                      <AvatarImage src={avatarPreview} alt="Student profile" />
                      <AvatarFallback className="bg-muted text-lg font-semibold text-muted-foreground">
                        {student ? `${student.user.firstName[0]}${student.user.lastName[0]}` : "ST"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    1:1 ratio · clear front-facing photo
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="studentProfileFile"
                      className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50"
                    >
                      {uploadingAvatar ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Upload className="size-4" />
                      )}
                      {uploadingAvatar ? "Uploading…" : "Choose & crop image"}
                    </label>
                    <input
                      id="studentProfileFile"
                      type="file"
                      className="sr-only"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={uploadingAvatar}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) setCropSource(URL.createObjectURL(file))
                        event.target.value = ""
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl" className="text-xs">
                      Or paste image link
                    </Label>
                    <Input
                      id="avatarUrl"
                      name="avatarUrl"
                      type="url"
                      className="text-xs"
                      placeholder="https://example.com/photo.jpg"
                      value={avatarPreview}
                      onChange={(event) => setAvatarPreview(event.target.value)}
                    />
                  </div>
                </div>
                <p className="text-[11px] leading-4 text-muted-foreground">
                  JPEG, PNG, WebP or GIF. Reposition and crop before upload.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className={activeTab === "family" ? "space-y-5" : "hidden"}>
        <GroupTitle title="Guardian" description="Emergency contact and guardian information." />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Guardian name" name="guardianName">
            <Input id="guardianName" name="guardianName" defaultValue={student?.guardian?.name} />
          </Field>
          <Field label="Relationship" name="guardianRelationship">
            <Input
              id="guardianRelationship"
              name="guardianRelationship"
              defaultValue={student?.guardian?.relationship}
            />
          </Field>
          <Field label="Guardian phone" name="guardianPhone">
            <Input
              id="guardianPhone"
              name="guardianPhone"
              defaultValue={student?.guardian?.phone}
            />
          </Field>
          <Field label="Guardian email" name="guardianEmail">
            <Input
              id="guardianEmail"
              name="guardianEmail"
              type="email"
              defaultValue={student?.guardian?.email}
            />
          </Field>
          <Field label="Father's name" name="fatherName">
            <Input
              id="fatherName"
              name="fatherName"
              defaultValue={student?.parents?.father?.name}
            />
          </Field>
          <Field label="Father's profession" name="fatherProfession">
            <Input
              id="fatherProfession"
              name="fatherProfession"
              defaultValue={student?.parents?.father?.profession}
            />
          </Field>
          <Field label="Father's phone" name="fatherPhone">
            <Input
              id="fatherPhone"
              name="fatherPhone"
              defaultValue={student?.parents?.father?.phone}
            />
          </Field>
          <Field label="Mother's name" name="motherName">
            <Input
              id="motherName"
              name="motherName"
              defaultValue={student?.parents?.mother?.name}
            />
          </Field>
          <Field label="Mother's profession" name="motherProfession">
            <Input
              id="motherProfession"
              name="motherProfession"
              defaultValue={student?.parents?.mother?.profession}
            />
          </Field>
          <Field label="Mother's phone" name="motherPhone">
            <Input
              id="motherPhone"
              name="motherPhone"
              defaultValue={student?.parents?.mother?.phone}
            />
          </Field>
        </div>
      </section>

      <section className={activeTab === "personal" ? "space-y-5" : "hidden"}>
        <GroupTitle title="Address" description="Current residential or mailing address." />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Address line 1" name="line1">
            <Input id="line1" name="line1" defaultValue={student?.address?.line1} />
          </Field>
          <Field label="Address line 2" name="line2">
            <Input id="line2" name="line2" defaultValue={student?.address?.line2} />
          </Field>
          <Field label="City" name="city">
            <Input id="city" name="city" defaultValue={student?.address?.city} />
          </Field>
          <Field label="State / division" name="state">
            <Input id="state" name="state" defaultValue={student?.address?.state} />
          </Field>
          <Field label="Country" name="country">
            <Input id="country" name="country" defaultValue={student?.address?.country} />
          </Field>
          <Field label="Postal code" name="postalCode">
            <Input id="postalCode" name="postalCode" defaultValue={student?.address?.postalCode} />
          </Field>
          <Field label="Permanent address line 1" name="permanentLine1">
            <Input
              id="permanentLine1"
              name="permanentLine1"
              defaultValue={student?.permanentAddress?.line1}
            />
          </Field>
          <Field label="Permanent address line 2" name="permanentLine2">
            <Input
              id="permanentLine2"
              name="permanentLine2"
              defaultValue={student?.permanentAddress?.line2}
            />
          </Field>
          <Field label="Permanent city" name="permanentCity">
            <Input
              id="permanentCity"
              name="permanentCity"
              defaultValue={student?.permanentAddress?.city}
            />
          </Field>
          <Field label="Permanent division/state" name="permanentState">
            <Input
              id="permanentState"
              name="permanentState"
              defaultValue={student?.permanentAddress?.state}
            />
          </Field>
          <Field label="Permanent country" name="permanentCountry">
            <Input
              id="permanentCountry"
              name="permanentCountry"
              defaultValue={student?.permanentAddress?.country}
            />
          </Field>
          <Field label="Permanent postal code" name="permanentPostalCode">
            <Input
              id="permanentPostalCode"
              name="permanentPostalCode"
              defaultValue={student?.permanentAddress?.postalCode}
            />
          </Field>
        </div>
      </section>

      <section className={activeTab === "education" ? "space-y-5" : "hidden"}>
        <GroupTitle
          title="Previous education"
          description="SSC, HSC, diploma, or equivalent academic qualifications."
        />
        <div className="space-y-4">
          {education.map((item, index) => (
            <div
              key={index}
              className="grid min-w-0 gap-3 rounded-xl border p-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <Input
                aria-label="Level"
                placeholder="Level (SSC/HSC)"
                value={item.level}
                onChange={(event) =>
                  setEducation((current) =>
                    current.map((entry, position) =>
                      position === index ? { ...entry, level: event.target.value } : entry,
                    ),
                  )
                }
                required
              />
              <Input
                aria-label="Institution"
                placeholder="Institution"
                value={item.institution}
                onChange={(event) =>
                  setEducation((current) =>
                    current.map((entry, position) =>
                      position === index ? { ...entry, institution: event.target.value } : entry,
                    ),
                  )
                }
                required
              />
              <Input
                aria-label="Board"
                placeholder="Board"
                value={item.board ?? ""}
                onChange={(event) =>
                  setEducation((current) =>
                    current.map((entry, position) =>
                      position === index ? { ...entry, board: event.target.value } : entry,
                    ),
                  )
                }
              />
              <Input
                aria-label="Result"
                placeholder="GPA / result"
                value={item.result}
                onChange={(event) =>
                  setEducation((current) =>
                    current.map((entry, position) =>
                      position === index ? { ...entry, result: event.target.value } : entry,
                    ),
                  )
                }
                required
              />
              <Input
                aria-label="Passing year"
                type="number"
                min={1950}
                max={2200}
                placeholder="Passing year"
                value={item.passingYear || ""}
                onChange={(event) =>
                  setEducation((current) =>
                    current.map((entry, position) =>
                      position === index
                        ? { ...entry, passingYear: Number(event.target.value) }
                        : entry,
                    ),
                  )
                }
                required
              />
              <Input
                aria-label="Roll number"
                placeholder="Roll number"
                value={item.rollNumber ?? ""}
                onChange={(event) =>
                  setEducation((current) =>
                    current.map((entry, position) =>
                      position === index ? { ...entry, rollNumber: event.target.value } : entry,
                    ),
                  )
                }
              />
              <Input
                aria-label="Registration number"
                placeholder="Registration number"
                value={item.registrationNumber ?? ""}
                onChange={(event) =>
                  setEducation((current) =>
                    current.map((entry, position) =>
                      position === index
                        ? { ...entry, registrationNumber: event.target.value }
                        : entry,
                    ),
                  )
                }
              />
              <Button
                type="button"
                variant="destructive"
                onClick={() =>
                  setEducation((current) => current.filter((_, position) => position !== index))
                }
              >
                <Trash2 /> Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setEducation((current) => [
                ...current,
                { level: "", institution: "", result: "", passingYear: new Date().getFullYear() },
              ])
            }
          >
            Add qualification
          </Button>
        </div>
      </section>

      <section className={activeTab === "documents" ? "space-y-5" : "hidden"}>
        <GroupTitle
          title="Student documents"
          description="Complete the university document checklist and maintain verification status for each submitted file."
        />
        <div className="space-y-4">
          {documents.map((item, index) => (
            <div
              key={`${item.type}-${index}`}
              className="grid min-w-0 gap-4 rounded-xl border p-4 sm:grid-cols-2 xl:grid-cols-[minmax(10rem,1fr)_minmax(16rem,2fr)_minmax(9rem,1fr)_auto] xl:items-start"
            >
              <div className="space-y-1">
                <Label>Document</Label>
                {index < requiredStudentDocuments.length ? (
                  <p className="flex h-9 items-center font-medium">{item.type}</p>
                ) : (
                  <Input
                    aria-label="Document type"
                    placeholder="Document type"
                    value={item.type}
                    onChange={(event) =>
                      setDocuments((current) =>
                        current.map((entry, position) =>
                          position === index ? { ...entry, type: event.target.value } : entry,
                        ),
                      )
                    }
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Upload file or paste link</Label>
                <Input
                  aria-label={`${item.type} URL`}
                  type="url"
                  placeholder="https://secure-storage.example/file"
                  value={item.url}
                  onChange={(event) =>
                    setDocuments((current) =>
                      current.map((entry, position) =>
                        position === index ? { ...entry, url: event.target.value } : entry,
                      ),
                    )
                  }
                />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-medium hover:bg-muted">
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp,image/gif"
                    disabled={uploadingDocument !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void uploadStudentDocument(file, index)
                      event.target.value = ""
                    }}
                  />
                  {uploadingDocument === index ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}{" "}
                  {uploadingDocument === index ? "Uploading…" : "Choose file"}
                </label>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-xs font-medium text-primary hover:underline"
                  >
                    Open uploaded file ↗
                  </a>
                )}
              </div>
              <div className="space-y-1">
                <Label>Verification status</Label>
                <select
                  aria-label="Verification status"
                  className={selectClass}
                  value={item.status}
                  onChange={(event) =>
                    setDocuments((current) =>
                      current.map((entry, position) =>
                        position === index
                          ? {
                              ...entry,
                              status: event.target.value as "pending" | "verified" | "rejected",
                            }
                          : entry,
                      ),
                    )
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex items-end sm:justify-end xl:justify-start">
                {index >= requiredStudentDocuments.length && (
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={() =>
                      setDocuments((current) => current.filter((_, position) => position !== index))
                    }
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setDocuments((current) => [...current, { type: "", url: "", status: "pending" }])
            }
          >
            Add another document
          </Button>
          {uploadMessage && (
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {uploadMessage}
            </p>
          )}
        </div>
      </section>

      <section className={activeTab === "administrative" ? "space-y-5" : "hidden"}>
        <GroupTitle
          title="Administrative information"
          description="Internal classification and operational requirements. Academic results remain system-generated."
        />
        <div className="grid gap-5 md:grid-cols-2">
          {student && <div className="space-y-3 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><Label>Finance waiver</Label><p className="mt-1 text-xs text-muted-foreground">Approved by Finance and automatically applied when an eligible invoice is generated.</p></div><Button type="button" variant="outline" render={<a href={`/dashboard/finance/waivers/new?studentId=${student._id}`} />}>Manage waiver</Button></div>
            {waivers.length ? <div className="overflow-x-auto rounded-lg border"><table className="min-w-[640px] w-full text-sm"><thead className="bg-muted/50 text-left"><tr><th className="p-3">Waiver</th><th className="p-3">Benefit</th><th className="p-3">Validity</th><th className="p-3">Status</th></tr></thead><tbody>{waivers.map((waiver) => <tr key={waiver._id} className="border-t"><td className="p-3 font-medium">{waiver.name}</td><td className="p-3">{waiver.type === "percentage" ? `${waiver.value}%` : new Intl.NumberFormat("en-BD", { style: "currency", currency: waiver.currency }).format(waiver.value / 100)} · {waiver.appliesTo === "all" ? "Entire invoice" : "Tuition only"}</td><td className="p-3 text-xs">{new Date(waiver.validFrom).toLocaleDateString("en-BD")} – {new Date(waiver.validUntil).toLocaleDateString("en-BD")}</td><td className="p-3 capitalize">{waiver.status}</td></tr>)}</tbody></table></div> : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No finance waiver assigned to this student.</p>}
          </div>}
          <Field label="Residential status" name="residentialStatus">
            <select
              id="residentialStatus"
              name="residentialStatus"
              className={selectClass}
              defaultValue={student?.residentialStatus ?? "day_scholar"}
            >
              <option value="day_scholar">Day scholar</option>
              <option value="hostel">Hostel</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <label className="flex items-center gap-3 rounded-lg border p-4 text-sm font-medium">
            <input name="hostelRequired" type="checkbox" defaultChecked={student?.hostelRequired} />{" "}
            Hostel required
          </label>
          <label className="flex items-center gap-3 rounded-lg border p-4 text-sm font-medium">
            <input
              name="transportRequired"
              type="checkbox"
              defaultChecked={student?.transportRequired}
            />{" "}
            Transport required
          </label>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="administrativeNotes">Internal administrative notes</Label>
            <textarea
              id="administrativeNotes"
              name="administrativeNotes"
              maxLength={2000}
              defaultValue={student?.administrativeNotes}
              className="min-h-28 w-full rounded-lg border bg-background p-3 text-sm"
            />
          </div>
        </div>
        <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
          CGPA, completed credits, registered credits, attendance, fees, and graduation eligibility
          are calculated by their respective system modules and are not manually editable here.
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end border-t pt-6">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
          {editing ? "Save changes" : "Create student"}
        </Button>
      </div>
    </form>
  )
}
