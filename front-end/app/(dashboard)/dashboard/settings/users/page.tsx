import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import Link from "next/link"
import { Plus } from "lucide-react"
import { UserStatusAction } from "@/components/admin-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
type Role = { _id: string; code: string; name: string }
type User = {
  _id: string
  firstName: string
  lastName: string
  email: string
  status: string
  roles: Role[]
  createdAt: string
}
export default async function Page() {
  let users: User[] = [],
    error = ""
  try {
    users = (await authenticatedRequest<{ items: User[] }>(withQuery(API_ENDPOINTS.users.list, { limit: 100 }))).data.items
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Users unavailable"
  }
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="mt-1 text-3xl font-bold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accounts, role membership, and access status.
          </p>
        </div>
        <Button render={<Link href="/dashboard/settings/users/new" />}>
          <Plus />
          Create user
        </Button>
      </div>
      {error && <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      <Card>
        <CardHeader>
          <CardTitle>Account directory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role._id} variant="secondary">
                          {role.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "secondary" : "outline"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <UserStatusAction id={user._id} status={user.status} />
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
