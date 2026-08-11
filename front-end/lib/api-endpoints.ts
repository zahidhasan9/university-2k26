/**
 * UniSphere's single source of truth for frontend API paths.
 * Paths are relative to the Express `/api` prefix.
 */
export const API_ENDPOINTS = {
  auth: { login: "/auth/login", logout: "/auth/logout", me: "/auth/me", refresh: "/auth/refresh", changePassword: "/auth/change-password", proxyLogin: "/api/auth/login", proxyLogout: "/api/auth/logout" },
  analytics: {
    admin: "/analytics/admin",
    departments: "/analytics/departments",
    teacher: "/analytics/teacher",
    student: "/analytics/student",
  },
  users: {
    list: "/users",
    create: "/users",
    me: "/users/me",
    detail: (id: string) => `/users/${id}`,
  },
  uploads: { profileImage: "/uploads/profile-image" },
  roles: {
    list: "/roles",
    create: "/roles",
    detail: (id: string) => `/roles/${id}`,
  },
  permissions: { list: "/permissions" },
  academics: {
    universities: "/universities",
    faculties: "/faculties",
    departments: "/departments",
    programs: "/programs",
    courses: "/courses",
    semesters: "/semesters",
    offerings: "/course-offerings",
    detail: (entity: string, id: string) => `/${entity}/${id}`,
  },
  students: {
    list: "/students",
    create: "/students",
    detail: (id: string) => `/students/${id}`,
  },
  enrollments: {
    list: "/enrollments",
    mine: "/enrollments/mine",
    registrationOptions: "/enrollments/registration-options/mine",
    registerMine: "/enrollments/register/mine",
    detail: (id: string) => `/enrollments/${id}`,
  },
  teachers: {
    list: "/teachers",
    create: "/teachers",
    detail: (id: string) => `/teachers/${id}`,
  },
  admissions: {
    list: "/admissions",
    detail: (id: string) => `/admissions/${id}`,
    action: (id: string, action: string) => `/admissions/${id}/${action}`,
  },
  attendance: {
    sessions: "/attendance",
    records: (id: string) => `/attendance/${id}/records`,
    close: (id: string) => `/attendance/${id}/close`,
    qr: (id: string) => `/attendance/${id}/qr`,
  },
  exams: { list: "/exams", detail: (id: string) => `/exams/${id}`, marks: (id: string) => `/exams/${id}/marks` },
  results: {
    exams: "/exams",
    marks: (id: string) => `/exams/${id}/marks`,
    offeringAction: (id: string, action: string) => `/results/offerings/${id}/${action}`,
    offering: (id: string) => `/results/offerings/${id}`,
    gradePolicies: "/results/grade-policies",
  },
  finance: {
    dashboard: "/finance/dashboard",
    structures: "/finance/fee-structures",
    invoices: "/finance/invoices",
    payments: "/finance/payments",
    refundPayment: (id: string) => `/finance/payments/${id}/refund`,
    expenses: "/finance/expenses",
    waivers: "/finance/waivers",
    mineInvoices: "/finance/invoices/mine",
    minePayments: "/finance/payments/mine",
    summary: "/finance/reports/summary",
    expenseAction: (id: string) => `/finance/expenses/${id}/action`,
  },
  library: {
    books: "/library/books",
    copies: "/library/copies",
    transactions: "/library/transactions",
    issue: "/library/transactions/issue",
    returnTransaction: (id: string) => `/library/transactions/${id}/return`,
    policies: "/library/policies",
  },
  facilities: {
    hostels: "/facilities/hostels",
    rooms: "/facilities/rooms",
    hostelAllocations: "/facilities/hostel-allocations",
    vehicles: "/facilities/vehicles",
    routes: "/facilities/transport-routes",
    transportAllocations: "/facilities/transport-allocations",
    endAllocation: (type: "hostel" | "transport", id: string) =>
      `/facilities/${type}-allocations/${id}/end`,
  },
  inventory: {
    items: "/inventory/items",
    transactions: "/inventory/transactions",
  },
  communication: {
    notices: "/communication/notices",
    conversations: "/communication/conversations",
    notifications: "/communication/notifications",
    readNotification: (id: string) => `/communication/notifications/${id}/read`,
    dispatchNotification: "/communication/notifications/dispatch",
    conversation: (id: string) => `/communication/conversations/${id}`,
    messages: (id: string) => `/communication/conversations/${id}/messages`,
  },
  lms: {
    workspace: "/lms/workspace",
    materials: "/lms/materials",
    assignments: "/lms/assignments",
    submitAssignment: (id: string) => `/lms/assignments/${id}/submit`,
    gradeSubmission: (id: string) => `/lms/submissions/${id}/grade`,
    discussions: "/lms/discussions",
    quizzes: "/lms/quizzes",
    submissions: (assignmentId: string) => `/lms/assignments/${assignmentId}/submissions`,
  },
  research: {
    projects: "/research/projects",
    publications: "/research/publications",
    theses: "/research/theses",
    proposeThesis: "/research/theses/propose",
    thesisAction: (id: string) => `/research/theses/${id}/supervisor-action`,
  },
  engagement: {
    complaints: "/engagement/complaints",
    myComplaints: "/engagement/complaints/mine",
    complaintAction: (id: string) => `/engagement/complaints/${id}/action`,
    alumni: "/engagement/alumni",
    registerAlumni: "/engagement/alumni/register",
    alumniStatus: (id: string) => `/engagement/alumni/${id}/status`,
  },
  hr: {
    employees: "/hr/employees",
    attendance: "/hr/attendance",
    leaves: "/hr/leaves",
    leaveDecision: (id: string) => `/hr/leaves/${id}/decision`,
    payroll: "/hr/payroll-runs",
    payrollAction: (id: string, action: string) => `/hr/payroll-runs/${id}/${action}`,
  },
  audit: { events: "/audit-logs", logins: "/audit-logs/login-history" },
  routine: { list: "/routine" },
  health: { status: "/health", readiness: "/health/ready" },
} as const

export type PageApiEntry = {
  page: string
  module: string
  calls: { method: string; endpoint: string; purpose: string }[]
}

export const PAGE_API_MAP: PageApiEntry[] = [
  {
    page: "/dashboard",
    module: "Dashboard",
    calls: [
      {
        method: "GET",
        endpoint: "/analytics/admin",
        purpose: "University summary",
      },
    ],
  },
  {
    page: "/dashboard/analytics",
    module: "Analytics",
    calls: [
      {
        method: "GET",
        endpoint: "/analytics/admin",
        purpose: "Institution analytics",
      },
    ],
  },
  {
    page: "/dashboard/reports",
    module: "Reports",
    calls: [
      {
        method: "GET",
        endpoint: "/analytics/departments",
        purpose: "Department report and CSV",
      },
    ],
  },
  {
    page: "/dashboard/students",
    module: "Students",
    calls: [
      {
        method: "GET/POST",
        endpoint: "/students",
        purpose: "List and create students",
      },
      {
        method: "GET/PATCH",
        endpoint: "/students/:id",
        purpose: "Student detail and update",
      },
    ],
  },
  {
    page: "/dashboard/admissions",
    module: "Admissions",
    calls: [
      { method: "GET", endpoint: "/admissions", purpose: "Application queue" },
      {
        method: "POST",
        endpoint: "/admissions/:id/:action",
        purpose: "Review, approve, or reject",
      },
    ],
  },
  {
    page: "/dashboard/academics",
    module: "Academics",
    calls: [
      {
        method: "GET/POST/PATCH",
        endpoint: "/universities, /faculties, /departments, /programs, /courses, /semesters",
        purpose: "Academic structure CRUD",
      },
    ],
  },
  {
    page: "/dashboard/faculty",
    module: "Faculty & HR",
    calls: [
      {
        method: "GET/POST/PATCH",
        endpoint: "/teachers, /hr/*",
        purpose: "Teachers and HR operations",
      },
    ],
  },
  {
    page: "/dashboard/attendance",
    module: "Attendance",
    calls: [
      {
        method: "GET/POST/PUT",
        endpoint: "/attendance/*",
        purpose: "Sessions, marking, QR, and closing",
      },
    ],
  },
  {
    page: "/dashboard/results",
    module: "Exams & Results",
    calls: [
      {
        method: "GET/POST/PUT",
        endpoint: "/exams/*, /results/*",
        purpose: "Exams, marks, calculation, publishing",
      },
    ],
  },
  {
    page: "/dashboard/finance",
    module: "Finance",
    calls: [
      {
        method: "GET/POST",
        endpoint: "/finance/*",
        purpose: "Fees, invoices, payments, expenses",
      },
    ],
  },
  {
    page: "/dashboard/library",
    module: "Library",
    calls: [
      {
        method: "GET/POST/PUT",
        endpoint: "/library/*",
        purpose: "Catalog and circulation",
      },
    ],
  },
  {
    page: "/dashboard/facilities",
    module: "Facilities",
    calls: [
      {
        method: "GET/POST",
        endpoint: "/facilities/*",
        purpose: "Hostel and transport operations",
      },
    ],
  },
  {
    page: "/dashboard/inventory",
    module: "Inventory",
    calls: [
      {
        method: "GET/POST",
        endpoint: "/inventory/*",
        purpose: "Items and stock movements",
      },
    ],
  },
  {
    page: "/dashboard/communication",
    module: "Communication",
    calls: [
      {
        method: "GET/POST/PATCH",
        endpoint: "/communication/*",
        purpose: "Notices, messages, notifications",
      },
    ],
  },
  {
    page: "/dashboard/lms",
    module: "LMS",
    calls: [
      {
        method: "GET/POST/PATCH",
        endpoint: "/lms/*",
        purpose: "Materials, assignments, quizzes, discussions",
      },
    ],
  },
  {
    page: "/dashboard/research",
    module: "Research",
    calls: [
      {
        method: "GET/POST/PATCH",
        endpoint: "/research/*",
        purpose: "Projects, publications, theses",
      },
    ],
  },
  {
    page: "/dashboard/engagement",
    module: "Engagement",
    calls: [
      {
        method: "GET/POST/PATCH",
        endpoint: "/engagement/*",
        purpose: "Complaints and alumni",
      },
    ],
  },
  {
    page: "/dashboard/settings",
    module: "Administration",
    calls: [
      {
        method: "GET/POST/PATCH/DELETE",
        endpoint: "/users, /roles, /permissions, /audit-logs",
        purpose: "Identity, RBAC, and audit",
      },
    ],
  },
]

export function withQuery(
  path: string,
  query: Record<string, string | number | boolean | undefined>,
) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query))
    if (value !== undefined) params.set(key, String(value))
  const search = params.toString()
  return search ? `${path}?${search}` : path
}
