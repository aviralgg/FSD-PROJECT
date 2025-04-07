import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const studentSchema = new mongoose.Schema(
  {
    admissionNo: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    rollNo: {
      type: String,
      required: true,
      unique: true,
    },
    department: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

studentSchema.methods.generateStudentAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      admissionNo: this.admissionNo,
      rollNo: this.rollNo,
      role: "student",
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

studentSchema.methods.generateStudentRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      role: "student",
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};
export const Student = mongoose.model("Student", studentSchema);
