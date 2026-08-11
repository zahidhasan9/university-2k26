import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import { CopyForm } from "@/components/library-forms"
import { LibraryFormShell } from "@/components/library-form-shell"
import { authenticatedRequest } from "@/lib/auth"
type Book = { _id: string; title: string; authors: string[]; isbn?: string }
export default async function NewCopyPage() {
  const books = (
    await authenticatedRequest<{ items: Book[] }>(withQuery(API_ENDPOINTS.library.books, { status: "active", limit: 100 }))
  ).data.items
  return (
    <LibraryFormShell
      title="Register physical copy"
      description="Add accession, barcode, shelf, and condition details."
    >
      <CopyForm books={books} />
    </LibraryFormShell>
  )
}
