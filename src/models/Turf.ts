import mongoose, { Schema, Document, Model } from "mongoose";


export interface turfSchemaI{
    ownerId:mongoose.Types.ObjectId,
    name:string,
    location:string,
    openTime:string,
    closeTime:string,
    pricePerSlot:number,
    maxPlayers:number,
    images:string[]
}

const turfSchema:Schema<turfSchemaI> = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  name: {
    type: String,
    required: true
  },

  location: {
    type: String,
    required: true
  },

  openTime: {
    type: String, // e.g., "06:00"
    required: true
  },

  closeTime: {
    type: String, // e.g., "22:00"
    required: true
  },

  pricePerSlot: {
    type: Number,
    required: true
  },

  maxPlayers: {
    type: Number,
    default: 12 // group booking cap
  },

  images: {
    type: [String], // array of image URLs
    default: []
  }

}, { timestamps: true });

const Turf:Model<turfSchemaI> = mongoose.model<turfSchemaI>('Turf', turfSchema);
export default Turf;
