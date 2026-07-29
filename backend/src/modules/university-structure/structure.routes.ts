import { Router, type Router as ExpressRouter } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./structure.controller";
import {
  courseCreateSchema,
  courseUpdateSchema,
  departmentCreateSchema,
  departmentUpdateSchema,
  facultyCreateSchema,
  facultyUpdateSchema,
  idSchema,
  programCreateSchema,
  programUpdateSchema,
  universityCreateSchema,
  universityUpdateSchema,
} from "./structure.validation";

type Entity = "university" | "faculty" | "department" | "program" | "course";

function crudRoutes(
  entity: Entity,
  createSchema: Parameters<typeof validate>[0],
  updateSchema: Parameters<typeof validate>[0],
): ExpressRouter {
  const router = Router();
  router.use(authenticate);
  router.get("/", authorize("structure.read"), asyncHandler(controller.list(entity)));
  router.get("/:id", authorize("structure.read"), validate(idSchema), asyncHandler(controller.getOne(entity)));
  router.post(
    "/",
    authorize("structure.manage"),
    validate(createSchema),
    asyncHandler(controller.create(entity)),
  );
  router.patch(
    "/:id",
    authorize("structure.manage"),
    validate(updateSchema),
    asyncHandler(controller.update(entity)),
  );
  router.delete(
    "/:id",
    authorize("structure.manage"),
    validate(idSchema),
    asyncHandler(controller.archive(entity)),
  );
  return router;
}

export const universityRouter = crudRoutes("university", universityCreateSchema, universityUpdateSchema);
export const facultyRouter = crudRoutes("faculty", facultyCreateSchema, facultyUpdateSchema);
export const departmentRouter = crudRoutes("department", departmentCreateSchema, departmentUpdateSchema);
export const programRouter = crudRoutes("program", programCreateSchema, programUpdateSchema);
export const courseRouter = crudRoutes("course", courseCreateSchema, courseUpdateSchema);
