import { PortalForm } from "@/components/portal-form"
import { PortalFormShell } from "@/components/portal-form-shell"
export default function Page() {
  return (
    <PortalFormShell
      area="research"
      title="Add publication"
      description="Record scholarly output, authorship, venue, and DOI."
    >
      <PortalForm kind="publication" />
    </PortalFormShell>
  )
}
