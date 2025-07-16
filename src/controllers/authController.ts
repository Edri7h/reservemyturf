
import User from "../models/User.js";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Turf from "../models/Turf.js";
import { Otp } from "../models/Otp.js";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();


interface AuthRequestBody {
  name?: string;
  email: string;
  password: string;
  role?: 'user' | 'owner';
}
// REGISTER
// export const register = async (req: Request<{}, {}, AuthRequestBody>, res:Response) => {
//   try {
//     const { name, email, password, role } = req.body;

//     // check existing user
//     const existing = await User.findOne({ email });
//     if (existing) return res.status(400).json({ msg: "Email already registered" });




//     const user = new User({
//       name,
//       email,
//       password,
//       role // 'user' or 'owner'
//     });

//     await user.save();

//     res.status(201).json({ msg: "User registered successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Server error" });
//   }
// };


const resendAdmin = new Resend(process.env.RESEND_API_KEY!);
const resendUser = new Resend(process.env.RESEND_API_KEYY!);
// REGISTER with OTP flow


export const register = async (
  req: Request<{}, {}, AuthRequestBody>,
  res: Response
) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    // Save unverified user
    const newUser = await User.create({
      name,
      email,
      password, // ensure password hashing is handled in User schema pre-save hook
      role,
      isVerified: false,
    });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to DB
    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins from now
    });

    // Send OTP via email using Resend
    if (role === "owner") {
      await resendAdmin.emails.send({
        from: "MyApp <noreply@resend.dev>",
        to: email,
        subject: "Verify Your Account",
        html: `
        <p>Hi ${name},</p>
        <p>Your verification code is <strong>${otp}</strong>. It will expire in 10 minutes.</p>
        <p>Do not share this code with anyone.</p>
      `,
      });
    }
    if (role === 'user') {
      console.log("kkkkk")
      await resendUser.emails.send({
        from: "MyApp <noreply@resend.dev>",
        to: email,
        subject: "Verify Your Account",
        html: `
        <p>Hi ${name},</p>
        <p>Your verification Code is <strong>${otp}</strong>. It will expire in 10 minutes.</p>
        <p>Do not share this code with anyone.</p>
      `,
      });
    }

    return res.status(201).json({ msg: "User registered. OTP sent to email." });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ msg: "Server error" });
  }

};


// LOGIN
export const login = async (req: Request<{}, {}, AuthRequestBody>, res: Response) => {
  try {
    const { email, password } = req.body;
    // console.log("LOGIN PAYLOAD:", req.body);


    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid email or password" });

    const token = jwt.sign({ id: user._id, role: user.role,email:user.email }, process.env.JWT_SECRET as string, {
      expiresIn: '7d'
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: true, // only send over HTTPS in production
        sameSite: "none", // or "strict" depending on CSRF risk
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      })
      .status(200)
      .json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token
        }
      });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};


//verify->otp
export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  try {
    const otpDoc = await Otp.findOne({ email, otp });

    if (!otpDoc) return res.status(400).json({ msg: 'Invalid OTP' });

    if (otpDoc.expiresAt < new Date()) {
      await Otp.deleteMany({ email }); // clean expired
      return res.status(400).json({ msg: 'OTP expired' });
    }

    // Mark user verified
    await User.updateOne({ email }, { isVerified: true });

    // Delete all OTPs for this email
    await Otp.deleteMany({ email });

    res.status(200).json({ msg: 'Email verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Something went wrong' });
  }
};


//resend ->otp
export const resendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: 'User not found' });
  if (user.isVerified) return res.status(400).json({ msg: 'Already verified' });

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await Otp.deleteMany({ email }); // cleanup old

  await Otp.create({
    email,
    otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  if(user.role==='owner'){
    await resendAdmin.emails.send({
    from: 'MyApp <noreply@resend.dev>',
    to: email,
    subject: 'Verification Code',
    html: `<p>Verification code is <strong>${otp}</strong>.</p>`
  });
}
 if(user.role==='user') 
  { console.log("kkkk")
    await resendUser.emails.send({
    from: "MyApp <noreply@resend.dev>",
    to: email,
   subject: 'Verification Code',
    html: `<p>Verification code is <strong>${otp}</strong>.</p>`,
  });
}

  res.status(200).json({ msg: 'OTP resent' });
};



export const logout = (req: Request, res: Response) => {
  res.clearCookie("token").json({ msg: "Logged out successfully" });
};



export const resetPassword=async(req:Request,res:Response)=>{
    const {password , confirmPassword,email} =req.body;
    if([password,confirmPassword].some(field=>field.trim()==='')){
      return res.status(400).json({msg:"Invalid details"});

    }

    if(password!==confirmPassword){
       return res.status(400).json({msg:"Invalid details"});
    }


}