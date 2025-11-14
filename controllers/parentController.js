// controllers/parentController.js - NEW FILE
import User from "../models/userModel.js";

// Link a child to parent (Admin only)
export const linkChildToParent = async (req, res) => {
  try {
    const { parentId, studentId } = req.body;

    if (!parentId || !studentId) {
      return res.status(400).json({ 
        message: "parentId and studentId are required" 
      });
    }

    // Find parent
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== "parent") {
      return res.status(404).json({ message: "Parent not found" });
    }

    // Find student
    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if already linked
    if (parent.children.includes(studentId)) {
      return res.status(400).json({ 
        message: "Student is already linked to this parent" 
      });
    }

    // Add student to parent's children
    parent.children.push(studentId);
    await parent.save();

    await parent.populate("children", "name studentId classLevel branch");

    res.json({
      success: true,
      message: `${student.name} linked to ${parent.name}`,
      parent: {
        _id: parent._id,
        name: parent.name,
        email: parent.email,
        children: parent.children
      }
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Error linking child to parent", 
      error: error.message 
    });
  }
};

// Unlink a child from parent (Admin only)
export const unlinkChildFromParent = async (req, res) => {
  try {
    const { parentId, studentId } = req.body;

    const parent = await User.findById(parentId);
    if (!parent || parent.role !== "parent") {
      return res.status(404).json({ message: "Parent not found" });
    }

    // Remove student from children array
    parent.children = parent.children.filter(
      child => child.toString() !== studentId
    );
    await parent.save();

    await parent.populate("children", "name studentId classLevel branch");

    res.json({
      success: true,
      message: "Child unlinked successfully",
      parent: {
        _id: parent._id,
        name: parent.name,
        email: parent.email,
        children: parent.children
      }
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Error unlinking child", 
      error: error.message 
    });
  }
};

// Get parent's children with details
export const getParentChildren = async (req, res) => {
  try {
    const parent = await User.findById(req.user._id)
      .populate({
        path: "children",
        select: "name studentId classLevel branch email assignedSubjects currentSession",
        populate: {
          path: "assignedSubjects",
          select: "name code"
        }
      });

    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    res.json({
      success: true,
      count: parent.children.length,
      children: parent.children
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching children", 
      error: error.message 
    });
  }
};

// Get parent profile
export const getParentProfile = async (req, res) => {
  try {
    const parent = await User.findById(req.user._id)
      .select("-password")
      .populate("children", "name studentId classLevel branch");

    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    res.json({
      success: true,
      parent
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching profile", 
      error: error.message 
    });
  }
};

// Update parent profile (limited fields)
export const updateParentProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const parent = await User.findById(req.user._id);
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    // Update allowed fields
    if (name) parent.name = name;
    if (email && email !== parent.email) {
      // Check if email already exists
      const emailExists = await User.findOne({ 
        email, 
        _id: { $ne: parent._id } 
      });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      parent.email = email;
    }

    await parent.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      parent: {
        _id: parent._id,
        name: parent.name,
        email: parent.email,
        role: parent.role
      }
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Error updating profile", 
      error: error.message 
    });
  }
};