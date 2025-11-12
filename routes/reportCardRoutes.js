// routes/reportCardRoutes.js - NEW FILE
import express from "express";
import { protect, adminOnly, authorizeRoles } from "../middleware/authMiddleware.js";
import { 
  generateReportCard,
  getAllReportCardsForReview,
  approveAndPublishReportCard,
  viewReportCard
} from "../controllers/reportCardController.js";

const router = express.Router();

// Generate report card (admin/proprietress)
router.post(
  "/generate",
  protect,
  authorizeRoles("admin", "proprietress"),
  generateReportCard
);

// Get all report cards for review (proprietress)
router.get(
  "/review",
  protect,
  authorizeRoles("admin", "proprietress"),
  getAllReportCardsForReview
);

// Approve/reject and publish (proprietress only)
router.put(
  "/approve/:reportCardId",
  protect,
  authorizeRoles("admin", "proprietress"),
  approveAndPublishReportCard
);

// View published report card (parent/student)
router.get(
  "/view",
  protect,
  authorizeRoles("student", "parent", "admin", "proprietress"),
  viewReportCard
);

export default router;