// controllers/subjectController.js - NEW FILE
import Subject from "../models/subjectModel.js";
import User from "../models/userModel.js";

// Create a subject (Admin only)
export const createSubject = async (req, res) => {
  try {
    const { name, code, branch, classLevels, type, description } = req.body;
    
    const subject = await Subject.create({
      name,
      code,
      branch,
      classLevels,
      type,
      description
    });
    
    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "Subject code already exists" 
      });
    }
    res.status(500).json({ 
      message: "Error creating subject", 
      error: error.message 
    });
  }
};

// Get all subjects
export const getAllSubjects = async (req, res) => {
  try {
    const { branch, classLevel } = req.query;
    
    const query = { isActive: true };
    
    if (branch) {
      query.$or = [
        { branch: branch },
        { branch: "all" }
      ];
    }
    
    if (classLevel) {
      query.classLevels = classLevel;
    }
    
    const subjects = await Subject.find(query)
      .populate("teachers", "name email")
      .sort({ name: 1 });
    
    res.json({
      success: true,
      count: subjects.length,
      subjects
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching subjects", 
      error: error.message 
    });
  }
};

// Assign teacher to subject
export const assignTeacherToSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { teacherId } = req.body;
    
    // Find subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    
    // Find teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ message: "Teacher not found" });
    }
    
    // Add teacher to subject (avoid duplicates)
    if (!subject.teachers.includes(teacherId)) {
      subject.teachers.push(teacherId);
      await subject.save();
    }
    
    // Also add subject to teacher's assignedSubjects
    if (!teacher.assignedSubjects) teacher.assignedSubjects = [];
    if (!teacher.assignedSubjects.includes(subjectId)) {
      teacher.assignedSubjects.push(subjectId);
      await teacher.save();
    }
    
    await subject.populate("teachers", "name email role");
    
    res.json({
      success: true,
      message: `${teacher.name} assigned to ${subject.name}`,
      subject: {
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        teachers: subject.teachers
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: "Error assigning teacher", 
      error: error.message 
    });
  }
};

// Assign subjects to student
export const assignSubjectsToStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subjectIds } = req.body; // Array of subject IDs
    
    // Find student
    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }
    
    // Validate subjects exist
    const subjects = await Subject.find({ _id: { $in: subjectIds } });
    if (subjects.length !== subjectIds.length) {
      return res.status(400).json({ message: "Some subjects not found" });
    }
    
    // Validate subjects are appropriate for student's class/branch
    for (const subject of subjects) {
      // Check if subject is for this class level
      if (!subject.classLevels.includes(student.classLevel)) {
        return res.status(400).json({ 
          message: `${subject.name} is not offered in ${student.classLevel}` 
        });
      }
      
      // Check branch compatibility for SS students
      if (student.classLevel.startsWith("SS") && 
          subject.branch !== "all" && 
          subject.branch !== student.branch) {
        return res.status(400).json({ 
          message: `${subject.name} is for ${subject.branch} branch, but student is in ${student.branch}` 
        });
      }
    }
    
    // Assign subjects
    student.assignedSubjects = subjectIds;
    await student.save();
    
    await student.populate("assignedSubjects", "name code branch type");
    
    res.json({
      success: true,
      message: `${subjects.length} subjects assigned to ${student.name}`,
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        classLevel: student.classLevel,
        branch: student.branch,
        numberOfSubjects: student.assignedSubjects.length,
        assignedSubjects: student.assignedSubjects
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: "Error assigning subjects", 
      error: error.message 
    });
  }
};

// Get available subjects for a class/branch
export const getAvailableSubjects = async (req, res) => {
  try {
    const { classLevel, branch } = req.query;
    
    if (!classLevel) {
      return res.status(400).json({ message: "classLevel is required" });
    }
    
    const query = {
      classLevels: classLevel,
      isActive: true
    };
    
    // Filter by branch for SS students
    if (branch && branch !== "junior") {
      query.$or = [
        { branch: branch },
        { branch: "all" }
      ];
    }
    
    const subjects = await Subject.find(query)
      .select("name code branch type classLevels")
      .sort({ type: -1, name: 1 }); // Core subjects first
    
    res.json({
      success: true,
      classLevel,
      branch: branch || "all",
      count: subjects.length,
      subjects
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching subjects", 
      error: error.message 
    });
  }
};