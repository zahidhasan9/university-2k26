import { IssueForm } from "@/components/library-forms"
import { LibraryFormShell } from "@/components/library-form-shell"
import { authenticatedRequest } from "@/lib/auth"
type Copy = { _id: string; accessionNumber: string; book: { title: string } }
type User = { _id: string; firstName: string; lastName: string; email: string }
export default async function IssueBookPage() {
  const [copies, users] = await Promise.all([
    authenticatedRequest<{ copies: Copy[] }>("/library/copies?status=available"),
    authenticatedRequest<{ items: User[] }>("/users?status=active&limit=100"),
  ])
  return (
    <LibraryFormShell
      title="Issue book"
      description="Assign an available copy under the configured borrower policy."
    >
      <IssueForm copies={copies.data.copies} users={users.data.items} />
    </LibraryFormShell>
  )
}
