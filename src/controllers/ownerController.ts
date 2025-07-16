import { Request, Response } from "express";
import Turf from "../models/Turf.js";
import Booking from "../models/Booking.js";

export const getTurfBookings = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.id;
    const role = req.user?.role;
    const turfId = req.params.id;

    if (role !== "owner") {
      return res.status(403).json({ msg: "Access denied. Not an owner." });
    }

    const turf = await Turf.findById(turfId);
    if (!turf) return res.status(404).json({ msg: "Turf not found" });

    if (turf.ownerId.toString() !== ownerId) {
      return res.status(403).json({ msg: "You do not own this turf." });
    }

    const bookings = await Booking.find({ turfId })
      .populate("userId", "name email")
      .sort({ date: -1 });

    res.status(200).json({ turf: turf.name, bookings });
  } catch (err) {
    console.error("Error fetching turf bookings:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// GET /api/owner/bookings
export const getAllOwnerBookings = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const skip = (page - 1) * limit;

    const turfs = await Turf.find({ ownerId });
    const turfMap = new Map<string, string>();
    const turfIds = turfs.map((t) => {
      turfMap.set(t._id.toString(), t.name);
      return t._id;
    });

    const totalBookings = await Booking.countDocuments({ turfId: { $in: turfIds } });

    const bookings = await Booking.find({ turfId: { $in: turfIds } })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const enriched = bookings.map((b) => ({
      _id: b._id,
      turfName: turfMap.get(b.turfId.toString()) || "Unknown Turf",
      user: b.userId,
      date: b.date,
      slot: b.slot,
      status: b.status,
      ticketCode: b.ticketCode,
      createdAt: b.createdAt,
    }));

    res.json({
      bookings: enriched,
      total: totalBookings,
      currentPage: page,
      totalPages: Math.ceil(totalBookings / limit),
    });
  } catch (err) {
    console.error("Owner bookings error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};





// verify ticket 

export const verifyTicketCode = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.id;
    const role = req.user?.role;
    const { ticketCode } = req.body;

    if (role !== "owner") {
      return res.status(403).json({ msg: "Only owners can verify tickets." });
    }

    if (!ticketCode) {
      return res.status(400).json({ msg: "Ticket code is required." });
    }

    const booking = await Booking.findOne({ ticketCode }).populate("userId", "name email");

    if (!booking) {
      return res.status(404).json({ msg: "Invalid ticket code." });
    }

    const turf = await Turf.findById(booking.turfId);
    if (!turf) {
      return res.status(404).json({ msg: "Turf not found." });
    }

    if (turf.ownerId.toString() !== ownerId) {
      return res.status(403).json({ msg: "You do not own this turf." });
    }

    res.status(200).json({
      msg: "Ticket verified",
      booking: {
        turf: turf.name,
        date: booking.date,
        slot: booking.slot,
        numPlayers: booking.numPlayers,
        user: booking.userId,
        status: booking.status
      }
    });
  } catch (err) {
    console.error("Ticket verification error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// analytics 
// controller/ownerAnalytics.ts
export const getMonthlyBookingAnalytics = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.id;

    // Step 1: Get all turf IDs owned by the user
    const turfs = await Turf.find({ ownerId });
    const turfMap = new Map<string, number>(); // turfId => pricePerSlot
    turfs.forEach(t => turfMap.set(t._id.toString(), t.pricePerSlot));

    const turfIds = turfs.map(t => t._id);

    // Step 2: Aggregate bookings per month
    const bookings = await Booking.aggregate([
      {
        $match: {
          turfId: { $in: turfIds },
          status: "booked"
        }
      },
      {
        $addFields: {
          month: { $substr: ["$date", 0, 7] } // "YYYY-MM"
        }
      },
      {
        $group: {
          _id: "$month",
          bookings: { $push: { turfId: "$turfId" } },
          bookingCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Step 3: Calculate totalEarnings per month using turfMap
    const result = bookings.map(entry => {
      const earnings = entry.bookings.reduce((sum: number, b: any) => {
        const price = turfMap.get(b.turfId.toString()) || 0;
        return sum + price;
      }, 0);

      return {
        month: entry._id,
        bookingCount: entry.bookingCount,
        totalEarnings: earnings
      };
    });

    res.json({ data: result });
  } catch (err) {
    console.error("Monthly analytics error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


//distribution 
// export const getTurfBookingDistribution = async (req: Request, res: Response) => {
//   try {
//     const ownerId = req.user?.id;

//     const turfs = await Turf.find({ ownerId });
//     const turfIds = turfs.map(t => t._id);

//     const bookings = await Booking.aggregate([
//       { $match: { turfId: { $in: turfIds }, status: "booked" } },
//       {
//         $group: {
//           _id: "$turfId",
//           bookingCount: { $sum: 1 }
//         }
//       },
//       {
//         $lookup: {
//           from: "turfs",
//           localField: "_id",
//           foreignField: "_id",
//           as: "turf"
//         }
//       },
//       { $unwind: "$turf" },
//       {
//         $project: {
//           _id: 0,
//           turfName: "$turf.name",
//           bookingCount: 1
//         }
//       }
//     ]);
//     console.log("Aggregated booking data:", bookings)
//     console.log("Owner ID:", ownerId);
// console.log("Turfs found:", turfs);


//     res.json({ data: bookings });

//   } catch (err) {
//     console.error("Distribution error:", err);
//     res.status(500).json({ msg: "Server error" });
//   }
// };

export const getTurfBookingDistribution = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.id;

    const turfs = await Turf.find({ ownerId });

    const results = [];

    for (const turf of turfs) {
      const count = await Booking.countDocuments({
        turfId: turf._id,
        status: "booked",
      });

      results.push({
        turfName: turf.name,
        bookingCount: count,
      });
    }

    // console.log("Distribution Data:", results);
    res.json({ data: results });
  } catch (err) {
    console.error("Distribution error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


