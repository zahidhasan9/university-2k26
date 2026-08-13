import { API_ENDPOINTS } from "@/lib/api-endpoints"
import type { Metadata } from "next"
import Link from "next/link"
import { ClipboardList, Filter, Search } from "lucide-react"

import { AdmissionStatusBadge } from "@/components/admission-status"
import { PaginationLinks } from "@/components/pagination-links"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import type { AdmissionListData } from "@/lib/admission-types"
import { authenticatedRequest } from "@/lib/auth"

export const metadata: Metadata = { title: "Admissions" }

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const search = first(raw.search) ?? ""
  const status = first(raw.status) ?? ""
  const page = Math.max(1, Number(first(raw.page)) || 1)
  const query = new URLSearchParams({ page: String(page), limit: "10" })
  if (search) query.set("search", search)
  if (status) query.set("status", status)

  let result: AdmissionListData | null = null
  let error = ""
  try {
    result = (
      await authenticatedRequest<AdmissionListData>(`${API_ENDPOINTS.admissions.list}?${query}`)
    ).data
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Applications could not be loaded"
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Enrollment pipeline</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Admissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review applications and make traceable admission decisions.
        </p>
      </div>
      <Card>
        <CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" /> Applications
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {result
                ? `${result.pagination.total.toLocaleString()} applications`
                : "Admission records"}
            </p>
          </div>
          <form
            action="/dashboard/admissions"
            className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
          >
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="search"
                defaultValue={search}
                className="pl-9"
                placeholder="Application number..."
              />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                name="status"
                defaultValue={status}
                className="h-8 rounded-lg border bg-background pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
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
              <p className="font-medium">Unable to load applications</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
          ) : result?.items.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Application</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Intake</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-violet-50 text-xs font-semibold text-violet-700">
                              {item.applicant.firstName[0]}
                              {item.applicant.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {item.applicant.firstName} {item.applicant.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{item.applicant.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium">
                        {item.applicationNumber}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{item.program.code}</p>
                        <p className="max-w-48 truncate text-xs text-muted-foreground">
                          {item.program.name}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{item.intakeSemester.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.intakeSemester.academicYear}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.submittedAt
                          ? new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(
                              new Date(item.submittedAt),
                            )
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <AdmissionStatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          render={<Link href={`/dashboard/admissions/${item._id}`} />}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationLinks
                pathname="/dashboard/admissions"
                params={query}
                page={result.pagination.page}
                totalPages={result.pagination.totalPages}
              />
            </>
          ) : (
            <div className="p-12 text-center">
              <ClipboardList className="mx-auto size-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No applications found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try changing the current filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
