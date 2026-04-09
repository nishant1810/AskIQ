import express from "express";
import {
  uploadDocument,
  askQuestion,
  getDocuments,
  deleteDocument,
  uploadMiddleware,
} from "../controllers/ragController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", protect, uploadMiddleware, uploadDocument);
router.post("/ask", protect, askQuestion);
router.get("/documents", protect, getDocuments);
router.delete("/documents/:id", protect, deleteDocument); // ✅ new

export default router;