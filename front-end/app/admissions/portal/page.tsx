import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, FileText, Plus } from "lucide-react"

import { AdmissionStatusBadge } from "@/components/admission-status"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AdmissionListData } from "@/lib/admission-types"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { authenticatedRequest } from "@/lib/auth"

export const metadata: Metadata = { title: "My admission applications" }

export default async function ApplicantPortalPage() {
  const result = (await authenticatedRequest<AdmissionListData>(`${API_ENDPOINTS.admissions.mine}?limit=50`)).data
  return (
    <main className="mx-auto max-w-6xl space-y-7 px-5 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="font-semibold text-primary">Applicant portal</p><h1 className="mt-1 text-3xl font-bold tracking-tight">My applications</h1><p className="mt-2 text-muted-foreground">Create, submit and track your admission applications.</p></div>
        <Button size="lg" render={<Link href="/admissions/portal/new" />}><Plus /> Start an application</Button>
      </div>
      {result.items.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {result.items.map((application) => (
            <Card key={application._id}>
              <CardHeader className="border-b"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{application.applicationNumber}</p><CardTitle className="mt-1">{application.program.name}</CardTitle></div><AdmissionStatusBadge status={application.status} /></div></CardHeader>
              <CardContent className="flex items-end justify-between gap-4"><div className="text-sm"><p className="font-medium">{application.intakeSemester.name}</p><p className="mt-1 text-muted-foreground">Updated {new Date(application.updatedAt).toLocaleDateString()}</p></div><Button variant="outline" render={<Link href={`/admissions/portal/${application._id}`} />}>View <ArrowRight /></Button></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed py-12"><CardContent className="text-center"><FileText className="mx-auto size-10 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">No applications yet</h2><p className="mt-2 text-muted-foreground">Choose a program and save your first application draft.</p><Button className="mt-5" render={<Link href="/admissions/portal/new" />}>Start application</Button></CardContent></Card>
      )}
    </main>
  )
}
