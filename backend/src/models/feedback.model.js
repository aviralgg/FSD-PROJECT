import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
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
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        score: {
          type: Number,
          enum: [0, 1, 2, 3, 4, 5],
          default: 0,
          required: true,
        },
      },
    ],
    attempted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Feedback = mongoose.model("Feedback", feedbackSchema);
