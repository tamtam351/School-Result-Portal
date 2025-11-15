
import ReportCard from "../models/reportCardModel.js";
import Result from "../models/resultModel.js";
import User from "../models/userModel.js";


import { sendReportCardEmail } from "../utils/emailService.js";
import { generateReportCardPDF } from "../utils/pdfGenerator.js";
import path from "path";
import fs from "fs";

export const generateReportCard = async (req, res) => {
  try {
    const { studentId, term, session } = req.body;

    if (!studentId || !term || !session) {
      return res.status(400).json({
        message: "studentId, term, and session are required"
      });
    }

    // Fetch student
    const student = await User.findById(studentId).populate(
      "assignedSubjects",
      "name code"
    );

    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    // Fetch all results for the student this term
    const results = await Result.find({
      student: studentId,
      term,
      session
    })
      .populate("subject", "name code")
      .populate("uploadedBy", "name");

    if (results.length === 0) {
      return res.status(400).json({
        message: "No results found for this student in this term"
      });
    }

    // Calculate totals
    const totalScore = results.reduce((sum, r) => sum + r.total, 0);
    const averageScore = parseFloat(
      (totalScore / results.length).toFixed(2)
    );

    // Determine overall grade
    let overallGrade;
    if (averageScore >= 70) overallGrade = "A";
    else if (averageScore >= 60) overallGrade = "B";
    else if (averageScore >= 50) overallGrade = "C";
    else if (averageScore >= 45) overallGrade = "D";
    else if (averageScore >= 40) overallGrade = "E";
    else overallGrade = "F";

    // Check/create report card
    let reportCard = await ReportCard.findOne({
      student: studentId,
      term,
      session
    });

    if (reportCard) {
      // Update
      reportCard.results = results.map(r => r._id);
      reportCard.totalScore = totalScore;
      reportCard.averageScore = averageScore;
      reportCard.overallGrade = overallGrade;
      reportCard.numberOfSubjects = results.length;

      await reportCard.save();
    } else {
      // Create
      reportCard = await ReportCard.create({
        student: studentId,
        term,
        session,
        results: results.map(r => r._id),
        totalScore,
        averageScore,
        overallGrade,
        numberOfSubjects: results.length,
        status: "draft"
      });
    }

    // Populate full data
    await reportCard.populate([
      { path: "student", select: "name studentId classLevel branch" },
      {
        path: "results",
        populate: [
          { path: "subject", select: "name code" },
          { path: "uploadedBy", select: "name" }
        ]
      }
    ]);

    res.json({
      success: true,
      message: reportCard.isNew
        ? "Report card created"
        : "Report card updated",
      reportCard: {
        _id: reportCard._id,
        student: reportCard.student,
        term: reportCard.term,
        session: reportCard.session,
        status: reportCard.status,
        summary: {
          totalScore: reportCard.totalScore,
          averageScore: reportCard.averageScore,
          overallGrade: reportCard.overallGrade,
          numberOfSubjects: reportCard.numberOfSubjects
        },
        results: reportCard.results.map(r => ({
          subject: r.subject,
          scores: {
            firstCA: r.firstCA,
            secondCA: r.secondCA,
            exam: r.exam,
            total: r.total
          },
          grade: r.grade,
          remark: r.remark,
          teacherComment: r.teacherComment
        }))
      }
    });
  } catch (error) {
    console.error("Generate report card error:", error);
    res.status(500).json({
      message: "Error generating report card",
      error: error.message
    });
  }
};

// ========================================
// 2. GET ALL REPORT CARDS FOR REVIEW (ADMIN)
// ========================================
export const getAllReportCardsForReview = async (req, res) => {
  try {
    const { term, session, classLevel, status } = req.query;

    if (!term || !session) {
      return res.status(400).json({
        message: "term and session are required"
      });
    }

    const query = { term, session };
    if (status) query.status = status;

    let reportCards = await ReportCard.find(query)
      .populate("student", "name studentId classLevel branch")
      .populate("reviewedBy", "name")
      .sort({ "student.classLevel": 1, "student.name": 1 });

    if (classLevel) {
      reportCards = reportCards.filter(
        rc => rc.student.classLevel === classLevel
      );
    }

    const formatted = reportCards.map(rc => ({
      _id: rc._id,
      student: {
        _id: rc.student._id,
        name: rc.student.name,
        studentId: rc.student.studentId,
        classLevel: rc.student.classLevel,
        branch: rc.student.branch
      },
      term: rc.term,
      session: rc.session,
      status: rc.status,
      summary: {
        totalScore: rc.totalScore,
        averageScore: rc.averageScore,
        overallGrade: rc.overallGrade,
        numberOfSubjects: rc.numberOfSubjects
      },
      proprietressComment: rc.proprietressComment,
      reviewedAt: rc.reviewedAt,
      publishedAt: rc.publishedAt
    }));

    res.json({
      success: true,
      term,
      session,
      classLevel: classLevel || "all",
      status: status || "all",
      count: formatted.length,
      reportCards: formatted
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching report cards",
      error: error.message
    });
  }
};

// ========================================
// 3. APPROVE OR REJECT REPORT CARD (ADMIN)
// ========================================
export const approveAndPublishReportCard = async (req, res) => {
  try {
    const { reportCardId } = req.params;
    const { proprietressComment, action } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        message: "action must be 'approve' or 'reject'"
      });
    }

    const reportCard = await ReportCard.findById(reportCardId).populate(
      "student",
      "name studentId classLevel"
    );

    if (!reportCard) {
      return res.status(404).json({ message: "Report card not found" });
    }

    if (action === "approve") {
      reportCard.status = "published";
      reportCard.proprietressComment = proprietressComment;
      reportCard.reviewedBy = req.user._id;
      reportCard.reviewedAt = new Date();
      reportCard.publishedAt = new Date();

      await reportCard.save();

      return res.json({
        success: true,
        message: `Report card published for ${reportCard.student.name}`,
        reportCard
      });
    }

    // Reject
    reportCard.status = "draft";
    reportCard.proprietressComment = proprietressComment;
    reportCard.reviewedBy = req.user._id;
    reportCard.reviewedAt = new Date();

    await reportCard.save();

    res.json({
      success: true,
      message: `Report card rejected for ${reportCard.student.name}`,
      reportCard
    });
  } catch (error) {
    res.status(500).json({
      message: "Error approving report card",
      error: error.message
    });
  }
};

// ========================================
// 4. VIEW REPORT CARD (PARENT/STUDENT)
// ========================================
export const viewReportCard = async (req, res) => {
  try {
    const { studentId, term, session } = req.query;

    // Parent authorization
    if (req.user.role === "parent") {
      const parent = await User.findById(req.user._id);
      if (!parent.children.includes(studentId)) {
        return res.status(403).json({
          message: "You can only view your children's report cards"
        });
      }
    }

    // Student authorization
    if (req.user.role === "student") {
      if (req.user._id.toString() !== studentId) {
        return res.status(403).json({
          message: "You can only view your own report card"
        });
      }
    }

    const reportCard = await ReportCard.findOne({
      student: studentId,
      term,
      session,
      status: "published"
    })
      .populate("student", "name studentId classLevel branch email")
      .populate({
        path: "results",
        populate: {
          path: "subject",
          select: "name code"
        }
      });

    if (!reportCard) {
      return res.status(404).json({
        message: "Report card not yet published for this term"
      });
    }

    const excelFormat = {
      studentInfo: {
        name: reportCard.student.name,
        studentId: reportCard.student.studentId,
        class: reportCard.student.classLevel,
        branch: reportCard.student.branch
      },
      termInfo: {
        term: reportCard.term,
        session: reportCard.session,
        publishedDate: reportCard.publishedAt
      },
      results: reportCard.results.map(r => ({
        subject: r.subject.name,
        subjectCode: r.subject.code,
        firstCA: r.firstCA,
        secondCA: r.secondCA,
        exam: r.exam,
        total: r.total,
        grade: r.grade,
        remark: r.remark,
        teacherComment: r.teacherComment
      })),
      summary: {
        totalScore: reportCard.totalScore,
        averageScore: reportCard.averageScore,
        overallGrade: reportCard.overallGrade,
        numberOfSubjects: reportCard.numberOfSubjects,
        maxPossible: reportCard.numberOfSubjects * 100
      },
      comments: {
        classTeacher: reportCard.classTeacherComment,
        proprietress: reportCard.proprietressComment
      }
    };

    res.json({
      success: true,
      reportCard: excelFormat
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching report card",
      error: error.message
    });
  }
};

// ========================================
// 5. ENHANCED APPROVAL + PDF + EMAILS
// ========================================
export const approveAndPublishReportCardEnhanced = async (req, res) => {
  try {
    const { reportCardId } = req.params;
    const { proprietressComment, action } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        message: "action must be 'approve' or 'reject'"
      });
    }

    const reportCard = await ReportCard.findById(reportCardId)
      .populate("student", "name studentId classLevel email")
      .populate({
        path: "results",
        populate: { path: "subject", select: "name code" }
      });

    if (!reportCard) {
      return res.status(404).json({ message: "Report card not found" });
    }

    if (action === "approve") {
      // Publish
      reportCard.status = "published";
      reportCard.proprietressComment = proprietressComment;
      reportCard.reviewedBy = req.user._id;
      reportCard.reviewedAt = new Date();
      reportCard.publishedAt = new Date();

      await reportCard.save();

      // PDF folder
      const pdfDir = path.join(process.cwd(), "uploads", "report-cards");
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      // Generate PDF path
      const pdfFileName = `${reportCard.student.studentId}_${reportCard.term}_${reportCard.session}.pdf`;
      const pdfPath = path.join(pdfDir, pdfFileName);

      await generateReportCardPDF(reportCard, pdfPath);

      reportCard.pdfUrl = `/uploads/report-cards/${pdfFileName}`;
      reportCard.pdfGeneratedAt = new Date();
      await reportCard.save();

      // Notify parents
      const parents = await User.find({
        role: "parent",
        children: reportCard.student._id
      });

      for (const parent of parents) {
        await sendReportCardEmail(parent.email, reportCard.student.name, {
          term: reportCard.term,
          session: reportCard.session,
          averageScore: reportCard.averageScore,
          overallGrade: reportCard.overallGrade,
          numberOfSubjects: reportCard.numberOfSubjects,
          proprietressComment: reportCard.proprietressComment
        });
      }

      return res.json({
        success: true,
        message: `Report card published for ${reportCard.student.name} and ${parents.length} parent(s) notified`,
        reportCard
      });
    }

    // Reject
    reportCard.status = "draft";
    reportCard.proprietressComment = proprietressComment;
    reportCard.reviewedBy = req.user._id;
    reportCard.reviewedAt = new Date();

    await reportCard.save();

    res.json({
      success: true,
      message: `Report card rejected for ${reportCard.student.name}`,
      reportCard
    });
  } catch (error) {
    console.error("Report card approval error:", error);
    res.status(500).json({
      message: "Error processing report card",
      error: error.message
    });
  }
};
