import { pipeline } from "@xenova/transformers";

let embedder;

const getEmbedder = async () => {
  if (!embedder) {
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
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

    return Array.from(output.data);

  } catch (err) {
    console.error("Embedding error:", err.message);
    throw err;
  }
};