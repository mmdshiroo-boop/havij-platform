// backend/src/models/WatermarkSettings.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IWatermarkSettings extends Document {
  /** آیا واترمارک فعال باشد */
  enabled: boolean;

  /** متن واترمارک */
  text: string;

  /** شفافیت بین 0 تا 1 */
  opacity: number;

  /** اندازه فونت به پیکسل */
  fontSize: number;

  /** رنگ متن (hex) */
  color: string;

  /** موقعیت: tiled / corner / center */
  position: "tiled" | "corner" | "center";

  /** فاصله بین هر متن در حالت tiled */
  tileSize: number;

  /** زاویه چرخش بر حسب درجه */
  rotation: number;

  /** نام فونت */
  fontFamily: string;

  /** ضخامت فونت */
  fontWeight: string;

  /** حداقل عرض تصویر برای اعمال واترمارک (پیکسل) */
  minWidth: number;

  /** حداقل ارتفاع تصویر برای اعمال واترمارک (پیکسل) */
  minHeight: number;

  /** اعمال واترمارک فقط روی تصاویر آگهی فعال یا همه */
  applyTo: "all" | "ads_only";

  createdAt: Date;
  updatedAt: Date;
}

const WatermarkSettingsSchema = new Schema<IWatermarkSettings>(
  {
    enabled: { type: Boolean, default: true },
    text: { type: String, default: "هویج", trim: true },
    opacity: { type: Number, default: 0.12, min: 0, max: 1 },
    fontSize: { type: Number, default: 28, min: 10, max: 120 },
    color: { type: String, default: "#ffffff" },
    position: {
      type: String,
      enum: ["tiled", "corner", "center"],
      default: "tiled",
    },
    tileSize: { type: Number, default: 220, min: 80, max: 600 },
    rotation: { type: Number, default: -30, min: -90, max: 90 },
    fontFamily: { type: String, default: "sans-serif" },
    fontWeight: {
      type: String,
      enum: ["normal", "bold", "lighter"],
      default: "bold",
    },
    minWidth: { type: Number, default: 200, min: 0 },
    minHeight: { type: Number, default: 200, min: 0 },
    applyTo: {
      type: String,
      enum: ["all", "ads_only"],
      default: "ads_only",
    },
  },
  { timestamps: true },
);

// فقط یک سند تنظیمات وجود دارد
WatermarkSettingsSchema.index({}, { unique: true });

export const WatermarkSettings = mongoose.model<IWatermarkSettings>(
  "WatermarkSettings",
  WatermarkSettingsSchema,
);
