import Link from "next/link"
import { BookOpen, FileUp, MessagesSquare, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { authenticatedRequest } from "@/lib/auth"
type Material = {
  _id: string
  title: string
  description?: string
  type: string
  url: string
  published: boolean
  order: number
}
type Assignment = {
  _id: string
  title: string
  instructions: string
  dueAt: string
  maxScore: number
  published: boolean
}
type Post = {
  _id: string
  title?: string
  body: string
  author: { firstName: string; lastName: string }
  createdAt: string
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ offeringId?: string }>
}) {
  const { offeringId = "" } = await searchParams
  let materials: Material[] = [],
    assignments: Assignment[] = [],
    posts: Post[] = [],
    error = ""
  if (offeringId)
    try {
      const d = await Promise.all([
        authenticatedRequest<{ materials: Material[] }>(`/lms/materials?offeringId=${offeringId}`),
        authenticatedRequest<{ assignments: Assignment[] }>(
          `/lms/assignments?offeringId=${offeringId}`,
        ),
        authenticatedRequest<{ posts: Post[] }>(`/lms/discussions?offeringId=${offeringId}`),
      ])
      materials = d[0].data.materials
      assignments = d[1].data.assignments
      posts = d[2].data.posts
    } catch (c) {
      error = c instanceof Error ? c.message : "LMS data unavailable"
    }
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Digital learning</p>
          <h1 className="mt-1 text-3xl font-bold">Learning management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Course materials, assignments, quizzes, and discussion.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href="/dashboard/lms/materials/new" />}>
            <Plus />
            Material
          </Button>
          <Button render={<Link href="/dashboard/lms/assignments/new" />}>
            <Plus />
            Assignment
          </Button>
          <Button variant="outline" render={<Link href="/dashboard/lms/discussions/new" />}>
            <MessagesSquare />
            Post
          </Button>
        </div>
      </div>
      <form className="flex max-w-xl gap-2">
        <Input name="offeringId" defaultValue={offeringId} placeholder="Enter course offering ID" />
        <Button>Load course</Button>
      </form>
      {!offeringId && (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Select a course offering to load its learning workspace.
        </p>
      )}
      {error && <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      {offeringId && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric icon={<BookOpen />} value={materials.length} label="Materials" />
            <Metric icon={<FileUp />} value={assignments.length} label="Assignments" />
            <Metric icon={<MessagesSquare />} value={posts.length} label="Discussion posts" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Course materials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {materials.map((x) => (
                  <a
                    key={x._id}
                    href={x.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border p-4 hover:bg-muted/40"
                  >
                    <div className="flex justify-between">
                      <p className="font-semibold">{x.title}</p>
                      <Badge variant={x.published ? "secondary" : "outline"}>{x.type}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{x.description}</p>
                  </a>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignments.map((x) => (
                  <div key={x._id} className="rounded-xl border p-4">
                    <div className="flex justify-between">
                      <p className="font-semibold">{x.title}</p>
                      <Badge variant="outline">{x.maxScore} marks</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Due {new Date(x.dueAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">ID: {x._id}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Discussion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {posts.map((x) => (
                <div key={x._id} className="rounded-xl border p-4">
                  <p className="font-semibold">{x.title || "Discussion post"}</p>
                  <p className="mt-2 text-sm">{x.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {x.author?.firstName} {x.author?.lastName} ·{" "}
                    {new Date(x.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
function Metric({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-primary [&_svg]:size-5">{icon}</div>
        <p className="mt-4 text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
