import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, BookOpen, CalendarDays, FileText, Pencil, UserRound } from "lucide-react"

import { AdmissionStatusBadge } from "@/components/admission-status"
import { AdmissionSubmitAction } from "@/components/admission-submit-action"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Admission } from "@/lib/admission-types"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { authenticatedRequest } from "@/lib/auth"

export const metadata: Metadata = { title: "Admission application" }

export default async function ApplicantApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const application = (await authenticatedRequest<{ application: Admission }>(API_ENDPOINTS.admissions.detail(id))).data.application
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-10">
      <Button variant="ghost" render={<Link href="/admissions/portal" />}><ArrowLeft /> My applications</Button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-primary">{application.applicationNumber}</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{application.program.name}</h1><p className="mt-2 text-muted-foreground">Created {new Date(application.createdAt).toLocaleDateString()}</p></div><div className="flex flex-wrap items-center gap-3"><AdmissionStatusBadge status={application.status} />{application.status === "draft" && <><Button variant="outline" render={<Link href={`/admissions/portal/${id}/edit`} />}><Pencil /> Edit draft</Button><AdmissionSubmitAction id={id} /></>}</div></div>
      {application.status === "draft" && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">Your application is saved as a draft. Review the information below, then submit it for formal review.</div>}
      <div className="grid gap-5 md:grid-cols-2">
        <InfoCard icon={BookOpen} title="Program"><Row label="Program" value={`${application.program.code} — ${application.program.name}`} /><Row label="Intake" value={`${application.intakeSemester.name}, ${application.intakeSemester.academicYear}`} /></InfoCard>
        <InfoCard icon={UserRound} title="Personal"><Row label="Phone" value={application.personal.phone} /><Row label="Date of birth" value={new Date(application.personal.dateOfBirth).toLocaleDateString()} /><Row label="Nationality" value={application.personal.nationality} /><Row label="Guardian" value={`${application.guardian.name} (${application.guardian.relationship})`} /></InfoCard>
        <InfoCard icon={CalendarDays} title="Previous education">{application.previousEducation.map((item, index) => <div key={item._id ?? index} className="rounded-lg bg-muted/50 p-3"><p className="font-medium">{item.level} — {item.result}</p><p className="mt-1 text-sm text-muted-foreground">{item.institution}, {item.passingYear}</p></div>)}</InfoCard>
        <InfoCard icon={FileText} title="Documents">{application.documents.length ? application.documents.map((document) => <a key={document._id} href={document.url} target="_blank" rel="noreferrer" className="block rounded-lg border p-3 font-medium text-primary hover:bg-muted">{document.type.replaceAll("_", " ")}</a>) : <p className="text-sm text-muted-foreground">No document links attached.</p>}</InfoCard>
      </div>
      {application.reviewNote && <Card><CardHeader className="border-b"><CardTitle>Admissions note</CardTitle></CardHeader><CardContent><p className="leading-7">{application.reviewNote}</p></CardContent></Card>}
    </main>
  )
}

function InfoCard({ icon: Icon, title, children }: { icon: typeof BookOpen; title: string; children: React.ReactNode }) { return <Card><CardHeader className="border-b"><CardTitle className="flex items-center gap-2"><Icon className="size-5 text-primary" />{title}</CardTitle></CardHeader><CardContent className="space-y-3">{children}</CardContent></Card> }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-5 border-b pb-2 last:border-0"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div> }
