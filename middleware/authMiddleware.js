import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// 🔹 Verify token and user
export const protect = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔹 Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        message: "Your account has been banned. Contact administration.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};

// 🔹 Restrict to certain roles
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

// 🔹 Admin or Proprietress only
export const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "proprietress")) {
    next();
  } else {
    return res.status(403).json({ message: "Admin access only" });
  }
};
