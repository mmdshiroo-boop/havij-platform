import mongoose, { Document, Schema } from "mongoose";

export interface IRole extends Document {
  name: string; // e.g., "admin", "content_manager"
  label: string; // e.g., "مدیر محتوا"
  permissions: string[]; // e.g., ["ads:read", "ads:write", "users:read"]
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    label: { type: String, required: true },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model<IRole>("Role", roleSchema);
