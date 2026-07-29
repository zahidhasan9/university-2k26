# UniSphere ERP Backend

Production-oriented Express, TypeScript, MongoDB API for UniSphere ERP.

## Setup

1. Copy `.env.example` to `.env` and replace every secret/credential.
2. Install dependencies with `npm install`.
3. Start MongoDB, then run `npm run seed:bootstrap` once.
4. Run `npm run dev`.

## Quality checks

- `npm run typecheck`
- `npm run build`
- `npm test`

The HTTP test suite verifies liveness, database readiness behavior, anonymous access protection,
Swagger/OpenAPI availability, and the standard not-found error envelope.

## API documentation

- Swagger UI: `GET /api/docs`
- OpenAPI 3.1 JSON: `GET /api/docs/openapi.json`

The OpenAPI document lists every module and the shared authentication/error schemas. Keep it
updated when adding a new route group or public operation.

## Notification delivery

In-app notifications are stored in MongoDB. External email/SMS requests use a durable MongoDB
outbox and BullMQ:

1. Configure `REDIS_URL` and the relevant `SMTP_*` or `SMS_WEBHOOK_*` values.
2. Start the API with `npm run dev`.
3. Start a separate worker with `npm run worker:notifications`.

In production, build once and run `npm start` for the API plus
`npm run worker:notifications:start` as a separate process from the same image. Queue jobs retry
with exponential backoff; delivery status, attempts, and the latest error remain visible in the
notification record. If Redis is unavailable, the outbox record is preserved for recovery.

## Deployment

Build the production image with `docker build -t unisphere-api .`. Configure all values from
`.env.example` in the deployment platform; never copy a local `.env` into the image.

- Liveness: `GET /api/health/live`
- Readiness: `GET /api/health/ready`

## Current API

- `GET /api/health`
- `/api/auth` - authentication and password lifecycle
- `/api/users`, `/api/roles`, `/api/permissions`, `/api/audit-logs`
- `/api/universities`, `/api/faculties`, `/api/departments`, `/api/programs`, `/api/courses`
- `/api/semesters`, `/api/course-offerings`, `/api/routine`
- `/api/admissions`, `/api/students`, `/api/teachers`, `/api/enrollments`
- `/api/attendance` - manual and QR attendance
- `/api/exams` - schedules, assessment weights, and marks
- `/api/results` - grade policies, result calculation/publication, GPA/CGPA, and transcripts
- `/api/finance` - fee structures, invoices, payments, refunds, expenses, and reports
- `/api/library` - catalog, physical copies, circulation policies, issue/return, and fines
- `/api/facilities` - hostels, rooms, vehicles, routes, and capacity-safe allocations
- `/api/inventory` - items, low-stock monitoring, and atomic stock movements
- `/api/hr` - employees, attendance, leave, salary structures, payroll, and payslips
- `/api/research` - projects, publications, thesis supervision, defenses, and outcomes
- `/api/lms` - materials, videos, assignments, submissions, quizzes, and discussions
- `/api/communication` - notices, conversations, messages, and notification inbox
- `/api/engagement` - complaint workflows and verified alumni directory
- `/api/analytics` - admin, department, teacher, and student dashboard aggregates

Refresh tokens are rotated and stored as SHA-256 hashes. The raw refresh token is only sent as
an HTTP-only cookie.
