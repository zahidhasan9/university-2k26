import { CommunicationForm } from "@/components/communication-form"
import { OperationFormShell } from "@/components/operation-form-shell"
export default function Page() {
  return (
    <OperationFormShell
      area="communication"
      title="Start conversation"
      description="Create a direct or group conversation using active user IDs."
    >
      <CommunicationForm kind="conversation" />
    </OperationFormShell>
  )
}
