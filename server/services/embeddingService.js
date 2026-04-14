import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateEmbedding = async (text) => {
  try {
    // ✅ Validate input
    if (!text || typeof text !== "string") {
      throw new Error("Invalid text input for embedding");
    }

    const cleanText = text.trim();

    if (!cleanText) {
      throw new Error("Empty text after trimming");
    }

    // ✅ Limit size (important for API)
    const inputText = cleanText.slice(0, 8000);

    // ✅ Call OpenAI embeddings API
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: inputText,
    });

    const embedding = response?.data?.[0]?.embedding;

    // ✅ Validate response
    if (!embedding || embedding.length === 0) {
      throw new Error("Empty embedding received from OpenAI");
    }

    return embedding;

  } catch (error) {
    console.error("❌ EMBEDDING ERROR:", error.message);

    // Optional: log full error for debugging
    // console.error(error);

    throw error;
  }
};