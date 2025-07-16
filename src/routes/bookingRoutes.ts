import express from "express";
import {
  checkAvailability,
  createBooking,
  getUserBookings,
  cancelBooking
} from "../controllers/bookingController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Check slot availability
router.get("/availability", checkAvailability); // Public

// Book a turf slot (authenticated users only)
router.post("/create", authMiddleware, createBooking);

// Get all bookings by logged-in user
router.get("/user", authMiddleware, getUserBookings);

// Cancel a specific booking
router.put("/cancel/:id", authMiddleware, cancelBooking);

export default router;
