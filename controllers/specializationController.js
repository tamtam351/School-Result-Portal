// controllers/specializationController.js
import TeacherSpecialization from "../models/teacherSpecializationModel.js";
import User from "../models/userModel.js";

// Create a new specialization
export const createSpecialization = async (req, res) => {
  try {
    const { name, category, description } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: "name and category are required" });
    }

    const specialization = await TeacherSpecialization.create({ name, category, description });

    res.status(201).json({
      success: true,
      message: "Specialization created successfully",
      specialization
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Specialization already exists" });
    }
    res.status(500).json({ message: "Error creating specialization", error: error.message });
  }
};

// Get all specializations
export const getAllSpecializations = async (req, res) => {
  try {
    const { category, isActive } = req.query;

    const query = {};
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const specializations = await TeacherSpecialization.find(query)
      .sort({ category: 1, name: 1 })
      .lean(); // ✅ use .lean() for plain JS objects — faster and read-only safe

    // ✅ FIX: Count teachers in a SINGLE aggregated query instead of N individual
    // queries + saves inside a loop. The old code did spec.save() inside a GET
    // handler — mutating data on every read, causing unnecessary DB writes and
    // potential race conditions.
    const teacherCounts = await User.aggregate([
      { $match: { role: "teacher", teacherSpecialization: { $exists: true, $ne: null } } },
      { $group: { _id: "$teacherSpecialization", count: { $sum: 1 } } }
    ]);

    const countMap = {};
    for (const entry of teacherCounts) {
      countMap[entry._id.toString()] = entry.count;
    }

    const result = specializations.map(spec => ({
      ...spec,
      teacherCount: countMap[spec._id.toString()] || 0
    }));

    res.json({ success: true, count: result.length, specializations: result });

  } catch (error) {
    res.status(500).json({ message: "Error fetching specializations", error: error.message });
  }
};

// Update specialization
export const updateSpecialization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, isActive } = req.body;

    const specialization = await TeacherSpecialization.findById(id);
    if (!specialization) {
      return res.status(404).json({ message: "Specialization not found" });
    }

    if (name) specialization.name = name;
    if (category) specialization.category = category;
    if (description !== undefined) specialization.description = description;
    if (isActive !== undefined) specialization.isActive = isActive;

    await specialization.save();

    res.json({ success: true, message: "Specialization updated successfully", specialization });

  } catch (error) {
    res.status(500).json({ message: "Error updating specialization", error: error.message });
  }
};

// Delete specialization
export const deleteSpecialization = async (req, res) => {
  try {
    const { id } = req.params;

    const teachersWithSpec = await User.countDocuments({
      role: "teacher",
      teacherSpecialization: id
    });

    if (teachersWithSpec > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${teachersWithSpec} teacher(s) have this specialization`
      });
    }

    const specialization = await TeacherSpecialization.findByIdAndDelete(id);
    if (!specialization) {
      return res.status(404).json({ message: "Specialization not found" });
    }

    res.json({ success: true, message: "Specialization deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Error deleting specialization", error: error.message });
  }
};