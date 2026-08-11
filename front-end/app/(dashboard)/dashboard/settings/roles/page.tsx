import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticatedRequest } from "@/lib/auth"
type Permission = { _id: string; code: string; name: string; description?: string }
type Role = {
  _id: string
  code: string
  name: string
  description?: string
  permissions: Permission[]
  isSystem: boolean
}
export default async function Page() {
  let roles: Role[] = [],
    permissions: Permission[] = [],
    error = ""
  try {
    const data = await Promise.all([
      authenticatedRequest<{ items: Role[] }>(withQuery(API_ENDPOINTS.roles.list, { limit: 100 })),
      authenticatedRequest<{ items: Permission[] }>(withQuery(API_ENDPOINTS.permissions.list, { limit: 250 })),
    ])
    roles = data[0].data.items
    permissions = data[1].data.items
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Access-control data unavailable"
  }
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Access control</p>
          <h1 className="mt-1 text-3xl font-bold">Roles & permissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review effective capabilities and compose custom access roles.
          </p>
        </div>
        <Button render={<Link href="/dashboard/settings/roles/new" />}>
          <Plus />
          Create role
        </Button>
      </div>
      {error && <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        {roles.map((role) => (
          <Card key={role._id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{role.name}</CardTitle>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{role.code}</p>
                </div>
                {role.isSystem && <Badge variant="outline">System</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {role.description || "No description provided."}
              </p>
              <div className="mt-4 flex flex-wrap gap-1">
                {role.permissions.slice(0, 12).map((permission) => (
                  <Badge key={permission._id} variant="secondary">
                    {permission.code}
                  </Badge>
                ))}
                {role.permissions.length > 12 && (
                  <Badge variant="outline">+{role.permissions.length - 12} more</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Permission catalog ({permissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {permissions.map((permission) => (
              <div key={permission._id} className="rounded-lg border p-3">
                <p className="font-mono text-xs font-semibold">{permission.code}</p>
                <p className="mt-1 text-xs text-muted-foreground">{permission.name}</p>
                <p className="mt-2 break-all text-[10px] text-muted-foreground">{permission._id}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
