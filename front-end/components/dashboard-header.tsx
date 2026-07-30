"use client"

import { useQuery } from "@tanstack/react-query"
import { Bell, ChevronDown, Grid2X2, Menu, Search, Sun } from "lucide-react"
import Link from "next/link"

import { AppSidebar } from "@/components/app-sidebar"
import { Brand } from "@/components/brand"
import { LogoutItem } from "@/components/logout-item"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { apiRequest } from "@/lib/http-client"

type CurrentUser = {
  firstName: string
  lastName: string
  email: string
  roles: Array<{ code?: string; name?: string }>
  avatarUrl?: string
}

export function DashboardHeader({
  sidebarCollapsed,
  onSidebarToggle,
}: {
  sidebarCollapsed: boolean
  onSidebarToggle: () => void
}) {
  const { data } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiRequest<{ user: CurrentUser }>("/auth/me"),
  })
  const user = data?.data.user
  const fullName = user ? `${user.firstName} ${user.lastName}` : "My account"
  const initials = user ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() : "U"
  const roleName = user?.roles[0]?.name ?? user?.roles[0]?.code ?? "User"

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-[72px] items-center rounded-b-2xl border-x border-b border-slate-100 bg-white/95 px-4 text-slate-600 shadow-[0_8px_30px_rgba(30,41,59,0.06)] backdrop-blur-xl sm:px-5">
      <div className="flex h-full items-center gap-5 lg:w-[264px]">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-500 hover:bg-slate-100 hover:text-violet-600 lg:hidden"
                aria-label="Open navigation"
              />
            }
          >
            <Menu />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[264px] max-w-[88vw] border-0 bg-white p-0 pt-[72px]"
            showCloseButton
          >
            <AppSidebar />
          </SheetContent>
        </Sheet>

        <Brand className="text-slate-900 [&_span:first-child]:rounded-xl [&_span:first-child]:bg-gradient-to-br [&_span:first-child]:from-violet-500 [&_span:first-child]:to-violet-700 [&_span:last-child]:hidden" />

        <div className="hidden items-center gap-2 text-[13px] font-semibold text-slate-600 sm:flex">
          <span>UniSphere 2.0</span>
          <button
            type="button"
            onClick={onSidebarToggle}
            className="hidden rounded-xl border border-transparent p-2 text-slate-500 transition-all duration-200 hover:border-violet-100 hover:bg-violet-50 hover:text-violet-600 hover:shadow-sm lg:inline-flex"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
            aria-expanded={!sidebarCollapsed}
          >
            <Menu className="size-[19px]" strokeWidth={1.7} />
          </button>
        </div>
      </div>

      <nav aria-label="Header actions" className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-transparent text-slate-500 transition-all duration-200 hover:border-violet-100 hover:bg-violet-50 hover:text-violet-600"
          aria-label="Search"
        >
          <Search className="size-[22px]" strokeWidth={1.45} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden rounded-full border border-transparent text-slate-500 transition-all duration-200 hover:border-violet-100 hover:bg-violet-50 hover:text-violet-600 sm:inline-flex"
          aria-label="Applications"
        >
          <Grid2X2 className="size-[21px]" strokeWidth={1.45} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full border border-transparent text-slate-500 transition-all duration-200 hover:border-violet-100 hover:bg-violet-50 hover:text-violet-600"
          aria-label="Notifications"
        >
          <Bell className="size-[21px]" strokeWidth={1.45} />
          <span className="absolute right-2.5 top-2 size-1.5 rounded-full bg-violet-600" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden rounded-full border border-transparent text-slate-500 transition-all duration-200 hover:border-violet-100 hover:bg-violet-50 hover:text-violet-600 md:inline-flex"
          aria-label="Theme"
        >
          <Sun className="size-[21px]" strokeWidth={1.45} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="ml-2 flex items-center gap-2 rounded-full border border-transparent p-1 text-left transition-all duration-200 hover:border-violet-100 hover:bg-violet-50/60 sm:ml-3"
                aria-label="Open account menu"
              />
            }
          >
            <span className="hidden max-w-32 truncate text-[13.5px] font-semibold text-slate-700 md:block">
              {fullName}
            </span>
            <Avatar className="size-10 ring-2 ring-white/10">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={fullName} />}
              <AvatarFallback className="bg-violet-600 text-sm font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="hidden size-3 text-slate-400 sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="w-60 rounded-xl border-slate-100 p-2 shadow-xl"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center justify-between px-2 py-2">
                My account <Badge variant="secondary">{roleName}</Badge>
              </DropdownMenuLabel>
              <DropdownMenuItem className="px-2 py-2" render={<Link href="/dashboard/profile" />}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="px-2 py-2" render={<Link href="/dashboard/settings" />}>
                Account settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <LogoutItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  )
}
