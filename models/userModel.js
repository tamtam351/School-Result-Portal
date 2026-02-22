// models/userModel.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["admin", "teacher", "student", "proprietress", "parent"],
      default: "student",
    },

    // ========== STUDENT-SPECIFIC FIELDS ==========
    studentId: { type: String, unique: true, sparse: true },
    classLevel: { type: String, enum: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"] },
    branch: { type: String, enum: ["junior", "science", "arts", "commerce"] },
    branchSelectedAt: { type: Date },
    currentSession: { type: String, default: "2025/2026" },

    assignedSubjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject"
    }],

    promotionHistory: [{
      fromClass: String,
      toClass: String,
      session: String,
      status: { type: String, enum: ["promoted", "demoted", "repeated"] },
      date: Date,
      reason: String,
    }],

    // ========== TEACHER-SPECIFIC FIELDS ==========
    // ✅ FIX: Teachers DO need assignedSubjects (subjectController pushes to it).
    // The old hook wiped it on every save — removed that incorrect clearing.
    teacherSpecialization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherSpecialization"
    },
    qualifications: { type: String, maxlength: 500 },
    yearsOfExperience: { type: Number, min: 0 },

    // ========== PARENT-SPECIFIC FIELDS ==========
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ========== ADMIN/MODERATION FIELDS ==========
    isBanned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ========== COMBINED PRE-SAVE HOOK ==========
userSchema.pre("save", async function (next) {
  // 1. Handle student-specific defaults
  if (this.role === "student") {
    if (!this.studentId) {
      const year = new Date().getFullYear();
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      this.studentId = `ST${year}${randomNum}`;
    }

    if (!this.branch) {
      this.branch = (this.classLevel && this.classLevel.startsWith("JSS"))
        ? "junior"
        : "junior";
    }
  }

  // ✅ FIX: Removed the block that cleared assignedSubjects/branch/classLevel/studentId
  // for non-student roles. It was wiping teacher assignedSubjects on every save,
  // meaning subject assignments were silently discarded.
  // Non-student roles simply won't have those fields populated — no clearing needed.

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