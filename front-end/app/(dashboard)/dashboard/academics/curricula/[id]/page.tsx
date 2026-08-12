import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CurriculumOverview } from "@/components/curriculum-overview"
import { Button } from "@/components/ui/button"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { authenticatedRequest } from "@/lib/auth"
type Curriculum = { _id: string; code: string; name: string; totalSemesters: number; status: string; program: { code: string; name: string; totalSemesters: number }; coursePlans: Array<{ semesterNumber: number; required: boolean; course: { _id: string; credits: number } }> }
export default async function CurriculumPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const curriculum = (await authenticatedRequest<{ curriculum: Curriculum }>(API_ENDPOINTS.academics.curriculumDetail(id))).data.curriculum; return <div className="mx-auto max-w-6xl space-y-6"><Button variant="ghost" render={<Link href="/dashboard/academics/courses" />}><ArrowLeft /> Curriculum manager</Button><div><p className="text-sm font-semibold text-primary">{curriculum.program.code} · {curriculum.code}</p><h1 className="mt-1 text-3xl font-bold">{curriculum.name}</h1><p className="mt-2 text-sm text-muted-foreground">Select a semester to manage its course list.</p></div><CurriculumOverview curriculum={curriculum} /></div> }
