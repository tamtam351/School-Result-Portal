// models/resultModel.js - COMPLETE VERSION (20-10-70 System)
import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
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
    
    // Scores (20-10-70 System)
    firstCA: {
      type: Number,
      min: 0,
      max: 20,
      required: true
    },
    
    secondCA: {
      type: Number,
      min: 0,
      max: 10,
      required: true
    },
    
    exam: {
      type: Number,
      min: 0,
      max: 70,
      required: true
    },
    
    // Auto-calculated
    total: {
      type: Number,
      min: 0,
      max: 100
    },
    
    grade: {
      type: String,
      enum: ["A", "B", "C", "D", "E", "F"]
    },
    
    remark: {
      type: String
    },
    
    teacherComment: {
      type: String,
      maxlength: 500,
      trim: true
    },
    
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    
    lastEditedAt: {
      type: Date
    },
    
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

resultSchema.index(
  { student: 1, subject: 1, term: 1, session: 1 },
  { unique: true }
);

resultSchema.index({ term: 1, session: 1 });
resultSchema.index({ uploadedBy: 1 });
resultSchema.index({ student: 1, term: 1 });

// AUTO-CALCULATE
resultSchema.pre("save", function (next) {
  this.total = this.firstCA + this.secondCA + this.exam;
  
  if (this.total >= 70) {
    this.grade = "A";
    this.remark = "Excellent";
  } else if (this.total >= 60) {
    this.grade = "B";
    this.remark = "Very Good";
  } else if (this.total >= 50) {
    this.grade = "C";
    this.remark = "Good";
  } else if (this.total >= 45) {
    this.grade = "D";
    this.remark = "Pass";
  } else if (this.total >= 40) {
    this.grade = "E";
    this.remark = "Fair";
  } else {
    this.grade = "F";
    this.remark = "Fail";
  }
  
  next();
});

const Result = mongoose.model("Result", resultSchema);
export default Result;