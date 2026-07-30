import { CommunicationForm } from "@/components/communication-form"
import { OperationFormShell } from "@/components/operation-form-shell"
export default function Page() {
  return (
    <OperationFormShell
      area="communication"
      title="Create notice"
      description="Publish immediately, schedule, or retain as a draft."
    >
      <CommunicationForm kind="notice" />
    </OperationFormShell>
  )
}
