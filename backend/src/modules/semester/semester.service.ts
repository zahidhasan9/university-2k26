import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { UniversityModel } from "../university-structure/university.model";
import { SemesterModel } from "./semester.model";

function validateDates(value: {
  startsAt: Date;
  endsAt: Date;
  registrationStartsAt: Date;
  registrationEndsAt: Date;
}) {
  if (
    value.startsAt >= value.endsAt ||
    value.registrationStartsAt >= value.registrationEndsAt ||
    value.registrationEndsAt > value.endsAt
  ) {
    throw new AppError(400, "Semester and registration dates are invalid");
  }
}

export async function listSemesters(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.universityId) filter.university = toObjectId(String(query.universityId), "university id");
  if (query.status) filter.status = query.status;
  if (query.academicYear) filter.academicYear = query.academicYear;
  if (query.search) {
    const search = escapeRegex(String(query.search));
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }
  const [items, total] = await Promise.all([
    SemesterModel.find(filter)
      .populate("university", "name code")
      .sort({ startsAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SemesterModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function getSemester(id: string) {
  const item = await SemesterModel.findById(toObjectId(id)).populate("university", "name code").lean();
  if (!item) throw new AppError(404, "Semester not found");
  return item;
}

export async function createSemester(input: Record<string, unknown>) {
  const university = await UniversityModel.findOne({
    _id: toObjectId(String(input.universityId), "university id"),
    status: "active",
  });
  if (!university) throw new AppError(400, "Active university not found");
  if (
    await SemesterModel.countDocuments({
      university: university._id,
      code: String(input.code),
    } as Record<string, unknown>)
  ) {
    throw new AppError(409, "Semester code already exists for this university");
  }
  const { universityId: _, ...data } = input;
  return SemesterModel.create({ ...data, university: university._id });
}

export async function updateSemester(id: string, input: Record<string, unknown>) {
  const semester = await SemesterModel.findById(toObjectId(id));
  if (!semester) throw new AppError(404, "Semester not found");
  const nextDates = {
    startsAt: (input.startsAt as Date | undefined) ?? semester.startsAt,
    endsAt: (input.endsAt as Date | undefined) ?? semester.endsAt,
    registrationStartsAt:
      (input.registrationStartsAt as Date | undefined) ?? semester.registrationStartsAt,
    registrationEndsAt:
      (input.registrationEndsAt as Date | undefined) ?? semester.registrationEndsAt,
  };
  validateDates(nextDates);
  semester.set(input);
  await semester.save();
  return getSemester(id);
}
