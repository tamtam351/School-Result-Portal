// controllers/teacherController.js - COMPLETE IMPLEMENTATION
import User from "../models/userModel.js";
import Subject from "../models/subjectModel.js";
import Result from "../models/resultModel.js";

// Get teacher profile
export const getTeacherProfile = async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id)
      .select("-password")
      .populate("assignedSubjects", "name code classLevels branch type")
      .populate("teacherSpecialization", "name category description");

    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({
      success: true,
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role,
        teacherSpecialization: teacher.teacherSpecialization,
        qualifications: teacher.qualifications,
        yearsOfExperience: teacher.yearsOfExperience,
        assignedSubjects: teacher.assignedSubjects,
        createdAt: teacher.createdAt
      }
    });
  } catch (error) {
    console.error("Get teacher profile error:", error);
    res.status(500).json({ 
      message: "Error fetching profile", 
      error: error.message 
    });
  }
};

// Get teacher's assigned subjects with student counts
export const getMySubjects = async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id)
      .populate({
        path: "assignedSubjects",
        select: "name code classLevels branch type"
      });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Get student counts for each subject
    const subjectsWithCounts = await Promise.all(
      (teacher.assignedSubjects || []).map(async (subject) => {
        const studentCount = await User.countDocuments({
          role: "student",
          assignedSubjects: subject._id
        });

        return {
          _id: subject._id,
          name: subject.name,
          code: subject.code,
          classLevels: subject.classLevels,
          branch: subject.branch,
          type: subject.type,
          studentCount
        };
      })
    );

    res.json({
      success: true,
      count: subjectsWithCounts.length,
      subjects: subjectsWithCounts
    });
  } catch (error) {
    console.error("Get teacher subjects error:", error);
    res.status(500).json({ 
      message: "Error fetching subjects", 
      error: error.message 
    });
  }
};

// Update teacher profile (limited fields)
export const updateTeacherProfile = async (req, res) => {
  try {
    const { name, email, qualifications, yearsOfExperience } = req.body;

    const teacher = await User.findById(req.user._id);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Update allowed fields
    if (name) teacher.name = name;
    
    if (email && email !== teacher.email) {
      // Check if email already exists
      const emailExists = await User.findOne({ 
        email, 
        _id: { $ne: teacher._id } 
      });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      teacher.email = email;
    }
    
    if (qualifications) teacher.qualifications = qualifications;
    if (yearsOfExperience !== undefined) teacher.yearsOfExperience = yearsOfExperience;

    await teacher.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        qualifications: teacher.qualifications,
        yearsOfExperience: teacher.yearsOfExperience
      }
    });
  } catch (error) {
    console.error("Update teacher profile error:", error);
    res.status(500).json({ 
      message: "Error updating profile", 
      error: error.message 
    });
  }
};

// Get teacher's teaching statistics
export const getTeachingStats = async (req, res) => {
  try {
    const { term, session } = req.query;
    const teacherId = req.user._id;

    // Get teacher's subjects
    const teacher = await User.findById(teacherId).populate("assignedSubjects");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const subjectIds = teacher.assignedSubjects.map(s => s._id);

    // Build query
    const query = { uploadedBy: teacherId };
    if (term) query.term = term;
    if (session) query.session = session;

    // Get results statistics
    const totalResults = await Result.countDocuments(query);
    const approvedResults = await Result.countDocuments({ ...query, status: "approved" });
    const pendingResults = await Result.countDocuments({ ...query, status: "pending_approval" });
    const draftResults = await Result.countDocuments({ ...query, status: "draft" });

    // Get total students taught
    const totalStudents = await User.countDocuments({
      role: "student",
      assignedSubjects: { $in: subjectIds }
    });

    // Get results by subject
    const resultsBySubject = await Promise.all(
      teacher.assignedSubjects.map(async (subject) => {
        const count = await Result.countDocuments({
          ...query,
          subject: subject._id
        });
        return {
          subject: subject.name,
          code: subject.code,
          resultsUploaded: count
        };
      })
    );

    res.json({
      success: true,
      term: term || "all",
      session: session || "all",
      statistics: {
        totalSubjects: teacher.assignedSubjects.length,
        totalStudents,
        totalResults,
        approvedResults,
        pendingResults,
        draftResults
      },
      resultsBySubject
    });
  } catch (error) {
    console.error("Get teaching stats error:", error);
    res.status(500).json({ 
      message: "Error fetching statistics", 
      error: error.message 
    });
  }
};

// Get teacher's uploaded results
export const getMyResults = async (req, res) => {
  try {
    const { term, session, status, subjectId } = req.query;
    const teacherId = req.user._id;

    const query = { uploadedBy: teacherId };
    if (term) query.term = term;
    if (session) query.session = session;
    if (status) query.status = status;
    if (subjectId) query.subject = subjectId;

    const results = await Result.find(query)
      .populate("student", "name studentId classLevel branch")
      .populate("subject", "name code")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: results.length,
      filters: { term, session, status, subjectId },
      results: results.map(r => ({
        _id: r._id,
        student: r.student,
        subject: r.subject,
        scores: {
          firstCA: r.firstCA,
          secondCA: r.secondCA,
          exam: r.exam,
          total: r.total
        },
        grade: r.grade,
        remark: r.remark,
        status: r.status,
        term: r.term,
        session: r.session,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }))
    });
  } catch (error) {
    console.error("Get teacher results error:", error);
    res.status(500).json({ 
      message: "Error fetching results", 
      error: error.message 
    });
  }
};