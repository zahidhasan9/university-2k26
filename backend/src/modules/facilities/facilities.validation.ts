import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const code = z.string().trim().min(2).max(50).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase());
export const facilityIdSchema = z.object({ params: z.object({ id: objectId }) });
export const hostelCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(150),
    code,
    gender: z.enum(["male", "female", "coed"]),
    address: z.string().trim().min(3).max(500),
  }),
});
export const roomCreateSchema = z.object({
  body: z.object({
    hostelId: objectId,
    roomNumber: code,
    floor: z.string().trim().max(30).optional(),
    capacity: z.number().int().min(1).max(100),
    monthlyFeeMinor: z.number().int().min(0),
  }),
});
export const hostelAllocationSchema = z.object({
  body: z.object({
    studentId: objectId,
    roomId: objectId,
    bedNumber: code,
    startsAt: z.coerce.date(),
  }),
});
export const endAllocationSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ endsAt: z.coerce.date().optional() }),
});
export const vehicleCreateSchema = z.object({
  body: z.object({
    registrationNumber: code,
    name: z.string().trim().min(2).max(100),
    type: z.enum(["bus", "minibus", "van", "car"]),
    capacity: z.number().int().min(1).max(500),
    driverName: z.string().trim().max(120).optional(),
    driverPhone: z.string().trim().max(30).optional(),
  }),
});
export const routeCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(150),
    code,
    vehicleId: objectId,
    stops: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(120),
          pickupTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        }),
      )
      .min(1)
      .max(100),
    monthlyFeeMinor: z.number().int().min(0),
  }),
});
export const transportAllocationSchema = z.object({
  body: z.object({
    userId: objectId,
    routeId: objectId,
    pickupStop: z.string().trim().min(1).max(120),
    startsAt: z.coerce.date(),
  }),
});
