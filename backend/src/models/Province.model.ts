// backend/src/models/Province.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IProvince extends Document {
  name: string;
  code: number;
  slug: string;
  color: string;
  population: number;
  area: number;
  cities: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProvinceSchema = new Schema<IProvince>(
  {
    name: { type: String, required: true, unique: true },
    code: { type: Number, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    color: { type: String, default: "from-primary to-primary/80" },
    population: { type: Number, default: 0 },
    area: { type: Number, default: 0 },
    cities: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// ✅ FIX: cast صریح به Model<IProvince> تا TypeScript union type درست بشه
// بدون این cast، نوع Province میشه
// mongoose.Model<unknown> | mongoose.Model<IProvince>
// که باعث میشه هیچکدام از متدهای findOne/find/findById کار نکنن
export const Province =
  (mongoose.models.Province as mongoose.Model<IProvince>) ||
  mongoose.model<IProvince>("Province", ProvinceSchema);
