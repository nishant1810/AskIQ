import Chat from "../models/Chat.js";
import mongoose from "mongoose";

// Helper to validate MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create new empty chat session
export const createChat = async (req, res) => {
  try {
    const chat = await Chat.create({
      userId: req.user.id,
      title: req.body.title || "New Chat",
      messages: [],
    });
    res.status(201).json(chat);
  } catch (error) {
    console.error("Create chat error:", error);
    res.status(500).json({ message: "Failed to create chat" });
  }
};

// Get all chats for logged in user
export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select("_id title createdAt updatedAt"); // _id explicit for frontend
    res.json(chats);
  } catch (error) {
    console.error("Get chats error:", error);
    res.status(500).json({ message: "Failed to fetch chats" });
  }
};

// Get single chat with all messages
export const getChatById = async (req, res) => {
  try {
    // Validate id before querying
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid chat ID" });
    }

    const chat = await Chat.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.json(chat);
  } catch (error) {
    console.error("Get chat error:", error);
    res.status(500).json({ message: "Failed to fetch chat" });
  }
};

// Delete a chat
export const deleteChat = async (req, res) => {
  try {
    // Validate id before querying
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid chat ID" });
    }

    const chat = await Chat.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Delete chat error:", error);
    res.status(500).json({ message: "Failed to delete chat" });
  }
};