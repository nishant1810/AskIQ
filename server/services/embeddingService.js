import { pipeline } from "@xenova/transformers";

let embedder = null;

const getEmbedder = async () => {
  if (!embedder) {
    console.log("⏳ Loading embedding model...");
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("✅ Embedding model ready!");
  }
  return embedder;
};

export const generateEmbedding = async (text) => {
  try {
    if (!text || typeof text !== "string") {
      throw new Error("Invalid text input");
    }

    const trimmed = text.slice(0, 8000);
    const extractor = await getEmbedder();

    const output = await extractor(trimmed, {
      pooling: "mean",
      normalize: true,
    });

    // ✅ Convert to plain array
    const result = Array.from(output.data);

    // ✅ Validate output
    if (!result || result.length === 0) {
      throw new Error("Empty embedding returned from model");
    }

    console.log(`🔢 Embedding generated: ${result.length} dimensions`);

    return result;

  } catch (error) {
    console.error("Embedding error:", error.message);
    throw error;
  }
};