// routes/studentRoutes.js
// ✅ FIX: Specific routes MUST come before parameterized routes.
// Previously /by-subject/:subjectId was placed after /:studentId,
// so Express treated "by-subject" as the studentId value — wrong handler fired.

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

// ✅ FIX: This MUST come before /:studentId — it's a specific path, not a param
// Get students for a subject
router.get(
  "/by-subject/:subjectId",
  protect,
  authorizeRoles("teacher", "admin", "proprietress"),
  getStudentsForSubject
);

// Get single student — keep this LAST among GET routes with a param segment
router.get(
  "/:studentId",
  protect,
  getStudentById
);

export default router;