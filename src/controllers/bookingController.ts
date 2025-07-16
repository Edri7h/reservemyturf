import { Request, Response } from "express";
import Turf from "../models/Turf.js";
import Booking from "../models/Booking.js";
import { generateSlots } from "../utils/slotUtils.js";
import { generateTicketCode } from "../utils/ticketCode.js";
import redis from "../utils/redisClient.js";

export const checkAvailability = async (req: Request, res: Response) => {
  const { turfId, date } = req.query;
  const cacheKey = `availability:${turfId}:${date}`;

  try {
    if (!turfId || !date) return res.status(400).json({ msg: "Missing data" });

    // Check Redis first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const turf = await Turf.findById(turfId);
    if (!turf) return res.status(404).json({ msg: "Turf not found" });

    const allSlots = generateSlots(turf.openTime, turf.closeTime);

    const bookings = await Booking.find({ turfId, date, status: "booked" });
    const bookedSlots = bookings.map(b => b.slot);

    const result = { turfId, date, allSlots, bookedSlots };

    // Cache in Redis for 2 minutes
    await redis.setEx(cacheKey, 10, JSON.stringify(result));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};


// booking 

import dayjs from "dayjs";
import mongoose from "mongoose";


 // your configured Redis client
// import { generateTicketCode } from "../utils/generateTicketCode"; // your ticket code function

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { turfId, date, slot, numPlayers } = req.body;
    const userId = req.user?.id;

    // 1. Validate required fields
    if (!turfId || !date || !slot || !numPlayers) {
      return res.status(400).json({ msg: "Missing booking data" });
    }

    // 2. Validate date (no past bookings)
    const today = dayjs().startOf("day");
    const bookingDate = dayjs(date);

    if (bookingDate.isBefore(today)) {
      return res.status(400).json({ msg: "Cannot book for past dates" });
    }

    // 3. Check if turf exists
    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ msg: "Turf not found" });
    }

    // 4. Check if slot already booked
    const existing = await Booking.findOne({
      turfId,
      date,
      slot,
      status: "booked"
    });

    if (existing) {
      return res.status(400).json({ msg: "Slot already booked" });
    }

    // 5. Validate player count
    if (numPlayers > turf.maxPlayers) {
      return res.status(400).json({ msg: `Max ${turf.maxPlayers} players allowed` });
    }

    // 6. Generate ticket code
    const ticketCode = generateTicketCode();

    // 7. Create and save booking
    const booking = new Booking({
      turfId,
      userId,
      date,
      slot,
      numPlayers,
      ticketCode,
      status: "booked"
    });

    await booking.save();

    // 8. Invalidate Redis cache
    const cacheKey = `availability:${turfId}:${date}`;
    await redis.del(cacheKey);

    // 9. Return success
    return res.status(201).json({
      msg: "Booking successful",
      booking: {
        id: booking._id,
        date,
        slot,
        ticketCode,
        status: booking.status
      }
    });

  } catch (err) {
    console.error("Booking error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};




// get user bookings
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; 

    const bookings = await Booking.find({ userId })
      .populate("turfId", "name location")
      .sort({ date: -1, createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    console.error("Get user bookings error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// cancel booking
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }

    // Only the user who made the booking can cancel it
    if (booking.userId.toString() !== userId) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    // Check if already cancelled
    if (booking.status === "cancelled") {
      return res.status(400).json({ msg: "Booking already cancelled" });
    }

    // Optional: Block same-day or past cancellations (for stricter policy)
    const today = new Date().toISOString().split("T")[0];

    if (booking.date === today) {
      return res.status(400).json({ msg: "Cannot cancel on the same day of booking" });
    }

    if (booking.date < today) {
      return res.status(400).json({ msg: "Cannot cancel past bookings" });
    }


    // Mark as cancelled
    booking.status = "cancelled";
    await booking.save();

    // Invalidate Redis cache
    await redis.del(`availability:${booking.turfId}:${booking.date}`);

    res.json({ msg: "Booking cancelled successfully" });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};



