import express from "express";
import {
  createChat,
  getChats,
  getChatById,
  deleteChat,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createChat);           // create new chat
router.get("/", protect, getChats);              // get all user's chats
router.get("/:id", protect, getChatById);        // get single chat with messages
router.delete("/:id", protect, deleteChat);      // delete a chat

export default router;