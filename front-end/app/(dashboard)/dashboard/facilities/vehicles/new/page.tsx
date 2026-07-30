import { OperationFormShell } from "@/components/operation-form-shell"
import { OperationsForm } from "@/components/operations-form"
export default function Page() {
  return (
    <OperationFormShell
      area="facilities"
      title="Register vehicle"
      description="Add a vehicle to the university transport fleet."
    >
      <OperationsForm
        endpoint="facilities/vehicles"
        fields={[
          { name: "registrationNumber", label: "Registration number" },
          { name: "name", label: "Vehicle name" },
          { name: "type", label: "Type (bus, minibus, van, or car)", placeholder: "bus" },
          { name: "capacity", label: "Passenger capacity", type: "number" },
          { name: "driverName", label: "Driver name", required: false },
          { name: "driverPhone", label: "Driver phone", required: false },
        ]}
        transform={(v) => ({
          ...v,
          capacity: Number(v.capacity),
          driverName: v.driverName || undefined,
          driverPhone: v.driverPhone || undefined,
        })}
      />
    </OperationFormShell>
  )
}
