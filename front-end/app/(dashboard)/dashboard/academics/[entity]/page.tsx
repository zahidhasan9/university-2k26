import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, BookOpen, Filter, Search } from "lucide-react"
import { notFound } from "next/navigation"

import { PaginationLinks } from "@/components/pagination-links"
import { AcademicRecordActions } from "@/components/academic-record-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { academicEntities, type AcademicEntity, type AcademicItem, type AcademicList } from "@/lib/academic-types"
import { authenticatedRequest } from "@/lib/auth"

export const metadata: Metadata = { title: "Academic records" }

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parent(item: AcademicItem) {
  return item.program ?? item.department ?? item.faculty ?? item.university
}

function details(entity: AcademicEntity, item: AcademicItem) {
  if (entity === "programs") return `${item.degreeType ?? "Degree"} · ${item.durationYears ?? "—"} years · ${item.totalCredits ?? "—"} credits`
  if (entity === "courses") return `${item.courseType ?? "Course"} · ${item.credits ?? "—"} credits`
  if (entity === "semesters") return `${item.term ?? "Term"} · ${item.academicYear ?? "—"}`
  return item.description || "No description provided"
}

export default async function AcademicEntityPage({
  params,
  searchParams,
}: {
  params: Promise<{ entity: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { entity: rawEntity } = await params
  const config = academicEntities.find((item) => item.key === rawEntity)
  if (!config) notFound()
  const entity = config.key
  const raw = await searchParams
  const search = first(raw.search) ?? ""
  const status = first(raw.status) ?? ""
  const page = Math.max(1, Number(first(raw.page)) || 1)
  const query = new URLSearchParams({ page: String(page), limit: "12" })
  if (search) query.set("search", search)
  if (status) query.set("status", status)

  let result: AcademicList | null = null
  let error = ""
  try {
    result = (await authenticatedRequest<AcademicList>(`/${entity}?${query}`)).data
  } catch (cause) {
    error = cause instanceof Error ? cause.message : `${config.label} could not be loaded`
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <Button variant="ghost" render={<Link href="/dashboard/academics" />}><ArrowLeft /> Academic structure</Button>
      <div>
        <p className="text-sm font-medium text-primary">Academic structure</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{config.label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
      </div>
      <div className="flex justify-end">
        <Button render={<Link href={`/dashboard/academics/${entity}/new`} />}>Create {config.singular}</Button>
      </div>
      <Card>
        <CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>{config.label} directory</CardTitle><p className="mt-1 text-sm text-muted-foreground">{result ? `${result.pagination.total} records` : "Academic records"}</p></div>
          <form action={`/dashboard/academics/${entity}`} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="search" defaultValue={search} className="pl-9 sm:w-60" placeholder={`Search ${config.label.toLowerCase()}...`} /></div>
            <div className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><select name="status" defaultValue={status} className="h-8 rounded-lg border bg-background pl-9 pr-8 text-sm outline-none"><option value="">All statuses</option>{entity === "semesters" ? <><option value="planned">Planned</option><option value="registration">Registration</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="archived">Archived</option></> : <><option value="active">Active</option><option value="archived">Archived</option></>}</select></div>
            <Button type="submit" variant="secondary">Apply</Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {error ? <div className="p-10 text-center"><p className="font-medium">Unable to load records</p><p className="mt-1 text-sm text-muted-foreground">{error}</p></div> : result?.items.length ? (
            <>
              <Table><TableHeader><TableRow><TableHead>{config.singular}</TableHead><TableHead>Code</TableHead><TableHead>Parent</TableHead><TableHead>Details</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{result.items.map((item) => { const parentItem = parent(item); return <TableRow key={item._id}><TableCell><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-700"><BookOpen className="size-4" /></span><span className="font-medium">{item.name ?? item.title}</span></div></TableCell><TableCell className="font-mono text-xs font-semibold">{item.code}</TableCell><TableCell>{parentItem ? <><p className="text-sm font-medium">{parentItem.name}</p><p className="text-xs text-muted-foreground">{parentItem.code}</p></> : "—"}</TableCell><TableCell className="max-w-sm"><p className="truncate text-sm text-muted-foreground capitalize">{details(entity, item)}</p></TableCell><TableCell><Badge variant="outline" className="capitalize">{item.status.replaceAll("_", " ")}</Badge></TableCell><TableCell><AcademicRecordActions entity={entity} id={item._id} archived={item.status === "archived"} /></TableCell></TableRow> })}</TableBody>
              </Table>
              <PaginationLinks pathname={`/dashboard/academics/${entity}`} params={query} page={result.pagination.page} totalPages={result.pagination.totalPages} />
            </>
          ) : <div className="p-12 text-center"><BookOpen className="mx-auto size-10 text-muted-foreground/50" /><p className="mt-3 font-medium">No {config.label.toLowerCase()} found</p><p className="mt-1 text-sm text-muted-foreground">Try changing the search or status filter.</p></div>}
        </CardContent>
      </Card>
    </div>
  )
}
