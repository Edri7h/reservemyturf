import mongoose, { Schema, Document, Model } from "mongoose";

// Interface for Booking Document
export interface BookingI extends Document {
  turfId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: string; 
  slot: string; 
  numPlayers: number;
  ticketCode: string;
  status: 'booked' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

// Booking schema definition
const bookingSchema: Schema<BookingI> = new Schema(
  {
    turfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Turf',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    slot: {
      type: String,
      required: true,
    },
    numPlayers: {
      type: Number,
      required: true,
    },
    ticketCode: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['booked', 'cancelled'],
      default: 'booked',
    },
  },
  { timestamps: true }
);

// Export Booking model
const Booking: Model<BookingI> = mongoose.model<BookingI>('Booking', bookingSchema);
export default Booking;
