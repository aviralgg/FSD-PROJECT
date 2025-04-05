import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    admissionNo: {
      type: String,
      required: true,
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
      enum: [1, 2, 3, 4],
      required: true,
    },
    attempted: {
      type: Number,
      enum: [0, 1],
      default: 0,
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
