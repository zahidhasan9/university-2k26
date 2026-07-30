import { AlumniVerify, ComplaintAction } from "@/components/advanced-actions"
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
type Complaint = {
  _id: string
  complaintNumber: string
  complainant: { firstName: string; lastName: string }
  subject: string
  category: string
  priority: string
  status: string
}
type Alumni = {
  _id: string
  user: { firstName: string; lastName: string }
  program?: { name: string }
  graduationYear: number
  status: string
}
export default async function Page() {
  let complaints: Complaint[] = [],
    alumni: Alumni[] = [],
    error = ""
  try {
    const d = await Promise.all([
      authenticatedRequest<{ items: Complaint[] }>("/engagement/complaints?limit=100"),
      authenticatedRequest<{ alumni: Alumni[] }>("/engagement/alumni"),
    ])
    complaints = d[0].data.items
    alumni = d[1].data.alumni
  } catch (c) {
    error = c instanceof Error ? c.message : "Management data unavailable"
  }
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Engagement administration</p>
        <h1 className="mt-1 text-3xl font-bold">Case & alumni management</h1>
      </div>
      {error && <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      <Card>
        <CardHeader>
          <CardTitle>Complaint queue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Complainant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((x) => (
                <TableRow key={x._id}>
                  <TableCell>
                    <p className="font-medium">{x.subject}</p>
                    <p className="font-mono text-xs text-muted-foreground">{x.complaintNumber}</p>
                  </TableCell>
                  <TableCell>
                    {x.complainant?.firstName} {x.complainant?.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge variant={x.priority === "urgent" ? "destructive" : "outline"}>
                      {x.category} · {x.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{x.status}</TableCell>
                  <TableCell>
                    <ComplaintAction id={x._id} status={x.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Alumni verification</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumni</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {alumni.map((x) => (
                <TableRow key={x._id}>
                  <TableCell>
                    {x.user?.firstName} {x.user?.lastName}
                  </TableCell>
                  <TableCell>{x.program?.name ?? "—"}</TableCell>
                  <TableCell>{x.graduationYear}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{x.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <AlumniVerify id={x._id} status={x.status} />
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
