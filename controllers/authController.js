// controllers/authController.js - WITH DEBUG LOGGING
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Get token expiration based on role
const getTokenExpiration = (role) => {
  switch (role) {
    case 'student':
    case 'parent':
      return '90d';  // 3 months - occasional access
    
    case 'teacher':
      return '180d'; // 6 months - frequent access during term
    
    case 'admin':
    case 'proprietress':
      return '365d'; // 1 year - system administrators
    
    default:
      return '30d';  // Fallback: 30 days
  }
};

// REGISTER new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, classLevel, branch, currentSession } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Build user data object
    const userData = { 
      name, 
      email, 
      password, 
      role 
    };

    // Only add student-specific fields if role is student
    if (role === "student") {
      if (classLevel) userData.classLevel = classLevel;
      if (branch) userData.branch = branch;
      if (currentSession) userData.currentSession = currentSession;
    }

    // Create user
    const user = new User(userData);
    await user.save();

    // Format response - only include relevant fields based on role
    const response = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Add student-specific fields to response only if student
    if (user.role === "student") {
      response.studentId = user.studentId;
      response.classLevel = user.classLevel;
      response.branch = user.branch;
      response.currentSession = user.currentSession;
    }

    // Add parent-specific fields
    if (user.role === "parent") {
      response.children = user.children;
    }

    res.status(201).json({ 
      message: 'User registered successfully', 
      user: response 
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Error registering user', 
      error: error.message 
    });
  }
};

// LOGIN user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email, password });

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ message: "User not found" });
    }

    console.log('✅ User found:', user.email);
    console.log('🔑 Stored password hash:', user.password.substring(0, 30) + '...');

    // Check if user is banned
    if (user.isBanned) {
      console.log('❌ User is banned');
      return res.status(403).json({ 
        message: "Your account has been banned. Please contact administration." 
      });
    }

    // Compare passwords
    console.log('🔍 Comparing passwords...');
    console.log('🔍 Entered password:', password);
    console.log('🔍 Has matchPassword method:', typeof user.matchPassword);
    
    const isMatch = await user.matchPassword(password);
    console.log('🔍 Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Password does not match');
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log('✅ Login successful!');

    // Create JWT token with role-based expiration
    const tokenExpiration = getTokenExpiration(user.role);
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiration }
    );

    // Format user data for response (exclude password)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Add role-specific fields
    if (user.role === "student") {
      userData.studentId = user.studentId;
      userData.classLevel = user.classLevel;
      userData.branch = user.branch;
    }

    if (user.role === "parent") {
      userData.children = user.children;
    }

    // Send success response
    res.status(200).json({
      message: "Login successful",
      token,
      tokenExpiration,
      role: user.role,
      name: user.name,
      email: user.email,
      user: userData
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ 
      message: "Server error during login", 
      error: error.message 
    });
  }
};

// REFRESH TOKEN (Optional but recommended)
export const refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Account banned" });
    }

    // Generate new token
    const tokenExpiration = getTokenExpiration(user.role);
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiration }
    );

    res.json({
      success: true,
      token,
      tokenExpiration,
      message: "Token refreshed successfully"
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Error refreshing token", 
      error: error.message 
    });
  }
};