// import {v2 as cloudinary} from "cloudinary";
// import dotenv from "dotenv";
// dotenv.config();

// cloudinary.config({
//     cloud_name:process.env.CLOUD_NAME,
//     api_key:process.env.API_KEY,
//     api_secret:process.env.API_SECRET
// });
// export default cloudinary;

// utils/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadToCloudinary = async (buffer: Buffer, folder: string) => {
  return await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder }, (err, result) => {
        if (err || !result) return reject(err);
        resolve(result.secure_url);
      })
      .end(buffer);
  });
};
