import { Request, Response } from "express";
import Turf from "../models/Turf.js";
import Booking from "../models/Booking.js";
import { generateSlots } from "../utils/slotUtils.js";
import { generateTicketCode } from "../utils/ticketCode.js";
// export const checkAvailability = async (req: Request, res: Response) => {
//   try {
//     const { turfId, date } = req.query;

//     if (!turfId || !date) {
//       return res.status(400).json({ msg: "Missing turfId or date" });
//     }

//     const turf = await Turf.findById(turfId);
//     if (!turf) return res.status(404).json({ msg: "Turf not found" });

//     const allSlots = generateSlots(turf.openTime, turf.closeTime);

//     const bookings = await Booking.find({ turfId, date, status: "booked" });
//     const bookedSlots = bookings.map(b => b.slot);

//     const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

//     res.json({ date, allSlots, bookedSlots, availableSlots });
//   } catch (err) {
//     console.error("Availability error:", err);
//     res.status(500).json({ msg: "Server error" });
//   }
// };


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
    await redis.setEx(cacheKey, 120, JSON.stringify(result));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};


// booking 
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { turfId, date, slot, numPlayers } = req.body;
    const userId = (req as any).id?.id;

    if (!turfId || !date || !slot || !numPlayers) {
      return res.status(400).json({ msg: "Missing booking data" });
    }

    const turf = await Turf.findById(turfId);
    if (!turf) return res.status(404).json({ msg: "Turf not found" });

    // Check if slot already booked
    const existing = await Booking.findOne({
      turfId,
      date,
      slot,
      status: "booked"
    });

    if (existing) {
      return res.status(400).json({ msg: "Slot already booked" });
    }

    // Enforce player limit
    if (numPlayers > turf.maxPlayers) {
      return res.status(400).json({ msg: `Max ${turf.maxPlayers} players allowed` });
    }

    const ticketCode = generateTicketCode();

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

    // Invalidate cache
    await redis.del(`availability:${turfId}:${date}`);

    res.status(201).json({
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
    res.status(500).json({ msg: "Server error" });
  }
};


