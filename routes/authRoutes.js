// routes/authRoutes.js - COMPLETE VERSION (CLOSED SYSTEM)
import express from 'express';
import { registerUser, loginUser, refreshToken } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// PUBLIC: Anyone can login
router.post('/login', loginUser);

// PROTECTED: Only admin can create accounts (CLOSED SYSTEM)
router.post('/register', protect, adminOnly, registerUser);

// PROTECTED: Refresh token
router.post('/refresh-token', protect, refreshToken);

export default router;