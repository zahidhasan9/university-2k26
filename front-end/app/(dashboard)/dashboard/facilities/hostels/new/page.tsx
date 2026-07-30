import { OperationFormShell } from "@/components/operation-form-shell"
import { OperationsForm } from "@/components/operations-form"
export default function Page() {
  return (
    <OperationFormShell
      area="facilities"
      title="Create hostel"
      description="Register a campus accommodation building."
    >
      <OperationsForm
        endpoint="facilities/hostels"
        fields={[
          { name: "name", label: "Hostel name" },
          { name: "code", label: "Code" },
          { name: "gender", label: "Gender (male, female, or coed)", placeholder: "coed" },
          { name: "address", label: "Address" },
        ]}
      />
    </OperationFormShell>
  )
}
