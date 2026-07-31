// backend/src/models/LocationMap.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IMapLocation extends Document {
  title: string;
  type: 'province' | 'city' | 'district' | 'custom_zone';
  referenceId?: mongoose.Types.ObjectId; // اتصال به استان یا شهر اصلی
  coordinates: {
    lat: number;
    lng: number;
  };
  bounds?: {
    ne: { lat: number; lng: number }; // شمال شرقی
    sw: { lat: number; lng: number }; // جنوب غربی
  };
  zoomLevel: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MapLocationSchema = new Schema<IMapLocation>(
  {
    title: { type: String, required: true, trim: true },
    type: { 
      type: String, 
      enum: ['province', 'city', 'district', 'custom_zone'], 
      default: 'city' 
    },
    referenceId: { type: Schema.Types.ObjectId, ref: 'City' },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    bounds: {
      ne: { lat: Number, lng: Number },
      sw: { lat: Number, lng: Number },
    },
    zoomLevel: { type: Number, default: 12 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MapLocationSchema.index({ coordinates: '2dsphere' });

export const MapLocation =
  mongoose.models.MapLocation ||
  mongoose.model<IMapLocation>("MapLocation", MapLocationSchema);