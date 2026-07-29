import { AdminForm } from "@/components/admin-form"
import { AdminFormShell } from "@/components/admin-form-shell"
export default function Page() { return <AdminFormShell title="Create user" description="Provision an account with a strong temporary password and optional roles." back="/dashboard/settings/users"><AdminForm kind="user" /></AdminFormShell> }
