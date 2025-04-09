import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";

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
});

const studentLogout = asyncHandler(async (req, res) => {
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
});

export { studentLogin, studentLogout };
