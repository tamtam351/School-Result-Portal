// controllers/resultController.js
// ------------------------------------------------------------
// Imports
// ------------------------------------------------------------
import Result from "../models/resultModel.js";
import User from "../models/userModel.js";
import Subject from "../models/subjectModel.js";


// ============================================================
// 1. UPLOAD OR UPDATE RESULT (Teacher)
// ============================================================
export const uploadResult = async (req, res) => {
  try {
    const { 
      studentId, subjectId, firstCA, secondCA,
      exam, term, session, teacherComment 
    } = req.body;

    const teacherId = req.user._id;

    // ------------------------------
    // Validate student
    // ------------------------------
    const student = await User.findById(studentId).populate("assignedSubjects");
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    // ------------------------------
    // Validate subject
    // ------------------------------
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // ------------------------------
    // Check teacher assignment
    // ------------------------------
    const isTeacherForSubject = subject.teachers.some(
      t => t.toString() === teacherId.toString()
    );
    if (!isTeacherForSubject) {
      return res.status(403).json({ 
        message: `You are not assigned to teach ${subject.name}` 
      });
    }

    // ------------------------------
    // Check if student takes the subject
    // ------------------------------
    const studentHasSubject = student.assignedSubjects.some(
      s => s._id.toString() === subjectId.toString()
    );
    if (!studentHasSubject) {
      return res.status(400).json({ 
        message: `${student.name} does not take ${subject.name}` 
      });
    }

    // ------------------------------
    // Validate scores
    // ------------------------------
    if (firstCA < 0 || firstCA > 20)
      return res.status(400).json({ message: "First CA must be between 0–20" });

    if (secondCA < 0 || secondCA > 10)
      return res.status(400).json({ message: "Second CA must be between 0–10" });

    if (exam < 0 || exam > 70)
      return res.status(400).json({ message: "Exam must be between 0–70" });

    // ------------------------------
    // CHECK IF RESULT EXISTS
    // ------------------------------
    let result = await Result.findOne({
      student: studentId,
      subject: subjectId,
      term,
      session
    });

    // ========================================================
    // UPDATE EXISTING RESULT
    // ========================================================
    if (result) {
      result.firstCA = firstCA;
      result.secondCA = secondCA;
      result.exam = exam;
      result.teacherComment = teacherComment || result.teacherComment;
      result.lastEditedBy = teacherId;
      result.lastEditedAt = new Date();

      await result.save();

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
          _id: result._id,
          student: result.student,
          subject: result.subject,
          scores: {
            firstCA,
            secondCA,
            exam,
            total: result.total
          },
          grade: result.grade,
          remark: result.remark,
          teacherComment: result.teacherComment,
          term: result.term,
          session: result.session,
          uploadedBy: result.uploadedBy,
          lastEditedBy: result.lastEditedBy,
          lastEditedAt: result.lastEditedAt
        }
      });
    }

    // ========================================================
    // CREATE NEW RESULT
    // ========================================================
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

    return res.status(201).json({
      success: true,
      message: "Result uploaded successfully",
      result: {
        _id: result._id,
        student: result.student,
        subject: result.subject,
        scores: {
          firstCA,
          secondCA,
          exam,
          total: result.total
        },
        grade: result.grade,
        remark: result.remark,
        teacherComment: result.teacherComment,
        term,
        session,
        uploadedBy: result.uploadedBy
      }
    });

  } catch (error) {
    console.error("Upload result error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Result already exists for this student, subject, term, and session"
      });
    }

    res.status(500).json({
      message: "Error uploading result",
      error: error.message
    });
  }
};


// ============================================================
// 2. GET STUDENTS FOR A TEACHER'S SUBJECT
// ============================================================
export const getMyStudents = async (req, res) => {
  try {
    const { subjectId, term, session } = req.query;
    const teacherId = req.user._id;

    if (!subjectId)
      return res.status(400).json({ message: "subjectId is required" });

    const subject = await Subject.findById(subjectId);
    if (!subject)
      return res.status(404).json({ message: "Subject not found" });

    const isTeacherAssigned = subject.teachers.some(
      t => t.toString() === teacherId.toString()
    );
    if (!isTeacherAssigned)
      return res.status(403).json({ message: "You are not assigned to teach this subject" });

    const students = await User.find({
      role: "student",
      assignedSubjects: subjectId
    })
      .select("name studentId classLevel branch email")
      .sort({ classLevel: 1, name: 1 });

    let studentsWithResults = students;

    // If term & session are supplied, attach results
    if (term && session) {
      const existingResults = await Result.find({
        subject: subjectId,
        term,
        session,
        student: { $in: students.map(s => s._id) }
      });

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
          result: result
            ? {
                _id: result._id,
                firstCA: result.firstCA,
                secondCA: result.secondCA,
                exam: result.exam,
                total: result.total,
                grade: result.grade,
                remark: result.remark,
                teacherComment: result.teacherComment,
                uploadedAt: result.createdAt
              }
            : null
        };
      });
    }

    return res.json({
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


// ============================================================
// 3. GET ALL RESULTS FOR A STUDENT
// ============================================================
export const getStudentResults = async (req, res) => {
  try {
    const { studentId, term, session } = req.query;

    // Authorization
    if (req.user.role === "student" && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (req.user.role === "parent") {
      const parent = await User.findById(req.user._id);
      if (!parent.children.includes(studentId)) {
        return res.status(403).json({ 
          message: "You can only view your children's results" 
        });
      }
    }

    const query = { student: studentId };
    if (term) query.term = term;
    if (session) query.session = session;

    const results = await Result.find(query)
      .populate("subject", "name code")
      .populate("uploadedBy", "name")
      .sort({ "subject.name": 1 });

    if (results.length === 0) {
      return res.status(404).json({ message: "No results found for this student" });
    }

    const totalScore = results.reduce((sum, r) => sum + r.total, 0);
    const averageScore = (totalScore / results.length).toFixed(2);

    return res.json({
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
        _id: r._id,
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


// ============================================================
// 4. GET RESULTS BY CLASS & SUBJECT (Analytics)
// ============================================================
export const getResultsByClassAndSubject = async (req, res) => {
  try {
    const { classLevel, subjectId, term, session } = req.query;

    if (!classLevel || !subjectId || !term || !session) {
      return res.status(400).json({
        message: "classLevel, subjectId, term, and session are required"
      });
    }

    const students = await User.find({
      role: "student",
      classLevel,
      assignedSubjects: subjectId
    }).select("name studentId");

    const studentIds = students.map(s => s._id);

    const results = await Result.find({
      student: { $in: studentIds },
      subject: subjectId,
      term,
      session
    })
      .populate("student", "name studentId")
      .sort({ total: -1 });

    const totalStudents = students.length;
    const studentsWithResults = results.length;

    const scores = results.map(r => r.total);

    const averageScore = scores.length
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
      : 0;

    const highestScore = scores.length ? Math.max(...scores) : 0;
    const lowestScore = scores.length ? Math.min(...scores) : 0;

    const gradeDistribution = {
      A: results.filter(r => r.grade === "A").length,
      B: results.filter(r => r.grade === "B").length,
      C: results.filter(r => r.grade === "C").length,
      D: results.filter(r => r.grade === "D").length,
      E: results.filter(r => r.grade === "E").length,
      F: results.filter(r => r.grade === "F").length
    };

    res.json({
      success: true,
      classLevel,
      term,
      session,
      statistics: {
        totalStudents,
        studentsWithResults,
        studentsWithoutResults: totalStudents - studentsWithResults,
        averageScore,
        highestScore,
        lowestScore,
        gradeDistribution
      },
      results: results.map(r => ({
        student: r.student,
        scores: {
          firstCA: r.firstCA,
          secondCA: r.secondCA,
          exam: r.exam,
          total: r.total
        },
        grade: r.grade,
        remark: r.remark
      }))
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching class results",
      error: error.message
    });
  }
};


// ============================================================
// 5. DELETE A RESULT
// ============================================================
export const deleteResult = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findById(resultId);
    if (!result)
      return res.status(404).json({ message: "Result not found" });

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


// ============================================================
// 6. BULK UPLOAD RESULTS (CSV / EXCEL)
// ============================================================
export const bulkUploadResults = async (req, res) => {
  try {
    const { results, term, session, subjectId } = req.body;
    const teacherId = req.user._id;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        message: "results array is required and cannot be empty"
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject)
      return res.status(404).json({ message: "Subject not found" });

    const isTeacherAssigned = subject.teachers.some(
      t => t.toString() === teacherId.toString()
    );

    if (!isTeacherAssigned)
      return res.status(403).json({
        message: "You are not assigned to teach this subject"
      });

    const uploadedResults = [];
    const errors = [];

    for (const item of results) {
      try {
        const { studentId, firstCA, secondCA, exam, teacherComment } = item;

        // Validate student
        const student = await User.findOne({
          studentId,
          role: "student",
          assignedSubjects: subjectId
        });

        if (!student) {
          errors.push({
            studentId,
            error: "Student not found or doesn't take this subject"
          });
          continue;
        }

        // Check if result exists
        let result = await Result.findOne({
          student: student._id,
          subject: subjectId,
          term,
          session
        });

        if (result) {
          result.firstCA = firstCA;
          result.secondCA = secondCA;
          result.exam = exam;
          result.teacherComment = teacherComment;
          result.lastEditedBy = teacherId;
          result.lastEditedAt = new Date();
          await result.save();

        } else {
          result = await Result.create({
            student: student._id,
            subject: subjectId,
            term,
            session,
            firstCA,
            secondCA,
            exam,
            teacherComment,
            uploadedBy: teacherId
          });
        }

        uploadedResults.push({
          studentId,
          studentName: student.name,
          total: result.total,
          grade: result.grade
        });

      } catch (err) {
        errors.push({
          studentId: item.studentId,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      message: `Uploaded ${uploadedResults.length} results`,
      uploaded: uploadedResults.length,
      failed: errors.length,
      uploadedResults,
      errors
    });

  } catch (error) {
    res.status(500).json({
      message: "Error in bulk upload",
      error: error.message
    });
  }
};


// ============================================================
// 7. SUBMIT RESULTS FOR APPROVAL (Teacher)
// ============================================================
export const submitForApproval = async (req, res) => {
  try {
    const { resultIds } = req.body;

    if (!Array.isArray(resultIds) || resultIds.length === 0) {
      return res.status(400).json({ message: "resultIds array is required" });
    }

    const results = await Result.updateMany(
      { _id: { $in: resultIds }, uploadedBy: req.user._id },
      { status: "pending_approval" }
    );

    if (results.modifiedCount === 0) {
      return res.status(404).json({
        message: "No results found or already submitted"
      });
    }

    res.json({
      success: true,
      message: `${results.modifiedCount} results submitted for approval`,
      count: results.modifiedCount
    });

  } catch (error) {
    res.status(500).json({
      message: "Error submitting results",
      error: error.message
    });
  }
};


// ============================================================
// 8. GET ALL PENDING RESULTS (Admin)
// ============================================================
export const getPendingResults = async (req, res) => {
  try {
    const { term, session } = req.query;

    const query = { status: "pending_approval" };
    if (term) query.term = term;
    if (session) query.session = session;

    const results = await Result.find(query)
      .populate("student", "name studentId classLevel branch")
      .populate("subject", "name code")
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    const grouped = results.reduce((acc, result) => {
      const key = `${result.subject._id}-${result.uploadedBy._id}`;

      if (!acc[key]) {
        acc[key] = {
          subject: result.subject,
          teacher: result.uploadedBy,
          class: result.student.classLevel,
          term: result.term,
          session: result.session,
          results: [],
          count: 0
        };
      }

      acc[key].results.push(result);
      acc[key].count++;

      return acc;
    }, {});

    res.json({
      success: true,
      totalPending: results.length,
      groupedResults: Object.values(grouped)
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching pending results",
      error: error.message
    });
  }
};


// ============================================================
// 9. APPROVE RESULTS (Admin)
// ============================================================
export const approveResults = async (req, res) => {
  try {
    const { resultIds } = req.body;

    if (!Array.isArray(resultIds) || resultIds.length === 0) {
      return res.status(400).json({ message: "resultIds array is required" });
    }

    const results = await Result.updateMany(
      { _id: { $in: resultIds } },
      {
        status: "approved",
        approvedBy: req.user._id,
        approvedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `${results.modifiedCount} results approved successfully`,
      count: results.modifiedCount
    });

  } catch (error) {
    res.status(500).json({
      message: "Error approving results",
      error: error.message
    });
  }
};


// ============================================================
// 10. REJECT RESULTS (Admin)
// ============================================================
export const rejectResults = async (req, res) => {
  try {
    const { resultIds, reason } = req.body;

    if (!Array.isArray(resultIds) || resultIds.length === 0)
      return res.status(400).json({ message: "resultIds array is required" });

    if (!reason)
      return res.status(400).json({ message: "Rejection reason is required" });

    const results = await Result.find({ _id: { $in: resultIds } })
      .populate("uploadedBy", "name email")
      .populate("subject", "name");

    await Result.updateMany(
      { _id: { $in: resultIds } },
      { status: "rejected", rejectionReason: reason }
    );

    if (results.length > 0) {
      const teacher = results[0].uploadedBy;
      const subject = results[0].subject;

      await sendRejectionEmail(teacher.email, teacher.name, {
        subject: subject.name,
        class: "Various",
        reason
      });
    }

    res.json({
      success: true,
      message: `${results.length} results rejected and teacher notified`,
      count: results.length
    });

  } catch (error) {
    res.status(500).json({
      message: "Error rejecting results",
      error: error.message
    });
  }
};
