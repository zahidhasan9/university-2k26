import { ExpenseForm } from "@/components/finance-form";
import { FinanceFormShell } from "@/components/finance-form-shell";
export default function NewExpensePage() {
  return (
    <FinanceFormShell
      title="Create expense"
      description="Record a new institutional expense for approval."
    >
      <ExpenseForm />
    </FinanceFormShell>
  );
}
