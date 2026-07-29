import { BookForm } from "@/components/library-forms"
import { LibraryFormShell } from "@/components/library-form-shell"
export default function NewBookPage() { return <LibraryFormShell title="Add catalog title" description="Create a new bibliographic record."><BookForm /></LibraryFormShell> }
