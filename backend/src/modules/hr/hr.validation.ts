import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const code = z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase());
export const hrIdSchema = z.object({ params: z.object({ id: objectId }) });
export const employeeCreateSchema = z.object({
  body: z.object({
    userId: objectId,
    employeeId: code,
    teacherId: objectId.optional(),
    departmentId: objectId.optional(),
    employeeType: z.enum(["academic", "administrative", "support", "contract"]),
    designation: z.string().trim().min(2).max(120),
    joiningDate: z.coerce.date(),
    phone: z.string().trim().max(30).optional(),
  }),
});
export const employeeUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      departmentId: objectId.optional(),
      designation: z.string().trim().min(2).max(120).optional(),
      phone: z.string().trim().max(30).optional(),
      status: z.enum(["active", "on_leave", "suspended", "resigned", "retired", "terminated"]).optional(),
      employmentEndDate: z.coerce.date().optional(),
      bankAccount: z
        .object({
          accountName: z.string().trim().max(120).optional(),
          accountNumber: z.string().trim().max(80).optional(),
          bankName: z.string().trim().max(120).optional(),
          branch: z.string().trim().max(120).optional(),
        })
        .optional(),
      taxIdentifier: z.string().trim().max(80).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
export const attendanceRecordSchema = z.object({
  body: z
    .object({
      employeeId: objectId,
      date: z.coerce.date(),
      checkInAt: z.coerce.date().optional(),
      checkOutAt: z.coerce.date().optional(),
      status: z.enum(["present", "absent", "late", "half_day", "leave", "holiday"]),
      note: z.string().trim().max(300).optional(),
    })
    .refine(
      (value) => !value.checkInAt || !value.checkOutAt || value.checkInAt <= value.checkOutAt,
      { message: "Check-out cannot precede check-in" },
    ),
});
export const leaveCreateSchema = z.object({
  body: z
    .object({
      type: z.enum(["casual", "sick", "annual", "maternity", "paternity", "unpaid", "other"]),
      startsAt: z.coerce.date(),
      endsAt: z.coerce.date(),
      reason: z.string().trim().min(3).max(1000),
    })
    .refine((value) => value.startsAt <= value.endsAt, {
      message: "Leave date range is invalid",
      path: ["endsAt"],
    }),
});
export const leaveActionSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    decision: z.enum(["approve", "reject"]),
    note: z.string().trim().max(500).optional(),
  }),
});
const payLine = z.object({
  code,
  name: z.string().trim().min(1).max(120),
  amountMinor: z.number().int().min(0),
});
export const salaryStructureSchema = z.object({
  body: z.object({
    employeeId: objectId,
    currency: z.string().trim().length(3).transform((v) => v.toUpperCase()).default("BDT"),
    earnings: z.array(payLine).min(1).max(50),
    deductions: z.array(payLine).max(50).default([]),
    effectiveFrom: z.coerce.date(),
  }),
});
export const payrollRunCreateSchema = z.object({
  body: z.object({
    year: z.number().int().min(2000).max(2200),
    month: z.number().int().min(1).max(12),
    currency: z.string().trim().length(3).transform((v) => v.toUpperCase()).default("BDT"),
  }),
});
