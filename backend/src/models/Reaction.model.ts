import mongoose, { Schema, Document } from "mongoose";

export interface IReaction extends Document {
  message: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  emoji: string;
  createdAt: Date;
}

const ReactionSchema = new Schema<IReaction>(
  {
    message: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emoji: {
      type: String,
      required: true,
      enum: ["👍", "❤️", "😂", "😮", "😢", "😡"], // ایموجی‌های مجاز
    },
  },
  { timestamps: true },
);

// هر کاربر فقط یک واکنش روی هر پیام می‌تواند داشته باشد
ReactionSchema.index({ message: 1, user: 1 }, { unique: true });

export const Reaction = mongoose.model<IReaction>("Reaction", ReactionSchema);
