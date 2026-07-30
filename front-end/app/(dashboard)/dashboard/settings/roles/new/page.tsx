import { AdminForm } from "@/components/admin-form"
import { AdminFormShell } from "@/components/admin-form-shell"
export default function Page() {
  return (
    <AdminFormShell
      title="Create access role"
      description="Use permission IDs from the catalog to build a least-privilege role."
      back="/dashboard/settings/roles"
    >
      <AdminForm kind="role" />
    </AdminFormShell>
  )
}
