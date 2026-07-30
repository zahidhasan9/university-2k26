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
import { PAGE_API_MAP } from "@/lib/api-endpoints"

export default function Page() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Developer reference</p>
        <h1 className="mt-1 text-3xl font-bold">Page → API map</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The centralized registry showing which backend contract powers each frontend workspace.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{PAGE_API_MAP.length} workspace mappings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Frontend page</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Backend endpoint</TableHead>
                <TableHead>Purpose</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PAGE_API_MAP.flatMap((entry) =>
                entry.calls.map((call, index) => (
                  <TableRow key={`${entry.page}-${index}`}>
                    <TableCell className="font-mono text-xs">{entry.page}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.module}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{call.method}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{call.endpoint}</TableCell>
                    <TableCell>{call.purpose}</TableCell>
                  </TableRow>
                )),
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Client mutations:</strong> React The centralized
            Axios clients forward browser requests through <code>/api/backend/*</code>.
          </p>
          <p className="mt-2">
            <strong className="text-foreground">Server reads:</strong> Server Components use{" "}
            <code>authenticatedRequest()</code> with the same endpoint catalog.
          </p>
          <p className="mt-2">
            <strong className="text-foreground">Source:</strong> <code>lib/api-endpoints.ts</code>{" "}
            is the single registry.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
