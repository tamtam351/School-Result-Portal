// server.js - FIXED VERSION WITH ERROR HANDLING
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
import teacherRoutes from "./routes/teacherRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/report-cards", reportCardRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/specializations", specializationRoutes);
app.use("/api/teachers", teacherRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "🎓 DE-LAUREL School Portal API",
    version: "1.0.0",
    status: "active",
    endpoints: {
      auth: "/api/auth (login only - closed system)",
      admin: "/api/admin",
      subjects: "/api/subjects",
      students: "/api/students",
      results: "/api/results",
      reportCards: "/api/report-cards",
      parents: "/api/parents",
      specializations: "/api/specializations",
      teachers: "/api/teachers"
    },
    documentation: "Contact admin for API documentation"
  });
});

// 404 Handler - Must be after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    availableEndpoints: [
      "/api/auth",
      "/api/admin", 
      "/api/subjects",
      "/api/students",
      "/api/results",
      "/api/report-cards",
      "/api/parents",
      "/api/specializations",
      "/api/teachers"
    ]
  });
});

// Global Error Handler - Must be last
app.use((err, req, res, next) => {
  console.error('❌ Error occurred:');
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 System: Closed (Admin registration only)`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log('========================================');
  console.log('');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err);
  process.exit(1);
});