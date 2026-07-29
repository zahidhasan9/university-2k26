import { model, Schema } from "mongoose";

const courseMaterialSchema = new Schema(
  {
    offering: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    type: { type: String, enum: ["document", "video", "link", "slide", "other"], required: true },
    url: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 0, default: 0 },
    published: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false },
);
courseMaterialSchema.index({ offering: 1, order: 1 });
export const CourseMaterialModel = model("CourseMaterial", courseMaterialSchema);
