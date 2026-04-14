import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateEmbedding = async (text) => {
  try {
    if (!text || typeof text !== "string") {
      throw new Error("Invalid text input");
    }

    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    });

    return res.data[0].embedding;

  } catch (error) {
    console.error("EMBEDDING ERROR:", error.message);
    throw error;
  }
};