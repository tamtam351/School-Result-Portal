import express from "express";
import {
  banUser,
  unbanUser,
  deleteUser,
  resetParentPassword,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin-only routes
router.put("/ban/:userId", protect, adminOnly, banUser);
router.put("/unban/:userId", protect, adminOnly, unbanUser);
router.delete("/delete/:userId", protect, adminOnly, deleteUser);
router.put("/reset-parent/:parentId", protect, adminOnly, resetParentPassword);

export default router;
