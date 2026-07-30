import Link from "next/link"
import { BookPlus, LibraryBig, NotebookTabs, Repeat2, ScanBarcode } from "lucide-react"
const links = [
  { href: "/dashboard/library", label: "Overview", icon: LibraryBig },
  { href: "/dashboard/library/books/new", label: "Add book", icon: BookPlus },
  { href: "/dashboard/library/copies/new", label: "Add copy", icon: ScanBarcode },
  { href: "/dashboard/library/issue", label: "Issue book", icon: Repeat2 },
  { href: "/dashboard/library/policies", label: "Policies", icon: NotebookTabs },
]
export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <nav className="flex gap-2 overflow-x-auto rounded-xl border bg-card p-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
