import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
// Import routes
// import authRoutes from "./routes/authRoutes";
// import turfRoutes from "./routes/turfRoutes";
// import bookingRoutes from "./routes/bookingRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

// API routes
// app.use("/api/auth", authRoutes);
// app.use("/api/turfs", turfRoutes);
// app.use("/api/bookings", bookingRoutes);

// Root route
app.get("/", (_req, res) => {
  res.send("Turf Booking API is running 🚀");
});

// Connect to MongoDB and start server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
