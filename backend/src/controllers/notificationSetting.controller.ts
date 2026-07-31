import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { UserNotificationSetting } from "../models/UserNotificationSetting.model";

export const getNotificationSettings = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.user._id;
    let settings = await UserNotificationSetting.findOne({ user: userId });
    if (!settings) {
      // ایجاد رکورد پیش‌فرض با تمام فیلدها
      settings = await UserNotificationSetting.create({
        user: userId,
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        newAdAlerts: true,
        adStatusAlerts: true,
        messageAlerts: true,
        messageAlertSchedule: "always",
      });
    }
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Get notification settings error:", error);
    return res
      .status(500)
      .json({ success: false, message: "خطا در دریافت تنظیمات" });
  }
};

export const updateNotificationSettings = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.user._id;
    const {
      emailNotifications,
      smsNotifications,
      marketingEmails,
      newAdAlerts,
      adStatusAlerts,
      messageAlerts,
      messageAlertSchedule,
    } = req.body;

    const updateData: any = {};
    if (emailNotifications !== undefined)
      updateData.emailNotifications = emailNotifications;
    if (smsNotifications !== undefined)
      updateData.smsNotifications = smsNotifications;
    if (marketingEmails !== undefined)
      updateData.marketingEmails = marketingEmails;
    if (newAdAlerts !== undefined) updateData.newAdAlerts = newAdAlerts;
    if (adStatusAlerts !== undefined)
      updateData.adStatusAlerts = adStatusAlerts;
    if (messageAlerts !== undefined) updateData.messageAlerts = messageAlerts;
    if (messageAlertSchedule !== undefined)
      updateData.messageAlertSchedule = messageAlertSchedule;

    const settings = await UserNotificationSetting.findOneAndUpdate(
      { user: userId },
      updateData,
      { new: true, upsert: true },
    );

    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Update notification settings error:", error);
    return res
      .status(500)
      .json({ success: false, message: "خطا در ذخیره تنظیمات" });
  }
};
