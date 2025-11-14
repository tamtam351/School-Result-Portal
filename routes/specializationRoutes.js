// routes/specializationRoutes.js - NEW FILE
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { 
  createSpecialization,
  getAllSpecializations,
  updateSpecialization,
  deleteSpecialization
} from "../controllers/specializationController.js";

const router = express.Router();

// Create specialization (admin only)
router.post("/create", protect, adminOnly, createSpecialization);

// Get all specializations
router.get("/", protect, getAllSpecializations);

// Update specialization (admin only)
router.put("/:id", protect, adminOnly, updateSpecialization);

// Delete specialization (admin only)
router.delete("/:id", protect, adminOnly, deleteSpecialization);

export default router;