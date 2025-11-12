// models/subjectModel.js - COMPLETE VERSION
import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  branch: {
    type: String,
    enum: ["junior", "science", "arts", "commerce", "all"],
    required: true,
    default: "all"
  },
  
  classLevels: [{
    type: String,
    enum: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"]
  }],
  
  type: {
    type: String,
    enum: ["core", "elective"],
    default: "core"
  },
  
  // Enhanced: Teachers assigned per class level
  teacherAssignments: [{
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    classLevels: [{
      type: String,
      enum: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"]
    }],
    section: {
      type: String,
      enum: ["A", "B", "C", "all"],
      default: "all"
    }
  }],
  
  // Deprecated but kept for backward compatibility
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  description: {
    type: String,
    maxlength: 500
  }
  
}, { timestamps: true });

subjectSchema.index({ branch: 1, classLevels: 1 });
subjectSchema.index({ 'teacherAssignments.teacher': 1 });

export default mongoose.model('Subject', subjectSchema);