"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Hotel,
  LayoutDashboard,
  Library,
  MessageSquareText,
  PackageOpen,
  FlaskConical,
  ShieldCheck,
  Sparkles,
  Settings,
  Users,
} from "lucide-react"

import { Brand } from "@/components/brand"
import { cn } from "@/lib/utils"

const groups = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { label: "Reports", href: "/dashboard/reports", icon: FileText },
      { label: "Administration", href: "/dashboard/settings", icon: ShieldCheck },
      { label: "API Map", href: "/dashboard/settings/api-map", icon: FileText },
    ],
  },
  {
    label: "University",
    items: [
      { label: "Academics", href: "/dashboard/academics", icon: GraduationCap },
      { label: "Students", href: "/dashboard/students", icon: Users },
      { label: "Faculty & HR", href: "/dashboard/faculty", icon: Building2 },
      { label: "Admissions", href: "/dashboard/admissions", icon: FileText },
      { label: "Attendance", href: "/dashboard/attendance", icon: ClipboardCheck },
      { label: "Exams & Results", href: "/dashboard/results", icon: BookOpen },
      { label: "LMS", href: "/dashboard/lms", icon: GraduationCap },
      { label: "Research", href: "/dashboard/research", icon: FlaskConical },
      { label: "Thesis Admin", href: "/dashboard/research/theses/manage", icon: ShieldCheck },
      { label: "Engagement", href: "/dashboard/engagement", icon: Sparkles },
      { label: "Engagement Admin", href: "/dashboard/engagement/manage", icon: ShieldCheck },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Finance", href: "/dashboard/finance", icon: CircleDollarSign },
      { label: "Library", href: "/dashboard/library", icon: Library },
      { label: "Facilities", href: "/dashboard/facilities", icon: Hotel },
      { label: "Inventory", href: "/dashboard/inventory", icon: PackageOpen },
      { label: "Communication", href: "/dashboard/communication", icon: MessageSquareText },
      { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
    ],
  },
]

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-full flex-col bg-slate-950 text-slate-300">
      <div className="flex h-20 items-center border-b border-white/10 px-5">
        <Brand className="text-white [&_span_span:last-child]:text-slate-400" />
      </div>
      <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map(({ label, href, icon: Icon }) => {
                const active =
                  pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className="size-[18px]" />
                    <span className="flex-1">{label}</span>
                    {label === "Academics" && <ChevronDown className="size-3.5 opacity-60" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link
          href="/dashboard/settings"
          className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-white/5 hover:text-white"
        >
          <Settings className="size-[18px]" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
