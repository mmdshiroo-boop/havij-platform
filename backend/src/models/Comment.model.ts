import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  ad: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  parent?: mongoose.Types.ObjectId; // 🆕
  isApproved: boolean;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    ad: { type: Schema.Types.ObjectId, ref: "Ad", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    parent: { type: Schema.Types.ObjectId, ref: "Comment", default: null }, // 🆕
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Comment = mongoose.model<IComment>("Comment", CommentSchema);
