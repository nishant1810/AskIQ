import API from "./api";

export const uploadDocument = (formData) =>
  API.post("/rag/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const askQuestion = (question, chatId) =>
  API.post("/rag/ask", { question, chatId });

export const getDocuments = () => API.get("/api/rag/documents");