import multer from "multer";
import fs from "fs";
import path from "path";
import pkg from "pdfjs-dist/legacy/build/pdf.js";

const { getDocument, GlobalWorkerOptions } = pkg;
GlobalWorkerOptions.workerSrc = "";

import { chunkText } from "../services/chunkService.js";
import { generateEmbedding } from "../services/embeddingService.js";
import { upsertVector, queryVector, deleteVectors } from "../services/vectorService.js"; // ✅ single import
import { generateAnswer } from "../services/llmService.js";
import Chat from "../models/Chat.js";
import Document from "../models/Document.js";

// ================= MULTER CONFIG =================
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and TXT files are allowed"));
    }
  },
});

export const uploadMiddleware = upload.single("file");

// ================= PDF TEXT EXTRACTION =================
async function extractTextFromPDF(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = getDocument({
    data,
    standardFontDataUrl: null,
    disableFontFace: true,
  });
  const pdf = await loadingTask.promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return text;
}

// ================= UPLOAD DOCUMENT =================
export const uploadDocument = async (req, res) => {
  let filePath = req.file?.path;
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    filePath = req.file.path;

    const doc = await Document.create({
      userId: req.user.id,
      fileName: req.file.originalname,
      fileType: path.extname(req.file.originalname).replace(".", ""),
      fileSize: req.file.size,
      status: "processing",
      pineconeNamespace: `user-${req.user.id}`,
    });

    const extractedText =
      doc.fileType === "pdf"
        ? await extractTextFromPDF(filePath)
        : fs.readFileSync(filePath, "utf-8");

    if (!extractedText.trim()) {
      await Document.findByIdAndUpdate(doc._id, { status: "failed" });
      return res.status(400).json({ message: "Could not extract text from file" });
    }

    const chunks = chunkText(extractedText, 1000, 200);
    const namespace = `user-${req.user.id}`;

    console.log(`Processing ${chunks.length} chunks for: ${doc.fileName}`);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      await upsertVector(
        `${doc._id}-chunk-${i}`,
        embedding,
        {
          text: chunks[i],
          userId: req.user.id,
          docId: doc._id.toString(),
        },
        namespace
      );
      console.log(`✅ Chunk ${i + 1}/${chunks.length} processed`);
    }

    await Document.findByIdAndUpdate(doc._id, {
      status: "ready",
      chunkCount: chunks.length,
    });

    fs.unlinkSync(filePath);
    console.log(`🎉 Document indexed: ${doc.fileName} (${chunks.length} chunks)`);

    res.json({
      message: "Document indexed successfully",
      document: {
        id: doc._id,
        fileName: doc.fileName,
        chunkCount: chunks.length,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

// ================= DELETE DOCUMENT =================
export const deleteDocument = async (req, res) => {
  try {
    console.log("Deleting document ID:", req.params.id);

    const doc = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // ✅ Delete vectors from Pinecone
    try {
      await deleteVectors(doc._id.toString(), `user-${req.user.id}`);
    } catch (err) {
      console.error("Pinecone delete error:", err.message);
    }

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ message: "Failed to delete document" });
  }
};

// ================= ASK QUESTION =================
export const askQuestion = async (req, res) => {
  try {
    const { question, chatId } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    const namespace = `user-${req.user.id}`;
    const questionEmbedding = await generateEmbedding(question);
    const matches = await queryVector(questionEmbedding, namespace, req.user.id);
    const context = matches?.map((m) => m.metadata.text).join("\n") || "";

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId: req.user.id });
    }
    if (!chat) {
      chat = await Chat.create({
        userId: req.user.id,
        title: question.slice(0, 50),
        messages: [],
      });
    }

    const recentMessages = chat.messages.slice(-5);
    const memoryText = recentMessages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const finalPrompt = `
Context from documents:
${context || "No document context available."}

Previous conversation:
${memoryText || "No previous conversation."}

User question: ${question}
`;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Chat-Id", chat._id.toString());

    const fullAnswer = await generateAnswerStream(finalPrompt, (chunk) => {
      res.write(chunk);
    });

    chat.messages.push({ role: "user", content: question });
    chat.messages.push({ role: "assistant", content: fullAnswer });
    await chat.save();

    res.end();
  } catch (error) {
    console.error("Ask error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate answer", error: error.message });
    } else {
      res.end();
    }
  }
};

// ================= GET DOCUMENTS =================
export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch documents" });
  }
};