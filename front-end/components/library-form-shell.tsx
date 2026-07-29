import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
export function LibraryFormShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div className="mx-auto max-w-2xl space-y-6"><Button variant="ghost" render={<Link href="/dashboard/library" />}><ArrowLeft /> Library</Button><div><h1 className="text-3xl font-bold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><Card><CardHeader><CardTitle>Library information</CardTitle></CardHeader><CardContent>{children}</CardContent></Card></div> }
