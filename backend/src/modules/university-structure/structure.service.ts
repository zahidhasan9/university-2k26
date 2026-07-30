import type { Model, Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { CourseModel } from "./course.model";
import { DepartmentModel } from "./department.model";
import { FacultyModel } from "./faculty.model";
import { ProgramModel } from "./program.model";
import { UniversityModel } from "./university.model";

type EntityName =
  | "university"
  | "faculty"
  | "department"
  | "program"
  | "course";

const configs: Record<
  EntityName,
  {
    model: Model<any>;
    searchFields: string[];
    populate?: Array<{ path: string; select: string }>;
  }
> = {
  university: {
    model: UniversityModel,
    searchFields: ["name", "code", "shortName"],
  },
  faculty: {
    model: FacultyModel,
    searchFields: ["name", "code"],
    populate: [{ path: "university", select: "name code" }],
  },
  department: {
    model: DepartmentModel,
    searchFields: ["name", "code"],
    populate: [{ path: "faculty", select: "name code university" }],
  },
  program: {
    model: ProgramModel,
    searchFields: ["name", "code"],
    populate: [{ path: "department", select: "name code faculty" }],
  },
  course: {
    model: CourseModel,
    searchFields: ["title", "code"],
    populate: [
      { path: "program", select: "name code department" },
      { path: "prerequisites", select: "title code credits" },
    ],
  },
};

export async function listEntities(
  entity: EntityName,
  query: Record<string, unknown>,
) {
  const { model, searchFields, populate = [] } = configs[entity];
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.search) {
    const search = escapeRegex(String(query.search));
    filter.$or = searchFields.map((field) => ({
      [field]: { $regex: search, $options: "i" },
    }));
  }
  const parentFields: Record<EntityName, string | undefined> = {
    university: undefined,
    faculty: "university",
    department: "faculty",
    program: "department",
    course: "program",
  };
  const parentField = parentFields[entity];
  if (parentField && query.parentId)
    filter[parentField] = toObjectId(String(query.parentId), "parent id");

  let findQuery = model
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  for (const item of populate) findQuery = findQuery.populate(item);
  const [items, total] = await Promise.all([
    findQuery.lean(),
    model.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function getEntity(entity: EntityName, id: string) {
  const { model, populate = [] } = configs[entity];
  let query = model.findById(toObjectId(id));
  for (const item of populate) query = query.populate(item);
  const result = await query.lean();
  if (!result) throw new AppError(404, `${entity} not found`);
  return result;
}

async function requireActive(model: Model<any>, id: string, label: string) {
  const item = await model
    .findOne({ _id: toObjectId(id, `${label} id`), status: "active" })
    .select("_id")
    .lean();
  if (!item) throw new AppError(400, `Active ${label} not found`);
  return item._id as Types.ObjectId;
}

async function ensureUnique(
  model: Model<any>,
  filter: Record<string, unknown>,
  id?: string,
) {
  const existing = await model.exists(
    id ? { ...filter, _id: { $ne: toObjectId(id) } } : filter,
  );
  if (existing)
    throw new AppError(409, "Code already exists within the selected parent");
}

export async function createUniversity(input: Record<string, unknown>) {
  await ensureUnique(UniversityModel, { code: input.code });
  return UniversityModel.create(input);
}

export async function createFaculty(input: Record<string, unknown>) {
  const university = await requireActive(
    UniversityModel,
    String(input.universityId),
    "university",
  );
  await ensureUnique(FacultyModel, { university, code: input.code });
  const { universityId: _, ...data } = input;
  return FacultyModel.create({ ...data, university });
}

export async function createDepartment(input: Record<string, unknown>) {
  const faculty = await requireActive(
    FacultyModel,
    String(input.facultyId),
    "faculty",
  );
  await ensureUnique(DepartmentModel, { faculty, code: input.code });
  const { facultyId: _, ...data } = input;
  return DepartmentModel.create({ ...data, faculty });
}

export async function createProgram(input: Record<string, unknown>) {
  const department = await requireActive(
    DepartmentModel,
    String(input.departmentId),
    "department",
  );
  await ensureUnique(ProgramModel, { department, code: input.code });
  const { departmentId: _, ...data } = input;
  return ProgramModel.create({ ...data, department });
}

async function validatePrerequisites(
  ids: string[],
  program: Types.ObjectId,
  excludedId?: string,
) {
  const unique = [...new Set(ids)];
  if (excludedId && unique.includes(excludedId))
    throw new AppError(400, "A course cannot require itself");
  const objectIds = unique.map((id) => toObjectId(id, "prerequisite id"));
  const count = await CourseModel.countDocuments({
    _id: { $in: objectIds },
    program,
    status: "active",
  });
  if (count !== objectIds.length) {
    throw new AppError(
      400,
      "Prerequisites must be active courses in the same program",
    );
  }
  return objectIds;
}

export async function createCourse(input: Record<string, unknown>) {
  const program = await requireActive(
    ProgramModel,
    String(input.programId),
    "program",
  );
  await ensureUnique(CourseModel, { program, code: input.code });
  const prerequisites = await validatePrerequisites(
    (input.prerequisiteIds as string[]) ?? [],
    program,
  );
  const { programId: _, prerequisiteIds: __, ...data } = input;
  return CourseModel.create({ ...data, program, prerequisites });
}

async function assertCanArchive(
  entity: EntityName,
  id: Types.ObjectId,
): Promise<void> {
  const children: Partial<
    Record<EntityName, { model: Model<any>; field: string }>
  > = {
    university: { model: FacultyModel, field: "university" },
    faculty: { model: DepartmentModel, field: "faculty" },
    department: { model: ProgramModel, field: "department" },
    program: { model: CourseModel, field: "program" },
  };
  const child = children[entity];
  if (
    child &&
    (await child.model.exists({ [child.field]: id, status: "active" }))
  ) {
    throw new AppError(
      409,
      `Archive active child records before archiving this ${entity}`,
    );
  }
}

export async function updateEntity(
  entity: EntityName,
  id: string,
  input: Record<string, unknown>,
) {
  const itemId = toObjectId(id);
  const { model } = configs[entity];
  const current = await model.findById(itemId);
  if (!current) throw new AppError(404, `${entity} not found`);
  if (input.status === "archived") await assertCanArchive(entity, itemId);

  const parentMap: Partial<
    Record<
      EntityName,
      { input: string; field: string; model: Model<any>; label: string }
    >
  > = {
    faculty: {
      input: "universityId",
      field: "university",
      model: UniversityModel,
      label: "university",
    },
    department: {
      input: "facultyId",
      field: "faculty",
      model: FacultyModel,
      label: "faculty",
    },
    program: {
      input: "departmentId",
      field: "department",
      model: DepartmentModel,
      label: "department",
    },
    course: {
      input: "programId",
      field: "program",
      model: ProgramModel,
      label: "program",
    },
  };
  const parentConfig = parentMap[entity];
  let parentId: Types.ObjectId | undefined;
  if (parentConfig) {
    parentId = input[parentConfig.input]
      ? await requireActive(
          parentConfig.model,
          String(input[parentConfig.input]),
          parentConfig.label,
        )
      : (current.get(parentConfig.field) as Types.ObjectId);
    if (input.code)
      await ensureUnique(
        model,
        { [parentConfig.field]: parentId, code: input.code },
        id,
      );
    current.set(parentConfig.field, parentId);
    delete input[parentConfig.input];
  } else if (input.code) {
    await ensureUnique(model, { code: input.code }, id);
  }

  if (entity === "course" && input.prerequisiteIds) {
    current.set(
      "prerequisites",
      await validatePrerequisites(
        input.prerequisiteIds as string[],
        parentId!,
        id,
      ),
    );
    delete input.prerequisiteIds;
  }
  current.set(input);
  await current.save();
  return getEntity(entity, id);
}
