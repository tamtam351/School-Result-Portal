// controllers/studentController.js - NEW FILE
import User from "../models/userModel.js";

// Get all students (with filters)
export const getAllStudents = async (req, res) => {
  try {
    const { classLevel, branch } = req.query;
    
    const query = { role: "student" };
    
    if (classLevel) query.classLevel = classLevel;
    if (branch) query.branch = branch;
    
    const students = await User.find(query)
      .select("name studentId email classLevel branch assignedSubjects currentSession")
      .populate("assignedSubjects", "name code")
      .sort({ classLevel: 1, name: 1 });
    
    res.json({
      success: true,
      count: students.length,
      filters: { classLevel, branch },
      students
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching students", 
      error: error.message 
    });
  }
};

// Get single student details
export const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await User.findById(studentId)
      .select("-password")
      .populate("assignedSubjects", "name code branch type")
      .populate("children", "name studentId classLevel");
    
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }
    
    res.json({
      success: true,
      student
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching student", 
      error: error.message 
    });
  }
};

// Get students for a specific subject
export const getStudentsForSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const students = await User.find({
      role: "student",
      assignedSubjects: subjectId
    })
    .select("name studentId classLevel branch email")
    .sort({ classLevel: 1, name: 1 });
    
    res.json({
      success: true,
      count: students.length,
      students
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching students", 
      error: error.message 
    });
  }
};