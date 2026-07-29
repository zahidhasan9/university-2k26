import { AppError } from "../../utils/AppError";
import { toObjectId } from "../../utils/mongo";
import { ProgramModel } from "../university-structure/program.model";
import { GradePolicyModel } from "./gradePolicy.model";

export async function listGradePolicies(query: Record<string, unknown>) {
  const filter: Record<string, unknown> = {};
  if (query.programId) filter.program = toObjectId(String(query.programId), "program id");
  if (query.status) filter.status = query.status;
  return GradePolicyModel.find(filter).populate("program", "name code").sort({ createdAt: -1 }).lean();
}

export async function createGradePolicy(input: {
  programId: string;
  name: string;
  bands: unknown[];
}) {
  const program = await ProgramModel.findOne({
    _id: toObjectId(input.programId, "program id"),
    status: "active",
  });
  if (!program) throw new AppError(400, "Active program not found");
  if (await GradePolicyModel.exists({ program: program._id, status: "active" })) {
    throw new AppError(409, "Program already has an active grade policy");
  }
  return GradePolicyModel.create({
    program: program._id,
    name: input.name,
    bands: input.bands,
  });
}

export async function updateGradePolicy(id: string, input: Record<string, unknown>) {
  const policy = await GradePolicyModel.findById(toObjectId(id));
  if (!policy) throw new AppError(404, "Grade policy not found");
  if (input.status === "active" && policy.status !== "active") {
    if (await GradePolicyModel.exists({ program: policy.program, status: "active", _id: { $ne: policy._id } })) {
      throw new AppError(409, "Program already has another active grade policy");
    }
  }
  policy.set(input);
  await policy.save();
  return policy;
}
