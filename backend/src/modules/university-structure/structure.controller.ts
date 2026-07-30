import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./structure.service";

type Entity = "university" | "faculty" | "department" | "program" | "course";
type CreateFunction = (
  input: Record<string, unknown>,
) => Promise<{ _id: unknown }>;

const creators: Record<Entity, CreateFunction> = {
  university: service.createUniversity,
  faculty: service.createFaculty,
  department: service.createDepartment,
  program: service.createProgram,
  course: service.createCourse,
};

export const list =
  (entity: Entity) =>
  async (req: Request, res: Response): Promise<Response> =>
    sendSuccess(
      res,
      200,
      `${entity} records retrieved`,
      await service.listEntities(entity, req.query),
    );

export const getOne =
  (entity: Entity) =>
  async (req: Request, res: Response): Promise<Response> =>
    sendSuccess(res, 200, `${entity} retrieved`, {
      [entity]: await service.getEntity(entity, req.params.id as string),
    });

export const create =
  (entity: Entity) =>
  async (req: Request, res: Response): Promise<Response> => {
    const item = await creators[entity](req.body);
    await writeAuditLog(req, {
      actor: req.auth?.userId,
      action: `${entity}.create`,
      resource: entity,
      resourceId: String(item._id),
    });
    return sendSuccess(res, 201, `${entity} created`, { [entity]: item });
  };

export const update =
  (entity: Entity) =>
  async (req: Request, res: Response): Promise<Response> => {
    const id = req.params.id as string;
    const item = await service.updateEntity(entity, id, req.body);
    await writeAuditLog(req, {
      actor: req.auth?.userId,
      action: `${entity}.update`,
      resource: entity,
      resourceId: id,
      metadata: { changedFields: Object.keys(req.body) },
    });
    return sendSuccess(res, 200, `${entity} updated`, { [entity]: item });
  };

export const archive =
  (entity: Entity) =>
  async (req: Request, res: Response): Promise<Response> => {
    const id = req.params.id as string;
    await service.updateEntity(entity, id, { status: "archived" });
    await writeAuditLog(req, {
      actor: req.auth?.userId,
      action: `${entity}.archive`,
      resource: entity,
      resourceId: id,
    });
    return sendSuccess(res, 200, `${entity} archived`, null);
  };
