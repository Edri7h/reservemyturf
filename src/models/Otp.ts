// models/Otp.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface OtpI extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
}

const otpSchema = new Schema<OtpI>({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true }
});

export const Otp = mongoose.model<OtpI>('Otp', otpSchema);
