// routes/resultRoutes.js
import express from "express";
import { protect, authorizeRoles, adminOnly } from "../middleware/authMiddleware.js";

import { 
  uploadResult, 
  getMyStudents,
  getStudentResults,
  getResultsByClassAndSubject,
  deleteResult,
  bulkUploadResults,
  submitForApproval,
  getPendingResults,
  approveResults,
  rejectResults
} from "../controllers/resultController.js";

const router = express.Router();

/* ===============================
   TEACHER ROUTES
================================ */

// Upload single result
router.post(
  "/upload",
  protect,
  authorizeRoles("teacher", "admin", "proprietress"),
  uploadResult
);

// Bulk upload results
router.post(
  "/bulk-upload",
  protect,
  authorizeRoles("teacher", "admin", "proprietress"),
  bulkUploadResults
);

// Submit results for approval
router.post(
  "/submit-for-approval",
  protect,
  authorizeRoles("teacher"),
  submitForApproval
);

// Get students assigned to teacher
router.get(
  "/my-students",
  protect,
  authorizeRoles("teacher", "admin", "proprietress"),
  getMyStudents
);

/* ===============================
   ADMIN ROUTES
================================ */

// Get all pending results
router.get(
  "/pending",
  protect,
  adminOnly,
  getPendingResults
);

// Approve results
router.post(
  "/approve",
  protect,
  adminOnly,
  approveResults
);

// Reject results
router.post(
  "/reject",
  protect,
  adminOnly,
  rejectResults
);

/* ===============================
   GENERAL ROUTES
================================ */

// Student/Parent/Admin/Proprietress view of student results
router.get(
  "/student",
  protect,
  authorizeRoles("student", "parent", "admin", "proprietress"),
  getStudentResults
);

// Get results by class + subject (teacher/admin/proprietress)
router.get(
  "/by-class",
  protect,
  authorizeRoles("teacher", "admin", "proprietress"),
  getResultsByClassAndSubject
);

// Delete a result
router.delete(
  "/:resultId",
  protect,
  authorizeRoles("teacher", "admin", "proprietress"),
  deleteResult
);

export default router;
