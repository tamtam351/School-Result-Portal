import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true },
    studentId: { type: String, required: true },
    subject: { type: String, required: true },
    score: { type: Number, required: true },
    grade: { type: String, required: true },
    term: { type: String, required: true },
  },
  { timestamps: true }
);

const Result = mongoose.model("Result", resultSchema);

export default Result;
