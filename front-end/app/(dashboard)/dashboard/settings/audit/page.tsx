import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import { CheckCircle2, History, ShieldX } from "lucide-react"
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
type Person = { firstName: string; lastName: string; email: string }
type Audit = {
  _id: string
  actor?: Person
  action: string
  resource: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}
type Login = {
  _id: string
  user?: Person
  email: string
  successful: boolean
  failureReason?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}
export default async function Page() {
  let logs: Audit[] = [],
    logins: Login[] = [],
    error = ""
  try {
    const data = await Promise.all([
      authenticatedRequest<{ items: Audit[] }>(
        withQuery(API_ENDPOINTS.audit.events, { limit: 50 }),
      ),
      authenticatedRequest<{ items: Login[] }>(
        withQuery(API_ENDPOINTS.audit.logins, { limit: 50 }),
      ),
    ])
    logs = data[0].data.items
    logins = data[1].data.items
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Audit evidence unavailable"
  }
  const failures = logins.filter((item) => !item.successful).length
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Security evidence</p>
        <h1 className="mt-1 text-3xl font-bold">Audit & login history</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Immutable operational events and authentication activity.
        </p>
      </div>
      {error && <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={<History />} value={logs.length} label="Recent audit events" />
        <Metric
          icon={<CheckCircle2 />}
          value={logins.length - failures}
          label="Successful logins"
        />
        <Metric icon={<ShieldX />} value={failures} label="Failed logins" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Administrative activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>IP address</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <p className="font-medium">
                      {item.actor ? `${item.actor.firstName} ${item.actor.lastName}` : "System"}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.actor?.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.action}</Badge>
                  </TableCell>
                  <TableCell>
                    <p>{item.resource}</p>
                    <p className="max-w-40 truncate font-mono text-[10px] text-muted-foreground">
                      {item.resourceId}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.ipAddress ?? "—"}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Authentication history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Failure reason</TableHead>
                <TableHead>IP address</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logins.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <p className="font-medium">
                      {item.user ? `${item.user.firstName} ${item.user.lastName}` : item.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.successful ? "secondary" : "destructive"}>
                      {item.successful ? "Successful" : "Failed"}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.failureReason ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{item.ipAddress ?? "—"}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
function Metric({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-primary [&_svg]:size-5">{icon}</div>
        <p className="mt-4 text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
