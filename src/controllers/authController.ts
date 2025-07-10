
import User from "../models/User.js";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Turf from "../models/Turf.js";



interface AuthRequestBody {
  name?: string;
  email: string;
  password: string;
  role?: 'user' | 'owner';
}
// REGISTER
export const register = async (req: Request<{}, {}, AuthRequestBody>, res:Response) => {
  try {
    const { name, email, password, role } = req.body;

    // check existing user
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "Email already registered" });

    
    

    const user = new User({
      name,
      email,
      password,
      role // 'user' or 'owner'
    });

    await user.save();

    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// LOGIN
export const login = async (req: Request<{}, {}, AuthRequestBody>, res:Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid email or password" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string, {
      expiresIn: '7d'
    });

    res
  .cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only send over HTTPS in production
    sameSite: "lax", // or "strict" depending on CSRF risk
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })
  .json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};


export const logout = (req: Request, res: Response) => {
  res.clearCookie("token").json({ msg: "Logged out successfully" });
};



// controllers/turf.controller.ts

export const createTurf = async (req: Request, res: Response) => {
  try {
    const { name, location, images, description, maxPlayers } = req.body;

    const turf = new Turf({
      name,
      location,
      images,
      description,
      maxPlayers,
      createdBy: req.user!.id,
    });

    await turf.save();
    res.status(201).json({ msg: "Turf created", turf });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
