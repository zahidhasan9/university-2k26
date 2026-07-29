import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { EnrollmentModel } from "../enrollment/enrollment.model";
import { SemesterModel } from "../semester/semester.model";
import { TeacherModel } from "../teacher/teacher.model";
import { CourseModel } from "../university-structure/course.model";
import { CourseOfferingModel } from "./courseOffering.model";

const populate = [
  { path: "course", select: "code title credits program" },
  { path: "semester", select: "name code academicYear term status" },
  {
    path: "teacher",
    select: "employeeId designation user department",
    populate: { path: "user", select: "firstName lastName email" },
  },
];

export async function listOfferings(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.courseId) filter.course = toObjectId(String(query.courseId), "course id");
  if (query.semesterId) filter.semester = toObjectId(String(query.semesterId), "semester id");
  if (query.teacherId) filter.teacher = toObjectId(String(query.teacherId), "teacher id");
  if (query.status) filter.status = query.status;
  if (query.search) filter.section = { $regex: escapeRegex(String(query.search)), $options: "i" };
  let findQuery = CourseOfferingModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  for (const item of populate) findQuery = findQuery.populate(item);
  const [items, total] = await Promise.all([findQuery.lean(), CourseOfferingModel.countDocuments(filter)]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function getOffering(id: string) {
  let query = CourseOfferingModel.findById(toObjectId(id));
  for (const item of populate) query = query.populate(item);
  const offering = await query.lean();
  if (!offering) throw new AppError(404, "Course offering not found");
  const enrolledCount = await EnrollmentModel.countDocuments({
    offering: toObjectId(id),
    status: "enrolled",
  });
  return { ...offering, enrolledCount, availableSeats: Math.max(0, offering.capacity - enrolledCount) };
}

export async function createOffering(input: {
  courseId: string;
  semesterId: string;
  teacherId: string;
  section: string;
  capacity: number;
  deliveryMode: "in_person" | "online" | "hybrid";
}) {
  const courseId = toObjectId(input.courseId, "course id");
  const semesterId = toObjectId(input.semesterId, "semester id");
  const teacherId = toObjectId(input.teacherId, "teacher id");
  const [course, semester, teacher] = await Promise.all([
    CourseModel.findOne({ _id: courseId, status: "active" }),
    SemesterModel.findOne({ _id: semesterId, status: { $in: ["planned", "registration", "ongoing"] } }),
    TeacherModel.findOne({ _id: teacherId, status: "active" }),
  ]);
  if (!course) throw new AppError(400, "Active course not found");
  if (!semester) throw new AppError(400, "Available semester not found");
  if (!teacher) throw new AppError(400, "Active teacher not found");
  if (await CourseOfferingModel.exists({ course: courseId, semester: semesterId, section: input.section })) {
    throw new AppError(409, "Course section already exists in this semester");
  }
  const offering = await CourseOfferingModel.create({
    course: courseId,
    semester: semesterId,
    teacher: teacherId,
    section: input.section,
    capacity: input.capacity,
    deliveryMode: input.deliveryMode,
  });
  return getOffering(offering._id.toString());
}

const transitions: Record<string, string[]> = {
  planned: ["open", "cancelled"],
  open: ["ongoing", "cancelled"],
  ongoing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function updateOffering(id: string, input: Record<string, unknown>) {
  const offering = await CourseOfferingModel.findById(toObjectId(id));
  if (!offering) throw new AppError(404, "Course offering not found");
  if (input.teacherId) {
    const teacher = await TeacherModel.findOne({
      _id: toObjectId(String(input.teacherId), "teacher id"),
      status: "active",
    });
    if (!teacher) throw new AppError(400, "Active teacher not found");
    offering.teacher = teacher._id;
    delete input.teacherId;
  }
  if (input.capacity) {
    const enrolled = await EnrollmentModel.countDocuments({ offering: offering._id, status: "enrolled" });
    if (Number(input.capacity) < enrolled) throw new AppError(409, "Capacity is below current enrollment");
  }
  if (
    input.status &&
    input.status !== offering.status &&
    !transitions[offering.status]?.includes(String(input.status))
  ) {
    throw new AppError(409, `Cannot move offering from ${offering.status} to ${input.status}`);
  }
  offering.set(input);
  await offering.save();
  return getOffering(id);
}
