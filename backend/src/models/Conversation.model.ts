// backend/src/models/Conversation.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[]; // کاربران شرکت‌کننده
  ad?: mongoose.Types.ObjectId; // آگهی مرتبط (اختیاری)
  lastMessage?: string; // متن آخرین پیام
  lastMessageAt?: Date; // زمان آخرین پیام
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    ad: {
      type: Schema.Types.ObjectId,
      ref: "Ad",
      default: null,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// ایندکس برای جستجوی سریع
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema,
);
