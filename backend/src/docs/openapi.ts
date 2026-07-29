const standardResponses = {
  "401": { description: "Authentication required" },
  "403": { description: "Insufficient permission" },
  "422": { description: "Validation failed" },
  "500": { description: "Internal server error" },
};

function get(summary: string, tags: string[], isPublic = false) {
  return {
    get: {
      summary,
      tags,
      ...(isPublic ? { security: [] } : {}),
      responses: { "200": { description: "Successful response" }, ...standardResponses },
    },
  };
}

function post(summary: string, tags: string[], isPublic = false) {
  return {
    post: {
      summary,
      tags,
      ...(isPublic ? { security: [] } : {}),
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object" } } },
      },
      responses: {
        "200": { description: "Successful response" },
        "201": { description: "Resource created" },
        ...standardResponses,
      },
    },
  };
}

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "UniSphere ERP API",
    version: "1.0.0",
    description:
      "Modular University ERP REST API. All JSON responses use the success, message, and data envelope.",
  },
  servers: [{ url: "/api", description: "Current server" }],
  security: [{ bearerAuth: [] }],
  tags: [
    "System",
    "Authentication",
    "Administration",
    "Academic",
    "Admission",
    "Attendance",
    "Results",
    "Finance",
    "Library",
    "Facilities",
    "HR",
    "Research",
    "LMS",
    "Communication",
    "Engagement",
    "Analytics",
  ].map((name) => ({ name })),
  paths: {
    "/health/live": get("Process liveness", ["System"], true),
    "/health/ready": get("Database readiness", ["System"], true),
    "/auth/register": post("Register an account", ["Authentication"], true),
    "/auth/login": post("Sign in", ["Authentication"], true),
    "/auth/refresh": post("Rotate refresh token", ["Authentication"], true),
    "/auth/logout": post("Revoke refresh token", ["Authentication"]),
    "/auth/me": get("Current authenticated user", ["Authentication"]),
    "/users": get("List users", ["Administration"]),
    "/roles": get("List roles", ["Administration"]),
    "/permissions": get("List permissions", ["Administration"]),
    "/audit-logs": get("List audit logs", ["Administration"]),
    "/universities": get("List universities", ["Academic"]),
    "/faculties": get("List faculties", ["Academic"]),
    "/departments": get("List departments", ["Academic"]),
    "/programs": get("List programs", ["Academic"]),
    "/courses": get("List courses", ["Academic"]),
    "/semesters": get("List semesters", ["Academic"]),
    "/course-offerings": get("List course offerings", ["Academic"]),
    "/routine": get("List routine slots", ["Academic"]),
    "/admissions": get("List admission applications", ["Admission"]),
    "/students": get("List students", ["Academic"]),
    "/teachers": get("List teachers", ["Academic"]),
    "/enrollments": get("List enrollments", ["Academic"]),
    "/attendance": get("List attendance sessions", ["Attendance"]),
    "/exams": get("List examinations", ["Results"]),
    "/results/mine": get("Current student's results", ["Results"]),
    "/results/transcript/mine": get("Current student's transcript", ["Results"]),
    "/finance/invoices": get("List invoices", ["Finance"]),
    "/finance/payments": get("List payments", ["Finance"]),
    "/finance/reports/summary": get("Finance summary", ["Finance"]),
    "/library/books": get("List library books", ["Library"]),
    "/library/transactions": get("List circulation transactions", ["Library"]),
    "/facilities/hostels": get("List hostels", ["Facilities"]),
    "/facilities/transport-routes": get("List transport routes", ["Facilities"]),
    "/inventory/items": get("List inventory", ["Facilities"]),
    "/hr/employees": get("List employees", ["HR"]),
    "/hr/leaves": get("List leave requests", ["HR"]),
    "/hr/payroll-runs": get("List payroll runs", ["HR"]),
    "/research/projects": get("List research projects", ["Research"]),
    "/research/publications": get("List publications", ["Research"]),
    "/research/theses": get("List theses", ["Research"]),
    "/lms/materials": get("List course materials", ["LMS"]),
    "/lms/assignments": get("List assignments", ["LMS"]),
    "/lms/discussions": get("List discussion posts", ["LMS"]),
    "/communication/notices": get("List audience notices", ["Communication"]),
    "/communication/conversations": get("List conversations", ["Communication"]),
    "/communication/notifications": get("List notifications", ["Communication"]),
    "/communication/notifications/dispatch": post(
      "Queue an email or SMS notification",
      ["Communication"],
    ),
    "/engagement/complaints/mine": get("Current user's complaints", ["Engagement"]),
    "/engagement/alumni": get("Alumni directory", ["Engagement"]),
    "/analytics/admin": get("Administrative dashboard", ["Analytics"]),
    "/analytics/teacher": get("Teacher dashboard", ["Analytics"]),
    "/analytics/student": get("Student dashboard", ["Analytics"]),
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      SuccessResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", const: true },
          message: { type: "string" },
          data: {},
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["success", "message"],
        properties: {
          success: { type: "boolean", const: false },
          message: { type: "string" },
          details: {},
        },
      },
    },
  },
};
