import type { Metadata } from "next"
import Link from "next/link"
import { Filter, Plus, Search, Users } from "lucide-react"

import { PaginationLinks } from "@/components/pagination-links"
import { StudentStatusBadge } from "@/components/student-status"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { authenticatedRequest } from "@/lib/auth"
import type { StudentListData } from "@/lib/student-types"

export const metadata: Metadata = { title: "Students" }

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams
  const search = first(raw.search) ?? ""
  const status = first(raw.status) ?? ""
  const page = Math.max(1, Number(first(raw.page)) || 1)
  const query = new URLSearchParams({ page: String(page), limit: "10" })
  if (search) query.set("search", search)
  if (status) query.set("status", status)

  let result: StudentListData | null = null
  let error = ""
  try {
    result = (await authenticatedRequest<StudentListData>(`/students?${query}`)).data
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Students could not be loaded"
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Student lifecycle</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search profiles and monitor academic status across programs.
          </p>
        </div>
        <Button render={<Link href="/dashboard/students/new" />}>
          <Plus /> Add student
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-primary" /> Student directory
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {result ? `${result.pagination.total.toLocaleString()} student records` : "University records"}
            </p>
          </div>
          <form className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row" action="/dashboard/students">
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="search" defaultValue={search} className="pl-9" placeholder="Search student ID..." />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                name="status"
                defaultValue={status}
                className="h-8 w-full rounded-lg border bg-background pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring/40 sm:w-36"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="graduated">Graduated</option>
                <option value="suspended">Suspended</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <Button type="submit" variant="secondary">Apply</Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-10 text-center">
              <p className="font-medium">Unable to load students</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
          ) : result?.items.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((student) => {
                    const name = `${student.user.firstName} ${student.user.lastName}`
                    return (
                      <TableRow key={student._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              <AvatarFallback className="bg-blue-50 text-xs font-semibold text-blue-700">
                                {student.user.firstName[0]}{student.user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{name}</p>
                              <p className="text-xs text-muted-foreground">{student.user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium">{student.studentId}</TableCell>
                        <TableCell>
                          <p className="font-medium">{student.program.code}</p>
                          <p className="max-w-48 truncate text-xs text-muted-foreground">{student.program.name}</p>
                        </TableCell>
                        <TableCell>Semester {student.currentSemesterNumber}</TableCell>
                        <TableCell><StudentStatusBadge status={student.status} /></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" render={<Link href={`/dashboard/students/${student._id}`} />}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <PaginationLinks
                pathname="/dashboard/students"
                params={query}
                page={result.pagination.page}
                totalPages={result.pagination.totalPages}
              />
            </>
          ) : (
            <div className="p-12 text-center">
              <Users className="mx-auto size-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No students found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try changing the search or status filter.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
