// backend/src/models/Location.model.ts
import mongoose, { Schema, Document } from "mongoose";

// ==================== مدل Province (استان) ====================
export interface IProvince extends Document {
  name: string;
  slug: string;
  code: number;
  color: string;
  population: number;
  area: number;
  cities: string[];
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProvinceSchema = new Schema<IProvince>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    code: { type: Number, required: true, unique: true },
    color: { type: String, default: "from-primary to-primary/80" },
    population: { type: Number, default: 0 },
    area: { type: Number, default: 0 },
    cities: [{ type: String }],
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// ==================== مدل City (شهر) ====================
export interface ICity extends Document {
  name: string;
  slug: string;
  provinceId: mongoose.Types.ObjectId;
  provinceName?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CitySchema = new Schema<ICity>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    provinceId: {
      type: Schema.Types.ObjectId,
      ref: "Province",
      required: true,
    },
    provinceName: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CitySchema.index({ name: 1, provinceId: 1 }, { unique: true });
CitySchema.index({ provinceId: 1 });
CitySchema.index({ slug: 1 });

// ✅ جلوگیری از OverwriteModelError
export const Province =
  mongoose.models.Province ||
  mongoose.model<IProvince>("Province", ProvinceSchema);
export const City =
  mongoose.models.City || mongoose.model<ICity>("City", CitySchema);
