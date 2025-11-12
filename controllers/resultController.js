// controllers/resultController.js - COMPLETE VERSION
import Result from "../models/resultModel.js";
import User from "../models/userModel.js";
import Subject from "../models/subjectModel.js";

// Teacher uploads result
export const uploadResult = async (req, res) => {
  try {
    const { 
      studentId, 
      subjectId, 
      firstCA,   // 0-20
      secondCA,  // 0-10
      exam,      // 0-70
      term, 
      session,
      teacherComment 
    } = req.body;
    
    const teacherId = req.user._id;
    
    // ========== VALIDATION ==========
    
    // 1. Check if student exists
    const student = await User.findById(studentId).populate("assignedSubjects");
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }
    
    // 2. Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    
    // 3. Check if teacher is assigned to this subject
    if (!subject.teachers.some(t => t.toString() === teacherId.toString())) {
      return res.status(403).json({ 
        message: `You are not assigned to teach ${subject.name}` 
      });
    }
    
    // 4. Check if student takes this subject
    const studentHasSubject = student.assignedSubjects.some(
      s => s._id.toString() === subjectId.toString()
    );
    
    if (!studentHasSubject) {
      return res.status(400).json({ 
        message: `${student.name} does not take ${subject.name}` 
      });
    }
    
    // 5. Validate score ranges
    if (firstCA < 0 || firstCA > 20) {
      return res.status(400).json({ 
        message: "First CA must be between 0-20 marks" 
      });
    }
    if (secondCA < 0 || secondCA > 10) {
      return res.status(400).json({ 
        message: "Second CA must be between 0-10 marks" 
      });
    }
    if (exam < 0 || exam > 70) {
      return res.status(400).json({ 
        message: "Exam must be between 0-70 marks" 
      });
    }
    
    // ========== SAVE OR UPDATE RESULT ==========
    
    // Check if result already exists (update scenario)
    let result = await Result.findOne({
      student: studentId,
      subject: subjectId,
      term,
      session
    });
    
    if (result) {
      // Update existing result
      result.firstCA = firstCA;
      result.secondCA = secondCA;
      result.exam = exam;
      result.teacherComment = teacherComment || result.teacherComment;
      result.lastEditedBy = teacherId;
      result.lastEditedAt = new Date();
      
      await result.save(); // Auto-calculates total, grade, remark
      
      await result.populate([
        { path: "student", select: "name studentId classLevel branch" },
        { path: "subject", select: "name code" },
        { path: "uploadedBy", select: "name email" },
        { path: "lastEditedBy", select: "name email" }
      ]);
      
      return res.json({
        success: true,
        message: "Result updated successfully",
        result: {
          student: result.student,
          subject: result.subject,
          scores: {
            firstCA: result.firstCA,
            secondCA: result.secondCA,
            exam: result.exam,
            total: result.total
          },
          grade: result.grade,
          remark: result.remark,
          teacherComment: result.teacherComment,
          term: result.term,
          session: result.session,
          uploadedBy: result.uploadedBy,
          lastEditedBy: result.lastEditedBy,
          lastEditedAt: result.lastEditedAt,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt
        }
      });
    }
    
    // Create new result
    result = await Result.create({
      student: studentId,
      subject: subjectId,
      term,
      session,
      firstCA,
      secondCA,
      exam,
      teacherComment,
      uploadedBy: teacherId
    });
    
    await result.populate([
      { path: "student", select: "name studentId classLevel branch" },
      { path: "subject", select: "name code" },
      { path: "uploadedBy", select: "name email" }
    ]);
    
    res.status(201).json({
      success: true,
      message: "Result uploaded successfully",
      result: {
        _id: result._id,
        student: result.student,
        subject: result.subject,
        scores: {
          firstCA: result.firstCA,
          secondCA: result.secondCA,
          exam: result.exam,
          total: result.total
        },
        grade: result.grade,
        remark: result.remark,
        teacherComment: result.teacherComment,
        term: result.term,
        session: result.session,
        uploadedBy: result.uploadedBy,
        createdAt: result.createdAt
      }
    });
    
  } catch (error) {
    console.error("Upload result error:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "Result already exists for this student/subject/term/session. Use update instead." 
      });
    }
    
    res.status(500).json({ 
      message: "Error uploading result", 
      error: error.message 
    });
  }
};

// Get students for teacher's subject (for upload form)
export const getMyStudents = async (req, res) => {
  try {
    const { subjectId, term, session } = req.query;
    const teacherId = req.user._id;
    
    // Validate required params
    if (!subjectId) {
      return res.status(400).json({ message: "subjectId is required" });
    }
    
    // Verify teacher teaches this subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    
    if (!subject.teachers.some(t => t.toString() === teacherId.toString())) {
      return res.status(403).json({ 
        message: "You are not assigned to teach this subject" 
      });
    }
    
    // Get all students who take this subject
    const students = await User.find({
      role: "student",
      assignedSubjects: subjectId
    })
    .select("name studentId classLevel branch email")
    .sort({ classLevel: 1, name: 1 });
    
    // If term and session provided, get existing results
    let studentsWithResults = students;
    
    if (term && session) {
      const existingResults = await Result.find({
        subject: subjectId,
        term,
        session,
        student: { $in: students.map(s => s._id) }
      });
      
      // Map results to students
      studentsWithResults = students.map(student => {
        const result = existingResults.find(
          r => r.student.toString() === student._id.toString()
        );
        
        return {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          classLevel: student.classLevel,
          branch: student.branch,
          email: student.email,
          hasResult: !!result,
          result: result ? {
            _id: result._id,
            firstCA: result.firstCA,
            secondCA: result.secondCA,
            exam: result.exam,
            total: result.total,
            grade: result.grade,
            remark: result.remark,
            teacherComment: result.teacherComment,
            uploadedAt: result.createdAt
          } : null
        };
      });
    }
    
    res.json({
      success: true,
      subject: {
        _id: subject._id,
        name: subject.name,
        code: subject.code
      },
      term: term || null,
      session: session || null,
      totalStudents: students.length,
      studentsWithResults: studentsWithResults.filter(s => s.hasResult).length,
      students: studentsWithResults
    });
    
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ 
      message: "Error fetching students", 
      error: error.message 
    });
  }
};

// Get all results for a student (for report card view)
export const getStudentResults = async (req, res) => {
  try {
    const { studentId, term, session } = req.query;
    
    // Authorization: student can view own, parent can view children
    if (req.user.role === "student") {
      if (req.user._id.toString() !== studentId) {
        return res.status(403).json({ message: "Not authorized" });
      }
    } else if (req.user.role === "parent") {
      const parent = await User.findById(req.user._id);
      if (!parent.children.includes(studentId)) {
        return res.status(403).json({ 
          message: "You can only view your children's results" 
        });
      }
    }
    
    // Build query
    const query = { student: studentId };
    if (term) query.term = term;
    if (session) query.session = session;
    
    const results = await Result.find(query)
      .populate("subject", "name code")
      .populate("uploadedBy", "name")
      .sort({ "subject.name": 1 });
    
    if (results.length === 0) {
      return res.status(404).json({ 
        message: "No results found for this student" 
      });
    }
    
    // Calculate summary
    const totalScore = results.reduce((sum, r) => sum + r.total, 0);
    const averageScore = (totalScore / results.length).toFixed(2);
    
    res.json({
      success: true,
      student: results[0].student,
      term,
      session,
      numberOfSubjects: results.length,
      summary: {
        totalScore,
        averageScore,
        maxPossible: results.length * 100
      },
      results: results.map(r => ({
        subject: r.subject,
        scores: {
          firstCA: r.firstCA,
          secondCA: r.secondCA,
          exam: r.exam,
          total: r.total
        },
        grade: r.grade,
        remark: r.remark,
        teacherComment: r.teacherComment,
        uploadedBy: r.uploadedBy
      }))
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching results", 
      error: error.message 
    });
  }
};

// Delete a result (admin/teacher only - before publishing)
export const deleteResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    
    const result = await Result.findById(resultId);
    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }
    
    // Teachers can only delete their own uploads
    if (req.user.role === "teacher") {
      if (result.uploadedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: "You can only delete results you uploaded" 
        });
      }
    }
    
    await result.deleteOne();
    
    res.json({
      success: true,
      message: "Result deleted successfully"
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: "Error deleting result", 
      error: error.message 
    });
  }
};