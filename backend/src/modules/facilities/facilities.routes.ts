import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./facilities.controller";
import {
  endAllocationSchema,
  hostelAllocationSchema,
  hostelCreateSchema,
  roomCreateSchema,
  routeCreateSchema,
  transportAllocationSchema,
  vehicleCreateSchema,
} from "./facilities.validation";

export const facilitiesRouter = Router();
facilitiesRouter.use(authenticate);
facilitiesRouter.get("/mine", asyncHandler(controller.mine));
facilitiesRouter.get("/hostels", authorize("facilities.read"), asyncHandler(controller.hostels));
facilitiesRouter.post(
  "/hostels",
  authorize("facilities.manage"),
  validate(hostelCreateSchema),
  asyncHandler(controller.createHostel),
);
facilitiesRouter.get("/rooms", authorize("facilities.read"), asyncHandler(controller.rooms));
facilitiesRouter.post(
  "/rooms",
  authorize("facilities.manage"),
  validate(roomCreateSchema),
  asyncHandler(controller.createRoom),
);
facilitiesRouter.get(
  "/hostel-allocations",
  authorize("facilities.read"),
  asyncHandler(controller.hostelAllocations),
);
facilitiesRouter.post(
  "/hostel-allocations",
  authorize("facilities.allocate"),
  validate(hostelAllocationSchema),
  asyncHandler(controller.allocateHostel),
);
facilitiesRouter.post(
  "/hostel-allocations/:id/end",
  authorize("facilities.allocate"),
  validate(endAllocationSchema),
  asyncHandler(controller.endHostel),
);
facilitiesRouter.get("/vehicles", authorize("facilities.read"), asyncHandler(controller.vehicles));
facilitiesRouter.post(
  "/vehicles",
  authorize("facilities.manage"),
  validate(vehicleCreateSchema),
  asyncHandler(controller.createVehicle),
);
facilitiesRouter.get("/transport-routes", authorize("facilities.read"), asyncHandler(controller.routes));
facilitiesRouter.post(
  "/transport-routes",
  authorize("facilities.manage"),
  validate(routeCreateSchema),
  asyncHandler(controller.createRoute),
);
facilitiesRouter.get(
  "/transport-allocations",
  authorize("facilities.read"),
  asyncHandler(controller.transportAllocations),
);
facilitiesRouter.post(
  "/transport-allocations",
  authorize("facilities.allocate"),
  validate(transportAllocationSchema),
  asyncHandler(controller.allocateTransport),
);
facilitiesRouter.post(
  "/transport-allocations/:id/end",
  authorize("facilities.allocate"),
  validate(endAllocationSchema),
  asyncHandler(controller.endTransport),
);
