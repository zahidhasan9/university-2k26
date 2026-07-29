import { model, Schema } from "mongoose";

const questionSchema = new Schema(
  {
    prompt: { type: String, required: true, trim: true, maxlength: 1000 },
    options: [{ type: String, required: true, trim: true, maxlength: 500 }],
    correctOptionIndex: { type: Number, required: true, min: 0, select: false },
    points: { type: Number, required: true, min: 0.01, max: 1000 },
  },
  { _id: true },
);

const quizSchema = new Schema(
  {
    offering: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    instructions: { type: String, trim: true, maxlength: 3000 },
    questions: { type: [questionSchema], required: true },
    totalPoints: { type: Number, required: true, min: 0.01 },
    opensAt: { type: Date, required: true },
    closesAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 1, max: 1440 },
    published: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false },
);
export const QuizModel = model("Quiz", quizSchema);

const quizAttemptSchema = new Schema(
  {
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    offering: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    answers: [
      {
        questionId: { type: Schema.Types.ObjectId, required: true },
        selectedOptionIndex: { type: Number, required: true, min: 0 },
      },
    ],
    score: { type: Number, required: true, min: 0, default: 0 },
    totalPoints: { type: Number, required: true, min: 0 },
    startedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    submittedAt: { type: Date },
    status: { type: String, enum: ["in_progress", "submitted", "expired"], default: "in_progress" },
  },
  { timestamps: true, versionKey: false },
);
quizAttemptSchema.index({ quiz: 1, student: 1 }, { unique: true });
export const QuizAttemptModel = model("QuizAttempt", quizAttemptSchema);
