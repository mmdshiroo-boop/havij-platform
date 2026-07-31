import mongoose, { Schema, Document } from "mongoose";

export interface IUserNotificationSetting extends Document {
  user: mongoose.Types.ObjectId;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  newAdAlerts: boolean;
  adStatusAlerts: boolean;
  messageAlerts: boolean;
  messageAlertSchedule: string;
}

const UserNotificationSettingSchema = new Schema<IUserNotificationSetting>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    marketingEmails: { type: Boolean, default: false },
    newAdAlerts: { type: Boolean, default: true },
    adStatusAlerts: { type: Boolean, default: true },
    messageAlerts: { type: Boolean, default: true },
    messageAlertSchedule: {
      type: String,
      enum: ["always", "daytime", "working_hours"],
      default: "always",
    },
  },
  { timestamps: true },
);

export const UserNotificationSetting = mongoose.model<IUserNotificationSetting>(
  "UserNotificationSetting",
  UserNotificationSettingSchema,
);
