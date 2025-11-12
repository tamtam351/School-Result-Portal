// models/reportCardModel.js - COMPLETE VERSION
import mongoose from "mongoose";

const reportCardSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  term: {
    type: String,
    enum: ["First Term", "Second Term", "Third Term"],
    required: true
  },
  
  session: {
    type: String,
    required: true,
    match: /^\d{4}\/\d{4}$/
  },
  
  results: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Result"
  }],
  
  totalScore: {
    type: Number,
    default: 0
  },
  
  averageScore: {
    type: Number,
    default: 0
  },
  
  overallGrade: {
    type: String,
    enum: ["A", "B", "C", "D", "E", "F"]
  },
  
  numberOfSubjects: {
    type: Number,
    default: 0
  },
  
  proprietressComment: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  
  classTeacherComment: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  status: {
    type: String,
    enum: ["draft", "under_review", "approved", "published"],
    default: "draft"
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  
  reviewedAt: {
    type: Date
  },
  
  publishedAt: {
    type: Date
  },
  
  pdfUrl: {
    type: String
  },
  
  pdfGeneratedAt: {
    type: Date
  },
  
  attendanceSummary: {
    totalDays: { type: Number, default: 0 },
    daysPresent: { type: Number, default: 0 },
    daysAbsent: { type: Number, default: 0 }
  }
  
}, { timestamps: true });

reportCardSchema.index(
  { student: 1, term: 1, session: 1 },
  { unique: true }
);

reportCardSchema.index({ status: 1 });
reportCardSchema.index({ term: 1, session: 1 });

const ReportCard = mongoose.model("ReportCard", reportCardSchema);
export default ReportCard;