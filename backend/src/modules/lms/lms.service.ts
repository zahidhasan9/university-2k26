import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { toObjectId } from "../../utils/mongo";
import { CourseOfferingModel } from "../course-offering/courseOffering.model";
import { EnrollmentModel } from "../enrollment/enrollment.model";
import { StudentModel } from "../student/student.model";
import { TeacherModel } from "../teacher/teacher.model";
import { AssignmentSubmissionModel, LmsAssignmentModel } from "./assignment.model";
import { CourseMaterialModel } from "./courseMaterial.model";
import { DiscussionPostModel } from "./discussionPost.model";
import { QuizAttemptModel, QuizModel } from "./quiz.model";

export async function lmsAccess(
  offeringId: Types.ObjectId,
  userId: Types.ObjectId,
  manageAll: boolean,
  requireManage = false,
) {
  const offering = await CourseOfferingModel.findById(offeringId);
  if (!offering) throw new AppError(404, "Course offering not found");
  if (manageAll) return { offering, manager: true };
  const teacher = await TeacherModel.findOne({ user: userId, status: "active" }).select("_id").lean();
  if (teacher && offering.teacher.equals(teacher._id)) return { offering, manager: true };
  if (requireManage) throw new AppError(403, "Only the assigned teacher can manage this LMS course");
  const student = await StudentModel.findOne({ user: userId, status: "active" }).select("_id").lean();
  if (
    student &&
    (await EnrollmentModel.exists({
      student: student._id,
      offering: offeringId,
      status: { $in: ["enrolled", "completed", "failed"] },
    }))
  ) {
    return { offering, manager: false, student };
  }
  throw new AppError(403, "You do not have access to this LMS course");
}

export async function listMaterials(offeringIdValue: string, userId: Types.ObjectId, manageAll: boolean) {
  const offeringId = toObjectId(offeringIdValue, "offering id");
  const access = await lmsAccess(offeringId, userId, manageAll);
  return CourseMaterialModel.find({
    offering: offeringId,
    ...(!access.manager ? { published: true } : {}),
  })
    .sort({ order: 1, createdAt: 1 })
    .lean();
}
export async function createMaterial(userId: Types.ObjectId, manageAll: boolean, input: Record<string, unknown>) {
  const offeringId = toObjectId(String(input.offeringId), "offering id");
  await lmsAccess(offeringId, userId, manageAll, true);
  const { offeringId: _, ...data } = input;
  return CourseMaterialModel.create({ ...data, offering: offeringId, createdBy: userId });
}

export async function listAssignments(offeringIdValue: string, userId: Types.ObjectId, manageAll: boolean) {
  const offeringId = toObjectId(offeringIdValue, "offering id");
  const access = await lmsAccess(offeringId, userId, manageAll);
  return LmsAssignmentModel.find({
    offering: offeringId,
    ...(!access.manager ? { published: true } : {}),
  })
    .sort({ dueAt: 1 })
    .lean();
}
export async function createAssignment(userId: Types.ObjectId, manageAll: boolean, input: Record<string, unknown>) {
  const offeringId = toObjectId(String(input.offeringId), "offering id");
  await lmsAccess(offeringId, userId, manageAll, true);
  const { offeringId: _, ...data } = input;
  return LmsAssignmentModel.create({ ...data, offering: offeringId, createdBy: userId });
}
export async function submitAssignment(assignmentId: string, userId: Types.ObjectId, input: Record<string, unknown>) {
  const assignment = await LmsAssignmentModel.findOne({
    _id: toObjectId(assignmentId),
    published: true,
  });
  if (!assignment) throw new AppError(404, "Published assignment not found");
  if (new Date() > assignment.dueAt) throw new AppError(409, "Assignment deadline has passed");
  const access = await lmsAccess(assignment.offering, userId, false);
  if (!access.student) throw new AppError(403, "Student enrollment is required");
  if (await AssignmentSubmissionModel.exists({ assignment: assignment._id, student: access.student._id })) {
    throw new AppError(409, "Assignment has already been submitted");
  }
  return AssignmentSubmissionModel.create({
    ...input,
    assignment: assignment._id,
    offering: assignment.offering,
    student: access.student._id,
  });
}
export async function listSubmissions(assignmentId: string, userId: Types.ObjectId, manageAll: boolean) {
  const assignment = await LmsAssignmentModel.findById(toObjectId(assignmentId));
  if (!assignment) throw new AppError(404, "Assignment not found");
  await lmsAccess(assignment.offering, userId, manageAll, true);
  return AssignmentSubmissionModel.find({ assignment: assignment._id })
    .populate({ path: "student", select: "studentId user", populate: { path: "user", select: "firstName lastName" } })
    .sort({ submittedAt: 1 })
    .lean();
}
export async function gradeSubmission(
  submissionId: string,
  userId: Types.ObjectId,
  manageAll: boolean,
  score: number,
  feedback?: string,
) {
  const submission = await AssignmentSubmissionModel.findById(toObjectId(submissionId));
  if (!submission) throw new AppError(404, "Submission not found");
  const assignment = await LmsAssignmentModel.findById(submission.assignment);
  if (!assignment) throw new AppError(404, "Assignment not found");
  await lmsAccess(assignment.offering, userId, manageAll, true);
  if (score > assignment.maxScore) throw new AppError(400, "Score exceeds assignment maximum");
  submission.score = score;
  submission.feedback = feedback;
  submission.gradedBy = userId;
  submission.gradedAt = new Date();
  submission.status = "graded";
  await submission.save();
  return submission;
}

export async function createQuiz(userId: Types.ObjectId, manageAll: boolean, input: Record<string, unknown>) {
  const offeringId = toObjectId(String(input.offeringId));
  await lmsAccess(offeringId, userId, manageAll, true);
  const questions = input.questions as Array<{ points: number }>;
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);
  const { offeringId: _, ...data } = input;
  return QuizModel.create({ ...data, offering: offeringId, totalPoints, createdBy: userId });
}
export async function getQuiz(quizId: string, userId: Types.ObjectId, manageAll: boolean) {
  const quiz = await QuizModel.findById(toObjectId(quizId))
    .select("-questions.correctOptionIndex")
    .lean();
  if (!quiz) throw new AppError(404, "Quiz not found");
  const access = await lmsAccess(quiz.offering, userId, manageAll);
  if (!access.manager && (!quiz.published || new Date() < quiz.opensAt || new Date() > quiz.closesAt)) {
    throw new AppError(409, "Quiz is not currently available");
  }
  return quiz;
}
export async function startQuiz(quizId: string, userId: Types.ObjectId) {
  const quiz = await QuizModel.findOne({ _id: toObjectId(quizId), published: true })
    .select("-questions.correctOptionIndex");
  const now = new Date();
  if (!quiz || now < quiz.opensAt || now > quiz.closesAt) {
    throw new AppError(409, "Quiz is not currently available");
  }
  const access = await lmsAccess(quiz.offering, userId, false);
  if (!access.student) throw new AppError(403, "Student enrollment is required");
  const existing = await QuizAttemptModel.findOne({ quiz: quiz._id, student: access.student._id });
  if (existing) {
    if (existing.status === "in_progress" && existing.expiresAt <= now) {
      existing.status = "expired";
      await existing.save();
    }
    throw new AppError(409, "Quiz attempt has already been started");
  }
  const durationEnd = new Date(now.getTime() + quiz.durationMinutes * 60_000);
  const expiresAt = durationEnd < quiz.closesAt ? durationEnd : quiz.closesAt;
  const attempt = await QuizAttemptModel.create({
    quiz: quiz._id,
    offering: quiz.offering,
    student: access.student._id,
    totalPoints: quiz.totalPoints,
    expiresAt,
  });
  return { attemptId: attempt._id, startedAt: attempt.startedAt, expiresAt };
}
export async function submitQuiz(
  quizId: string,
  userId: Types.ObjectId,
  answers: Array<{ questionId: string; selectedOptionIndex: number }>,
) {
  const quiz = await QuizModel.findOne({ _id: toObjectId(quizId), published: true })
    .select("+questions.correctOptionIndex");
  if (!quiz || new Date() < quiz.opensAt || new Date() > quiz.closesAt) {
    throw new AppError(409, "Quiz is not currently available");
  }
  const access = await lmsAccess(quiz.offering, userId, false);
  if (!access.student) throw new AppError(403, "Student enrollment is required");
  const attempt = await QuizAttemptModel.findOne({
    quiz: quiz._id,
    student: access.student._id,
    status: "in_progress",
  });
  if (!attempt) throw new AppError(409, "Active quiz attempt not found; start the quiz first");
  if (attempt.expiresAt < new Date()) {
    attempt.status = "expired";
    await attempt.save();
    throw new AppError(409, "Quiz attempt has expired");
  }
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.selectedOptionIndex]));
  if (answerMap.size !== answers.length) throw new AppError(400, "Duplicate quiz answers");
  const questionIds = new Set(quiz.questions.map((question) => question._id.toString()));
  if (answers.some((answer) => !questionIds.has(answer.questionId))) {
    throw new AppError(400, "Answer references an unknown quiz question");
  }
  let score = 0;
  for (const question of quiz.questions) {
    const selected = answerMap.get(question._id.toString());
    if (selected !== undefined && (selected < 0 || selected >= question.options.length)) {
      throw new AppError(400, "Selected option is out of range");
    }
    if (selected === question.correctOptionIndex) score += question.points;
  }
  attempt.set(
    "answers",
    answers.map((answer) => ({
      questionId: toObjectId(answer.questionId),
      selectedOptionIndex: answer.selectedOptionIndex,
    })),
  );
  attempt.score = score;
  attempt.submittedAt = new Date();
  attempt.status = "submitted";
  await attempt.save();
  return attempt;
}

export async function listDiscussion(offeringIdValue: string, userId: Types.ObjectId, manageAll: boolean) {
  const offeringId = toObjectId(offeringIdValue);
  const access = await lmsAccess(offeringId, userId, manageAll);
  return DiscussionPostModel.find({
    offering: offeringId,
    ...(!access.manager ? { status: "visible" } : {}),
  })
    .populate("author", "firstName lastName")
    .sort({ createdAt: 1 })
    .lean();
}
export async function createDiscussion(userId: Types.ObjectId, manageAll: boolean, input: Record<string, unknown>) {
  const offeringId = toObjectId(String(input.offeringId));
  await lmsAccess(offeringId, userId, manageAll);
  if (input.parentId) {
    const parent = await DiscussionPostModel.findOne({
      _id: toObjectId(String(input.parentId)),
      offering: offeringId,
      status: "visible",
    });
    if (!parent) throw new AppError(400, "Discussion parent not found");
  } else if (!input.title) {
    throw new AppError(400, "Discussion thread title is required");
  }
  const { offeringId: _, parentId, ...data } = input;
  return DiscussionPostModel.create({
    ...data,
    offering: offeringId,
    author: userId,
    ...(parentId ? { parent: toObjectId(String(parentId)) } : {}),
  });
}
