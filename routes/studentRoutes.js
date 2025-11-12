// routes/studentRoutes.js - NEW FILE
import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { 
  getAllStudents,
  getStudentById,
  getStudentsForSubject
} from "../controllers/studentController.js";

const router = express.Router();

// Get all students (with filters)
router.get(
  "/",
  protect,
  authorizeRoles("admin", "proprietress", "teacher"),
  getAllStudents
);

// Get single student
router.get(
  "/:studentId",
  protect,
  getStudentById
);

// Get students for a subject
router.get(
  "/by-subject/:subjectId",
  protect,
  authorizeRoles("teacher", "admin", "proprietress"),
  getStudentsForSubject
);

export default router;