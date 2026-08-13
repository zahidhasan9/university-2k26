"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Save, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Admission, AdmissionOptions } from "@/lib/admission-types"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiRequest, apiResponseRequest } from "@/lib/http-client"

const selectClass = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"

export function AdmissionApplicationForm({ options, application }: { options: AdmissionOptions; application?: Admission }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [documentUrl, setDocumentUrl] = useState(application?.documents[0]?.url ?? "")
  const [uploading, setUploading] = useState(false)

  async function uploadDocument(file: File) {
    setUploading(true)
    setError("")
    try {
      const data = new FormData()
      data.append("file", file)
      const response = await apiRequest<{ document: { url: string } }>(API_ENDPOINTS.uploads.admissionDocument, { method: "POST", data })
      setDocumentUrl(response.data.document.url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Document upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const value = (name: string) => String(form.get(name) ?? "").trim()
    setLoading(true)
    setError("")
    try {
      const submittedDocumentUrl = value("documentUrl")
      const payload = {
          personal: { phone: value("phone"), dateOfBirth: value("dateOfBirth"), gender: value("gender"), nationality: value("nationality"), presentAddress: value("presentAddress"), permanentAddress: value("permanentAddress") },
          guardian: { name: value("guardianName"), relationship: value("guardianRelationship"), phone: value("guardianPhone"), email: value("guardianEmail") },
          previousEducation: [{ level: value("educationLevel"), institution: value("institution"), result: value("result"), passingYear: Number(value("passingYear")) }],
          documents: submittedDocumentUrl ? [{ type: "academic_transcript", url: submittedDocumentUrl }] : [],
          statement: value("statement"),
      }
      const response = await apiResponseRequest(application ? API_ENDPOINTS.admissions.detail(application._id) : API_ENDPOINTS.admissions.create, {
        method: application ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(application ? payload : { ...payload, programId: value("programId"), intakeSemesterId: value("intakeSemesterId") }),
      })
      const body = (await response.json()) as { message: string; data?: { application: { _id: string } } }
      if (!response.ok || !body.data) throw new Error(body.message || "Draft could not be saved")
      router.push(`/admissions/portal/${body.data.application._id}`)
      router.refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Draft could not be saved") } finally { setLoading(false) }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <Card><CardHeader className="border-b"><CardTitle>1. Program and intake</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="programId">Program</Label><select className={selectClass} id="programId" name="programId" required defaultValue={application?.program._id ?? ""} disabled={Boolean(application)}><option value="">Select a program</option>{options.programs.map((program) => <option key={program._id} value={program._id}>{program.code} — {program.name} ({program.department.code})</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="intakeSemesterId">Intake</Label><select className={selectClass} id="intakeSemesterId" name="intakeSemesterId" required defaultValue={application?.intakeSemester._id ?? ""} disabled={Boolean(application)}><option value="">Select an intake</option>{options.intakes.map((intake) => <option key={intake._id} value={intake._id}>{intake.name} — {intake.academicYear}</option>)}</select></div>
      </CardContent></Card>
      <Card><CardHeader className="border-b"><CardTitle>2. Personal information</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
        <Field name="phone" label="Phone number" defaultValue={application?.personal.phone} /><Field name="dateOfBirth" label="Date of birth" type="date" defaultValue={application?.personal.dateOfBirth.slice(0, 10)} />
        <div className="space-y-2"><Label htmlFor="gender">Gender</Label><select className={selectClass} id="gender" name="gender" required defaultValue={application?.personal.gender ?? ""}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></div>
        <Field name="nationality" label="Nationality" defaultValue={application?.personal.nationality ?? "Bangladeshi"} />
        <Field name="presentAddress" label="Present address" defaultValue={application?.personal.presentAddress} /><Field name="permanentAddress" label="Permanent address" defaultValue={application?.personal.permanentAddress} />
      </CardContent></Card>
      <Card><CardHeader className="border-b"><CardTitle>3. Guardian information</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
        <Field name="guardianName" label="Guardian name" defaultValue={application?.guardian.name} /><Field name="guardianRelationship" label="Relationship" defaultValue={application?.guardian.relationship} /><Field name="guardianPhone" label="Guardian phone" defaultValue={application?.guardian.phone} /><Field name="guardianEmail" label="Guardian email" type="email" required={false} defaultValue={application?.guardian.email} />
      </CardContent></Card>
      <Card><CardHeader className="border-b"><CardTitle>4. Previous education</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
        <Field name="educationLevel" label="Qualification (for example, HSC)" defaultValue={application?.previousEducation[0]?.level} /><Field name="institution" label="Institution" defaultValue={application?.previousEducation[0]?.institution} /><Field name="result" label="Result / GPA" defaultValue={application?.previousEducation[0]?.result} /><Field name="passingYear" label="Passing year" type="number" defaultValue={application?.previousEducation[0]?.passingYear?.toString()} />
      </CardContent></Card>
      <Card><CardHeader className="border-b"><CardTitle>5. Documents and statement</CardTitle></CardHeader><CardContent className="grid gap-4">
        <div className="space-y-2"><Label htmlFor="admissionDocument">Academic transcript (optional)</Label><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><Input id="documentUrl" name="documentUrl" type="url" placeholder="Paste a secure link or upload a file" value={documentUrl} onChange={(event) => setDocumentUrl(event.target.value)} /><Button type="button" variant="outline" disabled={uploading} render={<label htmlFor="admissionDocument" />}>{uploading ? <LoaderCircle className="animate-spin" /> : <Upload />} Upload file</Button><input id="admissionDocument" type="file" className="sr-only" accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadDocument(file) }} /></div><p className="text-xs text-muted-foreground">PDF, DOC, DOCX or image. You can upload to configured local/Cloudinary storage, or paste a link.</p></div>
        <div className="space-y-2"><Label htmlFor="statement">Personal statement (optional)</Label><textarea id="statement" name="statement" rows={5} defaultValue={application?.statement} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-3 focus:ring-ring/50" /></div>
      </CardContent></Card>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      <div className="flex justify-end"><Button size="lg" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" /> : <Save />} {application ? "Save draft changes" : "Save application draft"}</Button></div>
    </form>
  )
}

function Field({ name, label, type = "text", required = true, defaultValue }: { name: string; label: string; type?: string; required?: boolean; defaultValue?: string }) {
  return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} /></div>
}
