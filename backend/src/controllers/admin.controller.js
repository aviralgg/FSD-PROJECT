import { asyncHandler } from "../utils/asyncHandler.js";
import { Admin } from "../models/admin.model.js";
import { Student } from "../models/student.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
});

const loginAdmin = asyncHandler(async (req, res) => {
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
});

const logoutAdmin = asyncHandler(async (req, res) => {
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
});

const updatePassword = asyncHandler(async (req, res) => {
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
});

const getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find().select("-password -refreshToken");
  if (!admins || admins.length === 0) {
    throw new ApiError(400, "No admins found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, admins, "Admins fetched successfully"));
});

const deleteLoggedInAdmin = asyncHandler(async (req, res) => {
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
});



export {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  updatePassword,
  getAllAdmins,
  deleteLoggedInAdmin,
};
