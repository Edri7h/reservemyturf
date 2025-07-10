// // middleware/multer.ts
import multer from "multer";

// const storage = multer.memoryStorage(); // Buffer files for Cloudinary
// export const upload = multer({ storage });


// middleware/multer.ts
const storage = multer.memoryStorage();

export const singleUpload = multer({ storage }).single("file");
export const multipleUpload = multer({ storage }).array("images", 5);
