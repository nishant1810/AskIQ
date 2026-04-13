import "./config/env.js";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import ragRoutes from "./routes/ragRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

// Connect Database
// Connect Database
connectDB();

const app = express();

// ✅ Debug: Check CLIENT_URL
console.log("CLIENT_URL:", process.env.CLIENT_URL);
const allowedOrigins = [
  "http://localhost:5173", // local dev (Vite)
  "https://ask-iq.vercel.app" // your deployed frontend
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS not allowed: " + origin));
  },
  credentials: true,
}));

// app.use(cors({
//   origin: "https://ask-iq.vercel.app",
//   credentials: true
// }));

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rag", ragRoutes);
app.use("/api/chat", chatRoutes);

// ✅ Health check route (VERY USEFUL)
app.get("/", (req, res) => {
  res.send("API is running successfully 🚀");
});

// ✅ Test route for embedding models (your existing code)
app.get("/test-models", async (req, res) => {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const modelsToTry = [
      "embedding-001",
      "models/embedding-001",
      "text-embedding-004",
      "models/text-embedding-004",
      "gemini-embedding-exp-03-07",
      "models/gemini-embedding-exp-03-07"
    ];

    const results = {};

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.embedContent("test");
        results[modelName] =
          "✅ WORKS - dimensions: " + result.embedding.values.length;
      } catch (e) {
        results[modelName] =
          "❌ " + e.message.slice(0, 80);
      }
    }

    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("ERROR:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ✅ Start server (Render compatible)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});