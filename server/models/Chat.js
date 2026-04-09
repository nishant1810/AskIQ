import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true, // faster queries
  },
  title: {
    type: String,
    default: "New Chat", // first message becomes title
  },
  messages: [messageSchema], // grouped conversation
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    default: null, // null = general chat, set = RAG chat
  },
}, { timestamps: true });

export default mongoose.model("Chat", chatSchema);