import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
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

    // For students only
    studentId: {
      type: String,
      unique: true,
      sparse: true, // allows null for non-students
    },

    classLevel: {
      type: String,
      enum: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"],
    },

    // For parents linked to their children
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // link to student users
      },
    ],

    // To manage bans or suspensions
    isBanned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 🔹 Generate Student ID only for students
userSchema.pre("save", function (next) {
  if (this.role === "student" && !this.studentId) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.studentId = `ST${new Date().getFullYear()}${randomNum}`;
  }
  next();
});

// 🔹 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔹 Compare entered password with stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
