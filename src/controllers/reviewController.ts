import { Request, Response } from "express";
// import Review from "../models/review.js";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Turf from "../models/Turf.js";

export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { turfId, rating, comment } = req.body;

    if (!rating || !comment || !turfId) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const today = new Date().toISOString().split("T")[0];

    const booking = await Booking.findOne({
      userId,
      turfId,
      status: "booked",
      date: { $lt: today }, // Only past bookings allowed to review
    });

    if (!booking) {
      return res.status(400).json({ msg: "You can only review after using the turf" });
    }

    // Optional: One review per turf per user
    const alreadyReviewed = await Review.findOne({ userId, turfId });
    if (alreadyReviewed) {
      return res.status(400).json({ msg: "You already reviewed this turf" });
    }

    const review = await Review.create({
      userId,
      turfId,
      rating,
      comment,
    });

    // Recalculate turf's average rating and review count
    const allReviews = await Review.find({ turfId });

    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await Turf.findByIdAndUpdate(turfId, {
      averageRating: avgRating,
      numReviews: allReviews.length,
    });

    res.status(201).json({ msg: "Review submitted successfully", review });
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
