import mongoose, { Schema, Document, Model } from "mongoose";


export interface turfSchemaI{
    ownerId:mongoose.Types.ObjectId,
    name:string,
    location:string,
    openTime:string,
    closeTime:string,
    pricePerSlot:number,
    maxPlayers:number,
    images:string[],
    averageRating:number,
    numReviews:number,
    isActive?:boolean,
    googleMapLink?:string
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
  type: String,
  default: "06:00"
},
  isActive: {
  type: Boolean,
  default: true,
},
  closeTime: {
  type: String,
  default: "22:00"
},
  googleMapLink: {
  type: String,
  required: false, // or `true` if you want to enforce it
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
  },
  averageRating: {
  type: Number,
  default: 0
},
numReviews: {
  type: Number,
  default: 0
}


}, { timestamps: true });

const Turf:Model<turfSchemaI> = mongoose.model<turfSchemaI>('Turf', turfSchema);
export default Turf;
