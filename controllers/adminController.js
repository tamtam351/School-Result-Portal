import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

// 🔹 Ban a user
export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBanned = true;
    await user.save();

    res.status(200).json({ message: `${user.name} has been banned successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Unban a user
export const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBanned = false;
    await user.save();

    res.status(200).json({ message: `${user.name} has been unbanned successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Delete a user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: `${user.name} has been deleted.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Reset parent password
export const resetParentPassword = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { newPassword } = req.body;

    const parent = await User.findById(parentId);
    if (!parent) return res.status(404).json({ message: "Parent not found" });
    if (parent.role !== "parent")
      return res.status(403).json({ message: "User is not a parent" });

    const salt = await bcrypt.genSalt(10);
    parent.password = await bcrypt.hash(newPassword, salt);
    await parent.save();

    res.status(200).json({ message: "Parent password has been reset successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
