// routes/resultRoutes.js - REPLACE EXISTING
import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { uploadResult, getMyStudents } from "../controllers/resultController.js";

const router = express.Router();

// Teacher uploads result
router.post(
  "/upload", 
  protect, 
  authorizeRoles("teacher", "admin", "proprietress"), 
  uploadResult
);

// Get students for a subject (for upload form)
router.get(
  "/my-students", 
  protect, 
  authorizeRoles("teacher", "admin", "proprietress"), 
  getMyStudents
);

export default router;