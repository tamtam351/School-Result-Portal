// routes/teacherRoutes.js - COMPLETE IMPLEMENTATION
import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { 
  getTeacherProfile,
  getMySubjects,
  updateTeacherProfile,
  getTeachingStats,
  getMyResults
} from "../controllers/teacherController.js";

const router = express.Router();

// Get teacher profile
router.get(
  "/profile",
  protect,
  authorizeRoles("teacher"),
  getTeacherProfile
);

// Get teacher's assigned subjects
router.get(
  "/my-subjects",
  protect,
  authorizeRoles("teacher"),
  getMySubjects
);

// Update teacher profile
router.put(
  "/profile",
  protect,
  authorizeRoles("teacher"),
  updateTeacherProfile
);

// Get teaching statistics
router.get(
  "/stats",
  protect,
  authorizeRoles("teacher"),
  getTeachingStats
);

// Get teacher's uploaded results
router.get(
  "/my-results",
  protect,
  authorizeRoles("teacher"),
  getMyResults
);

export default router;