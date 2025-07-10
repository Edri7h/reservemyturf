// controllers/turf.controller.ts
import { Request, Response } from "express";
import Turf from "../models/Turf.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

export const createTurf = async (req: Request, res: Response) => {

     if (req.user?.role !== "owner") {
      return res.status(403).json({ msg: "Only owners can create turfs" });
    }
  try {
    const {
      name,
      location,
      openTime,
      closeTime,
      pricePerSlot,
      maxPlayers,
    } = req.body;

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ msg: "At least one image is required" });
    }

    // Upload all images to Cloudinary
    const imageUploadPromises = files.map(file =>
      uploadToCloudinary(file.buffer, "turfs")
    );
    const imageUrls = await Promise.all(imageUploadPromises);

    const turf = new Turf({
      ownerId: req.user!.id, // ✅ renamed from createdBy to ownerId
      name,
      location,
      openTime,
      closeTime,
      pricePerSlot,
      maxPlayers: Number(maxPlayers), // ensure number
      images: imageUrls,
    });

    await turf.save();

    res.status(201).json({ msg: "Turf created successfully", turf });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};


// get all turfs 
// controllers/turf.controller.ts
export const getAllTurfs = async (req: Request, res: Response) => {
  try {
    const turfs = await Turf.find()
      .sort({ createdAt: -1 }) // recent first
      .populate("ownerId", "name email"); // optional: return owner name/email

    res.status(200).json(turfs);
  } catch (error) {
    console.error("Error fetching turfs:", error);
    res.status(500).json({ msg: "Server error while fetching turfs" });
  }
};


//get single turf 

// controllers/turf.controller.ts


export const getTurfById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const turf = await Turf.findById(id).populate("ownerId", "name email");

    if (!turf) {
      return res.status(404).json({ msg: "Turf not found" });
    }

    res.json(turf);
  } catch (error) {
    console.error("Error fetching turf:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

