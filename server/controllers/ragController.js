import multer from "multer";
import fs from "fs";
import pkg from "pdfjs-dist/legacy/build/pdf.js";

const { getDocument, GlobalWorkerOptions } = pkg;
GlobalWorkerOptions.workerSrc = "";

import { chunkText } from "../services/chunkService.js";
import { generateEmbedding } from "../services/embeddingService.js";
import {
  upsertVector,
  queryVector,
  deleteVectors,
} from "../services/vectorService.js";
import { generateAnswer } from "../services/llmService.js";
import Chat from "../models/Chat.js";
import Document from "../models/Document.js";

// ================= MULTER =================
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadMiddleware = upload.single("file");

// ================= PDF TEXT =================
async function extractTextFromPDF(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await getDocument({ data }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }

  return text;
}

// ================= UPLOAD =================
export const uploadDocument = async (req, res) => {
  const filePath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const namespace = `user-${req.user.id}`;

    const doc = await Document.create({
      userId: req.user.id,
      fileName: req.file.originalname,
      status: "processing",
      pineconeNamespace: namespace,
    });

    // ✅ Extract text
    const text =
      req.file.originalname.endsWith(".pdf")
        ? await extractTextFromPDF(filePath)
        : fs.readFileSync(filePath, "utf-8");

    if (!text || !text.trim()) {
      throw new Error("Empty document content");
    }

    // ✅ Chunk
    const chunks = chunkText(text, 1000, 200);
    console.log("📄 Total chunks:", chunks.length);

    // ✅ Embed + Store
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);

      console.log(`🔢 Embedding ${i} size:`, embedding.length);

      await upsertVector(
        `${doc._id}-${i}`,
        embedding,
        {
          text: chunks[i],
          userId: req.user.id,
          docId: doc._id.toString(),
        },
        namespace
      );
    }

    // ✅ Update doc
    await Document.findByIdAndUpdate(doc._id, {
      status: "ready",
      chunkCount: chunks.length,
    });

    // ✅ Delete temp file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "Upload successful" });

  } catch (err) {
    console.error("❌ UPLOAD ERROR:", err.message);

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(500).json({
      message: "Upload failed",
      error: err.message,
    });
  }
};

// ================= ASK =================
export const askQuestion = async (req, res) => {
  try {
    const { question, chatId } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ message: "Question required" });
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const namespace = `user-${req.user.id}`;

    // ✅ 1. Generate embedding
    const questionEmbedding = await generateEmbedding(question);

    // ✅ 2. Query Pinecone
    const matches = await queryVector(questionEmbedding, namespace);

    console.log("🔍 Matches found:", matches.length);

    // ✅ 3. Build context
    const context =
      matches?.map((m) => m.metadata?.text || "").join("\n") ||
      "No relevant context found.";

    // ✅ 4. Chat handling
    let chat = null;

    if (chatId) {
      chat = await Chat.findOne({
        _id: chatId,
        userId: req.user.id,
      });
    }

    if (!chat) {
      chat = await Chat.create({
        userId: req.user.id,
        title: question.slice(0, 50),
        messages: [],
      });
    }

    // ✅ 5. Strong RAG prompt (IMPORTANT)
    const prompt = `
You MUST answer using ONLY the context below.

Context:
${context}

Question:
${question}

Rules:
- Do NOT make up answers
- If answer not found, say:
  "I could not find this in the document."
`;

    // ✅ 6. LLM (Groq)
    const answer = await generateAnswer(prompt);

    // ✅ 7. Save chat
    chat.messages.push({ role: "user", content: question });
    chat.messages.push({ role: "assistant", content: answer });

    await chat.save();

    res.json({
      answer,
      chatId: chat._id,
    });

  } catch (error) {
    console.error("❌ ASK ERROR:", error.message);

    res.status(500).json({
      message: "Failed to generate answer",
      error: error.message,
    });
  }
};

// ================= GET DOCS =================
export const getDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user.id });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch documents" });
  }
};

// ================= DELETE =================
export const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    await deleteVectors(doc._id.toString(), `user-${req.user.id}`);

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.error("❌ DELETE ERROR:", err.message);
    res.status(500).json({ message: "Delete failed" });
  }
};