import mongoose, { Schema, Document, Model } from "mongoose";

export interface ReviewI extends Document {
  turfId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number; // 1–5
  comment: string;
}

const reviewSchema: Schema<ReviewI> = new mongoose.Schema(
  {
    turfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Turf",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const Review: Model<ReviewI> = mongoose.model<ReviewI>("Review", reviewSchema);
export default Review;
