import express from "express";
import { uploadResult } from "../controllers/resultController.js";

const router = express.Router();

router.post("/upload", uploadResult);

export default router;
