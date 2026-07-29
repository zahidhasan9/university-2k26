import { model, Schema } from "mongoose";

const hostelSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    gender: { type: String, enum: ["male", "female", "coed"], required: true },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["active", "maintenance", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export const HostelModel = model("Hostel", hostelSchema);

const roomSchema = new Schema(
  {
    hostel: {
      type: Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
      index: true,
    },
    roomNumber: { type: String, required: true, uppercase: true, trim: true },
    floor: { type: String, trim: true, maxlength: 30 },
    capacity: { type: Number, required: true, min: 1, max: 100 },
    occupied: { type: Number, required: true, min: 0, default: 0 },
    monthlyFeeMinor: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["available", "maintenance", "archived"],
      default: "available",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);
roomSchema.index({ hostel: 1, roomNumber: 1 }, { unique: true });
export const RoomModel = model("Room", roomSchema);

const allocationSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    hostel: {
      type: Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
      index: true,
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    bedNumber: { type: String, required: true, uppercase: true, trim: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    status: {
      type: String,
      enum: ["active", "ended", "cancelled"],
      default: "active",
      index: true,
    },
    allocatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    endedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
allocationSchema.index(
  { student: 1 },
  { unique: true, partialFilterExpression: { status: "active" } },
);
allocationSchema.index(
  { room: 1, bedNumber: 1 },
  { unique: true, partialFilterExpression: { status: "active" } },
);
export const HostelAllocationModel = model(
  "HostelAllocation",
  allocationSchema,
);
