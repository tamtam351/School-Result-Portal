import Result from "../models/resultModel.js";

// Upload student result
export const uploadResult = async (req, res) => {
  try {
    const { studentName, studentId, subject, score, grade, term } = req.body;

    if (!studentName || !studentId || !subject || !score || !term) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = new Result({
      studentName,
      studentId,
      subject,
      score,
      grade,
      term,
    });

    await result.save();
    res.status(201).json({ message: "Result uploaded successfully", result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
