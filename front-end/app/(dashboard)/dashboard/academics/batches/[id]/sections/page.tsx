import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AcademicSectionManager, type AcademicSectionOption } from "@/components/academic-section-manager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import { authenticatedRequest } from "@/lib/auth"

type Batch = { _id: string; code: string; name: string; program: { code: string; name: string }; department: { code: string; name: string } }
export default async function BatchSectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [batchResponse, sectionResponse] = await Promise.all([
    authenticatedRequest<{ batch: Batch }>(API_ENDPOINTS.academics.batchDetail(id)),
    authenticatedRequest<{ items: AcademicSectionOption[] }>(withQuery(API_ENDPOINTS.academics.sections, { academicBatchId: id, status: "active", limit: 200 })),
  ])
  const batch = batchResponse.data.batch
  return <div className="mx-auto max-w-6xl space-y-6">
    <Button variant="ghost" render={<Link href="/dashboard/academics/courses" />}><ArrowLeft /> Back to academics</Button>
    <div><p className="text-sm font-medium text-primary">{batch.department.code} · {batch.program.code}</p><h1 className="text-3xl font-bold tracking-tight">{batch.code} sections</h1><p className="mt-1 text-muted-foreground">Set student capacity and operational details for each section.</p></div>
    <Card><CardHeader><CardTitle>{batch.name}</CardTitle></CardHeader><CardContent><AcademicSectionManager batchId={id} sections={sectionResponse.data.items} /></CardContent></Card>
  </div>
}
