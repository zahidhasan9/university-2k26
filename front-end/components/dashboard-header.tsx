"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiRequest } from "@/lib/http-client"
import { CACHE_POLICY, QUERY_KEYS } from "@/lib/query-policy"

export type CurrentUser = {
  firstName: string
  lastName: string
  email: string
  roles: Array<{ code?: string; name?: string }>
  avatarUrl?: string
}

type HeaderNotification = {
  _id: string
  title: string
  body: string
  type: string
  status: "queued" | "sent" | "failed" | "read"
  createdAt: string
}

export function DashboardHeader({
  sidebarCollapsed,
  onSidebarToggle,
  initialUser,
}: {
  sidebarCollapsed: boolean
  onSidebarToggle: () => void
  initialUser?: CurrentUser
}) {
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: QUERY_KEYS.auth.me,
    queryFn: () => apiRequest<{ user: CurrentUser }>(API_ENDPOINTS.auth.me),
    initialData: initialUser ? { success: true, message: "Current user", data: { user: initialUser } } : undefined,
    ...CACHE_POLICY.identity,
  })
  const { data: notificationData } = useQuery({
    queryKey: QUERY_KEYS.notifications.header,
    queryFn: () =>
      apiRequest<{ items: HeaderNotification[]; unreadCount: number }>(
        `${API_ENDPOINTS.communication.notifications}?limit=6`,
      ),
    ...CACHE_POLICY.realtime,
  })
  const notifications = notificationData?.data.items ?? []
  const unreadCount = notificationData?.data.unreadCount ?? 0
  const readNotification = useMutation({
    mutationFn: (id: string) =>
      apiRequest(API_ENDPOINTS.communication.readNotification(id), { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all }),
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
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="relative grid size-9 place-items-center rounded-full border border-transparent text-slate-500 transition-all duration-200 hover:border-violet-100 hover:bg-violet-50 hover:text-violet-600"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              />
            }
          >
            <Bell className="size-[21px]" strokeWidth={1.45} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-violet-600 px-1 text-[9px] font-bold leading-4 text-white ring-2 ring-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={12}
            className="w-[min(92vw,23rem)] rounded-2xl border-slate-100 p-2 shadow-2xl shadow-slate-200/70"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center justify-between px-3 py-2.5">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <Badge className="bg-violet-50 text-violet-700" variant="secondary">
                    {unreadCount} unread
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification._id}
                  className="items-start gap-3 rounded-xl px-3 py-3"
                  onClick={() => {
                    if (notification.status !== "read") readNotification.mutate(notification._id)
                  }}
                >
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      notification.status === "read" ? "bg-slate-200" : "bg-violet-600"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-slate-700">
                      {notification.title}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-slate-400">
                      {notification.body}
                    </span>
                  </span>
                </DropdownMenuItem>
              ))}
              {notifications.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <Bell className="mx-auto size-7 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-400">No notifications yet</p>
                </div>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center rounded-xl py-2.5 font-semibold text-violet-600"
              render={<Link href="/dashboard/communication" />}
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <Avatar className="size-11 shadow-sm ring-2 ring-violet-100">
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
