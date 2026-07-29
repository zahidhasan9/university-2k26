import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpenCheck,
  CircleDollarSign,
  GraduationCap,
  MoreHorizontal,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authenticatedRequest } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };

const fallbackStats = [
  {
    label: "Total students",
    value: "12,480",
    change: "+8.2%",
    up: true,
    icon: GraduationCap,
    tone: "bg-blue-100 text-blue-700",
  },
  {
    label: "Faculty members",
    value: "842",
    change: "+2.4%",
    up: true,
    icon: UsersRound,
    tone: "bg-violet-100 text-violet-700",
  },
  {
    label: "Active courses",
    value: "326",
    change: "+5.1%",
    up: true,
    icon: BookOpenCheck,
    tone: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Revenue collected",
    value: "৳8.42M",
    change: "-1.3%",
    up: false,
    icon: CircleDollarSign,
    tone: "bg-amber-100 text-amber-700",
  },
];

type AggregateCount = { _id: string; count: number };
type AdminAnalytics = {
  students: AggregateCount[];
  teachers: AggregateCount[];
  admissions: AggregateCount[];
  finance: {
    revenue: { _id: string; amountMinor: number; count: number }[];
  };
  activeDepartments: number;
};

function total(items: AggregateCount[]) {
  return items.reduce((sum, item) => sum + item.count, 0);
}

function money(amountMinor: number, currency = "BDT") {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

async function dashboardStats() {
  try {
    const { data } =
      await authenticatedRequest<AdminAnalytics>("/analytics/admin");
    const revenue = data.finance.revenue[0];
    return {
      connected: true,
      items: [
        { ...fallbackStats[0], value: total(data.students).toLocaleString() },
        { ...fallbackStats[1], value: total(data.teachers).toLocaleString() },
        { ...fallbackStats[2], value: `${data.activeDepartments} depts` },
        {
          ...fallbackStats[3],
          value: revenue ? money(revenue.amountMinor, revenue._id) : money(0),
        },
      ],
    };
  } catch (error) {
    return {
      connected: false,
      message:
        error instanceof Error
          ? error.message
          : "Analytics could not be loaded",
      items: fallbackStats.map((item) => ({
        ...item,
        value: "—",
        change: "Unavailable",
      })),
    };
  }
}

const activity = [
  {
    initials: "NS",
    name: "Nadia Sultana",
    action: "submitted an admission application",
    time: "8 min ago",
    color: "bg-blue-100 text-blue-700",
  },
  {
    initials: "RH",
    name: "Rafiul Hasan",
    action: "completed semester fee payment",
    time: "24 min ago",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    initials: "TA",
    name: "Tanvir Ahmed",
    action: "published CSE-3201 results",
    time: "45 min ago",
    color: "bg-violet-100 text-violet-700",
  },
  {
    initials: "SM",
    name: "Sadia Mahmud",
    action: "requested a library renewal",
    time: "1 hr ago",
    color: "bg-amber-100 text-amber-700",
  },
];

const departments = [
  {
    name: "Computer Science & Engineering",
    code: "CSE",
    students: 2840,
    faculty: 126,
    performance: 92,
  },
  {
    name: "Business Administration",
    code: "BBA",
    students: 2260,
    faculty: 94,
    performance: 88,
  },
  {
    name: "Electrical & Electronic Engineering",
    code: "EEE",
    students: 1980,
    faculty: 87,
    performance: 85,
  },
  {
    name: "Civil Engineering",
    code: "CE",
    students: 1520,
    faculty: 68,
    performance: 81,
  },
];

export default async function DashboardPage() {
  const stats = await dashboardStats();
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">
            Wednesday, 29 July 2026
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Good morning, Mamun
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your university today.
          </p>
        </div>
        <Button className="h-10 self-start sm:self-auto" render={<Link href="/dashboard/students/new" />}>
          <UserPlus /> Add new student
        </Button>
      </div>

      {!stats.connected && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Live analytics are temporarily unavailable. Start the backend and
          confirm this account has dashboard permission.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.items.map(({ label, value, change, up, icon: Icon, tone }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div
                  className={`grid size-10 place-items-center rounded-xl ${tone}`}
                >
                  <Icon className="size-5" />
                </div>
                <Badge
                  variant="secondary"
                  className={up ? "text-emerald-700" : "text-rose-700"}
                >
                  {up ? <ArrowUpRight /> : <ArrowDownRight />} {change}
                </Badge>
              </div>
              <p className="mt-5 text-2xl font-bold tracking-tight">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>Enrollment overview</CardTitle>
              <CardDescription>
                Student enrollment over the last six months
              </CardDescription>
            </div>
            <Badge variant="outline">Jan – Jun</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-end gap-3 pt-6 sm:gap-5">
              {[52, 68, 61, 78, 72, 91].map((height, index) => (
                <div
                  key={height}
                  className="flex h-full flex-1 flex-col justify-end gap-2"
                >
                  <div className="relative flex-1 rounded-t-lg bg-muted">
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-center text-xs text-muted-foreground">
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun"][index]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest updates from campus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {activity.map((item) => (
              <div key={item.name + item.time} className="flex gap-3">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ${item.color}`}
                >
                  {item.initials}
                </span>
                <p className="min-w-0 flex-1 text-sm leading-5">
                  <span className="font-semibold">{item.name}</span>{" "}
                  <span className="text-muted-foreground">{item.action}</span>
                  <span className="block text-xs text-muted-foreground">
                    {item.time}
                  </span>
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>Department performance</CardTitle>
            <CardDescription>
              Current academic engagement by department
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead className="min-w-44">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.code}>
                  <TableCell>
                    <div className="font-medium">{department.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {department.code}
                    </div>
                  </TableCell>
                  <TableCell>{department.students.toLocaleString()}</TableCell>
                  <TableCell>{department.faculty}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={department.performance}
                        className="h-2"
                      />
                      <span className="w-9 text-sm font-medium">
                        {department.performance}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
