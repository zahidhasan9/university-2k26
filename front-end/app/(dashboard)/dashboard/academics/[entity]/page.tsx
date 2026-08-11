import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, BookOpen, Building2, Filter, Layers3, Search, Users } from "lucide-react"
import { notFound } from "next/navigation"

import { PaginationLinks } from "@/components/pagination-links"
import { AcademicRecordActions } from "@/components/academic-record-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  academicEntities,
  type AcademicEntity,
  type AcademicItem,
  type AcademicList,
} from "@/lib/academic-types"
import { authenticatedRequest } from "@/lib/auth"
import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"

export const metadata: Metadata = { title: "Academic records" }

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parent(item: AcademicItem) {
  return item.program ?? item.department ?? item.faculty ?? item.university
}

function details(entity: AcademicEntity, item: AcademicItem) {
  if (entity === "programs")
    return `${item.degreeType ?? "Degree"} · ${item.durationYears ?? "—"} years · ${item.totalCredits ?? "—"} credits`
  if (entity === "courses") return `${item.courseType ?? "Course"} · ${item.credits ?? "—"} credits`
  if (entity === "semesters") return `${item.term ?? "Term"} · ${item.academicYear ?? "—"}`
  return item.description || "No description provided"
}

type Department = { _id: string; name: string; code: string }
type Program = { _id: string; name: string; code: string }
type StudentBatchItem = { batch: string; program: Program & { department?: Department } }

async function CourseHierarchy({ raw }: { raw: Record<string, string | string[] | undefined> }) {
  const departmentId = first(raw.departmentId) ?? ""
  const batch = first(raw.batch) ?? ""
  const programId = first(raw.programId) ?? ""
  const departments = (await authenticatedRequest<AcademicList>(withQuery(API_ENDPOINTS.academics.departments, { status: "active", limit: 100 }))).data.items as Department[]
  const selectedDepartment = departments.find((item) => item._id === departmentId)

  let batches: Array<{ batch: string; program: Program }> = []
  let courses: AcademicItem[] = []
  let selectedProgram: Program | undefined
  if (departmentId) {
    const [programResponse, studentResponse] = await Promise.all([
      authenticatedRequest<AcademicList>(withQuery(API_ENDPOINTS.academics.programs, { parentId: departmentId, status: "active", limit: 100 })),
      authenticatedRequest<{ items: StudentBatchItem[] }>(withQuery(API_ENDPOINTS.students.list, { departmentId, status: "active", limit: 100 })),
    ])
    const programs = programResponse.data.items as Program[]
    const unique = new Map<string, { batch: string; program: Program }>()
    for (const student of studentResponse.data.items) {
      if (student.batch && student.program) unique.set(`${student.program._id}:${student.batch}`, { batch: student.batch, program: student.program })
    }
    batches = [...unique.values()].sort((a, b) => a.batch.localeCompare(b.batch))
    selectedProgram = programs.find((item) => item._id === programId)
    if (batch && selectedProgram) {
      courses = (await authenticatedRequest<AcademicList>(withQuery(API_ENDPOINTS.academics.courses, { parentId: selectedProgram._id, status: "active", limit: 100 }))).data.items
    }
  }

  const query = (values: Record<string, string>) => `/dashboard/academics/courses?${new URLSearchParams(values)}`
  const semesters = new Map<number, AcademicItem[]>()
  for (const course of courses) {
    const number = course.semesterNumber ?? 1
    semesters.set(number, [...(semesters.get(number) ?? []), course])
  }

  return <div className="mx-auto max-w-[1500px] space-y-6">
    <Button variant="ghost" render={<Link href="/dashboard/academics" />}><ArrowLeft /> Academic structure</Button>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-sm font-medium text-primary">Curriculum manager</p><h1 className="mt-1 text-3xl font-bold">Department → Batch → Courses</h1><p className="mt-1 text-sm text-muted-foreground">Choose a department and batch to manage its semester-wise curriculum.</p></div>
      <Button render={<Link href="/dashboard/academics/courses/new" />}>Create course</Button>
    </div>
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Link href="/dashboard/academics/courses" className="rounded-lg bg-muted px-3 py-2 font-medium">Departments</Link>
      {selectedDepartment && <><span>›</span><Link href={query({ departmentId })} className="rounded-lg bg-muted px-3 py-2 font-medium">{selectedDepartment.code}</Link></>}
      {batch && <><span>›</span><span className="rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground">{batch}</span></>}
    </div>
    {!departmentId && <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{departments.map((item) => <Link key={item._id} href={query({ departmentId: item._id })}><Card className="h-full transition hover:-translate-y-0.5 hover:shadow-lg"><CardContent className="p-6"><Building2 className="size-6 text-primary" /><p className="mt-4 text-lg font-bold">{item.code}</p><p className="text-sm text-muted-foreground">{item.name}</p><p className="mt-4 text-xs font-semibold text-primary">View batches →</p></CardContent></Card></Link>)}</section>}
    {departmentId && !batch && <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{batches.map((item) => <Link key={`${item.program._id}-${item.batch}`} href={query({ departmentId, batch: item.batch, programId: item.program._id })}><Card className="h-full transition hover:-translate-y-0.5 hover:shadow-lg"><CardContent className="p-6"><Users className="size-6 text-primary" /><p className="mt-4 text-lg font-bold">{item.batch}</p><p className="text-sm text-muted-foreground">{item.program.code} · {item.program.name}</p><p className="mt-4 text-xs font-semibold text-primary">View curriculum →</p></CardContent></Card></Link>)}{!batches.length && <p className="col-span-full rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No student batches found in this department.</p>}</section>}
    {batch && selectedProgram && <div className="space-y-6">
      <Card><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-bold">{selectedProgram.code} · {batch}</p><p className="text-sm text-muted-foreground">{courses.length} courses · {semesters.size} curriculum semesters</p></div><Layers3 className="size-6 text-primary" /></CardContent></Card>
      {[...semesters.entries()].sort(([a], [b]) => a - b).map(([number, items]) => <Card key={number}><CardHeader><CardTitle>Semester {number}</CardTitle><p className="text-sm text-muted-foreground">{items.length} courses · {items.reduce((sum, item) => sum + (item.credits ?? 0), 0)} credits</p></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Course</TableHead><TableHead>Type</TableHead><TableHead>Credit</TableHead><TableHead>Theory</TableHead><TableHead>Lab</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item._id}><TableCell className="font-mono text-xs font-semibold">{item.code}</TableCell><TableCell className="font-medium">{item.title}</TableCell><TableCell><Badge variant="outline" className="capitalize">{item.courseType}</Badge></TableCell><TableCell>{item.credits}</TableCell><TableCell>{item.theoryHoursPerWeek ?? 0}h/week</TableCell><TableCell>{item.labHoursPerWeek ?? 0}h/week</TableCell><TableCell><AcademicRecordActions entity="courses" id={item._id} archived={false} /></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>)}
      {!courses.length && <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No curriculum courses found for this batch program.</p>}
    </div>}
  </div>
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
  if (entity === "courses") {
    try {
      return await CourseHierarchy({ raw })
    } catch (cause) {
      return <div className="mx-auto max-w-[1200px] rounded-xl bg-destructive/10 p-5 text-destructive">{cause instanceof Error ? cause.message : "Course hierarchy could not be loaded"}</div>
    }
  }
  const search = first(raw.search) ?? ""
  const status = first(raw.status) ?? ""
  const page = Math.max(1, Number(first(raw.page)) || 1)
  const query = new URLSearchParams({ page: String(page), limit: "12" })
  if (search) query.set("search", search)
  if (status) query.set("status", status)

  let result: AcademicList | null = null
  let error = ""
  try {
    result = (await authenticatedRequest<AcademicList>(`${API_ENDPOINTS.academics[entity]}?${query}`)).data
  } catch (cause) {
    error = cause instanceof Error ? cause.message : `${config.label} could not be loaded`
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <Button variant="ghost" render={<Link href="/dashboard/academics" />}>
        <ArrowLeft /> Academic structure
      </Button>
      <div>
        <p className="text-sm font-medium text-primary">Academic structure</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{config.label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
      </div>
      <div className="flex justify-end">
        <Button render={<Link href={`/dashboard/academics/${entity}/new`} />}>
          Create {config.singular}
        </Button>
      </div>
      <Card>
        <CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{config.label} directory</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {result ? `${result.pagination.total} records` : "Academic records"}
            </p>
          </div>
          <form
            action={`/dashboard/academics/${entity}`}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="search"
                defaultValue={search}
                className="pl-9 sm:w-60"
                placeholder={`Search ${config.label.toLowerCase()}...`}
              />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                name="status"
                defaultValue={status}
                className="h-8 rounded-lg border bg-background pl-9 pr-8 text-sm outline-none"
              >
                <option value="">All statuses</option>
                {entity === "semesters" ? (
                  <>
                    <option value="planned">Planned</option>
                    <option value="registration">Registration</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </>
                ) : (
                  <>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </>
                )}
              </select>
            </div>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-10 text-center">
              <p className="font-medium">Unable to load records</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
          ) : result?.items.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{config.singular}</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((item) => {
                    const parentItem = parent(item)
                    return (
                      <TableRow key={item._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-700">
                              <BookOpen className="size-4" />
                            </span>
                            <span className="font-medium">{item.name ?? item.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold">
                          {item.code}
                        </TableCell>
                        <TableCell>
                          {parentItem ? (
                            <>
                              <p className="text-sm font-medium">{parentItem.name}</p>
                              <p className="text-xs text-muted-foreground">{parentItem.code}</p>
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="max-w-sm">
                          <p className="truncate text-sm text-muted-foreground capitalize">
                            {details(entity, item)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.status.replaceAll("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AcademicRecordActions
                            entity={entity}
                            id={item._id}
                            archived={item.status === "archived"}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <PaginationLinks
                pathname={`/dashboard/academics/${entity}`}
                params={query}
                page={result.pagination.page}
                totalPages={result.pagination.totalPages}
              />
            </>
          ) : (
            <div className="p-12 text-center">
              <BookOpen className="mx-auto size-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No {config.label.toLowerCase()} found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try changing the search or status filter.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
