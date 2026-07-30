import { OperationFormShell } from "@/components/operation-form-shell"
import { OperationsForm } from "@/components/operations-form"
export default function Page() {
  return (
    <OperationFormShell
      area="facilities"
      title="Allocate hostel bed"
      description="Capacity and duplicate-allocation rules are validated automatically."
    >
      <OperationsForm
        endpoint="facilities/hostel-allocations"
        submitLabel="Allocate bed"
        fields={[
          { name: "studentId", label: "Student database ID" },
          { name: "roomId", label: "Room ID" },
          { name: "bedNumber", label: "Bed number" },
          { name: "startsAt", label: "Start date", type: "date" },
        ]}
        transform={(v) => ({ ...v, startsAt: new Date(v.startsAt).toISOString() })}
      />
    </OperationFormShell>
  )
}
