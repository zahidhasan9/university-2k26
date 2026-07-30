import Link from "next/link"
import { Activity, FileClock, KeyRound, Server, ShieldCheck, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticatedRequest } from "@/lib/auth"

type Counted<T> = { items: T[]; pagination: { total: number } }
type Health = { uptime: number; timestamp: string }
export default async function SettingsPage() {
  let userCount = 0,
    roleCount = 0,
    permissionCount = 0,
    health: Health | undefined,
    error = ""
  try {
    const data = await Promise.all([
      authenticatedRequest<Counted<unknown>>("/users?limit=1"),
      authenticatedRequest<Counted<unknown>>("/roles?limit=1"),
      authenticatedRequest<Counted<unknown>>("/permissions?limit=1"),
      authenticatedRequest<Health>("/health"),
    ])
    userCount = data[0].data.pagination.total
    roleCount = data[1].data.pagination.total
    permissionCount = data[2].data.pagination.total
    health = data[3].data
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Administration data unavailable"
  }
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">System control</p>
        <h1 className="mt-1 text-3xl font-bold">Administration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Identity, access control, audit evidence, and service status.
        </p>
      </div>
      {error && <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Users />} value={userCount} label="User accounts" />
        <Metric icon={<ShieldCheck />} value={roleCount} label="Access roles" />
        <Metric icon={<KeyRound />} value={permissionCount} label="Permissions" />
        <Metric icon={<Server />} value={health ? "Online" : "Unknown"} label="API status" />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <AdminLink
          href="/dashboard/settings/users"
          icon={<Users />}
          title="User management"
          text="Create accounts, inspect assigned roles, and control account access."
        />
        <AdminLink
          href="/dashboard/settings/roles"
          icon={<ShieldCheck />}
          title="Roles & permissions"
          text="Review the RBAC matrix and create scoped custom roles."
        />
        <AdminLink
          href="/dashboard/settings/audit"
          icon={<FileClock />}
          title="Audit & login history"
          text="Trace administrative changes and successful or failed sign-ins."
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>System health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <Activity className="size-5 text-emerald-600" />
              <div>
                <p className="font-semibold">UniSphere API</p>
                <p className="text-sm text-muted-foreground">
                  {health
                    ? `Running for ${Math.floor(health.uptime / 60)} minutes · checked ${new Date(health.timestamp).toLocaleString()}`
                    : "Health information unavailable"}
                </p>
              </div>
            </div>
            <Badge variant={health ? "secondary" : "outline"}>
              {health ? "Healthy" : "Unknown"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number | string
  label: string
}) {
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
function AdminLink({
  href,
  icon,
  title,
  text,
}: {
  href: string
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-primary [&_svg]:size-6">{icon}</div>
        <h2 className="mt-5 text-lg font-semibold">{title}</h2>
        <p className="mt-2 min-h-10 text-sm text-muted-foreground">{text}</p>
        <Button className="mt-5" variant="outline" render={<Link href={href} />}>
          Open workspace
        </Button>
      </CardContent>
    </Card>
  )
}
