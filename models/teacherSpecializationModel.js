// models/teacherSpecializationModel.js - COMPLETE VERSION
import mongoose from "mongoose";

const teacherSpecializationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    
    category: {
      type: String,
      enum: [
        "Mathematics",
        "Sciences", 
        "Languages",
        "Social Sciences",
        "Arts",
        "Technical",
        "Vocational",
        "Others"
      ],
      required: true
    },
    
    description: {
      type: String,
      maxlength: 200
    },
    
    isActive: {
      type: Boolean,
      default: true
    },
    
    teacherCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

teacherSpecializationSchema.index({ category: 1 });

const TeacherSpecialization = mongoose.model("TeacherSpecialization", teacherSpecializationSchema);
export default TeacherSpecialization;
