// routes/subjectRoutes.js - NEW FILE
import express from "express";
import { protect, adminOnly, authorizeRoles } from "../middleware/authMiddleware.js";
import { 
  createSubject,
  getAllSubjects,
  assignTeacherToSubject,
  assignSubjectsToStudent,
  getAvailableSubjects
} from "../controllers/subjectController.js";

const router = express.Router();

// Create subject (admin only)
router.post("/create", protect, adminOnly, createSubject);

// Get all subjects
router.get("/", protect, getAllSubjects);

// Get available subjects for a class/branch
router.get("/available", protect, getAvailableSubjects);

// Assign teacher to subject (admin only)
router.post(
  "/assign-teacher/:subjectId", 
  protect, 
  adminOnly, 
  assignTeacherToSubject
);

// Assign subjects to student (admin only)
router.post(
  "/assign-to-student/:studentId", 
  protect, 
  adminOnly, 
  assignSubjectsToStudent
);

export default router;