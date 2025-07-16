import express from "express";
import { getAllOwnerBookings, getMonthlyBookingAnalytics, getTurfBookingDistribution, getTurfBookings, verifyTicketCode } from "../controllers/ownerController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/turf/:id/bookings", authMiddleware, getTurfBookings);
router.get("/bookings", authMiddleware, getAllOwnerBookings);


router.post("/verify-ticket", authMiddleware, verifyTicketCode);
router.get("/analytics/monthly", authMiddleware, getMonthlyBookingAnalytics);
router.get("/analytics/distribution", authMiddleware, getTurfBookingDistribution );

export default router;
