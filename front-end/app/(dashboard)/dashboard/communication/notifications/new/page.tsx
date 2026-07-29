import { CommunicationForm } from "@/components/communication-form"
import { OperationFormShell } from "@/components/operation-form-shell"
export default function Page() { return <OperationFormShell area="communication" title="Dispatch notification" description="Queue an email or SMS through the configured delivery provider."><CommunicationForm kind="notification" /></OperationFormShell> }
