// server.js - COMPLETE VERSION
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import reportCardRoutes from "./routes/reportCardRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";
import specializationRoutes from "./routes/specializationRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/report-cards", reportCardRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/specializations", specializationRoutes);

app.get("/", (req, res) => {
  res.json({ 
    message: "🎓 DE-LAUREL School Portal API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth (login only - closed system)",
      admin: "/api/admin",
      subjects: "/api/subjects",
      students: "/api/students",
      results: "/api/results",
      reportCards: "/api/report-cards",
      parents: "/api/parents",
      specializations: "/api/specializations"
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 System: Closed (Admin registration only)`);
});