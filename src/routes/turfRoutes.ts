import express from "express";
import { createTurf, getAllTurfs, getTurfById } from "../controllers/turfController.js";
import { authMiddleware } from "../middleware/auth.js";
import { multipleUpload } from "../middleware/multer.js"; // ← handles multiple image uploads

const router = express.Router();


// ✅ Public route – Anyone (user or not) can view all turfs
router.get("/", getAllTurfs);
router.get("/:id", getTurfById);
// ✅ Protected route – Only owners can create turfs
router.post(
  "/create",
  authMiddleware,
  multipleUpload,
  createTurf
);


export default router;
