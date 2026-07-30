import { Mail, ShieldCheck, UserRound } from "lucide-react"

import { ProfileEditForm } from "@/components/profile-edit-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticatedRequest } from "@/lib/auth"

type ProfileUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  status: string
  roles: Array<{ _id?: string; code?: string; name?: string }>
  createdAt?: string
  phone?: string
  avatarUrl?: string
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
}

export default async function ProfilePage() {
  const { data } = await authenticatedRequest<{ user: ProfileUser }>("/auth/me")
  const { user } = data
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">My account</p>
        <h1 className="mt-1 text-3xl font-bold">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account identity, access roles, and current status.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-4 border-b">
          <Avatar className="size-24 shadow-sm">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
            )}
            <AvatarFallback className="bg-blue-100 text-lg font-semibold text-blue-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">
              {user.firstName} {user.lastName}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Badge
            className="ml-auto capitalize"
            variant={user.status === "active" ? "secondary" : "outline"}
          >
            {user.status}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="rounded-xl border p-4">
            <Mail className="size-5 text-primary" />
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email
            </p>
            <p className="mt-1 font-medium">{user.email}</p>
          </div>
          <div className="rounded-xl border p-4">
            <UserRound className="size-5 text-primary" />
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Member since
            </p>
            <p className="mt-1 font-medium">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Not available"}
            </p>
          </div>
          <div className="rounded-xl border p-4 sm:col-span-2">
            <ShieldCheck className="size-5 text-primary" />
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Access roles
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {user.roles.length ? (
                user.roles.map((role, index) => (
                  <Badge key={role._id ?? role.code ?? index} variant="outline">
                    {role.name ?? role.code ?? "Assigned role"}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No roles assigned</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Edit contact profile</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update your profile picture, phone number, and address.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <ProfileEditForm user={user} />
        </CardContent>
      </Card>
    </div>
  )
}
