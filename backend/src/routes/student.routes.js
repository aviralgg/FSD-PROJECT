import { Router } from "express";
import { studentLogin, studentLogout } from "../controllers/student.controller.js";
import { verifyStudent } from "../middlewares/studentAuth.middleware.js";

const router = Router();

router.route("/studentLogin").post(studentLogin);
router.route("/studentLogout").post(verifyStudent, studentLogout);

export default router;