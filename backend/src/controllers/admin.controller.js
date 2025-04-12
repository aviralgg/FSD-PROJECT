import { asyncHandler } from "../utils/asyncHandler.js";
import { Admin } from "../models/admin.model.js";
import { Faculty } from "../models/faculty.model.js";
import { Student } from "../models/student.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { Feedback } from "../models/feedback.model.js";

const deleteImages = async (imageUrl) => {
  try {
    const res = await deleteFromCloudinary(imageUrl);
    if (!res) {
      throw new ApiError(400, "error in deletion function");
    }
  } catch (error) {
    throw new ApiError(400, "Error while deleting images from cloudinary");
  }
};

const generateAccessAndRefreshTokens = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId);
    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();
    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Refresh and Access Token"
    );
  }
};

const registerAdmin = asyncHandler(async (req, res) => {
  try {
    const { secretCode, username, password } = req.body;
    if (secretCode !== process.env.ADMIN_REGISTRATION_SECRET) {
      throw new ApiError(403, "Invalid Authorization");
    }
    if (!username || !password) {
      throw new ApiError(400, "Please provide username and password");
    }
    const existedAdmin = await Admin.findOne({ username });
    if (existedAdmin) {
      throw new ApiError(400, "Admin with same username already exists");
    }
    const admin = await Admin.create({
      username,
      password,
    });
    const createdAdmin = await Admin.findById(admin._id).select("-password");
    if (!createdAdmin) {
      throw new ApiError(400, "Admin not created");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, createdAdmin, "Admin created successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while creating admin"
    );
  }
});

const loginAdmin = asyncHandler(async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ApiError(400, "Please provide username and password");
    }
    const admin = await Admin.findOne({ username });
    if (!admin) {
      throw new ApiError(400, "Admin not found");
    }
    const isPasswordValid = await admin.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(400, "Invalid password");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      admin._id
    );
    const loggedInAdmin = await Admin.findById(admin._id).select(
      "-password -refreshToken"
    );
    const options = {
      //prevents modification from client side
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { admin: loggedInAdmin, accessToken, refreshToken },
          "Admin logged In successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while logging admin in"
    );
  }
});

const logoutAdmin = asyncHandler(async (req, res) => {
  try {
    await Admin.findByIdAndUpdate(
      req.admin._id,
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
      .json(new ApiResponse(200, {}, "Admin logged Out"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while logging out"
    );
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "Please provide current and new password");
    }
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      throw new ApiError(400, "Admin not found");
    }
    const isPasswordValid = await admin.isPasswordCorrect(currentPassword);
    if (!isPasswordValid) {
      throw new ApiError(400, "Invalid current password");
    }
    admin.password = newPassword;
    await admin.save({ validateBeforeSave: false });
    const updatedAdmin = await Admin.findById(admin._id).select("-password");
    if (!updatedAdmin) {
      throw new ApiError(400, "Admin not updated");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Admin password updated successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while updating password"
    );
  }
});

const getAllAdmins = asyncHandler(async (req, res) => {
  try {
    const admins = await Admin.find().select("-password -refreshToken");
    if (!admins || admins.length === 0) {
      throw new ApiError(400, "No admins found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, admins, "Admins fetched successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while fetching admins"
    );
  }
});

const deleteLoggedInAdmin = asyncHandler(async (req, res) => {
  try {
    const adminId = req.admin._id;
    const deletedAdmin = await Admin.findByIdAndDelete(adminId);
    if (!deletedAdmin) {
      throw new ApiError(400, "Admin not deleted");
    }
    return res
      .status(200)
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .json(new ApiResponse(200, {}, "Admin deleted successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while deleting admin"
    );
  }
});

const addStudent = asyncHandler(async (req, res) => {
  try {
    const { admissionNo, rollNo, department, section, year, semester } =
      req.body;
    if (
      !admissionNo ||
      !rollNo ||
      !department ||
      !section ||
      !year ||
      !semester
    ) {
      throw new ApiError(400, "All fields are required");
    }
    const existedStudent = await Student.findOne({ admissionNo });
    if (existedStudent) {
      throw new ApiError(
        400,
        "Student with same admission number already exists"
      );
    }
    const student = await Student.create({
      admissionNo,
      rollNo,
      department,
      section,
      year,
      semester,
    });
    const createdStudent = await Student.findById(student._id);
    if (!createdStudent) {
      throw new ApiError(400, "Student not created");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, createdStudent, "Student created successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while creating student"
    );
  }
});

const deleteStudent = asyncHandler(async (req, res) => {
  try {
    const { admissionNo } = req.body;
    if (!admissionNo) {
      throw new ApiError(400, "Admission number is required");
    }
    const admissNo = admissionNo.toLowerCase();
    const student = await Student.findOneAndDelete({
      admissionNo: admissNo,
    });
    if (!student) {
      throw new ApiError(400, "Student not found");
    }
    return res
      .status(200)
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .json(new ApiResponse(200, {}, "Student deleted successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while deleting student"
    );
  }
});

const addFacultyInfo = asyncHandler(async (req, res) => {
  try {
    const { emp_id, name } = req.body;
    if (!emp_id || !name) {
      throw new ApiError(400, "All fields are required");
    }
    const empId = emp_id.toLowerCase();
    const existedFaculty = await Faculty.findOne({ emp_id: empId });
    if (existedFaculty) {
      throw new ApiError(400, "Faculty with same id already exists");
    }

    const imageLocalPath = req.file?.path;
    if (!imageLocalPath) {
      throw new ApiError(400, "Image file is required");
    }

    const image = await uploadOnCloudinary(imageLocalPath);
    if (!image) {
      throw new ApiError(400, "Image upload failed");
    }

    const faculty = await Faculty.create({
      emp_id: empId,
      name,
      image: image.url,
    });
    const createdFaculty = await Faculty.findById(faculty._id);
    if (!createdFaculty) {
      throw new ApiError(400, "Faculty not created");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, createdFaculty, "Faculty created successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while creating faculty"
    );
  }
});

const addTeachingInfo = asyncHandler(async (req, res) => {
  try {
    const { emp_id } = req.params;
    const newTeach = req.body.teaches;
    if (!emp_id) {
      throw new ApiError(400, "Employee id is required");
    }
    if (
      !newTeach ||
      typeof newTeach !== "object" ||
      Array.isArray(newTeach) ||
      Object.keys(newTeach).length !== 6
    ) {
      throw new ApiError(400, "Teaching information is required");
    }
    const empId = emp_id.toLowerCase();
    const faculty = await Faculty.findOneAndUpdate(
      { emp_id: empId },
      {
        $push: {
          teaches: newTeach,
        },
      },
      { new: true }
    );
    if (!faculty) {
      throw new ApiError(404, "Faculty not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, faculty, "Faculty teaches array updated"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while adding teaching info"
    );
  }
});

const deleteFaculty = asyncHandler(async (req, res) => {
  try {
    const { emp_id } = req.body;
    if (!emp_id) {
      throw new ApiError(400, "Employee id is required");
    }
    const empId = emp_id.toLowerCase();
    const faculty = await Faculty.findOne({ emp_id: empId });
    if (!faculty) {
      throw new ApiError(404, "Faculty not found");
    }
    await deleteImages(faculty.image);
    const deletedFaculty = await faculty.deleteOne();
    if (!deletedFaculty) {
      throw new ApiError(400, "Faculty not deleted");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Faculty deleted successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while deleting faculty"
    );
  }
});

const setAttemptedZero = asyncHandler(async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ attempted: true });
    if (!feedbacks || feedbacks.length === 0) {
      throw new ApiError(404, "No attempted feedbacks found");
    }
    for (const feedback of feedbacks) {
      feedback.attempted = false;
      feedback.questions = feedback.questions.map((q) => ({
        ...q,
        score: 0,
      }));
      await feedback.save();
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "All attempted Feedbacks set to zero"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message ||
        "Something went wrong while setting all attempted feedbacks to zero"
    );
  }
});

const getAllFaculties = asyncHandler(async (req, res) => {
  try {
    const { department, section, year, semester, subject } = req.query;
    const match = {};
    if (department) match.department = department;
    if (section) match.section = section;
    if (year) match.year = year;
    if (semester) match.semester = semester;
    if (subject) match.subject = subject;

    const filter = {};

    if (Object.keys(match).length > 0) {
      filter.teaches = { $elemMatch: match };
    }
    const faculties = await Faculty.find(filter);
    if (!faculties || faculties.length === 0) {
      throw new ApiError(404, "No faculties found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, faculties, "Faculties fetched successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while fetching faculties"
    );
  }
});

export {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  updatePassword,
  getAllAdmins,
  deleteLoggedInAdmin,
  addStudent,
  deleteStudent,
  addFacultyInfo,
  addTeachingInfo,
  deleteFaculty,
  setAttemptedZero,
  getAllFaculties,
};
