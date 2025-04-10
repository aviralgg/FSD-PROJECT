import multer from "multer";
import dotenv from "dotenv";


// copy from multer git repo Readme file and modify it
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);  // cb means callback
  },
});

export const upload = multer({
    storage, 
});
