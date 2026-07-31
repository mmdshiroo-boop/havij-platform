import mongoose, { Schema, Document } from "mongoose";

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  adId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adId: { type: Schema.Types.ObjectId, ref: "Ad", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// یکتا بودن ترکیب کاربر و آگهی
FavoriteSchema.index({ userId: 1, adId: 1 }, { unique: true });

export const Favorite = mongoose.model<IFavorite>("Favorite", FavoriteSchema);
