import express from "express";
import { register, login, logout, verifyOtp, resendOtp } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Register user or owner
router.post("/register", register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

// Login and set JWT cookie
router.post("/login", login);

// Logout by clearing cookie
router.post("/logout",authMiddleware, logout);

export default router;
