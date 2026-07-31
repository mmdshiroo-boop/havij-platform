import mongoose, { Schema, Document } from "mongoose";

export interface IExpert extends Document {
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  nationalCode?: string;
  avatar?: string;
  specialty: string[];
  experienceYears: number;
  licenseNumber?: string;
  description?: string;
  verifiedAds: number;
  rejectedAds: number;
  totalReviews: number;
  rating: number;
  status: "active" | "inactive" | "suspended";
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpertSchema = new Schema<IExpert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, unique: true, sparse: true },
    nationalCode: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: "" },
    specialty: [{ type: String, default: [] }],
    experienceYears: { type: Number, default: 0 },
    licenseNumber: { type: String },
    description: { type: String },
    verifiedAds: { type: Number, default: 0 },
    rejectedAds: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// ایندکس‌ها
ExpertSchema.index({ userId: 1 });
ExpertSchema.index({ phone: 1 });
ExpertSchema.index({ specialty: 1 });
ExpertSchema.index({ status: 1 });
ExpertSchema.index({ rating: -1 });

ExpertSchema.virtual("fullName").get(function (this: IExpert) {
  return `${this.firstName} ${this.lastName}`;
});

ExpertSchema.methods.incrementVerifiedAds = async function () {
  this.verifiedAds += 1;
  this.totalReviews += 1;
  await this.save();
};

ExpertSchema.methods.incrementRejectedAds = async function () {
  this.rejectedAds += 1;
  this.totalReviews += 1;
  await this.save();
};

ExpertSchema.methods.updateLastActive = async function () {
  this.lastActive = new Date();
  await this.save();
};

export const Expert = mongoose.model<IExpert>("Expert", ExpertSchema);
