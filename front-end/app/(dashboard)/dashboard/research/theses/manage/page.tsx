import { ThesisAction } from "@/components/advanced-actions"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authenticatedRequest } from "@/lib/auth"
type Thesis = {
  _id: string
  title: string
  status: string
  student: { studentId: string; user: { firstName: string; lastName: string } }
  supervisor: { employeeId: string; user: { firstName: string; lastName: string } }
  documentUrl?: string
}
export default async function Page() {
  let theses: Thesis[] = [],
    error = ""
  try {
    theses = (await authenticatedRequest<{ theses: Thesis[] }>("/research/theses")).data.theses
  } catch (c) {
    error = c instanceof Error ? c.message : "Thesis queue unavailable"
  }
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Research administration</p>
        <h1 className="mt-1 text-3xl font-bold">Thesis supervision queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          State-aware supervisor decisions; invalid transitions are rejected by the backend.
        </p>
      </div>
      {error && <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      <Card>
        <CardHeader>
          <CardTitle>Theses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thesis / student</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Available action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {theses.map((x) => (
                <TableRow key={x._id}>
                  <TableCell>
                    <p className="font-medium">{x.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {x.student?.user?.firstName} {x.student?.user?.lastName} ·{" "}
                      {x.student?.studentId}
                    </p>
                  </TableCell>
                  <TableCell>
                    {x.supervisor?.user?.firstName} {x.supervisor?.user?.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{x.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {x.status === "proposed" && (
                        <>
                          <ThesisAction id={x._id} action="approve" />
                          <ThesisAction id={x._id} action="reject" />
                        </>
                      )}
                      {x.status === "approved" && <ThesisAction id={x._id} action="start" />}
                      {x.status === "defended" && (
                        <ThesisAction id={x._id} action="complete_revision" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
