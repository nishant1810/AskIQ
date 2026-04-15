import { pipeline } from "@xenova/transformers";

let embedder = null;

const getEmbedder = async () => {
  if (!embedder) {
    console.log("⏳ Loading embedding model...");
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("✅ Embedding model ready");
  }
  return embedder;
};

export const generateEmbedding = async (text) => {
  try {
    const extractor = await getEmbedder();

    const output = await extractor(text.slice(0, 1000), {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(output.data); // 384 dim

  } catch (err) {
    console.error("❌ EMBEDDING ERROR:", err.message);
    throw err;
  }
};