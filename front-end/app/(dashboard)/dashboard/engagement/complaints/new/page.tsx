import { PortalForm } from "@/components/portal-form"
import { PortalFormShell } from "@/components/portal-form-shell"
export default function Page() {
  return (
    <PortalFormShell
      area="engagement"
      title="Submit complaint"
      description="Create a trackable campus service complaint."
    >
      <PortalForm kind="complaint" />
    </PortalFormShell>
  )
}
