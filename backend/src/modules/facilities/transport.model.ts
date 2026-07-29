import { model, Schema } from "mongoose";

const vehicleSchema = new Schema(
  {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    type: {
      type: String,
      enum: ["bus", "minibus", "van", "car"],
      required: true,
    },
    capacity: { type: Number, required: true, min: 1, max: 500 },
    assignedSeats: { type: Number, required: true, min: 0, default: 0 },
    driverName: { type: String, trim: true, maxlength: 120 },
    driverPhone: { type: String, trim: true, maxlength: 30 },
    status: {
      type: String,
      enum: ["active", "maintenance", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);
export const VehicleModel = model("Vehicle", vehicleSchema);

const routeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    stops: [
      {
        name: { type: String, required: true, trim: true },
        pickupTime: { type: String, required: true, trim: true },
      },
    ],
    monthlyFeeMinor: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "suspended", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);
export const TransportRouteModel = model("TransportRoute", routeSchema);

const transportAllocationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    route: {
      type: Schema.Types.ObjectId,
      ref: "TransportRoute",
      required: true,
      index: true,
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    pickupStop: { type: String, required: true, trim: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    status: {
      type: String,
      enum: ["active", "ended", "cancelled"],
      default: "active",
      index: true,
    },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false },
);
transportAllocationSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { status: "active" } },
);
export const TransportAllocationModel = model(
  "TransportAllocation",
  transportAllocationSchema,
);
