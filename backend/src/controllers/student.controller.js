import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Feedback } from "../models/feedback.model.js";
import { Student } from "../models/student.model.js";
import { Faculty } from "../models/faculty.model.js";

const generateAccessAndRefreshTokens = async (studentId) => {
  try {
    const student = await Student.findById(studentId);
    const accessToken = student.generateStudentAccessToken();
    const refreshToken = student.generateStudentRefreshToken();
    student.refreshToken = refreshToken;
    await student.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Refresh and Access Token for Student"
    );
  }
};

const studentLogin = asyncHandler(async (req, res) => {
  try {
    const { admissionNo, rollNo } = req.body;
    if (!admissionNo || !rollNo) {
      throw new ApiError(400, "All fields are required");
    }
    const admissNo = admissionNo.toLowerCase();
    const student = await Student.findOne({ admissionNo: admissNo });
    if (!student) {
      throw new ApiError(404, "Student not found");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      student._id
    );
    const loggedInStudent = await Student.findById(student._id).select(
      "-refreshToken"
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, loggedInStudent, "Student login successful"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server error");
  }
});

const studentLogout = asyncHandler(async (req, res) => {
  try {
    await Student.findByIdAndUpdate(
      req.student._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "Student logout successful"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server error");
  }
});

const getYourFaculty = asyncHandler(async (req, res) => {
  try {
    const studentId = req.student._id;
    const student = await Student.findById(studentId);
    if (!student) {
      throw new ApiError(404, "Student not found");
    }
    const matchedFaculties = await Faculty.find({
      teaches: {
        $elemMatch: {
          year: student.year,
          semester: student.semester,
          department: student.department,
          section: student.section,
        },
      },
    });
    if (matchedFaculties.length === 0) {
      throw new ApiError(404, "No faculty found");
    }

    const existingFeedbacks = await Feedback.find({
      student: studentId,
    });
    const existingMap = new Set(
      existingFeedbacks.map(
        (fb) => `${fb.faculty.toString()}-${fb.subjectCode}`
      )
    );
    const feedbacksToInsert = [];

    for (const faculty of matchedFaculties) {
      for (const teach of faculty.teaches) {
        const isMatch =
          teach.year === student.year &&
          teach.semester === student.semester &&
          teach.department === student.department &&
          teach.section === student.section;

        if (isMatch) {
          const uniqueKey = `${faculty._id.toString()}-${teach.subjectCode}`;
          if (!existingMap.has(uniqueKey)) {
            feedbacksToInsert.push({
              faculty: faculty._id,
              student: student._id,
              subject: teach.subject,
              subjectCode: teach.subjectCode,
              questions: [
                { question: "How was the teaching?", score: 0 },
                { question: "How was the communication?", score: 0 },
                { question: "How was the punctuality?", score: 0 },
              ],
              attempted: false,
            });
            existingMap.add(uniqueKey); // Avoid duplicate insertion
          }
        }
      }
    }

    const savedFeedbacks = await Feedback.insertMany(feedbacksToInsert);
    const allFeedbacks = await Feedback.find({ student: studentId });
    if (!allFeedbacks || allFeedbacks.length === 0) {
      throw new ApiError(404, "No feedback found");
    }
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          allFeedbacks,
          "Feedback rows created successfully for all matched subjects"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server error");
  }
});

const openFeedback = asyncHandler(async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      throw new ApiError(404, "Feedback not found");
    }
    if (feedback.attempted) {
      throw new ApiError(400, "Feedback already attempted");
    }
    res
      .status(200)
      .json(new ApiResponse(200, feedback, "Feedback found successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server error");
  }
});

const submitFeedback = asyncHandler(async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const { questions } = req.body;
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      throw new ApiError(404, "Feedback not found");
    }
    if (feedback.attempted) {
      throw new ApiError(400, "Feedback already submitted");
    }
    if (
      !Array.isArray(questions) ||
      questions.length !== feedback.questions.length ||
      questions.some(
        (q) =>
          typeof q.score !== "number" ||
          q.score < 1 ||
          q.score > 5 ||
          typeof q.question !== "string"
      )
    ) {
      throw new ApiError(
        400,
        "Please provide valid scores (1-5) for all questions"
      );
    }
    feedback.questions = questions;
    feedback.attempted = true;
    await feedback.save();
    res
      .status(200)
      .json(new ApiResponse(200, feedback, "Feedback submitted successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server error");
  }
});

export {
  studentLogin,
  studentLogout,
  getYourFaculty,
  openFeedback,
  submitFeedback,
};
