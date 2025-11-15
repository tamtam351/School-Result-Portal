// models/userModel.js - FIXED VERSION
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "teacher", "student", "proprietress", "parent"],
      default: "student",
    },

    // ========== STUDENT-SPECIFIC FIELDS ==========
    studentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    
    classLevel: {
      type: String,
      enum: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"],
    },
    
    branch: {
      type: String,
      enum: ["junior", "science", "arts", "commerce"],
    },
    
    branchSelectedAt: {
      type: Date,
    },
    
    currentSession: {
      type: String,
      default: "2025/2026"
    },
    
    assignedSubjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject"
    }],
    
    promotionHistory: [{
      fromClass: String,
      toClass: String,
      session: String,
      status: {
        type: String,
        enum: ["promoted", "demoted", "repeated"],
      },
      date: Date,
      reason: String,
    }],

    // ========== TEACHER-SPECIFIC FIELDS ==========
    teacherSpecialization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherSpecialization"
    },
    
    qualifications: {
      type: String,
      maxlength: 500
    },
    
    yearsOfExperience: {
      type: Number,
      min: 0
    },

    // ========== PARENT-SPECIFIC FIELDS ==========
    children: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],

    // ========== ADMIN/MODERATION FIELDS ==========
    isBanned: {
      type: Boolean,
      default: false,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ========== COMBINED PRE-SAVE HOOK ==========
userSchema.pre("save", async function (next) {
  // 1. Handle role-specific fields
  if (this.role === "student") {
    if (!this.studentId) {
      const year = new Date().getFullYear();
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      this.studentId = `ST${year}${randomNum}`;
    }
    
    if (!this.branch) {
      if (this.classLevel && this.classLevel.startsWith("JSS")) {
        this.branch = "junior";
      } else {
        this.branch = this.branch || "junior";
      }
    }
  } else {
    this.branch = undefined;
    this.classLevel = undefined;
    this.studentId = undefined;
    this.promotionHistory = undefined;
    this.branchSelectedAt = undefined;
  }
  
  if (this.role === "teacher") {
    this.assignedSubjects = undefined;
  }
  
  if (this.role === "parent") {
    this.assignedSubjects = undefined;
  }
  
  if (this.role !== "teacher") {
    this.teacherSpecialization = undefined;
    this.qualifications = undefined;
    this.yearsOfExperience = undefined;
  }
  
  // 2. Hash password ONLY if modified
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  next();
});

// ========== INSTANCE METHODS ==========
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;