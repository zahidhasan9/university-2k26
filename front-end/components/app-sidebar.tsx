"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
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

function routeGroup(pathname: string) {
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
  const currentGroup = routeGroup(pathname)
  const [openGroup, setOpenGroup] = useState<number | null>(currentGroup)

  function toggleGroup(index: number) {
    if (collapsed) return
    setOpenGroup((opened) => (opened === index ? null : index))
  }

  return (
    <aside className="h-full bg-slate-50/60 p-2">
      <nav
        aria-label="Main navigation"
        className="sidebar-scrollbar flex h-full flex-col overflow-y-auto rounded-[24px] border border-slate-100 bg-white px-2 py-3 shadow-[0_10px_30px_rgba(30,41,59,0.06)]"
      >
        <div className="space-y-1">
          {navigation.map((group, index) => {
            const Icon = group.icon
            const active = currentGroup === index
            const opened = openGroup === index && !collapsed

            return (
              <section key={group.label}>
                <button
                  type="button"
                  onClick={() => toggleGroup(index)}
                  aria-expanded={opened}
                  className={cn(
                    "group flex h-12 w-full items-center rounded-xl border border-transparent text-[14px] font-semibold tracking-[-0.01em] transition-all duration-200",
                    collapsed ? "justify-center px-0" : "gap-3 px-3",
                    active
                      ? "border-violet-100 bg-gradient-to-r from-violet-50 to-fuchsia-50/50 text-violet-700 shadow-[0_6px_16px_rgba(124,58,237,0.08)]"
                      : "text-slate-500 hover:border-slate-100 hover:bg-slate-50 hover:text-violet-600",
                  )}
                  title={collapsed ? group.label : undefined}
                >
                  <Icon
                    className={cn(
                      "size-[19px] shrink-0 transition-colors",
                      active ? "text-violet-600" : "text-slate-400 group-hover:text-violet-600",
                    )}
                    strokeWidth={1.7}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{group.label}</span>
                      <ChevronDown
                        className={cn(
                          "size-4 text-slate-400 transition-transform duration-200",
                          opened && "rotate-180 text-violet-500",
                        )}
                      />
                    </>
                  )}
                </button>

                <div
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-250 ease-out",
                    opened ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <ul className="relative ml-5 space-y-1 border-l border-violet-100 py-2 pl-4">
                      {group.items.map(({ label, href, icon: ChildIcon }) => {
                        const childActive = isActiveRoute(pathname, href)
                        return (
                          <li key={href}>
                            <Link
                              href={href}
                              onClick={onNavigate}
                              aria-current={childActive ? "page" : undefined}
                              className={cn(
                                "flex min-h-10 items-center gap-3 rounded-xl border px-3 text-[13.5px] font-medium transition-all duration-200",
                                childActive
                                  ? "border-violet-100 bg-violet-50/80 font-semibold text-violet-700"
                                  : "border-transparent text-slate-500 hover:translate-x-0.5 hover:bg-slate-50 hover:text-violet-600",
                              )}
                            >
                              <ChildIcon
                                className={cn(
                                  "size-4 shrink-0",
                                  childActive ? "text-violet-600" : "text-slate-400",
                                )}
                                strokeWidth={1.7}
                              />
                              <span>{label}</span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </section>
            )
          })}
        </div>

        <div className="mt-auto space-y-1 border-t border-slate-100 pt-3">
          <Link
            href="/dashboard/settings/api-map"
            onClick={onNavigate}
            title={collapsed ? "Docs" : undefined}
            className={cn(
              "flex h-11 items-center rounded-xl text-[13.5px] font-semibold text-slate-500 transition-colors hover:bg-violet-50 hover:text-violet-600",
              collapsed ? "justify-center" : "gap-3 px-3",
            )}
          >
            <FileCode2 className="size-[18px] shrink-0" />
            {!collapsed && "Docs"}
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={onNavigate}
            title={collapsed ? "Settings" : undefined}
            className={cn(
              "flex h-11 items-center rounded-xl text-[13.5px] font-semibold text-slate-500 transition-colors hover:bg-violet-50 hover:text-violet-600",
              collapsed ? "justify-center" : "gap-3 px-3",
            )}
          >
            <Settings className="size-[18px] shrink-0" />
            {!collapsed && "Settings"}
          </Link>
        </div>
      </nav>
    </aside>
  )
}
