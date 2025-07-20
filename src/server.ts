import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import turfRoutes from "./routes/turfRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js"; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

// Middleware


app.use(
  cors({
    origin: "https://reserve-my-turf-client.vercel.app", // frontend origin
    credentials: true,               //  allow cookies/token
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/turfs", turfRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/owner", ownerRoutes); 

// Root route
app.get("/", (_req, res) => {
  res.send("Turf Booking API is running!!!! 🚀");
});

// Connect to MongoDB and start server
mongoose
  .connect(MONGO_URI!)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
