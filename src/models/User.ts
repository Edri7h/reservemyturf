// const mongoose = require('mongoose');
import mongoose, {Document, Model,Schema}  from "mongoose";
import bcrypt from "bcrypt";

export  interface UserI extends Document{
    name:string,
    email:string,
    password:string,
    role:'user' | 'owner'
}


const userSchema:Schema<UserI>= new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['user', 'owner'],
    default: 'user'
  }

}, { timestamps: true });

const User:Model<UserI> = mongoose.model<UserI>('User', userSchema);
export default User;




userSchema.pre<UserI>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    return next(error as Error);
  }
});