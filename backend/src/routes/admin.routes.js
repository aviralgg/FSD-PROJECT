import { Router } from "express";
import {
  addFacultyInfo,
  addStudent,
  addTeachingInfo,
  deleteFaculty,
  deleteLoggedInAdmin,
  deleteStudent,
  getAllAdmins,
  loginAdmin,
  logoutAdmin,
  registerAdmin,
  updatePassword,
} from "../controllers/admin.controller.js";
import { verifyAdmin } from "../middlewares/adminAuth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(registerAdmin);
router.route("/login").post(loginAdmin);
router.route("/logout").post(verifyAdmin, logoutAdmin);
router.route("/update-password").patch(verifyAdmin, updatePassword);
router.route("/getAllAdmins").get(verifyAdmin, getAllAdmins);
router.route("/deleteAdmin").delete(verifyAdmin, deleteLoggedInAdmin);

// Student routes for Admin
router.route("/addStudent").post(verifyAdmin, addStudent);
router.route("/deleteStudent").delete(verifyAdmin, deleteStudent);

router
  .route("/addFacultyInfo")
  .post(verifyAdmin, upload.single("image"), addFacultyInfo);
router.route("/:emp_id/teaches").patch(verifyAdmin, addTeachingInfo);
router.route("/deleteFaculty").delete(verifyAdmin, deleteFaculty);

export default router;
