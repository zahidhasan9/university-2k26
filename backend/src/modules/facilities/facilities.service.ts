import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { toObjectId } from "../../utils/mongo";
import { StudentModel } from "../student/student.model";
import { UserModel } from "../user/user.model";
import { HostelAllocationModel, HostelModel, RoomModel } from "./hostel.model";
import {
  TransportAllocationModel,
  TransportRouteModel,
  VehicleModel,
} from "./transport.model";

export function listHostels() {
  return HostelModel.find().sort({ name: 1 }).lean();
}
export async function createHostel(input: Record<string, unknown>) {
  if (await HostelModel.countDocuments({ code: String(input.code) } as Record<string, unknown>)) {
    throw new AppError(409, "Hostel code exists");
  }
  return HostelModel.create(input);
}
export function listRooms(query: Record<string, unknown>) {
  const filter = query.hostelId
    ? { hostel: toObjectId(String(query.hostelId), "hostel id") }
    : {};
  return RoomModel.find(filter).populate("hostel", "name code gender").sort({ roomNumber: 1 }).lean();
}
export async function createRoom(input: Record<string, unknown>) {
  const hostel = await HostelModel.findOne({
    _id: toObjectId(String(input.hostelId), "hostel id"),
    status: "active",
  });
  if (!hostel) throw new AppError(400, "Active hostel not found");
  if (
    await RoomModel.countDocuments({
      hostel: hostel._id,
      roomNumber: String(input.roomNumber),
    } as Record<string, unknown>)
  ) {
    throw new AppError(409, "Room number exists in this hostel");
  }
  const { hostelId: _, ...data } = input;
  return RoomModel.create({ ...data, hostel: hostel._id });
}
export async function allocateHostel(
  actorId: Types.ObjectId,
  input: { studentId: string; roomId: string; bedNumber: string; startsAt: Date },
) {
  const studentId = toObjectId(input.studentId, "student id");
  const roomId = toObjectId(input.roomId, "room id");
  const [student, room] = await Promise.all([
    StudentModel.findOne({ _id: studentId, status: "active" }),
    RoomModel.findOne({ _id: roomId, status: "available" }),
  ]);
  if (!student || !room) throw new AppError(400, "Active student and available room are required");
  const hostel = await HostelModel.findOne({ _id: room.hostel, status: "active" });
  if (!hostel) throw new AppError(400, "Hostel is unavailable");
  if (hostel.gender !== "coed" && student.gender && hostel.gender !== student.gender) {
    throw new AppError(409, "Student does not match hostel gender policy");
  }
  if (
    await HostelAllocationModel.exists({
      $or: [
        { student: studentId, status: "active" },
        { room: roomId, bedNumber: input.bedNumber, status: "active" },
      ],
    })
  ) {
    throw new AppError(409, "Student or bed already has an active allocation");
  }
  const reservedRoom = await RoomModel.findOneAndUpdate(
    { _id: roomId, status: "available", $expr: { $lt: ["$occupied", "$capacity"] } },
    { $inc: { occupied: 1 } },
    { new: true },
  );
  if (!reservedRoom) throw new AppError(409, "Room has reached capacity");
  try {
    return await HostelAllocationModel.create({
      student: studentId,
      hostel: room.hostel,
      room: roomId,
      bedNumber: input.bedNumber,
      startsAt: input.startsAt,
      allocatedBy: actorId,
    });
  } catch (error) {
    await RoomModel.updateOne({ _id: roomId, occupied: { $gt: 0 } }, { $inc: { occupied: -1 } });
    throw error;
  }
}
export async function endHostelAllocation(id: string, actorId: Types.ObjectId, endsAt = new Date()) {
  const allocation = await HostelAllocationModel.findOneAndUpdate({
    _id: toObjectId(id),
    status: "active",
    startsAt: { $lte: endsAt },
  }, { $set: { status: "ended", endsAt, endedBy: actorId } }, { new: true });
  if (!allocation) throw new AppError(409, "Active allocation not found or end date is invalid");
  await RoomModel.updateOne(
    { _id: allocation.room, occupied: { $gt: 0 } },
    { $inc: { occupied: -1 } },
  );
  return allocation;
}
export function listHostelAllocations(query: Record<string, unknown>) {
  const filter: Record<string, unknown> = {};
  if (query.studentId) filter.student = toObjectId(String(query.studentId), "student id");
  if (query.status) filter.status = query.status;
  return HostelAllocationModel.find(filter)
    .populate({ path: "student", select: "studentId user", populate: { path: "user", select: "firstName lastName" } })
    .populate("hostel", "name code")
    .populate("room", "roomNumber floor")
    .sort({ createdAt: -1 })
    .lean();
}

export function listVehicles() {
  return VehicleModel.find().sort({ registrationNumber: 1 }).lean();
}
export async function createVehicle(input: Record<string, unknown>) {
  if (
    await VehicleModel.countDocuments({
      registrationNumber: String(input.registrationNumber),
    } as Record<string, unknown>)
  ) {
    throw new AppError(409, "Vehicle registration exists");
  }
  return VehicleModel.create(input);
}
export function listRoutes() {
  return TransportRouteModel.find().populate("vehicle", "registrationNumber name capacity status").sort({ name: 1 }).lean();
}
export async function createRoute(input: Record<string, unknown>) {
  const vehicle = await VehicleModel.findOne({
    _id: toObjectId(String(input.vehicleId), "vehicle id"),
    status: "active",
  });
  if (!vehicle) throw new AppError(400, "Active vehicle not found");
  if (
    await TransportRouteModel.countDocuments({
      code: String(input.code),
    } as Record<string, unknown>)
  ) {
    throw new AppError(409, "Route code exists");
  }
  const { vehicleId: _, ...data } = input;
  return TransportRouteModel.create({ ...data, vehicle: vehicle._id });
}
export async function allocateTransport(
  actorId: Types.ObjectId,
  input: { userId: string; routeId: string; pickupStop: string; startsAt: Date },
) {
  const userId = toObjectId(input.userId, "user id");
  const routeId = toObjectId(input.routeId, "route id");
  const [user, route] = await Promise.all([
    UserModel.findOne({ _id: userId, status: "active" }),
    TransportRouteModel.findOne({ _id: routeId, status: "active" }),
  ]);
  if (!user || !route) throw new AppError(400, "Active user and route are required");
  if (!route.stops.some((stop) => stop.name === input.pickupStop)) {
    throw new AppError(400, "Pickup stop is not part of this route");
  }
  const vehicle = await VehicleModel.findOne({ _id: route.vehicle, status: "active" });
  if (!vehicle) throw new AppError(409, "Route vehicle is unavailable");
  if (await TransportAllocationModel.exists({ user: userId, status: "active" })) {
    throw new AppError(409, "User already has an active transport allocation");
  }
  const reservedVehicle = await VehicleModel.findOneAndUpdate(
    { _id: vehicle._id, status: "active", $expr: { $lt: ["$assignedSeats", "$capacity"] } },
    { $inc: { assignedSeats: 1 } },
    { new: true },
  );
  if (!reservedVehicle) throw new AppError(409, "Vehicle has reached capacity");
  try {
    return await TransportAllocationModel.create({
      user: userId,
      route: routeId,
      vehicle: vehicle._id,
      pickupStop: input.pickupStop,
      startsAt: input.startsAt,
      assignedBy: actorId,
    });
  } catch (error) {
    await VehicleModel.updateOne(
      { _id: vehicle._id, assignedSeats: { $gt: 0 } },
      { $inc: { assignedSeats: -1 } },
    );
    throw error;
  }
}
export async function endTransportAllocation(id: string, endsAt = new Date()) {
  const allocation = await TransportAllocationModel.findOneAndUpdate({
    _id: toObjectId(id),
    status: "active",
    startsAt: { $lte: endsAt },
  }, { $set: { status: "ended", endsAt } }, { new: true });
  if (!allocation) throw new AppError(409, "Active allocation not found or end date is invalid");
  await VehicleModel.updateOne(
    { _id: allocation.vehicle, assignedSeats: { $gt: 0 } },
    { $inc: { assignedSeats: -1 } },
  );
  return allocation;
}
export function listTransportAllocations(query: Record<string, unknown>) {
  const filter: Record<string, unknown> = {};
  if (query.userId) filter.user = toObjectId(String(query.userId), "user id");
  if (query.status) filter.status = query.status;
  return TransportAllocationModel.find(filter)
    .populate("user", "firstName lastName email")
    .populate("route", "name code stops")
    .populate("vehicle", "registrationNumber name")
    .sort({ createdAt: -1 })
    .lean();
}

export async function myFacilities(userId: Types.ObjectId) {
  const student = await StudentModel.findOne({ user: userId }).select("_id").lean();
  const [hostel, transport] = await Promise.all([
    student
      ? HostelAllocationModel.findOne({ student: student._id, status: "active" })
          .populate("hostel", "name code address")
          .populate("room", "roomNumber floor monthlyFeeMinor")
          .lean()
      : null,
    TransportAllocationModel.findOne({ user: userId, status: "active" })
      .populate("route", "name code stops monthlyFeeMinor")
      .populate("vehicle", "registrationNumber name")
      .lean(),
  ]);
  return { hostel, transport };
}
