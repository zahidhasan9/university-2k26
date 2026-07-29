import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./facilities.service";

function auth(req: Request) {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return req.auth;
}
async function audit(req: Request, action: string, resource: string, id: string) {
  await writeAuditLog(req, { actor: auth(req).userId, action, resource, resourceId: id });
}
export async function mine(req: Request, res: Response) {
  return sendSuccess(
    res,
    200,
    "Your facility allocations retrieved",
    await service.myFacilities(auth(req).userId),
  );
}
export async function hostels(_req: Request, res: Response) {
  return sendSuccess(res, 200, "Hostels retrieved", { hostels: await service.listHostels() });
}
export async function createHostel(req: Request, res: Response) {
  const hostel = await service.createHostel(req.body);
  await audit(req, "hostel.create", "hostel", hostel._id.toString());
  return sendSuccess(res, 201, "Hostel created", { hostel });
}
export async function rooms(req: Request, res: Response) {
  return sendSuccess(res, 200, "Rooms retrieved", { rooms: await service.listRooms(req.query) });
}
export async function createRoom(req: Request, res: Response) {
  const room = await service.createRoom(req.body);
  await audit(req, "hostel.room_create", "room", room._id.toString());
  return sendSuccess(res, 201, "Room created", { room });
}
export async function hostelAllocations(req: Request, res: Response) {
  return sendSuccess(res, 200, "Hostel allocations retrieved", {
    allocations: await service.listHostelAllocations(req.query),
  });
}
export async function allocateHostel(req: Request, res: Response) {
  const allocation = await service.allocateHostel(auth(req).userId, req.body);
  await audit(req, "hostel.allocate", "hostel_allocation", allocation._id.toString());
  return sendSuccess(res, 201, "Hostel allocated", { allocation });
}
export async function endHostel(req: Request, res: Response) {
  const id = req.params.id as string;
  const allocation = await service.endHostelAllocation(id, auth(req).userId, req.body.endsAt);
  await audit(req, "hostel.allocation_end", "hostel_allocation", id);
  return sendSuccess(res, 200, "Hostel allocation ended", { allocation });
}
export async function vehicles(_req: Request, res: Response) {
  return sendSuccess(res, 200, "Vehicles retrieved", { vehicles: await service.listVehicles() });
}
export async function createVehicle(req: Request, res: Response) {
  const vehicle = await service.createVehicle(req.body);
  await audit(req, "transport.vehicle_create", "vehicle", vehicle._id.toString());
  return sendSuccess(res, 201, "Vehicle created", { vehicle });
}
export async function routes(_req: Request, res: Response) {
  return sendSuccess(res, 200, "Transport routes retrieved", { routes: await service.listRoutes() });
}
export async function createRoute(req: Request, res: Response) {
  const route = await service.createRoute(req.body);
  await audit(req, "transport.route_create", "transport_route", route._id.toString());
  return sendSuccess(res, 201, "Transport route created", { route });
}
export async function transportAllocations(req: Request, res: Response) {
  return sendSuccess(res, 200, "Transport allocations retrieved", {
    allocations: await service.listTransportAllocations(req.query),
  });
}
export async function allocateTransport(req: Request, res: Response) {
  const allocation = await service.allocateTransport(auth(req).userId, req.body);
  await audit(req, "transport.allocate", "transport_allocation", allocation._id.toString());
  return sendSuccess(res, 201, "Transport allocated", { allocation });
}
export async function endTransport(req: Request, res: Response) {
  const id = req.params.id as string;
  const allocation = await service.endTransportAllocation(id, req.body.endsAt);
  await audit(req, "transport.allocation_end", "transport_allocation", id);
  return sendSuccess(res, 200, "Transport allocation ended", { allocation });
}
