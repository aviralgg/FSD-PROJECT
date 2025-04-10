import { Router } from "express";
import {
  studentLogin,
  studentLogout,
  getYourFaculty,
  openFeedback,
  submitFeedback,
} from "../controllers/student.controller.js";
import { verifyStudent } from "../middlewares/studentAuth.middleware.js";

const router = Router();

router.route("/studentLogin").post(studentLogin);
router.route("/studentLogout").post(verifyStudent, studentLogout);

router.route("/getYourFaculty").get(verifyStudent, getYourFaculty);
router.route("/openFeedback/:id").get(verifyStudent, openFeedback);
router.route("/submitFeedback/:id").post(verifyStudent, submitFeedback);

export default router;
