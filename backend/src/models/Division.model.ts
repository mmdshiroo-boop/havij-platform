import mongoose, { Schema, Document } from "mongoose";

export interface IProvince extends Document {
  name: string;
  slug: string;
  code: number;
}

export interface ICity extends Document {
  name: string;
  province: string;
  provinceSlug: string;
}

export interface IDistrict extends Document {
  name: string;
  city: string;
  citySlug: string;
}

const ProvinceSchema = new Schema<IProvince>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  code: Number,
});

const CitySchema = new Schema<ICity>({
  name: { type: String, required: true },
  province: { type: String, required: true },
  provinceSlug: { type: String, required: true },
});

const DistrictSchema = new Schema<IDistrict>({
  name: { type: String, required: true },
  city: { type: String, required: true },
  citySlug: { type: String, required: true },
});

export const ProvinceModel = mongoose.model<IProvince>(
  "Province",
  ProvinceSchema,
);
export const CityModel = mongoose.model<ICity>("City", CitySchema);
export const DistrictModel = mongoose.model<IDistrict>(
  "District",
  DistrictSchema,
);
