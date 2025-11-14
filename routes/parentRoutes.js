// routes/parentRoutes.js - COMPLETE VERSION
import express from "express";
import { protect, authorizeRoles, adminOnly } from "../middleware/authMiddleware.js";
import { 
  linkChildToParent,
  unlinkChildFromParent,
  getParentChildren,
  getParentProfile,
  updateParentProfile
} from "../controllers/parentController.js";

const router = express.Router();

// Admin links a child to parent
router.post(
  "/link-child",
  protect,
  adminOnly,
  linkChildToParent
);

// Admin unlinks a child from parent
router.delete(
  "/unlink-child",
  protect,
  adminOnly,
  unlinkChildFromParent
);

// Parent views their children
router.get(
  "/my-children",
  protect,
  authorizeRoles("parent"),
  getParentChildren
);

// Parent views own profile
router.get(
  "/profile",
  protect,
  authorizeRoles("parent"),
  getParentProfile
);

// Parent updates profile
router.put(
  "/profile",
  protect,
  authorizeRoles("parent"),
  updateParentProfile
);

export default router;