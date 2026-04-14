import multer from "multer";
import fs from "fs";
import path from "path";
import pkg from "pdfjs-dist/legacy/build/pdf.js";

const { getDocument, GlobalWorkerOptions } = pkg;
GlobalWorkerOptions.workerSrc = "";

import { chunkText } from "../services/chunkService.js";
import { generateEmbedding } from "../services/embeddingService.js";
import { upsertVector, queryVector, deleteVectors } from "../services/vectorService.js";
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

    const doc = await Document.create({
      userId: req.user.id,
      fileName: req.file.originalname,
      status: "processing",
      pineconeNamespace: `user-${req.user.id}`,
    });

    const text =
      req.file.originalname.endsWith(".pdf")
        ? await extractTextFromPDF(filePath)
        : fs.readFileSync(filePath, "utf-8");

    const chunks = chunkText(text, 1000, 200);
    const namespace = `user-${req.user.id}`;

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);

      await upsertVector(
        `${doc._id}-${i}`,
        embedding,
        {
          text: chunks[i],
          userId: req.user.id,
        },
        namespace
      );
    }

    await Document.findByIdAndUpdate(doc._id, {
      status: "ready",
      chunkCount: chunks.length,
    });

    fs.unlinkSync(filePath);

    res.json({ message: "Upload successful" });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

// ================= ASK =================
export const askQuestion = async (req, res) => {
  try {
    const { question, chatId } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question required" });
    }

    const namespace = `user-${req.user.id}`;

    // ✅ Embedding
    const questionEmbedding = await generateEmbedding(question);

    // ✅ Vector search
    const matches = await queryVector(questionEmbedding, namespace);

    const context = matches
      ?.map((m) => m.metadata.text)
      .join("\n") || "No context";

    // ✅ Chat
    let chat = chatId
      ? await Chat.findById(chatId)
      : await Chat.create({
          userId: req.user.id,
          title: question.slice(0, 50),
          messages: [],
        });

    const prompt = `
Context:
${context}

Question:
${question}
`;

    // ✅ LLM
    const answer = await generateAnswer(prompt);

    chat.messages.push({ role: "user", content: question });
    chat.messages.push({ role: "assistant", content: answer });

    await chat.save();

    res.json({
      answer,
      chatId: chat._id,
    });

  } catch (error) {
    console.error("ASK ERROR:", error);

    res.status(500).json({
      message: "Failed to generate answer",
      error: error.message,
    });
  }
};

// ================= GET DOCS =================
export const getDocuments = async (req, res) => {
  const docs = await Document.find({ userId: req.user.id });
  res.json(docs);
};

// ================= DELETE =================
export const deleteDocument = async (req, res) => {
  const doc = await Document.findByIdAndDelete(req.params.id);

  if (doc) {
    await deleteVectors(doc._id.toString(), `user-${req.user.id}`);
  }

  res.json({ message: "Deleted" });
};