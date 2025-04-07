import mongoose from "mongoose";

const facultySchema = new mongoose.Schema(
  {
    emp_id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    teaches: {
      type: [
        {
          year: {
            type: Number,
            required: true,
          },
          department: {
            type: String,
            required: true,
          },
          section: {
            type: String,
            required: true,
          },
          subject: {
            type: String,
            required: true,
          },
          subjectCode: {
            type: String,
            required: true,
          },
          semester: {
            type: Number,
            required: true,
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Faculty = mongoose.model("Faculty", facultySchema);
