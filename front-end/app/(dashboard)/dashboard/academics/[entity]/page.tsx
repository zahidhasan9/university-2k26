import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, BookOpen, Building2, Filter, Layers3, Pencil, Search, Settings, Users } from "lucide-react"
import { notFound } from "next/navigation"

import { PaginationLinks } from "@/components/pagination-links"
import { AcademicRecordActions } from "@/components/academic-record-actions"
import { BatchRemoveAction } from "@/components/batch-remove-action"
import { AcademicSectionManager, type AcademicSectionOption } from "@/components/academic-section-manager"
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
type AcademicBatch = { _id: string; code: string; name: string; program: Program; curriculum?: { _id: string; code: string; name: string } }
type CurriculumDetail = { _id: string; code: string; name: string; coursePlans: Array<{ semesterNumber: number; required: boolean; course: AcademicItem }> }

async function CourseHierarchy({ raw }: { raw: Record<string, string | string[] | undefined> }) {
  const departmentId = first(raw.departmentId) ?? ""
  const batch = first(raw.batch) ?? ""
  const programId = first(raw.programId) ?? ""
  const requestedTab = first(raw.tab) ?? "curriculum"
  const activeTab = ["curriculum", "sections", "students", "settings"].includes(requestedTab) ? requestedTab : "curriculum"
  const departments = (
    await authenticatedRequest<AcademicList>(
      withQuery(API_ENDPOINTS.academics.departments, { status: "active", limit: 100 }),
    )
  ).data.items as Department[]
  const selectedDepartment = departments.find((item) => item._id === departmentId)

  let batches: AcademicBatch[] = []
  let courses: AcademicItem[] = []
  let curriculum: CurriculumDetail | undefined
  let selectedBatch: AcademicBatch | undefined
  let selectedProgram: Program | undefined
  let sections: AcademicSectionOption[] = []
  if (departmentId) {
    const [programResponse, batchResponse] = await Promise.all([
      authenticatedRequest<AcademicList>(
        withQuery(API_ENDPOINTS.academics.programs, {
          parentId: departmentId,
          status: "active",
          limit: 100,
        }),
      ),
      authenticatedRequest<{ items: AcademicBatch[] }>(
        withQuery(API_ENDPOINTS.academics.batches, { departmentId, status: "active", limit: 100 }),
      ),
    ])
    const programs = programResponse.data.items as Program[]
    batches = batchResponse.data.items
    selectedProgram = programs.find((item) => item._id === programId)
    selectedBatch = batches.find((item) => item.code === batch && item.program._id === programId)
    if (selectedBatch?.curriculum) {
      curriculum = (await authenticatedRequest<{ curriculum: CurriculumDetail }>(API_ENDPOINTS.academics.curriculumDetail(selectedBatch.curriculum._id))).data.curriculum
      courses = curriculum.coursePlans.map((plan) => ({ ...plan.course, semesterNumber: plan.semesterNumber }))
    }
    if (selectedBatch && activeTab === "sections") {
      sections = (await authenticatedRequest<{ items: AcademicSectionOption[] }>(withQuery(API_ENDPOINTS.academics.sections, { academicBatchId: selectedBatch._id, status: "active", limit: 200 }))).data.items
    }
  }

  const query = (values: Record<string, string>) =>
    `/dashboard/academics/courses?${new URLSearchParams(values)}`
  const tabHref = (tab: string) => query({ departmentId, batch, programId, tab })
  const semesters = new Map<number, AcademicItem[]>()
  for (const course of courses) {
    const number = course.semesterNumber ?? 1
    semesters.set(number, [...(semesters.get(number) ?? []), course])
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <Button variant="ghost" render={<Link href="/dashboard/academics" />}>
        <ArrowLeft /> Academic structure
      </Button>
      <div>
        <div>
          <p className="text-sm font-medium text-primary">Curriculum manager</p>
          <h1 className="mt-1 text-3xl font-bold">Department → Batch → Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a department and batch to manage its semester-wise curriculum.
          </p>
        </div>
      </div>
      {departmentId && !batch && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" render={<Link href={`/dashboard/academics/curricula/new?departmentId=${departmentId}`} />}>
            Design curriculum
          </Button>
          <Button
            render={<Link href={`/dashboard/academics/batches/new?departmentId=${departmentId}`} />}
          >
            Create batch
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/dashboard/academics/courses"
          className="rounded-lg bg-muted px-3 py-2 font-medium"
        >
          Departments
        </Link>
        {selectedDepartment && (
          <>
            <span>›</span>
            <Link
              href={query({ departmentId })}
              className="rounded-lg bg-muted px-3 py-2 font-medium"
            >
              {selectedDepartment.code}
            </Link>
          </>
        )}
        {batch && (
          <>
            <span>›</span>
            <span className="rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground">
              {batch}
            </span>
          </>
        )}
      </div>
      {!departmentId && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {departments.map((item) => (
            <Link key={item._id} href={query({ departmentId: item._id })}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="p-6">
                  <Building2 className="size-6 text-primary" />
                  <p className="mt-4 text-lg font-bold">{item.code}</p>
                  <p className="text-sm text-muted-foreground">{item.name}</p>
                  <p className="mt-4 text-xs font-semibold text-primary">View batches →</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      )}
      {departmentId && !batch && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {batches.map((item) => (
            <Link
              key={item._id}
              href={query({ departmentId, batch: item.code, programId: item.program._id })}
            >
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="p-6">
                  <Users className="size-6 text-primary" />
                  <p className="mt-4 text-lg font-bold">{item.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.program.code} · {item.program.name}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.curriculum ? `Curriculum: ${item.curriculum.code}` : "Curriculum not assigned"}
                  </p>
                  <p className="mt-4 text-xs font-semibold text-primary">View curriculum →</p>
                </CardContent>
              </Card>
            </Link>
          ))}
          {!batches.length && (
            <p className="col-span-full rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No academic batches configured for this department.
            </p>
          )}
        </section>
      )}
      {batch && selectedProgram && (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-bold">
                  {selectedProgram.code} · {batch}
                </p>
                <p className="text-sm text-muted-foreground">
                  {curriculum ? `${curriculum.code} · ${courses.length} courses · ${semesters.size} curriculum semesters` : "No canonical curriculum assigned"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {selectedBatch?.curriculum && (
                  <Button variant="outline" render={<Link href={`/dashboard/academics/curricula/${selectedBatch.curriculum._id}`} />}>
                    <Pencil /> Edit curriculum
                  </Button>
                )}
                <Layers3 className="size-6 text-primary" />
              </div>
            </CardContent>
          </Card>
          <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/30 p-1" aria-label="Batch workspace">
            {[
              { key: "curriculum", label: "Curriculum", icon: BookOpen },
              { key: "sections", label: "Sections", icon: Layers3 },
              { key: "students", label: "Students", icon: Users },
              { key: "settings", label: "Settings", icon: Settings },
            ].map(({ key, label, icon: Icon }) => (
              <Link key={key} href={tabHref(key)} className={`inline-flex min-w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className="size-4" /> {label}
              </Link>
            ))}
          </nav>
          {activeTab === "curriculum" && [...semesters.entries()]
            .sort(([a], [b]) => a - b)
            .map(([number, items]) => (
              <Card key={number}>
                <CardHeader className="flex-row items-center justify-between gap-4">
                  <div><CardTitle>Semester Plan {number}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {items.length} courses ·{" "}
                    {items.reduce((sum, item) => sum + (item.credits ?? 0), 0)} credits
                  </p></div>
                  {curriculum && <Button size="sm" variant="outline" render={<Link href={`/dashboard/academics/curricula/${curriculum._id}/semesters/${number}`} />}><Pencil /> Edit semester</Button>}
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Credit</TableHead>
                        <TableHead>Theory</TableHead>
                        <TableHead>Lab</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell className="font-mono text-xs font-semibold">
                            {item.code}
                          </TableCell>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {item.courseType}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.credits}</TableCell>
                          <TableCell>{item.theoryHoursPerWeek ?? 0}h/week</TableCell>
                          <TableCell>{item.labHoursPerWeek ?? 0}h/week</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          {activeTab === "curriculum" && !courses.length && (
            <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              This batch has no published curriculum assigned. Design a curriculum and assign it to the batch.
            </p>
          )}
          {activeTab === "sections" && selectedBatch && (
            <Card><CardHeader><CardTitle>Section planning</CardTitle><p className="text-sm text-muted-foreground">Create sections and manage capacity, shift, room, and available seats.</p></CardHeader><CardContent><AcademicSectionManager batchId={selectedBatch._id} sections={sections} /></CardContent></Card>
          )}
          {activeTab === "students" && selectedBatch && (
            <Card><CardHeader><CardTitle>Batch students</CardTitle></CardHeader><CardContent className="flex flex-col items-start gap-4"><p className="text-sm text-muted-foreground">Browse this batch section-by-section, search students, and open profiles for transfers.</p><Button render={<Link href={`/dashboard/students/structure?departmentId=${departmentId}&batchId=${selectedBatch._id}`} />}><Users /> Open student directory</Button></CardContent></Card>
          )}
          {activeTab === "settings" && selectedBatch && (
            <Card><CardHeader><CardTitle>Batch settings</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><div><p className="text-xs font-medium uppercase text-muted-foreground">Batch</p><p className="mt-1 font-semibold">{selectedBatch.code} · {selectedBatch.name}</p></div><div><p className="text-xs font-medium uppercase text-muted-foreground">Program</p><p className="mt-1 font-semibold">{selectedProgram.code} · {selectedProgram.name}</p></div><div><p className="text-xs font-medium uppercase text-muted-foreground">Curriculum</p><p className="mt-1 font-semibold">{selectedBatch.curriculum?.code ?? "Not assigned"}</p></div><div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">{selectedBatch.curriculum && <Button variant="outline" render={<Link href={`/dashboard/academics/curricula/${selectedBatch.curriculum._id}`} />}><Pencil /> Edit curriculum</Button>}<BatchRemoveAction id={selectedBatch._id} code={selectedBatch.code} redirectHref={query({ departmentId })} /></div></CardContent></Card>
          )}
        </div>
      )}
    </div>
  )
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
      return (
        <div className="mx-auto max-w-[1200px] rounded-xl bg-destructive/10 p-5 text-destructive">
          {cause instanceof Error ? cause.message : "Course hierarchy could not be loaded"}
        </div>
      )
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
    result = (
      await authenticatedRequest<AcademicList>(`${API_ENDPOINTS.academics[entity]}?${query}`)
    ).data
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
