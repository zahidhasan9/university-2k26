import type { Metadata } from "next"
import Link from "next/link"
import { Filter, Plus, Search, UsersRound } from "lucide-react"

import { PaginationLinks } from "@/components/pagination-links"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { authenticatedRequest } from "@/lib/auth"
import type { TeacherList } from "@/lib/teacher-types"

export const metadata: Metadata = { title: "Faculty & HR" }
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

export default async function FacultyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const search = first(raw.search) ?? "",
    status = first(raw.status) ?? "",
    designation = first(raw.designation) ?? ""
  const page = Math.max(1, Number(first(raw.page)) || 1)
  const query = new URLSearchParams({ page: String(page), limit: "10" })
  if (search) query.set("search", search)
  if (status) query.set("status", status)
  if (designation) query.set("designation", designation)
  let result: TeacherList | null = null,
    error = ""
  try {
    result = (await authenticatedRequest<TeacherList>(`/teachers?${query}`)).data
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Teachers could not be loaded"
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">People & organization</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Faculty & HR</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage academic faculty profiles, roles, and employment status.
          </p>
        </div>
        <Button render={<Link href="/dashboard/faculty/new" />}>
          <Plus /> Add teacher
        </Button>
      </div>
      <Card>
        <CardHeader className="gap-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UsersRound className="size-5 text-primary" /> Faculty directory
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {result ? `${result.pagination.total} faculty records` : "Faculty records"}
              </p>
            </div>
            <Button variant="outline" render={<Link href="/dashboard/faculty/hr" />}>
              Open HR workspace
            </Button>
          </div>
          <form
            action="/dashboard/faculty"
            className="grid gap-2 sm:grid-cols-[1fr_180px_180px_auto]"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="search"
                defaultValue={search}
                className="pl-9"
                placeholder="Search employee ID..."
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                name="designation"
                defaultValue={designation}
                className="h-8 w-full rounded-lg border bg-background pl-9 text-sm"
              >
                <option value="">All designations</option>
                {[
                  "lecturer",
                  "assistant_professor",
                  "associate_professor",
                  "professor",
                  "adjunct",
                ].map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <select
              name="status"
              defaultValue={status}
              className="h-8 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">All statuses</option>
              {["active", "on_leave", "retired", "resigned", "archived"].map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-10 text-center">
              <p className="font-medium">Unable to load faculty</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
          ) : result?.items.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faculty member</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((teacher) => (
                    <TableRow key={teacher._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-violet-50 text-xs font-semibold text-violet-700">
                              {teacher.user.firstName[0]}
                              {teacher.user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {teacher.user.firstName} {teacher.user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{teacher.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        {teacher.employeeId}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{teacher.department.code}</p>
                        <p className="text-xs text-muted-foreground">{teacher.department.name}</p>
                      </TableCell>
                      <TableCell className="capitalize">
                        {teacher.designation.replaceAll("_", " ")}
                      </TableCell>
                      <TableCell>
                        {new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(
                          new Date(teacher.joiningDate),
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {teacher.status.replaceAll("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          render={<Link href={`/dashboard/faculty/${teacher._id}/edit`} />}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationLinks
                pathname="/dashboard/faculty"
                params={query}
                page={result.pagination.page}
                totalPages={result.pagination.totalPages}
              />
            </>
          ) : (
            <div className="p-12 text-center">
              <UsersRound className="mx-auto size-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No faculty members found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
