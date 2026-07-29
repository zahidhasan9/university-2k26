import { model, Schema } from "mongoose";

const fundingSchema = new Schema(
  {
    source: { type: String, required: true, trim: true, maxlength: 160 },
    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, default: "BDT" },
  },
  { _id: false },
);

const researchProjectSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 300, index: true },
    abstract: { type: String, required: true, trim: true, maxlength: 5000 },
    leadResearcher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    funding: { type: fundingSchema },
    status: {
      type: String,
      enum: ["proposed", "approved", "ongoing", "completed", "suspended", "cancelled"],
      default: "proposed",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

researchProjectSchema.index({ department: 1, status: 1 });
export const ResearchProjectModel = model("ResearchProject", researchProjectSchema);
