// write middleware for authenticating user
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"; 
import User from "../models/User.js";




declare module "express" {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
  }
}


type decodedToken = {
    id: string;
    role: string;
}
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  console.log("👉 COOKIES IN REQUEST:", req.cookies);
  try {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ msg: "Login to Continue" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as decodedToken;
    
    // Attach user info to request object
    req.user ={
        id:decoded.id,
        role: decoded.role
    }
    
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ msg: "Invalid token" });
  }
};