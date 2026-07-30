"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  FileCode2,
  FileText,
  FlaskConical,
  GraduationCap,
  Hotel,
  LayoutDashboard,
  Library,
  MessageSquareText,
  PackageOpen,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

type NavigationItem = { label: string; href: string; icon: LucideIcon }
type NavigationGroup = { label: string; icon: LucideIcon; items: NavigationItem[] }

const navigation: NavigationGroup[] = [
  {
    label: "Dashboards",
    icon: LayoutDashboard,
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { label: "Reports", href: "/dashboard/reports", icon: FileText },
    ],
  },
  {
    label: "University",
    icon: GraduationCap,
    items: [
      { label: "Academics", href: "/dashboard/academics", icon: GraduationCap },
      { label: "Students", href: "/dashboard/students", icon: Users },
      { label: "Faculty & HR", href: "/dashboard/faculty", icon: Building2 },
      { label: "Admissions", href: "/dashboard/admissions", icon: FileText },
      { label: "Attendance", href: "/dashboard/attendance", icon: ClipboardCheck },
      { label: "Exams & Results", href: "/dashboard/results", icon: BookOpen },
      { label: "LMS", href: "/dashboard/lms", icon: GraduationCap },
      { label: "Research", href: "/dashboard/research", icon: FlaskConical },
      { label: "Engagement", href: "/dashboard/engagement", icon: Sparkles },
    ],
  },
  {
    label: "Operations",
    icon: Building2,
    items: [
      { label: "Finance", href: "/dashboard/finance", icon: CircleDollarSign },
      { label: "Library", href: "/dashboard/library", icon: Library },
      { label: "Facilities", href: "/dashboard/facilities", icon: Hotel },
      { label: "Inventory", href: "/dashboard/inventory", icon: PackageOpen },
      { label: "Communication", href: "/dashboard/communication", icon: MessageSquareText },
      { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "System",
    icon: Settings,
    items: [
      { label: "Administration", href: "/dashboard/settings", icon: ShieldCheck },
      { label: "API Map", href: "/dashboard/settings/api-map", icon: FileCode2 },
    ],
  },
]

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))
}

function findRouteGroup(pathname: string) {
  const index = navigation.findIndex((group) =>
    group.items.some((item) => isActiveRoute(pathname, item.href)),
  )
  return index < 0 ? 0 : index
}

export function AppSidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const routeGroup = findRouteGroup(pathname)
  const [openedGroup, setOpenedGroup] = useState<number | null>(null)
  const selectedIndex = openedGroup ?? routeGroup
  const selectedGroup = navigation[selectedIndex]

  return (
    <aside className="flex h-full gap-2 overflow-hidden bg-slate-50/60 p-2 text-slate-600 shadow-[8px_0_30px_rgba(30,41,59,0.06)]">
      <nav
        aria-label="Navigation categories"
        className="sidebar-scrollbar flex w-[96px] shrink-0 flex-col overflow-y-auto rounded-[24px] border border-slate-100 bg-white py-3 shadow-[0_8px_24px_rgba(30,41,59,0.045)]"
      >
        <div className="space-y-1">
          {navigation.map((group, index) => {
            const Icon = group.icon
            const selected = selectedIndex === index

            return (
              <button
                key={group.label}
                type="button"
                onClick={() => setOpenedGroup(index)}
                aria-pressed={selected}
                className={cn(
                  "relative mx-2 flex h-[78px] w-[78px] flex-col items-center justify-center gap-2 rounded-2xl border border-transparent px-2 text-[11px] font-medium transition-all duration-200 ease-out",
                  selected
                    ? "border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50/60 text-violet-700 shadow-[0_8px_18px_rgba(124,58,237,0.1)]"
                    : "text-slate-500 hover:-translate-y-0.5 hover:border-slate-100 hover:bg-white hover:text-violet-600 hover:shadow-[0_7px_16px_rgba(30,41,59,0.07)]",
                )}
              >
                <Icon
                  className={cn("size-[23px]", selected && "fill-violet-600/10")}
                  strokeWidth={1.55}
                />
                <span>{group.label}</span>
                {selected && (
                  <span className="absolute inset-y-5 -left-[9px] w-[3px] rounded-full bg-violet-600 shadow-[0_0_8px_rgba(124,58,237,0.35)]" />
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-auto space-y-1 pt-8">
          <Link
            href="/dashboard/settings/api-map"
            onClick={onNavigate}
            className="mx-2 flex h-[68px] flex-col items-center justify-center gap-2 rounded-2xl border border-transparent text-[11px] text-slate-500 transition-all duration-200 hover:border-violet-100 hover:bg-violet-50/60 hover:text-violet-600"
          >
            <FileCode2 className="size-[21px]" strokeWidth={1.55} />
            Docs
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={onNavigate}
            className="mx-2 flex h-[68px] flex-col items-center justify-center gap-2 rounded-2xl border border-transparent text-[11px] text-slate-500 transition-all duration-200 hover:border-violet-100 hover:bg-violet-50/60 hover:text-violet-600"
          >
            <Settings className="size-[22px]" strokeWidth={1.55} />
            Settings
          </Link>
        </div>
      </nav>

      {!collapsed && (
        <nav
          aria-label={`${selectedGroup.label} navigation`}
          className="sidebar-scrollbar w-[260px] shrink-0 overflow-y-auto rounded-[26px] border border-slate-100 bg-white px-7 py-8 shadow-[0_10px_30px_rgba(30,41,59,0.055)]"
        >
          <h2 className="mb-7 text-[15px] font-semibold text-violet-600">{selectedGroup.label}</h2>
          <ul className="space-y-1.5">
            {selectedGroup.items.map(({ label, href, icon: Icon }) => {
              const active = isActiveRoute(pathname, href)

              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => {
                      setOpenedGroup(null)
                      onNavigate?.()
                    }}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-[44px] items-center gap-3 rounded-xl border px-3.5 text-[14px] transition-all duration-200 ease-out",
                      active
                        ? "border-violet-100 bg-gradient-to-r from-violet-50 to-fuchsia-50/50 font-semibold text-violet-700 shadow-[0_7px_18px_rgba(124,58,237,0.08)]"
                        : "border-transparent text-slate-600 hover:translate-x-1 hover:border-slate-100 hover:bg-slate-50/80 hover:text-violet-600",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-[20px] shrink-0 text-slate-400",
                        active && "text-violet-600",
                      )}
                      strokeWidth={1.55}
                    />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </aside>
  )
}
