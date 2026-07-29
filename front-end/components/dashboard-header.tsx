"use client"

import { Bell, Menu, Search } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { LogoutItem } from "@/components/logout-item"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:px-8">
      <Sheet>
        <SheetTrigger
          render={<Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu" />}
        >
          <Menu />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-0 p-0">
          <AppSidebar />
        </SheetContent>
      </Sheet>
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-10 bg-muted/60 pl-9" placeholder="Search students, courses, or actions..." />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-blue-600 ring-2 ring-background" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-3 rounded-lg p-1.5 text-left hover:bg-muted" />
            }
          >
            <Avatar className="size-9">
              <AvatarFallback className="bg-blue-100 text-sm font-semibold text-blue-700">MA</AvatarFallback>
            </Avatar>
            <span className="hidden sm:block">
              <span className="block text-sm font-semibold">Mamun Ahmed</span>
              <span className="block text-xs text-muted-foreground">Super Admin</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center justify-between">
              My account <Badge variant="secondary">Admin</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Account settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <LogoutItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
